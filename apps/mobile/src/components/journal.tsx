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
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Mask, RadialGradient, Rect, Stop } from 'react-native-svg';

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
   Every log's feelings light one canvas behind the whole list, in two layers (the owner picked this from six looks
   shot on the simulator, October 26, 2026: "circles over a wash"):
   - the circles: each of a log's feelings is a soft round glow at its own steady random place, big enough to reach the
     logs above and below, so the page has the loose, scattered look of light through a window;
   - the wash, faint underneath: four lanes running down the page, each one gradient from the first log to the last
     that takes a color from every log, so wherever the circles leave a gap the colors still run into each other (and
     never through clear, which turns grey).
   The light comes up from the dark just above the first log (never over the week), goes back to it under the last, and
   fades out over the right half, so a dark margin stays at the right with no edge. It is drawn at a quarter of its size
   and scaled up: it is soft anyway, and a long journal then costs a sixteenth of the memory. */
/** the lanes' middles, across the width; a log's first color takes the left lane, its next the one after */
const LANES = [0.06, 0.28, 0.5, 0.7];
/** how far up and down each lane takes a log's color from its middle, as a share of the log's height, so the colors do not sit in rows */
const LANE_SHIFT = [-0.18, 0.12, -0.06, 0.2];
/** how wide a lane's light is, as a share of the width (it fades like a bell over about this far each side) */
const LANE_W = 0.2;
/** how strong each layer is: the wash faint, the circles over it */
const WASH = 0.55;
const CIRCLES = 0.7;
/** where the light starts to fade on the right, and where it is gone: a long, eased fade, so the dark margin has no edge */
const RIGHT_FROM = 0.5;
const RIGHT_END = 0.94;
const LOW = 4;
/** how far the light runs on under the last log */
const BELOW = 220;
const ease = (t: number) => t * t * (3 - 2 * t);
const rightFade = (x: number) => ease(Math.min(1, Math.max(0, (RIGHT_END - x) / (RIGHT_END - RIGHT_FROM))));
/** a lane's light across the width: a bell around its middle */
const across = (mid: number, x: number) => Math.exp(-(((x - mid) / LANE_W) ** 2));
const ACROSS = Array.from({ length: 26 }, (_, i) => i / 25);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** a steady random from a log's key, so its circles sit in the same place every time the list draws */
function seeded(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
type FieldLog = { key: string; y: number; h: number; colors: string[]; quiet: boolean };
/** each log's circles: one per feeling (up to three), somewhere in the left two thirds, a little above or below the
    log's middle, each as big as the way to the next log's middle (so it always meets its neighbors) */
function circles(logs: FieldLog[], W: number) {
  const mids = logs.map((l) => l.y + l.h / 2);
  return logs.flatMap((l, i) => {
    const d = Math.max(i ? mids[i] - mids[i - 1] : 0, i < logs.length - 1 ? mids[i + 1] - mids[i] : 0, l.h);
    const r = seeded(l.key);
    return l.colors.slice(0, 3).map((c) => ({
      x: (0.04 + r() * 0.56) * W,
      y: mids[i] + (r() - 0.5) * l.h * 0.5,
      r: clamp(d * 1.1, 0.3 * W, 0.6 * W),
      c,
      o: l.quiet ? 0.85 : 1,
    }));
  });
}
export function LightField({ logs, width, height }: { logs: FieldLog[]; width: number; height: number }) {
  const id = 'f' + useId().replace(/[^a-zA-Z0-9]/g, '');
  if (!logs.length || !height) return null;
  const H = height + BELOW;
  const w = width / LOW;
  const h = H / LOW;
  const at = (y: number) => Math.min(1, Math.max(0, y / H));
  const first = logs[0];
  const end = logs[logs.length - 1].y + logs[logs.length - 1].h;
  const gl = circles(logs, width);
  const cols = [...new Set(gl.map((g) => g.c))];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: w, height: h, left: (width - w) / 2, top: (H - h) / 2, transform: [{ scale: LOW }] }}>
      <Svg width={w} height={h} {...SVG_HIDE}>
        <Defs>
          {cols.map((c, i) => (
            <RadialGradient key={'c' + i} id={id + 'c' + i} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={c} stopOpacity={0.42} />
              <Stop offset="0.45" stopColor={c} stopOpacity={0.2} />
              <Stop offset="0.8" stopColor={c} stopOpacity={0.05} />
              <Stop offset="1" stopColor={c} stopOpacity={0} />
            </RadialGradient>
          ))}
          {LANES.map((mid, li) => (
            <LinearGradient key={'v' + li} id={id + 'v' + li} x1="0" y1="0" x2="0" y2="1">
              {logs.map((l, i) => (
                <Stop key={i} offset={at(l.y + l.h * (0.5 + LANE_SHIFT[li]))} stopColor={l.colors[li % l.colors.length]} stopOpacity={l.quiet ? 0.2 : 0.3} />
              ))}
            </LinearGradient>
          ))}
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
          <LinearGradient id={id + 'rg'} x1="0" y1="0" x2="1" y2="0">
            {ACROSS.map((x) => (
              <Stop key={x} offset={x} stopColor="#FFFFFF" stopOpacity={rightFade(x)} />
            ))}
          </LinearGradient>
          <Mask id={id + 'r'} x="0" y="0" width={w} height={h} maskUnits="userSpaceOnUse">
            <Rect width={w} height={h} fill={`url(#${id}rg)`} />
          </Mask>
          <LinearGradient id={id + 'tg'} x1="0" y1="0" x2="0" y2="1">
            <Stop offset={at(first.y - 60)} stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset={at(first.y + 10)} stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset={at(end)} stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset={at(end + BELOW - 20)} stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
          <Mask id={id + 't'} x="0" y="0" width={w} height={h} maskUnits="userSpaceOnUse">
            <Rect width={w} height={h} fill={`url(#${id}tg)`} />
          </Mask>
        </Defs>
        <G mask={`url(#${id}t)`}>
          <G mask={`url(#${id}r)`}>
            <G opacity={WASH}>
              {LANES.map((mid, li) => (
                <Rect key={li} width={w} height={h} fill={`url(#${id}v${li})`} mask={`url(#${id}m${li})`} />
              ))}
            </G>
            <G opacity={CIRCLES}>
              {gl.map((g, i) => (
                <Circle key={i} cx={g.x / LOW} cy={g.y / LOW} r={g.r / LOW} fill={`url(#${id}c${cols.indexOf(g.c)})`} opacity={g.o} />
              ))}
            </G>
          </G>
        </G>
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
