/* Quick check-in: one question at a time, one tap each. The first tap saves the entry, and Back or Undo is always one tap
   away. After an urge ridden out: what set it off, what you did, then the closing screen (all optional).

   After "I slipped" the slip is saved at once, and the comeback starts (core slip.ts has the research). One tap a page,
   and the X closes it at any point with everything given so far kept:
   1. Rekindle: one big button to press and hold until the embers catch. Once it is held: this is a slip, and you can
      recover from it, and one line on what it did not take (core rkLitLine: the run kept for now, a long run honored,
      or what is still yours). The run question for a slip that ends a run of 7 days or more is not asked here: the
      sunrise check asks it the next morning (core rkAskOpen).
   2. Before it happened: the four colors open the field of feelings (the one SOS uses), and the word comes back big,
      breathing in its own color, with what that feeling was asking for, what porn gave it instead, and the person's own
      pattern. It goes on the slip (fb), and sets its trigger when there is none, so the patterns learn from slips too.
   3. And now: how it feels a few minutes later, one tap, then the kind, true answer to that feeling and their own
      record of it (fa). Still pulled toward it leads to SOS.
   4. Next time: when you feel that, what you will do instead. One tap saves the if-then plan as an after-slip
      talk-through (pr 1, fw), which Today asks about the next morning. Then the finish, with the plan to say once.
   SOS and the 10-minute pause save a slip themselves (with the minutes they measured), then hand it over at screen 1.
   Rekindle's quest and points come from the log itself (core rkOf), so they go on exactly as before: one small thing
   waits on Today, the sunrise check the next morning. Ported from the legacy SCENES.checkin. */
import {
  addEvent,
  addOption,
  changeSettings,
  clockOf,
  didIds,
  didToggle,
  entryLabel,
  eventsOf,
  gameCompute,
  moveEvent,
  optList,
  OPT_MAX,
  patchEvent,
  removeEvent,
  rkEmbers,
  rkHoldWords,
  rkLitLine,
  FEEL_TRIG,
  feelAt,
  feelFam,
  feelPos,
  famOfWord,
  newTalk,
  saveTalk,
  SLIP_ASKS,
  SLIP_HELP_WORDS,
  SLIP_NEED,
  SLIP_NOW,
  SLIP_NOW_SAYS,
  slipBeforeLine,
  slipMoment,
  slipMoves,
  slipNowLine,
  talkHeld,
  talkHeldTag,
  talkMoveName,
  TALK_OWN_LEN,
  talkPlanLine,
  UR_STR_NAME,
  urNight,
  urMinText,
  whenEntry,
  whenFromEntry,
  whenLabel,
  whenStart,
  winLater,
  type DayEvent,
  type Outcome,
  type RkFeel,
  type Talk,
  type TalkMove,
  type When,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { AddOwn, AddTile, BigOption, Field, Link, Tiles } from '@/components/choices';
import { Flame } from '@/components/flame';
import { EmberArt, HoldButton, useEmberHold } from '@/components/rekindle';
import { Dock, Finish, Middle, SceneFrame } from '@/components/scene';
import { ChoiceRows, FeelQuads, FeelShape } from '@/components/slip';
import { HelpFoot } from '@/components/help-foot';
import { OwnField } from '@/components/own';
import { Shape, type ShapeKind } from '@/components/shapes';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { count } from '@/lib/pulse';
import { close } from '@/lib/nav';
import { WhenPill, WhenSheet } from '@/components/when';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, toneOf, useTheme, type Sky } from '@/lib/theme';

type Step = 'q1' | 'trigger' | 'did' | 'done' | 'slHold' | 'slBefore' | 'slFeel' | 'slNow' | 'slNowSay' | 'slPlan' | 'slDone';
const STEPS: Step[] = ['q1', 'trigger', 'did', 'done', 'slHold', 'slBefore', 'slFeel', 'slNow', 'slNowSay', 'slPlan', 'slDone'];
/* the comeback's dots: each page counts as the step it belongs to */
const SL_DOT: Partial<Record<Step, number>> = { slHold: 0, slBefore: 1, slFeel: 1, slNow: 2, slNowSay: 2, slPlan: 3, slDone: 4 };
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
};
const MOVE_TONE = ['mint', 'sky', 'sun', 'violet'];
const CI_STEP: Record<string, number> = { q1: 0, trigger: 1, did: 2, done: 3 };

