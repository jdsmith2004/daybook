/* Walk it through with nothing typed: a story test of the care flow, walked through the real web app on the smallest phone
   (320 wide), light and dark. It opens SOS's More sheet (the four choices, then Every tool) and takes a picture of each,
   then walks Walk it through from the first page to the end touching only what has to be touched (the two numbers, and the
   place on the trail) and pressing Next everywhere else: no box typed in, no choice picked. It passes when the walk ends on
   the one page every ridden-out urge gets (RodeOut), an urge ridden out is in the log, and no page threw an error.

     npm run story:walk                 build the web app, then the story
     npm run story:walk -- --no-build   reuse the last build (the same one npm run story makes)

   Pictures go to story-shots/walk/<theme>/, which git ignores. The exit code is 1 when anything fails. */
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright-core';

const ZONE = 'America/Chicago';
process.env.TZ = ZONE;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'apps/mobile');
const version: string = JSON.parse(readFileSync(join(app, 'app.json'), 'utf8')).expo.version;
const build = join(app, 'dist-story');
const out = join(root, 'story-shots', 'walk');
const args = process.argv.slice(2);

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

/* ---------- a person a week in, at 10 PM on a Wednesday ---------- */
const NOW = new Date('2026-10-21T22:00:00');
const DAY = new Date('2026-10-21T14:00:00');
const seed: Record<string, string> = {
  'daybook:settings': JSON.stringify({ u: 1, start: '2026-10-14', rollover: 4, screensOff: '23:00', becoming: 'I am someone who keeps my word to myself.' }),
  'daybook.seenVersion': version,
};
for (let d = 14; d < 21; d++) {
  const k = '2026-10-' + d;
  seed['daybook:days/' + k] = JSON.stringify({
    d: k,
    events: [],
    checkin: { m: 6, c: 6, e: 6, s: 4, h: 7, so: 'Y', ro: null, n: '', done: true, at: +new Date(k + 'T21:30:00') },
    p: null,
    u: 1,
  });
}

/* a plain DOM click: a mouse click from Playwright does not reach a Pressable while the page clock is fixed */
const press = (page: Page, name: string | RegExp) =>
  page
    .getByRole('button', { name })
    .first()
    .evaluate((el) => (el as HTMLElement).click(), null, { timeout: 3000 });
const has = async (page: Page, name: RegExp) => (await page.getByRole('button', { name }).count()) > 0;
const tick = async (page: Page, ms = 900) => {
  await page.clock.runFor(ms);
  await page.waitForTimeout(350);
};
/* a number, set the way a thumb sets it: a touch on the slider's track at that fraction */
async function slide(page: Page, frac: number) {
  const box = await page.locator('[role="slider"], [role="adjustable"]').first().boundingBox();
  if (!box) throw new Error('no slider on the page');
  const x = box.x + box.width * frac;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
}

