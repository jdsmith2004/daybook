/* Future you's invitation (core futureAsk): one quiet row at a good moment, the ridden-out page and the sheet for a new level
   or form. It decides once, when it first shows, and then holds still. Never in the hours after a slip, never in a practice
   ride, and not every time (every couple of days while there is no note, then about once a week). */
import { futureAsk } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { askedFuture, futureLoaded, useFuture } from '@/lib/future';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** whether this good moment invites a note: decided once, as soon as the notes are read */
export function useFutureInvite(off = false): boolean {
  const { snap } = useStore();
  const mem = useFuture();
  const [show, setShow] = useState<boolean | null>(null);
  useEffect(() => {
    if (show != null || !futureLoaded()) return;
    const yes = !off && futureAsk(snap.days, snap.settings, mem, Date.now());
    setShow(yes);
    if (yes) {
      askedFuture();
      track('ask', { what: 'future' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mem, show]);
  return !!show;
}

/** the row: a mic, the ask, and a chevron. `onGo` runs first (a sheet closes itself before the page opens). */
export function FutureInvite({ first, onGo }: { first: boolean; onGo?: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        buzz('tap');
        track('ask_tap', { what: 'future' });
        onGo?.();
        router.push('/future');
      }}
      style={({ pressed }) => [s.row, { backgroundColor: c.sunSoft, opacity: pressed ? 0.8 : 1 }]}>
      <Icon name="mic" size={22} color={c.sunText} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.t, { color: c.ink }]}>{first ? 'Leave a note for the next hard moment' : 'Leave another note for the next hard moment'}</Text>
        <Text style={[s.sub, { color: c.muted }]}>SOS plays it right after the first breath.</Text>
      </View>
      <Icon name="next" size={18} color={c.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  t: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  sub: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
});
