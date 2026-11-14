/* What the flame says in the setup: a line for the pages that need one, an answer for every one-tap pick, short enough for its bubble, and in
   the app's words (no contractions, none of the usual tells of machine writing). */
import { describe, expect, it } from 'vitest';
import { OB_CREED, OB_FAITH, OB_FREQ4, OB_HABIT, OB_PAGES, OB_REPLY, obReply, obSay } from '../src/index';

const CONTRACTION = /\b\w+(?:n['’]t|['’](?:re|ve|ll|d|m))\b|\b(?:it|that|there|here|what|who|he|she|let)['’]s\b/i;
const TELLS = /[—–;]|\b(?:journey|truly|deeply|you got this|you have got this|unlock|embrace|game[- ]changer)\b/i;
const MAX = 92;

const lines = [...OB_PAGES.map((p) => obSay(p.id)), obSay('hello', true), ...Object.values(OB_REPLY).flatMap((r) => Object.values(r))].filter(
  (x): x is string => !!x,
);

describe('the flame in the setup', () => {
  it('says hello, and something on every question that asks for a guess or a count', () => {
    for (const id of ['hello', 'habit', 'freq', 'when', 'for', 'faith', 'tonight', 'light', 'review']) expect(obSay(id), id).toBeTruthy();
    expect(obSay('hello', true)).not.toBe(obSay('hello'));
  });
  it('answers every one-tap pick', () => {
    const lists: [string, (string | number)[][]][] = [
      ['habit', OB_HABIT],
      ['freq', OB_FREQ4],
      ['faith', OB_FAITH],
      ['creed', OB_CREED],
    ];
    for (const [k, list] of lists) for (const o of list) expect(obReply(k, String(o[0])), k + ' ' + o[0]).toBeTruthy();
    expect(obReply('freq', null)).toBeNull();
    expect(obReply('nope', 'x')).toBeNull();
  });
  it('speaks in short, plain lines', () => {
    for (const w of lines) {
      expect(w.length, w).toBeLessThanOrEqual(MAX);
      expect(CONTRACTION.test(w), 'a contraction: ' + w).toBe(false);
      expect(TELLS.test(w), 'a tell: ' + w).toBe(false);
      expect(/[.?]$/.test(w), 'ends a sentence: ' + w).toBe(true);
    }
  });
  it('only speaks on pages that exist', () => {
    const ids = new Set(OB_PAGES.map((p) => p.id));
    for (const id of ['hello', 'habit', 'freq', 'when', 'for', 'faith', 'tonight', 'light', 'account']) expect(ids.has(id), id).toBe(true);
  });
});
