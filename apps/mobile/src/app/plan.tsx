/* My plan: Why (who I am becoming, my goal, my safe person, a note and a voice note for hard moments), Plans (the safety net, the urge plan, the slip plan, next small
   steps), and Lists (calm moves, the wind-down, words that steady me, my own check-in answers). Changes save as you type.
   Ported from the legacy viewPlan, whyBody, plansBody and listsBody. */
import {
  BE_LEN,
  computeMetrics,
  HELP_STEPS,
  removeOption,
  SAFETY,
  setField,
  type ListKey,
  toggleHelpStep,
  toggleSafety,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';

import { Appear } from '@/components/appear';
import { Field } from '@/components/choices';
import { Check, Segments } from '@/components/form';
import { RelLesson } from '@/components/help-bits';
import { HelpFoot } from '@/components/help-foot';
import { LinkCard } from '@/components/link-card';
import { ListCard } from '@/components/list-card';
import { SlipEditor, UrgeEditor } from '@/components/plan-editors';
import { Screen } from '@/components/screen';
import { Card, Chip, T } from '@/components/ui';
import { VoiceRecorder } from '@/components/voice-note';
import { useStore } from '@/lib/store';

type Pane = 'why' | 'plans' | 'lists';
type Sub = 'safety' | 'urge' | 'slip' | 'steps';

export default function Plan() {
  const params = useLocalSearchParams<{ pane?: string; sub?: string; fresh?: string; add?: string }>();
  const scroll = useRef<ScrollViewInstance>(null);
  /* where the pane starts on the page, so a list inside it can be scrolled to */
  const paneY = useRef(0);
  const { snap } = useStore();
  const [pane, setPane] = useState<Pane>(params.pane === 'plans' || params.pane === 'lists' ? params.pane : params.sub ? 'plans' : 'why');
  const [sub, setSub] = useState<Sub>(['safety', 'urge', 'slip', 'steps'].indexOf(params.sub || '') >= 0 ? (params.sub as Sub) : 'safety');
  if (!snap.settings) return <Redirect href="/" />;
  const words = {
    why: 'The reasons that matter to you, and the person you can tell.',
    plans: 'A safety net, what to do when an urge hits, and what to do after a slip.',
    lists: 'Your calm moves, your wind-down, and the words that steady you.',
  }[pane];
  return (
    <Screen title="My plan" sub={<T tone="muted">{words}</T>} back="More" scrollRef={scroll}>
      <Segments
        label="My plan sections"
        list={[
          ['why', 'Why'],
          ['plans', 'Plans'],
          ['lists', 'Lists'],
        ]}
        cur={pane}
        onPick={setPane}
      />
      <Appear key={pane} style={{ gap: 14 }} onLayout={(e) => (paneY.current = e.nativeEvent.layout.y)}>
      {pane === 'plans' ? <Plans sub={sub} setSub={setSub} onLists={() => setPane('lists')} /> : pane === 'lists' ? <Lists fresh={params.fresh} add={params.add} scrollTo={(y) => scroll.current?.scrollTo({ y: Math.max(0, y + paneY.current - 8), animated: true })} /> : <Why />}
      </Appear>
    </Screen>
  );
}

function Why() {
  const { snap, apply } = useStore();
  const st = snap.settings!;
  const set = (k: Parameters<typeof setField>[1]) => (v: string) => apply({ st: setField(snap.settings!, k, v) });
  return (
    <>
      <Card>
        <T v="h2">Who I am becoming</T>
        <Field
          label="One sentence, in my own words"
          multiline
          maxLength={BE_LEN}
          defaultValue={st.becoming || ''}
          placeholder="I am someone who keeps my word to myself."
          onChangeText={set('becoming')}
        />
        <T v="small" tone="muted">
          Today shows it under the date, and SOS opens with it. Say who you are, not what you avoid.
        </T>
      </Card>
      <Card>
        <T v="h2">My goal and why</T>
        <T v="small" tone="muted">
          Edit anything. Changes save as you type.
        </T>
        <Field label="My goal" multiline defaultValue={st.goal} onChangeText={set('goal')} />
        <Field label="Why I am doing this" multiline defaultValue={st.why} onChangeText={set('why')} />
        <Field label="The loop I am breaking" multiline defaultValue={st.loop} onChangeText={set('loop')} />
        <Field label="My new rule" multiline defaultValue={st.rule} onChangeText={set('rule')} />
      </Card>
      <Card>
        <T v="h2">My safe person</T>
        <Field label="Name" maxLength={80} defaultValue={st.safePerson} placeholder="Someone I trust" onChangeText={set('safePerson')} />
        <Field label="What I will ask them" multiline defaultValue={st.ask} onChangeText={set('ask')} />
        <T v="small" tone="muted">
          Scripts you can copy are in Get help › What to say.
        </T>
      </Card>
      <Card>
        <T v="h2">A note for hard moments</T>
        <Field
          label="From me, on a calm day"
          multiline
          maxLength={600}
          defaultValue={st.note || ''}
          placeholder="Like: It always passes. You have done this before. In an hour you will be glad."
          onChangeText={set('note')}
        />
        <T v="small" tone="muted">
          SOS and My reasons show it to you first. With no note, SOS shows one of your reasons.
        </T>
        <VoiceRecorder />
      </Card>
      <View style={{ gap: 8 }}>
        <LinkCard icon="star" title="My reasons" sub={`${st.reasons.length} saved · open to add, reorder or reword`} onPress={() => router.push('/reasons')} />
        <LinkCard icon="compass" title="My playbook" sub="My reasons, my plan, and what the lessons gave me, on one page" onPress={() => router.push('/book')} />
      </View>
    </>
  );
}

function Plans({ sub, setSub, onLists }: { sub: Sub; setSub: (s: Sub) => void; onLists: () => void }) {
  const { snap, tk, apply } = useStore();
  const st = snap.settings!;
  const m = computeMetrics(snap.days, st, tk);
  return (
    <>
      <View style={s.chips} accessibilityLabel="Plan sections">
        {(
          [
            ['safety', 'Safety net'],
            ['urge', 'Urge plan'],
            ['slip', 'Slip plan'],
            ['steps', 'Next steps'],
          ] as [Sub, string][]
        ).map(([k, l]) => (
          <Chip key={k} label={l} on={sub === k} onPress={() => setSub(k)} />
        ))}
      </View>
      {sub === 'safety' ? (
        <Card>
          <View style={s.between}>
            <T v="h2">Safety net</T>
            <T v="small" tone="muted">
              {m.safety} of {SAFETY.length} done
            </T>
          </View>
          <T v="small" tone="muted">
            Eight small setups that make the hard hours easier. Tick them off as you go.
          </T>
          {SAFETY.map(([label, why], i) => (
            <Check key={i} label={label} why={why} on={!!st.safety[i]} onPress={() => apply(toggleSafety(snap.settings!, i))} />
          ))}
        </Card>
      ) : sub === 'urge' ? (
        <>
          <Card>
            <T v="h2">When an urge hits</T>
            <T>
              Tap SOS. A few quick questions, then one tool picked for you, with others to choose from, including the plan below. The 10-minute pause is one of the tools, and you can end it sooner if
              the urge eases. At the end the app asks one quick question about how it went. You can skip it. Riding it out and slipping are both fine answers.
            </T>
            <UrgeEditor />
          </Card>
          <RelLesson id="l9" />
        </>
      ) : sub === 'slip' ? (
        <>
          <Card>
            <SlipEditor />
          </Card>
          <RelLesson id="l3" />
          <RelLesson id="l6" />
        </>
      ) : (
        <Card>
          <View style={s.between}>
            <T v="h2">My next small steps</T>
            <T v="small" tone="muted">
              {m.help} of {HELP_STEPS.length} done
            </T>
          </View>
          <T v="small" tone="muted">
            Real help is a few small calls, not one big leap. Tick them off as you go.
          </T>
          {HELP_STEPS.map((label, i) => (
            <Check key={i} label={label} on={!!st.help[i]} onPress={() => apply(toggleHelpStep(snap.settings!, i))} />
          ))}
        </Card>
      )}
      <LinkCard icon="star" title="My reasons" sub={`${st.reasons.length} saved · read, add or reword`} onPress={() => router.push('/reasons')} />
      <LinkCard icon="sliders" title="My lists" sub="Calm moves, wind-down, and the words that steady me" onPress={onLists} />
      <HelpFoot />
    </>
  );
}

/** fresh: the row a lesson just added ("words:0"), to scroll to and light up. add: a list to open with Add ready. */
function Lists({ fresh, add, scrollTo }: { fresh?: string; add?: string; scrollTo: (y: number) => void }) {
  const { snap, apply, say } = useStore();
  const st = snap.settings!;
  const [fk, fi] = (fresh || '').split(':');
  const at = (k: ListKey) => (fk === k && fi !== '' && !isNaN(+fi) ? +fi : undefined);
  const aim = fk || add || '';
  const done = useRef(false);
  const place = (k: ListKey) => (e: LayoutChangeEvent) => {
    if (k !== aim || done.current) return;
    done.current = true;
    const y = e.nativeEvent.layout.y;
    setTimeout(() => scrollTo(y), 250);
  };
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
                apply({ st: removeOption(snap.settings!, snap.days, kind, o.id) });
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
      <Card>
        <View style={s.between}>
          <T v="h2">My own answers</T>
          <T v="small" tone="muted">
            check-in questions
          </T>
        </View>
        <T v="small" tone="muted">
          To add one, tap “Add your own” on a check-in question. It stays on your list for next time. Removing one takes it off the list, and entries that used it keep their words.
        </T>
        {one('trig', 'What set it off')}
        {one('did', 'What did you do')}
      </Card>
      <LinkCard icon="star" title="My reasons" sub={`${st.reasons.length} saved · open to add, reorder or reword`} onPress={() => router.push('/reasons')} />
    </>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
