/* Reminders on a phone, made on the phone itself: nothing is sent from a server, and nothing about the log leaves the phone.
   Core nudges.ts plans them (today and tomorrow, then a few come-back notes) from the log and the choices in Settings;
   this schedules that plan, one notification at a time, and makes it again each time the app opens. The words are plain on
   purpose, because a notification can show on a locked screen: nothing in them says what Daybook is for. Tapping one opens
   Today (or the screen it is for). On Android each kind has its own channel, so one can be quieted without the others. */
import type { Nudge, NudgeKind } from '@daybook/core';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

export const remindersOffered = true;
const CHANNEL = 'reminders';
/* the Android channels: the check-ins (and Talk it through) keep the first channel's id, so a phone that has it keeps its choice */
const CHANNELS: { id: string; name: string; kinds: NudgeKind[] }[] = [
  { id: CHANNEL, name: 'Check-ins', kinds: ['checkin', 'morning', 'wind'] },
  { id: 'hard-hours', name: 'Hard hours', kinds: ['risk'] },
  { id: 'sunday', name: 'Sunday review', kinds: ['sunday'] },
  { id: 'follow-ups', name: 'Follow-ups', kinds: ['back'] },
];
const channelOf = (k: NudgeKind) => (CHANNELS.find((c) => c.kinds.includes(k)) || CHANNELS[0]).id;
let channelsMade = false;
async function makeChannels() {
  if (Platform.OS !== 'android' || channelsMade) return;
  for (const c of CHANNELS) await Notifications.setNotificationChannelAsync(c.id, { name: c.name, importance: Notifications.AndroidImportance.DEFAULT });
  channelsMade = true;
}

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

/** the plan from core nudgePlan, as the phone's schedule: everything Daybook scheduled is replaced by it (a one-off from Talk it through stays) */
export async function scheduleNudges(plan: Nudge[]): Promise<void> {
  for (const n of await Notifications.getAllScheduledNotificationsAsync())
    if (n.identifier !== TALK) await Notifications.cancelScheduledNotificationAsync(n.identifier);
  if (!plan.length || !(await Notifications.getPermissionsAsync()).granted) return;
  await makeChannels();
  const now = Date.now();
  for (const n of plan) {
    if (n.at <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: { title: 'Daybook', body: n.body, data: { url: n.url, id: n.id }, ...(n.quiet ? { interruptionLevel: 'passive' as const } : {}) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: channelOf(n.k) },
    });
  }
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
  await makeChannels();
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

/** a tap on a reminder opens its screen (Today unless it says otherwise), whether the app was open or not. onTap hears
    which one, so the phone can tell which reminders help (core nudgeLearn). */
export function listenForTaps(onTap: (id: string) => void = () => undefined): () => void {
  const go = (r: Notifications.NotificationResponse | null | undefined) => {
    if (!r || r.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const id = r.notification.request.content.data?.id;
    if (typeof id === 'string') onTap(id);
    const url = r.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.navigate(url as '/');
    Notifications.clearLastNotificationResponse();
  };
  go(Notifications.getLastNotificationResponse());
  const s = Notifications.addNotificationResponseReceivedListener(go);
  return () => s.remove();
}
