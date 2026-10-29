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
 * and into apps/mobile/public, for the web app on a Home Screen: apple-touch-icon.png (180), icon-192.png, icon-512.png
 * Run it again after the flame changes:  npm run icons  (Node runs the TypeScript file directly)
 *
 * The icon in a look, for a time of year (core flame-art.ts IconLook; the calendar is in docs/icon-calendar.md), the way
 * Duolingo dresses its owl: the look ships as the app's own icon in an App Store update, and the next update puts the
 * plain flame back. Only the icon changes (icon.png, Android's foreground and the web app's icons); the splash, the
 * favicon and the note icons stay the flame as it is.
 *   npm run icons -- --auto                the icon for an update built today (core iconLookFor: the calendar, a few
 *                                          days ahead for review); run before every App Store build
 *   npm run icons -- --look halloween      the icon in a look, by hand
 *   npm run icons                          the plain flame again
 */
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICON_LOOKS, iconLookFor, flameIconSvg, flameLookSvg, flameMaskSvg, flameSvg } from '../packages/core/src/flame-art.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'apps/mobile/assets/images');
const pub = join(root, 'apps/mobile/public');
const LEVEL = 13;
const NIGHT = '#1B1550';
const at = process.argv.indexOf('--look');
const today = new Date().toLocaleDateString('en-CA');
const LOOK = process.argv.includes('--auto') ? iconLookFor(today) : at > 0 ? process.argv[at + 1] : null;
if (process.argv.includes('--auto')) console.log('Icon for an update built ' + today + ': ' + (LOOK || 'the plain flame'));
if (LOOK && !ICON_LOOKS.includes(LOOK)) {
  console.error('No look called ' + LOOK + '. The looks: ' + ICON_LOOKS.join(', '));
  process.exit(1);
}

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
const bleed = (size) => sized(LOOK ? flameLookSvg(LOOK) : flameIconSvg(), size);
/* Android's foreground in a look: the look's square, round, inside the safe zone (Android draws the night color behind) */
const androidFg = () =>
  LOOK
    ? `<div style="width:1024px;height:1024px;display:grid;place-items:center"><div style="width:600px;height:600px;border-radius:50%;overflow:hidden">${bleed(600)}</div></div>`
    : `<div style="width:1024px;height:1024px;display:grid;place-items:center">${badge(600)}</div>`;

const jobs = [
  { file: 'icon.png', size: 1024, html: (s) => bleed(s), bg: NIGHT },
  {
    file: 'android-icon-foreground.png',
    size: 1024,
    html: androidFg,
    bg: 'transparent',
  },
  { file: 'android-icon-background.png', size: 1024, html: () => '', bg: NIGHT },
  { file: 'splash-icon.png', size: 1024, html: (s) => badge(s), bg: 'transparent' },
  { file: 'favicon.png', size: 48, html: (s) => badge(s), bg: 'transparent' },
  /* the web app on a Home Screen (public/manifest.json and the apple-touch-icon in public/index.html), like icon.png */
  { file: 'apple-touch-icon.png', size: 180, html: (s) => bleed(s), bg: NIGHT, dir: pub },
  { file: 'icon-192.png', size: 192, html: (s) => bleed(s), bg: NIGHT, dir: pub },
  { file: 'icon-512.png', size: 512, html: (s) => bleed(s), bg: NIGHT, dir: pub },
  { file: 'notification-icon.png', size: 96, html: (s) => sized(flameMaskSvg(), s), bg: 'transparent' },
  { file: 'notification-large.png', size: 256, html: (s) => badge(s), bg: 'transparent' },
];

const browser = await chromium.launch({ executablePath: findChromium() });
/* in a look, only the icon itself changes */
const ICON_ONLY = ['icon.png', 'android-icon-foreground.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];
for (const j of LOOK ? jobs.filter((x) => ICON_ONLY.includes(x.file)) : jobs) {
  const page = await browser.newPage({ viewport: { width: j.size, height: j.size } });
  await page.setContent(`<html><body style="margin:0;width:${j.size}px;height:${j.size}px;overflow:hidden;background:${j.bg}">${j.html(j.size)}</body></html>`);
  mkdirSync(j.dir || out, { recursive: true });
  await page.screenshot({ path: join(j.dir || out, j.file), omitBackground: j.bg === 'transparent' });
  await page.close();
  console.log('wrote', j.file);
}
await browser.close();
