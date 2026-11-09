/* Apple Health on the iPhone (docs/plan.md, "Your nights from Apple Health"): sleep only, read only, read while the app is
   open (no background delivery). Apple never tells an app whether reading was allowed: a "no" looks the same as no data. */
import type { SleepSample } from '@daybook/core';
import { isHealthDataAvailable, queryCategorySamples, requestAuthorization } from '@kingstinct/react-native-healthkit';

const SLEEP = 'HKCategoryTypeIdentifierSleepAnalysis' as const;

export const healthHere = (): boolean => {
  try {
    return isHealthDataAvailable();
  } catch {
    return false;
  }
};

export const askSleep = async (): Promise<boolean> => {
  if (!healthHere()) return false;
  try {
    return await requestAuthorization({ toRead: [SLEEP] });
  } catch {
    return false;
  }
};

export const readSleep = async (since: number): Promise<SleepSample[]> => {
  if (!healthHere()) return [];
  const got = await queryCategorySamples(SLEEP, { limit: 0, ascending: true, filter: { date: { startDate: new Date(since) } } });
  return got.map((s) => ({ start: s.startDate.getTime(), end: s.endDate.getTime(), value: Number(s.value) }));
};
