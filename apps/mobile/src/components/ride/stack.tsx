/* Stack the shapes: a small falling-block game for the eyes and hands, in the app's own soft shapes and colors. Pieces
   fall into a narrow well; slide them, turn them and drop them so they fill a row, and a full row clears. It is the kind
   of game the craving studies used (a few minutes of Tetris lowered cravings in daily life: Skorka-Brown and others
   2015), because planning where a shape fits takes the same room in the head as the pictures an urge runs on.
   There is no losing: when the well fills up it clears itself and play goes on. It runs for a set time, then the ride
   goes on to the next move.
   Controls, all on the well itself: tap the left or right side to slide, tap the middle to turn, swipe sideways to slide
   further, swipe down to drop. */
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { WavyLine } from '@/components/shapes';
import { Text } from '@/components/text';
import { T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useSos } from '@/lib/sos';
import { font, useTheme, type Palette } from '@/lib/theme';

import type { MoveProps } from './moves';

const COLS = 8;
const ROWS = 13;
/** how long a game is, in seconds */
export const STACK_SEC = 75;

type Cell = [number, number];
/** the seven pieces, as cells from their top left, each with its color slot */
const PIECES: { cells: Cell[]; tint: number }[] = [
  {
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ],
    tint: 0,
  },
  {
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    tint: 1,
  },
  {
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ],
    tint: 2,
  },
  {
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    tint: 3,
  },
  {
    cells: [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    tint: 4,
  },
  {
    cells: [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    tint: 5,
  },
  {
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    tint: 6,
  },
];
const tints = (c: Palette) => [c.sky, c.sun, c.violet, c.coral, c.mint, c.sun2, c.accent];

interface Piece {
  cells: Cell[];
  x: number;
  y: number;
  tint: number;
}
interface Game {
  /** the well, row by row: -1 for empty, or a color slot */
  well: number[][];
  piece: Piece;
  /** the next piece's index, shown small */
  next: number;
  lines: number;
  /** rows just cleared (their old indexes), for the flash */
  flash: number[];
  flashAt: number;
  /** the well filled up and was cleared, for the word that says so */
  fresh: number;
  /** a turn in the bag of seven, so every piece comes round */
  bag: number[];
}

const empty = () => Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => -1));
const shuffle = (n: number) => {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const spawn = (k: number): Piece => {
  const p = PIECES[k];
  const w = Math.max(...p.cells.map((c) => c[0])) + 1;
  return { cells: p.cells, x: Math.floor((COLS - w) / 2), y: 0, tint: p.tint };
};
const fits = (well: number[][], p: Piece) =>
  p.cells.every(([cx, cy]) => {
    const x = p.x + cx;
    const y = p.y + cy;
    return x >= 0 && x < COLS && y < ROWS && (y < 0 || well[y][x] < 0);
  });
/** a quarter turn, kept at the top left of its own box */
const turn = (cells: Cell[]): Cell[] => {
  const r = cells.map(([x, y]) => [-y, x] as Cell);
  const mx = Math.min(...r.map((c) => c[0]));
  const my = Math.min(...r.map((c) => c[1]));
  return r.map(([x, y]) => [x - mx, y - my] as Cell);
};

function start(): Game {
  const bag = shuffle(7);
  const first = bag.shift()!;
  const next = bag.shift()!;
  return { well: empty(), piece: spawn(first), next, lines: 0, flash: [], flashAt: 0, fresh: 0, bag };
}

type Act = 'left' | 'right' | 'turn' | 'down' | 'drop' | { slide: number };

/** one step of the game: a move, or the piece falling a row; a piece that cannot fall lands, full rows clear, and the
    next piece comes in */
function step(g: Game, a: Act): Game {
  const p = g.piece;
  const tryP = (q: Piece) => (fits(g.well, q) ? { ...g, piece: q } : g);
  if (a === 'left') return tryP({ ...p, x: p.x - 1 });
  if (a === 'right') return tryP({ ...p, x: p.x + 1 });
  if (typeof a === 'object') {
    let q = p;
    const d = Math.sign(a.slide);
    for (let i = 0; i < Math.abs(a.slide); i++) {
      const n = { ...q, x: q.x + d };
      if (!fits(g.well, n)) break;
      q = n;
    }
    return { ...g, piece: q };
  }
  if (a === 'turn') {
    const cells = turn(p.cells);
    /* a turn against a wall slides over a little, if that makes it fit */
    for (const k of [0, -1, 1, -2, 2]) {
      const q = { ...p, cells, x: p.x + k };
      if (fits(g.well, q)) return { ...g, piece: q };
    }
    return g;
  }
  let q = p;
  if (a === 'drop') while (fits(g.well, { ...q, y: q.y + 1 })) q = { ...q, y: q.y + 1 };
  else if (fits(g.well, { ...q, y: q.y + 1 })) return { ...g, piece: { ...q, y: q.y + 1 } };
  /* it lands */
  const well = g.well.map((r) => r.slice());
  q.cells.forEach(([cx, cy]) => {
    const y = q.y + cy;
    if (y >= 0) well[y][q.x + cx] = q.tint;
  });
  const full = well.map((r, i) => (r.every((v) => v >= 0) ? i : -1)).filter((i) => i >= 0);
  const kept = well.filter((_, i) => full.indexOf(i) < 0);
  while (kept.length < ROWS) kept.unshift(Array.from({ length: COLS }, () => -1));
  let bag = g.bag.length ? g.bag.slice() : shuffle(7);
  const piece = spawn(g.next);
  const next = bag.shift()!;
  if (!bag.length) bag = shuffle(7);
  const out: Game = { ...g, well: kept, piece, next, bag, lines: g.lines + full.length, flash: full, flashAt: full.length ? Date.now() : g.flashAt };
  /* no losing: a full well clears itself and play goes on */
  if (!fits(kept, piece)) return { ...out, well: empty(), fresh: Date.now() };
  return out;
}

export function StackMove({ on, onDone }: MoveProps) {
  const c = useTheme();
  const { mem, setMem } = useSos();
  const best = typeof mem.stackBest === 'number' ? (mem.stackBest as number) : 0;
  const [g, setG] = useState<Game>(start);
  const gRef = useRef(g);
  gRef.current = g;
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const cell = box ? Math.floor(Math.min(box.w / COLS, box.h / ROWS)) : 0;
  const [t0] = useState(() => Date.now());
  const [, tick] = useReducer((x: number) => x + 1, 0);
  const sec = Math.min(STACK_SEC, (Date.now() - t0) / 1000);
  const over = sec >= STACK_SEC;

  const overRef = useRef(over);
  overRef.current = over;
  const act = (a: Act) => {
    if (overRef.current) return;
    const before = gRef.current;
    const after = step(before, a);
    if (after === before) return;
    /* a row cleared is the big buzz; a piece landing a firm knock; a slide or a turn a faint click */
    if (after.lines > before.lines) buzz('lit');
    else if (after.well !== before.well) buzz('land');
    else if (a !== 'down') buzz('tick');
    gRef.current = after;
    setG(after);
  };
  /* the piece falls on its own, a little faster as rows clear */
  useEffect(() => {
    if (!on || over) return;
    const ms = Math.max(360, 760 - gRef.current.lines * 30);
    const id = setInterval(() => {
      act('down');
      tick();
    }, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, over, g.lines]);
  /* the clock under the well, once a second */
  useEffect(() => {
    if (!on || over) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [on, over]);
  useEffect(() => {
    if (!over) return;
    if (g.lines > best) setMem((m) => ({ ...m, stackBest: g.lines }));
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over]);

  /* taps and swipes on the well */
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderRelease: (e, s) => {
          const w = boxRef.current?.w || 1;
          const cw = cellRef.current || 30;
          if (s.dy > 50 && Math.abs(s.dy) > Math.abs(s.dx)) return act('drop');
          if (Math.abs(s.dx) > 24) return act({ slide: Math.round(s.dx / cw) || Math.sign(s.dx) });
          const x = e.nativeEvent.locationX;
          if (x < w / 3) act('left');
          else if (x > (w * 2) / 3) act('right');
          else act('turn');
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const boxRef = useRef(box);
  boxRef.current = box;
  const cellRef = useRef(cell);
  cellRef.current = cell;

  const T_ = tints(c);
  const p = g.piece;
  let ghostY = p.y;
  while (fits(g.well, { ...p, y: ghostY + 1 })) ghostY++;
  const flashing = Date.now() - g.flashAt < 260;
  const W = cell * COLS;
  const H = cell * ROWS;
  const gap = Math.max(1, Math.round(cell * 0.08));
  const r = Math.round(cell * 0.3);
  const block = (x: number, y: number, color: string, k: string, ghost?: boolean) => (
    <View
      key={k}
      style={[
        s.block,
        {
          left: x * cell + gap,
          top: y * cell + gap,
          width: cell - gap * 2,
          height: cell - gap * 2,
          borderRadius: r,
        },
        ghost ? { borderWidth: 2, borderColor: color, opacity: 0.45 } : { backgroundColor: color },
      ]}
    />
  );
  const nx = PIECES[g.next];
  return (
    <View style={s.move}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Text style={[s.head, { color: c.ink }]}>{over ? (g.lines === 1 ? '1 row' : g.lines + ' rows') : 'Stack the shapes'}</Text>
          <T v="small" tone="muted">
            {over
              ? g.lines > best && g.lines
                ? 'A new best. Notice how the urge feels now.'
                : 'Your eyes were busy. Notice how the urge feels now.'
              : 'Fill a row to clear it. ' + g.lines + (g.lines === 1 ? ' row' : ' rows') + (best ? ' · best ' + best : '')}
          </T>
        </View>
        {/* the next piece, small */}
        <View style={s.next} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {nx.cells.map(([x, y], i) => (
            <View key={i} style={[s.nb, { left: x * 11, top: y * 11, backgroundColor: T_[nx.tint] }]} />
          ))}
        </View>
      </View>
      <View
        style={s.field}
        onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={'A block game. ' + g.lines + ' rows cleared.'}
        accessibilityHint="Swipe up or down with one finger to turn the piece or drop it."
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') act('turn');
          else if (e.nativeEvent.actionName === 'decrement') act('drop');
          else act('turn');
        }}
        {...pan.panHandlers}>
        {cell ? (
          <View style={[s.well, { width: W, height: H, backgroundColor: c.ink + '0F', borderRadius: r + 6 }]}>
            {g.well.map((row, y) => row.map((v, x) => (v >= 0 ? block(x, y, T_[v], 'w' + x + '-' + y) : null)))}
            {!over ? p.cells.map(([x, y], i) => block(p.x + x, ghostY + y, T_[p.tint], 'g' + i, true)) : null}
            {!over ? p.cells.map(([x, y], i) => (p.y + y >= 0 ? block(p.x + x, p.y + y, T_[p.tint], 'p' + i) : null)) : null}
            {flashing ? (
              <Appear key={g.flashAt} by={0} duration={120} style={[StyleSheet.absoluteFill, s.clear]}>
                <Text style={[s.plus, { color: c.ink }]}>+{g.flash.length}</Text>
              </Appear>
            ) : null}
            {Date.now() - g.fresh < 1400 ? (
              <View style={[StyleSheet.absoluteFill, s.clear]}>
                <T v="small" style={{ fontFamily: font.bodySemi }}>
                  Fresh board
                </T>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
      <View style={s.line}>
        <WavyLine width={220} p={sec / STACK_SEC} color={c.sky} track={c.sky + '33'} speed={0} />
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          Tap a side to slide · tap the middle to turn · swipe down to drop
        </T>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  move: { flexGrow: 1, alignSelf: 'stretch', gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, minHeight: 56 },
  head: { fontFamily: font.displayBold, fontSize: 24, lineHeight: 29 },
  next: { width: 44, height: 22, marginRight: 4 },
  nb: { position: 'absolute', width: 10, height: 10, borderRadius: 3 },
  field: { flexGrow: 1, minHeight: 300, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  well: { position: 'relative', overflow: 'hidden' },
  block: { position: 'absolute' },
  clear: { alignItems: 'center', justifyContent: 'center' },
  plus: { fontFamily: font.displayBold, fontSize: 40 },
  line: { alignItems: 'center', gap: 6 },
});
