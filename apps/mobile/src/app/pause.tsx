/* The wait (Screen Time, core pull.ts; the owner, November 9 and 11, 2026). Apple's shield is a still picture and cannot count down,
   so its button and the night's notes bring the person here. Three waits, one screen:

   - By day, the short wait before a picked app (10, 30 or 60 seconds): the flame big in the ring, Put it down, and once the wait
     is over a quiet link opens the app for a few minutes. Nothing dims: opening a feed at noon is not the fight.
   - In the night, the same short wait, but it shows the morning (docs/plan.md, "The morning, not the moment", step 2): "You set
     this up this morning.", the person's reason quoted with when they chose it, their future-you note if they made one, and Put
     it down and go to bed. The flame burns low here, as before: it is seen burning fully, then goes down with its smoke, and Put
     it down lights it again in front of them.
   - `?w=long`, the long wait before adult sites (5, 15 or 30 minutes, from More in the night). It keeps counting if the person
     leaves, and the stake is said before the choice, never after: "Open it, and tonight goes in the week as a night you went
     through." Once over, Open them for 10 minutes; then Apple's filter is back.

   No argument and no lecture: the research says the message does little; the wait and the way out do the work. In the hours after
   a slip there are no stakes and nothing dims; the wait is the same. */
import {
  addEvent,
  gameCompute,
  PULL_WEB_OPEN,
  pullDownEvent,
  pullInNight,
  pullNightOf,
  pullNightStart,
  pullPauseWords,
  pullPlanLine,
  pullQuietUntil,
  pullSettle,
  tonightOf,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Link } from '@/components/choices';
import { BigFlame, DOUSE_MS, DOUSE_WAIT, RELIGHT_CATCH, RELIGHT_MS } from '@/components/big-flame';
import { FutureNoteCard, useHasFutureNote } from '@/components/future-note';
import { Bubble } from '@/components/lesson-flame';
import { Dock, Middle, SceneFrame } from '@/components/scene';
import { useClock, WavyRing } from '@/components/shapes';
import { Button, T } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { close } from '@/lib/nav';
import { Pull, pullCountDown, pullLongEnd, pullLongStart, usePullPrefs } from '@/lib/pull';
import { useStore } from '@/lib/store';
import { font, nightInk, useTheme } from '@/lib/theme';
import { useReducedMotion } from '@/lib/motion';

/** how low the fire burns on the night's wait: between Today's first two steps, smoke clearly rising */
const PAUSE_LOW = 0.6;

/** "14:05" for the long wait, "7" for the short one */
const leftLabel = (s: number, long: boolean) => (long ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : String(s));

