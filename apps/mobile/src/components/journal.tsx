/* The journal's pieces (app/journal.tsx; core journal-entries.ts). The list is kept calm, like Apple's Journal: one plain
   dark page, each day's name small over its entries, and each entry a line of the feeling's word and its time, with a
   small dot in the feeling's color, the only color there is, and the first lines written under it. New entry is a bar
   floating low, where the thumb is. Also here: how far down the journal was already pulled when it opens, so it carries
   on from the thumb. An entry starts with the app's own four colors (QuadBubbles in tools/feel.tsx). */
import { jnPos, type JEntry } from '@daybook/core';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Text } from '@/components/text';
import { FEEL_COLORS, feelKind } from '@/components/tools/feel';
import { Icon } from '@/components/ui';
import { webDeps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
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

/** the journal's colors: dark in either theme, so a private page feels like a quiet room */
export const JN = {
  /** the page: one plain dark, a little warmer than black, the way Journal's is */
  paper: '#16142A',
  /** the New entry bar floating low over the list: a touch lighter than the page */
  bar: '#24213D',
  accent: '#A99BFF',
  accentInk: '#1A1250',
  ink: nightInk.ink,
  muted: nightInk.muted,
  faint: 'rgba(207, 200, 242, 0.62)',
  btn: nightInk.btn,
};

/** an entry's color and shape, from where its feeling sits in the field (a word the field no longer has is a soft violet) */
export function entryLook(e: Pick<JEntry, 'w'>) {
  const p = jnPos(e);
  return p ? { color: FEEL_COLORS[p.r][p.c], kind: feelKind(p.r, p.c), pos: p } : { color: 'hsl(250, 80%, 76%)', kind: 'circle' as const, pos: null };
}

/* ---------- the list ---------- */
/** a day's name over its entries: small, quiet and in sentence case, the way Journal and Notes head a day */
export function DayMark({ label, first }: { label: string; first?: boolean }) {
  return (
    <Text style={[s.day, first && { marginTop: 4 }]} accessibilityRole="header">
      {label}
    </Text>
  );
}

/** the time an entry was started, like 9:41 PM */
export const entryTime = (at: number) => new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** one entry: a small dot in the feeling's color (the only color on the list), the word, the time at the end of the
    line, and the first two lines of what was written under it. A feeling named with nothing written is that one line
    alone, so it reads as a check-in, not a heading missing its page. */
export const EntryRow = memo(function EntryRow({ e, onPress }: { e: JEntry; onPress: () => void }) {
  const look = entryLook(e);
  const text = e.t.trim();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${e.w}, ${entryTime(e.at)}.${text ? ' ' + text.slice(0, 160) : ''}`}
      accessibilityHint="Opens the entry"
      onPress={onPress}
      style={({ pressed }) => [s.row, { opacity: pressed ? 0.6 : 1 }]}>
      <View style={s.top}>
        <View style={[s.dot, { backgroundColor: look.color }]} />
        <Text style={s.word} numberOfLines={1}>
          {e.w}
        </Text>
        <Text style={s.time}>{entryTime(e.at)}</Text>
      </View>
      {text ? (
        <Text style={s.text} numberOfLines={2}>
          {text}
        </Text>
      ) : null}
    </Pressable>
  );
});

/* ---------- a new entry ---------- */
/** Material's springs: a quick one with a little bounce for the press, a calm one back */
const PRESS = { stiffness: 800, damping: 34, mass: 1 };
const LET_GO = { stiffness: 380, damping: 31, mass: 1 };
/** New entry: a bar floating low over the list, the whole of it one button: what it does and that it starts with a
    check-in, and a round pencil in the accent color. It gives a little under the thumb. */
export function NewEntry({ onPress }: { onPress: () => void }) {
  const squeeze = useSharedValue(1);
  const press = useAnimatedStyle(() => ({ transform: [{ scale: squeeze.value }] }), webDeps(squeeze));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="New entry"
      accessibilityHint="Starts with a check-in on how you feel"
      onPressIn={() => (squeeze.value = withSpring(0.97, PRESS))}
      onPressOut={() => (squeeze.value = withSpring(1, LET_GO))}
      onPress={() => {
        buzz('tap');
        onPress();
      }}>
      <Reanimated.View style={[s.bar, press]}>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={s.barH}>New entry</Text>
          <Text style={s.barT}>Check in with how you feel</Text>
        </View>
        <View style={s.go}>
          <Icon name="pencil" size={20} color={JN.accentInk} />
        </View>
      </Reanimated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  day: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 19, color: 'rgba(235, 235, 245, 0.5)', marginTop: 30, marginBottom: 6 },
  row: { paddingVertical: 11 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  word: { flex: 1, fontFamily: font.bodySemi, fontSize: 17, lineHeight: 23, color: JN.ink },
  time: { fontFamily: font.body, fontSize: 14, lineHeight: 19, color: 'rgba(235, 235, 245, 0.45)' },
  text: { fontFamily: font.body, fontSize: 16, lineHeight: 23, color: 'rgba(235, 235, 245, 0.68)', marginTop: 4, marginLeft: 21 },
  bar: {
    height: 68,
    borderRadius: 34,
    backgroundColor: JN.bar,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 8,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  barH: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22, color: JN.ink },
  barT: { fontFamily: font.body, fontSize: 13.5, lineHeight: 18, color: 'rgba(235, 235, 245, 0.55)' },
  go: { width: 52, height: 52, borderRadius: 26, backgroundColor: JN.accent, alignItems: 'center', justifyContent: 'center' },
});
