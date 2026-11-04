/* The trail (core trail.ts): for a craving that keeps coming, for hours or days. One picture, learned once: five places a
   craving walks a person down, and an exit at every one. It opens on "Where is it now?": touch the place it has reached
   (the flame walks there) and how much time there is (10 seconds, 2 minutes, or 10 or more, remembered). Then that place:
   three beats, like a lesson (the owner, November 3, 2026): what the craving whispers there, what that thought really is,
   then the one line to say once and the one thing to do, at that length (10 seconds goes straight to the move). Done is an exit, and every exit leads
   home: the house with the lit window, how long this battle has been held, and an urge ridden out saved to the log. "It is
   back" starts again at the map. Nothing on the trail asks the person to reach out to anyone (the owner, November 3, 2026).

   The stretch (one battle across hours or days) lives in the SOS memory on this device (core trailBegin): opening the trail
   carries it on, and the map starts where the flame was last. The X closes, like SOS; "It passed" goes home from anywhere. */
import {
  addEvent,
  gameCompute,
  newUrge,
  TRAIL,
  TRAIL_ACT,
  TRAIL_GUIDE_SECS,
  TRAIL_LENS,
  TRAIL_LIGHTS,
  TRAIL_PLACES,
  TRAIL_STRENGTH,
  TRAIL_MIRROR,
  trailAfter,
  trailBegin,
  trailFill,
  trailGuide,
  trailHomeLine,
  trailKey,
  trailLenOf,
  trailLine,
  trailPicture,
  trailReach,
  trailSide,
  trailSosFirst,
  trailStretchOf,
  trailTouch,
  urEntry,
  urMark,
  urNight,
  type TrailGuideOwn,
  type TrailLen,
  type TrailPlace,
  type TrailStrength,
  type UrState,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Reanimated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Link } from '@/components/choices';
import { useHearthHold } from '@/components/hearth';
import { Mirror, useMirror } from '@/components/mirror';
import { Dock, Middle, SceneFrame, Stage } from '@/components/scene';
import { Text } from '@/components/text';
import {
  DoorArt,
  DrillClock,
  DriftArt,
  HomeArt,
  PictureSlider,
  PreviewArt,
  Rise,
  Seg,
  SparkArt,
  StepsArt,
  TimeChoice,
  TrailMap,
  TW,
  WaveLine,
  Whisper,
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
  /* the beat inside a place: 0 what it says, 1 what it really is, 2 the move */
  const [beat, setBeat] = useState(() => (trailLenOf(sos.mem) === 's' ? 2 : 0));
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
                setBeat(len === 's' ? 2 : 0);
                setStep(pick);
              }}
            />
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  /* ---------- a place: what it says, what it really is, then the move (10 seconds goes straight to the move). At 2 minutes the
     move is guided: how strong it is (very strong offers SOS first), what it wants them to do and what it is showing them,
     written down, eight cues that speak to those words while the picture acts them out, and how strong it is after. ---------- */
  if (step === 'home') return null;
  const at = step;
  const P = TRAIL[at];
  const drill = P.drills[len];
  const first = len === 's' ? 2 : 0;
  const parts = len === 'm' ? 7 : 3;
  const Place = { drift: Drift, spark: Spark, preview: Preview, case: Case, steps: Steps }[at];
  return (
    <SceneFrame
      title={P.name}
      sky="night"
      onBack={() => (beat > first ? setBeat(beat === 6 ? 2 : beat - 1) : setStep('where'))}
      onClose={close}
      topRight={passed}
      dots={first ? null : { n: parts, i: beat, label: 'Part ' + (beat + 1) + ' of ' + parts }}>
      <Stage key={at + len} dir={1}>
        <Place
          at={at}
          beat={beat}
          go={(b) => {
            buzz('tap');
            setBeat(b);
          }}
          len={len}
          drill={drill}
          level={level}
          onExit={() => reach(at)}
          onStrength={(x) => setUr((u) => ({ ...u, strength: x }))}
          visits={visits.current}
          night={night}
        />
      </Stage>
    </SceneFrame>
  );
}

interface PlaceProps {
  at: TrailPlace;
  beat: number;
  go: (beat: number) => void;
  len: TrailLen;
  drill: { do: string; done: string; secs?: number };
  level: number;
  visits: number;
  night: boolean;
  onExit: () => void;
  onStrength: (x: TrailStrength) => void;
}

