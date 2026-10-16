/* The sound guide in a browser: the legacy tone() and chime(), with Web Audio. */
import { getSoundPref } from './prefs';

export type SoundName = 'in' | 'in2' | 'out' | 'on' | 'chime';
let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!A) return null;
      ctx = new A();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
    return ctx;
  } catch {
    return null;
  }
}
function tone(f: number, dur: number, vol: number) {
  const c = audio();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime;
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch {
    /* never let sound break a hard moment */
  }
}
export function play(name: SoundName, force = false) {
  if (!force && !getSoundPref()) return;
  if (name === 'in') tone(392, 0.7, 0.07);
  else if (name === 'in2') tone(494, 0.7, 0.07);
  else if (name === 'out') tone(262, 1.3, 0.07);
  else if (name === 'on') tone(392, 0.35, 0.05);
  else {
    tone(523, 1.4, 0.08);
    setTimeout(() => tone(659, 1.6, 0.07), 180);
  }
}
