/* Before setup: the setup opens by itself, and it is hard to miss. Closing it shows this page, which only goes back into it
   (or signs a returning person in). The setup opens again whenever this page comes back into view after something else was
   on top (SOS, a tool, a log), and whenever Daybook comes back from the background. Only the setup's own X keeps this page
   up, until the next time. Every question in the setup can be skipped, so the way through is never blocked.
   Ported from the legacy viewWelcome. */
import { defaultSettings, readBackup, restoreBackup, toRecords, type RecordId } from '@daybook/core';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';

import { Link } from '@/components/choices';
import { FlameMedallion } from '@/components/flame-medallion';
import { Screen } from '@/components/screen';
import { ErasedNote } from '@/components/sync-card';
import { Button, Card, T } from '@/components/ui';
import { pickBackupText } from '@/lib/backup';
import { BACKUP_FILES } from '@/lib/backup-files';
import { setupKeep } from '@/lib/setup-keep';
import { HelpLine } from '@/components/help-line';
import { restoredWords, WORDS } from '@/lib/words';
import { SAVE_FAILED, useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';

/* Learn, Journal and More before setup: what setup opens here, the way into it, and that SOS works now */
export function SetupFirst({ title, line }: { title: string; line: string }) {
  return (
    <Screen title={title}>
      <Card>
        <T style={{ fontSize: 17, lineHeight: 24 }}>{line}</T>
        <Button label={setupKeep.flow ? 'Continue setup' : 'Start setup'} onPress={() => router.push('/setup')} />
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          SOS works now, with no setup.
        </T>
      </Card>
    </Screen>
  );
}

export function Welcome() {
  const { tk, replace, say, snap, current } = useStore();
  const [busy, setBusy] = useState(false);
  const sync = useSync();
  const restore = async () => {
    setBusy(true);
    try {
      const text = await pickBackupText();
      if (text == null) return;
      let b;
      try {
        b = readBackup(text);
      } catch {
        say(WORDS.notBackup);
        return;
      }
      const { snap: next, restored } = restoreBackup(current().snap, b);
      if (!next.settings) next.settings = defaultSettings(tk);
      await replace(
        next,
        toRecords(next).map((r) => r.id as RecordId),
      );
      say(restoredWords(restored));
    } catch {
      say(SAVE_FAILED);
    } finally {
      setBusy(false);
    }
  };
  /* Someone signed in (who just deleted everything) stays on this page, where they can bring their log back. Everyone else
     sees the setup whenever this page comes into view, unless the setup itself was just closed with its X. */
  const signedIn = sync.status.k !== 'off' && sync.status.k !== 'out';
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  useEffect(() => {
    if (!focused || setupKeep.shut || !sync.loaded || signedIn) return;
    const id = setTimeout(() => {
      if (!setupKeep.shut) router.push('/setup');
    }, 0);
    return () => clearTimeout(id);
  }, [focused, sync.loaded, signedIn]);
  /* back from the background: the X from last time no longer holds */
  useEffect(() => {
    const sub = AppState.addEventListener('change', (a) => {
      if (a !== 'active' || !setupKeep.shut) return;
      setupKeep.shut = false;
      if (focused && sync.loaded && !signedIn) router.push('/setup');
    });
    return () => sub.remove();
  }, [focused, sync.loaded, signedIn]);
  return (
    <Screen title="Quit porn, one honest day at a time.">
      <ErasedNote />
      <View style={{ gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 16, paddingVertical: 8 }}>
          <FlameMedallion level={1} size={240} label="Your flame" />
          <T tone="muted" style={{ textAlign: 'center', fontSize: 17, lineHeight: 24 }}>
            About 8 minutes builds your plan, from your own answers. Every question can be skipped.
          </T>
        </View>
        <Button label={setupKeep.flow ? 'Continue setup' : 'Start setup'} onPress={() => router.push('/setup')} />
        {signedIn ? (
          <T v="small" tone="muted" style={{ textAlign: 'center' }}>
            You are signed in, so what you log now syncs to your account.
          </T>
        ) : null}
        {sync.status.k === 'off' || sync.status.k === 'on' ? null : sync.status.k === 'busy' ? (
          <T tone="muted" style={{ textAlign: 'center' }}>
            {sync.status.what}
          </T>
        ) : (
          <Link label="I already have an account: sign in" onPress={() => sync.signInNow({ why: 'in' })} />
        )}
        {sync.status.k === 'error' ? (
          <>
            <T v="small" tone="danger" style={{ textAlign: 'center' }}>
              {sync.status.msg}
            </T>
            <Button label="Try again" kind="ghost" onPress={sync.syncNow} />
            <HelpLine subject="Daybook: sync" center />
          </>
        ) : null}
        {BACKUP_FILES ? <Button label="I already have a backup file" kind="ghost" icon="up" onPress={restore} disabled={busy} /> : null}
      </View>
    </Screen>
  );
}
