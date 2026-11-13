/* Quick check-in (Already happened): one tap saves the entry, and Undo is always one tap away. An urge ridden out ends on
   the one celebration every urge ridden out gets (components/rode-out.tsx), with what helped and what set it off asked
   inside it (one tap each, or none), the same as SOS and the pause.

   After "I slipped" the slip is saved at once, and the comeback starts (core slip.ts has the research). One tap a page,
   and the X closes it at any point with everything given so far kept. Rethought on October 27, 2026 (the owner: do not
   ask how they felt before a slip, the answer is the urge itself):
   1. Rekindle: one big button to press and hold until the fire catches (components/hearth.tsx). Over it, the first words,
      a word test (core ab.ts rkFirstLine): the fire ("Your fire did not go out."), or the person unchanged by one slip ("One
      slip. You are still someone who rides out urges: 4 times."). Once it is held: this is a slip, and you can recover from it, and what is kept as who the
      person is (core rkLitLine: "4 urges ridden out, 13 days free of it. All still yours."). No point number anywhere in
      the comeback: the points are still earned, on the level page and the Sunday review (Becoming free, step 2). A long
      run is never "down to embers" (rkHoldWords). Nothing asks about the count: the mode decides it (core hero.ts).
   Lighting the fire is the ending (the owner, November 12, 2026: "the light the fire is good we should just let them stop
   there and then if they want to do more we give them something"). Done closes it, and the one quiet "more" under Done is a
   lesson for after a slip (core rkLesson), opened in full. The pages that came after the hold until then (how it feels,
   what was going on, a plan for next time, the finish) are gone: the morning set asks about the night, sets the next one, and
   the Sunday review looks back. Their old answers stay on the record.
   Every slip starts at the hold, however it came (the owner, October 31, 2026): SOS and the 10-minute pause save it themselves,
   with the minutes they measured; the entry sheet saves a new one, or changes an entry to a slip; "I went ahead" in Talk it
   through saves it and comes straight here; and the morning set's "Look back on it" opens a slip told that morning. Once the
   hold is done, the go-ahead before it is settled, so Today does not ask again. SOS is one tap away in the corner.
   The second slip in a week (core slipRepeat) gets the most care: the lesson on therapy leads, and the 988 line shows under
   Done, as it does in a rough stretch (core roughPatch).
   Rekindle's points come from the log itself (core rkOf): one small thing for the next hour waits on Today, and coming back
   the next morning is the sunrise check. Ported from the legacy SCENES.checkin. */
import {
  addEvent,
  eventsOf,
  rkFirstInTest,
  rkFirstLine,
  whenMs,
  clockOf,
  didIds,
  entryLabel,
  gameCompute,
  lookUndo,
  moveEvent,
  patchEvent,
  removeEvent,
  rkHoldWords,
  rkLitLine,
  settleGoAhead,
  slipRepeat,
  rkRunBefore,
  urNight,
  whenClock,
  whenDayWord,
  whenEntry,
  whenFromEntry,
  whenLabel,
  whenStart,
  type DayEvent,
  type Outcome,
  type Talk,
  type When,
  lessonFor,
  rkLesson,
  lmin,
  roughPatch,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { BigOption, Link } from '@/components/choices';
import { FitArt } from '@/components/fit';
import { Flame } from '@/components/flame';
import { Hearth, HoldButton, useHearthHold } from '@/components/hearth';
import { Dock, Middle, SceneFrame } from '@/components/scene';
import { RodeOut } from '@/components/rode-out';
import { SosPill } from '@/components/sos-pill';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { count } from '@/lib/pulse';
import { armFor, track, trackAb, trackSlip } from '@/lib/events';
import { close, closeAll } from '@/lib/nav';
import { WhenPill, WhenSheet } from '@/components/when';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, nightInk, useTheme, type Sky } from '@/lib/theme';

