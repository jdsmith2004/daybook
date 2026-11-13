/* The five questions again (core recheck.ts): one statement a page, one tap each, then the score next to the last one, with a
   line of hope. Only the score is kept, on this device. Closed before the end, nothing is kept, and it asks again in a week.
   After them, when it is due, the north star (core north.ts): "How much do you see yourself as someone free of this?", 0 to 10,
   with the person's own proof above it, and the answer next to the last one. Its card on Today opens it alone (?only=free), for
   another habit or when the five are not due. Its answers are kept with the person's records and synced; closed unanswered, it
   asks again in a week. */
import {
  BPS_STEM,
  bpsKeep,
  bpsResult,
  bpsScore,
  bpsScores,
  FREE_HI,
  habitOf,
  habitSay,
  FREE_LO,
  FREE_Q,
  freeCounts,
  freeDue,
  freeKeep,
  freeLater,
  freeList,
  freeProof,
  freeResult,
  OB_BPS,
  OB_BPS_C,
  careLastAt,
} from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { FreeProof } from '@/components/free-proof';
import { Middle, Dock } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Slider, SliderValue } from '@/components/slider';
import { ChoiceRows } from '@/components/slip';
import { Text } from '@/components/text';
import { Button, T } from '@/components/ui';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { useSos } from '@/lib/sos';
import { usePullDowns } from '@/lib/pull';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/* never the flame here: the flame is the person getting free */
const ICONS = ['leaf', 'wave', 'bolt'];
const TONES = ['mint', 'sky', 'violet'];

export default function Recheck() {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const downs = usePullDowns();
  const sos = useSos();
  const params = useLocalSearchParams<{ only?: string }>();
  /* what this visit asks, decided once: the five (unless the card was for the one question alone), and the north star when due */
  const [five] = useState(() => params.only !== 'free');
  const [askFree] = useState(
    () => params.only === 'free' || (!!snap.settings && freeDue(snap.days, snap.settings, tk, { now: Date.now(), sos: careLastAt(sos.mem) })),
  );
  const [answers, setAnswers] = useState<number[]>([]);
  /* past the five's result, on to the one question */
  const [onFree, setOnFree] = useState(!five);
  const [freeV, setFreeV] = useState<number | null>(null);
  const [freeSaved, setFreeSaved] = useState(false);
  /* the scores to compare with, read once, so a result does not compare the new answer with itself */
  const [last] = useState(() => {
    const list = bpsScores(snap.settings, sos.mem);
    return list.length ? list[list.length - 1].s : null;
  });
  const [lastFree] = useState(() => {
    const list = freeList(snap.settings);
    return list.length ? list[list.length - 1].s : null;
  });
  const finished = useRef(false);
  const freeDone = useRef(false);
  const memo = useRef({ setMem: sos.setMem, apply });
  memo.current = { setMem: sos.setMem, apply };
  /* closed before the end (the X, or the sheet swiped away): what was not answered asks again in a week */
  useEffect(
    () => () => {
      if (five && !finished.current) memo.current.setMem((m) => ({ ...m, bpsNo: tk }));
      if (askFree && !freeDone.current) memo.current.apply((st) => ({ st: freeLater(st, tk) }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const pick = (n: number) => {
    const next = answers.concat(n);
    buzz('tap');
    setAnswers(next);
    if (next.length === OB_BPS.length) {
      finished.current = true;
      /* what Daybook learns: the five answers as numbers, the closest thing it has to "is it working" */
      track('recheck', { q1: next[0], q2: next[1], q3: next[2], q4: next[3], q5: next[4] });
      sos.setMem((m) => {
        const { bpsNo: _no, ...rest } = m;
        return bpsKeep(rest, tk, bpsScore(next));
      });
    }
  };
  const saveFree = () => {
    if (freeV == null || freeDone.current) return;
    freeDone.current = true;
    buzz('lit');
    apply((st) => ({ st: freeKeep(st, tk, freeV) }));
    /* what Daybook learns: the number, and the last 30 days as two counts (never words) */
    track('free', { free: freeV, ...freeCounts(snap.days, tk) });
    setFreeSaved(true);
  };

  /* the north star's answer, next to the last one */
  if (onFree && freeSaved && freeV != null) {
    const r = freeResult(freeV, lastFree);
    return (
      <SheetFrame title="One question">
        <T v="title" accessibilityRole="header">
          {r.h}
        </T>
        <T>{r.p}</T>
        <Middle>
          <Pair last={lastFree} now={freeV} />
        </Middle>
        <Dock>
          <Button label="Done" onPress={closeSheet} />
        </Dock>
      </SheetFrame>
    );
  }
  /* the north star: the question at the top, the proof under it, the number huge in the middle, the slider and Save low */
  if (onFree) {
    const proof = snap.settings ? freeProof(snap.days, snap.settings, snap.reviews, tk, 2, downs) : [];
    return (
      <SheetFrame title="One question">
        <T v="title" accessibilityRole="header">
          {FREE_Q}
        </T>
        <FreeProof lines={proof} color={c.mintText} />
        <Middle>
          <SliderValue big value={freeV} caption="out of 10" hint="Slide below to answer" />
        </Middle>
        <Dock>
          <Slider label={FREE_Q} value={freeV} lo={FREE_LO} hi={FREE_HI} readout={false} onChange={setFreeV} />
          {freeV != null ? (
            <Appear by={10} duration={240}>
              <Button label="Save" onPress={saveFree} />
            </Appear>
          ) : (
            <View style={st.btnSpace} />
          )}
        </Dock>
      </SheetFrame>
    );
  }
  if (answers.length === OB_BPS.length) {
    const s = bpsScore(answers);
    const r = bpsResult(s, last);
    return (
      <SheetFrame title="Five questions">
        <T v="title" accessibilityRole="header">
          {r.h}
        </T>
        <T>{r.p}</T>
        <Middle>
          <Pair last={last} now={s} />
        </Middle>
        <Dock>{askFree ? <Button label="One more question" onPress={() => setOnFree(true)} /> : <Button label="Done" onPress={closeSheet} />}</Dock>
      </SheetFrame>
    );
  }
  return (
    <SheetFrame title={'Five questions · ' + (answers.length + 1) + ' of ' + OB_BPS.length}>
      <T tone="muted">{BPS_STEM}</T>
      <T v="title" accessibilityRole="header">
        {habitSay(OB_BPS[answers.length], habitOf(snap.settings))}
      </T>
      <Dock>
        <ChoiceRows list={OB_BPS_C.map(([id, name], j) => ({ id, name, icon: ICONS[j], tone: TONES[j] }))} onPick={(id) => pick(Number(id))} />
      </Dock>
    </SheetFrame>
  );
}

/* the last answer and this one, side by side */
function Pair({ last, now }: { last: number | null; now: number }) {
  const c = useTheme();
  return (
    <View style={st.pair} accessibilityLabel={(last != null ? 'Last time ' + last + ', now ' : 'Now ') + now + ' of 10'}>
      {last != null ? (
        <View style={st.num}>
          <Text style={[st.big, { color: c.muted }]}>{last}</Text>
          <T v="small" tone="muted">
            Last time
          </T>
        </View>
      ) : null}
      <View style={st.num}>
        <Text style={[st.big, { color: c.ink }]}>{now}</Text>
        <T v="small" tone="muted">
          Now
        </T>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  pair: { flexDirection: 'row', justifyContent: 'center', gap: 36 },
  num: { alignItems: 'center', gap: 2 },
  big: { fontFamily: font.display, fontSize: 72, lineHeight: 78 },
  btnSpace: { height: 56 },
});
