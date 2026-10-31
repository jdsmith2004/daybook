/* The flame in its own sky, for the top of Today (emblem.ts emblemScene), and the icon calendar (flame-art.ts). */
import { describe, expect, it } from 'vitest';
import { emblemLayers, emblemScene, emblemXml } from '../src/emblem';
import { firePartsOf, SHAPES, type FirePart } from '../src/flame-art';
import { FIRE_LEAP, fireMove, fireOf, tipsOf, type FireOp } from '../src/flame-fire';
import { ICON_CALENDAR, ICON_LOOKS, iconLookFor } from '../src/flame-art';

describe('the flame in its own sky', () => {
  it('every level has a sky, and the round frame is softened away', () => {
    for (let l = 1; l <= 60; l++) {
      const sc = emblemScene(l);
      expect(sc.sky.every((x) => /^#[0-9A-Fa-f]{6}$/.test(x))).toBe(true);
      expect(sc.at[0]).toBeLessThan(sc.at[1]);
      expect(sc.at[1]).toBeLessThan(sc.at[2]);
      expect(sc.xml).not.toMatch(/clip-path="url\(#em\d+cp\)"/);
      expect(sc.xml).not.toMatch(/r="57\.2" fill="none"/);
    }
  });
  it('no two parts of a drawing share an id (a shared one breaks the soft frame)', () => {
    for (let l = 1; l <= 60; l++) {
      const ids = [...emblemScene(l).xml.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size, `level ${l}`).toBe(ids.length);
    }
  });
  it('a night sky has stars and light words; a day sky has dark words', () => {
    const night = emblemScene(17);
    expect(night.stars).toBe(true);
    expect(night.ink).toBe('light');
    expect(night.xml).toMatch(/mask="url\(#em\d+fm\)"/);
    const day = emblemScene(40);
    expect(day.stars).toBe(false);
    expect(day.ink).toBe('dark');
    expect(day.ground).toBe('#2E8E6E');
    /* the card's ground is the drawing's own hills, run on past its edges, so the hills are drawn once */
    expect(day.land).toMatch(/^<path d="M-1000 96H-2C/);
    expect(day.land).toContain('fill="#2E8E6E"');
    expect(night.land).toMatch(/^<path d="M-1000 /);
    /* every drawing with hills gives them to the card, the sunrise too */
    for (let l = 1; l <= 60; l++) expect(!!emblemScene(l).land, `level ${l}`).toBe(/<path d="M-2 [\d.]+C[^"]*V122H-2Z"/.test(emblemScene(l).xml));
    expect(emblemScene(33).land).toBeTruthy();
    expect(emblemScene(33).ink).toBe('light');
    /* the full suns shine in a clear day sky */
    expect(emblemScene(46).sky).toEqual(['#3FA2FF', '#86CCFF', '#CFEBFF']);
  });
});

describe('the flame in layers, so only the figure moves', () => {
  it('every level splits into the sky, the glow, the figure and what is in front, which add up to the whole drawing', () => {
    for (let l = 1; l <= 120; l++) {
      const soft = l <= 60;
      const L = emblemLayers(soft ? l : l - 60, soft)!;
      expect(L).toBeTruthy();
      const whole = soft ? emblemScene(l).xml : emblemXml(l - 60);
      const inner = (x: string) => x.replace(/\bem\d+[a-d]?/g, 'emX').replace(/^.*?<\/defs>/s, '');
      const parts = [L.back, L.glow, L.side, L.fig, L.front].map(inner);
      /* every shape of the drawing is in exactly one layer */
      const shapes = (x: string) => (x.match(/<(path|circle|ellipse|rect|polygon)\b[^>]*>/g) || []).length;
      expect(parts.reduce((n, p) => n + shapes(p), 0)).toBe(shapes(inner(whole)));
      [L.back, L.glow, L.side, L.fig, L.still, L.front].forEach((x) => {
        if (!x) return;
        expect(x.startsWith('<svg')).toBe(true);
        expect(x.endsWith('</svg>')).toBe(true);
        expect((x.match(/<g\b[^>]*[^/]>|<g>/g) || []).length).toBe((x.match(/<\/g>/g) || []).length);
        expect(x).not.toMatch(/class=/);
      });
      expect(L.fig).toMatch(/<g>/);
      expect(L.at.x).toBeGreaterThan(0.2);
      expect(L.at.y).toBeGreaterThan(0.2);
    }
  });
});

describe('the fire: the face and the body hold still, and the tips lick', () => {
  it('a tongue moves as one: it changes to the next only at a low corner of the outline, never partway down an edge', () => {
    for (const d of Object.values(SHAPES).flat().filter(Boolean) as string[]) {
      const pts = (d.match(/-?\d*\.?\d+/g) || []).map(Number);
      const of = tipsOf(pts);
      const y = (p: number) => pts[p * 2 + 1];
      const count = (pts.length - 2) / 2;
      for (let p = 0; p < count; p++) {
        const q = (p + 1) % count;
        if (of[p] === of[q]) continue;
        expect(p % 3).toBe(0);
        expect(y(p)).toBeGreaterThan(y((p + 3) % count));
        expect(y(p)).toBeGreaterThan(y((p + count - 3) % count));
      }
    }
  });
  const moved = (op: FireOp, t: number) => {
    const p = fireMove(op, t, FIRE_LEAP);
    return op.pts.map((v, i) => Math.abs(v - p[i]));
  };
  it('every level has fire, and its numbers are real at any moment', () => {
    for (let l = 1; l <= 60; l++) {
      const fire = fireOf(l);
      expect(fire.ops.some((o) => o.move && !o.side)).toBe(true);
      for (const o of fire.ops) {
        expect(o.pts.length / 2).toBe(o.subs.reduce((a, b) => a + b, 0));
        if (o.clip >= 0) expect(fire.ops[o.clip].pts.length).toBeGreaterThan(0);
        for (const t of [0, 1.7, 1000.3]) expect(fireMove(o, t, 1).every(Number.isFinite)).toBe(true);
      }
    }
  });
  it('the moving tips stay inside the area drawn for the fire, even at the top of a leap', () => {
    for (let l = 1; l <= 60; l++) {
      const fire = fireOf(l);
      const { x, y, w, h } = fire.box;
      for (const o of fire.ops) {
        if (o.clip >= 0) continue;
        for (let t = 0; t < 12; t += 0.37) {
          const p = fireMove(o, t, FIRE_LEAP);
          for (let i = 0; i < p.length; i += 2) {
            expect(p[i]).toBeGreaterThanOrEqual(x);
            expect(p[i]).toBeLessThanOrEqual(x + w);
            expect(p[i + 1]).toBeGreaterThanOrEqual(y);
            expect(p[i + 1]).toBeLessThanOrEqual(y + h);
          }
        }
      }
    }
  });
  it('a flame moves only above its brows, and its tip really moves', () => {
    for (let l = 1; l <= 30; l++) {
      const body = fireOf(l, false).ops.filter((o) => o.move);
      const parts = firePartsOf(l).filter((p) => p.t === 'flame' && !p.side);
      expect(parts.length).toBe(1);
      const p = parts[0] as Extract<FirePart, { t: 'flame' }>;
      /* the top of the brows, in the drawing: the face is centred at 84 in the flame's box (88 for the small ones, a little smaller) */
      const brows = p.by - p.k * (120 - (p.kind === 'full' ? 57 : 62));
      for (const o of body) {
        for (let t = 0; t < 8; t += 0.53) {
          const d = moved(o, t);
          for (let i = 0; i < o.pts.length; i += 2) if (o.pts[i + 1] >= brows + p.k * 7) expect(d[i] + d[i + 1]).toBe(0);
        }
      }
      const top = body[0];
      const tip = top.pts.reduce((best, v, i) => (i % 2 && v < top.pts[best] ? i : best), 1);
      let most = 0;
      for (let t = 0; t < 8; t += 0.1) most = Math.max(most, moved(top, t)[tip]);
      expect(most).toBeGreaterThan(p.k * 8);
    }
  });
  it('a sun moves only past the edge of its disc', () => {
    for (let l = 31; l <= 55; l++) {
      const sun = firePartsOf(l).find((p) => p.t === 'sun') as Extract<FirePart, { t: 'sun' }>;
      for (const o of fireOf(l).ops) {
        for (let t = 0; t < 8; t += 0.53) {
          const d = moved(o, t);
          for (let i = 0; i < o.pts.length; i += 2) if (Math.hypot(o.pts[i] - sun.cx, o.pts[i + 1] - sun.cy) < sun.r * 0.99) expect(d[i] + d[i + 1]).toBe(0);
        }
      }
    }
  });
  it('the figure is split into what moves and what holds still: a face in every form, and nothing of the fire in it', () => {
    for (let l = 1; l <= 60; l++) {
      const L = emblemLayers(l, true)!;
      expect(L.still).toMatch(/M-6\.5 101Q0 107\.5 6\.5 101/);
      expect(L.still).not.toMatch(/fill="url\(#em\d+f[od]\)"/);
      expect(L.still).not.toMatch(/<g mask=|<g clip-path="url\(#em\d+fcp\)"/);
    }
  });
  it('the sunrise never hides the face behind the hills, and it keeps climbing into the morning', () => {
    let last = 200;
    for (let l = 31; l <= 40; l++) {
      const sun = firePartsOf(l).find((p) => p.t === 'sun') as Extract<FirePart, { t: 'sun' }>;
      /* the mouth is under the middle of the disc, and the first hill's crest is no higher than 85 */
      if (l <= 35) expect(sun.cy + sun.r * 0.42).toBeLessThan(85);
      expect(sun.cy).toBeLessThanOrEqual(last);
      last = sun.cy;
    }
  });
});

describe('the icon calendar', () => {
  it('picks the look for the day an update reaches people, a few days after it is built', () => {
    expect(iconLookFor('2026-10-26')).toBe('halloween');
    expect(iconLookFor('2026-10-30')).toBe('autumn');
    expect(iconLookFor('2026-11-28')).toBe('winter');
    expect(iconLookFor('2026-12-25')).toBe('newyear');
    expect(iconLookFor('2027-01-01')).toBe('newyear');
    expect(iconLookFor('2027-01-02')).toBeNull();
    expect(iconLookFor('2027-02-05')).toBe('valentine');
    expect(iconLookFor('2027-06-10')).toBeNull();
    for (const c of ICON_CALENDAR) expect(ICON_LOOKS).toContain(c.look);
  });
});
