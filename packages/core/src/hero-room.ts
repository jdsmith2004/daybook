/* Where the flame stands in Today's sky, so the words under it are always on the hills and never on the sky.

   The number, its label, the week's marks and the level sit along the bottom of the sky, on the drawing's own hills, in the hills'
   ink. The hills come with the flame's drawing, so where their edge falls depends on the form (the tall forms stand lower), the
   flame's size and the sky's height. If the edge rises into the words, the words sit half on the sky in an ink made for the hills
   and cannot be read (the owner, November 14, 2026: "that 35 is extrememly hard to read that can't keep happeneing").

   So the flame is placed from the words, not the other way round: the flame and its hills rise until the hills' highest point is
   above the top of the words with room to spare. The flame keeps its size; only its place changes. A long day's list (skyTrim)
   slides the whole scene and the words together, so it never changes this. */
import { emblemScene, luminance } from './emblem';
import { fireOf } from './flame-fire';
import { formOfLevel } from './levels';
import { PHASE_SKY, type SkyPhase } from './two-moments';

/** the sky's height, clock included, at its most and its least */
export const SKY_MAX = 470;
export const SKY_MIN = 300;
/** the two quiet buttons, the big card and the two rows under the sky, with their gaps, and the room the round SOS takes */
export const SKY_BELOW = 16 + 48 + 16 + 116 + 8 + 52 + 8 + 52 + 34;
/** the number and the level along the bottom */
export const FOOT = 86;
/** the words' bottom edge, up from the bottom of the sky */
export const HERO_WORDS_PAD = 18;
/** the room kept between the hills' highest point and the top of the words */
export const HERO_WORDS_GAP = 8;
/** the words on the hills at their tallest: the label and the week's marks (24), the number (48), the line under it (18), at the
    largest text size they take on the picture (hero.tsx ON_ART, 1.15) */
export const HERO_WORDS_MAX = Math.ceil((24 + 48 + 18) * 1.15);
/** how far a form stands below the hills' line, as a share of its drawing: the torch and the beacon are tall and narrow enough to
    pass between the words; the kindling's and the campfire's logs are wide, so they stay clear above them */
export const FORM_SINK: Record<number, number> = { 1: -0.02, 2: 0, 3: 0.11, 4: 0.08 };
/** the empty room at the top of a level's drawing, over the fire as it licks (between its tip at rest and the most it can reach on a
    tap), as a share of the drawing. The torch's and the sun's fires reach much higher than the campfire's, so each form has its own. */
const heads = new Map<number, number>();
export function figHead(level: number): number {
  let h = heads.get(level);
  if (h == null) {
    const f = fireOf(level, formOfLevel(level) !== 0);
    h = Math.max(0, (f.tip.y + f.box.y) / 2) / 120;
    heads.set(level, h);
  }
  return h;
}

/** the sky's height and the flame's drawing inside it, for a screen this tall and wide. extra: the quiet lines under the next step;
    tabs: the tab bar's height where the bottom safe area does not already count it */
export function todaySize(height: number, width: number, top: number, bottom: number, extra = 0, tabs = 0): { sky: number; flame: number } {
  const sky = Math.round(Math.max(SKY_MIN, Math.min(SKY_MAX, height - SKY_BELOW - tabs - bottom - extra)));
  /* the drawing has room around the figure, so its top runs up to the clock and no further */
  const flame = Math.round(Math.min(width, sky - top - FOOT + 18));
  return { sky, flame };
}

/** the highest the hills reach in a level's drawing (120 units tall), or null with no hills. Taken from every point of every hill's
    outline, control points included: a curve never passes outside them, so the true edge is never higher than this. */
export function landTop(level: number): number | null {
  const land = emblemScene(level).land;
  if (!land) return null;
  let top = Infinity;
  for (const d of land.matchAll(/d="([^"]+)"/g)) {
    /* the numbers after M, C and S come in x y pairs; H moves only x and V only y */
    for (const seg of d[1].matchAll(/([MCSHVLZ])([^MCSHVLZ]*)/g)) {
      const nums = (seg[2].match(/-?[\d.]+/g) || []).map(Number);
      if (seg[1] === 'V') nums.forEach((y) => (top = Math.min(top, y)));
      else if (seg[1] !== 'H') for (let i = 1; i < nums.length; i += 2) top = Math.min(top, nums[i]);
    }
  }
  for (const r of land.matchAll(/<rect[^>]* y="([\d.]+)"/g)) top = Math.min(top, Number(r[1]));
  return top === Infinity ? null : top;
}

/** where the flame stands in a sky this tall, so the hills' highest point is clear above the words and the fire's tip stays under
    the clock. words: the height of the taller block of words along the bottom. top: the clock's room. The flame rises as far as
    the room over its fire allows; where a tall form on a short sky needs more than that (the torch on a small phone), the sky grows
    by the rest, a little, and the flame keeps its size (CLAUDE.md, "The flame is the heart of the app"). Returns the sky's height
    and the top of the flame's drawing in it. */
export function heroFit(o: { sky: number; flame: number; level: number; words: number; top: number }): { sky: number; top: number } {
  const { flame, level, words, top } = o;
  const base = o.sky - flame - FOOT + 18 + Math.round(flame * (FORM_SINK[formOfLevel(level)] ?? 0.03));
  const lt = landTop(level);
  if (lt == null) return { sky: o.sky, top: base };
  const ground = base + (lt * flame) / 120;
  const lift = Math.max(0, Math.ceil(ground - (o.sky - HERO_WORDS_PAD - words - HERO_WORDS_GAP)));
  /* how far it can rise before the tip of its fire goes under the clock */
  const room = Math.max(0, Math.floor(base + flame * figHead(level) - top - 6));
  const grow = Math.max(0, lift - room);
  return { sky: o.sky + grow, top: base + grow - lift };
}

/** the hills' highest point in the sky, for a flame placed by heroFit */
export const groundLine = (top: number, flame: number, level: number): number => top + ((landTop(level) ?? 120) * flame) / 120;

/** how far apart two colors read (WCAG contrast ratio, 1 to 21) */
export const contrast = (a: string, b: string): number => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
/** the least contrast the words along the bottom of the sky ever get: the line for small text (WCAG AA) */
export const WORDS_CONTRAST = 4.5;
const INK_LIGHT = '#FFFFFF';
const INK_DARK = '#14112E';

/** what is behind the words along the bottom: every layer of the hills, or with none, the bottom of the sky (the hour's, when given) */
export function wordsBack(level: number, phase?: SkyPhase | null): string[] {
  const sc = emblemScene(level);
  if (sc.land) return [...sc.land.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]);
  return [phase ? PHASE_SKY[phase].sky[2] : sc.sky[2]];
}

/** the colors of the words along the bottom of the sky: whichever ink reads better on everything behind them, and a softer one for
    the small words that is used only while it still reads (else the small words take the ink too). Never the sky's top, which is
    another color at dawn and dusk (a white number on the peach bottom of the dawn sky could not be read). */
export function wordsInk(level: number, phase?: SkyPhase | null): { light: boolean; ink: string; soft: string } {
  const back = wordsBack(level, phase);
  const least = (c: string) => Math.min(...back.map((b) => contrast(c, b)));
  const light = least(INK_LIGHT) >= least(INK_DARK);
  const ink = light ? INK_LIGHT : INK_DARK;
  const want = light ? '#DCD3FF' : emblemScene(level).land ? INK_DARK : '#3D3670';
  return { light, ink, soft: least(want) >= WORDS_CONTRAST ? want : ink };
}
