/* The journey: a picture of every main screen, in the order a person meets them, for the editor's pass and the critics
   (docs/craft-checklist.md, "The critic"). Parts that were each built well alone can feel like different apps together;
   this walks them side by side. It reuses the story build (apps/mobile/dist-story), seeds three weeks of a made-up person
   (check-ins every day, a few urges ridden out, one slip five days ago, the first week done), fixes the clock, and opens
   each scene at an iPhone size.

     npm run journey                     build the web app, then every scene, light and dark
     npm run journey -- --no-build       reuse the last build (dist-story, shared with npm run story)
     npm run journey -- --only sos       just the scenes whose name has "sos"
     npm run journey -- --light          light only

   Pictures go to journey-shots/<theme>/NN-name.png (and NN-name-2.png, scrolled, when the page is longer than the screen),
   which git ignores. A scene can tap buttons by their words after it opens. Page errors are printed, and the exit code is
   1 when a scene fails. */
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright-core';

const ZONE = 'America/Chicago';
process.env.TZ = ZONE;

/** the day the person opens the app on: a Thursday, so the week has a past and a future */
const TODAY = '2026-10-29';
/** a scene: where it opens, what is tapped after (by the button's words), and when on TODAY (HH:MM, default 10:00) */
interface Scene {
  name: string;
  path: string;
  tap?: (string | RegExp)[];
  at?: string;
  /** a fresh person with no settings: the welcome and setup */
  fresh?: boolean;
  /** a Sunday, for the Sunday review */
  day?: string;
}
const SCENES: Scene[] = [
  { name: 'welcome', path: '/', fresh: true },
  { name: 'setup', path: '/setup', fresh: true },
  { name: 'setup-2', path: '/setup', fresh: true, tap: [/^Get started/] },
  { name: 'today', path: '/' },
  { name: 'today-night', path: '/', at: '23:15' },
  { name: 'learn', path: '/learn' },
  { name: 'lesson', path: '/', tap: [/^Lesson/] },
  { name: 'lesson-2', path: '/', tap: [/^Lesson/, /^Full/] },
  { name: 'sos', path: '/sos' },
  { name: 'sos-tools', path: '/sos', tap: [/^More/] },
  { name: 'tool-breathe', path: '/tool/breathe' },
  { name: 'tool-pause', path: '/tool/pause' },
  { name: 'tool-ground', path: '/tool/ground' },
  { name: 'already-happened', path: '/log' },
  { name: 'rekindle', path: '/log', tap: [/^I slipped/] },
  /* the morning after the seeded slip (October 24): what it gave, what it cost, on Today (core look-back.ts) */
  { name: 'rekindle-morning', path: '/', day: '2026-10-25', at: '09:30' },
  { name: 'rekindle-morning-2', path: '/', day: '2026-10-25', at: '09:30', tap: [/^Relief$/] },
  { name: 'rode-out', path: '/log', tap: [/^I rode it out/] },
  { name: 'pattern-days', path: '/pattern?pane=days' },
  { name: 'pattern', path: '/pattern?pane=patterns' },
  { name: 'pattern-weeks', path: '/pattern?pane=weeks' },
  { name: 'day', path: '/day/2026-10-24' },
  { name: 'more', path: '/more' },
  { name: 'sunday-review', path: '/review', day: '2026-10-25', at: '11:00' },
  { name: 'whats-new', path: '/whats-new' },
  { name: 'milestones', path: '/miles' },
  { name: 'plan', path: '/plan' },
  { name: 'checkin', path: '/checkin', at: '21:30' },
  { name: 'tip', path: '/tip' },
];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'apps/mobile');
const build = join(app, 'dist-story');
const out = join(root, 'journey-shots');
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;
const themes: ('light' | 'dark')[] = args.includes('--light') ? ['light'] : ['light', 'dark'];

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

