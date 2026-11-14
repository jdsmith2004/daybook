import { describe, expect, it } from 'vitest';

import { isVideoId, LOVE_KINDS, LOVE_VIDEOS, loveEmbed, loveGroups } from '../src/resources';

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
  it('every video is in exactly one group, and an empty group is left out', () => {
    const groups = loveGroups();
    expect(groups.flatMap((g) => g.videos).length).toBe(LOVE_VIDEOS.length);
    for (const g of groups) expect(g.videos.length).toBeGreaterThan(0);
    for (const v of LOVE_VIDEOS) if (v.kind) expect(LOVE_KINDS.map((k) => k.kind)).toContain(v.kind);
    expect(loveGroups([{ id: 'iqGAW57EudQ', title: 'A', kind: 'lift' }]).map((g) => g.kind)).toEqual(['lift']);
  });
});
