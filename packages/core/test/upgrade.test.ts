/* An upgrade test: a save written by Daybook 1.2.1 (the last 1.2.x, commit da6fa369) opens in today's app with every day, every
   entry, the points, the level, the badges, the longest run and the comebacks intact. Losing a person's record on an update is the
   worst thing the app can do, so this is a frozen record, like the golden fixtures: test/upgrade/1.2.1.json was made by
   running 1.2.1's own core over a scripted person (71 days, 4 slips, two saved runs, comebacks, Sunday reviews, journal entries),
   stored the way 1.2.1's store wrote it (one JSON string per AsyncStorage key), with what 1.2.1 showed for that log in "expect".
   Never change the fixture to make this pass. If a check fails, today's app loses or changes something a 1.2.1 save held.
   The loading below is the same as load() in apps/mobile/src/lib/store.tsx, and the "first look" after it is the same as the
   store's effects when the app opens (seen baseline, keepCounts). It cannot import the React store, so it is copied here. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import * as core from '../src/index';

const fx = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'upgrade', '1.2.1.json'), 'utf8')) as {
  version: string;
  commit: string;
  today: string;
  storage: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect: any;
};
const E = fx.expect;
const J = <T>(x: T): T => JSON.parse(JSON.stringify(x));

const P = 'daybook:';
const DIRTY = P + 'dirty';
const TOMB = P + 'tomb';

/** load(), as the store does it: every key under "daybook:", each run through its normalizer */
function load(storage: Record<string, string>): { snap: core.Snapshot; dirty: Record<string, number> } {
  const snap: core.Snapshot = { settings: null, days: {}, reviews: {}, journal: {} };
  let dirty: Record<string, number> = {};
  for (const k of Object.keys(storage).filter((x) => x.startsWith(P))) {
    let v: unknown;
    try {
      v = JSON.parse(storage[k]);
    } catch {
      continue;
    }
    const id = k.slice(P.length);
    if (k === DIRTY) dirty = v && typeof v === 'object' ? (v as Record<string, number>) : {};
    else if (k === TOMB) {
      const t = core.cleanTombs(v);
      if (t) snap.tomb = t;
    } else if (id === 'settings') snap.settings = core.normSettings(v);
    else if (id.startsWith('days/') && core.isKey(id.slice(5))) snap.days[id.slice(5)] = core.normDay(v, id.slice(5));
    else if (id.startsWith('reviews/') && core.isReviewKey(id.slice(8))) snap.reviews[id.slice(8)] = core.normReview(v, id.slice(8));
    else if (id.startsWith('journal/') && core.isJnId(id.slice(8))) {
      const e = core.normJEntry(v, id.slice(8));
      if (e) snap.journal![e.id] = e;
    }
  }
  return { snap, dirty };
}

/** the store's two effects when the app opens: the first look at what is earned, and what the count keeps. Each runs again
    after a change to the settings, so they run until nothing moves (with a cap, so a loop would fail the test). */
function open(snap: core.Snapshot, tk: string): core.Snapshot {
  let cur = snap;
  for (let i = 0; i < 6; i++) {
    const st = cur.settings!;
    let next: core.Settings | null = null;
    if (!st.seen || (st.seen.lad || 0) < core.LADDER_V) next = core.checkNew(cur.days, st, cur.reviews, tk, false).st;
    if (!next) next = core.keepCounts(cur.days, st, tk);
    if (!next) return cur;
    cur = { ...cur, settings: next };
  }
  throw new Error('opening the app kept changing the settings');
}

const [y, m, d] = fx.today.split('-').map(Number);
const NOW = new Date(y, m - 1, d, 21, 0).getTime();
afterEach(() => vi.useRealTimers());
const clockAtFixtureToday = () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
};

const raw = (k: string) => JSON.parse(fx.storage[P + k]);

