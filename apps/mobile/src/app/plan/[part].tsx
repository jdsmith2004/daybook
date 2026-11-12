/* A chapter of My plan, open: the whole page in the chapter's color (lib/plan-look.ts), with every line of it big, and each
   one changed in place with a tap. When it hits holds the if-then lines, the calm moves and the wind-down; Why holds who I am
   becoming, my reasons, goal and words, the loop and my rule, the note and the voice note, and the words that steady me; If I
   slip holds my steps; My people holds my safe person; Getting ready holds the safety net and the next small steps.
   Before November 2026 these were the Why, Plans and Lists tabs of one page (the legacy viewPlan and viewBook). */
import {
  BE_LEN,
  cleanPhone,
  computeMetrics,
  HELP_STEPS,
  planAdd,
  planBlank,
  PLAN_MAX,
  planEdit,
  planRemove,
  planRestore,
  PLAN_THEN_LEN,
  PLAN_WHEN_LEN,
  safeName,
  SAFETY,
  setField,
  slipSteps,
  toggleHelpStep,
  toggleSafety,
  habitOf,
  safetyFor,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { Editable, Hair, PageLink, PageSec } from '@/components/editable';
import { Check } from '@/components/form';
import { RelLesson } from '@/components/help-bits';
import { KeepAbove } from '@/components/keyboard';
import { Rows } from '@/components/link-card';
import { ListCard } from '@/components/list-card';
import { SlipEditor } from '@/components/plan-editors';
import { Screen } from '@/components/screen';
import { TextInput } from '@/components/text';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { FutureList } from '@/components/future-list';
import { Packed } from '@/components/packed';
import { chapterPalette, CHAPTERS, partOf } from '@/lib/plan-look';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { font, PaletteOverride, useTheme } from '@/lib/theme';

export default function ChapterPage() {
  const params = useLocalSearchParams<{ part?: string; fresh?: string; add?: string }>();
  const { snap } = useStore();
  const base = useTheme();
  const part = partOf(params.part);
  if (!snap.settings) return <Redirect href="/" />;
  if (!part) return <Redirect href="/plan" />;
  const m = CHAPTERS[part][base.scheme];
  return (
    <PaletteOverride.Provider value={chapterPalette(base, part)}>
      <Screen
        title={CHAPTERS[part].title}
        back="My plan"
        backdrop={<LinearGradient colors={m.grad} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />}>
        <Appear style={{ gap: 24 }}>
          {part === 'urge' ? (
            <Urge fresh={params.fresh} add={params.add} />
          ) : part === 'why' ? (
            <Why fresh={params.fresh} add={params.add} />
          ) : part === 'slip' ? (
            <Slip />
          ) : part === 'people' ? (
            <People />
          ) : (
            <Ready />
          )}
        </Appear>
      </Screen>
    </PaletteOverride.Provider>
  );
}

/** fresh: the row a lesson just added ("words:0"), to light up. add: a list to open with Add ready. */
const litRow = (fresh: string | undefined, k: string) => {
  const [fk, fi] = (fresh || '').split(':');
  return fk === k && fi !== '' && !isNaN(+fi) ? +fi : undefined;
};

/* ---------- When it hits ---------- */

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

function Urge({ fresh, add }: { fresh?: string; add?: string }) {
  return (
    <>
      <View style={{ gap: 8 }}>
        <Lines />
        <Rows>
          <RelLesson id="l9" />
        </Rows>
      </View>
      <ListCard
        k="menu"
        title="Calm moves"
        sub="The pause and Surprise me pick from these."
        icon="leaf"
        tone="mint"
        addLabel="Add a calm move"
        placeholder="Like: A brisk two-minute walk"
        fresh={litRow(fresh, 'menu')}
        openAdd={add === 'menu'}
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
        fresh={litRow(fresh, 'wind')}
        openAdd={add === 'wind'}
      />
    </>
  );
}

/** the if-then lines, each one big: If in the heading face, then under it. Tap one to change it in place, or add one. */
function Lines() {
  const c = useTheme();
  const { snap, apply, say } = useStore();
  const st = snap.settings!;
  const [open, setOpen] = useState<number | 'new' | null>(null);
  const rows = st.plan.map((r, i) => ({ ...r, i })).filter((r) => !planBlank(r));
  const full = st.plan.length >= PLAN_MAX;
  return (
    <Card>
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
              <View style={{ flex: 1, gap: 4 }}>
                <T style={s.if}>If {r.when}</T>
                {r.then.trim() ? (
                  <T style={s.then}>{r.then.trim()}</T>
                ) : (
                  <T tone="muted" style={[s.then, { fontStyle: 'italic' }]}>
                    Then: not filled in yet
                  </T>
                )}
              </View>
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
    </Card>
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
  const input = [s.in, { color: c.ink, borderColor: c.line, backgroundColor: c.surface }];
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
      {when0 ? null : (
        <Packed>
          {WHEN_IDEAS.map((x) => (
            <Chip key={x} label={x} on={when.trim() === x} onPress={() => setWhen(x)} />
          ))}
        </Packed>
      )}
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
        {then0 ? null : (
          <View>
            {THEN_IDEAS.map((x) => {
              const on = then.trim() === x;
              return (
                <Pressable
                  key={x}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setThen(x)}
                  style={({ pressed }) => [s.idea, { opacity: pressed ? 0.6 : 1 }]}>
                  <Icon name={on ? 'check' : 'plus'} size={16} color={c.ink} />
                  <T style={{ flex: 1 }}>{x}</T>
                </Pressable>
              );
            })}
          </View>
        )}
        <Button label={save} disabled={!ok} onPress={() => onSave(when, then)} />
      </KeepAbove>
      <Pressable accessibilityRole="button" onPress={onCancel} style={s.remove}>
        <T v="small" style={{ fontFamily: font.bodySemi, textDecorationLine: 'underline' }}>
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

/* ---------- Why ---------- */

function Why({ fresh, add }: { fresh?: string; add?: string }) {
  const { snap, apply } = useStore();
  const st = snap.settings!;
  const set = (k: Parameters<typeof setField>[1]) => (v: string) => apply((cur) => ({ st: setField(cur, k, v) }));
  return (
    <>
      <Card>
        <T v="label">Who I am becoming</T>
        <Editable
          big
          value={st.becoming || ''}
          prompt="Write one sentence about who you are becoming"
          placeholder="I am someone who keeps my word to myself."
          maxLength={BE_LEN}
          onSave={set('becoming')}
        />
      </Card>
      <PageSec icon="heart" title="My reasons">
        {st.reasons.length ? (
          st.reasons.map((r, i) => (
            <T key={i} style={s.reason}>
              {r}
            </T>
          ))
        ) : (
          <T tone="muted">No reasons yet. They are what you read when it gets hard.</T>
        )}
        <PageLink
          icon={st.reasons.length ? 'pencil' : 'plus'}
          label={st.reasons.length ? 'Add, reorder or reword' : 'Add my first reason'}
          onPress={() => router.push('/reasons')}
        />
        <Hair />
        <Editable label="My goal" value={st.goal} prompt="Add my goal" onSave={set('goal')} />
        <Editable label="In my own words" value={st.why} prompt="Say why this matters" onSave={set('why')} />
      </PageSec>
      <PageSec icon="compass" title="The loop and my rule">
        <Editable label="The loop I am breaking" value={st.loop} prompt="Name the loop" placeholder="Fail → shame → hide → give up." onSave={set('loop')} />
        <Editable label="My new rule" value={st.rule} prompt="Write my rule" placeholder="I log slips instead of hiding them." onSave={set('rule')} />
      </PageSec>
      <PageSec icon="sparkle" title="Notes for hard moments">
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
        <Hair />
        <FutureList />
      </PageSec>
      <ListCard
        k="words"
        title="Words that steady me"
        sub="A verse, a prayer, or a line. They show in Get help and in the faith lessons."
        icon="star"
        tone="violet"
        addLabel="Add words"
        placeholder="A verse, a prayer, or a line that steadies you"
        fresh={litRow(fresh, 'words')}
        openAdd={add === 'words'}
      />
    </>
  );
}

/* ---------- If I slip ---------- */

function Slip() {
  const c = useTheme();
  const { snap } = useStore();
  const slip = slipSteps(snap.settings);
  const [edit, setEdit] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <Card>
        {edit ? (
          <Appear by={4} duration={180} style={{ gap: 12 }}>
            <SlipEditor />
            <Button label="Done" onPress={() => setEdit(false)} />
          </Appear>
        ) : (
          <>
            <T>A slip is data, not a reset. These steps are yours to change.</T>
            {slip.map((t, i) => (
              <View key={i} style={s.line}>
                <T style={[s.num, { color: c.ink }]}>{i + 1}</T>
                <T style={[s.then, { flex: 1 }]}>{t}</T>
              </View>
            ))}
            <PageLink icon="pencil" label="Change my steps" onPress={() => setEdit(true)} />
          </>
        )}
      </Card>
      <Rows>
        <RelLesson id="l3" />
        <RelLesson id="l6" />
      </Rows>
    </View>
  );
}

/* ---------- My people ---------- */

function People() {
  const { snap, apply, say } = useStore();
  const sos = useSos();
  const st = snap.settings!;
  const set = (k: Parameters<typeof setField>[1]) => (v: string) => apply((cur) => ({ st: setField(cur, k, v) }));
  const name = safeName(st);
  return (
    <>
      <PageSec icon="chat" title="My safe person">
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
          Text {name || 'them'} then opens your messages with the words ready. The number stays on this device and is never synced.
        </T>
        {name ? <PageLink icon="chat" label={'Text ' + name} onPress={() => router.push({ pathname: '/tool/[id]', params: { id: 'message' } })} /> : null}
      </PageSec>
      <Rows>
        <RelLesson id="l7" />
      </Rows>
      <PageLink icon="book" label="What to say: scripts to copy" onPress={() => router.push({ pathname: '/help/[id]', params: { id: 'people' } })} />
    </>
  );
}

/* ---------- Getting ready ---------- */

function Ready() {
  const { snap, tk, apply } = useStore();
  const st = snap.settings!;
  const m = computeMetrics(snap.days, st, tk);
  const [why, setWhy] = useState(false);
  return (
    <>
      <PageSec icon="check" title="Safety net" aside={`${m.safety} of ${SAFETY.length} done`} sub="Small setups that make the hard hours easier.">
        {SAFETY.map((row, i) => [i, ...safetyFor(i, row, habitOf(st))] as const).map(([i, label, w]) => (
          <Check key={i} label={label} why={why ? w : undefined} on={!!st.safety[i]} onPress={() => apply((cur) => toggleSafety(cur, i))} />
        ))}
        <WhyLink on={why} onPress={() => setWhy(!why)} />
      </PageSec>
      <PageSec icon="flag" title="My next small steps" aside={`${m.help} of ${HELP_STEPS.length} done`} sub="Real help is a few small calls, not one big leap.">
        {HELP_STEPS.map((label, i) => (
          <Check key={i} label={label} on={!!st.help[i]} onPress={() => apply((cur) => toggleHelpStep(cur, i))} />
        ))}
      </PageSec>
    </>
  );
}

function WhyLink({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: on }}
      onPress={onPress}
      style={({ pressed }) => [s.why, { opacity: pressed ? 0.6 : 1 }]}>
      <T v="small" style={{ fontFamily: font.bodySemi, textDecorationLine: 'underline' }}>
        {on ? 'Hide why each one helps' : 'Why each one helps'}
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  if: { fontFamily: font.displayBold, fontSize: 20, lineHeight: 25 },
  then: { fontSize: 17, lineHeight: 23 },
  reason: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 23 },
  num: { fontFamily: font.displayBold, fontSize: 17, lineHeight: 23, minWidth: 16 },
  in: { fontFamily: font.body, fontSize: 17, lineHeight: 23, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 },
  idea: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingVertical: 6 },
  formRow: { flexDirection: 'row', gap: 8 },
  remove: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 },
  why: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
});
