/* The flame spirit, drawn as an SVG string: one drawing for each of the 60 levels (levels.ts), 12 forms of 5 steps.
   It starts as one tiny flame in a night sky and grows: kindling, a campfire, a torch, a beacon. Then it rises into the
   sky, becomes the sun, and ends as the stars. The same face is there the whole way: big shiny eyes, soft brows, a small
   smile. It never wilts and it never goes backwards.
   The style: layers of red-orange, orange and gold, curling tips, a warm light up high and a deeper shade low down.
   The figure is drawn in its own box, 100 wide (x -50 to 50) and 120 tall (its base at y 120), then placed and scaled.
   Class names name the parts for emblemLayers (em-fig is the figure, sn-glow its glow) and move them on the web. */

let seq = 0;
const f = (v: number) => String(Math.round(v * 10) / 10);
const INK = '#2A2350';
const BROW = '#8A2E0C';

const clampL = (n: number) => Math.max(1, Math.min(60, Math.round(n) || 1));
export const emStage = (n: number) => Math.floor((clampL(n) - 1) / 5);
export const emStep = (n: number) => (clampL(n) - 1) % 5;
const tierOf = (n: number) => emStep(n) / 2;
/** a value from a list of three (t = 0, 1, 2) or five (one per step), at a step that may fall between two */
const P = (a: number[], t: number) => {
  if (a.length === 5) return a[Math.round(t * 2)];
  const i = Math.floor(t),
    k = t - i;
  return k ? a[i] + (a[Math.min(i + 1, a.length - 1)] - a[i]) * k : a[i];
};

/* ---------- the figure ---------- */
/* the full flame: the main tip leans left, two licks on the left and one on the right, all curling at the ends */
const OUT =
  'M-3 0C4 2 14 8 20 18C25 26 25 34 25 40C26 36 28 31 33 28C33 34 36 39 41 44C47 51 51 62 51 78' +
  'C51 104 30 120 0 120C-30 120 -51 104 -51 80C-51 64 -46 51 -36 41C-37 46 -36 50 -33 53C-34 40 -28 28 -18 20' +
  'C-19 25 -18 28 -15 31C-14 18 -11 7 -3 0Z';
/* the middle layer has tips of its own, set lower and between the outer ones */
const MID =
  'M5 14C12 20 19 30 19 46C22 42 25 39 29 38C28 46 33 52 38 58C43 64 45 72 45 82C45 104 27 116 0 116' +
  'C-27 116 -45 104 -45 84C-45 70 -40 60 -31 52C-30 56 -29 59 -26 61C-27 46 -18 32 -8 26C-8 31 -7 34 -5 36C-4 26 0 19 5 14Z';
const HEART = 'M6 34C6 44 14 50 24 58C33 66 38 76 38 88C38 105 21 114 0 114C-21 114 -38 105 -38 88C-38 70 -24 60 -10 52C-2 47 4 42 6 34Z';
/* the small flame (kindling): one lick each side */
const OUT_S =
  'M2 0C12 24 30 40 34 62C37 58 40 54 45 49C50 66 50 82 46 94C40 112 22 120 0 120C-22 120 -40 112 -46 94' +
  'C-50 82 -50 66 -45 49C-40 54 -37 58 -34 62C-30 40 -12 24 2 0Z';
const HEART_S = 'M2 40C8 56 33 70 33 90C33 106 17 115 0 115C-17 115 -33 106 -33 90C-33 70 -4 56 2 40Z';
/* the tiny flame (the spark): one soft tip */
const OUT_T = 'M-6 4C22 22 50 54 48 84C46 106 26 120 0 120C-26 120 -48 106 -48 84C-48 58 -18 42 -6 4Z';
const HEART_T = 'M-2 40C14 56 36 70 36 90C36 106 20 115 0 115C-20 115 -36 106 -36 90C-36 70 -14 56 -2 40Z';
const SHAPES = { full: [OUT, MID, HEART], small: [OUT_S, '', HEART_S], tiny: [OUT_T, '', HEART_T] } as const;
type Kind = keyof typeof SHAPES;

/** the gradients one drawing uses, made once each */
function defsFor(id: string, sky?: string[]) {
  let d =
    `<linearGradient id="${id}fo" x1=".1" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#FF8F2E"/><stop offset=".5" stop-color="#FF6B1E"/><stop offset="1" stop-color="#E5421A"/></linearGradient>` +
    `<linearGradient id="${id}fd" x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#FFB234"/><stop offset="1" stop-color="#FF8C1E"/></linearGradient>` +
    `<radialGradient id="${id}fi" cx="44%" cy="28%" r="80%"><stop offset="0" stop-color="#FFEA55"/><stop offset=".45" stop-color="#FFD033"/><stop offset=".85" stop-color="#FFB224"/><stop offset="1" stop-color="#FFA21E"/></radialGradient>` +
    `<radialGradient id="${id}hl"><stop offset="0" stop-color="#FFF6B0" stop-opacity=".6"/><stop offset="1" stop-color="#FFF6B0" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${id}bs" x1="0" y1="0" x2="0" y2="1"><stop offset=".6" stop-color="#FF8A1A" stop-opacity="0"/><stop offset="1" stop-color="#FF8A1A" stop-opacity=".7"/></linearGradient>` +
    `<radialGradient id="${id}rd"><stop offset="0" stop-color="#D63A16" stop-opacity=".55"/><stop offset="1" stop-color="#D63A16" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id}ir" cx="45%" cy="38%" r="65%"><stop offset="0" stop-color="#1E0803"/><stop offset=".5" stop-color="#42160A"/><stop offset="1" stop-color="#A0501F"/></radialGradient>` +
    `<radialGradient id="${id}go"><stop offset="0" stop-color="#FFC25A" stop-opacity=".62"/><stop offset="1" stop-color="#FFC25A" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${id}sh"><stop offset="0" stop-color="#05031A" stop-opacity=".5"/><stop offset="1" stop-color="#05031A" stop-opacity="0"/></radialGradient>`;
  for (const k of Object.keys(SHAPES) as Kind[])
    d += `<clipPath id="${id}co${k}"><path d="${SHAPES[k][0]}"/></clipPath><clipPath id="${id}ci${k}"><path d="${SHAPES[k][2]}"/></clipPath>`;
  d += `<clipPath id="${id}cs"><circle cx="0" cy="0" r="40"/></clipPath>`;
  if (sky)
    d +=
      `<linearGradient id="${id}sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient>` +
      `<clipPath id="${id}cp"><circle cx="60" cy="60" r="58"/></clipPath>`;
  return `<defs>${d}</defs>`;
}

