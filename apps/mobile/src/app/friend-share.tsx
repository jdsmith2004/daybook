/* Friends: what your friends see of you. At the top, your card exactly as a friend sees it (show it, do not say it); below, a switch for
   each item, when the daily report reaches them, your name, and leaving Friends. Kept off the Friends page, which is about your friend
   (the owner, November 15, 2026: the page "still does not meet our standards"). */
import { friendToday, REPORT_TIMES, reportAt, SHARE_KEYS, SHARE_WORDS, weekShare, type ShareKey, type ShareVals } from '@daybook/core';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BigFlame } from '@/components/big-flame';
import { FriendWeek } from '@/components/friends-art';
import { SetGroup, SetRow, SetSwitch } from '@/components/settings-ui';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { LinkText } from '@/components/today';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useFriendsReady } from '@/lib/friends';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function FriendShare() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const fr = useFriendsReady();
  const me = fr.data?.me;
  const [err, setErr] = useState('');
  const [leave, setLeave] = useState(false);
  const all = useMemo<ShareVals>(() => (snap.settings ? weekShare(snap.days, snap.settings, snap.reviews, tk) : {}), [snap, tk]);
  if (!me)
    return (
      <SheetFrame title="What they see">
        <T tone="muted">{fr.ready ? 'Add a friend first.' : ''}</T>
      </SheetFrame>
    );
  /* only what is on, as the server would send it */
  const vals: ShareVals = {};
  for (const k of ['lessons', 'checkins', 'days', 'rode'] as const) if (me.on[k] && all[k] != null) vals[k] = all[k];
  if (all.dk && (me.on.lessons || me.on.checkins)) {
    vals.dk = all.dk;
    if (me.on.lessons) vals.dl = all.dl;
    if (me.on.checkins) vals.dc = all.dc;
  }
  if (me.on.level) {
    vals.level = all.level || 1;
    vals.lname = all.lname;
  }
  const save = async (on: typeof me.on, rt: string | null) => {
    const e = await fr.saveCard({ name: me.name, on, rt });
    setErr(e || '');
  };
  return (
    <SheetFrame title="What they see">
      <View style={{ gap: 24 }}>
        {/* your card, as a friend sees it */}
        <View style={{ gap: 12 }}>
          <View style={s.me}>
            <BigFlame level={vals.level || 1} size={72} noLand />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="h2">{me.name}</T>
              {vals.level ? (
                <T v="small" tone="muted">
                  Level {vals.level}
                  {vals.lname ? ', ' + vals.lname : ''}
                </T>
              ) : null}
            </View>
          </View>
          <FriendWeek vals={vals} today={friendToday(vals, tk)} />
        </View>

        <SetGroup head="Shared with your friends">
          {SHARE_KEYS.map((k: ShareKey) => (
            <SetSwitch
              key={k}
              label={SHARE_WORDS[k].label}
              sub={SHARE_WORDS[k].hint}
              on={!!me.on[k]}
              onChange={(v) => {
                buzz('tap');
                save({ ...me.on, [k]: v }, me.rt).catch(() => undefined);
              }}
            />
          ))}
        </SetGroup>

        <View style={{ gap: 8 }}>
          <T v="label">Daily report</T>
          <View style={s.chips} accessibilityRole="radiogroup">
            {[...REPORT_TIMES, null].map((t) => {
              const on = me.rt === t;
              return (
                <Pressable
                  key={t || 'off'}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    buzz('tick');
                    save(me.on, t).catch(() => undefined);
                  }}
                  style={({ pressed }) => [s.chip, { backgroundColor: on ? c.accentSoft : c.surface }, pressed && { opacity: 0.7 }]}>
                  <T v="small" style={{ color: on ? c.accentText : c.ink }}>
                    {t ? reportAt(t) : 'Off'}
                  </T>
                </Pressable>
              );
            })}
          </View>
          <T v="small" tone="muted">
            A short note on their phone at this hour. A slip, your journal and your notes are never shared.
          </T>
        </View>

        <SetGroup>
          <SetRow icon="pencil" label="Your name" value={me.name} onPress={() => router.push('/friend-me')} />
        </SetGroup>
        {err ? <T tone="danger">{err}</T> : null}

        <View style={{ alignItems: 'center', gap: 8 }}>
          {leave ? (
            <>
              <T tone="muted" style={{ textAlign: 'center' }}>
                Your card, your code and every friendship here are removed. Your friends are not told.
              </T>
              <Button
                label="Leave Friends"
                kind="danger"
                onPress={async () => {
                  const r = await fr.call('leave');
                  if (!r.ok) setErr(r.msg);
                  else closeSheet();
                }}
              />
              <LinkText label="Stay" onPress={() => setLeave(false)} />
            </>
          ) : (
            <LinkText label="Leave Friends" onPress={() => setLeave(true)} />
          )}
        </View>
      </View>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chip: { borderRadius: 999, paddingHorizontal: 16, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
});