export default function Log() {
  const c = useTheme();
  const { snap, tk, now, update, apply, say } = useStore();
  /* SOS and the 10-minute pause save the entry first, then hand it over here, at the step that comes next */
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
  const [from] = useState<'urge' | 'pause' | 'hero'>(() => (params.from === 'urge' || params.from === 'pause' ? params.from : 'hero'));
  /* a slip handed over (SOS, the pause) starts at the hold: they measured the wait themselves */
  const [step, setStep] = useState<Step>(() =>
    handed ? (params.outcome === 'slipped' ? 'slHold' : STEPS.indexOf(params.step as Step) >= 0 ? (params.step as Step) : 'q1') : 'q1',
  );
  const [hist, setHist] = useState<Step[]>(() => (handed ? ['q1'] : []));
  const [evId, setEvId] = useState<string | null>(() => (handed ? params.evId! : null));
  const [outcome, setOutcome] = useState<Outcome | null>(() => (handed ? (params.outcome as Outcome) : null));
  const [pts0, setPts0] = useState(() => (handed ? Number(params.pts0) || 0 : 0));
  /* what SOS kept: how strong it was at the start, and how long it took */
  const [sosInfo] = useState(() =>
    from === 'urge' && handed && params.m != null && params.m !== '' ? { st: params.st || null, m: Number(params.m) || 0 } : null,
  );
  const [night] = useState(() => params.night === '1');
  const [full] = useState(() => params.full === '1');
  const [askNote, setAskNote] = useState<boolean | null>(null);
  /* the plan made after the slip, once one is picked (saved as a talk-through on today's log day) */
  const [plan, setPlan] = useState<Talk | null>(null);
  /* the plan in the person's own words is being typed */
  const [ownPlan, setOwnPlan] = useState(false);
  const [lit, setLit] = useState(false);
  const hold = useEmberHold(lit, () => {
    setLit(true);
    AccessibilityInfo.announceForAccessibility(rkHoldWords(true, false).h);
  });
  const [adding, setAdding] = useState(false);
  const [allOpts, setAllOpts] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const g = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk) : null), [snap, st, tk]);
  /* the SOS note box is decided once, the first time the closing screen shows, so it does not vanish while typing. After an urge
     ridden out at night it waits for last night's card on Today the next morning, which asks what helped (core winLater), so
     it is asked once. */
  const evNow = (evId && snap.days[date]?.events.find((x) => x.id === evId)) || null;
  const askNow = !!(sosInfo && outcome === 'rode' && !String(st?.note || '').trim() && !winLater(st, date, evNow));
  useEffect(() => {
    if (step === 'done' && askNote == null) setAskNote(askNow);
  }, [step, askNote, askNow]);
  if (!st || !g) return <Redirect href="/" />;
  const ask = askNote ?? askNow;
  const ev: DayEvent | null = (evId && snap.days[date]?.events.find((x) => x.id === evId)) || null;
  const gain = Math.max(0, g.pts - pts0);

  const go = (next: Step, back = false) => {
    if (!back) setHist((h) => h.concat(step));
    setStep(next);
    setAdding(false);
    setOwnPlan(false);
  };
  const goBack = () => {
    const h = hist.slice();
    const prev = h.pop();
    if (!prev) return;
    setHist(h);
    setStep(prev);
    setAdding(false);
    setOwnPlan(false);
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
    go(v === 'slipped' ? 'slHold' : 'trigger');
  };
  const patch = (p: Partial<DayEvent>) => {
    if (!evId) return;
    update((s) => ({ ...s, days: patchEvent(s.days, date, evId, p) }));
  };
  const nextAfterTrigger = () => go(outcome === 'rode' ? 'did' : 'done');
  const saveOwn = (kind: 'trig' | 'did', text: string) => {
    const r = addOption(st, kind, text);
    if (!r.id) {
      say(text.trim() ? 'That list is full. Remove one in My plan, under Lists, first.' : 'Type a few words first.');
      return;
    }
    const id = r.id;
    update((s) => {
      const days = evId ? patchEvent(s.days, date, evId, kind === 'did' ? { did: didIds((ev?.did || []).concat(id)) } : { trigger: id }) : s.days;
      return { ...s, settings: r.st, days };
    });
    setAdding(false);
    buzz('tap');
    if (kind === 'trig') nextAfterTrigger();
  };
  const undo = () => {
    if (evId) update((s) => ({ ...s, days: removeEvent(s.days, date, evId) }));
    if (from === 'urge')
      sos.setMem((m) => {
        const { last: _last, ...rest } = m;
        return rest;
      });
    close();
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

  /* ---------- the parts every closing screen shares ---------- */
  const saved = ev ? <SavedPill text={entryLabel(ev)} gain={gain} onUndo={undo} /> : null;
  const noteAndTime = ev ? (
    <View style={{ width: '100%', gap: 10 }}>
      <View style={s.row}>
        <Chip label={ev.note ? 'Edit note' : ask && step === 'done' ? 'Entry note' : 'Add a note'} on={noteOpen} onPress={() => setNoteOpen(!noteOpen)} />
        <Chip label="Change time" on={false} onPress={() => setWhenOpen(true)} />
      </View>
      {noteOpen ? (
        <Field
          label="Note on this entry"
          hideLabel
          multiline
          maxLength={500}
          defaultValue={ev.note}
          placeholder="What would make this easier next time?"
          onChangeText={(t) => patch({ note: t })}
        />
      ) : null}
    </View>
  ) : null;

  /* the progress dots of a slip: the hold, before it happened, now, next time (all four filled at the finish) */
  const slDots = () => {
    const i = SL_DOT[step] ?? 0;
    return { n: 4, i, label: i >= 4 ? 'All done' : 'Step ' + (i + 1) + ' of 4' };
  };
  /* the comeback's pages are night-colored late, like SOS */
  const slNight = night || urNight(new Date(now).getHours());
  /* the feeling named for before it, and its place in the field */
  const fb = ev?.fb || null;
  const fbPos = feelPos(fb);
  const fam = famOfWord(fb);
  /* saving the plan: a new pick replaces the one made a moment ago */
  const savePlan = (m: TalkMove | null, own?: string) => {
    if (!fb || !fam) return;
    const t: Talk = {
      ...(plan || newTalk(Date.now())),
      p: 'change',
      pr: 1,
      n: SLIP_NEED[fam],
      m: m ? [m] : [],
      mx: own ? [own] : undefined,
      mo: slipMoment(ev?.time),
      at: null,
      fw: fb,
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
  let title = from === 'urge' ? 'SOS' : 'Quick check-in';
  let dots: { n: number; i: number; label: string } | null = { n: 3, i: CI_STEP[step] ?? 3, label: 'Question ' + ((CI_STEP[step] ?? 0) + 1) + ' of 3' };

  if (step === 'q1') {
    const pause = from === 'pause' || from === 'urge';
    body = (
      <>
        <Flame level={Math.max(1, g.level.n)} size={84} />
        <T v="title" style={s.h} accessibilityRole="header">
          {pause ? 'How is the urge now?' : 'What happened?'}
        </T>
        <T tone="muted" style={s.center}>
          One tap. You can stop after that.
        </T>
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
  } else if (step === 'trigger') {
    const L = optList('trig', st.opts, { time: ev?.time || null, sel: ev?.trigger || null, all: allOpts, notSure: true });
    const full = st.opts.trig.filter((x) => !x.off).length >= OPT_MAX;
    body = (
      <>
        {saved}
        <T v="title" style={s.h} accessibilityRole="header">
          What set it off?
        </T>
        <T tone="muted" style={s.center}>
          Optional. Tap one, or skip.
        </T>
        {adding ? (
          <AddOwn kind="trig" onSave={(t) => saveOwn('trig', t)} onCancel={() => setAdding(false)} />
        ) : (
          <Dock>
            <Tiles
              list={L.list}
              cur={ev?.trigger || null}
              onPick={(v) => {
                patch({ trigger: v === 'none' ? null : v });
                buzz('tap');
                nextAfterTrigger();
              }}
              extra={full ? null : <AddTile label="Add your own" onPress={() => setAdding(true)} />}
            />
          </Dock>
        )}
        {L.hidden && !allOpts && !adding ? <Link label="Show all options" onPress={() => setAllOpts(true)} /> : null}
      </>
    );
    footer = <Link label={outcome === 'slipped' ? 'Skip' : 'Skip the rest'} onPress={() => go('done')} />;
  } else if (step === 'did') {
    const cur = didIds(ev?.did);
    const L = optList('did', st.opts, { sel: cur, all: allOpts });
    const full = st.opts.did.filter((x) => !x.off).length >= OPT_MAX;
    body = (
      <>
        {saved}
        <T v="title" style={s.h} accessibilityRole="header">
          What did you do?
        </T>
        <T tone="muted" style={s.center}>
          Optional. Tap everything that applies.
        </T>
        {adding ? (
          <AddOwn kind="did" onSave={(t) => saveOwn('did', t)} onCancel={() => setAdding(false)} />
        ) : (
          <Dock>
            <Tiles
              list={L.list}
              cur={cur}
              onPick={(v) => {
                const next = didToggle(ev?.did, v);
                patch({ did: next.length ? next : null });
                buzz('tap');
              }}
              extra={full ? null : <AddTile label="Add your own" onPress={() => setAdding(true)} />}
            />
          </Dock>
        )}
        {L.hidden && !allOpts && !adding ? <Link label="Show all options" onPress={() => setAllOpts(true)} /> : null}
      </>
    );
    footer = cur.length ? <Button label="Done" onPress={() => go('done')} /> : <Link label="Skip" onPress={() => go('done')} />;
  } else if (step === 'slHold') {
    /* 1. press and hold to rekindle: the only way on. Once it is held, the flame, the heading and one line on what the slip
       did not take (core rkLitLine); the page stays that short on purpose (the owner, October 25, 2026) */
    const e = rkEmbers(snap.days, st, snap.reviews, tk, date, lit, !!ev?.sp);
    const w = rkHoldWords(lit, !!ev?.sp);
    sky = 'ember';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        {lit ? null : saved}
        <EmberArt level={Math.max(1, e.level)} hold={hold} />
        <T v="title" style={s.h} accessibilityRole="header" accessibilityLiveRegion="polite">
          {w.h}
        </T>
        {lit ? (
          <Appear delay={350} by={6}>
            <T style={[s.center, s.kind]}>{rkLitLine(snap.days, st, snap.reviews, tk, date)}</T>
          </Appear>
        ) : (
          <T style={s.center}>{w.p}</T>
        )}
        <Dock>
          {lit ? (
            <Appear delay={600} by={10}>
              <Button label="Next" onPress={() => go('slBefore')} />
            </Appear>
          ) : (
            <HoldButton hold={hold} />
          )}
        </Dock>
      </>
    );
    /* when it happened can still be changed here, before anything else is asked */
    if (!lit && ev) footer = <Link label="Change time" tone="muted" onPress={() => setWhenOpen(true)} />;
  } else if (step === 'slBefore') {
    /* 2. before it happened: the four colors, then the field, then the word */
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <T v="eyebrow" tone="muted" style={s.center}>
          Before it happened
        </T>
        <T v="title" style={s.h} accessibilityRole="header">
          What were you feeling?
        </T>
        <T tone="muted" style={s.center}>
          Often the urge is a way out of a feeling. Tap the color closest to yours.
        </T>
        <Dock>
          <FeelQuads
            start={fbPos}
            onPick={(r, c) => {
              const w = feelAt(r, c)!.w;
              const f = feelFam(r, c)!;
              /* the feeling also names the slip's trigger, when it has none yet */
              patch({ fb: w, ...(ev && !ev.trigger && FEEL_TRIG[f] ? { trigger: FEEL_TRIG[f] } : {}) });
              buzz('save');
              AccessibilityInfo.announceForAccessibility('You felt ' + w.toLowerCase() + '.');
              go('slFeel');
            }}
          />
        </Dock>
      </>
    );
    footer = <Link label="Skip" tone="muted" onPress={() => go('slNow')} />;
  } else if (step === 'slFeel' && fb && fbPos && fam) {
    /* the word, breathing in its own color, and what it was asking for */
    const ask = SLIP_ASKS[fam];
    const mine = slipBeforeLine(snap.days, evId, fam);
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <T v="eyebrow" tone="muted" style={s.center}>
          Before it happened, you felt
        </T>
        <Text style={[s.word, { color: slNight ? '#FFFFFF' : c.ink }]} accessibilityRole="header">
          {fb}
        </Text>
        <View style={s.middle}>
          <FeelShape r={fbPos.r} c={fbPos.c} />
        </View>
        <Appear delay={400} by={12} duration={360} style={[s.card, { backgroundColor: slNight ? 'rgba(255,255,255,0.10)' : c.surface }]}>
          <T v="label">{ask.h}</T>
          <T v="small" style={{ lineHeight: 20 }}>
            {ask.t}
          </T>
          {mine ? (
            <T v="small" tone="muted" style={{ lineHeight: 20, marginTop: 4 }}>
              {mine}
            </T>
          ) : null}
        </Appear>
        {SLIP_HELP_WORDS.indexOf(fb) >= 0 ? <HelpFoot /> : null}
        <Dock>
          <Button label="Next" onPress={() => go('slNow')} />
        </Dock>
      </>
    );
    footer = <Link label="Pick another feeling" tone="muted" onPress={goBack} />;
  } else if (step === 'slNow' || step === 'slFeel') {
    /* 3. and now: how it feels a few minutes later */
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <T v="eyebrow" tone="muted" style={s.center}>
          Right now
        </T>
        <T v="title" style={s.h} accessibilityRole="header">
          How do you feel now?
        </T>
        <T tone="muted" style={s.center}>
          A few minutes after. Honest is best.
        </T>
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
    footer = <Link label="Skip" tone="muted" onPress={() => go(fb ? 'slPlan' : 'slDone')} />;
  } else if (step === 'slNowSay') {
    /* the kind, true answer to how it feels, and their own record of it */
    const fa = (ev?.fa || 'okay') as RkFeel;
    const row = SLIP_NOW.find((x) => x[0] === fa)!;
    const say = SLIP_NOW_SAYS[fa];
    const tn = toneOf(c, row[4]);
    const mine = slipNowLine(snap.days, evId, fa);
    const next = () => go(fb ? 'slPlan' : 'slDone');
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
        <Dock>
          {fa === 'pull' ? (
            <>
              <Button label="Open SOS" onPress={() => router.replace('/sos')} />
              <View style={{ alignItems: 'center' }}>
                <Link label="Keep going here" tone="muted" onPress={next} />
              </View>
            </>
          ) : (
            <Button label="Next" onPress={next} />
          )}
        </Dock>
      </>
    );
    footer = fa === 'pull' ? null : <Link label="Pick another" tone="muted" onPress={goBack} />;
  } else if (step === 'slPlan' && fb && fam) {
    /* 4. next time: when you feel that, what you will do instead */
    const held = talkHeld(snap.days);
    const moves = slipMoves(fam, slNight || slipMoment(ev?.time) === 'late', held);
    sky = slNight ? 'night' : 'sky';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <T v="eyebrow" tone="muted" style={s.center}>
          Next time
        </T>
        <T v="title" style={s.h} accessibilityRole="header">
          {'When you feel ' + fb.toLowerCase() + ', what will you do instead?'}
        </T>
        <T tone="muted" style={s.center}>
          Pick one. It becomes your plan, and Daybook asks how it held tomorrow morning.
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
                  tone: m === 'away' ? 'violet' : MOVE_TONE[j % MOVE_TONE.length],
                  tag: talkHeldTag(held, m) || undefined,
                }))
                .concat({ id: 'own', name: 'Write my own', icon: 'pencil', tone: 'accent', tag: undefined })}
              onPick={(m) => (m === 'own' ? setOwnPlan(true) : savePlan(m as TalkMove))}
            />
          </Dock>
        )}
      </>
    );
    footer = ownPlan ? null : <Link label="Skip" tone="muted" onPress={() => go('slDone')} />;
  } else if (step === 'slDone' || step === 'slPlan') {
    /* the finish: the flame, and the plan to say once */
    const line = plan ? talkPlanLine(plan) : null;
    sky = slNight ? 'night' : 'sun';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <Finish
          level={Math.max(1, g.level.n)}
          title={line ? 'Your plan for next time' : 'You came back.'}
          text={
            line
              ? '“' + line + '”\nSay it once, out loud or in your head, so it comes back to you at the moment.'
              : 'Logged honestly, and looked at. That is how the next one gets easier.'
          }
          tone="sun"
        />
        {gain ? (
          <T v="label" tone="mintText" style={s.center}>
            {'+' + gain + ' points'}
          </T>
        ) : null}
        <Dock>
          <Button label="Done" onPress={close} />
        </Dock>
      </>
    );
  } else {
    /* after an urge passes in SOS: how it went, and (only while there is no note yet) a line to read next time */
    const mt = sosInfo ? urMinText(sosInfo.m) : '';
    const rodeN = sosInfo ? eventsOf(snap.days).filter((e) => e.outcome === 'rode').length : 0;
    const head = sosInfo ? 'It passed. You rode it out.' : 'Saved. That counts.';
    sky = 'mint';
    dots = { n: 3, i: 3, label: 'All done' };
    body = (
      <>
        <Flame level={Math.max(1, g.level.n)} size={96} />
        <T v="title" style={s.h} accessibilityRole="header">
          {head}
        </T>
        <T style={s.center}>
          {ev ? entryLabel(ev) : ''}
          {gain ? <T v="label" tone="mintText">{`  +${gain} points`}</T> : null}
        </T>
        {sosInfo ? (
          <>
            <T style={s.center}>{(sosInfo.st && UR_STR_NAME[sosInfo.st] ? UR_STR_NAME[sosInfo.st] + ' at the start. ' : '') + 'Passed in ' + mt + '.'}</T>
            <T style={s.center}>{'That makes ' + rodeN + ' urge' + (rodeN === 1 ? '' : 's') + ' ridden out.'}</T>
          </>
        ) : null}
        {ask ? (
          <View style={{ alignSelf: 'stretch', gap: 6 }}>
            <Field
              label="A note for your next hard moment"
              multiline
              maxLength={600}
              defaultValue={st.note || ''}
              placeholder={'Like: It passed in ' + (mt || 'a few minutes') + '. It will pass again.'}
              onChangeText={(t) => apply({ st: changeSettings(st, (x) => void (x.note = t)) })}
            />
            <T v="small" tone="muted">
              SOS shows it to you first next time. You can change it in My plan.
            </T>
          </View>
        ) : null}
        {noteAndTime}
        <Dock>
          <Button label="Done" onPress={close} />
          <View style={{ alignItems: 'center' }}>
            <Link label="Undo this entry" onPress={undo} />
          </View>
        </Dock>
      </>
    );
  }

  if (night && sky !== 'ember') sky = 'night';
  return (
    <SceneFrame title={title} sky={sky} dots={dots} onBack={step !== 'q1' && hist.length ? goBack : null} onClose={close} footer={footer}>
      {body}
      {whenSheet}
    </SceneFrame>
  );
}