/* ---------- the person: three weeks, as the app keeps them in localStorage ---------- */
const addDays = (k: string, n: number) => {
  const d = new Date(k + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const START = addDays(TODAY, -21);
function seed(upTo: string) {
  const s: Record<string, string> = {
    /* What's new was seen for this version, so Today opens on Today */
    'daybook.seenVersion': JSON.parse(readFileSync(join(app, 'app.json'), 'utf8')).expo.version,
    'daybook:settings': JSON.stringify({
      u: 1,
      start: START,
      day1: addDays(START, 7),
      /* on the one-count rule from the start, as every phone is since it first opened (core keepCounts): without it, the app
         stamps the day of the journey, and the slip before it would keep the old rule's held run ("11 days in a row" the
         morning after a slip) */
      countFrom: START,
      wk1: addDays(START, 14),
      becoming: 'I am someone who keeps my word to myself.',
      rollover: 4,
      screensOff: '23:00',
    }),
  };
  const slip = addDays(TODAY, -5);
  const rode = new Set([addDays(TODAY, -12), addDays(TODAY, -8), addDays(TODAY, -3), addDays(TODAY, -1)]);
  let n = 0;
  for (let k = START; k < upTo; k = addDays(k, 1)) {
    const events = [];
    /* a lesson a day, the first fourteen */
    const p = ++n <= 14 ? { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: ['l' + n], lv: [], ov: {} } : null;
    /* looked back at the next morning (look-back.ts), except on the morning after itself, when the question is still to come */
    const look = upTo > addDays(slip, 1) ? { gv: 'relief', cs: 'sleep' } : {};
    if (k === slip)
      events.push({ id: k + '-s', time: '23:10', outcome: 'slipped', trigger: 'Bored', paused: null, did: null, recovered: true, note: '', ...look });
    if (rode.has(k)) events.push({ id: k + '-r', time: '21:40', outcome: 'rode', trigger: 'Stressed', paused: null, did: null, recovered: false, note: '' });
    const mood = 5 + ((k.charCodeAt(9) + k.charCodeAt(8)) % 4);
    s['daybook:days/' + k] = JSON.stringify({
      d: k,
      events,
      checkin: { m: mood, c: mood, e: 6, s: 4, h: 7, so: 'Y', ro: null, n: '', done: true, at: +new Date(`${k}T21:30:00`) },
      p,
      u: 1,
    });
  }
  return s;
}

/* ---------- serve the build ---------- */
if (!args.includes('--no-build') || !existsSync(join(build, 'index.html'))) {
  console.log('Building the web app...');
  rmSync(build, { recursive: true, force: true });
  execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', build], {
    cwd: app,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, EXPO_BASE_URL: '' },
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
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
};
const server = createServer((q, r) => {
  let p = join(build, decodeURIComponent((q.url || '/').split('?')[0]));
  if (!existsSync(p) || statSync(p).isDirectory()) p = existsSync(p + '.html') ? p + '.html' : join(build, 'index.html');
  r.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
  createReadStream(p).pipe(r);
}).listen(0);
const port = (server.address() as { port: number }).port;

/* a plain DOM click: a mouse click from Playwright does not reach a Pressable while the page clock is fixed */
const press = (page: Page, name: string | RegExp) =>
  page
    .getByRole('button', { name })
    .first()
    .evaluate((el) => (el as HTMLElement).click(), null, { timeout: 5000 });

/* closes the celebrations and notes that open by themselves, the way a person would */
async function settle(page: Page) {
  await page.waitForTimeout(1500);
  for (let i = 0; i < 8; i++) {
    const b = page.getByRole('button', { name: /^(Nice|Okay|Got it)$/ });
    if (!(await b.count())) break;
    await press(page, /^(Nice|Okay|Got it)$/).catch(() => {});
    await page.clock.runFor(1000);
    await page.waitForTimeout(400);
  }
  await page.clock.runFor(6000);
  await page.waitForTimeout(600);
}

const browser = await chromium.launch({ executablePath: findChromium() });
let failed = 0;
for (const theme of themes) {
  /* a run of a few scenes keeps the other pictures */
  if (!only) rmSync(join(out, theme), { recursive: true, force: true });
  mkdirSync(join(out, theme), { recursive: true });
  for (const [i, sc] of SCENES.entries()) {
    if (only && !sc.name.includes(only)) continue;
    const day = sc.day || TODAY;
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      timezoneId: ZONE,
      locale: 'en-US',
      reducedMotion: 'reduce',
      colorScheme: theme,
    });
    const page = await ctx.newPage();
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e).split('\n')[0]));
    await page.clock.install({ time: new Date(`${day}T${sc.at || '10:00'}:00`) });
    await page.addInitScript(
      (s: Record<string, string>) => {
        if (sessionStorage.getItem('journey:seeded')) return;
        sessionStorage.setItem('journey:seeded', '1');
        for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
      },
      (sc.fresh ? {} : seed(day)) as Record<string, string>,
    );
    const file = join(out, theme, `${String(i + 1).padStart(2, '0')}-${sc.name}`);
    try {
      await page.goto(`http://localhost:${port}${sc.path}`);
      await page.waitForFunction(() => document.body.innerText.trim().length > 20, null, { timeout: 60_000 });
      await settle(page);
      for (const t of sc.tap || []) {
        await press(page, t);
        await page.clock.runFor(1500);
        await page.waitForTimeout(800);
      }
      await page.screenshot({ path: file + '.png' });
      /* a second picture when the page scrolls */
      const moved = await page.evaluate(() => {
        const el = [...document.querySelectorAll<HTMLElement>('*')].find(
          (e) => e.scrollHeight > e.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(e).overflowY),
        );
        if (!el) return false;
        el.scrollTop = el.clientHeight - 120;
        return true;
      });
      if (moved) {
        await page.waitForTimeout(500);
        await page.screenshot({ path: file + '-2.png' });
      }
      console.log(`  ok   ${theme} ${sc.name}${errs.length ? '  page errors: ' + errs.join('; ') : ''}`);
    } catch (e) {
      failed++;
      console.log(`  FAIL ${theme} ${sc.name}: ${(e as Error).message.split('\n')[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(`\nPictures in journey-shots/.`);
if (failed) process.exit(1);
