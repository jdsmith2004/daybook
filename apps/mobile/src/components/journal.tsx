/* The journal's pieces (app/journal.tsx; core journal-entries.ts). The list is the day's light: one plain dark page, and
   each log lit softly from behind by the colors of its feelings, wherever they were named (the journal, Name the
   feeling, the ride, a slip). Each entry with words is a log of its own, its feeling as its title over what was written;
   feelings named on their own between entries read in order as a smaller title ("Restless then Grateful"), up to three
   to a log. A day's name shows once, over its logs. Across the top, the week
   as seven little lights. New entry is a bar floating low, where the thumb is. Also here: how far down the journal was
   already pulled when it opens, so it carries on from the thumb. An entry starts with the app's own four colors
   (QuadBubbles in tools/feel.tsx). */
import { feelPos, jnPos, type JDay, type JEntry, type JFeel, type JLog } from '@daybook/core';
import { memo, useId } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Mask, RadialGradient, Rect, Stop } from 'react-native-svg';

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

/** the most feelings a day's light in the week mixes: its last few */
const WEEK_MAX = 3;

/* ---------- the page's light ----------
   Every log's feelings light one canvas behind the whole list, as four soft lanes running down the page side by side.
   Each lane is one gradient from the top log to the bottom one, taking a color from every log it passes, so the colors
   always run into each other with no dark gap between logs, and never fade through clear (two colors meeting through
   clear turn grey). Each lane is feathered sideways into its neighbors, and the light fades out before the right edge,
   so the page keeps a little dark margin there. It starts just above the first log, under the week. It is drawn at a
   quarter of its size and scaled up: it is soft anyway, and a long journal then costs a sixteenth of the memory. */
/** the lanes' middles, across the width; a log's first color takes the left lane, its next the one after */
const LANES = [0.06, 0.28, 0.5, 0.7];
/** how far up and down each lane takes a log's color from its middle, as a share of the log's height, so the colors do not sit in rows */
const LANE_SHIFT = [-0.18, 0.12, -0.06, 0.2];
/** how wide a lane's light is, as a share of the width (it fades like a bell over about this far each side) */
const LANE_W = 0.2;
/** where the light starts to fade on the right, and where it is gone: a long, eased fade, so the dark margin has no edge */
const RIGHT_FROM = 0.5;
const RIGHT_END = 0.94;
const LOW = 4;
/** a lane's light across the width: a bell around its middle, gone before the right edge */
const across = (mid: number, x: number) => {
  const t = Math.min(1, Math.max(0, (RIGHT_END - x) / (RIGHT_END - RIGHT_FROM)));
  return Math.exp(-(((x - mid) / LANE_W) ** 2)) * t * t * (3 - 2 * t);
};
const ACROSS = Array.from({ length: 26 }, (_, i) => i / 25);
export function LightField({ logs, width, height }: { logs: { y: number; h: number; colors: string[]; quiet: boolean }[]; width: number; height: number }) {
  const id = 'f' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const w = width / LOW;
  const h = height / LOW;
  if (!logs.length || !height) return null;
  const at = (y: number) => Math.min(1, Math.max(0, y / height));
  const first = logs[0];
  const last = logs[logs.length - 1];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: w, height: h, left: (width - w) / 2, top: (height - h) / 2, transform: [{ scale: LOW }] }}>
      <Svg width={w} height={h} {...SVG_HIDE}>
        <Defs>
          {LANES.map((mid, li) => {
            const col = (l: (typeof logs)[number]) => l.colors[li % l.colors.length];
            /* it comes up from the dark just above the first log, and goes back to it under the last */
            const stops = [
              { y: first.y - 40, c: col(first), o: 0 },
              ...logs.map((l) => ({ y: l.y + l.h * (0.5 + LANE_SHIFT[li]), c: col(l), o: l.quiet ? 0.2 : 0.3 })),
              { y: last.y + last.h + 160, c: col(last), o: 0 },
            ];
            return (
              <LinearGradient key={'v' + li} id={id + 'v' + li} x1="0" y1="0" x2="0" y2="1">
                {stops.map((p, i) => (
                  <Stop key={i} offset={at(p.y)} stopColor={p.c} stopOpacity={p.o} />
                ))}
              </LinearGradient>
            );
          })}
          {LANES.map((mid, li) => (
            <LinearGradient key={'h' + li} id={id + 'h' + li} x1="0" y1="0" x2="1" y2="0">
              {ACROSS.map((x) => (
                <Stop key={x} offset={x} stopColor="#FFFFFF" stopOpacity={across(mid, x)} />
              ))}
            </LinearGradient>
          ))}
          {LANES.map((mid, li) => (
            <Mask key={'m' + li} id={id + 'm' + li} x="0" y="0" width={w} height={h} maskUnits="userSpaceOnUse">
              <Rect width={w} height={h} fill={`url(#${id}h${li})`} />
            </Mask>
          ))}
        </Defs>
        {LANES.map((mid, li) => (
          <Rect key={li} width={w} height={h} fill={`url(#${id}v${li})`} mask={`url(#${id}m${li})`} />
        ))}
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

