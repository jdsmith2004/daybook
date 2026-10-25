/* Fit the shapes: a small block puzzle for the eyes and hands, in the app's own colors (the Block Blast kind). Three
   shapes wait under an 8 by 8 board; drag one up onto it, and a row or a column that fills clears with a pop. Clears in
   a row build a streak, and an empty board is a bonus.
   Planning where a shape fits takes the same room in the head as the pictures an urge runs on (Elaborated Intrusion
   theory: May and others 2010; a few minutes of a block game lowered cravings in daily life: Skorka-Brown and others
   2015), so the pictures fade while the hands are busy.
   There is no losing: when no shape left in the tray fits, fresh ones that fit are dealt. It runs for a set time, then
   the ride goes on to the next move.
   The shape rides above the thumb so it stays in sight, and the board shows where it would land and which lines it
   would clear before the thumb lets go. The dragged shape moves on the UI thread (Reanimated); the board changes only
   when the shape crosses into a new cell. */
import { memo, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { WavyLine } from '@/components/shapes';
import { Text } from '@/components/text';
import { T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { font, useTheme, type Palette } from '@/lib/theme';

import type { MoveProps } from './moves';

const N = 8;
/** how long a game is, in seconds */
export const STACK_SEC = 90;
/** the tray draws shapes at this size of a board cell */
const TRAY = 0.5;

type Cell = [number, number];
interface Shape {
  cells: Cell[];
  w: number;
  h: number;
  /** how often it is dealt */
  odds: number;
}
const shape = (rows: string[], odds: number): Shape => {
  const cells: Cell[] = [];
  rows.forEach((r, y) => r.split('').forEach((ch, x) => (ch === '#' ? cells.push([x, y]) : null)));
  return { cells, w: Math.max(...rows.map((r) => r.length)), h: rows.length, odds };
};
/* the shapes, the way the block puzzles deal them: no turning, so each way round is its own shape. Small ones come more
   often, so there is nearly always a move. */
const SHAPES: Shape[] = [
  shape(['#'], 3),
  shape(['##'], 3),
  shape(['#', '#'], 3),
  shape(['###'], 3),
  shape(['#', '#', '#'], 3),
  shape(['####'], 2),
  shape(['#', '#', '#', '#'], 2),
  shape(['#####'], 1),
  shape(['#', '#', '#', '#', '#'], 1),
  shape(['##', '##'], 3),
  shape(['###', '###', '###'], 1),
  shape(['###', '###'], 1),
  shape(['##', '##', '##'], 1),
  shape(['##', '#.'], 2),
  shape(['##', '.#'], 2),
  shape(['#.', '##'], 2),
  shape(['.#', '##'], 2),
  shape(['#..', '###'], 1.5),
  shape(['..#', '###'], 1.5),
  shape(['###', '#..'], 1.5),
  shape(['###', '..#'], 1.5),
  shape(['###', '#..', '#..'], 1),
  shape(['###', '..#', '..#'], 1),
  shape(['#..', '#..', '###'], 1),
  shape(['..#', '..#', '###'], 1),
  shape(['###', '.#.'], 1.5),
  shape(['.#.', '###'], 1.5),
  shape(['#.', '##', '#.'], 1.5),
  shape(['.#', '##', '.#'], 1.5),
  shape(['##.', '.##'], 1.5),
  shape(['.##', '##.'], 1.5),
  shape(['#.', '##', '.#'], 1.5),
  shape(['.#', '##', '#.'], 1.5),
];
const ODDS = SHAPES.reduce((a, s) => a + s.odds, 0);
const tints = (c: Palette) => [c.sky, c.sun, c.violet, c.coral, c.mint, c.sun2, c.accent];

interface Piece {
  k: number;
  tint: number;
  /** a new id for each shape dealt, so a fresh one pops in */
  id: number;
}
interface Game {
  /** the board, row by row: -1 for empty, or a color slot */
  board: number[][];
  /** when each cell was filled (a placement count), so a new block lands with a small bounce */
  at: number[][];
  tray: (Piece | null)[];
  score: number;
  lines: number;
  /** clears in a row; it lasts through up to two placements without a clear */
  streak: number;
  miss: number;
  n: number;
  /** the last clear, for the pop and the points that float up */
  pop: { id: number; cells: [number, number, number][]; pts: number; lines: number; streak: number; empty: boolean } | null;
  /** the tray was dealt fresh because nothing fit */
  fresh: number;
}

const blank = () => Array.from({ length: N }, () => Array.from({ length: N }, () => -1));
const fitsAt = (b: number[][], s: Shape, gx: number, gy: number) =>
  gx >= 0 && gy >= 0 && gx + s.w <= N && gy + s.h <= N && s.cells.every(([x, y]) => b[gy + y][gx + x] < 0);
const fitsAny = (b: number[][], s: Shape) => {
  for (let y = 0; y + s.h <= N; y++) for (let x = 0; x + s.w <= N; x++) if (fitsAt(b, s, x, y)) return true;
  return false;
};
/** the rows and columns that would be full with the shape at gx, gy */
function fullWith(b: number[][], s: Shape, gx: number, gy: number) {
  const filled = (x: number, y: number) => b[y][x] >= 0 || s.cells.some(([cx, cy]) => gx + cx === x && gy + cy === y);
  const rows: number[] = [];
  const cols: number[] = [];
  for (let i = 0; i < N; i++) {
    let r = true;
    let c = true;
    for (let j = 0; j < N; j++) {
      if (!filled(j, i)) r = false;
      if (!filled(i, j)) c = false;
    }
    if (r) rows.push(i);
    if (c) cols.push(i);
  }
  return { rows, cols };
}
/** where a shape does the most: the place that clears the most lines, else the first place it fits */
function bestAt(b: number[][], s: Shape): Cell | null {
  let best: Cell | null = null;
  let most = -1;
  for (let y = 0; y + s.h <= N; y++)
    for (let x = 0; x + s.w <= N; x++) {
      if (!fitsAt(b, s, x, y)) continue;
      const f = fullWith(b, s, x, y);
      const n = f.rows.length + f.cols.length;
      if (n > most) {
        most = n;
        best = [x, y];
      }
    }
  return best;
}
const pick = (from: number[]) => {
  const total = from.reduce((a, k) => a + SHAPES[k].odds, 0);
  let r = Math.random() * total;
  for (const k of from) {
    r -= SHAPES[k].odds;
    if (r <= 0) return k;
  }
  return from[from.length - 1];
};
const ALL = SHAPES.map((_, i) => i);
/** three new shapes. At least one always fits, and now and then one is dealt that can clear a line, so it stays kind. */
function deal(b: number[][], n: number, count = 3): Piece[] {
  const out: Piece[] = Array.from({ length: count }, (_, i) => ({ k: pick(ALL), tint: Math.floor(Math.random() * 7), id: n * 10 + i }));
  const fit = ALL.filter((k) => fitsAny(b, SHAPES[k]));
  if (!out.some((p) => fit.indexOf(p.k) >= 0)) out[0] = { ...out[0], k: fit.length ? pick(fit) : 0 };
  if (Math.random() < 0.4) {
    const clears = fit.filter((k) => {
      const at = bestAt(b, SHAPES[k]);
      if (!at) return false;
      const f = fullWith(b, SHAPES[k], at[0], at[1]);
      return f.rows.length + f.cols.length > 0;
    });
    if (clears.length) out[count - 1] = { ...out[count - 1], k: pick(clears) };
  }
  return out;
}
function start(): Game {
  const board = blank();
  return { board, at: blank(), tray: deal(board, 1), score: 0, lines: 0, streak: 0, miss: 0, n: 1, pop: null, fresh: 0 };
}

/** put the shape from a tray slot on the board: full lines clear, points add up, and the tray fills again when it is
    empty (or when nothing left in it fits) */
function place(g: Game, slot: number, gx: number, gy: number): Game {
  const p = g.tray[slot];
  if (!p) return g;
  const s = SHAPES[p.k];
  if (!fitsAt(g.board, s, gx, gy)) return g;
  const n = g.n + 1;
  const board = g.board.map((r) => r.slice());
  const at = g.at.map((r) => r.slice());
  s.cells.forEach(([x, y]) => {
    board[gy + y][gx + x] = p.tint;
    at[gy + y][gx + x] = n;
  });
  const { rows, cols } = fullWith(g.board, s, gx, gy);
  const gone: [number, number, number][] = [];
  const seen = new Set<string>();
  const clear = (x: number, y: number) => {
    const key = x + ',' + y;
    if (seen.has(key)) return;
    seen.add(key);
    gone.push([x, y, board[y][x]]);
    board[y][x] = -1;
  };
  rows.forEach((y) => {
    for (let x = 0; x < N; x++) clear(x, y);
  });
  cols.forEach((x) => {
    for (let y = 0; y < N; y++) clear(x, y);
  });
  const lines = rows.length + cols.length;
  const streak = lines ? g.streak + 1 : g.miss >= 2 ? 0 : g.streak;
  const miss = lines ? 0 : g.miss + 1;
  const empty = lines > 0 && board.every((r) => r.every((v) => v < 0));
  /* a block for each cell, ten a line (more for several at once), a little more for each clear in a row, and a bonus for
     an empty board */
  const pts = s.cells.length + (lines ? lines * lines * 10 + (streak > 1 ? streak * 10 : 0) : 0) + (empty ? 100 : 0);
  let tray = g.tray.map((x, i) => (i === slot ? null : x));
  let fresh = g.fresh;
  if (tray.every((x) => !x)) tray = deal(board, n);
  else if (!tray.some((x) => x && fitsAny(board, SHAPES[x.k]))) {
    /* no losing: nothing left fits, so fresh ones that do are dealt */
    const more = deal(board, n);
    tray = tray.map((x, i) => (x ? more[i] : null));
    if (!tray.some((x) => x && fitsAny(board, SHAPES[x.k]))) tray = deal(board, n);
    fresh = Date.now();
  }
  return {
    board,
    at,
    tray,
    score: g.score + pts,
    lines: g.lines + lines,
    streak,
    miss,
    n,
    pop: lines ? { id: n, cells: gone, pts, lines, streak, empty } : g.pop,
    fresh,
  };
}

/* ---------- the pieces of the picture ---------- */
/** one block: a soft square with a light top and a darker lip, like a sweet */
const Block = memo(function Block({ size, color, r }: { size: number; color: string; r: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: color, overflow: 'hidden' }}>
      <View style={[s.shine, { borderRadius: r, height: size * 0.42 }]} />
      <View style={[s.lip, { height: Math.max(2, size * 0.1) }]} />
    </View>
  );
});