describe(`a ${fx.version} save (commit ${fx.commit}) opens in today's app`, () => {
  it('runs in the time zone the fixture was made in', () => {
    expect(new Date(Date.UTC(2026, 9, 15, 12)).getHours()).toBe(7); // America/Chicago, CDT
    expect(core.logicalKey(NOW, 4)).toBe(fx.today);
  });

  it('is a real log: the fixture holds what the checks below look for', () => {
    expect(E.days.length).toBeGreaterThan(55);
    expect(E.slips).toBeGreaterThanOrEqual(3);
    expect(E.comebacks).toBeGreaterThanOrEqual(3);
    expect(E.longest).toBeGreaterThan(E.current); // a comeback after a long run: the longest run is not the current one
    expect(E.savedRuns.length).toBeGreaterThanOrEqual(1);
    expect(E.points).toBeGreaterThan(1000);
    expect(E.badges.length).toBeGreaterThan(20);
    expect(E.lessons.length).toBeGreaterThan(30);
    expect(E.journal.length).toBeGreaterThan(0);
    expect(E.reviews.length).toBeGreaterThan(0);
  });

  describe('every record', () => {
    const { snap } = load(fx.storage);

    it('has every day, and no other', () => {
      expect(Object.keys(snap.days).sort()).toEqual(E.days);
    });

    it('keeps every day exactly as it was saved (events, check-in, play, lessons, change time)', () => {
      for (const k of E.days) expect(J(snap.days[k]), 'day ' + k).toEqual(raw('days/' + k));
    });

    it('has every entry, with its id, outcome, time, trigger and note', () => {
      const found: typeof E.entries = [];
      for (const k of Object.keys(snap.days).sort())
        for (const e of snap.days[k].events) found.push({ day: k, id: e.id, outcome: e.outcome, time: e.time, trigger: e.trigger, note: e.note });
      expect(found).toEqual(E.entries);
      expect(found.filter((e: { outcome: string }) => e.outcome === 'slipped').length).toBe(E.slips);
      expect(found.filter((e: { outcome: string }) => e.outcome === 'rode').length).toBe(E.rode);
    });

    it('keeps the check-ins and the lessons marked done', () => {
      expect(Object.keys(snap.days).filter((k) => core.sumDay(snap.days[k]).checked).length).toBe(E.checkins);
      expect([...core.lessonsDone(snap.days)].sort()).toEqual(E.lessons);
    });

    it('keeps the reviews and the journal entries as they were saved', () => {
      expect(Object.keys(snap.reviews).sort()).toEqual(E.reviews);
      for (const k of E.reviews) expect(J(snap.reviews[k]), 'review ' + k).toEqual(raw('reviews/' + k));
      expect(Object.keys(snap.journal || {}).sort()).toEqual(E.journal);
      for (const k of E.journal) expect(J(snap.journal![k]), 'journal ' + k).toEqual(raw('journal/' + k));
    });

    it('keeps the settings a person set (a superset of what was saved: today may add fields, never lose one)', () => {
      const { slipPlan: savedSlipPlan, ...savedRest } = raw('settings');
      expect(J(snap.settings)).toMatchObject(savedRest);
      const st = snap.settings!;
      // The slip plan: a line the person wrote survives word for word. A line that was still 1.2.1's starting words may be
      // moved to today's starting words (normSettings does this on purpose, so a plan nobody wrote is not frozen in old words).
      expect(st.slipPlan.length).toBe(savedSlipPlan.length);
      savedSlipPlan.forEach((line: string, i: number) => {
        if (E.settings.slipSteps121.indexOf(line) < 0) expect(st.slipPlan[i], 'slip plan line ' + i).toBe(line);
        else expect([line, core.SLIP_STEPS[i]], 'slip plan line ' + i).toContain(st.slipPlan[i]);
      });
      expect(st.slipPlan[4]).toBe('If I want to, text Sam: "I slipped, and I am still here."');
      const s = E.settings;
      expect(st.start).toBe(s.start);
      expect(st.day1).toBe(s.day1);
      expect(st.cleanMode).toBe(s.cleanMode);
      expect(st.goal).toBe(s.goal);
      expect(st.safePerson).toBe(s.safePerson);
      expect(st.becoming).toBe(s.becoming);
      expect(st.reasons).toEqual(s.reasons);
      expect(st.plan).toEqual(s.plan);
      expect(st.note).toBe(s.note);
      expect(st.screensOff).toBe(s.screensOff);
      expect(J(st.opts)).toEqual(s.opts);
      expect(J(st.learn.notes)).toEqual(s.notes);
      expect(J(st.learn.prac)).toEqual(s.prac);
      expect(J(st.onb)).toEqual(s.onb);
    });

    it('leaves the not-yet-synced marks alone (they are not part of the log)', () => {
      const { dirty } = load(fx.storage);
      expect(Object.keys(dirty).sort()).toEqual(Object.keys(JSON.parse(fx.storage[DIRTY])).sort());
    });
  });

  describe('what was earned', () => {
    // the first look when the app opens, at the day the fixture is evaluated at
    let opened: core.Snapshot;
    let st: core.Settings;
    let g: core.GameState;
    let L: core.RunLedger;
    let mt: core.Metrics;
    beforeAll(() => {
      clockAtFixtureToday();
      opened = open(load(fx.storage).snap, fx.today);
      st = opened.settings!;
      g = core.gameCompute(opened.days, st, opened.reviews, fx.today);
      L = core.runLedger(opened.days, st, fx.today);
      mt = core.computeMetrics(opened.days, st, fx.today);
      vi.useRealTimers();
    });

    it('keeps the points: never lower than 1.2.1 showed', () => {
      expect(g.pts).toBeGreaterThanOrEqual(E.points);
      // equal is expected. If today's rules ever give more points for the same log, that is allowed (earned things only go up).
      expect(g.pts).toBe(E.points);
    });

    it('keeps the level: never lower than 1.2.1 showed', () => {
      expect(g.level.n).toBeGreaterThanOrEqual(E.level.n);
      expect(g.level.n).toBe(E.level.n);
      expect(st.seen!.level).toBeGreaterThanOrEqual(E.seenLevel);
    });

    it('keeps every badge: each badge 1.2.1 had earned is still earned', () => {
      const earned = new Set(g.badges.filter((b) => core.badgeDone(b, st)).map((b) => b.id));
      expect(E.badges.filter((id: string) => !earned.has(id))).toEqual([]);
      // the badges the person was shown as earned (the seen list) are still there
      expect(E.seenBadges.filter((id: string) => st.seen!.badges.indexOf(id) < 0)).toEqual([]);
      // nothing was earned out of nowhere either: opening the app celebrates nothing that 1.2.1 had already shown
      expect([...earned].filter((id) => E.badges.indexOf(id) < 0)).toEqual([]);
    });

    it('does not celebrate again what was already earned', () => {
      const r = core.checkNew(opened.days, st, opened.reviews, fx.today, false);
      expect(r.items).toEqual([]);
    });

    it('keeps the longest run: the same, and above the current run', () => {
      expect(L.longest).toBe(E.longest);
      expect(mt.longest).toBeGreaterThanOrEqual(E.longest);
      expect(mt.longest).toBe(E.longest);
      expect(L.cur).toBe(E.current);
      expect(L.cur).toBeLessThan(E.longest);
      expect(L.saves).toBe(E.saves);
      expect(
        Object.keys(L.kind)
          .filter((k) => L.kind[k] === 'saved')
          .sort(),
      ).toEqual(E.savedRuns);
      expect(L.clean).toBe(E.cleanDays);
      expect(L.counted).toBe(E.countedDays);
    });

    it('keeps the comebacks', () => {
      expect(core.rkComebackCount(opened.days, st, fx.today)).toBeGreaterThanOrEqual(E.comebacks);
      expect(core.rkComebackCount(opened.days, st, fx.today)).toBe(E.comebacks);
    });

    it('keeps the points of each day (a day never loses what it earned)', () => {
      const lower = Object.keys(E.perDay).filter((k) => (g.perDay[k] || 0) < E.perDay[k]);
      expect(lower.map((k) => k + ': ' + E.perDay[k] + ' before, ' + (g.perDay[k] || 0) + ' now')).toEqual([]);
    });
  });

  describe('saving it again', () => {
    const { snap } = load(fx.storage);

    it('changes nothing: the normalizers are stable on what they gave', () => {
      expect(J(core.normSettings(J(snap.settings)))).toEqual(J(snap.settings));
      for (const k of Object.keys(snap.days)) expect(J(core.normDay(J(snap.days[k]), k)), 'day ' + k).toEqual(J(snap.days[k]));
      for (const k of Object.keys(snap.reviews)) expect(J(core.normReview(J(snap.reviews[k]), k)), 'review ' + k).toEqual(J(snap.reviews[k]));
      for (const k of Object.keys(snap.journal || {})) expect(J(core.normJEntry(J(snap.journal![k]), k)), 'journal ' + k).toEqual(J(snap.journal![k]));
    });

    it('changes nothing when it is written and read once more, the way the store writes it', () => {
      const written: Record<string, string> = {};
      for (const r of core.toRecords(snap)) written[P + r.id] = JSON.stringify(r.data);
      expect(Object.keys(written).sort()).toEqual(
        Object.keys(fx.storage)
          .filter((k) => k !== DIRTY)
          .sort(),
      );
      expect(J(load(written).snap)).toEqual(J(snap));
    });
  });

  describe('a sync round trip', () => {
    it('gives back the same log: toRecords, normRecord on each (as the server and the phone do), snapshotOf', () => {
      const { snap } = load(fx.storage);
      const wire = JSON.parse(JSON.stringify(core.toRecords(snap)));
      const recs = wire.map((r: unknown) => core.normRecord(r)).filter((r: core.SyncRecord | null): r is core.SyncRecord => !!r);
      expect(recs.length).toBe(wire.length);
      const back = core.snapshotOf(recs);
      expect(J(back.settings)).toEqual(J(snap.settings));
      expect(J(back.days)).toEqual(J(snap.days));
      expect(J(back.reviews)).toEqual(J(snap.reviews));
      expect(J(back.journal || {})).toEqual(J(snap.journal || {}));
    });

    it('keeps what was earned through the trip', () => {
      clockAtFixtureToday();
      const { snap } = load(fx.storage);
      const recs = core.toRecords(snap).map((r) => core.normRecord(JSON.parse(JSON.stringify(r)))!);
      const back = open(core.snapshotOf(recs), fx.today);
      const g = core.gameCompute(back.days, back.settings!, back.reviews, fx.today);
      expect(g.pts).toBe(E.points);
      expect(g.level.n).toBe(E.level.n);
      expect(core.computeMetrics(back.days, back.settings!, fx.today).longest).toBe(E.longest);
      expect(core.rkComebackCount(back.days, back.settings!, fx.today)).toBe(E.comebacks);
      expect([...core.lessonsDone(back.days)].sort()).toEqual(E.lessons);
    });
  });
});
