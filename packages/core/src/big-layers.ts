/* The flame drawn big (the app's components/big-flame.tsx): the drawing's layers without the picture's own sky, brought in close
   around the figure so every form is the same size, and the same picture as one still SVG for the native splash screen. The layers
   are worked out here, in plain strings, so the splash image (tools/make-icons.mjs) and the app's first frame are one drawing
   (the owner, November 15, 2026: opening Daybook should be one motion from the tap to Today, like How We Feel's, with no seam). */
import { emblemLayers, figAsleep, type EmblemLayers } from './emblem';
import { fireOf, type Fire } from './flame-fire';
import { formOfLevel } from './levels';

/** the campfire's flame, as a share of the drawing: the size every early form is brought up to */
const FULL_K = 0.48;
/** where the figure's middle sits in the box when it is brought in close (as a share of its height) */
export const BIG_MID_Y = 0.55;

export interface BigLayers {
  layers: EmblemLayers;
  fire: Fire;
  zoom: number;
  dx: number;
  dy: number;
}

/** the layers without the picture's own sky and stars, and how close to draw it: zoom, and the shift (as shares of the box) that puts the
    figure in its place. `noLand`: without the drawing's own hills too, for a sky that is not its own. */
export function bigLayers(level: number, noLand?: boolean): BigLayers | null {
  const l = emblemLayers(level, true);
  if (!l) return null;
  /* the spark, the kindling and the campfire are drawn smaller than the rest: closer, up to the campfire's size */
  const k = Number(/scale\(([\d.]+)\)/.exec(l.fig)?.[1] || 0);
  const zoom = formOfLevel(level) <= 2 && k > 0 ? Math.min(3.2, Math.max(1, FULL_K / k)) : 1;
  /* the lines of light around the figure (its rays, a ring) keep a fine line however close it is drawn; the twigs and
     logs it stands on grow with it */
  const fine = (x: string) =>
    zoom > 1
      ? x.replace(/(stroke="#FF(?:F3B0|E27A)"[^>]*?stroke-width=")([\d.]+)"/g, (_, a: string, w: string) => a + ((Number(w) / zoom) * 1.5).toFixed(2) + '"')
      : x;
  const clean = (x: string) =>
    fine(
      (noLand ? x.replace(/<path d="M-2 [^"]*V122H-2Z" fill="#[0-9A-Fa-f]{6}"\/>|<rect x="-2"[^>]*\/>|<ellipse cx="60" cy="108"[^>]*\/>/g, '') : x)
        .replace(/<rect x="0" y="0" width="120" height="120" fill="url\(#em\w+sk\)"\/>/, '')
        .replace(/<circle cx="[\d.]+" cy="[\d.]+" r="[\d.]+" fill="#fff" opacity="[\d.]+"\/>/g, ''),
    );
  /* the spark's thin rays, its ring and the little flame beside it are drawn for a small picture: this close they read as stray bars and a glitch,
     so the big flame goes without them (the owner, October 30, 2026) */
  const spark = formOfLevel(level) === 0;
  const layers = {
    ...l,
    back: clean(spark ? l.back.replace(/<path d="[^"]*" stroke="#FFF3B0"[^>]*\/>/g, '') : l.back),
    side: spark ? '' : clean(l.side),
    front: spark ? '' : clean(l.front),
  };
  const whole = fireOf(level, !spark);
  /* embers keep their small size however close the figure is drawn */
  const fire = zoom > 1 ? { ...whole, embers: whole.embers.map((e) => ({ ...e, r: (e.r / zoom) * 1.5 })) } : whole;
  /* on another sky: the glow has no frame to fade into, so it stays whole and clear of the drawing's edges, and the figure stands in the middle.
     Brought in close, the first forms' glow would grow past the top of the card and be cut off in a straight line, so it keeps the size of the later forms' */
  if (noLand) {
    const cut = l.glow.indexOf('</defs>');
    layers.glow =
      l.glow.slice(0, cut) +
      l.glow
        .slice(cut)
        .replace(/<g mask="url\(#\w+\)">/, '<g>')
        .replace(/(<circle cx="[\d.]+" cy="([\d.]+)" r=")([\d.]+)"/, (_, a: string, y: string, r: string) => a + Math.min(+r, +y, 120 - +y, 48 / zoom) + '"');
    return { layers, fire, zoom, dx: 0.5 - l.at.x, dy: 0.5 - l.at.y };
  }
  return zoom > 1 ? { layers, fire, zoom, dx: 0.5 - l.at.x, dy: BIG_MID_Y - l.at.y } : { layers, fire, zoom, dx: 0, dy: 0 };
}

/** where the figure's middle sits in the big flame's box on Today (with its hills), as shares of the box: on a sky of its own
    (`noLand`) it is always the middle */
export function bigFigureAt(level: number, noLand?: boolean): { x: number; y: number } {
  const b = bigLayers(level, noLand);
  if (!b || noLand) return { x: 0.5, y: 0.5 };
  return b.zoom > 1 ? { x: 0.5, y: BIG_MID_Y } : b.layers.at;
}

/* ---------- the splash ---------- */
/** the flame the app opens on: the rising flame, the one on the app icon */
export const LAUNCH_LEVEL = 28;
/** the color behind it: the dark theme's page (lib/theme.ts `bg`), which Today's own night sky runs into */
export const LAUNCH_BG = '#15123A';
/** the splash picture's width on the phone, in points (app.json imageWidth says the same number): the drawing is a 120 box with the figure about
    a third of it wide, so this makes the flame itself about two fifths of a phone's width, as How We Feel's logo is */
export const LAUNCH_W = 430;
/** the glow as the living flame first draws it (components/flame.tsx GLOW: a fire form breathes between 0.75 and 1) */
const LAUNCH_GLOW = 0.75;

/** the inside of one layer's SVG, without its outer tag */
const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** the flame asleep, drawn big on nothing, as one still SVG 120 by 120: the native splash image, and the app's first frame, which
    is this same drawing until it wakes (components/launch.tsx). It is laid out exactly as BigFlame lays its layers out on a sky
    that is not its own (zoom 1 for this form, the figure moved to the middle), so the living flame takes over without a jump. */
export function launchFlameSvg(level = LAUNCH_LEVEL): string {
  const b = bigLayers(level, true);
  if (!b) return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"/>';
  const { layers, dx, dy } = b;
  const move = `translate(${(dx * 120).toFixed(3)} ${(dy * 120).toFixed(3)})`;
  const parts = [
    inner(layers.back),
    layers.glow ? `<g opacity="${LAUNCH_GLOW}">${inner(layers.glow)}</g>` : '',
    layers.side ? inner(layers.side) : '',
    inner(figAsleep(layers.fig)),
    layers.front ? inner(layers.front) : '',
  ];
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><g transform="${move}">${parts.join('')}</g></svg>`;
}
