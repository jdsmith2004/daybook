/* An earned moment, full screen (the owner, November 13, 2026: "the level ups and stuff should be inspired by duolingos
   celebrations"; November 12: "constant celebrations"). It takes the place of the old small card. Built from Duolingo's reward
   beats, with the flame as the mascot and something new about every half second, and the button arriving last so nobody taps
   past the moment:

   - A new form of the flame, the biggest moment of all (about 6 seconds): the old form stands big in the night, so the person
     sees what it was; it trembles and gathers its light, with knocks that come faster; a white flash fills the screen; the new
     form lands, huge, with a heavy knock and a burst of confetti and stars; "Your flame grew!" pops; the form's name lands and
     the level number turns over; the form's meaning fades in; the points line fills as gold stars fly into it and turns over
     to the new level, then the form's own line steps on; then the button.
   - A level (about 4 seconds): the flame springs up and blooms, "Level up!" pops with confetti and a buzz, the number turns
     over, the step of the form shows, the points line fills and turns over, the form's line steps on, then the button.
   - A badge (about 4 seconds): rays turn behind an empty spot, "New badge!" pops, the medal drops in from above and bounces
     with a firm knock, the stars twinkle, its name lands, what it was for fades in, then the button.

   Anything else earned at the same time lands under it as small rows, one at a time: never a second moment on top of this one
   (CelebrateHost queues). A tap anywhere brings it all in at once. Reduce Motion: everything there, settled, one buzz.
   Quiet (anything that arrives in the hours after a slip, or the honesty badge): no shout, no confetti, no knocks, no ask; the
   moment is calm, and says what was earned. The tip ask rides only on a new form, never when quiet (core tipMoment). */
import { addDays, gameCompute, nextLine, type CelItem, type Level } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { SHORT } from '@/components/fit';
import { Flame } from '@/components/flame';
import { FutureInvite, useFutureInvite } from '@/components/future-invite';
import { Medal } from '@/components/medal';
import { btnStyle, Burst, GOLD, Meter, meterTime, NIGHT, Shout, Sparkles, type MeterSpec } from '@/components/reward-kit';
import { MomentAsk, useTipMoment } from '@/components/support';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { useFuture } from '@/lib/future';
import { useReducedMotion } from '@/lib/motion';
import { useQuietAsks } from '@/lib/quiet-asks';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, nightInk } from '@/lib/theme';

type Kind = 'form' | 'level' | 'badge' | 'other';
/** when each beat starts, in ms, for each kind of moment */
const BEATS: Record<Kind, { shout: number; title: number; sub: number; lines: number; rows: number }> = {
  form: { shout: 2350, title: 2850, sub: 3500, lines: 4000, rows: 5300 },
  level: { shout: 350, title: 950, sub: 1450, lines: 1900, rows: 3100 },
  badge: { shout: 250, title: 1250, sub: 1700, lines: 2100, rows: 2100 },
  other: { shout: 200, title: 500, sub: 900, lines: 1300, rows: 1300 },
};
/** the form's change: the old form is seen, then gathers, then the flash */
const SEE = 700;
const GATHER = 1100;
const FLASH = 380;
const ROW_GAP = 320;
/** the clear space between the words and the lines under them */
const AIR = 28;
/** how far past full size the level's spring can carry the flame */
const OVER = 1.2;

