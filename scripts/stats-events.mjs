/* What Daybook learns, read back for the owner (the Stats workflow; docs/plan.md, "How the owner gets it back"). Runs a fixed
   set of Athena queries over the events (core events.ts; table daybook_events.events, workgroup daybook-events, made by
   infra/bootstrap/events.tf) and prints the answers as Markdown tables for the run's summary page.

   It leads with the week (#19 in docs/plan.md): the two north-star numbers (how free people see themselves, and urges ridden
   out against slips), then setup, who stays on day 1, 7 and 30, the tools used and whether the urge passed after SOS, each
   against the week before, as plain lines that read in the workflow log. The Stats workflow runs it every Monday.

   Then each query answers one question the owner asked: where people leave, where setup loses them, which screens, tabs and
   charts are used, which tools and lessons help, the way from first open to the first comeback after a slip (#22), whether
   reminders work, by kind and hour, what a tap led to, and a slip in the hour after a note at night (#20), the word tests
   (#24, core ab.ts), who stays, whether Daybook is working, and what earns. A line under "What this suggests" is said only
   where it rests on MIN people or more, and a word test names a winner only once each arm has AB_MIN. The workgroup stops any
   query at 1 GB.

   Usage (with the stats role's AWS credentials): node scripts/stats-events.mjs [days]   (days: how far back; default 90) */
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);
const DAYS = Math.max(1, Math.min(730, parseInt(process.argv[2] || '90', 10) || 90));
const WG = 'daybook-events';
const DB = 'daybook_events';
/** the fewest people a line under "What this suggests" may rest on */
const MIN = 10;
const ago = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const FROM = ago(DAYS);
const QUIET = ago(14);
/* the week: the last 7 days of arrivals, and the 7 before */
const T7 = ago(7);
const T14 = ago(14);

const aws = async (...args) => JSON.parse((await run('aws', [...args, '--output', 'json'], { maxBuffer: 64 << 20 })).stdout || '{}');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** one query: its rows as objects (every value a string, or null) */
async function q(sql) {
  const { QueryExecutionId: id } = await aws(
    'athena',
    'start-query-execution',
    '--work-group',
    WG,
    '--query-execution-context',
    `Database=${DB}`,
    '--query-string',
    sql,
  );
  for (let t = 0; ; t++) {
    const x = await aws('athena', 'get-query-execution', '--query-execution-id', id);
    const st = x.QueryExecution.Status.State;
    if (st === 'SUCCEEDED') break;
    if (st === 'FAILED' || st === 'CANCELLED') throw new Error(x.QueryExecution.Status.StateChangeReason || st);
    if (t > 120) throw new Error('timed out');
    await sleep(1000);
  }
  const rows = [];
  let next;
  do {
    const r = await aws('athena', 'get-query-results', '--query-execution-id', id, ...(next ? ['--next-token', next] : []));
    rows.push(...r.ResultSet.Rows.map((row) => row.Data.map((d) => (d.VarCharValue === undefined ? null : d.VarCharValue))));
    next = r.NextToken;
  } while (next);
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

/** a Markdown table; cols: [key, heading] */
function table(rows, cols) {
  if (!rows.length) return '_Nothing yet._\n';
  const out = ['| ' + cols.map((c) => c[1]).join(' | ') + ' |', '|' + cols.map(() => ' --- |').join('')];
  for (const r of rows) out.push('| ' + cols.map((c) => fmt(r[c[0]])).join(' | ') + ' |');
  return out.join('\n') + '\n';
}
function fmt(v) {
  if (v == null) return '';
  const n = Number(v);
  return Number.isFinite(n) && String(v).trim() !== '' ? (Number.isInteger(n) ? String(n) : n.toFixed(2)) : String(v);
}
const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '');
const W = `dt >= '${FROM}'`;
const P = (k) => `json_extract_scalar(p, '$.${k}')`;

/* the screens there are (core EV_ROUTES), to name the ones no one opened */
let ROUTES = [];
try {
  const src = readFileSync(new URL('../packages/core/src/events.ts', import.meta.url), 'utf8');
  const m = src.match(/EV_ROUTES = \[([\s\S]*?)\] as const/);
  if (m) ROUTES = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).filter((r) => r !== 'other');
} catch {
  /* no source: the list is left out */
}
/* the people each arm of a word test needs before a winner is named (core ab.ts) */
let AB_MIN = 30;
try {
  const m = readFileSync(new URL('../packages/core/src/ab.ts', import.meta.url), 'utf8').match(/AB_MIN = (\d+)/);
  if (m) AB_MIN = Number(m[1]);
} catch {
  /* no source: 30 */
}

/* an event's hour counted from install: the phone's day starts at 4 AM (events.ts), so an hour before 4 belongs to the
   calendar day after the Daybook day it is on */
const HRS = (t = '') => `(${t}d * 24 + CASE WHEN ${t}h < 4 THEN ${t}h + 24 ELSE ${t}h END)`;
/* night, as the notes use it: 10 PM to 7 AM (core nudges.ts) */
const NIGHT = (x) => `(${x} >= 22 OR ${x} < 7)`;

const say = [];
const lead = [];
/* a part of the report on its own: if its query fails, it says so and the rest still reads */
async function part(name, f) {
  try {
    await f();
  } catch (e) {
    parts.push(`### ${name}\n\nThis part did not read: ${String(e.message || e).slice(0, 300)}\n`);
  }
}
const parts = [];
const section = (h, body) => parts.push(`### ${h}\n\n${body}`);

