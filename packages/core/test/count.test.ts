/* One count per mode (the owner, October 30, 2026), shown the same everywhere. Strict: the days in a row, which a slip puts to 0,
   and the days stay on the record. Gentle: the days that hold, and a slip takes one day off, never all of them. Step down: hours
   since the slip and the best stretch. The chip: the hours since a slip, for 72 hours. Nothing asks, nothing rescues, and what
   was earned stays, for someone mid-rescue when this ships too. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { DayEvent, Days, Settings } from '../src/types';

const base = { start: '2026-11-01', day1: '2026-11-01', countFrom: '2026-11-01' };
const strict: Settings = core.normSettings(base);
const gentle: Settings = core.normSettings({ ...base, cleanMode: 'gentle' });
const step: Settings = core.normSettings({ ...base, cleanMode: 'step', stepAt: '2026-11-01' });
const day = (n: number) => core.addDays('2026-10-31', n); // day(1) is Day 1, November 1
const ms = (n: number, h: number, m = 0) => {
  const [y, mo, d] = day(n).split('-').map(Number);
  return new Date(y, mo - 1, d, h, m).getTime();
};
const slip = (days: Days, n: number, time = '22:00', ev: Partial<DayEvent> = {}): Days => core.addEvent(days, day(n), 'slipped', time, ev, 1).days;
const hero = (d: Days, s: Settings, n: number, h = 9) => core.heroNumber(d, s, day(n), ms(n, h))!;

describe('strict: the days in a row', () => {
  it('climbs, and Day 1 says so', () => {
    expect(hero({}, strict, 1).n).toBe('Day 1');
    expect(['n', 'unit'].map((k) => hero({}, strict, 12)[k as 'n'])).toEqual(['12', 'days in a row']);
    expect(hero({}, strict, 12).eb).toBe('No slip');
  });
  it('a slip at day 3 puts it to 0, and it climbs again from the next day', () => {
    const d = slip({}, 3);
    expect(hero(d, strict, 3, 23).n).toBe('0');
    expect(hero(d, strict, 4).n).toBe('1');
    expect(hero(d, strict, 4).unit).toBe('day');
    expect(hero(d, strict, 5).n).toBe('2');
    expect(hero(d, strict, 5).unit).toBe('days in a row');
  });
  it('a slip at day 40 puts it to 0 too, and the 39 days stay on the record', () => {
    const d = slip({}, 40);
    expect(hero(d, strict, 40, 23).n).toBe('0');
    expect(core.heroSlipLine(d, strict, day(40), ms(40, 23))).toBe('Tonight is logged. Your 39 days are on your record.');
    const m = core.computeMetrics(d, strict, day(41));
    expect(m.longest).toBe(39);
    expect(core.myNumbers(d, strict, day(41), ms(41, 9))[2]).toMatchObject({ l: 'Longest run', b: '39' });
    expect(core.myNumbers(d, strict, day(41), ms(41, 9))[2].s).toContain('40 no-slip days in all');
  });
  it('the line on the day of a slip, in one day and in the morning', () => {
    const d = slip({}, 2, '09:00');
    expect(core.heroSlipLine(d, strict, day(2), ms(2, 9, 30))).toBe('This morning is logged. Your 1 day is on your record.');
    expect(core.heroSlipLine(slip({}, 1), strict, day(1), ms(1, 23))).toBeNull();
    expect(core.heroSlipLine({}, strict, day(5), ms(5, 9))).toBeNull();
  });
  it('the second slip in a week puts it to 0 again, and asks nothing', () => {
    let d = slip({}, 20);
    d = slip(d, 23);
    expect(hero(d, strict, 23, 23).n).toBe('0');
    expect(core.heroSlipLine(d, strict, day(23), ms(23, 23))).toBe('Tonight is logged. Your 2 days are on your record.');
    expect(hero(d, strict, 24).n).toBe('1');
    expect(core.computeMetrics(d, strict, day(24)).longest).toBe(19);
  });
  it('a rough day with two slips is one day off the count, the same as one', () => {
    const d = slip(slip({}, 10), 10, '23:00');
    expect(hero(d, strict, 11).n).toBe('1');
  });
  it('the way to graduation stays on Today, as the chip, once 30 days hold', () => {
    expect(hero({}, strict, 40).chip).toBe('39 of 90 toward graduation');
    expect(hero({}, strict, 20).chip).toBeNull();
    const d = slip({}, 40);
    /* after the 72 hours, the count toward graduation holds what was earned */
    expect(hero(d, strict, 44).chip).toBe('42 of 90 toward graduation');
    expect(hero(d, strict, 44).n).toBe('4');
  });
  it('below 30 days, the best run is the chip once the hours are over', () => {
    const d = slip({}, 13);
    expect(hero(d, strict, 18)).toMatchObject({ n: '5', chip: 'best 12 days', star: true });
  });
  it('graduated: the run is the number, and the award is the chip', () => {
    const g = core.graduate(strict, day(95)).st;
    expect(hero(slip({}, 100), g, 105)).toMatchObject({ n: '5', chip: 'Graduated · 99 of the last 100' });
  });
});

