/* The one next step on Today (core pickMoment, moment.ts), under the flame in the same card (hero.tsx): whatever the
   moment is, it is the only thing asking for a tap. Most moments are the same big bright card as the next stop on the line
   (your-day.tsx NextCard: the first week, a first pattern, a part unlocked), the whole card one
   button (Your day, below, names the rest of the day). The day of a slip has no card (core moment.ts); the moments with their own choices (a talk-through, a counting note,
   a word about reminders, Day 1) keep their cards. Under it, one quiet line names the next moment when
   two overlap. */
import { type Moment, type UnlockId, type MomentPick, type Snapshot, type StopTile } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { NudgeCard } from '@/components/nudge-card';
import { TalkCard } from '@/components/talk-card';
import { TellStartCard } from '@/components/tell-start';
import { CountNotes } from '@/components/today';
import { PauseBanner } from '@/components/today-log';
import { T } from '@/components/ui';
import { NextCard, openStop } from '@/components/your-day';
import { buzz } from '@/lib/feel';
import { useUnlockMark } from '@/lib/unlock';
import { font } from '@/lib/theme';

export function MomentCard({ pick, snap, tk, now }: { pick: MomentPick; snap: Snapshot; tk: string; now: number }) {
  return (
    <View style={{ gap: 6 }}>
      <TheCard m={pick.card} snap={snap} tk={tk} now={now} />
      {pick.more ? (
        <T v="small" tone="muted" style={s.more}>
          {'After this: ' + pick.more.one + '.'}
        </T>
      ) : null}
    </View>
  );
}

function TheCard({ m, snap, tk, now }: { m: Moment; snap: Snapshot; tk: string; now: number }) {
  switch (m.k) {
    case 'pause':
      return <PauseBanner />;
    case 'talk':
      return <TalkCard snap={snap} now={now} />;
    case 'tell-start':
      return <TellStartCard snap={snap} tk={tk} />;
    case 'count-note':
    case 'step-offer':
      return <CountNotes snap={snap} tk={tk} />;
    case 'nudge':
      return <NudgeCard snap={snap} tk={tk} />;
    case 'calm':
      return <Band m={m} onPress={() => openStop(m.go as StopTile['go'], m.v)} />;
    case 'first-week':
      return <Band m={m} onPress={() => router.push('/week')} />;
    case 'first-pattern':
      return <Band m={m} onPress={() => router.navigate({ pathname: '/pattern', params: { pane: 'patterns' } })} />;
    case 'recheck':
      return <Band m={m} onPress={() => router.push(m.v === 'free' ? { pathname: '/recheck', params: { only: 'free' } } : '/recheck')} />;
    case 'unlock':
      return <UnlockBand m={m} id={m.v as UnlockId} />;
    default:
      return null;
  }
}

/* a part unlocked: the first day it is the card is kept, so the next one waits its days (core unlock.ts) */
function UnlockBand({ m, id }: { m: Moment; id: UnlockId }) {
  const mark = useUnlockMark();
  useEffect(() => {
    mark.shown(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  /* the first Sunday review carries its Sunday along, for the review it opens */
  return <Band m={m} onPress={() => router.push({ pathname: '/unlock', params: id === 'sunday' ? { id, s: m.v! } : { id } })} />;
}

/* the one next step: the same big bright card as the next stop on the line (your-day.tsx NextCard), the whole card one tap */
function Band({ m, onPress }: { m: Moment; onPress: () => void }) {
  return (
    <NextCard
      m={m}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
    />
  );
}

const s = StyleSheet.create({
  more: { paddingHorizontal: 16 },
  band: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 84, paddingVertical: 12, paddingLeft: 16, paddingRight: 14, borderRadius: 20 },
  bandT: { fontFamily: font.display, fontSize: 20, lineHeight: 25 },
  go: { minHeight: 44, minWidth: 72, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  goT: { fontFamily: font.bodySemi, fontSize: 15 },
});
