/* The flame's fire on the web (core flame-fire.ts says what moves and how; a phone draws it with Skia, fire-layer.native.tsx): the same outlines in one
   SVG, whose paths are given their new shapes each frame. A browser does that cheaply, and the page does not have to carry Skia. It rests when its
   screen is covered, and each change of `leap` (a tap) makes it leap and settle. Burning low and lit again as on a phone (fire-layer.native.tsx). */
import { emberAt, FIRE_LEAP, fireMove, lowMatrix, SMOKE_N, smokeAt, sputterAt, type Fire, type FireOp, type FirePaint } from '@daybook/core';
import { createElement, useEffect, useMemo, useRef } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { useOnScreen } from '@/lib/motion';

const LEAP_UP = 340;
const LEAP_DOWN = 1500;

function dOf(pts: number[], subs: number[]) {
  let d = '',
    i = 0;
  for (const n of subs) {
    const end = i + n * 2;
    d += `M${pts[i].toFixed(2)} ${pts[i + 1].toFixed(2)}`;
    for (i += 2; i < end; i += 6)
      d += `C${pts[i].toFixed(2)} ${pts[i + 1].toFixed(2)} ${pts[i + 2].toFixed(2)} ${pts[i + 3].toFixed(2)} ${pts[i + 4].toFixed(2)} ${pts[i + 5].toFixed(2)}`;
    d += 'Z';
  }
  return d;
}
function gradient(id: string, p: FirePaint) {
  const stops = p.stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('');
  return p.t === 'lin'
    ? `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}">${stops}</linearGradient>`
    : `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${p.cx} ${p.cy}) scale(${p.rx} ${p.ry})">${stops}</radialGradient>`;
}
/** sparks thrown out of the heart when it is lit again: [angle from straight up, speed, size] (as on a phone) */
const SPARKS: [number, number, number][] = [
  [-0.2, 1, 1],
  [0.35, 0.85, 0.8],
  [-0.7, 0.75, 0.9],
  [0.8, 0.7, 0.7],
  [0.05, 1.15, 0.7],
  [-1.1, 0.55, 0.8],
  [1.2, 0.6, 0.9],
  [-0.45, 0.95, 0.6],
  [0.55, 1.05, 0.6],
  [-0.05, 0.7, 1.1],
];
const SMOKE_UP = 46;
const SMOKE_SIDE = 16;

let seq = 0;
function drawing(fire: Fire, pad: { up: number; side: number }, smoke: string) {
  const id = `fire${++seq}`;
  let defs = '',
    body = '';
  fire.ops.forEach((o: FireOp, i) => {
    defs += gradient(`${id}g${i}`, o.paint);
    const d = dOf(o.pts, o.subs);
    if (o.clip >= 0) defs += `<clipPath id="${id}c${i}"><path data-i="${o.clip}" d="${dOf(fire.ops[o.clip].pts, fire.ops[o.clip].subs)}"/></clipPath>`;
    body +=
      `<path data-i="${i}" d="${d}" fill="url(#${id}g${i})"` +
      (o.clip >= 0 ? ` clip-path="url(#${id}c${i})"` : '') +
      (o.line ? ` stroke="${o.line.color}" stroke-width="${o.line.width}"` : '') +
      '/>';
  });
  fire.embers.forEach(() => {
    body += '<circle data-e="1" fill="#FFE27A"/>';
  });
  let over = '';
  if (pad.up) {
    defs +=
      `<filter id="${id}low" color-interpolation-filters="sRGB"><feColorMatrix data-low="1" type="matrix" values="${lowMatrix(0).join(' ')}"/></filter>` +
      `<radialGradient id="${id}sm"><stop offset="0" stop-color="${smoke}" stop-opacity="1"/><stop offset="1" stop-color="${smoke}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="${id}ht"><stop offset="0" stop-color="#FFB347" stop-opacity="1"/><stop offset="0.25" stop-color="#FF6A1F" stop-opacity="0.85"/><stop offset="1" stop-color="#FF6A1F" stop-opacity="0"/></radialGradient>`;
    over += `<circle data-h="1" fill="url(#${id}ht)" opacity="0"/>`;
    for (let i = 0; i < SMOKE_N; i++) over += `<circle data-s="1" fill="url(#${id}sm)" opacity="0"/>`;
    SPARKS.forEach((_, i) => (over += `<circle data-k="1" fill="${i % 3 ? '#FFD45A' : '#FFF3B0'}" opacity="0"/>`));
  }
  const { x, y, w, h } = fire.box;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x - pad.side} ${y - pad.up} ${w + pad.side * 2} ${h + pad.up}" width="100%" height="100%" style="display:block;overflow:visible"><defs>${defs}</defs>` +
    (pad.up ? `<g filter="url(#${id}low)">${body}</g>${over}` : body) +
    '</svg>'
  );
}

