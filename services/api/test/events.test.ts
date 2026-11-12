/* The events API: only checked events become lines, nothing about who or where is kept, and the ceiling holds. */
import { describe, expect, it } from 'vitest';

import { DAILY_EVENT_BATCHES, makeEventsHandler } from '../src/events';
import { EV_BODY } from '@daybook/core';

const NOW = Date.parse('2026-11-09T15:00:00Z');
const HEX = '0123456789abcdef0123456789abcdef';
const post = (body: unknown, method = 'POST') =>
  ({
    rawPath: '/events',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    isBase64Encoded: false,
    headers: { 'x-forwarded-for': '203.0.113.9', 'user-agent': 'Daybook/1.4 iPhone15,2' },
    requestContext: { http: { method, path: '/events', sourceIp: '203.0.113.9', userAgent: 'Daybook/1.4 iPhone15,2' } },
  }) as never;
const make = (max = DAILY_EVENT_BATCHES) => {
  const lines: string[] = [];
  let n = 0;
  const h = makeEventsHandler(
    async (l) => void lines.push(l),
    async (_d, m) => ++n <= Math.min(m, max),
    () => NOW,
  );
  return { h, lines };
};
const batch = {
  i: HEX,
  p: 'ios',
  v: '1.4.0',
  e: [
    { k: 4, n: 'urge', d: 3, h: 22, p: { str: 8, trigger: 'lonely', note: 'my words' } },
    { k: 5, n: 'open', d: 3, h: 22 },
  ],
};

describe('events', () => {
  it('takes the word test, the comeback, and a slip after a reminder (November 12, 2026), with only their listed values', async () => {
    const { h, lines } = make();
    const e = [
      { k: 1, n: 'ab', d: 9, h: 23, p: { test: 'rk_first', arm: 'b' } },
      { k: 2, n: 'ab', d: 9, h: 23, p: { test: 'made_up', arm: 'c' } },
      { k: 3, n: 'slip', d: 9, h: 23, p: { after: 'wind', nh: 22, note: 'my words' } },
      { k: 4, n: 'nudge', d: 9, h: 23, p: { kind: 'wind', nh: 22 } },
      { k: 5, n: 'comeback', d: 11, h: 8 },
    ];
    expect((await h(post({ ...batch, e }))).statusCode).toBe(200);
    const rows = lines
      .join('')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(rows.map((r) => [r.n, r.p])).toEqual([
      ['ab', '{"test":"rk_first","arm":"b"}'],
      ['ab', '{}'],
      ['slip', '{"after":"wind","nh":22}'],
      ['nudge', '{"kind":"wind","nh":22}'],
      ['comeback', '{}'],
    ]);
  });

  it('keeps one line for each checked event, and nothing about who or where', async () => {
    const { h, lines } = make();
    const r = await h(post(batch));
    expect(r.statusCode).toBe(200);
    const rows = lines
      .join('')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(rows).toEqual([
      { day: '2026-11-09', i: HEX, pf: 'ios', v: '1.4.0', k: 4, n: 'urge', d: 3, h: 22, p: '{"str":8,"trigger":"lonely"}' },
      { day: '2026-11-09', i: HEX, pf: 'ios', v: '1.4.0', k: 5, n: 'open', d: 3, h: 22, p: '{}' },
    ]);
    expect(lines.join('')).not.toMatch(/203\.0|iPhone15|my words/);
  });

  it('refuses what is not a batch, too large, or not a POST', async () => {
    const { h, lines } = make();
    expect((await h(post('{nope'))).statusCode).toBe(400);
    expect((await h(post({ ...batch, i: 'me@example.com' }))).statusCode).toBe(400);
    expect((await h(post({ ...batch, e: [{ k: 0, n: 'zzz', d: 0, h: 0 }] }))).statusCode).toBe(400);
    expect((await h(post('x'.repeat(EV_BODY + 1)))).statusCode).toBe(413);
    expect((await h(post(batch, 'GET'))).statusCode).toBe(405);
    expect(lines).toEqual([]);
  });

  it('says no past the daily ceiling', async () => {
    const { h, lines } = make(1);
    expect((await h(post(batch))).statusCode).toBe(200);
    expect((await h(post(batch))).statusCode).toBe(429);
    expect(lines.length).toBe(1);
  });

  it('once the day is full, turns the rest away without counting them', async () => {
    let calls = 0;
    const h = makeEventsHandler(
      async () => undefined,
      async () => (++calls, false),
      () => NOW,
    );
    for (let i = 0; i < 5; i++) expect((await h(post(batch))).statusCode).toBe(429);
    expect(calls).toBe(1);
  });
});
