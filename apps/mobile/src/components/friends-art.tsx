/* Friends (beta): the pictures. Made for the usual case, one friend, sometimes two (the owner, November 15, 2026: "most people are
   going to only have like one person ... Having five like this is insane"):
   - Hearth: your flame and your friend's, big and side by side in your sky, the same size (never a ranking). Alone, your flame
     waits beside one warm empty place. With two friends, three flames; more than that is rare, and counted.
   - FriendReport: one friend's day and week, read at a glance: what they did today, three numbers for the week, and one tap to
     warm their flame.
   - CommunityScene: many small fires on far hills at night, still being lit; yours is lit in front once you pre-join. */
import { emblemScene, FRIEND_CHEERS, friendToday, type DayKey } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { skyInk } from '@/components/hero';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import type { FriendView } from '@/lib/friends';
import { useTheme } from '@/lib/theme';

const STARS: [number, number, number][] = [
  [6, 12, 2],
  [14, 30, 3],
  [24, 16, 2],
  [33, 6, 3],
  [44, 24, 2],
  [58, 10, 2],
  [67, 28, 3],
  [76, 8, 3],
  [86, 22, 2],
  [93, 12, 3],
];

/** your flame with your friends' (up to two shown), standing together in your sky */
export function Hearth({
  level,
  friends,
  width,
  pulse,
  onAdd,
  onFriend,
}: {
  level: number;
  friends: FriendView[];
  width: number;
  pulse: number;
  onAdd: () => void;
  onFriend: (fid: string) => void;
}) {
  const sc = useMemo(() => emblemScene(level), [level]);
  const ink = skyInk(level);
  const H = Math.min(320, Math.round(width * 0.8));
  const foot = Math.round(H * 0.1);
  const shown = friends.slice(0, 2);
  const more = friends.length - shown.length;
  /* where each flame stands (center x as a share of the width) and how big it is */
  const me = shown.length === 0 ? { x: 0.42, s: H * 0.62 } : shown.length === 1 ? { x: 0.29, s: H * 0.64 } : { x: 0.5, s: H * 0.5 };
  const them =
    shown.length === 1
      ? [{ x: 0.71, s: H * 0.64 }]
      : [
          { x: 0.17, s: H * 0.4 },
          { x: 0.83, s: H * 0.4 },
        ];
  /* the sky lines up with the biggest drawing, as in FlameSky */
  const s0 = me.s;
  const top0 = H - foot - s0;
  const from = Math.min(0, top0);
  const box = Math.max(H, top0 + s0) - from;
  const at = (x: number, s: number) => ({ left: x * width - s / 2, top: H - foot - s, width: s, height: s });
  return (
    <View style={[s.hearth, { height: H }]}>
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
          xml={`<svg viewBox="${60 - 400} ${(-top0 * 120) / s0} 800 ${(H * 120) / s0}" preserveAspectRatio="xMidYMin slice">${sc.land}</svg>`}
          style={StyleSheet.absoluteFill}
          width="100%"
          height={H}
          pointerEvents="none"
        />
      ) : null}

      <View style={[s.at, at(me.x, me.s)]} pointerEvents="none">
        <BigFlame level={level} size={me.s} pulse={pulse} noLand />
      </View>
      <Name x={me.x} width={width} label="You" color={ink.ink} />

      {shown.map((f, i) => (
        <Pressable
          key={f.fid}
          accessibilityRole="button"
          accessibilityLabel={f.name}
          onPress={() => {
            buzz('tap');
            onFriend(f.fid);
          }}
          style={[s.at, at(them[i].x, them[i].s)]}>
          <BigFlame level={f.vals.level || 1} size={them[i].s} noLand />
        </Pressable>
      ))}
      {shown.map((f, i) => (
        <Name key={'n' + f.fid} x={them[i].x} width={width} label={f.name} color={ink.ink} />
      ))}

      {shown.length === 0 ? (
        /* the place beside your fire, waiting: a soft warm glow on the ground and a way to fill it */
        <Pressable accessibilityRole="button" accessibilityLabel="Add a friend" onPress={onAdd} style={[s.place, { left: 0.8 * width - 40, bottom: foot - 6 }]}>
          <View style={[s.glow, { backgroundColor: 'rgba(255,190,90,0.18)' }]} />
          <View style={[s.ring, { borderColor: ink.soft }]}>
            <Icon name="plus" size={22} color={ink.ink} />
          </View>
          <T v="small" style={{ color: ink.ink, marginTop: 6 }}>
            A friend
          </T>
        </Pressable>
      ) : null}

      {more > 0 ? (
        <View style={[s.more, { backgroundColor: ink.glass }]}>
          <T v="small" style={{ color: ink.ink }}>
            +{more}
          </T>
        </View>
      ) : null}
    </View>
  );
}

