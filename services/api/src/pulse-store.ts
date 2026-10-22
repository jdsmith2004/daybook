/* Where the pulse totals and feedback are kept: the daybook-pulse table (infra/app/pulse.tf).
   pk "c": totals, sk "<day>#<platform>" or "<day>#v#<version>", one number attribute per count name (the names are
   checked against core PULSE_KEYS before they get here, and go in as expression names, never as text in an expression).
   pk "f": feedback, sk "<ms>#<random>", with a ttl. pk "#cap": the day's ceilings, with a ttl. */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { randomBytes } from 'node:crypto';

import type { Feedback, PulseStore, Totals } from './pulse';

const NAME = /^[a-z0-9_]{1,40}$/;

export class DynamoPulseStore implements PulseStore {
  private db: DynamoDBDocumentClient;
  constructor(
    private table: string,
    client = new DynamoDBClient({}),
  ) {
    this.db = DynamoDBDocumentClient.from(client);
  }

  async allow(what: 'batch' | 'feedback', day: string, max: number) {
    try {
      await this.db.send(
        new UpdateCommand({
          TableName: this.table,
          Key: { pk: '#cap', sk: what + '#' + day },
          UpdateExpression: 'ADD n :one SET #ttl = :ttl',
          ConditionExpression: 'attribute_not_exists(n) OR n < :max',
          ExpressionAttributeNames: { '#ttl': 'ttl' },
          ExpressionAttributeValues: { ':one': 1, ':max': max, ':ttl': Math.floor(Date.now() / 1000) + 3 * 86400 },
        }),
      );
      return true;
    } catch (e) {
      if (e instanceof ConditionalCheckFailedException) return false;
      throw e;
    }
  }

  private async bump(sk: string, c: Record<string, number>) {
    const names: Record<string, string> = {};
    const values: Record<string, number> = {};
    const parts: string[] = [];
    Object.entries(c).forEach(([k, n], i) => {
      if (!NAME.test(k)) return;
      names['#a' + i] = k;
      values[':a' + i] = n;
      parts.push('#a' + i + ' :a' + i);
    });
    if (!parts.length) return;
    await this.db.send(
      new UpdateCommand({
        TableName: this.table,
        Key: { pk: 'c', sk },
        UpdateExpression: 'ADD ' + parts.join(', '),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }),
    );
  }

  async add(day: string, p: string, v: string, c: Record<string, number>) {
    await this.bump(day + '#' + p, { ...c, batches: 1 });
    await this.bump(day + '#v#' + v.replace(/[^0-9A-Za-z.+-]/g, ''), { batches: 1 });
  }

  async keepFeedback(f: Feedback, ttl: number) {
    await this.db.send(
      new PutCommand({
        TableName: this.table,
        Item: { pk: 'f', sk: f.at + '#' + randomBytes(4).toString('hex'), ...f, ttl: Math.floor(ttl / 1000) },
      }),
    );
  }

  async totals(from: string, to: string): Promise<Totals[]> {
    const out: Totals[] = [];
    let start: Record<string, unknown> | undefined;
    do {
      const r = await this.db.send(
        new QueryCommand({
          TableName: this.table,
          KeyConditionExpression: 'pk = :c AND sk BETWEEN :a AND :b',
          ExpressionAttributeValues: { ':c': 'c', ':a': from, ':b': to + '~' },
          ExclusiveStartKey: start,
        }),
      );
      for (const it of r.Items || []) {
        const { pk: _pk, sk, ...n } = it as Record<string, unknown>;
        out.push({ k: String(sk), n: n as Record<string, number> });
      }
      start = r.LastEvaluatedKey;
    } while (start);
    return out;
  }

  async feedback(limit: number): Promise<Feedback[]> {
    const r = await this.db.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: 'pk = :f',
        ExpressionAttributeValues: { ':f': 'f' },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return (r.Items || []).map((it) => ({ at: Number(it.at), t: String(it.t), r: it.r ? String(it.r) : null, p: String(it.p), v: String(it.v) }));
  }
}
