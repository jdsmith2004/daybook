/* Reminders on a phone, made on the phone itself: nothing is sent from a server, and nothing about the log leaves the phone.
   Core nudges.ts plans them (today and tomorrow, then a few come-back notes) from the log and the choices in Settings;
   this schedules that plan, one notification at a time, and makes it again each time the app opens. The words are plain on
   purpose, because a notification can show on a locked screen: nothing in them says what Daybook is for. Tapping one opens
   Today (or the screen it is for). On Android each kind has its own channel, so one can be quieted without the others.
   On iPhone each note carries its flame picture (core Nudge.pic, apps/mobile/assets/notify); Android shows the fixed small
   and large icons from app.json, because a local note there cannot carry a picture of its own. */
import type { Nudge, NudgeKind, NudgePic } from '@daybook/core';
import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Linking, Platform } from 'react-native';

export const remindersOffered = true;
const CHANNEL = 'reminders';
/* the Android channels: the check-ins (and Talk it through) keep the first channel's id, so a phone that has it keeps its choice */
/* the come-back notes are low: no sound, no pop-up, only in the list */
const CHANNELS: { id: string; name: string; kinds: NudgeKind[]; low?: boolean }[] = [
  { id: CHANNEL, name: 'Check-ins', kinds: ['checkin', 'wind'] },
  { id: 'hard-hours', name: 'Hard hours', kinds: ['risk'] },
  { id: 'sunday', name: 'Sunday review', kinds: ['sunday'] },
  { id: 'follow-ups', name: 'Follow-ups', kinds: ['back'], low: true },
];
const channelOf = (k: NudgeKind) => (CHANNELS.find((c) => c.kinds.includes(k)) || CHANNELS[0]).id;
let channelsMade = false;
async function makeChannels() {
  if (Platform.OS !== 'android' || channelsMade) return;
  for (const c of CHANNELS)
    await Notifications.setNotificationChannelAsync(c.id, {
      name: c.name,
      importance: c.low ? Notifications.AndroidImportance.LOW : Notifications.AndroidImportance.DEFAULT,
    });
  channelsMade = true;
}

/* while the app is open, a reminder does not need to pop up over it */
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/* who wants to hear when the phone's answer may have changed: the plan (the come-back notes need it) and the ask on Today */
const heard = new Set<() => void>();
export function onPermission(f: () => void): () => void {
  heard.add(f);
  return () => void heard.delete(f);
}

/** asks for permission if it was never asked. False when the person said no (they can change it in the phone's settings). */
export async function allowReminders(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const r = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  heard.forEach((f) => f());
  return r.granted;
}

/* the flame pictures, iPhone only. iOS moves an attached file into its own store, so each note gets its own copy in the cache. */
const PICS: Record<NudgePic, number> = {
  'flame-bright': require('@/assets/notify/flame-bright.png'),
  'flame-warm': require('@/assets/notify/flame-warm.png'),
  'flame-steady': require('@/assets/notify/flame-steady.png'),
  'flame-ember': require('@/assets/notify/flame-ember.png'),
  'flame-asleep': require('@/assets/notify/flame-asleep.png'),
};
async function attach(n: Nudge): Promise<Notifications.NotificationContentAttachmentIos[]> {
  if (Platform.OS !== 'ios') return [];
  try {
    const [a] = await Asset.loadAsync(PICS[n.pic] ?? PICS['flame-bright']);
    if (!a.localUri) return [];
    const to = new File(Paths.cache, 'note-' + n.id + '.png');
    if (to.exists) to.delete();
    new File(a.localUri).copy(to);
    return [{ identifier: n.pic, url: to.uri, type: null, typeHint: 'public.png' }];
  } catch {
    return [];
  }
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
    /* the come-back notes arrive quietly on iPhone too */
    const quiet = n.quiet || n.k === 'back';
    const attachments = await attach(n);
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: {
        title: 'Daybook',
        body: n.body,
        data: { url: n.url, id: n.id },
        ...(quiet ? { interruptionLevel: 'passive' as const } : {}),
        ...(attachments.length ? { attachments } : {}),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.at, channelId: channelOf(n.k) },
    });
  }
}

/** whether this phone lets Daybook send notifications (without asking) */
export async function remindersAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}
/** what the phone says, for the ask on Today (core notify.ts): granted, and whether its own prompt can still show */
export async function remindersState(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  const p = await Notifications.getPermissionsAsync();
  return { granted: p.granted, canAskAgain: p.canAskAgain };
}

/** Android 12 and newer: whether notes can come at their exact time. Without it, Android may send them up to an hour
    late, which is fine for a check-in and wrong for the heads-up before hard hours. Always true elsewhere. */
export async function exactAlarmsOk(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  return (await Notifications.getExactAlarmPermissionsAsync().catch(() => ({ granted: true }))).granted;
}
/** opens Android's page to allow exact times, and says whether it is allowed after */
export async function exactAlarmsAsk(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  return (await Notifications.requestExactAlarmPermissionsAsync().catch(() => ({ granted: false }))).granted;
}
/** the phone's settings page for Daybook, where notifications can be turned on after a no */
export function openPhoneSettings(): void {
  Linking.openSettings().catch(() => undefined);
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
