/* Screen Time, its own page (Settings, Screen Time; core pull.ts). The owner, November 15, 2026: "It looks like a settings page right
   now ... I literally said that our app has beautiful visuals and I wanted to match how good it is."

   So the page is the flame's own sky, as on Milestones, with what guards the person standing on the ground under it: one ring for
   adult sites and one for each list, the ring as full as the wait is long (one scale for seconds and minutes, so a longer wait is
   always a fuller ring), the wait written inside, the name under. A ring opens its own page (app/settings/list.tsx). Off, the rings
   are drawn empty, the shape of what will be there, and three short lines say how it goes, over one button.

   Under the sky: tonight, on a night card of its own, the note after long use, and the plain switches. A stricter choice works at
   once; a looser one made outside the morning waits for 6 AM and says so (loosen slowly, tighten at once). Lift every wait and the
   beta switch are always instant. */
import {
  clockOf,
  fmtClock,
  gameCompute,
  habitOf,
  keyOfDate,
  NIGHT_TIMES,
  PULL_LONG,
  PULL_NIGHT_END,
  pullEarly,
  pullEarlier,
  pullInNight,
  pullLater,
  pullListNew,
  pullMorningNow,
  pullNightStart,
  pullQuietUntil,
  pullSettle,
  pullShown,
  pullWaitLabel,
  tonightOf,
} from '@daybook/core';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, SvgXml } from 'react-native-svg';

import { FlameSky } from '@/components/flame-sky';
import { skyInk } from '@/components/hero';
import { Screen } from '@/components/screen';
import { SetGroup, SetRow, SetSwitch, Toggle } from '@/components/settings-ui';
import { Text } from '@/components/text';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { useBackLabel, useHoldsBar, useOverModal } from '@/lib/nav';
import {
  getPullTrouble,
  PULL_DENIED,
  pullAddList,
  pullFix,
  pullLiftAll,
  pullStart,
  pullStop,
  setPullPrefs,
  usePullPicked,
  usePullPrefs,
  usePullTrouble,
} from '@/lib/pull';
import { useStore } from '@/lib/store';
import { font, nightInk, skies, useTheme } from '@/lib/theme';

/* ---------- the ring: how long a wait is, drawn ---------- */

/** how full a wait's ring is: one scale from a few seconds to half an hour, so 10 seconds is a sliver and 30 minutes is whole */
export function waitFill(sec: number): number {
  if (sec <= 0) return 0;
  return Math.max(0.06, Math.min(1, Math.log(sec / 2.5) / Math.log(1800 / 2.5)));
}

/** a wait in two parts, the number and its unit, for inside a ring or on a tile */
export function waitParts(sec: number): [string, string] {
  if (sec <= 0) return ['No', 'wait'];
  if (sec < 60) return [String(sec), 'sec'];
  const m = Math.round(sec / 60);
  return [String(m), 'min'];
}

/** a wait in words, for a screen reader */
export const waitWords = (sec: number) => (sec <= 0 ? 'no wait' : sec < 60 ? sec + ' seconds' : Math.round(sec / 60) + ' minutes');

