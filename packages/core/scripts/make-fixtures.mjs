#!/usr/bin/env node
/*
 * Golden fixtures: what the legacy app itself computes, for many logs and many moments in time.
 *
 * Opens legacy/index.html in Chromium (time zone America/Chicago, the clock set to each moment), feeds it each log, and saves
 * every result the new app depends on into test/fixtures/*.json. The tests then run the same logs through @daybook/core and
 * must get exactly the same answers. That is how the port stays faithful: nothing is retyped by hand and trusted.
 *
 * Run it after changing legacy/index.html (and after `npm run extract`):  npm run fixtures -w @daybook/core
 * It needs a Chromium. Set CHROMIUM_PATH, or it uses the one Playwright installed.
 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');
const outDir = join(here, '../test/fixtures');
mkdirSync(outDir, { recursive: true });

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  if (existsSync(base)) {
    const dir = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
    if (dir) for (const p of ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']) {
      if (existsSync(join(base, dir, p))) return join(base, dir, p);
    }
  }
  return undefined; // playwright-core's own lookup
}

/* ---------- a small seeded random, so the fixtures are the same every time ---------- */
function rng(seed) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = (a) => a[Math.floor(r() * a.length)];
  r.chance = (p) => r() < p;
  return r;
}

/* ---------- dates, the same way the legacy app does them ---------- */
const p2 = (n) => String(n).padStart(2, '0');
const utcOf = (k) => { const a = k.split('-').map(Number); return Date.UTC(a[0], a[1] - 1, a[2]); };
const addDays = (k, n) => { const t = new Date(utcOf(k) + n * 864e5); return t.getUTCFullYear() + '-' + p2(t.getUTCMonth() + 1) + '-' + p2(t.getUTCDate()); };
/* a moment in Chicago: the fixtures pin the zone, and these offsets are right for the dates used (CDT until Nov 1, 2026, then CST) */
const chicago = (key, hm) => {
  const off = key >= '2026-11-01' ? '-06:00' : '-05:00';
  return new Date(`${key}T${hm}:00${off}`).getTime();
};

const TRIG = ['late', 'lonely', 'bored', 'stress', 'tired', 'scroll', 'u_custom1', 'nope', null];
const DID = ['pause', 'breathe', 'move', 'reach', 'hobby', 'left', 'curious', 'ground'];
const TOOLS = ['pause', 'breathe', 'curious', 'ground', 'halt', 'surprise', 'message', 'reasons', 'move', 'bed', 'thought', 'forward'];
const LESSONS = Array.from({ length: 32 }, (_, i) => 'l' + (i + 1));

/* ---------- logs ---------- */
function blankDay(k) { return { d: k, events: [], checkin: null, p: null, u: 1 }; }
function checkin(r, so) {
  return { m: r.int(0, 10), c: r.int(0, 10), e: r.int(0, 10), s: r.int(0, 10), h: r.int(4, 9), so: so ?? r.pick(['Y', 'N', null]), ro: r.pick(['Y', 'N', null]), n: '', done: true, at: 1 };
}

/* a scenario: settings (raw, as saved), days, reviews, and the moments to look at it */
function scenario(name, { today, startAgo, day1Ago, mode = 'strict', extra = {}, build, moments }) {
  const start = addDays(today, -startAgo);
  const settings = { v: 1, start, day1: day1Ago == null ? null : addDays(today, -day1Ago), rollover: 4, screensOff: '23:00', cleanMode: mode, onb: { n: 1, at: 1, a: {}, hist: [] }, u: 1, ...extra };
  const days = {};
  const reviews = {};
  const day = (ago) => { const k = addDays(today, -ago); return (days[k] = days[k] || blankDay(k)); };
  build({ day, days, reviews, settings, today, start, k: (ago) => addDays(today, -ago) });
  return { name, settings, days, reviews, moments: (moments || ['07:30', '13:00', '22:30', '+01:30']).map((m) => (m[0] === '+' ? chicago(addDays(today, 1), m.slice(1)) : chicago(today, m))) };
}

