/* Screenshot mode on the iPhone (dev only: loaded by boot.ts when EXPO_PUBLIC_SHOTS=1; scripts/shots-ios.ts builds and drives it). The App Store
   shows the iPhone app, and Apple's glass tab bar exists only there, so these pictures come from a simulator. The app runs as usual, but on the
   demo log and nothing else: every launch writes the demo person over the simulator app's storage, and the clock starts at DEMO.at. The look
   follows the simulator's own setting. The web studio (mode.ts) still draws the Android pictures. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logicalKey, notifyMemNew, notifyQuiet } from '@daybook/core';
import { router } from 'expo-router';
import { AccessibilityInfo, Settings } from 'react-native';

import { DEMO } from './config';
import { demoStorage } from './demo';

const RealDate = Date;
const at = new RealDate(DEMO.at).getTime();
const t0 = RealDate.now();
const nowMs = () => at + RealDate.now() - t0;
function DemoDate(this: unknown, ...a: unknown[]) {
  if (!new.target) return new RealDate(nowMs()).toString();
  return a.length ? new (RealDate as unknown as new (...x: unknown[]) => Date)(...a) : new RealDate(nowMs());
}
DemoDate.prototype = RealDate.prototype;
DemoDate.now = nowMs;
DemoDate.UTC = RealDate.UTC;
DemoDate.parse = RealDate.parse;
globalThis.Date = DemoDate as unknown as DateConstructor;

/* the strip asking for reminders is hidden for the day: the pictures show the day itself. Storage does its work in order, so this is in place
   before any screen reads it. */
const store = demoStorage(at, 'auto');
store['daybook.notify'] = JSON.stringify(notifyQuiet(notifyMemNew(), logicalKey(at, 4)));
AsyncStorage.clear().catch(() => undefined);
AsyncStorage.multiSet(Object.entries(store)).catch(() => undefined);

AccessibilityInfo.isReduceMotionEnabled = () => Promise.resolve(true);

/* the screen to show, from the launch's arguments (an address opened from outside would ask "Open in Daybook?" over the picture) */
const screen = Settings.get('shotsScreen');
if (typeof screen === 'string' && screen !== '/') setTimeout(() => router.push(screen as never), 2500);
