/* What Daybook learns: only names and values on the list, never a word typed, the queue, the batch and the server's check. */
import { describe, expect, it } from 'vitest';
import { EV_BATCH, EV_KEEP, EV_NAMES, EV_PROPS, evAdd, evBatch, evHrsBand, evLang, evNew, evNorm, evProps, evSent, eventsClean } from '../src/events';

const D0 = '2026-11-09';
const HEX = '0123456789abcdef0123456789abcdef';
const fresh = () => evNew(D0, HEX);

describe('events', () => {
  it('keeps the name, the days since install and the hour, never the time', () => {
    let s = fresh();
    s = evAdd(s, 'sos_open', '2026-11-12', 23.9, { from: 'today' });
    expect(s.q).toEqual([{ n: 'sos_open', d: 3, h: 23, p: { from: 'today' } }]);
  });

  it('drops a name not on the list', () => {
    const s = evAdd(fresh(), 'nope' as never, D0, 9);
    expect(s.q).toEqual([]);
  });

  it('never lets a typed word through: strings only from their list', () => {
    const p = evProps({ trigger: 'my wife left', lesson: 'I feel awful', route: 'journal?text=secret', note: 'hello', str: 7 });
    /* trigger has "other"; lesson does not, so it is dropped; route has "other"; note is not a key */
    expect(p).toEqual({ trigger: 'other', route: 'other', str: 7 });
    for (const v of Object.values(p)) expect(String(v)).not.toMatch(/wife|awful|secret|hello/);
  });

  it('holds numbers to their range and rounds them', () => {
    expect(evProps({ str: 99, secs: -5, ix: 2.6, mood: 'x', acct: 'yes', sup: true })).toEqual({ str: 10, secs: 0, ix: 3, sup: true });
  });

  it('every key has a check, and every string list is free of spaces', () => {
    for (const [k, p] of Object.entries(EV_PROPS)) {
      expect(k).toMatch(/^[a-z0-9]+$/);
      if ('one' in p) for (const v of p.one()) expect(v).toMatch(/^[a-z0-9_.-]{1,40}$/);
    }
    expect(Object.keys(EV_NAMES).length).toBeGreaterThan(30);
  });

  it('keeps the newest when too many wait, and sends the oldest first', () => {
    let s = fresh();
    for (let i = 0; i < EV_KEEP + 5; i++) s = evAdd(s, 'screen', D0, 10, { route: 'today' });
    expect(s.q.length).toBe(EV_KEEP);
    const { b, upTo } = evBatch(s, 'ios', '1.4.0')!;
    expect(b.i).toBe(HEX);
    expect(b.e.length).toBe(EV_BATCH);
    /* the queue is full: one more lets the oldest go while the batch is on its way */
    s = evAdd(s, 'open', D0, 11);
    s = evSent(s, upTo);
    expect(s.q.length).toBe(EV_KEEP - EV_BATCH + 1);
    expect(s.q[s.q.length - 1].n).toBe('open');
    /* sent twice: nothing more comes off */
    expect(evSent(s, upTo)).toBe(s);
  });

  it('nothing to send is null', () => {
    expect(evBatch(fresh(), 'web', '1')).toBeNull();
  });

  it('a state read back is made safe', () => {
    expect(evNorm(null, D0, HEX)).toEqual(fresh());
    expect(evNorm({ id: 'bad', first: D0, q: [], at: 0 }, D0, HEX).id).toBe(HEX);
    const s = evNorm(
      {
        id: HEX,
        first: D0,
        q: [
          { n: 'open', d: 1, h: 5 },
          { n: 'x', d: 1, h: 5 },
          { n: 'urge', d: 1, h: 40 },
        ],
      },
      D0,
      HEX,
    );
    expect(s.q).toEqual([{ n: 'open', d: 1, h: 5 }]);
  });
});

describe('the server check', () => {
  it('takes a good batch and cleans it', () => {
    const b = eventsClean({ i: HEX, p: 'android', v: '1.4.0', e: [{ n: 'urge', d: 2, h: 22, p: { str: 8, trigger: 'lonely', words: 'x' } }] });
    expect(b).toEqual({ i: HEX, p: 'android', v: '1.4.0', e: [{ n: 'urge', d: 2, h: 22, p: { str: 8, trigger: 'lonely' } }] });
  });

  it('refuses a batch with no id, a bad id, no platform or nothing left', () => {
    const e = [{ n: 'open', d: 0, h: 1 }];
    expect(eventsClean({ p: 'ios', v: '1', e })).toBeNull();
    expect(eventsClean({ i: 'someone@example.com', p: 'ios', v: '1', e })).toBeNull();
    expect(eventsClean({ i: HEX, p: 'mac', v: '1', e })).toBeNull();
    expect(eventsClean({ i: HEX, p: 'ios', v: '1', e: [{ n: 'zzz', d: 0, h: 1 }] })).toBeNull();
  });

  it('takes at most one batch of events', () => {
    const e = Array.from({ length: EV_BATCH + 50 }, () => ({ n: 'open', d: 0, h: 1 }));
    expect(eventsClean({ i: HEX, p: 'ios', v: '1', e })!.e.length).toBe(EV_BATCH);
  });
});

describe('bands', () => {
  it('language and hours since the last slip', () => {
    expect(evLang('es-MX')).toBe('es');
    expect(evLang('xx')).toBe('other');
    expect(evLang(null)).toBe('other');
    expect([null, 3, 30, 100, 200, 1000].map(evHrsBand)).toEqual(['first', 'h0_24', 'd1_3', 'd4_7', 'd8_30', 'd31']);
  });
});
