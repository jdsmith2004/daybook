/* The journal's pieces (app/journal.tsx; core journal-entries.ts). The list is the day's light: one plain dark page, and
   each day lit softly from behind by the colors of every feeling named in it, wherever it was named (the journal, Name
   the feeling, the ride, a slip). The day's feelings read in order as its title ("Restless then Grateful"), with what
   was written under them, and a day with only a feeling is a smaller line with a smaller light. Across the top, the week
   as seven little lights. New entry is a bar floating low, where the thumb is. Also here: how far down the journal was
   already pulled when it opens, so it carries on from the thumb. An entry starts with the app's own four colors
   (QuadBubbles in tools/feel.tsx). */
import { feelPos, jnPos, type JDay, type JEntry } from '@daybook/core';
import { memo, useId } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { SVG_HIDE } from '@/components/shapes';
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

/** the journal's colors: one plain dark page in either theme, so a private page feels like a quiet room, and the
    feelings' own colors are the only light on it */
export const JN = {
  /** the page: a plain dark, a little warmer than black, the way Apple's Journal is */
  paper: '#16142A',
  /** the New entry bar floating low over the list: a touch lighter than the page */
  bar: '#24213D',
  /** what was written, a little softer than white, so a page of it does not glare at night */
  page: 'rgba(235, 235, 245, 0.78)',
  /** a day's name, the times, the small words */
  quiet: 'rgba(235, 235, 245, 0.5)',
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

/** a feeling word's color (a word the field no longer has is a soft violet) */
export const feelColor = (w: string) => {
  const p = feelPos(w);
  return p ? FEEL_COLORS[p.r][p.c] : 'hsl(250, 80%, 76%)';
};

/** the time something was named, like 9:41 PM */
export const entryTime = (at: number) => new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/* ---------- the light ---------- */
/** where each color sits inside a light, as fractions of its box: the first feeling a little left of the middle, the next
    ones around it */
const SPOTS: [number, number][] = [
  [0.4, 0.46],
  [0.6, 0.54],
  [0.5, 0.6],
  [0.62, 0.42],
];
/** a soft light made of up to four colors. Each glow fades to nothing before the edge of the box, since a drawing is cut
    off flat at its box, and a cut glow shows a hard line. */
export function Light({ colors, w, h, strength = 0.42, style }: { colors: string[]; w: number; h: number; strength?: number; style?: StyleProp<ViewStyle> }) {
  const id = 'l' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const cs = colors.slice(0, SPOTS.length);
  return (
    <Svg pointerEvents="none" width={w} height={h} style={[{ position: 'absolute' }, style]} {...SVG_HIDE}>
      <Defs>
        {cs.map((c, i) => (
          <RadialGradient key={i} id={id + i} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={c} stopOpacity={strength} />
            <Stop offset="0.4" stopColor={c} stopOpacity={strength * 0.5} />
            <Stop offset="0.75" stopColor={c} stopOpacity={strength * 0.12} />
            <Stop offset="1" stopColor={c} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {cs.map((c, i) => {
        const [x, y] = SPOTS[i];
        return <Ellipse key={i} cx={x * w} cy={y * h} rx={Math.min(x, 1 - x) * w} ry={Math.min(y, 1 - y) * h} fill={`url(#${id + i})`} />;
      })}
    </Svg>
  );
}

/** a day's colors, in the order its feelings came, each once */
export const dayColors = (g: Pick<JDay, 'feels'>) => [...new Set(g.feels.map((f) => feelColor(f.w)))];

/* ---------- the week ---------- */
/** the last seven days as seven little lights, each mixed from that day's feelings; a day with none is a faint ring. A
    tap goes to that day. */
export function WeekLights({
  week,
  on,
  onPick,
}: {
  week: { k: string; short: string; colors: string[]; today: boolean }[];
  on: string | null;
  onPick: (k: string) => void;
}) {
  return (
    <View style={s.week}>
      {week.map((d) => (
        <Pressable
          key={d.k}
          accessibilityRole="button"
          accessibilityLabel={d.colors.length ? `${d.short}, go to this day` : `${d.short}, nothing named`}
          disabled={!d.colors.length}
          onPress={() => onPick(d.k)}
          hitSlop={4}
          style={({ pressed }) => [s.wd, { opacity: pressed ? 0.6 : 1 }]}>
          <View style={s.wl}>
            {d.colors.length ? <Light colors={d.colors} w={70} h={70} strength={0.95} style={{ left: -18, top: -18 }} /> : <View style={s.wEmpty} />}
          </View>
          <Text style={[s.wT, d.today && s.wToday]}>{d.short}</Text>
          <View style={[s.wDot, { opacity: d.k === on ? 1 : 0 }]} />
        </Pressable>
      ))}
    </View>
  );
}

/* ---------- a day ---------- */
/** one day: its light behind it, its name, its feelings in order as its title, and what was written under them. A day
    with only feelings is a smaller line with a smaller light. A tap on the feelings opens the day's newest entry, and a
    tap on what was written opens that entry. */
export const DayLight = memo(function DayLight({ g, onOpen }: { g: JDay; onOpen: (id: string) => void }) {
  const written = g.entries.filter((e) => e.t.trim());
  const quiet = !written.length;
  const colors = dayColors(g);
  const open = g.entries[0];
  const words = g.feels.map((f) => f.w);
  const title = (
    <Text style={[s.seq, quiet && s.seqQuiet]}>
      {g.feels.map((f, i) => (
        <Text key={i}>
          {i ? <Text style={s.then}>{'  then  '}</Text> : null}
          <Text style={{ color: feelColor(f.w) }}>{f.w}</Text>
        </Text>
      ))}
    </Text>
  );
  return (
    <View style={[s.day, quiet && s.dayQuiet]}>
      <Light colors={colors} w={quiet ? 320 : 480} h={quiet ? 170 : 300} strength={quiet ? 0.32 : 0.46} style={quiet ? s.lightQuiet : s.light} />
      <Text style={s.dayName} accessibilityRole="header">
        {g.label}
      </Text>
      {open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Felt ' + words.join(', then ')}
          accessibilityHint="Opens the entry"
          onPress={() => onOpen(open.id)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          {title}
        </Pressable>
      ) : (
        <View accessible accessibilityLabel={'Felt ' + words.join(', then ')}>
          {title}
        </View>
      )}
      {written.map((e) => (
        <Pressable
          key={e.id}
          accessibilityRole="button"
          accessibilityLabel={`${e.w}, ${entryTime(e.at)}. ${e.t.trim().slice(0, 160)}`}
          accessibilityHint="Opens the entry"
          onPress={() => onOpen(e.id)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Text style={s.text} numberOfLines={3}>
            {e.t.trim()}
          </Text>
        </Pressable>
      ))}
    </View>
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
          <Icon name="pencil" size={22} color={JN.accentInk} />
        </View>
      </Reanimated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 6 },
  wd: { alignItems: 'center', gap: 6, minWidth: 40 },
  wl: { width: 34, height: 34 },
  wEmpty: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' },
  wT: { fontFamily: font.bodyMedium, fontSize: 12, lineHeight: 16, color: JN.quiet },
  wToday: { fontFamily: font.bodyBold, color: JN.ink },
  wDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: JN.ink, marginTop: -2 },
  day: { paddingTop: 14, paddingBottom: 24 },
  dayQuiet: { paddingTop: 8, paddingBottom: 16 },
  light: { left: -150, top: -110 },
  lightQuiet: { left: -110, top: -62 },
  dayName: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: JN.quiet, marginBottom: 3 },
  seq: { fontFamily: font.bodySemi, fontSize: 19, lineHeight: 26 },
  seqQuiet: { fontSize: 16, lineHeight: 22 },
  then: { fontFamily: font.body, fontSize: 13, color: 'rgba(235, 235, 245, 0.45)' },
  text: { fontFamily: font.body, fontSize: 15.5, lineHeight: 23, color: JN.page, marginTop: 6 },
  bar: {
    height: 74,
    borderRadius: 37,
    backgroundColor: JN.bar,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
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
  barT: { fontFamily: font.body, fontSize: 13.5, lineHeight: 18, color: 'rgba(235, 235, 245, 0.58)' },
  go: { width: 54, height: 54, borderRadius: 27, backgroundColor: JN.accent, alignItems: 'center', justifyContent: 'center' },
});
