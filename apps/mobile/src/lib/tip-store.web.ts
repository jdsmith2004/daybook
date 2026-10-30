/* Apple's in-app purchase on the web: there is none. tip-store.ts has the phone's. */
import type { PatKind, TipTierId } from '@daybook/core';

export const iapAvailable = false;
export interface StoreTip {
  tier: TipTierId;
  jws: string;
  otid: string;
  since: number;
  purchase: unknown;
}
export interface StorePat {
  kind: PatKind;
  jws: string;
  otid: string;
  since: number;
  until: number | null;
  purchase: unknown;
}
export const storePatPrice = (_kind: PatKind): string | undefined => undefined;
export const buyApplePat = async (_kind: PatKind, _account: string | null): Promise<StorePat | null> => null;
export const manageApple = async (): Promise<void> => undefined;
export const storePrice = (_tier: TipTierId): string | undefined => undefined;
export const loadPrices = async (): Promise<void> => undefined;
export const usStorefront = (): boolean => false;
export const appleTipError = (): string => '';
export const appleTipQuiet = (): 'cancelled' | 'waiting' | null => null;
export const ownedTipsFailed = (): boolean => false;
export const finishTip = async (_t: { purchase: unknown }): Promise<void> => undefined;
export const buyApple = async (_tier: TipTierId, _account: string | null): Promise<StoreTip | null> => null;
export const ownedTips = async (_ask = false): Promise<{ tips: StoreTip[]; pats: StorePat[] }> => ({ tips: [], pats: [] });
export const watchTips =
  (_on: (t: StoreTip) => void, _onPat: (t: StorePat) => void): (() => void) =>
  () =>
    undefined;