export function Earned({ group, more, onClose }: { group: CelItem[]; more: boolean; onClose: () => void }) {
  const motionOff = useReducedMotion();
  /* a tap anywhere brings everything in at once: the moment is drawn again, settled */
  const [skip, setSkip] = useState(false);
  const still = motionOff || skip;
  const fade = useSharedValue(motionOff ? 1 : 0);
  useEffect(() => {
    fade.value = withTiming(1, { duration: 260 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const bg = useAnimatedStyle(() => ({ opacity: fade.value }));
  return (
    <Reanimated.View style={[StyleSheet.absoluteFill, { backgroundColor: NIGHT }, bg]} accessibilityViewIsModal>
      <StatusBar style="light" />
      <Moment key={skip ? 'still' : 'live'} group={group} more={more} onClose={onClose} still={still} skipped={skip} onSkip={() => setSkip(true)} />
    </Reanimated.View>
  );
}

function Moment({
  group,
  more,
  onClose,
  still,
  skipped,
  onSkip,
}: {
  group: CelItem[];
  more: boolean;
  onClose: () => void;
  still: boolean;
  skipped: boolean;
  onSkip: () => void;
}) {
  const { snap, tk } = useStore();
  const win = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const quietAsks = useQuietAsks();
  const it = group[0];
  const rest = group.slice(1).filter((x) => x.type !== 'more');
  const extra = group.slice(1).reduce((n, x) => n + (x.type === 'more' ? Number(/\d+/.exec(x.title || '')?.[0] || 0) : 0), 0) + Math.max(0, rest.length - 3);
  const quiet = group.some((x) => !!x.quiet || (x.type === 'badge' && x.b.id === 'honest'));
  const kind: Kind = it.type === 'level' ? (it.evolve ? 'form' : 'level') : it.type === 'badge' ? 'badge' : 'other';
  const B = BEATS[kind];
  const g = snap.settings ? gameCompute(snap.days, snap.settings, snap.reviews, tk) : null;

  /* the flame's size: big, the biggest thing on the screen, and a little less on a short phone so the lines and button fit */
  /* with more earned at the same time, the rows need the room: the picture gives a little, so nothing overlaps */
  const crowd = Math.min(3, rest.length);
  const art0 = Math.min(win.width * (kind === 'form' ? 0.7 : 0.6), win.height * ((SHORT ? 0.26 : 0.32) - crowd * 0.045), 300);

  let shout = '';
  let title = '';
  let sub = '';
  let lines: MeterSpec[] = [];
  let picture: ((z: number) => React.ReactNode) | null = null;
  let turn: { from: number; to: number } | null = null;
  if (it.type === 'level') {
    const L = it.level;
    const from = it.from || Math.max(1, L.n - 1);
    /* a level reached on the day of a slip waits for the next day (core checkNew): it says it was earned then */
    const held =
      !!snap.settings &&
      (snap.days[addDays(tk, -1)]?.events || []).some((e) => e.outcome === 'slipped') &&
      gameCompute(snap.days, snap.settings, snap.reviews, addDays(tk, -1)).level.n >= L.n;
    const was = held ? 'Earned yesterday. Every honest log feeds the flame. ' : '';
    /* the number turns over from the last level seen; from nothing (the preview in Settings), it simply lands */
    turn = { from: it.from > 0 && it.from < L.n ? it.from : L.n, to: L.n };
    if (it.evolve) {
      shout = 'Your flame grew!';
      title = L.name;
      sub = was + L.meaning + ' You built it, one day at a time.';
      picture = (z: number) => <Grow from={from} to={L.n} size={z} still={still} quiet={quiet} />;
      /* the flame growing is the highlight, so it keeps the room (the owner, November 13, 2026: "the highlight was the flame growing and
         it's the smallest part of the screen"): one line, the level turning over, and no number or form step under the name to repeat it */
      lines = levelLines(L, turn.from).slice(0, 1);
    } else {
      shout = 'Level up!';
      title = '';
      sub = was + L.step + ' ' + (L.next == null ? 'This is as bright as it gets. Keep shining.' : nextLine(L));
      picture = (z: number) => <Rise level={L.n} size={z} still={still} quiet={quiet} />;
      lines = levelLines(L, turn.from);
    }
  } else if (it.type === 'badge') {
    shout = it.b.id === 'honest' ? '' : rest.length ? 'New badges!' : 'New badge!';
    title = it.b.name;
    sub = it.b.desc;
    picture = (z: number) => <Drop id={it.b.id} icon={it.b.icon} tone={it.b.tone} size={Math.min(z, 190)} still={still} quiet={quiet} />;
    const n = g ? g.badges.filter((b) => b.done).length : 0;
    const of = g ? g.badges.length : 0;
    /* the badges line, one more filling in, unless the rows of what else was earned already fill the space */
    lines =
      of && rest.length < 2
        ? [{ label: 'Badges', right: n + ' of ' + of, from: Math.max(0, n - 1) / of, to: n / of, stars: 3, a11y: n + ' of ' + of + ' badges earned' }]
        : [];
  } else {
    title = it.type === 'perfect' ? 'All ' + it.n + ' wins today' : it.type === 'more' ? it.title || 'Nice' : '';
    sub = it.type === 'more' ? it.sub || '' : '';
    picture = (z: number) => <Rise level={Math.max(1, g?.level.n ?? 1)} size={z} still={still} quiet />;
  }

  /* the flame takes the room that is left once the shout and the words have theirs, measured on the screen, so the line above the
     lines always has air (the owner, November 13, 2026: "the boxes are too close to the words") */
  const [box, setBox] = useState({ top: 0, shout: 0, words: 0 });
  const room = box.top ? box.top - (inset.top + (SHORT ? 10 : 24)) - box.shout - 10 - box.words - 14 - 12 - AIR - 8 : art0;
  const art = Math.round(Math.max(110, Math.min(art0, room)));

  /* the one warm tip ask rides only on a new flame form (core tipMoment), never when quiet, the day the person came back, or
     the hours after an SOS; Future you can be invited on a new level or form with no ask riding on it */
  const why = !more && !quiet && !quietAsks && group.some((x) => x.type === 'level' && x.from > 0 && x.evolve) ? 'level' : null;
  const ask = useTipMoment(why || 'level', !why);
  const lifted = !more && !quiet && !quietAsks && group.some((x) => x.type === 'level' && x.from > 0);
  const invite = useFutureInvite(!lifted || !!(ask && why));
  const firstNote = useFuture().notes.length === 0;

  /* each line starts as the one before it settles */
  const lineAt = lines.map((_, i) => B.lines + lines.slice(0, i).reduce((s0, l) => s0 + meterTime(l) - 250, 0));
  const rowsAt = Math.max(B.rows, B.lines + lines.reduce((s0, l) => s0 + meterTime(l) - 250, 0));
  const btnAt = rowsAt + Math.min(3, rest.length) * ROW_GAP + 450;
  const [ready, setReady] = useState(still);
  const btn = useSharedValue(still ? 1 : 0);
  const subV = useSharedValue(still ? 1 : 0);
  const [boom, setBoom] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const say = [shout, title, turn ? 'Level ' + turn.to : '', sub, rest.length ? 'And: ' + rest.map(rowName).join(', ') : ''].filter(Boolean).join('. ');
    if (!skipped) AccessibilityInfo.announceForAccessibility(say);
    if (still) {
      if (!skipped && !quiet) buzz('lit');
      return;
    }
    const tm = timers.current;
    const at = (ms: number, f: () => void) => tm.push(setTimeout(f, ms));
    if (shout && !quiet) {
      at(B.shout, () => {
        play('chime');
        setBoom((b) => b + 1);
        buzz('lit');
      });
    }
    at(B.sub, () => (subV.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) })));
    at(btnAt, () => {
      setReady(true);
      btn.value = withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) });
    });
    return () => tm.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const subIn = useAnimatedStyle(() => ({ opacity: subV.value, transform: [{ translateY: 10 * (1 - subV.value) }] }));
  const btnIn = useAnimatedStyle(() => ({ opacity: btn.value, transform: [{ translateY: 18 * (1 - btn.value) }] }));
  const burstY = inset.top + (SHORT ? 60 : 90) + art * 0.55;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} accessible={false} onPress={() => !ready && onSkip()} />
      <View
        style={[s.top, { paddingTop: inset.top + (SHORT ? 10 : 24) }]}
        pointerEvents="box-none"
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setBox((b) => (b.top === h ? b : { ...b, top: h }));
        }}>
        <View
          style={s.shoutBox}
          pointerEvents="none"
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            setBox((b) => (b.shout === h ? b : { ...b, shout: h }));
          }}>
          {shout && !quiet ? <Shout text={shout} at={B.shout} still={still} size={kind === 'form' ? 38 : 40} /> : null}
        </View>
        <View style={{ width: art, height: art }} pointerEvents="none">
          {quiet ? null : <Sparkles size={art} at={kind === 'form' ? B.shout : 300} still={still} />}
          {picture ? picture(art) : null}
        </View>
        <View
          style={s.words}
          pointerEvents="none"
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            setBox((b) => (b.words === h ? b : { ...b, words: h }));
          }}>
          {title ? <Title text={title} at={B.title} still={still} big={kind === 'form'} /> : null}
          {turn && kind !== 'form' ? <Turn from={turn.from} to={turn.to} at={B.title} still={still} quiet={quiet} /> : null}
          {sub ? (
            <Reanimated.View style={subIn}>
              <Text style={s.sub}>{sub}</Text>
            </Reanimated.View>
          ) : null}
        </View>
      </View>

      <View style={[s.dock, { paddingBottom: inset.bottom + (SHORT ? 12 : 20) }]} pointerEvents="box-none">
        {lines.map((l, i) => (
          <Meter key={l.label} m={l} at={lineAt[i]} still={still} quiet={quiet} />
        ))}
        {rest.length ? (
          <View style={s.rows}>
            {rest.slice(0, 3).map((x, i) => (
              <Row key={i} it={x} at={rowsAt + i * ROW_GAP} still={still} quiet={quiet} />
            ))}
            {extra > 0 ? <Text style={s.extra}>{'And ' + extra + ' more in Milestones.'}</Text> : null}
          </View>
        ) : null}
        <Reanimated.View style={[{ gap: 12 }, btnIn]} pointerEvents={ready ? 'auto' : 'none'}>
          {ask && why ? <MomentAsk why={why} onGo={onClose} center /> : invite ? <FutureInvite first={firstNote} onGo={onClose} /> : null}
          <Pressable accessibilityRole="button" onPress={onClose}>
            {({ pressed }) => (
              <View style={[btnStyle.btn, pressed && btnStyle.down]}>
                <Text style={btnStyle.text}>{more ? 'Next' : kind === 'form' ? 'Keep going' : 'Continue'}</Text>
              </View>
            )}
          </Pressable>
        </Reanimated.View>
      </View>
      {!still && !quiet && shout ? <Burst fire={boom} x={win.width / 2} y={burstY} w={win.width} n={kind === 'form' ? 44 : 32} /> : null}
    </View>
  );
}