/** one shiny eye: a dark rim, a white edge on the outer side, a warm brown middle looking a little inward, two lights */
function eye(id: string, x: number, y: number, R: number, inward: number) {
  const ix = x + inward * R * 0.2;
  return (
    `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="#4A1A0A"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(R * 0.9)}" fill="#FFF6E8"/>` +
    `<circle cx="${f(ix)}" cy="${f(y + R * 0.05)}" r="${f(R * 0.7)}" fill="url(#${id}ir)"/>` +
    `<circle cx="${f(ix - R * 0.16)}" cy="${f(y - R * 0.28)}" r="${f(R * 0.27)}" fill="#fff"/><circle cx="${f(ix + R * 0.26)}" cy="${f(y + R * 0.14)}" r="${f(R * 0.12)}" fill="#fff"/>`
  );
}
const stroke = (d: string, w: number, c = BROW) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
/** an eye closed in rest: a soft curve like a small smile, where the eye was */
const restEye = (x: number) => stroke(`M${x - 10} 82Q${x} 91 ${x + 10} 82`, 3.6, '#4A1A0A');
/** the face, centred on its eyes at (0, 84) in the figure's box; s scales it around there. rest: the eyes closed, content */
function face(id: string, s = 1, cy = 84, rest = false) {
  const g =
    (rest ? restEye(-17) + restEye(17) : `<g class="sn-eyes">${eye(id, -17, 84, 13, 1)}${eye(id, 17, 84, 13, -1)}</g>`) +
    stroke('M-27 63Q-20 57.5 -12 60', 3) +
    stroke('M12 60Q20 57.5 27 63', 3) +
    stroke('M-6.5 101Q0 107.5 6.5 101', 3.4);
  return s === 1 && cy === 84 ? g : `<g transform="translate(0 ${f(cy)}) scale(${s}) translate(0 -84)">${g}</g>`;
}

/** a flame with its base at (cx, by), k times its box (100 by 120). face: false for the small side flames */
function flameFig(id: string, kind: Kind, cx: number, by: number, k: number, o: { face?: boolean; delay?: number; lean?: number; rest?: boolean } = {}) {
  const [out, mid, heart] = SHAPES[kind];
  const lean = o.lean ? ` rotate(${o.lean} 0 120)` : '';
  let g = `<g class="em-flame" style="animation-delay:${o.delay || 0}s"><g transform="translate(${f(cx)} ${f(by)}) scale(${k})${lean} translate(0 -120)">`;
  g += `<path d="${out}" fill="url(#${id}fo)"/>`;
  g += `<g clip-path="url(#${id}co${kind})"><ellipse cx="46" cy="98" rx="26" ry="36" fill="url(#${id}rd)"/></g>`;
  if (mid) g += `<path d="${mid}" fill="url(#${id}fd)"/>`;
  g += `<path d="${heart}" fill="url(#${id}fi)"/>`;
  g += `<g clip-path="url(#${id}ci${kind})"><rect x="-40" y="30" width="80" height="86" fill="url(#${id}bs)"/><ellipse cx="-4" cy="${kind === 'full' ? 60 : 72}" rx="22" ry="16" fill="url(#${id}hl)"/></g>`;
  if (o.face !== false) g += kind === 'full' ? face(id, 1, 84, o.rest) : kind === 'small' ? face(id, 0.82, 88, o.rest) : face(id, 0.86, 88, o.rest);
  return g + '</g></g>';
}
/** a soft shadow on the ground under a figure */
const shadow = (id: string, cx: number, y: number, rx: number) =>
  `<ellipse cx="${f(cx)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(rx * 0.16)}" fill="url(#${id}sh)"/>`;

/** a flame tip pointing out from the sun's edge (up, before it is turned) */
function tongue(r: number, len: number, bw: number) {
  return `M${f(-bw)} ${f(-r * 0.86)}C${f(-bw * 0.9)} ${f(-(r + len * 0.5))} ${f(-bw * 0.1)} ${f(-(r + len * 0.85))} ${f(bw * 0.3)} ${f(-(r + len))}C${f(bw * 0.45)} ${f(-(r + len * 0.6))} ${f(bw)} ${f(-(r + len * 0.35))} ${f(bw)} ${f(-r * 0.86)}Z`;
}
/** the sun: the same gold heart and face, with flame tips around it for rays. n tips, len their length */
function sunFig(id: string, cx: number, cy: number, r: number, o: { n?: number; len?: number; turn?: number } = {}) {
  const n = o.n ?? 12,
    len = o.len ?? r * 0.42,
    turn = o.turn ?? 0;
  let tips = '',
    inner = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360 + turn;
    tips += `<path d="${tongue(r, len, r * 0.3)}" transform="rotate(${f(a)})"/>`;
    inner += `<path d="${tongue(r, len * 0.55, r * 0.26)}" transform="rotate(${f(a + 180 / n)})"/>`;
  }
  const s = r / 44;
  let g = `<g transform="translate(${f(cx)} ${f(cy)})">`;
  g += `<g class="sn-rays" fill="url(#${id}fo)">${tips}</g><g fill="url(#${id}fd)">${inner}</g>`;
  g += `<circle r="${f(r)}" fill="url(#${id}fi)"/>`;
  g += `<g transform="scale(${f(r / 40)})" clip-path="url(#${id}cs)"><rect x="-40" y="-10" width="80" height="50" fill="url(#${id}bs)"/><ellipse cx="-8" cy="-18" rx="24" ry="16" fill="url(#${id}hl)"/></g>`;
  g += `<g transform="scale(${f(s)}) translate(0 -88)">${face(id)}</g>`;
  return g + '</g>';
}
/** a little star with the face: the north star's shape */
function starFig(id: string, cx: number, cy: number, r: number) {
  const d = `M0 ${-r}Q${r * 0.16} ${-r * 0.16} ${r} 0Q${r * 0.16} ${r * 0.16} 0 ${r}Q${-r * 0.16} ${r * 0.16} ${-r} 0Q${-r * 0.16} ${-r * 0.16} 0 ${-r}Z`;
  return `<g transform="translate(${f(cx)} ${f(cy)})"><path d="${d}" fill="url(#${id}fi)" stroke="#FFB224" stroke-width=".8"/><g transform="scale(${f(r / 70)}) translate(0 -80)">${face(id)}</g></g>`;
}

