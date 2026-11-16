/* Friends (beta): what a friend can ever see is fixed in the shape (src/friends.ts). */
import { describe, expect, it } from 'vitest';

import { cardForFriend, friendLines, inviteText, normCard, normCode, SHARE_KEYS, showCode, VALS_FRESH, wordsTrouble } from '../src/friends';

describe('a card', () => {
  it('keeps numbers only for what is on, and nothing outside the shape', () => {
    const c = normCard({
      name: '  Sam  ',
      goals: ['A lesson a day', '', 'Walk at night', 'a fourth'],
      on: { lessons: true, slips: true },
      vals: { lessons: 3, rode: 2, slips: 4 },
      at: 5,
      journal: 'x',
    })!;
    expect(c).toEqual({ name: 'Sam', goals: ['A lesson a day', 'Walk at night', 'a fourth'], on: { lessons: true }, vals: { lessons: 3 }, at: 5 });
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
  });
});