type Step = 'q1' | 'won' | 'slHold';

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
  const [step, setStep] = useState<Step>(() => (handed ? (params.outcome === 'slipped' ? 'slHold' : 'won') : 'q1'));
  /* SOS and the pause keep the way back to "How is the urge now?"; the others said it was a slip a moment ago */
  const [hist, setHist] = useState<Step[]>(() => (handed && (from === 'urge' || from === 'pause' || from === 'hero') ? ['q1'] : []));
  const [evId, setEvId] = useState<string | null>(() => (handed ? params.evId! : null));
  const [outcome, setOutcome] = useState<Outcome | null>(() => (handed ? (params.outcome as Outcome) : null));
  const [pts0, setPts0] = useState(() => (handed ? Number(params.pts0) || 0 : 0));
  const [night] = useState(() => params.night === '1');
  const [full] = useState(() => params.full === '1');
  const [lit, setLit] = useState(false);
  const hold = useHearthHold(lit, () => {
    setLit(true);
    AccessibilityInfo.announceForAccessibility(rkHoldWords(true, false).h);
    /* the slip is looked at now: a go-ahead before it is settled, so Today does not ask about it again */
    const held = evId ? snap.days[date]?.events.find((x) => x.id === evId) : null;
    if (held) update((s0) => ({ ...s0, days: settleGoAhead(s0.days, date, held.time, tk) }));
  });
  const g = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk) : null), [snap, st, tk]);
  /* the word test on Rekindle's first line (core ab.ts): the arm from the install id, and the urges ridden out before this
     slip, fixed when the hold opens so the line does not change under the person */
  const [rkTest] = useState(() => ({
    arm: armFor('rk_first'),
    rode: eventsOf(snap.days).filter((e) => e.outcome === 'rode' && e.id !== params.evId).length,
  }));
  const abSent = useRef<string | null>(null);
  const onHold = step === 'slHold' && !lit && !!evId;
  useEffect(() => {
    const held = evId ? snap.days[date]?.events.find((x) => x.id === evId) : null;
    if (!onHold || !held || held.sp || !rkTest.arm || !rkFirstInTest(rkTest.rode) || abSent.current === evId) return;
    abSent.current = evId;
    trackAb('rk_first', rkTest.arm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onHold, evId]);
  if (!st || !g) return <Redirect href="/" />;
  const ev: DayEvent | null = (evId && snap.days[date]?.events.find((x) => x.id === evId)) || null;
  const gain = Math.max(0, g.pts - pts0);

  const go = (next: Step, back = false) => {
    if (!back) setHist((h) => h.concat(step));
    setStep(next);
  };
  const goBack = () => {
    const h = hist.slice();
    const prev = h.pop();
    if (!prev) return;
    setHist(h);
    setStep(prev);
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
    if (made) {
      count(v === 'slipped' ? 'slip_logged' : 'urge_logged');
      if (v === 'slipped') trackSlip({}, whenMs(when));
      else track('urge', { outcome: 'rode' });
      if (from === 'hero') track('happened');
    }
    buzz('save');
    go(v === 'slipped' ? 'slHold' : 'won');
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
  /* moved to another day, it says which */
  const savedMoment = ev?.time && date !== tk ? whenFromEntry(date, ev.time, roll) : null;
  const saved = ev ? (
    <SavedPill
      text={savedMoment ? whenDayWord(savedMoment.day, now) + ', ' + whenClock(savedMoment) : entryLabel(ev)}
      onUndo={from === 'talk' && params.made !== '1' ? undefined : undo}
    />
  ) : null;
  /* this slip is not the only one in its week, or the week has been a rough one: the most care (core slipRepeat, roughPatch) */
  const repeat = slipRepeat(snap.days, date, evId);
  const close988 = !!repeat || roughPatch(snap.days, st, tk);
  /* the one quiet "more" after the fire: a lesson for after a slip (core rkLesson) */
  const lesson = lessonFor(rkLesson(snap.days, st, !!repeat), st);

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
    const w0 = rkHoldWords(lit, !!ev?.sp, rkRunBefore(snap.days, st, tk, date));
    const w = lit || ev?.sp ? w0 : { ...w0, h: rkFirstLine(rkTest.arm, rkTest.rode) };
    sky = 'ember';
    title = 'Rekindle';
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
          {lit ? <T style={[s.center, s.kind]}>{keepLast(rkLitLine(snap.days, st, snap.reviews, tk, date))}</T> : <T style={s.center}>{w.p}</T>}
        </Appear>
        <Dock>
          {lit ? (
            <Appear delay={1300} by={10} style={s.done}>
              <Button label="Done" kind="warm" onPress={closeAll} />
              {lesson ? (
                <QuietButton
                  icon="book"
                  label={lesson.title}
                  sub={'Lesson · ' + lmin(lesson)}
                  a11y={'Lesson: ' + lesson.title + ', ' + lmin(lesson)}
                  onPress={() => {
                    track('rekindle', { step: 'learn' });
                    router.push({ pathname: '/lesson/[id]', params: { id: lesson.id, at: 'care' } });
                  }}
                />
              ) : null}
              {close988 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Call or text 988, the Suicide and Crisis Lifeline"
                  onPress={() => Linking.openURL('tel:988')}
                  hitSlop={6}
                  style={({ pressed }) => [s.help, { opacity: pressed ? 0.6 : 1 }]}>
                  <Icon name="phone" size={16} color={nightInk.muted} />
                  <Text style={[s.helpT, { color: nightInk.muted }]}>
                    Need someone right now? <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: nightInk.ink }}>Call or text 988</Text>
                  </Text>
                </Pressable>
              ) : null}
            </Appear>
          ) : (
            <HoldButton hold={hold} />
          )}
        </Dock>
      </>
    );
    /* when it happened can still be changed here, before anything else is asked */
    if (!lit && ev) footer = <Link label="Change time" tone="muted" onPress={() => setWhenOpen(true)} />;
  }

  if (night && sky !== 'ember') sky = 'night';
  return (
    <SceneFrame
      title={title}
      sky={sky}
      dots={dots}
      onBack={step !== 'q1' && hist.length ? goBack : null}
      onClose={close}
      topRight={step === 'q1' ? undefined : <SosPill over />}
      footer={footer}>
      {body}
      {whenSheet}
    </SceneFrame>
  );
}

