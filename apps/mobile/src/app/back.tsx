/* Welcome back (core away.ts, back.ts): after days away, one kind question fills the gap in. The question and the words at
   the top; the answers low, by the thumb; nothing is lost whatever the answer. "Some slips" picks the days on a short list
   of the gap (each is logged as a slip with no time), or says it is not sure which. Today opens this; the X leaves the gap
   unanswered, and Today asks once more the next day, then keeps a quiet row. */
import { addDays, answerAway, awayDue, fmtDate, type AwayAnswer } from '@daybook/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BigOption, Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { Dock, SceneFrame } from '@/components/scene';
import { Button, Chip, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';

export default function Back() {
  const { snap, tk, update } = useStore();
  const st = snap.settings;
  /* the gap is fixed when the page opens, so answering does not change what is shown */
  const [gap] = useState(() => (st ? awayDue(snap.days, st, tk) : null));
  const [step, setStep] = useState<'ask' | 'pick' | 'done'>('ask');
  const [picked, setPicked] = useState<string[]>([]);
  const [said, setSaid] = useState<AwayAnswer | null>(null);
  if (!st || !gap) {
    return (
      <SceneFrame title="Welcome back" sky="sun" onClose={close}>
        <T v="title" style={s.c} accessibilityRole="header">
          Welcome back.
        </T>
        <T style={s.c}>Everything you built is still here.</T>
        <Dock>
          <Button label="Go to Today" onPress={close} />
        </Dock>
      </SceneFrame>
    );
  }
  const answer = (a: AwayAnswer, days: string[] = []) => {
    update((s0) => {
      const r = answerAway(s0.days, s0.settings!, gap, a, days);
      return { ...s0, days: r.days, settings: r.st };
    });
    buzz(a === 'clean' ? 'lit' : 'save');
    setSaid(a === 'some' && !days.length ? 'skip' : a);
    setStep('done');
  };
  const dayWord = (k: string) => fmtDate(k, { weekday: 'short', month: 'short', day: 'numeric' });
  const span = gap.from === gap.to ? dayWord(gap.from) : dayWord(gap.from) + ' to ' + dayWord(gap.to);

  if (step === 'pick') {
    const list: string[] = [];
    for (let k = gap.to; k >= gap.from; k = addDays(k, -1)) list.push(k);
    return (
      <SceneFrame title="Welcome back" sky="sun" onBack={() => setStep('ask')} onClose={close}>
        <T v="title" style={s.c} accessibilityRole="header">
          Which days had a slip?
        </T>
        <T style={s.c} tone="muted">
          Tap the ones you remember. The other days count as days with no slip.
        </T>
        <Dock>
          <View style={s.days} accessibilityLabel="The days you were away">
            {list.map((k) => (
              <Chip
                key={k}
                label={dayWord(k)}
                on={picked.includes(k)}
                onPress={() => setPicked(picked.includes(k) ? picked.filter((x) => x !== k) : picked.concat(k))}
              />
            ))}
          </View>
          <Button label={picked.length ? 'Save' : 'Pick the days first'} disabled={!picked.length} onPress={() => answer('some', picked)} />
          <Link label="I am not sure which days" onPress={() => answer('skip')} />
        </Dock>
      </SceneFrame>
    );
  }

  if (step === 'done') {
    const words =
      said === 'clean'
        ? { h: 'Then those days count.', p: `${gap.n} more ${gap.n === 1 ? 'day' : 'days'} with no slip. That is real, and it is yours.` }
        : said === 'some'
          ? { h: 'Thank you for being honest.', p: 'The slips are logged, and the other days count. A slip is data, not a reset.' }
          : { h: 'That is okay.', p: 'Your count picks up from where it paused. Nothing you built is gone.' };
    return (
      <SceneFrame title="Welcome back" sky="mint" onClose={close}>
        <View style={s.mid}>
          <Flame level={2} size={110} />
        </View>
        <T v="title" style={s.c} accessibilityRole="header">
          {words.h}
        </T>
        <T style={s.c}>{words.p}</T>
        <Dock>
          <Button label="Go to Today" onPress={close} />
        </Dock>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame title="Welcome back" sky="sun" onClose={close}>
      <T v="title" style={s.c} accessibilityRole="header">
        Welcome back. Everything you built is still here.
      </T>
      <T style={s.c}>
        You were away a while, so Daybook does not know how {gap.n === 1 ? 'one day' : gap.n + ' days'} went ({span}). How did {gap.n === 1 ? 'it' : 'they'} go?
      </T>
      <View style={s.mid}>
        <Flame level={2} size={100} />
      </View>
      <Dock>
        <BigOption tone="mint" icon="leaf" title="No slips" sub="Those days count." onPress={() => answer('clean')} />
        <BigOption tone="slip" icon="wave" title="Some slips" sub="Pick the days. The others count." onPress={() => setStep('pick')} />
        <Link label="I would rather not say" onPress={() => answer('skip')} />
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});
