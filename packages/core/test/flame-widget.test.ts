/* The flame on the Home Screen and the Lock Screen (flame-widget.ts). Every day here is made up. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const tk = '2026-10-20';
const now = new Date(2026, 9, 20, 9, 0).getTime();
const st = core.normSettings({ start: '2026-10-01', day1: '2026-10-01', cleanMode: 'gentle' });
const lesson = (k: string): Days => ({ [k]: core.normDay({ p: { ls: ['l1'] } }, k) });

describe('the widget', () => {
  const at = (h: number, d = 20, m = 0) => new Date(2026, 9, d, h, m).getTime();

  it('dims on its own over the coming days while nothing is done, and stops once it is down to embers', () => {
    const t = core.widgetTimeline(lesson(tk), st, tk, now);
    const states = t.map((e) => e.state).filter((s, i, a) => s !== a[i - 1]);
    expect(states).toEqual(['lit', 'warn', 'dim', 'embers']);
    expect(t[0].at).toBe(now);
    /* each change of the fire at the start of its day */
    expect(new Date(t.find((e) => e.state === 'warn')!.at).getDate()).toBe(22);
    expect(new Date(t.find((e) => e.state === 'embers')!.at).getDate()).toBe(24);
    expect([...new Set(t.map((e) => e.low))]).toEqual([0, core.LOW_OF[1], core.LOW_OF[3]]);
    /* it never says the same thing twice in a row */
    for (let i = 1; i < t.length; i++) expect(t[i].at).toBeGreaterThan(t[i - 1].at);
  });

  it("falls asleep at tonight's time and wakes for the morning", () => {
    const t = core.widgetTimeline(lesson(tk), st, tk, now);
    const night = t.find((e) => e.part === 'night')!;
    const n = core.nightAtStart(st);
    expect(new Date(night.at).getHours()).toBe(+n.slice(0, 2));
    expect(new Date(night.at).getMinutes()).toBe(+n.slice(3, 5));
    expect(night).toMatchObject({ mood: 'asleep', line: core.WIDGET_WORDS.night.line });
    expect(core.widgetPart(at(4), st)).toBe('morning');
    expect(core.widgetPart(at(3, 21), st)).toBe('night');
    expect(core.widgetPart(at(19), st)).toBe('evening');
    /* a night that starts after midnight */
    const late = core.normSettings({ ...st, nightAt: '00:30' });
    expect(core.widgetPart(at(23), late)).toBe('evening');
    expect(core.widgetPart(at(1), late)).toBe('night');
  });

  it('is bright once fed, waits before, and its line follows the day', () => {
    expect(core.widgetAt(lesson(tk), st, at(15))).toMatchObject({ mood: 'bright', line: core.WIDGET_WORDS.fed.line });
    const none = lesson('2026-10-19');
    expect(core.widgetAt(none, st, at(15))).toMatchObject({ mood: 'waiting', line: core.WIDGET_WORDS.day.line });
    expect(core.widgetAt(none, st, at(20))).toMatchObject({ mood: 'waiting', line: core.WIDGET_WORDS.evening.line });
  });

  it('asks the morning question while it is due, and stops once answered', () => {
    const none = lesson('2026-10-19');
    expect(core.widgetAt(none, st, at(7))).toMatchObject({ ask: tk, line: core.MORNING_WORDS.night });
    const told = core.answerNight(none, st, tk, 'free', at(7));
    expect(core.widgetAt(told, st, at(8)).ask).toBeNull();
    expect(core.widgetAt(none, st, at(15)).ask).toBeNull();
  });

  it('shows the week: fed days, days not fed, today, and nothing before the start', () => {
    const d = { ...lesson('2026-10-18'), ...lesson('2026-10-20') };
    expect(core.widgetWeek(d, st, tk)).toEqual({ week: 'ooooxof', wd: 'WTFSSMT' });
    const fresh = core.normSettings({ ...st, start: '2026-10-18' });
    expect(core.widgetWeek({}, fresh, tk).week).toBe('----oot');
  });

  it('shows how it burns now, and is never dimmed in the hours after a slip', () => {
    expect(core.widgetAt(lesson('2026-10-15'), st, at(15))).toMatchObject({ state: 'embers', mood: 'low', line: core.WIDGET_WORDS.embers.line });
    const slip = core.addEvent(lesson('2026-10-10'), '2026-10-19', 'slipped', '23:00', {}, 1).days;
    expect(core.widgetAt(slip, st, at(15))).toMatchObject({ state: 'lit', mood: 'bright', line: core.WIDGET_WORDS.after.line });
  });

  it('never says what Daybook is for, and shows no count', () => {
    for (const line of [...Object.values(core.WIDGET_LINE), ...Object.values(core.WIDGET_NEXT), ...Object.values(core.WIDGET_SOS)])
      expect(line).not.toMatch(/\d|porn|habit|slip|clean|sober|addict|urge|n't/i);
  });

  it('putting it on a screen earns points once, kept for good', () => {
    const d = lesson(tk);
    const before = core.gameCompute(d, st, {}, tk).pts;
    const on = core.normSettings({ ...st, widget: tk });
    expect(on.widget).toBe(tk);
    expect(core.gameCompute(d, on, {}, tk).pts).toBe(before + core.WIDGET_PTS);
    expect(core.WIDGET_PTS).toBe(30);
    expect(core.normSettings({ ...st, widget: 'nope' }).widget).toBeUndefined();
  });
});

