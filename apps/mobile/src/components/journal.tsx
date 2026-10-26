/* The journal's pieces (app/journal.tsx; core journal-entries.ts): the four colors in the Mood Meter's own square, small,
   that start an entry; an entry as a card in the list, lit by its feeling's color; the feeling at the top of an entry,
   breathing slowly; and how far down the journal was already pulled when it opens, so it carries on from the thumb. */
import { FEEL_QUADS, jnPos, type JEntry } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View, type HostInstance } from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';

import { Shape } from '@/components/shapes';
import { Text } from '@/components/text';
import { FEEL_COLORS, feelKind, QUAD, type FeelFrom } from '@/components/tools/feel';
import { breathAt, useBreathClock, webDeps, type Steps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { font, nightInk } from '@/lib/theme';

/* ---------- opening it ---------- */
/** how far down the journal already is when it opens (the pull on Today let go past the line), in points from the top of
    the screen: the journal starts there and carries on down, so it feels like the same motion. Read once, then cleared. */
let startAt = 0;
export function openJournalFrom(px: number) {
  startAt = px;
}
export function takeJournalStart() {
  const v = startAt;
  startAt = 0;
  return v;
}

/** the journal's colors: always the night sky, in either theme, like the field of feelings it opens into */
export const JN = {
  top: '#2A2275',
  bottom: '#120E38',
  card: 'rgba(255, 255, 255, 0.06)',
  /** the panel low on the list that holds the colors: solid, so the cards slide under it */
  dock: '#231D5C',
  edge: 'rgba(255, 255, 255, 0.09)',
  ink: nightInk.ink,
  muted: nightInk.muted,
  faint: 'rgba(207, 200, 242, 0.62)',
  btn: nightInk.btn,
};

/** a color with some see-through, from the hsl() strings the field uses */
export const withAlpha = (hsl: string, a: number) => hsl.replace(/^hsl\((.*)\)$/, `hsla($1, ${a})`);

/** an entry's color and shape, from where its feeling sits in the field (a word the field no longer has is a soft violet) */
export function entryLook(e: Pick<JEntry, 'w'>) {
  const p = jnPos(e);
  return p ? { color: FEEL_COLORS[p.r][p.c], kind: feelKind(p.r, p.c), pos: p } : { color: 'hsl(250, 80%, 76%)', kind: 'circle' as const, pos: null };
}

/* ---------- the four colors ---------- */
/** the Mood Meter's square in small: energy up and down, pleasant to the right, each color a bubble that breathes a little
    on its own beat. A tap starts an entry in that corner of the field, which grows out of the bubble tapped. */
export function FeelMeter({ d = 46, gap = 8, onPick }: { d?: number; gap?: number; onPick: (q: (typeof FEEL_QUADS)[number], at?: FeelFrom) => void }) {
  const reduce = useReducedMotion();
  const clock = useSharedValue(0.1);
  useEffect(() => {
    if (reduce) return;
    clock.value = withRepeat(withTiming(1.1, { duration: 60000, easing: Easing.linear }), -1, false);
  }, [reduce, clock]);
  return (
    <View style={[s.meter, { width: d * 2 + gap, gap, rowGap: gap }]}>
      {FEEL_QUADS.map((q, qi) => (
        <Orb key={q.id} q={q} qi={qi} d={d} clock={clock} onPick={(at) => onPick(q, at)} />
      ))}
    </View>
  );
}

const Orb = memo(function Orb({
  q,
  qi,
  d,
  clock,
  onPick,
}: {
  q: (typeof FEEL_QUADS)[number];
  qi: number;
  d: number;
  clock: SharedValue<number>;
  onPick: (at?: FeelFrom) => void;
}) {
  /* the same slow, uneven breathing as the big bubbles (feel.tsx), each a little out of step with the others */
  const st = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.035 * Math.sin(2 * Math.PI * clock.value * 10 + qi * 1.7) }] }), webDeps(clock, qi));
  const ref = useRef<HostInstance | null>(null);
  return (
    <View ref={ref} collapsable={false} style={{ width: d, height: d }}>
      <Reanimated.View style={st}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'New entry: ' + q.name}
          hitSlop={4}
          onPress={() => {
            buzz('tap');
            const el = ref.current;
            if (!el) return onPick();
            el.measureInWindow((x, y, w, h) => onPick(w ? { x: x + w / 2, y: y + h / 2 } : undefined));
          }}
          style={({ pressed }) => [{ width: d, height: d, borderRadius: d / 2, overflow: 'hidden', transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
          <LinearGradient colors={[QUAD[q.id].top, QUAD[q.id].bottom]} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
          {/* the light catching its top, so it reads as a bubble, not a dot */}
          <View style={[s.shine, { width: d * 0.42, height: d * 0.2, borderRadius: d, top: d * 0.14, left: d * 0.2 }]} />
        </Pressable>
      </Reanimated.View>
    </View>
  );
});