/* ---------- the scenery ---------- */
const STARS = [
  [20, 24, 1.3, 0],
  [38, 14, 1, 1.1],
  [80, 18, 1.4, 0.5],
  [96, 32, 1, 1.7],
  [28, 42, 0.9, 2.2],
  [106, 56, 1.1, 0.8],
  [14, 60, 1, 1.4],
  [64, 10, 0.9, 2.6],
  [50, 30, 0.8, 0.3],
  [90, 46, 0.8, 1.9],
  [22, 76, 0.9, 0.6],
  [102, 78, 0.9, 2.4],
];
const stars = (n: number, op = 1) =>
  STARS.slice(0, n)
    .map((s) => `<circle class="em-tw" cx="${s[0]}" cy="${s[1]}" r="${s[2]}" fill="#fff" opacity="${op}" style="animation-delay:${s[3]}s"/>`)
    .join('');
const glow = (id: string, cx: number, cy: number, r: number, ry?: number) =>
  ry
    ? `<ellipse class="sn-glow" cx="${f(cx)}" cy="${f(cy)}" rx="${f(r)}" ry="${f(ry)}" fill="url(#${id}go)"/>`
    : `<circle class="sn-glow" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="url(#${id}go)"/>`;
const sparks = (list: number[][]) =>
  list
    .map(
      (s) =>
        `<circle class="em-up" cx="${f(s[0])}" cy="${f(s[1])}" r="${s[2]}" fill="#FFE27A" style="animation-delay:${s[3]}s;animation-duration:${s[4] || 3}s"/>`,
    )
    .join('');
const hill = (y: number, col: string, a: number, sh = 0) =>
  `<path d="M-2 ${y}C${24 + sh} ${y - a} ${46 + sh} ${y + a * 0.3} ${70 + sh} ${y - a * 0.6}S${104 + sh} ${y - a * 0.9} 122 ${y}V122H-2Z" fill="${col}"/>`;
const line = (x1: number, y1: number, x2: number, y2: number, w: number, col: string) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
const twig = (x1: number, y1: number, x2: number, y2: number) => line(x1, y1, x2, y2, 3.8, '#7A4A32') + line(x1, y1 - 0.9, x2, y2 - 0.9, 1.2, '#B97E52');
const log = (x1: number, y1: number, x2: number, y2: number) =>
  line(x1, y1, x2, y2, 10, '#6E3F2A') +
  line(x1 + 1, y1 - 2.8, x2 - 1, y2 - 2.8, 2.6, '#A06A44') +
  `<circle cx="${x2}" cy="${y2}" r="5" fill="#D29A66"/><circle cx="${x2}" cy="${y2}" r="2.4" fill="none" stroke="#8A5236" stroke-width="1.2"/>`;
const stone = (x: number, y: number, rx: number, ry: number, c = '#8C84BC') =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/><ellipse cx="${x - rx * 0.25}" cy="${y - ry * 0.3}" rx="${rx * 0.5}" ry="${ry * 0.35}" fill="#B6AFDA" opacity=".6"/>`;
const cloud = (x: number, y: number, s: number, col: string, op = 1, d = 0) =>
  `<g class="em-cloud" style="animation-delay:${d}s"><g transform="translate(${x} ${y}) scale(${s})" fill="${col}" opacity="${op}"><ellipse cx="0" cy="0" rx="13" ry="5.2"/><circle cx="-5.5" cy="-3.6" r="5.2"/><circle cx="3" cy="-5.8" r="6.8"/></g></g>`;
const bird = (x: number, y: number, s: number) =>
  `<path class="em-bird" d="M${x} ${y}q${2.6 * s} ${-3.2 * s} ${5.2 * s} 0q${2.6 * s} ${-3.2 * s} ${5.2 * s} 0" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" fill="none"/>`;
const sparkle = (x: number, y: number, r: number, c = '#FFF6C8', d = 0) =>
  `<path class="em-twk" d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${c}" style="animation-delay:${d}s"/>`;
const fig = (inner: string, bob = false) => `<g class="em-fig${bob ? ' em-bob' : ''}">${inner}</g>`;

