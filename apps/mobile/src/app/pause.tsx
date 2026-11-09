/* The wait before an app that is resting in the hard hours (Screen Time, core pull.ts; the owner, November 9, 2026). Apple's
   shield is a still picture and cannot count down, so its button and the hard-hours notes bring the person here: the night sky,
   the flame big in the middle with the squiggle filling around it for the wait (10, 30 or 60 seconds, set in More), and the
   words plain. Put it down is the main button. Only once the wait is over does a quiet link open the apps for a few minutes;
   then the pause comes back, with the wait again. In the hours after a slip the words carry no stakes, and the wait is the same.

   The flame burns low here (the owner, November 9, 2026: "it should show it dimming in the screen time animation as well"):
   reaching this screen means the notes were ignored, so it is seen burning fully, then goes down to PAUSE_LOW with its smoke, as on
   Today (big-flame.tsx, core flame-low.ts). Put it down lights it again in front of the person, with the same knocks as Today,
   before going home; opening the apps leaves it low. In the hours after a slip it never dims: the job then is to bring them back. */
import { gameCompute, pullPauseWords, pullPlanLine, pullQuietUntil } from '@daybook/core';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Link } from '@/components/choices';
import { BigFlame, DOUSE_MS, DOUSE_WAIT, RELIGHT_CATCH, RELIGHT_MS } from '@/components/big-flame';
import { Bubble } from '@/components/lesson-flame';
import { Dock, Middle, SceneFrame } from '@/components/scene';
import { useClock, WavyRing } from '@/components/shapes';
import { Button, T } from '@/components/ui';
import { buzz, knock } from '@/lib/feel';
import { close } from '@/lib/nav';
import { Pull, usePullPrefs } from '@/lib/pull';
import { useStore } from '@/lib/store';
import { font, nightInk, useTheme } from '@/lib/theme';
import { useReducedMotion } from '@/lib/motion';

/** how low the fire burns on the wait: between Today's first two steps, smoke clearly rising */
const PAUSE_LOW = 0.6;

export default function PullPause() {
  const { snap, tk, now, say } = useStore();
  const c = useTheme();
  const prefs = usePullPrefs();
  const reduce = useReducedMotion();
  const { height } = useWindowDimensions();
  /* small enough that Open it for a few minutes still fits under Put it down, with the person's own plan in the bubble */
  const ring = Math.min(280, Math.round(height * 0.26));
  const st = snap.settings;
  const level = st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1;
  const quiet = !!st && (pullQuietUntil(snap.days, st, now) ?? 0) > now;
  const w = pullPauseWords({ quiet, open: prefs.open, plan: st ? pullPlanLine(st) : null });
  /* the wait runs from the moment this opens, on the smooth clock (the motion never ticks; the number may) */
  const t = useClock(true);
  const p = Math.min(1, t / prefs.wait);
  const over = p >= 1;
  const left = Math.max(0, Math.ceil(prefs.wait - t));
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (over) {
      buzz('land');
      setPulse((x) => x + 1);
    }
  }, [over]);
  /* how low it burns here: down once the screen opens, and lit again by Put it down */
  const [low, setLow] = useState(quiet ? 0 : PAUSE_LOW);
  const leaving = useRef(false);
  useEffect(() => {
    if (quiet || reduce) return;
    /* the water going on: a few ticks that fade as it goes down (hero.tsx) */
    const ts = [0, 260, 600, 1100, DOUSE_MS - 200].map((ms, i) =>
      setTimeout(() => (i < 4 ? buzz('tick') : knock(Haptics.ImpactFeedbackStyle.Soft)), DOUSE_WAIT + ms),
    );
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const home = () => {
    say(w.thanks);
    router.replace('/');
  };
  const down = () => {
    if (leaving.current) return;
    leaving.current = true;
    if (quiet || reduce || low === 0) {
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
    await Pull?.openFor(prefs.open);
    close();
  };
  return (
    <SceneFrame title="" sky="night" onClose={() => close()}>
      <T v="title" style={{ color: nightInk.ink }} accessibilityRole="header">
        {w.title}
      </T>
      <T style={{ color: nightInk.muted, marginTop: 8 }}>{w.line}</T>
      <Middle>
        <Bubble text={w.say} style={{ marginBottom: 12, alignSelf: 'center', maxWidth: 300 }} />
        <View style={s.c} accessible accessibilityRole="timer" accessibilityLabel={over ? 'The wait is over' : left + ' seconds'}>
          <WavyRing size={ring} p={p} color={c.sun} track="rgba(255,255,255,0.14)" speed={reduce ? 0 : undefined}>
            <BigFlame level={level} size={ring * 0.7} pulse={pulse} noLand low={low} douse={!quiet} smoke="#6B6577" label={w.title} />
          </WavyRing>
          <Text style={[s.left, { color: over ? nightInk.muted : c.sun }]}>{over ? ' ' : String(left)}</Text>
          <T v="small" style={{ color: nightInk.muted }}>
            {over ? ' ' : w.hold}
          </T>
        </View>
      </Middle>
      <Dock>
        <Button label={w.down} onPress={down} kind="warm" />
        <View style={s.c}>
          <Link label={w.open} onPress={open} hidden={!over} color={nightInk.ink} />
        </View>
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { alignItems: 'center', gap: 8 },
  left: { fontFamily: font.display, fontSize: 38, lineHeight: 44, marginTop: 8 },
});
