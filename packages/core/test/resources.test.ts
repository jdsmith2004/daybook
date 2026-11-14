import { describe, expect, it } from 'vitest';

import { isVideoId, LOVE_VIDEOS, loveEmbed } from '../src/resources';

describe('love videos', () => {
  it('every entry has a real video id, a short title and at most one short line', () => {
    expect(LOVE_VIDEOS.length).toBeGreaterThan(0);
    for (const v of LOVE_VIDEOS) {
      expect(isVideoId(v.id), v.id).toBe(true);
      expect(v.title.trim().length, v.id).toBeGreaterThan(0);
      expect(v.title.length, v.id).toBeLessThanOrEqual(48);
      if (v.note !== undefined) expect(v.note.trim().length, v.id).toBeGreaterThan(0);
      if (v.note !== undefined) expect(v.note.length, v.id).toBeLessThanOrEqual(80);
    }
  });
  it('lists each video once', () => {
    expect(new Set(LOVE_VIDEOS.map((v) => v.id)).size).toBe(LOVE_VIDEOS.length);
  });
  it('plays from the privacy-enhanced player', () => {
    expect(loveEmbed('iqGAW57EudQ')).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/iqGAW57EudQ\?/);
    expect(loveEmbed('iqGAW57EudQ')).toContain('rel=0');
  });
  it('turns away an address or a typo in place of an id', () => {
    expect(isVideoId('https://youtu.be/iqGAW57EudQ')).toBe(false);
    expect(isVideoId('iqGAW57Eud')).toBe(false);
  });
});
