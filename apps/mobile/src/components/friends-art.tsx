/* Friends (beta): the pictures, built like Today (the owner, November 15, 2026: "it still does not meet our standards", and later
   "the UI needs work. It still feels not put together ... try again and do better"). Made for the usual case, one friend.
   - FriendsSky: the top of the page from edge to edge, under the clock. Your flame and your friend's stand big, each on its own hill,
     the two hills meeting in the middle, in your flame's own sky and land colors, with one warm glow behind both. On the land, as
     on Today's band, the words: you on the left, them on the right (a tap opens them), and between you the together streak, big,
     with its seven marks (Duolingo's Friend Streak puts the two characters and the one count together the same way). On a day you
     were both in, the two flames lean toward each other. A spark waiting for you hangs between them; one you send flies across.
   - Spark: the spark itself, a small bright star with its glow.
   - FriendWeek: a friend's week as marks, one row each (a count is its marks, docs/design-standards.md). */
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

/** the land's colors from the scene's own drawing: the front hill, and the one behind it (or the front again) */
function landColors(land: string | null | undefined): { front: string; back: string } {
  const fills = [...(land || '').matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1]);
  const front = fills.at(-1) || '#0C0828';
  return { front, back: fills.length > 1 ? fills[0] : front };
}

/** the land: a hill under each flame (x, crest y in px) meeting in a soft dip, flat land below; a ridge behind; one warm glow */
function hillsXml(w: number, h: number, crests: { x: number; y: number }[], c: { front: string; back: string }): string {
  const base = Math.max(...crests.map((k) => k.y)) + 30;
  let d = `M0 ${base}`;
  let prevX = 0;
  let prevY = base;
  for (let i = 0; i < crests.length; i++) {
    const k = crests[i];
    const nextX = i + 1 < crests.length ? (k.x + crests[i + 1].x) / 2 : w;
    const dipY = i + 1 < crests.length ? Math.max(k.y, crests[i + 1].y) + 20 : base;
    d += ` C${prevX + (k.x - prevX) * 0.55} ${prevY} ${k.x - (k.x - prevX) * 0.5} ${k.y} ${k.x} ${k.y}`;
    d += ` C${k.x + (nextX - k.x) * 0.5} ${k.y} ${nextX - (nextX - k.x) * 0.55} ${dipY} ${nextX} ${dipY}`;
    prevX = nextX;
    prevY = dipY;
  }
  d += ` L${w} ${h} L0 ${h} Z`;
  const r = base - 36;
  const ridge = `M0 ${r} C${w * 0.18} ${r - 26} ${w * 0.38} ${r + 6} ${w * 0.55} ${r - 14} S${w * 0.86} ${r - 30} ${w} ${r - 8} L${w} ${h} L0 ${h} Z`;
  const cx = (crests[0].x + crests[crests.length - 1].x) / 2;
  const glow = `<defs><radialGradient id="h"><stop offset="0" stop-color="#FFB347" stop-opacity="0.42"/><stop offset="0.6" stop-color="#FF9A4A" stop-opacity="0.12"/><stop offset="1" stop-color="#FF9A4A" stop-opacity="0"/></radialGradient></defs><ellipse cx="${cx}" cy="${base - 70}" rx="${w * 0.62}" ry="${Math.min(170, w * 0.42)}" fill="url(#h)"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${glow}<path d="${ridge}" fill="${c.back}" opacity="0.5"/><path d="${d}" fill="${c.front}"/></svg>`;
}

/** where the flames stand: their center x (px) and size */
function places(n: number, width: number, big: number) {
  if (n === 0) return { me: { x: width * 0.36, s: big }, them: [] as { x: number; s: number }[] };
  if (n === 1) return { me: { x: width * 0.28, s: big }, them: [{ x: width * 0.72, s: big }] };
  const s3 = Math.round(big * 0.78);
  return {
    me: { x: width * 0.5, s: s3 },
    them: [
      { x: width * 0.17, s: Math.round(s3 * 0.84) },
      { x: width * 0.83, s: Math.round(s3 * 0.84) },
    ],
  };
}

