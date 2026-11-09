/* The flame at its campfire, for the widget and the Live Activity (the owner, November 9, 2026: "more light and more crackling fire",
   picked "B, crackling campfire"). The person's own form stands over a small log fire: a warm glow behind it, flames licking up around
   the logs, a bed of coals, and sparks rising into the night. The night sky itself is the widget's own background (widgets/flame.tsx).
   The fire burns with the flame: lower is fewer sparks and shorter flames (lowXml then drains the colors, as on Today).
   Drawn once into a picture by the app (lib/flame-widget), so it is plain SVG with no filters or classes. */

/** a fixed scatter of sparks and stars, so the same flame always draws the same picture: [x, y, r] in the 120 box */
const SPARKS: [number, number, number][] = [
  [22, 58, 1.6],
  [97, 52, 1.4],
  [14, 34, 1.1],
  [106, 30, 1.2],
  [30, 18, 0.9],
  [88, 14, 1],
  [8, 70, 1.2],
  [112, 74, 1],
  [40, 8, 0.8],
  [76, 6, 0.9],
  [18, 86, 1.3],
  [103, 90, 1.4],
  [26, 44, 0.8],
  [95, 38, 0.9],
];
const STARS: [number, number, number][] = [
  [6, 8, 0.6],
  [17, 4, 0.5],
  [112, 10, 0.6],
  [102, 4, 0.5],
  [4, 22, 0.4],
  [116, 22, 0.4],
];
const SPARK_COLORS = ['#FFE08A', '#FFB347', '#FF7A2E', '#FFFFFF'];
/** a flame lick: [x offset from the middle, height, half width], each a fraction of the fire's size */
const LICKS: [number, number, number, string][] = [
  [-0.44, 0.24, 0.12, 'cfl1'],
  [0.42, 0.26, 0.12, 'cfl1'],
  [-0.3, 0.38, 0.14, 'cfl1'],
  [0.3, 0.4, 0.14, 'cfl1'],
  [-0.14, 0.46, 0.15, 'cfl2'],
  [0.14, 0.44, 0.15, 'cfl2'],
];

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

/** the inside of an SVG: its defs and drawing, without the <svg> tag around them */
function inner(svg: string): string {
  const a = svg.indexOf('>', svg.indexOf('<svg'));
  const b = svg.lastIndexOf('</svg>');
  return a < 0 || b < 0 ? '' : svg.slice(a + 1, b);
}

export interface CampfireOpts {
  /** how high it burns, 0 to 1: 1 is a full fire, lower is shorter flames and fewer sparks */
  lit?: number;
  /** the stars in the sky above (the widget, on its own night); the Live Activity card has its own */
  stars?: boolean;
  /** cut in close around the figure and the fire, for the small Live Activity picture */
  close?: boolean;
}

