/* What Daybook learns, read back for the owner (the Stats workflow; docs/plan.md, "How the owner gets it back"). Runs a fixed
   set of Athena queries over the events (core events.ts; table daybook_events.events, workgroup daybook-events, made by
   infra/bootstrap/events.tf) and prints the answers as Markdown tables for the run's summary page.

   Each query answers one question the owner asked: where people leave, where setup loses them, which screens, tabs and charts
   are used, which tools and lessons help, whether reminders work, who stays, whether Daybook is working, and what earns. A
   line under "What this suggests" is said only where it rests on MIN people or more. The workgroup stops any query at 1 GB.

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
const FROM = new Date(Date.now() - DAYS * 86400000).toISOString().slice(0, 10);
const QUIET = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

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

const say = [];
const parts = [];
const section = (h, body) => parts.push(`### ${h}\n\n${body}`);

async function main() {
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

  /* who stays: by week of install */
  const ret = await q(`
    WITH x AS (SELECT i, min(date_add('day', -d, date(dt))) AS inst, max(d) AS maxd FROM events WHERE ${W} GROUP BY i)
    SELECT CAST(date_trunc('week', inst) AS varchar) AS week, count(*) AS installs, count_if(maxd >= 1) AS d1, count_if(maxd >= 7) AS d7,
      count_if(maxd >= 30) AS d30, count_if(maxd >= 90) AS d90
    FROM x GROUP BY 1 ORDER BY 1 DESC LIMIT 16`);
  for (const r of ret) for (const k of ['d1', 'd7', 'd30', 'd90']) r[k] = `${r[k]} (${pct(Number(r[k]), Number(r.installs))})`;
  section(
    'Who stays (by week of install; came back on day 1, 7, 30, 90 or later)',
    table(ret, [
      ['week', 'Installed in the week of'],
      ['installs', 'Installs'],
      ['d1', 'Day 1+'],
      ['d7', 'Day 7+'],
      ['d30', 'Day 30+'],
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
if (say.length) console.log('### What this suggests\n\n' + say.map((x) => '- ' + x).join('\n') + '\n');
else console.log(`_Nothing to suggest yet: each suggestion waits for ${MIN} people behind it._\n`);
console.log(parts.join('\n'));
