/* Where records are kept. One DynamoDB table: the partition is the person (their Cognito id, which comes from the signed
   token, never from the request), the sort key is the record id. Each record keeps two times: u, when the person changed it
   (from their device, which decides which change wins), and s, when the server saved it. A local index on s answers "what
   changed since", so a device whose clock is off never misses a change. Items whose sort key starts with # are the server's
   own bookkeeping (the daily write allowance); they have no s, so they never show up in a pull.
   MemoryStore does the same in memory, for the tests. */
import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export interface StoredRecord {
  id: string;
  u: number;
  /** when the server saved it */
  s: number;
  /** the record as JSON, or null when it was deleted */
  d: string | null;
}

export interface Page {
  items: StoredRecord[];
  cursor: string | null;
}

/** a cursor that did not come from this service */
export class BadCursor extends Error {}

export interface Store {
  /** records saved after `since` (server time), oldest first */
  changedSince(user: string, since: number, limit: number, cursor: string | null): Promise<Page>;
  /** saves the record only if it is newer than the one kept. Returns false when the kept one is the same age or newer. */
  putIfNewer(user: string, r: StoredRecord): Promise<boolean>;
  /** adds to today's write allowance; false when it would go over `max` bytes */
  useAllowance(user: string, day: string, bytes: number, max: number): Promise<boolean>;
  /** every record becomes a deletion (so other devices remove it too), or with `all`, everything is removed for good */
  erase(user: string, now: number, all: boolean): Promise<number>;
}

const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
function dec(s: string): unknown {
  try {
    return JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
  } catch {
    throw new BadCursor('bad cursor');
  }
}
const isOwn = (sk: string) => sk.startsWith('#');

export class DynamoStore implements Store {
  private db: DynamoDBDocumentClient;
  constructor(
    private table: string,
    client = new DynamoDBClient({}),
  ) {
    this.db = DynamoDBDocumentClient.from(client);
  }

