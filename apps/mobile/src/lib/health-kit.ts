/* Apple Health is on the iPhone only (health-kit.ios.ts). On the web and Android there is nothing to read, and Daybook never offers it. */
import type { SleepSample } from '@daybook/core';

/** whether this device has Apple Health */
export const healthHere = (): boolean => false;
/** shows Apple's own sheet asking to read sleep; true when the sheet was shown (Apple never says whether reading was allowed) */
export const askSleep = async (): Promise<boolean> => false;
/** sleep samples from `since` (ms) on */
export const readSleep = async (_since: number): Promise<SleepSample[]> => [];
