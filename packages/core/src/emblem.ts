/* The flame spirit for native screens. The drawing (flame-art.ts) is an SVG string made for the web too, with CSS classes
   that animate it. react-native-svg draws the same shapes from the string; it ignores classes, so the app moves the parts
   itself (emblemLayers), and the size comes from the component instead of an inline style. The legacy emblem in core.js
   is the old drawing, kept only as the frozen record the golden tests check. */
import { flameSvg } from './flame-art';

/** the flame for a level on the 60-level ladder. locked: a form not reached yet, drawn faded. classes: keep the legacy
    classes that name each part (em-fig is the figure, sn-glow its glow), for emblemLayers. */
export function emblemXml(level: number, locked = false, classes = false): string {
  const x = flameSvg(level, { still: true, locked })
    .replace(/ style="width:\d+px;height:\d+px"/, '')
    .replace(/ style="[^"]*"/g, '')
    .replace(/ aria-hidden="true"/g, '')
    .replace(/ focusable="false"/g, '');
  return classes ? x : x.replace(/ class="[^"]*"/g, '');
}

/** the ids in an emblem change on every call (em1, em2, ...). Tests compare emblems with the ids made the same. */
export const sameIds = (svg: string) => svg.replace(/\bem\d+/g, 'emX');

/* ---------- the flame in its own sky (the top of Today) ---------- */
/** the flame for the top of Today: the same drawing with its round frame softened away, so it melts into a card painted in
    its own sky. sky: top to bottom. ground: the color of the ground in front, when it has hills. ink: the words on the picture,
    light on a dark sky or hills and dark on a bright one. stars: a night sky. The full suns have no sky of their own;
    they shine in a clear day sky. */
export interface EmblemScene {
  xml: string;
  sky: [string, string, string];
  /** where each sky color sits, top (0) to bottom (1) of the drawing, so the card's sky can line up with it */
  at: [number, number, number];
  ground: string | null;
  /** the drawing's own hills and ground, carried on far past its edges (in the drawing's units, 120 to its width), for
      the card to draw behind it: the picture's hills fade into the same hills, so there is one landscape, not two */
  land: string | null;
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
/** a drawing's hills (flame-art's hill) and the flat ground in front of them, each run on to far left and right and down */
function landOf(xml: string): string | null {
  const parts: string[] = [];
  for (const m of xml.matchAll(/<path d="M-2 ([\d.]+)(C[^"]*?)122 ([\d.]+)V122H-2Z" fill="(#[0-9A-Fa-f]{6})"\/>/g))
    parts.push(`<path d="M-1000 ${m[1]}H-2${m[2]}122 ${m[3]}H1120V400H-1000Z" fill="${m[4]}"/>`);
  for (const m of xml.matchAll(/<rect x="-2" y="([\d.]+)" width="124" height="[\d.]+" fill="(#[0-9A-Fa-f]{6})"\/>/g))
    if (Number(m[1]) >= 90) parts.push(`<rect x="-1000" y="${m[1]}" width="2120" height="400" fill="${m[2]}"/>`);
  return parts.length ? parts.join('') : null;
}
export function emblemScene(level: number, classes = false): EmblemScene {
  let xml = emblemXml(level, false, classes);
  const sk = /id="em\d+sk"[^>]*>((?:<stop[^>]*\/>)+)/.exec(xml);
  const stops = sk ? [...sk[1].matchAll(/stop-color="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]) : [];
  const offs = sk ? [...sk[1].matchAll(/offset="([\d.]+)"/g)].map((m) => Number(m[1])) : [];
  const own = stops.length === 3 && offs.length === 3;
  const sky: [string, string, string] = own ? [stops[0], stops[1], stops[2]] : DAY_SKY;
  const at: [number, number, number] = own ? [offs[0], offs[1], offs[2]] : [0, 0.6, 1];
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
  const land = landOf(xml);
  /* the words sit on the frontmost ground, and take whichever ink reads best on it (dark ink is #14112E) */
  const ground = land ? [...land.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].pop()![1] : null;
  return { xml, sky, at, ground, land, ink: luminance(ground || sky[2]) > 0.19 ? 'dark' : 'light', stars: luminance(sky[0]) < 0.08 };
}

/* ---------- the flame in layers, so only the figure moves ---------- */
/** the flame in four drawings laid over each other (in its own sky when soft, or in its round frame): the sky and what is behind the figure, the glow, the
    figure (the spark, the torch, the rising flame, the sun), and what is in front of it (hills that a rising sun sits
    behind). Each is a whole 120 by 120 drawing with its own ids, so they line up exactly. at: the figure's middle, as a
    share of the width and height, for growing it in place. */
export interface EmblemLayers {
  back: string;
  glow: string;
  fig: string;
  front: string;
  at: { x: number; y: number };
}
const drop = (x: string) => x.replace(/ class="[^"]*"/g, '');
/** the element that starts at i (a <g> with all it holds, or one self-closing tag), as [start, end] */
function elementAt(x: string, i: number): [number, number] {
  const self = /^<\w+[^>]*\/>/.exec(x.slice(i));
  if (self) return [i, i + self[0].length];
  const re = /<g\b[^>]*?(\/?)>|<\/g>/g;
  re.lastIndex = i;
  let depth = 0;
  for (let m = re.exec(x); m; m = re.exec(x)) {
    if (m[0] === '</g>') depth--;
    else if (!m[1]) depth++;
    if (depth === 0) return [i, m.index + m[0].length];
  }
  return [i, x.length];
}
export function emblemLayers(level: number, soft = true): EmblemLayers | null {
  const sc = soft ? emblemScene(level, true).xml : emblemXml(level, false, true);
  const fi = sc.search(/<g class="em-fig\b/);
  if (fi < 0) return null;
  const [, fe] = elementAt(sc, fi);
  const head = sc.slice(0, sc.indexOf('</defs>') + 7);
  /* the groups still open where the figure starts (the softened round frame), to open again around each layer */
  const open: string[] = [];
  const re = /<g\b[^>]*?(\/?)>|<\/g>/g;
  re.lastIndex = head.length;
  for (let m = re.exec(sc); m && m.index < fi; m = re.exec(sc)) {
    if (m[0] === '</g>') open.pop();
    else if (!m[1]) open.push(m[0]);
  }
  const start = head + open.join('');
  const end = '</g>'.repeat(open.length) + '</svg>';
  /* the figure's own glow is the last one before it (a few forms have small side glows too, which stay in the sky) */
  const gs = [...sc.slice(0, fi).matchAll(/<\w+ class="sn-glow"/g)];
  const glow = gs.length ? elementAt(sc, gs[gs.length - 1].index!) : null;
  const before = glow ? sc.slice(0, glow[0]) + sc.slice(glow[1], fi) : sc.slice(0, fi);
  const g = glow ? sc.slice(glow[0], glow[1]) : '';
  const c = /c[xy]="[\d.]+"/.test(g) ? { x: Number(/cx="([\d.]+)"/.exec(g)![1]), y: Number(/cy="([\d.]+)"/.exec(g)![1]) } : { x: 60, y: 60 };
  /* each layer gets its own ids (em7 becomes em7a, em7b, ...), so no drawing borrows another's */
  const own = (x: string, k: string) => drop(x).replace(/\b(em\d+)/g, '$1' + k);
  return {
    back: own(before + end, 'a'),
    glow: g ? own(start + g + end, 'b') : '',
    fig: own(start + sc.slice(fi, fe) + end, 'c'),
    front: own(start + sc.slice(fe), 'd'),
    at: { x: c.x / 120, y: c.y / 120 },
  };
}