/** the fire, placed in a drawing shown at `unit` points to each of its units (it fills `fire.box`) */
export function FireLayer({
  fire,
  unit,
  leap = 0,
  low,
  burst,
  fine = 1,
  smoke = '#8C8698',
}: {
  fire: Fire;
  unit: number;
  leap?: number;
  low?: SharedValue<number>;
  burst?: SharedValue<number>;
  fine?: number;
  smoke?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const leapAt = useRef(-1e6);
  const onScreen = useOnScreen();
  const pad = useMemo(() => (low ? { up: SMOKE_UP * fine, side: SMOKE_SIDE * fine } : { up: 0, side: 0 }), [low, fine]);
  const html = useMemo(() => drawing(fire, pad, smoke), [fire, pad, smoke]);
  useEffect(() => {
    if (leap) leapAt.current = performance.now();
  }, [leap]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = html;
    if (!onScreen) return;
    const moving = fire.ops.map((o) => (o.move ? o : null));
    const paths = [...el.querySelectorAll<SVGPathElement>('path[data-i]')].map((p) => ({ p, i: Number(p.dataset.i) })).filter(({ i }) => moving[i]);
    const dots = [...el.querySelectorAll<SVGCircleElement>('circle[data-e]')];
    const wisps = [...el.querySelectorAll<SVGCircleElement>('circle[data-s]')];
    const sparks = [...el.querySelectorAll<SVGCircleElement>('circle[data-k]')];
    const heart = el.querySelector<SVGCircleElement>('circle[data-h]');
    const matrix = el.querySelector('feColorMatrix');
    let lastL = -1;
    let raf = 0;
    const tick = (ms: number) => {
      const since = ms - leapAt.current;
      const up = Math.min(1, since / LEAP_UP);
      const down = Math.min(1, Math.max(0, since - LEAP_UP) / LEAP_DOWN);
      const amp = 1 + (FIRE_LEAP - 1) * (1 - Math.pow(1 - up, 3)) * (0.5 + 0.5 * Math.cos(Math.PI * down));
      const t = ms / 1000;
      const l = low ? low.value : 0;
      const b = burst ? burst.value : 0;
      const a = amp * sputterAt(t, l);
      const shapes = fire.ops.map((o) => (o.move ? dOf(fireMove(o, t, a, l), o.subs) : ''));
      for (const { p, i } of paths) p.setAttribute('d', shapes[i]);
      fire.embers.forEach((e, i) => {
        const [x, y, r, alpha] = emberAt(e, t);
        dots[i].setAttribute('cx', x.toFixed(2));
        dots[i].setAttribute('cy', y.toFixed(2));
        dots[i].setAttribute('r', r.toFixed(2));
        dots[i].setAttribute('opacity', (alpha * (1 - 0.6 * l)).toFixed(2));
      });
      if (matrix && Math.abs(l - lastL) > 0.001) {
        matrix.setAttribute('values', lowMatrix(l).join(' '));
        lastL = l;
      }
      if (heart) {
        heart.setAttribute('cx', String(fire.heart.x));
        heart.setAttribute('cy', String(fire.heart.y));
        heart.setAttribute('r', (12 * fine).toFixed(2));
        heart.setAttribute('opacity', (l > 0.05 ? Math.min(1, l * 1.2) * (0.75 + 0.25 * Math.sin(t * 1.7)) : 0).toFixed(3));
      }
      const x0 = fire.tip.x + (fire.heart.x - fire.tip.x) * l * 0.5;
      const y0 = fire.tip.y + (fire.heart.y - fire.tip.y) * l * 0.5;
      wisps.forEach((c, i) => {
        const [x, y, r, alpha] = smokeAt(i, t, l, x0, y0, fine);
        c.setAttribute('cx', x.toFixed(2));
        c.setAttribute('cy', y.toFixed(2));
        c.setAttribute('r', (r * 1.6).toFixed(2));
        c.setAttribute('opacity', alpha.toFixed(3));
      });
      sparks.forEach((c, i) => {
        if (!(b > 0 && b < 1)) return void c.setAttribute('opacity', '0');
        const [ang, v, sz] = SPARKS[i];
        const p = Math.min(1, b * (1.1 + (i % 3) * 0.12));
        const d = 30 * fine * v * (1 - Math.pow(1 - p, 2.4));
        c.setAttribute('cx', (fire.heart.x + Math.sin(ang) * d).toFixed(2));
        c.setAttribute('cy', (fire.heart.y - Math.cos(ang) * d + 9 * fine * p * p).toFixed(2));
        c.setAttribute('r', (1.1 * fine * sz * (1 - 0.5 * p)).toFixed(2));
        c.setAttribute('opacity', (Math.max(0, 1 - p) * Math.min(1, p * 8)).toFixed(3));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire, html, onScreen, low, burst, fine]);
  const { x, y, w, h } = fire.box;
  return createElement('div', {
    ref: host,
    style: {
      position: 'absolute',
      left: (x - pad.side) * unit,
      top: (y - pad.up) * unit,
      width: (w + pad.side * 2) * unit,
      height: (h + pad.up) * unit,
      pointerEvents: 'none',
    },
  });
}
