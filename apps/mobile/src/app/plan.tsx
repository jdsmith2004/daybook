/* My plan: the person's own page, to read on a hard night and to change any time (it holds what My playbook used to show).
   Why: who I am becoming, my reasons and goal, the loop and my rule, my safe person, a note and a voice note.
   Plans: when an urge hits (if this, then that), if I slip, the safety net, and next small steps.
   Lists: calm moves, the wind-down, words that steady me, my own check-in answers.
   Learned: each finished lesson's takeaway with my notes, what I wrote at the checkpoints, and "Copy it all as text".
   Everything reads like a page; tapping a line opens it to change it in place. Ported from the legacy viewPlan and viewBook. */
import {
  BE_LEN,
  cleanPhone,
  computeMetrics,
  HELP_STEPS,
  LCHECKS,
  lcheckNo,
  lessonCount,
  lessonNo,
  lessonWalk,
  LESSONS,
  lessonsDone,
  type ListKey,
  lwriteOf,
  optionRestore,
  planAdd,
  planBlank,
  PLAN_MAX,
  planRemove,
  planRestore,
  PLAN_THEN_LEN,
  PLAN_WHEN_LEN,
  playbookText,
  removeOption,
  safeName,
  SAFETY,
  setField,
  planEdit,
  slipSteps,
  toggleHelpStep,
  toggleSafety,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { TextInput } from '@/components/text';

import { Appear } from '@/components/appear';
import { Editable, Hair, PageLink, PageSec } from '@/components/editable';
import { Check, Segments } from '@/components/form';
import { RelLesson } from '@/components/help-bits';
import { HelpFoot } from '@/components/help-foot';
import { Rows } from '@/components/link-card';
import { ListCard } from '@/components/list-card';
import { SlipEditor } from '@/components/plan-editors';
import { Screen } from '@/components/screen';
import { Button, Chip, Icon, T } from '@/components/ui';
import { VoiceRecorder } from '@/components/voice-note';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import { copyText } from '@/lib/words';

type Pane = 'why' | 'plans' | 'lists' | 'learned';
const PANES: Pane[] = ['why', 'plans', 'lists', 'learned'];
/** where a link can point inside a pane (the old "sub" sections of Plans, the safe person) */
type Place = (k: string) => ((e: LayoutChangeEvent) => void) | undefined;

export default function Plan() {
  const params = useLocalSearchParams<{ pane?: string; sub?: string; fresh?: string; add?: string; to?: string }>();
  const scroll = useRef<ScrollViewInstance>(null);
  /* where the pane starts on the page, so a part inside it can be scrolled to */
  const paneY = useRef(0);
  const { snap } = useStore();
  const asked = (params.pane === 'book' ? 'learned' : params.pane) as Pane;
  const [pane, setPane] = useState<Pane>(PANES.indexOf(asked) >= 0 ? asked : params.sub ? 'plans' : 'why');
  /* the part to bring into view once, when the page opens */
  const aim = useRef((params.fresh || '').split(':')[0] || params.add || params.sub || params.to || '');
  if (!snap.settings) return <Redirect href="/" />;
  const place: Place = (k) =>
    k !== aim.current
      ? undefined
      : (e) => {
          if (aim.current !== k) return;
          aim.current = '';
          const y = e.nativeEvent.layout.y;
          setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y + paneY.current - 8), animated: true }), 250);
        };
  return (
    <Screen title="My plan" back="More" scrollRef={scroll}>
      <Segments
        label="My plan sections"
        list={[
          ['why', 'Why'],
          ['plans', 'Plans'],
          ['lists', 'Lists'],
          ['learned', 'Learned'],
        ]}
        cur={pane}
        onPick={(p) => {
          aim.current = '';
          setPane(p);
        }}
      />
      <Appear key={pane} style={{ gap: 24 }} onLayout={(e) => (paneY.current = e.nativeEvent.layout.y)}>
        {pane === 'plans' ? (
          <Plans place={place} />
        ) : pane === 'lists' ? (
          <Lists fresh={params.fresh} add={params.add} place={place} />
        ) : pane === 'learned' ? (
          <Learned />
        ) : (
          <Why place={place} />
        )}
      </Appear>
    </Screen>
  );
}

