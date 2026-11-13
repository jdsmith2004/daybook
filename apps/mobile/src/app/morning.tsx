/* The morning set (core morning-set.ts; docs/plan.md, "The morning, not the moment"; the owner, November 11, 2026). The self who
   wants to quit is up in the morning, so Daybook gives that self one minute to set up the night, before today's lesson:

   1. "How was last night?" Free of it, or It happened: the honest log, at the one time of day it is easy to give. Once a night
      is picked, one optional row: "And this morning?" Low, Okay, Good. Nothing is said about either.
   2. "Who are you doing tonight for?" One of the person's own reasons, one tap, and the time tonight starts (yesterday's unless
      they change it: the row opens a third, night-sky page with a slider). After It happened the eyebrow says "Logged. Today is
      open." and nothing else: no ceremony, no stakes, no points.
   Set tonight, and today's lesson opens (or Today, when today's lesson is done or waits behind an account).

   The dawn sky runs from the night's violet at the top to the morning's warmth at the bottom; the person's own flame is big in the
   middle, in its round sky. The answers and the main button sit low, by the thumb. The X skips it for today, which costs nothing. */
import {
  answerNight,
  gameCompute,
  habitOf,
  heroNumber,
  futureAsk,
  lastNightSlip,
  rkOpenFor,
  lastNightStart,
  lessonDue,
  MORNING_FEEL,
  MORNING_WORDS as W,
  morningHello,
  morningOf,
  morningReasons,
  NIGHT_TIMES,
  nightAtStart,
  setMorningFeel,
  setTonight,
  skipMorning,
  tonightLine,
  fmtClock,
  type Clock,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Appear } from '@/components/appear';
import { Link } from '@/components/choices';
import { FlameMedallion } from '@/components/flame-medallion';
import { Dock, Middle, SceneFrame, Stage } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { nightWaitsOn } from '@/lib/morning';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { askedFuture, useFuture } from '@/lib/future';
import { useAccount } from '@/lib/sync';
import { font, nightInk, useTheme } from '@/lib/theme';

/* the dawn: night violet at the top, where the words are light, to the morning's warmth by the thumb */
const DAWN = {
  light: ['#33276F', '#6E4597', '#C9808C', '#FFCB94'] as const,
  dark: ['#1E1752', '#47306F', '#8A5068', '#B2715A'] as const,
};
const AT = [0, 0.38, 0.72, 1] as const;
/* the answers' own colors: they sit on the warm part of the sky in either theme */
const INK = '#2B1F57';
const OFF = 'rgba(255,255,255,0.46)';
const ON = '#FFFFFF';

type Step = 'night' | 'why' | 'when';

