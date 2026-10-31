/* Quick check-in (Already happened): one tap saves the entry, and Undo is always one tap away. An urge ridden out ends on
   the one celebration every urge ridden out gets (components/rode-out.tsx), with what helped and what set it off asked
   inside it (one tap each, or none), the same as SOS and the pause.

   After "I slipped" the slip is saved at once, and the comeback starts (core slip.ts has the research). One tap a page,
   and the X closes it at any point with everything given so far kept. Rethought on October 27, 2026 (the owner: do not
   ask how they felt before a slip, the answer is the urge itself):
   1. Rekindle: one big button to press and hold until the fire catches (components/hearth.tsx). Once it is held: this
      is a slip, and you can recover from it, and one line on what it did not take (core rkLitLine: a long run's days
      are on the record, or what is still yours). A long run is never "down to embers" (rkHoldWords). Nothing asks about
      the count: the mode decides it (core hero.ts).
   2. Right now: how it feels a few minutes later, one tap, then the kind, true answer to that feeling and their own
      record of it (fa). Still pulled toward it leads to SOS; like giving up shows the 988 line too.
   3. Just before: what was going on, the situation and not the feeling (late in bed with the phone, scrolling, bored,
      alone): the same answers as "What set it off?" after an urge, so slips and urges are counted together.
   4. Next time: a plan made already, from what was going on: "When it is late and I am in bed with my phone, I will open SOS."
      One tap keeps it, saved as an after-slip talk-through (pr 1, ft), which comes back on Today at its hour, where a tap opens
      the tool (core talkPlanNow), and is asked about once that hour has passed. Choose another is its own page: the tools that
      fit, and the person's own words. Then the finish, by the fire, with one door for the next hour (core slipNext).
   Every slip starts at the hold, however it came (the owner, October 31, 2026): SOS and the 10-minute pause save it themselves,
   with the minutes they measured; the entry sheet saves a new one, or changes an entry to a slip; and "I went ahead" in Talk it
   through's look back saves it and comes straight here, ahead of anything else it asks. A go-ahead's number comes after the
   answer to how it feels (slGave). Once the hold is done, the go-ahead before it is settled, so Today does not ask again.
   SOS is one tap from every page of the comeback, and it opens over it: its X and its ending come back here, on the same
   page, so the plan for next time is never lost (lib/nav.ts leave).
   The second slip in a week (core slipRepeat) gets the most care: one line that names it on "How do you feel now?", the
   safe person's text under the answer to that feeling, and the lesson on therapy on the plan page.
   Rekindle's points come from the log itself (core rkOf): one small thing waits on Today, and coming back the next morning
   is the sunrise check. Ported from the legacy SCENES.checkin. */