/** a level's lines: the points line filling up and turning over to the new level, then the form's own line, one step on */
function levelLines(L: Level, from: number): MeterSpec[] {
  const right = L.next == null ? 'As bright as it gets' : L.toNext + ' to the next';
  const points: MeterSpec =
    from < L.n
      ? { label: 'Level ' + from, from: 0.55, to: 1, next: { label: 'Level ' + L.n, right, to: L.frac }, stars: 6, a11y: 'Level ' + L.n + ', ' + right }
      : { label: 'Level ' + L.n, right, from: 0, to: L.frac, stars: 4 };
  const form: MeterSpec = {
    label: L.name,
    right: 'Step ' + (L.tier + 1) + ' of 5',
    from: L.tier / 5,
    to: (L.tier + 1) / 5,
    stars: 2,
    a11y: L.name + ', step ' + (L.tier + 1) + ' of 5',
  };
  return [points, form];
}

const rowName = (it: CelItem) =>
  it.type === 'badge'
    ? it.b.name
    : it.type === 'level'
      ? 'Level ' + it.level.n
      : it.type === 'perfect'
        ? 'All ' + it.n + ' wins today'
        : it.type === 'more'
          ? it.title || ''
          : '';

/** one more thing earned with it: a small row that lands like a tile */
function Row({ it, at, still, quiet }: { it: CelItem; at: number; still: boolean; quiet: boolean }) {
  const v = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    const t = setTimeout(() => {
      if (!quiet) knock(Haptics.ImpactFeedbackStyle.Light);
      v.value = withSpring(1, { damping: 16, stiffness: 320, mass: 0.8 });
    }, at);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ opacity: Math.min(1, v.value * 2), transform: [{ scale: interpolate(v.value, [0, 1], [0.9, 1]) }] }));
  const art =
    it.type === 'badge' ? (
      <Medal id={it.b.id} icon={it.b.icon} tone={it.b.tone} size={40} earned />
    ) : it.type === 'level' ? (
      <Flame level={it.level.n} size={38} />
    ) : (
      <Icon name="star" size={22} color={GOLD} />
    );
  const desc = it.type === 'badge' ? it.b.desc : it.type === 'level' ? it.level.step : '';
  return (
    <Reanimated.View style={[s.row, st]}>
      {art}
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={s.rowT}>{rowName(it)}</Text>
        {desc ? (
          <Text style={s.rowS} numberOfLines={1}>
            {desc}
          </Text>
        ) : null}
      </View>
    </Reanimated.View>
  );
}

