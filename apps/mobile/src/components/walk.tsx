/* Walk it through (core walk.ts): the way into the trail, and what took the place of Planning a slip (the owner, November 4,
   2026: "I want it to actually teach, walk me through the steps, the science, what's going on … challenge me to write and
   think and explain"). About four minutes on the trail's night sky, like a coach beside the person, in ten parts:

   1 nothing has gone wrong · 2 how strong, and what is already holding it down · 3 notice it in the body, and what an alarm is
   · 4 the line it says, what it really is, and their own answer, written · 5 what it is trying to fix, and the move for it now
   · 6 where they are with it: the flame lands on the place on the map · 7 two minutes riding it, guided with their own words
   while the place's picture acts · 8 explain it back, written, under the chain built from their taps · 9 how strong now
   (still loud walks it again from the line) · 10 it may come back: when, and what they will do, saved as their plan.

   Every answer but the two numbers and the place is optional (the review of November 12, 2026): Next works with nothing
   picked or typed, so it can be walked mid-urge with one thumb, and the boxes do not open the keyboard by themselves. Every
   answer is said back before the next question, and every fact ends with what changes it. The words sit at the top; the
   choices sit low, under the thumb; a text box and its button stay together near the top (the keyboard). Very strong (8
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
  WALK_COACH,
  walkCoach,
  habitOf,
  WALK_SRC,
  WALK_LINES,
  WALK_NEEDS,
  WALK_SOS,
  WALK_STAGES,
  TALK_HARD_MOMENT,
  newTalk,
  riskDay,
  talkHardMoment,
  talkClock,
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
  walkPlanMoves,
  walkPlanCard,
  walkBodyAt,
  walkOpen,
  walkPlace,
  walkTalk,
  walkWhere,
  walkWhyNot,
  type TalkMove,
  type TrailGuideOwn,
  type TrailPlace,
  type WalkBad,
  type WalkBeat,
  type WalkLine,
  type WalkNeed,
  type WalkStage,
  NUDGE_WORDS,
  noneTail,
} from '@daybook/core';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

import { BigFlame } from '@/components/big-flame';
import { Link } from '@/components/choices';
import { Bubble } from '@/components/lesson-flame';
import { Mirror, useMirror } from '@/components/mirror';
import { Dock, Middle, SceneFrame, Stage } from '@/components/scene';
import { Slider } from '@/components/slider';
import { KeepAbove } from '@/components/keyboard';
import { Text, TextInput } from '@/components/text';
import { DoCard, DoorArt, DriftArt, PreviewArt, Rise, SparkArt, StepsArt, TrailMap, TW, WaveLine } from '@/components/trail-art';
import { Button, Icon } from '@/components/ui';
import { Packed } from '@/components/packed';
import { buzz } from '@/lib/feel';
import { NATIVE } from '@/lib/motion';
import { close } from '@/lib/nav';
import { remindersOffered, scheduleTalk } from '@/lib/reminders';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font } from '@/lib/theme';

/** the parts, in order (the dots count ten: a part can have a second beat) */
type Part = 'open' | 'strength' | 'hold' | 'body' | 'bad' | 'line' | 'answer' | 'need' | 'stage' | 'ride' | 'guide' | 'explain' | 'after' | 'plan';
const DOT: Record<Part, number> = {
  open: 0,
  strength: 1,
  hold: 1,
  body: 2,
  bad: 2,
  line: 3,
  answer: 3,
  need: 4,
  stage: 5,
  ride: 6,
  guide: 6,
  explain: 7,
  after: 8,
  plan: 9,
};
const ORDER: Part[] = ['open', 'strength', 'hold', 'body', 'bad', 'line', 'answer', 'need', 'stage', 'ride', 'guide', 'explain', 'after', 'plan'];
const CUE_MS = (TRAIL_GUIDE_SECS * 1000) / 8;

