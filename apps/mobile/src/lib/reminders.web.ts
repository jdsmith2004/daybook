/* Reminders in a browser: a web page cannot remind you once it is closed, so the app suggests phone alarms instead. */
import type { Nudge } from '@daybook/core';

export const remindersOffered = false;
export async function allowReminders(): Promise<boolean> {
  return false;
}
export async function scheduleNudges(_plan: Nudge[]): Promise<void> {}
export async function remindersAllowed(): Promise<boolean> {
  return false;
}
export async function scheduleTalk(_t: number, _body: string, _url: string): Promise<boolean> {
  return false;
}
export async function cancelTalk(): Promise<void> {}
export function listenForTaps(_onTap?: (id: string) => void): () => void {
  return () => undefined;
}
