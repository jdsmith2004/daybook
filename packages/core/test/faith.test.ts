/* God in the lessons, by choice (faith.ts; the owner, November 2, 2026): the setup asks which faith after a Yes or a Somewhat,
   Settings can change both, and the God lessons speak in that faith's words. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const withA = (a: Record<string, string>) => core.normSettings({ ...core.defaultSettings('2026-11-01'), onb: { n: 1, at: 1, a, hist: [] } });

describe('the faith voice', () => {
  it('follows the answers: No leaves God out, and Yes or Somewhat speaks in the chosen faith', () => {
    expect(core.faithVoice(withA({ faith: 'no', creed: 'lds' }))).toBeNull();
    expect(core.faithVoice(withA({ faith: 'big', creed: 'lds' }))).toBe('lds');
    expect(core.faithVoice(withA({ faith: 'some', creed: 'christian' }))).toBe('christian');
    expect(core.faithVoice(withA({ faith: 'big', creed: 'other' }))).toBe('plain');
    /* answered before the question existed, or skipped: the plain voice until they choose */
    expect(core.faithVoice(withA({ faith: 'big' }))).toBe('plain');
    expect(core.faithVoice(withA({}))).toBe('plain');
  });
  it('the answer is kept, and junk is dropped', () => {
    expect(withA({ faith: 'big', creed: 'lds' }).onb!.a.creed).toBe('lds');
    expect('creed' in withA({ faith: 'big', creed: 'nope' }).onb!.a).toBe(false);
  });
  it('the setup asks which faith only after a Yes or a Somewhat', () => {
    const ids = (a: Record<string, string>) => core.obPages(a).map((p) => p.id);
    expect(ids({ faith: 'big' })).toContain('creed');
    expect(ids({ faith: 'some' })).toContain('creed');
    expect(ids({ faith: 'no' })).not.toContain('creed');
    expect(ids({ faith: 'big' }).indexOf('creed')).toBe(ids({ faith: 'big' }).indexOf('faith') + 1);
  });
  it('Settings changes it, and No takes the faith lessons off the path', () => {
    let st = withA({ faith: 'big', creed: 'lds' });
    st = core.setFaith(st, 'no', undefined, 5);
    expect(core.faithOut(st)).toBe(true);
    expect(st.onb!.a.creed).toBe('lds');
    st = core.setFaith(st, 'some', 'christian', 6);
    expect(core.faithVoice(st)).toBe('christian');
    const none = core.normSettings(core.defaultSettings('2026-11-01'));
    expect(core.setFaith(none, 'big', 'lds')).toBe(none);
  });
});
