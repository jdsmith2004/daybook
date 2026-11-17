/* Daybook usage, for the Stats workflow (the owner, November 17, 2026). One Athena query reads every event in the window, its
   answer is fetched as a file (so any number of rows reads quickly), and scripts/stats-lib.mjs builds the whole report from
   it: accounts first, then phones with no account, testers on their own line and out of every other number.

   Then the cross-check: a few of the same numbers are counted again inside Athena, a different way (SQL over the table, not
   the rows read here), and the two must agree. A number that does not match is printed as such.

   Usage (with the stats role's AWS credentials): node scripts/stats-report.mjs [days]
   TESTERS: account keys or install ids (32 hex each, separated by spaces or commas), from the repository variable. */
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';

import { buildReport, dayAdd, parseCsv, prepare } from './stats-lib.mjs';

const run = promisify(execFile);
const DAYS = Math.max(1, Math.min(730, parseInt(process.argv[2] || '90', 10) || 90));
const WG = 'daybook-events';
const DB = 'daybook_events';
const today = new Date().toISOString().slice(0, 10);
const FROM = dayAdd(today, -DAYS);
const testers = String(process.env.TESTERS || '')
  .split(/[\s,]+/)
  .map((x) => x.trim().toLowerCase())
  .filter(Boolean);

const aws = async (...args) => JSON.parse((await run('aws', [...args, '--output', 'json'], { maxBuffer: 256 << 20 })).stdout || '{}');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** one query, waited for: its execution (with where the answer was written) */
async function start(sql) {
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
    if (st === 'SUCCEEDED') return x.QueryExecution;
    if (st === 'FAILED' || st === 'CANCELLED') throw new Error(x.QueryExecution.Status.StateChangeReason || st);
    if (t > 300) throw new Error('timed out');
    await sleep(1000);
  }
}
/** a query's rows, read from its answer file */
async function rowsOf(sql) {
  const x = await start(sql);
  const { stdout } = await run('aws', ['s3', 'cp', x.ResultConfiguration.OutputLocation, '-'], { maxBuffer: 1 << 30 });
  return parseCsv(stdout);
}

/* what the list says (core), read from the source so the report never falls behind it */
const src = (f) => readFileSync(new URL('../packages/core/src/' + f, import.meta.url), 'utf8');
const names = (() => {
  const m = src('events.ts').match(/EV_NAMES = \{([\s\S]*?)\} as const/);
  return m ? [...m[1].matchAll(/^\s+([a-z_0-9]+):/gm)].map((x) => x[1]) : [];
})();
const pages = (() => {
  const m = src('setup.ts').match(/export const OB_PAGES[^=]*= \[([\s\S]*?)\n\];/);
  return m ? [...m[1].matchAll(/\{ id: '([a-z_0-9]+)'/g)].map((x) => x[1]) : [];
})();

async function main() {
  const rows = await rowsOf(`SELECT dt, i, pf, v, k, n, d, h, p FROM events WHERE dt >= '${FROM}'`);
  const { md } = buildReport(rows, { today, testers, names, pages });
  console.log(md);

  /* ---------- the cross-check ---------- */
  const out = ['### Cross-check', '', 'The same numbers counted a second way, inside Athena (SQL over the table), against the rows this report read.', ''];
  const lines = [];
  const check = (what, mine, theirs) => lines.push({ what, mine, theirs, ok: String(mine) === String(theirs) });
  try {
    const { evs, phones, raw } = prepare(rows, { testers });
    const [t] = await rowsOf(
      `SELECT count(*) AS n, count(DISTINCT i) AS phones, count(DISTINCT concat(i, '#', cast(k AS varchar))) AS uniq FROM events WHERE dt >= '${FROM}'`,
    );
    check('Rows in the window', raw, t.n);
    check('Events, each counted once', evs.length, t.uniq);
    check('Phones', phones.size, t.phones);
    /* the day each event happened, worked out in SQL: install day (earliest arrival less days since install) plus d */
    const W7 = dayAdd(today, -6);
    const W30 = dayAdd(today, -29);
    const [a] = await rowsOf(`
      WITH x AS (SELECT i, min(date_add('day', -d, date(dt))) AS inst FROM events WHERE dt >= '${FROM}' GROUP BY i),
        e AS (SELECT DISTINCT e.i, e.k, e.n, json_extract_scalar(e.p, '$.outcome') AS outcome, date_add('day', e.d, x.inst) AS day
          FROM events e JOIN x ON e.i = x.i WHERE e.dt >= '${FROM}')
      SELECT count(DISTINCT CASE WHEN day >= date '${W7}' AND day <= date '${today}' THEN i END) AS act7,
        count(DISTINCT CASE WHEN day >= date '${W30}' AND day <= date '${today}' THEN i END) AS act30,
        count_if(n = 'sos_open' AND day >= date '${W30}') AS sos30,
        count_if(n = 'sos_end' AND outcome = 'rode' AND day >= date '${W30}') AS rode30,
        count_if(n = 'lesson_done' AND day >= date '${W30}') AS ld30,
        count_if(n = 'slip' AND day >= date '${W30}') AS slip30
      FROM e`);
    const inW = (from) => evs.filter((e) => e.day >= from && e.day <= today);
    check('Phones active, last 7 days (every group)', new Set(inW(W7).map((e) => e.i)).size, a.act7);
    check('Phones active, last 30 days (every group)', new Set(inW(W30).map((e) => e.i)).size, a.act30);
    check('SOS opened, last 30 days (every group)', inW(W30).filter((e) => e.n === 'sos_open').length, a.sos30);
    check('SOS urge passed, last 30 days', inW(W30).filter((e) => e.n === 'sos_end' && e.p.outcome === 'rode').length, a.rode30);
    check('Lessons finished, last 30 days', inW(W30).filter((e) => e.n === 'lesson_done').length, a.ld30);
    check('Slips, last 30 days', inW(W30).filter((e) => e.n === 'slip').length, a.slip30);
    const byName = await rowsOf(`SELECT n, count(DISTINCT concat(i, '#', cast(k AS varchar))) AS c FROM events WHERE dt >= '${FROM}' GROUP BY n`);
    const mine = {};
    for (const e of evs) mine[e.n] = (mine[e.n] || 0) + 1;
    const off = byName.filter((r) => String(mine[r.n] || 0) !== r.c);
    check(
      'Every event name, counted once (' + byName.length + ' names)',
      off.length ? off.map((r) => `${r.n} ${mine[r.n] || 0}`).join(', ') : 'all match',
      off.length ? off.map((r) => `${r.n} ${r.c}`).join(', ') : 'all match',
    );
    out.push(
      '| Number | This report | Athena | |',
      '| --- | --- | --- | --- |',
      ...lines.map((l) => `| ${l.what} | ${l.mine} | ${l.theirs} | ${l.ok ? 'match' : '**differs**'} |`),
    );
    out.push('', lines.every((l) => l.ok) ? 'Every number matches.' : '**Some numbers differ: read the report with care, and look at the query.**', '');
  } catch (e) {
    out.push(`The cross-check did not run: ${String(e.message || e).slice(0, 300)}`, '');
  }
  console.log(out.join('\n'));
}

main().catch((e) => {
  console.log(`## Daybook usage\n\nThe report did not run: ${String(e.message || e).slice(0, 400)}\n`);
  process.exitCode = 1;
});
