/* Before setup: the whole app is this one page (the owner, November 2, 2026: until setup is done, nothing else works as normal). There
   are no tabs; every other page leads back here (app/_layout.tsx, SetupGate). It is the setup's own sky at night with the flame, big, saying
   that the plan is a few minutes away, one button back into the setup, and SOS, which always works (CLAUDE.md, never lock care). The setup
   opens by itself whenever this page comes into view after something else was on top (SOS, a tool, a log) and whenever Daybook comes back
   from the background. Only the setup's own X keeps this page up, until the next time. Every question in the setup can be skipped, so
   the way through is never blocked. A returning person signs in or brings back a backup from here. Ported from the legacy viewWelcome. */
import { defaultSettings, readBackup, restoreBackup, toRecords, type RecordId } from '@daybook/core';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SHORT, useFitRoom } from '@/components/fit';
import { HelpLine } from '@/components/help-line';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { lessonText, Quiet, Shell } from '@/components/lesson-parts';
import { Next } from '@/components/lx';
import { SosPill } from '@/components/sos-pill';
import { ErasedNote } from '@/components/sync-card';
import { T } from '@/components/ui';
import { pickBackupText } from '@/lib/backup';
import { BACKUP_FILES } from '@/lib/backup-files';
import { lessonLook } from '@/lib/lesson-look';
import { setupKeep } from '@/lib/setup-keep';
import { SAVE_FAILED, useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { useTheme } from '@/lib/theme';
import { restoredWords, WORDS } from '@/lib/words';

export function Welcome() {
  const { tk, replace, say, current } = useStore();
  const base = useTheme();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
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
  /* Someone signed in (who just deleted everything, or whose log is still on its way) stays on this page, where they can bring their log
     back. Everyone else sees the setup whenever this page comes into view, unless the setup itself was just closed with its X. */
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
  const started = !!setupKeep.flow && setupKeep.flow.i > 0;
  return (
    <Shell
      look={lessonLook('sky', 0, base.scheme)}
      level={1}
      flameOn
      pulse={0}
      inset={inset}
      scroll={scroll}
      fit={fit}
      bodyKey="welcome"
      topRight={<SosPill label="SOS. Help with an urge right now. No setup needed." over />}
      foot={
        <View style={s.foot}>
          <Next label={started ? 'Keep going' : 'Start setup'} onPress={() => router.push('/setup')} />
          {sync.status.k === 'off' || sync.status.k === 'on' || sync.status.k === 'busy' ? null : (
            <Quiet label="I already have an account: sign in" onPress={() => sync.signInNow({ why: 'in' })} />
          )}
          {BACKUP_FILES ? <Quiet label={busy ? 'Bringing it back…' : 'I have a backup file'} onPress={() => !busy && restore()} /> : null}
        </View>
      }>
      <ErasedNote />
      <T style={lessonText.h} accessibilityRole="header">
        {started ? 'Your plan is waiting.' : 'Get free, one honest day at a time.'}
      </T>
      <Bubble
        text={
          started
            ? 'We stopped part way. A few more minutes, and your plan is built from your answers.'
            : 'I am your flame. About 8 minutes builds your plan, from your own answers. Every question can be skipped.'
        }
      />
      <FlameSlot size={SHORT ? 260 : 330} min={SHORT ? 140 : 180} />
      {signedIn ? (
        <T v="small" tone="muted">
          You are signed in, so what you log now syncs to your account.
        </T>
      ) : null}
      {sync.status.k === 'busy' ? <T tone="muted">{sync.status.what}</T> : null}
      {sync.status.k === 'error' ? (
        <View style={{ gap: 8 }}>
          <T v="small" tone="danger">
            {sync.status.msg}
          </T>
          <Quiet label="Try again" onPress={sync.syncNow} />
          <HelpLine subject="Daybook: sync" center />
        </View>
      ) : null}
    </Shell>
  );
}

const s = StyleSheet.create({
  foot: { flex: 1, gap: 4 },
});