interface Scene {
  sky?: [string, string, string];
  layers: string;
}
/* ---------- the twelve forms ---------- */
const SCENES: ((id: string, t: number, st: number) => Scene)[] = [
  /* 1 Spark: one tiny flame in a night sky */
  (id, t, st) => {
    const by = P([66, 66, 66], t),
      k = P([0.16, 0.2, 0.24], t);
    let h = stars(12) + hill(106, '#0C0828', 8);
    h += glow(id, 60, by - 60 * k, P([24, 32, 40], t));
    if (t >= 1) {
      const L = P([0, 20, 27], t),
        cy = by - 60 * k,
        r = 60 * k;
      h += `<path class="em-twk" d="M60 ${f(cy - L - r * 0.4)}V${f(cy - r - 4)}M${f(60 - L - r * 0.4)} ${f(cy)}H${f(60 - r - 4)}M${f(60 + r + 4)} ${f(cy)}H${f(60 + L + r * 0.4)}" stroke="#FFF3B0" stroke-width="1.5" stroke-linecap="round" fill="none"/>`;
    }
    if (t >= 2)
      h += sparks([
        [48, by + 2, 1.4, 0, 2.8],
        [72, by - 2, 1.2, 0.9, 3.2],
        [58, by + 8, 1.1, 1.6, 2.6],
      ]);
    h += fig(flameFig(id, 'tiny', 60, by, k), true);
    if (st === 1) h += `<circle cx="60" cy="${f(by - 60 * k)}" r="${f(64 * k + 6)}" fill="none" stroke="#FFE27A" stroke-opacity=".5" stroke-width="1.6"/>`;
    if (st === 3) h += `<g class="em-bob">${flameFig(id, 'tiny', 82, 50, 0.07, { face: false, delay: 0.6 })}</g>`;
    return { sky: ['#15103C', '#281F66', '#3A2C86'], layers: h };
  },
  /* 2 Kindling: a few twigs and the first small flame */
  (id, t, st) => {
    const by = 94,
      k = P([0.26, 0.32, 0.38], t);
    let h = stars(11) + hill(101, '#0C0828', 6);
    h += glow(id, 60, by - 22, P([30, 38, 46], t), P([22, 28, 34], t));
    h += twig(42, 99, 76, 90) + twig(45, 90, 79, 99);
    if (t >= 2) h += twig(50, 97, 57, 78) + twig(70, 97, 63, 78);
    h += fig(flameFig(id, 'small', 60, by, k, { delay: 0.2 }));
    if (t >= 1) h += twig(40, 96, 82, 96);
    if (t >= 1) h += sparks([[54, by - 120 * k, 1.2, 0, 2.8]]);
    if (t >= 2)
      h += sparks([
        [67, by - 120 * k - 4, 1.3, 1, 3.2],
        [60, by - 120 * k - 10, 1, 1.8, 3.6],
      ]);
    if (st === 1)
      h += `<circle cx="47" cy="97" r="1.6" fill="#FF8A3A"/><circle cx="74" cy="92" r="1.5" fill="#FF8A3A"/><circle cx="52" cy="91" r="1.3" fill="#FFB347"/>`;
    if (st === 3) h += `<ellipse cx="60" cy="100" rx="36" ry="6" fill="#FF8A3A" opacity=".28"/>`;
    return { sky: ['#17113F', '#2B2169', '#3E2D88'], layers: h };
  },
  /* 3 Campfire: logs, stones, the full flame, sparks */
  (id, t, st) => {
    const by = 95,
      k = P([0.42, 0.48, 0.54], t);
    let h = stars(10) + hill(103, '#0F0A30', 6);
    h += glow(id, 60, by - 30, P([40, 48, 56], t), P([28, 34, 40], t));
    if (t >= 2)
      h +=
        flameFig(id, 'tiny', 42, 98, 0.15, { face: false, delay: 0.5, lean: -12 }) + flameFig(id, 'tiny', 78, 98, 0.15, { face: false, delay: 0.8, lean: 12 });
    h += log(34, 102, 82, 93) + log(86, 102, 38, 93);
    if (st === 1) h += flameFig(id, 'tiny', 79, 96, 0.11, { face: false, delay: 0.7, lean: 16 });
    if (st === 3) h += `<ellipse cx="60" cy="105" rx="48" ry="7" fill="#FFB347" opacity=".24"/>`;
    h += fig(flameFig(id, 'full', 60, by, k, { delay: 0.1 }));
    if (t >= 1) h += stone(29, 104, 6, 4) + stone(41, 107, 5, 3.4, '#7C74AE') + stone(79, 107, 5, 3.4, '#7C74AE') + stone(91, 104, 6, 4);
    const top = by - 120 * k;
    h += sparks(
      t < 1
        ? [
            [50, top + 4, 1.2, 0, 2.8],
            [70, top + 8, 1.1, 1.2, 3.2],
          ]
        : t < 2
          ? [
              [48, top + 6, 1.3, 0, 2.8],
              [71, top + 4, 1.2, 0.8, 3.2],
              [58, top - 4, 1.1, 1.5, 3.6],
              [76, top + 14, 1, 2.2, 3],
            ]
          : [
              [46, top + 8, 1.4, 0, 2.8],
              [72, top + 4, 1.3, 0.6, 3.2],
              [58, top - 6, 1.2, 1.3, 3.6],
              [78, top + 14, 1.1, 1.9, 3],
              [40, top + 18, 1, 2.4, 3.4],
              [64, top - 12, 1, 0.9, 3.8],
            ],
    );
    return { sky: ['#1A1348', '#34267A', '#53358C'], layers: h };
  },
  /* 4 Torch: a flame you can carry */
  (id, t, st) => {
    const by = 66,
      k = P([0.36, 0.42, 0.48], t);
    let h = stars(9) + glow(id, 60, by - 26, P([44, 54, 64], t));
    h += `<rect x="56.5" y="75" width="7" height="42" rx="3" fill="#7A4A32"/><rect x="58.3" y="75" width="2" height="42" rx="1" fill="#B97E52"/>`;
    h += `<path d="M50 64L70 64L66 80L54 80Z" fill="#5B3A2A"/><path d="M51.6 70.5H68.4M53 76H67" stroke="#D29A66" stroke-width="1.8" stroke-linecap="round"/><ellipse cx="60" cy="64.4" rx="10" ry="2.8" fill="#3A2418"/>`;
    h += fig(flameFig(id, 'full', 60, by, k, { delay: 0.2 }));
    h += hill(106, '#1B1252', 5, 6);
    h += `<ellipse cx="60" cy="108" rx="${P([22, 30, 38], t)}" ry="${P([5, 7, 9], t)}" fill="#FFB347" opacity=".22"/>`;
    const top = by - 120 * k;
    if (t >= 2)
      h += sparks([
        [46, top + 20, 1.3, 0, 3],
        [74, top + 16, 1.2, 0.8, 3.4],
        [56, top - 2, 1.2, 1.5, 3.8],
        [68, top - 6, 1, 2.1, 3.2],
      ]);
    else if (t >= 1)
      h += sparks([
        [48, top + 20, 1.2, 0, 3],
        [73, top + 16, 1.1, 1.1, 3.4],
      ]);
    if (st === 1) h += `<path d="M56.5 90H63.5M56.5 96H63.5M56.5 102H63.5" stroke="#D29A66" stroke-width="2"/>`;
    if (st === 3) h += `<path d="M36 122L55 106H65L84 122Z" fill="#FFD27A" opacity=".2"/>`;
    return { sky: ['#211860', '#4A3190', '#7A4399'], layers: h };
  },
  /* 5 Beacon: a fire on a tower, so others can see it too */
  (id, t, st) => {
    const H = P([86, 82, 78], t),
      by = H - 11,
      k = P([0.34, 0.38, 0.42], t);
    let h = stars(7) + hill(100, '#241A62', 7, -6);
    if (t >= 2) {
      [
        [17, 92],
        [103, 90],
      ].forEach((p, i) => {
        h +=
          `<circle class="sn-glow" cx="${p[0]}" cy="${p[1] - 5}" r="11" fill="url(#${id}go)" style="animation-delay:${i * 0.7}s"/>` +
          flameFig(id, 'tiny', p[0], p[1], 0.1, { face: false, delay: i * 0.5 });
      });
      h += hill(104, '#1A1250', 6, 10);
    }
    h += glow(id, 60, by - 24, P([42, 52, 60], t));
    if (t >= 1) {
      const n = Math.round(P([0, 9, 13], t)),
        r0 = 30,
        L = P([0, 8, 10], t);
      let d = '';
      for (let i = 0; i < n; i++) {
        const a = -Math.PI * 0.96 + (Math.PI * 0.92 * i) / Math.max(1, n - 1);
        d += `<line x1="${f(60 + Math.cos(a) * r0)}" y1="${f(by - 24 + Math.sin(a) * r0)}" x2="${f(60 + Math.cos(a) * (r0 + L))}" y2="${f(by - 24 + Math.sin(a) * (r0 + L))}"/>`;
      }
      h += `<g class="em-beam" stroke="#FFE27A" stroke-width="2.2" stroke-linecap="round" fill="none">${d}</g>`;
    }
    h += `<path d="M47 108L73 108L69 ${H}L51 ${H}Z" fill="#7A72AE"/><path d="M48.4 99H71.6M49.7 91H70.3M50.4 ${H + 5}H69.6" stroke="#5B5490" stroke-width="1.2" fill="none"/><path d="M55 108V101a5 5 0 0110 0V108Z" fill="#2B2466"/>`;
    h += `<rect x="47.5" y="${H - 4}" width="25" height="4.4" rx="1.6" fill="#5B5490"/><path d="M48 ${H - 4}L72 ${H - 4}L67 ${H - 12}L53 ${H - 12}Z" fill="#3A3470"/><path d="M53 ${H - 12}H67" stroke="#8A82C4" stroke-width="1.6" stroke-linecap="round"/>`;
    h += fig(flameFig(id, 'full', 60, by, k, { delay: 0.3 }));
    h += hill(112, '#150E43', 5, -4);
    if (st === 1) h += `<path d="M49 ${f(H + 12)}H71" stroke="#9A93C8" stroke-width="1.4"/>`;
    if (st === 3) h += cloud(30, 30, 0.8, '#FFD9A0', 0.7, 0) + cloud(92, 24, 0.7, '#FFD9A0', 0.6, 2);
    return { sky: ['#241A66', '#5A3792', '#A5509A'], layers: h };
  },
  /* 6 Rising: the flame lifts off the ground and climbs into the dawn, on its way to being the sun */
  (id, t, st) => {
    const by = P([96, 88, 80], t),
      k = P([0.4, 0.42, 0.44], t),
      cy = by - 60 * k;
    let h = stars(P([6, 4, 2], t), 0.9);
    h += glow(id, 60, cy, P([40, 48, 56], t));
    /* a soft trail of light and embers below it */
    h += `<path class="sn-trail" d="M${f(60 - 20 * k * 2)} ${f(by - 10)}Q60 ${f(by + 44)} ${f(60 + 20 * k * 2)} ${f(by - 10)}Z" fill="#FFD27A" opacity=".3"/><path d="M${f(60 - 8 * k * 2)} ${f(by - 6)}Q60 ${f(by + 30)} ${f(60 + 8 * k * 2)} ${f(by - 6)}Z" fill="#FFF3B0" opacity=".35"/>`;
    h += sparks([
      [54, by + 6, 1.3, 0, 3],
      [66, by + 10, 1.2, 0.9, 3.4],
      [60, by + 18, 1.1, 1.7, 3.8],
    ]);
    if (t >= 1)
      h += sparks([
        [46, by + 2, 1, 0.4, 3.2],
        [74, by + 4, 1, 1.3, 3.6],
      ]);
    if (t >= 2) h += cloud(24, 80, 0.85, '#FFB7A8', 0.75, 0) + cloud(98, 74, 0.75, '#FFC8B8', 0.7, 3);
    h += fig(flameFig(id, 'full', 60, by, k, { delay: 0.2 }), true);
    h += hill(104, '#5A3488', 6, -8) + hill(110, '#3A2470', 5, 6);
    if (st === 1) h += `<circle cx="60" cy="${f(cy)}" r="${f(62 * k + 8)}" fill="none" stroke="#FFE27A" stroke-opacity=".45" stroke-width="1.6"/>`;
    if (st === 3) h += `<rect x="-2" y="100" width="124" height="3" fill="#FFB7A8" opacity=".45"/>`;
    return { sky: ['#2C2175', '#6A3C94', '#E0808C'], layers: h };
  },
  /* 7 Sunrise: the flame, round now, comes up over the hills as the sun */
  (id, t, st) => {
    const cy = P([90, 82, 74], t),
      r = 20;
    let h = stars(P([3, 1, 0], t), 0.7);
    h += glow(id, 60, cy, P([42, 50, 58], t));
    if (t >= 2) h += cloud(24, 44, 0.9, '#FFC4B0', 0.85, 0) + cloud(96, 34, 0.75, '#FFD6C2', 0.8, 3);
    if (st === 1) h += `<rect x="-2" y="30" width="124" height="70" fill="#FF8FA8" opacity=".2"/>`;
    h += fig(sunFig(id, 60, cy, r, { n: 12, len: P([5, 7, 9], t) }));
    h += hill(92, '#8A4A94', 7, -10) + hill(98, '#4A2A7C', 6, 8) + `<rect x="-2" y="104" width="124" height="20" fill="#2F1C62"/>`;
    if (st === 3) h += sparkle(28, 93, 3.4, '#FFE7A0', 0) + sparkle(94, 95, 3, '#FFE7A0', 1) + sparkle(48, 99, 2.6, '#FFE7A0', 2);
    return { sky: ['#3F2F8E', '#B4559A', '#FFAE6B'], layers: h };
  },
  /* 8 Daybreak: morning, and getting brighter */
  (id, t, st) => {
    const cy = P([62, 56, 50], t),
      r = 21;
    let h = glow(id, 60, cy, P([48, 54, 60], t));
    if (t >= 1) h += cloud(22, 72, 0.9, '#FFFFFF', 0.9, 0) + cloud(100, 58, 0.8, '#FFF1E6', 0.9, 4);
    else h += cloud(100, 66, 0.8, '#FFF1E6', 0.85, 2);
    if (t >= 2) h += bird(26, 32, 1) + bird(36, 26, 0.8) + bird(90, 30, 0.9);
    if (st === 1) h += stars(5, 0.45);
    h += fig(sunFig(id, 60, cy, r, { n: 12, len: 10 }));
    h += hill(96, '#77D2B0', 7, -8) + hill(103, '#3DAA84', 6, 6) + `<rect x="-2" y="108" width="124" height="16" fill="#2E8E6E"/>`;
    if (st === 3)
      h += `<rect x="-2" y="106" width="124" height="4" fill="#FFD25A" opacity=".55"/><rect x="-2" y="113" width="124" height="3" fill="#FFD25A" opacity=".35"/>`;
    return { sky: ['#6B9BF0', '#B6D0FF', '#FFD6A4'], layers: h };
  },
  /* 9 Bright day: a clear sky, green hills, flowers, a rainbow */
  (id, t, st) => {
    const cy = 46,
      r = 22;
    let h = glow(id, 60, cy, 60);
    if (t >= 2)
      (
        [
          [54, '#FF7A66'],
          [49.2, '#FFC832'],
          [44.4, '#5FD6A0'],
          [39.6, '#5AA8FF'],
        ] as [number, string][]
      ).forEach((a) => {
        h += `<path d="M${96 - a[0]} 112A${a[0]} ${a[0]} 0 0 1 ${96 + a[0]} 112" stroke="${a[1]}" stroke-width="4.8" fill="none" opacity=".8"/>`;
      });
    h += cloud(22, 68, 0.95, '#FFFFFF', 0.95, 0);
    if (t >= 1) h += cloud(98, 62, 0.85, '#FFFFFF', 0.95, 3);
    if (st === 3)
      h += `<g stroke="#9ED0FF" stroke-width="1.3" stroke-linecap="round" opacity=".75"><path d="M20 76l-3 8M28 80l-3 8M96 72l-3 8M104 76l-3 8M88 78l-3 8"/></g>`;
    h += fig(sunFig(id, 60, cy, r, { n: 14, len: 11 }));
    h += hill(94, '#69DDB0', 7, -8) + hill(102, '#2DB380', 6, 6) + `<rect x="-2" y="108" width="124" height="16" fill="#23996C"/>`;
    if (t >= 1)
      h += `<g><circle cx="24" cy="106" r="2.3" fill="#FF7A66"/><circle cx="36" cy="111" r="2.1" fill="#FFD25A"/><circle cx="84" cy="106" r="2.3" fill="#fff"/><circle cx="97" cy="111" r="2.1" fill="#FF7A66"/></g>`;
    if (t >= 2)
      h += `<g><circle cx="52" cy="112" r="2" fill="#FFD25A"/><circle cx="68" cy="108" r="2.2" fill="#fff"/><circle cx="12" cy="111" r="2" fill="#FFD25A"/><circle cx="110" cy="107" r="2" fill="#FFD25A"/></g>`;
    if (st === 1)
      h += `<g stroke="#1E8A5E" stroke-width="1.6" stroke-linecap="round"><path d="M18 109l-2 -5M20 109l1 -6M44 112l-2 -5M46 112l1 -6M90 107l-2 -5M92 107l1 -6"/></g>`;
    return { sky: ['#3FA2FF', '#86CCFF', '#CFEBFF'], layers: h };
  },
  /* 10 Full sun: it steps out of its frame */
  (id, t, st) => {
    const r = 27;
    let h = glow(id, 60, 60, P([50, 55, 60], t));
    if (t >= 1) {
      let d = '';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        d += `<circle cx="${f(60 + Math.cos(a) * 53)}" cy="${f(60 + Math.sin(a) * 53)}" r="1.7"/>`;
      }
      h += `<g fill="#FFD25A" opacity=".85" class="em-orbit">${d}</g>`;
    }
    if (t >= 2) {
      h += `<circle cx="60" cy="60" r="47" fill="none" stroke="#FFD25A" stroke-width="1.4" stroke-dasharray="1.5 5" stroke-linecap="round" opacity=".8" class="em-orbit"/>`;
      h += sparkle(12, 26, 7, '#FFC832', 0) + sparkle(108, 32, 6, '#FFC832', 1) + sparkle(102, 98, 7, '#FFC832', 2) + sparkle(16, 92, 6, '#FFC832', 3);
    }
    h += fig(sunFig(id, 60, 60, r, { n: Math.round(P([12, 14, 16], t)), len: P([11, 13, 14], t) }));
    if (st === 3) {
      let d = '';
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * (0.82 - (0.64 * i) / 6);
        d += `<circle cx="${f(60 + Math.cos(a) * 49)}" cy="${f(60 + Math.sin(a) * 49)}" r="2.6"/>`;
      }
      h += `<g fill="#FFE27A" class="em-orbit">${d}</g>`;
    }
    if (st === 1) h += sparkle(20, 22, 3.4, '#FFE7A0', 0.5) + sparkle(100, 100, 3.4, '#FFE7A0', 1.5);
    return { layers: h };
  },
  /* 11 Constellation: the first stars, then lines between them, then a shape that fills the sky */
  (id, t, st) => {
    const C = [
      [30, 40],
      [46, 30],
      [60, 46],
      [78, 34],
      [92, 48],
      [70, 70],
      [44, 72],
    ];
    let h = stars(12, 0.8);
    if (st >= 4) h += glow(id, 60, 52, 58);
    const link = (a: number, b: number, op: number) =>
      `<path d="M${C[a][0]} ${C[a][1]}L${C[b][0]} ${C[b][1]}" stroke="#BFD0FF" stroke-width="1.3" stroke-linecap="round" opacity="${op}"/>`;
    if (st >= 1) h += link(1, 2, 0.75) + link(2, 3, 0.75) + link(2, 5, 0.75);
    if (st >= 2) h += link(0, 1, 0.85) + link(3, 4, 0.85) + link(5, 6, 0.85) + link(6, 2, 0.85);
    if (st >= 3) h += link(4, 5, 0.9) + link(0, 6, 0.9);
    const pts = st >= 3 ? C : st >= 2 ? C.slice(0, 5) : [C[1], C[3], C[5]];
    pts.forEach((p, i) => {
      if (p !== C[2]) h += sparkle(p[0], p[1], st >= 3 ? 4.2 : 3.4, '#FFF6C8', i * 0.4);
    });
    if (st >= 3) h += sparkle(18, 86, 3, '#FFF6C8', 1.2) + sparkle(102, 86, 3, '#FFF6C8', 2.1) + sparkle(60, 16, 3, '#FFF6C8', 0.6);
    if (st >= 4)
      h +=
        sparkle(14, 24, 3.6, '#FFE27A', 0) + sparkle(106, 22, 3.6, '#FFE27A', 1) + sparkle(100, 104, 3.4, '#FFE27A', 2) + sparkle(20, 104, 3.4, '#FFE27A', 3);
    h += glow(id, 60, 46, 26);
    h += fig(sunFig(id, 60, 46, 13, { n: 10, len: 5 }), true);
    h += hill(110, '#0C0828', 6);
    return { sky: ['#0B0A2E', '#1A1550', '#2C2072'], layers: h };
  },
  /* 12 North Star: one star that stays put, the sky turning around it, and its light pointing the way */
  (id, t, st) => {
    let h = stars(12, 0.55);
    if (st >= 2)
      for (let i = 0; i < 3; i++) {
        const r = 26 + i * 12;
        h += `<path class="em-orbit" d="M${f(60 - r)} 44A${r} ${r} 0 0 1 ${f(60 + r)} 44" stroke="#AFC2FF" stroke-width="1" stroke-dasharray="2 4" stroke-linecap="round" fill="none" opacity="${0.5 - i * 0.12}"/>`;
      }
    if (st >= 1) h += `<path d="M60 56L52 112H68Z" fill="#FFF3B0" opacity=".18"/>`;
    if (st >= 3) h += `<circle cx="60" cy="44" r="30" fill="url(#${id}go)"/>`;
    h += glow(id, 60, 44, P([30, 34, 38, 42, 48], t));
    h += fig(starFig(id, 60, 44, P([24, 26, 28, 29, 30], t)), true);
    if (st >= 4) {
      h += `<circle cx="60" cy="44" r="40" fill="none" stroke="#FFD25A" stroke-width="1.4" stroke-dasharray="1.5 5" stroke-linecap="round" opacity=".85" class="em-orbit"/>`;
      h += sparkle(16, 24, 4, '#FFE27A', 0) + sparkle(104, 26, 4, '#FFE27A', 1) + sparkle(100, 78, 3.4, '#FFE27A', 2) + sparkle(20, 80, 3.4, '#FFE27A', 3);
    }
    h += hill(104, '#0E0B34', 7, -6) + hill(110, '#08061F', 5, 8);
    return { sky: ['#0A0A28', '#191A52', '#33307E'], layers: h };
  },
];

