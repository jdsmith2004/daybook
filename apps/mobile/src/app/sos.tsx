/* SOS: one guided ride that starts on the first tap and keeps going until the urge passes. Nothing is asked first.
   It always opens with the sun (three slow breaths), then the moves take turns (core ride.ts rideNext): squeeze, fit
   the shapes, 5-4-3-2-1, name the feeling, the hour after, say the thought fast, your words. Every move comes round, and
   the ones that work for you come round sooner: the heart says this one helps, Next passes it over, and What helped
   most at the end counts too. A feeling named steers the next move. Each move runs by itself and flows into the next,
   because these skills work like scrolling: the person keeps going until it passes. Nothing asks how it is going. The
   book button under each move opens why it works, with its lesson.
   "It passed" in the corner ends it with the one celebration every urge ridden out gets (components/rode-out.tsx): the
   flame, confetti, how long it took, how many you have ridden out, which move helped most (one tap, and SOS leans on it
   next time), one line on why that move works with its lesson for later, and what set it off (one tap). More (next to it)
   holds four big choices (Walk it through, Step away 10 minutes, Text someone, and Go to bed at night or Move by day), one
   row for every other tool, and I slipped, pinned under them so it is never a scroll away; it goes on to Rekindle (log.tsx). A tool picked there runs over SOS; when it is done, SOS asks one quiet question, "How is
   it now?": Better leads on to It passed, Still strong opens the tools again. The X on a tool comes back to the tools.
   The X here just closes. With ?practice=1 it is three moves, for a calm moment, and nothing is saved as an urge. */
import {
  addEvent,
  blankP,
  changeDay,
  faithVoice,
  famOfWord,
  feelTrigOf,
  gameCompute,
  godOn,
  newUrge,
  rateUrTool,
  RIDE_MOVES,
  rideNext,
  slipFeltLine,
  sosProof,
  urEntry,
  urEvidence,
  urFromYou,
  urLikeOf,
  urMark,
  urNight,
  urNote,
  urTags,
  urTool,
  urWon,
  withDay,
  writtenWords,
  type UrState,
} from '@daybook/core';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigOption, Link } from '@/components/choices';
import { MOVE_ICON, MOVE_NAME, MOVES, moveTint } from '@/components/ride/moves';
import { ScienceSheet } from '@/components/ride/science';
import { RidePager } from '@/components/ride/pager';
import { RodeOut, type Rode } from '@/components/rode-out';
import { Dock, Finish, Middle, SceneFrame, Stage } from '@/components/scene';
import { Shape } from '@/components/shapes';
import { Text } from '@/components/text';
import { ToolGrid } from '@/components/tool-grid';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { close, closeAll } from '@/lib/nav';
import { count } from '@/lib/pulse';
import { track, trackSos } from '@/lib/events';
import { setupKeep } from '@/lib/setup-keep';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, NightContext, useSkyTheme, useTheme } from '@/lib/theme';
import { useFuture } from '@/lib/future';

/* the screenshot studio (EXPO_PUBLIC_SHOTS=1, dev only) can open SOS on its finish, a ride that passed (?won=1) */
const SHOTS = process.env.EXPO_PUBLIC_SHOTS === '1';
const SHOT_WON: Rode = { key: '2026-10-16', id: 'shot', mins: 8, moves: ['breathe', 'move', 'ground'], gain: 15, sos: true };