describe('gentle: the days that hold', () => {
  it('a slip takes one day off, and never to zero', () => {
    const d = slip({}, 8);
    /* the day of the slip is still open: the finished days all hold */
    expect(['n', 'unit'].map((k) => hero(d, gentle, 8, 23)[k as 'n'])).toEqual(['7', 'of the last 7 days']);
    expect(hero(d, gentle, 9).n).toBe('6');
    expect(hero(d, gentle, 15).n).toBe('6');
    expect(hero(d, gentle, 16).n).toBe('7');
  });
  it('at day 40: the count toward graduation loses one, and the line says the days stay', () => {
    const d = slip({}, 40);
    expect(hero(d, gentle, 40, 23)).toMatchObject({ eb: 'Toward graduation', n: '39', unit: 'of 90' });
    expect(core.heroSlipLine(d, gentle, day(40), ms(40, 23))).toBe('Tonight is logged. Your 39 days stay yours.');
    expect(hero(d, gentle, 41).n).toBe('39');
    expect(hero(d, gentle, 42).n).toBe('40');
  });
  it('a second slip in a week takes one more day, and no more', () => {
    const d = slip(slip({}, 20), 23);
    expect(hero(d, gentle, 24).n).toBe('5');
    expect(hero(d, gentle, 24).unit).toBe('of the last 7 days');
  });
  it('never "0": the day after a slip on Day 1, today counts', () => {
    expect(hero(slip({}, 1), gentle, 2)).toMatchObject({ n: 'Today', unit: 'counts' });
  });
});

describe('step down: hours since the slip and the best stretch', () => {
  it('is unchanged, and the slip gets no line', () => {
    const d = slip(slip({}, 3), 10);
    const h = hero(d, step, 11, 9);
    expect([h.eb, h.n, h.unit]).toEqual(['This stretch', '11', 'hours']);
    expect(h.chip).toMatch(/^best 7 d$/);
    expect(core.heroSlipLine(d, step, day(10), ms(10, 23))).toBeNull();
  });
});

describe('the chip: the hours since the slip', () => {
  for (const [name, s] of [
    ['strict', strict],
    ['gentle', gentle],
  ] as const) {
    it(name + ': from under an hour, for 72 hours, and then gone', () => {
      const d = slip({}, 10);
      const after = (h: number) => core.heroNumber(d, s, core.logicalKey(ms(10, 22) + h * 36e5, s.rollover), ms(10, 22) + h * 36e5)!;
      expect(after(0.1).chip).toBe('Under an hour since your last slip');
      expect(after(13).chip).toBe('13 hours since your last slip');
      expect(after(71).chip).toBe('71 hours since your last slip');
      expect(after(73).chip ?? '').not.toMatch(/since your last slip/);
      expect(after(13).say).toContain('13 hours since your last slip.');
    });
    it(name + ': the number is the days, never the hours', () => {
      const d = slip({}, 10);
      expect(/hour/.test(hero(d, s, 11).unit)).toBe(false);
    });
  }
  it('the hours are the same on Today and on the Days card', () => {
    const d = slip({}, 10);
    const v = core.cleanView(d, strict, day(11), ms(11, 11));
    expect(core.runChips(v).hours).toBe('13 hours');
  });
  it('the slip counted from a gap away has no hour, so it has no chip', () => {
    expect(core.hoursSinceSlip({}, strict, day(5), ms(5, 9))).toBeNull();
  });
});