/** the flame for a level: an SVG string 120 by 120. still: no motion classes on the web. locked: a form not reached yet.
    size: its width and height in pixels */
export function flameSvg(n: number, o: { still?: boolean; locked?: boolean; size?: number } = {}): string {
  const L = clampL(n),
    si = emStage(L),
    t = tierOf(L),
    id = 'em' + ++seq,
    sc = SCENES[si](id, t, emStep(L)),
    size = o.size || 120;
  const cls = 'sun emb s' + si + ' t' + t + (o.still ? ' still' : '') + (o.locked ? ' locked' : '');
  const body = sc.sky
    ? `<g clip-path="url(#${id}cp)"><rect x="0" y="0" width="120" height="120" fill="url(#${id}sk)"/>${sc.layers}</g><circle cx="60" cy="60" r="57.2" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1.8"/><circle cx="60" cy="60" r="58.6" fill="none" stroke="#2A2350" stroke-opacity=".28" stroke-width="1"/>`
    : sc.layers;
  return `<svg class="${cls}" viewBox="0 0 120 120" style="width:${size}px;height:${size}px" aria-hidden="true" focusable="false">${defsFor(id, sc.sky)}${body}</svg>`;
}

/** the full flame alone on a clear background (no sky), w by w * 1.2 in its own box, for store art */
export function flameFigureSvg(): string {
  const id = 'em' + ++seq;
  return `<svg viewBox="-60 -10 120 140" xmlns="http://www.w3.org/2000/svg">${defsFor(id)}${shadow(id, 0, 122, 50)}${flameFig(id, 'full', 0, 120, 1)}</svg>`;
}

