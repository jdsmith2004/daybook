/* The flame spirit for native screens. The legacy emblem is an SVG string made for the web, with CSS classes that animate it.
   react-native-svg draws the same shapes from the string; it ignores classes, so the native flame is still, and the size
   comes from the component instead of an inline style. */
import { Em } from './legacy/core.js';

/** the flame for a level on the 60-level ladder. locked: a form not reached yet, drawn faded */
export function emblemXml(level: number, locked = false): string {
  return Em.emblem(level, { still: true, locked })
    .replace(/ style="width:\d+px;height:\d+px"/, '')
    .replace(/ style="[^"]*"/g, '')
    .replace(/ class="[^"]*"/g, '')
    .replace(/ aria-hidden="true"/g, '')
    .replace(/ focusable="false"/g, '');
}

/** the ids in an emblem change on every call (em1, em2, ...). Tests compare emblems with the ids made the same. */
export const sameIds = (svg: string) => svg.replace(/\bem\d+/g, 'emX');

/* ---------- the flame in its own sky (the top of Today) ---------- */
/** the flame for the top of Today: the same drawing with its round frame softened away, so it melts into a card painted in
    its own sky. sky: top to bottom. ground: the color of its hills, when it has hills. ink: the words on the picture,
    light on a dark sky or hills and dark on a bright one. stars: a night sky. The full suns have no sky of their own;
    they shine in a clear day sky. */
export interface EmblemScene {
  xml: string;
  sky: [string, string, string];
  ground: string | null;
  ink: 'light' | 'dark';
  stars: boolean;
}
const DAY_SKY: [string, string, string] = ['#3FA2FF', '#86CCFF', '#CFEBFF'];
/** how bright a color looks, 0 to 1 */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function emblemScene(level: number): EmblemScene {
  let xml = emblemXml(level);
  const sk = /id="em\d+sk"[^>]*>((?:<stop[^>]*\/>)+)/.exec(xml);
  const stops = sk ? [...sk[1].matchAll(/stop-color="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]) : [];
  const sky: [string, string, string] = stops.length === 3 ? [stops[0], stops[1], stops[2]] : DAY_SKY;
  const g = /<path d="M-2 1\d\d[^"]*" fill="(#[0-9A-Fa-f]{6})"/.exec(xml);
  const cp = /clip-path="url\(#(em\d+)cp\)"/.exec(xml);
  if (cp) {
    const id = cp[1];
    xml = xml
      .replace(`clip-path="url(#${id}cp)"`, `mask="url(#${id}fm)"`)
      .replace(
        '</defs>',
        `<radialGradient id="${id}fg" cx="60" cy="60" r="58" gradientUnits="userSpaceOnUse"><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
          `<mask id="${id}fm" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120"><rect width="120" height="120" fill="url(#${id}fg)"/></mask></defs>`,
      )
      .replace(/<circle cx="60" cy="60" r="5\d(?:\.\d+)?" fill="none"[^>]*\/>/g, '');
  }
  const ground = g ? g[1] : null;
  return { xml, sky, ground, ink: luminance(ground || sky[2]) > 0.28 ? 'dark' : 'light', stars: luminance(sky[0]) < 0.08 };
}