/* ---------- the feeling at the top of an entry ---------- */
const SLOW: Steps = [
  ['in', 4],
  ['out', 6],
];
/** the entry's feeling, its shape breathing slowly in its own color (still with Reduce Motion) */
export function FeelBadge({ e, size = 76 }: { e: Pick<JEntry, 'w'>; size?: number }) {
  const reduce = useReducedMotion();
  const t = useBreathClock(0, !reduce);
  const look = entryLook(e);
  const st = useAnimatedStyle(
    () => {
      const [b] = breathAt(SLOW, t.value);
      return { transform: [{ scale: reduce ? 1 : 0.92 + 0.12 * b }, { rotate: reduce ? '0deg' : `${6 * b - 3}deg` }] };
    },
    webDeps(t, reduce),
  );
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Reanimated.View style={st}>
        <Shape kind={look.kind} size={size} color={look.color} />
      </Reanimated.View>
    </View>
  );
}

/* ---------- an entry in the list ---------- */
/** the time an entry was started, like 9:41 PM */
export const entryTime = (at: number) => new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** one entry: its feeling's shape and word, the time, and the first lines of what was written (or what the feeling is,
    when only the feeling was named). The card is lit from its corner by the feeling's color. */
export const EntryCard = memo(function EntryCard({ e, how, onPress }: { e: JEntry; how: string; onPress: () => void }) {
  const look = entryLook(e);
  const text = e.t.trim();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${e.w}, ${entryTime(e.at)}. ${text ? text.slice(0, 160) : how}`}
      accessibilityHint="Opens the entry"
      onPress={onPress}
      style={({ pressed }) => [s.card, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[withAlpha(look.color, 0.3), withAlpha(look.color, 0.06), withAlpha(look.color, 0)]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.cardTop}>
        <Shape kind={look.kind} size={34} color={look.color} />
        <Text style={s.cardW} numberOfLines={1}>
          {e.w}
        </Text>
        <Text style={s.cardT}>{entryTime(e.at)}</Text>
      </View>
      {text ? (
        <Text style={s.cardBody} numberOfLines={4}>
          {text}
        </Text>
      ) : (
        <Text style={[s.cardBody, { color: JN.faint }]} numberOfLines={2}>
          {how}.
        </Text>
      )}
    </Pressable>
  );
});

const s = StyleSheet.create({
  meter: { flexDirection: 'row', flexWrap: 'wrap' },
  shine: { position: 'absolute', backgroundColor: 'rgba(255, 255, 255, 0.38)', transform: [{ rotate: '-18deg' }] },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: JN.edge,
    backgroundColor: JN.card,
    padding: 16,
    paddingTop: 14,
    gap: 10,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardW: { flex: 1, fontFamily: font.display, fontSize: 20, lineHeight: 25, color: JN.ink },
  cardT: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18, color: JN.muted },
  cardBody: { fontFamily: font.body, fontSize: 15.5, lineHeight: 22.5, color: JN.ink },
});
