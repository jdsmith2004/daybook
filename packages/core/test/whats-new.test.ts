/* What's new: once after an update, never for someone who just installed, never before setup, never in a hard hour or on
   top of something else, and only what is new since the version last seen, three items at most. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-11-02';
const noon = new Date(2026, 10, 2, 12, 0).getTime();
const st = core.normSettings(core.defaultSettings('2026-10-01'));
const near = (o: Partial<core.NewNear> = {}): core.NewNear => ({ st, days: {}, now: noon, sos: null, back: false, busy: false, ...o });
const item = (t: string): core.NewItem => ({ t, line: t + '.' });
const list = [
  { v: '1.6.0', items: [item('f'), item('g')] },
  { v: '1.5.0', items: [item('d'), item('e')] },
  { v: '1.4.0', items: [item('a'), item('b'), item('c')] },
];

it('compares versions part by part', () => {
  expect(core.verCmp('1.3.0', '1.3.1')).toBe(-1);
  expect(core.verCmp('1.10.0', '1.9.9')).toBe(1);
  expect(core.verCmp('1.3', '1.3.0')).toBe(0);
});

it('a new install, and anyone before or during setup, never sees it: the version is kept as seen', () => {
  expect(core.whatsNew(null, '1.4.0', near({ st: null }), list)).toEqual({ k: 'keep' });
  expect(core.whatsNew('1.3.0', '1.4.0', near({ st: null }), list)).toEqual({ k: 'keep' });
  expect(core.whatsNew('1.4.0', '1.4.0', near({ st: null }), list)).toEqual({ k: 'none' });
  /* so the first open after setup has nothing to show */
  expect(core.whatsNew('1.4.0', '1.4.0', near(), list)).toEqual({ k: 'none' });
});

it('after an update, it shows what the new version added, once', () => {
  expect(core.whatsNew('1.3.0', '1.4.0', near(), list)).toEqual({ k: 'show', items: [item('a'), item('b'), item('c')] });
  expect(core.whatsNew('1.4.0', '1.4.0', near(), list)).toEqual({ k: 'none' });
});

it('someone with a log and no version kept updated from the version before this page existed', () => {
  expect(core.NEW_BASE).toBe('1.3.0');
  expect(core.whatsNew(null, '1.4.0', near(), list).k).toBe('show');
  expect(core.whatsNew(null, core.NEW_BASE, near(), list)).toEqual({ k: 'keep' });
});

it('several versions skipped: only what is new since the last one seen, newest first, three at most', () => {
  expect(core.whatsNew('1.3.0', '1.6.0', near(), list)).toEqual({ k: 'show', items: [item('f'), item('g'), item('d')] });
  expect(core.whatsNew('1.5.0', '1.6.0', near(), list)).toEqual({ k: 'show', items: [item('f'), item('g')] });
  /* nothing from a version newer than the app */
  expect(core.newSince('1.3.0', '1.5.0', list).map((x) => x.t)).toEqual(['d', 'e', 'a']);
});

it('a version with nothing written for it is kept quietly', () => {
  expect(core.whatsNew('1.6.0', '1.6.1', near(), list)).toEqual({ k: 'keep' });
  /* and an older version (a downgrade or a test build) is never shown anything */
  expect(core.whatsNew('1.6.0', '1.5.0', near(), list)).toEqual({ k: 'keep' });
});

it('waits in the hours after an SOS', () => {
  expect(core.whatsNew('1.3.0', '1.4.0', near({ sos: noon - 3600_000 }), list)).toEqual({ k: 'wait' });
  expect(core.whatsNew('1.3.0', '1.4.0', near({ sos: noon - (core.TIP_QUIET + 1) * 3600_000 }), list).k).toBe('show');
});

it('waits after a slip: in the hours after it, and for the rest of that day', () => {
  const late = core.addEvent({}, core.addDays(tk, -1), 'slipped', '23:30').days;
  expect(core.whatsNew('1.3.0', '1.4.0', near({ days: late, now: new Date(2026, 10, 2, 1, 0).getTime() }), list)).toEqual({ k: 'wait' });
  const morning = core.addEvent({}, tk, 'slipped', '08:00').days;
  expect(core.whatsNew('1.3.0', '1.4.0', near({ days: morning }), list)).toEqual({ k: 'wait' });
  const yesterday = core.addEvent({}, core.addDays(tk, -1), 'slipped', '08:00').days;
  expect(core.whatsNew('1.3.0', '1.4.0', near({ days: yesterday }), list).k).toBe('show');
});

it('waits on the day the person came back, and while anything else is on the screen', () => {
  expect(core.whatsNew('1.3.0', '1.4.0', near({ back: true }), list)).toEqual({ k: 'wait' });
  expect(core.whatsNew('1.3.0', '1.4.0', near({ busy: true }), list)).toEqual({ k: 'wait' });
});

it('every entry is short, plain and has no contractions, with one to five items', () => {
  for (const e of core.WHATS_NEW) {
    expect(e.items.length).toBeGreaterThan(0);
    expect(e.items.length).toBeLessThanOrEqual(5);
    for (const x of e.items) {
      expect(x.t.length).toBeLessThanOrEqual(42);
      expect(x.line.length).toBeLessThanOrEqual(130);
      expect(x.t + ' ' + x.line).not.toMatch(/\w'\w|\w’\w/);
    }
  }
  const vs = core.WHATS_NEW.map((e) => e.v);
  expect([...vs].sort((a, b) => core.verCmp(b, a))).toEqual(vs);
  expect(core.verCmp(vs[vs.length - 1], core.NEW_BASE)).toBe(1);
});
