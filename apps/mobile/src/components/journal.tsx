/* The journal's pieces (app/journal.tsx; core journal-entries.ts): an entry as a quiet card in the list; the feeling at
   the top of an entry, breathing slowly; and how far down the journal was already pulled when it opens, so it carries on
   from the thumb. An entry starts with the app's own four colors (QuadBubbles in tools/feel.tsx). */
import { jnPos, type JEntry } from '@daybook/core';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';

import { Shape } from '@/components/shapes';
import { Text } from '@/components/text';
import { FEEL_COLORS, feelKind } from '@/components/tools/feel';
import { breathAt, useBreathClock, webDeps, type Steps } from '@/lib/breath';
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
  card: 'rgba(255, 255, 255, 0.07)',
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

/** one entry, quietly: the feeling's small shape and word, the time, and the first lines of what was written. A feeling
    named with nothing written is the row alone. */
export const EntryCard = memo(function EntryCard({ e, onPress }: { e: JEntry; onPress: () => void }) {
  const look = entryLook(e);
  const text = e.t.trim();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${e.w}, ${entryTime(e.at)}.${text ? ' ' + text.slice(0, 160) : ''}`}
      accessibilityHint="Opens the entry"
      onPress={onPress}
      style={({ pressed }) => [s.card, { opacity: pressed ? 0.75 : 1 }]}>
      <View style={s.cardTop}>
        <Shape kind={look.kind} size={16} color={look.color} />
        <Text style={s.cardW} numberOfLines={1}>
          {e.w}
        </Text>
        <Text style={s.cardT}>{entryTime(e.at)}</Text>
      </View>
      {text ? (
        <Text style={s.cardBody} numberOfLines={3}>
          {text}
        </Text>
      ) : null}
    </Pressable>
  );
});

const s = StyleSheet.create({
  card: { borderRadius: 20, backgroundColor: JN.card, paddingHorizontal: 18, paddingVertical: 16, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  cardW: { flex: 1, fontFamily: font.bodySemi, fontSize: 16, lineHeight: 21, color: JN.ink },
  cardT: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: JN.muted },
  cardBody: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: 'rgba(247, 243, 255, 0.82)' },
});