describe('one count, shown the same everywhere', () => {
  const d = slip({}, 13);
  const n = 18;
  it('strict: Today, the Days card, My numbers and the check-in word agree', () => {
    const v = core.cleanView(d, strict, day(n), ms(n, 9));
    const t = core.daysCardText(d, strict, v, day(n));
    expect(hero(d, strict, n).n).toBe('5');
    expect(!t.tracking && [t.eyebrow, t.big, t.of]).toEqual(['No slip', '5', 'days in a row']);
    expect(core.myNumbers(d, strict, day(n), ms(n, 9))[2].s).toContain('Now 5 days in a row');
    expect(core.checkinSaveText(d, strict, day(n), day(n))).toBe('Saved. 5 days in a row with no slip.');
    expect(core.standRow(d, strict, {}, day(n), ms(n, 9), 'Spark')!.big).toBe('5 days');
  });
  it('gentle: Today, the Days card, My numbers and the check-in word agree', () => {
    const v = core.cleanView(d, gentle, day(n), ms(n, 9));
    const t = core.daysCardText(d, gentle, v, day(n));
    expect(hero(d, gentle, n).n).toBe('6');
    expect(!t.tracking && [t.eyebrow, t.big, t.of]).toEqual(['Days that hold', '6', 'of the last 7 days with no slip']);
    expect(core.myNumbers(d, gentle, day(n), ms(n, 9))[2].s).toContain('Now 6 of the last 7 days with no slip');
    expect(core.checkinSaveText(d, gentle, day(n), day(n))).toBe('Saved. 6 of the last 7 days with no slip.');
  });
  it('on the day of a slip no word says a run can be saved, lost or started fresh', () => {
    const k = slip({}, 40);
    for (const s of [strict, gentle]) {
      const v = core.cleanView(k, s, day(40), ms(40, 23));
      const words = [
        JSON.stringify(hero(k, s, 40, 23)),
        core.heroSlipLine(k, s, day(40), ms(40, 23)),
        JSON.stringify(core.daysCardText(k, s, v, day(40))),
        JSON.stringify(core.runChips(v)),
        JSON.stringify(core.myNumbers(k, s, day(40), ms(40, 23))),
        core.rkLitLine(k, s, {}, day(40), day(40)),
        JSON.stringify(core.rkHoldWords(false, false, core.rkRunBefore(k, s, day(40), day(40)))),
        JSON.stringify(core.moments(k, s, {}, day(40), ms(40, 23))),
        core.dayRow(k, s, day(40), day(40), core.runLedger(k, s, day(40))).pill,
      ].join(' ');
      expect(words).not.toMatch(/run saved|saved it|start fresh|keep counting|cannot be saved|next run|new run|run waiting|down to embers|for now/i);
      expect(words).not.toMatch(/\bquest\b/i);
    }
  });
  it('every mode asks the same of graduation', () => {
    for (const s of [strict, gentle, step]) expect(core.gradInfo(slip({}, 40), s, day(50)).count).toBe(48);
  });
});

describe('comebacks count in every mode', () => {
  it('a slip and a return counts, and only goes up', () => {
    for (const s of [strict, gentle, step]) {
      const d = slip({}, 10);
      expect(core.rkComebackCount(d, s, day(10))).toBe(0);
      expect(core.rkComebackCount(d, s, day(12))).toBe(1);
      expect(core.rkComebackCount(slip(d, 20), s, day(22))).toBe(2);
    }
    expect(core.identityLines(slip({}, 10), strict, {}, day(12)).find((l) => /comes back/.test(l.who))!.n).toBe('1 comeback');
    expect(core.recordLines(slip({}, 10), strict, day(12)).map((l) => l.n)).toEqual(['Longest run: 9 days', '11 no-slip days, all on your record']);
  });
});