function Why({ place }: { place: Place }) {
  const c = useTheme();
  const { snap, apply, say } = useStore();
  const sos = useSos();
  const st = snap.settings!;
  const set = (k: Parameters<typeof setField>[1]) => (v: string) => apply((cur) => ({ st: setField(cur, k, v) }));
  return (
    <>
      <View style={[s.be, { backgroundColor: c.sunSoft }]}>
        <T v="eyebrow" style={{ color: c.sunText }}>
          Who I am becoming
        </T>
        <Editable
          big
          value={st.becoming || ''}
          prompt="Write one sentence about who you are becoming"
          placeholder="I am someone who keeps my word to myself."
          maxLength={BE_LEN}
          onSave={set('becoming')}
        />
      </View>
      <PageSec icon="heart" tone="coral" title="Why I am doing this">
        {st.reasons.length ? st.reasons.map((r, i) => <T key={i}>{r}</T>) : <T tone="muted">No reasons yet. They are what you read when it gets hard.</T>}
        <PageLink
          icon={st.reasons.length ? 'pencil' : 'plus'}
          label={st.reasons.length ? 'Add, reorder or reword' : 'Add my first reason'}
          onPress={() => router.push('/reasons')}
        />
        <Hair />
        <Editable label="My goal" value={st.goal} prompt="Add my goal" onSave={set('goal')} />
        <Editable label="In my own words" value={st.why} prompt="Say why this matters" onSave={set('why')} />
      </PageSec>
      <PageSec icon="compass" tone="violet" title="The loop and my rule">
        <Editable label="The loop I am breaking" value={st.loop} prompt="Name the loop" placeholder="Fail → shame → hide → give up." onSave={set('loop')} />
        <Editable label="My new rule" value={st.rule} prompt="Write my rule" placeholder="I log slips instead of hiding them." onSave={set('rule')} />
      </PageSec>
      <PageSec icon="chat" tone="mint" title="My safe person" onLayout={place('safe')}>
        <Editable label="Name" value={st.safePerson} prompt="Add someone I trust" maxLength={80} onSave={set('safePerson')} />
        <Editable
          label="Their number"
          value={sos.phone}
          prompt="Add their number"
          placeholder="Like: 555 123 4567"
          maxLength={24}
          onSave={(v) => {
            sos.setPhone(v);
            if (v.trim() && !cleanPhone(v)) say('That does not look like a phone number. Try only the digits.');
          }}
        />
        <T v="small" tone="muted">
          Text {safeName(st) || 'them'} then opens your messages with the words ready. The number stays on this device and is never synced. Scripts to copy are
          in Get help › What to say.
        </T>
      </PageSec>
      <PageSec icon="sparkle" tone="sky" title="A note for hard moments">
        <Editable
          label="From me, on a calm day"
          value={st.note || ''}
          prompt="Write a note to myself"
          placeholder="Like: It always passes. You have done this before. In an hour you will be glad."
          maxLength={600}
          onSave={set('note')}
        />
        <T v="small" tone="muted">
          SOS and My reasons show it to you first.
        </T>
        <VoiceRecorder />
      </PageSec>
      <HelpFoot />
    </>
  );
}

/* starting words for a new if-then line: tap one to fill the box, then change it */
const WHEN_IDEAS = [
  'an urge hits',
  'I am struggling',
  'I am in bed with my phone',
  'I feel lonely or low',
  'I am stressed after a long day',
  'I am bored at home',
];
const THEN_IDEAS = [
  'Leave the room for ten minutes and get a glass of water.',
  'Text one person. A short message counts.',
  'Go for a ten-minute walk.',
  'Say a short prayer in my own words, then do one thing on my plan.',
  'Put the phone on its charger in another room.',
];

