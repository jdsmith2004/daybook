#!/usr/bin/env node
/*
 * The sound guide's tones, as small WAV files for iOS and Android (the web plays them with Web Audio instead).
 * Each is the legacy tone(): a sine wave that rises in 50 ms and fades out exponentially. The chime is two tones, the second
 * 180 ms later, as in the legacy chime().  Run:  node tools/make-sounds.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '../apps/mobile/assets/sounds');
const RATE = 22050;
/* [frequency, seconds, volume, start] — the same numbers as the legacy tone() calls */
const SOUNDS = {
  in: [[392, 0.7, 0.07, 0]],
  in2: [[494, 0.7, 0.07, 0]],
  out: [[262, 1.3, 0.07, 0]],
  on: [[392, 0.35, 0.05, 0]],
  chime: [
    [523, 1.4, 0.08, 0],
    [659, 1.6, 0.07, 0.18],
  ],
};
/* the legacy gain was for a browser at full volume; a file plays at the phone's media volume, so it is raised to a gentle level */
const LIFT = 4;
const env = (t, dur, vol) => {
  if (t < 0 || t > dur) return 0;
  const lo = 0.0001;
  if (t < 0.05) return lo * Math.pow(vol / lo, t / 0.05);
  return vol * Math.pow(lo / vol, (t - 0.05) / (dur - 0.05));
};
for (const [name, tones] of Object.entries(SOUNDS)) {
  const len = Math.max(...tones.map(([, d, , s]) => s + d)) + 0.05;
  const n = Math.round(len * RATE);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    let v = 0;
    for (const [f, d, vol, s] of tones) v += Math.sin(2 * Math.PI * f * (t - s)) * env(t - s, d, vol);
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * LIFT * 32767))), 44 + i * 2);
  }
  writeFileSync(join(out, name + '.wav'), buf);
}
console.log('sounds:', Object.keys(SOUNDS).join(', '));