const slip = (id, time, more = {}) => ({ id, time, outcome: 'slipped', trigger: null, paused: null, did: null, recovered: false, note: '', ...more });
const ride = (id, time, more = {}) => ({ id, time, outcome: 'rode', trigger: null, paused: true, did: ['pause'], recovered: false, note: '', ...more });

const T = '2026-10-15';
const S = [];

S.push(scenario('fresh-setup', { today: T, startAgo: 0, day1Ago: -7, build: () => {} }));
S.push(scenario('tracking-week', {
  today: T, startAgo: 4, day1Ago: -3,
  build: ({ day }) => { day(3).events.push(ride('r1', '22:10')); day(2).events.push(slip('s1', '23:40', { trigger: 'late' })); day(1).checkin = { m: 5, c: 5, e: 5, s: 5, h: 7, so: 'Y', ro: 'N', n: '', done: true, at: 1 }; },
}));
S.push(scenario('just-tracking', { today: T, startAgo: 10, day1Ago: null, build: ({ day }) => { day(4).events.push(slip('s1', '01:10')); } }));
S.push(scenario('strict-run', {
  today: T, startAgo: 27, day1Ago: 20,
  build: ({ day }) => {
    for (let i = 20; i >= 1; i--) day(i).checkin = { m: 6, c: 5, e: 6, s: 4, h: 7, so: 'Y', ro: i % 3 ? null : 'Y', n: '', done: true, at: 1 };
    day(17).events.push(slip('s1', '23:30', { recovered: true }));
    day(12).events.push(ride('r1', '22:45', { trigger: 'late' }), ride('r2', '14:10', { paused: false }));
    day(3).p = { w: [0, 1, 2], wd: true, r: true, c: 2, m: true, tl: ['pause', 'breathe'], po: '22:30', ls: ['l1'], lv: [], ov: {} };
    day(0).p = { w: [], wd: false, r: false, c: 1, m: false, tl: ['ground'], po: null, ls: ['l2'], lv: ['l1'], ov: { reach: true } };
  },
}));
/* a 10-day run, then a slip last night: the save is open, with the small thing done and the phone away */
S.push(scenario('save-open', {
  today: T, startAgo: 17, day1Ago: 11,
  build: ({ day }) => {
    for (let i = 11; i >= 1; i--) day(i).checkin = checkin(rng(i), 'Y');
    day(1).events.push(slip('s1', '23:50', { recovered: true, wt: 10 }));
    day(1).p = { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: '23:55', ls: [], lv: [], ov: {} };
  },
}));
/* saved: an 8-day run, a slip, and all three missions done in time */
S.push(scenario('save-done', {
  today: T, startAgo: 20, day1Ago: 13,
  build: ({ day, k }) => {
    for (let i = 13; i >= 1; i--) day(i).checkin = checkin(rng(100 + i), i === 4 ? 'Y' : 'Y');
    day(4).events.push(slip('s1', '22:15', { recovered: true, rk: { at: k(3), pl: 'If I am in bed with my phone, then I put it in the kitchen.' } }));
  },
}));
/* a 16-day run needs the deeper mission: one save done with it, one later slip that is too soon to save */
S.push(scenario('save-deep', {
  today: T, startAgo: 30, day1Ago: 25,
  build: ({ day, k }) => {
    for (let i = 25; i >= 1; i--) day(i).checkin = checkin(rng(200 + i), 'Y');
    day(8).events.push(slip('s1', '23:05', { recovered: true, rk: { at: k(7), pl: 'Phone out', dp: 'trace', tr: ['bed', 'scrolling', 'long day'] } }));
    day(3).events.push(slip('s2', '00:40', { recovered: true, rk: { at: k(2), pl: 'x' } }));
  },
}));
/* a 16-day run, missions done but no deeper mission: not saved */
S.push(scenario('save-deep-missing', {
  today: T, startAgo: 30, day1Ago: 25,
  build: ({ day, k }) => {
    for (let i = 25; i >= 1; i--) day(i).checkin = checkin(rng(300 + i), 'Y');
    day(6).events.push(slip('s1', '23:05', { recovered: true, rk: { at: k(5), pl: 'Phone out' } }));
  },
}));
/* the phone was not put away that night: the save can no longer happen */
S.push(scenario('save-missed', {
  today: T, startAgo: 12, day1Ago: 9,
  build: ({ day }) => {
    for (let i = 9; i >= 1; i--) day(i).checkin = checkin(rng(400 + i), 'Y');
    day(1).events.push(slip('s1', '21:00', { recovered: true }));
    day(1).checkin.so = 'N';
  },
}));
/* the edges: a run of exactly 14 days needs the deeper mission, a run of 13 does not */
for (const [name, d1] of [['save-edge-14', 15], ['save-edge-13', 14]]) S.push(scenario(name, {
  today: T, startAgo: d1 + 3, day1Ago: d1,
  build: ({ day, k }) => {
    for (let i = d1; i >= 1; i--) day(i).checkin = checkin(rng(600 + i), 'Y');
    day(1).events.push(slip('s1', '22:00', { recovered: true, rk: { at: k(0), pl: 'Phone in the kitchen' } }));
    day(1).p = { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: '22:20', ls: [], lv: [], ov: {} };
  },
}));
/* the 7-day window: a slip 7 days after a full one gets the full Rekindle again; one 6 days after does not */
S.push(scenario('save-window', {
  today: T, startAgo: 30, day1Ago: 28,
  build: ({ day, k }) => {
    for (let i = 28; i >= 1; i--) day(i).checkin = checkin(rng(700 + i), 'Y');
    [[20, 'a'], [13, 'b'], [7, 'c'], [2, 'd']].forEach(([a, id]) => day(a).events.push(slip(id, '23:00', { recovered: true, rk: { at: k(a - 1), pl: 'p' } })));
  },
}));
/* a slip today: the full Rekindle with a run on the line, a deep run, a second slip in the week, and a sunrise check done */
S.push(scenario('slip-today-run', {
  today: T, startAgo: 14, day1Ago: 9, extra: { safePerson: 'Sam' },
  build: ({ day }) => {
    for (let i = 9; i >= 1; i--) day(i).checkin = checkin(rng(800 + i), 'Y');
    day(0).events.push(slip('s1', '21:00', { trigger: 'late' }));
  },
}));
S.push(scenario('slip-today-deep', {
  today: T, startAgo: 25, day1Ago: 20, extra: { safePerson: 'Alexander Hamilton the Third' },
  build: ({ day }) => {
    for (let i = 20; i >= 1; i--) day(i).checkin = checkin(rng(900 + i), 'Y');
    day(0).events.push(slip('s1', '20:30', { recovered: true, trigger: 'u_work', wt: 5 }));
    day(0).p = { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: '20:45', ls: [], lv: [], ov: {} };
  },
}));
S.push(scenario('slip-today-second', {
  today: T, startAgo: 20, day1Ago: 15, mode: 'step', extra: { stepAt: addDays(T, -10) },
  build: ({ day }) => {
    day(3).events.push(slip('s1', '23:00', { trigger: 'bored' }));
    day(0).events.push(slip('s2', '22:10', { wt: 10 }));
  },
}));
/* two slips on the day a run is on the line: the second gets the short Rekindle, and the run can still be saved */
S.push(scenario('slip-today-twice', {
  today: T, startAgo: 14, day1Ago: 9,
  build: ({ day }) => {
    for (let i = 9; i >= 1; i--) day(i).checkin = checkin(rng(1100 + i), 'Y');
    day(0).events.push(slip('s1', '14:20'), slip('s2', '20:10', { wt: 10, recovered: true }));
  },
}));
S.push(scenario('sunrise-done', {
  today: T, startAgo: 20, day1Ago: 12,
  extra: { plan: [{ when: "I'm in bed late at night", then: '' }, { when: "I'm lonely or low", then: 'Call Mom.' }, { when: "I'm bored or idle", then: 'Walk' }, { when: "I'm stressed or anxious", then: 'Run' }, { when: 'Something else: ______', then: '' }] },
  build: ({ day, k }) => {
    for (let i = 12; i >= 1; i--) day(i).checkin = checkin(rng(1000 + i), 'Y');
    day(1).events.push(slip('s1', '23:30', { recovered: true, trigger: 'late', rk: { at: k(0), pl: 'Charge my phone in another room and go to sleep.' } }));
    day(5).events.push(slip('s0', '22:00', { trigger: 'lonely' }));
  },
}));
S.push(scenario('gentle', {
  today: T, startAgo: 25, day1Ago: 18, mode: 'gentle',
  build: ({ day }) => {
    day(15).events.push(slip('s1', '23:00'));
    day(9).events.push(slip('s2', '22:00'), slip('s3', '23:30'));
    day(2).events.push(slip('s4', '01:30', { trigger: 'tired' }));
  },
}));
/* step down: slips most days, some waited out, a self-check score of 7 */
S.push(scenario('step-daily', {
  today: T, startAgo: 30, day1Ago: 23, mode: 'step', extra: { stepAt: addDays(T, -20), onb: { n: 1, at: 1, a: { freq: 'f4', years: 'y2' }, hist: [{ d: '2026-09-15', s: 7 }] } },
  build: ({ day }) => {
    const r = rng(7);
    for (let i = 29; i >= 1; i--) if (r.chance(0.75)) day(i).events.push(slip('s' + i, p2(r.pick([21, 22, 23, 0, 1])) + ':' + p2(r.int(0, 59)), { wt: r.pick([0, 5, 10, 20, undefined]), trigger: r.pick(TRIG) }));
  },
}));
S.push(scenario('step-ready', {
  today: T, startAgo: 30, day1Ago: 24, mode: 'step', extra: { stepAt: addDays(T, -14) },
  build: ({ day }) => {
    [[22, '23:00'], [20, '23:30'], [18, '22:40'], [16, '23:10'], [14, '23:50'], [12, '22:30'], [9, '23:10']].forEach(([a, t], i) => day(a).events.push(slip('s' + i, t)));
  },
}));
S.push(scenario('step-graduated', {
  today: T, startAgo: 40, day1Ago: 33, mode: 'strict', extra: { stepAt: addDays(T, -25), stepGrad: addDays(T, -5) },
  build: ({ day }) => { [[30, '23:00'], [27, '23:30'], [20, '22:40'], [12, '23:10']].forEach(([a, t], i) => day(a).events.push(slip('s' + i, t))); },
}));
/* slips on most days of the last week in strict mode: the switch to step down */
S.push(scenario('rough-patch', {
  today: T, startAgo: 20, day1Ago: 13,
  build: ({ day }) => {
    for (let i = 20; i >= 1; i--) day(i).checkin = checkin(rng(500 + i));
    [[13, '23:30'], [11, '22:50'], [9, '23:20'], [6, '23:10'], [5, '23:40'], [4, '22:50'], [3, '00:20'], [1, '23:10']].forEach(([a, t], i) => day(a).events.push(slip('s' + i, t)));
  },
}));
/* slips on a few days, but not most: the offer */
S.push(scenario('step-offer', {
  today: T, startAgo: 20, day1Ago: 13,
  build: ({ day }) => { [[5, '23:00'], [3, '22:00'], [1, '23:30']].forEach(([a, t], i) => day(a).events.push(slip('s' + i, t))); },
}));
S.push(scenario('step-offer-declined', {
  today: T, startAgo: 20, day1Ago: 13, extra: { stepNo: addDays(T, -3) },
  build: ({ day }) => { [[5, '23:00'], [3, '22:00'], [1, '23:30']].forEach(([a, t], i) => day(a).events.push(slip('s' + i, t))); },
}));
/* a different new-day hour, early slips that belong to the day before, and the clock change on November 1 */
S.push(scenario('rollover-dst', {
  today: '2026-11-03', startAgo: 20, day1Ago: 14, extra: { rollover: 2, screensOff: '00:30', routine: { reach: true, lesson: false } },
  build: ({ day }) => {
    day(5).events.push(slip('s1', '01:45'), slip('s2', '02:30'));
    day(3).events.push(slip('s3', '23:59', { wt: 20 }));
    day(2).events.push(ride('r1', '01:10', { trigger: 'late' }));
    day(1).p = { w: [0], wd: true, r: true, c: 4, m: true, tl: TOOLS.slice(0, 5), po: '00:10', ls: [], lv: [], ov: { lesson: true } };
  },
  moments: ['01:00', '03:00', '12:00', '23:45'],
}));
/* a long, varied history with weekly reviews and a level already seen */
function randomScenario(seed, today, len) {
  const r = rng(seed);
  return scenario('random-' + seed, {
    today, startAgo: len, day1Ago: len - 7, mode: r.pick(['strict', 'strict', 'gentle', 'step']),
    extra: {
      rollover: r.pick([3, 4, 4, 5]), screensOff: r.pick(['22:30', '23:00', '23:30']), stepAt: r.chance(0.5) ? addDays(today, -r.int(10, len - 8)) : null,
      routine: { reach: r.chance(0.5), morning: r.chance(0.8), lesson: r.chance(0.8), calm: r.chance(0.9), checkin: r.chance(0.9), wind: r.chance(0.8) },
      seen: r.chance(0.5) ? { badges: [], quests: [], level: r.int(1, 12), full: null, lad: 3 } : null,
      safety: Array.from({ length: 8 }, () => r.chance(0.4)), help: Array.from({ length: 5 }, () => r.chance(0.2)),
      onb: { n: r.int(0, 2), at: 1, a: {}, hist: r.chance(0.5) ? [{ d: addDays(today, -len), s: r.int(0, 10) }] : [] },
    },
    build: ({ day, reviews, k }) => {
      let ev = 0;
      for (let i = len; i >= 0; i--) {
        if (r.chance(0.15)) continue; // nothing logged that day
        const d = day(i);
        const n = r.pick([0, 0, 0, 1, 1, 2, 3]);
        for (let j = 0; j < n; j++) {
          const t = r.chance(0.08) ? null : p2(r.pick([0, 1, 2, 3, 7, 9, 13, 16, 19, 20, 21, 22, 23])) + ':' + p2(r.int(0, 59));
          const base = { trigger: r.pick(TRIG), recovered: r.chance(0.4), note: r.chance(0.2) ? 'note ' + j : '', did: r.chance(0.3) ? [r.pick(DID), r.pick(DID)] : null };
          if (r.chance(0.55)) {
            const more = { ...base, wt: r.pick([0, 5, 10, 20, undefined, 7]) };
            if (r.chance(0.35)) more.rk = { at: r.chance(0.8) ? k(i - r.pick([0, 1, 1, 2])) : 'bad', pl: 'plan', dp: r.pick([undefined, 'trace', 'tell']) };
            d.events.push(slip('e' + ev++, t, more));
          } else d.events.push(ride('e' + ev++, t, { ...base, paused: r.pick([true, false, null]), st: r.pick(['low', 'mid', 'high', undefined]), m: r.pick([3, 12, undefined]), tr: r.chance(0.3) ? [['pause', 'p'], ['breathe', 's']] : undefined }));
        }
        if (r.chance(0.7)) d.checkin = { ...checkin(r), done: r.chance(0.9) };
        if (r.chance(0.6)) d.p = {
          w: r.chance(0.5) ? [0, 1, 2, 3].filter(() => r.chance(0.6)) : [], wd: r.chance(0.4), r: r.chance(0.3), c: r.int(0, 4), m: r.chance(0.5),
          tl: TOOLS.filter(() => r.chance(0.15)), po: r.chance(0.4) ? p2(r.pick([21, 22, 23])) + ':' + p2(r.int(0, 59)) : null,
          ls: r.chance(0.5) ? [r.pick(LESSONS)] : [], lv: r.chance(0.2) ? [r.pick(LESSONS), r.pick(LESSONS)] : [], ov: r.chance(0.2) ? { [r.pick(['reach', 'lesson', 'wind'])]: r.chance(0.5) } : {},
        };
      }
      for (let w = 0; w < len / 7; w++) if (r.chance(0.4)) reviews['w' + w] = { k: 'w' + w, a: { hard: 'h', helped: r.chance(0.5) ? 'x' : '', change: '', proud: '' }, u: 1 };
    },
  });
}
S.push(randomScenario(11, T, 63));
S.push(randomScenario(23, T, 95));
S.push(randomScenario(37, '2026-11-20', 120));
S.push(randomScenario(41, T, 45));
S.push(randomScenario(58, T, 30));

