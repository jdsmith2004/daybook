/* Friends (beta): the pictures. Made for the usual case, one friend, sometimes two (the owner, November 15, 2026: "most people are
   going to only have like one person ... Having five like this is insane"), and so that what a person does here does something
   (the owner, the same day: "Warming their flame does nothing"; their answer: the spark "visits and comes back").
   - FriendsSky: the top of the page, from edge to edge and under the clock, like Today and Milestones. Your flame and your friend's
     stand big on one land, the same size (never a ranking). The together streak sits low on the left, as Today's number does, and
     the last seven days on the right, a dot lit for each day you were both in. A spark you send flies from your flame to theirs and
     stays beside it; one they sent you glows beside yours until your next lesson.
   - Spark: the spark itself, a small bright star with its glow.
   - FriendWeek: their day and week at a glance (three numbers, a zero left out).
   - CommunityScene: many small fires on far hills at night; yours is lit in front once you pre-join. */
import { emblemScene, type DayKey, type ShareVals } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { skyInk } from '@/components/hero';
import { Text } from '@/components/text';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import type { FriendView } from '@/lib/friends';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

const STARS: [number, number, number][] = [
  [6, 14, 2],
  [14, 30, 3],
  [24, 18, 2],
  [36, 8, 3],
  [47, 26, 2],
  [58, 12, 2],
  [67, 30, 3],
  [78, 9, 3],
  [87, 22, 2],
  [94, 13, 3],
];

/** the spark: a four-point star, white at the heart, in a warm glow */
const SPARK_XML = `<svg viewBox="0 0 40 40"><defs><radialGradient id="g"><stop offset="0" stop-color="#FFE7A8" stop-opacity="0.95"/><stop offset="0.45" stop-color="#FFB347" stop-opacity="0.45"/><stop offset="1" stop-color="#FF8A3D" stop-opacity="0"/></radialGradient></defs><circle cx="20" cy="20" r="20" fill="url(#g)"/><path d="M20 7 C21.2 15.5 24.5 18.8 33 20 C24.5 21.2 21.2 24.5 20 33 C18.8 24.5 15.5 21.2 7 20 C15.5 18.8 18.8 15.5 20 7 Z" fill="#FFF6DC"/><circle cx="20" cy="20" r="3.2" fill="#FFFFFF"/></svg>`;

/** the spark, breathing slowly (still under Reduce Motion) */
export function Spark({ size, still }: { size: number; still?: boolean }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still || reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [still, reduced, v]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
        transform: [
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) },
        ],
      }}>
      <SvgXml xml={SPARK_XML} width={size} height={size} />
    </Animated.View>
  );
}

/** where the pictures stand: x (a share of the width) and size of each flame */
function places(n: number, width: number, big: number) {
  const room = big;
  if (n === 0) return { me: { x: 0.34, s: big }, them: [] as { x: number; s: number }[] };
  if (n === 1) return { me: { x: 0.28, s: big }, them: [{ x: 0.72, s: big }] };
  const s3 = Math.min(width * 0.34, room * 0.8);
  return {
    me: { x: 0.5, s: s3 },
    them: [
      { x: 0.17, s: s3 * 0.82 },
      { x: 0.83, s: s3 * 0.82 },
    ],
  };
}

