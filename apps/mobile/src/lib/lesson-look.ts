/* A lesson's colors. The sky goes from night to day as the lesson goes on (at night it ends on a warm dawn, not bright day); the answer
   is a whole card of sun, and a number is a solid violet card. Each look carries a full palette, given to everything inside through
   useTheme (PaletteOverride), so a button, a slider or a line of words needs no idea which card it is on. The owner's choice,
   October 30, 2026 (docs/plan.md, docs/lessons-review/). */
import { palettes, type Palette } from './theme';

export type LookKind = 'sky' | 'sun' | 'violet';
export interface Look {
  key: string;
  kind: LookKind;
  /** the background, top to bottom (the sun card leans) */
  colors: string[];
  at: number[];
  /** how much of the stars still shows */
  stars: number;
  /** the two hills, back then front */
  hills: [string, string] | null;
  /** how high the hills stand */
  hillH: number;
  c: Palette & { scheme: 'light' | 'dark' };
  /** the dashes of the progress line */
  dashOn: string;
  dashOff: string;
  /** the fill of a plain line on the card (the things to do), and its words */
  row: string;
  rowInk: string;
  /** words low on the screen, over the bright end of the sky */
  low: string;
  /** a real picture on the card: its boxes, their words, its strong color, and the words on that */
  art: { soft: string; text: string; ic: string; ink: string };
  /** the status bar's words */
  bar: 'light' | 'dark';
}

/** the flame's bubble and the answers: warm paper and white, the same on every sky */
export const BUBBLE = '#FFF6E6';
export const PAPER = '#FFFFFF';
export const PAPER_INK = '#1B1F4B';
export const PAPER_LIP = 'rgba(43,35,110,0.28)';
/** the right answer */
export const RIGHT = '#14956F';
export const RIGHT_LIP = '#0B6A4C';

type Stop = [number, [string, string, string], number, [string, string], number];
const DAY: Stop[] = [
  [0, ['#15113F', '#2A2275', '#3D2F8F'], 1, ['#2E2580', '#241C66'], 90],
  [0.3, ['#241C66', '#4A3393', '#71499F'], 0.45, ['#5B3F9C', '#45308A'], 110],
  [0.55, ['#4F3899', '#A35A90', '#EF9B7C'], 0, ['#D98474', '#B85F73'], 120],
  [0.77, ['#5B45A6', '#B96E90', '#F5B27E'], 0, ['#EFA27C', '#C96C72'], 120],
  /* no card lands between a rose dawn and full day: those colors go muddy */
  [0.78, ['#5AA9FF', '#A9D8FF', '#FCEBC9'], 0, ['#86D7A8', '#43B287'], 130],
  [1, ['#5AA9FF', '#A9D8FF', '#FCEBC9'], 0, ['#86D7A8', '#43B287'], 130],
];
/* at night the journey ends at a warm dawn */
const DAWN: Stop[] = [
  [0, ['#15113F', '#2A2275', '#3D2F8F'], 1, ['#2E2580', '#241C66'], 90],
  [0.35, ['#241C66', '#4A3393', '#71499F'], 0.5, ['#5B3F9C', '#45308A'], 110],
  [0.7, ['#3D2F8F', '#7D4A9A', '#BB6A8E'], 0.1, ['#A65E8C', '#7E4680'], 120],
  [1, ['#5A3F9E', '#C76F8C', '#F2A66B'], 0, ['#D98474', '#9C4F73'], 130],
];
const SKY_AT = [0, 0.62, 1];

