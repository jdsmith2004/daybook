/* The one thing Today says about the reminders (core nudges.ts nudgeCard): a kind that stopped helping and was paused, the
   check-in reminder moving later once the person checks in on their own, or an offer to move it to when they really
   check in. One at a time, with two plain choices; nothing here on the web, where Daybook cannot remind. */
import { NUDGE_PREF, nudgeCard, nudgeResume, type Snapshot } from '@daybook/core';
import { View } from 'react-native';

import { Button, Card, Icon, T } from '@/components/ui';
import { setNudgeLog, setReminderPrefs, useNudgeLog, useReminderPrefs } from '@/lib/prefs';
import { remindersOffered } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export function NudgeCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const { say } = useStore();
  const prefs = useReminderPrefs();
  const log = useNudgeLog();
  const st = snap.settings;
  const card = remindersOffered && st && log.ready ? nudgeCard(snap.days, st, prefs, log, tk) : null;
  if (!card) return null;
  const yes = () => {
    if (card.k === 'paused') {
      setNudgeLog((l) => nudgeResume(l, card.kind));
      say('Turned back on.');
    } else if (card.k === 'backup') setNudgeLog((l) => ({ ...l, bk: tk }));
    else {
      setReminderPrefs({ ...prefs, checkinAt: card.at });
      setNudgeLog((l) => ({ ...l, tm: tk }));
      say('Moved. You can change it in Settings.');
    }
  };
  const no = () => {
    if (card.k === 'paused') {
      setReminderPrefs({ ...prefs, [NUDGE_PREF[card.kind]]: false });
      setNudgeLog((l) => nudgeResume(l, card.kind));
      say('Left off. You can turn it on again in Settings.');
    } else if (card.k === 'backup') {
      setReminderPrefs({ ...prefs, ciKeep: true });
      setNudgeLog((l) => ({ ...l, bk: tk }));
    } else setNudgeLog((l) => ({ ...l, tm: tk }));
  };
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="timer" size={22} color={c.accentText} />
        <T v="label" style={{ flex: 1 }}>
          {card.h}
        </T>
      </View>
      <T v="small">{card.p}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button label={card.yes} onPress={yes} />
        <Button kind="ghost" label={card.no} onPress={no} />
      </View>
    </Card>
  );
}
