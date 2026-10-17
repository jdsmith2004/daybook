/* Talk it through, outside the flow itself (app/talk.tsx):
   - TalkCard on Today, while a talk-through still matters: waiting to decide, time to decide, a changed plan before its
     moment, or "look back" (core: talkDue)
   - TalkDoor, the way in from the tools (in Learn and in SOS) and from a check-in that says caring is low */
import { talkClock, talkDue, talkMoveWords, talkPlanLine, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

export function TalkCard({ snap, now }: { snap: Snapshot; now: number }) {
  const c = useTheme();
  const d = talkDue(snap.days, now);
  if (!d) return null;
  const t = d.talk;
  const open = (q: 'decide' | 'look') => router.push(('/talk?' + q + '=' + t.id) as '/talk');
  const head =
    d.due === 'waiting'
      ? 'Deciding at ' + talkClock(t.at!) + '.'
      : d.due === 'decide'
        ? 'Time to decide.'
        : d.due === 'plan'
          ? 'Your plan, talked through'
          : t.p === 'change'
            ? 'Did your plan hold?'
            : 'When it has passed, look back.';
  const sub =
    d.due === 'waiting'
      ? 'Until then: ' + (talkMoveWords(t)[0] || 'something kind for yourself').toLowerCase() + '.'
      : d.due === 'decide'
        ? 'You chose to decide now. Choose with your eyes open.'
        : d.due === 'plan'
          ? talkPlanLine(t)
          : t.p === 'change'
            ? talkPlanLine(t)
            : 'One minute. Honest is what counts.';
  return (
    <Card>
      <View style={s.head}>
        <View style={[s.ic, { backgroundColor: c.violetSoft }]}>
          <Icon name={d.due === 'waiting' || d.due === 'decide' ? 'timer' : t.p === 'change' ? 'compass' : 'sun'} size={20} color={c.violetText} />
        </View>
        <View style={{ flex: 1 }}>
          <T v="label">{head}</T>
          <T v="small" tone="muted">
            {sub}
          </T>
        </View>
      </View>
      {d.due === 'waiting' || d.due === 'decide' ? (
        <Button kind={d.due === 'decide' ? 'primary' : 'ghost'} label="Decide now" onPress={() => open('decide')} />
      ) : d.due === 'look' ? (
        <Button label="Look back" onPress={() => open('look')} />
      ) : null}
    </Card>
  );
}

/** the way in: "Planning a slip?" (compact for the check-in, where it carries its own line) */
export function TalkDoor({ line, onOpen }: { line?: string; onOpen?: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Planning a slip? Talk it through. ' + (line || '')}
      onPress={() => {
        buzz('tap');
        if (onOpen) onOpen();
        else router.push('/talk');
      }}
      style={({ pressed }) => [
        s.door,
        { backgroundColor: c.violetSoft, borderColor: c.violet, shadowColor: c.lip, transform: [{ translateY: pressed ? 3 : 0 }] },
      ]}>
      <View style={[s.doorIc, { backgroundColor: c.violet }]}>
        <Icon name="chat" size={22} color={c.scheme === 'dark' ? '#1A1250' : '#FFFFFF'} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.doorT, { color: c.violetText }]}>Planning a slip?</Text>
        <Text style={[s.doorS, { color: c.ink }]}>{line || 'When it feels planned, owed or certain, or you have stopped caring. Talk it through first.'}</Text>
      </View>
      <Icon name="next" size={20} color={c.violetText} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ic: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  door: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  doorIc: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  doorT: { fontFamily: font.display, fontSize: 19, lineHeight: 24 },
  doorS: { fontFamily: font.body, fontSize: 14, lineHeight: 19, marginTop: 1 },
});