const fails: string[] = [];
const browser = await chromium.launch({ executablePath: findChromium() });
for (const theme of ['light', 'dark'] as const) {
  const dir = join(out, theme);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: 320, height: 640 },
    deviceScaleFactor: 2,
    timezoneId: ZONE,
    locale: 'en-US',
    reducedMotion: 'reduce',
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(String(e).split('\n')[0]));
  await page.clock.install({ time: NOW });
  await page.addInitScript((s: Record<string, string>) => {
    if (sessionStorage.getItem('walk:seeded')) return;
    sessionStorage.setItem('walk:seeded', '1');
    for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
  }, seed);
  const shot = (name: string) => page.screenshot({ path: join(dir, name + '.png') });
  const fail = (why: string) => fails.push(theme + ': ' + why);

  try {
    /* ---------- SOS, More: four choices, I slipped in reach without scrolling, then Every tool. By day (Move is the fourth)
       and at night (Go to bed), since SOS at night is always the night sky. ---------- */
    for (const [when, fourth] of [
      ['day', 'Move for 2 minutes'],
      ['night', 'Go to bed'],
    ] as const) {
      await page.clock.setSystemTime(when === 'day' ? DAY : NOW);
      await page.goto(`http://localhost:${port}/sos`);
      await page.waitForFunction(() => document.body.innerText.includes('It passed'), null, { timeout: 60_000 });
      await tick(page, 2000);
      await press(page, /^More/);
      await tick(page);
      await shot(`more-${when}`);
      for (const w of ['Walk it through', 'Step away 10 minutes', 'Text someone', fourth])
        if (!(await has(page, new RegExp('^' + w + '$')))) fail(`More (${when}) has no "${w}"`);
      if (await has(page, /^The trail$/)) fail('More still says "The trail"');
      const slip = await page
        .getByRole('button', { name: /^I slipped/ })
        .first()
        .boundingBox();
      if (!slip || slip.y + slip.height > 640) fail(`I slipped (${when}) is not in view without scrolling`);
      await press(page, /^Every tool$/);
      await tick(page);
      await shot(`more-${when}-every-tool`);
      for (const w of ['10-minute pause', 'Reach a person', when === 'day' ? 'Move' : 'Go to bed'])
        if (await has(page, new RegExp('^' + w + '\\.'))) fail(`Every tool (${when}) lists "${w}" again`);
      if (!(await has(page, /^I slipped/))) fail('I slipped is gone under Every tool');
      await press(page, /^Back$/);
      await tick(page);
      if (!(await has(page, /^Every tool$/))) fail('Back did not go back to the four choices');
    }
    await page.clock.setSystemTime(NOW);

    /* ---------- Walk it through, with nothing typed ---------- */
    await page.goto(`http://localhost:${port}/trail`);
    await page.waitForFunction(() => document.body.innerText.includes('Walk me through it'), null, { timeout: 60_000 });
    await tick(page, 1500);
    let n = 0;
    const slid = new Set<string>();
    let ended = false;
    let lastHead = '';
    for (let i = 0; i < 60 && !ended; i++) {
      const text = await page.evaluate(() => document.body.innerText);
      if (/Every one you ride out makes the next one easier/.test(text)) {
        await shot(String(++n).padStart(2, '0') + '-walk-rode-out');
        ended = true;
        break;
      }
      /* a picture each time the page's words change */
      const head = text.slice(0, 160);
      if (head !== lastHead) await shot(String(++n).padStart(2, '0') + '-walk');
      lastHead = head;
      if (process.env.WALK_DEBUG) console.log('  ', i, JSON.stringify(head.slice(0, 90)));
      /* the two numbers: strong at first, quieter at the end (each set once, the way a thumb sets it) */
      const q = /How strong is it (right now|now)\?/.exec(text)?.[0];
      if (q && !slid.has(q) && (await page.locator('[role="slider"], [role="adjustable"]').count())) {
        slid.add(q);
        await slide(page, slid.size === 1 ? 0.5 : 0.2);
        await tick(page, 500);
        continue;
      }
      const order = [
        /^Walk me through it$/,
        /^Start the 2 minutes$/,
        /^Ride it out$/,
        /^I did it$/,
        /^Now answer it$/,
        /^No plan this time$/,
        /^Done$/,
        /^Next$/,
      ];
      let did = false;
      for (const b of order) {
        if (!(await has(page, b))) continue;
        const off = await page
          .getByRole('button', { name: b })
          .first()
          .evaluate((el) => el.getAttribute('aria-disabled') === 'true');
        if (off) {
          fail(`"${b.source}" is disabled with nothing typed: ${text.split('\n').slice(0, 3).join(' / ')}`);
          break;
        }
        await press(page, b);
        if (process.env.WALK_DEBUG) console.log('     pressed', b.source);
        did = true;
        break;
      }
      /* the place: the one choice the walk cannot do without (the map needs a place) */
      if (!did && (await page.getByRole('radio').count())) {
        await page
          .getByRole('radio')
          .first()
          .evaluate((el) => (el as HTMLElement).click());
        did = true;
      }
      if (!did) {
        fail('stuck: ' + text.split('\n').slice(0, 4).join(' / '));
        await shot('stuck');
        break;
      }
      await tick(page);
    }
    if (!ended) fail('the walk did not end on the ridden-out page');
    const rode = await page.evaluate(() => {
      const d = localStorage.getItem('daybook:days/2026-10-21');
      return d ? (JSON.parse(d).events as { outcome: string }[]).filter((e) => e.outcome === 'rode').length : 0;
    });
    if (rode !== 1) fail(`expected one urge ridden out in the log, found ${rode}`);
    console.log(`${theme}: ${n} pictures, ${ended ? 'ended on the ridden-out page' : 'did not end'}, ${rode} ridden out`);
  } catch (e) {
    fail((e as Error).message.split('\n')[0]);
  }
  for (const e of errs) fail('page error: ' + e);
  await ctx.close();
}
await browser.close();
server.close();
if (fails.length) {
  for (const f of fails) console.log('  FAIL ' + f);
  process.exit(1);
}
console.log('Walk it through with nothing typed: as expected. Pictures in story-shots/walk/.');