/** the name of what was earned, popping in */
function Title({ text, at, still, big }: { text: string; at: number; still: boolean; big: boolean }) {
  const v = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (!still) v.value = withDelay(at, withSpring(1, { damping: 9, stiffness: 200 }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const st = useAnimatedStyle(() => ({ opacity: Math.min(1, v.value * 2), transform: [{ scale: interpolate(v.value, [0, 1], [0.6, 1]) }] }));
  return (
    <Reanimated.View style={st}>
      <Text style={[s.title, big && s.titleBig]} accessibilityRole="header" numberOfLines={2}>
        {text}
      </Text>
    </Reanimated.View>
  );
}

/** "Level 6" turning over to "Level 7": the old number lifts away and the new one drops in, gold, with a knock */
function Turn({ from, to, at, still, quiet }: { from: number; to: number; at: number; still: boolean; quiet: boolean }) {
  const v = useSharedValue(still ? 1 : 0);
  const show = useSharedValue(still ? 1 : 0);
  useEffect(() => {
    if (still) return;
    show.value = withDelay(at - 250, withTiming(1, { duration: 220 }));
    const t = setTimeout(() => {
      if (!quiet) knock(Haptics.ImpactFeedbackStyle.Medium);
      v.value = withSpring(1, { damping: 8, stiffness: 170 });
    }, at + 120);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const boxIn = useAnimatedStyle(() => ({ opacity: show.value }));
  const oldIn = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, v.value * 2), transform: [{ translateY: -34 * Math.min(1, v.value) }] }));
  const newIn = useAnimatedStyle(() => ({
    opacity: Math.min(1, v.value * 1.5),
    transform: [{ translateY: 34 * (1 - v.value) }, { scale: interpolate(v.value, [0, 1], [0.7, 1]) }],
  }));
  return (
    <Reanimated.View style={[s.turn, boxIn]} accessible accessibilityLabel={'Level ' + to}>
      <Text style={s.turnWord}>Level</Text>
      <View style={s.turnNum}>
        {from !== to ? <Reanimated.Text style={[s.turnText, { color: nightInk.muted }, oldIn]}>{from}</Reanimated.Text> : null}
        <Reanimated.Text style={[s.turnText, s.turnNew, newIn]}>{to}</Reanimated.Text>
      </View>
    </Reanimated.View>
  );
}

