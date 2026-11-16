/* Opening the app, as one motion (lib/launch.ts says why; the owner, November 15, 2026: "I want ours to look like theirs", How We
   Feel's, where the logo on the splash comes alive and becomes the home screen). Timed against the owner's recording of theirs
   (the side-session notes, launch-videos-nov15: about 1.2 s of the logo, then home settles in about 0.5 s), in Daybook's own art:

   The native splash is the flame asleep, big in the middle, on the launch color. This scene's first frame is that same picture
   (core launchFlameSvg: one drawing for both), drawn over everything, and only then is the native splash let go, so there is no
   seam. In ms from the first frame:
        0  The flame asleep, still, as on the splash.
      280  It is alive: the living flame takes the still picture's place (the fire starts to lick, the glow breathes).
      520  It wakes: its eyes open, it takes one breath (the bloom and its ring of light), one soft knock.
     1150  It flies: it travels and shrinks to its home on Today's sky, eased in and out. Under it, Today's sky shows first, then the
           rest of the page. If the person's flame is another form, it becomes that form on the way.
     1620  It lands: Today's own flame takes over in the same place, and the scene is gone by 1760.
   The plain cross-fade (lib/launch.ts, `fade`): the still picture holds a beat, then everything fades through to the app.
   A tap on the scene cannot do anything; it is over in under two seconds. */
