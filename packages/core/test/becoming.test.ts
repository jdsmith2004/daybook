/* Who I am becoming (the end of setup, Today, SOS) and the "From you" line in SOS. */
import { expect, it } from 'vitest';
import * as core from '../src/index';

const tk = '2026-10-15';

it('a new person starts with no sentence, and an old settings record gets an empty one', () => {
  expect(core.defaultSettings(tk).becoming).toBe('');
  expect(core.normSettings({ v: 1, start: '2026-09-01', day1: null, rollover: 4, screensOff: '23:00', u: 1 }).becoming).toBe('');
  expect(core.normSettings({ becoming: 7 }).becoming).toBe('');
});

it('setup asks it after the safe person and before the plan', () => {
  const ids = core.obPages({}).map((p) => p.id);
  expect(ids.indexOf('becoming')).toBe(ids.indexOf('person') + 1);
  expect(ids.indexOf('review')).toBe(ids.indexOf('becoming') + 1);
});

it('the sentence is one trimmed line, and saving puts it in settings', () => {
  expect(core.obBecoming({ be: '  I am   someone\nwho shows up.  ' })).toBe('I am someone who shows up.');
  expect(core.obBecoming({ be: 'x'.repeat(400) }).length).toBe(core.BE_LEN);
  const ch = core.obChanges({ be: core.OB_BE[1] }, null, tk).find((c) => c.k === 'be');
  expect(ch?.to).toBe(core.OB_BE[1]);
  const r = core.obSave({ be: core.OB_BE[1] }, null, null, tk, 0);
  expect(r.st.becoming).toBe(core.OB_BE[1]);
});

it('a walk-through again starts from the sentence and only offers a change when it is different', () => {
  const st = core.normSettings({ ...core.defaultSettings(tk), becoming: core.OB_BE[0] });
  expect(core.obPrefill(st).be).toBe(core.OB_BE[0]);
  expect(core.obChanges({ be: core.OB_BE[0] }, st, tk).some((c) => c.k === 'be')).toBe(false);
  expect(core.obChanges({ be: '' }, st, tk).some((c) => c.k === 'be')).toBe(false);
  const ch = core.obChanges({ be: 'I am someone who rests well.' }, st, tk).find((c) => c.k === 'be');
  expect([ch?.from, ch?.to]).toEqual([core.OB_BE[0], 'I am someone who rests well.']);
});

it('the starter sentences say who the person is, with no contractions', () => {
  core.OB_BE.forEach((x) => {
    expect(x).toMatch(/^I am /);
    expect(x).not.toMatch(/'/);
  });
});

it('SOS shows the calm-day note first, or else one of the reasons', () => {
  const st = core.defaultSettings(tk);
  st.reasons = ['One', 'Two', ' '];
  expect(core.urFromYou(st, 0)).toEqual({ k: 'reason', cap: 'Your reason', t: 'One' });
  expect(core.urFromYou(st, 0.99)?.t).toBe('Two');
  expect(core.urFromYou(st, 1)?.t).toBe('Two');
  st.note = ' It passes. ';
  expect(core.urFromYou(st, 0.5)).toEqual({ k: 'note', cap: 'From you, on a calm day', t: 'It passes.' });
  st.note = '';
  st.reasons = [];
  expect(core.urFromYou(st, 0.5)).toBeNull();
});
