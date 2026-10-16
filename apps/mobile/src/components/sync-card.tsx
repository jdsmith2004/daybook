/* Sync between devices, in Settings: sign in, see when it last synced, sync now, sign out, or delete the account. The first
   time a device joins an account that already has a log, the question of what to keep is asked here. */
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BigOption } from '@/components/choices';
import { Button, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { syncedAgo, useSync } from '@/lib/sync';
import { useTheme } from '@/lib/theme';

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
          Sync keeps your log the same on your phone and on the web. It is kept in your own account, and nobody else can read it. Until you sign in, your log stays on this device
          only.
        </T>
        <Button label="Sign in to sync" onPress={sync.signInNow} />
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
          sub="This device’s log is replaced by your account’s. Save a backup first if you want to keep it."
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
      <T tone={st.k === 'error' || st.k === 'expired' ? 'danger' : 'ink'} accessibilityLiveRegion="polite">
        {line}
      </T>
      {st.k === 'expired' ? <Button label="Sign in again" onPress={sync.signInNow} /> : <Button kind="ghost" icon="up" label="Sync now" onPress={sync.syncNow} />}
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
            Your log is removed from your account for good, and you cannot sign in with it again. The log on this device stays, unless you delete it in Save, back up, delete.
          </T>
          <Button
            kind="danger"
            label="Yes, delete my account"
            onPress={async () => {
              setAsk(null);
              const ok = await sync.deleteAccount();
              say(ok ? 'Your account was deleted.' : 'Could not reach your account. Nothing was deleted.');
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