/* "✓ Saved · Slipped at 11:40 PM  +10  Undo" */
function SavedPill({ text, gain, onUndo }: { text: string; gain: number; onUndo: () => void }) {
  const c = useTheme();
  return (
    <View style={[s.pill, { backgroundColor: c.scBtn }]}>
      <View style={[s.ck, { backgroundColor: c.mint }]}>
        <Icon name="check" size={14} color="#FFFFFF" />
      </View>
      <T v="label" style={{ flexShrink: 1 }}>
        Saved · {text}
      </T>
      {gain ? (
        <T v="label" tone="mintText">
          +{gain}
        </T>
      ) : null}
      <Pressable accessibilityRole="button" onPress={onUndo} hitSlop={10} style={{ paddingHorizontal: 8, minHeight: 36, justifyContent: 'center' }}>
        <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>Undo</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  h: { textAlign: 'center' },
  center: { textAlign: 'center' },
  kind: { fontFamily: font.bodySemi, maxWidth: 340 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 140 },
  word: { fontFamily: font.displayBold, fontSize: 44, lineHeight: 50, textAlign: 'center' },
  card: { alignSelf: 'stretch', gap: 4, padding: 16, borderRadius: 22 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, borderRadius: 999, alignSelf: 'center', maxWidth: '100%' },
  ck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