/** the words of one line: If … on one line, Then … under it */
function IfThen({ when, then }: { when: string; then: string }) {
  const c = useTheme();
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <T>
        <T style={{ fontFamily: font.bodyBold, color: c.accentText }}>If </T>
        {when}
      </T>
      <T>
        <T style={{ fontFamily: font.bodyBold, color: c.mintText }}>Then </T>
        {then.trim() ? (
          then.trim()
        ) : (
          <T tone="muted" style={{ fontStyle: 'italic' }}>
            not filled in yet
          </T>
        )}
      </T>
    </View>
  );
}

/** the two halves of a line, with ideas to tap; used to change a line and to add one */
function IfThenForm({
  when0,
  then0,
  save,
  onSave,
  onCancel,
  onRemove,
}: {
  when0: string;
  then0: string;
  save: string;
  onSave: (when: string, then: string) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const c = useTheme();
  const [when, setWhen] = useState(when0);
  const [then, setThen] = useState(then0);
  const [ask, setAsk] = useState(false);
  const ok = !!when.trim() && !!then.trim();
  const input = [s.in, { color: c.ink, backgroundColor: c.surface, borderColor: c.line }];
  /* short ideas as chips, longer ones as rows that wrap */
  const ideas = (list: string[], cur: string, set: (v: string) => void, rows?: boolean) =>
    rows ? (
      <View>
        {list.map((x) => {
          const on = cur.trim() === x;
          return (
            <Pressable
              key={x}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => set(x)}
              style={({ pressed }) => [s.idea, { opacity: pressed ? 0.6 : 1 }]}>
              <Icon name={on ? 'check' : 'plus'} size={16} color={c.accentText} />
              <T style={{ flex: 1 }}>{x}</T>
            </Pressable>
          );
        })}
      </View>
    ) : (
      <View style={s.ideas}>
        {list.map((x) => (
          <Chip key={x} label={x} on={cur.trim() === x} onPress={() => set(x)} />
        ))}
      </View>
    );
  return (
    <Appear by={4} duration={180} style={{ gap: 8 }}>
      <T v="label">If</T>
      <TextInput
        value={when}
        onChangeText={setWhen}
        maxLength={PLAN_WHEN_LEN}
        autoFocus={!when0}
        placeholder="When it happens, like: I am in bed late at night"
        placeholderTextColor={c.muted}
        accessibilityLabel="If"
        style={input}
      />
      {when0 ? null : ideas(WHEN_IDEAS, when, setWhen)}
      <KeepAbove style={{ gap: 8 }}>
        <T v="label">Then I will</T>
        <TextInput
          value={then}
          onChangeText={setThen}
          multiline
          maxLength={PLAN_THEN_LEN}
          autoFocus={!!when0}
          placeholder="One clear thing I will do"
          placeholderTextColor={c.muted}
          accessibilityLabel="Then I will"
          style={[input, { minHeight: 88 }]}
        />
        {then0 ? null : ideas(THEN_IDEAS, then, setThen, true)}
        <Button label={save} disabled={!ok} onPress={() => onSave(when, then)} />
      </KeepAbove>
      <Pressable accessibilityRole="button" onPress={onCancel} style={s.remove}>
        <T v="small" style={{ color: c.accentText, fontFamily: font.bodySemi, textDecorationLine: 'underline' }}>
          Cancel
        </T>
      </Pressable>
      {onRemove ? (
        ask ? (
          <View style={{ gap: 8 }}>
            <T v="label">Take this line off your plan?</T>
            <View style={s.formRow}>
              <View style={{ flex: 1 }}>
                <Button kind="danger" label="Yes, remove it" onPress={onRemove} />
              </View>
              <View style={{ flex: 1 }}>
                <Button kind="ghost" label="Keep it" onPress={() => setAsk(false)} />
              </View>
            </View>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setAsk(true)} style={s.remove}>
            <Icon name="trash" size={16} color={c.danger} />
            <T v="small" style={{ color: c.danger, fontFamily: font.bodySemi }}>
              Remove this line
            </T>
          </Pressable>
        )
      ) : null}
    </Appear>
  );
}