function Name({ x, width, label, color }: { x: number; width: number; label: string; color: string }) {
  return (
    <View pointerEvents="none" style={[s.name, { left: x * width - 60 }]}>
      <T v="label" numberOfLines={1} style={{ color, textAlign: 'center' }}>
        {label}
      </T>
    </View>
  );
}

/** one friend, read at a glance */
export function FriendReport({
  f,
  tk,
  fresh,
  busy,
  onOpen,
  onWarm,
  preview,
}: {
  f: FriendView;
  tk: DayKey;
  /** encouragement from them not seen yet */
  fresh: boolean;
  busy: boolean;
  onOpen: () => void;
  onWarm: () => void;
  /** your own card, as a friend sees it: nothing to tap */
  preview?: boolean;
}) {
  const c = useTheme();
  const today = friendToday(f.vals, tk);
  const week = (
    [
      ['lessons', f.vals.lessons, f.vals.lessons === 1 ? 'lesson' : 'lessons'],
      ['checkins', f.vals.checkins, f.vals.checkins === 1 ? 'check-in' : 'check-ins'],
      ['days', f.vals.days, f.vals.days === 1 ? 'day in Daybook' : 'days in Daybook'],
      ['rode', f.vals.rode, f.vals.rode === 1 ? 'urge ridden out' : 'urges ridden out'],
    ] as [string, number | undefined, string][]
  )
    /* a count of zero is left out: a quiet week never reads as a failure */
    .filter(([, n]) => (n ?? 0) > 0);
  const sentToday = !!f.sent && Date.now() - f.sent < 20 * 3600_000;
  const got = f.cheer ? FRIEND_CHEERS.find((x) => x.k === f.cheer!.k)?.got : null;
  return (
    <Card style={{ gap: 16 }}>
      <Pressable
        disabled={preview}
        accessibilityRole={preview ? undefined : 'button'}
        accessibilityLabel={'Open ' + f.name}
        onPress={() => {
          buzz('tap');
          onOpen();
        }}
        style={({ pressed }) => [s.head, pressed && { opacity: 0.7 }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="h2">{f.name}</T>
          {f.vals.level ? (
            <T v="small" tone="muted">
              Level {f.vals.level}
              {f.vals.lname ? ' · ' + f.vals.lname : ''}
            </T>
          ) : null}
        </View>
        {preview ? null : <Icon name="next" size={18} color={c.muted} />}
      </Pressable>

      {fresh && got ? (
        <View style={s.line}>
          <Icon name="flame" size={18} color={c.sun2} />
          <T v="label" style={{ flex: 1, color: c.sunText }}>
            {f.name} {got}
          </T>
        </View>
      ) : null}

      {today ? (
        <View style={{ gap: 4 }}>
          <T v="small" tone="muted">
            Today
          </T>
          <T v="label">{today}</T>
        </View>
      ) : null}

      {week.length ? (
        <View style={{ gap: 8 }}>
          <T v="small" tone="muted">
            This week
          </T>
          <View style={s.week}>
            {week.slice(0, 3).map(([k, n, label]) => (
              <View key={k} style={s.stat}>
                <T v="title">{n}</T>
                <T v="small" tone="muted">
                  {label}
                </T>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {preview ? null : sentToday ? (
        <View style={s.line}>
          <Icon name="flame" size={18} color={c.sun2} />
          <T tone="muted" style={{ flex: 1 }}>
            You warmed {f.name}&apos;s flame today
          </T>
        </View>
      ) : (
        <Button label={busy ? 'One moment' : 'Warm ' + f.name + '’s flame'} icon="flame" kind="ghost" disabled={busy} onPress={onWarm} />
      )}
    </Card>
  );
}

/* far hills, back to front, across a 360 by 150 picture */
const HILLS = [
  { d: 'M0 92 C60 74 120 84 180 78 C240 72 300 84 360 76 L360 150 L0 150 Z', fill: '#3B3080' },
  { d: 'M0 112 C70 96 130 108 200 100 C260 94 310 104 360 98 L360 150 L0 150 Z', fill: '#2A2263' },
  { d: 'M0 134 C80 120 150 128 220 122 C280 118 320 126 360 122 L360 150 L0 150 Z', fill: '#1B1645' },
];
/* the far fires: [x share, y share of the height, size, level] */
const FIRES: [number, number, number, number][] = [
  [0.1, 0.46, 26, 3],
  [0.31, 0.43, 22, 5],
  [0.52, 0.47, 24, 2],
  [0.7, 0.42, 22, 7],
  [0.9, 0.47, 26, 4],
  [0.2, 0.64, 36, 6],
  [0.8, 0.63, 36, 9],
];

/** the community that is coming: a night of far fires, and yours in front once you have pre-joined */
export function CommunityScene({ joined, width }: { joined: boolean; width: number }) {
  const H = 190;
  /* each fire lights the ground around it: a warm glow under it, drawn with the hills */
  const glows = FIRES.map(
    ([x, y, size]) => `<ellipse cx="${x * 360}" cy="${y * 150 + size * 0.3}" rx="${size * 1.1}" ry="${size * 0.55}" fill="url(#g)"/>`,
  ).join('');
  const hills = `<svg viewBox="0 0 360 150" preserveAspectRatio="none"><defs><radialGradient id="g"><stop offset="0" stop-color="#FFB347" stop-opacity="0.55"/><stop offset="1" stop-color="#FFB347" stop-opacity="0"/></radialGradient></defs>${HILLS.map((h) => `<path d="${h.d}" fill="${h.fill}"/>`).join('')}${glows}</svg>`;
  return (
    <View style={{ height: H, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={['#0F0C2E', '#251E5E', '#43337F']} style={StyleSheet.absoluteFill} />
      {STARS.map(([x, y, r], i) => (
        <View key={i} style={[s.star, { left: `${x}%`, top: `${y * 0.8}%`, width: r, height: r, borderRadius: r / 2 }]} />
      ))}
      <SvgXml xml={hills} width="100%" height={H} style={StyleSheet.absoluteFill} />
      {FIRES.map(([x, y, size, lvl], i) => (
        <View key={i} style={{ position: 'absolute', left: x * width - size / 2, top: y * H - size * 0.8, opacity: 0.9 }}>
          <BigFlame level={lvl} size={size} noLand />
        </View>
      ))}
      {joined ? (
        <View style={{ position: 'absolute', left: width / 2 - 40, top: H - 88 }}>
          <BigFlame level={4} size={80} noLand />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  hearth: { borderRadius: 20, overflow: 'hidden' },
  star: { position: 'absolute', backgroundColor: '#FFF6D8', opacity: 0.8 },
  at: { position: 'absolute' },
  name: { position: 'absolute', bottom: 6, width: 120, alignItems: 'center' },
  place: { position: 'absolute', width: 80, alignItems: 'center' },
  glow: { position: 'absolute', top: 10, width: 80, height: 34, borderRadius: 40 },
  ring: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  more: { position: 'absolute', right: 12, top: 12, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  week: { flexDirection: 'row', gap: 16 },
  stat: { flex: 1, gap: 0 },
});
