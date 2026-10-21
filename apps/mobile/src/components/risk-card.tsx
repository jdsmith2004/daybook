/* Hard hours on Today (core: risk.ts). From two hours before the hours the log says are hardest, a bold card at the top
   asks for two minutes of Talk it through while it is still quiet; during them it stays, next to SOS. Once talked
   through, it turns calm ("You are ready"). Afterwards, if they passed with no slip, it celebrates them. On a phone
   that has not allowed notifications yet, it offers a heads-up for next time. */
import { hardHeld, riskDay, talkClock, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { allowReminders, remindersAllowed, remindersOffered } from '@/lib/reminders';
import { useReminderPrefs } from '@/lib/prefs';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const left = (ms: number) => {
  const m = Math.max(1, Math.round(ms / 60000));
  return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
};

export function RiskCard({ snap, tk, now }: { snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const { say } = useStore();
  const prefs = useReminderPrefs();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    if (remindersOffered) remindersAllowed().then(setAllowed);
  }, []);
  const st = snap.settings;
  const r = st ? riskDay(snap.days, st, tk, now) : null;
  if (!r || r.phase === 'far' || (r.phase === 'after' && !r.held)) return null;
  const startH = r.win.label.split(' to ')[0];
  const at = startH.replace(/^(\d+)$/, '$1 ' + (r.win.start < 12 ? 'AM' : 'PM'));

  /* afterwards, held. Today is recorded a moment after this shows (Today's keepHard), so it counts from the start. */
  const held = hardHeld(snap.days) + (snap.days[tk]?.p?.hw == null ? 1 : 0);
  if (r.phase === 'after')
    return (
      <Appear by={10} style={[s.card, { backgroundColor: c.mintSoft, borderColor: c.mint, shadowColor: c.lip }]}>
        <View style={s.head}>
          <View style={[s.ic, { backgroundColor: c.mint }]}>
            <Icon name="star" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.eyebrow, { color: c.mintText }]}>HARD HOURS HELD</Text>
            <Text style={[s.title, { color: c.ink }]}>You got through {r.win.label}.</Text>
          </View>
        </View>
        <T>
          Your hardest hours, held. That makes {held} {held === 1 ? 'time' : 'times'}, and every one stays.
        </T>
      </Appear>
    );

  /* talked through already: calm */
  if (r.talked)
    return (
      <View style={[s.card, { backgroundColor: c.surface, borderColor: c.cardEdge, shadowColor: c.lip }]}>
        <View style={s.head}>
          <View style={[s.ic, { backgroundColor: c.mintSoft }]}>
            <Icon name="check" size={20} color={c.mintText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.eyebrow, { color: c.muted }]}>YOUR HARD HOURS · {r.win.label.toUpperCase()}</Text>
            <Text style={[s.title, { color: c.ink }]}>{r.phase === 'during' ? 'You planned for this.' : 'You are ready for ' + at + '.'}</Text>
          </View>
        </View>
        <T v="small" tone="muted">
          You talked it through at {talkClock(r.talked)}. If it gets hard anyway, SOS is one tap.
        </T>
      </View>
    );

  /* coming up, or now: the push */
  const soon = r.phase === 'soon';
  return (
    <Appear by={10} style={[s.card, s.loud, { backgroundColor: c.violetSoft, borderColor: c.violet, shadowColor: c.lip }]}>
      <View style={s.head}>
        <View style={[s.ic, { backgroundColor: c.violet }]}>
          <Icon name="timer" size={20} color={c.scheme === 'dark' ? '#1A1250' : '#FFFFFF'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.eyebrow, { color: c.violetText }]}>YOUR HARD HOURS · {soon ? 'IN ' + left(r.a - now).toUpperCase() : 'NOW'}</Text>
          <Text style={[s.title, { color: c.ink }]}>{soon ? at + ' is coming.' : 'You are in your hard hours.'}</Text>
        </View>
      </View>
      <T>{r.win.line}</T>
      <T style={{ fontFamily: font.bodySemi }}>
        {soon ? 'Talk it through now, while it is quiet. Two minutes now makes the next hours easier.' : 'SOS is one tap. Or talk it through first.'}
      </T>
      <Button label="Talk it through" onPress={() => router.push('/talk')} />
      {remindersOffered && prefs.risk && allowed === false ? (
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            buzz('tap');
            const ok = await allowReminders();
            setAllowed(ok);
            say(
              ok
                ? 'Daybook will give you a heads-up before your hard hours.'
                : 'Notifications are off for Daybook. You can turn them on in your phone’s settings.',
            );
          }}
          style={s.link}>
          <Text style={[s.linkT, { color: c.violetText }]}>Get a heads-up on this phone next time</Text>
        </Pressable>
      ) : null}
    </Appear>
  );
}

const s = StyleSheet.create({
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  loud: { borderWidth: 2.5 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ic: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: font.bodyBold, fontSize: 11.5, letterSpacing: 1 },
  title: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
  link: { alignSelf: 'center', minHeight: 36, justifyContent: 'center' },
  linkT: { fontFamily: font.bodySemi, fontSize: 14.5, textDecorationLine: 'underline' },
});
