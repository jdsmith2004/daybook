/* The first time: the setup opens by itself. Closing it shows this page: start the setup again, skip it and start a tracking week,
   or bring in a backup. Ported from the legacy viewWelcome. */
import { defaultSettings, readBackup, restoreBackup, toRecords, type RecordId } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { Screen } from '@/components/screen';
import { ErasedNote, TrustChoice } from '@/components/sync-card';
import { Button, Card, T } from '@/components/ui';
import { pickBackupText } from '@/lib/backup';
import { setupKeep } from '@/lib/setup-keep';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';

export function Welcome() {
  const { tk, replace, say, snap, current } = useStore();
  const [busy, setBusy] = useState(false);
  const sync = useSync();
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
      const { snap: next, restored } = restoreBackup(current().snap, b);
      if (!next.settings) next.settings = defaultSettings(tk);
      await replace(
        next,
        toRecords(next).map((r) => r.id as RecordId),
      );
      say(`Restored ${restored} day${restored === 1 ? '' : 's'}.`);
    } catch {
      say('That file is not a Daybook backup.');
    } finally {
      setBusy(false);
    }
  };
  /* new people see the setup first, once per launch. Closing it shows this page, which can open it again. Someone signed in
     (who just deleted everything) sees this page instead, where they can bring their log back. */
  const signedIn = sync.status.k !== 'off' && sync.status.k !== 'out';
  useEffect(() => {
    if (setupKeep.shut || !sync.loaded || signedIn) return;
    const id = setTimeout(() => {
      if (!setupKeep.shut) router.push('/setup');
    }, 0);
    return () => clearTimeout(id);
  }, [sync.loaded, signedIn]);
  return (
    <Screen eyebrow="My Daybook" title="Quit porn, one honest day at a time.">
      <ErasedNote />
      <Card>
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
          <Flame level={1} size={150} />
          <T tone="muted" style={{ textAlign: 'center', fontSize: 17, lineHeight: 24 }}>
            Setup takes about 5 minutes: a few questions, a short self-check, the facts, and a plan built from your answers.
          </T>
        </View>
        <Button label={setupKeep.flow ? 'Continue setup' : 'Start setup'} onPress={() => router.push('/setup')} />
        <Link label="Skip setup and start a tracking week" onPress={fresh} />
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          {signedIn
            ? 'You are signed in, so what you log now syncs to your account.'
            : 'Your log is saved on this device only. You can save a backup from Settings.'}
        </T>
        {sync.status.k === 'off' || sync.status.k === 'on' ? null : sync.status.k === 'busy' ? (
          <T tone="muted" style={{ textAlign: 'center' }}>
            {sync.status.what}
          </T>
        ) : (
          <>
            <Button label="Sign in to my account" kind="ghost" icon="up" onPress={() => sync.signInNow()} />
            <TrustChoice />
          </>
        )}
        {sync.status.k === 'error' ? (
          <T v="small" tone="danger" style={{ textAlign: 'center' }}>
            {sync.status.msg}
          </T>
        ) : null}
        <Button label="I already have a backup file" kind="ghost" icon="up" onPress={restore} disabled={busy} />
      </Card>
    </Screen>
  );
}
