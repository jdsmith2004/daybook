/* Lessons rewritten around a turn (lesson-turns.ts; the owner, November 2, 2026): each replaces its old self in place, turns one belief
   over, builds only on lessons already behind it, and its own-log line is true and plain. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { Days } from '../src/types';

const CONTRACTION = /\b\w+(?:n['’]t|['’](?:re|ve|ll|d|m))\b|\b(?:it|that|there|here|what|who|he|she|let)['’]s\b/i;
const turned = core.LESSONS.filter((L) => L.v === 3);

describe('turned lessons', () => {
  it('replace the old lesson in place: same id, same section, same place', () => {
    expect(turned.length).toBe(Object.keys(core.TURNS).length);
    Object.keys(core.TURNS).forEach((id) => {
      const L = core.lessonById(id)!;
      expect(L.v, id).toBe(3);
      expect(core.LESSON_IDS.indexOf(id), id).toBe(core.LESSONS.indexOf(L));
    });
  });
  it('each turns one thing over, and Quick keeps the turn', () => {
    turned.forEach((L) => {
      expect(L.cards.filter((c) => c.k === 'flip').length, L.id).toBe(1);
      const quick = core.lessonCards(L, 'q').map((c) => c.e);
      expect(quick, L.id).toEqual(expect.arrayContaining(['hook', 'answer', 'move', 'check']));
      L.cards.filter((c) => c.k === 'flip').forEach((c) => expect(c.see, L.id).toBeTruthy());
    });
  });
  it('a card that builds on an earlier lesson names one already behind it on the path', () => {
    const path = core.lessonPath();
    turned.forEach((L) =>
      L.cards.forEach((c) => {
        if (!c.back) return;
        const B = core.lessonById(c.back);
        expect(B, L.id + ' back ' + c.back).toBeTruthy();
        expect(path.indexOf(B!), L.id + ' builds on a lesson before it').toBeLessThan(path.indexOf(L));
      }),
    );
  });
  it('each fact points at one of its sources', () => {
    turned.forEach((L) => L.cards.forEach((c) => (c.fact?.i || []).forEach((i) => expect(L.src[i], L.id + ' source ' + i).toBeTruthy())));
  });
  it('the own-log line is true to the log, and plain', () => {
    const none: Days = {};
    const some = {
      '2026-10-01': { events: [{ id: 'a', time: '22:00', outcome: 'rode' }] },
      '2026-10-02': {
        events: [
          { id: 'b', time: '23:00', outcome: 'slipped' },
          { id: 'c', time: '23:30', outcome: 'rode' },
        ],
      },
      '2026-10-03': { events: [{ id: 'd', time: '22:30', outcome: 'rode' }] },
    } as unknown as Days;
    const st = core.normSettings(core.defaultSettings('2026-10-01'));
    const mine = (k: core.MineKind, d: Days, s0 = st) => core.lessonMine(k, d, s0, '2026-10-20');
    const kinds: core.MineKind[] = ['acted', 'rode', 'back', 'hour', 'trigger', 'clean30'];
    kinds.forEach((k) => [none, some].forEach((d) => expect(mine(k, d), k).not.toMatch(CONTRACTION)));
    expect(mine('rode', some)).toContain('3 urges');
    expect(mine('back', some)).toContain('1 slip,');
    expect(mine('acted', some)).toContain('4 honest entries');
    expect(mine('acted', none)).toContain('You opened this lesson');
    expect(mine('hour', some)).toContain('Your busiest hours');
    /* the log starts on October 1, and the slip on October 2 is the one day of 20 that did not hold */
    expect(mine('clean30', some)).toBe('19 of your last 20 days had no slip in them. Those days stay yours.');
    expect(mine('clean30', none, core.normSettings(core.defaultSettings('2026-10-17')))).toBe(
      'You are 4 days in. In a few weeks, this counts the days that held.',
    );
  });
});
