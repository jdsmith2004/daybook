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
  /* What is new counts as seen (a version past any real one), so no update page opens over the screen being shown */
  const demo = demoStorage(at, theme);
  /* ?faith=lds (or christian, or plain): the demo person said faith plays a big part, in that voice, so It is written shows in SOS */
  const faith = q.get('faith');
  if (faith === 'lds' || faith === 'christian' || faith === 'plain') {
    const st = JSON.parse(demo['daybook:settings'] || '{}');
    st.onb = { ...(st.onb || {}), a: { ...((st.onb && st.onb.a) || {}), faith: 'big', creed: faith === 'plain' ? 'other' : faith } };
    demo['daybook:settings'] = JSON.stringify(st);
  }
  /* ?demo=update last saw What's new at 1.3.4, so the update's page opens as it will for people updating */
  /* ?seen=1.3.5 instead: What's new was already seen on an earlier open, to walk what comes on the next one */
  const seenQ = q.get('seen');
  const seen = seenQ && /^\d+\.\d+\.\d+$/.test(seenQ) ? seenQ : q.get('demo') === 'update' ? '1.3.4' : '99.0.0';
  Object.defineProperty(window, 'localStorage', { value: new Mem({ ...demo, 'daybook.seenVersion': seen }), configurable: true });
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

  /* no network beyond this page's own files. On the live site the demo (/demo/) shares its address with the real app, and the sync
     API, the pulse and the events sit at that same address (infra/app/web.tf), so a request there is refused too, and so is anything
     that is not a plain read: the demo can never sign in, sync, count or send an event, even from the live site */
  const API = /^\/(sync|pulse|events)(\/|$)/;
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const href = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const url = new URL(href, window.location.href);
    const method = (init?.method || (typeof input === 'object' && 'method' in input ? input.method : 'GET')).toUpperCase();
    if (url.origin !== window.location.origin || API.test(url.pathname) || (method !== 'GET' && method !== 'HEAD'))
      return Promise.reject(new TypeError('Screenshot mode: no network'));
    return realFetch(input, init);
  };
  /* and the other ways a page can send: none of them is used by the app, so they are shut rather than checked */
  if (navigator.sendBeacon) navigator.sendBeacon = () => false;
  const RealXHR = window.XMLHttpRequest;
  if (RealXHR)
    window.XMLHttpRequest = class extends RealXHR {
      open(method: string, url: string | URL, ...rest: unknown[]) {
        const u = new URL(String(url), window.location.href);
        if (u.origin !== window.location.origin || API.test(u.pathname) || !/^(GET|HEAD)$/i.test(method)) throw new TypeError('Screenshot mode: no network');
        return (super.open as (...a: unknown[]) => void)(method, url, ...rest);
      }
    } as typeof XMLHttpRequest;

  /* the preview (npm run preview, EXPO_PUBLIC_PREVIEW=1) is for seeing the app as a person does, so it keeps full motion unless ?motion=0 */
  const motion = process.env.EXPO_PUBLIC_PREVIEW === '1' ? q.get('motion') !== '0' : q.get('motion') === '1';
  if (!motion) AccessibilityInfo.isReduceMotionEnabled = () => Promise.resolve(true);
}