import {
  addEvent,
  addOption,
  clockOf,
  didIds,
  entryLabel,
  gameCompute,
  goAheadBefore,
  lookBackGave,
  lookUndo,
  moveEvent,
  optList,
  OPT_MAX,
  patchEvent,
  removeEvent,
  rkHoldWords,
  rkLitLine,
  safeName,
  settleGoAhead,
  SLIP_LEAD,
  slipNext,
  SLIP_SAFE_TEXT,
  SLIP_THERAPY_LESSON,
  slipRepeat,
  rkRunBefore,
  newTalk,
  saveTalk,
  SLIP_NEED,
  SLIP_NOW,
  SLIP_NOW_SAYS,
  slipMoment,
  slipMoves,
  slipNowLine,
  slipWhen,
  talkBackWhen,
  talkById,
  talkEvidence,
  talkEvidenceLine,
  talkHeld,
  talkHeldTag,
  talkMoveName,
  TALK_OWN_LEN,
  TALK_WHEN,
  talkPlanLine,
  urNight,
  whenEntry,
  whenFromEntry,
  whenLabel,
  whenStart,
  type DayEvent,
  type Outcome,
  type RkFeel,
  type Talk,
  type TalkMove,
  type When,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { AddOwn, AddTile, BigOption, Link, Tiles } from '@/components/choices';
import { FitArt } from '@/components/fit';
import { Flame } from '@/components/flame';
import { Hearth, HoldButton, useHearthHold } from '@/components/hearth';
import { Dock, Middle, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { ChoiceRows, SosBig } from '@/components/slip';
import { HelpFoot } from '@/components/help-foot';
import { OwnField } from '@/components/own';
import { RodeOut } from '@/components/rode-out';
import { SafeTextButton } from '@/components/safe-text';
import { SosPill } from '@/components/sos-pill';
import { Shape, type ShapeKind } from '@/components/shapes';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { count } from '@/lib/pulse';
import { close, closeAll, openCare } from '@/lib/nav';
import { WhenPill, WhenSheet } from '@/components/when';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, toneOf, useTheme, type Sky } from '@/lib/theme';

type Step = 'q1' | 'won' | 'slHold' | 'slNow' | 'slNowSay' | 'slGave' | 'slBefore' | 'slPlan' | 'slOther' | 'slDone';
const SL_STEPS: Step[] = ['slHold', 'slNow', 'slNowSay', 'slGave', 'slBefore', 'slPlan', 'slOther', 'slDone'];
/* the screenshot studio (EXPO_PUBLIC_SHOTS=1, dev only) can open a slip's comeback on any of its pages */
const SHOTS = process.env.EXPO_PUBLIC_SHOTS === '1';
/* the comeback's dots: each page counts as the step it belongs to */
const SL_DOT: Partial<Record<Step, number>> = { slHold: 0, slNow: 1, slNowSay: 1, slGave: 1, slBefore: 2, slPlan: 3, slOther: 3, slDone: 4 };
/* the icons and shapes of the feelings afterwards, and of the plan's moves */
const NOW_SHAPE: Record<RkFeel, ShapeKind> = {
  shame: 'cookie12',
  giveup: 'cookie9',
  angry: 'softBurst',
  flat: 'cookie6',
  pull: 'sunny',
  okay: 'cookie4',
};
const MOVE_IC: Partial<Record<TalkMove, string>> = {
  walk: 'bolt',
  shower: 'wind',
  breathe: 'wind',
  write: 'pencil',
  laugh: 'chat',
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
  kind: 'heart',
  tell: 'chat',
  move: 'bolt',
  light: 'sun',
  sos: 'life',
  journal: 'pencil',
};
const MOVE_TONE = ['mint', 'sky', 'sun', 'violet'];

export default function Log() {
  const c = useTheme();
  const { snap, tk, now, update, say } = useStore();
  /* SOS, the 10-minute pause and Talk it through save the entry first, then hand it over here, at the step that comes next */
  const params = useLocalSearchParams<{
    date?: string;
    evId?: string;
    outcome?: string;
    step?: string;
    from?: string;
    pts0?: string;
    st?: string;
    m?: string;
    night?: string;
    full?: string;
    kl?: string;
    /* from the look back: the talk-through, and whether its "I went ahead" wrote this slip. From an entry changed to a slip:
       what it was before. */
    talk?: string;
    made?: string;
    was?: string;
  }>();
  const sos = useSos();
  const st = useCareSettings();
  /* the log day the entry is on: the one asked for, or today. A new entry can be moved to another day or time before
     it is saved (the pill on the first question), and a saved one after (Change time). */
  const [date, setDate] = useState(() => (params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : tk));
  const roll = snap.settings?.rollover ?? 4;
  const [when, setWhen] = useState<When>(() => whenStart(date, Date.now(), roll));
  const [whenOpen, setWhenOpen] = useState(false);
  const handed = !!(params.evId && (params.outcome === 'rode' || params.outcome === 'slipped'));
  const [from] = useState<'urge' | 'pause' | 'talk' | 'entry' | 'change' | 'hero'>(() =>
    params.from === 'urge' || params.from === 'pause' || params.from === 'talk' || params.from === 'entry' || params.from === 'change' ? params.from : 'hero',
  );
  /* a slip handed over starts at the hold, wherever it came from: "you are still good" comes before any question. An urge ridden
     out is the celebration. */
  const shotStep = SHOTS && SL_STEPS.indexOf(params.step as Step) >= 0 ? (params.step as Step) : null;
  const [step, setStep] = useState<Step>(() => (handed ? (params.outcome === 'slipped' ? shotStep || 'slHold' : 'won') : 'q1'));
  /* SOS and the pause keep the way back to "How is the urge now?"; the others said it was a slip a moment ago */
  const [hist, setHist] = useState<Step[]>(() => (handed && (from === 'urge' || from === 'pause' || from === 'hero') ? ['q1'] : []));
  const [evId, setEvId] = useState<string | null>(() => (handed ? params.evId! : null));
  const [outcome, setOutcome] = useState<Outcome | null>(() => (handed ? (params.outcome as Outcome) : null));
  const [pts0, setPts0] = useState(() => (handed ? Number(params.pts0) || 0 : 0));
  const [night] = useState(() => params.night === '1');
  const [full] = useState(() => params.full === '1');
  /* the plan made after the slip, once one is picked (saved as a talk-through on today's log day) */
  const [plan, setPlan] = useState<Talk | null>(null);
  /* the plan in the person's own words is being typed */
  const [ownPlan, setOwnPlan] = useState(false);
  const [lit, setLit] = useState(false);
  const hold = useHearthHold(lit, () => {
    setLit(true);
    AccessibilityInfo.announceForAccessibility(rkHoldWords(true, false).h);
    /* the slip is looked at now: a go-ahead before it is settled, so Today does not ask about it again */
    const held = evId ? snap.days[date]?.events.find((x) => x.id === evId) : null;
    if (held) update((s0) => ({ ...s0, days: settleGoAhead(s0.days, date, held.time, tk) }));
  });
  /* a go-ahead's number: the talk-through it belongs to, once the page is open, and what it really gave */
  const [gaveId, setGaveId] = useState<string | null>(null);
  const [gave, setGave] = useState<number | null>(null);
  /* adding the person's own answer to "What was going on?", and showing the whole list */
  const [adding, setAdding] = useState(false);
  const [allOpts, setAllOpts] = useState(false);

  const g = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk) : null), [snap, st, tk]);
  if (!st || !g) return <Redirect href="/" />;
  const ev: DayEvent | null = (evId && snap.days[date]?.events.find((x) => x.id === evId)) || null;
  const gain = Math.max(0, g.pts - pts0);

  const go = (next: Step, back = false) => {
    if (!back) setHist((h) => h.concat(step));
    setStep(next);
    setOwnPlan(false);
    setAdding(false);
  };
  const goBack = () => {
    const h = hist.slice();
    const prev = h.pop();
    if (!prev) return;
    setHist(h);
    setStep(prev);
    setOwnPlan(false);
    setAdding(false);
  };

  /* the first answer: saves the entry (or changes it, when coming back) */
  const pick = (v: Outcome) => {
    let id = evId;
    /* a new entry (not a change to one already saved) */
    const made = !(ev && id);
    if (ev && id) {
      if (outcome !== v)
        update((s) => ({
          ...s,
          days: patchEvent(
            s.days,
            date,
            id!,
            v === 'rode'
              ? { outcome: 'rode', recovered: false, paused: full ? true : null, did: from === 'pause' ? didIds(['pause']) : null }
              : { outcome: 'slipped', paused: null, did: null },
          ),
        }));
    } else {
      setPts0(g.pts);
      const at = whenEntry(when, roll);
      update((s) => {
        const r = addEvent(s.days, at.key, v, at.time);
        id = r.id;
        return { ...s, days: r.days };
      });
      setEvId(id);
      setDate(at.key);
    }
    setOutcome(v);
    if (made) count(v === 'slipped' ? 'slip_logged' : 'urge_logged');
    buzz('save');
    go(v === 'slipped' ? 'slHold' : 'won');
  };
  const patch = (p: Partial<DayEvent>) => {
    if (!evId) return;
    update((s) => ({ ...s, days: patchEvent(s.days, date, evId, p) }));
  };
  /* the person's own answer to "What was going on?": kept in their list, set on the slip, then on to the plan */
  const saveOwn = (text: string) => {
    const r = addOption(st, 'trig', text);
    if (!r.id) {
      say(text.trim() ? 'That list is full. Remove one in My plan, under Lists, first.' : 'Type a few words first.');
      return;
    }
    const id = r.id;
    update((s) => ({ ...s, settings: r.st, days: evId ? patchEvent(s.days, date, evId, { trigger: id }) : s.days }));
    setAdding(false);
    buzz('tap');
    go('slPlan');
  };
  const undo = () => {
    /* an entry changed to a slip goes back to what it was, with all it had */
    if (from === 'change' && evId) {
      let was: Partial<DayEvent> = {};
      try {
        was = JSON.parse(params.was || '{}');
      } catch {}
      update((s) => ({ ...s, days: patchEvent(s.days, date, evId, { ...was, outcome: 'rode' }) }), { noWin: true });
      closeAll();
      say('Changed back.');
      return;
    }
    /* a mistaken log taken back: its points go with it (they were never really earned). "I went ahead" tapped by mistake opens
       the look back again. */
    if (evId)
      update(
        (s) => ({
          ...s,
          days: from === 'talk' && params.talk ? lookUndo(removeEvent(s.days, date, evId), params.talk) : removeEvent(s.days, date, evId),
        }),
        { takeBack: true },
      );
    if (from === 'urge')
      sos.setMem((m) => {
        const { last: _last, ...rest } = m;
        return rest;
      });
    /* a slip from SOS that was a mis-tap: SOS had ended, so Undo opens a new one, with its tools, in the same place (the log
       replaced SOS, so there is nothing under it to go back to). The urge itself is still there, so the person is not left
       alone with it. Anything else closes. */
    if (from === 'urge' && outcome === 'slipped') {
      router.replace('/sos');
      say('Removed. Nothing was saved. SOS is open again.');
      return;
    }
    /* the same from the pause tool on its own: the urge is still there, so the person lands in SOS with every tool */
    if (from === 'pause' && outcome === 'slipped') {
      router.replace('/sos');
      say('Removed. Nothing was saved. SOS is open, with all its tools.');
      return;
    }
    closeAll();
    say('Removed. Nothing was saved.');
  };

  /* ---------- when it happened: before saving it moves the new entry; after, the saved one ---------- */
  const whenNow = ev ? whenFromEntry(date, ev.time, roll, clockOf(now)) : when;
  const whenSheet = (
    <WhenSheet
      open={whenOpen}
      value={whenNow}
      now={Date.now()}
      roll={roll}
      onClose={() => setWhenOpen(false)}
      onSave={(w) => {
        setWhenOpen(false);
        if (!w) return;
        if (!ev) return setWhen(w);
        const at = whenEntry(w, roll);
        update((s0) => ({ ...s0, days: moveEvent(s0.days, date, at.key, ev.id, { time: at.time }) }));
        setDate(at.key);
        say('Moved to ' + whenLabel(w, Date.now()) + '.');
      }}
    />
  );

  /* ---------- the saved entry, with Undo, on the first page of the comeback ---------- */
  const saved = ev ? <SavedPill text={entryLabel(ev)} gain={gain} onUndo={from === 'talk' && params.made !== '1' ? undefined : undo} /> : null;
  /* after how it feels: a go-ahead with a number first looks at what it really gave */
  const afterNow = () => {
    const x = ev ? goAheadBefore(snap.days, date, ev.time, Date.now()) : null;
    if (x && x.talk.e != null && x.talk.a && x.talk.a.g == null) {
      setGaveId(x.talk.id);
      go('slGave');
    } else go('slBefore');
  };
  /* the progress dots of a slip: the hold, now, just before, next time (all four filled at the finish) */
  const slDots = () => {
    const i = SL_DOT[step] ?? 0;
    return { n: 4, i, label: i >= 4 ? 'All done' : 'Step ' + (i + 1) + ' of 4' };
  };
  /* the comeback's pages are night-colored late, like SOS */
  const slNight = night || urNight(new Date(now).getHours());
  /* what was going on just before it, as the plan's "when" */
  const slWhen = slipWhen(ev?.trigger);
  /* this slip is not the only one in its week: the most care (core slipRepeat) */
  const repeat = slipRepeat(snap.days, date, evId);
  /* saving the plan: a new pick replaces the one made a moment ago */
  const savePlan = (m: TalkMove | null, own?: string) => {
    if (!m && !own) return;
    const t: Talk = {
      ...(plan || newTalk(Date.now())),
      p: 'change',
      pr: 1,
      n: SLIP_NEED[slWhen],
      m: m ? [m] : [],
      mx: own ? [own] : undefined,
      mo: slipMoment(ev?.time),
      at: null,
      ft: slWhen,
    };
    if (!plan) count('talk_done');
    setPlan(t);
    update((s0) => ({ ...s0, days: saveTalk(s0.days, tk, t) }));
    buzz('lit');
    go('slDone');
  };

  /* ---------- the steps ---------- */
  let body: React.ReactNode;
  let footer: React.ReactNode = null;
  let sky: Sky = 'sky';
  let title = from === 'urge' ? 'SOS' : from === 'pause' ? 'Pause' : 'Already happened';
  let dots: { n: number; i: number; label: string } | null = null;

  /* an urge ridden out: the one celebration, with what helped and what set it off inside it */
  if (step === 'won' && ev && outcome === 'rode') {
    const mins = from === 'urge' && params.m != null && params.m !== '' ? Number(params.m) || 0 : null;
    return (
      <RodeOut
        won={{ key: date, id: ev.id, mins, moves: [], gain }}
        night={night || urNight(new Date(now).getHours())}
        level={Math.max(1, g.level.n)}
        title={title}
        onUndo={undo}
      />
    );
  }

  if (step === 'q1') {
    const pause = from === 'pause' || from === 'urge';
    body = (
      <>
        <T v="title" style={s.h} accessibilityRole="header">
          {pause ? 'How is the urge now?' : 'What happened?'}
        </T>
        <T tone="muted" style={s.center}>
          One tap. You can stop after that.
        </T>
        {/* the flame in the open middle: whatever the answer is, it stays lit */}
        <Middle>
          <FitArt min={0.55}>
            <Flame level={Math.max(1, g.level.n)} size={180} alive />
          </FitArt>
        </Middle>
        <Dock>
          {/* the day and time it is logged for: tap to change it, when it happened earlier */}
          {!ev && !pause ? <WhenPill w={when} now={now} onPress={() => setWhenOpen(true)} /> : null}
          {pause ? (
            <BigOption
              tone="mint"
              icon="wave"
              title="It passed"
              sub="I rode it out."
              selected={outcome ? outcome === 'rode' : null}
              onPress={() => pick('rode')}
            />
          ) : (
            <BigOption
              tone="mint"
              icon="wave"
              title="I rode it out"
              sub="The urge came and I did not act on it."
              selected={outcome ? outcome === 'rode' : null}
              onPress={() => pick('rode')}
            />
          )}
          <BigOption
            tone="slip"
            icon="leaf"
            title="I slipped"
            sub="A slip is data, not a reset."
            selected={outcome ? outcome === 'slipped' : null}
            onPress={() => pick('slipped')}
          />
        </Dock>
      </>
    );
  } else if (step === 'slHold') {
    /* 1. press and hold to rekindle: the only way on. Once it is held, the fire, the heading and one line on what the slip
       did not take (core rkLitLine); the page stays that short on purpose (the owner, October 25, 2026). The saved pill
       keeps its place once lit, so nothing on the page jumps at the moment it catches. */
    const w = rkHoldWords(lit, !!ev?.sp, rkRunBefore(snap.days, st, tk, date));
    sky = 'ember';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <View style={{ opacity: lit ? 0 : 1 }} pointerEvents={lit ? 'none' : 'auto'}>
          {saved}
        </View>
        <FitArt min={0.55} stretch>
          <Hearth hold={hold} />
        </FitArt>
        <Appear key={lit ? 'lit' : 'low'} delay={lit ? 650 : 0} by={lit ? 10 : 0} duration={lit ? 420 : 0} style={s.words}>
          <T v="title" style={s.h} accessibilityRole="header" accessibilityLiveRegion="polite">
            {w.h}
          </T>
          {lit ? <T style={[s.center, s.kind]}>{rkLitLine(snap.days, st, snap.reviews, tk, date)}</T> : <T style={s.center}>{w.p}</T>}
        </Appear>
        <Dock>
          {lit ? (
            <Appear delay={1300} by={10}>
              <Button label="Next" kind="warm" onPress={() => go('slNow')} />
            </Appear>
          ) : (
            <HoldButton hold={hold} />
          )}
        </Dock>
      </>
    );
    /* when it happened can still be changed here, before anything else is asked */
    if (!lit && ev) footer = <Link label="Change time" tone="muted" onPress={() => setWhenOpen(true)} />;
  } else if (step === 'slNow') {
    /* 2. right now: how it feels a few minutes later */
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <T v="title" style={s.h} accessibilityRole="header">
          How do you feel now?
        </T>
        {repeat ? (
          <T style={[s.center, s.kind]}>{repeat.line}</T>
        ) : (
          <T tone="muted" style={s.center}>
            {date === tk ? 'A few minutes after. Honest is best.' : 'Looking back on it. Honest is best.'}
          </T>
        )}
        <Dock>
          <ChoiceRows
            list={SLIP_NOW.map(([id, name, sub, icon, tone]) => ({ id, name, sub, icon, tone, shape: NOW_SHAPE[id] }))}
            onPick={(id) => {
              patch({ fa: id as RkFeel });
              go('slNowSay');
            }}
          />
        </Dock>
      </>
    );
    footer = <Link label="Skip" tone="muted" onPress={afterNow} />;
  } else if (step === 'slNowSay') {
    /* the kind, true answer to how it feels, and their own record of it */
    const fa = (ev?.fa || 'okay') as RkFeel;
    const row = SLIP_NOW.find((x) => x[0] === fa)!;
    const say = SLIP_NOW_SAYS[fa];
    const tn = toneOf(c, row[4]);
    const mine = slipNowLine(snap.days, evId, fa);
    const next = afterNow;
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <T v="eyebrow" tone="muted" style={s.center}>
          {row[1]}
        </T>
        <T v="title" style={s.h} accessibilityRole="header">
          {say.h}
        </T>
        <T style={s.center}>{say.t}</T>
        <Middle>
          <Shape kind={NOW_SHAPE[fa]} size={150} color={slNight ? tn.ic : tn.soft}>
            <View>
              <Icon name={row[3]} size={60} color={slNight ? '#1C2030' : tn.text} />
            </View>
          </Shape>
          {mine ? (
            <Appear delay={350} by={6}>
              <T v="small" tone="muted" style={s.center}>
                {mine}
              </T>
            </Appear>
          ) : null}
        </Middle>
        {/* giving up can mean more than this slip: the free line to talk to someone */}
        {fa === 'giveup' ? <HelpFoot /> : null}
        <Dock>
          {fa === 'pull' ? (
            <>
              <Button label="Open SOS" onPress={() => router.push('/sos')} />
              <View style={{ alignItems: 'center' }}>
                <Link label="Keep going here" tone="muted" onPress={next} />
              </View>
            </>
          ) : (
            <>
              {/* the second slip in a week: a plain door to a person */}
              {repeat && safeName(st) ? <SafeTextButton kind="ghost" body={SLIP_SAFE_TEXT} /> : null}
              <Button label="Next" onPress={next} />
            </>
          )}
        </Dock>
      </>
    );
    footer = fa === 'pull' ? null : <Link label="Pick another" tone="muted" onPress={goBack} />;
  } else if (step === 'slGave') {
    /* a go-ahead: what it was expected to give against what it really gave, in the person's own numbers. Seeing the gap lowers
       the pull next time (Brewer and others 2011). */
    const x = gaveId ? talkById(snap.days, gaveId) : null;
    const moved = gaveId && gave != null ? talkEvidence(lookBackGave(snap.days, gaveId, gave)) : null;
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <T v="title" style={s.h} accessibilityRole="header">
          {'You expected ' + (x?.talk.e ?? 0) + '. What did it really give?'}
        </T>
        <Middle>
          <SliderValue big value={gave} caption="out of 10" hint="Slide below to answer" />
          {/* the room is kept for the line, so the number does not move when it comes */}
          <View style={s.gapLine}>
            {moved ? (
              <Appear by={6} duration={220}>
                <T style={s.center}>{talkEvidenceLine(moved)}</T>
              </Appear>
            ) : null}
          </View>
        </Middle>
        <Dock>
          <Slider label="How much it really gave" value={gave} lo="nothing" hi="everything" readout={false} onChange={setGave} />
          {gave != null ? (
            <Button
              label="Next"
              onPress={() => {
                if (gaveId) update((s0) => ({ ...s0, days: lookBackGave(s0.days, gaveId, gave) }));
                go('slBefore');
              }}
            />
          ) : (
            <View style={s.btnSpace} />
          )}
        </Dock>
      </>
    );
    footer = <Link label="Skip" tone="muted" onPress={() => go('slBefore')} />;
  } else if (step === 'slBefore') {
    /* 3. just before: the situation, one tap (the same answers as after an urge, so they are counted together) */
    const L = optList('trig', st.opts, { time: ev?.time || null, sel: ev?.trigger || null, all: allOpts, notSure: true });
    const full = st.opts.trig.filter((x) => !x.off).length >= OPT_MAX;
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <T v="title" style={s.h} accessibilityRole="header">
          What was going on just before?
        </T>
        {adding ? (
          <AddOwn kind="trig" onSave={saveOwn} onCancel={() => setAdding(false)} />
        ) : (
          <Dock>
            <Tiles
              list={L.list}
              cur={ev?.trigger || null}
              onPick={(v) => {
                patch({ trigger: v === 'none' ? null : v });
                buzz('tap');
                go('slPlan');
              }}
              extra={full ? null : <AddTile label="Add your own" onPress={() => setAdding(true)} />}
            />
          </Dock>
        )}
        {L.hidden && !allOpts && !adding ? <Link label="Show all options" onPress={() => setAllOpts(true)} /> : null}
      </>
    );
    footer = adding ? null : <Link label="Skip" tone="muted" onPress={() => go('slPlan')} />;
  } else if (step === 'slPlan') {
    /* 4. next time: a plan made already. Nothing to think of at the lowest moment, and one move, always the same, that Daybook
       can bring back and open with a tap. */
    const mo = slipMoment(ev?.time);
    const line = talkPlanLine({ n: SLIP_NEED[slWhen], m: [SLIP_LEAD], mo, ft: slWhen });
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        {/* the plan is the heading, and the middle is the button it names */}
        <T v="title" style={s.h} accessibilityRole="header">
          {keepLast(line)}
        </T>
        <Middle>
          <FitArt min={0.6}>
            <SosBig />
          </FitArt>
          <T tone="muted" style={s.center}>
            {'Daybook brings it back ' + talkBackWhen(mo, now) + '.'}
          </T>
        </Middle>
        <Dock>
          <Button label="That is my plan" onPress={() => savePlan(SLIP_LEAD)} />
          <View style={{ alignItems: 'center' }}>
            <Link label="Choose another" tone="muted" onPress={() => go('slOther')} />
          </View>
        </Dock>
      </>
    );
    footer = (
      <>
        {repeat ? (
          <Link
            label="What therapy is like"
            tone="muted"
            onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: SLIP_THERAPY_LESSON, at: 'care' } })}
          />
        ) : null}
        <Link label="Skip" tone="muted" onPress={() => go('slDone')} />
      </>
    );
  } else if (step === 'slOther') {
    /* Choose another: the sentence is the heading, and each answer finishes it */
    const held = talkHeld(snap.days);
    const mo = slipMoment(ev?.time);
    const moves = slipMoves(slWhen, slNight || mo === 'late', held);
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <T v="title" style={s.h} accessibilityRole="header">
          {'When ' +
            TALK_WHEN[slWhen] +
            (slWhen !== 'late' && mo === 'late' ? ' late at night' : slWhen !== 'late' && mo === 'evening' ? ' in the evening' : '') +
            ', I will\u00A0…'}
        </T>
        {ownPlan ? (
          /* the box and its button stay near the top, where the keyboard does not cover them */
          <View style={{ alignSelf: 'stretch' }}>
            <OwnField
              placeholder="Like: play guitar for 20 minutes"
              max={TALK_OWN_LEN}
              onSave={(t) => {
                setOwnPlan(false);
                savePlan(null, t);
              }}
              onCancel={() => setOwnPlan(false)}
            />
          </View>
        ) : (
          <Dock>
            <ChoiceRows
              list={moves
                .map((m, j) => ({
                  id: m as string,
                  name: talkMoveName(m),
                  icon: MOVE_IC[m] || 'sparkle',
                  tone: MOVE_TONE[j % MOVE_TONE.length],
                  tag: talkHeldTag(held, m) || undefined,
                }))
                .concat({ id: 'own', name: 'Write my own', icon: 'pencil', tone: 'accent', tag: undefined })}
              onPick={(m) => (m === 'own' ? setOwnPlan(true) : savePlan(m as TalkMove))}
            />
          </Dock>
        )}
      </>
    );
  } else if (step === 'slDone') {
    /* the finish: the fire, still burning, the plan, and one door for the next hour, which is the riskiest one. Using it is the
       one small thing, so Today does not ask for it again. */
    const line = plan ? talkPlanLine(plan) : null;
    const door = ev?.recovered ? null : slipNext(ev?.fa, slNight, (st.reasons || []).length > 0);
    sky = 'ember';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <FitArt min={0.55} stretch>
          <Hearth hold={hold} />
        </FitArt>
        <View style={s.words}>
          <T v="title" style={s.h} accessibilityRole="header">
            You came back.
          </T>
          <T style={s.center}>{line ? '“' + keepLast(line) + '”' : 'Logged honestly, and looked at. That is how the next one gets easier.'}</T>
          {gain ? (
            <T v="label" tone="mintText" style={s.center}>
              {'+' + gain + ' points'}
            </T>
          ) : null}
        </View>
        <Dock>
          {door ? (
            <>
              <T v="small" tone="muted" style={s.center}>
                For the next hour
              </T>
              <Button
                kind="ghost"
                label={door.label}
                onPress={() => {
                  patch({ recovered: true });
                  count('rk_small');
                  openCare(door);
                }}
              />
            </>
          ) : null}
          <Button label="Done" kind="warm" onPress={closeAll} />
        </Dock>
      </>
    );
  }

  if (night && sky !== 'ember') sky = 'night';
  return (
    <SceneFrame
      title={title}
      sky={sky}
      dots={dots}
      onBack={step !== 'q1' && hist.length ? goBack : null}
      onClose={close}
      topRight={step === 'q1' || step === 'slPlan' ? undefined : <SosPill over />}
      footer={footer}>
      {body}
      {whenSheet}
    </SceneFrame>
  );
}