/** a day's colors in the week: its last few feelings, in order, each once, so it matches the day's newest log */
export const dayColors = (g: Pick<JDay, 'feels'>) => [...new Set(g.feels.slice(-WEEK_MAX).map((f) => feelColor(f.w)))];
/** a log's colors: its feelings', in order, each once, so its light matches its title */
export const logColors = (l: Pick<JLog, 'feels'>) => [...new Set(l.feels.map((f) => feelColor(f.w)))];

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
/** a log's feelings in order, as its title: "Restless then Grateful" */
function LogTitle({ feels, quiet }: { feels: JFeel[]; quiet: boolean }) {
  return (
    <Text style={[s.seq, quiet && s.seqQuiet]}>
      {feels.map((f, i) => (
        <Text key={i}>
          {i ? <Text style={s.then}>{'  then  '}</Text> : null}
          <Text style={{ color: feelColor(f.w) }}>{f.w}</Text>
        </Text>
      ))}
    </Text>
  );
}

/** one day: its name once, then each of its logs, newest first (core jnLogs). An entry with words is a log of its own,
    its feeling over what was written; the feelings named on their own are a smaller line between them. When a day has
    more than one log, each says its time, small, at the right. A tap opens the log's entry. The light behind them is the
    page's (LightField), so each log reports where it sits. */
export const DayLogs = memo(function DayLogs({
  g,
  logs,
  onOpen,
  onLay,
}: {
  g: JDay;
  logs: JLog[];
  onOpen: (id: string) => void;
  onLay: (key: string, y: number, h: number) => void;
}) {
  const many = logs.length > 1;
  return (
    <View style={s.day}>
      <Text style={s.dayName} accessibilityRole="header">
        {g.label}
      </Text>
      {logs.map((l) => {
        const quiet = !l.entry;
        const words = 'Felt ' + l.feels.map((f) => f.w).join(', then ') + (many ? ', ' + entryTime(l.feels[0].at) : '');
        const body = (
          <>
            <View style={s.logHead}>
              <View style={{ flex: 1 }}>
                <LogTitle feels={l.feels} quiet={quiet} />
              </View>
              {many ? <Text style={s.time}>{entryTime(l.feels[0].at)}</Text> : null}
            </View>
            {l.entry ? (
              <Text style={s.text} numberOfLines={3}>
                {l.entry.t.trim()}
              </Text>
            ) : null}
          </>
        );
        return (
          <View key={l.key} style={[s.log, quiet && s.logQuiet]} onLayout={(e) => onLay(l.key, e.nativeEvent.layout.y, e.nativeEvent.layout.height)}>
            {l.open ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={l.entry ? words + '. ' + l.entry.t.trim().slice(0, 160) : words}
                accessibilityHint="Opens the entry"
                onPress={() => onOpen(l.open!)}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                {body}
              </Pressable>
            ) : (
              <View accessible accessibilityLabel={words}>
                {body}
              </View>
            )}
          </View>
        );
      })}
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
  /* a day's logs sit close and the days far apart, so the days read as groups with no line between them */
  day: { paddingTop: 14, paddingBottom: 30 },
  dayName: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: JN.quiet, marginBottom: 2 },
  log: { paddingVertical: 9 },
  logQuiet: { paddingVertical: 6 },
  logHead: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  time: { fontFamily: font.bodyMedium, fontSize: 12, lineHeight: 16, color: JN.quiet },
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