/** my urge plan: each line reads as one sentence; tap a line to change it, or add a new one */
function UrgePlan() {
  const c = useTheme();
  const { snap, apply, say } = useStore();
  const st = snap.settings!;
  const [open, setOpen] = useState<number | 'new' | null>(null);
  const rows = st.plan.map((r, i) => ({ ...r, i })).filter((r) => !planBlank(r));
  const full = st.plan.length >= PLAN_MAX;
  return (
    <>
      {rows.length ? null : <T tone="muted">No lines yet. Add one for your hardest moment.</T>}
      {rows.map((r, j) => (
        <View key={r.i} style={{ gap: 12 }}>
          {j > 0 ? <Hair /> : null}
          {open === r.i ? (
            <IfThenForm
              when0={r.when}
              then0={r.then}
              save="Save"
              onCancel={() => setOpen(null)}
              onSave={(w, t) => {
                apply((cur) => ({ st: planEdit(cur, r.i, w, t) }));
                setOpen(null);
                say('Saved.');
              }}
              onRemove={() => {
                const x = planRemove(st, r.i);
                if (x.ok) apply({ st: x.st });
                setOpen(null);
                if (x.ok) say('Removed from your urge plan.', () => apply((cur) => ({ st: planRestore(cur, r.i, { when: r.when, then: r.then }) })));
                else say('Removed from your urge plan.');
              }}
            />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Opens it to change"
              onPress={() => setOpen(r.i)}
              style={({ pressed }) => [s.line, { opacity: pressed ? 0.6 : 1 }]}>
              <IfThen when={r.when} then={r.then} />
              <Icon name="pencil" size={16} color={c.muted} />
            </Pressable>
          )}
        </View>
      ))}
      {open === 'new' ? (
        <IfThenForm
          when0=""
          then0=""
          save="Add to my plan"
          onCancel={() => setOpen(null)}
          onSave={(w, t) => {
            const r = planAdd(st, w, t);
            say(r.toast);
            if (!r.ok) return;
            apply({ st: r.st });
            setOpen(null);
          }}
        />
      ) : full ? (
        <T v="small" tone="muted">
          That is the most lines ({PLAN_MAX}). Fewer, clearer lines are easier to follow on a hard night.
        </T>
      ) : (
        <PageLink icon="plus" label="Add an if-then line" onPress={() => setOpen('new')} />
      )}
    </>
  );
}

function Plans({ place }: { place: Place }) {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const st = snap.settings!;
  const m = computeMetrics(snap.days, st, tk);
  const slip = slipSteps(st);
  const [editSlip, setEditSlip] = useState(false);
  const [why, setWhy] = useState<'safety' | 'steps' | null>(null);
  return (
    <>
      <View style={{ gap: 8 }}>
        <PageSec icon="shield" title="When an urge hits" sub="Decided now, while it is calm, so a hard moment only has to follow it." onLayout={place('urge')}>
          <UrgePlan />
        </PageSec>
        <Rows>
          <RelLesson id="l9" />
        </Rows>
      </View>
      <View style={{ gap: 8 }}>
        <PageSec
          icon="heart"
          tone="coral"
          title="If I slip"
          sub={editSlip ? undefined : 'A slip is data, not a reset. These are yours to change.'}
          onLayout={place('slip')}>
          {editSlip ? (
            <Appear by={4} duration={180} style={{ gap: 12 }}>
              <SlipEditor />
              <Button label="Done" onPress={() => setEditSlip(false)} />
            </Appear>
          ) : (
            <>
              {slip.map((t, i) => (
                <View key={i} style={s.line}>
                  <T style={{ fontFamily: font.bodyBold, color: c.coralText, minWidth: 16 }}>{i + 1}</T>
                  <T style={{ flex: 1 }}>{t}</T>
                </View>
              ))}
              <PageLink icon="pencil" label="Change my steps" onPress={() => setEditSlip(true)} />
            </>
          )}
        </PageSec>
        <Rows>
          <RelLesson id="l3" />
          <RelLesson id="l6" />
        </Rows>
      </View>
      <PageSec
        icon="check"
        tone="mint"
        title="Safety net"
        aside={`${m.safety} of ${SAFETY.length} done`}
        sub="Small setups that make the hard hours easier."
        onLayout={place('safety')}>
        {SAFETY.map(([label, w], i) => (
          <Check key={i} label={label} why={why === 'safety' ? w : undefined} on={!!st.safety[i]} onPress={() => apply((cur) => toggleSafety(cur, i))} />
        ))}
        <WhyLink on={why === 'safety'} onPress={() => setWhy(why === 'safety' ? null : 'safety')} />
      </PageSec>
      <PageSec
        icon="flag"
        tone="sky"
        title="My next small steps"
        aside={`${m.help} of ${HELP_STEPS.length} done`}
        sub="Real help is a few small calls, not one big leap."
        onLayout={place('steps')}>
        {HELP_STEPS.map((label, i) => (
          <Check key={i} label={label} on={!!st.help[i]} onPress={() => apply((cur) => toggleHelpStep(cur, i))} />
        ))}
      </PageSec>
      <HelpFoot />
    </>
  );
}

