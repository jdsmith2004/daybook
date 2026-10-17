/* Reminders on a phone: up to three gentle daily notifications, made on the phone itself (nothing is sent from a server, and
   nothing about the log leaves the phone). The words are plain on purpose, because a notification can show on a locked
   screen: nothing in them says what Daybook is for. Tapping one opens Today (or, for Talk it through, the screen it is for). */
import { fmtClock } from '@daybook/core';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import type { ReminderPrefs } from './prefs';

export const remindersOffered = true;
const CHANNEL = 'reminders';

/* while the app is open, a reminder does not need to pop up over it */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** asks for permission if it was never asked. False when the person said no (they can change it in the phone's settings). */
export async function allowReminders(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return r.granted;
}

const hm = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return { hour: h, minute: m };
};
const before = (t: string, min: number) => {
  const [h, m] = t.split(':').map(Number);
  const x = (h * 60 + m - min + 1440) % 1440;
  return String(Math.floor(x / 60)).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0');
};

/** the reminders as they should be: everything Daybook scheduled is replaced by these */
export async function scheduleReminders(p: ReminderPrefs, screensOff: string | null, risk: number[] = []): Promise<void> {
  /* the daily ones and the hard-hours heads-ups are replaced; a one-off from Talk it through (below) stays */
  for (const n of await Notifications.getAllScheduledNotificationsAsync())
    if (n.identifier !== TALK) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  const heads = p.risk ? risk.filter((t) => t > Date.now()).slice(0, 7) : [];
  const any = p.morning || p.checkin || (p.wind && screensOff) || heads.length;
  if (!any) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Reminders', importance: Notifications.AndroidImportance.DEFAULT });
  const list: { body: string; at: string }[] = [];
  if (p.morning) list.push({ body: 'Last night’s questions. Two taps.', at: p.morningAt });
  if (p.checkin) list.push({ body: 'Check in. Under a minute.', at: p.checkinAt });
  if (p.wind && screensOff) list.push({ body: 'Wind down. Screens off at ' + fmtClock(screensOff) + '.', at: before(screensOff, 60) });
  for (const r of list)
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Daybook', body: r.body, data: { url: '/' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...hm(r.at), channelId: CHANNEL },
    });
  /* before the hard hours: one each day they are expected, opening Today, where the card waits */
  for (const [i, t] of heads.entries())
    await Notifications.scheduleNotificationAsync({
      identifier: 'risk-' + i,
      content: { title: 'Daybook', body: 'Your hard hours start soon. Two quiet minutes now make them easier.', data: { url: '/' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t, channelId: CHANNEL },
    });
}

/** whether this phone lets Daybook send notifications (without asking) */
export async function remindersAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

const TALK = 'talk';
/** one reminder from Talk it through (time to decide, or time to look back), replacing any earlier one. The words are
    plain, so a locked screen says nothing about what Daybook is for. url opens that screen. False when not allowed. */
export async function scheduleTalk(t: number, body: string, url: string): Promise<boolean> {
  await cancelTalk();
  if (t <= Date.now() || !(await allowReminders())) return false;
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Reminders', importance: Notifications.AndroidImportance.DEFAULT });
  await Notifications.scheduleNotificationAsync({
    identifier: TALK,
    content: { title: 'Daybook', body, data: { url } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t, channelId: CHANNEL },
  });
  return true;
}
export async function cancelTalk(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(TALK).catch(() => undefined);
}

/** a tap on a reminder opens its screen (Today unless it says otherwise), whether the app was open or not */
export function listenForTaps(): () => void {
  const go = (r: Notifications.NotificationResponse | null | undefined) => {
    if (!r || r.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.navigate(url as '/');
    Notifications.clearLastNotificationResponse();
  };
  go(Notifications.getLastNotificationResponse());
  const s = Notifications.addNotificationResponseReceivedListener(go);
  return () => s.remove();
}
