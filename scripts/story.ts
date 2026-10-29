/* Story tests: a scripted week of a made-up person, walked through the real web app, with a picture of each day. A change
   to one feature can quietly break another across days (the "Time to decide" and Rekindle bugs of October 21 only showed
   that way), so each story opens Today day after day with the clock fixed, and checks the one card it should show.

   A story is data, in stories/*.json: a person (settings), and a list of visits. Each visit names the logical day, the
   time the app is opened, what happens before it is opened ("before") and after the picture ("after"), and what Today
   should show ("expect", a case-insensitive regular expression matched against the top of Today, above Your day: the card
   under the flame, or on the day of a slip the card just under SOS;
   "absent", ones that must not match anywhere on Today). A story's "never" list must not match on any day, and its "history" holds what happened on days
   with no visit (by day, the same things as below). Things that can happen:
     { "slip": "23:10" }                 a slip at that time (add "trigger": "Bored" if you like)
     { "rode": "15:20" }                 an urge ridden out
     { "checkin": true }                 the evening check-in (every visit gets one after the picture unless "checkin": false)
     { "small": true }                   one small thing done after the day's slip
     { "sunrise": true, "keep": true }   the sunrise check for the latest slip that still waits for one (keep: the run's answer)
     { "settings": { "wk1": "..." } }    a change to the settings, as if made in the app
   A visit's "tap" lists buttons tapped on Today after the picture, by their words (a real tap, through the app).
   The log carries over: every day from the start to the first visit gets a check-in (so the app keeps the start date),
   and after each picture the app's own storage (days it marked opened, celebrations seen, settings it moved) is read back
   and becomes the next visit's starting log, with the next visit's entries added. Each visit is a fresh browser.

     npm run story                     build the web app, then every story
     npm run story -- --no-build       reuse the last build
     npm run story -- --only step      just the stories whose file name has "step"

   Pictures go to story-shots/<story>/<NN>-<day>.png (and -2.png, scrolled), which git ignores. Page errors fail the day.
   The exit code is 1 when any day fails. */
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright-core';

/* every clock in a story is read in this zone, in this script and in the browser */
const ZONE = 'America/Chicago';
process.env.TZ = ZONE;

type Action = {
  slip?: string;
  rode?: string;
  trigger?: string;
  checkin?: boolean;
  small?: boolean;
  sunrise?: boolean;
  keep?: boolean;
  settings?: Record<string, unknown>;
};
interface Visit {
  /** the logical day, YYYY-MM-DD (the app's day rolls over at settings.rollover o'clock) */
  day: string;
  /** when the app is opened, HH:MM; before the rollover hour it is the morning of the next calendar date */
  open: string;
  /** a few words for the summary */
  what?: string;
  before?: Action[];
  after?: Action[];
  checkin?: boolean;
  /** buttons tapped on Today after the picture (by their words), before the log is read back */
  tap?: string[];
  expect: string;
  absent?: string[];
}
interface Story {
  about: string;
  settings: Record<string, unknown> & { start: string; rollover?: number };
  never?: string[];
  /** what happened on days before the first visit (or between visits), by day: the person lived them without a picture */
  history?: Record<string, Action[]>;
  visits: Visit[];
}
type Store = Record<string, string>;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'apps/mobile');
const build = join(app, 'dist-story');
const out = join(root, 'story-shots');
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;

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

