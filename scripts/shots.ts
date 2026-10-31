/* Store screenshots, made from the real app (the studio in apps/mobile/src/shots). It builds the web app in screenshot mode
   (EXPO_PUBLIC_SHOTS=1: the demo log, a fixed clock, no network), serves it here, opens /shots for every scene in shots.json
   at each of its sizes, waits until fonts and pictures are in, and saves store-assets/<size>/NN-name.png at the exact size.
     npm run shots                     build, then every scene
     npm run shots -- --no-build       reuse the last build
     npm run shots -- --only today     just the scenes whose name has "today"
     npm run shots -- --size ios69     just one size
   The iPhone sizes show pictures from the simulator (npm run shots:ios, store-assets/ios-screens), since Apple's glass tab bar exists only there.
   Android and the web draw their own bar, so the Play sizes still run the app live. */
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

import { DEMO, SIZES } from '../apps/mobile/src/shots/config.ts';
import { screenFile } from './ios-screens.ts';

interface Scene {
  name: string;
  sizes: string[];
  screen?: string;
  screen2?: string;
  screen3?: string;
  caption?: string;
  sub?: string;
  bg?: string;
  theme?: 'light' | 'dark';
  at?: string;
  scroll?: number;
  zoom?: number;
  top?: number;
  playTop?: number;
  pills?: string;
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'apps/mobile');
const build = join(app, 'dist-shots');
const out = join(root, 'store-assets');
const args = process.argv.slice(2);
const flag = (k: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const scenes: Scene[] = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8')).scenes;

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

/* the PNG's own width and height, to check each file is exactly the size the store asks for */
function pngSize(file: string) {
  const b = readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

if (!args.includes('--no-build') || !existsSync(join(build, 'index.html'))) {
  console.log('Building the app in screenshot mode...');
  rmSync(build, { recursive: true, force: true });
  execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', build], {
    cwd: app,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, EXPO_PUBLIC_SHOTS: '1', EXPO_BASE_URL: '' },
  });
}

const TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.html': 'text/html',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
};
const server = createServer((q, r) => {
  const path = decodeURIComponent((q.url || '/').split('?')[0]);
  let p = path.startsWith('/ios-screens/') ? join(out, path) : join(build, path);
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(build, 'index.html');
  r.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
  createReadStream(p).pipe(r);
}).listen(0);
const port = (server.address() as { port: number }).port;

const browser = await chromium.launch({ executablePath: findChromium() });
let made = 0;
let failed = 0;
const count: Record<string, number> = {};
for (const sc of scenes) {
  for (const key of sc.sizes) {
    const size = SIZES[key];
    if (!size) throw new Error(`shots.json: ${sc.name} asks for an unknown size "${key}"`);
    count[key] = (count[key] || 0) + 1;
    if (flag('--only') && !sc.name.includes(flag('--only')!)) continue;
    if (flag('--size') && flag('--size') !== key) continue;
    const ctx = await browser.newContext({
      viewport: { width: size.w / size.scale, height: size.h / size.scale },
      deviceScaleFactor: size.scale,
      timezoneId: DEMO.zone,
      locale: 'en-US',
      reducedMotion: 'reduce',
      colorScheme: sc.theme === 'dark' ? 'dark' : 'light',
    });
    const page = await ctx.newPage();
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    const q = new URLSearchParams({ size: key });
    for (const k of ['screen', 'screen2', 'screen3', 'caption', 'sub', 'bg', 'theme', 'at', 'scroll', 'zoom', 'top', 'playTop', 'pills'] as const)
      if (sc[k] != null) q.set(k, String(sc[k]));
    if (size.device === 'iphone' || key.startsWith('ios-'))
      (['screen', 'screen2', 'screen3'] as const).forEach((k, i) => {
        if (!sc[k]) return;
        const f = screenFile(sc[k]!, sc.theme);
        if (!existsSync(join(out, 'ios-screens', f))) throw new Error(`${sc.name}: no picture for ${sc[k]}. Run npm run shots:ios first.`);
        q.set('pic' + (i ? i + 1 : ''), '/ios-screens/' + f);
      });
    const file = join(out, key, `${String(count[key]).padStart(2, '0')}-${sc.name}.png`);
    try {
      await page.goto(`http://localhost:${port}/shots?${q}`);
      await page.waitForFunction(() => (window as unknown as { __shotsReady?: boolean }).__shotsReady === true, null, { timeout: 90_000 });
      await page.evaluate(() => document.fonts.ready);
      mkdirSync(dirname(file), { recursive: true });
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: size.w / size.scale, height: size.h / size.scale } });
      const got = pngSize(file);
      if (got.w !== size.w || got.h !== size.h) throw new Error(`came out ${got.w} x ${got.h}, not ${size.w} x ${size.h}`);
      made++;
      console.log(`  ${key.padEnd(12)} ${file.slice(root.length + 1)}${errs.length ? '  (page errors: ' + errs.slice(0, 2).join('; ') + ')' : ''}`);
    } catch (e) {
      failed++;
      console.error(`  ${key.padEnd(12)} ${sc.name}: ${(e as Error).message}`);
    }
    await ctx.close();
  }
}
/* the small copies on the About page (public/shots), from the 6.9-inch shots: same names and size, so the page and its links stay as they are */
const WEB: Record<string, string> = {
  '01-today': '01-today',
  '02-sos': '02-sos',
  '04-grow': '03-grow',
  '05-pattern': '04-pattern',
  '06-learn': '05-learn',
  '07-private': '06-private',
};
const webPage = await browser.newPage();
for (const [from, to] of Object.entries(WEB)) {
  const src = join(out, 'ios69', from + '.png');
  if (!existsSync(src)) continue;
  const url = await webPage.evaluate(async (data) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + data;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1300;
    canvas.getContext('2d')!.drawImage(img, 0, 0, 600, 1300);
    return canvas.toDataURL('image/webp', 0.8);
  }, readFileSync(src).toString('base64'));
  writeFileSync(join(app, 'public/shots', to + '.webp'), Buffer.from(url.split(',')[1], 'base64'));
}
await browser.close();
server.close();
console.log(`${made} made${failed ? `, ${failed} failed` : ''}. In store-assets/.`);
if (failed) process.exit(1);
