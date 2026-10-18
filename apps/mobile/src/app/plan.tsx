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
  faithOf,
  HELP_STEPS,
  LCHECKS,
  lessonNo,
  LESSONS,
  lessonsDone,
  type ListKey,
  lwriteOf,
  playbookText,
  removeOption,
  safeName,
  SAFETY,
  setField,
  setPlanRow,
  slipSteps,
  toggleHelpStep,
  toggleSafety,
} from '@daybook/core';
import * as Clipboard from 'expo-clipboard';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';

import { Appear } from '@/components/appear';
import { Editable } from '@/components/editable';
import { Check, Segments } from '@/components/form';
import { RelLesson } from '@/components/help-bits';
import { HelpFoot } from '@/components/help-foot';
import { LinkCard } from '@/components/link-card';
import { ListCard } from '@/components/list-card';
import { SlipEditor } from '@/components/plan-editors';
import { Screen } from '@/components/screen';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { VoiceRecorder } from '@/components/voice-note';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

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
  const words = {
    why: 'Who you are becoming, and why. Read it on a hard night. Tap anything to change it.',
    plans: 'What you will do when an urge hits, and after a slip, decided now while it is calm.',
    lists: 'Your calm moves, your wind-down, and the words that steady you.',
    learned: 'What each lesson gave you, and what you wrote. Only you see it.',
  }[pane];
  return (
    <Screen title="My plan" sub={<T tone="muted">{words}</T>} back="More" scrollRef={scroll}>
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
      <Appear key={pane} style={{ gap: 14 }} onLayout={(e) => (paneY.current = e.nativeEvent.layout.y)}>
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

/** a part of the page: an icon, a title, an optional count, then its lines */
function Sec({
  icon,
  tone = 'accent',
  title,
  aside,
  children,
  onLayout,
}: {
  icon: string;
  tone?: 'accent' | 'mint' | 'sky' | 'sun' | 'coral' | 'violet';
  title: string;
  aside?: string;
  children: ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const c = useTheme();
  const soft = { accent: c.accentSoft, mint: c.mintSoft, sky: c.skySoft, sun: c.sunSoft, coral: c.coralSoft, violet: c.violetSoft }[tone];
  const ink = { accent: c.accentText, mint: c.mintText, sky: c.skyText, sun: c.sunText, coral: c.coralText, violet: c.violetText }[tone];
  return (
    <View onLayout={onLayout}>
      <Card>
        <View style={s.head}>
          <View style={[s.headIc, { backgroundColor: soft }]}>
            <Icon name={icon} size={22} color={ink} />
          </View>
          <T v="h2" style={{ flex: 1 }}>
            {title}
          </T>
          {aside ? (
            <T v="small" tone="muted">
              {aside}
            </T>
          ) : null}
        </View>
        {children}
      </Card>
    </View>
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
        <T v="small" tone="muted">
          Today shows it under the date, and SOS opens with it.
        </T>
      </View>
      <Sec icon="star" tone="sun" title="Why I am doing this" aside={`${st.reasons.length} reasons`}>
        {st.reasons.length ? (
          st.reasons.map((r, i) => (
            <View key={i} style={s.line}>
              <Icon name="heart" size={16} color={c.coralText} />
              <T style={{ flex: 1 }}>{r}</T>
            </View>
          ))
        ) : (
          <T tone="muted">No reasons yet. They are what you read when it gets hard.</T>
        )}
        <Chip label={st.reasons.length ? 'Add, reorder or reword' : 'Add my first reason'} on={false} onPress={() => router.push('/reasons')} />
        <View style={[s.rule, { backgroundColor: c.line }]} />
        <Editable label="My goal" value={st.goal} prompt="Add my goal" onSave={set('goal')} />
        <Editable label="In my own words" value={st.why} prompt="Say why this matters" onSave={set('why')} />
      </Sec>
      <Sec icon="compass" tone="violet" title="The loop and my rule">
        <Editable label="The loop I am breaking" value={st.loop} prompt="Name the loop" placeholder="Fail → shame → hide → give up." onSave={set('loop')} />
        <Editable label="My new rule" value={st.rule} prompt="Write my rule" placeholder="I log slips instead of hiding them." onSave={set('rule')} />
      </Sec>
      <Sec icon="chat" tone="mint" title="My safe person" onLayout={place('safe')}>
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
          With their number, Text {safeName(st) || 'them'} opens your messages app with the words ready to send. It stays on this device and is never synced.
          Scripts you can copy are in Get help › What to say.
        </T>
      </Sec>
      <Sec icon="sparkle" tone="sky" title="A note for hard moments">
        <Editable
          label="From me, on a calm day"
          value={st.note || ''}
          prompt="Write a note to myself"
          placeholder="Like: It always passes. You have done this before. In an hour you will be glad."
          maxLength={600}
          onSave={set('note')}
        />
        <T v="small" tone="muted">
          SOS and My reasons show it to you first. With no note, SOS shows one of your reasons.
        </T>
        <VoiceRecorder />
      </Sec>
      <HelpFoot />
    </>
  );
}

/** one line of the urge plan, read as "If … then …"; tap it to change both halves */
function UrgeRow({ i, when, then }: { i: number; when: string; then: string }) {
  const c = useTheme();
  const { apply } = useStore();
  const [open, setOpen] = useState(false);
  const blank = !when.trim() || when.indexOf('______') >= 0;
  const set = (fld: 'when' | 'then') => (v: string) => apply((cur) => ({ st: setPlanRow(cur, i, fld, v) }));
  if (open)
    return (
      <Appear by={4} duration={180} style={[s.urge, { backgroundColor: c.surface2, borderColor: c.accent }]}>
        <T v="label">If</T>
        <TextInput
          value={when}
          onChangeText={set('when')}
          maxLength={120}
          placeholder="Like: I am in bed late at night"
          placeholderTextColor={c.muted}
          accessibilityLabel="If"
          style={[s.in, { color: c.ink, backgroundColor: c.surface, borderColor: c.line }]}
        />
        <T v="label">Then I will</T>
        <TextInput
          value={then}
          onChangeText={set('then')}
          multiline
          maxLength={400}
          autoFocus={!blank}
          placeholder="One clear thing I will do"
          placeholderTextColor={c.muted}
          accessibilityLabel="Then I will"
          style={[s.in, { color: c.ink, backgroundColor: c.surface, borderColor: c.line, minHeight: 64 }]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => setOpen(false)}
          style={({ pressed }) => [s.done, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
          <Icon name="check" size={16} color={c.accentInk} />
          <T v="label" style={{ color: c.accentInk }}>
            Done
          </T>
        </Pressable>
      </Appear>
    );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens it to change"
      onPress={() => setOpen(true)}
      style={({ pressed }) => [s.urge, { backgroundColor: c.surface2, borderColor: 'transparent', opacity: pressed ? 0.85 : 1 }]}>
      {blank && !then.trim() ? (
        <View style={s.line}>
          <Icon name="plus" size={16} color={c.accentText} />
          <T tone="accentText" style={{ fontFamily: font.bodySemi, flex: 1 }}>
            Add my own if-then line
          </T>
        </View>
      ) : (
        <>
          <View style={s.line}>
            <T v="eyebrow" tone="accentText" style={s.tag}>
              If
            </T>
            <T style={{ flex: 1, fontFamily: font.bodySemi }}>{blank ? 'Something else' : when}</T>
            <Icon name="pencil" size={16} color={c.muted} />
          </View>
          <View style={s.line}>
            <T v="eyebrow" tone="mintText" style={s.tag}>
              Then
            </T>
            {then.trim() ? (
              <T style={{ flex: 1 }}>{then}</T>
            ) : (
              <T tone="muted" style={{ flex: 1 }}>
                Not filled in yet
              </T>
            )}
          </View>
        </>
      )}
    </Pressable>
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
      <Sec icon="shield" title="When an urge hits" onLayout={place('urge')}>
        <T v="small" tone="muted">
          Tap SOS when an urge hits. This plan is one of the tools it offers. Tap a line to change it.
        </T>
        {st.plan.map((r, i) => (
          <UrgeRow key={i} i={i} when={r.when} then={r.then} />
        ))}
      </Sec>
      <RelLesson id="l9" />
      <Sec icon="heart" tone="coral" title="If I slip" aside={`${slip.length} steps`} onLayout={place('slip')}>
        {editSlip ? (
          <Appear by={4} duration={180} style={{ gap: 12 }}>
            <SlipEditor />
            <Button label="Done" onPress={() => setEditSlip(false)} />
          </Appear>
        ) : (
          <>
            <T v="small" tone="muted">
              A slip is data, not a reset. After you log one, these show on Today.
            </T>
            {slip.map((t, i) => (
              <View key={i} style={s.line}>
                <View style={[s.num, { backgroundColor: c.coralSoft }]}>
                  <T style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.coralText }}>{i + 1}</T>
                </View>
                <T style={{ flex: 1 }}>{t}</T>
              </View>
            ))}
            <Chip label="Change my steps" on={false} onPress={() => setEditSlip(true)} />
          </>
        )}
      </Sec>
      <View style={{ gap: 8 }}>
        <RelLesson id="l3" />
        <RelLesson id="l6" />
      </View>
      <Sec icon="check" tone="mint" title="Safety net" aside={`${m.safety} of ${SAFETY.length} done`} onLayout={place('safety')}>
        <T v="small" tone="muted">
          Small setups that make the hard hours easier.
        </T>
        {SAFETY.map(([label, w], i) => (
          <Check key={i} label={label} why={why === 'safety' ? w : undefined} on={!!st.safety[i]} onPress={() => apply((cur) => toggleSafety(cur, i))} />
        ))}
        <WhyLink on={why === 'safety'} onPress={() => setWhy(why === 'safety' ? null : 'safety')} />
      </Sec>
      <Sec icon="flag" tone="sky" title="My next small steps" aside={`${m.help} of ${HELP_STEPS.length} done`} onLayout={place('steps')}>
        <T v="small" tone="muted">
          Real help is a few small calls, not one big leap.
        </T>
        {HELP_STEPS.map((label, i) => (
          <Check key={i} label={label} on={!!st.help[i]} onPress={() => apply((cur) => toggleHelpStep(cur, i))} />
        ))}
      </Sec>
      <HelpFoot />
    </>
  );
}

function WhyLink({ on, onPress }: { on: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: on }} onPress={onPress} hitSlop={8} style={s.why}>
      <T v="small" style={{ fontFamily: font.bodySemi, color: c.accentText }}>
        {on ? 'Hide why each one helps' : 'Why each one helps'}
      </T>
    </Pressable>
  );
}