/* ---------- days and clocks ---------- */
const addDays = (k: string, n: number) => {
  const d = new Date(k + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const at = (k: string, hm: string, roll: number) => {
  const date = +hm.slice(0, 2) < roll ? addDays(k, 1) : k;
  return new Date(`${date}T${hm}:00`);
};
const weekday = (k: string) => new Date(k + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });

/* ---------- the log, as the app keeps it in localStorage ---------- */
const DAY = (k: string) => 'daybook:days/' + k;
function dayOf(s: Store, k: string) {
  const raw = s[DAY(k)];
  return raw ? JSON.parse(raw) : { d: k, events: [], checkin: null, p: null, u: 1 };
}
const PLAY = { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {} };
function apply(s: Store, k: string, acts: Action[], roll: number, tag: string) {
  acts.forEach((a, i) => {
    if (a.settings) {
      s['daybook:settings'] = JSON.stringify({ ...JSON.parse(s['daybook:settings']), ...a.settings, u: Date.now() });
      return;
    }
    if (a.sunrise) {
      /* the latest slip on an earlier day whose sunrise check is still to do */
      for (let d = addDays(k, -1); d >= addDays(k, -14); d = addDays(d, -1)) {
        const x = dayOf(s, d);
        const e = [...x.events].reverse().find((e: { outcome: string; rk?: { at?: string } }) => e.outcome === 'slipped' && !(e.rk && e.rk.at));
        if (!e) continue;
        e.rk = { ...(e.rk || {}), at: k, pl: '' };
        if (a.keep != null) e.keep = a.keep;
        x.u = Date.now();
        s[DAY(d)] = JSON.stringify(x);
        return;
      }
      throw new Error(`${tag}: a sunrise check, but no slip waits for one`);
    }
    const x = dayOf(s, k);
    if (a.checkin) x.checkin = { m: 6, c: 6, e: 6, s: 4, h: 7, so: 'Y', ro: null, n: '', done: true, at: +at(k, '21:30', roll) };
    if (a.small) for (const e of x.events) if (e.outcome === 'slipped') e.recovered = true;
    const time = a.slip || a.rode;
    if (time)
      x.events.push({
        id: `${tag}-${i}`,
        time,
        outcome: a.slip ? 'slipped' : 'rode',
        trigger: a.trigger || null,
        paused: null,
        did: null,
        recovered: false,
        note: '',
      });
    x.u = Date.now();
    s[DAY(k)] = JSON.stringify(x);
  });
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

/* ---------- walk a visit ---------- */
/* a plain DOM click: a mouse click from Playwright does not reach a Pressable while the page clock is fixed */
const press = (page: Page, name: string | RegExp) =>
  page
    .getByRole('button', { name })
    .first()
    .evaluate((el) => (el as HTMLElement).click(), null, { timeout: 5000 });

/* waits for Today, and closes the celebrations and notes that open by themselves, the way a person would. Gives back the
   buttons pressed, so the summary can say what popped up. */
async function settle(page: Page) {
  await page.waitForFunction(() => document.body.innerText.includes('SOS'), null, { timeout: 60_000 });
  await page.waitForTimeout(1500);
  const closed: string[] = [];
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < 8; i++) {
      const b = page.getByRole('button', { name: /^(Nice|Okay|Got it|Next)$/ });
      if (!(await b.count())) break;
      /* what it was: the first lines of the box around the button */
      const what = await b.first().evaluate((el) => {
        let x: HTMLElement | null = el as HTMLElement;
        while (x && x.innerText.split('\n').filter(Boolean).length < 3) x = x.parentElement;
        return (x ? x.innerText : '').split('\n').filter(Boolean).slice(0, 2).join(' ');
      });
      closed.push(what);
      await press(page, /^(Nice|Okay|Got it|Next)$/).catch(() => {});
      await page.clock.runFor(1000);
      await page.waitForTimeout(400);
    }
    /* toasts last a few seconds, and some celebrations wait a moment before they open */
    await page.clock.runFor(9000);
    await page.waitForTimeout(800);
  }
  return closed;
}

const browser = await chromium.launch({ executablePath: findChromium() });
const files = readdirSync(join(root, 'stories'))
  .filter((f) => f.endsWith('.json') && (!only || f.includes(only)))
  .sort();
const results: { story: string; n: string; day: string; ok: boolean; why: string[] }[] = [];