export default function PullPause() {
  const { w: which } = useLocalSearchParams<{ w?: string }>();
  const { snap, tk, now, say, update } = useStore();
  const c = useTheme();
  const saved = usePullPrefs();
  const prefs = pullSettle(saved, Date.now());
  const reduce = useReducedMotion();
  const note = useHasFutureNote();
  const { height } = useWindowDimensions();
  const st = snap.settings;
  /* the mode is fixed when the screen opens, so a wait running across the night's start does not change under the person */
  const [mode] = useState<'day' | 'night' | 'long'>(() =>
    which === 'long' ? 'long' : st && pullInNight(Date.now(), pullNightStart(snap.days, st, saved, Date.now())) ? 'night' : 'day',
  );
  const dark = mode !== 'day';
  const long = mode === 'long';
  /* small enough that the reason, a future-you note and Open it all fit under the flame on a small phone */
  const ring = Math.min(280, Math.round(height * (dark && note ? 0.2 : 0.26)));
  const level = st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1;
  const quiet = !!st && (pullQuietUntil(snap.days, st, now) ?? 0) > now;
  const plan = st ? pullPlanLine(st) : null;
  const t = st ? tonightOf(snap.days, st, pullNightOf(Date.now())) : null;
  const tonight = t ? { r: t.r, rAt: t.rAt, today: t.today } : null;
  const w = pullPauseWords({ mode, quiet, open: prefs.open, plan, tonight });
  /* the count after this put-down, for the thanks */
  const downs = useRef(0);
  /* the short wait runs from the moment this opens; the long one from when it first started, so leaving does not start it again */
  const [from] = useState(() => (long ? pullLongStart() : Date.now()));
  useClock(true);
  const total = long ? prefs.lift * 60 : prefs.wait;
  const gone = (Date.now() - from) / 1000;
  const p = Math.min(1, gone / total);
  const over = p >= 1;
  const left = Math.max(0, Math.ceil(total - gone));
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (over) {
      buzz('land');
      setPulse((x) => x + 1);
    }
  }, [over]);
  /* how low it burns here: down once the night's screen opens, and lit again by Put it down; never by day or after a slip */
  const dims = dark && !quiet;
  const [low, setLow] = useState(dims ? PAUSE_LOW : 0);
  const leaving = useRef(false);
  useEffect(() => {
    if (!dims || reduce) return;
    /* the water going on: a few ticks that fade as it goes down (hero.tsx) */
    const ts = [0, 260, 600, 1100, DOUSE_MS - 200].map((ms, i) =>
      setTimeout(() => (i < 4 ? buzz('tick') : knock(Haptics.ImpactFeedbackStyle.Soft)), DOUSE_WAIT + ms),
    );
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const home = () => {
    say(pullPauseWords({ mode, quiet, open: prefs.open, plan, tonight, downs: downs.current }).thanks);
    router.replace('/');
  };
  const down = () => {
    if (leaving.current) return;
    leaving.current = true;
    if (long) pullLongEnd();
    /* one more time they put it down: the count the shield and the notes say, kept on this phone */
    downs.current = pullCountDown();
    /* in the night, putting it down is evidence: an urge ridden out in the log (core pullDownEvent), so it earns its points and
       feeds the flame. By day it is counted, not logged: closing a feed at noon is not an urge ridden out. No count or event is
       sent for it: it starts from Screen Time, whose data never leaves the phone. */
    if (dark)
      update((s) => {
        const e = s.settings && pullDownEvent(s.days, s.settings, Date.now());
        return e ? { ...s, days: addEvent(s.days, e.key, 'rode', e.time, e.fields).days } : s;
      });
    if (!dims || reduce || low === 0) {
      buzz('lit');
      if (low) setLow(0);
      return home();
    }
    /* lit again in front of them: the heart catches, the fire climbs back and leaps, then home */
    setLow(0);
    knock(Haptics.ImpactFeedbackStyle.Soft);
    setTimeout(() => knock(Haptics.ImpactFeedbackStyle.Light), RELIGHT_CATCH);
    setTimeout(
      () => {
        knock(Haptics.ImpactFeedbackStyle.Medium);
        setPulse((x) => x + 1);
      },
      RELIGHT_CATCH + RELIGHT_MS * 0.45,
    );
    setTimeout(
      () => {
        buzz('lit');
        home();
      },
      RELIGHT_CATCH + RELIGHT_MS + 500,
    );
  };
  const open = async () => {
    if (long) {
      pullLongEnd();
      await Pull?.openWeb(PULL_WEB_OPEN);
    } else await Pull?.openFor(prefs.open);
    close();
  };
  const ink = dark ? nightInk.ink : c.ink;
  const soft = dark ? nightInk.muted : c.muted;
  /* the reason is the person's own words: when it is there, the flame does not talk over it */
  const bubble = !(dark && (tonight?.r || note));
  return (
    <SceneFrame title="" sky={dark ? 'night' : 'sky'} onClose={() => close()}>
      <T v="title" style={{ color: ink }} accessibilityRole="header">
        {w.title}
      </T>
      <T style={{ color: soft, marginTop: 8 }}>{w.line}</T>
      <Middle>
        {bubble ? <Bubble text={w.say} style={{ marginBottom: 12, alignSelf: 'center', maxWidth: 300 }} /> : null}
        <View
          style={s.c}
          accessible
          accessibilityRole="timer"
          accessibilityLabel={over ? 'The wait is over' : long ? Math.ceil(left / 60) + ' minutes' : left + ' seconds'}>
          <WavyRing size={ring} p={p} color={c.sun} track={dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'} speed={reduce ? 0 : undefined}>
            <BigFlame level={level} size={ring * 0.86} pulse={pulse} noLand low={low} douse={dims} smoke="#6B6577" label={w.title} />
          </WavyRing>
          <Text style={[s.left, { color: over ? soft : dark ? c.sun : c.ink }]}>{over ? ' ' : leftLabel(left, long)}</Text>
          <T v="small" style={{ color: soft }}>
            {over ? ' ' : w.hold}
          </T>
        </View>
        {dark ? (
          <View style={s.note}>
            <FutureNoteCard on size={72} />
          </View>
        ) : null}
      </Middle>
      <Dock>
        {w.stake ? <T style={[s.stake, { color: soft }]}>{w.stake}</T> : null}
        <Button label={w.down} onPress={down} kind="warm" />
        <View style={s.c}>
          <Link label={w.open} onPress={open} hidden={!over} color={ink} />
        </View>
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { alignItems: 'center', gap: 8 },
  note: { marginTop: 16, alignSelf: 'stretch', alignItems: 'center' },
  stake: { textAlign: 'center', marginBottom: 4 },
  left: { fontFamily: font.display, fontSize: 38, lineHeight: 44, marginTop: 8, fontVariant: ['tabular-nums'] },
});
