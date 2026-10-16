/* Where records are kept. One DynamoDB table: the partition is the person (their Cognito id, which comes from the signed
   token, never from the request), the sort key is the record id. Each record keeps two times: u, when the person changed it
   (from their device, which decides which change wins), and s, when the server saved it. A local index on s answers "what
   changed since", so a device whose clock is off never misses a change. MemoryStore does the same in memory, for the tests. */
import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

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

export interface Store {
  /** records saved after `since` (server time), oldest first */
  changedSince(user: string, since: number, limit: number, cursor: string | null): Promise<Page>;
  /** saves the record only if it is newer than the one kept. Returns false when the kept one is the same age or newer. */
  putIfNewer(user: string, r: StoredRecord): Promise<boolean>;
  /** removes everything this person has */
  eraseAll(user: string): Promise<number>;
}

const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
const dec = (s: string) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));

export class DynamoStore implements Store {
  private db: DynamoDBDocumentClient;
  constructor(
    private table: string,
    client = new DynamoDBClient({}),
  ) {
    this.db = DynamoDBDocumentClient.from(client);
  }

  async changedSince(user: string, since: number, limit: number, cursor: string | null): Promise<Page> {
    const r = await this.db.send(
      new QueryCommand({
        TableName: this.table,
        IndexName: 'by_s',
        KeyConditionExpression: 'pk = :p AND s > :s',
        ExpressionAttributeValues: { ':p': user, ':s': since },
        ScanIndexForward: true,
        Limit: limit,
        ExclusiveStartKey: cursor ? dec(cursor) : undefined,
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

  async eraseAll(user: string): Promise<number> {
    let n = 0;
    let start: Record<string, unknown> | undefined;
    do {
      const q = await this.db.send(
        new QueryCommand({
          TableName: this.table,
          KeyConditionExpression: 'pk = :p',
          ExpressionAttributeValues: { ':p': user },
          ProjectionExpression: 'pk, sk',
          ExclusiveStartKey: start,
        }),
      );
      const keys = (q.Items || []).map((i) => ({ pk: i.pk, sk: i.sk }));
      for (let i = 0; i < keys.length; i += 25) {
        let batch: Record<string, unknown>[] | undefined = keys.slice(i, i + 25).map((Key) => ({ DeleteRequest: { Key } }));
        for (let tries = 0; batch && batch.length && tries < 5; tries++) {
          const w = await this.db.send(new BatchWriteCommand({ RequestItems: { [this.table]: batch } }));
          batch = w.UnprocessedItems?.[this.table] as Record<string, unknown>[] | undefined;
          if (batch?.length) await new Promise((r) => setTimeout(r, 100 * 2 ** tries));
        }
        if (batch?.length) throw new Error('Could not erase everything. Try again.');
      }
      n += keys.length;
      start = q.LastEvaluatedKey;
    } while (start);
    return n;
  }
}

export class MemoryStore implements Store {
  rows = new Map<string, Map<string, StoredRecord>>();

  private of(user: string) {
    let m = this.rows.get(user);
    if (!m) this.rows.set(user, (m = new Map()));
    return m;
  }

  async changedSince(user: string, since: number, limit: number, cursor: string | null): Promise<Page> {
    const all = [...this.of(user).values()].filter((r) => r.s > since).sort((a, b) => a.s - b.s || (a.id < b.id ? -1 : 1));
    const from = cursor ? Number(dec(cursor)) : 0;
    const items = all.slice(from, from + limit);
    return { items, cursor: from + limit < all.length ? enc(from + limit) : null };
  }

  async putIfNewer(user: string, r: StoredRecord): Promise<boolean> {
    const m = this.of(user);
    const cur = m.get(r.id);
    if (cur && cur.u >= r.u) return false;
    m.set(r.id, { ...r });
    return true;
  }

  async eraseAll(user: string): Promise<number> {
    const n = this.of(user).size;
    this.rows.delete(user);
    return n;
  }
}
