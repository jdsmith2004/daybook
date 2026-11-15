import { describe, expect, it } from 'vitest';

import { VOICES, voiceAt, voiceKey, voiceLines, voiceSaid, voiceUrl } from '../src/voice';

describe('Listen recordings (voice.ts)', () => {
  it('names a recording by its voice and words, the same every time', () => {
    const said = voiceSaid('A heading', 'Some **bold** words.', null);
    expect(said).toBe('A heading Some bold words.');
    expect(voiceKey(said)).toBe(voiceKey(said));
    expect(voiceKey(said)).toMatch(/^af_heart-[0-9a-z]+$/);
    expect(voiceKey(said, 'am_michael')).not.toBe(voiceKey(said));
    expect(voiceKey(said + '!')).not.toBe(voiceKey(said));
  });

  it('finds the word being said from the timing', () => {
    const t = { key: 'k', ms: 3000, w: [0, 200, 2, 900, 9, 1600] };
    expect(voiceAt(t, 100)).toBe(-1);
    expect(voiceAt(t, 200)).toBe(0);
    expect(voiceAt(t, 1000)).toBe(2);
    expect(voiceAt(t, 2900)).toBe(9);
  });

  it('lists every story card once per voice, each with a unique name', () => {
    for (const v of VOICES) {
      const lines = voiceLines(v.id);
      expect(lines.length).toBeGreaterThan(50);
      expect(new Set(lines.map((x) => x.key)).size).toBe(lines.length);
      for (const x of lines) {
        expect(x.key.startsWith(v.id + '-')).toBe(true);
        expect(x.said.length).toBeGreaterThan(x.h);
        expect(x.said[x.h]).toBe(' ');
      }
    }
  });

  it('keeps the recordings under /voice/ on the site', () => {
    expect(voiceUrl('https://x.net', 'af_heart-abc', 'm4a')).toBe('https://x.net/voice/af_heart-abc.m4a');
    expect(voiceUrl('', 'af_heart-abc', 'json')).toBe('/voice/af_heart-abc.json');
  });
});
