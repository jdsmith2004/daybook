/* The crisis line for where the person is (crisis.ts, November 12, 2026): 988 in the US and Canada, Samaritans in the UK and
   Ireland, Lifeline in Australia, 1737 in New Zealand, and 988 when the phone does not say. */
import { describe, expect, it } from 'vitest';
import { crisisLine, crisisRegion, gamblingLine, textLine } from '../src/index';

describe('crisisRegion', () => {
  it('reads a country code or a locale tag', () => {
    expect(crisisRegion('US')).toBe('us');
    expect(crisisRegion('ca')).toBe('ca');
    expect(crisisRegion('en-GB')).toBe('uk');
    expect(crisisRegion('en_IE')).toBe('uk');
    expect(crisisRegion('en-AU')).toBe('au');
    expect(crisisRegion('mi-NZ')).toBe('nz');
    expect(crisisRegion('fr-CA')).toBe('ca');
    expect(crisisRegion('zh-Hant-TW')).toBe('us');
    expect(crisisRegion('es-PR')).toBe('us');
  });
  it('falls back to 988 when the phone does not say, or the place has no line here', () => {
    for (const c of [undefined, null, '', 'en', 'DE', 'de-DE', 'garbage']) expect(crisisLine(c).dial).toBe('988');
  });
});

describe('crisisLine', () => {
  it('gives the number that answers there', () => {
    expect(crisisLine('US')).toMatchObject({ dial: '988', how: 'Call or text 988', text: true });
    expect(crisisLine('CA')).toMatchObject({ dial: '988', text: true });
    expect(crisisLine('GB')).toMatchObject({ name: 'Samaritans', num: '116 123', dial: '116123', how: 'Call 116 123', text: false });
    expect(crisisLine('IE').dial).toBe('116123');
    expect(crisisLine('AU')).toMatchObject({ name: 'Lifeline', num: '13 11 14', dial: '131114', text: false });
    expect(crisisLine('NZ')).toMatchObject({ dial: '1737', how: 'Call or text 1737', text: true });
  });
  it('only says text where the line takes texts', () => {
    for (const c of ['US', 'CA', 'GB', 'AU', 'NZ']) {
      const l = crisisLine(c);
      expect(/text/i.test(l.how)).toBe(l.text);
      expect(l.dial).toMatch(/^\d+$/);
      expect(l.site.url).toMatch(/^https:\/\//);
    }
  });
  it('keeps the word rules: no contractions', () => {
    for (const c of ['US', 'CA', 'GB', 'AU', 'NZ']) {
      const l = crisisLine(c);
      for (const w of [l.how, l.sub, l.note]) expect(w).not.toMatch(/\b\w+'(t|s|re|ll|ve|d)\b/);
    }
  });
});

describe('textLine and gamblingLine', () => {
  it('shows a text line only where it answers', () => {
    expect(textLine('US')?.num).toBe('741741');
    expect(textLine('GB')?.num).toBe('85258');
    expect(textLine('IE')).toBeNull();
    expect(textLine('AU')).toBeNull();
    expect(textLine('NZ')).toBeNull();
    expect(textLine('CA')).toBeNull();
    expect(textLine(undefined)?.num).toBe('741741');
  });
  it('gives the national gambling helpline where there is one', () => {
    expect(gamblingLine('US')?.dial).toBe('1-800-697-3738');
    expect(gamblingLine('GB')?.dial).toBe('08088020133');
    expect(gamblingLine('AU')?.dial).toBe('1800858858');
    expect(gamblingLine('NZ')?.dial).toBe('0800654655');
    expect(gamblingLine('IE')).toBeNull();
    expect(gamblingLine('CA')).toBeNull();
  });
});