export default function Morning() {
  const { then } = useLocalSearchParams<{ then?: string }>();
  const { snap, tk, update, say, now } = useStore();
  const account = useAccount();
  const future = useFuture();
  const c = useTheme();
  const win = useWindowDimensions();
  const st = snap.settings;
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [snap, st, tk]);
  /* what the pages start on is fixed when they open */
  const [start] = useState(() => {
    const ms = morningOf(snap.days[tk]);
    return {
      n: st ? lastNightStart(snap.days, st, tk) : null,
      f: ms?.f ?? null,
      reasons: st ? morningReasons(snap.days, st, tk) : [],
      nt: st ? nightAtStart(st) : '22:30',
    };
  });
  const [step, setStep] = useState<Step>('night');
  const [dir, setDir] = useState<-1 | 0 | 1>(0);
  const [n, setN] = useState<'free' | 'slip' | null>(start.n);
  const [f, setF] = useState<1 | 2 | 3 | null>(start.f);
  const [r, setR] = useState<string>(start.reasons[0] || '');
  const [nt, setNt] = useState<Clock>(start.nt);
  const [said, setSaid] = useState<'free' | 'slip' | null>(null);
  const leaving = useRef(false);

  const go = (s: Step, d: -1 | 1) => {
    setDir(d);
    setStep(s);
  };
  const skip = () => {
    if (leaving.current) return;
    leaving.current = true;
    update((s0) => ({ ...s0, days: skipMorning(s0.days, tk, Date.now()) }));
    /* opened in front of a lesson: the X goes on to it */
    if (then) router.replace({ pathname: '/lesson/[id]', params: { id: then, at: 'morning' } });
    else close();
  };
  const next = () => {
    if (!n || !st) return;
    /* the count as it stood before the night is told, so the lighting can turn it over */
    const before = heroNumber(snap.days, st, tk, now)?.n;
    /* earned as usual, but nothing is said about points here: no ceremony after It happened (noWin) */
    const t = Date.now();
    update(
      (s0) => {
        if (!s0.settings) return s0;
        let days = answerNight(s0.days, s0.settings, tk, n, t);
        days = setMorningFeel(days, tk, f, t);
        return { ...s0, days };
      },
      { noWin: true },
    );
    setSaid(n);
    buzz('save');
    go('why', 1);
    /* a free night: the person lights their own flame over the morning (app/ignite.tsx), and its button comes back here */
    if (n === 'free' && said !== 'free') router.push({ pathname: '/ignite', params: before ? { from: before } : {} });
  };
  const set = () => {
    if (!st || leaving.current) return;
    leaving.current = true;
    const t = Date.now();
    update(
      (s0) => {
        if (!s0.settings) return s0;
        const out = setTonight(s0.days, s0.settings, tk, { r, nt }, t);
        return { ...s0, days: out.days, settings: out.st };
      },
      { noWin: true },
    );
    buzz('lit');
    say(W.done);
    /* then the lesson: the one this was opened in front of, or today's next one when it is open */
    const lid = then || lessonDue(snap.days, st, tk, account);
    if (lid) router.replace({ pathname: '/lesson/[id]', params: { id: lid, at: 'morning' } });
    else close();
    /* a note from this morning's self to tonight's (Future you, app/future.tsx), offered when it is due and only after a free
       night (never on the morning after It happened): it opens over the lesson, and its Done or X goes back to it */
    if (n === 'free' && futureAsk(snap.days, st, future, t)) {
      askedFuture();
      setTimeout(() => router.push('/future'), 350);
    }
  };
  /* after It happened: Rekindle, one quiet tap away and never pushed (the log page of last night's slip) */
  const last = said === 'slip' ? lastNightSlip(snap.days, tk) : null;
  const rk = last && rkOpenFor(snap.days, last.k, last.id) ? last : null;

  if (!st) return null;

  const big = Math.min(win.width - 120, win.height * (step === 'night' ? 0.32 : 0.27), 280);
  const dawn = <LinearGradient colors={c.scheme === 'dark' ? DAWN.dark : DAWN.light} locations={AT} style={StyleSheet.absoluteFill} pointerEvents="none" />;

  if (step === 'when') {
    const i = Math.max(0, NIGHT_TIMES.indexOf(nt));
    return (
      <SceneFrame title={W.setup} sky="night" onBack={() => go('why', -1)} onClose={skip}>
        <Stage key="when" dir={dir}>
          <T v="title" style={s.h} accessibilityRole="header">
            {W.when}
          </T>
          <Middle>
            <SliderValue big value={i} show={(v) => fmtClock(NIGHT_TIMES[v]).replace(/ [AP]M$/, '')} caption={fmtClock(nt).slice(-2)} hint="" />
          </Middle>
          <Dock>
            <Slider
              label={W.when}
              value={i}
              min={0}
              max={NIGHT_TIMES.length - 1}
              show={(v) => fmtClock(NIGHT_TIMES[v])}
              readout={false}
              onChange={(v) => setNt(NIGHT_TIMES[v])}
            />
            <Button label={W.whenDone} kind="warm" onPress={() => go('why', -1)} />
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  if (step === 'why') {
    return (
      <SceneFrame title={said === 'slip' ? W.logged : W.setup} sky="night" backdrop={dawn} onBack={() => go('night', -1)} onClose={skip}>
        <Stage key="why" dir={dir}>
          <T v="title" style={s.h} accessibilityRole="header">
            {W.why}
          </T>
          <Middle>
            <FlameMedallion level={level} size={big} />
          </Middle>
          <Dock>
            <View style={s.list} accessibilityRole="radiogroup" accessibilityLabel={W.why}>
              {start.reasons.map((t) => (
                <Choice key={t} label={t} on={r === t} onPress={() => setR(t)} />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={tonightLine({ waits: nightWaitsOn(), habit: habitOf(st) }) + ' ' + fmtClock(nt) + '. Change'}
              onPress={() => {
                buzz('tap');
                go('when', 1);
              }}
              style={({ pressed }) => [s.time, pressed && { opacity: 0.8 }]}>
              <Text style={s.timeL}>{tonightLine({ waits: nightWaitsOn(), habit: habitOf(st) })}</Text>
              <Text style={[s.timeR, { color: c.sun }]}>{fmtClock(nt)}</Text>
              <Icon name="next" size={14} color={c.sun} />
            </Pressable>
            <Button label={W.set} kind="warm" onPress={set} disabled={!r} />
            {rk ? (
              <View style={s.c}>
                <Link
                  label={W.look}
                  color={INK}
                  onPress={() => router.push({ pathname: '/log', params: { date: rk.k, evId: rk.id, outcome: 'slipped', from: 'entry' } })}
                />
              </View>
            ) : null}
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame title={morningHello(now)} sky="night" backdrop={dawn} onClose={skip}>
      <Stage key="night" dir={dir}>
        <T v="title" style={s.h} accessibilityRole="header">
          {W.night}
        </T>
        <Middle>
          <FlameMedallion level={level} size={big} />
        </Middle>
        <Dock>
          <View style={s.list} accessibilityRole="radiogroup" accessibilityLabel={W.night}>
            <Choice label={W.free} on={n === 'free'} onPress={() => setN('free')} />
            <Choice label={W.slip} on={n === 'slip'} onPress={() => setN('slip')} />
          </View>
          {n ? (
            <Appear by={8} duration={240}>
              <View style={s.feel} accessibilityRole="radiogroup" accessibilityLabel={W.feel}>
                <Text style={s.feelL} numberOfLines={1} adjustsFontSizeToFit>
                  {W.feel}
                </Text>
                {MORNING_FEEL.map((o) => (
                  <Pill key={o.n} label={o.w} on={f === o.n} onPress={() => setF(f === o.n ? null : o.n)} />
                ))}
              </View>
            </Appear>
          ) : (
            <View style={s.feelSpace} />
          )}
          <Button label={W.next} kind="warm" onPress={next} disabled={!n} />
        </Dock>
      </Stage>
    </SceneFrame>
  );
}

/** one answer: a wide row, white when picked, with a check */
function Choice({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.choice, { backgroundColor: on ? ON : OFF, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <Text style={[s.choiceT, on && s.choiceOn]} numberOfLines={2}>
        {label}
      </Text>
      {on ? <Icon name="check" size={18} color={INK} /> : null}
    </Pressable>
  );
}

/** a small answer in the optional row */
function Pill({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.pill, { backgroundColor: on ? ON : OFF, opacity: pressed ? 0.85 : 1 }]}>
      <Text style={[s.pillT, on && s.choiceOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  h: { color: nightInk.ink, alignSelf: 'stretch', textAlign: 'left' },
  c: { alignItems: 'center' },
  list: { gap: 10 },
  choice: { minHeight: 58, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  choiceT: { flex: 1, fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22, color: INK, opacity: 0.78 },
  choiceOn: { opacity: 1 },
  feel: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  feelL: { flex: 1, fontFamily: font.bodySemi, fontSize: 15, color: INK },
  feelSpace: { height: 44 },
  pill: { minHeight: 40, minWidth: 56, borderRadius: 20, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  pillT: { fontFamily: font.bodySemi, fontSize: 15, color: INK, opacity: 0.78 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, borderRadius: 16, paddingHorizontal: 18, backgroundColor: 'rgba(43,31,87,0.62)' },
  timeL: { flex: 1, fontFamily: font.bodySemi, fontSize: 15, color: nightInk.ink },
  timeR: { fontFamily: font.bodyBold, fontSize: 15 },
});