for (const f of files) {
  const name = f.replace(/\.json$/, '');
  const story: Story = JSON.parse(readFileSync(join(root, 'stories', f), 'utf8'));
  const roll = story.settings.rollover ?? 4;
  console.log(`\n${name}: ${story.about}`);
  rmSync(join(out, name), { recursive: true, force: true });
  mkdirSync(join(out, name), { recursive: true });

  /* the log before the first visit: a check-in on every day from the start */
  let s: Store = { 'daybook:settings': JSON.stringify({ u: 1, ...story.settings }) };
  for (let k = story.settings.start; k < story.visits[0].day; k = addDays(k, 1))
    apply(s, k, [{ checkin: true }, ...(story.history?.[k] || [])], roll, `${name}-${k}-fill`);

  for (const [i, v] of story.visits.entries()) {
    const n = String(i + 1).padStart(2, '0');
    const prev = i ? story.visits[i - 1].day : null;
    /* days the story skips over were lived too: a check-in each */
    if (prev)
      for (let k = addDays(prev, 1); k < v.day; k = addDays(k, 1)) apply(s, k, [{ checkin: true }, ...(story.history?.[k] || [])], roll, `${name}-${k}-fill`);
    apply(s, v.day, v.before || [], roll, `${name}-${v.day}-${n}b`);

    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      timezoneId: ZONE,
      locale: 'en-US',
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    const errs: string[] = [];
    page.on('pageerror', (e) => errs.push(String(e).split('\n')[0]));
    await page.clock.install({ time: at(v.day, v.open, roll) });
    await page.addInitScript((seed: Store) => {
      if (sessionStorage.getItem('story:seeded')) return;
      sessionStorage.setItem('story:seeded', '1');
      for (const [k, val] of Object.entries(seed)) localStorage.setItem(k, val);
    }, s);
    const why: string[] = [];
    let text = '';
    let popped: string[] = [];
    const file = join(out, name, `${n}-${v.day}`);
    try {
      await page.goto(`http://localhost:${port}/`);
      popped = await settle(page);
      text = await page.evaluate(() => document.body.innerText);
      await page.screenshot({ path: file + '.png' });
      await page.mouse.move(195, 500);
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(500);
      await page.screenshot({ path: file + '-2.png' });
      for (const t of v.tap || []) {
        await page.mouse.wheel(0, -2000);
        await press(page, t);
        await page.clock.runFor(1000);
        await page.waitForTimeout(800);
      }
      s = await page.evaluate(() => {
        const o: Record<string, string> = {};
        for (let j = 0; j < localStorage.length; j++) {
          const k = localStorage.key(j)!;
          if (k.startsWith('daybook:')) o[k] = localStorage.getItem(k)!;
        }
        return o;
      });
      /* the log as the app left it, for a closer look when a day goes wrong */
      writeFileSync(file + '.json', JSON.stringify(Object.fromEntries(Object.entries(s).map(([k, val]) => [k, JSON.parse(val)])), null, 1));
    } catch (e) {
      why.push((e as Error).message.split('\n').slice(0, 6).join(' | '));
    }
    /* the card: the top of Today, above Your day (its rows name the day's stops too, so they are left out). It is the card
       under the flame, or on the day of a slip the card just under SOS. */
    const card = text.split(/\nYour day\n/)[0];
    if (text && !new RegExp(v.expect, 'i').test(card)) why.push(`expected /${v.expect}/ in the card`);
    for (const a of [...(v.absent || []), ...(story.never || [])]) if (text && new RegExp(a, 'i').test(text)) why.push(`did not expect /${a}/`);
    for (const e of errs) why.push('page error: ' + e);
    const ok = !why.length;
    results.push({ story: name, n, day: v.day, ok, why });
    console.log(
      `  ${ok ? 'ok  ' : 'FAIL'} ${n} ${weekday(v.day)} ${v.day} ${v.open}  ${v.what || ''}${popped.length ? `  (closed: ${popped.join('; ')})` : ''}`,
    );
    for (const w of why) console.log(`         ${w}`);
    if (!ok && text) console.log('         The card said: ' + card.replace(/\s+/g, ' ').slice(0, 400));
    await ctx.close();

    apply(s, v.day, [...(v.checkin === false ? [] : [{ checkin: true }]), ...(v.after || [])], roll, `${name}-${v.day}-${n}a`);
  }
}
await browser.close();
server.close();
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length} of ${results.length} days as expected. Pictures in story-shots/.`);
if (bad.length) {
  for (const r of bad) console.log(`  failed: ${r.story} ${r.n} ${r.day}`);
  process.exit(1);
}
