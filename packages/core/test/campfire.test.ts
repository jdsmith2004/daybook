/* The flame at its campfire (campfire.ts): the widget's and the Live Activity's picture. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';

const fig = core.emblemLayers(19, false)!.fig;
const sparks = (x: string) => (x.match(/url\(#cfspk\)/g) || []).length;

describe('the campfire', () => {
  it('holds the person’s own form, the logs and the sparks, with nothing react-native-svg cannot draw', () => {
    const x = core.campfireXml(fig, { stars: true });
    expect(x.startsWith('<svg viewBox="0 0 120 120">')).toBe(true);
    expect(x).toContain(fig.slice(fig.indexOf('<defs>') + 6, fig.indexOf('<defs>') + 60));
    expect(x).toContain('#6B3A22');
    expect(x).not.toMatch(/filter|class=/);
    expect(x.match(/<svg/g)).toHaveLength(1);
  });

  it('burns lower with the flame: fewer sparks, and cut in close for the Live Activity', () => {
    expect(sparks(core.campfireXml(fig, { lit: 0.3 }))).toBeLessThan(sparks(core.campfireXml(fig)));
    expect(core.campfireXml(fig, { close: true })).toMatch(/^<svg viewBox="16 18 88 88">/);
  });
});
