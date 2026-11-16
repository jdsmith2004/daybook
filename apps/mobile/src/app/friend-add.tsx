/* Friends: your code, big, and one tap to send it as a link through any messenger. The code works for a week, for as many friends
   as you send it to; a new one ends the old (the owner's answer, November 15, 2026). The message never names the habit. */
import { INVITE_DAYS, inviteLink, inviteText, showCode, SITE_URL } from '@daybook/core';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Share, StyleSheet, View } from 'react-native';

import { Flame } from '@/components/flame';
import { Dock } from '@/components/scene';
import { SheetFrame } from '@/components/sheet';
import { LinkText } from '@/components/today';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useFriends } from '@/lib/friends';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

/** the link opens the web app on the code; on the web that is this very site */
const site = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : SITE_URL);

export default function FriendAdd() {
  const c = useTheme();
  const { say } = useStore();
  const fr = useFriends();
  const [inv, setInv] = useState<{ code: string; exp: number } | null>(fr.data?.invite || null);
  const [err, setErr] = useState('');

  const get = async (fresh: boolean) => {
    setErr('');
    const r = await fr.call('invite', { fresh });
    if (r.ok) setInv({ code: String(r.body.code), exp: Number(r.body.exp) });
    else setErr(r.msg);
  };
  useEffect(() => {
    if (!fr.data?.me) router.replace({ pathname: '/friend-me', params: { next: 'add' } });
    else if (!inv) get(false).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    if (!inv || !fr.data?.me) return;
    const link = inviteLink(site(), inv.code);
    const text = inviteText(fr.data.me.name, link, inv.code);
    buzz('tap');
    try {
      if (Platform.OS !== 'web' || (typeof navigator !== 'undefined' && 'share' in navigator)) {
        await Share.share(Platform.OS === 'ios' ? { message: text } : { message: text, title: 'Daybook' });
        return;
      }
    } catch {
      /* the share sheet was closed, or this browser has none: copy instead */
    }
    await Clipboard.setStringAsync(text).catch(() => undefined);
    say('The invite is copied. Paste it to your friend.');
  };

  const days = inv ? Math.max(1, Math.ceil((inv.exp - Date.now()) / 86400_000)) : INVITE_DAYS;
  return (
    <SheetFrame title="Add a friend">
      <View style={s.wrap}>
        <T tone="muted">Send this to someone on your side. When they enter it, you are friends, and nothing is shared until you each turn it on.</T>
        <View style={s.middle}>
          <Flame level={2} size={88} alive />
          {inv ? (
            <T v="big" selectable accessibilityLabel={'Your code: ' + inv.code.split('').join(' ')} style={{ color: c.ink }}>
              {showCode(inv.code)}
            </T>
          ) : err ? null : (
            <ActivityIndicator color={c.accent} />
          )}
          {inv ? (
            <T v="small" tone="muted">
              Works for {days === 1 ? 'one more day' : days + ' days'}, for as many friends as you like
            </T>
          ) : null}
        </View>
        {err ? <T tone="danger">{err}</T> : null}
        <Dock>
          <Button label="Send the invite" icon="ext" disabled={!inv} onPress={send} />
          <View style={{ alignItems: 'center' }}>
            <LinkText label="Make a new code" onPress={() => get(true)} />
          </View>
        </Dock>
      </View>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 16, minHeight: 440 },
  middle: { alignItems: 'center', gap: 8, paddingVertical: 24 },
});