/** a level: the flame springs up from small, then blooms when the shout lands */
function Rise({ level, size, still, quiet }: { level: number; size: number; still: boolean; quiet: boolean }) {
  const v = useSharedValue(still ? 1 : 0);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (still) return;
    if (!quiet) knock(Haptics.ImpactFeedbackStyle.Heavy);
    v.value = withSpring(1, { damping: 9, stiffness: 150 });
    const t = setTimeout(() => setPulse((p) => p + 1), BEATS.level.shout);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  /* drawn at its biggest (the top of the spring's overshoot) and only ever scaled down: iOS scales the drawn picture, so scaling
     up past 1 made it soft (the owner, November 13, 2026: "super low resolution while it bounces") */
  const D = Math.round(size * OVER);
  const st = useAnimatedStyle(() => ({
    opacity: Math.min(1, v.value * 2),
    transform: [{ scale: Math.min(1, interpolate(v.value, [0, 1], [0.3, 1]) / OVER) }],
  }));
  return (
    <Reanimated.View style={[{ position: 'absolute', width: D, height: D, left: (size - D) / 2, top: (size - D) / 2 }, st]}>
      <BigFlame level={level} size={D} pulse={pulse} noLand />
    </Reanimated.View>
  );
}

/** a badge, Duolingo's reward beat: two layers of rays turn behind an empty spot, the medal drops in from above and lands with a
   squash, a gold ring rolls out from under it and sparks fly up, a light sweeps across its face, and then it floats, slowly
   turning in the rays. Reduce Motion: the medal is simply there, in still rays. */