/** the flame on its own, for the app icon: the full flame on the night sky with its glow, filling the square */
export function flameIconSvg(): string {
  const id = 'em' + ++seq;
  return (
    `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${defsFor(id, ['#15103C', '#281F66', '#3A2C86'])}` +
    `<rect width="120" height="120" fill="url(#${id}sk)"/><circle cx="60" cy="66" r="54" fill="url(#${id}go)"/>${shadow(id, 60, 106, 42)}${flameFig(id, 'full', 60, 104, 0.76)}</svg>`
  );
}

/* ---------- the icon, dressed up ---------- */
/* The same flame as the app icon in a look for a time of year, the way Duolingo dresses its owl: clearly the same icon
   every time (the melting flame, tried October 26, read as weird and was dropped). A look ships as the app's own icon in an App Store update (tools/make-icons.mjs --look; the calendar is in
   docs/icon-calendar.md), so everyone sees it, and the next update puts the plain flame back. The flame stands where it
   does on the icon (its base at 60, 104, 0.76 of its box), so a hat sits on its tip at about (54, 20). */
export const ICON_LOOKS = ['halloween', 'autumn', 'winter', 'newyear', 'valentine'] as const;
export type IconLook = (typeof ICON_LOOKS)[number];
/** when each look is the icon, every year, as month-day from and to (both in; the last one wraps the new year). Between
    them the icon is the plain flame. docs/icon-calendar.md shows it. */
