/* Walk it through (core walk.ts): the way into the trail, and what took the place of Planning a slip (the owner, November 4,
   2026: "I want it to actually teach, walk me through the steps, the science, what's going on … challenge me to write and
   think and explain"). About four minutes on the trail's night sky, like a coach beside the person, in ten parts:

   1 nothing has gone wrong · 2 how strong, and what is already holding it down · 3 notice it in the body, and what an alarm is
   · 4 the line it says, what it really is, and their own answer, written · 5 what it is trying to fix, and the move for it now
   · 6 where they are with it: the flame lands on the place on the map · 7 two minutes riding it, guided with their own words
   while the place's picture acts · 8 explain it back, written, under the chain built from their taps · 9 how strong now
   (still loud walks it again from the line) · 10 it may come back: when, and what they will do, saved as their plan.

   Every answer is said back before the next question, and every fact ends with what changes it. The words sit at the top;
   the choices sit low, under the thumb; a text box and its button stay together near the top (the keyboard). Very strong (8
   and up) puts SOS first. Nothing asks a person to reach out to anyone, and nothing sends them to bed in the day. */
import {
  TRAIL,
  TRAIL_ACT,
  TRAIL_GUIDE_SECS,
  TRAIL_MIRROR,
  TALK_FEEL,
  TALK_WHERE,
  TALK_MOVES,
  WALK_BAD,
  WALK_LINES,
  WALK_NEEDS,
  WALK_SOS,
  WALK_STAGES,
  newTalk,
  saveTalk,
  talkHeld,
  talkHeldTag,
  talkMomentsNow,
  talkMomentTime,
  trailGuide,
  trailKey,
  trailPicture,
  trailSide,
  walkAfter,
  walkAlarm,
  walkChain,
  walkDefuse,
  walkFaith,
  walkHoldBack,
  walkHolds,
  walkLine,
  walkNeed,
  walkNeedMove,
  walkNeedMoves,
  walkOpen,
  walkPlace,
  walkPlanLine,
  walkTalk,
  walkWhere,
  walkWhyNot,
  type TalkMove,
  type TrailGuideOwn,
  type TrailPlace,
  type WalkBad,
  type WalkLine,
  type WalkNeed,
  type WalkStage,
} from '@daybook/core';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { Link } from '@/components/choices';
import { Mirror, useMirror } from '@/components/mirror';
import { Dock, Middle, SceneFrame, Stage } from '@/components/scene';
import { Slider } from '@/components/slider';
import { Text } from '@/components/text';
import { DoorArt, DriftArt, PreviewArt, Rise, SparkArt, StepsArt, TrailMap, TW, WaveLine, Whisper } from '@/components/trail-art';
import { Button } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font } from '@/lib/theme';

/** the parts, in order (the dots count ten: a part can have a second beat) */
type Part = 'open' | 'strength' | 'hold' | 'body' | 'bad' | 'line' | 'truth' | 'answer' | 'need' | 'stage' | 'ride' | 'guide' | 'explain' | 'after' | 'plan';
const DOT: Record<Part, number> = {
  open: 0,
  strength: 1,
  hold: 1,
  body: 2,
  bad: 2,
  line: 3,
  truth: 3,
  answer: 3,
  need: 4,
  stage: 5,
  ride: 6,
  guide: 6,
  explain: 7,
  after: 8,
  plan: 9,
};
const ORDER: Part[] = ['open', 'strength', 'hold', 'body', 'bad', 'line', 'truth', 'answer', 'need', 'stage', 'ride', 'guide', 'explain', 'after', 'plan'];
const CUE_MS = (TRAIL_GUIDE_SECS * 1000) / 8;