const CUE_MS = (TRAIL_GUIDE_SECS * 1000) / 8;
/* the beats of the guided 2 minutes, after the three every length has */
const B_DO = 3;
const B_PIC = 4;
const B_GUIDE = 5;
const B_AFTER = 6;

/** one place, in beats, like a lesson: the thought it whispers, what that thought really is, then the line to say once and
    the move. The picture stays put while the words change above it, so it reads as one place getting clearer.
    At 2 minutes the move is guided (the owner, November 4, 2026: "have me write down what I'm thinking"): how strong it is
    (very strong puts SOS first), then two questions written in a word or a line, what it wants them to do and what it is
    showing them; then eight cues of about fifteen seconds that say those words back and work on them, going on by themselves
    with a tick while the wave under them rises and falls (Next goes on sooner). One cue is the mirror: their own face, from
    the front camera. Then how strong it is now, said back plainly; still strong walks it through again, with SOS right there. */
function Beats({
  p,
  hear,
  under,
  lead,
  art,
  dock,
  ready = true,
  own,
  onCue,
}: {
  p: PlaceProps;
  hear?: string;
  under?: ReactNode;
  lead?: ReactNode;
  art: ReactNode;
  dock: ReactNode;
  /** the 2-minute start waits for this (Drift: a light picked) */
  ready?: boolean;
  /** the place's own words for the guide (core trailGuide) */
  own: TrailGuideOwn;
  onCue: (i: number) => void;
}) {
  const { at, beat, go, len } = p;
  const P = TRAIL[at];
  const mirror = useMirror();
  const [before, setBefore] = useState<TrailStrength | null>(null);
  const [after, setAfter] = useState<TrailStrength | 'gone' | null>(null);
  const [doing, setDoing] = useState('');
  const [picture, setPicture] = useState('');
  const guide = useMemo(() => trailGuide(at, { ...own, doing, picture, night: p.night, mirror: mirror.on }), [at, own, doing, picture, p.night, mirror.on]);
  const [cue, setCue] = useState(0);
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  /* the guide's clock: a cue goes on by itself after its time, and the last one ends in "How is it now?" */
  useEffect(() => {
    if (beat !== B_GUIDE) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [beat]);
  const next = useCallback(() => {
    if (cue >= guide.length - 1) {
      onCue(guide.length);
      return go(B_AFTER);
    }
    buzz('tick');
    setCue(cue + 1);
    onCue(cue + 1);
    setT0(Date.now());
  }, [cue, guide.length, go, onCue]);
  useEffect(() => {
    if (beat === B_GUIDE && t0 && now - t0 >= CUE_MS) next();
  }, [beat, now, t0, next]);
  /* the camera is asked for once, before the clock starts, so no prompt lands in the middle of a cue */
  const start = async () => {
    await mirror.ask();
    setCue(0);
    onCue(0);
    setAfter(null);
    setT0(Date.now());
    setNow(Date.now());
    go(B_GUIDE);
  };
  const again = () => {
    setAfter(null);
    onCue(-1);
    go(B_DO);
  };
  const sos = () => {
    buzz('tap');
    router.replace('/sos');
  };
  const res = before && after ? trailAfter(before, after) : null;
  const waveP = beat === B_AFTER ? 1 : Math.min(1, (cue * CUE_MS + Math.max(0, now - t0)) / (TRAIL_GUIDE_SECS * 1000));
  const left = Math.max(0, Math.ceil(TRAIL_GUIDE_SECS - waveP * TRAIL_GUIDE_SECS));
  const showMirror = beat === B_GUIDE && cue === TRAIL_MIRROR && mirror.on;

  let words: ReactNode;
  let bottom: ReactNode = null;
  if (beat === 0) {
    words = (
      <>
        <Text style={s.over}>The thought here</Text>
        <Whisper text={hear ?? P.hear} />
      </>
    );
    bottom = <Button label="See what it really is" onPress={() => go(1)} />;
  } else if (beat === 1) {
    words = (
      <Rise>
        <Text style={s.over}>What it really is</Text>
        <Text style={s.turn} accessibilityRole="header">
          {P.turn}
        </Text>
        {under}
      </Rise>
    );
    bottom = <Button label="Show me the move" onPress={() => go(2)} />;
  } else if (beat === 2 || len !== 'm') {
    words = (
      <Rise>
        <Text style={s.over}>Say it once</Text>
        <Text style={s.sayL} accessibilityRole="header">
          {'“' + P.say + '”'}
        </Text>
        {lead}
      </Rise>
    );
    bottom =
      len === 'm' ? (
        <>
          <Text style={s.ask}>How strong is it right now?</Text>
          <Seg
            label="How strong is it right now?"
            val={before}
            opts={TRAIL_STRENGTH}
            onPick={(x) => {
              setBefore(x);
              p.onStrength(x);
            }}
          />
          {trailSosFirst(before) ? (
            <>
              <Button label="Open SOS" onPress={sos} />
              <View style={s.center}>
                <Link label="Walk it here instead" tone="muted" onPress={() => ready && go(B_DO)} />
              </View>
            </>
          ) : (
            <Button label={ready ? 'Next' : 'Touch the low light first'} disabled={!before || !ready} onPress={() => go(B_DO)} />
          )}
        </>
      ) : (
        dock
      );
  } else if (beat === B_DO || beat === B_PIC) {
    const isDo = beat === B_DO;
    words = (
      <Rise key={beat}>
        <Text style={s.over}>Write it down</Text>
        <Text style={s.turn} accessibilityRole="header">
          {isDo ? 'What is it pushing you to do?' : 'What is it showing you?'}
        </Text>
        <TextInput
          accessibilityLabel={isDo ? 'What it is pushing you to do' : 'What it is showing you'}
          autoFocus
          multiline
          maxLength={160}
          defaultValue={isDo ? doing : picture}
          onChangeText={isDo ? setDoing : setPicture}
          placeholder={isDo ? 'Say it plainly. Only you see this.' : 'The picture in your head, in a few words'}
          placeholderTextColor={TW.muted}
          style={s.box}
        />
        <View style={s.write}>
          <Button label={isDo ? 'Next' : 'Start the 2 minutes'} onPress={() => (isDo ? go(B_PIC) : start())} />
          <View style={s.center}>
            <Link
              label="Skip this question"
              tone="muted"
              onPress={() => {
                if (isDo) setDoing('');
                else setPicture('');
                return isDo ? go(B_PIC) : start();
              }}
            />
          </View>
        </View>
      </Rise>
    );
  } else if (beat === B_GUIDE) {
    words = (
      <Rise key={cue}>
        <Text style={s.over}>{Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0')}</Text>
        <Text style={s.cue} accessibilityRole="header" accessibilityLiveRegion="polite">
          {guide[cue]}
        </Text>
      </Rise>
    );
    bottom = (
      <>
        <WaveLine p={waveP} />
        <Button label={cue >= guide.length - 1 ? 'Done' : 'Next'} onPress={next} />
      </>
    );
  } else {
    words = (
      <Rise key={res ? 'r' : 'q'}>
        <Text style={s.over}>Two minutes</Text>
        <Text style={s.turn} accessibilityRole="header">
          {res ? res.line : 'How is it now?'}
        </Text>
      </Rise>
    );
    bottom = (
      <>
        <Seg label="How is it now?" val={after} opts={[{ id: 'gone' as const, label: 'Gone' }, ...TRAIL_STRENGTH]} onPick={setAfter} />
        {res?.again ? (
          <>
            <Button label="Walk it through again" onPress={again} />
            <View style={s.center}>
              <Link label="Open SOS" tone="muted" onPress={sos} />
            </View>
          </>
        ) : res && !res.down ? (
          <>
            <Button label="Home" onPress={p.onExit} />
            <View style={s.center}>
              <Link label="Two more minutes" tone="muted" onPress={start} />
            </View>
          </>
        ) : (
          <Button
            label="Home"
            disabled={!res}
            onPress={() => {
              buzz('save');
              p.onExit();
            }}
          />
        )}
      </>
    );
  }
  return (
    <>
      <View key={beat === B_GUIDE ? 'g' : beat} style={s.words}>
        {words}
      </View>
      <Middle>
        <View style={[s.art, showMirror && s.hidden]}>{art}</View>
        {showMirror ? (
          <View style={s.mirror}>
            <Mirror size={220} />
          </View>
        ) : null}
      </Middle>
      {bottom ? <Dock>{bottom}</Dock> : null}
    </>
  );
}

const NO_OWN: TrailGuideOwn = {};

/** the cue a guided place is on: -1 before the guide starts, then 0 to 8 (8 is the end, and the picture stays acted) */
function useCue() {
  return useState(-1);
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
function Drift(p: PlaceProps) {
  const { beat, len, drill, onExit } = p;
  const [low, setLow] = useState<(typeof TRAIL_LIGHTS)[number]['id'] | null>(null);
  const [going, go] = useExitAfter(onExit, 900);
  const [cue, setCue] = useCue();
  const L = TRAIL_LIGHTS.find((x) => x.id === low);
  const own = useMemo(() => ({ fill: L ? trailFill(L.id, 'm', p.night) : undefined }), [L, p.night]);
  return (
    <Beats
      p={p}
      own={own}
      onCue={setCue}
      ready={!!L}
      lead={<Text style={s.lead}>{L ? L.label + ' is low.' + (len === 'm' ? '' : ' ' + trailFill(L.id, len, p.night)) : 'Which light is low? Touch it.'}</Text>}
      art={<DriftArt low={low} filled={going || cue >= TRAIL_ACT.drift[0]} onPick={(l) => beat === 2 && !going && setLow(l)} />}
      dock={
        <>
          {L && drill.secs ? <DrillClock secs={drill.secs} onEnd={() => undefined} /> : null}
          <Button
            label={L ? drill.done : 'Touch the low light'}
            disabled={!L || going}
            onPress={() => {
              buzz('save');
              go();
            }}
          />
        </>
      }
    />
  );
}

/* ---------- Spark: stand up, walk out, the phone stays ---------- */
function Spark(p: PlaceProps) {
  const { len, drill, level, onExit } = p;
  const [going, go] = useExitAfter(onExit, 1100);
  const [timing, setTiming] = useState(false);
  const [cue, setCue] = useCue();
  return (
    <Beats
      p={p}
      own={NO_OWN}
      onCue={setCue}
      lead={len === 'm' ? null : <Text style={s.lead}>{drill.do}</Text>}
      art={<SparkArt out={going || timing || cue >= TRAIL_ACT.spark[0]} level={level} />}
      dock={
        <>
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
        </>
      }
    />
  );
}

/* ---------- Preview: your picture over the glow, while the wave passes ---------- */
function Preview(p: PlaceProps) {
  const { beat, len, drill, onExit } = p;
  const mem = useSos().mem;
  const pic = useMemo(() => trailPicture(mem), [mem]);
  const slide = useRef(new Animated.Value(len === 's' ? 1 : 0)).current;
  const [slid, setSlid] = useState(len === 's');
  const [cue, setCue] = useCue();
  /* guided: the person's picture slides over the glow on its cue, and back off when the guide starts again */
  const over = cue >= TRAIL_ACT.preview[0];
  useEffect(() => {
    if (len !== 'm') return;
    Animated.timing(slide, { toValue: over ? 1 : 0, duration: 1400, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
  }, [over, len, slide]);
  /* 10 minutes: the wave starts when the move does */
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (beat === 2 && t0 === null) setT0(Date.now());
  }, [beat, t0]);
  useEffect(() => {
    if (!drill.secs || t0 === null) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [drill.secs, t0]);
  const waveP = drill.secs && t0 !== null ? Math.min(1, Math.max(0, now - t0) / (drill.secs * 1000)) : len === 's' ? 1 : 0;
  return (
    <Beats
      p={p}
      own={NO_OWN}
      onCue={setCue}
      lead={
        len === 'm' ? null : (
          <Text style={s.lead}>
            {len === 's' ? drill.do : waveP >= 0.45 ? 'Past its top. One long breath out.' : 'Slide your picture over it, and stay in it while the wave rises.'}
          </Text>
        )
      }
      art={<PreviewArt p={slide} caption={pic.own ? 'Your picture: ' + pic.t : pic.t} />}
      dock={
        <>
          {len === 's' ? null : <WaveLine p={waveP} />}
          {slid ? (
            <Button
              label={drill.done}
              onPress={() => {
                buzz('save');
                onExit();
              }}
            />
          ) : (
            <PictureSlider p={slide} onDone={() => setSlid(true)} />
          )}
        </>
      }
    />
  );
}

/* ---------- Case: what it will say and an answer; close the door; the key is your reason ---------- */
function Case(p: PlaceProps) {
  const { len, drill, visits, night, onExit } = p;
  const st = useCareSettings();
  const key = useMemo(() => trailKey(st), [st]);
  const next = useMemo(() => trailLine(visits - 1, night), [visits, night]);
  const [locked, setLocked] = useState(false);
  const hold = useHearthHold(false, () => setLocked(true));
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: hold.h.value }] }));
  const [timing, setTiming] = useState(false);
  const [cue, setCue] = useCue();
  const own = useMemo(() => ({ line: next.line, answer: next.answer, key: key.t }), [next, key]);
  /* guided: the door swings shut on its cue and locks on the next; a new round opens it again */
  const shut = cue >= TRAIL_ACT.case[0];
  const lockNow = cue >= TRAIL_ACT.case[1];
  useEffect(() => {
    if (len !== 'm' || cue < 0) return;
    hold.h.value = withTiming(shut ? 1 : 0, { duration: shut ? 1600 : 400 });
    setLocked(lockNow);
  }, [len, cue, shut, lockNow, hold.h]);
  return (
    <Beats
      p={p}
      own={own}
      onCue={setCue}
      hear={next.line}
      under={
        <Text style={s.answer}>
          {'An answer: '}
          <Text style={s.answerB}>{next.answer}</Text>
        </Text>
      }
      lead={len === 'm' ? null : <Text style={s.lead}>{locked ? 'Closed. Now the key: your reason.' : drill.do}</Text>}
      art={<DoorArt h={hold.h} locked={locked} />}
      dock={
        locked ? (
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
        )
      }
    />
  );
}