export function Walk({
  level,
  night,
  passed,
  fromSos,
  onMap,
  onHome,
}: {
  level: number;
  night: boolean;
  /** "It passed", top right: home from anywhere */
  passed: (at: TrailPlace | null, first?: () => void) => ReactNode;
  /** opened from SOS: going to SOS goes back to it, instead of opening a second one */
  fromSos?: boolean;
  /** "I know where I am": the map, as the trail was */
  onMap: () => void;
  /** the end: an urge ridden out at this place, and home */
  onHome: (at: TrailPlace | null, n0: number | null) => void;
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
  const holdWords = mine;
  /* writing what holds it down in their own words: the box opens in place of the question */
  const [ownHold, setOwnHold] = useState(false);
  const [holdDraft, setHoldDraft] = useState('');
  /* the first number of the walk: a second round starts from the number after the first, and the record keeps both ends */
  const [first, setFirst] = useState<number | null>(null);
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
  const [ownMove, setOwnMove] = useState(false);
  const [remind, setRemind] = useState(remindersOffered);
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
  /* the person's own hard hours, from the log, while their start is still ahead: the most exact moment there is */
  const hard = useMemo(() => {
    const r = snap.settings ? riskDay(snap.days, snap.settings, tk, now) : null;
    return r ? talkHardMoment(r.a, now) : null;
  }, [snap.days, snap.settings, tk, now]);
  const moAt = mo === TALK_HARD_MOMENT ? hard : mo ? talkMomentTime(mo, now) : null;
  const moNight = mo === TALK_HARD_MOMENT && hard ? new Date(hard).getHours() >= 21 || new Date(hard).getHours() < 5 : night;

  /* the walk saved as a talk-through (a change plan when one was made). "It passed" saves it too, without a plan, once
     there is something to keep. */
  const save = (withPlan: boolean) => {
    const t = Date.now();
    const talk = walkTalk(newTalk(t), {
      n0: first ?? n0,
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
      moAt: withPlan ? moAt : null,
    });
    if (!withPlan) talk.p = null;
    update((s) => ({ ...s, days: saveTalk(s.days, tk, talk, t) }));
  };
  /* the end: saved, then home with an urge ridden out */
  const finish = (withPlan: boolean) => {
    save(withPlan);
    /* the reminder comes at the moment and opens Today, where the plan waits */
    if (withPlan && remind && remindersOffered && moAt) scheduleTalk(moAt, NUDGE_WORDS.talk.change, '/').catch(() => undefined);
    buzz('save');
    onHome(at, first ?? n0);
  };
  const passedNow = (p: TrailPlace | null) => passed(p, n0 != null ? () => save(false) : undefined);
  const toSos = () => {
    buzz('tap');
    if (fromSos && router.canGoBack()) router.back();
    else router.replace('/sos');
  };

  /* on from the number: the first number is kept; at 0 or 10 there is no "why not higher", and nothing from it is kept */
  const toBody = () => {
    if (round === 1) setFirst(n0);
    if (whyNot == null) {
      setHolds([]);
      setMine([]);
      go('body');
    } else go('hold');
  };
  const back = () => {
    /* a box for their own words, open: back closes it, to the chips */
    if (part === 'hold' && ownHold) return setOwnHold(false);
    if (part === 'plan' && ownMove) return setOwnMove(false);
    if (part === 'line' && ownLine) return setOwnLine(false);
    const i = ORDER.indexOf(part);
    if (i <= 0) return;
    /* a skipped beat is skipped going back too */
    let p = ORDER[i - 1];
    if (p === 'guide') p = 'ride';
    if (p === 'hold' && whyNot == null) p = 'strength';
    /* a second round starts at the line: back from it is the number that started the round */
    if (part === 'line' && round > 1) p = 'after';
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
      </Rise>
    );
    middle = <Coach level={level} big say={WALK_COACH.open.say + (open.faith ? '\n\n' + open.faith : '')} beat="open" />;
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
        <Text style={s.title} accessibilityRole="header">
          How strong is it right now?
        </Text>
      </Rise>
    );
    middle = <Num n={n0} />;
    dock = (
      <>
        <Slider label="How strong it is" value={n0} lo="nothing" hi="the strongest" readout={false} onChange={setN0} />
        {sos ? (
          <>
            <Text style={s.note}>At {n0}, start with SOS. It is built for this.</Text>
            <Button label="Open SOS" onPress={toSos} />
            <View style={s.center}>
              <Link label="Walk it here instead" tone="muted" onPress={() => toBody()} />
            </View>
          </>
        ) : (
          <Button label="Next" disabled={n0 == null} onPress={() => toBody()} />
        )}
      </>
    );
  }

  /* ---------- 2b. why a 6, and not a 9? ---------- */
  if (part === 'hold' && n0 != null && whyNot != null) {
    const any = holds.length > 0 || holdWords.length > 0;
    /* their own words, written here, are chips of their own beside their reasons */
    const written = mine.filter((r) => reasons.indexOf(r) < 0);
    const saveOwn = () => {
      const t = holdDraft.trim().replace(/\s+/g, ' ');
      if (t && mine.indexOf(t) < 0) setMine((l) => l.concat(t));
      setHoldDraft('');
      setOwnHold(false);
    };
    if (ownHold) {
      /* the box and its button stay at the top, above the keyboard */
      words = (
        <Rise>
          <Text style={s.over}>{'Why a ' + n0 + ', and not a ' + whyNot + '?'}</Text>
          <Text style={s.title} accessibilityRole="header">
            What is holding it down?
          </Text>
          <TextInput
            accessibilityLabel="What is holding it down, in your words"
            autoFocus
            maxLength={60}
            value={holdDraft}
            onChangeText={setHoldDraft}
            onSubmitEditing={saveOwn}
            returnKeyType="done"
            placeholder="Like: I promised myself"
            placeholderTextColor={TW.muted}
            style={s.box}
          />
          <View style={s.write}>
            <Button label="Add it" disabled={!holdDraft.trim()} onPress={saveOwn} />
          </View>
        </Rise>
      );
      middle = null;
      dock = null;
    } else {
      words = (
        <Rise>
          <Text style={s.title} accessibilityRole="header">
            {'Why a ' + n0 + ', and not a ' + whyNot + '?'}
          </Text>
        </Rise>
      );
      middle = <Coach level={level} say={any ? walkHoldBack(n0, holds, holdWords) : WALK_COACH.hold.say} beat="hold" pulse={holds.length + mine.length} />;
      dock = (
        <>
          {/* the person's reasons, their own words and what else holds it down, as one group, so the rows pack together */}
          <Chips
            label="What is holding it down"
            multi
            opts={reasons
              .concat(written)
              .map((r): { id: string; label: string; own?: boolean } => ({ id: 'r:' + r, label: r }))
              .concat(
                walkHolds(faith)
                  .filter(([id]) => !(id === 'reasons' && reasons.length))
                  .map(([id, w]) => ({ id: id as string, label: w })),
              )
              .concat([{ id: 'own', label: OWN, own: true }])}
            on={mine.map((r) => 'r:' + r).concat(holds)}
            onPick={(id) => {
              if (id === 'own') {
                setOwnHold(true);
              } else if (id.startsWith('r:')) {
                const r = id.slice(2);
                setMine((l) => (l.indexOf(r) >= 0 ? l.filter((x) => x !== r) : l.concat(r)));
              } else {
                setHolds((l) => (l.indexOf(id) >= 0 ? l.filter((x) => x !== id) : l.concat(id)));
              }
            }}
          />
          <Button label="Next" onPress={() => go('body')} />
        </>
      );
    }
  }

  /* ---------- 3. notice it in the body ---------- */
  if (part === 'body') {
    const named = [feelW, walkBodyAt(whereW)].filter(Boolean).join(' ');
    words = (
      <Rise>
        <Text style={s.title} accessibilityRole="header">
          Where is it, and what is it like?
        </Text>
      </Rise>
    );
    middle = (
      <Coach
        level={level}
        say={named ? cap(named) + '. Just notice it. You do not have to do anything about it.' : WALK_COACH.body.say}
        beat="body"
        pulse={(where ? 1 : 0) + (feel ? 1 : 0)}
      />
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

  /* ---------- 3b. what is so bad about that? It is an alarm, and it unlearns ---------- */
  if (part === 'bad') {
    const B = WALK_BAD.find((x) => x[0] === bad);
    words = (
      <Rise>
        <Text style={s.title} accessibilityRole="header">
          What is so bad about that feeling?
        </Text>
      </Rise>
    );
    middle = (
      <Coach
        level={level}
        say={B ? B[2] + ' ' + WALK_COACH.alarm.say : 'Not the urge. Just the feeling, right now.'}
        beat="alarm"
        why={walkAlarm(whereW, feelW)}
        pulse={B ? 1 : 0}>
        {B ? <WaveOnce /> : null}
      </Coach>
    );
    dock = (
      <>
        <Chips label="What is so bad about it" opts={WALK_BAD.map(([id, w]) => ({ id, label: w }))} on={bad ? [bad] : []} onPick={(x) => setBad(x)} />
        <Button label="Next" onPress={() => go('line')} />
      </>
    );
  }

  /* ---------- 4. the line it says, and what it really is ---------- */
  if (part === 'line') {
    words = (
      <Rise key={ownLine ? 'o' : 'l'}>
        {round > 1 ? <Text style={s.over}>Again, slower</Text> : null}
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
              <Button label="Next" onPress={() => go('answer')} />
              <View style={s.center}>
                <Link label="Pick from the list" tone="muted" onPress={() => setOwnLine(false)} />
              </View>
            </View>
          </>
        ) : null}
      </Rise>
    );
    middle = ownLine ? null : (
      <Coach
        level={level}
        say={L ? L.short : 'Every urge has a line. Which one is closest?'}
        beat={L ? undefined : 'defuse'}
        why={L?.fact}
        src={L?.src}
        pulse={line ? 1 : 0}
      />
    );
    dock = ownLine ? null : (
      <>
        <Chips
          label="What it is telling you"
          opts={WALK_LINES.map((x): { id: WalkLine | 'own'; label: string; own?: boolean } => ({ id: x.id, label: x.line })).concat([
            { id: 'own', label: lineOwn.trim() || OWN, own: true },
          ])}
          on={line ? [line] : lineOwn.trim() ? ['own'] : []}
          onPick={(x) => {
            if (x === 'own') {
              setLine(null);
              setOwnLine(true);
              return;
            }
            setLine(x);
            setLineOwn('');
          }}
        />
        <Button label={L ? 'Now answer it' : 'Next'} onPress={() => go('answer')} />
      </>
    );
  }

  /* ---------- 4b. say it the loose way, then answer it in their own words ---------- */
  if (part === 'answer') {
    words = (
      <Rise>
        <Text style={s.over2}>Say it once, like this</Text>
        <Text style={s.say}>{walkDefuse(heard)}</Text>
        <WhyLine beat="defuse" />
        <Text style={[s.title, s.gapT]} accessibilityRole="header">
          Now answer it, in your words.
        </Text>
        <TextInput
          accessibilityLabel="Your answer to it"
          multiline
          maxLength={160}
          defaultValue={answer}
          onChangeText={setAnswer}
          placeholder={L ? 'Like: ' + L.answer : 'Like: I know where this goes, and I am going somewhere else.'}
          placeholderTextColor={TW.muted}
          style={s.box}
        />
        <View style={s.write}>
          <Button label="Next" onPress={() => go('need')} />
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

  /* ---------- 5. what it is trying to fix, and the move for it now ---------- */
  if (part === 'need') {
    words = (
      <Rise>
        <Text style={s.title} accessibilityRole="header">
          What is it trying to fix?
        </Text>
      </Rise>
    );
    middle = (
      <Coach level={level} say={N ? N.short : 'An urge is usually a fast fix for something else. What came before it?'} why={N?.fact} pulse={need ? 1 : 0} />
    );
    dock = (
      <>
        <Chips
          label="What it is trying to fix"
          opts={WALK_NEEDS.map((x) => ({ id: x.id, label: x.label }))}
          on={need ? [need] : []}
          onPick={(x) => {
            setNeed(x);
            if (stage) setAt(walkPlace(stage, x));
          }}
        />
        {N ? <DoCard over="Do this now">{walkNeedMove(N, night)}</DoCard> : null}
        <Button label={N ? 'I did it' : 'Next'} onPress={() => go('stage')} />
      </>
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
    ) : (
      <Coach level={level} say="Each answer is a place on the trail. Pick the one closest to now." />
    );
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
        ordered
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
        passed={passedNow(at)}
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
    /* what they found is the hero: the chain they just walked, link by link, ending on the win, with one Why for the whole of it
       (the owner, November 13, 2026: "fix this it just looks dinky"). Their own words and Next sit low, together, and come up
       above the keyboard as one. */
    words = <Found chain={chain} />;
    middle = <FlameRoom level={level} pulse={1} />;
    dock = (
      <KeepAbove style={s.write}>
        <Text style={s.ask2}>Now in your words: what happened in you just now?</Text>
        <TextInput
          accessibilityLabel="What happened in you, in your words"
          multiline
          maxLength={240}
          defaultValue={explain}
          onChangeText={setExplain}
          placeholder="Like: work stress, then it said I earned it, and I caught it while I was arguing with it."
          placeholderTextColor={TW.muted}
          style={[s.box, s.boxTight]}
        />
        <Button label="Next" onPress={() => go('after')} />
      </KeepAbove>
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
                setExplain('');
                go('line');
              }}
            />
            <View style={s.pair}>
              <Link label="Make a plan and stop" tone="muted" onPress={() => go('plan')} />
              <Link label="Open SOS" tone="muted" onPress={toSos} />
            </View>
          </>
        ) : (
          <Button label="Next" disabled={!res} onPress={() => go('plan')} />
        )}
      </>
    );
  }

  /* ---------- 10. it may come back: when, and what they will do. What has held for them comes first ---------- */
  if (part === 'plan') {
    const offered = walkPlanMoves(N, mo === TALK_HARD_MOMENT ? null : mo, moNight, held);
    const ready = !!mo && (moves.length > 0 || !!moveOwn.trim());
    type Opt = { id: string; label: string; tag?: string };
    const mine: Opt[] = hard ? [{ id: TALK_HARD_MOMENT, label: 'My hard hours', tag: talkClock(hard) }] : [];
    const when: Opt[] = mine.concat(
      moments.map(([id, w]): Opt => {
        const t = talkMomentTime(id, now);
        return { id, label: w, tag: t ? talkClock(t) : undefined };
      }),
    );
    if (ownMove) {
      /* their own move: the box and its button stay at the top, above the keyboard */
      words = (
        <Rise>
          <Text style={s.over}>Then I will</Text>
          <Text style={s.title} accessibilityRole="header">
            What works for you?
          </Text>
          <TextInput
            accessibilityLabel="Your own move"
            autoFocus
            maxLength={60}
            defaultValue={moveOwn}
            onChangeText={setMoveOwn}
            placeholder="Like: play guitar for twenty minutes"
            placeholderTextColor={TW.muted}
            style={s.box}
          />
          <View style={s.write}>
            <Button label="Add it" disabled={!moveOwn.trim()} onPress={() => setOwnMove(false)} />
          </View>
        </Rise>
      );
    } else {
      words = (
        <Rise>
          <Text style={s.over}>It may come back</Text>
          <Text style={s.title} accessibilityRole="header">
            When, and what will you do?
          </Text>
        </Rise>
      );
      /* once ready, the flame says the plan back as an if-then, with their own answer to the line */
      const card = walkPlanCard({ mo, at: moAt, moves, own: moveOwn, line: heard, answer });
      const said =
        card.when +
        ': ' +
        card.then.map((t) => (/^I\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1))).join(', ') +
        '.' +
        (card.says && card.answer ? ' If it says “' + card.says.replace(/[.!?]$/, '') + '”, you answer “' + card.answer.replace(/[.!?]$/, '') + '.”' : '');
      middle = <Coach level={level} say={ready ? said : WALK_COACH.plan.say} beat="plan" pulse={moves.length + (mo ? 1 : 0) + (moveOwn.trim() ? 1 : 0)} />;
      dock = (
        <>
          <Text style={s.ask}>When</Text>
          <Chips
            label="When it may come back"
            ordered
            opts={when}
            on={mo ? [mo] : []}
            onPick={(x) => {
              const nx = x === mo ? null : x;
              setMo(nx);
              const nn = nx === TALK_HARD_MOMENT && hard ? new Date(hard).getHours() >= 21 || new Date(hard).getHours() < 5 : night;
              const ok = walkPlanMoves(N, nx === TALK_HARD_MOMENT ? null : nx, nn, held);
              setMoves((l) => l.filter((m) => ok.indexOf(m) >= 0));
            }}
          />
          <Text style={s.ask}>Then I will</Text>
          <Chips
            label="What you will do"
            multi
            opts={offered
              .map((m): { id: string; label: string; tag?: string; own?: boolean } => ({
                id: m,
                label: TALK_MOVES[m][0],
                tag: talkHeldTag(held, m) || undefined,
              }))
              .concat([{ id: 'own', label: moveOwn.trim() || OWN, own: true }])}
            on={(moves as string[]).concat(moveOwn.trim() ? ['own'] : [])}
            onPick={(m) => {
              if (m === 'own') {
                if (moveOwn.trim()) setMoveOwn('');
                else setOwnMove(true);
                return;
              }
              const k = m as TalkMove;
              setMoves((l) => (l.indexOf(k) >= 0 ? l.filter((x) => x !== k) : l.concat(k)));
            }}
          />
          {remindersOffered && moAt && ready ? (
            <Chips
              label="Reminder"
              multi
              opts={[{ id: 'r', label: 'Remind me at ' + talkClock(moAt) }]}
              on={remind ? ['r'] : []}
              onPick={() => setRemind(!remind)}
            />
          ) : null}
          <Button label="Save my plan" disabled={!ready} onPress={() => finish(true)} />
          <View style={s.center}>
            <Link label="No plan this time" tone="muted" onPress={() => finish(false)} />
          </View>
        </>
      );
    }
  }

  return (
    <SceneFrame
      title="Walk it through"
      sky="night"
      onBack={part === 'open' ? null : back}
      onClose={close}
      topRight={part === 'open' ? null : passedNow(at)}
      dots={{ n: 10, i: DOT[part], label: 'Part ' + (DOT[part] + 1) + ' of 10' }}
      backdrop={<WalkStars lit={DOT[part]} />}>
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
              <Text style={s.body}>{WALK_COACH.ride.say}</Text>
              <WhyLine beat="ride" />
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

/** a wrap of choices in the trail's look: tap one (or several). An option marked own is the person's own answer: a pencil
    and a dashed edge set it apart, it always packs last, and it reads "Write my own" until they have written one. */
function Chips<K extends string>({
  label,
  opts,
  on,
  onPick,
  multi,
  ordered,
}: {
  label: string;
  opts: { id: K; label: string; tag?: string; own?: boolean }[];
  /** the order carries meaning (steps, times of day): keep it, and only wrap */
  ordered?: boolean;
  on: string[];
  onPick: (id: K) => void;
  multi?: boolean;
}) {
  let ownTail = 0;
  while (ownTail < opts.length && opts[opts.length - 1 - ownTail].own) ownTail++;
  const tail = ownTail + noneTail(opts.slice(0, opts.length - ownTail).map((o) => o.label));
  return (
    <Packed last={tail} ordered={ordered} accessibilityRole={multi ? undefined : 'radiogroup'} accessibilityLabel={label}>
      {opts.map((o) => {
        const sel = on.indexOf(o.id) >= 0;
        const ink = sel ? '#06352A' : o.own ? TW.mint : TW.ink;
        return (
          <Pressable
            key={o.id}
            accessibilityRole={o.own && !sel ? 'button' : multi ? 'checkbox' : 'radio'}
            accessibilityState={o.own && !sel ? undefined : { checked: sel }}
            accessibilityLabel={o.tag ? o.label + '. ' + o.tag : o.label}
            onPress={() => {
              buzz('tick');
              onPick(o.id);
            }}
            style={({ pressed }) => [s.chip, o.own && !sel ? s.chipOwn : null, sel ? s.chipOn : null, { opacity: pressed ? 0.85 : 1 }]}>
            {o.own ? (
              <View style={s.ownRow}>
                <Icon name="pencil" size={16} color={ink} />
                <Text style={[s.chipT, s.ownT, { color: ink }]}>{o.label}</Text>
              </View>
            ) : (
              <Text style={[s.chipT, { color: ink }]}>{o.label}</Text>
            )}
            {o.tag ? <Text style={[s.chipTag, { color: sel ? '#06352A' : TW.mint }]}>{o.tag}</Text> : null}
          </Pressable>
        );
      })}
    </Packed>
  );
}

/** the words on a "write my own" chip: theirs once written */
const OWN = 'Write my own';

/** the coach: the person's own flame in the middle, saying one short line in a bubble, as in a lesson. It leaps when an
    answer is picked (pulse). "Why this works" turns the bubble to the reason, with the papers under it, a tap away. */
function Coach({
  level,
  say,
  beat,
  why,
  src,
  pulse = 0,
  big,
  children,
}: {
  level: number;
  say: string;
  /** the teaching beat whose reason and papers "Why this works" opens (WALK_COACH) */
  beat?: WalkBeat;
  /** a reason in place of the beat's own (a line's fact, a need's) */
  why?: string;
  src?: string[];
  pulse?: number;
  big?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  /* the flame takes the room the page leaves it, as in a lesson, and never less than it had */
  const [room, setRoom] = useState(0);
  const { snap } = useStore();
  const c = beat ? walkCoach(beat, habitOf(snap.settings)) : null;
  const reason = why || c?.why || '';
  const papers = src || (why ? [] : c?.src || []);
  useEffect(() => setOpen(false), [say]);
  return (
    <View style={s.coach}>
      <View style={s.bubbleOver}>
        <Rise key={open ? 'why' : say}>
          <Bubble text={open ? reason : say} />
        </Rise>
      </View>
      {/* the room is only the space the page leaves; the flame is drawn over it, so it never holds the room open and never
          pushes the buttons down when the words above grow */}
      <View style={s.flameRoom} onLayout={(e) => setRoom(e.nativeEvent.layout.height)}>
        <View style={s.flameIn} pointerEvents="none">
          {/* drawn larger than its room: the figure is about half its box (the rest is glow), so the flame itself reads big, the way
              it does in a lesson (the owner, November 13, 2026: "flames too small") */}
          <BigFlame level={level} size={Math.round(Math.max(170, Math.min(big ? 340 : 300, (room || 0) * 1.35)))} pulse={pulse} />
        </View>
        {/* Why this works: a small quiet button in the corner, off the flame and out of the way of the answers (the owner: "i don't
            like the why it works being there") */}
        {reason ? <WhyButton open={open} onPress={() => setOpen(!open)} /> : null}
      </View>
      {open && papers.length ? <Papers keys={papers} /> : null}
      {children}
    </View>
  );
}

/** the flame alone in the room the page leaves (the found list): drawn over the room, never holding it open, and left out when
    the room is too small for it to read as the flame */
function FlameRoom({ level, pulse }: { level: number; pulse: number }) {
  const [room, setRoom] = useState(0);
  return (
    <View style={[s.flameRoom, s.flameRoomAlone]} onLayout={(e) => setRoom(e.nativeEvent.layout.height)}>
      {room >= 90 ? (
        <View style={s.flameIn} pointerEvents="none">
          <BigFlame level={level} size={Math.round(Math.min(280, room * 1.2))} pulse={pulse} />
        </View>
      ) : null}
    </View>
  );
}

/** the small Why button the walk uses everywhere (book icon, Why; an X and Back when open), so the reason is a tap away and
    never sits between the words and the answers as a link (the owner, November 13, 2026: "i don't like the why it works being
    there") */
function WhyButton({ open, onPress, style }: { open: boolean; onPress: () => void; style?: object }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={open ? 'Back' : 'Why this works'}
      accessibilityState={{ expanded: open }}
      hitSlop={10}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.whyB, style, { opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={open ? 'x' : 'book'} size={15} color={TW.muted} />
      <Text style={s.whyBT}>{open ? 'Back' : 'Why'}</Text>
    </Pressable>
  );
}

/** Why for words that have no coach: the small button, and the beat's reason and papers opening under the words */
function WhyLine({ beat }: { beat: WalkBeat }) {
  const [open, setOpen] = useState(false);
  const { snap } = useStore();
  const c = walkCoach(beat, habitOf(snap.settings));
  return (
    <View style={s.whyLine}>
      <WhyButton open={open} onPress={() => setOpen(!open)} style={s.whyInline} />
      {open ? (
        <Rise>
          <Text style={s.whyBody}>{c.why}</Text>
          <Papers keys={c.src} left />
        </Rise>
      ) : null}
    </View>
  );
}

/** what they found, as the hero: the chain they walked, link by link, ending on the win. One Why for the whole of it: it turns
    the line under the chain into the reason and its papers, in place, so nothing moves (the owner, November 13, 2026: "fix
    this it just looks dinky") */
function Found({ chain }: { chain: string[] }) {
  const [open, setOpen] = useState(false);
  const { snap } = useStore();
  const c = walkCoach('chain', habitOf(snap.settings));
  return (
    <Rise>
      <View style={s.foundHead}>
        <Text style={[s.over, s.foundOver]} accessibilityRole="header">
          What you found
        </Text>
        <WhyButton open={open} onPress={() => setOpen(!open)} style={s.whyInline} />
      </View>
      <View style={s.found} accessible accessibilityLabel={'What you found: ' + chain.join(', then ')}>
        {chain.map((t, i) => {
          const last = i === chain.length - 1;
          return (
            <View key={i} style={s.link}>
              <View style={s.linkRail}>
                <View style={[s.linkLine, i === 0 && s.linkNone]} />
                <View style={[s.linkDot, last && s.linkWin]}>{last ? <Icon name="check" size={13} color="#06352A" /> : null}</View>
                <View style={[s.linkLine, last && s.linkNone]} />
              </View>
              <Text style={[s.linkT, last && s.linkTWin]}>{t}</Text>
            </View>
          );
        })}
      </View>
      <Rise key={open ? 'why' : 'say'}>
        {open ? (
          <View style={s.foundWhy}>
            <Text style={s.whyBody}>{c.why}</Text>
            <Papers keys={c.src} left />
          </View>
        ) : (
          <Text style={s.foundSay}>{c.say}</Text>
        )}
      </Rise>
    </Rise>
  );
}

/** the papers, as one small line of names, each opening its paper */
function Papers({ keys, left }: { keys: string[]; left?: boolean }) {
  const ks = keys.filter((k) => WALK_SRC[k]);
  return (
    <View style={[s.papers, left && s.papersLeft]}>
      {ks.map((k) => (
        <Pressable
          key={k}
          accessibilityRole="link"
          accessibilityLabel={'Source: ' + WALK_SRC[k][0]}
          hitSlop={6}
          onPress={() => Linking.openURL(WALK_SRC[k][1]).catch(() => undefined)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <Text style={s.paperT} numberOfLines={1}>
            {WALK_SRC[k][0].split(':')[0]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/* the walk's own sky: the night of the trail, with a few faint stars, and one bright star lit for each part walked, so the
   sky fills as the urge is walked down (the owner, November 9, 2026: the lessons for inspiration, the walk its own) */
const FAINT: [number, number, number][] = [
  [8, 9, 2],
  [27, 4, 2],
  [49, 11, 2],
  [71, 6, 2],
  [90, 13, 2],
  [15, 27, 2],
  [58, 31, 2],
  [86, 36, 2],
  [33, 48, 2],
  [6, 63, 2],
  [77, 58, 2],
];
const BRIGHT: [number, number][] = [
  [20, 14],
  [38, 8],
  [63, 16],
  [82, 9],
  [11, 40],
  [44, 30],
  [93, 26],
  [24, 56],
  [67, 44],
  [52, 60],
];
function WalkStars({ lit }: { lit: number }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {FAINT.map(([x, y, r], i) => (
        <View key={'f' + i} style={[s.star, { left: `${x}%`, top: `${y}%`, width: r, height: r, borderRadius: r / 2, opacity: 0.35 }]} />
      ))}
      {BRIGHT.map(([x, y], i) => (
        <Star key={'b' + i} x={x} y={y} on={i < lit} />
      ))}
    </View>
  );
}
function Star({ x, y, on }: { x: number; y: number; on: boolean }) {
  const a = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: on ? 1 : 0, duration: on ? 700 : 200, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start();
  }, [on, a]);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  return (
    <Animated.View
      style={[
        s.star,
        {
          left: `${x}%`,
          top: `${y}%`,
          width: 4,
          height: 4,
          borderRadius: 2,
          opacity: a,
          transform: [{ scale }],
          shadowColor: '#FFE6A0',
          shadowOpacity: 0.9,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    />
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center' },
  pair: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  coach: { alignSelf: 'stretch', alignItems: 'center', gap: 8, flexGrow: 1 },
  flameRoom: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: 84, maxHeight: 300, alignSelf: 'stretch' },
  flameIn: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute', backgroundColor: '#FFF6D8' },
  flameRoomAlone: { minHeight: 0 },
  bubbleOver: { alignSelf: 'stretch', zIndex: 2 },
  whyB: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  whyBT: { fontFamily: font.bodySemi, fontSize: 15, color: TW.muted },
  whyInline: { position: 'relative', alignSelf: 'flex-start' },
  whyLine: { marginTop: 8, gap: 6 },
  whyBody: { fontFamily: font.body, fontSize: 15, lineHeight: 21, color: TW.muted },
  papers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 10, rowGap: 2 },
  papersLeft: { justifyContent: 'flex-start' },
  paperT: { fontFamily: font.body, fontSize: 13, color: TW.muted, textDecorationLine: 'underline' },
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
  chip: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: TW.bubble, justifyContent: 'center' },
  chipOn: { backgroundColor: TW.mint },
  // the person's own answer: no fill, a dashed mint edge, so it reads as a different kind of choice
  chipOwn: { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: TW.mint, paddingHorizontal: 12.5, paddingVertical: 8.5 },
  ownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ownT: { flexShrink: 1 },
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
  linkLine: { flex: 1, width: 2, backgroundColor: TW.dim },
  linkNone: { backgroundColor: 'transparent' },
  linkRail: { width: 22, alignItems: 'center' },
  linkDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: TW.sun },
  linkWin: { width: 22, height: 22, borderRadius: 11, backgroundColor: TW.mint, alignItems: 'center', justifyContent: 'center' },
  linkT: { flex: 1, fontFamily: font.display, fontSize: 22, lineHeight: 29, color: TW.ink, paddingVertical: 8 },
  linkTWin: { color: TW.mint },
  found: { marginTop: 6 },
  foundWhy: { marginTop: 14, gap: 6, alignItems: 'flex-start' },
  foundOver: { color: TW.sun, marginBottom: 0 },
  foundHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  foundSay: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: TW.warm, marginTop: 14 },
  ask2: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 23, color: TW.ink },
  boxTight: { marginTop: 0 },
  art: { alignSelf: 'stretch', alignItems: 'center' },
  hidden: { opacity: 0 },
  mirror: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
