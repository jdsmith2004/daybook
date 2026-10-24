/* Quick check-in: one question at a time, one tap each. The first tap saves the entry, and Back or Undo is always one tap
   away. After an urge ridden out: what set it off, what you did, then the closing screen (all optional).

   After "I slipped" the slip is assumed, and saved at the current time. Three screens, one thing each:
   1. "Did you wait first?": one slider from 0 to 30 minutes (0 is "I did not wait"), the minutes big in the middle and a
      kind word for any answer. Next keeps them on the slip (core rkWaitFields: wm, with wt in step for the older rules).
      "Change time" under Next logs one from earlier.
   2. Rekindle: one big button to press and hold until the embers catch. No skip and no other choice. Once it is held:
      this is a slip, and you can recover from it, with what is still yours (level, points, urges ridden out) and, for a
      long run, words that honor it. The run question for a slip that ends a run of 7 days or more is not asked here: the
      run is kept for now, this screen says so, and the sunrise check asks it the next morning (core rkAskOpen).
   3. "Talk it through" (1 to 2 minutes: what you were after, and what you will do instead next time; talk.tsx, ?after=1)
      as the main button, and Close under it.
   SOS and the 10-minute pause save a slip themselves (with the minutes they measured), then hand it over at screen 2.
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
  rkAskOpen,
  rkEmbers,
  rkHoldWords,
  rkHonor,
  rkKeptForNow,
  rkWaitFields,
  rkWaitLine,
  rkWaitShow,
  rkWaitUnit,
  RK_WAIT_MAX,
  UR_STR_NAME,
  urMinText,
  whenEntry,
  whenFromEntry,
  whenLabel,
  whenStart,
  winLater,
  type DayEvent,
  type Outcome,
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
import { Dock, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { count } from '@/lib/pulse';
import { close } from '@/lib/nav';
import { LineNote } from '@/components/line-note';
import { WhenPill, WhenSheet } from '@/components/when';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, useTheme, type Sky } from '@/lib/theme';

type Step = 'q1' | 'trigger' | 'did' | 'done' | 'slWait' | 'slHold' | 'slNext';
const STEPS: Step[] = ['q1', 'trigger', 'did', 'done', 'slWait', 'slHold', 'slNext'];
const CI_STEP: Record<string, number> = { q1: 0, trigger: 1, did: 2, done: 3 };

export default function Log() {
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
  /* the minutes on the slider before Next keeps them (null: what the slip already has, or 0) */
  const [wait, setWait] = useState<number | null>(null);
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
  };
  const goBack = () => {
    const h = hist.slice();
    const prev = h.pop();
    if (!prev) return;
    setHist(h);
    setStep(prev);
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
    go(v === 'slipped' ? 'slWait' : 'trigger');
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

  /* the progress dots of a slip: the wait (when it was asked here), the hold, what comes next */
  const slSteps: Step[] = (handed ? [] : (['slWait'] as Step[])).concat('slHold', 'slNext');
  const slDots = () => {
    const i = Math.max(0, slSteps.indexOf(step));
    return { n: slSteps.length, i, label: 'Step ' + (i + 1) + ' of ' + slSteps.length };
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
  } else if (step === 'slWait') {
    /* 1. did you wait first? The slider starts at 0 ("I did not wait"); Next keeps the minutes on the slip */
    const v = wait ?? (typeof ev?.wm === 'number' ? ev.wm : 0);
    sky = 'sun';
    title = 'Log a slip';
    dots = slDots();
    body = (
      <>
        {saved}
        <T v="title" style={s.h} accessibilityRole="header">
          Did you wait first?
        </T>
        <T tone="muted" style={s.center}>
          Slide to how long you held off before it happened.
        </T>
        <View style={s.middle}>
          <SliderValue big value={v} show={rkWaitShow} unit={rkWaitUnit(v)} />
          <Appear key={v === 0 ? 'no' : v < 5 ? 'few' : v < RK_WAIT_MAX ? 'more' : 'max'} by={6} duration={220}>
            <T style={[s.center, s.kind]}>{rkWaitLine(v)}</T>
          </Appear>
        </View>
        <Dock>
          <Slider
            label="Minutes you waited first"
            value={v}
            min={0}
            max={RK_WAIT_MAX}
            step={1}
            show={rkWaitShow}
            unit="minutes"
            lo="I did not wait"
            hi="30 or more"
            endsShowValue={false}
            readout={false}
            onChange={setWait}
          />
          <Button
            label="Next"
            onPress={() => {
              patch(rkWaitFields(v));
              buzz('tap');
              go('slHold');
            }}
          />
        </Dock>
      </>
    );
    footer = <Link label="Change time" tone="muted" onPress={() => setWhenOpen(true)} />;
  } else if (step === 'slHold') {
    /* 2. press and hold to rekindle: the only way on. Once it is held, what is still yours, and the run kept for now */
    const e = rkEmbers(snap.days, st, snap.reviews, tk, date, lit, !!ev?.sp);
    const w = rkHoldWords(lit, !!ev?.sp);
    const honor = lit ? rkHonor(snap.days, st, tk, date) : null;
    const open = lit ? rkAskOpen(snap.days, st, tk, date) : null;
    const line = open ? rkKeptForNow(open, tk) : e.line;
    sky = 'ember';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        <EmberArt level={Math.max(1, e.level)} hold={hold} />
        <T v="title" style={s.h} accessibilityRole="header" accessibilityLiveRegion="polite">
          {w.h}
        </T>
        <T style={s.center}>{w.p}</T>
        {e.kept.length ? (
          <View style={[s.keptBox, { borderColor: 'rgba(140,240,206,0.35)' }]} accessibilityLabel="What you kept">
            <T v="eyebrow" style={{ color: '#8CF0CE' }}>
              Still yours
            </T>
            {e.kept.map((k, i) => (
              <Appear key={k} delay={350 + i * 260} by={6} style={s.kept}>
                <View style={s.keptCk}>
                  <Icon name="check" size={15} color="#0B3B2E" />
                </View>
                <T>{k}</T>
              </Appear>
            ))}
          </View>
        ) : null}
        {honor ? (
          <Appear delay={350 + e.kept.length * 260} by={6}>
            <T style={[s.center, { fontFamily: font.bodySemi }]}>{honor}</T>
          </Appear>
        ) : null}
        {line ? <LineNote b={line.b} rest={line.rest} night /> : null}
        <Dock>
          {lit ? (
            <Appear delay={500 + e.kept.length * 260} by={10}>
              <Button label="Next" onPress={() => go('slNext')} />
            </Appear>
          ) : (
            <HoldButton hold={hold} />
          )}
        </Dock>
      </>
    );
  } else if (step === 'slNext') {
    /* 3. talk it through, or close */
    sky = 'sun';
    title = 'Rekindle';
    dots = slDots();
    body = (
      <>
        {saved}
        <View style={s.middle}>
          <Flame level={Math.max(1, g.level.n)} size={110} />
          <T v="title" style={s.h} accessibilityRole="header">
            Learn from it while it is fresh.
          </T>
          <T style={s.center}>Talk it through: what you were after, and what you will do instead next time. It takes 1 to 2 minutes.</T>
        </View>
        <Dock>
          <Button
            label="Talk it through"
            onPress={() => {
              buzz('tap');
              router.replace({ pathname: '/talk', params: { after: '1' } });
            }}
          />
          <View style={{ alignItems: 'center' }}>
            <Link label="Close" tone="muted" onPress={close} />
          </View>
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
  keptBox: { alignSelf: 'stretch', gap: 8, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  keptCk: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#8CF0CE', alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kept: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, borderRadius: 999, alignSelf: 'center', maxWidth: '100%' },
  ck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