  async changedSince(user: string, since: number, limit: number, cursor: string | null): Promise<Page> {
    let start: Record<string, unknown> | undefined;
    if (cursor) {
      const k = dec(cursor) as Record<string, unknown>;
      /* a cursor only ever points into the asker's own partition */
      if (!k || typeof k !== 'object' || k.pk !== user || typeof k.sk !== 'string' || typeof k.s !== 'number') throw new BadCursor('bad cursor');
      start = { pk: user, sk: k.sk, s: k.s };
    }
    const r = await this.db.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: 'by_s',
        KeyConditionExpression: 'pk = :p AND s > :s',
        ExpressionAttributeValues: { ':p': user, ':s': since },
        ScanIndexForward: true,
        Limit: limit,
        ExclusiveStartKey: start,
      }),
    );
    return {
      items: (r.Items || []).map((i) => ({ id: i.sk as string, u: i.u as number, s: i.s as number, d: (i.d as string | undefined) ?? null })),
      cursor: r.LastEvaluatedKey ? enc(r.LastEvaluatedKey) : null,
    };
  }

  async putIfNewer(user: string, r: StoredRecord): Promise<boolean> {
    try {
      await this.db.send(
        new PutCommand({
          TableName: this.table,
          Item: r.d == null ? { pk: user, sk: r.id, u: r.u, s: r.s, del: true } : { pk: user, sk: r.id, u: r.u, s: r.s, d: r.d },
          ConditionExpression: 'attribute_not_exists(pk) OR u < :u',
          ExpressionAttributeValues: { ':u': r.u },
        }),
      );
      return true;
    } catch (e) {
      if (e instanceof ConditionalCheckFailedException) return false;
      throw e;
    }
  }

  async useAllowance(user: string, day: string, bytes: number, max: number): Promise<boolean> {
    try {
      await this.db.send(
        new UpdateCommand({
          TableName: this.table,
          Key: { pk: user, sk: '#allowance/' + day },
          UpdateExpression: 'ADD b :b SET #t = :t',
          ConditionExpression: 'attribute_not_exists(b) OR b <= :room',
          ExpressionAttributeNames: { '#t': 'ttl' },
          /* the allowance record removes itself two days later (the table's time-to-live) */
          ExpressionAttributeValues: { ':b': bytes, ':room': max - bytes, ':t': Math.floor(Date.parse(day + 'T00:00:00Z') / 1000) + 2 * 86400 },
        }),
      );
      return true;
    } catch (e) {
      if (e instanceof ConditionalCheckFailedException) return false;
      throw e;
    }
  }

  private async all(user: string, fn: (items: { sk: string; u: number }[]) => Promise<void>) {
    let start: Record<string, unknown> | undefined;
    do {
      const q = await this.db.send(
        new QueryCommand({
          TableName: this.table,
          KeyConditionExpression: 'pk = :p',
          ExpressionAttributeValues: { ':p': user },
          ProjectionExpression: 'sk, u',
          ExclusiveStartKey: start,
        }),
      );
      await fn((q.Items || []).map((i) => ({ sk: i.sk as string, u: (i.u as number) || 0 })));
      start = q.LastEvaluatedKey;
    } while (start);
  }

  private async batch(requests: Record<string, unknown>[]) {
    for (let i = 0; i < requests.length; i += 25) {
      let part: Record<string, unknown>[] | undefined = requests.slice(i, i + 25);
      for (let tries = 0; part && part.length && tries < 6; tries++) {
        if (tries) await new Promise((r) => setTimeout(r, 100 * 2 ** tries));
        const w = await this.db.send(new BatchWriteCommand({ RequestItems: { [this.table]: part } }));
        part = w.UnprocessedItems?.[this.table] as Record<string, unknown>[] | undefined;
      }
      if (part?.length) throw new Error('Could not finish. Try again.');
    }
  }

  async erase(user: string, now: number, all: boolean): Promise<number> {
    let n = 0;
    await this.all(user, async (items) => {
      const reqs = items
        .filter((i) => all || !isOwn(i.sk))
        .map((i) =>
          all
            ? { DeleteRequest: { Key: { pk: user, sk: i.sk } } }
            : { PutRequest: { Item: { pk: user, sk: i.sk, u: Math.max(now, i.u + 1), s: now, del: true } } },
        );
      await this.batch(reqs);
      n += reqs.length;
    });
    return n;
  }
}

export class MemoryStore implements Store {
  rows = new Map<string, Map<string, StoredRecord>>();
  usage = new Map<string, number>();

  private of(user: string) {
    let m = this.rows.get(user);
    if (!m) this.rows.set(user, (m = new Map()));
    return m;
  }

  async changedSince(user: string, since: number, limit: number, cursor: string | null): Promise<Page> {
    const all = [...this.of(user).values()].filter((r) => r.s > since).sort((a, b) => a.s - b.s || (a.id < b.id ? -1 : 1));
    let from = 0;
    if (cursor) {
      const c = dec(cursor) as { u?: string; i?: number };
      if (!c || c.u !== user || !Number.isInteger(c.i)) throw new BadCursor('bad cursor');
      from = c.i as number;
    }
    const items = all.slice(from, from + limit);
    return { items, cursor: from + limit < all.length ? enc({ u: user, i: from + limit }) : null };
  }

  async putIfNewer(user: string, r: StoredRecord): Promise<boolean> {
    const m = this.of(user);
    const cur = m.get(r.id);
    if (cur && cur.u >= r.u) return false;
    m.set(r.id, { ...r });
    return true;
  }

  async useAllowance(user: string, day: string, bytes: number, max: number): Promise<boolean> {
    const k = user + '/' + day;
    const b = this.usage.get(k) || 0;
    if (b + bytes > max) return false;
    this.usage.set(k, b + bytes);
    return true;
  }

  async erase(user: string, now: number, all: boolean): Promise<number> {
    const m = this.of(user);
    const n = m.size;
    if (all) this.rows.delete(user);
    else for (const [id, r] of m) m.set(id, { id, u: Math.max(now, r.u + 1), s: now, d: null });
    return n;
  }
}