/** the last seven days as small marks: lit for each day you were both in, today ringed */
function Marks({ week, tk }: { week: string[]; tk: DayKey }) {
  const t = Date.parse(tk + 'T12:00:00Z');
  const lit = new Set(week);
  const days: DayKey[] = [];
  for (let i = 6; i >= 0; i--) days.push(new Date(t - i * 86400_000).toISOString().slice(0, 10));
  return (
    <View style={s.marks} accessible accessibilityLabel={`${days.filter((d) => lit.has(d)).length} of the last 7 days together`}>
      {days.map((d) => (
        <View
          key={d}
          style={[
            s.mark,
            lit.has(d) ? { backgroundColor: '#FFC24A', borderColor: '#FFC24A' } : { borderColor: 'rgba(255,255,255,0.45)' },
            d === tk && !lit.has(d) ? { borderColor: '#FFFFFF' } : null,
          ]}
        />
      ))}
    </View>
  );
}

/** how tall the sky is for flames this big: the frame at the top, the flames, the land and its words */
export const skyFor = (top: number, big: number) => top + 64 + big + 128;

export function FriendsSky({
  level,
  friends,
  width,
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
  /** the screen's width */
  width: number;
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
  /** a spark from a friend waits for your next lesson: it hangs between the flames */
  mineWaits: boolean;
}) {
  const reduced = useReducedMotion();
  const sc = useMemo(() => emblemScene(level), [level]);
  const ink = skyInk(level);
  const height = skyFor(top, big);
  const shown = friends.slice(0, 2);
  const more = friends.length - shown.length;
  const one = shown.length === 1 ? shown[0] : null;
  const p = places(shown.length, width, big);
  /* each flame's box ends on one line; its feet stand on its hill's crest (the drawings stand at 88% of their box) */
  const flameTop = top + 64;
  const boxTop = (sz: number) => flameTop + (big - sz);
  const footAt = (sz: number) => boxTop(sz) + sz * 0.88;
  const crests = [...[p.me, ...p.them].map((f) => ({ x: f.x, y: footAt(f.s) }))];
  if (!shown.length) crests.push({ x: width * 0.76, y: footAt(big) + 6 });
  crests.sort((a, b) => a.x - b.x);
  const land = useMemo(() => landColors(sc.land), [sc.land]);
  const key = crests.map((k) => Math.round(k.x) + ',' + Math.round(k.y)).join(' ');
  const hills = useMemo(() => hillsXml(Math.round(width), height, crests, land), [width, height, key, land]); // eslint-disable-line react-hooks/exhaustive-deps
  const at = (f: { x: number; s: number }) => ({ left: f.x - f.s / 2, top: boxTop(f.s), width: f.s, height: f.s });

  /* together today: the two flames lean toward each other (from their feet), a few degrees */
  const tg = one?.together;
  const yday = new Date(Date.parse(tk + 'T12:00:00Z') - 86400_000).toISOString().slice(0, 10);
  const alive = tg && tg.last && tg.last >= yday ? tg.n : 0;
  const both = !!(tg && tg.last && tg.last >= tk);
  const lean = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const to = both ? 1 : 0;
    if (reduced) return lean.setValue(to);
    Animated.spring(lean, { toValue: to, friction: 7, tension: 30, useNativeDriver: NATIVE }).start();
  }, [both, reduced, lean]);
  const tilt = (dir: 1 | -1, sz: number) => [
    { translateY: sz * 0.44 },
    { rotate: lean.interpolate({ inputRange: [0, 1], outputRange: ['0deg', dir * 6 + 'deg'] }) },
    { translateY: -sz * 0.44 },
  ];

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
  const SP = 44;
  const mySpot = { x: p.me.x + p.me.s * 0.3, y: boxTop(p.me.s) + p.me.s * 0.45 };
  const theirSpot = one ? { x: p.them[0].x + p.them[0].s * 0.32, y: boxTop(p.them[0].s) + p.them[0].s * 0.45 } : null;
  const between = one ? { x: (p.me.x + p.them[0].x) / 2, y: flameTop + big * 0.3 } : mySpot;
  const sentWaits = !!one && !!one.sent && !one.sentUsed && Date.now() - one.sent < 7 * 86400_000;
  /* the words on the land take the light ink: the land is the scene's darkest color */
  const soft = 'rgba(255,255,255,0.72)';

  return (
    <View style={{ height, overflow: 'hidden' }}>
      <LinearGradient colors={sc.sky} locations={sc.at as unknown as [number, number, number]} style={StyleSheet.absoluteFill} />
      {sc.stars
        ? STARS.map(([x, y, r], i) => (
            <View key={i} pointerEvents="none" style={[s.star, { left: `${x}%`, top: `${y * 0.7}%`, width: r, height: r, borderRadius: r / 2 }]} />
          ))
        : null}
      <SvgXml xml={hills} width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* the page's frame, on the sky */}
      <View style={[s.head, { top: top + 4 }]} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel={back} onPress={onBack} style={s.back}>
          <Icon name="back" size={24} color={ink.ink} />
        </Pressable>
        <T v="title" accessibilityRole="header" style={{ color: ink.ink }}>
          Friends
        </T>
      </View>

      {/* the flames */}
      <Animated.View style={[s.at, at(p.me), one ? { transform: tilt(1, p.me.s) } : null]} pointerEvents="none">
        <BigFlame level={level} size={p.me.s} pulse={pulse} noLand />
      </Animated.View>
      {shown.map((f, i) => (
        <Animated.View key={f.fid} style={[s.at, at(p.them[i]), one ? { transform: tilt(-1, p.them[i].s) } : null]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={f.name + (f.vals.level ? ', level ' + f.vals.level : '')}
            onPress={() => {
              buzz('tap');
              onFriend(f.fid);
            }}>
            <BigFlame level={f.vals.level || 1} size={p.them[i].s} noLand />
          </Pressable>
        </Animated.View>
      ))}

      {/* a spark from them, hanging between the two flames until your next lesson */}
      {mineWaits ? (
        <View style={[s.at, { left: between.x - SP / 2, top: between.y - SP / 2 }]} pointerEvents="none">
          <Spark size={SP} />
        </View>
      ) : null}
      {/* the spark you sent: flying across, then resting at their flame until their lesson */}
      {one && theirSpot && (sentWaits || flying > 0) ? (
        <Animated.View
          pointerEvents="none"
          style={[
            s.at,
            {
              left: theirSpot.x - SP / 2,
              top: theirSpot.y - SP / 2,
              transform: [
                { translateX: fly.interpolate({ inputRange: [0, 1], outputRange: [mySpot.x - theirSpot.x, 0] }) },
                { translateY: fly.interpolate({ inputRange: [0, 0.5, 1], outputRange: [mySpot.y - theirSpot.y, -big * 0.55, 0] }) },
                { scale: fly.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 1.4, 0.8] }) },
              ],
            },
          ]}>
          <Spark size={SP} />
        </Animated.View>
      ) : null}

      {shown.length === 0 ? (
        /* the place beside your fire, on its own hill, waiting */
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a friend"
          onPress={onAdd}
          style={[s.place, { left: width * 0.76 - 44, top: footAt(big) + 6 - 100 }]}>
          <View style={[s.ring, { borderColor: 'rgba(255,255,255,0.8)' }]}>
            <Icon name="plus" size={30} color="#FFFFFF" />
          </View>
        </Pressable>
      ) : null}

      {/* the land's words: you on the left, them on the right, and the streak between you */}
      <View style={s.foot} pointerEvents="box-none">
        {one ? (
          <>
            <View style={s.side}>
              <Text style={s.who}>You</Text>
            </View>
            <View
              style={s.mid}
              accessible
              accessibilityLabel={alive ? `${alive} ${alive === 1 ? 'day' : 'days'} together in a row` : 'A streak together starts on a day you are both in'}>
              {alive ? (
                <>
                  <Text style={s.n}>{alive}</Text>
                  <Text style={[s.unit, { color: soft }]}>{alive === 1 ? 'day together' : 'days together'}</Text>
                </>
              ) : (
                <Text style={[s.unit, { color: '#FFFFFF', textAlign: 'center' }]}>{'Both in today\nstarts a streak'}</Text>
              )}
              <Marks week={one.week || []} tk={tk} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${one.name}${one.vals.level ? ', level ' + one.vals.level : ''}. Open.`}
              onPress={() => {
                buzz('tap');
                onFriend(one.fid);
              }}
              hitSlop={10}
              style={s.side}>
              <View style={s.whoRow}>
                <Text style={s.who} numberOfLines={1}>
                  {one.name}
                </Text>
                <Icon name="next" size={14} color="#FFFFFF" />
              </View>
            </Pressable>
          </>
        ) : shown.length === 0 ? (
          <Text style={[s.unit, { color: '#FFFFFF', flex: 1, textAlign: 'center' }]}>One friend is enough.</Text>
        ) : null}
      </View>

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

/** a friend's week as marks: one row for lessons, one for check-ins, each with seven marks (more than seven shows the count). What
    they did today leads, when they did something. */
export function FriendWeek({ vals, today }: { vals: ShareVals; today: string }) {
  const c = useTheme();
  const rows = (
    [
      ['Lessons', vals.lessons],
      ['Check-ins', vals.checkins],
      ['Urges ridden out', vals.rode],
    ] as [string, number | undefined][]
  ).filter(([, n]) => n != null);
  if (!today && !rows.length) return null;
  return (
    <View style={[s.panel, { backgroundColor: c.surface }]}>
      {today ? (
        <View style={s.row}>
          <Icon name="check" size={20} color={c.mintText} />
          <T v="label" style={{ flex: 1 }}>
            {today.replace(' · C', ', c')} today
          </T>
        </View>
      ) : null}
      {rows.map(([label, n], i) => (
        <View
          key={label}
          style={[s.row, today || i ? { borderTopColor: c.line, borderTopWidth: StyleSheet.hairlineWidth } : null]}
          accessible
          accessibilityLabel={`${label}: ${n} in the last 7 days`}>
          <T v="label" style={{ flex: 1 }}>
            {label}
          </T>
          <View style={s.pips}>
            {Array.from({ length: 7 }, (_, k) => (
              <View key={k} style={[s.pip, { backgroundColor: k < (n || 0) ? c.sun2 : c.line }]} />
            ))}
          </View>
          {(n || 0) > 7 ? (
            <T v="small" tone="muted">
              {n}
            </T>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  star: { position: 'absolute', backgroundColor: '#FFF6D8', opacity: 0.8 },
  at: { position: 'absolute' },
  head: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4 },
  back: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 36, marginLeft: -8 },
  place: { position: 'absolute', width: 88, alignItems: 'center' },
  ring: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  foot: { position: 'absolute', left: 16, right: 16, bottom: 20, flexDirection: 'row', alignItems: 'flex-end' },
  side: { flex: 1, paddingBottom: 26, alignItems: 'center' },
  mid: { alignItems: 'center', gap: 2 },
  who: { fontFamily: font.display, fontSize: 20, color: '#FFFFFF' },
  whoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  n: { fontFamily: font.display, fontSize: 52, lineHeight: 54, color: '#FFFFFF' },
  unit: { fontFamily: font.display, fontSize: 15, lineHeight: 19 },
  marks: { flexDirection: 'row', gap: 6, marginTop: 8 },
  mark: { width: 11, height: 11, borderRadius: 6, borderWidth: 1.5 },
  more: { position: 'absolute', right: 16, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  panel: { borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56 },
  pips: { flexDirection: 'row', gap: 5 },
  pip: { width: 12, height: 12, borderRadius: 6 },
});