import { bigFigureAt, LAUNCH_BG, LAUNCH_LEVEL, LAUNCH_W, launchFlameSvg } from '@daybook/core';
import * as Haptics from 'expo-haptics';
import { usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

import { BigFlame } from '@/components/big-flame';
import { knock } from '@/lib/feel';
import { LAUNCH_SLOW, launchDue, launchPlayed, setLaunchPhase, useFlameSpot, type LaunchKind } from '@/lib/launch';
import { useReducedMotion } from '@/lib/motion';
import { getLockPref } from '@/lib/prefs';
import { useStore } from '@/lib/store';

/* the beats, in ms from the first frame (stretched on the web by ?slow=, lib/launch.ts, to look at it frame by frame) */
const Z = LAUNCH_SLOW;
const ALIVE = 280 * Z;
const WAKE = 520 * Z;
const FLY = 1150 * Z;
const FLY_MS = 560 * Z;
const LAND = FLY + FLY_MS - 90 * Z;
const GONE = LAND + 140 * Z;
/* On the web each screen's code arrives on its own (lib/web-shell.ts), so Today may still be loading when the scene's first frame
   is up. There the still picture holds, as the native splash does, until Today has said where its flame lives, and only then does
   the whole opening play, wake and flight together; begun earlier, Today loading under it stalled the wake and the flight gave
   up (the owner, November 15, 2026: "the logo never like moves or does the thing"). Native plays from the first frame, as before. */
const HOLD = Platform.OS === 'web';
/** how long the flame waits for Today to say where its home is before the scene gives up and fades instead (on the web, the
    wait for Today's code to arrive, which a slow phone needs) */
const SPOT_WAIT = (HOLD ? 8000 : 1900) * Z;
/* the cross-fade */
const FADE_AT = 420 * Z;
const FADE_MS = 360 * Z;

const EASE = Easing.bezier(0.42, 0, 0.18, 1);
const SOFT = Easing.inOut(Easing.quad);

/** the one still drawing, shared with the native splash */
const STILL = launchFlameSvg();

export function LaunchScene() {
  const [on, setOn] = useState(launchDue);
  if (!on) return null;
  return <Scene onDone={() => setOn(false)} />;
}

function Scene({ onDone }: { onDone: () => void }) {
  const { snap } = useStore();
  const reduce = useReducedMotion();
  const path = usePathname();
  const { width, height } = useWindowDimensions();
  const spot = useFlameSpot();
  /* decided once, as the scene starts: the morph needs Today in front with nothing over it */
  const kind = useRef<LaunchKind | null>(null);
  if (kind.current === null) {
    const morph = !!snap.settings && (path === '/' || path === '') && !getLockPref() && !reduce;
    kind.current = morph ? 'morph' : 'fade';
    launchPlayed();
    setLaunchPhase(morph ? 'wait' : 'done');
  }
  const level = snap.settings && spot ? spot.level : LAUNCH_LEVEL;
  const own = level !== LAUNCH_LEVEL;

  const stillO = useSharedValue(1);
  const aliveO = useSharedValue(0);
  const brandO = useSharedValue(1);
  const ownO = useSharedValue(0);
  const flameO = useSharedValue(1);
  const skyO = useSharedValue(1);
  const belowO = useSharedValue(1);
  const cx = useSharedValue(width / 2);
  const cy = useSharedValue(height / 2);
  const scale = useSharedValue(1);
  const [asleep, setAsleep] = useState(true);
  const [pulse, setPulse] = useState(0);
  const [skyH, setSkyH] = useState(height);

  /* the first frame is on the screen: the native splash can go (it is the same picture) */
  useEffect(() => {
    let live = true;
    requestAnimationFrame(() => requestAnimationFrame(() => live && SplashScreen.hide()));
    return () => {
      live = false;
    };
  }, []);

  /* the cross-fade */
  const fadeOut = (at: number) => {
    stillO.value = withDelay(at, withTiming(0, { duration: FADE_MS, easing: SOFT }));
    aliveO.value = withDelay(at, withTiming(0, { duration: FADE_MS, easing: SOFT }));
    skyO.value = withDelay(at, withTiming(0, { duration: FADE_MS, easing: SOFT }));
    belowO.value = withDelay(at, withTiming(0, { duration: FADE_MS, easing: SOFT }));
    scale.value = withDelay(at, withTiming(1.06, { duration: FADE_MS, easing: SOFT }));
    return setTimeout(
      () => {
        setLaunchPhase('done');
        onDone();
      },
      at + FADE_MS + 40,
    );
  };

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /* whether the opening has begun: at once, or on the web once Today knows where its flame is (HOLD) */
  const begunRef = useRef(false);
  if (!HOLD || kind.current !== 'morph' || spot) begunRef.current = true;
  const begun = begunRef.current;
  useEffect(() => {
    if (!begun) return;
    if (kind.current !== 'morph') {
      const t = fadeOut(FADE_AT);
      return () => clearTimeout(t);
    }
    /* alive: the living flame takes the still picture's place */
    aliveO.value = withDelay(ALIVE, withTiming(1, { duration: 160 * Z }));
    stillO.value = withDelay(ALIVE + 40 * Z, withTiming(0, { duration: 160 * Z }));
    const ts = timers.current;
    ts.push(
      setTimeout(() => {
        setAsleep(false);
        setPulse((p) => p + 1);
        knock(Haptics.ImpactFeedbackStyle.Soft);
      }, WAKE),
    );
    return () => ts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [begun]);

  /* the flight, once Today has said where the flame's home is (and the wake has had its moment) */
  const flown = useRef(false);
  useEffect(() => {
    if (kind.current !== 'morph' || flown.current) return;
    if (!spot) {
      const t = setTimeout(() => {
        if (flown.current) return;
        flown.current = true;
        timers.current.push(fadeOut(0));
      }, SPOT_WAIT);
      return () => clearTimeout(t);
    }
    flown.current = true;
    const fig = bigFigureAt(spot.level);
    const tx = spot.x + fig.x * spot.size;
    const ty = spot.y + fig.y * spot.size;
    const k = spot.size / LAUNCH_W;
    /* a whole number: two parts of one color meeting on a half pixel showed as a faint line across the screen */
    setSkyH(Math.round(spot.skyH));
    const go = (v: typeof cx, to: number, at: number, ms: number, e: typeof EASE | typeof SOFT = EASE) => {
      v.value = withDelay(at, withTiming(to, { duration: ms, easing: e }));
    };
    go(cx, tx, FLY, FLY_MS);
    go(cy, ty, FLY, FLY_MS);
    go(scale, k, FLY, FLY_MS);
    go(skyO, 0, FLY, 380 * Z, SOFT);
    go(belowO, 0, FLY + 200 * Z, 420 * Z, SOFT);
    if (own) {
      go(brandO, 0, FLY + 100 * Z, 260 * Z, SOFT);
      go(ownO, 1, FLY + 100 * Z, 260 * Z, SOFT);
    }
    go(flameO, 0, LAND, 110 * Z, SOFT);
    const ts = timers.current;
    ts.push(setTimeout(() => setLaunchPhase('fly'), 0));
    ts.push(setTimeout(() => setLaunchPhase('done'), LAND));
    ts.push(setTimeout(onDone, GONE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const skyStyle = useAnimatedStyle(() => ({ opacity: skyO.value }));
  const belowStyle = useAnimatedStyle(() => ({ opacity: belowO.value }));
  const box = useAnimatedStyle(() => ({
    opacity: flameO.value,
    transform: [{ translateX: cx.value - LAUNCH_W / 2 }, { translateY: cy.value - LAUNCH_W / 2 }, { scale: scale.value }],
  }));
  const stillStyle = useAnimatedStyle(() => ({ opacity: stillO.value }));
  const aliveStyle = useAnimatedStyle(() => ({ opacity: aliveO.value }));
  const brandStyle = useAnimatedStyle(() => ({ opacity: brandO.value }));
  const ownStyle = useAnimatedStyle(() => ({ opacity: ownO.value }));
  const alive = kind.current === 'morph';
  const smoke = useMemo(() => '#6B6577', []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <StatusBar style="light" />
      {/* the launch color, in two parts: Today's sky shows through first, then the rest of the page */}
      <Reanimated.View style={[s.sky, { height: skyH, backgroundColor: LAUNCH_BG }, skyStyle]} />
      <Reanimated.View style={[s.below, { top: skyH, backgroundColor: LAUNCH_BG }, belowStyle]} />
      <Reanimated.View style={[s.box, box]} pointerEvents="none">
        <Reanimated.View style={[StyleSheet.absoluteFill, stillStyle]}>
          <SvgXml xml={STILL} width={LAUNCH_W} height={LAUNCH_W} />
        </Reanimated.View>
        {alive ? (
          <Reanimated.View style={[StyleSheet.absoluteFill, aliveStyle]}>
            <Reanimated.View style={[StyleSheet.absoluteFill, brandStyle]}>
              <BigFlame level={LAUNCH_LEVEL} size={LAUNCH_W} noLand asleep={asleep} pulse={pulse} smoke={smoke} label="Daybook is opening" />
            </Reanimated.View>
            {own ? (
              <Reanimated.View style={[StyleSheet.absoluteFill, ownStyle]}>
                <BigFlame level={level} size={LAUNCH_W} noLand smoke={smoke} label="Your flame" />
              </Reanimated.View>
            ) : null}
          </Reanimated.View>
        ) : null}
      </Reanimated.View>
    </View>
  );
}

const s = StyleSheet.create({
  sky: { position: 'absolute', left: 0, right: 0, top: 0 },
  below: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  box: { position: 'absolute', left: 0, top: 0, width: LAUNCH_W, height: LAUNCH_W },
});
