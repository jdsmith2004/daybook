/* The journal's pieces (app/journal.tsx; core journal-entries.ts). The list is a constellation: every entry is a star on
   one thin dotted line through time, the feeling's own shape glowing in its color, with the word, the time and the first
   lines written beside it in a book face, straight on the sky, with no boxes. New entry is a bar floating low, where the
   thumb is. Also here: how far down the journal was already pulled when it opens, so it carries on from the thumb. An entry starts with the app's own four
   colors (QuadBubbles in tools/feel.tsx). */
import { jnPos, type JEntry } from '@daybook/core';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';

import { Shape, SVG_HIDE } from '@/components/shapes';
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

/** the journal's colors: always the night sky, in either theme, like the field of feelings it opens into */
export const JN = {
  top: '#2A2275',
  bottom: '#120E38',
  /** a day's name, sitting on the line: solid, so the line passes behind it */
  pill: '#251F6A',
  edge: 'rgba(255, 255, 255, 0.1)',
  /** the line the entries sit on */
  spine: 'rgba(255, 255, 255, 0.24)',
  /** what was written, a little softer than white, so a page of it does not glare at night */
  page: 'rgba(247, 243, 255, 0.86)',
  /** the New entry bar floating low over the list */
  bar: 'rgba(46, 38, 122, 0.96)',
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

/* ---------- the constellation ---------- */
/** the entries' column: each star sits in the middle of it, and the line runs down its middle */
export const STAR_W = 44;
/** the room between one entry and the next; the line carries on through it */
const ROW_GAP = 24;
/** a check-in (a feeling with nothing written) sits closer, and its small star lines up with its word */
const SMALL_GAP = 12;
const SMALL_CY = 12;

/** one piece of the dotted line, filling its parent from `from` down, and on through the gap below */
function Spine({ from = 0, gap = ROW_GAP }: { from?: number; gap?: number }) {
  return (
    <View pointerEvents="none" style={[s.spine, { top: from, bottom: -gap }]}>
      <Svg width={4} height="100%" {...SVG_HIDE}>
        <Line x1={2} y1={2} x2={2} y2="100%" stroke={JN.spine} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="0.1 8" />
      </Svg>
    </View>
  );
}

/** a day's name, on the line; the first one starts the line from its middle */
export function DayMark({ label, first }: { label: string; first?: boolean }) {
  return (
    <View style={s.day}>
      <Spine from={first ? 13 : 0} gap={14} />
      <View style={s.pill}>
        <Text style={s.pillT} accessibilityRole="header">
          {label}
        </Text>
      </View>
    </View>
  );
}

/** the soft light around a star, in its feeling's color, centered `cy` down from the top of the row */
function Glow({ color, size, cy = 16 }: { color: string; size: number; cy?: number }) {
  const id = 'g' + color.replace(/[^0-9]/g, '');
  return (
    <Svg width={size} height={size} style={{ position: 'absolute', left: (STAR_W - size) / 2, top: cy - size / 2 }} {...SVG_HIDE}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.5} />
          <Stop offset="0.45" stopColor={color} stopOpacity={0.16} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** the time an entry was started, like 9:41 PM */
export const entryTime = (at: number) => new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** one entry: its star on the line, then the feeling word in its color, the time, and up to three lines of what was
    written, in the book face. A feeling named with nothing written is a small star, its word and time on one quiet line,
    closer to its neighbors: a check-in, not a heading waiting for its page. */
export const EntryStar = memo(function EntryStar({ e, onPress }: { e: JEntry; onPress: () => void }) {
  const look = entryLook(e);
  const text = e.t.trim();
  if (!text) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${e.w}, ${entryTime(e.at)}. A feeling, nothing written.`}
        accessibilityHint="Opens the entry"
        onPress={onPress}
        style={({ pressed }) => [s.row, s.rowSmall, { opacity: pressed ? 0.65 : 1 }]}>
        <View style={[s.star, s.starSmall]}>
          <Spine from={SMALL_CY} gap={SMALL_GAP} />
          <Glow color={look.color} size={42} cy={SMALL_CY} />
          <Shape kind={look.kind} size={16} color={look.color} />
        </View>
        <View style={[s.top, { flex: 1 }]}>
          <Text style={[s.wordSmall, { color: look.color }]} numberOfLines={1}>
            {e.w}
          </Text>
          <Text style={s.time}>{entryTime(e.at)}</Text>
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${e.w}, ${entryTime(e.at)}.${text ? ' ' + text.slice(0, 160) : ''}`}
      accessibilityHint="Opens the entry"
      onPress={onPress}
      style={({ pressed }) => [s.row, { opacity: pressed ? 0.65 : 1 }]}>
      <View style={s.star}>
        <Spine from={16} />
        <Glow color={look.color} size={76} />
        <Shape kind={look.kind} size={30} color={look.color} />
      </View>
      <View style={s.body}>
        <View style={s.top}>
          <Text style={[s.word, { color: look.color }]} numberOfLines={1}>
            {e.w}
          </Text>
          <Text style={s.time}>{entryTime(e.at)}</Text>
        </View>
        {text ? (
          <Text style={s.text} numberOfLines={3}>
            {text}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

/* ---------- a new entry ---------- */
/** Material's springs: a quick one with a little bounce for the press, a calm one back */
const PRESS = { stiffness: 800, damping: 34, mass: 1 };
const LET_GO = { stiffness: 380, damping: 31, mass: 1 };
/** New entry: a bar floating low over the list, the whole of it one button: what it does and that it starts with a
    check-in, and a rounded square in the accent color with a pencil. It gives a little under the thumb. */
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
          <Icon name="pencil" size={22} color={JN.accentInk} />
        </View>
      </Reanimated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  spine: { position: 'absolute', left: STAR_W / 2 - 2, width: 4 },
  day: { marginBottom: 14 },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: JN.pill,
    borderWidth: 1,
    borderColor: JN.edge,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  pillT: { fontFamily: font.bodyBold, fontSize: 11, lineHeight: 15, letterSpacing: 0.8, textTransform: 'uppercase', color: JN.muted },
  row: { flexDirection: 'row', gap: 14, marginBottom: ROW_GAP },
  star: { width: STAR_W, alignItems: 'center', paddingTop: 1 },
  body: { flex: 1, paddingTop: 2 },
  rowSmall: { marginBottom: SMALL_GAP, alignItems: 'center' },
  starSmall: { height: 24, justifyContent: 'center', paddingTop: 0 },
  wordSmall: { flexShrink: 1, fontFamily: font.bodySemi, fontSize: 16.5, lineHeight: 22 },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  word: { flexShrink: 1, fontFamily: font.display, fontSize: 21, lineHeight: 27 },
  time: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: JN.muted },
  text: { fontFamily: font.serif, fontSize: 17.5, lineHeight: 25, color: JN.page, marginTop: 3 },
  bar: {
    height: 74,
    borderRadius: 37,
    backgroundColor: JN.bar,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.13)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 9,
    gap: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.38,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  barH: { fontFamily: font.display, fontSize: 19, lineHeight: 24, color: JN.ink },
  barT: { fontFamily: font.body, fontSize: 13.5, lineHeight: 18, color: JN.muted },
  go: { width: 56, height: 56, borderRadius: 20, backgroundColor: JN.accent, alignItems: 'center', justifyContent: 'center' },
});
