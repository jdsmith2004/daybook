/* Reminders in a browser: a web page cannot remind you once it is closed, so the app suggests phone alarms instead. */
import type { ReminderPrefs } from './prefs';

export const remindersOffered = false;
export async function allowReminders(): Promise<boolean> {
  return false;
}
export async function scheduleReminders(_p: ReminderPrefs, _screensOff: string | null): Promise<void> {}
export async function scheduleMap(_t: number, _body: string): Promise<boolean> {
  return false;
}
export async function cancelMap(): Promise<void> {}
export function listenForTaps(): () => void {
  return () => undefined;
}
