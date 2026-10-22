/* The pulse API: opt-in counts and anonymous feedback (core pulse.ts). A function apart from sync, with its own table and
   a role that can touch nothing else, so this open door (no sign-in) can never reach anyone's log.

   POST /pulse            { p, v, days: [{ d, c: { name: n } }] }   adds one device's counts to the totals of those days
   POST /pulse/feedback   { t, r?, p, v }                           keeps the words (and a reply address, if one is given)
   GET  /pulse?from=&to=                                            the totals and the feedback; signed in as the owner only

   Kept: totals per day and platform (pk "c", sk "<day>#<platform>", one number per count name, and how many batches
   added to it), and feedback (pk "f", kept FEEDBACK_KEEP). Never kept: who sent anything, an IP address, the request
   itself. Nothing here is logged. Every batch is checked with the same rules as the app (core pulseClean), the body is
   small, and a ceiling on writes a day keeps the bill bounded whatever anyone sends. */
import { feedbackClean, pulseClean, type PulseBatch } from '@daybook/core';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

/** the largest body, in bytes */
export const PULSE_BODY = 16_000;
/** batches and feedback the server takes in a day, in all; past it, it says no until tomorrow (UTC) */
export const DAILY_BATCHES = 20_000;
export const DAILY_FEEDBACK = 500;
/** how long feedback is kept */
export const FEEDBACK_KEEP = 180 * 24 * 3600_000;

export interface Totals {
  /** "<day>#<platform>" */
  k: string;
  n: Record<string, number>;
}
export interface Feedback {
  at: number;
  t: string;
  r: string | null;
  p: string;
  v: string;
}
export interface PulseStore {
  /** adds to today's count of `what`; false when it would pass `max` */
  allow(what: 'batch' | 'feedback', day: string, max: number): Promise<boolean>;
  /** adds counts to the totals of one day and platform, and one to its batches, and one to the version's batches */
  add(day: string, p: string, v: string, c: Record<string, number>): Promise<void>;
  keepFeedback(f: Feedback, ttl: number): Promise<void>;
  totals(from: string, to: string): Promise<Totals[]>;
  feedback(limit: number): Promise<Feedback[]>;
}

type Res = APIGatewayProxyStructuredResultV2;
const json = (statusCode: number, body: unknown): Res => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});
const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** the sign-in, when API Gateway checked one (GET only) */
type Event = APIGatewayProxyEventV2 & { requestContext: { authorizer?: { jwt?: { claims?: Record<string, unknown> } } } };

export function makePulseHandler(store: PulseStore, owner: string, clock: () => number = Date.now) {
  return async function handler(event: Event): Promise<Res> {
    const method = event.requestContext.http.method;
    const path = event.rawPath || event.requestContext.http.path || '';
    const now = clock();
    const today = utcDay(now);

    if (method === 'GET') {
      const sub = event.requestContext.authorizer?.jwt?.claims?.sub;
      if (typeof sub !== 'string' || !sub) return json(401, { error: 'Sign in first.' });
      /* anyone else gets only their own account id back, which is what the owner needs to set up (Stats shows it) */
      if (!owner || sub !== owner) return json(403, { error: 'Only the owner can see the counts.', you: sub });
      const q = event.queryStringParameters || {};
      const to = q.to && DAY.test(q.to) ? q.to : today;
      const from = q.from && DAY.test(q.from) ? q.from : utcDay(now - 30 * 86400_000);
      return json(200, { from, to, totals: await store.totals(from, to), feedback: await store.feedback(200) });
    }
    if (method !== 'POST') return json(405, { error: 'Use POST.' });

    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
    if (Buffer.byteLength(raw) > PULSE_BODY) return json(413, { error: 'Too large.' });
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { error: 'The body must be JSON.' });
    }

    if (path.endsWith('/feedback')) {
      const f = feedbackClean(body);
      if (!f) return json(400, { error: 'Write something first.' });
      if (!(await store.allow('feedback', today, DAILY_FEEDBACK))) return json(429, { error: 'Too much feedback today. Try again tomorrow.' });
      await store.keepFeedback({ at: now, ...f }, now + FEEDBACK_KEEP);
      return json(200, { ok: true });
    }

    const b: PulseBatch | null = pulseClean(body, today);
    if (!b) return json(400, { error: 'Nothing to count.' });
    if (!(await store.allow('batch', today, DAILY_BATCHES))) return json(429, { error: 'Try again tomorrow.' });
    for (const row of b.days) await store.add(row.d, b.p, b.v, row.c);
    return json(200, { ok: true, days: b.days.length });
  };
}

/* ---------- in memory, for the tests ---------- */
export class MemoryPulseStore implements PulseStore {
  caps = new Map<string, number>();
  rows = new Map<string, Record<string, number>>();
  kept: (Feedback & { ttl: number })[] = [];
  async allow(what: string, day: string, max: number) {
    const k = what + '#' + day;
    const n = (this.caps.get(k) || 0) + 1;
    if (n > max) return false;
    this.caps.set(k, n);
    return true;
  }
  async add(day: string, p: string, v: string, c: Record<string, number>) {
    const bump = (k: string, add: Record<string, number>) => {
      const row = { ...(this.rows.get(k) || {}) };
      for (const [n, x] of Object.entries(add)) row[n] = (row[n] || 0) + x;
      this.rows.set(k, row);
    };
    bump(day + '#' + p, { ...c, batches: 1 });
    bump(day + '#v#' + v, { batches: 1 });
  }
  async keepFeedback(f: Feedback, ttl: number) {
    this.kept.push({ ...f, ttl });
  }
  async totals(from: string, to: string) {
    return [...this.rows.entries()].filter(([k]) => k >= from && k <= to + '~').map(([k, n]) => ({ k, n }));
  }
  async feedback(limit: number) {
    return this.kept
      .slice()
      .sort((a, b) => b.at - a.at)
      .slice(0, limit)
      .map(({ ttl: _ttl, ...f }) => f);
  }
}