/* a sentence's last word stays with the one before it, so "SOS." is not left alone on a line, and "I" stays with "will" */
const keepLast = (line: string) => line.replace(', I will ', ', I\u00A0will ').replace(/ (\S+)$/, '\u00A0$1');

/* "✓ Saved · Slipped at 11:40 PM  Undo": the tick is neutral, since a slip is never green; no points beside a slip (Becoming free, step 2; they are still earned) */
function SavedPill({ text, onUndo }: { text: string; onUndo?: () => void }) {
  const c = useTheme();
  return (
    <View style={[s.pill, { backgroundColor: c.scBtn }]}>
      <View style={[s.ck, { backgroundColor: 'rgba(255,255,255,0.28)' }]}>
        <Icon name="check" size={14} color="#FFFFFF" />
      </View>
      <T v="label" style={{ flexShrink: 1 }}>
        Saved · {text.replace(/ (AM|PM)/, '\u00A0$1')}
      </T>
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

/* the quiet choice under the main button on the fire's sky: a soft fill, never a second bright button and never an underlined link */
function QuietButton({ icon, label, sub, a11y, onPress }: { icon: string; label: string; sub?: string; a11y?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y || label}
      onPress={onPress}
      style={({ pressed }) => [s.quiet, { backgroundColor: nightInk.btn, opacity: pressed ? 0.75 : 1 }]}>
      <Icon name={icon} size={20} color={nightInk.ink} />
      <View style={{ flexShrink: 1 }}>
        <Text style={[s.quietT, { color: nightInk.ink }]} numberOfLines={1}>
          {label}
        </Text>
        {sub ? <Text style={[s.quietS, { color: nightInk.muted }]}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  h: { textAlign: 'center' },
  plan: { alignSelf: 'stretch' },
  planLinks: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  center: { textAlign: 'center' },
  kind: { fontFamily: font.bodySemi, maxWidth: 340 },
  words: { alignSelf: 'stretch', alignItems: 'center', gap: 8, marginTop: -8 },
  gapLine: { alignSelf: 'stretch', minHeight: 64 },
  btnSpace: { height: 52 },
  done: { alignSelf: 'stretch', gap: 12 },
  quiet: {
    minHeight: 56,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quietT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  quietS: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  help: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44 },
  helpT: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, borderRadius: 999, alignSelf: 'center', maxWidth: '100%' },
  ck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