export default function Sos() {
  const { snap, tk, now, update, apply, ready } = useStore();
  /* late at night the screens go dark */
  const night = urNight(new Date(now).getHours());
  const sky = night ? 'night' : 'violet';
  const c = useSkyTheme(sky);
  const sos = useSos();
  const st = useCareSettings();
  const future = useFuture();
  const { practice: pq, won: wq, setup: sq } = useLocalSearchParams<{ practice?: string; won?: string; setup?: string }>();
  const [practice] = useState(() => pq === '1');
  /* from setup, the practice is one move and one press of the arrow, then back (the owner, November 13, 2026: "it takes to long
     just make it more obvious they have to press the down button and only make them press it once") */
  const quick = practice && sq === '1';
  const practiceN = quick ? 1 : PRACTICE_N;
  /* a practice ride is not counted as an SOS */
  useEffect(() => {
    if (practice) return;
    count('sos');
    track('sos_open', { from: 'other' });
  }, [practice]);
  const g = useMemo(() => gameCompute(snap.days, st, snap.reviews, tk), [snap, st, tk]);
  /* before setup, help comes first and the setup comes right after (components/welcome.tsx) */
  useState(() => {
    if (!snap.settings) setupKeep.shut = false;
  });

  /* the ride: every move shown in this SOS, oldest first; the last one is showing */
  const [seq, setSeq] = useState<string[]>([]);
  /* swiped down: how many moves back from the newest one the ride is showing */
  const [back, setBack] = useState(0);
  /* the page mostly in view while a swipe glides, so the name under it changes at once, not when it lands */
  const [near, setNear] = useState<number | null>(null);
  const [won, setWon] = useState<Rode | null>(() => (SHOTS && wq === '1' ? SHOT_WON : null));
  const [more, setMore] = useState(false);
  /* More, one step in: every other tool (the X there goes back to the four; back from a tool picked there, it opens there) */
  const [all, setAll] = useState(false);
  const [sci, setSci] = useState(false);
  /* "How is it now?" after a tool, answered Better: It passed is the next step */
  const [better, setBetter] = useState(false);
  /* the move a feeling just named points to: it comes next */
  const lead = useRef<string | null>(null);

  /* the ride only runs while SOS is in front (not under a tool) */
  const [front, setFront] = useState(true);
  /* SOS opened first (a notification or a bookmark) stays under what it hands on to: once that ends the SOS and closes,
     SOS comes back into view with nothing open, so it closes too */
  const began = useRef(false);
  const open = useRef(false);
  open.current = practice || !!sos.ur || !!won;
  if (sos.ur) began.current = true;
  useFocusEffect(
    useCallback(() => {
      setFront(true);
      if (began.current && !open.current) closeAll();
      return () => setFront(false);
    }, []),
  );
  /* a new SOS each time the screen opens, ended when it is dismissed (a practice ride is never an SOS) */
  useEffect(() => {
    if (practice) return;
    if (!sos.ur) sos.begin(g.pts);
    return () => sos.end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* the proof over the first breath (core sosProof): how many times this person has ridden one out before this SOS. None on a
     first one, and none in a practice ride. Taken once, as soon as the log has loaded */
  const proofAt = useRef<string | null | undefined>(undefined);
  if (proofAt.current === undefined && (ready || practice)) proofAt.current = practice ? null : sosProof(snap.days, tk);
  const proof = proofAt.current ?? null;
  const [pu, setPu] = useState<UrState>(() => newUrge(Date.now(), 0));
  const ur = practice ? pu : sos.ur;
  const setUr = practice ? setPu : sos.set;

  /* My reasons is a move only when there are words of your own (a note or a reason) */
  const words = !!(snap.settings && urFromYou(st, 0));
  /* Future you: a note from a good day comes right after the first breath (core ride.ts RIDE_FUTURE); not in a practice ride */
  const hasFuture = !practice && future.notes.length > 0;
  /* It is written, for people who said faith plays a part (core written.ts) */
  const faith = godOn(st);
  const can = useMemo(() => ({ words, faith, future: hasFuture, object: !practice }), [words, faith, hasFuture, practice]);
  const moveName = (x: string) => (x === 'written' ? writtenWords(faithVoice(st) || 'plain').name : MOVE_NAME[x] || urTool(x)?.name || x);
  /* the first move, once there is an urge: always the sun */
  useEffect(() => {
    if (!ur || seq.length) return;
    setSeq([rideNext(ur, snap.days, st, tk, Date.now(), sos.mem, can, [])]);
  }, [ur, seq.length, snap.days, st, tk, sos.mem, can]);

  /* the move waiting below the newest one, picked once per page so it holds still while it is swiped up into view (a
     practice ride ends after its few moves) */
  const peek = useMemo(
    () =>
      !ur || !seq.length ? null : practice && seq.length >= practiceN ? 'end' : rideNext(ur, snap.days, st, tk, Date.now(), sos.mem, can, seq, lead.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seq, can],
  );

  /* back from a tool's X: the tools open again, to pick another (docs/design-standards.md, "The X goes one step back") */
  useEffect(() => {
    if (!front || !ur || ur.step !== 'tools') return;
    setUr({ ...ur, step: 'now' });
    setMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [front, ur?.step]);

  const tags = useMemo(() => urTags(snap.days, st, tk, sos.mem), [snap.days, st, tk, sos.mem]);
  /* how it felt after the last slips, in their own record (core slipFeltLine), for the hour after: never in a practice
     ride, and never in the first 30 seconds */
  const feltLine = useMemo(() => (practice ? null : slipFeltLine(snap.days)), [practice, snap.days]);

  const level = Math.max(1, g.level.n);
  const title = practice ? 'Practice' : 'SOS';

  if (won) return <RodeOut won={won} night={night} level={level} />;
  if (practice && seq.length > practiceN) return <PracticeDone sky={sky} level={level} setup={sq === '1'} />;
  if (!ur || !seq.length)
    return (
      <SceneFrame title={title} sky={sky} onClose={close}>
        {null}
      </SceneFrame>
    );

  /* It passed (in the corner, any time), or I slipped (under More): every move done since the last answer goes into the
     entry's rounds */
  const save = (v: 'rode' | 'slipped') => {
    const a: UrState = urMark(ur, v === 'rode' ? 'p' : 'x');
    const e = urEntry(a, v, st, Date.now());
    let id = '';
    let gain = 0;
    update((s) => {
      const r = addEvent(s.days, e.key, v, e.time, e.fields);
      id = r.id;
      if (s.settings) gain = gameCompute(r.days, s.settings, s.reviews, tk).pts - gameCompute(s.days, s.settings, s.reviews, tk).pts;
      return { ...s, days: r.days };
    });
    sos.setMem((m) => ({ ...(v === 'rode' ? urWon(m, a) : m), last: e.last }));
    count(v === 'rode' ? 'urge_logged' : 'slip_logged');
    if (!practice) count(v === 'rode' ? 'sos_rode' : 'sos_slip');
    if (!practice) trackSos(v, e.fields);
    setMore(false);
    if (v === 'slipped') {
      sos.end();
      buzz('save');
      router.replace({
        pathname: '/log',
        params: {
          date: e.key,
          evId: id,
          outcome: v,
          step: 'slHold',
          from: 'urge',
          pts0: String(a.p0),
          m: String(e.mins),
          night: night ? '1' : '',
        },
      });
      return;
    }
    setWon({ key: e.key, id, mins: e.mins, moves: a.used.filter((x, i, l) => l.indexOf(x) === i), gain, sos: true });
    sos.end();
  };

  /* any tool, from More: it opens over SOS, and the ride goes on where it was when the tool is done */
  const pickTool = (id: string) => {
    if (!urTool(id)) return;
    setMore(false);
    buzz('tap');
    router.push({ pathname: '/tool/[id]', params: { id } });
  };

  /* ---------- after a tool: how is it now? ---------- */
  if (!practice && ur.step === 'after') {
    const last = ur.used[ur.used.length - 1] || '';
    const rec = urEvidence(snap.days);
    return (
      <SceneFrame title={title} sky={sky} onClose={close}>
        <Stage key={better ? 'better' : 'ask'} dir={better ? 1 : 0}>
          {better ? (
            <>
              <T v="title" style={s.c} accessibilityRole="header">
                That is the urge easing.
              </T>
              <T style={s.c}>When it has passed, say so. Each one you wait out makes the next one easier.</T>
              <Middle>
                <Shape kind="cookie12" size={150} color={c.mintSoft}>
                  <View>
                    <Icon name="wave" size={60} color={c.mintText} />
                  </View>
                </Shape>
              </Middle>
              <Dock>
                <Button label="It passed" onPress={() => save('rode')} />
                <View style={s.center}>
                  <Link
                    label="Keep going"
                    tone="muted"
                    onPress={() => {
                      buzz('tap');
                      setBetter(false);
                      setUr({ ...ur, step: 'now' });
                    }}
                  />
                </View>
              </Dock>
            </>
          ) : (
            <>
              <T v="eyebrow" tone="muted" style={s.c}>
                {moveName(last) + ', done'}
              </T>
              <T v="title" style={s.c} accessibilityRole="header">
                How is it now?
              </T>
              <T tone="muted" style={s.c}>
                {rec.n
                  ? 'You have ridden out ' + rec.n + (rec.n === 1 ? ' urge' : ' urges') + (rec.med ? '. Yours usually pass in about ' + rec.med + ' min.' : '.')
                  : 'Urges rise, peak and pass.'}
              </T>
              <Middle>
                <Shape kind="cookie9" size={150} color={moveTint(c, last) + '33'}>
                  <View>
                    <Icon name={MOVE_ICON[last] || urTool(last)?.ic || 'check'} size={60} color={c.ink} />
                  </View>
                </Shape>
              </Middle>
              <Dock>
                <BigOption
                  tone="mint"
                  icon="wave"
                  title="Better"
                  sub="It is easing."
                  onPress={() => {
                    buzz('tap');
                    setBetter(true);
                  }}
                />
                <BigOption
                  tone="sun"
                  icon="timer"
                  title="Still strong"
                  sub="Pick another tool."
                  onPress={() => {
                    buzz('tap');
                    setUr({ ...urMark(ur, 's'), step: 'now' });
                    setMore(true);
                  }}
                />
              </Dock>
            </>
          )}
        </Stage>
      </SceneFrame>
    );
  }

  /* ---------- the ride: one move after another, until it passes ---------- */
  const at = Math.max(0, seq.length - 1 - back);
  const id = seq[at];
  const Move = MOVES[id] || MOVES.breathe;
  const n = seq.length;
  /* done: it counts as used; passed over with Next: it comes round a little later from now on (sos.ts urNote). Swiped back
     to an earlier move, Next goes forward again through the ones already shown before it asks for a new one. */
  const next = (done: boolean) => {
    const u = done ? { ...ur, used: ur.used.concat(id) } : ur;
    if (done) setUr(u);
    else if (!practice && !back) sos.setMem((m) => urNote(m, id, null));
    buzz('tap');
    if (back) return setBack(back - 1);
    if (practice && n >= practiceN) return setSeq(seq.concat('end'));
    const nx = peek && peek !== 'end' && !lead.current ? peek : rideNext(u, snap.days, st, tk, Date.now(), sos.mem, can, seq, lead.current);
    lead.current = null;
    setSeq(seq.concat(nx));
  };
  /* swiped up: the next move, and one more swipe learned (until then the page shows how, core UrMem.swiped) */
  const swiped = Number(sos.mem.swiped) || 0;
  const hint = swiped < 3;
  /* landed on page i by a swipe: down to one before, or up to the next (one more swipe learned) */
  const landed = (i: number) => {
    if (i < at) {
      buzz('tap');
      return setBack(n - 1 - i);
    }
    if (swiped < 3) sos.setMem((m) => ({ ...m, swiped: Math.min(3, (Number(m.swiped) || 0) + 1) }));
    next(false);
  };
  /* the pages: every move shown so far, and the one waiting below */
  const pages = peek ? seq.concat(peek) : seq;
  const live = front && !more && !sci;
  /* a ride move picked from More (It is written): it comes next, now */
  const jump = (mv: string) => {
    setMore(false);
    buzz('tap');
    setBack(0);
    if (seq[seq.length - 1] !== mv) setSeq(seq.concat(mv));
  };
  /* the heart: this one helps. It comes round sooner, in this SOS and the next ones (sos.ts urRank) */
  const liked = urLikeOf(st, id) > 0;
  const like = () => {
    apply({ st: rateUrTool(st, id, liked ? -1 : 1) });
    buzz(liked ? 'tap' : 'save');
  };
  const top = practice ? null : (
    <View style={s.topR}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More: Walk it through, step away, text someone, every tool, or I slipped"
        onPress={() => {
          setAll(false);
          setMore(true);
          buzz('tap');
        }}
        hitSlop={6}
        style={({ pressed }) => [s.moreB, { backgroundColor: c.scBtn, opacity: pressed ? 0.7 : 1 }]}>
        <Icon name="more" size={20} color={c.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="It passed. Save it."
        onPress={() => save('rode')}
        hitSlop={6}
        style={({ pressed }) => [s.passed, { backgroundColor: c.mint, opacity: pressed ? 0.85 : 1 }]}>
        <Icon name="check" size={16} color={night ? '#0B3B2E' : '#FFFFFF'} />
        <Text style={[s.passedT, { color: night ? '#0B3B2E' : '#FFFFFF' }]}>It passed</Text>
      </Pressable>
    </View>
  );
  /* four big choices, named as Today names them (the review of November 12, 2026): Walk it through, the two that take a
     person out of it, and Go to bed at night (by day, Move: nothing sends a person to bed in the day). Every other tool is one
     row away, and none of these four is listed there again. */
  const big: [string, string, string][] = [
    ['trail', 'compass', 'Walk it through'],
    ['pause', 'timer', 'Step away 10 minutes'],
    ['message', 'chat', 'Text someone'],
    night ? ['bed', 'moon', 'Go to bed'] : ['move', 'bolt', 'Move for 2 minutes'],
  ];
  return (
    <SceneFrame title={title} sky={sky} onClose={close} topRight={top} fixed>
      <View style={s.ride}>
        <RidePager
          count={pages.length}
          at={at}
          hint={hint && at >= 1}
          on={live}
          onLand={landed}
          onNear={setNear}
          render={(i) => {
            if (pages[i] === 'end') return null;
            /* every page keeps one copy as it comes into view and leaves it (one key), so landing never swaps it for a fresh
               one; the page above and below is held still (nothing in it runs, speaks or buzzes) until it is landed on */
            const here = i === at;
            const M = here ? Move : MOVES[pages[i]] || MOVES.breathe;
            return (
              <View
                key={'p' + i}
                style={s.page}
                pointerEvents={here ? 'auto' : 'none'}
                importantForAccessibility={here ? 'auto' : 'no-hide-descendants'}
                accessibilityElementsHidden={!here}>
                <M
                  on={here && live}
                  onDone={here ? () => next(true) : () => undefined}
                  onFeel={
                    here
                      ? (f) => {
                          /* a feeling names the trigger only when it plainly is one (core feelTrigOf: never shame as stress) */
                          const trig = f.trig ? feelTrigOf(famOfWord(f.w)) : null;
                          if (trig && !ur.trigger) setUr({ ...ur, trigger: trig });
                          lead.current = f.lead && RIDE_MOVES.indexOf(f.lead) >= 0 ? f.lead : null;
                        }
                      : () => undefined
                  }
                  onTool={here ? pickTool : () => undefined}
                  felt={here && feltLine && Date.now() - ur.t0 >= FELT_AFTER ? feltLine : null}
                  level={level}
                />
              </View>
            );
          }}
        />
        {proof && at === 0 && seq.length <= 1 ? <ProofFade text={proof} color={c.muted} /> : null}
        {/* the name and Why it works low on the left, like a caption; the heart and Next beside it on the right, in the same slim row */}
        <View style={s.foot} pointerEvents="box-none">
          <Pressable
            style={s.cap}
            accessibilityRole="button"
            accessibilityLabel={'Move ' + (at + 1) + ': ' + moveName(id) + '. Why it works.'}
            onPress={() => {
              buzz('tap');
              setSci(true);
            }}>
            <Text style={[s.segT, { color: c.ink }]} numberOfLines={1}>
              {moveName(near !== null && pages[near] && pages[near] !== 'end' ? pages[near] : id)}
            </Text>
            <View style={s.why}>
              <Icon name={quick ? 'down' : hint ? 'up' : 'book'} size={quick ? 17 : 13} color={quick ? c.ink : c.muted} />
              <Text style={[s.whyT, quick ? s.quickT : null, { color: quick ? c.ink : c.muted }]}>
                {quick ? 'Now tap the arrow' : hint ? 'Swipe up for the next one' : 'Why it works'}
              </Text>
            </View>
          </Pressable>
          <View style={s.rail}>
            <Bare icon="heart" label={liked ? 'This one helps. Tap to undo.' : 'This one helps'} on={liked} onPress={like} />
            <Bare icon="down" label="Next move" fill loud={hint || quick} onPress={() => next(false)} />
          </View>
        </View>
      </View>
      <ScienceSheet id={id} name={moveName(id)} open={sci} night={night} onClose={() => setSci(false)} />
      <More
        open={more}
        night={night}
        back={all ? () => setAll(false) : null}
        onClose={() => setMore(false)}
        foot={
          <Pressable accessibilityRole="button" onPress={() => save('slipped')} style={s.slip} hitSlop={8}>
            <Icon name="leaf" size={16} color={c.slipText} />
            <Text style={[s.slipT, { color: c.slipText }]}>I slipped. A slip is data, not a reset.</Text>
          </Pressable>
        }>
        {all ? (
          <>
            <Text style={[s.moreH, { color: c.ink }]} accessibilityRole="header">
              Every tool
            </Text>
            <ToolGrid
              days={snap.days}
              tags={tags}
              fresh={false}
              night={night}
              omit={big.map((b) => b[0])}
              onPick={pickTool}
              lead={
                faith
                  ? {
                      id: 'written',
                      name: moveName('written'),
                      desc: (faithVoice(st) || 'plain') === 'plain' ? 'Say no, and stand firm' : 'Answer it like He did',
                      ic: 'shield',
                      tone: 'sun',
                      group: 'Stand on faith',
                    }
                  : undefined
              }
              onLead={jump}
            />
          </>
        ) : (
          <>
            <View style={s.bigGrid}>
              {big.map(([bid, ic, label]) => (
                <Pressable
                  key={bid}
                  accessibilityRole="button"
                  onPress={() => {
                    if (bid !== 'trail') return pickTool(bid);
                    setMore(false);
                    buzz('tap');
                    router.push('/trail?from=sos' as '/trail');
                  }}
                  style={({ pressed }) => [s.bigB, { backgroundColor: c.bg, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                  <Icon name={ic} size={26} color={c.accentText} />
                  <Text style={[s.bigT, { color: c.ink }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                buzz('tap');
                setAll(true);
              }}
              style={({ pressed }) => [s.allRow, { opacity: pressed ? 0.7 : 1 }]}>
              <Icon name="dots" size={20} color={c.ink} />
              <Text style={[s.allT, { color: c.ink }]}>Every tool</Text>
              <Icon name="next" size={18} color={c.muted} />
            </Pressable>
          </>
        )}
      </More>
    </SceneFrame>
  );
}

/** More: a sheet over the ride, with four big choices, one row for every other tool, and I slipped pinned under them, in
    reach without scrolling. It slides up from the bottom; the ride pauses under it. One step in (every tool), the X and the
    back gesture go back to the four. */
function More({
  open,
  night,
  back,
  onClose,
  foot,
  children,
}: {
  open: boolean;
  night: boolean;
  back: (() => void) | null;
  onClose: () => void;
  foot: ReactNode;
  children: ReactNode;
}) {
  const c = useSkyTheme(night ? 'night' : 'violet');
  const inset = useSafeAreaInsets();
  const x = back || onClose;
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={x}>
      <NightContext.Provider value={night}>
        <View style={s.moreWrap}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[s.moreSheet, { backgroundColor: c.surface, paddingBottom: inset.bottom + 8 }]}>
            <View style={s.moreTop}>
              <View style={[s.grab, { backgroundColor: c.line }]} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={back ? 'Back' : 'Close'}
                onPress={x}
                hitSlop={8}
                style={[s.moreX, { backgroundColor: c.bg }]}>
                <Icon name={back ? 'back' : 'x'} size={18} color={c.ink} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }} contentContainerStyle={{ gap: 12 }}>
              {children}
            </ScrollView>
            {foot}
          </View>
        </View>
      </NightContext.Provider>
    </Modal>
  );
}

/* ---------- the end of a practice ride ---------- */
function PracticeDone({ sky, level, setup }: { sky: 'night' | 'violet'; level: number; setup?: boolean }) {
  const { tk, update } = useStore();
  const sos = useSos();
  const done = () => {
    /* a practice ride is a calm move on today's log, like a tool */
    update((s) => {
      if (!s.settings) return s;
      const day = changeDay(s.days[tk], tk, (d) => {
        const p = d.p || blankP();
        p.c = Math.min(50, p.c + 1);
        if (p.tl.indexOf('breathe') < 0) p.tl.push('breathe');
        d.p = p;
      });
      return { ...s, days: withDay(s.days, tk, day) };
    });
    sos.setMem((m) => ({ ...m, prac: (typeof m.prac === 'number' ? m.prac : 0) + 1 }));
    buzz('save');
    /* from setup: back to it, where SOS is unlocked (app/setup.tsx) */
    if (setup) {
      setupKeep.sos = true;
      close();
      return;
    }
    closeAll();
  };
  return (
    <SceneFrame title="Practice" sky={sky} onClose={close}>
      <Finish
        level={level}
        size={170}
        title={setup ? 'You just used SOS.' : 'Practice done.'}
        text={
          setup
            ? 'When an urge comes, it starts the same way: the sun, then a move at a time until it passes.'
            : 'Run it while calm, and it runs itself when it counts. It always starts with the sun.'
        }
      />
      <Dock>
        <Button label={setup ? 'Next' : 'Done'} onPress={done} />
      </Dock>
    </SceneFrame>
  );
}

/** a bare icon in the ride's rail, like a feed's: no button around it; `on` colors it (the heart, once this move helps) */
function Bare({
  icon,
  label,
  onPress,
  on,
  fill,
  loud,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  on?: boolean;
  /** a filled round, easy to see (Next) */
  fill?: boolean;
  /** bob down, toward the next move waiting below (while the ride is new) */
  loud?: boolean;
}) {
  const c = useTheme();
  const still = useReducedMotion();
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = loud && !still ? withRepeat(withSequence(withTiming(5, { duration: 520 }), withTiming(0, { duration: 520 })), -1) : withTiming(0);
  }, [loud, still, bob]);
  const bobS = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  if (fill)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        hitSlop={16}
        style={({ pressed }) => [s.bare, { opacity: pressed ? 0.8 : 1 }]}>
        <Reanimated.View style={[s.loud, { backgroundColor: c.accent }, bobS]}>
          <Icon name={icon} size={26} color="#FFFFFF" />
        </Reanimated.View>
      </Pressable>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={on === undefined ? undefined : { selected: on }}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [s.bare, { opacity: pressed ? 0.6 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
      <Icon name={icon} size={30} color={on ? c.coral : c.ink} />
    </Pressable>
  );
}

/** the one small line over the first breath: it comes in softly, stays for a few seconds and fades as the breath gets going.
    It is read by a screen reader once. Nothing to tap. */
function ProofFade({ text, color }: { text: string; color: string }) {
  const reduce = useReducedMotion();
  const o = useSharedValue(reduce ? 1 : 0);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    /* under Reduce Motion it simply shows, and leaves after the same time (an animation would jump straight to its end) */
    if (reduce) {
      const t = setTimeout(() => setGone(true), PROOF_MS + 500);
      return () => clearTimeout(t);
    }
    o.value = withSequence(withTiming(1, { duration: 500 }), withDelay(PROOF_MS, withTiming(0, { duration: 1400 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  if (gone) return null;
  return (
    <Reanimated.View style={[s.proof, st]} pointerEvents="none" accessibilityLiveRegion="polite">
      <Text style={[s.proofT, { color }]}>{text}</Text>
    </Reanimated.View>
  );
}
/** where the proof sits: just under the breath's words (components/orb.tsx, WORDS) */
const PROOF_TOP = 112;
/** how long the proof stays before it fades */
const PROOF_MS = 3800;

/** a practice ride is this many moves */
const PRACTICE_N = 3;
/** the record of how it felt after slips is never shown before this far into an SOS */
const FELT_AFTER = 30000;
/** the room each ride page leaves under it, for one slim row: the name on the left, the heart and Next on the right */
const CAP = 58;

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  passed: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingLeft: 11, paddingRight: 13, borderRadius: 18 },
  passedT: { fontFamily: font.bodyBold, fontSize: 15 },
  ride: { flex: 1, alignSelf: 'stretch' },
  /* under the first breath's words, in the open sky over the sun, small and centered */
  proof: { position: 'absolute', left: 0, right: 0, top: PROOF_TOP, alignItems: 'center' },
  proofT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, textAlign: 'center' },
  /* each page leaves room at the bottom for the caption and the rail, so its own answers sit just above them */
  page: { flex: 1, alignItems: 'center', gap: 14, paddingBottom: CAP },
  foot: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  cap: { flex: 1, gap: 3, paddingBottom: 6, minHeight: 44, justifyContent: 'flex-end' },
  rail: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingBottom: 6 },
  bare: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  loud: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  segT: { fontFamily: font.bodySemi, fontSize: 15 },
  why: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  whyT: { fontFamily: font.bodySemi, fontSize: 13 },
  quickT: { fontSize: 15, lineHeight: 20 },
  center: { alignItems: 'center' },
  /* the four big choices: two rows of two, big enough for a shaking thumb */
  bigGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bigB: { flexBasis: '47%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 104, paddingHorizontal: 10, borderRadius: 24 },
  bigT: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22, textAlign: 'center' },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 6 },
  allT: { flex: 1, fontFamily: font.bodySemi, fontSize: 17 },
  topR: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moreB: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moreWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,10,40,0.38)' },
  moreSheet: { maxHeight: '86%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 10 },
  moreTop: { height: 40, alignItems: 'center', justifyContent: 'center' },
  grab: { width: 40, height: 5, borderRadius: 3 },
  moreX: { position: 'absolute', right: 0, top: 2, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moreH: { fontFamily: font.display, fontSize: 17, lineHeight: 22, marginTop: 4 },
  slip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48, marginTop: 4 },
  slipT: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
});