/* the week (#19): plain lines, this week against the one before */
async function week() {
  const out = [];
  const vs = (a, b, f = (x) => x) => (b == null || b === '' ? f(a) : `${f(a)} (the week before: ${f(b)})`);
  const n0 = (x) => Number(x || 0);

  /* 1. how free people see themselves: each phone seen that week, its latest answer up to the end of it */
  const star = async (from, to) => {
    const [r] = await q(`
      WITH a AS (SELECT DISTINCT i FROM events WHERE dt >= '${from}' AND dt < '${to}'),
        f AS (SELECT i, max_by(CAST(${P('free')} AS double), k) AS free FROM events WHERE ${W} AND dt < '${to}' AND n = 'free' GROUP BY i)
      SELECT count(*) AS people, avg(f.free) AS free FROM f JOIN a ON a.i = f.i`);
    return r || {};
  };
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [s1, s0] = [await star(T7, tomorrow), await star(T14, T7)];
  const freeLine = (r) => (n0(r.people) ? `${fmt(r.free)} of 10 (${r.people} ${n0(r.people) === 1 ? 'person' : 'people'})` : 'no answers yet');

  /* 2. urges ridden out against slips, logged that week */
  const rs = await q(`
    SELECT CASE WHEN dt >= '${T7}' THEN 'now' ELSE 'before' END AS wk, count_if(n = 'urge' AND ${P('outcome')} = 'rode') AS rode,
      count_if(n = 'slip') AS slips, count(DISTINCT i) AS phones
    FROM events WHERE dt >= '${T14}' GROUP BY 1`);
  const r1 = rs.find((r) => r.wk === 'now') || {};
  const r0 = rs.find((r) => r.wk === 'before') || {};
  const per = (r) => (n0(r.slips) ? (n0(r.rode) / n0(r.slips)).toFixed(1) + ' for every slip' : n0(r.rode) ? 'no slips' : 'nothing logged');
  const rideLine = (r) => `${n0(r.rode)} ridden out, ${n0(r.slips)} slips (${per(r)}), from ${n0(r.phones)} phones`;

  out.push(
    '**The north star**',
    '',
    `- How free people see themselves (each phone's latest answer, 0 to 10): ${vs(freeLine(s1), freeLine(s0))}`,
    `- Urges ridden out against slips: ${vs(rideLine(r1), rideLine(r0))}`,
    '',
  );

  /* 3. setup: who started it this week, who finished, and the page the rest stopped on */
  const [su] = await q(`
    SELECT count(DISTINCT CASE WHEN n = 'setup_page' AND dt >= '${T7}' THEN i END) AS started, count(DISTINCT CASE WHEN n = 'setup_done' AND dt >= '${T7}' THEN i END) AS done,
      count(DISTINCT CASE WHEN n = 'setup_page' AND dt < '${T7}' THEN i END) AS started0, count(DISTINCT CASE WHEN n = 'setup_done' AND dt < '${T7}' THEN i END) AS done0
    FROM events WHERE dt >= '${T14}' AND n IN ('setup_page', 'setup_done')`);
  const stuck = await q(`
    WITH s AS (SELECT i, max_by(${P('page')}, k) AS page, count_if(n = 'setup_done') AS done FROM events
      WHERE dt >= '${T7}' AND n IN ('setup_page', 'setup_done') GROUP BY i)
    SELECT page, count(*) AS people FROM s WHERE done = 0 AND page IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 3`);
  const setupLine = (a, b) => `${n0(a)} started, ${n0(b)} finished${n0(a) ? ' (' + pct(n0(b), n0(a)) + ')' : ''}`;
  out.push(
    '**Then**',
    '',
    `- Setup: ${vs(setupLine(su?.started, su?.done), setupLine(su?.started0, su?.done0))}` +
      (stuck.length ? `. Stopped on: ${stuck.map((r) => `${r.page} (${r.people})`).join(', ')}` : ''),
  );

  /* 4. who stays: of the phones whose first day was seen, the share that opened Daybook on day 1, in days 7 to 13, and in
     days 30 to 36, among those installed long enough ago to have had the chance */
  const [ret] = await q(`
    WITH x AS (SELECT i, min(date_add('day', -d, date(dt))) AS inst, min(d) AS d0, max(CASE WHEN d = 1 THEN 1 ELSE 0 END) AS r1,
        max(CASE WHEN d BETWEEN 7 AND 13 THEN 1 ELSE 0 END) AS r7, max(CASE WHEN d BETWEEN 30 AND 36 THEN 1 ELSE 0 END) AS r30
      FROM events WHERE ${W} GROUP BY i)
    SELECT count_if(inst <= date_add('day', -2, current_date)) AS n1, count_if(inst <= date_add('day', -2, current_date) AND r1 = 1) AS k1,
      count_if(inst <= date_add('day', -14, current_date)) AS n7, count_if(inst <= date_add('day', -14, current_date) AND r7 = 1) AS k7,
      count_if(inst <= date_add('day', -37, current_date)) AS n30, count_if(inst <= date_add('day', -37, current_date) AND r30 = 1) AS k30
    FROM x WHERE d0 = 0`);
  const keep = (k, n) => (n0(n) ? `${pct(n0(k), n0(n))} (${n0(k)} of ${n0(n)})` : 'too new to tell');
  out.push(`- Who stays: day 1 ${keep(ret?.k1, ret?.n1)}; day 7 ${keep(ret?.k7, ret?.n7)}; day 30 ${keep(ret?.k30, ret?.n30)}`);

  /* 5. the tools used this week: tried in SOS, or opened on their own */
  const tools = await q(`
    SELECT ${P('tool')} AS tool, count(*) AS uses, count(DISTINCT i) AS people FROM events WHERE dt >= '${T7}' AND n IN ('sos_tool', 'tool_open')
    GROUP BY 1 ORDER BY uses DESC LIMIT 6`);
  out.push(
    `- Tools used: ${tools.length ? tools.map((r) => `${r.tool} ${r.uses} (${r.people} ${n0(r.people) === 1 ? 'person' : 'people'})`).join(', ') : 'none this week'}`,
  );

  /* 6. SOS: whether the urge passed */
  const sos = await q(`
    SELECT CASE WHEN dt >= '${T7}' THEN 'now' ELSE 'before' END AS wk, count_if(n = 'sos_open') AS opened,
      count_if(n = 'sos_end' AND ${P('outcome')} = 'rode') AS passed, count_if(n = 'sos_end' AND ${P('outcome')} = 'slipped') AS slipped
    FROM events WHERE dt >= '${T14}' AND n IN ('sos_open', 'sos_end') GROUP BY 1`);
  const o1 = sos.find((r) => r.wk === 'now') || {};
  const o0 = sos.find((r) => r.wk === 'before') || {};
  const sosLine = (r) =>
    n0(r.opened)
      ? `${n0(r.opened)} opened, the urge passed in ${n0(r.passed)} (${pct(n0(r.passed), n0(r.opened))}), ${n0(r.slipped)} ended in a slip`
      : 'not opened';
  out.push(`- SOS: ${vs(sosLine(o1), n0(o0.opened) ? sosLine(o0) : '')}`, '');
  return out.join('\n');
}

