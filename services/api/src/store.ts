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
  /** every record becomes a deletion (so other devices remove it too), and a copy of it is kept for KEEP_ERASED, so the
      person can bring it back; or with `all`, everything is removed for good */
  erase(user: string, now: number, all: boolean): Promise<number>;
  /** the copies kept from the last erase: how many, and when */
  erased(user: string, now: number): Promise<{ n: number; at: number | null }>;
  /** brings the kept copies back as new changes. A record logged again since the erase is left as it is. */
  restore(user: string, now: number): Promise<number>;
}

/** how long an erased log can be brought back */
export const KEEP_ERASED = 7 * 24 * 3600_000;
const ERASED = '#erased/';

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

  private async all(user: string, fn: (items: { sk: string; u: number; d?: string }[]) => Promise<void>, prefix?: string) {
    let start: Record<string, unknown> | undefined;
    do {
      const q = await this.db.send(
        new QueryCommand({
          TableName: this.table,
          KeyConditionExpression: prefix ? 'pk = :p AND begins_with(sk, :x)' : 'pk = :p',
          ExpressionAttributeValues: prefix ? { ':p': user, ':x': prefix } : { ':p': user },
          ProjectionExpression: 'sk, u, d',
          ExclusiveStartKey: start,
        }),
      );
      await fn((q.Items || []).map((i) => ({ sk: i.sk as string, u: (i.u as number) || 0, d: i.d as string | undefined })));
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
    const ttl = Math.floor((now + KEEP_ERASED) / 1000);
    await this.all(user, async (items) => {
      const reqs: Record<string, unknown>[] = [];
      for (const i of items) {
        if (all) {
          reqs.push({ DeleteRequest: { Key: { pk: user, sk: i.sk } } });
          n++;
          continue;
        }
        if (isOwn(i.sk)) continue;
        reqs.push({ PutRequest: { Item: { pk: user, sk: i.sk, u: Math.max(now, i.u + 1), s: now, del: true } } });
        /* a copy, for a week, in the server's own bookkeeping (never pulled), so a mistaken or stolen erase can be undone */
        if (i.d != null) reqs.push({ PutRequest: { Item: { pk: user, sk: ERASED + i.sk, u: i.u, d: i.d, at: now, ttl } } });
        n++;
      }
      await this.batch(reqs);
    });
    return n;
  }

  async erased(user: string, now: number): Promise<{ n: number; at: number | null }> {
    let n = 0;
    let at: number | null = null;
    let start: Record<string, unknown> | undefined;
    do {
      const q = await this.db.send(
        new QueryCommand({
          TableName: this.table,
          KeyConditionExpression: 'pk = :p AND begins_with(sk, :x)',
          ExpressionAttributeValues: { ':p': user, ':x': ERASED },
          ProjectionExpression: 'sk, #a, #t',
          ExpressionAttributeNames: { '#a': 'at', '#t': 'ttl' },
          ExclusiveStartKey: start,
        }),
      );
      for (const i of q.Items || []) {
        /* time-to-live removes items within a day or two of their time, not on the second: a copy past its week is not offered */
        if (typeof i.ttl === 'number' && i.ttl * 1000 < now) continue;
        n++;
        if (typeof i.at === 'number') at = Math.max(at || 0, i.at);
      }
      start = q.LastEvaluatedKey;
    } while (start);
    return { n, at };
  }

  async restore(user: string, now: number): Promise<number> {
    let n = 0;
    const copies: { sk: string; d: string }[] = [];
    await this.all(
      user,
      async (items) => {
        for (const i of items) if (i.d != null) copies.push({ sk: i.sk, d: i.d });
      },
      ERASED,
    );
    for (let k = 0; k < copies.length; k += 10) {
      await Promise.all(
        copies.slice(k, k + 10).map(async (c) => {
          const id = c.sk.slice(ERASED.length);
          try {
            /* only where the record is still the erase's deletion: a day logged again since stays as it is */
            await this.db.send(
              new PutCommand({
                TableName: this.table,
                Item: { pk: user, sk: id, u: now, s: now, d: c.d },
                ConditionExpression: 'attribute_not_exists(pk) OR attribute_exists(del)',
              }),
            );
            n++;
          } catch (e) {
            if (!(e instanceof ConditionalCheckFailedException)) throw e;
          }
        }),
      );
    }
    await this.batch(copies.map((c) => ({ DeleteRequest: { Key: { pk: user, sk: c.sk } } })));
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

  /** kept copies from an erase, by person: id -> the record and when it was erased */
  erasedCopies = new Map<string, Map<string, { r: StoredRecord; at: number }>>();

  async erase(user: string, now: number, all: boolean): Promise<number> {
    const m = this.of(user);
    const n = m.size;
    if (all) {
      this.rows.delete(user);
      this.erasedCopies.delete(user);
      return n;
    }
    let kept = this.erasedCopies.get(user);
    if (!kept) this.erasedCopies.set(user, (kept = new Map()));
    for (const [id, r] of m) {
      if (r.d != null) kept.set(id, { r: { ...r }, at: now });
      m.set(id, { id, u: Math.max(now, r.u + 1), s: now, d: null });
    }
    return n;
  }

  async erased(user: string, now: number): Promise<{ n: number; at: number | null }> {
    const kept = [...(this.erasedCopies.get(user)?.values() || [])].filter((x) => x.at + KEEP_ERASED > now);
    return { n: kept.length, at: kept.length ? kept[0].at : null };
  }

  async restore(user: string, now: number): Promise<number> {
    const kept = this.erasedCopies.get(user);
    if (!kept) return 0;
    const m = this.of(user);
    let n = 0;
    for (const [id, x] of kept) {
      const cur = m.get(id);
      if (cur && cur.d != null) continue;
      m.set(id, { id, u: now, s: now, d: x.r.d });
      n++;
    }
    this.erasedCopies.delete(user);
    return n;
  }

}