describe('the morning answered from the Home Screen', () => {
  const none = lesson('2026-10-19');
  const tap = new Date(2026, 9, 20, 7, 5).getTime();
  it('writes Free of it once, for a morning not answered yet', () => {
    const kept = [{ told: 'free', toldK: tk, toldAt: tap }, { told: 'free', toldK: tk, toldAt: tap - 9 }, { line: 'x' }];
    expect(core.widgetTold(none, st, kept, tk)).toEqual([{ k: tk, at: tap }]);
    const told = core.answerNight(none, st, tk, 'slip', tap + 60000);
    expect(core.widgetTold(told, st, kept, tk)).toEqual([]);
  });
  it('never writes a slip, a stale day, or a day after today', () => {
    expect(core.widgetTold(none, st, [{ told: 'slip', toldK: tk, toldAt: tap }], tk)).toEqual([]);
    expect(core.widgetTold(none, st, [{ told: 'free', toldK: '2026-10-17', toldAt: tap }], tk)).toEqual([]);
    expect(core.widgetTold(none, st, [{ told: 'free', toldK: '2026-10-21', toldAt: tap }], tk)).toEqual([]);
  });
});

describe('the widget ask', () => {
  it('comes once, from day 3, on a fed day, never right after a slip, and not once it is on a screen', () => {
    const k3 = '2026-10-03';
    const t3 = new Date(2026, 9, 3, 12).getTime();
    expect(core.widgetAskDue(lesson(k3), st, k3, t3)).toBe(true);
    expect(core.widgetAskDue(lesson('2026-10-02'), st, '2026-10-02', t3 - 864e5)).toBe(false);
    expect(core.widgetAskDue({}, st, k3, t3)).toBe(false);
    expect(core.widgetAskDue(lesson(k3), core.normSettings({ ...st, widget: k3 }), k3, t3)).toBe(false);
    expect(core.widgetAskDue(lesson(k3), { ...st, widgetAsk: k3 }, k3, t3)).toBe(false);
    const slip = core.addEvent(lesson(k3), '2026-10-02', 'slipped', '23:00', {}, 1).days;
    expect(core.widgetAskDue(slip, st, k3, t3)).toBe(false);
  });
  it('says the points it earns, plainly', () => {
    expect(core.WIDGET_ASK.pts).toContain(String(core.WIDGET_PTS));
    expect(JSON.stringify(core.WIDGET_ASK)).not.toMatch(/n't|porn|addict/i);
  });
});
