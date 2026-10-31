/* The flame's fire on the web (core flame-fire.ts says what moves and how; a phone draws it with Skia, fire-layer.native.tsx): the same outlines in one
   SVG, whose paths are given their new shapes each frame. A browser does that cheaply, and the page does not have to carry Skia. It rests when its
   screen is covered, and each change of `leap` (a tap) makes it leap and settle. */
import { emberAt, FIRE_LEAP, fireMove, type Fire, type FireOp, type FirePaint } from '@daybook/core';
import { createElement, useEffect, useMemo, useRef } from 'react';

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
let seq = 0;
function drawing(fire: Fire) {
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
    body += '<circle fill="#FFE27A"/>';
  });
  const { x, y, w, h } = fire.box;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="100%" height="100%" style="display:block;overflow:visible"><defs>${defs}</defs>${body}</svg>`;
}

/** the fire, placed in a drawing shown at `unit` points to each of its units (it fills `fire.box`) */
export function FireLayer({ fire, unit, leap = 0 }: { fire: Fire; unit: number; leap?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const leapAt = useRef(-1e6);
  const onScreen = useOnScreen();
  const html = useMemo(() => drawing(fire), [fire]);
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
    const dots = [...el.querySelectorAll<SVGCircleElement>('circle')];
    let raf = 0;
    const tick = (ms: number) => {
      const since = ms - leapAt.current;
      const up = Math.min(1, since / LEAP_UP);
      const down = Math.min(1, Math.max(0, since - LEAP_UP) / LEAP_DOWN);
      const amp = 1 + (FIRE_LEAP - 1) * (1 - Math.pow(1 - up, 3)) * (0.5 + 0.5 * Math.cos(Math.PI * down));
      const t = ms / 1000;
      const shapes = fire.ops.map((o) => (o.move ? dOf(fireMove(o, t, amp), o.subs) : ''));
      for (const { p, i } of paths) p.setAttribute('d', shapes[i]);
      fire.embers.forEach((e, i) => {
        const [x, y, r, alpha] = emberAt(e, t);
        dots[i].setAttribute('cx', x.toFixed(2));
        dots[i].setAttribute('cy', y.toFixed(2));
        dots[i].setAttribute('r', r.toFixed(2));
        dots[i].setAttribute('opacity', alpha.toFixed(2));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fire, html, onScreen]);
  const { x, y, w, h } = fire.box;
  return createElement('div', {
    ref: host,
    style: { position: 'absolute', left: x * unit, top: y * unit, width: w * unit, height: h * unit, pointerEvents: 'none' },
  });
}
