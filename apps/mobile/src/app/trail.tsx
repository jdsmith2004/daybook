/* The trail (core trail.ts): for a craving that keeps coming, for hours or days. One picture, learned once: five places a
   craving walks a person down, and an exit at every one. It opens on "Where is it now?": touch the place it has reached
   (the flame walks there) and how much time there is (10 seconds, 2 minutes, or 10 or more, remembered). Then that place:
   the one line to say once, its picture, and the one thing to do, at that length. Done is an exit, and every exit leads
   home: the house with the lit window, how long this battle has been held, and an urge ridden out saved to the log. "It is
   back" starts again at the map. Nothing on the trail asks the person to reach out to anyone (the owner, November 3, 2026).

   The stretch (one battle across hours or days) lives in the SOS memory on this device (core trailBegin): opening the trail
   carries it on, and the map starts where the flame was last. The X closes, like SOS; "It passed" goes home from anywhere. */
import {
  addEvent,
  gameCompute,
  newUrge,
  TRAIL,
  TRAIL_LENS,
  TRAIL_LIGHTS,
  TRAIL_PLACES,
  trailBegin,
  trailHomeLine,
  trailKey,
  trailLenOf,
  trailLine,
  trailPicture,
  trailReach,
  trailSide,
  trailStretchOf,
  trailTouch,
  urEntry,
  urMark,
  urNight,
  type TrailLen,
  type TrailPlace,
  type UrState,
} from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';

import { Link } from '@/components/choices';
import { useHearthHold } from '@/components/hearth';
import { Dock, Middle, SceneFrame, Stage } from '@/components/scene';
import { Text } from '@/components/text';
import {
  DoCard,
  DoorArt,
  DrillClock,
  DriftArt,
  HomeArt,
  MiniTrail,
  NextLine,
  PictureSlider,
  PreviewArt,
  SparkArt,
  StepsArt,
  TimeChoice,
  TrailMap,
  TW,
  WaveLine,
} from '@/components/trail-art';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close, closeAll } from '@/lib/nav';
import { count } from '@/lib/pulse';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font } from '@/lib/theme';

type Step = 'where' | TrailPlace | 'home';