function Drop({ id, icon, tone, size, still, quiet }: { id: string; icon: string; tone: string; size: number; still: boolean; quiet: boolean }) {
  const fall = useSharedValue(still ? 1 : 0);
  const rays = useSharedValue(still ? 1 : 0);
  const spin = useSharedValue(0);
  const squash = useSharedValue(0);
  const ring = useSharedValue(0);
  const shine = useSharedValue(0);
  const bob = useSharedValue(0);
  const flare = useSharedValue(0);
  const LAND = 500 + 330;
  useEffect(() => {
    if (still) return;
    rays.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
    spin.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1);
    fall.value = withDelay(500, withTiming(1, { duration: 330, easing: Easing.in(Easing.quad) }));
    const tm: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, f: () => void) => tm.push(setTimeout(f, ms));
    at(LAND, () => {
      if (!quiet) {
        knock(Haptics.ImpactFeedbackStyle.Heavy);
        buzz('land');
      }
      /* the landing: a squash, then it springs back to its shape */
      squash.value = withSequence(withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 6, stiffness: 260, mass: 0.7 }));
      ring.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
      flare.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) }));
    });
    at(LAND + 350, () => {
      shine.value = withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) });
    });
    at(LAND + 900, () => {
      bob.value = withRepeat(
        withSequence(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) })),
        -1,
      );
    });
    return () => tm.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const R = size * 1.9;
  const M = size * 0.78;
  const rayIn = useAnimatedStyle(() => ({
    opacity: rays.value * (0.85 + flare.value * 0.15),
    transform: [{ rotate: `${spin.value * 360}deg` }, { scale: interpolate(rays.value, [0, 1], [0.6, 1]) + flare.value * 0.08 }],
  }));
  const rayBack = useAnimatedStyle(() => ({
    opacity: rays.value * 0.55,
    transform: [{ rotate: `${-spin.value * 360 * 0.6 + 15}deg` }, { scale: interpolate(rays.value, [0, 1], [0.5, 1.18]) }],
  }));
  const glow = useAnimatedStyle(() => ({ opacity: flare.value * 0.9, transform: [{ scale: 0.9 + flare.value * 0.5 }] }));
  const dropIn = useAnimatedStyle(() => ({
    opacity: Math.min(1, fall.value * 3),
    transform: [
      { translateY: -size * 2.4 * (1 - fall.value) + bob.value * -6 },
      { rotate: `${(1 - fall.value) * -14 + (bob.value - 0.5) * 4}deg` },
      { scaleX: interpolate(fall.value, [0, 1], [0.8, 1]) + squash.value * 0.16 },
      { scaleY: interpolate(fall.value, [0, 1], [0.8, 1]) - squash.value * 0.2 },
    ],
  }));
  const ringSt = useAnimatedStyle(() => ({
    opacity: ring.value === 0 ? 0 : interpolate(ring.value, [0, 0.15, 1], [0, 0.9, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.5, 2.3]) }],
  }));
  const shineSt = useAnimatedStyle(() => ({
    opacity: shine.value === 0 || shine.value === 1 ? 0 : interpolate(shine.value, [0, 0.3, 0.7, 1], [0, 0.75, 0.75, 0]),
    transform: [{ translateX: interpolate(shine.value, [0, 1], [-M * 0.9, M * 0.9]) }, { rotate: '22deg' }],
  }));
  return (
    <View style={[StyleSheet.absoluteFill, s.center]}>
      <Reanimated.View style={[{ position: 'absolute', width: R, height: R }, rayBack]}>
        <Rays size={R} n={8} soft />
      </Reanimated.View>
      <Reanimated.View style={[{ position: 'absolute', width: R, height: R }, rayIn]}>
        <Rays size={R} n={12} />
      </Reanimated.View>
      <Reanimated.View style={[{ position: 'absolute', width: M * 1.6, height: M * 1.6, borderRadius: M * 0.8, backgroundColor: '#FFE9A8' }, glow]} />
      <Reanimated.View style={[{ position: 'absolute', width: M, height: M, borderRadius: M / 2, borderWidth: 3, borderColor: GOLD }, ringSt]} />
      {!still && !quiet ? <Sparks size={M} at={LAND} /> : null}
      <Reanimated.View style={dropIn}>
        <View style={{ width: M, height: M, alignItems: 'center', justifyContent: 'center' }}>
          <Medal id={id} icon={icon} tone={tone} size={M} earned />
          <View style={{ position: 'absolute', width: M * 0.74, height: M * 0.74, borderRadius: M * 0.37, overflow: 'hidden' }} pointerEvents="none">
            <Reanimated.View
              style={[{ position: 'absolute', left: M * 0.23, top: -M * 0.3, width: M * 0.28, height: M * 1.6, backgroundColor: '#FFFFFF' }, shineSt]}
            />
          </View>
        </View>
      </Reanimated.View>
    </View>
  );
}

