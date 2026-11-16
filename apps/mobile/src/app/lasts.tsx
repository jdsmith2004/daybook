/* "How long does it usually last?", asked once of a person who set up before setup asked it (core lasts-ask.ts), so Time given back
   and Miles can count for them. It is setup's own page: the same sky, the question at the top in their habit's words, the flame in the
   middle saying setup's line, and the same four answers low where the thumb is. A tap keeps the answer, the flame says what it means,
   and Done closes it; when there is already time given back, Done says how much. The X skips it. Either way it never comes again
   (it was marked as it opened, in Today). */
import { gameCompute, habitOf, lastsAnswer, lastsPage, obReply, obSay, timeBack } from '@daybook/core';
import { Redirect } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SHORT, useFitRoom } from '@/components/fit';
import { Question, Shell } from '@/components/lesson-parts';
import { Next } from '@/components/lx';
import { T } from '@/components/ui';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { lessonLook } from '@/lib/lesson-look';
import { close, closeAll } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function LastsPage() {
  const { snap, tk, apply, say } = useStore();
  const base = useTheme();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
  const st = snap.settings;
  /* the page as it opened: the answer saved does not change the words under the person's thumb */
  const [page] = useState(() => (st ? lastsPage(st) : null));
  const [pk, setPk] = useState<number | null>(null);
  const [pulse, setPulse] = useState(0);
  /* the settings with the answer in, for what Done says */
  const kept = useRef<typeof st>(null);
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [st, snap.days, snap.reviews, tk]);
  const look = lessonLook('sky', 1, base.scheme);

  if (!st || !page || !page.list) {
    /* nothing to ask (opened by a link, or answered on another device): Today */
    return <Redirect href="/" />;
  }
  const list = page.list;
  const habit = page.h || '';

  const pick = (j: number) => {
    if (pk != null) return;
    buzz('tap');
    setPk(j);
    setPulse((x) => x + 1);
    track('setup_pick', { page: 'mins', ix: j });
    track('ask_tap', { what: 'lasts' });
    const ch = lastsAnswer(st, list[j][0], tk);
    kept.current = ch.st;
    apply(ch);
  };
  const skip = () => {
    if (pk == null) track('setup_skip', { page: 'mins' });
    close();
  };
  const done = () => {
    buzz('save');
    /* what it has already given back, said as the page closes */
    const tb = kept.current ? timeBack(snap.days, kept.current, tk) : null;
    closeAll();
    if (tb) setTimeout(() => say(tb.say), 400);
  };

  return (
    <Shell
      look={look}
      level={level}
      flameOn
      pulse={pulse}
      inset={inset}
      scroll={scroll}
      fit={fit}
      bodyKey="lasts"
      onClose={skip}
      foot={pk != null ? <Next label="Done" onPress={done} noIcon /> : null}>
      <Question
        h={habit}
        head={
          <View style={{ gap: 8, alignSelf: 'stretch' }}>
            <T v="title" style={SHORT ? { fontSize: 22, lineHeight: 28 } : { fontSize: 28, lineHeight: 34 }} accessibilityRole="header">
              {habit}
            </T>
          </View>
        }
        list={list.map((x) => String(x[1]))}
        best={null}
        retry={false}
        pk={pk}
        tried={[]}
        comments={list.map((x) => obReply('mins', x[0]) || '')}
        first={obSay('mins', false, habitOf(st)) || undefined}
        want={SHORT ? 230 : 300}
        onPick={pick}
      />
    </Shell>
  );
}