describe('switching modes', () => {
  const d = slip({}, 15);
  it('each mode reads the same log its own way', () => {
    expect(hero(d, strict, 18).n).toBe('3');
    expect(hero(d, gentle, 18).n).toBe('6');
    expect(hero(d, step, 18, 22).eb).toBe('This stretch');
    expect(core.gradInfo(d, strict, day(18))).toEqual(core.gradInfo(d, gentle, day(18)));
  });
  it('a switch holds for two weeks, and the longest run never drops', () => {
    /* before countFrom, one-slip days kept a gentle run going: seen on gentle, it stays after the switch */
    const days = slip(slip({}, 5), 10);
    const tk = day(14);
    const seen = { ...gentle, countFrom: day(14), seen: { badges: [], quests: [], level: 1, full: null, lad: 4 } };
    expect(core.computeMetrics(days, seen, tk).longest).toBe(14);
    const kept = core.keepCounts(days, seen, tk)!;
    expect(kept.seen!.longest).toBe(14);
    const moved = core.setCountMode(kept, 'strict', tk).st;
    expect(moved.cleanHold).toBe(tk);
    expect(core.inCountHold(moved, core.addDays(tk, 13))).toBe(true);
    expect(core.inCountHold(moved, core.addDays(tk, 14))).toBe(false);
    expect(core.computeMetrics(days, moved, tk).longest).toBe(14);
    expect(core.computeMetrics(days, core.setCountMode(moved, 'step', tk).st, tk).longest).toBe(14);
    expect(core.gameCompute(days, moved, {}, tk).pts).toBe(core.gameCompute(days, seen, {}, tk).pts);
  });
  it('since countFrom, a slip ends the run on gentle too, so the longest run means the same in every mode', () => {
    expect(core.computeMetrics(slip({}, 10), gentle, day(12)).longest).toBe(9);
    expect(core.computeMetrics(slip({}, 10), strict, day(12)).longest).toBe(9);
  });
  it('the rough patch still moves a person to step down by itself', () => {
    let rough: Days = {};
    for (let n = 10; n <= 16; n++) rough = slip(rough, n);
    expect(core.shouldAutoStep(rough, strict, day(16))).toBe(true);
    expect(core.shouldAutoStep(rough, { ...strict, cleanHold: day(10) }, day(16))).toBe(false);
  });
});

describe('the migration: slips up to countFrom keep the rule they were made under', () => {
  /* a person whose run stood at 20 days when the update reached their phone, on day 22 (November 22) */
  const from = day(22);
  const old = core.normSettings({ ...base, countFrom: from });
  const none = core.normSettings({ start: base.start, day1: base.day1 });
  const cameBack = (k: number, at: number) => slip({}, k, '22:00', { id: 's1', rk: { at: day(at), pl: '' } });

  it('with no countFrom yet, nothing has moved: the log reads as before', () => {
    const d = cameBack(21, 22);
    expect(core.runLedger(d, none, day(23)).kind[day(21)]).toBe('saved');
    expect(core.runLedger(d, none, day(23)).cur).toBe(23);
  });
  it('the store sets it once, on the first open, and it never moves', () => {
    const st = core.keepCounts({}, none, day(22))!;
    expect(st.countFrom).toBe(day(22));
    expect(core.keepCounts({}, st, day(30))?.countFrom ?? st.countFrom).toBe(day(22));
    expect(core.normSettings(st).countFrom).toBe(day(22));
    expect(core.normSettings({ ...st, countFrom: 'nope' })).not.toHaveProperty('countFrom');
  });
  it('a run already saved stays saved: the count, the longest and the badge stay', () => {
    const d = cameBack(10, 11);
    const L = core.runLedger(d, old, day(30));
    expect(L.kind[day(10)]).toBe('saved');
    expect(L.cur).toBe(30);
    expect(L.longest).toBe(30);
    expect(hero(d, old, 30).n).toBe('30');
    const b = core.gameCompute(d, old, {}, day(30)).badges.find((x) => x.id === 'run-saved')!;
    expect(b.done).toBe(true);
    expect(b.name).toBe('Kept going');
    expect(core.shownBadges([b], old).map((x) => x.id)).toEqual(['run-saved']);
  });
  it('someone mid-rescue when this ships keeps what the old rule gives them: coming back still saves it', () => {
    /* the slip on day 21, the update on day 22, no answer given: the run waits */
    const d = slip({}, 21);
    expect(core.runLedger(d, old, day(22)).open).toMatchObject({ k: day(21), run: 20 });
    expect(hero(d, old, 22).n).toBe('21');
    /* coming back is still marked, on later days too, while it waits */
    expect(core.sunriseDue(d, old, day(23))).toMatchObject({ k: day(21) });
    const back = core.srDone(d, day(21), core.sunriseDue(d, old, day(23))!.ev.id, day(23));
    const L = core.runLedger(back, old, day(24));
    expect(L.kind[day(21)]).toBe('saved');
    expect(L.cur).toBe(24);
    /* the window closed with no return: as the old rule, the run ended at the slip, and the record stays */
    const gone = core.runLedger(d, old, day(26));
    expect(gone.kind[day(21)]).toBeUndefined();
    expect(gone.longest).toBe(20);
  });
  it('an old answer of "start fresh" stays the person’s answer', () => {
    const d = slip({}, 21, '22:00', { id: 's1', keep: false });
    expect(core.runLedger(d, old, day(23)).cur).toBe(2);
  });
  it('a slip after countFrom has the new rule, even with the same return', () => {
    const d = cameBack(25, 26);
    const L = core.runLedger(d, old, day(27));
    expect(L.kind[day(25)]).toBeUndefined();
    expect(L.cur).toBe(2);
    expect(L.longest).toBe(24);
    expect(core.runLedger(d, old, day(27)).open).toBeNull();
  });
  it('an old saved day is still marked on the calendar and in the day list, in words that name no rescue', () => {
    const d = cameBack(10, 11);
    const L = core.runLedger(d, old, day(30));
    expect(core.dayRow(d, old, day(10), day(30), L).pill).toBe('Slipped · you came back');
    expect(core.calMonth(d, old, day(30), day(10).slice(0, 7)).days[9].kind).toBe('saved');
  });
  it('points, level and the seen badges do not move when the rule moves', () => {
    const d = cameBack(21, 22);
    const a = core.gameCompute(d, none, {}, day(23));
    const b = core.gameCompute(d, old, {}, day(23));
    expect([b.pts, b.level.n]).toEqual([a.pts, a.level.n]);
    expect(b.badges.filter((x) => x.done).map((x) => x.id)).toEqual(a.badges.filter((x) => x.done).map((x) => x.id));
  });
});