/* ---------- what the legacy page computes ---------- */
const COMPUTE = ({ settings, days, reviews }) => {
  const J = (x) => JSON.parse(JSON.stringify(x));
  const st = normSettings(settings);
  const D = {};
  Object.keys(days).forEach((k) => { if (isKey(k)) D[k] = normDay(days[k], k); });
  const R = {};
  Object.keys(reviews).forEach((k) => { R[k] = normReview(reviews[k], k); });
  const tk = logicalKey(Date.now(), st.rollover);
  const keys = allKeys(D);
  const out = { tk, st: J(st), days: J(D), reviews: J(R) };
  out.ledger = {
    def: J(runLedger(D, st, tk)), strict: J(runLedger(D, st, tk, 'strict')), gentle: J(runLedger(D, st, tk, 'gentle')),
    noSave: J(runLedger(D, st, tk, 'strict', true)), step: J(runLedger(D, st, tk, 'step')),
  };
  out.full = rkFullDays(D);
  out.rough = roughPatch(D, st, tk);
  out.step = J(stepView(D, st, Date.now()));
  out.slipMoments = slipMoments(D, st, Date.now());
  out.game = J(gameCompute(D, st, R, tk));
  out.dayPoints = {};
  out.rk = {};
  out.wins = {};
  out.kinds = {};
  keys.concat([tk]).forEach((k) => {
    out.dayPoints[k] = J(dayPoints(D, k, st));
    out.rk[k] = J(rkOf(D, k, st));
    out.wins[k] = J(winsOf(D, k, st));
    out.kinds[k] = dayKind(k, D[k], st, tk);
  });
  out.rhythm = J(rhythm(D, st, tk, Date.now()));
  const cw = weekOf(tk, st);
  out.weeks = [];
  for (let w = 0; w <= cw; w++) out.weeks.push({ stats: J(weekStats(D, st, w)), quests: J(questsFor(D, st, w)), slips: slipsInWeek(D, st, w) });
  /* the Today cards, through the legacy UI code with the global Store set to this log */
  Store.settings = st; Store.days = D; Store.reviews = R;
  out.cleanView = J(cleanView());
  out.html = { days: daysCardHtml('lg'), daysSm: daysCardHtml('sm'), offer: stepOfferHtml(), step: st.day1 && tk >= st.day1 ? stepCardHtml('lg', null) : null };
  /* Rekindle: the card on Today, which Rekindle each slip gets, its short and full screens, and the sunrise plans */
  const act = rkActive(tk);
  /* screens are kept as their words, plus the two things the tests read from the markup: the flames label and the card's look */
  const words = (h) => {
    const d = document.createElement('div');
    d.innerHTML = h;
    const f = d.querySelector('.rk-fls');
    return { text: d.textContent.replace(/\s+/g, ' ').trim(), flames: f ? f.getAttribute('aria-label') : null, line: !!d.querySelector('.rk-card.line') };
  };
  const R2 = { active: J(act), card: act ? words(rkCardHtml(act)) : null, steps: {}, light: {}, quest: {}, plan: {}, ev: {} };
  keys.forEach((k) => {
    if (!sumDay(D[k]).slipped) return;
    R2.steps[k] = rkStepFor(k);
    /* the screens are only recorded for the last two weeks of slips, to keep the fixtures small */
    if (k < addDays(tk, -14)) return;
    const sl = sortedEvents(D[k], st.rollover).filter((e) => e.outcome === 'slipped');
    const ev = sl.find((e) => e.rk) || sl[sl.length - 1];
    const sc = { id: 'checkin', date: k, evId: ev.id, pts0: G().pts, time: ev.time, outcome: 'slipped', step: 'done', hist: [] };
    R2.ev[k] = ev.id;
    R2.light[k] = words(rkLightHtml(sc));
    R2.quest[k] = words(rkQuestHtml(sc, ev));
    R2.plan[k] = J(srPlanInfo({ k, evId: ev.id }));
  });
  out.rekindle = R2;
  /* the rows of each day's entries, and where you are */
  out.rows = {};
  keys.forEach((k) => { out.rows[k] = sortedEvents(D[k], st.rollover).map((e) => eventRow(k, e)); });
  out.phase = phaseLabel(tk, st);
  /* SOS: what it suggests for a few kinds of moment, with this device's SOS memory empty */
  const fresh = () => localStorage.removeItem('daybook.ur.v1');
  fresh();
  const variants = [
    { strength: null, used: [], again: 0 },
    { strength: 'low', used: [], again: 0 },
    { strength: 'high', used: ['breathe'], again: 1 },
    { strength: 'mid', used: ['move', 'ground'], again: 2, skip: ['thought'] },
    { strength: null, used: [], again: 0, trigger: 'late' },
    { strength: 'mid', used: [], again: 0, trigger: 'u_custom1' },
    { strength: null, used: ['curious'], again: 1, trigger: 'lonely' },
  ];
  out.sos = {
    stats: J(urStats()), tried: urTried(), ev: urEvidence(),
    variants: variants.map((v) => {
      const sc = Object.assign({ trigger: null, skip: [], explore: false, rounds: [] }, v);
      const rank = urRank(sc), pk = urPickSug(sc);
      return { sc: v, rank: rank.map((x) => ({ id: x.id, score: x.score, off: x.off, pin: x.pin, tk: x.tk })), pick: { top: pk.top.id, mode: pk.mode, combo: pk.combo ? pk.combo.id : null }, go: words(urGoHtml(pk)).text, cap: urCapText(pk, sc.strength) };
    }),
    lessons: [['late', false], [null, true], ['stress', false], ['u_custom1', false]].map(([t, sl]) => { fresh(); const p = urLessonFor(t, sl, null); return p ? { id: p.l.id, rev: p.rev } : null; }),
  };
  fresh();
  return out;
};

