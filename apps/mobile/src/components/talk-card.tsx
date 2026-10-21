/* Talk it through, outside the flow itself (app/talk.tsx):
   - TalkCard on Today, while a talk-through still matters: waiting to decide, time to decide, a changed plan until its
     look back, or "look back" (core: talkDueNow; a go-ahead is asked about for three days, a change plan the next morning)
   - TalkLook, the same look back at the end of the morning stop (app/morning.tsx)
   - TalkDoor, the way in from the tools (in Learn and in SOS) and from a check-in that says caring is low */
import { messageTexts, talkAgo, talkClock, talkDueNow, talkPlanLine, talkUntilLine, type DayKey, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { SafeTextButton } from '@/components/safe-text';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Due = NonNullable<ReturnType<typeof talkDueNow>>;
/** what a look back says, on Today and at the morning stop. A go-ahead from an earlier day names when, gently. */
function lookWords(d: Due, tk: DayKey): { head: string; sub: string } {
  const t = d.talk;
  if (t.p === 'change') return { head: 'Did your plan hold?', sub: talkPlanLine(t) };
  const ago = talkAgo(d.k, tk, t.t).replace(/^on /, '');
  if (!ago) return { head: 'When it has passed, look back.', sub: 'One minute. Honest is what counts.' };
  return { head: 'One minute about ' + ago + '.', sub: 'You chose with your eyes open. Whatever happened, honest is what counts.' };
}
const openTalk = (q: 'decide' | 'look', id: string) => router.push(('/talk?' + q + '=' + id) as '/talk');

export function TalkCard({ snap, now }: { snap: Snapshot; now: number }) {
  const c = useTheme();
  const { tk } = useStore();
  const d = talkDueNow(snap.days, snap.settings, tk, now);
  if (!d) return null;
  const t = d.talk;
  const open = (q: 'decide' | 'look') => openTalk(q, t.id);
  const look = d.due === 'look' ? lookWords(d, tk) : null;
  const head =
    d.due === 'waiting' ? 'Deciding at ' + talkClock(t.at!) + '.' : d.due === 'decide' ? 'Time to decide.' : look ? look.head : 'Your plan, talked through';
  const sub =
    d.due === 'waiting' ? talkUntilLine(t) : d.due === 'decide' ? 'You chose to decide now. Choose with your eyes open.' : look ? look.sub : talkPlanLine(t);
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
      {(d.due === 'waiting' || d.due === 'plan') && t.m.indexOf('text') >= 0 ? <SafeTextButton kind="ghost" body={messageTexts(snap.settings)[1]} /> : null}
    </Card>
  );
}

/** the look back at the morning stop, when one is waiting: the night's plan or go-ahead, one tap away. Null otherwise. */
export function talkLookNow(snap: Snapshot, tk: DayKey, now: number): Due | null {
  const d = talkDueNow(snap.days, snap.settings, tk, now);
  return d && d.due === 'look' ? d : null;
}
export function TalkLook({ d }: { d: Due }) {
  const c = useTheme();
  const { tk } = useStore();
  const w = lookWords(d, tk);
  return (
    <>
      <Appear delay={420} by={14} style={[s.look, { backgroundColor: c.surface, shadowColor: c.lip }]}>
        <View style={[s.ic, { backgroundColor: c.violetSoft }]}>
          <Icon name={d.talk.p === 'change' ? 'compass' : 'sun'} size={20} color={c.violetText} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.lookEb, { color: c.violetText }]}>ONE MORE THING</Text>
          <T v="label">{w.head}</T>
          <T v="small" tone="muted">
            {w.sub}
          </T>
        </View>
      </Appear>
      <Button label="Look back" onPress={() => openTalk('look', d.talk.id)} />
    </>
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
  look: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    padding: 14,
    borderRadius: 20,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
  },
  lookEb: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1 },
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