export default function Trail() {
  const { snap, tk, update } = useStore();
  const st = useCareSettings();
  const sos = useSos();
  const g = useMemo(() => gameCompute(snap.days, st, snap.reviews, tk), [snap, st, tk]);
  const level = Math.max(1, g.level.n);

  /* opening the trail carries the stretch on (or begins one); the map starts where the flame was last */
  const [stretch0] = useState(() => trailStretchOf(trailBegin(sos.mem, Date.now())));
  useEffect(() => {
    sos.setMem((m) => trailBegin(m, Date.now()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [ur, setUr] = useState<UrState>(() => newUrge(Date.now(), g.pts));
  /* a note's Not today opens the trail at the door (?at=case) */
  const { at: atQ } = useLocalSearchParams<{ at?: string }>();
  const atP = TRAIL_PLACES.find((x) => x === atQ) ?? null;
  const [step, setStep] = useState<Step>(atP ?? 'where');
  const [pick, setPick] = useState<TrailPlace | null>(atP ?? stretch0?.at ?? null);
  const [len, setLen] = useState<TrailLen>(() => trailLenOf(sos.mem));
  const [home, setHome] = useState<{ at: TrailPlace | null; line: string } | null>(null);
  /* how many times the door was reached, so the line it may say next is a new one each time */
  const visits = useRef(stretch0?.visits ?? 1);

  const choose = (p: TrailPlace) => {
    setPick(p);
    sos.setMem((m) => trailTouch(m, p, Date.now()));
  };
  const chooseLen = (l: TrailLen) => {
    setLen(l);
    sos.setMem((m) => ({ ...m, trailLen: l }));
  };

  /* an exit: the drill done (or "It passed"), saved as an urge ridden out, and home */
  const reach = useCallback(
    (at: TrailPlace | null) => {
      const now = Date.now();
      const done: UrState = at ? { ...ur, used: ur.used.concat(TRAIL[at].did) } : ur;
      const a = urMark(done, 'p');
      const e = urEntry(a, 'rode', st, now);
      update((s) => ({ ...s, days: addEvent(s.days, e.key, 'rode', e.time, e.fields).days }));
      count('urge_logged');
      let line = '';
      sos.setMem((m) => {
        const next = trailReach(m, now);
        line = trailHomeLine(at, trailStretchOf(next), now);
        return { ...next, last: e.last };
      });
      setHome({ at, line: line || trailHomeLine(at, null, now) });
      setStep('home');
      buzz('lit');
    },
    [ur, st, update, sos],
  );

  const night = urNight(new Date().getHours());
  const passed =
    step === 'home' ? undefined : (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="It passed. Go home."
        onPress={() => reach(step === 'where' ? pick : step)}
        hitSlop={6}
        style={({ pressed }) => [s.passed, { opacity: pressed ? 0.85 : 1 }]}>
        <Text style={s.passedT}>It passed</Text>
      </Pressable>
    );

  /* ---------- home ---------- */
  if (step === 'home' && home) {
    return (
      <SceneFrame title="The trail" sky="night" onClose={close}>
        <Stage key="home" dir={1}>
          <T v="title" accessibilityRole="header">
            Home.
          </T>
          <T tone="muted">{home.line}</T>
          <Middle>
            <HomeArt level={level} />
          </Middle>
          <Dock>
            <Button label="Done" onPress={() => closeAll()} />
            <View style={s.center}>
              <Link
                label="It is back"
                tone="muted"
                onPress={() => {
                  buzz('tap');
                  visits.current += 1;
                  setUr(newUrge(Date.now(), g.pts));
                  sos.setMem((m) => trailBegin(m, Date.now()));
                  setHome(null);
                  setStep('where');
                }}
              />
            </View>
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  /* ---------- where is it now, and how long ---------- */
  if (step === 'where') {
    return (
      <SceneFrame title="The trail" sky="night" onClose={close} topRight={passed}>
        <Stage key="where" dir={0}>
          <T v="title" accessibilityRole="header">
            Where is it now?
          </T>
          <T tone="muted">It slides down, top to bottom. Touch the one that sounds like you now.</T>
          <View style={s.map}>
            <TrailMap at={pick} level={level} onPick={choose} />
          </View>
          <Dock>
            <T v="small" tone="muted" style={s.c}>
              How much time do you have?
            </T>
            <TimeChoice len={len} lens={TRAIL_LENS} onPick={chooseLen} />
            <Button
              label={pick ? 'Show me the move' : 'Touch a place first'}
              disabled={!pick}
              onPress={() => {
                if (!pick) return;
                buzz('tap');
                setStep(pick);
              }}
            />
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  /* ---------- a place ---------- */
  if (step === 'home') return null;
  const at = step;
  const P = TRAIL[at];
  const drill = P.drills[len];
  const lenShort = TRAIL_LENS.find((x) => x.id === len)!.short;
  const head = (
    <>
      <View style={s.mini}>
        <MiniTrail at={at} onPress={() => setStep('where')} />
      </View>
      <View style={s.row}>
        <T v="title" accessibilityRole="header">
          {P.name}
        </T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Time: ' + lenShort + '. Change it.'}
          onPress={() => setStep('where')}
          hitSlop={8}
          style={s.time}>
          <Text style={s.timeT}>{lenShort}</Text>
        </Pressable>
      </View>
      <Text style={s.say}>
        {P.means + '. It sounds like: '}
        <Text style={s.hear}>{'“' + P.hear + '”'}</Text>
      </Text>
      <Text style={s.say}>
        {'Say it once: '}
        <Text style={s.sayB}>{'“' + P.say + '”'}</Text>
      </Text>
    </>
  );
  const Place = { drift: Drift, spark: Spark, preview: Preview, case: Case, steps: Steps }[at];
  return (
    <SceneFrame title="The trail" sky="night" onClose={close} topRight={passed}>
      <Stage key={at + len} dir={1}>
        {head}
        <Place len={len} drill={drill} level={level} onExit={() => reach(at)} visits={visits.current} night={night} />
      </Stage>
    </SceneFrame>
  );
}

interface PlaceProps {
  len: TrailLen;
  drill: { do: string; done: string; secs?: number };
  level: number;
  visits: number;
  night: boolean;
  onExit: () => void;
}

/** a beat, then home: long enough to see the move land (the light fill, the flame walk) */
function useExitAfter(onExit: () => void, ms: number) {
  const [going, setGoing] = useState(false);
  useEffect(() => {
    if (!going) return;
    const id = setTimeout(onExit, ms);
    return () => clearTimeout(id);
  }, [going, ms, onExit]);
  return [going, () => setGoing(true)] as const;
}

/* ---------- Drift: find the low light, fill it ---------- */
function Drift({ len, drill, onExit }: PlaceProps) {
  const [low, setLow] = useState<(typeof TRAIL_LIGHTS)[number]['id'] | null>(null);
  const [going, go] = useExitAfter(onExit, 900);
  const L = TRAIL_LIGHTS.find((x) => x.id === low);
  return (
    <>
      <T tone="muted" style={s.lead}>
        {low ? drill.do : 'Which light is low?'}
      </T>
      <Middle>
        <DriftArt low={low} filled={going} onPick={(l) => !going && setLow(l)} />
      </Middle>
      <Dock>
        {L ? <DoCard over={len === 's' ? undefined : L.label + ' is low. Fill it now:'}>{L.fill[len]}</DoCard> : null}
        {L && drill.secs ? <DrillClock secs={drill.secs} onEnd={() => undefined} /> : null}
        <Button
          label={L ? drill.done : 'Touch the low light'}
          disabled={!L || going}
          onPress={() => {
            buzz('save');
            go();
          }}
        />
      </Dock>
    </>
  );
}

/* ---------- Spark: stand up, walk out, the phone stays ---------- */
function Spark({ drill, level, onExit }: PlaceProps) {
  const [going, go] = useExitAfter(onExit, 1100);
  const [timing, setTiming] = useState(false);
  return (
    <>
      <Middle>
        <SparkArt out={going || timing} level={level} />
      </Middle>
      <Dock>
        <Text style={s.big}>{drill.do}</Text>
        {timing && drill.secs ? <DrillClock secs={drill.secs} onEnd={go} /> : null}
        <Button
          label={timing ? 'I am back, and it eased' : drill.done}
          disabled={going}
          onPress={() => {
            buzz('save');
            /* the long one: out the door first, then the time away */
            if (drill.secs && !timing) return setTiming(true);
            go();
          }}
        />
      </Dock>
    </>
  );
}

/* ---------- Preview: your picture over the glow, while the wave passes ---------- */
function Preview({ len, drill, onExit }: PlaceProps) {
  const mem = useSos().mem;
  const pic = useMemo(() => trailPicture(mem), [mem]);
  const p = useRef(new Animated.Value(len === 's' ? 1 : 0)).current;
  const [slid, setSlid] = useState(len === 's');
  const [t0] = useState(() => Date.now());
  const [now, setNow] = useState(t0);
  useEffect(() => {
    if (!drill.secs) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [drill.secs]);
  const waveP = drill.secs ? Math.min(1, (now - t0) / (drill.secs * 1000)) : 1;
  return (
    <>
      <View style={s.art}>
        <PreviewArt p={p} caption={pic.own ? 'Your picture: ' + pic.t : pic.t} />
      </View>
      <Dock>
        {len === 's' ? (
          <DoCard>{drill.do}</DoCard>
        ) : (
          <>
            <WaveLine p={waveP} />
            <T v="small" tone="muted" style={s.c}>
              {waveP >= 0.45 ? 'Past its top. One long breath out.' : 'It is rising. Stay in your picture.'}
            </T>
            {slid ? null : <PictureSlider p={p} onDone={() => setSlid(true)} />}
          </>
        )}
        {slid ? (
          <Button
            label={drill.done}
            onPress={() => {
              buzz('save');
              onExit();
            }}
          />
        ) : null}
      </Dock>
    </>
  );
}

/* ---------- Case: what it will say and your answer; hold the door shut; the key is your reason ---------- */
function Case({ len, drill, visits, night, onExit }: PlaceProps) {
  const st = useCareSettings();
  const key = useMemo(() => trailKey(st), [st]);
  const next = useMemo(() => trailLine(visits - 1, night), [visits, night]);
  const [locked, setLocked] = useState(false);
  const hold = useHearthHold(false, () => setLocked(true));
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: hold.h.value }] }));
  const [timing, setTiming] = useState(false);
  return (
    <>
      {len !== 's' && !locked ? <NextLine line={next.line} answer={next.answer} own={false} /> : null}
      <Middle>
        <DoorArt h={hold.h} locked={locked} small={len !== 's' && !locked} />
      </Middle>
      <Dock>
        {locked ? (
          <>
            <View style={s.key}>
              <Text style={[s.keyOver]}>{key.own ? 'The key: your reason' : 'The key'}</Text>
              <Text style={s.keyT}>{key.t}</Text>
            </View>
            {timing && drill.secs ? <DrillClock secs={drill.secs} onEnd={onExit} /> : null}
            <Button
              label={timing ? 'It is quieter now' : len === 'l' ? 'Stay on this side' : 'Home'}
              onPress={() => {
                buzz('tap');
                if (len === 'l' && !timing) return setTiming(true);
                onExit();
              }}
            />
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close the door"
            accessibilityHint="Press and hold until it fills. With a screen reader, double tap."
            accessibilityActions={[{ name: 'activate' }, { name: 'longpress' }]}
            onAccessibilityAction={hold.light}
            onPressIn={hold.start}
            onPressOut={hold.stop}
            onPress={hold.tap}
            delayLongPress={2400}
            style={s.hold}>
            <Reanimated.View style={[s.holdFill, fill]} />
            <Text style={s.holdT}>{hold.label.startsWith('Press') ? 'Hold to close the door' : hold.label}</Text>
          </Pressable>
        )}
      </Dock>
    </>
  );
}

/* ---------- Steps: the side path off the stairs ---------- */
function Steps({ len, drill, level, onExit }: PlaceProps) {
  const st = useCareSettings();
  const side = useMemo(() => trailSide(st), [st]);
  const [going, go] = useExitAfter(onExit, 1100);
  const [timing, setTiming] = useState(false);
  return (
    <>
      <Middle>
        <StepsArt level={level} off={going || timing} />
      </Middle>
      <Dock>
        {len === 's' ? (
          <DoCard>{drill.do}</DoCard>
        ) : (
          <DoCard over={side.own ? 'Your side path' : 'A side path'} tone="mint">
            {side.t}
          </DoCard>
        )}
        {timing && drill.secs ? <DrillClock secs={drill.secs} onEnd={go} /> : null}
        <Button
          label={len === 'l' && !timing ? 'Start ten minutes' : drill.done}
          disabled={going}
          onPress={() => {
            buzz('save');
            if (drill.secs && !timing) return setTiming(true);
            go();
          }}
        />
      </Dock>
    </>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  center: { alignItems: 'center' },
  map: { marginTop: 12 },
  mini: { alignItems: 'center', marginTop: -4, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: TW.bubble },
  timeT: { fontFamily: font.bodySemi, fontSize: 13, color: TW.mint },
  say: { fontFamily: font.body, fontSize: 17, lineHeight: 23, color: TW.muted, marginTop: 4 },
  hear: { fontFamily: font.body, fontStyle: 'italic', color: TW.ink },
  sayB: { fontFamily: font.bodySemi, color: TW.sun },
  lead: { marginTop: 8 },
  art: { marginTop: 20 },
  big: { fontFamily: font.display, fontSize: 22, lineHeight: 28, color: TW.ink, textAlign: 'center' },
  passed: { height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  passedT: { fontFamily: font.bodySemi, fontSize: 15, color: TW.ink },
  key: { backgroundColor: TW.cream, borderRadius: 20, padding: 16, gap: 2 },
  keyOver: { fontFamily: font.bodySemi, fontSize: 13, color: '#6A5FB0' },
  keyT: { fontFamily: font.body, fontSize: 17, lineHeight: 23, color: TW.paperInk },
  hold: { minHeight: 64, borderRadius: 32, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#A99BFF' },
  holdFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#7C6BE0', transformOrigin: 'left' },
  holdT: { fontFamily: font.display, fontSize: 20, color: '#1A1250' },
});