describe('what the count keeps', () => {
  it('writes nothing when nothing moved, and waits for seen before the floor', () => {
    const noSeen = core.normSettings({ ...base });
    expect(core.keepCounts({}, noSeen, day(9))).toBeNull();
    const seen = { ...strict, seen: { badges: [], quests: [], level: 1, full: null, lad: 4 } };
    const once = core.keepCounts({}, seen, day(9))!;
    expect(once.seen!.longest).toBe(9);
    expect(core.keepCounts({}, once, day(9))).toBeNull();
    expect(core.normSettings(once).seen!.longest).toBe(9);
  });
  it('a later slip never lowers the longest run shown', () => {
    const seen = { ...strict, seen: { badges: [], quests: [], level: 1, full: null, lad: 4, longest: 20 } };
    expect(core.computeMetrics(slip({}, 3), seen, day(30)).longest).toBe(27);
    expect(core.computeMetrics(slip(slip({}, 3), 10), seen, day(12)).longest).toBe(20);
  });
});

describe('new people start on gentle', () => {
  const save = (a: core.SetupAnswers) => core.obSave(a, null, null, day(1), 0).st;
  it('setup gives gentle, or step down when it happens daily, and never strict', () => {
    expect(save({ freq: 'f1' }).cleanMode).toBe('gentle');
    expect(save({}).cleanMode).toBe('gentle');
    expect(save({ freq: 'f4' }).cleanMode).toBe('step');
  });
  it('someone already on strict stays there through a walk-through of setup', () => {
    const walked = core.obSave(
      { freq: 'f1' },
      strict,
      core.obChanges({ freq: 'f1' }, strict, day(9)).map((c) => c.k),
      day(9),
      0,
    ).st;
    expect(walked.cleanMode).toBe('strict');
  });
  it('coming back from step down lands on what the person had: strict only if they were on it', () => {
    const tk = day(30);
    const fresh = save({ freq: 'f4' });
    expect(core.autoCount(fresh, tk).st.cleanMode).toBe('gentle');
    expect(core.stepGrad(fresh, tk).st.cleanMode).toBe('gentle');
    /* a rough patch moved them, and they keep what they had */
    expect(core.autoCount(core.autoStep(strict, tk).st, tk).st.cleanMode).toBe('strict');
    expect(core.autoCount(core.autoStep(gentle, tk).st, tk).st.cleanMode).toBe('gentle');
    expect(core.cleanKeep(core.autoStep(strict, tk).st, tk).st.cleanMode).toBe('strict');
    expect(core.cleanKeep(core.autoStep(gentle, tk).st, tk).st.cleanMode).toBe('gentle');
    expect(core.normSettings(core.autoStep(gentle, tk).st).cleanWas).toBe('gentle');
    expect(core.normSettings({ ...strict, cleanWas: 'nope' })).not.toHaveProperty('cleanWas');
  });
});