/** the figure (emblemLayers(level).fig, or figAsleep of it) standing over its campfire, as one 120 by 120 SVG with no background */
export function campfireXml(fig: string, opts: CampfireOpts = {}): string {
  const lit = Math.max(0.25, Math.min(1, opts.lit ?? 1));
  const cx = 60;
  const base = 104;
  const size = 62;
  const defs =
    '<radialGradient id="cfglow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFC864" stop-opacity=".85"/><stop offset=".5" stop-color="#FF7A2E" stop-opacity=".38"/><stop offset="1" stop-color="#FF6420" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="cfl1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF5A1A"/><stop offset=".6" stop-color="#FF9A2E"/><stop offset="1" stop-color="#FFD860" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="cfl2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FFB040"/><stop offset=".7" stop-color="#FFE38A"/><stop offset="1" stop-color="#FFF6D0" stop-opacity="0"/></linearGradient>' +
    '<radialGradient id="cfcoal" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE08A"/><stop offset=".5" stop-color="#FF7A2E"/><stop offset="1" stop-color="#FF5A1A" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="cfspk" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD27A" stop-opacity=".7"/><stop offset="1" stop-color="#FFB347" stop-opacity="0"/></radialGradient>';
  let o = `<defs>${defs}</defs>`;
  if (opts.stars) for (const [x, y, r] of STARS) o += `<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" opacity=".7"/>`;
  /* the light the fire throws, behind everything, centered on the flame (the owner: "the circle is not centered around the avatar") */
  /* cut in close, it stays inside the picture, so no square edge shows on the card */
  const gr = opts.close ? 34 + 4 * lit : 48 + 10 * lit;
  o += `<circle cx="${cx}" cy="62" r="${n1(gr)}" fill="url(#cfglow)" opacity="${n1(0.55 + 0.45 * lit)}"/>`;
  /* the flames licking up around the logs, behind the figure */
  for (const [dx, hh, wd, g] of LICKS) {
    const x = cx + dx * size;
    const h = hh * size * (0.45 + 0.55 * lit);
    const w = wd * size;
    o += `<path d="M${n1(x - w)} ${base}C${n1(x - w)} ${n1(base - h * 0.45)} ${n1(x - w * 0.2)} ${n1(base - h * 0.7)} ${n1(x + w * 0.15)} ${n1(base - h)}C${n1(x + w * 0.35)} ${n1(base - h * 0.65)} ${n1(x + w)} ${n1(base - h * 0.4)} ${n1(x + w)} ${base}Z" fill="url(#${g})" opacity=".9"/>`;
  }
  /* the figure, a little bigger, its foot (60, 72 in its own drawing, where its body is centered) standing in the fire */
  o += `<g transform="translate(${cx} 96) scale(1.2) translate(-60 -72)">${inner(fig)}</g>`;
  /* the coals and two crossed logs in front */
  o += `<ellipse cx="${cx}" cy="${base + 3}" rx="${n1(size * 0.56)}" ry="${n1(size * 0.1)}" fill="url(#cfcoal)" opacity="${n1(0.6 + 0.4 * lit)}"/>`;
  const L = size * 0.92;
  const t = size * 0.12;
  for (const a of [-13, 13]) {
    const end = cx + (L / 2 - t / 2) * (a > 0 ? 1 : -1);
    o +=
      `<g transform="rotate(${a} ${cx} ${base + 5})">` +
      `<rect x="${n1(cx - L / 2)}" y="${base}" width="${n1(L)}" height="${n1(t)}" rx="${n1(t / 2)}" fill="#6B3A22"/>` +
      `<rect x="${n1(cx - L / 2 + 2)}" y="${base + 1}" width="${n1(L - 4)}" height="${n1(t * 0.32)}" rx="${n1(t * 0.16)}" fill="#9A5A32" opacity=".8"/>` +
      `<circle cx="${n1(end)}" cy="${n1(base + t / 2)}" r="${n1(t * 0.42)}" fill="#C9874F"/>` +
      `<circle cx="${n1(end)}" cy="${n1(base + t / 2)}" r="${n1(t * 0.2)}" fill="#8A4E2A"/></g>`;
  }
  /* the sparks rising: a soft glow and a bright core; fewer the lower it burns */
  const shown = Math.round(SPARKS.length * (0.35 + 0.65 * lit));
  SPARKS.slice(0, shown).forEach(([x, y, r], i) => {
    o += `<circle cx="${x}" cy="${y}" r="${n1(r * 3.2)}" fill="url(#cfspk)"/><circle cx="${x}" cy="${y}" r="${r}" fill="${SPARK_COLORS[i % SPARK_COLORS.length]}"/>`;
  });
  return `<svg viewBox="${opts.close ? '16 18 88 88' : '0 0 120 120'}">${o}</svg>`;
}

/** the night behind the campfire, top to bottom: the widget's background and the Live Activity card's */
export const CAMPFIRE_SKY = ['#120E30', '#221A4E', '#4A2346', '#8A3A2A'];
