/* Talk it through, what is left of it (core: talk.ts, with the research). The fresh talk-through (signs, what your mind is
   doing, what you are after) retired on the review of November 12, 2026: Walk it through (trail.tsx, walk.tsx) does that
   job, and plain /talk opens it. What stays is every way back to a talk-through already saved, so they still show where
   they did:
   - ?decide=<id>: a "decide later" time has come: three honest paths again: change the plan, wait and decide later, or go
     ahead with eyes open (notice the body, say what you expect it to give, come back afterwards). Going ahead is saved the
     moment it is chosen, so it waits for a look back even when the screen is closed.
   - ?look=<id>: looking back: did it hold, or how was it really, with your own numbers over time. Going ahead goes in the
     log as an honest slip, and the look back goes on into Rekindle's comeback at the feeling before it (log.tsx), so it
     ends warm: the flame and a plan for next time, the same as a slip logged from Already happened.
   - ?prep=1, "Make a plan" from the hard hours line on Today and the risk notification: a short plan for someone who may
     be doing well, with no slip in mind: what usually makes these hours hard (the needs), what to do instead (the moves),
     and the moment (their start, while it is still ahead), saved as a change plan (marked pr, so it never counts as a sign
     of when it gets hard).
   A reminder for a talk-through already answered opens Today. The SOS pill sits in the top bar on every page: someone
   talking it through can be in the middle of an urge. Making a plan earns its points as always; they show on Today. */
import {
  gameCompute,
  lookBack,
  messageTexts,
  newTalk,
  saveTalk,
  TALK_FEEL,
  TALK_HARD_MOMENT,
  TALK_HARD_NEEDS,
  TALK_MOVES,
  TALK_NEEDS,
  TALK_OWN_LEN,
  TALK_PATHS,
  TALK_SRC,
  TALK_WAITS,
  TALK_WHERE,
  talkAgo,
  talkById,
  talkCard,
  talkClock,
  talkEvidence,
  talkHeld,
  talkHardMoment,
  talkHeldTag,
  talkMomentsNow,
  talkMomentTime,
  talkMoveDoor,
  talkMoveName,
  talkMoveWords,
  talkMoves,
  talkNeedWord,
  talkPlanLine,
  talkWaitTime,
  riskDay,
  riskPlanLabel,
  slipAfterTalk,
  type Talk,
  type TalkArt,
  type TalkMove,
  type TalkNeed,
  type TalkPath,
  NUDGE_WORDS,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Answer, AnswerChip, ChipWrap } from '@/components/answer';
