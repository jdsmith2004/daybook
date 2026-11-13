/* The iOS side of the night pack (ios/NightPackModule.swift; core night-pack.ts). Null on the web, on Android, and on an
   installed app from before this module, so the pack simply does not appear there. */
import { requireOptionalNativeModule } from 'expo';

export interface NightPackModule {
  /** whether this iPhone can run the actions (iOS 26 and later) */
  ok: boolean;
  setNight(at: number): void;
  openUntil(until: number): void;
  seen(): Partial<Record<'wait' | 'bed' | 'wake', number>>;
  take(): string | null;
}

export const NightPack = requireOptionalNativeModule<NightPackModule>('NightPack');
