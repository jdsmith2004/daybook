/* The ask on Today when notifications are off (core notify.ts; docs/plan.md, "Notifications, second pass"): a strip at the
   very top, above the flame, full width, in the sun color with a bell and an X, like Duolingo's. The one place Daybook nags,
   by the owner's choice: it comes back each day until notifications are on or "Stop asking on this phone" is chosen in
   Settings. It is never a modal and never blocks anything. "Turn on" asks the phone, and when nothing is on yet turns on the
   check-in at the time setup remembered (6 PM if none) and the Sunday review; "Open settings" opens the phone's page for
   Daybook when the phone has said no. The X hides it until tomorrow. */
import { notifyAsk, notifyQuiet, nudgeResume } from '@daybook/core';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { useNotifyEnv } from '@/lib/notify-env';
import { setNotifyMem, setNudgeLog, setReminderPrefs, useNotifyMem, useReminderPrefs } from '@/lib/prefs';
import { allowReminders, openPhoneSettings } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const bell = (ink: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z"/><path d="M10.2 20a2 2 0 0 0 3.6 0"/></svg>`;

export function NotifyBanner() {
  const c = useTheme();
  const { snap, tk, say } = useStore();
  const env = useNotifyEnv();
  const mem = useNotifyMem();
  const rem = useReminderPrefs();
  const ask = env ? notifyAsk(env, mem, snap.days, snap.settings, tk) : null;
  if (!ask) return null;

  const yes = async () => {
    if (ask.k === 'off') return openPhoneSettings();
    const ok = await allowReminders();
    if (!ok) return;
    if (!(rem.checkin || rem.morning || rem.wind || rem.review)) {
      setReminderPrefs({ ...rem, checkin: true, review: true });
      /* turned on fresh, so each starts every day (core nudges.ts) */
      for (const k of ['checkin', 'sunday'] as const) setNudgeLog((l) => nudgeResume(l, k));
    }
    say('Reminders are on. One short note a day.');
  };

  return (
    <View style={[s.wrap, { backgroundColor: c.sun }]} accessibilityRole="summary">
      <SvgXml xml={bell(c.onSun)} width={22} height={22} />
      <Text style={[s.text, { color: c.onSun }]}>{ask.text}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={yes}
        hitSlop={6}
        style={({ pressed }) => [s.btn, { backgroundColor: c.onSun, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={[s.btnT, { color: c.sun }]}>{ask.yes}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Hide until tomorrow"
        onPress={() => setNotifyMem((m) => notifyQuiet(m, tk))}
        hitSlop={10}
        style={({ pressed }) => [s.x, { opacity: pressed ? 0.6 : 1 }]}>
        <Icon name="x" size={18} color={c.onSun} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 14, paddingRight: 8, borderRadius: 16, marginBottom: 12 },
  text: { flex: 1, fontFamily: font.bodySemi, fontSize: 13.5, lineHeight: 18 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  btnT: { fontFamily: font.bodyBold, fontSize: 13.5 },
  x: { padding: 4 },
});