/* a sentence's last word stays with the one before it, so "SOS." is not left alone on a line */
const keepLast = (line: string) => line.replace(/ (\S+)$/, '\u00A0$1');

/* "✓ Saved · Slipped at 11:40 PM  +10  Undo" */
function SavedPill({ text, gain, onUndo }: { text: string; gain: number; onUndo?: () => void }) {
  const c = useTheme();
  return (
    <View style={[s.pill, { backgroundColor: c.scBtn }]}>
      <View style={[s.ck, { backgroundColor: c.mint }]}>
        <Icon name="check" size={14} color="#FFFFFF" />
      </View>
      <T v="label" style={{ flexShrink: 1 }}>
        Saved · {text.replace(/ (AM|PM)/, '\u00A0$1')}
      </T>
      {gain ? (
        <T v="label" tone="mintText">
          +{gain}
        </T>
      ) : null}
      {onUndo ? (
        <Pressable accessibilityRole="button" onPress={onUndo} hitSlop={10} style={{ paddingHorizontal: 8, minHeight: 36, justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.accentText, textDecorationLine: 'underline' }}>Undo</Text>
        </Pressable>
      ) : (
        <View style={{ width: 8, minHeight: 36 }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  h: { textAlign: 'center' },
  center: { textAlign: 'center' },
  kind: { fontFamily: font.bodySemi, maxWidth: 340 },
  words: { alignSelf: 'stretch', alignItems: 'center', gap: 8, marginTop: -8 },
  gapLine: { alignSelf: 'stretch', minHeight: 64 },
  btnSpace: { height: 52 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, borderRadius: 999, alignSelf: 'center', maxWidth: '100%' },
  ck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
