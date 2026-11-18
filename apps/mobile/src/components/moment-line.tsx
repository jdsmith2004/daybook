/* One quiet line on Today for a word that matters but is never the day's next step (core moment.ts LINE_KINDS; the owner, November 18,
   2026: "There are so many pop-ups, and they all are visually terrible and don't really add to the app"). A counting note, a word
   about reminders, a first pattern, the month's questions, a part unlocked, and the one-time "How long does it usually last?": the
   small words, then the title, and a tap. The ones with choices of their own open them right under the line; the rest open their page.
   The day's spine above it never moves. */
import { type Moment, type Snapshot, type UnlockId } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NudgeCard } from '@/components/nudge-card';
import { Text } from '@/components/text';
import { CountNotes } from '@/components/today';
import { buzz } from '@/lib/feel';
import { useUnlockMark } from '@/lib/unlock';
import { font, useTheme } from '@/lib/theme';

export function QuietLine({ eb, h, open, onPress, label }: { eb: string; h: string; open?: boolean; onPress: () => void; label?: string }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || eb + '. ' + h}
      accessibilityState={open == null ? undefined : { expanded: open }}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.row, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[s.t, { color: c.muted }]} numberOfLines={2}>
        <Text style={[s.eb, { color: c.coralText }]}>{eb + '  '}</Text>
        <Text style={[s.h, { color: c.ink }]}>{h}</Text>
      </Text>
      <Text style={[s.go, { color: c.muted }]}>{open == null ? '›' : open ? '–' : '+'}</Text>
    </Pressable>
  );
}

export function MomentLine({ m, snap, tk }: { m: Moment; snap: Snapshot; tk: string }) {
  const [open, setOpen] = useState(false);
  const choices = m.k === 'count-note' || m.k === 'step-offer' || m.k === 'nudge';
  if (choices)
    return (
      <View style={{ gap: 8 }}>
        <QuietLine eb={m.eb} h={m.h} open={open} onPress={() => setOpen((o) => !o)} />
        {open ? m.k === 'nudge' ? <NudgeCard snap={snap} tk={tk} /> : <CountNotes snap={snap} tk={tk} /> : null}
      </View>
    );
  if (m.k === 'unlock') return <UnlockLine m={m} id={m.v as UnlockId} />;
  return (
    <QuietLine
      eb={m.eb}
      h={m.h}
      onPress={() => {
        if (m.k === 'first-pattern') router.navigate({ pathname: '/pattern', params: { pane: 'patterns' } });
        else if (m.k === 'recheck') router.push(m.v === 'free' ? { pathname: '/recheck', params: { only: 'free' } } : '/recheck');
      }}
    />
  );
}

/* a part unlocked: the first day it shows is kept, so the next one waits its days (core unlock.ts) */
function UnlockLine({ m, id }: { m: Moment; id: UnlockId }) {
  const mark = useUnlockMark();
  useEffect(() => {
    mark.shown(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return <QuietLine eb={m.eb} h={m.h} onPress={() => router.push({ pathname: '/unlock', params: id === 'sunday' ? { id, s: m.v! } : { id } })} />;
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingHorizontal: 16 },
  t: { flex: 1, fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 20 },
  eb: { fontFamily: font.bodySemi, fontSize: 13 },
  h: { fontFamily: font.bodyMedium, fontSize: 15 },
  go: { fontFamily: font.bodySemi, fontSize: 20, lineHeight: 22 },
});
