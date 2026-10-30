/* The five questions again (core recheck.ts): one statement a page, one tap each, then the score next to the last one, with a
   line of hope. Only the score is kept, on this device. Closed before the end, nothing is kept, and it asks again in a week. */
import { BPS_STEM, bpsKeep, bpsResult, bpsScore, bpsScores, OB_BPS, OB_BPS_C } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Middle, Dock } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { ChoiceRows } from '@/components/slip';
import { Text } from '@/components/text';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const ICONS = ['leaf', 'wave', 'flame'];
const TONES = ['mint', 'sky', 'violet'];

export default function Recheck() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const sos = useSos();
  const [answers, setAnswers] = useState<number[]>([]);
  /* the score to compare with, read once, so the result does not compare the new score with itself */
  const [last] = useState(() => {
    const list = bpsScores(snap.settings, sos.mem);
    return list.length ? list[list.length - 1].s : null;
  });
  const finished = useRef(false);
  const memo = useRef(sos.setMem);
  memo.current = sos.setMem;
  /* closed before the end (the X, or the sheet swiped away): it asks again in a week */
  useEffect(
    () => () => {
      if (!finished.current) memo.current((m) => ({ ...m, bpsNo: tk }));
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
      sos.setMem((m) => {
        const { bpsNo: _no, ...rest } = m;
        return bpsKeep(rest, tk, bpsScore(next));
      });
    }
  };

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
          <View style={st.pair} accessibilityLabel={(last != null ? 'Last time ' + last + ', now ' : 'Now ') + s + ' of 10'}>
            {last != null ? (
              <View style={st.num}>
                <Text style={[st.big, { color: c.muted }]}>{last}</Text>
                <T v="small" tone="muted">
                  Last time
                </T>
              </View>
            ) : null}
            <View style={st.num}>
              <Text style={[st.big, { color: c.ink }]}>{s}</Text>
              <T v="small" tone="muted">
                Now
              </T>
            </View>
          </View>
        </Middle>
        <Dock>
          <Button label="Done" onPress={closeSheet} />
        </Dock>
      </SheetFrame>
    );
  }
  return (
    <SheetFrame title={'Five questions · ' + (answers.length + 1) + ' of ' + OB_BPS.length}>
      <T tone="muted">{BPS_STEM}</T>
      <T v="title" accessibilityRole="header">
        {OB_BPS[answers.length]}
      </T>
      <Dock>
        <ChoiceRows list={OB_BPS_C.map(([id, name], j) => ({ id, name, icon: ICONS[j], tone: TONES[j] }))} onPick={(id) => pick(Number(id))} />
      </Dock>
    </SheetFrame>
  );
}

const st = StyleSheet.create({
  pair: { flexDirection: 'row', justifyContent: 'center', gap: 36 },
  num: { alignItems: 'center', gap: 2 },
  big: { fontFamily: font.display, fontSize: 72, lineHeight: 78 },
});
