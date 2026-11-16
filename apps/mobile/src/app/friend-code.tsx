/* Friends: entering a friend's code (or opening their link, which fills it in). It shows whose code it is first, then one tap makes
   you friends. Both people chose this: one sent the code, the other entered it; and nothing is shared until each turns it on. */
import { gameCompute, normCode, showCode } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Field } from '@/components/choices';
import { BigFlame } from '@/components/big-flame';
import { Dock } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Button, T } from '@/components/ui';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { useFriendsReady } from '@/lib/friends';
import { useStore } from '@/lib/store';

export default function FriendCode() {
  const p = useLocalSearchParams<{ code?: string }>();
  const fr = useFriendsReady();
  const { snap, tk } = useStore();
  const level = snap.settings ? gameCompute(snap.days, snap.settings, snap.reviews, tk).level.n : 1;
  const { height } = useWindowDimensions();
  const tall = { minHeight: Math.max(440, height - 150) };
  const [code, setCode] = useState(p.code ? showCode(normCode(p.code) || '') : '');
  const [found, setFound] = useState<{ name: string; self: boolean; already: boolean } | null>(null);
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const find = async (raw = code) => {
    const c = normCode(raw);
    if (!c) return setErr('A code is six letters and numbers, like K7Q-M2P.');
    setErr('');
    setBusy(true);
    const r = await fr.look(c);
    setBusy(false);
    if (r.ok) setFound({ name: r.name, self: r.self, already: r.already });
    else setErr(r.msg);
  };
  const started = useRef(false);
  useEffect(() => {
    if (!fr.ready || started.current) return;
    started.current = true;
    if (!fr.signedIn) router.replace({ pathname: '/friends', params: p.code ? { code: p.code } : {} });
    else if (!fr.data?.me) router.replace({ pathname: '/friend-me', params: { next: 'code', ...(p.code ? { code: p.code } : {}) } });
    else if (p.code && normCode(p.code)) find(p.code).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fr.ready]);

  const accept = async () => {
    setBusy(true);
    const r = await fr.call('accept', { code: normCode(code) });
    setBusy(false);
    if (!r.ok) return setErr(r.msg);
    buzz('lit');
    track('friend_added');
    setDone(String(r.body.name || found?.name || ''));
  };

  if (done)
    return (
      <SheetFrame title="Friends">
        <View style={[s.wrap, tall]}>
          <View style={[s.middle, s.grow]}>
            <View style={s.pair}>
              <BigFlame level={level} size={150} noLand />
              <BigFlame level={3} size={150} noLand />
            </View>
            <T v="h2" style={{ textAlign: 'center' }}>
              You and {done} are friends
            </T>
            <T tone="muted" style={{ textAlign: 'center' }}>
              Choose what they see of you on the Friends page. Everything starts off.
            </T>
          </View>
          <Dock>
            <Button label="Done" onPress={closeSheet} />
          </Dock>
        </View>
      </SheetFrame>
    );

  return (
    <SheetFrame title="I have a code">
      <View style={[s.wrap, tall]}>
        {!found ? (
          <View style={{ gap: 12 }}>
            <Field
              label="Your friend's code"
              placeholder="K7Q-M2P"
              value={code}
              onChangeText={(v) => {
                setCode(v);
                setErr('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={60}
              onSubmitEditing={() => find()}
              returnKeyType="go"
            />
            {err ? <T tone="danger">{err}</T> : null}
            <Button label={busy ? 'Looking' : 'Find'} disabled={busy || !code.trim()} onPress={() => find()} />
          </View>
        ) : (
          <>
            <View style={[s.middle, s.grow]}>
              <BigFlame level={3} size={190} noLand />
              <T v="h2" style={{ textAlign: 'center' }}>
                {found.self ? 'That is your own code' : found.already ? `You and ${found.name} are already friends` : `${found.name} invited you`}
              </T>
              {!found.self && !found.already ? (
                <T tone="muted" style={{ textAlign: 'center' }}>
                  You will see each other&apos;s name and goals. Anything more, each of you turns on.
                </T>
              ) : null}
              {err ? <T tone="danger">{err}</T> : null}
            </View>
            <Dock>
              {found.self || found.already ? (
                <Button label="Done" onPress={closeSheet} />
              ) : (
                <Button label={busy ? 'One moment' : 'Become friends'} disabled={busy} onPress={accept} />
              )}
            </Dock>
          </>
        )}
      </View>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 16, minHeight: 440 },
  middle: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  pair: { flexDirection: 'row', marginBottom: 8 },
  grow: { flex: 1, justifyContent: 'center' },
});