export const ICON_CALENDAR: { look: IconLook; from: string; to: string }[] = [
  { look: 'valentine', from: '02-07', to: '02-15' },
  { look: 'halloween', from: '10-15', to: '11-01' },
  { look: 'autumn', from: '11-02', to: '11-30' },
  { look: 'winter', from: '12-01', to: '12-26' },
  { look: 'newyear', from: '12-27', to: '01-04' },
];
/** days an update takes to reach people (App Review, then the phones updating): the icon is picked for the build day plus this */
export const ICON_LEAD_DAYS = 3;
/** the look for an update built on day k (YYYY-MM-DD): the look on the day it reaches people, or null for the plain flame */
export function iconLookFor(k: string): IconLook | null {
  const d = new Date(k + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + ICON_LEAD_DAYS);
  const md = d.toISOString().slice(5, 10);
  const c = ICON_CALENDAR.find((x) => (x.from <= x.to ? md >= x.from && md <= x.to : md >= x.from || md <= x.to));
  return c ? c.look : null;
}
const leaf = (x: number, y: number, r: number, c: string) =>
  `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 -6C4 -4 5 2 0 6C-5 2 -4 -4 0 -6Z" fill="${c}"/><path d="M0 -5V6" stroke="#7A3A1A" stroke-width=".7"/></g>`;
const heart = (x: number, y: number, r: number, c: string, op = 1) =>
  `<path d="M${f(x)} ${f(y + r * 0.9)}C${f(x - r * 1.6)} ${f(y - r * 0.1)} ${f(x - r * 0.9)} ${f(y - r * 1.3)} ${f(x)} ${f(y - r * 0.45)}C${f(x + r * 0.9)} ${f(y - r * 1.3)} ${f(x + r * 1.6)} ${f(y - r * 0.1)} ${f(x)} ${f(y + r * 0.9)}Z" fill="${c}" opacity="${op}"/>`;
