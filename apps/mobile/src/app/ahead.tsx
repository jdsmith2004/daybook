/* A plan for later: for when a slip is being planned before there is any urge (the hour is set, the house will be empty,
   the details are picked out, and part of you feels owed it, or has decided it will happen anyway). Nothing is happening
   yet, so this is not SOS and there is nothing to log. While it is quiet: when the hard hour is, what the plan counts on,
   a plain answer to the thoughts behind it, one change to make now, and (on a phone) a reminder at that hour. The plan
   then waits on Today until two hours after its hour. The rules and the research behind them are in core (ahead.ts).
   Opened from "A plan for later" under SOS on Today. */
import {
  AHEAD_LINKS,
  aheadAnswers,
  aheadFirst,
  aheadMoveName,
  aheadMoves,
  aheadTime,
  aheadWhen,
  gameCompute,
  type AheadLink,
  type AheadMove,
} from '@daybook/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/components/appear';
import { BigOption, Link } from '@/components/choices';
import { PickRow } from '@/components/picks';
import { Dock, Finish, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { remindersOffered, scheduleAhead } from '@/lib/reminders';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { useFinishTool } from '@/lib/tools';
import { font, useTheme } from '@/lib/theme';

type Step = 'hi' | 'when' | 'links' | 'answer' | 'moves' | 'remind' | 'end';

/* minutes after midnight, as the big clock shows them: "5:30" and "PM" */
const clock = (m: number) => (Math.floor(m / 60) % 12 || 12) + ':' + String(m % 60).padStart(2, '0');
const half = (m: number) => (Math.floor(m / 60) % 24 < 12 ? 'AM' : 'PM');

export default function Ahead() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const sos = useSos();
  const finish = useFinishTool();
  const [now] = useState(() => Date.now());
  const first = aheadFirst(now);
  const [step, setStep] = useState<Step>('hi');
  const [hist, setHist] = useState<Step[]>([]);
  const [dir, setDir] = useState(1);
  const [day, setDay] = useState<0 | 1>(first == null ? 1 : 0);
  const [mins, setMins] = useState<number | null>(null);
  const [links, setLinks] = useState<AheadLink[]>([]);
  const [moves, setMoves] = useState<AheadMove[]>([]);
  const [reminded, setReminded] = useState(false);
  const answers = aheadAnswers(links);
  const [level] = useState(() => (snap.settings ? Math.max(1, gameCompute(snap.days, snap.settings, snap.reviews, tk).level.n) : 1));
  const t = mins == null ? 0 : aheadTime(now, day, mins);
  const when = mins == null ? '' : aheadWhen(t, now);

  if (!snap.settings) return null;
  const order: Step[] = [
    'hi',
    'when',
    'links',
    ...(answers.length ? (['answer'] as Step[]) : []),
    'moves',
    ...(remindersOffered ? (['remind'] as Step[]) : []),
    'end',
  ];
  const go = (next: Step) => {
    setHist((h) => h.concat(step));
    setDir(1);
    setStep(next);
    if (next === 'end') keep();
  };
  const next = () => go(order[order.indexOf(step) + 1] || 'end');
  const back = () => {
    const h = hist.slice();
    const p = h.pop();
    if (!p) return;
    setHist(h);
    setDir(-1);
    setStep(p);
  };
  /* the plan is kept on this device, for the card on Today */
  const keep = () => sos.setMem((m) => ({ ...m, ahead: { t, moves } }));
  const done = () => finish('ahead', { msg: 'You got ahead of it.' });
  const toggle = <K extends string>(list: K[], k: K, set: (l: K[]) => void) => {
    buzz('tap');
    set(list.indexOf(k) >= 0 ? list.filter((x) => x !== k) : list.concat(k));
  };

  let body: React.ReactNode;
  let footer: React.ReactNode = null;
  if (step === 'hi') {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          A slip planned for later?
        </T>
        <T style={s.c}>
          Sometimes it starts long before any urge. The hour is set, the place will be free, maybe the details are already picked out. Part of you might even
          feel owed it.
        </T>
        <View style={s.middle}>
          <View style={[s.art, { backgroundColor: c.violetSoft }]}>
            <Icon name="compass" size={64} color={c.violetText} />
          </View>
          <T v="label" style={s.c}>
            You caught it while it is quiet.
          </T>
          <T v="small" tone="muted" style={s.c}>
            That is the easiest time to change it. Thinking about it is not a slip.
          </T>
        </View>
        <Dock>
          <Button label="Get ahead of it" onPress={next} />
        </Dock>
      </>
    );
    footer = <Link label="Not now" onPress={close} />;
  } else if (step === 'when') {
    const lo = day === 0 && first != null ? first : 0;
    const v = mins == null ? null : Math.max(lo, mins);
    body = (
      <>
        <T v="eyebrow" tone="muted">
          When
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          When is the hard hour?
        </T>
        <T style={s.c} tone="muted">
          The time the plan is counting on.
        </T>
        <View style={s.middle}>
          <SliderValue
            big
            long
            value={v}
            show={clock}
            unit={v == null ? undefined : half(v)}
            caption={day ? 'Tomorrow' : 'Today'}
            hint="Slide below to set it"
          />
        </View>
        <Dock>
          {first != null ? (
            <PickRow
              label="Which day"
              list={[
                { k: 0, label: 'Today' },
                { k: 1, label: 'Tomorrow' },
              ]}
              cur={day}
              onPick={(d) => {
                setDay(d as 0 | 1);
                if (d === 0 && mins != null && mins < first) setMins(first);
              }}
            />
          ) : null}
          <Slider
            key={day}
            label="The hard hour"
            value={v}
            min={lo}
            max={23 * 60 + 30}
            step={30}
            show={(m) => clock(m) + ' ' + half(m)}
            readout={false}
            onChange={setMins}
          />
          {v != null ? (
            <Appear by={10} duration={240}>
              <Button label="Next" onPress={next} />
            </Appear>
          ) : (
            <View style={s.btnSpace} />
          )}
        </Dock>
      </>
    );
  } else if (step === 'links') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          The plan
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          What is it counting on?
        </T>
        <T style={s.c} tone="muted">
          Pick any. Each one is a link you can change.
        </T>
        <Dock>
          <View style={s.list}>
            {AHEAD_LINKS.map(([k, name, sub]) => (
              <Check key={k} on={links.indexOf(k) >= 0} title={name} sub={sub} onPress={() => toggle(links, k, setLinks)} />
            ))}
          </View>
          <Button label="Next" onPress={next} />
        </Dock>
      </>
    );
  } else if (step === 'answer') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          The thought
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {answers.length > 1 ? 'Answer the thoughts' : 'Answer the thought'}
        </T>
        <View style={[s.middle, { gap: 12 }]}>
          {answers.map(([q, a], j) => (
            <Appear key={q} delay={120 + j * 90} by={12} style={[s.answer, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <Text style={[s.quote, { color: c.violetText }]}>“{q}”</Text>
              <T>{a}</T>
            </Appear>
          ))}
        </View>
        <Dock>
          <Button label="Next" onPress={next} />
        </Dock>
      </>
    );
  } else if (step === 'moves') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Now, while it is quiet
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Change one link.
        </T>
        <T style={s.c} tone="muted">
          Pick what you will do for {when.replace(/^(Today|Tomorrow), /, '')}. One is enough.
        </T>
        <Dock>
          <View style={s.list}>
            {aheadMoves(links).map(([k, name, sub]) => (
              <Check key={k} on={moves.indexOf(k) >= 0} title={name} sub={sub} onPress={() => toggle(moves, k, setMoves)} />
            ))}
          </View>
          {moves.length ? (
            <Appear by={10} duration={240}>
              <Button label="Next" onPress={next} />
            </Appear>
          ) : (
            <T v="small" tone="muted" style={[s.c, s.pickOne]}>
              Pick at least one.
            </T>
          )}
        </Dock>
      </>
    );
  } else if (step === 'remind') {
    const at = when.replace(/^(Today|Tomorrow), /, '');
    const remind = async (on: boolean) => {
      buzz('tap');
      const ok = on ? await scheduleAhead(t, at + ': ' + moves.map(aheadMoveName).join('. ') + '.') : false;
      setReminded(ok);
      go('end');
    };
    body = (
      <>
        <T v="eyebrow" tone="muted">
          At the hour
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Meet it at {at}?
        </T>
        <T style={s.c} tone="muted">
          Daybook can remind you then, with the move you picked. The words stay plain, so a locked screen shows nothing private.
        </T>
        <Dock>
          <BigOption tone="accent" icon="timer" title={'Remind me at ' + at} onPress={() => remind(true)} />
          <BigOption tone="sun" icon="check" title="No reminder" sub="The plan still waits on Today." onPress={() => remind(false)} />
        </Dock>
      </>
    );
  } else {
    body = (
      <>
        <Finish
          level={level}
          title="You got ahead of it."
          text={'If an urge shows up then, SOS is one tap away.' + (reminded ? ' Daybook will remind you.' : '')}
        />
        <Appear delay={420} style={[s.plan, { backgroundColor: c.surface, shadowColor: c.lip }]}>
          <T v="eyebrow" tone="muted">
            {when}
          </T>
          {moves.map((m) => (
            <View key={m} style={s.planRow}>
              <Icon name="check" size={18} color={c.mintText} />
              <T style={{ flex: 1 }}>{aheadMoveName(m)}</T>
            </View>
          ))}
        </Appear>
        <Dock>
          <Button label="Done" onPress={done} />
        </Dock>
      </>
    );
  }

  const n = order.length - 1;
  const i = order.indexOf(step);
  return (
    <SceneFrame
      title="A plan for later"
      sky="violet"
      dots={step === 'hi' ? null : { n, i: i - 1, label: step === 'end' ? 'All done' : 'Step ' + i + ' of ' + n }}
      onBack={step !== 'end' && hist.length ? back : null}
      onClose={step === 'end' ? done : close}
      footer={footer}>
      <Appear key={step} x={step === 'hi' ? 0 : 36 * dir} by={0} duration={280} style={s.stage}>
        {body}
      </Appear>
    </SceneFrame>
  );
}

/* one answer that can be picked with others: a check circle, the words, and a short line under them */
function Check({ on, title, sub, onPress }: { on: boolean; title: string; sub: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={({ pressed }) => [
        s.check,
        {
          backgroundColor: on ? c.accentSoft : c.surface,
          borderColor: on ? c.accent : 'transparent',
          shadowColor: c.lip,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}>
      <View style={[s.box, { borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : 'transparent' }]}>
        {on ? <Icon name="check" size={16} color={c.accentInk} /> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.checkT, { color: on ? c.accentText : c.ink }]}>{title}</Text>
        <Text style={[s.checkS, { color: c.muted }]}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 160 },
  art: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  btnSpace: { height: 52 },
  pickOne: { minHeight: 52, textAlignVertical: 'center', paddingTop: 16 },
  list: { alignSelf: 'stretch', gap: 8 },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  box: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkT: { fontFamily: font.bodyBold, fontSize: 16, lineHeight: 21 },
  checkS: { fontFamily: font.body, fontSize: 13.5, lineHeight: 18 },
  answer: {
    alignSelf: 'stretch',
    gap: 6,
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  quote: { fontFamily: font.display, fontSize: 20, lineHeight: 26 },
  plan: {
    alignSelf: 'stretch',
    gap: 8,
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
