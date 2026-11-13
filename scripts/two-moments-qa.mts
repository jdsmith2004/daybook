/* A whole day of the two moments (WP5), walked through the web build with the clock fixed, a picture at each step: the morning
   (a good night, a night that was told, a slip already logged), Today by day, Good night, and Today after the night hour.
     npx tsx scripts/two-moments-qa.ts <dist folder> <out folder>
   Pictures only; it checks nothing by itself. */
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { chromium, type Page } from 'playwright-core';

const [dist, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const version: string = JSON.parse(readFileSync(join(import.meta.dirname, '../apps/mobile/app.json'), 'utf8')).expo.version;
const TYPES: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.json': 'application/json' };
const server = createServer((q, r) => {
  let p = join(dist, decodeURIComponent((q.url || '/').split('?')[0]));
  if (!existsSync(p) || statSync(p).isDirectory()) p = existsSync(p + '.html') ? p + '.html' : join(dist, 'index.html');
  r.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
  createReadStream(p).pipe(r);
}).listen(0);
const port = (server.address() as { port: number }).port;
const base = process.env.PLAYWRIGHT_BROWSERS_PATH || join(process.env.HOME!, 'Library/Caches/ms-playwright');
const dir = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop()!;
const exe = ['chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']
  .map((p) => join(base, dir, p))
  .find(existsSync);
const browser = await chromium.launch({ executablePath: exe });

const addDays = (k: string, n: number) => {
  const d = new Date(k + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const TODAY = '2026-11-12';
type Seed = Record<string, string>;
function person(o: { slipLastNight?: string; faith?: string; safe?: string } = {}): Seed {
  const s: Seed = {
    'daybook:settings': JSON.stringify({
      u: 1,
      start: '2026-10-20',
      day1: '2026-10-27',
      becoming: 'I am someone who keeps my word to myself.',
      rollover: 4,
      screensOff: '23:00',
      nightAt: '22:30',
      safePerson: o.safe || '',
      onb: o.faith ? { n: 1, at: 1, a: { faith: o.faith, creed: 'lds' }, hist: [] } : null,
      routine: { lesson: true, calm: true, reach: false, checkin: false, wind: true, journal: false },
      dayFeel: false,
    }),
    'daybook.seenVersion': version,
  };
  for (let k = '2026-10-20'; k < TODAY; k = addDays(k, 1)) {
    const events =
      k === addDays(TODAY, -1) && o.slipLastNight
        ? [{ id: 'q1', time: o.slipLastNight, outcome: 'slipped', trigger: null, paused: null, did: null, recovered: false, note: '' }]
        : [];
    s['daybook:days/' + k] = JSON.stringify({ d: k, events, checkin: null, p: { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: '22:40', ls: [], lv: [], ov: {}, o: 1 }, u: 1 });
  }
  return s;
}
const at = (k: string, hm: string) => new Date(`${+hm.slice(0, 2) < 4 ? addDays(k, 1) : k}T${hm}:00`);
async function settle(page: Page, ms = 2500) {
  await page.clock.runFor(ms);
  await page.waitForTimeout(600);
}
async function tap(page: Page, words: string) {
  const b = page.getByRole('button', { name: words }).or(page.getByRole('radio', { name: words })).or(page.getByRole('link', { name: words }));
  await b.first().evaluate((el) => (el as HTMLElement).click(), null, { timeout: 5000 });
  await settle(page, 1500);
}
async function shot(page: Page, name: string) {
  await page.screenshot({ path: join(out, name + '.png') });
  console.log('shot', name);
}

async function walk(name: string, seed: Seed, steps: (page: Page) => Promise<void>, w = 390, h = 844) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, timezoneId: 'America/Chicago', locale: 'en-US', reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log(name, 'PAGE ERROR', String(e).split('\n')[0]));
  await page.clock.install({ time: at(TODAY, '07:45') });
  await page.addInitScript((sd: Seed) => {
    if (sessionStorage.getItem('qa:seeded')) return;
    sessionStorage.setItem('qa:seeded', '1');
    for (const [k, v] of Object.entries(sd)) localStorage.setItem(k, v);
  }, seed);
  try {
    await steps(page);
  } catch (e) {
    console.log(name, 'FAILED', (e as Error).message.split('\n')[0]);
    await shot(page, name + '-failed');
  }
  await ctx.close();
}
async function openAt(page: Page, hm: string, path = '/') {
  await page.clock.setSystemTime(at(TODAY, hm));
  await page.goto(`http://localhost:${port}${path}`);
  await settle(page, 3000);
}

/* a good day: the morning, Free of it, Set tonight; Today at noon; Today at 10:45 PM; Good night; Today after */
await walk(
  'good',
  person({ safe: 'Dana' }),
  async (page) => {
    await openAt(page, '07:45');
    await shot(page, 'good-1-morning');
    await tap(page, 'Free of it');
    await shot(page, 'good-2-told');
    await tap(page, 'Set tonight');
    await shot(page, 'good-3-after-set');
    await openAt(page, '13:00');
    await shot(page, 'good-4-today-noon');
    await page.mouse.wheel(0, 700);
    await settle(page, 800);
    await shot(page, 'good-4b-today-noon-scrolled');
    await openAt(page, '18:30');
    await shot(page, 'good-5-today-dusk');
    await openAt(page, '22:45');
    await shot(page, 'good-6-today-night');
    await tap(page, 'Start: Phone to bed');
    await shot(page, 'good-7-goodnight');
    await tap(page, 'Good night');
    await settle(page, 4000);
    await shot(page, 'good-8-asleep');
    await openAt(page, '23:30');
    await shot(page, 'good-9-today-after-bed');
  },
);
/* a bad day: It happened, and the quiet way to Rekindle */
await walk('bad', person(), async (page) => {
  await openAt(page, '08:10');
  await tap(page, 'It happened');
  await shot(page, 'bad-1-it-happened');
  await openAt(page, '22:50');
  await shot(page, 'bad-2-today-night');
});
/* a slip logged that night: the morning does not ask again; with faith on */
await walk('logged', person({ slipLastNight: '23:10', faith: 'some' }), async (page) => {
  await openAt(page, '08:00');
  await shot(page, 'logged-1-morning');
  await openAt(page, '22:40', '/night');
  await shot(page, 'logged-2-goodnight-faith');
});
/* a narrow phone */
await walk(
  'narrow',
  person(),
  async (page) => {
    await openAt(page, '07:50');
    await shot(page, 'narrow-1-morning');
    await tap(page, 'Free of it');
    await shot(page, 'narrow-2-told');
  },
  320,
  640,
);
await browser.close();
server.close();
