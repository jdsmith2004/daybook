/* Screenshot mode (dev only: loaded by boot.ts when EXPO_PUBLIC_SHOTS=1, before anything reads storage). The app runs as
   usual, but on the demo log and nothing else:
   - storage is a fresh copy in memory, filled with the demo person (demo.ts); the browser's real storage is never read or
     written, so no one's log can show up in a shot;
   - the clock starts at the same moment every time (DEMO.at, or the page's ?at=), so the output is the same each run;
   - nothing leaves the page: any request to another site fails, so sync and the account never reach a server;
   - motion is reduced, so every shot is taken with things already settled; a page opened with ?motion=1 keeps full motion,
     for a recording that shows the app moving (the breathing sun, the entrances). */
import { AccessibilityInfo } from 'react-native';

import { DEMO } from './config';
import { demoStorage } from './demo';

class Mem {
  private m: Map<string, string>;
  constructor(init: Record<string, string>) {
    this.m = new Map(Object.entries(init));
  }
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}

if (typeof window !== 'undefined') {
  const q = new URLSearchParams(window.location.search);
  const theme = q.get('theme') === 'dark' ? 'dark' : 'light';
  const RealDate = Date;
  /* only a date sets the clock: ?at= is also a screen's own word (a lesson's ?at=practiced or ?at=all), and a clock
     that is not a number froze the page */
  const asked = new RealDate(q.get('at') || '').getTime();
  const at = Number.isFinite(asked) ? asked : new RealDate(DEMO.at).getTime();
  Object.defineProperty(window, 'localStorage', { value: new Mem(demoStorage(at, theme)), configurable: true });
  Object.defineProperty(window, 'sessionStorage', { value: new Mem({}), configurable: true });

  /* the clock: the demo moment, moving on from there as the page runs (so animations and timers still work) */
  const t0 = performance.now();
  const nowMs = () => Math.round(at + performance.now() - t0);
  class DemoDate extends RealDate {
    constructor(...a: unknown[]) {
      if (a.length) super(...(a as [string]));
      else super(nowMs());
    }
    static now() {
      return nowMs();
    }
  }
  globalThis.Date = DemoDate as unknown as DateConstructor;

  /* no network beyond this page's own files */
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (new URL(href, window.location.href).origin !== window.location.origin) return Promise.reject(new TypeError('Screenshot mode: no network'));
    return realFetch(input, init);
  };

  if (q.get('motion') !== '1') AccessibilityInfo.isReduceMotionEnabled = () => Promise.resolve(true);
}