import { Appear } from '@/components/appear';
import { FitArt } from '@/components/fit';
import { FlameMedallion } from '@/components/flame-medallion';
import { OwnField } from '@/components/own';
import { SafeTextButton } from '@/components/safe-text';
import { SosPill } from '@/components/sos-pill';
import { Sources } from '@/components/research';
import { Dock, Finish, Middle, Pin, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { TalkArtView } from '@/components/talk-art';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { count } from '@/lib/pulse';
import { track } from '@/lib/events';
import { close, closeAll, openCare } from '@/lib/nav';
import { remindersOffered, scheduleTalk } from '@/lib/reminders';
import { useCareOpen } from '@/lib/quiet-asks';
import { useSos } from '@/lib/sos';
import { play } from '@/lib/sound';
import { useCareSettings, useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Step = 'need' | 'path' | 'cMoves' | 'cWhen' | 'wWhen' | 'wUntil' | 'oLiking' | 'oBody' | 'oExpect' | 'oReady' | 'done' | 'lWent' | 'lEnd';

const NEED_TONE: Record<TalkNeed, string> = { relief: 'sky', reward: 'sun', escape: 'coral', rest: 'violet', close: 'mint', bored: 'accent' };
const PATH_TONE: Record<TalkPath, string> = { change: 'mint', wait: 'sun', open: 'violet' };
const MOVE_IC: Record<TalkMove, string> = {
  walk: 'bolt',
  shower: 'wind',
  breathe: 'wind',
  write: 'pencil',
  treat: 'star',
  laugh: 'chat',
  name: 'pencil',
  text: 'chat',
  people: 'heart',
  show: 'play',
  bed: 'moon',
  nap: 'moon',
  call: 'phone',
  fill: 'dice',
  out: 'compass',
  hands: 'sparkle',
  away: 'phone',
  block: 'shield',
  kind: 'heart',
  tell: 'chat',
  move: 'bolt',
  light: 'sun',
  sos: 'life',
  journal: 'pencil',
};

export default function TalkIt() {
  const c = useTheme();
  /* the asks wait after it, as after an SOS (lib/quiet-asks.ts) */
  useCareOpen();
  const { snap, tk, update, say } = useStore();
  const sos = useSos();
  const st = useCareSettings();
  const params = useLocalSearchParams<{ decide?: string; look?: string; prep?: string }>();
  const [now] = useState(() => Date.now());
  /* the short plan for the hard hours: their start is the moment, while it is still ahead (it can be changed) */
  const prep = params.prep === '1' && !params.look && !params.decide;
  /* what Daybook learns: the hard hours' plan was opened (not a decide-later or a look back) */
  useEffect(() => {
    if (prep) track('planning');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const hard = useMemo(() => {
    const r = prep && snap.settings ? riskDay(snap.days, snap.settings, tk, now) : null;
    return r ? { win: r.win, at: talkHardMoment(r.a, now) } : null;
  }, [prep, snap.days, snap.settings, tk, now]);
  /* a talk-through already saved, when this opened to decide or to look back */
  const [found] = useState(() => {
    const id = params.look || params.decide;
    return id ? talkById(snap.days, id) : null;
  });
  const look = !!params.look && !!found && !found.talk.a;
  const decide = !!params.decide && !!found && !found.talk.a;
  /* deciding starts the paths fresh; looking back keeps what was chosen */
  const [talk, setTalk] = useState<Talk>(() =>
    found
      ? params.decide
        ? { ...found.talk, p: null, m: [], mo: null, at: null }
        : found.talk
      : { ...newTalk(now), p: 'change', pr: 1, mo: hard?.at ? TALK_HARD_MOMENT : null, at: hard?.at ?? null },
  );
  const day = found ? found.k : tk;
  const [step, setStep] = useState<Step>(look ? 'lWent' : decide ? 'path' : 'need');
  /* the short plan's eyebrow, on each of its pages */
  const prepEb = hard ? 'Your hard hours · ' + hard.win.label : 'A plan for your hard hours';
  /* the moment starts on the hard hours' start, also when the log was still loading as this opened */
  const preset = useRef(false);
  useEffect(() => {
    if (!hard?.at || preset.current) return;
    preset.current = true;
    setTalk((t) => (t.mo ? t : { ...t, mo: TALK_HARD_MOMENT, at: hard.at }));
  }, [hard?.at]);
  const [hist, setHist] = useState<Step[]>([]);
  const [dir, setDir] = useState(1);
  const [remind, setRemind] = useState(remindersOffered);
  const [reminded, setReminded] = useState(false);
  /* the step where an answer in the person's own words is being typed */
  const [own, setOwn] = useState<Step | null>(null);
  /* going ahead is saved as soon as it is chosen (it waits for a look back from then on) */
  const [pending, setPending] = useState(false);
  const moving = useRef(false);
  const seen = Array.isArray(sos.mem.talkSeen) ? (sos.mem.talkSeen as string[]) : [];
  const [seen0] = useState(seen);
  /* a card is "read" once it has been shown in full */
  const markSeen = (k: TalkArt) => {
    if (seen.indexOf(k) < 0) sos.setMem((m) => ({ ...m, talkSeen: (Array.isArray(m.talkSeen) ? (m.talkSeen as string[]) : []).concat(k) }));
  };
  const held = useMemo(() => talkHeld(snap.days), [snap.days]);
  useEffect(() => {
    if (step === 'oLiking') markSeen('liking');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* the fresh talk-through retired (the review of November 12, 2026): Walk it through does that job, so plain /talk opens it. A
     reminder for a talk-through already answered (or gone) opens Today, where anything still waiting is shown. */
  if (!look && !decide && !prep) return <Redirect href={params.look || params.decide ? '/' : '/trail'} />;
  if (!st) return null;
  const set = (p: Partial<Talk>) => setTalk((t) => ({ ...t, ...p }));
  const go = (next: Step) => {
    /* a go-ahead keeps what is noticed as it is answered, in case the screen is closed before the end */
    if (pending && talk.p === 'open') persist(talk);
    moving.current = false;
    setOwn(null);
    setHist((h) => h.concat(step));
    setDir(1);
    setStep(next);
  };
  const back = () => {
    setOwn(null);
    const h = hist.slice();
    const p = h.pop();
    if (!p) return;
    setHist(h);
    setDir(-1);
    setStep(p);
  };
  const toggle = <K extends string>(list: K[], k: K) => (list.indexOf(k) >= 0 ? list.filter((x) => x !== k) : list.concat(k));
  const persist = (t: Talk) => update((s0) => ({ ...s0, days: saveTalk(s0.days, day, t) }));
  const needWord = talkNeedWord(talk.n, talk.nx);
  const mx = talk.mx || [];
  const ownField = (placeholder: string, onSave: (t: string) => void) => (
    <OwnField
      placeholder={placeholder}
      max={TALK_OWN_LEN}
      onSave={(t) => {
        onSave(t);
        setOwn(null);
      }}
      onCancel={() => setOwn(null)}
    />
  );
  const addOwn = (list: string[], t: string) => (list.some((x) => x.toLowerCase() === t.toLowerCase()) ? list : list.concat(t));

  /* choosing a path. Going ahead is saved now, so it reaches the look back (and the log) even if nothing else is
     answered. Changing the choice afterwards puts back what was there before (a decide-later still waiting, or nothing). */
  const choosePath = () => {
    if (talk.p === 'open') {
      const t = { ...talk, at: now + 3600000 };
      setTalk(t);
      persist(t);
      setPending(true);
    } else if (pending) {
      persist(decide && found ? found.talk : { ...talk, p: null, m: [], mo: null, at: null });
      setPending(false);
    }
    go(talk.p === 'change' ? 'cMoves' : talk.p === 'wait' ? 'wWhen' : 'oLiking');
  };

  /* finishing a path: saved, a reminder if asked for, then the closing screen */
  const finishPath = (t: Talk) => {
    setTalk(t);
    persist(t);
    count('talk_done');
    track('talk_done');
    const at = t.p === 'open' ? now + 3600000 : t.at;
    if (remind && remindersOffered && at) {
      const body = NUDGE_WORDS.talk[t.p === 'wait' ? 'wait' : t.p === 'open' ? 'open' : 'change'];
      /* a change plan's reminder comes at its moment, so it opens Today with the plan, not the look back */
      scheduleTalk(at, body, t.p === 'change' ? '/' : '/talk?' + (t.p === 'wait' ? 'decide=' : 'look=') + t.id).then(setReminded);
    }
    if (t.p === 'open') {
      buzz('save');
      closeAll();
      say('Come back after. One minute.');
      return;
    }
    buzz('lit');
    play('chime');
    setHist([]);
    setDir(1);
    setStep('done');
  };
  /* "It held", or "I chose something else": a calm move, and the good ending */
  const choseOther = () => {
    update((s0) => ({ ...s0, days: lookBack(s0.days, talk.id, { went: false, f: [], g: null, c: [] }, tk) }));
    buzz('lit');
    play('chime');
    setHist([]);
    setDir(1);
    setStep('lEnd');
  };
  /* "I went ahead": saved at once, so a closed screen loses nothing, and straight on to the hold: the first thing after a slip
     is always "you are still good". A slip already logged since the talk-through is the one looked back on. */
  const wentAhead = () => {
    const pts0 = gameCompute(snap.days, st, snap.reviews, tk).pts;
    const had = slipAfterTalk(snap.days, day, talk.t, tk);
    const days = update((s0) => ({ ...s0, days: lookBack(s0.days, talk.id, { went: true, f: [], g: null, c: [] }, tk) })).days;
    const sl = had || slipAfterTalk(days, day, talk.t, tk);
    buzz('save');
    if (!sl) return closeAll();
    router.replace({
      pathname: '/log',
      params: { date: sl.k, evId: sl.id, outcome: 'slipped', from: 'talk', talk: talk.id, made: had ? '0' : '1', pts0: String(pts0) },
    });
  };

  let body: React.ReactNode;
  let foot: React.ReactNode = null;
  const next = (to: Step, ok = true, label = 'Next') =>
    ok ? (
      <Pin>
        <Appear by={10} duration={220}>
          <Button label={label} onPress={() => go(to)} />
        </Appear>
      </Pin>
    ) : (
      <Pin>
        <View style={s.btnSpace} />
      </Pin>
    );

  if (step === 'need') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          {prepEb}
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          What usually makes these hours hard?
        </T>
        {own === 'need' ? (
          ownField('Like: being home alone', (t) => set({ n: null, nx: t }))
        ) : (
          <Dock>
            <View style={s.list}>
              {TALK_NEEDS.map(([k, , , ic]) => (
                <Answer
                  key={k}
                  icon={ic}
                  tone={NEED_TONE[k]}
                  title={TALK_HARD_NEEDS.find((x) => x[0] === k)![1]}
                  sub={TALK_HARD_NEEDS.find((x) => x[0] === k)![2]}
                  on={talk.n === k}
                  onPress={() => {
                    /* one answer: picking it moves on (once, however many taps) */
                    set({ n: k, nx: undefined });
                    if (moving.current) return;
                    moving.current = true;
                    setTimeout(() => go('cMoves'), 220);
                  }}
                />
              ))}
              <Answer
                icon="pencil"
                tone="accent"
                title={talk.nx && !talk.n ? talk.nx : 'Something else'}
                sub={talk.nx && !talk.n ? 'In your own words. Tap to change it.' : 'Say it in your own words'}
                on={!!talk.nx && !talk.n}
                onPress={() => setOwn('need')}
              />
            </View>
            {talk.nx && !talk.n ? next('cMoves') : null}
          </Dock>
        )}
      </>
    );
  } else if (step === 'path') {
    body = (
      <>
        {decide ? (
          <T v="eyebrow" tone="muted">
            Time to decide
          </T>
        ) : null}
        <T v="title" style={s.c} accessibilityRole="header">
          Choose your path.
        </T>
        <T style={s.c} tone="muted">
          All three are honest. Choosing is the point.
        </T>
        <Dock>
          <View style={s.list}>
            {TALK_PATHS.map(([k, name, sub, ic]) => (
              <Answer key={k} icon={ic} tone={PATH_TONE[k]} title={name} sub={sub} on={talk.p === k} onPress={() => set({ p: k, m: [], mo: null, at: null })} />
            ))}
          </View>
          {talk.p ? (
            <Appear by={10} duration={220}>
              <Button label="Next" onPress={choosePath} />
            </Appear>
          ) : (
            <View style={s.btnSpace} />
          )}
        </Dock>
      </>
    );
  } else if (step === 'cMoves') {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          {prep ? 'What will you do instead?' : talk.n ? 'Meet ' + needWord + ' another way.' : 'Meet that need another way.'}
        </T>
        <T style={s.c} tone="muted">
          {prep
            ? 'What you need is real. Pick how you will give it to yourself when it gets hard.'
            : 'What you need is real. Pick how you will give it to yourself.'}
        </T>
        {own === 'cMoves' ? (
          ownField('Like: play guitar for 20 minutes', (t) => set({ mx: addOwn(mx, t) }))
        ) : (
          <Dock>
            <View style={s.list}>
              {talkMoves(talk.n, held).map((k) => (
                <Answer
                  key={k}
                  multi
                  icon={MOVE_IC[k]}
                  tone={k === 'away' || k === 'block' ? 'accent' : 'mint'}
                  title={talkMoveName(k, prep)}
                  sub={talkHeldTag(held, k) || undefined}
                  on={talk.m.indexOf(k) >= 0}
                  onPress={() => set({ m: toggle(talk.m, k) })}
                />
              ))}
              {mx.map((t) => (
                <Answer key={'own' + t} multi icon="pencil" tone="mint" title={t} on onPress={() => set({ mx: mx.filter((x) => x !== t) })} />
              ))}
              {mx.length < 3 ? <Answer multi icon="plus" tone="accent" title="My own idea" sub="In your own words" onPress={() => setOwn('cMoves')} /> : null}
            </View>
            {next('cWhen', talk.m.length + mx.length > 0)}
          </Dock>
        )}
      </>
    );
  } else if (step === 'cWhen') {
    const ready = !!talk.mo;
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          When is the hard part?
        </T>
        <View style={s.middle}>
          {ready ? (
            <Appear key={talk.mo} by={8} style={[s.plan, { backgroundColor: c.surface }]}>
              <T v="eyebrow" tone="muted">
                Your plan
              </T>
              <Text style={[s.planT, { color: c.ink }]}>{talkPlanLine(talk)}</Text>
            </Appear>
          ) : (
            <T tone="muted" style={s.c}>
              Pick the moment below.
            </T>
          )}
        </View>
        <Dock>
          <View style={s.list}>
            {hard?.at ? (
              <Answer
                icon="moon"
                tone="violet"
                title="When my hard hours start"
                sub={talkClock(hard.at)}
                on={talk.mo === TALK_HARD_MOMENT}
                onPress={() => set({ mo: TALK_HARD_MOMENT, at: hard.at })}
              />
            ) : null}
            {talkMomentsNow(now)
              .filter(([k]) => !hard?.at || talkMomentTime(k, now) !== hard.at)
              .map(([k, name]) => {
                const t = talkMomentTime(k, now);
                return (
                  <Answer
                    key={k}
                    icon={k === 'now' ? 'bolt' : 'timer'}
                    tone="sun"
                    title={name}
                    sub={t ? talkClock(t) : undefined}
                    on={talk.mo === k}
                    onPress={() => set({ mo: k, at: t })}
                  />
                );
              })}
          </View>
          {remindersOffered && talk.at ? (
            <View style={s.row}>
              <Chip label={'Remind me at ' + talkClock(talk.at)} on={remind} onPress={() => setRemind(!remind)} />
            </View>
          ) : null}
          {ready ? (
            <Appear by={10} duration={220}>
              <Button label="This is my plan" onPress={() => finishPath(talk)} />
            </Appear>
          ) : (
            <View style={s.btnSpace} />
          )}
        </Dock>
      </>
    );
  } else if (step === 'wWhen') {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          When will you decide?
        </T>
        <T style={s.c} tone="muted">
          You do not have to decide now. A plan often looks different an hour from now.
        </T>
        <Dock>
          <View style={s.list}>
            {TALK_WAITS.map(([k, name]) => {
              const t = talkWaitTime(k, now);
              return (
                <Answer key={k} icon="timer" tone="sun" title={name} sub={'At ' + talkClock(t)} on={talk.mo === k} onPress={() => set({ mo: k, at: t })} />
              );
            })}
          </View>
          {next('wUntil', !!talk.mo)}
        </Dock>
      </>
    );
  } else if (step === 'wUntil') {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          {talk.at ? 'One thing to do until ' + talkClock(talk.at) : 'One thing to do in the meantime'}
        </T>
        <T style={s.c} tone="muted">
          What you need, another way.
        </T>
        {own === 'wUntil' ? (
          ownField('Like: play guitar for 20 minutes', (t) => set({ m: [], mx: [t] }))
        ) : (
          <Dock>
            <View style={s.list}>
              {talkMoves(talk.n).map((k) => (
                <Answer key={k} icon={MOVE_IC[k]} tone="mint" title={TALK_MOVES[k][0]} on={talk.m[0] === k} onPress={() => set({ m: [k], mx: undefined })} />
              ))}
              <Answer
                icon="pencil"
                tone="accent"
                title={mx[0] && !talk.m.length ? mx[0] : 'My own idea'}
                sub={mx[0] && !talk.m.length ? 'In your own words. Tap to change it.' : 'In your own words'}
                on={!!mx[0] && !talk.m.length}
                onPress={() => setOwn('wUntil')}
              />
            </View>
            {remindersOffered && talk.at ? (
              <View style={s.row}>
                <Chip label={'Remind me at ' + talkClock(talk.at)} on={remind} onPress={() => setRemind(!remind)} />
              </View>
            ) : null}
            {talk.m.length || mx.length ? (
              <Appear by={10} duration={220}>
                <Button label="Decide later" onPress={() => finishPath(talk)} />
              </Appear>
            ) : (
              <View style={s.btnSpace} />
            )}
          </Dock>
        )}
      </>
    );
  } else if (step === 'oLiking') {
    const lk = talkCard('liking');
    const read = seen0.indexOf('liking') >= 0;
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          {lk.title}
        </T>
        <TalkArtView k="liking" />
        <T style={s.body}>{read ? lk.short : lk.body}</T>
        <Sources keys={lk.src} map={TALK_SRC} />
        <T style={[s.c, s.warm]}>So if you go ahead, the goal is to notice. Here is how.</T>
        <Dock>{next('oBody')}</Dock>
      </>
    );
  } else if (step === 'oBody') {
    const any = talk.b.length + talk.f.length > 0;
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          What do you notice in your body right now?
        </T>
        <T style={s.c} tone="muted">
          Take one slow breath and check. There is no wrong answer.
        </T>
        <Dock>
          <T v="label" style={s.c}>
            Where
          </T>
          <ChipWrap>
            {TALK_WHERE.map(([k, w]) => (
              <AnswerChip key={k} label={w} tone="violet" on={talk.b.indexOf(k) >= 0} onPress={() => set({ b: toggle(talk.b, k) })} />
            ))}
          </ChipWrap>
          <T v="label" style={[s.c, { marginTop: 6 }]}>
            What it is like
          </T>
          <ChipWrap>
            {TALK_FEEL.map(([k, w]) => (
              <AnswerChip key={k} label={w} tone="coral" on={talk.f.indexOf(k) >= 0} onPress={() => set({ f: toggle(talk.f, k) })} />
            ))}
          </ChipWrap>
          {next('oExpect', any)}
        </Dock>
      </>
    );
  } else if (step === 'oExpect') {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          {talk.n ? 'How much ' + needWord + ' do you expect it to give you?' : 'How much of what you need do you expect it to give you?'}
        </T>
        <T style={s.c} tone="muted">
          Remember this number. You will check it afterwards.
        </T>
        <View style={s.middle}>
          <SliderValue big value={talk.e} caption="out of 10, expected" hint="Slide below to answer" />
        </View>
        <Dock>
          <Slider label="How much you expect it to give" value={talk.e} lo="nothing" hi="everything" readout={false} onChange={(n) => set({ e: n })} />
          {next('oReady', talk.e != null)}
        </Dock>
      </>
    );
  } else if (step === 'oReady') {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          If you go ahead, go slowly enough to notice.
        </T>
        <View style={[s.middle, { gap: 16 }]}>
          {[
            ['wind', 'Your breath, and what your body is doing.'],
            ['sparkle', 'The moment it stops giving you anything.'],
            ['stop', 'You can stop at any point. That is allowed too.'],
            ['check', 'Afterwards, come back here for one minute.'],
          ].map(([ic, t], i) => (
            <Appear key={i} delay={120 + i * 90} by={8} style={s.forRow}>
              <Icon name={ic} size={22} color={c.violetText} />
              <T style={[s.body, { flex: 1 }]}>{t}</T>
            </Appear>
          ))}
          <T style={[s.c, s.warm]}>Whatever happens, nothing you have built is lost.</T>
        </View>
        <Dock>
          {remindersOffered ? (
            <View style={s.row}>
              <Chip label="Remind me in an hour to look back" on={remind} onPress={() => setRemind(!remind)} />
            </View>
          ) : null}
          <Button label="I will come back" onPress={() => finishPath({ ...talk, at: now + 3600000 })} />
        </Dock>
      </>
    );
  } else if (step === 'done') {
    const wait = talk.p === 'wait';
    const texting = talk.m.indexOf('text') >= 0;
    /* a plan for right now, or something to do until the time to decide, opens its tool from here */
    const door = !texting && (wait || talk.mo === 'now') ? talkMoveDoor(talk.m) : null;
    body = (
      <>
        <Finish
          level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)}
          title={wait ? (talk.at ? 'You decide at ' + talkClock(talk.at) + '.' : 'You decide later.') : prep ? 'Your plan is ready.' : 'You changed the plan.'}
          text={
            wait
              ? 'If you still want it then, come back and choose with your eyes open. No pressure either way.'
              : prep
                ? 'You saw the hard hours coming and got ready. That is the climb.'
                : 'You saw it coming and chose. That is the climb.'
          }
        />
        <Appear delay={420} style={[s.plan, { backgroundColor: c.surface }]}>
          <T v="eyebrow" tone="muted">
            {wait ? 'Until then' : 'Your plan'}
          </T>
          <Text style={[s.planT, { color: c.ink }]}>{wait ? talkMoveWords(talk)[0] : talkPlanLine(talk)}</Text>
          <T v="small" tone="muted">
            {reminded ? 'Daybook will remind you. ' : ''}It waits on Today.
          </T>
        </Appear>
        {/* a plan to text someone starts with a text already written */}
        <Dock>
          {texting ? <SafeTextButton body={messageTexts(st)[1]} /> : null}
          {door ? <Button label={door.label} onPress={() => openCare(door)} /> : null}
          <Button label="Done" kind={texting || door ? 'ghost' : 'primary'} onPress={closeAll} />
        </Dock>
      </>
    );
  } else if (step === 'lWent') {
    const change = talk.p === 'change';
    /* a go-ahead from an earlier day says when it was */
    const ago = talkAgo(day, tk, talk.t);
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          {change ? 'Did your plan hold?' : 'Welcome back. Did you go ahead?'}
        </T>
        <T style={s.c} tone="muted">
          {change
            ? talkPlanLine(talk)
            : ago
              ? 'You chose with your eyes open ' + ago + '. Either answer is useful.'
              : 'Either answer is useful. Honest is what counts.'}
        </T>
        {/* the flame in the open middle: it is still lit, whichever answer comes next */}
        <Middle>
          <FitArt min={0.55}>
            <FlameMedallion level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)} size={170} />
          </FitArt>
        </Middle>
        <Dock>
          <Answer
            icon={change ? 'check' : 'sun'}
            tone={change ? 'mint' : 'violet'}
            title={change ? 'Yes, it held' : 'Yes, I went ahead'}
            onPress={change ? choseOther : wentAhead}
          />
          <Answer
            icon={change ? 'leaf' : 'check'}
            tone={change ? 'violet' : 'mint'}
            title={change ? 'No, I went ahead' : 'No, I chose something else'}
            onPress={change ? wentAhead : choseOther}
          />
        </Dock>
      </>
    );
  } else {
    /* lEnd: it held, or something else was chosen */
    const ev = talkEvidence(snap.days);
    body = (
      <>
        <Finish
          level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)}
          title="You chose a different night."
          text="That is the climb, one honest choice at a time."
        />
        {ev.chose > 1 ? (
          <Appear delay={420}>
            <T style={s.c} tone="muted">
              That makes {ev.chose} times you talked it through and chose something else.
            </T>
          </Appear>
        ) : null}
        <Dock>
          <Button label="Done" onPress={closeAll} />
        </Dock>
      </>
    );
  }

  /* the progress dots follow the questions of the part you are in (the closing screens have none) */
  const flow: Step[] = look
    ? []
    : prep
      ? ['need', 'cMoves', 'cWhen']
      : [
          'path',
          ...((talk.p === 'wait' ? ['wWhen', 'wUntil'] : talk.p === 'open' ? ['oLiking', 'oBody', 'oExpect', 'oReady'] : ['cMoves', 'cWhen']) as Step[]),
        ];
  const i = flow.indexOf(step);
  return (
    <SceneFrame
      title={look ? 'Looking back' : prep ? (hard ? riskPlanLabel(hard.win.start).replace('Make a plan', 'A plan') : 'A plan for tonight') : 'Talk it through'}
      sky="violet"
      dots={i < 0 ? null : { n: flow.length, i, label: 'Step ' + (i + 1) + ' of ' + flow.length }}
      onBack={step !== 'done' && step !== 'lEnd' && hist.length ? back : null}
      onClose={close}
      topRight={<SosPill />}
      footer={foot}>
      <Appear key={step} x={hist.length ? 36 * dir : 0} by={hist.length ? 0 : 8} duration={280} style={s.stage}>
        {body}
      </Appear>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 140 },
  list: { alignSelf: 'stretch', gap: 9 },
  row: { flexDirection: 'row', justifyContent: 'center' },
  btnSpace: { height: 52 },
  warm: { fontFamily: font.bodyMedium, marginTop: 4 },
  body: { alignSelf: 'stretch', fontSize: 17, lineHeight: 24 },
  forRow: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 14 },
  echoN: { fontFamily: font.displayBold, fontSize: 48, lineHeight: 56 },
  reflect: { fontFamily: font.display, fontSize: 22, lineHeight: 28, textAlign: 'center' },
  plan: { alignSelf: 'stretch', gap: 6, padding: 16, borderRadius: 20 },
  /* one card on the research page: its heading, its picture, its words, with room between them */
  readItem: { alignSelf: 'stretch', gap: 10, marginTop: 16 },
  planT: { fontFamily: font.display, fontSize: 20, lineHeight: 25 },
});
