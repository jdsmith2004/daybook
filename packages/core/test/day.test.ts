/* "Your day" against the legacy app: each stop's status, the wind-down line, the lesson stop, saved check-ins, and saving
   tonight's check-in (the word after it and what is stored). The fixtures were recorded from the legacy app. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days, Settings } from '../src/types';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logs: any[] = readdirSync(dir)
  .filter((f) => f.endsWith('.json') && !['emblem.json', 'setup.json', 'setup-flow.json', 'rekindle-words.json', 'tools-words.json'].includes(f))
  .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

function lessonText(days: Days, st: Settings, tk: string) {
  const r = core.lessonStop(days, st, tk);
  if (r.kind === 'read')
    return '✓ Done today: ' + r.L.title + r.L.key + (r.next ? 'Another one: ' + r.next.title + 'One a day is plenty. This is here if you want more.' : '');
  if (r.kind === 'next') return `Lesson ${r.n} of ${r.total}: ${r.L.title}${r.L.tag}Start · ${core.lmin(r.L)}Pick a different lesson`;
  return (
    'Read again: ' +
    r.L.title +
    'You have finished every lesson. A quick re-read keeps one fresh each day.' +
    r.L.key +
    (r.note ? 'Your note' + r.note : '') +
    'Read it again'
  );
}

describe.each(logs)('$name', (fx) => {
  const st: Settings = core.normSettings(fx.input.settings);
  const days: Days = {};
  Object.keys(fx.input.days).forEach((k) => {
    if (core.isKey(k)) days[k] = core.normDay(fx.input.days[k], k);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fx.cases.forEach((c: any, i: number) =>
    it(`moment ${i}: Your day`, () => {
      const e = c.expected;
      const tk = e.tk;
      const rh = core.rhythm(days, st, tk, c.now);
      expect(rh.stops.map((s) => core.stopStatus(s, rh.windMin))).toEqual(e.day.status);
      expect(core.windLine(st, rh.leftToOff, days[tk]?.p || core.blankP())).toBe(e.day.wind);
      expect(squash(lessonText(days, st, tk))).toBe(squash(e.day.lesson));
      expect(core.morningInfo(days, st, tk)).toEqual(e.day.morning);
      expect(core.nextUp(days, st, tk, c.now)).toEqual(e.day.next);
      const done = core.lessonsDone(days);
      const nx = core.firstUndone(done);
      const stats = core.lessonStats(days);
      core.LESSONS.forEach((L, i) => {
        [false, true].forEach((full, j) => {
          const r = core.lessonRow(L, done, nx && nx.id, st, stats, tk, full);
          const more = r.more ? 'The one thing to keep' + r.more.key + (r.more.note ? r.more.np + r.more.note : '') : '';
          expect(squash(`${r.n}${L.title}${r.faith ? 'Faith' : ''}${r.sub}${r.status.text}${more}`)).toBe(e.day.lessons[i][j]);
        });
      });
      const mi = core.modeInfo(st, tk);
      expect(mi).toEqual(e.day.mode);
      expect(core.modeActs(st, tk, mi.k)).toEqual(e.day.modeActs);
      for (const k of Object.keys(e.day.sums)) {
        const ch = days[k].checkin!;
        const tiles = [
          [ch.m, 'Motivation'],
          [ch.c, 'Connection'],
          [ch.e, 'Energy'],
          [ch.s, 'Stress'],
        ]
          .map(([v, l]) => (v == null ? '–' : v) + String(l))
          .join('');
        const line = core.checkinLine(days, k, ch);
        expect(squash('✓ Day loggedEdit ' + tiles + ' ' + line + (ch.n ? '“' + ch.n + '”' : ''))).toBe(e.day.sums[k]);
      }
      /* saving tonight's check-in */
      const saved = core.saveCheckin(days, tk, { m: 6, c: 5, e: 4, s: 3, ro: 'Y', n: ' a line ' }, c.now);
      const got = { ...saved[tk].checkin! } as Partial<core.Checkin>;
      delete got.at;
      expect(got).toEqual(e.day.saved);
      expect(core.checkinSaveText(saved, st, tk, tk)).toBe(e.day.save);
    }),
  );
});

