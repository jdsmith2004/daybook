#!/usr/bin/env node
/*
 * Makes the app icons from the flame spirit itself (level 9, the campfire), so the icon is the same art as the app.
 * Draws the SVG in Chromium and saves PNGs into apps/mobile/assets/images:
 *   icon.png                     1024, full bleed (iOS rounds the corners itself)
 *   android-icon-foreground.png  1024, the flame badge inside Android's safe zone, transparent around it
 *   android-icon-background.png  1024, the night color
 *   splash-icon.png              1024, the flame badge on transparent
 *   favicon.png                  48, the flame badge for the browser tab
 * Run it again after the emblem changes:  npm run icons
 */
import { chromium } from 'playwright-core';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Em } from '../packages/core/src/legacy/core.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'apps/mobile/assets/images');
const LEVEL = 9;
const NIGHT = '#1B1550';

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (!existsSync(base)) return undefined;
  const dir = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
  for (const p of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
    if (dir && existsSync(join(base, dir, p))) return join(base, dir, p);
  }
  return undefined;
}

/* the badge: the emblem as the app draws it, with its round frame */
const badge = (size) => Em.emblem(LEVEL, { still: true, size }).replace(/ class="[^"]*"/g, '');
/* full bleed: the same scene with no round clip and no frame, so the sky fills the square */
const bleed = (size) =>
  badge(size)
    .replace(/<g clip-path="url\(#[^)]+\)">/, '<g>')
    .replace(/<circle cx="60" cy="60" r="57\.2"[^>]*\/><circle cx="60" cy="60" r="58\.6"[^>]*\/>/, '');

const jobs = [
  { file: 'icon.png', size: 1024, html: (s) => bleed(s), bg: NIGHT },
  { file: 'android-icon-foreground.png', size: 1024, html: () => `<div style="width:1024px;height:1024px;display:grid;place-items:center">${badge(600)}</div>`, bg: 'transparent' },
  { file: 'android-icon-background.png', size: 1024, html: () => '', bg: NIGHT },
  { file: 'splash-icon.png', size: 1024, html: (s) => badge(s), bg: 'transparent' },
  { file: 'favicon.png', size: 48, html: (s) => badge(s), bg: 'transparent' },
];

const browser = await chromium.launch({ executablePath: findChromium() });
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.size, height: j.size } });
  await page.setContent(`<html><body style="margin:0;width:${j.size}px;height:${j.size}px;overflow:hidden;background:${j.bg}">${j.html(j.size)}</body></html>`);
  await page.screenshot({ path: join(out, j.file), omitBackground: j.bg === 'transparent' });
  await page.close();
  console.log('wrote', j.file);
}
await browser.close();