const bat = (x: number, y: number, s: number) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0C-3 -4 -8 -5 -12 -2C-10 -1 -9 1 -9 3C-7 1 -5 1 -4 3C-3 1 -1 1 0 2C1 1 3 1 4 3C5 1 7 1 9 3C9 1 10 -1 12 -2C8 -5 3 -4 0 0Z" fill="#160B26"/>`;
const flakes = (list: number[][]) => list.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="#fff" opacity=".9"/>`).join('');
const LOOKS: Record<IconLook, { sky: [string, string, string]; back: string; front: string; hat?: boolean }> = {
  /* a witch's hat on the tip, a big moon and two bats */
  halloween: {
    sky: ['#140A2E', '#3A1A5E', '#C0572A'],
    hat: true,
    back: `<circle cx="96" cy="22" r="14" fill="#FFE9A8"/><circle cx="91" cy="18" r="3" fill="#F2D488" opacity=".7"/><circle cx="100" cy="27" r="2" fill="#F2D488" opacity=".7"/>${bat(96, 24, 0.8)}${bat(20, 96, 0.9)}${bat(104, 84, 0.6)}`,
    front:
      `<g transform="rotate(-14 56 32)"><ellipse cx="56" cy="32" rx="27" ry="5.5" fill="#24133F"/><path d="M42 31L60 -6L71 31Z" fill="#2E1A52"/>` +
      `<path d="M44.5 26L69 26L70.5 31L43 31Z" fill="#8A3FC0"/><rect x="53" y="25.5" width="7" height="6" rx="1" fill="none" stroke="#FFC94A" stroke-width="1.6"/></g>`,
  },
  /* a red winter hat with its white trim and bobble, snow falling, snow on the ground */
  winter: {
    sky: ['#0E1A44', '#24387A', '#5874B8'],
    hat: true,
    back:
      flakes([
        [16, 18, 1.6],
        [30, 40, 1.2],
        [100, 16, 1.8],
        [88, 44, 1.2],
        [12, 62, 1.3],
        [108, 70, 1.5],
        [74, 8, 1.1],
        [24, 84, 1.2],
      ]) + `<path d="M-2 108C30 100 90 100 122 108V122H-2Z" fill="#EAF2FF"/>`,
    front:
      `<g transform="rotate(-10 58 32)"><path d="M38 33C40 12 58 -2 80 6C70 8 68 18 76 33Z" fill="#E0323C"/><path d="M41 30C44 14 58 4 74 8" fill="none" stroke="#B8222C" stroke-width="2" opacity=".5"/>` +
      `<rect x="34" y="28" width="46" height="10" rx="5" fill="#fff"/><circle cx="82" cy="7" r="6" fill="#fff"/></g>`,
  },
  /* a party hat, confetti and two bursts of fireworks */
  newyear: {
    sky: ['#120C3A', '#2A1E6E', '#4A2F8E'],
    hat: true,
    back:
      [
        [24, 26, '#FFD25A'],
        [98, 22, '#7FE0FF'],
      ]
        .map(([x, y, c]) =>
          Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return `<path d="M${f(+x + Math.cos(a) * 5)} ${f(+y + Math.sin(a) * 5)}L${f(+x + Math.cos(a) * 13)} ${f(+y + Math.sin(a) * 13)}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`;
          }).join(''),
        )
        .join('') +
      [
        [14, 70, '#FF7A9C', 20],
        [104, 64, '#FFD25A', -30],
        [20, 96, '#7FE0FF', 40],
        [100, 92, '#9CF08A', 10],
        [40, 50, '#FFD25A', -20],
        [82, 46, '#FF7A9C', 35],
      ]
        .map(([x, y, c, r]) => `<rect x="${x}" y="${y}" width="5" height="2.6" rx="1" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`)
        .join(''),
    front:
      `<g transform="rotate(-12 56 30)"><path d="M43 33L58 -2L71 33Z" fill="#FF5A8A"/><path d="M49 19L65 19L67.5 25L46.5 25Z" fill="#FFD25A"/><path d="M53.5 9L62.5 9L64 13L52 13Z" fill="#7FE0FF"/>` +
      `<circle cx="58" cy="-3" r="4.5" fill="#FFD25A"/><ellipse cx="57" cy="33" rx="15" ry="3" fill="#D93A6C"/></g>`,
  },
  /* hearts floating in a rose sky, and rosy cheeks */
  valentine: {
    sky: ['#2E1048', '#71205E', '#E05A86'],
    back:
      heart(20, 26, 7, '#FF8FB0', 0.85) +
      heart(100, 20, 9, '#FF8FB0', 0.85) +
      heart(104, 64, 5, '#FFC2D4', 0.8) +
      heart(14, 66, 5, '#FFC2D4', 0.8) +
      heart(60, 8, 4, '#FFC2D4', 0.7),
    front: `<ellipse cx="38" cy="86" rx="6" ry="3.6" fill="#FF6A8A" opacity=".55"/><ellipse cx="82" cy="86" rx="6" ry="3.6" fill="#FF6A8A" opacity=".55"/>`,
  },
  /* a warm scarf and falling leaves at dusk */
  autumn: {
    sky: ['#24123E', '#5E2A58', '#D2703F'],
    back:
      leaf(20, 24, 30, '#FF9A3A') +
      leaf(98, 18, -20, '#E0502E') +
      leaf(106, 58, 60, '#FFC23A') +
      leaf(14, 64, -40, '#E0502E') +
      leaf(30, 96, 15, '#FFC23A') +
      leaf(96, 94, -50, '#FF9A3A'),
    front:
      `<path d="M30 96C44 104 76 104 90 96L91 103C76 111 44 111 29 103Z" fill="#D8343C"/><path d="M34 99L38 106M44 101L47 108M56 102L58 109M68 102L69 109M80 100L80 107" stroke="#F5E6C8" stroke-width="2.2" opacity=".85"/>` +
      `<path d="M72 104L84 104L82 120L70 120Z" fill="#C42A32"/><path d="M71 116L83 116" stroke="#F5E6C8" stroke-width="2"/>`,
  },
};
/** the app icon in one of its looks (tools/make-icons.mjs), a square SVG 120 by 120 with no motion */
export function flameLookSvg(look: IconLook): string {
  const L = LOOKS[look],
    id = 'em' + ++seq;
  const body = `${shadow(id, 60, 106, 42)}${flameFig(id, 'full', 60, 104, 0.76)}${L.front}`;
  return (
    `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">${defsFor(id, L.sky)}` +
    `<rect width="120" height="120" fill="url(#${id}sk)"/>${L.back}<circle cx="60" cy="66" r="54" fill="url(#${id}go)"/>` +
    /* with a hat, the flame stands a little smaller, so the hat fits */
    (L.hat ? `<g transform="translate(60 110) scale(.84) translate(-60 -110)">${body}</g>` : body) +
    `</svg>`
  ).replace(/ (class|style)="[^"]*"/g, '');
}

/** the full flame's outline in white on clear, for Android's small note icon (it uses only the alpha) */
export function flameMaskSvg(): string {
  return `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><path d="${OUT}" fill="#fff" transform="translate(60 12) scale(.8)"/></svg>`;
}
