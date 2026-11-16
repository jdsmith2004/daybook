/* Friends (beta): what a friend can ever see is fixed in the shape (src/friends.ts). */
import { describe, expect, it } from 'vitest';

import {
  cardForFriend,
  friendLines,
  friendToday,
  codeText,
  inviteText,
  normCard,
  normCode,
  reportAt,
  SHARE_DEFAULT,
  SHARE_KEYS,
  showCode,
  VALS_FRESH,
  wordsTrouble,
} from '../src/friends';

describe('a card', () => {
  it('keeps numbers only for what is on, and nothing outside the shape', () => {
    const c = normCard({
      name: '  Sam  ',
      goals: ['A goal'],
      on: { lessons: true, slips: true },
      vals: { lessons: 3, rode: 2, slips: 4, dk: '2026-11-15', dl: 1, dc: 1 },
      rt: '21:00',
      at: 5,
      journal: 'x',
    })!;
    expect(c).toEqual({ name: 'Sam', on: { lessons: true }, vals: { lessons: 3, dk: '2026-11-15', dl: 1 }, rt: '21:00', at: 5 });
    expect(normCard({ name: 'Sam', rt: '25:00' })!.rt).toBeNull();
  });
  it('shares the lessons, check-ins, days and flame by default, never urges until turned on', () => {
    expect(SHARE_DEFAULT).toEqual({ lessons: true, checkins: true, days: true, level: true });
  });
  it('says today only when the numbers are from today', () => {
    expect(friendToday({ dk: '2026-11-15', dl: 1, dc: 1 }, '2026-11-15')).toBe('Did a lesson · Checked in');
    expect(friendToday({ dk: '2026-11-14', dl: 1 }, '2026-11-15')).toBe('');
    expect(reportAt('21:00')).toBe('9 PM');
    expect(reportAt('08:00')).toBe('8 AM');
  });
  it('a friend gets fresh numbers only, and the flame always', () => {
    const c = normCard({ name: 'Sam', on: { lessons: true, level: true }, vals: { lessons: 3, level: 4, lname: 'Ember' }, at: 1000 })!;
    expect(cardForFriend(c, 1000).vals).toEqual({ lessons: 3, level: 4, lname: 'Ember' });
    expect(cardForFriend(c, 1000 + VALS_FRESH + 1).vals).toEqual({ level: 4, lname: 'Ember' });
  });
  it('has no item about slips', () => {
    expect(SHARE_KEYS.join(' ')).not.toMatch(/slip|count|journal/);
  });
  it('refuses links, phone numbers and crude words, but not names that only contain one', () => {
    expect(wordsTrouble('see me at x.com')).toBeTruthy();
    expect(wordsTrouble('mail me a@b')).toBeTruthy();
    expect(wordsTrouble('555 123 4567')).toBeTruthy();
    expect(wordsTrouble('Dickson')).toBeNull();
    expect(wordsTrouble('Walk past the peacocks')).toBeNull();
    expect(normCard({ name: 'x.com' })).toBeNull();
  });
  it('a quiet week says nothing, never zero', () => {
    expect(friendLines({ lessons: 0, rode: 2 })).toEqual(['Rode out 2 urges']);
  });
});

describe('codes', () => {
  it('reads a code however it is typed or pasted', () => {
    expect(normCode('k7q-m2p')).toBe('K7QM2P');
    expect(normCode('https://x.net/friends?code=K7QM2P')).toBe('K7QM2P');
    expect(normCode('K7QM2')).toBeNull();
    expect(normCode('K7QM2O')).toBeNull();
    expect(showCode('K7QM2P')).toBe('K7Q-M2P');
  });
  it('the invite never names the habit', () => {
    expect(inviteText('Sam', 'https://x/friends?code=K7QM2P', 'K7QM2P')).not.toMatch(/porn|addict|habit|quit|slip|urge/i);
    expect(codeText('Sam', 'K7QM2P')).not.toMatch(/porn|addict|habit|quit|slip|urge/i);
  });
});