/** gold sparks that fly up and out from where the medal landed, and fall */
function Sparks({ size, at }: { size: number; at: number }) {
  const v = useSharedValue(0);
  const [bits] = useState(() =>
    Array.from({ length: 14 }, (_, i) => {
      const a = -Math.PI / 2 + (i / 14 - 0.5) * Math.PI * 1.5 + (Math.random() - 0.5) * 0.3;
      const sp = 0.7 + Math.random() * 0.6;
      return { vx: Math.cos(a) * sp * size * 1.1, vy: Math.sin(a) * sp * size * 1.3, r: 2.5 + Math.random() * 2.5, d: 0.75 + Math.random() * 0.25 };
    }),
  );
  useEffect(() => {
    const t = setTimeout(() => {
      v.value = withTiming(1, { duration: 1100, easing: Easing.linear });
    }, at);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
      {bits.map((b, i) => (
        <Spark key={i} v={v} b={b} />
      ))}
    </View>
  );
}
function Spark({ v, b }: { v: SharedValue<number>; b: { vx: number; vy: number; r: number; d: number } }) {
  const st = useAnimatedStyle(() => {
    const t = Math.min(1, v.value / b.d);
    const e = 1 - Math.pow(1 - t, 2);
    return {
      opacity: v.value === 0 ? 0 : interpolate(t, [0, 0.1, 0.8, 1], [0, 1, 1, 0]),
      transform: [{ translateX: b.vx * e }, { translateY: b.vy * e + t * t * b.r * 60 }, { scale: 1 - t * 0.5 }],
    };
  });
  return <Reanimated.View style={[{ position: 'absolute', width: b.r * 2, height: b.r * 2, borderRadius: b.r, backgroundColor: GOLD }, st]} />;
}

function Rays({ size, n = 12, soft }: { size: number; n?: number; soft?: boolean }) {
  const r = size / 2;
  const d = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const w = Math.PI / n / (soft ? 1.6 : 2.2);
    const p = (ang: number, rr: number) => `${r + Math.cos(ang) * rr} ${r + Math.sin(ang) * rr}`;
    return `M${p(a - w * 0.3, r * 0.25)}L${p(a - w, r)}L${p(a + w, r)}L${p(a + w * 0.3, r * 0.25)}Z`;
  }).join('');
  const gid = soft ? 'rayGs' : 'rayG';
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id={gid} cx={r} cy={r} r={r} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={soft ? '#FFB84D' : '#FFE9A8'} stopOpacity={soft ? '0.35' : '0.6'} />
          <Stop offset="1" stopColor="#FFD25A" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {soft ? null : <Circle cx={r} cy={r} r={r * 0.62} fill={`url(#${gid})`} />}
      <Path d={d} fill={`url(#${gid})`} />
    </Svg>
  );
}

/* a new form: the old form is seen first, alive, so the person knows what it was; it trembles and gathers its light, the
   knocks coming faster; a white light fills the screen from its heart; as it clears, the new form is standing there, bigger
   than it ever was on Today, with a heavy knock, and settles. Under Reduce Motion the new form is there at once. */