/** fresh: the row a lesson just added ("words:0"), to light up. add: a list to open with Add ready. */
function Lists({ fresh, add, place }: { fresh?: string; add?: string; place: Place }) {
  const { snap, apply, say } = useStore();
  const st = snap.settings!;
  const [fk, fi] = (fresh || '').split(':');
  const at = (k: ListKey) => (fk === k && fi !== '' && !isNaN(+fi) ? +fi : undefined);
  const mine = (kind: 'trig' | 'did') => st.opts[kind].filter((o) => !o.off);
  const one = (kind: 'trig' | 'did', title: string) => (
    <View style={{ gap: 6 }}>
      <T v="label">{title}</T>
      {mine(kind).length ? (
        mine(kind).map((o) => (
          <View key={o.id} style={s.opt}>
            <T style={{ flex: 1 }}>{o.t}</T>
            <Chip
              label="Remove"
              on={false}
              onPress={() => {
                apply((cur) => ({ st: removeOption(cur, snap.days, kind, o.id) }));
                say('Removed. Older entries keep it.');
              }}
            />
          </View>
        ))
      ) : (
        <T v="small" tone="muted">
          Nothing added yet.
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
      <Sec icon="pencil" title="My own answers" aside="check-in">
        <T v="small" tone="muted">
          To add one, tap “Add your own” on a check-in question. Removing one takes it off the list, and entries that used it keep their words.
        </T>
        {one('trig', 'What set it off')}
        {one('did', 'What did you do')}
      </Sec>
    </>
  );
}

/** what the lessons gave me (the old My playbook): each takeaway with my notes, what I wrote, and copy it all */
function Learned() {
  const c = useTheme();
  const { snap, say } = useStore();
  const st = snap.settings!;
  const done = lessonsDone(snap.days);
  const notes = (st.learn && st.learn.notes) || {};
  const picks = (st.learn && st.learn.picks) || {};
  const mine = LESSONS.filter((L) => done.has(L.id));
  const wrote = LCHECKS.map((C, k) => ({ n: k + 1, C, a: lwriteOf(st, k + 1) })).filter((x) => x.a.some((t) => t.trim()));
  const toLearn = () => router.navigate('/learn');
  const copy = () => {
    const text = playbookText(st, done, LESSONS, (id) => LESSONS.findIndex((L) => L.id === id), LCHECKS);
    Clipboard.setStringAsync(text)
      .then(() => say('Copied.'))
      .catch(() => say('Could not copy. Press and hold the text to copy it.'));
  };
  const Note = ({ label, text }: { label: string; text: string }) => (
    <View style={[s.note, { backgroundColor: c.surface2 }]}>
      <T v="small" tone="muted">
        {label}
      </T>
      <T>{text}</T>
    </View>
  );
  return (
    <>
      <Sec icon="book" tone="sky" title="What I have learned" aside={`${mine.length} of ${LESSONS.length}`}>
        {mine.length ? (
          mine.map((L) => (
            <View key={L.id} style={[s.takeaway, { borderColor: c.line }]}>
              <T v="small" tone="muted" style={{ fontFamily: font.bodySemi }}>
                Lesson {lessonNo(L, faithOf(st))} · {L.title}
              </T>
              <T>{L.key}</T>
              {picks[L.id] ? <Note label="What I picked" text={picks[L.id]} /> : null}
              {notes[L.id] ? <Note label={L.np} text={String(notes[L.id])} /> : null}
            </View>
          ))
        ) : (
          <T tone="muted">Finish a lesson and its one-line takeaway shows up here, with your note.</T>
        )}
        <Chip label="Open Learn" on={false} onPress={toLearn} />
      </Sec>
      <Sec icon="pencil" tone="violet" title="What I wrote">
        {wrote.length ? (
          wrote.map((x) => (
            <View key={x.n} style={{ gap: 6 }}>
              <T v="label">
                Checkpoint {x.n}: {x.C.t}
              </T>
              {x.C.q.map((q, i) => (x.a[i] && x.a[i].trim() ? <Note key={i} label={q} text={x.a[i]} /> : null))}
            </View>
          ))
        ) : (
          <T tone="muted">After every second lesson there is a short piece of writing. What you write shows up here.</T>
        )}
      </Sec>
      <Button kind="ghost" icon="copy" label="Copy my whole plan as text" onPress={copy} />
      <HelpFoot />
    </>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIc: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  be: { borderRadius: 24, padding: 18, gap: 8 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rule: { height: 1, marginVertical: 2 },
  urge: { borderRadius: 16, borderWidth: 2, padding: 12, gap: 8 },
  tag: { width: 40, paddingTop: 3 },
  in: { fontFamily: font.body, fontSize: 15, lineHeight: 21, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 },
  done: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, paddingHorizontal: 16, borderRadius: 999 },
  num: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  why: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  note: { gap: 2, padding: 10, borderRadius: 12 },
  takeaway: { gap: 6, paddingBottom: 12, borderBottomWidth: 1 },
});
