/* Apple's in-app purchase on the web: there is none. tip-store.ts has the phone's. */
import type { TipTierId } from '@daybook/core';

export const iapAvailable = false;
export interface StoreTip {
  tier: TipTierId;
  jws: string;
  otid: string;
  since: number;
  purchase: unknown;
}
export const storePrice = (_tier: TipTierId): string | undefined => undefined;
export const loadPrices = async (): Promise<void> => undefined;
export const finishTip = async (_t: StoreTip): Promise<void> => undefined;
export const buyApple = async (_tier: TipTierId, _account: string | null): Promise<StoreTip | null> => null;
export const ownedTips = async (_ask = false): Promise<StoreTip[]> => [];
export const watchTips =
  (_on: (t: StoreTip) => void): (() => void) =>
  () =>
    undefined;