export function Walk({
  level,
  night,
  passed,
  onMap,
  onHome,
}: {
  level: number;
  night: boolean;
  /** "It passed", top right: home from anywhere */
  passed: (at: TrailPlace | null) => ReactNode;
  /** "I know where I am": the map, as the trail was */
  onMap: () => void;
  /** the end: an urge ridden out at this place, and home */
  onHome: (at: TrailPlace | null) => void;
}) {
  const { snap, tk, update } = useStore();
  const st = useCareSettings();
  const mem = useSos().mem;
  const faith = useMemo(() => walkFaith(snap.settings), [snap.settings]);
  const open = walkOpen(faith);
  const [part, setPart] = useState<Part>('open');
  const [dir, setDir] = useState<-1 | 1>(1);
  const [round, setRound] = useState(1);
  const go = (p: Part) => {
    buzz('tap');
    setDir(ORDER.indexOf(p) < ORDER.indexOf(part) ? -1 : 1);
    setPart(p);
  };

  /* the answers */
  const [n0, setN0] = useState<number | null>(null);
  const [holds, setHolds] = useState<string[]>([]);
  const [holdOwn, setHoldOwn] = useState('');
  /* the person's own reasons (from setup and More) are offered first, as Planning a slip did */
  const reasons = useMemo(
    () =>
      (st.reasons || [])
        .map((r) => String(r || '').trim())
        .filter(Boolean)
        .slice(0, 2),
    [st.reasons],
  );
  const [mine, setMine] = useState<string[]>([]);
  const holdWords = mine.concat(holdOwn.trim() ? [holdOwn.trim()] : []);
  const [where, setWhere] = useState<string | null>(null);
  const [feel, setFeel] = useState<string | null>(null);
  const [bad, setBad] = useState<WalkBad | null>(null);
  const [line, setLine] = useState<WalkLine | null>(null);
  const [lineOwn, setLineOwn] = useState('');
  const [ownLine, setOwnLine] = useState(false);
  const [answer, setAnswer] = useState('');
  const [need, setNeed] = useState<WalkNeed | null>(null);
  const [stage, setStage] = useState<WalkStage | null>(null);
  const [at, setAt] = useState<TrailPlace | null>(null);
  const [explain, setExplain] = useState('');
  const [n1, setN1] = useState<number | null>(null);
  const [moves, setMoves] = useState<TalkMove[]>([]);
  const [moveOwn, setMoveOwn] = useState('');
  const [mo, setMo] = useState<string | null>(null);

  const L = walkLine(line);
  const N = walkNeed(need);
  const heard = L ? L.line : lineOwn.trim();
  const whyNot = n0 == null ? null : walkWhyNot(n0);
  const whereW = TALK_WHERE.find((x) => x[0] === where)?.[1] || '';
  const feelW = TALK_FEEL.find((x) => x[0] === feel)?.[1] || '';
  const held = useMemo(() => talkHeld(snap.days), [snap.days]);
  const now = Date.now();
  const moments = useMemo(() => talkMomentsNow(now).filter((m) => m[0] !== 'now'), [now]);

  /* the end: the walk saved as a talk-through (a change plan when one was made), then home with an urge ridden out */
  const finish = (withPlan: boolean) => {
    const t = Date.now();
    const talk = walkTalk(newTalk(t), {
      n0,
      n1,
      holds,
      holdOwn: holdWords,
      where,
      feel,
      line,
      lineOwn,
      answer,
      explain,
      need,
      at,
      moves: withPlan ? moves : [],
      moveOwn: withPlan ? moveOwn : '',
      mo: withPlan ? mo : null,
      moAt: withPlan && mo ? talkMomentTime(mo, t) : null,
    });
    if (!withPlan) talk.p = null;
    update((s) => ({ ...s, days: saveTalk(s.days, tk, talk, t) }));
    buzz('save');
    onHome(at);
  };

  const back = () => {
    const i = ORDER.indexOf(part);
    if (i <= 0) return;
    /* a skipped beat is skipped going back too */
    let p = ORDER[i - 1];
    if (p === 'guide') p = 'ride';
    if (p === 'hold' && whyNot == null) p = 'strength';
    if (p === 'truth' && !L) p = 'line';
    setDir(-1);
    setPart(p);
  };

  let words: ReactNode = null;
  let middle: ReactNode = null;
  let dock: ReactNode = null;

  /* ---------- 1. nothing has gone wrong ---------- */
  if (part === 'open') {
    words = (
      <Rise>
        {round > 1 ? <Text style={s.over}>Again, slower</Text> : null}
        <Text style={s.big} accessibilityRole="header">
          {open.title}
        </Text>
        <Text style={s.body}>{open.body}</Text>
        {open.faith ? <Text style={s.faith}>{open.faith}</Text> : null}
      </Rise>
    );
    middle = <StepsArt level={level} off lit />;
    dock = (
      <>
        <Button label="Walk me through it" onPress={() => go('strength')} />
        <View style={s.center}>
          <Link label="I know where I am" tone="muted" onPress={onMap} />
        </View>
      </>
    );
  }

  /* ---------- 2. how strong ---------- */
  if (part === 'strength') {
    const sos = n0 != null && n0 >= WALK_SOS;
    words = (
      <Rise>
        <Text style={s.over}>Notice it first</Text>
        <Text style={s.title} accessibilityRole="header">
          How strong is it right now?
        </Text>
        <Text style={s.body}>0 is nothing, 10 is the strongest it has ever been.</Text>
      </Rise>
    );
    middle = <Num n={n0} />;
    dock = (
      <>
        <Slider label="How strong it is" value={n0} lo="nothing" hi="the strongest" readout={false} onChange={setN0} />
        {sos ? (
          <>
            <Text style={s.note}>At {n0}, start with SOS. It is built for this.</Text>
            <Button
              label="Open SOS"
              onPress={() => {
                buzz('tap');
                router.replace('/sos');
              }}
            />
            <View style={s.center}>
              <Link label="Walk it here instead" tone="muted" onPress={() => go(whyNot == null ? 'body' : 'hold')} />
            </View>
          </>
        ) : (
          <Button label="Next" disabled={n0 == null} onPress={() => go(whyNot == null ? 'body' : 'hold')} />
        )}
      </>
    );
  }

  /* ---------- 2b. why a 6, and not a 9? ---------- */
  if (part === 'hold' && n0 != null && whyNot != null) {
    const any = holds.length > 0 || holdWords.length > 0;
    words = (
      <Rise key={any ? 'b' : 'q'}>
        <Text style={s.over}>{'You said ' + n0}</Text>
        <Text style={s.title} accessibilityRole="header">
          {any ? walkHoldBack(n0, holds, holdWords) : 'Why a ' + n0 + ', and not a ' + whyNot + '?'}
        </Text>
        {any ? null : <Text style={s.body}>Something is already holding it down. What is it?</Text>}
      </Rise>
    );
    middle = <Num n={n0} small />;
    dock = (
      <>
        {reasons.length ? (
          <Chips
            label="Your reasons"
            multi
            opts={reasons.map((r) => ({ id: r, label: r }))}
            on={mine}
            onPick={(r) => setMine((l) => (l.indexOf(r) >= 0 ? l.filter((x) => x !== r) : l.concat(r)))}
          />
        ) : null}
        <Chips
          label="What is holding it down"
          multi
          opts={walkHolds(faith)
            .filter(([id]) => !(id === 'reasons' && reasons.length))
            .map(([id, w]) => ({ id, label: w }))}
          on={holds}
          onPick={(id) => setHolds((h) => (h.indexOf(id) >= 0 ? h.filter((x) => x !== id) : h.concat(id)))}
        />
        <OwnBox value={holdOwn} onChange={setHoldOwn} placeholder="Or in your words" />
        <Button label="Next" onPress={() => go('body')} />
      </>
    );
  }

  /* ---------- 3. notice it in the body ---------- */
  if (part === 'body') {
    words = (
      <Rise>
        <Text style={s.over}>Notice it</Text>
        <Text style={s.title} accessibilityRole="header">
          Where do you feel it, and what is it like?
        </Text>
        <Text style={s.body}>Look at it the way you would look at weather. Curious, not scared.</Text>
      </Rise>
    );
    dock = (
      <>
        <Text style={s.ask}>Where</Text>
        <Chips
          label="Where you feel it"
          opts={TALK_WHERE.map(([id, w]) => ({ id, label: w }))}
          on={where ? [where] : []}
          onPick={(x) => setWhere(x === where ? null : x)}
        />
        <Text style={s.ask}>What it is like</Text>
        <Chips
          label="What it is like"
          opts={TALK_FEEL.map(([id, w]) => ({ id, label: w }))}
          on={feel ? [feel] : []}
          onPick={(x) => setFeel(x === feel ? null : x)}
        />
        <Button label="Next" onPress={() => go('bad')} />
      </>
    );
  }

  /* ---------- 3b. what is so bad about that? and what an alarm is ---------- */
  if (part === 'bad') {
    const B = WALK_BAD.find((x) => x[0] === bad);
    words = B ? (
      <Rise key="a">
        <Text style={s.over}>What it really is</Text>
        <Text style={s.title} accessibilityRole="header">
          {B[2]}
        </Text>
        <Text style={s.body}>{walkAlarm(whereW, feelW)}</Text>
      </Rise>
    ) : (
      <Rise key="q">
        <Text style={s.over}>{[feelW, whereW && 'in your ' + whereW.toLowerCase()].filter(Boolean).join(' ') || 'That feeling'}</Text>
        <Text style={s.title} accessibilityRole="header">
          What is so bad about that feeling?
        </Text>
        <Text style={s.body}>Not the urge. Just the feeling, right now.</Text>
      </Rise>
    );
    middle = B ? <WaveOnce /> : null;
    dock = B ? (
      <Button label="Next" onPress={() => go('line')} />
    ) : (
      <Chips label="What is so bad about it" opts={WALK_BAD.map(([id, w]) => ({ id, label: w }))} on={[]} onPick={(x) => setBad(x)} />
    );
  }

  /* ---------- 4. the line it says ---------- */
  if (part === 'line') {
    words = (
      <Rise key={ownLine ? 'o' : 'l'}>
        <Text style={s.over}>{round > 1 ? 'What brought it back?' : 'Listen to it'}</Text>
        <Text style={s.title} accessibilityRole="header">
          What is it telling you?
        </Text>
        {ownLine ? (
          <>
            <TextInput
              accessibilityLabel="What it is telling you, in its words"
              autoFocus
              multiline
              maxLength={80}
              defaultValue={lineOwn}
              onChangeText={setLineOwn}
              placeholder="The exact words it uses"
              placeholderTextColor={TW.muted}
              style={s.box}
            />
            <View style={s.write}>
              <Button label="Next" disabled={!lineOwn.trim()} onPress={() => go('answer')} />
            </View>
          </>
        ) : (
          <Text style={s.body}>Every urge has a line. Pick the one closest to what you hear.</Text>
        )}
      </Rise>
    );
    dock = ownLine ? null : (
      <>
        <Chips
          label="What it is telling you"
          opts={WALK_LINES.map((x) => ({ id: x.id, label: x.line }))}
          on={line ? [line] : []}
          onPick={(x) => {
            setLine(x);
            setLineOwn('');
            go('truth');
          }}
        />
        <View style={s.center}>
          <Link
            label="It says something else"
            tone="muted"
            onPress={() => {
              setLine(null);
              setOwnLine(true);
            }}
          />
        </View>
      </>
    );
  }

  /* ---------- 4b. what that line really is ---------- */
  if (part === 'truth' && L) {
    words = (
      <Rise>
        <Whisper text={L.line} />
        <Text style={[s.body, s.gapT]}>{L.fact}</Text>
        <Text style={s.over2}>Say it this way, once</Text>
        <Text style={s.say}>{walkDefuse(L.line)}</Text>
      </Rise>
    );
    dock = <Button label="Now answer it" onPress={() => go('answer')} />;
  }

  /* ---------- 4c. their own answer, written ---------- */
  if (part === 'answer') {
    words = (
      <Rise>
        <Text style={s.over}>{'It says: “' + (heard || 'I want it').replace(/[.!]+$/, '') + '.”'}</Text>
        <Text style={s.title} accessibilityRole="header">
          What is true instead? Answer it in your words.
        </Text>
        <TextInput
          accessibilityLabel="Your answer to it"
          autoFocus
          multiline
          maxLength={160}
          defaultValue={answer}
          onChangeText={setAnswer}
          placeholder={L ? 'Like: ' + L.answer : 'Like: I know where this goes, and I am going somewhere else.'}
          placeholderTextColor={TW.muted}
          style={s.box}
        />
        <View style={s.write}>
          <Button label="Next" disabled={!answer.trim()} onPress={() => go('need')} />
          {L ? (
            <View style={s.center}>
              <Link
                label="Use that answer"
                tone="muted"
                onPress={() => {
                  setAnswer(L.answer);
                  go('need');
                }}
              />
            </View>
          ) : null}
        </View>
      </Rise>
    );
  }

  /* ---------- 5. what it is trying to fix ---------- */
  if (part === 'need') {
    words = N ? (
      <Rise key="a">
        <Text style={s.over}>{N.label === 'Nothing, just habit' ? 'Just habit' : N.label + ', underneath'}</Text>
        <Text style={s.body2}>{N.fact}</Text>
        <Text style={s.over2}>Do this now</Text>
        <Text style={s.say}>{walkNeedMove(N, night)}</Text>
      </Rise>
    ) : (
      <Rise key="q">
        <Text style={s.over}>Underneath</Text>
        <Text style={s.title} accessibilityRole="header">
          What is it trying to fix?
        </Text>
        <Text style={s.body}>An urge is usually a fast fix for something else. What were you feeling before it came?</Text>
      </Rise>
    );
    dock = N ? (
      <>
        <Button label="I did it" onPress={() => go('stage')} />
        <View style={s.center}>
          <Link label="Pick something else" tone="muted" onPress={() => setNeed(null)} />
        </View>
      </>
    ) : (
      <Chips label="What it is trying to fix" opts={WALK_NEEDS.map((x) => ({ id: x.id, label: x.label }))} on={[]} onPick={(x) => setNeed(x)} />
    );
  }

  /* ---------- 6. where it is: the place, as a result ---------- */
  if (part === 'stage') {
    const W = at ? walkWhere(at) : null;
    words = W ? (
      <Rise key={at!}>
        <Text style={s.over}>{TRAIL[at!].means}</Text>
        <Text style={s.title} accessibilityRole="header">
          {W.title}
        </Text>
        <Text style={s.body}>{W.body}</Text>
      </Rise>
    ) : (
      <Rise key="q">
        <Text style={s.over}>Find your place</Text>
        <Text style={s.title} accessibilityRole="header">
          Where are you with it?
        </Text>
      </Rise>
    );
    middle = at ? (
      <View style={s.mapBox}>
        <TrailMap at={at} level={level} onPick={setAt} />
      </View>
    ) : null;
    dock = at ? (
      <>
        <Button label="Ride it out" onPress={() => go('ride')} />
        <View style={s.center}>
          <Link label="That is not quite it" tone="muted" onPress={() => setAt(null)} />
        </View>
      </>
    ) : (
      <Chips
        label="Where you are with it"
        opts={WALK_STAGES.map(([id, w]) => ({ id, label: w }))}
        on={stage ? [stage] : []}
        onPick={(x) => {
          buzz('lit');
          setStage(x);
          setAt(walkPlace(x, need));
        }}
      />
    );
  }

  /* ---------- 7. ride it: the place's line, then two minutes guided with their words ---------- */
  if ((part === 'ride' || part === 'guide') && at) {
    return (
      <Ride
        at={at}
        level={level}
        night={night}
        guide={part === 'guide'}
        need={need}
        own={{
          said: heard,
          mine: answer.trim(),
          line: heard,
          answer: answer.trim() || L?.answer,
          key: trailKey(st).t,
          side: trailSide(st, night).t,
          fill: N ? walkNeedMove(N, night) : undefined,
        }}
        picture={trailPicture(mem)}
        passed={passed(at)}
        dot={DOT[part]}
        onBack={back}
        onStart={() => go('guide')}
        onEnd={() => go('explain')}
      />
    );
  }

  /* ---------- 8. explain it back ---------- */
  if (part === 'explain') {
    const chain = walkChain({ n0, where: whereW, feel: feelW, line: heard, need, at });
    words = (
      <Rise>
        <Text style={s.over}>Explain it back</Text>
        <Text style={s.title} accessibilityRole="header">
          In your words: what happened in you just now?
        </Text>
        <TextInput
          accessibilityLabel="What happened in you, in your words"
          autoFocus
          multiline
          maxLength={240}
          defaultValue={explain}
          onChangeText={setExplain}
          placeholder="Like: work stress, then it said I earned it, and I caught it while I was arguing with it."
          placeholderTextColor={TW.muted}
          style={s.box}
        />
        <View style={s.write}>
          <Button label="Next" disabled={!explain.trim()} onPress={() => go('after')} />
        </View>
        <Text style={s.over2}>What you found</Text>
        <View accessible accessibilityLabel={'What you found: ' + chain.join(', then ')}>
          {chain.map((c, i) => (
            <View key={i} style={s.link}>
              <View style={s.linkRail}>
                <View style={[s.linkLine, i === 0 && s.linkNone]} />
                <View style={[s.linkDot, i === chain.length - 1 && { backgroundColor: TW.mint }]} />
                <View style={[s.linkLine, i === chain.length - 1 && s.linkNone]} />
              </View>
              <Text style={s.linkT}>{c}</Text>
            </View>
          ))}
        </View>
      </Rise>
    );
  }

  /* ---------- 9. how strong now ---------- */
  if (part === 'after' && n0 != null) {
    const res = n1 != null ? walkAfter(n0, n1) : null;
    words = (
      <Rise key={res ? 'r' : 'q'}>
        <Text style={s.over}>{'It was ' + n0}</Text>
        <Text style={s.title} accessibilityRole="header">
          {res ? res.line : 'How strong is it now?'}
        </Text>
      </Rise>
    );
    middle = <Num n={n1} was={n0} />;
    dock = (
      <>
        <Slider label="How strong it is now" value={n1} lo="nothing" hi="the strongest" readout={false} onChange={setN1} />
        {res?.again ? (
          <>
            <Button
              label="Walk it through again"
              onPress={() => {
                setRound((r) => r + 1);
                setN0(n1);
                setN1(null);
                setLine(null);
                setOwnLine(false);
                setAnswer('');
                go('line');
              }}
            />
            <View style={s.center}>
              <Link
                label="Open SOS"
                tone="muted"
                onPress={() => {
                  buzz('tap');
                  router.replace('/sos');
                }}
              />
            </View>
          </>
        ) : (
          <Button label="Next" disabled={!res} onPress={() => go('plan')} />
        )}
      </>
    );
  }

  /* ---------- 10. it may come back: the plan ---------- */
  if (part === 'plan') {
    const offered = walkNeedMoves(N, night);
    const ready = !!mo && (moves.length > 0 || !!moveOwn.trim());
    words = (
      <Rise>
        <Text style={s.over}>It may come back</Text>
        <Text style={s.title} accessibilityRole="header">
          {ready
            ? walkPlanLine({ n: N?.need ?? null, m: moves, mo, mx: moveOwn.trim() ? [moveOwn.trim()] : undefined })
            : 'When is it most likely, and what will you do?'}
        </Text>
        {ready ? <Text style={s.body}>Daybook keeps it on Today, and asks in the morning if it held.</Text> : null}
      </Rise>
    );
    dock = (
      <>
        <Text style={s.ask}>When</Text>
        <Chips
          label="When it may come back"
          opts={moments.map(([id, w]) => ({ id, label: w }))}
          on={mo ? [mo] : []}
          onPick={(x) => setMo(x === mo ? null : x)}
        />
        <Text style={s.ask}>Then I will</Text>
        <Chips
          label="What you will do"
          multi
          opts={offered.map((m) => ({ id: m, label: TALK_MOVES[m][0], tag: talkHeldTag(held, m) }))}
          on={moves}
          onPick={(m) => setMoves((l) => (l.indexOf(m) >= 0 ? l.filter((x) => x !== m) : l.concat(m)))}
        />
        <OwnBox value={moveOwn} onChange={setMoveOwn} placeholder="Or in your words" />
        <Button label="Save my plan" disabled={!ready} onPress={() => finish(true)} />
        <View style={s.center}>
          <Link label="No plan this time" tone="muted" onPress={() => finish(false)} />
        </View>
      </>
    );
  }

  return (
    <SceneFrame
      title="Walk it through"
      sky="night"
      onBack={part === 'open' ? null : back}
      onClose={close}
      topRight={part === 'open' ? null : passed(at)}
      dots={{ n: 10, i: DOT[part], label: 'Part ' + (DOT[part] + 1) + ' of 10' }}>
      <Stage key={part + round} dir={dir}>
        <View style={s.words}>{words}</View>
        {middle ? <Middle>{middle}</Middle> : <View style={s.grow} />}
        {dock ? <Dock>{dock}</Dock> : null}
      </Stage>
    </SceneFrame>
  );
}