/** the days of the last week as dots: lit for each day both were in, today ringed */
function WeekDots({ week, tk, ink, soft }: { week: string[]; tk: DayKey; ink: string; soft: string }) {
  const days: DayKey[] = [];
  const t = Date.parse(tk + 'T12:00:00Z');
  for (let i = 6; i >= 0; i--) days.push(new Date(t - i * 86400_000).toISOString().slice(0, 10));
  const lit = new Set(week);
  const letter = (d: DayKey) => 'SMTWTFS'[new Date(d + 'T12:00:00Z').getUTCDay()];
  return (
    <View style={s.dots} accessible accessibilityLabel={`${lit.size} of the last 7 days together`}>
      {days.map((d) => {
        const on = lit.has(d);
        return (
          <View key={d} style={s.dotCol}>
            <View
              style={[
                s.dot,
                on ? { backgroundColor: '#FFC867', borderColor: '#FFE7A8' } : { backgroundColor: 'transparent', borderColor: soft },
                d === tk && !on ? { borderStyle: 'dashed' } : null,
              ]}
            />
            <Text style={[s.dotDay, { color: d === tk ? ink : soft }]}>{letter(d)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function FriendsSky({
  level,
  friends,
  width,
  height,
  big,
  top,
  tk,
  back,
  onBack,
  onAdd,
  onFriend,
  pulse,
  flying,
  mineWaits,
}: {
  level: number;
  friends: FriendView[];
  /** the screen's width and the sky's height */
  width: number;
  height: number;
  /** each flame's size, with one friend */
  big: number;
  /** the clock's band at the top */
  top: number;
  tk: DayKey;
  back: string;
  onBack: () => void;
  onAdd: () => void;
  onFriend: (fid: string) => void;
  pulse: number;
  /** goes up each time a spark is sent to the one friend: it flies across */
  flying: number;
  /** a spark from a friend waits for your next lesson: it glows beside your flame */
  mineWaits: boolean;
}) {
  const reduced = useReducedMotion();
  const sc = useMemo(() => emblemScene(level), [level]);
  const ink = skyInk(level);
  const FOOT = 100;
  const shown = friends.slice(0, 2);
  const more = friends.length - shown.length;
  const one = shown.length === 1 ? shown[0] : null;
  const p = places(shown.length, width, big);
  /* the flames stand on one line, their feet just above the foot band; the sky lines up with the biggest drawing, as in FlameSky */
  const ground = height - FOOT;
  const s0 = p.me.s;
  const top0 = ground - s0;
  const from = Math.min(0, top0);
  const box = Math.max(height, top0 + s0) - from;
  const at = (x: number, sz: number) => ({ left: x * width - sz / 2, top: ground - sz, width: sz, height: sz });

  /* a spark sent to the one friend: from your flame, up over the sky, down beside theirs */
  const fly = useRef(new Animated.Value(1)).current;
  const lastFly = useRef(flying);
  useEffect(() => {
    if (flying === lastFly.current) return;
    lastFly.current = flying;
    if (reduced) return;
    fly.setValue(0);
    Animated.timing(fly, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }).start(() => buzz('lit'));
  }, [flying, reduced, fly]);
  const SP = 34;
  const theirSpot = one ? { x: p.them[0].x * width + p.them[0].s * 0.3, y: ground - p.them[0].s * 0.34 } : null;
  const mySpot = { x: p.me.x * width + p.me.s * 0.3, y: ground - p.me.s * 0.34 };
  const sentWaits = !!one && !!one.sent && !one.sentUsed && Date.now() - one.sent < 7 * 86400_000;
  const tg = one?.together;
  const alive = tg && tg.last && tg.last >= new Date(Date.parse(tk + 'T12:00:00Z') - 86400_000).toISOString().slice(0, 10) ? tg.n : 0;

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <LinearGradient
        colors={sc.sky}
        locations={sc.at.map((o) => (top0 + o * s0 - from) / box) as [number, number, number]}
        style={{ position: 'absolute', left: 0, right: 0, top: from, height: box }}
      />
      {sc.stars
        ? STARS.map(([x, y, r], i) => (
            <View key={i} pointerEvents="none" style={[s.star, { left: `${x}%`, top: `${y}%`, width: r, height: r, borderRadius: r / 2 }]} />
          ))
        : null}
      {sc.land ? (
        <SvgXml
          xml={`<svg viewBox="${60 - 400} ${(-top0 * 120) / s0} 800 ${(height * 120) / s0}" preserveAspectRatio="xMidYMin slice">${sc.land}</svg>`}
          style={StyleSheet.absoluteFill}
          width="100%"
          height={height}
          pointerEvents="none"
        />
      ) : null}

      {/* the page's frame, on the sky */}
      <View style={[s.head, { top: top + 4 }]} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel={back} onPress={onBack} style={s.back}>
          <Icon name="back" size={22} color={ink.ink} />
          <T v="label" style={{ color: ink.ink }}>
            {back}
          </T>
        </Pressable>
        <View style={s.titleRow}>
          <T v="title" accessibilityRole="header" style={{ color: ink.ink }}>
            Friends
          </T>
          <View style={[s.beta, { backgroundColor: ink.glass }]}>
            <Text style={[s.betaT, { color: ink.ink }]}>Beta</Text>
          </View>
        </View>
      </View>

      {/* your flame, and the spark waiting beside it */}
      <View style={[s.at, at(p.me.x, p.me.s)]} pointerEvents="none">
        <BigFlame level={level} size={p.me.s} pulse={pulse} noLand />
      </View>
      {mineWaits ? (
        <View style={[s.at, { left: mySpot.x - SP / 2, top: mySpot.y - SP / 2 }]} pointerEvents="none">
          <Spark size={SP} />
        </View>
      ) : null}

      {shown.map((f, i) => (
        <Pressable
          key={f.fid}
          accessibilityRole="button"
          accessibilityLabel={f.name + (f.vals.level ? ', level ' + f.vals.level : '')}
          onPress={() => {
            buzz('tap');
            onFriend(f.fid);
          }}
          style={[s.at, at(p.them[i].x, p.them[i].s)]}>
          <BigFlame level={f.vals.level || 1} size={p.them[i].s} noLand />
        </Pressable>
      ))}

      {/* the spark you sent: flying, then resting beside their flame until their lesson */}
      {one && theirSpot && (sentWaits || flying > 0) ? (
        <Animated.View
          pointerEvents="none"
          style={[
            s.at,
            {
              left: theirSpot.x - SP / 2,
              top: theirSpot.y - SP / 2,
              opacity: sentWaits ? 1 : fly.interpolate({ inputRange: [0, 0.9, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateX: fly.interpolate({ inputRange: [0, 1], outputRange: [mySpot.x - theirSpot.x, 0] }) },
                {
                  translateY: fly.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [mySpot.y - theirSpot.y, -Math.min(140, p.me.s * 0.7), 0],
                  }),
                },
                { scale: fly.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.7, 1.5, 1] }) },
              ],
            },
          ]}>
          <Spark size={SP} />
        </Animated.View>
      ) : null}

      {/* names, under the flames */}
      <Name x={p.me.x} width={width} y={ground + 2} label="You" color={ink.ink} />
      {shown.map((f, i) => (
        <Name key={'n' + f.fid} x={p.them[i].x} width={width} y={ground + 2} label={f.name} color={ink.ink} />
      ))}

      {shown.length === 0 ? (
        /* the place beside your fire, waiting: a soft warm glow on the ground and a way to fill it */
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a friend"
          onPress={onAdd}
          style={[s.place, { left: 0.72 * width - 60, top: ground - 120 }]}>
          <View style={[s.glow, { backgroundColor: 'rgba(255,190,90,0.22)' }]} />
          <View style={[s.ring, { borderColor: ink.ink }]}>
            <Icon name="plus" size={28} color={ink.ink} />
          </View>
          <T v="label" style={{ color: ink.ink, marginTop: 10 }}>
            A friend
          </T>
        </Pressable>
      ) : null}

      {/* the foot: the together streak on the left, the last seven days on the right */}
      {one ? (
        <View style={[s.foot, { height: FOOT - 40 }]} pointerEvents="none">
          <View style={{ flex: 1 }} accessible accessibilityLabel={alive ? `${alive} ${alive === 1 ? 'day' : 'days'} together in a row` : 'Together'}>
            {alive ? (
              <View style={s.numRow}>
                <Text style={[s.num, { color: ink.ink }]}>{alive}</Text>
                <Text style={[s.numWord, { color: ink.ink }]}>{alive === 1 ? 'day\ntogether' : 'days\ntogether'}</Text>
              </View>
            ) : (
              <Text style={[s.numWord, { color: ink.ink }]}>{'Both open Daybook today\nto start a streak'}</Text>
            )}
          </View>
          <WeekDots week={one.week || []} tk={tk} ink={ink.ink} soft={ink.soft} />
        </View>
      ) : shown.length === 0 ? (
        <View style={[s.foot, { height: FOOT - 40 }]} pointerEvents="none">
          <Text style={[s.numWord, { color: ink.ink }]}>One friend is enough.</Text>
        </View>
      ) : null}

      {more > 0 ? (
        <View style={[s.more, { backgroundColor: ink.glass, top: top + 14 }]}>
          <T v="small" style={{ color: ink.ink }}>
            +{more}
          </T>
        </View>
      ) : null}
    </View>
  );
}

function Name({ x, width, y, label, color }: { x: number; width: number; y: number; label: string; color: string }) {
  return (
    <View pointerEvents="none" style={[s.name, { left: x * width - 70, top: y }]}>
      <T v="label" numberOfLines={1} style={{ color, textAlign: 'center' }}>
        {label}
      </T>
    </View>
  );
}

/** a friend's day and week at a glance: what they did today, and three numbers for the week. A count of zero is left out. */
export function FriendWeek({ vals, today }: { vals: ShareVals; today: string }) {
  const c = useTheme();
  const week = (
    [
      ['lessons', vals.lessons, vals.lessons === 1 ? 'lesson' : 'lessons'],
      ['checkins', vals.checkins, vals.checkins === 1 ? 'check-in' : 'check-ins'],
      ['days', vals.days, vals.days === 1 ? 'day in Daybook' : 'days in Daybook'],
      ['rode', vals.rode, vals.rode === 1 ? 'urge ridden out' : 'urges ridden out'],
    ] as [string, number | undefined, string][]
  ).filter(([, n]) => (n ?? 0) > 0);
  if (!today && !week.length) return null;
  return (
    <View style={[s.panel, { backgroundColor: c.surface }]}>
      {today ? (
        <View style={[s.todayRow, week.length ? { borderBottomColor: c.line, borderBottomWidth: StyleSheet.hairlineWidth } : null]}>
          <Icon name="check" size={18} color={c.mintText} />
          <T v="label" style={{ flex: 1 }}>
            <T v="label" tone="muted">
              Today{'  '}
            </T>
            {today.replace(' · C', ', c')}
          </T>
        </View>
      ) : null}
      {week.length ? (
        <View style={s.stats}>
          {week.slice(0, 3).map(([k, n, label], i) => (
            <View key={k} style={[s.stat, i ? { borderLeftColor: c.line, borderLeftWidth: StyleSheet.hairlineWidth } : null]}>
              <Text style={[s.statN, { color: c.ink }]}>{n}</Text>
              <T v="small" tone="muted" style={{ textAlign: 'center' }}>
                {label}
              </T>
            </View>
          ))}
        </View>
      ) : null}
      {week.length ? (
        <T v="small" tone="muted" style={s.weekNote}>
          The last 7 days
        </T>
      ) : null}
    </View>
  );
}

/* far hills, back to front, across a 360 by 170 picture */
const HILLS = [
  { d: 'M0 96 C60 78 120 88 180 82 C240 76 300 88 360 80 L360 170 L0 170 Z', fill: '#3B3080' },
  { d: 'M0 118 C70 102 130 114 200 106 C260 100 310 110 360 104 L360 170 L0 170 Z', fill: '#2A2263' },
  { d: 'M0 142 C80 128 150 136 220 130 C280 126 320 134 360 130 L360 170 L0 170 Z', fill: '#1B1645' },
];
/* the far fires: [x share, y share of the height, size, level] */
const FIRES: [number, number, number, number][] = [
  [0.08, 0.5, 20, 3],
  [0.24, 0.47, 18, 5],
  [0.42, 0.5, 20, 2],
  [0.6, 0.46, 18, 7],
  [0.77, 0.5, 20, 4],
  [0.93, 0.47, 18, 6],
  [0.16, 0.66, 30, 6],
  [0.36, 0.69, 26, 8],
  [0.66, 0.68, 28, 3],
  [0.86, 0.66, 30, 9],
];

/** the community that is coming: a night of far fires, with the words on it, and yours in front once you have pre-joined */
export function CommunityScene({ joined, width, height = 220 }: { joined: boolean; width: number; height?: number }) {
  const H = height;
  const glows = FIRES.map(
    ([x, y, size]) => `<ellipse cx="${x * 360}" cy="${y * 170 + size * 0.35}" rx="${size * 1.3}" ry="${size * 0.6}" fill="url(#g)"/>`,
  ).join('');
  const hills = `<svg viewBox="0 0 360 170" preserveAspectRatio="none"><defs><radialGradient id="g"><stop offset="0" stop-color="#FFB347" stop-opacity="0.6"/><stop offset="1" stop-color="#FFB347" stop-opacity="0"/></radialGradient></defs>${HILLS.map((h) => `<path d="${h.d}" fill="${h.fill}"/>`).join('')}${glows}</svg>`;
  return (
    <View style={{ height: H, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={['#0B0926', '#211B57', '#3E2F7C']} style={StyleSheet.absoluteFill} />
      {STARS.map(([x, y, r], i) => (
        <View key={i} style={[s.star, { left: `${x}%`, top: `${y * 0.7}%`, width: r, height: r, borderRadius: r / 2 }]} />
      ))}
      <SvgXml xml={hills} width="100%" height={H} style={StyleSheet.absoluteFill} />
      {FIRES.map(([x, y, size, lvl], i) => (
        <View key={i} style={{ position: 'absolute', left: x * width - size / 2, top: y * H - size * 0.8, opacity: 0.92 }}>
          <BigFlame level={lvl} size={size} noLand />
        </View>
      ))}
      {joined ? (
        <View style={{ position: 'absolute', left: width / 2 - 44, top: H - 92 }}>
          <BigFlame level={4} size={88} noLand />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  star: { position: 'absolute', backgroundColor: '#FFF6D8', opacity: 0.8 },
  at: { position: 'absolute' },
  head: { position: 'absolute', left: 16, right: 16, gap: 2 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', minHeight: 44, minWidth: 44, marginLeft: -4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  beta: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  betaT: { fontFamily: font.bodySemi, fontSize: 13 },
  name: { position: 'absolute', width: 140, alignItems: 'center' },
  place: { position: 'absolute', width: 120, alignItems: 'center' },
  glow: { position: 'absolute', top: 70, width: 120, height: 40, borderRadius: 60 },
  ring: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  foot: { position: 'absolute', left: 20, right: 20, bottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  numRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  num: { fontFamily: font.display, fontSize: 52, lineHeight: 54 },
  numWord: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 19, paddingBottom: 6 },
  dots: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  dotCol: { alignItems: 'center', gap: 4 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  dotDay: { fontFamily: font.bodySemi, fontSize: 11 },
  more: { position: 'absolute', right: 16, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  panel: { borderRadius: 20, overflow: 'hidden' },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  stats: { flexDirection: 'row', paddingTop: 16 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 6 },
  statN: { fontFamily: font.display, fontSize: 28, lineHeight: 32 },
  weekNote: { textAlign: 'center', paddingTop: 10, paddingBottom: 14 },
});