/** a block that has just landed: a small bounce in */
function Landing({ children, on }: { children: ReactNode; on: boolean }) {
  const sc = useSharedValue(on ? 0.6 : 1);
  useEffect(() => {
    if (on) sc.value = withSpring(1, { damping: 9, stiffness: 320 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return <Reanimated.View style={st}>{children}</Reanimated.View>;
}

/** a cleared block: it swells, spins a little and is gone, one after another along the line */
function Burst({ x, y, size, color, r, delay }: { x: number; y: number; size: number; color: string; r: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const st = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateY: -t.value * size * 0.4 }, { scale: 1 + t.value * 0.35 }, { rotate: t.value * 25 + 'deg' }],
  }));
  return (
    <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: y }, st]}>
      <Block size={size} color={color} r={r} />
    </Reanimated.View>
  );
}

/** the points for a clear, floating up and away */
function Float({ text, sub, color }: { text: string; sub?: string; color: string }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const st = useAnimatedStyle(() => ({
    opacity: t.value < 0.7 ? 1 : 1 - (t.value - 0.7) / 0.3,
    transform: [{ translateY: -t.value * 40 }, { scale: t.value < 0.15 ? 0.6 + t.value * 2.7 : 1 }],
  }));
  return (
    <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.mid, st]}>
      <Text style={[s.float, { color }]}>{text}</Text>
      {sub ? <Text style={[s.floatSub, { color }]}>{sub}</Text> : null}
    </Reanimated.View>
  );
}

