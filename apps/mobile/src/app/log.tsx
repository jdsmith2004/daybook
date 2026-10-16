/* Quick check-in: one question at a time, one tap each. The first tap saves the entry; every question after it is optional,
   and Back or Undo is always one tap away. After a slip comes Rekindle: the full one (the embers, three short cards, the
   quest) for the first slip in any 7 days, the short one for any other. Ported from the legacy SCENES.checkin. */
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
  isTime,
  optList,
  OPT_MAX,
  patchEvent,
  removeEvent,
  rkEmbers,
  rkLightLine,
  rkQuest,
  rkStepFor,
  RK_CARDS,
  RK_STEPS,
  UR_STR_NAME,
  urMinText,
  type DayEvent,
  type Outcome,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AddOwn, AddTile, BigOption, Field, Link, Tiles } from '@/components/choices';
import { Flame } from '@/components/flame';
import { BrainArt, Embers, Flames, Missions, WaitPicker } from '@/components/rekindle';
import { SceneFrame } from '@/components/scene';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { LineNote } from '@/components/line-note';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { font, useTheme, type Sky } from '@/lib/theme';

type Step = 'q1' | 'trigger' | 'did' | 'done' | 'rk0' | 'rk1' | 'rk2' | 'rk3' | 'rkl';
const STEPS: Step[] = ['q1', 'trigger', 'did', 'done', 'rk0', 'rk1', 'rk2', 'rk3', 'rkl'];
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
  const st = snap.settings;
  const [date] = useState(() => (params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : tk));
  const handed = !!(params.evId && (params.outcome === 'rode' || params.outcome === 'slipped'));
  const [from] = useState<'urge' | 'pause' | 'hero'>(() => (params.from === 'urge' || params.from === 'pause' ? params.from : 'hero'));
  const [step, setStep] = useState<Step>(() => (handed && STEPS.indexOf(params.step as Step) >= 0 ? (params.step as Step) : 'q1'));
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
  const [lit, setLit] = useState(false);
  const [rkSeen, setRkSeen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [allOpts, setAllOpts] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [timeText, setTimeText] = useState('');

  const g = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk) : null), [snap, st, tk]);
  /* the SOS note box is decided once, the first time the closing screen shows, so it does not vanish while typing */
  const askNow = !!(sosInfo && outcome === 'rode' && !String(st?.note || '').trim());
  useEffect(() => {
    if (step === 'done' && askNote == null) setAskNote(askNow);
  }, [step, askNote, askNow]);
  if (!st || !g) return <Redirect href="/" />;
  const ask = askNote ?? askNow;
  const ev: DayEvent | null = (evId && snap.days[date]?.events.find((x) => x.id === evId)) || null;
  const gain = Math.max(0, g.pts - pts0);
  const hour = new Date(now).getHours();

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
    let days = snap.days;
    if (ev && id) {
      if (outcome !== v)
        days = update((s) => ({
          ...s,
          days: patchEvent(
            s.days,
            date,
            id!,
            v === 'rode'
              ? { outcome: 'rode', recovered: false, paused: full ? true : null, did: from === 'pause' ? didIds(['pause']) : null }
              : { outcome: 'slipped', paused: null, did: null },
          ),
        })).days;
    } else {
      setPts0(g.pts);
      const time = clockOf(Date.now());
      days = update((s) => {
        const r = addEvent(s.days, date, v, time);
        id = r.id;
        return { ...s, days: r.days };
      }).days;
      setEvId(id);
    }
    setOutcome(v);
    buzz('save');
    go(v === 'slipped' ? (rkSeen ? 'done' : rkStepFor(days, date)) : 'trigger');
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
      const days = evId
        ? patchEvent(s.days, date, evId, kind === 'did' ? { did: didIds((ev?.did || []).concat(id)) } : { trigger: id })
        : s.days;
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

  /* ---------- the parts every closing screen shares ---------- */
  const saved = ev ? (
    <SavedPill text={entryLabel(ev)} gain={gain} onUndo={undo} />
  ) : null;
  const noteAndTime = ev ? (
    <View style={{ width: '100%', gap: 10 }}>
      <View style={s.row}>
        <Chip label={ev.note ? 'Edit note' : ask && step === 'done' ? 'Entry note' : 'Add a note'} on={noteOpen} onPress={() => setNoteOpen(!noteOpen)} />
        <Chip
          label="Change time"
          on={timeOpen}
          onPress={() => {
            setTimeText(ev.time || '');
            setTimeOpen(!timeOpen);
          }}
        />
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
      {timeOpen ? (
        <Field
          label="Time (24-hour, like 22:30)"
          value={timeText}
          keyboardType="numbers-and-punctuation"
          maxLength={5}
          placeholder="22:30"
          onChangeText={(t) => {
            setTimeText(t);
            if (isTime(t)) patch({ time: t });
            else if (!t) patch({ time: null });
          }}
        />
      ) : null}
    </View>
  ) : null;

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
        <View style={s.opts}>
          {pause ? (
            <BigOption tone="mint" icon="wave" title="It passed" sub="I rode it out." selected={outcome ? outcome === 'rode' : null} onPress={() => pick('rode')} />
          ) : (
            <BigOption tone="mint" icon="wave" title="I rode it out" sub="The urge came and I did not act on it." selected={outcome ? outcome === 'rode' : null} onPress={() => pick('rode')} />
          )}
          <BigOption tone="slip" icon="leaf" title="I slipped" sub="A slip is data, not a reset." selected={outcome ? outcome === 'slipped' : null} onPress={() => pick('slipped')} />
        </View>
      </>
    );
    footer = <Link label="Not now" onPress={close} />;
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
        )}
        {L.hidden && !allOpts && !adding ? <Link label="Show all options" onPress={() => setAllOpts(true)} /> : null}
      </>
    );
    footer = cur.length ? <Button label="Done" onPress={() => go('done')} /> : <Link label="Skip" onPress={() => go('done')} />;
  } else if (step === 'rk0') {
    const e = rkEmbers(snap.days, st, snap.reviews, tk, date, lit, !!ev?.sp);
    sky = 'ember';
    title = 'Rekindle';
    dots = { n: 4, i: 0, label: 'Step 1 of 4' };
    body = (
      <>
        <Embers level={Math.max(1, e.level)} lit={lit} onLit={() => setLit(true)} />
        <T v="title" style={s.h} accessibilityRole="header">
          {e.h}
        </T>
        <T style={s.center}>{e.p}</T>
        {e.kept.length ? (
          <View style={{ gap: 6, alignSelf: 'stretch' }} accessibilityLabel="What you kept">
            {e.kept.map((k) => (
              <View key={k} style={s.kept}>
                <Icon name="check" size={18} color="#8CF0CE" />
                <T>{k}</T>
              </View>
            ))}
          </View>
        ) : null}
        {e.line ? <LineNote b={e.line.b} rest={e.line.rest} night /> : null}
        {lit ? <Button label="What just happened?" onPress={() => go('rk1')} /> : null}
      </>
    );
    footer = <Link label={hour >= 18 || hour < 5 ? 'Close for tonight' : 'Close for now'} onPress={close} tone="muted" />;
  } else if (step === 'rk1' || step === 'rk2' || step === 'rk3') {
    const i = RK_STEPS.indexOf(step) - 1;
    const card = RK_CARDS[i];
    const last = i === RK_CARDS.length - 1;
    sky = 'sun';
    title = 'Rekindle';
    dots = { n: 4, i: i + 1, label: 'Step ' + (i + 2) + ' of 4' };
    body = (
      <>
        <BrainArt art={card.art} label={card.al} />
        <T v="eyebrow" tone="muted">
          What just happened · {i + 1} of {RK_CARDS.length}
        </T>
        <T v="title" style={s.h} accessibilityRole="header">
          {card.h}
        </T>
        <T style={s.center}>{card.p}</T>
        {card.fact ? <Fact text={card.fact} src={card.src!} /> : null}
        <Button
          label={last ? 'See my quest' : 'Next'}
          onPress={() => {
            if (last) setRkSeen(true);
            go(last ? 'done' : (RK_STEPS[i + 2] as Step));
          }}
        />
      </>
    );
    footer = <Link label={hour >= 18 || hour < 5 ? 'Close for tonight' : 'Close for now'} onPress={close} />;
  } else if (step === 'rkl') {
    sky = 'sun';
    title = 'Rekindle';
    dots = null;
    body = (
      <>
        {saved}
        <Flame level={Math.max(1, g.level.n)} size={84} />
        <T v="title" style={s.h} accessibilityRole="header">
          Logged. Honest takes guts.
        </T>
        <T style={s.center}>{rkLightLine(snap.days, st, date, tk, now)}</T>
        <WaitPicker cur={ev?.wt} onPick={(w) => patch({ wt: ev?.wt === w ? null : w })} />
        <View style={{ width: '100%', gap: 6 }}>
          <Chip label={ev?.recovered ? '✓ One small thing done' : 'I did one small thing'} on={!!ev?.recovered} onPress={() => patch({ recovered: !ev?.recovered })} />
          <T v="small" tone="muted">
            Water, step outside, or text someone. One small step keeps one slip from turning into two.
          </T>
        </View>
        <Button label="Done" onPress={close} />
        <Link label="Show me the full Rekindle" onPress={() => go('rk0')} />
      </>
    );
  } else if (outcome === 'slipped') {
    /* the closing screen after a slip is the Rekindle quest */
    const q = rkQuest(snap.days, st, tk, date, ev, hour);
    sky = 'sun';
    title = 'Rekindle';
    dots = { n: 4, i: 4, label: 'All done' };
    body = (
      <>
        {saved}
        <Flames on={q.flames} big />
        <T v="title" style={s.h} accessibilityRole="header">
          {q.h}
        </T>
        <T style={s.center}>{q.p}</T>
        {q.askWait ? <WaitPicker cur={ev?.wt} onPick={(w) => patch({ wt: ev?.wt === w ? null : w })} /> : null}
        <Missions
          list={q.missions}
          onAction={(m, act) => {
            if (act === 'small') patch({ recovered: true });
            else if (act === 'trace' || act === 'tell') router.push({ pathname: '/deeper', params: { k: date, kind: act } });
          }}
        />
        <Prize b={q.prize.b} s={q.prize.s} />
        {noteAndTime}
        <Button label={q.done} onPress={close} />
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
            <T style={s.center}>
              {(sosInfo.st && UR_STR_NAME[sosInfo.st] ? UR_STR_NAME[sosInfo.st] + ' at the start. ' : '') + 'Passed in ' + mt + '.'}
            </T>
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
        <Button label="Done" onPress={close} />
        <Link label="Undo this entry" onPress={undo} />
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
      footer={footer}>
      {body}
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

function Fact({ text, src }: { text: string; src: string }) {
  const c = useTheme();
  return (
    <View style={[s.fact, { backgroundColor: c.surface, shadowColor: c.lip }]}>
      <Icon name="heart" color={c.coral} />
      <View style={{ flex: 1, gap: 4 }}>
        <T>{text}</T>
        <T v="small" tone="muted">
          {src}
        </T>
      </View>
    </View>
  );
}

function Prize({ b, s: sub }: { b: string; s: string }) {
  const c = useTheme();
  return (
    <View style={[s.prize, { backgroundColor: c.surface }]}>
      <View style={[s.badge, { backgroundColor: c.sun }]}>
        <Icon name="flame" size={22} color={c.onSun} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{b}</T>
        <T v="small" tone="muted">
          {sub}
        </T>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  h: { textAlign: 'center' },
  center: { textAlign: 'center' },
  opts: { width: '100%', gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kept: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, borderRadius: 999, alignSelf: 'center', maxWidth: '100%' },
  ck: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fact: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 18, alignSelf: 'stretch', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  prize: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, alignSelf: 'stretch' },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
