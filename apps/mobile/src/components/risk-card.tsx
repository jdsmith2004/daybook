/* Hard hours on Today (core: risk.ts). From two hours before the hours the log says are hardest, a bold card at the top
   leads with the time ("Your hard hours start at 11 PM.") and assumes nothing: the person may be doing well and have
   opened the app for the lesson. Its main button is today's lesson while it is not done (core riskLesson), with "Make a
   plan for tonight" (the short Talk it through, /talk?prep=1) as a quieter second; with the lesson done, the plan is the
   main button. During the hours it stays, next to SOS. Coming up or now, it is the loudest thing on Today, in SOS's own color and
   short enough to fit above the tab bar (the owner, October 30, 2026: hard to ignore). Once a plan is made, it turns calm ("You are
   ready"); a lesson does not count as a plan. Afterwards, if they passed with no slip, it celebrates them. On a phone that has not
   allowed notifications yet, it offers a heads-up for next time. */
import { hardHeld, lmin, riskDay, riskLesson, riskPlanLabel, riskStartLabel, talkClock, type Snapshot } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { bell } from '@/components/notify-banner';
import { Button, Card, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { allowReminders, remindersAllowed, remindersOffered } from '@/lib/reminders';
import { useReminderPrefs } from '@/lib/prefs';
import { useStore } from '@/lib/store';
import { useAccount } from '@/lib/sync';
import { font, useTheme } from '@/lib/theme';
import { WORDS } from '@/lib/words';

const left = (ms: number) => {
  const m = Math.max(1, Math.round(ms / 60000));
  return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
};

export function RiskCard({ snap, tk, now }: { snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const { say } = useStore();
  const prefs = useReminderPrefs();
  const account = useAccount();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    if (remindersOffered) remindersAllowed().then(setAllowed);
  }, []);
  const st = snap.settings;
  const r = st ? riskDay(snap.days, st, tk, now) : null;
  if (!r || r.phase === 'far' || (r.phase === 'after' && !r.held)) return null;
  const at = riskStartLabel(r.win.start);
  /* today's lesson, while it is not done: the card's first button */
  const ls = riskLesson(snap.days, st!, tk, account);
  const lessonBtn = ls ? (
    <>
      <T v="small" tone="muted" style={s.lessonLine}>
        {(ls.again ? 'Read again: ' : 'Lesson ' + ls.n + ': ') + ls.L.title + ' · ' + lmin(ls.L)}
      </T>
      <Button
        label={ls.again ? 'Read it again' : 'Start today’s lesson'}
        onPress={() => {
          buzz('tap');
          router.push({ pathname: '/lesson/[id]', params: { id: ls.L.id } });
        }}
      />
    </>
  ) : null;
  const plan = riskPlanLabel(r.win.start);

  /* afterwards, held. Today is recorded a moment after this shows (Today's keepHard), so it counts from the start. */
  const held = hardHeld(snap.days) + (snap.days[tk]?.p?.hw == null ? 1 : 0);
  if (r.phase === 'after')
    return (
      <Appear by={10}>
        <Card style={{ backgroundColor: c.mintSoft }}>
          <View style={s.head}>
            <T v="eyebrow" tone="mintText">
              Hard hours held
            </T>
            <T v="h2">You got through {r.win.label}.</T>
          </View>
          <T>
            Your hardest hours, held. That makes {held} {held === 1 ? 'time' : 'times'}, and every one stays.
          </T>
        </Card>
      </Appear>
    );

  /* talked through already: calm */
  if (r.talked)
    return (
      <Card>
        <View style={s.head}>
          <T v="eyebrow" tone="muted">
            Your hard hours · {r.win.label}
          </T>
          <T v="h2">{r.phase === 'during' ? 'You planned for this.' : 'You are ready for ' + at + '.'}</T>
        </View>
        <T tone="muted">You made your plan at {talkClock(r.talked)}. If it gets hard anyway, SOS is one tap.</T>
        {lessonBtn}
      </Card>
    );

  /* coming up, or now: the time, today's lesson, and a short plan */
  const soon = r.phase === 'soon';
  const openPlan = () => {
    buzz('tap');
    router.push({ pathname: '/talk', params: { prep: '1' } });
  };
  const openLesson = () => {
    buzz('tap');
    if (ls) router.push({ pathname: '/lesson/[id]', params: { id: ls.L.id } });
  };
  const loud = (label: string, onPress: () => void, main: boolean) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.loudBtn, { backgroundColor: main ? c.sosInk : c.sosSoft, opacity: pressed ? 0.8 : 1 }]}>
      <Text style={[s.loudBtnT, { color: main ? c.sosLow : c.sosInk }]}>{label}</Text>
    </Pressable>
  );
  return (
    <Appear by={10}>
      <View style={s.loud}>
        <LinearGradient colors={[c.sos, c.sosLow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={s.loudTop}>
          {/* coming up: how long until; now: when they end. They are hours, and they pass. */}
          <Text style={[s.loudEb, { color: c.sosInk }]}>{soon ? 'In ' + left(r.a - now) : 'Until ' + talkClock(r.b)}</Text>
          {remindersOffered && prefs.risk && allowed === false ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Get a heads-up on this phone next time"
              hitSlop={6}
              onPress={async () => {
                buzz('tap');
                const ok = await allowReminders();
                setAllowed(ok);
                say(ok ? 'Daybook will give you a heads-up before your hard hours.' : WORDS.notifyOff);
              }}
              style={({ pressed }) => [s.warn, { backgroundColor: c.sosSoft, opacity: pressed ? 0.7 : 1 }]}>
              <SvgXml xml={bell(c.sosInk)} width={16} height={16} />
              <Text style={[s.warnT, { color: c.sosInk }]}>Get a heads-up</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={[s.loudH, { color: c.sosInk }]} accessibilityRole="header">
          {soon ? 'Your hard hours start at ' + at + '.' : 'You are in your hard hours.'}
        </Text>
        {ls ? loud(ls.again ? 'Read it again' : 'Start today’s lesson', openLesson, true) : null}
        {loud(plan, openPlan, !ls)}
      </View>
    </Appear>
  );
}

const s = StyleSheet.create({
  head: { gap: 4 },
  lessonLine: { textAlign: 'center' },
  loud: { borderRadius: 20, padding: 16, gap: 8, overflow: 'hidden' },
  loudTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 32 },
  loudEb: { fontFamily: font.bodyBold, fontSize: 15, lineHeight: 20 },
  loudH: { fontFamily: font.display, fontSize: 22, lineHeight: 27, marginBottom: 4 },
  loudBtn: { minHeight: 50, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  loudBtnT: { fontFamily: font.bodyBold, fontSize: 15 },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32, paddingHorizontal: 12, borderRadius: 999 },
  warnT: { fontFamily: font.bodySemi, fontSize: 13 },
});
