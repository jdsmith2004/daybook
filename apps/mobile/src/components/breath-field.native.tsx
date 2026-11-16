/* The breathing figure: a field of small crisp dots that breathes, with the words for each step under it in a quiet italic
   and a tiny nose or lips to say which way the air goes. Nothing else. (The owner, November 15, 2026, after filming How We
   Feel's breathing: "I want ours to be more like this, or almost exactly like this ... we could still have a sun theme".)

   It opens with a few seconds to settle: one small dot in the dark, slowly growing, its color drifting from gold through
   to violet. Then the dot bursts into the figure and the breath starts.

   The sigh is rings of dots round a small gold heart, the sun, which never changes color. A breath in sends the rings out
   from the middle, the inner ones first; the second, short breath in pushes them the rest of the way; the long breath out
   winds them back in. Color tells the step, like a sky: rose at the start of a breath in, coral, then full sun gold at
   the top, and the breath out cools through spring green and mint to teal. Every dot reads one clock on the UI thread
   (lib/breath), so nothing ticks and nothing drifts. With Reduce Motion the figure holds still, and only the color and the
   words change. The timing is core breath-field.ts. */
import { FIELD_PATTERNS, FIELD_SETTLE, fieldAt, type FieldBy, type FieldId } from '@daybook/core';
import { memo, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

import { breathAt, useBreathClock, webDeps, type Steps } from '@/lib/breath';
import { useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

const TAU = Math.PI * 2;
/** rings round the heart, and how far apart their dots sit (in ring gaps) */
const RINGS = 5;
const GAP = 1.25;
/** how small the figure is on an empty breath (a part of its full size) */
const MIN = 0.3;
/** each ring follows the breath this many seconds after the one inside it, so a breath rolls out from the middle */
const LAG = 0.06;
/** how far the figure winds as it empties, in radians */
const WIND = 0.55;
/** seconds the burst takes, from one dot to the figure */
const BURST = 0.75;
/** where the figure rests with Reduce Motion on */
const STILL_V = 0.62;
/** the sun at the heart of the figure */
const GOLD = [255, 210, 90];

/** a steady random number (0 to 1) for a dot, the same every time */
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

type DotLook = {
  /** 0 for the heart, 1 and up for the rings */
  ring: number;
  /** how far out it sits at a full breath (a part of the figure's radius), and its angle there */
  rr: number;
  a0: number;
  /** how fast its ring turns, radians a second */
  w: number;
  lag: number;
  /** the burst: how far it is thrown, and which way */
  kick: number;
  ka: number;
  /** how much paler than the step's color it is (0 to 1) */
  pale: number;
};

const LOOKS: DotLook[] = (() => {
  const out: DotLook[] = [];
  /* the heart: one dot with six round it */
  for (let j = 0; j < 7; j++)
    out.push({ ring: 0, rr: j ? 1 : 0, a0: (j / 6) * TAU, w: 0.1, lag: 0, kick: 0.1 + rnd(j + 0.5) * 0.12, ka: rnd(j + 9) * TAU, pale: 0 });
  for (let r = 1; r <= RINGS; r++) {
    const rr = (r + 0.6) / (RINGS + 0.6);
    const n = Math.round((TAU * (r + 0.6)) / GAP);
    for (let j = 0; j < n; j++) {
      const k = r * 97 + j;
      out.push({
        ring: r,
        rr: rr + (rnd(k + 1) - 0.5) * 0.035,
        a0: ((j + (r % 2) * 0.5 + (rnd(k + 2) - 0.5) * 0.3) / n) * TAU,
        w: 0.14 - 0.014 * r,
        lag: LAG * r,
        kick: 0.25 + rnd(k + 3) * 0.5,
        ka: rnd(k + 4) * TAU,
        pale: rnd(k + 5) * 0.16,
      });
    }
  }
  return out;
})();

/* the colors of a breath, as [part of the round (0 to 1), red, green, blue]: rose, coral, sun gold at the top, then cooling */
type Keys = number[][];
const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const keysOf = (rows: [number, string][], total: number): Keys => rows.map(([t, h]) => [t / total, ...hex(h)]);
const SKY: Record<FieldId, [number, string][]> = {
  sigh: [
    [0, '#E78BD2'],
    [1, '#F57B98'],
    [2, '#FF8D63'],
    [3, '#FFC64A'],
    [4.3, '#FFDD6B'],
    [5.6, '#C6E678'],
    [6.8, '#7CE0A8'],
    [8, '#5FCDD8'],
    [8.6, '#86A4F4'],
    [9, '#E78BD2'],
  ],
};
/* the settle dot's colors over its seconds: gold first, the sun, then drifting cool, and it bursts into the rose of a breath in */
const SETTLE_SKY: Keys = keysOf(
  [
    [0, '#FFD25A'],
    [1.5, '#BDE379'],
    [2.5, '#7CE0A8'],
    [3.5, '#5FCDD8'],
    [4.4, '#86A4F4'],
    [5, '#B88CF2'],
  ],
  5,
);

/** the color at `x` (0 to 1) of a list of keys, as [red, green, blue] */
function skyAt(keys: Keys, x: number): number[] {
  'worklet';
  let i = 1;
  while (i < keys.length - 1 && keys[i][0] < x) i++;
  const a = keys[i - 1];
  const b = keys[i];
  const f = Math.min(1, Math.max(0, (x - a[0]) / Math.max(0.0001, b[0] - a[0])));
  return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f];
}
function rgb(c: number[], pale = 0) {
  'worklet';
  return `rgb(${Math.round(c[0] + (255 - c[0]) * pale)},${Math.round(c[1] + (255 - c[1]) * pale)},${Math.round(c[2] + (255 - c[2]) * pale)})`;
}

/* the tiny pictures under the words: a nose for a breath in, lips for a breath out */
const NOSE = '<path d="M9.6 4.5C9.6 9 5.6 11.4 5.6 14.8a2.6 2.6 0 0 0 4.6 1.7c1 .9 2.6.9 3.6 0a2.6 2.6 0 0 0 4.6-1.7C18.4 11.4 14.4 9 14.4 4.5"/>';
const LIPS =
  '<path d="M2.8 12c3-3 5.3-4.1 7.1-4.1.9 0 1.5.5 2.1.5s1.2-.5 2.1-.5c1.8 0 4.1 1.1 7.1 4.1-3 3.3-5.7 4.5-9.2 4.5S5.8 15.300 2.800 12z"/><path d="M2.800 12c3 .800 6.100 1.100 9.200 1.100s6.200-.3 9.200-1.100"/>';
const iconXml = (by: FieldBy, color: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${by === 'mouth' ? LIPS : NOSE}</svg>`;

/** the room the words take under the figure */
const WORDS = 84;

export function BreathField({
  id = 'sigh',
  on = true,
  settle = FIELD_SETTLE,
  onBreaths,
  freeze,
}: {
  id?: FieldId;
  /** it runs only while on */
  on?: boolean;
  /** seconds to settle first (0 for none) */
  settle?: number;
  /** told how many whole breaths are done, each time one ends */
  onBreaths?: (n: number) => void;
  /** hold the figure at this many seconds in, for a picture of one moment (the preview page) */
  freeze?: number;
}) {
  const still = useReducedMotion();
  const clock = useBreathClock(0, on && freeze == null);
  useEffect(() => {
    if (freeze != null) clock.value = freeze;
  }, [freeze, clock]);
  const steps = FIELD_PATTERNS[id].steps as Steps;
  const total = useMemo(() => steps.reduce((a, x) => a + x[1], 0), [steps]);
  const keys = useMemo(() => keysOf(SKY[id], 9), [id, total]);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  /* the figure at a full breath, as big as fits over the words */
  const size = box ? Math.max(0, Math.min(box.w * 0.82, 340, box.h - WORDS - 8)) : 0;
  const R = size / 2;
  /* the dot's size: small and crisp, a touch bigger on a big screen */
  const d = Math.max(4.5, Math.min(5.8, size / 54));
  const dot = useAnimatedStyle(
    () => {
      /* the one dot of the settle: it grows slowly, and at the burst it swells and is gone */
      const t = clock.value;
      const b = t - settle;
      const x = Math.min(1, t / Math.max(0.01, settle));
      const grow = 0.3 + 0.7 * (1 - (1 - x) * (1 - x));
      const pop = Math.max(0, b / 0.22);
      return {
        opacity: settle <= 0 ? 0 : still ? (b < 0 ? 1 : 0) : Math.min(1, t / 0.6) * Math.max(0, 1 - pop),
        backgroundColor: rgb(skyAt(SETTLE_SKY, x)),
        transform: [{ scale: still ? 0.8 : grow * (1 + 0.5 * Math.min(1, pop)) }],
      };
    },
    webDeps(still, settle),
  );
  return (
    <View style={s.room} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View style={s.mid} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {size >= 120 ? (
          <View style={{ width: size, height: size }}>
            {LOOKS.map((l, i) => (
              <Dot key={i} l={l} d={l.ring ? d : d * 0.86} R={R} steps={steps} total={total} keys={keys} settle={settle} clock={clock} still={still} />
            ))}
            <Reanimated.View style={[s.dot, { width: 20, height: 20, borderRadius: 10, marginLeft: -10, marginTop: -10 }, dot]} />
          </View>
        ) : null}
      </View>
      <Words id={id} on={on} freeze={freeze} settle={settle} steps={steps} total={total} keys={keys} clock={clock} still={still} onBreaths={onBreaths} />
    </View>
  );
}

/** one dot of the figure */
const Dot = memo(function Dot({
  l,
  d,
  R,
  steps,
  total,
  keys,
  settle,
  clock,
  still,
}: {
  l: DotLook;
  d: number;
  R: number;
  steps: Steps;
  total: number;
  keys: Keys;
  settle: number;
  clock: SharedValue<number>;
  still: boolean;
}) {
  const st = useAnimatedStyle(
    () => {
      const b = clock.value - settle;
      if (b < 0) return { opacity: 0, backgroundColor: 'rgb(255,210,90)', transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 0.7 }] };
      const v = still ? STILL_V : breathAt(steps, b - l.lag)[0];
      const full = MIN + (1 - MIN) * v;
      /* the heart keeps to itself in the middle and swells a little; a ring is the whole figure scaled by the breath */
      const rad = l.ring ? R * l.rr * full : l.rr * d * (1.25 + 0.5 * v);
      const ang = l.a0 + (still ? 0 : l.w * b + WIND * (1 - v));
      let x = rad * Math.cos(ang);
      let y = rad * Math.sin(ang);
      let seen = 1;
      if (still) seen = Math.min(1, b / 0.5);
      else if (b < BURST) {
        /* the burst: thrown out from the one dot, each its own way, and gathered into its place */
        const u = b / BURST;
        const e = 1 - (1 - u) * (1 - u) * (1 - u);
        const k = Math.sin(Math.PI * u) * (1 - u) * l.kick * R * 0.75;
        x = x * e + Math.cos(l.ka) * k;
        y = y * e + Math.sin(l.ka) * k;
        seen = Math.min(1, b / 0.14);
      }
      const col = l.ring ? skyAt(keys, (((b % total) + total) % total) / total) : GOLD;
      return {
        opacity: seen,
        backgroundColor: rgb(col, l.pale),
        transform: [{ translateX: x }, { translateY: y }, { scale: 0.78 + 0.3 * v }],
      };
    },
    webDeps(still, R, steps, total, keys, settle, l),
  );
  return <Reanimated.View style={[s.dot, { width: d, height: d, borderRadius: d / 2, marginLeft: -d / 2, marginTop: -d / 2 }, st]} />;
});

/** the words for this step, in the step's own color, with the nose or the lips under them; they fade out and in at each turn */
function Words({
  id,
  on,
  freeze,
  settle,
  steps,
  total,
  keys,
  clock,
  still,
  onBreaths,
}: {
  id: FieldId;
  on: boolean;
  freeze?: number;
  settle: number;
  steps: Steps;
  total: number;
  keys: Keys;
  clock: SharedValue<number>;
  still: boolean;
  onBreaths?: (n: number) => void;
}) {
  const [t0] = useState(() => Date.now());
  const [ticked, setNow] = useState(0);
  const now = freeze ?? ticked;
  useEffect(() => {
    if (!on || freeze != null) return;
    const tick = setInterval(() => setNow((Date.now() - t0) / 1000), 100);
    return () => clearInterval(tick);
  }, [on, t0, freeze]);
  const at = fieldAt(id, now, settle);
  useEffect(() => {
    if (at.done) onBreaths?.(at.done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at.done]);
  /* a screen reader hears each turn of the breath (iOS has no live regions, so it is told) */
  useEffect(() => {
    if (Platform.OS !== 'ios' || !on) return;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((yes) => yes && AccessibilityInfo.announceForAccessibility(at.words))
      .catch(() => undefined);
  }, [at.words, on]);
  /* the icon's color steps ten times a second, which a slow drift of color hides; the words read the clock */
  const b = now - settle;
  const col = b < 0 ? skyAt(SETTLE_SKY, now / Math.max(0.01, settle)) : skyAt(keys, (b % total) / total);
  const ink = useAnimatedStyle(
    () => {
      const t = clock.value;
      const q = t - settle;
      return { color: rgb(q < 0 ? skyAt(SETTLE_SKY, t / Math.max(0.01, settle)) : skyAt(keys, (((q % total) + total) % total) / total)) };
    },
    webDeps(settle, total, keys),
  );
  const fade = useAnimatedStyle(
    () => {
      if (still) return { opacity: 1 };
      const t = clock.value;
      const q = t - settle;
      if (q < 0) return { opacity: Math.min(1, t / 0.8, -q / 0.45) };
      /* how far into its step the breath is, and how long the step is */
      let x = ((q % total) + total) % total;
      let dur = steps[0][1];
      for (let i = 0; i < steps.length; i++) {
        dur = steps[i][1];
        if (x < dur) break;
        x -= dur;
      }
      return { opacity: Math.min(1, x / 0.45, (dur - x) / 0.35) };
    },
    webDeps(still, settle, steps, total),
  );
  return (
    <Reanimated.View
      style={[s.words, fade]}
      accessible={Platform.OS !== 'web'}
      accessibilityLabel={Platform.OS !== 'web' ? at.words : undefined}
      accessibilityLiveRegion="polite"
      aria-live="polite">
      <Reanimated.Text maxFontSizeMultiplier={1.2} style={[s.phase, ink]}>
        {at.words}
      </Reanimated.Text>
      <View style={s.by} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {at.by ? <SvgXml xml={iconXml(at.by, rgb(col))} width={30} height={30} /> : null}
      </View>
    </Reanimated.View>
  );
}

const s = StyleSheet.create({
  /* the figure's room: the figure in the middle of what is left over the words */
  room: { flexGrow: 1, alignSelf: 'stretch', minHeight: WORDS },
  mid: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', left: '50%', top: '50%' },
  words: { height: WORDS, alignItems: 'center', justifyContent: 'flex-start', gap: 6 },
  phase: { fontFamily: font.serifItalic, fontSize: 28, lineHeight: 34 },
  by: { width: 30, height: 30 },
});