function Grow({ from, to, size, still, quiet }: { from: number; to: number; size: number; still: boolean; quiet: boolean }) {
  const win = useWindowDimensions();
  const gather = useSharedValue(0);
  const shake = useSharedValue(0);
  const light = useSharedValue(0);
  const land = useSharedValue(still ? 1 : 0);
  const [turned, setTurned] = useState(still);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (still) return;
    const tm: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, f: () => void) => tm.push(setTimeout(f, ms));
    at(SEE, () => {
      gather.value = withTiming(1, { duration: GATHER, easing: Easing.in(Easing.quad) });
      shake.value = withRepeat(withSequence(withTiming(1, { duration: 70 }), withTiming(-1, { duration: 70 })), Math.round(GATHER / 140), true);
    });
    /* the knocks come faster as it gathers */
    if (!quiet) [0, 0.35, 0.6, 0.78, 0.9].forEach((f, i) => at(SEE + GATHER * f, () => (i < 3 ? buzz('roll') : buzz('tap'))));
    const flashAt = SEE + GATHER - FLASH / 2;
    at(flashAt, () => {
      light.value = withTiming(1, { duration: FLASH, easing: Easing.in(Easing.quad) });
    });
    at(flashAt + FLASH, () => {
      setTurned(true);
      setPulse((p) => p + 1);
      if (!quiet) {
        knock(Haptics.ImpactFeedbackStyle.Heavy);
        buzz('lit');
      }
      gather.value = withTiming(0, { duration: 500 });
      shake.value = 0;
      light.value = withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) });
      land.value = withSpring(1, { damping: 8, stiffness: 120 });
    });
    return () => tm.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const G = size * 1.6;
  const L = Math.max(win.width, win.height) * 1.6;
  /* the old form swells a little as it gathers: drawn at its biggest, scaled down */
  const G0 = Math.round(size * 1.08);
  const oldIn = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.value * 2.5 * gather.value}deg` }, { scale: (1 + 0.08 * gather.value) / 1.08 }] }));
  const glowIn = useAnimatedStyle(() => ({ opacity: gather.value, transform: [{ scale: 0.3 + 0.7 * gather.value }] }));
  const lightIn = useAnimatedStyle(() => ({ opacity: light.value, transform: [{ scale: 0.05 + 0.95 * light.value }] }));
  /* the new form is drawn at the size it lands from and scaled down to rest, never up, so it stays sharp */
  const LAND = 1.35;
  const D = Math.round(size * LAND);
  const newIn = useAnimatedStyle(() => ({ transform: [{ scale: Math.min(1, interpolate(land.value, [0, 1], [LAND, 1]) / LAND) }] }));
  return (
    <View style={[StyleSheet.absoluteFill, s.center]}>
      {still ? null : (
        <Reanimated.View style={[{ position: 'absolute', width: G, height: G }, glowIn]}>
          <Glow size={G} warm />
        </Reanimated.View>
      )}
      {turned ? (
        <Reanimated.View style={[{ position: 'absolute', width: D, height: D, left: (size - D) / 2, top: (size - D) / 2 }, newIn]}>
          <BigFlame level={to} size={D} pulse={pulse} noLand />
        </Reanimated.View>
      ) : (
        <Reanimated.View style={[{ position: 'absolute', width: G0, height: G0, left: (size - G0) / 2, top: (size - G0) / 2 }, oldIn]}>
          <BigFlame level={from} size={G0} noLand />
        </Reanimated.View>
      )}
      {still ? null : (
        <Reanimated.View pointerEvents="none" style={[{ position: 'absolute', width: L, height: L }, lightIn]}>
          <Glow size={L} />
        </Reanimated.View>
      )}
    </View>
  );
}

function Glow({ size, warm }: { size: number; warm?: boolean }) {
  const r = size / 2;
  const id = warm ? 'gW' : 'gL';
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {warm ? (
          <RadialGradient id={id} cx={r} cy={r} r={r} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFD36B" stopOpacity="1" />
            <Stop offset="0.3" stopColor="#FFA24A" stopOpacity="0.75" />
            <Stop offset="0.65" stopColor="#D2557E" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#8A3F9E" stopOpacity="0" />
          </RadialGradient>
        ) : (
          <RadialGradient id={id} cx={r} cy={r} r={r} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="0.45" stopColor="#FFF6D8" stopOpacity="1" />
            <Stop offset="0.8" stopColor="#FFE7A0" stopOpacity="0.7" />
            <Stop offset="1" stopColor="#FFD25A" stopOpacity="0" />
          </RadialGradient>
        )}
      </Defs>
      <Circle cx={r} cy={r} r={r} fill={`url(#${id})`} />
    </Svg>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: AIR, gap: 6 },
  shoutBox: { minHeight: 52, justifyContent: 'flex-end', marginBottom: 10 },
  words: { alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'stretch' },
  title: { fontFamily: font.display, fontSize: 34, lineHeight: 40, color: nightInk.ink, textAlign: 'center' },
  titleBig: { fontSize: 40, lineHeight: 46, color: GOLD },
  sub: { fontFamily: font.body, fontSize: 17, lineHeight: 24, color: nightInk.muted, textAlign: 'center', maxWidth: 340 },
  turn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  turnWord: { fontFamily: font.display, fontSize: 28, color: nightInk.ink },
  turnNum: { minWidth: 56, height: 46, justifyContent: 'center', overflow: 'hidden' },
  turnText: { position: 'absolute', left: 0, fontFamily: font.display, fontSize: 40, lineHeight: 46 },
  turnNew: { color: GOLD },
  dock: { paddingHorizontal: 16, gap: 16 },
  rows: { gap: 10, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  rowT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: nightInk.ink },
  rowS: { fontFamily: font.body, fontSize: 13, lineHeight: 18, color: nightInk.muted },
  extra: { fontFamily: font.body, fontSize: 13, color: nightInk.muted, textAlign: 'center' },
});
