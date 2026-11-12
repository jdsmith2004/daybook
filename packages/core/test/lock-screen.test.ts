/* Nothing on the lock screen gives the person away (docs/plan.md, "Becoming free", 3). Every word Daybook can put on a locked
   screen or a Home Screen (notifications, the flame widget, the Live Activity) is checked here: none names the habit, a slip,
   an urge, the words "clean" or "addict", or a count of days in a run. The flame's stakes ("5 days with nothing done") stay:
   they count days of drifting, not days without the habit, and they were left as built by the owner's choice. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const st = core.normSettings({ ...core.defaultSettings('2026-09-01'), screensOff: '22:30' });
const ctx: core.NudgeCtx = { run: 40, lvl: 6, form: { pts: 20, name: 'a Campfire' }, proof: { rode: 4, lessons: 9, ci: 7 } };

/** the habit, the slip, the urge, the labels, and a count of days in a run ("Day 12", "40 days of showing up") */
const BANNED =
  /porn|alcohol|drink|gambl|\bbet\b|casino|sex|slip|relaps|urge|crav|clean|addict|sober|habit|streak|\bday \d|\d+ days? (of|in a row|without|free|straight|strong|clean|showing)|\{run\}/i;

function lockWords(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const add = (where: string, ...xs: string[]) => xs.forEach((text) => out.push({ where, text }));
  const W = core.NUDGE_WORDS;
  for (const [k, list] of Object.entries(W.pick))
    list.forEach((_, i) => {
      const x = core.wordsOf(k + '.' + i, st, ctx);
      add('nudge ' + k + '.' + i, x.t, x.b);
    });
  for (const k of ['checkin', 'sunday', 'both', 'lessonCi', 'risk', 'after', 'heavy'] as const) add('nudge ' + k, W[k].t, W[k].b);
  add('nudge preview', W.preview.am.t, W.preview.am.b, W.preview.pm.t, W.preview.pm.b);
  add('nudge wind', W.wind('10:30 PM').t, W.wind('10:30 PM').b);
  add('nudge plan', ...Object.values(W.plan));
  for (const m of Object.keys(core.TALK_MOVES)) add('plan move', core.planMove([m]) || '');
  [...W.back, ...W.tender].forEach((x) => add('come-back', x.t, x.b));
  add('talk', ...Object.values(W.talk));
  add('flame-low', core.LOW_WARN_NOTE.t, core.LOW_WARN_NOTE.b, ...Object.values(core.LOW_SAVE).flatMap((x) => [x.t, x.b]));
  for (const day of core.LOW_BACK_DAYS)
    for (const step of [1, 2, 3] as const)
      for (const before of [0, 3] as const) {
        const x = core.lowBack(day, { step, low: 0.8, idle: day, was: step, warn: false }, before);
        add('flame-low back ' + day, x.t, x.b);
      }
  for (let n = 0; n < 3; n++) add('trail', core.trailNoteWords(n, 0), core.trailNoteWords(n, 3 * 3600_000));
  add('widget', ...Object.values(core.WIDGET_LINE), ...Object.values(core.WIDGET_NEXT));
  const L = core.LIVE_WORDS;
  add('live activity', L.hard, L.hardSub(23), L.wind, L.windSub('22:30'), L.asleep);
  return out;
}

describe('the lock screen', () => {
  it('no word Daybook puts there gives the person away', () => {
    const bad = lockWords().filter((x) => BANNED.test(x.text));
    expect(bad).toEqual([]);
  });

  /* Screen Time's words (core pull.ts) belong to the Screen Time work, which rewrites "This is when it gets you"; they pass this rule */
  it('nor do the Screen Time notes', () => {
    const notes = core.pullNudges({ lessonUrl: '/', long: 2 });
    const bad = Object.entries(notes).filter(([, n]) => BANNED.test(n.t + ' ' + n.b));
    expect(bad).toEqual([]);
  });

  it('the rule catches what it is for', () => {
    for (const x of ['Day 12 ☀️', '12 days of showing up', 'An urge again?', 'You slipped', 'Stay clean', 'porn', '3 days in a row'])
      expect(BANNED.test(x)).toBe(true);
    for (const x of ['5 days with nothing done.', 'Rode it out 4 times 🔥', 'Two weeks, and one ember still glows.']) expect(BANNED.test(x)).toBe(false);
  });
});
