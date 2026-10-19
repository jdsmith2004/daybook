/* Sync between devices, in Settings: sign in, see when it last synced, sync now, sign out, or delete the account. The first
   time a device joins an account that already has a log, the question of what to keep is asked here. */
import { fmtDate, keyOfDate } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BigOption } from '@/components/choices';
import { Check } from '@/components/form';
import { LinkText } from '@/components/today';
import { Button, T } from '@/components/ui';
import { keepPerTrust } from '@/lib/auth';
import { getTrust, setTrust, trustOffered } from '@/lib/secret';
import { useStore } from '@/lib/store';
import { syncedAgo, useSync } from '@/lib/sync';
import { useTheme } from '@/lib/theme';

/** after "Delete everything": the account keeps a copy for a week, and this brings it back */
export function ErasedNote() {
  const c = useTheme();
  const sync = useSync();
  const { say } = useStore();
  const [busy, setBusy] = useState(false);
  const on = sync.status.k === 'on' || sync.status.k === 'error';
  useEffect(() => {
    if (on) sync.checkErased();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
  if (!on || !sync.erased) return null;
  const day = (ms: number) => fmtDate(keyOfDate(new Date(ms)), { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <View style={[s.confirm, { backgroundColor: c.sunSoft }]}>
      <T v="label">Your log was deleted on {day(sync.erased.at)}.</T>
      <T v="small">
        Your account keeps a copy until {day(sync.erased.at + 7 * 86400_000)}. Bringing it back puts every day back on all your devices. Days you have logged
        since stay as they are.
      </T>
      <Button
        label={busy ? 'Bringing it back…' : 'Bring my log back'}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          const ok = await sync.restoreErased();
          setBusy(false);
          say(ok ? 'Your log is back.' : 'Could not reach your account. Try again in a moment.');
        }}
      />
    </View>
  );
}

/** "Stay signed in on this browser" (the web only; a phone keeps the sign-in in its keychain) */
export function TrustChoice() {
  const [on, setOn] = useState(getTrust);
  if (!trustOffered) return null;
  return (
    <Check
      label="Stay signed in on this browser"
      why={on ? 'For a year, until you sign out. Untick this on a shared computer.' : 'Only while this tab is open. Good for a shared computer.'}
      on={on}
      onPress={() => {
        setTrust(!on);
        setOn(!on);
        keepPerTrust().catch(() => undefined);
      }}
    />
  );
}

export function SyncBody() {
  const c = useTheme();
  const sync = useSync();
  const { now, say } = useStore();
  const [ask, setAsk] = useState<null | 'out' | 'delete'>(null);
  const st = sync.status;
  if (st.k === 'off') return null;

  if (st.k === 'out')
    return (
      <>
        <T v="small" tone="muted">
          A free account keeps a copy of your log safe and the same on your phone and on the web, and opens every lesson. It is private to you: only your
          sign-in can read it. Until you sign in, your log stays on this device only.
        </T>
        <Button label="Create an account or sign in" onPress={() => sync.signInNow()} />
        <LinkText label="What is kept, and who can see it" onPress={() => router.push('/privacy')} />
        <TrustChoice />
      </>
    );

  if (st.k === 'busy')
    return (
      <View style={s.row} accessibilityLiveRegion="polite">
        <ActivityIndicator color={c.accent} />
        <T tone="muted">{st.what}</T>
      </View>
    );

  if (st.k === 'ask')
    return (
      <>
        <T v="label">This device and your account both have a log.</T>
        <T v="small" tone="muted">
          Choose what to keep on this device. Nothing changes in your account until you choose.
        </T>
        <BigOption
          tone="accent"
          icon="plus"
          title="Combine them"
          sub="Keeps every day from both. Where both have the same day or your settings, the newer one is kept."
          onPress={() => sync.choose('combine')}
        />
        <BigOption
          tone="sun"
          icon="down"
          title="Use my account’s log here"
          sub="This device’s log is replaced by your account’s."
          onPress={() => sync.choose('account')}
        />
        <Button kind="ghost" label="Not now" onPress={() => sync.signOutNow(false)} />
      </>
    );

  const line =
    st.k === 'expired'
      ? 'Sign in again to keep syncing. Your log is still here.'
      : st.k === 'error'
        ? st.msg
        : syncedAgo(sync.at, now) + (sync.waiting ? ` · ${sync.waiting} change${sync.waiting === 1 ? '' : 's'} waiting` : '');
  return (
    <>
      {sync.email ? (
        <T v="small" tone="muted">
          Signed in as <T v="small">{sync.email}</T>
        </T>
      ) : null}
      <ErasedNote />
      <T tone={st.k === 'error' || st.k === 'expired' ? 'danger' : 'ink'} accessibilityLiveRegion="polite">
        {line}
      </T>
      {st.k === 'expired' ? (
        <Button label="Sign in again" onPress={() => sync.signInNow()} />
      ) : (
        <Button kind="ghost" icon="up" label="Sync now" onPress={sync.syncNow} />
      )}
      <TrustChoice />
      {ask === 'out' ? (
        <View style={[s.confirm, { backgroundColor: c.surface2 }]}>
          <T v="label">Sign out of sync on this device?</T>
          <T v="small" tone="muted">
            Your account keeps your log either way.
          </T>
          <Button kind="ghost" label="Sign out, keep the log on this device" onPress={() => sync.signOutNow(false)} />
          <Button kind="danger" label="Sign out and remove it from this device" onPress={() => sync.signOutNow(true)} />
          <Button kind="ghost" label="Stay signed in" onPress={() => setAsk(null)} />
        </View>
      ) : ask === 'delete' ? (
        <View style={[s.confirm, { backgroundColor: c.dangerSoft }]}>
          <T v="label">Delete your account and everything in it?</T>
          <T v="small" tone="muted">
            Your log is removed from your account for good, and you cannot sign in with it again. The log on this device stays, unless you delete it in Save,
            back up, delete.
          </T>
          <Button
            kind="danger"
            label="Yes, delete my account"
            onPress={async () => {
              setAsk(null);
              const r = await sync.deleteAccount();
              say(r.msg);
            }}
          />
          <Button kind="ghost" label="Keep my account" onPress={() => setAsk(null)} />
        </View>
      ) : (
        <View style={s.row}>
          <Button kind="ghost" label="Sign out…" onPress={() => setAsk('out')} />
          <Button kind="ghost" icon="trash" label="Delete my account…" onPress={() => setAsk('delete')} />
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  confirm: { gap: 8, padding: 12, borderRadius: 14 },
});
