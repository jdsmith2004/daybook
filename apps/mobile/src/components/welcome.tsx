/* The first time: start fresh with a tracking week, or bring in a backup from the Daybook web app. (Setup comes in front of this
   once it is ported.) */
import { defaultSettings, readBackup, restoreBackup, toRecords, type RecordId } from '@daybook/core';
import { useState } from 'react';
import { View } from 'react-native';

import { Flame } from '@/components/flame';
import { Screen } from '@/components/screen';
import { Button, Card, T } from '@/components/ui';
import { pickBackupText } from '@/lib/backup';
import { useStore } from '@/lib/store';

export function Welcome() {
  const { tk, replace, say, snap } = useStore();
  const [busy, setBusy] = useState(false);
  const fresh = async () => {
    const settings = defaultSettings(tk);
    const next = { ...snap, settings };
    await replace(next, ['settings']);
    say('Your tracking week starts today.');
  };
  const restore = async () => {
    setBusy(true);
    try {
      const text = await pickBackupText();
      if (text == null) return;
      const b = readBackup(text);
      const { snap: next, restored } = restoreBackup(snap, b);
      if (!next.settings) next.settings = defaultSettings(tk);
      await replace(next, toRecords(next).map((r) => r.id as RecordId));
      say(`Restored ${restored} day${restored === 1 ? '' : 's'}.`);
    } catch {
      say('That file is not a Daybook backup.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Daybook">
      <Card>
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
          <Flame level={1} size={120} />
          <T v="h2" style={{ textAlign: 'center' }}>
            A private, honest place to change a habit
          </T>
          <T tone="muted" style={{ textAlign: 'center' }}>
            Your log stays on this device. Nothing is counted against you in the first week: you only track, so you can see your pattern.
          </T>
        </View>
        <Button label="Start with a tracking week" onPress={fresh} />
        <Button label="I already have a backup file" kind="ghost" icon="up" onPress={restore} disabled={busy} />
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          In the Daybook web app, open Settings and choose “Save a full backup (JSON)”. Bring that file in here and everything comes with it.
        </T>
      </Card>
    </Screen>
  );
}