async function main() {
  try {
    lead.push(`## This week (${T7} to today), against the week before\n\n${await week()}\n`);
  } catch (e) {
    lead.push(`## This week\n\nThe week did not read: ${String(e.message || e).slice(0, 300)}\n`);
  }
  const [all] = await q(
    `SELECT count(DISTINCT i) AS phones, count(*) AS events, count(DISTINCT CASE WHEN d = 0 THEN i END) AS new_phones FROM events WHERE ${W}`,
  );
  section(
    `In the last ${DAYS} days`,
    table(
      [all],
      [
        ['phones', 'Phones'],
        ['new_phones', 'New this period'],
        ['events', 'Events'],
      ],
    ),
  );
  if (!Number(all.phones)) return;

  /* where people leave for good: each phone's last screen, for phones not seen in 14 days */
  const quit = await q(`
    WITH last AS (SELECT i, max_by(${P('route')}, k) AS route, max(dt) AS lastday FROM events WHERE ${W} AND n IN ('leave', 'screen') GROUP BY i)
    SELECT route, count(*) AS people FROM last WHERE lastday < '${QUIET}' GROUP BY route ORDER BY people DESC LIMIT 15`);
  section(
    'Where people left and did not come back (last screen, not seen for 14 days)',
    table(quit, [
      ['route', 'Screen'],
      ['people', 'People'],
    ]),
  );
  if (quit[0]?.route && Number(quit[0].people) >= MIN) say.push(`Most people who stopped left from **${quit[0].route}**. Look there first.`);

  /* setup, page by page */
  const setup = await q(`
    SELECT ${P('page')} AS page, count(DISTINCT CASE WHEN n = 'setup_page' THEN i END) AS reached, count(DISTINCT CASE WHEN n = 'setup_skip' THEN i END) AS skipped,
      min(k) AS k0
    FROM events WHERE ${W} AND n IN ('setup_page', 'setup_skip') GROUP BY 1 ORDER BY reached DESC, k0`);
  const [done] = await q(`SELECT count(DISTINCT i) AS n FROM events WHERE ${W} AND n = 'setup_done'`);
  let drop = null;
  setup.forEach((r, j) => {
    const nx = setup[j + 1];
    r.lost = nx ? Number(r.reached) - Number(nx.reached) : Number(r.reached) - Number(done.n);
    if (Number(r.reached) >= MIN && (!drop || r.lost > drop.lost)) drop = r;
  });
  section(
    `Setup, page by page (${done.n} finished)`,
    table(setup, [
      ['page', 'Page'],
      ['reached', 'Reached'],
      ['lost', 'Lost before the next'],
      ['skipped', 'Skipped'],
    ]),
  );
  if (drop && drop.lost > 0) say.push(`Setup loses the most people on **${drop.page}** (${drop.lost} of ${drop.reached}).`);

  /* the way in (#22): phones whose first day was seen, from first open to setup done, the first lesson finished, the first
     urge ridden out, and the first comeback after a slip (all three flames lit; counted from the builds of November 12, 2026).
     "In order" counts a phone at a step only once it reached every step before; a comeback also needs a slip. */
  await part('The way in', async () => {
    const [fn] = await q(`
    WITH f AS (SELECT i, min(d) AS d0,
        min(CASE WHEN n = 'setup_done' THEN d END) AS ds, min(CASE WHEN n = 'lesson_done' THEN d END) AS dl,
        min(CASE WHEN n = 'urge' AND ${P('outcome')} = 'rode' THEN d END) AS dr, min(CASE WHEN n = 'slip' THEN d END) AS dx,
        min(CASE WHEN n = 'comeback' THEN d END) AS dc
      FROM events WHERE ${W} GROUP BY i)
    SELECT count(*) AS opened, count(ds) AS setup, count(dl) AS lesson, count(dr) AS rode, count(dx) AS slipped, count_if(dx IS NOT NULL AND dc IS NOT NULL) AS back,
      count_if(ds IS NOT NULL AND dl IS NOT NULL) AS lesson_o, count_if(ds IS NOT NULL AND dl IS NOT NULL AND dr IS NOT NULL) AS rode_o,
      count_if(ds IS NOT NULL AND dl IS NOT NULL AND dr IS NOT NULL AND dx IS NOT NULL) AS slipped_o,
      count_if(ds IS NOT NULL AND dl IS NOT NULL AND dr IS NOT NULL AND dx IS NOT NULL AND dc IS NOT NULL) AS back_o,
      approx_percentile(ds, 0.5) AS ds_med, approx_percentile(dl, 0.5) AS dl_med, approx_percentile(dr, 0.5) AS dr_med, approx_percentile(dc, 0.5) AS dc_med
    FROM f WHERE d0 = 0`);
    if (fn && Number(fn.opened)) {
      const N = (x) => Number(x || 0);
      const steps = [
        { step: 'First open', at_all: N(fn.opened), in_order: N(fn.opened), prev: null, day: 0 },
        { step: 'Setup done', at_all: N(fn.setup), in_order: N(fn.setup), prev: N(fn.opened), day: fn.ds_med },
        { step: 'First lesson finished', at_all: N(fn.lesson), in_order: N(fn.lesson_o), prev: N(fn.setup), day: fn.dl_med },
        { step: 'First urge ridden out', at_all: N(fn.rode), in_order: N(fn.rode_o), prev: N(fn.lesson_o), day: fn.dr_med },
        { step: 'First comeback after a slip', at_all: N(fn.back), in_order: N(fn.back_o), prev: N(fn.slipped_o), day: fn.dc_med },
      ];
      for (const r of steps) r.of_prev = r.prev == null ? '' : pct(r.in_order, r.prev);
      section(
        `The way in: first open to the first comeback (${fn.opened} phones whose first day was seen)`,
        table(steps, [
          ['step', 'Step'],
          ['in_order', 'Reached, in order'],
          ['of_prev', 'Of the step before'],
          ['at_all', 'Reached at all'],
          ['day', 'Usually on day'],
        ]) +
          `\nOf ${fn.slipped} phones that slipped, ${fn.back} came back (all three flames lit). A comeback before the step above it was reached counts only under "at all".\n`,
      );
      let worst = null;
      for (const r of steps.slice(1)) if (r.prev >= MIN && (!worst || r.in_order / r.prev < worst.in_order / worst.prev)) worst = r;
      if (worst) say.push(`On the way in, the most people are lost before **${worst.step.toLowerCase()}** (${worst.of_prev} of those who got that far).`);
    }
  });

  /* screens and tabs: who opens them, and how long they stay */
  const screens = await q(`
    SELECT ${P('route')} AS route, count(DISTINCT i) AS people, count(*) AS opens FROM events WHERE ${W} AND n = 'screen' GROUP BY 1 ORDER BY people DESC`);
  const time = await q(`
    SELECT ${P('route')} AS route, approx_percentile(CAST(${P('secs')} AS integer), 0.5) AS median_secs FROM events WHERE ${W} AND n = 'screen_left' GROUP BY 1`);
  const med = Object.fromEntries(time.map((r) => [r.route, r.median_secs]));
  for (const r of screens) {
    r.median_secs = med[r.route];
    r.share = pct(Number(r.people), Number(all.phones));
  }
  section(
    'Screens and tabs',
    table(screens, [
      ['route', 'Screen'],
      ['people', 'People'],
      ['share', 'Of all phones'],
      ['opens', 'Opens'],
      ['median_secs', 'Median seconds on it'],
    ]),
  );
  const seen = new Set(screens.map((r) => r.route));
  const never = ROUTES.filter((r) => !seen.has(r));
  if (never.length) parts.push(`Screens no one opened: ${never.join(', ')}.\n`);
  for (const tab of ['learn', 'pattern', 'more']) {
    const r = screens.find((x) => x.route === tab);
    if (Number(all.phones) >= MIN && (!r || Number(r.people) / Number(all.phones) < 0.25))
      say.push(`Few people open **${tab}** (${r ? r.share : '0%'} of phones).`);
  }

  /* charts */
  const charts = await q(`
    SELECT ${P('chart')} AS chart, count(DISTINCT i) AS people, count(*) AS views, approx_percentile(CAST(${P('secs')} AS integer), 0.5) AS median_secs,
      count_if(${P('locked')} = 'true') AS locked_views
    FROM events WHERE ${W} AND n = 'chart_seen' GROUP BY 1 ORDER BY people DESC`);
  section(
    'Charts: are they looked at?',
    table(charts, [
      ['chart', 'Chart'],
      ['people', 'People'],
      ['views', 'Views'],
      ['median_secs', 'Median seconds'],
      ['locked_views', 'Views while locked'],
    ]),
  );
  const short = charts.filter((r) => Number(r.people) >= MIN && Number(r.median_secs) < 2);
  if (short.length)
    say.push(
      `People pass these charts in under 2 seconds: ${short.map((r) => '**' + r.chart + '**').join(', ')}. They may not read in two seconds, or may not matter.`,
    );

  /* tools in SOS: what came after each */
  const tools = await q(`
    SELECT ${P('tool')} AS tool, count(*) AS tried, count_if(${P('outcome')} = 'rode') AS passed, count_if(${P('outcome')} = 'strong') AS still_strong,
      count_if(${P('outcome')} = 'slipped') AS slipped, count(DISTINCT i) AS people
    FROM events WHERE ${W} AND n = 'sos_tool' GROUP BY 1 ORDER BY tried DESC`);
  for (const r of tools) r.rate = pct(Number(r.passed), Number(r.tried));
  section(
    'Tools in SOS: did the urge pass after it?',
    table(tools, [
      ['tool', 'Tool'],
      ['tried', 'Tried'],
      ['people', 'People'],
      ['passed', 'Passed after'],
      ['still_strong', 'Still strong'],
      ['slipped', 'Slipped'],
      ['rate', 'Passed'],
    ]),
  );
  const fair = tools.filter((r) => Number(r.people) >= MIN).sort((a, b) => Number(b.passed) / Number(b.tried) - Number(a.passed) / Number(a.tried));
  if (fair.length >= 2)
    say.push(`In SOS, **${fair[0].tool}** helps most (${fair[0].rate} passed) and **${fair[fair.length - 1].tool}** least (${fair[fair.length - 1].rate}).`);

  /* tools outside SOS: the next urge or slip, the same day */
  const after = await q(`
    WITH s AS (SELECT i, d, n, ${P('tool')} AS tool, lead(n) OVER (PARTITION BY i ORDER BY k) AS nxt, lead(d) OVER (PARTITION BY i ORDER BY k) AS nd
      FROM events WHERE ${W} AND n IN ('tool_done', 'urge', 'slip'))
    SELECT tool, count(*) AS finished, count_if(nxt = 'urge' AND nd = d) AS urge_passed_same_day, count_if(nxt = 'slip' AND nd = d) AS slip_same_day
    FROM s WHERE n = 'tool_done' GROUP BY tool ORDER BY finished DESC`);
  section(
    'Tools finished: what came next that day',
    table(after, [
      ['tool', 'Tool'],
      ['finished', 'Finished'],
      ['urge_passed_same_day', 'Next was an urge that passed'],
      ['slip_same_day', 'Next was a slip'],
    ]),
  );

  /* SOS overall */
  const [sos] = await q(`
    SELECT count(*) AS opened, (SELECT count(*) FROM events WHERE ${W} AND n = 'sos_end' AND ${P('outcome')} = 'rode') AS passed,
      (SELECT count(*) FROM events WHERE ${W} AND n = 'sos_end' AND ${P('outcome')} = 'slipped') AS slipped
    FROM events WHERE ${W} AND n = 'sos_open'`);
  section(
    'SOS',
    table(
      [sos],
      [
        ['opened', 'Opened'],
        ['passed', 'Ended: it passed'],
        ['slipped', 'Ended: slipped'],
      ],
    ),
  );

  /* lessons: finished, left early, and slips the week after */
  const lessons = await q(`
    WITH done AS (SELECT i, ${P('lesson')} AS lesson, min(d) AS d FROM events WHERE ${W} AND n = 'lesson_done' GROUP BY 1, 2),
      sl AS (SELECT i, d FROM events WHERE ${W} AND n = 'slip'),
      week AS (SELECT lesson, count(DISTINCT done.i) AS finished, count(sl.i) AS slips FROM done LEFT JOIN sl ON sl.i = done.i AND sl.d BETWEEN done.d + 1 AND done.d + 7 GROUP BY lesson),
      op AS (SELECT ${P('lesson')} AS lesson, count(DISTINCT i) AS opened FROM events WHERE ${W} AND n = 'lesson_open' GROUP BY 1),
      lf AS (SELECT ${P('lesson')} AS lesson, count(DISTINCT i) AS left_early, approx_percentile(CAST(${P('beat')} AS integer), 0.5) AS left_at FROM events WHERE ${W} AND n = 'lesson_left' GROUP BY 1)
    SELECT op.lesson, op.opened, coalesce(week.finished, 0) AS finished, coalesce(lf.left_early, 0) AS left_early, lf.left_at,
      CASE WHEN week.finished > 0 THEN CAST(week.slips AS double) / week.finished END AS slips_next_week
    FROM op LEFT JOIN week ON week.lesson = op.lesson LEFT JOIN lf ON lf.lesson = op.lesson ORDER BY op.opened DESC`);
  const [base] = await q(`
    SELECT CAST(count_if(n = 'slip') AS double) / nullif(count(DISTINCT CASE WHEN n = 'day' THEN i || '#' || CAST(d / 7 AS varchar) END), 0) AS per_week
    FROM events WHERE ${W}`);
  section(
    `Lessons (slips per person in the week after, against ${fmt(base?.per_week) || '?'} slips a person-week overall)`,
    table(lessons, [
      ['lesson', 'Lesson'],
      ['opened', 'Opened'],
      ['finished', 'Finished'],
      ['left_early', 'Left early'],
      ['left_at', 'Usually left at part'],
      ['slips_next_week', 'Slips the week after'],
    ]),
  );
  const leaky = lessons.filter((r) => Number(r.opened) >= MIN && Number(r.left_early) / Number(r.opened) > 0.4);
  if (leaky.length) say.push(`Many people leave these lessons before the end: ${leaky.map((r) => `**${r.lesson}** (part ${r.left_at})`).join(', ')}.`);

  /* reminders */
  const nudges = await q(`
    SELECT ${P('kind')} AS kind, count_if(n = 'nudge') AS arrived, count_if(n = 'nudge_tap') AS opened, count_if(n = 'nudge_did') AS did
    FROM events WHERE ${W} AND n IN ('nudge', 'nudge_tap', 'nudge_did') GROUP BY 1 ORDER BY arrived DESC`);
  for (const r of nudges) {
    r.open_rate = pct(Number(r.opened), Number(r.arrived));
    r.did_rate = pct(Number(r.did), Number(r.arrived));
  }
  section(
    'Reminders',
    table(nudges, [
      ['kind', 'Kind'],
      ['arrived', 'Arrived'],
      ['opened', 'Opened from it'],
      ['open_rate', 'Open rate'],
      ['did', 'Did what it was for'],
      ['did_rate', 'Did rate'],
    ]),
  );

  /* reminders by the hour they came (nh, from the builds of November 12, 2026): delivered and opened from */
  await part('Reminders by the hour', async () => {
    const byHour = await q(`
    SELECT ${P('kind')} AS kind, CAST(${P('nh')} AS integer) AS hr, count_if(n = 'nudge') AS arrived, count_if(n = 'nudge_tap') AS opened
    FROM events WHERE ${W} AND n IN ('nudge', 'nudge_tap') AND ${P('nh')} IS NOT NULL GROUP BY 1, 2 ORDER BY 1, 2`);
    for (const r of byHour) {
      r.hour = String(r.hr).padStart(2, '0') + ':00';
      r.open_rate = pct(Number(r.opened), Number(r.arrived));
    }
    section(
      'Reminders by the hour they came: opened from them',
      table(byHour, [
        ['kind', 'Kind'],
        ['hour', 'Hour'],
        ['arrived', 'Arrived'],
        ['opened', 'Opened from it'],
        ['open_rate', 'Open rate'],
      ]),
    );
  });

  /* what a tap led to: the first lesson opened, SOS opened, or the app left, after it */
  await part('What a tap led to', async () => {
    const led = await q(`
    WITH t AS (SELECT i, k, ${P('kind')} AS kind FROM events WHERE ${W} AND n = 'nudge_tap'),
      x AS (SELECT t.i, t.k, t.kind, min_by(e.n, e.k) AS nxt FROM t LEFT JOIN events e
        ON e.i = t.i AND e.k > t.k AND e.dt >= '${FROM}' AND e.n IN ('lesson_open', 'sos_open', 'leave') GROUP BY t.i, t.k, t.kind)
    SELECT kind, count(*) AS taps, count_if(nxt = 'lesson_open') AS lesson, count_if(nxt = 'sos_open') AS sos FROM x GROUP BY kind ORDER BY taps DESC`);
    for (const r of led) {
      r.lesson_rate = pct(Number(r.lesson), Number(r.taps));
      r.sos_rate = pct(Number(r.sos), Number(r.taps));
    }
    section(
      'What a tap on a reminder led to (before the app was left)',
      table(led, [
        ['kind', 'Kind'],
        ['taps', 'Taps'],
        ['lesson', 'A lesson'],
        ['lesson_rate', 'Lesson rate'],
        ['sos', 'SOS'],
        ['sos_rate', 'SOS rate'],
      ]),
    );
  });

  /* harm: a slip in the hour after a note, at night (10 PM to 7 AM) against the day. The phone says so on the slip itself
     (after, nh), from the notes it saw delivered; never a time. */
  await part('Harm', async () => {
    const harm = await q(`
    WITH x AS (SELECT n, i, coalesce(${P('kind')}, ${P('after')}) AS kind, CAST(${P('nh')} AS integer) AS hr FROM events
      WHERE ${W} AND ${P('nh')} IS NOT NULL AND (n = 'nudge' OR (n = 'slip' AND ${P('after')} IS NOT NULL)))
    SELECT CASE WHEN ${NIGHT('hr')} THEN 'night' ELSE 'day' END AS part, kind, count_if(n = 'nudge') AS notes, count_if(n = 'slip') AS slips,
      count(DISTINCT CASE WHEN n = 'slip' THEN i END) AS people
    FROM x GROUP BY 1, 2 ORDER BY 1 DESC, notes DESC`);
    for (const r of harm) r.rate = pct(Number(r.slips), Number(r.notes));
    section(
      'Harm: a slip within the hour after a reminder (night is 10 PM to 7 AM)',
      table(harm, [
        ['part', 'When it came'],
        ['kind', 'Kind'],
        ['notes', 'Notes'],
        ['slips', 'Slip within the hour'],
        ['people', 'People'],
        ['rate', 'Rate'],
      ]),
    );
    const tot = (part) =>
      harm
        .filter((r) => r.part === part)
        .reduce((a, r) => ({ notes: a.notes + Number(r.notes), slips: a.slips + Number(r.slips), people: a.people + Number(r.people) }), {
          notes: 0,
          slips: 0,
          people: 0,
        });
    const [hn, hd] = [tot('night'), tot('day')];
    if (hn.people >= MIN && hd.notes && hn.slips / hn.notes > (2 * hd.slips) / hd.notes)
      say.push(
        `A slip follows a night note within the hour more than twice as often as a day note (${pct(hn.slips, hn.notes)} against ${pct(hd.slips, hd.notes)}). Look at the night notes first.`,
      );
  });

  /* word tests (#24, core ab.ts): each phone's first time shown, and whether it logged again (an urge, a slip or a check-in)
     within 24 and 72 hours. Only phones whose first showing is old enough to have had the chance count for each. */
  await part('Word tests', async () => {
    const ab = await q(`
    WITH x AS (SELECT i, ${P('test')} AS test, min_by(${P('arm')}, k) AS arm, min(k) AS k0, min_by(${HRS()}, k) AS t0, min(dt) AS dt0
        FROM events WHERE ${W} AND n = 'ab' GROUP BY i, ${P('test')}),
      l AS (SELECT i, k, ${HRS()} AS t FROM events WHERE ${W} AND n IN ('urge', 'slip', 'checkin')),
      y AS (SELECT x.i, x.test, x.arm, x.dt0, min(l.t - x.t0) AS gap FROM x LEFT JOIN l ON l.i = x.i AND l.k > x.k0 GROUP BY x.i, x.test, x.arm, x.dt0)
    SELECT test, arm, count(*) AS people,
      count_if(dt0 <= '${ago(2)}') AS n24, count_if(dt0 <= '${ago(2)}' AND gap <= 24) AS k24,
      count_if(dt0 <= '${ago(4)}') AS n72, count_if(dt0 <= '${ago(4)}' AND gap <= 72) AS k72
    FROM y GROUP BY 1, 2 ORDER BY 1, 2`);
    for (const r of ab) {
      r.in24 = `${r.k24} of ${r.n24} (${pct(Number(r.k24), Number(r.n24)) || '?'})`;
      r.in72 = `${r.k72} of ${r.n72} (${pct(Number(r.k72), Number(r.n72)) || '?'})`;
    }
    let verdict = '';
    for (const test of [...new Set(ab.map((r) => r.test))]) {
      const a = ab.find((r) => r.test === test && r.arm === 'a');
      const b = ab.find((r) => r.test === test && r.arm === 'b');
      const na = Number(a?.n72 || 0);
      const nb = Number(b?.n72 || 0);
      if (na < AB_MIN || nb < AB_MIN) {
        verdict += `- ${test}: too few to call yet (each wording needs ${AB_MIN} people 72 hours on; now ${na} and ${nb}).\n`;
        continue;
      }
      /* two proportions: a difference this size or larger would come by chance less than 1 time in 20 */
      const pa = Number(a.k72) / na;
      const pb = Number(b.k72) / nb;
      const pp = (Number(a.k72) + Number(b.k72)) / (na + nb);
      const z = (pb - pa) / Math.sqrt(pp * (1 - pp) * (1 / na + 1 / nb) || 1);
      if (Math.abs(z) >= 1.96) {
        const win = z > 0 ? 'b' : 'a';
        verdict += `- ${test}: wording **${win}** wins (logged again within 72 hours: a ${pct(Number(a.k72), na)}, b ${pct(Number(b.k72), nb)}).\n`;
        say.push(`Word test ${test}: wording ${win} brings more people back to log within 72 hours. Make it the only one.`);
      } else verdict += `- ${test}: no clear difference yet (a ${pct(Number(a.k72), na)}, b ${pct(Number(b.k72), nb)}); keep it running.\n`;
    }
    section(
      'Word tests: which wording brings people back to log (a: the wording before, b: the one tried)',
      table(ab, [
        ['test', 'Test'],
        ['arm', 'Wording'],
        ['people', 'People shown'],
        ['in24', 'Logged again within 24 hours'],
        ['in72', 'Within 72 hours'],
      ]) + (verdict ? '\n' + verdict : ''),
    );
  });

  /* who stays: by week of install, opened on day 1, in days 7 to 13, and in days 30 to 36 (the week's lines use the same), each
     only once the week of install is old enough to have had the chance */
  const ret = await q(`
    WITH x AS (SELECT i, min(date_add('day', -d, date(dt))) AS inst, min(d) AS d0, max(CASE WHEN d = 1 THEN 1 ELSE 0 END) AS r1,
        max(CASE WHEN d BETWEEN 7 AND 13 THEN 1 ELSE 0 END) AS r7, max(CASE WHEN d BETWEEN 30 AND 36 THEN 1 ELSE 0 END) AS r30, max(d) AS maxd
      FROM events WHERE ${W} GROUP BY i)
    SELECT CAST(date_trunc('week', inst) AS varchar) AS week, count(*) AS installs, sum(r1) AS d1, sum(r7) AS d7, sum(r30) AS d30, count_if(maxd >= 90) AS d90,
      date_diff('day', date_trunc('week', inst), current_date) AS age
    FROM x WHERE d0 = 0 GROUP BY 1, date_trunc('week', inst) ORDER BY 1 DESC LIMIT 16`);
  for (const r of ret)
    for (const [k, need] of [
      ['d1', 8],
      ['d7', 20],
      ['d30', 43],
      ['d90', 97],
    ])
      r[k] = Number(r.age) >= need ? `${r[k]} (${pct(Number(r[k]), Number(r.installs))})` : '';
  section(
    'Who stays (by week of install; opened on day 1, in days 7 to 13, in days 30 to 36, and on day 90 or later; empty until the week is old enough)',
    table(ret, [
      ['week', 'Installed in the week of'],
      ['installs', 'Installs'],
      ['d1', 'Day 1'],
      ['d7', 'Day 7'],
      ['d30', 'Day 30'],
      ['d90', 'Day 90+'],
    ]),
  );

  /* is it working: the five questions and slips, by weeks of use */
  const work = await q(`
    SELECT d / 7 AS week, count(DISTINCT i) AS people, CAST(count_if(n = 'slip') AS double) / nullif(count(DISTINCT i), 0) AS slips_per_person
    FROM events WHERE ${W} GROUP BY 1 ORDER BY 1 LIMIT 30`);
  const five = await q(`
    SELECT d / 7 AS week, count(*) AS answers,
      avg(CAST(${P('q1')} AS integer) + CAST(${P('q2')} AS integer) + CAST(${P('q3')} AS integer) + CAST(${P('q4')} AS integer) + CAST(${P('q5')} AS integer)) AS score
    FROM events WHERE ${W} AND n = 'recheck' GROUP BY 1`);
  const byWk = Object.fromEntries(five.map((r) => [r.week, r]));
  for (const r of work) r.five_questions = byWk[r.week] ? `${fmt(byWk[r.week].score)} (${byWk[r.week].answers})` : '';
  section(
    'Is Daybook working? (by weeks since install; five questions: total of the five answers)',
    table(work, [
      ['week', 'Week of use'],
      ['people', 'People'],
      ['slips_per_person', 'Slips per person'],
      ['five_questions', 'Five questions (average)'],
    ]),
  );

  /* the north star (core north.ts): "How much do you see yourself as someone free of this?" by month of use, each phone's first
     answer against its latest, and urges ridden out against slips over the last 30 days (each phone's latest day) */
  const star = await q(`
    SELECT d / 30 AS month, count(DISTINCT i) AS people, avg(CAST(${P('free')} AS double)) AS free_avg,
      avg(CAST(${P('rode30')} AS double)) AS rode30, avg(CAST(${P('slips30')} AS double)) AS slips30
    FROM events WHERE ${W} AND n = 'free' GROUP BY 1 ORDER BY 1 LIMIT 24`);
  const [moved] = await q(`
    WITH x AS (SELECT i, min_by(CAST(${P('free')} AS integer), k) AS a, max_by(CAST(${P('free')} AS integer), k) AS b, count(*) AS n
      FROM events WHERE ${W} AND n = 'free' GROUP BY i)
    SELECT count(*) AS people, count_if(b > a) AS up, count_if(b = a) AS same, count_if(b < a) AS down, avg(CAST(b - a AS double)) AS change
    FROM x WHERE n >= 2`);
  const [ratio] = await q(`
    WITH x AS (SELECT i, max_by(CAST(${P('rode30')} AS integer), k) AS r, max_by(CAST(${P('slips30')} AS integer), k) AS sl
      FROM events WHERE ${W} AND n = 'day' AND ${P('rode30')} IS NOT NULL GROUP BY i)
    SELECT count(*) AS people, avg(CAST(r AS double)) AS rode30, avg(CAST(sl AS double)) AS slips30,
      count_if(r > sl) AS more_ridden, count_if(r = 0 AND sl = 0) AS neither FROM x`);
  section(
    'The north star: do people see themselves as free? (0 to 10, by month of use; and the last 30 days)',
    table(star, [
      ['month', 'Month of use'],
      ['people', 'People'],
      ['free_avg', 'Free (average, 0 to 10)'],
      ['rode30', 'Urges ridden out, 30 days'],
      ['slips30', 'Slips, 30 days'],
    ]) +
      '\n' +
      table(Number(moved?.people) ? [moved] : [], [
        ['people', 'People with two answers or more'],
        ['up', 'Up'],
        ['same', 'Same'],
        ['down', 'Down'],
        ['change', 'Change (average)'],
      ]) +
      '\n' +
      table(Number(ratio?.people) ? [ratio] : [], [
        ['people', 'Phones (latest day)'],
        ['rode30', 'Urges ridden out, 30 days (average)'],
        ['slips30', 'Slips, 30 days (average)'],
        ['more_ridden', 'More ridden out than slips'],
        ['neither', 'Neither logged'],
      ]),
  );
  if (Number(moved?.people) >= MIN)
    say.push(
      `Of ${moved.people} people who answered the north star twice or more, **${moved.up}** see themselves as freer now (average change ${fmt(moved.change)}).`,
    );

  /* what earns */
  const money = await q(`
    SELECT ${P('what')} AS what, count(DISTINCT CASE WHEN n = 'ask' THEN i END) AS shown, count(DISTINCT CASE WHEN n = 'ask_tap' THEN i END) AS tapped
    FROM events WHERE ${W} AND n IN ('ask', 'ask_tap') GROUP BY 1 ORDER BY shown DESC`);
  const bought = await q(`
    SELECT ${P('tier')} AS tier, count(*) AS bought, approx_percentile(d, 0.5) AS median_day FROM events WHERE ${W} AND n = 'bought' GROUP BY 1 ORDER BY bought DESC`);
  section(
    'Asks and tips',
    table(money, [
      ['what', 'Ask'],
      ['shown', 'People shown'],
      ['tapped', 'People who tapped'],
    ]) +
      '\n' +
      table(bought, [
        ['tier', 'Bought'],
        ['bought', 'How many'],
        ['median_day', 'Usually on day'],
      ]),
  );

  const errors = await q(
    `SELECT ${P('err')} AS part, count(*) AS errors, count(DISTINCT i) AS people FROM events WHERE ${W} AND n = 'error' GROUP BY 1 ORDER BY errors DESC`,
  );
  if (errors.length)
    section(
      'Errors',
      table(errors, [
        ['part', 'Part'],
        ['errors', 'Errors'],
        ['people', 'People'],
      ]),
    );
}

try {
  await main();
} catch (e) {
  parts.push(`Could not read the events: ${String(e.message || e).slice(0, 300)}\n`);
}
console.log(`## What Daybook learns\n`);
if (lead.length) console.log(lead.join('\n'));
if (say.length) console.log('### What this suggests\n\n' + say.map((x) => '- ' + x).join('\n') + '\n');
else console.log(`_Nothing to suggest yet: each suggestion waits for ${MIN} people behind it._\n`);
console.log(parts.join('\n'));
