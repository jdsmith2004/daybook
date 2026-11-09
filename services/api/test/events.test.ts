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
    { n: 'urge', d: 3, h: 22, p: { str: 8, trigger: 'lonely', note: 'my words' } },
    { n: 'open', d: 3, h: 22 },
  ],
};

describe('events', () => {
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
      { day: '2026-11-09', i: HEX, pf: 'ios', v: '1.4.0', n: 'urge', d: 3, h: 22, p: '{"str":8,"trigger":"lonely"}' },
      { day: '2026-11-09', i: HEX, pf: 'ios', v: '1.4.0', n: 'open', d: 3, h: 22, p: '{}' },
    ]);
    expect(lines.join('')).not.toMatch(/203\.0|iPhone15|my words/);
  });

  it('refuses what is not a batch, too large, or not a POST', async () => {
    const { h, lines } = make();
    expect((await h(post('{nope'))).statusCode).toBe(400);
    expect((await h(post({ ...batch, i: 'me@example.com' }))).statusCode).toBe(400);
    expect((await h(post({ ...batch, e: [{ n: 'zzz', d: 0, h: 0 }] }))).statusCode).toBe(400);
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
});
