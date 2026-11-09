/* The flame on the Home Screen and the Lock Screen (flame-widget.ts). Every day here is made up. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const tk = '2026-10-20';
const now = new Date(2026, 9, 20, 9, 0).getTime();
const st = core.normSettings({ start: '2026-10-01', day1: '2026-10-01', cleanMode: 'gentle' });
const lesson = (k: string): Days => ({ [k]: core.normDay({ p: { ls: ['l1'] } }, k) });

describe('the widget', () => {
  it('dims on its own over the coming days while nothing is done, and stops once it is down to embers', () => {
    const t = core.widgetTimeline(lesson(tk), st, tk, now);
    expect(t.map((e) => e.state)).toEqual(['lit', 'warn', 'dim', 'embers']);
    expect(t[0].at).toBe(now);
    /* each change at the start of its day */
    expect(new Date(t[1].at).getDate()).toBe(22);
    expect(new Date(t[3].at).getDate()).toBe(24);
    expect(t.map((e) => e.low)).toEqual([0, 0, core.LOW_OF[1], core.LOW_OF[3]]);
  });

  it('shows how it burns now, and is never dimmed in the hours after a slip', () => {
    expect(core.widgetTimeline(lesson('2026-10-15'), st, tk, now)[0]).toMatchObject({ state: 'embers', line: 'Down to embers' });
    const slip = core.addEvent(lesson('2026-10-10'), '2026-10-19', 'slipped', '23:00', {}, 1).days;
    expect(core.widgetTimeline(slip, st, tk, now)[0].state).toBe('lit');
  });

  it('never says what Daybook is for, and shows no count', () => {
    for (const line of Object.values(core.WIDGET_LINE)) expect(line).not.toMatch(/\d|porn|habit|slip|clean|sober|addict|urge/i);
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

describe('the widget unlock', () => {
  it('comes on day 14, after the other unlocks, and says the points it earns', () => {
    expect(core.WIDGET_UNLOCK_DAY).toBe(14);
    expect(core.WIDGET_UNLOCK.say).toContain(String(core.WIDGET_PTS));
    expect(JSON.stringify(core.WIDGET_UNLOCK)).not.toMatch(/n't|porn|addict/i);
  });
});
