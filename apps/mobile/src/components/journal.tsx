/* The journal's pieces (app/journal.tsx; core journal-entries.ts). The list is the day's light: one plain dark page, and
   each day lit softly from behind by the colors of every feeling named in it, wherever it was named (the journal, Name
   the feeling, the ride, a slip). The day's feelings read in order as its title ("Restless then Grateful"), with what
   was written under them, and a day with only a feeling is a smaller line with a smaller light. Across the top, the week
   as seven little lights. New entry is a bar floating low, where the thumb is. Also here: how far down the journal was
   already pulled when it opens, so it carries on from the thumb. An entry starts with the app's own four colors
   (QuadBubbles in tools/feel.tsx). */
import { feelPos, jnPos, type JDay, type JEntry } from '@daybook/core';
import { memo, useId, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

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

/* ---------- the page's light ----------
   Every day's feelings are soft round glows on one canvas behind the whole list, wide enough that each day's light runs
   into the next, so the page reads as one sky changing down the week rather than a glow per day. It is drawn at a
   quarter of its size and scaled up: the glows are soft anyway, and a long journal then costs a sixteenth of the memory. */
/** where each of a day's colors glows: across the width, and how far below the day's top, in points */
const FIELD_SPOTS: [number, number][] = [
  [0.1, 24],
  [0.55, 40],
  [0.3, 80],
  [0.7, 4],
];
const LOW = 4;
/** how far the light reaches above the first day and below the last */
const FIELD_PAD = 260;
export function LightField({ days, width, height }: { days: { y: number; colors: string[]; quiet: boolean }[]; width: number; height: number }) {
  const id = 'f' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const cols = [...new Set(days.flatMap((d) => d.colors))];
  const w = width / LOW;
  const h = (height + FIELD_PAD * 2) / LOW;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: w,
        height: h,
        left: (width - w) / 2,
        top: -FIELD_PAD + (height + FIELD_PAD * 2 - h) / 2,
        transform: [{ scale: LOW }],
      }}>
      <Svg width={w} height={h} {...SVG_HIDE}>
        <Defs>
          {cols.map((c, i) => (
            <RadialGradient key={i} id={id + i} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={c} stopOpacity={0.42} />
              <Stop offset="0.45" stopColor={c} stopOpacity={0.2} />
              <Stop offset="0.8" stopColor={c} stopOpacity={0.05} />
              <Stop offset="1" stopColor={c} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {days.flatMap((d, di) =>
          d.colors
            .slice(0, FIELD_SPOTS.length)
            .map((c, i) => (
              <Circle
                key={di + '-' + i}
                cx={(FIELD_SPOTS[i][0] * width) / LOW}
                cy={(FIELD_PAD + d.y + FIELD_SPOTS[i][1]) / LOW}
                r={(width * (d.quiet ? 0.38 : 0.52)) / LOW}
                fill={`url(#${id + cols.indexOf(c)})`}
                opacity={d.quiet ? 0.8 : 1}
              />
            )),
        )}
      </Svg>
    </View>
  );
}

/** one day in the week: a small soft light, its colors side by side and run together, muted like a light seen through
    frosted glass */
const ORB_SPOTS: [number, number][] = [
  [0.45, 0.47],
  [0.56, 0.53],
  [0.5, 0.58],
  [0.57, 0.43],
];
function WeekOrb({ colors }: { colors: string[] }) {
  const id = 'o' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const S = 60;
  return (
    <Svg pointerEvents="none" width={S} height={S} style={{ position: 'absolute', left: -13, top: -13 }} {...SVG_HIDE}>
      <Defs>
        {colors.slice(0, 4).map((c, i) => (
          <RadialGradient key={i} id={id + i} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={c} stopOpacity={0.62} />
            <Stop offset="0.5" stopColor={c} stopOpacity={0.3} />
            <Stop offset="1" stopColor={c} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      {colors.slice(0, 4).map((c, i) => (
        <Circle key={i} cx={ORB_SPOTS[i][0] * S} cy={ORB_SPOTS[i][1] * S} r={S * 0.36} fill={`url(#${id + i})`} />
      ))}
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
          <View style={s.wl}>{d.colors.length ? <WeekOrb colors={d.colors} /> : <View style={s.wEmpty} />}</View>
          <Text style={[s.wT, d.today && s.wToday]}>{d.short}</Text>
          <View style={[s.wDot, { opacity: d.k === on ? 1 : 0 }]} />
        </Pressable>
      ))}
    </View>
  );
}

/* ---------- a day ---------- */
/** the most feelings a day shows in its title: a busy day shows its last few, after a quiet "…" */
const TITLE_MAX = 3;

/** one day (its light is the page's, LightField): its name, its feelings in order as its title, and the newest thing written under them
    (the day's other entries a tap away). A day with only feelings is a smaller line with a smaller light. A tap on the
    feelings opens the day's newest entry, and a tap on what was written opens that entry. */
export const DayLight = memo(function DayLight({ g, onOpen }: { g: JDay; onOpen: (id: string) => void }) {
  const written = g.entries.filter((e) => e.t.trim());
  const quiet = !written.length;
  const [all, setAll] = useState(false);
  const open = g.entries[0];
  const words = g.feels.map((f) => f.w);
  const shown = g.feels.slice(-TITLE_MAX);
  const title = (
    <Text style={[s.seq, quiet && s.seqQuiet]}>
      {g.feels.length > TITLE_MAX ? <Text style={s.then}>{'…  '}</Text> : null}
      {shown.map((f, i) => (
        <Text key={i}>
          {i ? <Text style={s.then}>{'  then  '}</Text> : null}
          <Text style={{ color: feelColor(f.w) }}>{f.w}</Text>
        </Text>
      ))}
    </Text>
  );
  const more = written.length - 1;
  return (
    <View style={[s.day, quiet && s.dayQuiet]}>
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
      {(all ? written : written.slice(0, 1)).map((e) => (
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
      {more > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => setAll((v) => !v)} hitSlop={8} style={s.moreBtn}>
          <Text style={s.more}>{all ? 'Show less' : `${more} more ${more === 1 ? 'entry' : 'entries'}`}</Text>
        </Pressable>
      ) : null}
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
  day: { paddingTop: 16, paddingBottom: 32 },
  dayQuiet: { paddingTop: 8, paddingBottom: 16 },
  light: { left: -150, top: -100 },
  lightQuiet: { left: -110, top: -62 },
  dayName: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: JN.quiet, marginBottom: 3 },
  seq: { fontFamily: font.bodySemi, fontSize: 19, lineHeight: 26 },
  seqQuiet: { fontSize: 16, lineHeight: 22 },
  then: { fontFamily: font.body, fontSize: 13, color: 'rgba(235, 235, 245, 0.45)' },
  text: { fontFamily: font.body, fontSize: 15.5, lineHeight: 23, color: JN.page, marginTop: 6 },
  moreBtn: { alignSelf: 'flex-start', paddingTop: 8 },
  more: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: JN.quiet },
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