function WhyLink({ on, onPress }: { on: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: on }}
      onPress={onPress}
      style={({ pressed }) => [s.why, { opacity: pressed ? 0.6 : 1 }]}>
      <T v="small" style={{ fontFamily: font.bodySemi, color: c.accentText }}>
        {on ? 'Hide why each one helps' : 'Why each one helps'}
      </T>
    </Pressable>
  );
}

/** fresh: the row a lesson just added ("words:0"), to light up. add: a list to open with Add ready. */
function Lists({ fresh, add, place }: { fresh?: string; add?: string; place: Place }) {
  const c = useTheme();
  const { snap, apply, say } = useStore();
  const st = snap.settings!;
  const [fk, fi] = (fresh || '').split(':');
  const at = (k: ListKey) => (fk === k && fi !== '' && !isNaN(+fi) ? +fi : undefined);
  const mine = (kind: 'trig' | 'did') => st.opts[kind].filter((o) => !o.off);
  const one = (kind: 'trig' | 'did', title: string) => (
    <View style={{ gap: 2 }}>
      <T v="label">{title}</T>
      {mine(kind).length ? (
        mine(kind).map((o) => (
          <View key={o.id} style={s.opt}>
            <T style={{ flex: 1 }}>{o.t}</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Remove ' + o.t}
              onPress={() => {
                const at = st.opts[kind].findIndex((y) => y.id === o.id);
                apply((cur) => ({ st: removeOption(cur, snap.days, kind, o.id) }));
                say('Removed. Older entries keep it.', () => apply((cur) => ({ st: optionRestore(cur, kind, o, at) })));
              }}
              style={({ pressed }) => [s.drop, { opacity: pressed ? 0.6 : 1 }]}>
              <T v="small" style={{ fontFamily: font.bodySemi, color: c.danger }}>
                Remove
              </T>
            </Pressable>
          </View>
        ))
      ) : (
        <T v="small" tone="muted">
          None yet.
        </T>
      )}
    </View>
  );
  return (
    <>
      <ListCard
        k="menu"
        title="Calm moves"
        sub="The pause and Surprise me pick from these."
        icon="leaf"
        tone="mint"
        addLabel="Add a calm move"
        placeholder="Like: A brisk two-minute walk"
        fresh={at('menu')}
        openAdd={add === 'menu'}
        onLayout={place('menu')}
      />
      <ListCard
        k="wind"
        title="Wind-down"
        sub="The steps for the hour before screens go off."
        icon="moon"
        tone="sky"
        numbered
        addLabel="Add a step"
        placeholder="Like: Phone charges in another room"
        fresh={at('wind')}
        openAdd={add === 'wind'}
        onLayout={place('wind')}
      />
      <ListCard
        k="words"
        title="Words that steady me"
        sub="A verse, a prayer, or a line. They show in Get help and in the faith lessons."
        icon="star"
        tone="violet"
        addLabel="Add words"
        placeholder="A verse, a prayer, or a line that steadies you"
        fresh={at('words')}
        openAdd={add === 'words'}
        onLayout={place('words')}
      />
      <PageSec icon="pencil" title="My own answers" sub="To add one, tap “Add your own” on a check-in question. Entries that used one keep their words.">
        {one('trig', 'What set it off')}
        <Hair />
        {one('did', 'What did you do')}
      </PageSec>
    </>
  );
}