/* ---------- the ride: the place's picture acts while eight cues speak to what they said ---------- */
function Ride({
  at,
  level,
  night,
  guide,
  need,
  own,
  picture,
  passed,
  dot,
  onBack,
  onStart,
  onEnd,
}: {
  at: TrailPlace;
  level: number;
  night: boolean;
  guide: boolean;
  need: WalkNeed | null;
  own: TrailGuideOwn;
  picture: { t: string; own: boolean };
  passed: ReactNode;
  dot: number;
  onBack: () => void;
  onStart: () => void;
  onEnd: () => void;
}) {
  const P = TRAIL[at];
  const mirror = useMirror();
  const cues = useMemo(() => trailGuide(at, { ...own, night, mirror: mirror.on }), [at, own, night, mirror.on]);
  const [cue, setCue] = useState(-1);
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!guide) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [guide]);
  const next = useCallback(() => {
    if (cue >= cues.length - 1) return onEnd();
    buzz('tick');
    setCue(cue + 1);
    setT0(Date.now());
  }, [cue, cues.length, onEnd]);
  useEffect(() => {
    if (guide && t0 && now - t0 >= CUE_MS) next();
  }, [guide, now, t0, next]);
  /* the camera is asked for once, before the clock starts, so no prompt lands in the middle of a cue */
  const start = async () => {
    await mirror.ask();
    setCue(0);
    setT0(Date.now());
    setNow(Date.now());
    onStart();
  };
  const waveP = guide ? Math.min(1, (Math.max(0, cue) * CUE_MS + Math.max(0, now - t0)) / (TRAIL_GUIDE_SECS * 1000)) : 0;
  const left = Math.max(0, Math.ceil(TRAIL_GUIDE_SECS - waveP * TRAIL_GUIDE_SECS));
  const showMirror = guide && cue === TRAIL_MIRROR && mirror.on;
  return (
    <SceneFrame title={P.name} sky="night" onBack={onBack} onClose={close} topRight={passed} dots={{ n: 10, i: dot, label: 'Part ' + (dot + 1) + ' of 10' }}>
      <Stage key={guide ? 'g' : 'r'} dir={1}>
        <View style={s.words}>
          {guide ? (
            <Rise key={cue}>
              <Text style={s.over}>{Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0')}</Text>
              <Text style={s.cue} accessibilityRole="header" accessibilityLiveRegion="polite">
                {cues[Math.max(0, cue)]}
              </Text>
            </Rise>
          ) : (
            <Rise>
              <Text style={s.over}>Say it once, out loud or in your head</Text>
              <Text style={s.sayL} accessibilityRole="header">
                {'“' + P.say + '”'}
              </Text>
              <Text style={s.body}>Then two minutes. Each line goes on by itself. Just do what it says.</Text>
            </Rise>
          )}
        </View>
        <Middle>
          <View style={[s.art, showMirror && s.hidden]}>
            <Acted at={at} cue={guide ? cue : -1} level={level} need={need} picture={picture} />
          </View>
          {showMirror ? (
            <View style={s.mirror}>
              <Mirror size={220} />
            </View>
          ) : null}
        </Middle>
        <Dock>
          {guide ? (
            <>
              <WaveLine p={waveP} />
              <Button label={cue >= cues.length - 1 ? 'Done' : 'Next'} onPress={next} />
            </>
          ) : (
            <Button label="Start the 2 minutes" onPress={start} />
          )}
        </Dock>
      </Stage>
    </SceneFrame>
  );
}

