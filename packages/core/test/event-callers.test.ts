/* Every event on the list is sent by the app (the owner, November 17, 2026: the Stats report found events that never fired, so
   the report could not tell "nobody did it" from "nothing counts it"). This fails when a name in EV_NAMES has no caller in
   apps/mobile/src: track('name', ...) directly, or one of lib/events.ts's own helpers that sends it. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

import { EV_NAMES } from '../src/events';

const src = join(dirname(fileURLToPath(import.meta.url)), '../../../apps/mobile/src');
let all = '';
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx?$/.test(f)) all += '\n' + readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  }
};
walk(src);
const called = (fn: string) => new RegExp('(?<!function )\\b' + fn + '\\(').test(all.replace(/export (async )?function \w+/g, ''));
/* the helpers in lib/events.ts, and what each sends */
const HELPERS: Record<string, string[]> = {
  useKeepEvents: ['open', 'leave'],
  useTrackScreens: ['screen', 'screen_left'],
  trackSos: ['sos_tool', 'sos_end', 'urge', 'slip'],
  trackSlip: ['slip'],
  trackNudge: ['nudge_tap', 'nudge_did'],
  notesCame: ['nudge'],
  trackAb: ['ab'],
};

it('every listed event has a caller in the app', () => {
  const via = new Set(
    Object.entries(HELPERS)
      .filter(([fn]) => called(fn))
      .flatMap(([, ns]) => ns),
  );
  const none = Object.keys(EV_NAMES).filter((n) => !via.has(n) && !new RegExp("track\\(\\s*'" + n + "'").test(all));
  expect(none).toEqual([]);
});
