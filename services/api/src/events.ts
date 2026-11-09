/* The events API: what Daybook learns (core events.ts). A function apart from sync and the pulse, with a role that can put
   events on one Firehose stream and count its own daily ceiling, and nothing else, so this open door (no sign-in) can never
   reach anyone's log.

   POST /events   { i, p, v, e: [{ n, d, h, p? }] }   one phone's events, by its install id

   Each event becomes one line on the stream (Firehose writes them, gzipped, to the daybook-events bucket by day; Athena reads
   them for the Stats workflow; they are deleted after 2 years). A line holds the day it arrived (UTC), the install id, the
   platform, the app's version and the event as the phone sent it, checked with the same rules as the app (core
   eventsClean). Never kept: an internet address, the request, any header. Nothing here is logged. The body is small, and a
   ceiling on batches a day keeps the bill bounded whatever anyone sends. */
import { EV_BODY, eventsClean } from '@daybook/core';
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

/** batches the server takes in a day, in all; past it, it says no until tomorrow (UTC) */
export const DAILY_EVENT_BATCHES = 50_000;

/** where the lines go (events-index.ts: the Firehose stream) */
export type Sink = (lines: string) => Promise<void>;
/** adds one to today's batches; false when it would pass max (the pulse table's ceilings) */
export type Cap = (day: string, max: number) => Promise<boolean>;

type Res = APIGatewayProxyStructuredResultV2;
const json = (statusCode: number, body: unknown): Res => ({
  statusCode,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

/** the lines for one batch: newline-separated JSON, one event each, props as a JSON string (Athena reads them with
    json_extract) */
export function eventLines(day: string, b: NonNullable<ReturnType<typeof eventsClean>>): string {
  return b.e.map((e) => JSON.stringify({ day, i: b.i, pf: b.p, v: b.v, n: e.n, d: e.d, h: e.h, p: JSON.stringify(e.p || {}) })).join('\n') + '\n';
}

export function makeEventsHandler(sink: Sink, cap: Cap, clock: () => number = Date.now) {
  return async function handler(event: APIGatewayProxyEventV2): Promise<Res> {
    if (event.requestContext.http.method !== 'POST') return json(405, { error: 'Use POST.' });
    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
    if (Buffer.byteLength(raw) > EV_BODY) return json(413, { error: 'Too large.' });
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { error: 'The body must be JSON.' });
    }
    const b = eventsClean(body);
    if (!b) return json(400, { error: 'Nothing to keep.' });
    const today = new Date(clock()).toISOString().slice(0, 10);
    if (!(await cap(today, DAILY_EVENT_BATCHES))) return json(429, { error: 'Try again tomorrow.' });
    await sink(eventLines(today, b));
    return json(200, { ok: true, n: b.e.length });
  };
}