/* ---------- Steps: every stair has a way off; the flame takes the one from its stair ---------- */
function Steps(p: PlaceProps) {
  const { beat, len, drill, level, onExit } = p;
  const st = useCareSettings();
  const side = useMemo(() => trailSide(st, p.night), [st, p.night]);
  const [going, go] = useExitAfter(onExit, 1100);
  const [timing, setTiming] = useState(false);
  const [cue, setCue] = useCue();
  const own = useMemo(() => ({ side: side.own ? side.t : undefined }), [side]);
  return (
    <Beats
      p={p}
      own={own}
      onCue={setCue}
      lead={len === 'm' ? null : <Text style={s.lead}>{len === 's' ? drill.do : (side.own ? 'Your side path: ' : 'A side path: ') + side.t}</Text>}
      art={<StepsArt level={level} lit={beat >= 1} off={going || timing || cue >= TRAIL_ACT.steps[0]} />}
      dock={
        <>
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
        </>
      }
    />
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  center: { alignItems: 'center' },
  map: { marginTop: 12 },
  words: { alignSelf: 'stretch', minHeight: 212, marginTop: 8 },
  box: {
    marginTop: 16,
    minHeight: 88,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: TW.bubble,
    color: TW.ink,
    fontFamily: font.body,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  write: { marginTop: 14, gap: 10 },
  art: { alignSelf: 'stretch', alignItems: 'center' },
  hidden: { opacity: 0 },
  mirror: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  cue: { fontFamily: font.display, fontSize: 28, lineHeight: 35, color: TW.ink },
  ask: { fontFamily: font.bodySemi, fontSize: 15, color: TW.muted, textAlign: 'center' },
  over: { fontFamily: font.bodySemi, fontSize: 15, color: TW.muted, marginBottom: 8 },
  turn: { fontFamily: font.display, fontSize: 28, lineHeight: 35, color: TW.ink },
  sayL: { fontFamily: font.display, fontSize: 28, lineHeight: 35, color: TW.sun },
  lead: { fontFamily: font.body, fontSize: 17, lineHeight: 24, color: TW.ink, marginTop: 10 },
  answer: { fontFamily: font.body, fontSize: 17, lineHeight: 24, color: TW.muted, marginTop: 12 },
  answerB: { fontFamily: font.bodySemi, color: TW.cream },
  passed: { height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  passedT: { fontFamily: font.bodySemi, fontSize: 15, color: TW.ink },
  key: { backgroundColor: TW.cream, borderRadius: 20, padding: 16, gap: 2 },
  keyOver: { fontFamily: font.bodySemi, fontSize: 13, color: '#6A5FB0' },
  keyT: { fontFamily: font.body, fontSize: 17, lineHeight: 23, color: TW.paperInk },
  hold: { minHeight: 64, borderRadius: 32, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#A99BFF' },
  holdFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#7C6BE0', transformOrigin: 'left' },
  holdT: { fontFamily: font.display, fontSize: 20, color: '#1A1250' },
});
