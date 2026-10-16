/* Settings: how days are counted, and your data (restore a backup, save one, erase this device). */
import {
  makeBackup,
  readBackup,
  restoreBackup,
  setCleanAuto,
  setCountMode,
  toRecords,
  type RecordId,
} from '@daybook/core';
import Constants from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Button, Card, Chip, T } from '@/components/ui';
import { pickBackupText, saveBackupFile } from '@/lib/backup';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

export default function Settings() {
  const { snap, tk, apply, replace, erase, say, dirty } = useStore();
  const sos = useSos();
  const st = snap.settings;
  const [sure, setSure] = useState(false);
  const [busy, setBusy] = useState(false);

  const restore = async () => {
    setBusy(true);
    try {
      const text = await pickBackupText();
      if (text == null) return;
      const { snap: next, restored } = restoreBackup(snap, readBackup(text));
      await replace(next, toRecords(next).map((r) => r.id as RecordId));
      say(`Restored ${restored} day${restored === 1 ? '' : 's'}.`);
    } catch {
      say('That file is not a Daybook backup.');
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    try {
      await saveBackupFile('daybook-backup.json', JSON.stringify(makeBackup(snap), null, 1));
    } catch {
      say('Could not save the backup.');
    }
  };
  const days = Object.keys(snap.days).length;

  return (
    <Screen title="Settings">
      {st ? (
        <Card>
          <T v="h2">How days are counted</T>
          <T v="small" tone="muted">
            A day counts when no slip is logged on it. A day with nothing logged counts too. This only changes how days are counted. It
            never changes what you log.
          </T>
          <View style={s.chips} accessibilityRole="radiogroup" accessibilityLabel="Counting">
            <Chip label="Strict" on={st.cleanMode === 'strict'} onPress={() => apply(setCountMode(st, 'strict', tk))} />
            <Chip label="Gentle" on={st.cleanMode === 'gentle'} onPress={() => apply(setCountMode(st, 'gentle', tk))} />
            <Chip label="Step down" on={st.cleanMode === 'step'} onPress={() => apply(setCountMode(st, 'step', tk))} />
          </View>
          <T v="small" tone="muted">
            <T v="small" style={{ fontWeight: '700' }}>
              Strict:
            </T>{' '}
            a day counts with no slip.{' '}
            <T v="small" style={{ fontWeight: '700' }}>
              Gentle:
            </T>{' '}
            a day counts with one slip or fewer. In both, the first slip in any 7 days can be saved: finish the Rekindle quest by the next
            night and your run keeps going.
          </T>
          <T v="small" tone="muted">
            <T v="small" style={{ fontWeight: '700' }}>
              Step down:
            </T>{' '}
            for when slips happen most days. Instead of a run you lose every day or two, you aim for longer stretches between slips and
            fewer slips each week. When your stretch passes a week, or a week has one slip or none, Daybook offers to start counting days.
          </T>
          <T v="label">Rough stretches</T>
          <View style={s.chips}>
            <Chip label="Switch for me" on={st.cleanAuto !== false} onPress={() => apply(setCleanAuto(st, true))} />
            <Chip label="Leave it" on={st.cleanAuto === false} onPress={() => apply(setCleanAuto(st, false))} />
          </View>
          <T v="small" tone="muted">
            If slips land on most days of a week, Daybook switches to step down by itself and tells you. It never switches back unless you
            do.
          </T>
        </Card>
      ) : null}

      <Card>
        <T v="h2">Your data</T>
        <T v="small" tone="muted">
          {days
            ? `${days} day${days === 1 ? '' : 's'} logged, kept on this device.`
            : 'Nothing is logged on this device yet.'}{' '}
          Sync between your devices comes in a later update.
        </T>
        <Button label="Restore from a backup…" kind="ghost" icon="up" onPress={restore} disabled={busy} />
        {st ? <Button label="Save a full backup (JSON)" kind="ghost" icon="down" onPress={save} /> : null}
        {st ? (
          sure ? (
            <View style={{ gap: 8 }}>
              <T v="label" tone="danger">
                This erases your whole log on this device. Save a backup first if you want to keep it.
              </T>
              <View style={s.chips}>
                <Button
                  label="Erase everything"
                  kind="danger"
                  onPress={async () => {
                    await erase();
                    await sos.forget();
                    setSure(false);
                    say('This device is erased.');
                  }}
                />
                <Button label="Cancel" kind="ghost" onPress={() => setSure(false)} />
              </View>
            </View>
          ) : (
            <Button label="Erase this device…" kind="ghost" icon="trash" onPress={() => setSure(true)} />
          )
        ) : null}
      </Card>

      <T v="small" tone="muted" style={{ textAlign: 'center' }}>
        Daybook {Constants.expoConfig?.version ?? ''} · {Object.keys(dirty).length} change{Object.keys(dirty).length === 1 ? '' : 's'} not
        synced yet
      </T>
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
