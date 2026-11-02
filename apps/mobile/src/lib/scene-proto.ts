/* PROTOTYPE (mockups only, not for merge): Today's flame scene as the real day. ?scene=1 on the web turns it on; &lay=2 puts the
   care buttons on the scene's ground and lets the scene fill the screen. */
import { protoSky } from '@daybook/core';

const q = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : null;
export const SCENE = q?.get('scene') === '1';
export const LAY2 = SCENE && q?.get('lay') === '2';
if (SCENE) {
  protoSky.clear = true;
  const h = new Date().getHours();
  /* day hills: green in the morning and the day, the evening's own colors after */
  if (h >= 5 && h < 17) protoSky.land = ['#8CC47E', '#5E9E62', '#3F7A4C'];
}

export type DaySky = { sky: [string, string, string]; at: [number, number, number]; stars: boolean; night: boolean };
/** the sky for this hour, top to bottom: morning, day, the evening coming, night */
export function skyAt(hour: number): DaySky {
  if (hour >= 5 && hour < 10) return { sky: ['#5C8FDB', '#F3B79C', '#FFE1B0'], at: [0, 0.62, 1], stars: false, night: false };
  if (hour >= 10 && hour < 17) return { sky: ['#3F7FD6', '#79B2EE', '#CFE6FF'], at: [0, 0.6, 1], stars: false, night: false };
  if (hour >= 17 && hour < 20) return { sky: ['#232A6E', '#7A4590', '#F0906C'], at: [0, 0.55, 1], stars: true, night: false };
  return { sky: ['#0C0F33', '#1E1B5E', '#3A2A78'], at: [0, 0.6, 1], stars: true, night: true };
}