const hex = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const mix = (a: string, b: string, k: number) => {
  const x = hex(a);
  const y = hex(b);
  return (
    '#' +
    x
      .map((v, i) =>
        Math.round(v + (y[i] - v) * k)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
};
const lum = (s: string) => {
  const [r, g, b] = hex(s).map((v) => {
    const u = v / 255;
    return u <= 0.03928 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const WHITE = '#FFFFFF';
const NAVY = '#14204F';

function stopAt(table: Stop[], p: number) {
  let i = 0;
  while (i < table.length - 2 && p > table[i + 1][0]) i++;
  const a = table[i];
  const b = table[i + 1];
  const k = p >= b[0] ? 1 : Math.max(0, (p - a[0]) / (b[0] - a[0]));
  return {
    colors: a[1].map((x, j) => mix(x, b[1][j], k)),
    stars: a[2] + (b[2] - a[2]) * k,
    hills: [mix(a[3][0], b[3][0], k), mix(a[3][1], b[3][1], k)] as [string, string],
    hillH: a[4] + (b[4] - a[4]) * k,
  };
}

/** the color behind the words: they sit in the top third of the sky */
export const behindWords = (colors: string[]) => mix(colors[0], colors[1], 0.45);

const cache = new Map<string, Look>();
/** p: how far through the lesson, 0 to 1 */
export function lessonLook(kind: LookKind, p: number, scheme: 'light' | 'dark'): Look {
  const q = Math.round(p * 100) / 100;
  const key = kind + ':' + (kind === 'sky' ? q : '') + ':' + scheme;
  const had = cache.get(key);
  if (had) return had;
  const look = kind === 'sun' ? sun(key, scheme) : kind === 'violet' ? violet(key, scheme) : sky(key, q, scheme);
  cache.set(key, look);
  return look;
}

function sky(key: string, p: number, scheme: 'light' | 'dark'): Look {
  const s = stopAt(scheme === 'dark' ? DAWN : DAY, p);
  const dark = contrast(WHITE, behindWords(s.colors)) >= contrast(NAVY, behindWords(s.colors));
  const base = dark ? { ...palettes.dark, surface: '#221E58', muted: '#C4BCEB' } : palettes.light;
  const ink = dark ? WHITE : NAVY;
  const under = mix(s.colors[1], s.colors[2], 0.6);
  const low = contrast(WHITE, under) >= contrast(NAVY, under) ? WHITE : NAVY;
  return {
    key,
    kind: 'sky',
    colors: s.colors,
    at: SKY_AT,
    stars: s.stars,
    hills: s.hills,
    hillH: s.hillH,
    bar: dark ? 'light' : 'dark',
    dashOn: dark && p < 0.4 ? palettes.dark.sun : ink,
    dashOff: dark ? 'rgba(255,255,255,0.26)' : 'rgba(20,32,79,0.2)',
    row: dark ? 'rgba(255,246,230,0.92)' : 'rgba(255,255,255,0.72)',
    rowInk: dark ? PAPER_INK : NAVY,
    low,
    art: dark ? { soft: BUBBLE, text: PAPER_INK, ic: palettes.dark.sun, ink: palettes.dark.onSun } : { soft: PAPER, text: NAVY, ic: NAVY, ink: WHITE },
    c: {
      ...base,
      scheme: dark ? 'dark' : 'light',
      bg: s.colors[1],
      ink,
      muted: dark ? 'rgba(255,255,255,0.86)' : '#2C3768',
      accent: dark ? WHITE : NAVY,
      accentInk: dark ? PAPER_INK : WHITE,
      accentDeep: dark ? PAPER_LIP : '#0B1436',
      accentText: ink,
      accentSoft: dark ? 'rgba(255,255,255,0.16)' : 'rgba(20,32,79,0.1)',
      scBtn: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.55)',
      lip: !dark ? 'rgba(20,32,79,0.18)' : low === NAVY ? 'rgba(20,16,60,0.26)' : 'rgba(255,255,255,0.22)',
      line: dark ? 'rgba(255,255,255,0.22)' : 'rgba(20,32,79,0.16)',
    },
  };
}

const ON_SUN = '#3A2A00';
function sun(key: string, scheme: 'light' | 'dark'): Look {
  return {
    key,
    kind: 'sun',
    /* the same sun at night, a little lower in the sky */
    colors: scheme === 'dark' ? ['#F2B441', '#D98A2E'] : ['#FFD25A', '#FFB347'],
    at: [0, 1],
    stars: 0,
    hills: null,
    hillH: 0,
    bar: 'dark',
    dashOn: ON_SUN,
    dashOff: 'rgba(58,42,0,0.18)',
    row: 'rgba(58,42,0,0.1)',
    rowInk: ON_SUN,
    low: ON_SUN,
    art: { soft: 'rgba(58,42,0,0.12)', text: ON_SUN, ic: ON_SUN, ink: palettes.light.sun },
    c: {
      ...palettes.light,
      scheme: 'light',
      bg: '#FFC24F',
      ink: ON_SUN,
      muted: '#4E3A06',
      accent: ON_SUN,
      accentInk: '#FFD25A',
      accentDeep: '#231900',
      accentText: ON_SUN,
      accentSoft: 'rgba(58,42,0,0.12)',
      scBtn: 'rgba(58,42,0,0.12)',
      lip: 'rgba(58,42,0,0.18)',
      line: 'rgba(58,42,0,0.18)',
    },
  };
}

const NUMBER = '#FFCF52';
function violet(key: string, scheme: 'light' | 'dark'): Look {
  const fill = scheme === 'dark' ? '#4A33C2' : '#6246EA';
  return {
    key,
    kind: 'violet',
    colors: [fill, fill],
    at: [0, 1],
    stars: 0,
    hills: null,
    hillH: 0,
    bar: 'light',
    dashOn: WHITE,
    dashOff: 'rgba(255,255,255,0.3)',
    row: 'rgba(255,255,255,0.16)',
    rowInk: WHITE,
    low: WHITE,
    art: { soft: BUBBLE, text: PAPER_INK, ic: NUMBER, ink: ON_SUN },
    c: {
      ...palettes.dark,
      scheme: 'dark',
      bg: fill,
      surface: '#3F2AAE',
      ink: WHITE,
      muted: 'rgba(255,255,255,0.88)',
      sun: NUMBER,
      accent: NUMBER,
      accentInk: ON_SUN,
      accentDeep: '#D9A21F',
      accentText: WHITE,
      accentSoft: 'rgba(255,255,255,0.16)',
      scBtn: 'rgba(255,255,255,0.18)',
      lip: 'rgba(255,255,255,0.22)',
      line: 'rgba(255,255,255,0.22)',
    },
  };
}