/** a ring as full as the wait is long, with what is inside it (the wait, or an icon when there is none yet) */
export function WaitRing({
  size,
  stroke,
  fill,
  color,
  track,
  disc,
  children,
}: {
  size: number;
  stroke: number;
  /** 0 to 1 */
  fill: number;
  color: string;
  track: string;
  /** a soft fill inside the ring, so what is written there reads on any sky */
  disc?: string;
  children?: ReactNode;
}) {
  const shown = useEase(fill);
  const r = size / 2 - stroke / 2;
  const cx = size / 2;
  const a = Math.min(shown, 0.9999) * Math.PI * 2;
  const x = cx + r * Math.sin(a);
  const y = cx - r * Math.cos(a);
  const arc = shown <= 0.001 ? '' : `M${cx} ${cx - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {disc ? <Circle cx={cx} cy={cx} r={r - stroke / 2} fill={disc} /> : null}
        <Circle cx={cx} cy={cx} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {shown >= 1 ? (
          <Circle cx={cx} cy={cx} r={r} stroke={color} strokeWidth={stroke} fill="none" />
        ) : arc ? (
          <Path d={arc} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

/** a number that glides to its new value (about a third of a second, slowing into place), or jumps with Reduce Motion */
function useEase(target: number): number {
  const reduce = useReducedMotion();
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduce) {
      from.current = target;
      setV(target);
      return;
    }
    const a = from.current;
    const t0 = Date.now();
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / 360);
      const e = 1 - Math.pow(1 - k, 3);
      const x = a + (target - a) * e;
      from.current = x;
      setV(x);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, reduce]);
  return v;
}

/* ---------- a list's own picture ---------- */

/* two drawings the line set does not have, in its own hand (24 by 24, a 1.8 stroke, round ends) */
const EXTRA: Record<string, string> = {
  bag: '<path d="M5.5 8.5h13l-1 11.5h-11z"/><path d="M9 8.5V7a3 3 0 016 0v1.5"/>',
  news: '<rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="M8 9h8M8 12.5h8M8 16h4.5"/>',
};
const LIST_ICON: Record<string, string> = { Apps: 'phone', Social: 'chat', Games: 'dice', Videos: 'play', Shopping: 'bag', News: 'news' };

/** the picture for a list's name (Games, a die), or the shield for adult sites */
export function ListIcon({ name, size = 20, color }: { name: string; size?: number; color: string }) {
  const k = name === 'adult' ? 'shield' : (LIST_ICON[name] ?? 'phone');
  if (!EXTRA[k]) return <Icon name={k} size={size} color={color} />;
  const xml = `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${EXTRA[k]}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

/* ---------- tiles: a few choices in a row, the chosen one filled ---------- */

export type TileOpt<V> = { v: V; n: string; u?: string; label: string };

/** a row of big choices, like the answers after a wait: a number and its unit, the chosen one filled. `dark` on a night card. */
export function Tiles<V extends string | number | null>({
  opts,
  value,
  onPick,
  dark,
  small,
  label,
}: {
  opts: TileOpt<V>[];
  value: V;
  onPick: (v: V) => void;
  dark?: boolean;
  /** smaller numbers, for clock times */
  small?: boolean;
  label: string;
}) {
  const c = useTheme();
  return (
    <View style={s.tiles} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {opts.map((o) => {
        const on = o.v === value;
        const bg = on ? (dark ? c.sun : c.accent) : dark ? 'rgba(255,255,255,0.12)' : c.surface;
        const ink = on ? (dark ? c.onSun : c.accentInk) : dark ? nightInk.ink : c.ink;
        const soft = on ? (dark ? c.onSun : c.accentInk) : dark ? nightInk.muted : c.muted;
        return (
          <Pressable
            key={String(o.v)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.label}
            onPress={() => {
              if (on) return;
              buzz('tap');
              onPick(o.v);
            }}
            style={({ pressed }) => [s.tile, { backgroundColor: bg, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={[small ? s.tileS : s.tileN, { color: ink }]}>{o.n}</Text>
            {o.u ? <Text style={[s.tileU, { color: soft }]}>{o.u}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- the page ---------- */

export function ScreenTimePage() {
  const { snap, tk, now, say } = useStore();
  const c = useTheme();
  const pull = usePullPrefs();
  const trouble = usePullTrouble();
  const inset = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const over = useOverModal();
  const holdsBar = useHoldsBar();
  const backLabel = useBackLabel('Settings');
  const [past, setPast] = useState(false);
  /* how many each list has picked: read before the page can return early (a hook) */
  const shownLists = pullShown(pull).lists;
  const picked = usePullPicked(shownLists.map((l) => l.id));
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);
  const ink = skyInk(level);
  const porn = habitOf(st) === 'porn';
  const top = Platform.OS === 'ios' && over ? 0 : inset.top;
  /* the ground under the hills holds the rings: room for a ring, its name and one line */
  const FOOT = 150;
  const sky = Math.round(Math.max(400, Math.min(520, height * 0.6)));
  const flame = Math.round(Math.min(width * 0.8, sky - top - FOOT - 56));

  const t = Date.now();
  const p = pullSettle(pull, t);
  const shown = pullShown(p);
  const held = (k: 'adult' | 'lift' | 'lists') => !!p.later && k in p.later.p;
  const morningAt = fmtClock(PULL_NIGHT_END);

  /* the rings on the ground: adult sites first, then each list, then a ring to add one */
  type Gate = { key: string; name: string; sub: string; sec: number; off?: boolean; onPress: () => void; add?: boolean };
  const gates: Gate[] = [];
  if (porn)
    gates.push({
      key: 'adult',
      name: 'Adult sites',
      sub: pull.on && shown.adult ? 'All day' : pull.on ? 'No wait' : 'All day',
      sec: pull.on && shown.adult ? shown.lift * 60 : 0,
      off: !pull.on || !shown.adult,
      onPress: () => router.push({ pathname: '/settings/list', params: { id: 'adult' } }),
    });
  if (pull.on)
    for (const l of shown.lists)
      gates.push({
        key: l.id,
        name: l.name,
        sub: picked[l.id] != null ? picked[l.id] + (picked[l.id] === 1 ? ' app' : ' apps') : ' ',
        sec: l.wait,
        onPress: () => router.push({ pathname: '/settings/list', params: { id: l.id } }),
      });
  else gates.push({ key: 'a', name: 'Apps', sub: 'You pick', sec: 0, off: true, onPress: () => undefined });
  const add = pull.on ? pullListNew(p) : null;
  if (add)
    gates.push({
      key: 'add',
      name: 'Add a list',
      sub: ' ',
      sec: 0,
      add: true,
      onPress: async () => {
        const l = await pullAddList();
        if (l) say(l.name + ' is added. Each app in it waits ' + pullWaitLabel(l.wait) + '.');
      },
    });

  const ringSize = 64;
  const arc = ink.light ? c.sun : '#E08A00';
  const ringTrack = ink.light ? 'rgba(255,255,255,0.2)' : 'rgba(20,17,46,0.14)';
  const disc = ink.light ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)';

  const hero = (
    <FlameSky level={level} height={sky} flame={flame} foot={FOOT - 6}>
      <View style={[s.head, { top: top + 4 }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))}
          style={s.back}>
          <Icon name="back" size={22} color={ink.ink} />
          <T v="label" style={{ color: ink.ink }}>
            {backLabel}
          </T>
        </Pressable>
        <View style={s.titleRow}>
          <T v="title" accessibilityRole="header" style={{ color: ink.ink }}>
            Screen Time
          </T>
          <T v="label" style={{ color: ink.soft }}>
            Beta
          </T>
        </View>
      </View>
      <View style={s.gates} pointerEvents="box-none">
        {gates.map((g) => {
          const [n, u] = waitParts(g.sec);
          return (
            <Pressable
              key={g.key}
              disabled={!pull.on && !g.add}
              accessibilityRole={pull.on ? 'button' : undefined}
              accessibilityLabel={g.add ? 'Add a list' : g.name + ', ' + (g.off ? 'no wait' : waitWords(g.sec)) + '. ' + g.sub}
              onPress={() => {
                buzz('tap');
                g.onPress();
              }}
              style={({ pressed }) => [s.gate, { opacity: pressed ? 0.7 : 1 }]}>
              <WaitRing size={ringSize} stroke={5} fill={g.add || g.off ? 0 : waitFill(g.sec)} color={arc} track={ringTrack} disc={disc}>
                {g.add ? (
                  <Icon name="plus" size={26} color={ink.ink} />
                ) : g.off ? (
                  <ListIcon name={g.key === 'adult' ? 'adult' : g.name} size={24} color={ink.soft} />
                ) : (
                  <>
                    <Text style={[s.ringN, { color: ink.ink }]}>{n}</Text>
                    <Text style={[s.ringU, { color: ink.soft }]}>{u}</Text>
                  </>
                )}
              </WaitRing>
              <Text style={[s.gateName, { color: ink.ink }]} numberOfLines={1}>
                {g.name}
              </Text>
              <Text style={[s.gateSub, { color: ink.soft }]} numberOfLines={1}>
                {g.sub}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FlameSky>
  );

  const bar = holdsBar ? <StatusBar style={past ? (c.scheme === 'dark' ? 'light' : 'dark') : ink.light ? 'light' : 'dark'} /> : null;
  const frame = (body: ReactNode) => (
    <Screen
      title="Screen Time"
      bare
      onScroll={(y) => {
        if (y > sky - 60 !== past) setPast(y > sky - 60);
      }}
      top={hero}>
      {bar}
      {body}
      <View style={{ height: inset.bottom }} />
    </Screen>
  );

  /* off: how it goes, in three lines, over one button */
  if (!pull.on) {
    const start = async () => {
      const r = await pullStart().catch(() => 'closed' as const);
      if (r === 'denied') say(PULL_DENIED);
      else if (r === 'closed') say('Nothing was picked, so nothing changed.');
    };
    return frame(
      <>
        {pull.lost ? (
          <Card tone="note">
            <T>Screen Time access was turned off in the phone’s Settings, so nothing waits now.</T>
          </Card>
        ) : null}
        <View style={s.steps}>
          <Step n="1" head="Pick what pulls you in" line="From Apple’s own list. Daybook never sees which apps." />
          <Step
            n="2"
            head="It waits before it opens"
            line={porn ? 'Seconds for apps. Minutes for adult sites, all day.' : 'A few seconds, as long as you choose.'}
          />
          <Step n="3" head="Then you choose" line="Put it down, or open it for 5, 10 or 30 minutes." />
        </View>
        <View style={{ gap: 8, marginTop: 8 }}>
          <Button label="Turn on Screen Time" kind="warm" onPress={() => void start()} />
          <T v="small" tone="muted" style={{ textAlign: 'center' }}>
            New and in beta. Tell us in Feedback if something does not work.
          </T>
        </View>
      </>,
    );
  }

  const fix = async () => {
    if (!trouble) return;
    const r = await pullFix(trouble.fix).catch(() => 'closed' as const);
    if (r === 'denied') say(PULL_DENIED);
    else if (r === 'ok') say(getPullTrouble() ? 'It is still not working. Restart the phone, then try again.' : 'It is working again.');
  };
  const days = snap.days;
  const from = pullNightStart(days, st, p, t);
  const night = pullInNight(t, from);
  const quiet = (pullQuietUntil(days, st, now) ?? 0) > now;
  /* by day, tonight can start earlier than the morning said (never later: that is the morning's choice) */
  const morning = tonightOf(days, st, keyOfDate(new Date(t))).at;
  const earlier = NIGHT_TIMES.filter((x) => x !== morning && pullEarlier(morning, x) === x).slice(-3);
  const clock = (x: string) => {
    const f = fmtClock(x);
    const i = f.lastIndexOf(' ');
    return i < 0 ? ([f, ''] as const) : ([f.slice(0, i), f.slice(i + 1)] as const);
  };
  const held2 = held('lists') || held('adult') || held('lift');

  return frame(
    <>
      {trouble ? (
        <Card tone="note">
          <T v="h2">Not working</T>
          <T>{trouble.line.replace(/^Screen Time is not working: (.)/, (_m, ch: string) => ch.toUpperCase())}</T>
          <Button
            label={trouble.fix === 'ask' ? 'Give Screen Time your yes' : trouble.fix === 'pick' ? 'Pick the apps again' : 'Try again'}
            onPress={() => void fix()}
          />
        </Card>
      ) : null}
      {held2 ? (
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          A looser change starts at {morningAt}. Until then, the waits hold.
        </T>
      ) : null}

      {/* tonight, on a night card of its own */}
      <View style={s.night}>
        <LinearGradient colors={skies.light.night} style={StyleSheet.absoluteFill} />
        {STARS.map(([x, y, r], i) => (
          <View key={i} pointerEvents="none" style={[s.star, { left: `${x}%`, top: `${y}%`, width: r, height: r, borderRadius: r / 2 }]} />
        ))}
        <View style={s.nightHead}>
          <Icon name="moon" size={20} color={c.sun} />
          <T v="label" style={{ color: nightInk.muted }}>
            {night ? 'Tonight, now' : 'Tonight'}
          </T>
        </View>
        <Text style={s.nightSpan} accessibilityRole="header">
          {fmtClock(from)} to {fmtClock(PULL_NIGHT_END)}
        </Text>
        {!night && earlier.length ? (
          <View style={{ gap: 8 }}>
            <T v="small" style={{ color: nightInk.muted }}>
              Start earlier
            </T>
            <Tiles
              dark
              small
              label="Start tonight at"
              opts={[...earlier, morning].map((x) => {
                const [n, u] = clock(x);
                return { v: x, n, u, label: fmtClock(x) };
              })}
              value={from === morning || earlier.includes(from) ? from : morning}
              onPick={(x) => {
                const e = pullEarly(p, days, st, x, Date.now()).early;
                setPullPrefs({ early: e });
                /* a later start than the one already set for tonight waits for the morning (core pullHoldStart) */
                if (p.armed && pullLater(p.armed.at, e?.at ?? morning) && !pullMorningNow(Date.now()))
                  say('Looser settings start in the morning. Tonight still starts at ' + fmtClock(p.armed.at) + '.');
              }}
            />
          </View>
        ) : null}
        <View style={s.nightRow}>
          <T style={{ color: nightInk.ink, flex: 1 }}>Notes at 10 and 20 minutes</T>
          <Toggle on={p.hard} label="Notes at 10 and 20 minutes" onChange={(on) => setPullPrefs({ hard: on })} />
        </View>
      </View>

      {/* a note after long use */}
      <View style={{ gap: 12, marginTop: 8 }}>
        <View style={s.secHead}>
          <Icon name="timer" size={22} color={c.accentText} />
          <T v="h2">A note after long use</T>
        </View>
        <Tiles
          label="A note after long use"
          opts={PULL_LONG.map((n) => ({
            v: n,
            n: n === 0 ? 'Off' : String(n),
            u: n === 0 ? undefined : n === 1 ? 'hour' : 'hours',
            label: n === 0 ? 'Off' : n + ' hours',
          }))}
          value={p.long}
          onPick={(n) => setPullPrefs({ long: n })}
        />
        <T v="small" tone="muted">
          One note a day. When today’s lesson is not done, a tap takes you to it.
        </T>
      </View>

      <View style={{ marginTop: 16 }}>
        <SetGroup
          foot={
            (night && !quiet ? 'Tonight, lifting every wait or turning this off counts as a night you went through. ' : '') +
            'Screen Time is new. Tell us in Feedback if something does not work. You can also turn it off in the phone’s Settings.'
          }>
          <SetRow
            label="Lift every wait now"
            act="accent"
            onPress={async () => {
              const until = await pullLiftAll(days, st, !quiet);
              say('Every wait is lifted until ' + fmtClock(clockOf(until)) + '.');
            }}
          />
          {/* the beta switch (the owner, November 15, 2026: "just add them as like a beta toggle in settings"): off is instant, and
              tonight it counts as a night gone through */}
          <SetSwitch label="Screen Time (beta)" on onChange={(on) => (on ? undefined : void pullStop(night && !quiet))} />
        </SetGroup>
      </View>
    </>,
  );
}

function Step({ n, head, line }: { n: string; head: string; line: string }) {
  const c = useTheme();
  return (
    <View style={s.step}>
      <Text style={[s.stepN, { color: c.sun2 }]}>{n}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{head}</T>
        <T v="small" tone="muted">
          {line}
        </T>
      </View>
    </View>
  );
}

/* a few stars on the night card, placed by hand: [left %, top %, size] */
const STARS: [number, number, number][] = [
  [72, 14, 2],
  [84, 30, 3],
  [93, 12, 2],
  [62, 8, 2],
  [88, 52, 2],
  [78, 44, 2],
];

const s = StyleSheet.create({
  head: { position: 'absolute', left: 16, right: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', minHeight: 44, minWidth: 44, marginLeft: -4 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  gates: { position: 'absolute', left: 8, right: 8, bottom: 14, flexDirection: 'row', justifyContent: 'center' },
  gate: { flex: 1, maxWidth: 110, alignItems: 'center', gap: 2, paddingTop: 4 },
  ringN: { fontFamily: font.displayBold, fontSize: 20, lineHeight: 22, fontVariant: ['tabular-nums'] },
  ringU: { fontFamily: font.bodySemi, fontSize: 11, lineHeight: 13 },
  gateName: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, marginTop: 6 },
  gateSub: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  steps: { gap: 20, marginTop: 8 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  stepN: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 30, width: 22, textAlign: 'center' },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16, minHeight: 64, paddingVertical: 8 },
  tileN: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 32, fontVariant: ['tabular-nums'] },
  tileS: { fontFamily: font.displayBold, fontSize: 20, lineHeight: 24, fontVariant: ['tabular-nums'] },
  tileU: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  night: { borderRadius: 20, overflow: 'hidden', padding: 16, gap: 12, marginTop: 8 },
  star: { position: 'absolute', backgroundColor: '#FFF6D8', opacity: 0.8 },
  nightHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nightSpan: { fontFamily: font.display, fontSize: 28, lineHeight: 34, color: nightInk.ink },
  nightRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