/** a shape waiting in the tray: it pops in when dealt */
function TrayPiece({ p, cell, i, hidden, color, r }: { p: Piece; cell: number; i: number; hidden: boolean; color: string; r: number }) {
  const sh = SHAPES[p.k];
  const sc = useSharedValue(0.2);
  useEffect(() => {
    sc.value = withDelay(i * 70, withSpring(1, { damping: 15, stiffness: 260 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  const gap = Math.max(1, Math.round(cell * 0.08));
  return (
    <Reanimated.View style={[{ width: sh.w * cell, height: sh.h * cell, opacity: hidden ? 0 : 1 }, st]}>
      {sh.cells.map(([x, y], j) => (
        <View key={j} style={{ position: 'absolute', left: x * cell + gap, top: y * cell + gap }}>
          <Block size={cell - gap * 2} color={color} r={r} />
        </View>
      ))}
    </Reanimated.View>
  );
}

/* ---------- the game ---------- */
export function StackMove({ on, onDone }: MoveProps) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const { mem, setMem } = useSos();
  const best = typeof mem.blastBest === 'number' ? (mem.blastBest as number) : 0;
  const [g, setG] = useState<Game>(start);
  const gRef = useRef(g);
  gRef.current = g;
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [t0] = useState(() => Date.now());
  const [, tick] = useReducer((x: number) => x + 1, 0);
  const [drag, setDrag] = useState<number | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const hoverRef = useRef(hover);
  hoverRef.current = hover;
  const dragRef = useRef<number | null>(null);
  const sec = Math.min(STACK_SEC, (Date.now() - t0) / 1000);
  const over = sec >= STACK_SEC && drag === null;
  const overRef = useRef(over);
  overRef.current = over;

  /* the size of everything, from the room there is: the board is 8 cells, then a gap, then the tray (3 cells tall) */
  const cell = box ? Math.floor(Math.min(box.w / N, box.h / 11.6)) : 0;
  const W = cell * N;
  const bx = box ? (box.w - W) / 2 : 0;
  const by = box ? Math.max(0, (box.h - cell * 11.6) / 2) : 0;
  const trayY = by + cell * 8.6;
  const slotW = W / 3;
  const tc = cell * TRAY;
  const gap = Math.max(1, Math.round(cell * 0.08));
  const r = Math.round(cell * 0.24);
  const lift = cell * 1.3;
  const geo = useRef({ cell, bx, by, trayY, slotW, tc, lift });
  geo.current = { cell, bx, by, trayY, slotW, tc, lift };

  /* the clock, once a second */
  useEffect(() => {
    if (!on || over) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [on, over]);
  useEffect(() => {
    if (!over) return;
    if (g.score > best) setMem((m) => ({ ...m, blastBest: g.score }));
    buzz('save');
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  /* the dragged shape: where its top left is, and how big */
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const dsc = useSharedValue(1);
  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateX: dx.value }, { translateY: dy.value }, { scale: dsc.value }] }));

  const home = (slot: number) => {
    const G = geo.current;
    const sh = SHAPES[gRef.current.tray[slot]!.k];
    return { x: G.bx + (slot + 0.5) * G.slotW - (sh.w * G.cell) / 2, y: G.trayY + 1.5 * G.cell - (sh.h * G.cell) / 2 };
  };
  const endDrag = () => {
    dragRef.current = null;
    setDrag(null);
    setHover(null);
  };
  const begin = (x: number, y: number) => {
    const G = geo.current;
    if (overRef.current || !G.cell || y < G.trayY - G.cell * 0.4) return;
    const slot = Math.floor((x - G.bx) / G.slotW);
    if (slot < 0 || slot > 2 || !gRef.current.tray[slot]) return;
    dragRef.current = slot;
    const h0 = home(slot);
    dx.value = h0.x;
    dy.value = h0.y;
    dsc.value = TRAY;
    dsc.value = withTiming(1, { duration: 110 });
    setDrag(slot);
    buzz('tick');
    move(x, y);
  };
  const move = (x: number, y: number) => {
    const slot = dragRef.current;
    if (slot === null) return;
    const G = geo.current;
    const sh = SHAPES[gRef.current.tray[slot]!.k];
    const px = x - (sh.w * G.cell) / 2;
    const py = y - sh.h * G.cell - G.lift;
    dx.value = px;
    dy.value = py;
    const gx = Math.round((px - G.bx) / G.cell);
    const gy = Math.round((py - G.by) / G.cell);
    const ok = fitsAt(gRef.current.board, sh, gx, gy);
    const h = hoverRef.current;
    if (ok ? !h || h.x !== gx || h.y !== gy : h) {
      const next = ok ? { x: gx, y: gy } : null;
      hoverRef.current = next;
      setHover(next);
    }
  };
  const end = () => {
    const slot = dragRef.current;
    if (slot === null) return;
    const h = hoverRef.current;
    if (h) {
      const before = gRef.current;
      const after = place(before, slot, h.x, h.y);
      if (after !== before) {
        if (after.lines > before.lines) {
          buzz('lit');
          if (after.lines - before.lines > 1 || after.streak > 1) setTimeout(() => buzz('land'), 140);
        } else buzz('land');
        gRef.current = after;
        setG(after);
      }
      endDrag();
      return;
    }
    /* it did not fit: back to the tray */
    const h0 = home(slot);
    dsc.value = withTiming(TRAY, { duration: 180 });
    dy.value = withTiming(h0.y, { duration: 180 });
    dx.value = withTiming(h0.x, { duration: 180 }, (fin) => {
      if (fin) runOnJS(endDrag)();
    });
    hoverRef.current = null;
    setHover(null);
  };
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onBegin((e) => begin(e.x, e.y))
        .onUpdate((e) => move(e.x, e.y))
        .onFinalize(() => end()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  /* for a screen reader: place the next shape where it does the most */
  const auto = () => {
    const before = gRef.current;
    for (let i = 0; i < 3; i++) {
      const p = before.tray[i];
      const at = p && bestAt(before.board, SHAPES[p.k]);
      if (p && at) {
        const after = place(before, i, at[0], at[1]);
        gRef.current = after;
        setG(after);
        return;
      }
    }
  };

  const TT = tints(c);
  const dragging = drag !== null ? g.tray[drag] : null;
  const dsh = dragging ? SHAPES[dragging.k] : null;
  /* what the board shows while a shape hovers: where it lands, and the lines it would clear, in its color */
  const ghost = new Set<string>();
  const lit = new Set<string>();
  if (dsh && hover) {
    dsh.cells.forEach(([x, y]) => ghost.add(hover.x + x + ',' + (hover.y + y)));
    const f = fullWith(g.board, dsh, hover.x, hover.y);
    f.rows.forEach((y) => {
      for (let x = 0; x < N; x++) lit.add(x + ',' + y);
    });
    f.cols.forEach((x) => {
      for (let y = 0; y < N; y++) lit.add(x + ',' + y);
    });
  }
  const bs = cell - gap * 2;
  const fresh = Date.now() - g.fresh < 1400;
  const newBest = over && g.score > best && g.score > 0;

  return (
    <View style={s.move}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Text style={[s.head, { color: c.ink }]}>{g.score}</Text>
          <T v="small" tone="muted">
            {g.streak > 1 ? 'Streak ' + g.streak + (best ? ' · best ' + best : '') : best ? 'Best ' + best : 'Fill a row or a column to clear it.'}
          </T>
        </View>
        <WavyLine width={88} p={sec / STACK_SEC} color={c.sky} track={c.sky + '33'} speed={0} />
      </View>
      <GestureDetector gesture={pan}>
        <View
          style={s.field}
          collapsable={false}
          onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={'A block puzzle. ' + g.score + ' points, ' + g.lines + (g.lines === 1 ? ' line' : ' lines') + ' cleared.'}
          accessibilityHint="Double tap to place the next shape where it fits best."
          accessibilityActions={[{ name: 'activate' }, { name: 'increment' }]}
          onAccessibilityAction={() => auto()}>
          {cell ? (
            <>
              {/* the board */}
              <View style={[s.board, { left: bx - 4, top: by - 4, width: W + 8, height: W + 8, borderRadius: r + 8, backgroundColor: c.ink + '0A' }]}>
                {g.board.map((row, y) =>
                  row.map((v, x) => {
                    const k = x + ',' + y;
                    const litC = dsh && lit.has(k) ? TT[dragging!.tint] : null;
                    const gh = dsh && ghost.has(k);
                    return (
                      <View key={k + ':' + (v >= 0 ? g.at[y][x] : 0)} style={{ position: 'absolute', left: 4 + x * cell + gap, top: 4 + y * cell + gap }}>
                        {v >= 0 ? (
                          <Landing on={!reduce && g.at[y][x] === g.n}>
                            <Block size={bs} color={litC || TT[v]} r={r} />
                          </Landing>
                        ) : gh ? (
                          <View style={{ opacity: 0.45 }}>
                            <Block size={bs} color={TT[dragging!.tint]} r={r} />
                          </View>
                        ) : (
                          <View style={{ width: bs, height: bs, borderRadius: r, backgroundColor: litC ? litC + '55' : c.ink + '0D' }} />
                        )}
                      </View>
                    );
                  }),
                )}
              </View>
              {/* the blocks a clear just took away, and its points */}
              {g.pop && !reduce
                ? g.pop.cells.map(([x, y, t], i) => (
                    <Burst key={g.pop!.id + ':' + i} x={bx + x * cell + gap} y={by + y * cell + gap} size={bs} color={TT[t]} r={r} delay={i * 14} />
                  ))
                : null}
              {g.pop ? (
                <View pointerEvents="none" style={[s.over, { left: bx, top: by, width: W, height: W }]}>
                  <Float
                    key={g.pop.id}
                    color={c.ink}
                    text={'+' + g.pop.pts}
                    sub={g.pop.empty ? 'Board clear!' : g.pop.streak > 1 ? 'Streak ' + g.pop.streak : g.pop.lines > 1 ? g.pop.lines + ' lines' : undefined}
                  />
                </View>
              ) : null}
              {/* the tray */}
              {g.tray.map((p, i) =>
                p ? (
                  <View
                    key={p.id}
                    pointerEvents="none"
                    style={[s.slot, { left: bx + i * slotW, top: trayY, width: slotW, height: cell * 3 }]}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants">
                    <TrayPiece p={p} cell={tc} i={i} hidden={drag === i} color={TT[p.tint]} r={Math.round(tc * 0.24)} />
                  </View>
                ) : null,
              )}
              {fresh ? (
                <View pointerEvents="none" style={[s.over, { left: bx, top: trayY - cell * 0.55, width: W }]}>
                  <T v="small" tone="muted" style={{ fontFamily: font.bodySemi }}>
                    New shapes
                  </T>
                </View>
              ) : null}
              {/* the shape under the thumb */}
              {dragging && dsh ? (
                <Reanimated.View pointerEvents="none" style={[s.drag, { width: dsh.w * cell, height: dsh.h * cell }, dragStyle]}>
                  {dsh.cells.map(([x, y], j) => (
                    <View key={j} style={{ position: 'absolute', left: x * cell + gap, top: y * cell + gap }}>
                      <Block size={bs} color={TT[dragging.tint]} r={r} />
                    </View>
                  ))}
                </Reanimated.View>
              ) : null}
              {over ? (
                <View
                  pointerEvents="none"
                  style={[s.over, s.done, { left: bx, top: by, width: W, height: W, borderRadius: r + 8, backgroundColor: c.bg + 'E6' }]}>
                  <Text style={[s.doneN, { color: c.ink }]}>{g.score}</Text>
                  <T style={{ textAlign: 'center' }}>{newBest ? 'A new best.' : 'Your eyes were busy.'}</T>
                  <T v="small" tone="muted" style={{ textAlign: 'center' }}>
                    Notice how the urge feels now.
                  </T>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </GestureDetector>
      <T v="small" tone="muted" style={{ textAlign: 'center' }}>
        Drag a shape onto the board
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  move: { flexGrow: 1, alignSelf: 'stretch', gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, minHeight: 56 },
  head: { fontFamily: font.displayBold, fontSize: 32, lineHeight: 38 },
  field: { flexGrow: 1, minHeight: 360, alignSelf: 'stretch' },
  board: { position: 'absolute' },
  slot: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  drag: { position: 'absolute', left: 0, top: 0 },
  over: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  mid: { alignItems: 'center', justifyContent: 'center' },
  shine: { position: 'absolute', left: '12%', right: '12%', top: '8%', backgroundColor: 'rgba(255, 255, 255, 0.26)' },
  lip: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.14)' },
  float: { fontFamily: font.displayBold, fontSize: 44, lineHeight: 50 },
  floatSub: { fontFamily: font.bodySemi, fontSize: 16 },
  done: { gap: 4, padding: 16 },
  doneN: { fontFamily: font.displayBold, fontSize: 56, lineHeight: 62 },
});