/** what the lessons gave me (the old My playbook): each takeaway with my notes, what I wrote, and copy it all */
function Learned() {
  const { snap, say } = useStore();
  const st = snap.settings!;
  const done = lessonsDone(snap.days);
  const notes = (st.learn && st.learn.notes) || {};
  const picks = (st.learn && st.learn.picks) || {};
  const mine = LESSONS.filter((L) => done.has(L.id));
  /* each checkpoint's writing under its own record, shown in the path's order and with the number the path gives it */
  const wrote = LCHECKS.map((C, k) => ({ n: k + 1, C, a: lwriteOf(st, k + 1) }))
    .filter((x) => x.a.some((t) => t.trim()))
    .sort((a, b) => lcheckNo(a.n, st) - lcheckNo(b.n, st));
  const toLearn = () => router.navigate('/learn');
  const copy = () => {
    const text = playbookText(
      st,
      done,
      LESSONS,
      (id) => LESSONS.findIndex((L) => L.id === id),
      LCHECKS,
      (n) => lcheckNo(n, st),
    );
    copyText(text, say);
  };
  const Note = ({ label, text }: { label: string; text: string }) => (
    <View style={s.note}>
      <T v="small" tone="muted">
        {label}
      </T>
      <T>{text}</T>
    </View>
  );
  return (
    <>
      <PageSec icon="book" tone="sky" title="What I have learned" aside={`${mine.length} of ${lessonCount(lessonWalk(snap.days, st)).of}`}>
        {mine.length ? (
          mine.map((L, j) => (
            <View key={L.id} style={{ gap: 12 }}>
              {j > 0 ? <Hair /> : null}
              <View style={{ gap: 4 }}>
                <T v="small" tone="muted" style={{ fontFamily: font.bodySemi }}>
                  {lessonNo(L, st) ? 'Lesson ' + lessonNo(L, st) + ' · ' : ''}
                  {L.title}
                </T>
                <T>{L.key}</T>
                {picks[L.id] ? <Note label="What I picked" text={picks[L.id]} /> : null}
                {notes[L.id] ? <Note label={L.np} text={String(notes[L.id])} /> : null}
              </View>
            </View>
          ))
        ) : (
          <T tone="muted">No lessons finished yet. Each one leaves a one-line takeaway here, with your note.</T>
        )}
        <PageLink icon="book" label="Open Learn" onPress={toLearn} />
      </PageSec>
      <PageSec icon="pencil" tone="violet" title="What I wrote" sub="Only you see it.">
        {wrote.length ? (
          wrote.map((x) => (
            <View key={x.n} style={{ gap: 4 }}>
              <T v="label">
                Checkpoint {lcheckNo(x.n, st)}: {x.C.t}
              </T>
              {x.C.q.map((q, i) => (x.a[i] && x.a[i].trim() ? <Note key={i} label={q} text={x.a[i]} /> : null))}
            </View>
          ))
        ) : (
          <T tone="muted">No writing yet. After every second lesson there is a short piece of writing, and what you write shows up here.</T>
        )}
      </PageSec>
      <PageLink icon="copy" label="Copy my whole plan as text" onPress={copy} />
      <HelpFoot />
    </>
  );
}

const s = StyleSheet.create({
  be: { borderRadius: 20, padding: 16, gap: 8 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  in: { fontFamily: font.body, fontSize: 15, lineHeight: 21, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 },
  ideas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  idea: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingVertical: 6 },
  formRow: { flexDirection: 'row', gap: 8 },
  remove: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 },
  why: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  drop: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  note: { gap: 2, marginTop: 4 },
});