describe('the night and the wind-down', () => {
  const st = core.normSettings({ v: 1, start: '2026-10-01', day1: '2026-10-08', rollover: 4, screensOff: '23:00', u: 1 });
  it('the sleep slider in the check-in keeps the hours in half hours, from 0 to 14', () => {
    expect(core.sleepHours(7)).toBe(7);
    expect(core.sleepHours(7.26)).toBe(7.5);
    expect(core.sleepHours(20)).toBe(14);
    expect(core.sleepHours(-1)).toBe(0);
  });
  it('screens off: the same answer again clears it', () => {
    let d = core.setScreensOff({}, '2026-10-14', 'Y', 1);
    expect(d['2026-10-14'].checkin?.so).toBe('Y');
    d = core.setScreensOff(d, '2026-10-14', 'Y', 2);
    expect(d['2026-10-14']).toBeUndefined(); // the empty check-in is dropped, and with it the empty day
  });
  it('sleep steps in half hours from 7, between 0 and 14', () => {
    let d = core.stepSleep({}, '2026-10-15', 0.5, 1);
    expect(d['2026-10-15'].checkin?.h).toBe(7.5);
    for (let i = 0; i < 40; i++) d = core.stepSleep(d, '2026-10-15', 0.5, 2 + i);
    expect(d['2026-10-15'].checkin?.h).toBe(14);
  });
  it('the wind-down is done when every line is ticked', () => {
    let d: Days = {};
    st.wind.forEach((_, i) => (d = core.windToggle(d, st, '2026-10-15', i, 1 + i)));
    expect(d['2026-10-15'].p?.wd).toBe(true);
    d = core.windToggle(d, st, '2026-10-15', 0, 99);
    expect(d['2026-10-15'].p?.wd).toBe(false);
  });
  it('Goodnight is the wind-down, on time or late, and stays counted however the list is ticked; a nap in the afternoon is not', () => {
    const on = core.phoneAway({}, '2026-10-15', '22:15', 1, st);
    expect(on['2026-10-15'].p?.wd).toBe(true);
    expect(core.phoneAway({}, '2026-10-15', '01:30', 1, st)['2026-10-15'].p?.wd).toBe(true);
    expect(core.phoneAway({}, '2026-10-15', '13:00', 1, st)['2026-10-15'].p?.wd).toBeFalsy();
    const ticked = core.windToggle(on, st, '2026-10-15', 0, 2);
    expect(core.windToggle(ticked, st, '2026-10-15', 0, 3)['2026-10-15'].p?.wd).toBe(true);
  });
  it('the nights the phone went down only grow, and nothing says in a row', () => {
    let d = core.phoneAway({}, '2026-10-13', '22:00', 1, st);
    expect(core.bedWords(d, st, '2026-10-13', '22:00').line).toBe('Down at 10:00 PM. That is your first night.');
    d = core.phoneAway(d, '2026-10-15', '23:10', 2, st);
    expect(core.phoneNights(d)).toBe(2);
    expect(core.bedWords(d, st, '2026-10-15', '23:10').line).toBe('Down at 11:10 PM. That is 2 nights.');
  });
  it('the last words are the person’s own sentence, and after a slip today that they came back to this', () => {
    const me = { ...st, becoming: 'I am someone who keeps my word.' };
    expect(core.bedWords({}, me, '2026-10-15', '').own).toBe('I am someone who keeps my word.');
    expect(core.bedWords({}, { ...st, becoming: '' }, '2026-10-15', '').own).toBe('Rest well. Tomorrow is a fresh day.');
    const slip = core.addEvent({}, '2026-10-15', 'slipped', '20:00', {}).days;
    expect(core.bedWords(slip, me, '2026-10-15', '').own).toBe('You came back to this tonight. That is the part that lasts.');
  });
  it('past the screens-off time, the wind-down says Goodnight still counts', () => {
    expect(core.windWhen(st, 43)).toContain('in 43 min');
    expect(core.windWhen(st, -10)).toContain('Goodnight still counts');
    expect(core.windWhen(st, 900)).not.toContain(' in ');
  });
  it('every form can close its eyes', () => {
    for (let n = 1; n <= 60; n++) {
      const fig = core.emblemLayers(n, true)!.fig;
      const closed = core.figAsleep(fig);
      expect(closed).not.toBe(fig);
      expect(closed).not.toContain('#4A1A0A');
    }
  });
  it('a day choice that matches the usual routine is not kept', () => {
    let d = core.routineDay({}, st, '2026-10-15', 'reach', true, 1);
    expect(d['2026-10-15'].p?.ov).toEqual({ reach: true });
    expect(core.routineChanged(st, d['2026-10-15'].p)).toBe(1);
    d = core.routineDay(d, st, '2026-10-15', 'reach', false, 2);
    expect(d['2026-10-15']?.p?.ov || {}).toEqual({});
  });
});

describe('Day 1', () => {
  const st = core.normSettings({ v: 1, start: '2026-10-10', day1: '2026-10-17', rollover: 4, screensOff: '23:00', u: 1 });
  it('moves, starts and stops the way the legacy buttons do', () => {
    expect(core.setDay1(st, 'later', '2026-10-15').st.day1).toBe('2026-10-24');
    expect(core.setDay1(st, 'tomorrow', '2026-10-15').st.day1).toBe('2026-10-16');
    expect(core.setDay1(st, 'today', '2026-10-15')).toMatchObject({ toast: 'Day 1 is today. Days with no slip logged will count.' });
    expect(core.setDay1(st, 'none', '2026-10-15')).toMatchObject({ toast: 'Just tracking. Nothing is counted, and you can start a Day 1 any time.' });
    expect(core.setDay1(st, 'week', '2026-10-15').toast).toBe('Day 1 is Thursday, Oct 22.');
  });
  it('a picked date cannot come before the tracking start (the start day itself is fine)', () => {
    expect(core.setDate(st, 'day1', '2026-10-09').toast).toBe('Day 1 cannot come before the tracking start.');
    expect(core.setDate(st, 'day1', '2026-10-10').st.day1).toBe('2026-10-10');
    expect(core.setDate(st, 'day1', '2026-10-12').st.day1).toBe('2026-10-12');
    expect(core.setDate(st, 'start', '2026-10-20').st.day1).toBe('2026-10-27');
  });
});
