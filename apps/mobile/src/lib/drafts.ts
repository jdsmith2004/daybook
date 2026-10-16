/* An evening check-in that was started but not saved is kept on this device (legacy "drafts"), so closing the app does not
   lose it. Drafts older than two weeks are let go. They are never synced and never part of the log. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, type CheckinForm, type DayKey } from '@daybook/core';

const KEY = 'daybook.drafts';
let cache: Record<DayKey, CheckinForm> | null = null;

export async function loadDrafts(): Promise<Record<DayKey, CheckinForm>> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : {};
    cache = v && typeof v === 'object' ? v : {};
  } catch {
    cache = {};
  }
  return cache!;
}

export async function saveDraft(key: DayKey, f: CheckinForm | null, today: DayKey) {
  const all = { ...(await loadDrafts()) };
  if (f) all[key] = f;
  else delete all[key];
  const cut = addDays(today, -14);
  Object.keys(all).forEach((k) => k < cut && delete all[k]);
  cache = all;
  try {
    if (Object.keys(all).length) await AsyncStorage.setItem(KEY, JSON.stringify(all));
    else await AsyncStorage.removeItem(KEY);
  } catch {
    /* a draft is a convenience */
  }
}

export async function forgetDrafts() {
  cache = {};
  await AsyncStorage.removeItem(KEY).catch(() => undefined);
}
