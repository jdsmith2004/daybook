/* "Do you like Daybook so far?" (core like.ts), riding on a moment of earned value: the full-screen moment of a new level, a new
   form of the flame or a badge (components/earned.tsx), and the first week looked back on (app/week.tsx). The flame is already big
   on those pages, so the ask is only the question and two answers, low where the thumb is, in the page's own buttons. It asks until
   the person says Yes (the owner, November 15, 2026), and test/like-caller.test.ts in core fails when nothing here is called.

   Yes thanks them, closes the moment and, a moment later, opens the phone's own rating sheet (lib/review.ts; the web has none, and
   Apple decides whether it shows). "Not yet" closes the moment and opens the feedback page, so both answers lead somewhere useful and
   the question asks how the person feels, not who may rate (App Store Guideline 5.6.1). The question comes again a few days later. */
import { careLastAt, likeAnswer, likeAskDue, likeShown, LIKE_WORDS, type LikeAnswer } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { btnStyle } from '@/components/reward-kit';
import { Text } from '@/components/text';
import { Button, T } from '@/components/ui';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { askStoreReview } from '@/lib/review';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { font, nightInk } from '@/lib/theme';

/** whether this good moment asks "Do you like Daybook so far?" (core likeAskDue). Decided once, when the moment opens; an ask
    shown is kept (likeShown), so it waits a few days and nothing else asks today. off: another ask already rides on this moment,
    or the moment is quiet. */
export function useLikeAsk(off = false): boolean {
  const { snap, tk, now, apply } = useStore();
  const sos = useSos();
  const [ask] = useState(() => !off && likeAskDue(snap.days, snap.settings, tk, { now, sos: careLastAt(sos.mem) }));
  useEffect(() => {
    if (!ask || !snap.settings) return;
    track('ask', { what: 'rate' });
    apply(likeShown(snap.settings, tk));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask]);
  return ask;
}

/** the answer: kept, then the moment closes and the way on opens (the rating sheet, or the feedback page) */
function useAnswer(onClose: () => void) {
  const { snap, tk, apply, say } = useStore();
  return (a: LikeAnswer) => {
    const st = snap.settings;
    if (!st) return onClose();
    buzz('tap');
    track('ask_tap', { what: a === 'yes' ? 'rate' : 'idea' });
    apply(likeAnswer(st, a, tk));
    onClose();
    if (a === 'yes') {
      say(LIKE_WORDS.thanks);
      /* a moment later, so the sheet comes up over the page under the moment, not over one on its way out */
      setTimeout(() => void askStoreReview(), 700);
    } else setTimeout(() => router.push({ pathname: '/feedback', params: { like: '1' } }), 350);
  };
}

/** on the night of a full-screen moment: the question, a gold Yes and a quiet Not yet, in place of the moment's own button */
export function LikeAskNight({ onClose }: { onClose: () => void }) {
  const answer = useAnswer(onClose);
  return (
    <View style={s.box} accessible={false}>
      <Text style={[s.q, { color: nightInk.ink }]} accessibilityRole="header">
        {LIKE_WORDS.q}
      </Text>
      <Pressable accessibilityRole="button" accessibilityHint={LIKE_WORDS.a11y} onPress={() => answer('yes')}>
        {({ pressed }) => (
          <View style={[btnStyle.btn, pressed && btnStyle.down]}>
            <Text style={btnStyle.text}>{LIKE_WORDS.yes}</Text>
          </View>
        )}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => answer('no')}
        style={({ pressed }) => [s.quiet, { backgroundColor: nightInk.btn, opacity: pressed ? 0.8 : 1 }]}>
        <Text style={[s.quietT, { color: nightInk.ink }]}>{LIKE_WORDS.no}</Text>
      </Pressable>
    </View>
  );
}

/** on a light page (the first week): the question and the two answers, in the page's own buttons */
export function LikeAsk({ onClose }: { onClose: () => void }) {
  const answer = useAnswer(onClose);
  return (
    <View style={s.box}>
      <T v="h2" style={s.c} accessibilityRole="header">
        {LIKE_WORDS.q}
      </T>
      <Button label={LIKE_WORDS.yes} onPress={() => answer('yes')} />
      <Button kind="ghost" label={LIKE_WORDS.no} onPress={() => answer('no')} />
    </View>
  );
}

const s = StyleSheet.create({
  box: { alignSelf: 'stretch', gap: 10 },
  q: { fontFamily: font.display, fontSize: 22, lineHeight: 28, textAlign: 'center', marginBottom: 4 },
  c: { textAlign: 'center' },
  quiet: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quietT: { fontFamily: font.bodySemi, fontSize: 17 },
});
