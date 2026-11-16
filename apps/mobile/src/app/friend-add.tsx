/* Friends: adding a friend in one screen, low effort (the owner, November 15, 2026: "it should be a very clean process ... it's low
   effort, it's very easy"). At the top, what the friend will see, said plainly and automatic (only a first name to write, the first
   time); at the bottom, under the thumb, three ways on: share the invite link, share the code, or enter a friend's code. The code
   is made on the first share, works for a week, for as many friends as the person sends it to. The message never names the habit. */
import {
  codeText,
  gameCompute,
  showCode,
  inviteLink,
  inviteText,
  NAME_MAX,
  REPORT_DEFAULT,
  reportAt,
  SHARE_DEFAULT,
  SITE_URL,
  wordsTrouble,
  type ShareKey,
} from '@daybook/core';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Share, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BigFlame } from '@/components/big-flame';
import { Field } from '@/components/choices';
import { Dock } from '@/components/scene';
import { SheetFrame } from '@/components/sheet';
import { LinkText } from '@/components/today';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { Toggle } from '@/components/settings-ui';
import { registerPush, useFriendsReady } from '@/lib/friends';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

/** the link opens the web app on the code; on the web that is this very site */
const site = () => (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : SITE_URL);

/** what the friend will see, line by line, from what is on */
function seeLines(on: Partial<Record<ShareKey, boolean>>, rt: string | null): string[] {
  const out: string[] = [];
  if (on.lessons) out.push('How often you do a lesson');
  if (on.checkins || on.days) out.push('How often you check in and open Daybook');
  if (on.rode) out.push('Urges you ride out, as a weekly count');
  if (on.level) out.push('Your flame as it grows');
  if (rt) out.push('A short daily report at ' + reportAt(rt));
  return out;
}

export default function FriendAdd() {
  const c = useTheme();
  const fr = useFriendsReady();
  const { height } = useWindowDimensions();
  const me = fr.data?.me || null;
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<'link' | 'code' | null>(null);
  const [err, setErr] = useState('');
  /* how you hear about the friend who joins by this code: as it happens (capped) unless turned off here */
  const [live, setLive] = useState((me?.hn || 'live') === 'live');
  /* the code, once there is one, shown big in the middle under the flame */
  const [shown, setShown] = useState<string | null>(null);
  const code = shown || (fr.data?.invite && fr.data.invite.exp > Date.now() ? fr.data.invite.code : null);
  const { snap, tk, say } = useStore();
  const level = snap.settings ? gameCompute(snap.days, snap.settings, snap.reviews, tk).level.n : 1;
  /* opened with no account (a reload, an old link): the Friends page asks for one */
  const started = useRef(false);
  useEffect(() => {
    if (!fr.ready || started.current) return;
    started.current = true;
    if (!fr.signedIn) router.replace('/friends');
  }, [fr.ready, fr.signedIn]);

  const share = async (how: 'link' | 'code') => {
    setErr('');
    const nm = me ? me.name : name.trim();
    if (!nm) return setErr('Add your first name, so your friend knows it is you.');
    const t = wordsTrouble(nm);
    if (t) return setErr(t);
    setBusy(how);
    const hn = live ? 'live' : 'daily';
    if (!me || (me.hn || 'live') !== hn) {
      const e = await fr.ensureCard(nm, hn);
      if (e) {
        setBusy(null);
        return setErr(e);
      }
    }
    /* hearing as it happens needs this phone's push token: notes are asked for now, once, if they never were */
    if (live) registerPush(fr.api, true).catch(() => undefined);
    const kept = fr.data?.invite && fr.data.invite.exp > Date.now() + 3600_000 ? fr.data.invite : null;
    const r = kept ? { ok: true, msg: '', body: { code: kept.code } as Record<string, unknown> } : await fr.call('invite', {});
    setBusy(null);
    if (!r.ok) return setErr(r.msg);
    const code = String(r.body.code);
    setShown(code);
    const text = how === 'link' ? inviteText(nm, inviteLink(site(), code), code) : codeText(nm, code);
    buzz('tap');
    try {
      if (Platform.OS !== 'web' || (typeof navigator !== 'undefined' && 'share' in navigator)) {
        await Share.share({ message: text });
        return;
      }
    } catch {
      /* the share sheet was closed, or this browser has none: copy instead */
    }
    await Clipboard.setStringAsync(text).catch(() => undefined);
    say(how === 'link' ? 'The invite link is copied. Paste it to your friend.' : 'Your code is copied. Paste it to your friend.');
  };

  const lines = seeLines(me?.on || SHARE_DEFAULT, me ? me.rt : REPORT_DEFAULT);
  return (
    <SheetFrame title="Add a friend">
      <View style={[s.wrap, { minHeight: Math.max(460, height - 150) }]}>
        <Card style={{ gap: 12 }}>
          {me ? (
            <T v="label">They will see, as {me.name}:</T>
          ) : (
            <Field
              label="Your first name"
              placeholder="So your friend knows it is you"
              value={name}
              onChangeText={(v) => {
                setName(v);
                setErr('');
              }}
              maxLength={NAME_MAX}
              autoComplete="given-name"
              returnKeyType="done"
            />
          )}
          <View style={{ gap: 8 }}>
            {lines.map((l) => (
              <View key={l} style={s.line}>
                <Icon name="check" size={18} color={c.mintText} />
                <T style={{ flex: 1 }}>{l}</T>
              </View>
            ))}
          </View>
          <T v="small" tone="muted">
            Never a slip, your journal or your notes. You can change what they see on the Friends page.
          </T>
        </Card>
        <View style={s.hear}>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="label">Hear when they do a lesson</T>
            <T v="small" tone="muted">
              And when they send you a spark. At most 2 notes a day, none at night.
            </T>
          </View>
          <Toggle on={live} label="Hear when they do a lesson" onChange={setLive} />
        </View>
        <View style={s.middle}>
          <BigFlame level={level} size={code ? 120 : 160} noLand />
          {code ? (
            <>
              <T v="title" selectable accessibilityLabel={'Your code: ' + code.split('').join(' ')}>
                {showCode(code)}
              </T>
              <T v="small" tone="muted">
                Your code, for a week
              </T>
            </>
          ) : null}
        </View>
        {err ? <T tone="danger">{err}</T> : null}
        <Dock>
          <Button label={busy === 'link' ? 'One moment' : 'Share my invite link'} icon="ext" disabled={!!busy} onPress={() => share('link')} />
          <Button label={busy === 'code' ? 'One moment' : 'Share my code'} kind="ghost" disabled={!!busy} onPress={() => share('code')} />
          <View style={{ alignItems: 'center' }}>
            <LinkText label="Enter a friend's code" onPress={() => router.replace('/friend-code')} />
          </View>
        </Dock>
      </View>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 16 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hear: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
