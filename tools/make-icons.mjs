#!/usr/bin/env node
/*
 * Makes the app icons from the flame spirit itself (packages/core flame-art.ts), so the icon is the same art as the app:
 * the full flame on its night sky for the icon, and the campfire's flame in its round frame for the rest.
 * Draws the SVG in Chromium and saves PNGs into apps/mobile/assets/images:
 *   icon.png                     1024, full bleed (iOS rounds the corners itself)
 *   android-icon-foreground.png  1024, the flame badge inside Android's safe zone, transparent around it
 *   android-icon-background.png  1024, the night color
 *   splash-icon.png              1024, the flame badge on transparent
 *   favicon.png                  48, the flame badge for the browser tab
 *   notification-icon.png        96, the flame's outline in white on clear (Android's small note icon)
 *   notification-large.png       256, the flame badge on transparent (Android's large note icon)
 * and the pictures in a note (iPhone) into apps/mobile/assets/notify, 512 each:
 *   flame-bright.png, flame-warm.png, flame-steady.png, flame-ember.png, flame-asleep.png
 * Run it again after the flame changes:  npm run icons  (Node runs the TypeScript file directly)
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { flameIconSvg, flameMaskSvg, flameNoteSvg, flameSvg } from '../packages/core/src/flame-art.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'apps/mobile/assets/images');
const notify = join(root, 'apps/mobile/assets/notify');
const LEVEL = 13;
const NIGHT = '#1B1550';

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(base)) return undefined;
  const dir = readdirSync(base)
    .filter((d) => /^chromium-\d+$/.test(d))
    .sort()
    .pop();
  for (const p of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
    if (dir && existsSync(join(base, dir, p))) return join(base, dir, p);
  }
  return undefined;
}

/* the badge: the emblem as the app draws it, with its round frame */
const badge = (size) => flameSvg(LEVEL, { still: true, size }).replace(/ class="[^"]*"/g, '');
/* full bleed: the flame alone on its night sky, filling the square */
const sized = (svg, size) => svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
const bleed = (size) => sized(flameIconSvg(), size);

const jobs = [
  { file: 'icon.png', size: 1024, html: (s) => bleed(s), bg: NIGHT },
  {
    file: 'android-icon-foreground.png',
    size: 1024,
    html: () => `<div style="width:1024px;height:1024px;display:grid;place-items:center">${badge(600)}</div>`,
    bg: 'transparent',
  },
  { file: 'android-icon-background.png', size: 1024, html: () => '', bg: NIGHT },
  { file: 'splash-icon.png', size: 1024, html: (s) => badge(s), bg: 'transparent' },
  { file: 'favicon.png', size: 48, html: (s) => badge(s), bg: 'transparent' },
  { file: 'notification-icon.png', size: 96, html: (s) => sized(flameMaskSvg(), s), bg: 'transparent' },
  { file: 'notification-large.png', size: 256, html: (s) => badge(s), bg: 'transparent' },
  ...['bright', 'warm', 'steady', 'ember', 'asleep'].map((m) => ({
    file: `flame-${m}.png`,
    dir: notify,
    size: 512,
    html: (s) => sized(flameNoteSvg(m), s),
    bg: NIGHT,
  })),
];

const browser = await chromium.launch({ executablePath: findChromium() });
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.size, height: j.size } });
  await page.setContent(`<html><body style="margin:0;width:${j.size}px;height:${j.size}px;overflow:hidden;background:${j.bg}">${j.html(j.size)}</body></html>`);
  mkdirSync(j.dir || out, { recursive: true });
  await page.screenshot({ path: join(j.dir || out, j.file), omitBackground: j.bg === 'transparent' });
  await page.close();
  console.log('wrote', j.file);
}
await browser.close();