const browser = await chromium.launch({ executablePath: findChromium() });
const ctx = await browser.newContext({ timezoneId: 'America/Chicago', locale: 'en-US' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.clock.setFixedTime(new Date(chicago(T, '12:00')));
await page.goto(pathToFileURL(join(root, 'legacy/index.html')).href);
await page.waitForFunction(() => typeof runLedger === 'function' && typeof Store === 'object');

let n = 0;
for (const sc of S) {
  const cases = [];
  for (const now of sc.moments) {
    await page.clock.setFixedTime(new Date(now));
    const expected = await page.evaluate(COMPUTE, { settings: sc.settings, days: sc.days, reviews: sc.reviews });
    /* the cleaned-up log is the same at every moment, so it is kept once */
    if (cases.length) { delete expected.st; delete expected.days; delete expected.reviews; delete expected.rows; }
    cases.push({ now, expected });
    n++;
  }
  writeFileSync(join(outDir, sc.name + '.json'), JSON.stringify({ name: sc.name, input: { settings: sc.settings, days: sc.days, reviews: sc.reviews }, cases }));
}

/* the flame: all 30 levels */
const emblems = await page.evaluate(() => Array.from({ length: 30 }, (_, i) => Em.emblem(i + 1, { still: true, size: 120 })));
writeFileSync(join(outDir, 'emblem.json'), JSON.stringify(emblems));

/* the Rekindle words, kept in the TypeScript port; the tests check they match */
const words = await page.evaluate(() => {
  const st0 = Store.settings;
  const names = ['', 'Sam', 'Alexander Hamilton the Third'];
  const tell = names.map((n) => { Store.settings = Object.assign({}, st0 || normSettings({}), { safePerson: n }); return rkTellText(); });
  Store.settings = normSettings({ start: '2026-10-01', opts: { trig: [{ id: 'u_work', t: 'Work stress' }], did: [] } });
  const when = ['late', 'lonely', 'bored', 'stress', 'tired', 'scroll', 'other', 'u_work', 'u_gone', null].map((t) => [t, srWhen(t)]);
  Store.settings = st0;
  return { RK_CARDS, RK_WAIT, RT_Q, SR_GENERIC, RK_STEPS, tell, when,
    lower: ['Put my phone away.', 'I will text Sam!', '  ', 'Walk'].map((x) => [x, lowerFirst(x)]),
  };
});
writeFileSync(join(outDir, 'rekindle-words.json'), JSON.stringify(words));

/* the tools' words that come from functions reading the Store */
const toolWords = await page.evaluate(() => {
  const st0 = Store.settings;
  const at = (o) => { Store.settings = normSettings(Object.assign({ start: '2026-10-01' }, o)); };
  at({}); const t0 = messageTexts(), b0 = bedPlans();
  at({ safePerson: 'Sam', note: 'It passes.' }); const t1 = messageTexts(), b1 = bedPlans();
  Store.settings = st0;
  const cu = [];
  for (const b of [null, 'chest', 'all', 'unsure']) for (const f of [null, 'tight', 'else']) cu.push([b, f, cuLine({ body: b, feel: f })]);
  const reasons = ['Being fully present with my wife', 'Clear mornings and steady energy', 'Becoming someone I am proud of', 'Running a marathon'].map((t) => [t, reasonGuess(t).id]);
  return { texts: [t0, t1], bed: [b0, b1], cu, reasons };
});
writeFileSync(join(outDir, 'tools-words.json'), JSON.stringify(toolWords));

/* setup suggestions and setup answers */
const setup = await page.evaluate(() => {
  const F = ['f0', 'f1', 'f2', 'f3', 'f4'], Y = ['y0', 'y1', 'y2', 'y3'], TR = ['t0', 't1', 't2'], A = ['quit', 'less', 'nights', 'learn', undefined];
  const out = [];
  for (const freq of F) for (const years of Y) for (const tried of TR) for (const aim of A) for (const when of [[], ['late'], ['bored']]) {
    const a = { freq, years, tried, aim, when };
    out.push({ a, s: obSuggest(a) });
  }
  return out;
});
writeFileSync(join(outDir, 'setup.json'), JSON.stringify(setup));

await browser.close();
if (errors.length) { console.error('page errors:', errors); process.exit(1); }
console.log(`fixtures: ${S.length} logs, ${n} moments, 30 emblems, ${setup.length} setup answers`);