/** the place's picture, acting on its cue (TRAIL_ACT): the low light fills, the flame walks out, the person's picture slides
    over the glow, the door shuts and locks, the flame takes the side path */
function Acted({ at, cue, level, need, picture }: { at: TrailPlace; cue: number; level: number; need: WalkNeed | null; picture: { t: string; own: boolean } }) {
  const act = TRAIL_ACT[at];
  const on = (i = 0) => cue >= act[i];
  const slide = useRef(new Animated.Value(0)).current;
  const door = useSharedValue(0);
  const over = at === 'preview' && on();
  const shut = at === 'case' && on();
  useEffect(() => {
    Animated.timing(slide, { toValue: over ? 1 : 0, duration: 1400, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
  }, [over, slide]);
  useEffect(() => {
    door.value = withTiming(shut ? 1 : 0, { duration: shut ? 1600 : 400 });
  }, [shut, door]);
  switch (at) {
    case 'drift': {
      const low = need === 'tired' || need === 'lonely' || need === 'angry' ? need : null;
      return <DriftArt low={low} filled={on()} onPick={() => undefined} />;
    }
    case 'spark':
      return <SparkArt out={on()} level={level} />;
    case 'preview':
      return <PreviewArt p={slide} caption={picture.own ? 'Your picture: ' + picture.t : picture.t} />;
    case 'case':
      return <DoorArt h={door} locked={on(1)} />;
    case 'steps':
      return <StepsArt level={level} lit off={on()} />;
  }
}

/** a number from 0 to 10, big, in the open middle */
function Num({ n, small, was }: { n: number | null; small?: boolean; was?: number | null }) {
  const big = <Text style={[s.numT, small && s.numS, n == null && { color: TW.dim }]}>{n == null ? '–' : n}</Text>;
  return (
    <View style={s.num} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {was != null ? (
        <View style={s.numRow}>
          <Text style={[s.numT, s.numWas]}>{was}</Text>
          <Text style={s.numTo}>→</Text>
          {big}
        </View>
      ) : (
        big
      )}
      <Text style={s.numU}>out of 10</Text>
    </View>
  );
}

/** the wave of an urge, drawn once: it rises, peaks and falls while the words say so */
function WaveOnce() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => {
      const q = Math.min(1, (Date.now() - t0) / 4200);
      setP(q);
      if (q >= 1) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, []);
  return <WaveLine p={p} />;
}

/** a wrap of choices in the trail's look: tap one (or several) */
function Chips<K extends string>({
  label,
  opts,
  on,
  onPick,
  multi,
}: {
  label: string;
  opts: { id: K; label: string; tag?: string }[];
  on: string[];
  onPick: (id: K) => void;
  multi?: boolean;
}) {
  return (
    <View style={s.chips} accessibilityRole={multi ? undefined : 'radiogroup'} accessibilityLabel={label}>
      {opts.map((o) => {
        const sel = on.indexOf(o.id) >= 0;
        return (
          <Pressable
            key={o.id}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: sel }}
            accessibilityLabel={o.tag ? o.label + '. ' + o.tag : o.label}
            onPress={() => {
              buzz('tick');
              onPick(o.id);
            }}
            style={({ pressed }) => [s.chip, sel ? s.chipOn : null, { opacity: pressed ? 0.85 : 1 }]}>
            <Text style={[s.chipT, { color: sel ? '#06352A' : TW.ink }]}>{o.label}</Text>
            {o.tag ? <Text style={[s.chipTag, { color: sel ? '#06352A' : TW.mint }]}>{o.tag}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** a short answer in their own words, under the choices */
function OwnBox({ value, onChange, placeholder }: { value: string; onChange: (t: string) => void; placeholder: string }) {
  return (
    <TextInput
      accessibilityLabel={placeholder}
      maxLength={60}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={TW.muted}
      style={s.own}
    />
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center' },
  words: { alignSelf: 'stretch', marginTop: 8 },
  grow: { flex: 1 },
  over: { fontFamily: font.bodySemi, fontSize: 15, color: TW.muted, marginBottom: 8 },
  over2: { fontFamily: font.bodySemi, fontSize: 15, color: TW.sun, marginTop: 18, marginBottom: 6 },
  big: { fontFamily: font.display, fontSize: 34, lineHeight: 41, color: TW.ink },
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 35, color: TW.ink },
  body: { fontFamily: font.body, fontSize: 17, lineHeight: 24, color: TW.muted, marginTop: 10 },
  body2: { fontFamily: font.display, fontSize: 22, lineHeight: 29, color: TW.ink },
  faith: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 24, color: TW.warm, marginTop: 12 },
  gapT: { marginTop: 14, color: TW.ink },
  say: { fontFamily: font.display, fontSize: 22, lineHeight: 29, color: TW.sun },
  sayL: { fontFamily: font.display, fontSize: 34, lineHeight: 41, color: TW.sun },
  cue: { fontFamily: font.display, fontSize: 28, lineHeight: 35, color: TW.ink },
  note: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: TW.warm, textAlign: 'center' },
  ask: { fontFamily: font.bodySemi, fontSize: 15, color: TW.muted },
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
  own: {
    height: 48,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: TW.bubble,
    color: TW.ink,
    fontFamily: font.body,
    fontSize: 17,
  },
  write: { marginTop: 14, gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: TW.bubble, justifyContent: 'center' },
  chipOn: { backgroundColor: TW.mint },
  chipT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  chipTag: { fontFamily: font.body, fontSize: 13, lineHeight: 17 },
  num: { alignItems: 'center' },
  numT: { fontFamily: font.display, fontSize: 96, lineHeight: 104, color: TW.sun },
  numS: { fontSize: 56, lineHeight: 62 },
  numRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  numWas: { fontSize: 56, lineHeight: 62, color: TW.dim },
  numTo: { fontFamily: font.display, fontSize: 34, color: TW.muted },
  numU: { fontFamily: font.bodySemi, fontSize: 15, color: TW.muted },
  mapBox: { alignSelf: 'stretch', alignItems: 'center', marginVertical: -44, transform: [{ scale: 0.8 }] },
  link: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  linkRail: { width: 12, alignItems: 'center' },
  linkLine: { flex: 1, width: 2, backgroundColor: TW.dim },
  linkNone: { backgroundColor: 'transparent' },
  linkDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: TW.sun },
  linkT: { flex: 1, fontFamily: font.body, fontSize: 17, lineHeight: 23, color: TW.ink, paddingVertical: 6 },
  art: { alignSelf: 'stretch', alignItems: 'center' },
  hidden: { opacity: 0 },
  mirror: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
