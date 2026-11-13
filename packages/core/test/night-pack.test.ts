import { describe, expect, it } from 'vitest';

import { PACK_KINDS, packActs, packLit, packLitCount, packWords } from '../src/night-pack';

const at = 22 * 60 + 30;
describe('packActs', () => {
  it('waits only in the night, from tonight to 6 AM', () => {
    expect(packActs('wait', 22 * 60 + 29, at)).toBe(false);
    expect(packActs('wait', at, at)).toBe(true);
    expect(packActs('wait', 2 * 60, at)).toBe(true);
    expect(packActs('wait', 6 * 60, at)).toBe(false);
    expect(packActs('wait', 12 * 60, at)).toBe(false);
  });
  it('a night that starts after midnight', () => {
    expect(packActs('wait', 23 * 60 + 50, 30)).toBe(false);
    expect(packActs('wait', 31, 30)).toBe(true);
  });
  it('good night from an hour before tonight until 4 AM', () => {
    expect(packActs('bed', 21 * 60 + 29, at)).toBe(false);
    expect(packActs('bed', 21 * 60 + 30, at)).toBe(true);
    expect(packActs('bed', 3 * 60 + 59, at)).toBe(true);
    expect(packActs('bed', 4 * 60, at)).toBe(false);
    expect(packActs('bed', 23 * 60 + 40, 30)).toBe(true);
    expect(packActs('bed', 15 * 60, 30)).toBe(false);
  });
  it('the morning from 4 AM to noon', () => {
    expect(packActs('wake', 3 * 60 + 59, at)).toBe(false);
    expect(packActs('wake', 7 * 60, at)).toBe(true);
    expect(packActs('wake', 12 * 60, at)).toBe(false);
  });
});

describe('lights', () => {
  it('lit when said or seen', () => {
    const s = { said: { grey: true }, seen: { wait: 1 } };
    expect(packLit(s, 'grey')).toBe(true);
    expect(packLit(s, 'wait')).toBe(true);
    expect(packLit(s, 'bed')).toBe(false);
    expect(packLitCount(s)).toBe(2);
  });
  it('the words never name the habit', () => {
    for (const k of PACK_KINDS) {
      const w = packWords(k, '10:30 PM');
      expect(JSON.stringify(w)).not.toMatch(/porn|sex|adult|nofap/i);
    }
  });
});
