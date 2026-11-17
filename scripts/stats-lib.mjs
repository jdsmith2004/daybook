/* Daybook's usage report, built from the raw events (the owner, November 17, 2026: "i need you to go above and beyond to get me
   good thourough stats", and "should lead with accounts if they don't have accounts they're probably not really using the
   app"). Pure: scripts/stats-report.mjs fetches the rows from Athena and hands them here; packages/core/test/stats-report.test.ts
   checks the numbers on made-up rows.

   How the rows are read:
   - One row is one event: dt (the UTC day it arrived), i (the install id), pf, v, k (its place in that phone's stream), n,
     d (days since install), h (local hour), p (props as JSON; the server adds ak, the account key, and tst, a tester's phone).
   - A batch the phone sent twice (a lost answer) would count twice, so rows are kept once per install id and k.
   - The day an event happened is the install day plus d. The install day is the earliest dt minus d over the phone's rows
     (an event can only arrive on or after the day it happened). This is the day every window below uses, never dt.
   - Who: a phone is a tester's when any of its rows says tst, or its install id or account key is in the testers list; an
     account with any tester phone is a tester's, and so is every phone on it. A phone is an account holder's when any of its
     rows carries an account key, or (before the key existed) its daily snapshot said it had an account. Each account counts
     once however many phones it has; a phone with an account but no key yet counts as its own account, said as such.
   - A unit is an account (account holders) or a phone (no account). Every number names its unit, its window and its
     denominator. */

const DAY = 86400000;
const toMs = (k) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
export const dayAdd = (k, n) => new Date(toMs(k) + n * DAY).toISOString().slice(0, 10);
export const dayDiff = (a, b) => Math.round((toMs(b) - toMs(a)) / DAY);
const HEX = /^[0-9a-f]{32}$/;

/* ---------- small words ---------- */
export const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '-');
/** "3 of 12 (25%)" */
export const of = (a, b) => (b ? `${a} of ${b} (${pct(a, b)})` : `${a} of 0`);
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const secsWords = (s) => (s == null ? '-' : s < 90 ? `${s}s` : s < 5400 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} h`);
/** a Markdown table; cols: [heading, (row) => value] */
export function table(rows, cols) {
  if (!rows.length) return '_Nothing yet._\n';
  const out = ['| ' + cols.map((c) => c[0]).join(' | ') + ' |', '|' + cols.map(() => ' --- |').join('')];
  for (const r of rows) out.push('| ' + cols.map((c) => String(c[1](r) ?? '')).join(' | ') + ' |');
  return out.join('\n') + '\n';
}
/** versions in order: 1.3.10 after 1.3.9 */
export const verCmp = (a, b) => {
  const x = String(a)
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
  const y = String(b)
    .split('.')
    .map((n) => parseInt(n, 10) || 0);
  for (let j = 0; j < Math.max(x.length, y.length); j++) if ((x[j] || 0) !== (y[j] || 0)) return (x[j] || 0) - (y[j] || 0);
  return 0;
};
/** the Monday on or before a day */
const weekOf = (k) => dayAdd(k, -((new Date(toMs(k)).getUTCDay() + 6) % 7));

/* ---------- reading the rows ---------- */
function parseP(p) {
  if (p && typeof p === 'object') return p;
  try {
    const o = JSON.parse(p || '{}');
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

/** the rows made ready: kept once per phone and place, each with the day it happened, its phone's group and unit */
export function prepare(rows, { testers = [] } = {}) {
  const listed = new Set(testers.filter((t) => HEX.test(t)));
  const seen = new Set();
  let dupes = 0;
  const evs = [];
  for (const r of rows) {
    const key = r.i + '#' + r.k;
    if (seen.has(key)) {
      dupes++;
      continue;
    }
    seen.add(key);
    const d = Number(r.d) || 0;
    evs.push({ dt: r.dt, i: r.i, pf: r.pf, v: r.v, k: Number(r.k) || 0, n: r.n, d, h: Number(r.h) || 0, p: parseP(r.p) });
  }
  /* each phone: its install day, platform and version (latest), account key, and what it says about itself */
  const phones = new Map();
  for (const e of evs) {
    let ph = phones.get(e.i);
    if (!ph) phones.set(e.i, (ph = { i: e.i, inst: null, pf: e.pf, v: e.v, vk: -1, ak: null, tst: false, acct: false, d0: Infinity }));
    const inst = dayAdd(e.dt, -e.d);
    if (!ph.inst || inst < ph.inst) ph.inst = inst;
    if (e.k > ph.vk) Object.assign(ph, { vk: e.k, v: e.v, pf: e.pf });
    if (typeof e.p.ak === 'string' && HEX.test(e.p.ak)) ph.ak = e.p.ak;
    if (e.p.tst === true) ph.tst = true;
    if (e.n === 'day' && e.p.acct === true) ph.acct = true;
    if (e.n === 'account') ph.acct = true;
    if (e.d < ph.d0) ph.d0 = e.d;
  }
  const testerAk = new Set([...phones.values()].filter((p) => p.ak && (p.tst || listed.has(p.i) || listed.has(p.ak))).map((p) => p.ak));
  for (const ak of listed) testerAk.add(ak);
  for (const ph of phones.values()) {
    ph.tester = ph.tst || listed.has(ph.i) || (!!ph.ak && testerAk.has(ph.ak));
    ph.group = ph.tester ? 'T' : ph.ak || ph.acct ? 'A' : 'N';
    ph.unit = ph.group === 'A' ? (ph.ak ? 'a:' + ph.ak : 'p:' + ph.i) : 'p:' + ph.i;
    ph.keyless = ph.group === 'A' && !ph.ak;
  }
  for (const e of evs) {
    const ph = phones.get(e.i);
    e.day = dayAdd(ph.inst, e.d);
    e.g = ph.group;
    e.u = ph.unit;
  }
  evs.sort((a, b) => (a.i < b.i ? -1 : a.i > b.i ? 1 : a.k - b.k));
  return { evs, phones, dupes, raw: rows.length };
}

/* ---------- the report ---------- */
const GROUPS = [
  ['A', 'With an account', 'accounts'],
  ['N', 'No account', 'phones'],
];

/**
 * rows: the event rows; o.today: the day the report is for (YYYY-MM-DD, UTC); o.testers: listed account keys or install ids;
 * o.names: every event name on the list (core EV_NAMES), for the dead-event check; o.pages: the setup pages in order (core OB_PAGES)
 */
export function buildReport(rows, o = {}) {
  const today = o.today || new Date().toISOString().slice(0, 10);
  const { evs, phones, dupes, raw } = prepare(rows, o);
  const out = [];
  const say = [];
  const W7 = dayAdd(today, -6);
  const W30 = dayAdd(today, -29);
  const inG = (g) => evs.filter((e) => e.g === g);
  const by = { A: inG('A'), N: inG('N'), T: inG('T') };
  const units = (list) => new Set(list.map((e) => e.u));
  const named = (list, n, f) => list.filter((e) => e.n === n && (!f || f(e.p, e)));
  const since = (list, from) => list.filter((e) => e.day >= from && e.day <= today);
  const phoneList = (g) => [...phones.values()].filter((p) => p.group === g);
  const first = o.firstDay || (evs.length ? evs.reduce((m, e) => (e.day < m ? e.day : m), evs[0].day) : today);

  out.push(`## Daybook usage, ${today}`);
  out.push('');
  out.push(
    `Read from every event since ${first} (the day each one happened on the phone). Account holders lead; a phone with no account is ` +
      `counted on its own; testers are left out of every number below their own line. "Active" means Daybook was opened that day.`,
  );
  out.push('');

  /* ---------- who ---------- */
  const tPhones = phoneList('T');
  const aPhones = phoneList('A');
  const aUnits = units(by.A);
  const keyless = aPhones.filter((p) => p.keyless).length;
  const keyed = new Set(aPhones.filter((p) => p.ak).map((p) => p.ak)).size;
  out.push('### Who');
  out.push('');
  out.push(
    `- **Accounts:** ${aUnits.size} (${plural(keyed, 'account')} with the account key, on ${plural(aPhones.filter((p) => p.ak).length, 'phone')}; ` +
      `${plural(keyless, 'phone')} with an account from before the key, each counted as one account until it updates).`,
  );
  out.push(`- **Phones with no account:** ${phoneList('N').length}.`);
  out.push(
    `- **Testers, left out of everything below:** ${plural(tPhones.length, 'phone')} (${plural(new Set(tPhones.filter((p) => p.ak).map((p) => p.ak)).size, 'account')}), ` +
      `${by.T.length} events.`,
  );
  if (dupes) out.push(`- ${dupes} of ${raw} rows were the same event sent twice (a lost answer), and are counted once.`);
  out.push('');

  /* ---------- actives ---------- */
  const activeIn = (list, from, to = today) => units(list.filter((e) => e.day >= from && e.day <= to));
  const dauWau = (list) => {
    /* the last 7 full days (today is still filling in) */
    let sum = 0;
    for (let j = 1; j <= 7; j++) sum += activeIn(list, dayAdd(today, -j), dayAdd(today, -j)).size;
    const wau = activeIn(list, dayAdd(today, -7), dayAdd(today, -1)).size;
    return { dau: sum / 7, wau };
  };
  out.push('### Actives');
  out.push('');
  const actRows = GROUPS.map(([g, name, unit]) => {
    const l = by[g];
    const all = units(l).size;
    const { dau, wau } = dauWau(l);
    const ph = (from) => new Set(l.filter((e) => e.day >= from && e.day <= today).map((e) => e.i)).size;
    return {
      name,
      unit,
      all,
      t: `${activeIn(l, today).size} (${plural(ph(today), 'phone')})`,
      w: `${activeIn(l, W7).size} (${plural(ph(W7), 'phone')})`,
      m: `${activeIn(l, W30).size} (${plural(ph(W30), 'phone')})`,
      dw: wau ? `${dau.toFixed(1)} / ${wau} = ${pct(dau, wau)}` : '-',
      n7: [...units(l)].filter((u) => firstDayOf(l, u) >= W7).length,
      n30: [...units(l)].filter((u) => firstDayOf(l, u) >= W30).length,
    };
  });
  out.push(
    table(actRows, [
      ['', (r) => `**${r.name}** (${r.unit})`],
      ['Ever', (r) => r.all],
      ['Today (so far)', (r) => r.t],
      ['Last 7 days', (r) => r.w],
      ['Last 30 days', (r) => r.m],
      ['DAU / WAU (last 7 full days)', (r) => r.dw],
      ['New, 7 days', (r) => r.n7],
      ['New, 30 days', (r) => r.n30],
    ]),
  );
  out.push(
    "DAU / WAU: the average day's actives over the last 7 full days, against everyone active in those 7 days. 100% would be every one of them, every day.",
  );
  out.push('');
  /* new and active, day by day, 14 days */
  const days14 = Array.from({ length: 14 }, (_, j) => dayAdd(today, -13 + j));
  out.push('**Day by day (last 14 days; today is still filling in)**');
  out.push('');
  out.push(
    table(days14, [
      ['Day', (d) => d],
      ...GROUPS.flatMap(([g, name]) => [
        [`${name}: active`, (d) => activeIn(by[g], d, d).size],
        [`${name}: new`, (d) => [...units(by[g])].filter((u) => firstDayOf(by[g], u) === d).length],
      ]),
      ['Testers active', (d) => activeIn(by.T, d, d).size],
    ]),
  );

  /* ---------- retention ---------- */
  out.push('### Who comes back');
  out.push('');
  out.push(
    'By the week each one started (an account: its first day on any phone; a phone: its install day), only those seen from their first day. ' +
      'Day 1: opened the day after. Day 7: opened on any of days 7 to 13. Day 30: any of days 30 to 36. "-" means too new to tell.',
  );
  out.push('');
  for (const [g, name, unit] of GROUPS) {
    const l = by[g];
    const days = new Map();
    for (const e of l) {
      if (!days.has(e.u)) days.set(e.u, new Set());
      days.get(e.u).add(e.day);
    }
    const startOf = new Map();
    for (const p of phones.values()) if (p.group === g && p.d0 === 0 && (!startOf.has(p.unit) || p.inst < startOf.get(p.unit))) startOf.set(p.unit, p.inst);
    /* an account whose first phone was seen only after install has no clean start */
    for (const p of phones.values()) if (p.group === g && p.d0 > 0 && startOf.has(p.unit) && p.inst < startOf.get(p.unit)) startOf.delete(p.unit);
    const cohorts = new Map();
    for (const [u, s] of startOf) {
      const w = weekOf(s);
      if (!cohorts.has(w)) cohorts.set(w, []);
      cohorts.get(w).push([u, s]);
    }
    const ret = (list, a, b) => {
      const ok = list.filter(([, s]) => dayAdd(s, b) < today);
      if (!ok.length) return '-';
      const k = ok.filter(([u, s]) => [...days.get(u)].some((d) => dayDiff(s, d) >= a && dayDiff(s, d) <= b)).length;
      return of(k, ok.length);
    };
    const rows = [...cohorts.entries()].sort((x, y) => (x[0] < y[0] ? 1 : -1));
    const allC = [...startOf.entries()];
    out.push(`**${name}** (${unit})`);
    out.push('');
    out.push(
      table(
        [...rows, ['all', allC]],
        [
          ['Started the week of', (r) => r[0]],
          ['Started', (r) => r[1].length],
          ['Day 1', (r) => ret(r[1], 1, 1)],
          ['Day 7', (r) => ret(r[1], 7, 13)],
          ['Day 30', (r) => ret(r[1], 30, 36)],
        ],
      ),
    );
  }

  /* ---------- setup ---------- */
  out.push('### Setup (one source: the events, page by page)');
  out.push('');
  {
    const pages = o.pages || [];
    const order = (p) => (pages.indexOf(p) < 0 ? 999 : pages.indexOf(p));
    for (const [g, name] of GROUPS) {
      const l = by[g];
      const starters = new Set(named(l, 'setup_page').map((e) => e.i));
      const done = new Set(named(l, 'setup_done').map((e) => e.i));
      const reached = new Map();
      const secs = new Map();
      const lastPage = new Map();
      let prev = new Map();
      for (const e of l) {
        if (e.n !== 'setup_page' && e.n !== 'setup_done') continue;
        const was = prev.get(e.i);
        if (was && typeof e.p.secs === 'number') {
          if (!secs.has(was)) secs.set(was, []);
          secs.get(was).push(e.p.secs);
        }
        if (e.n === 'setup_page' && e.p.page) {
          if (!reached.has(e.p.page)) reached.set(e.p.page, new Set());
          reached.get(e.p.page).add(e.i);
          prev.set(e.i, e.p.page);
          lastPage.set(e.i, e.p.page);
        } else prev.delete(e.i);
      }
      const stopped = new Map();
      for (const [i, pg] of lastPage) if (!done.has(i)) stopped.set(pg, (stopped.get(pg) || 0) + 1);
      out.push(`**${name}** (phones): ${of(done.size, starters.size)} who started setup finished it.`);
      out.push('');
      const rows = [...reached.keys()].sort((a, b) => order(a) - order(b));
      out.push(
        table(rows, [
          ['Page', (p) => p],
          ['Reached', (p) => of(reached.get(p).size, starters.size)],
          ['Median time on it', (p) => secsWords(median(secs.get(p) || []))],
          ['Timed', (p) => (secs.get(p) || []).length],
          ['Stopped here', (p) => stopped.get(p) || 0],
        ]),
      );
      if (g === 'N' && starters.size) {
        const worst = [...stopped.entries()].sort((a, b) => b[1] - a[1])[0];
        if (worst)
          say.push(`Setup loses most people on "${worst[0]}": ${worst[1]} of ${starters.size} phones with no account that started setup stopped there.`);
      }
    }
    out.push('Time on a page comes from builds after 1.3.5 (the page after it says how long it was open); "Timed" is how many timings there are.');
    out.push('');
  }

  /* ---------- lessons ---------- */
  out.push('### Lessons');
  out.push('');
  {
    const rows = GROUPS.map(([g, name, unit]) => {
      const l = since(by[g], W30);
      const op = named(l, 'lesson_open');
      const dn = named(l, 'lesson_done');
      const lens = { q: 0, f: 0, d: 0, x: 0 };
      for (const e of dn) lens[e.p.len in lens ? e.p.len : 'x']++;
      const act7 = activeIn(by[g], W7).size;
      const dn7 = named(since(by[g], W7), 'lesson_done').length;
      return {
        name,
        unit,
        op,
        dn,
        lens,
        act7,
        dn7,
        u: units(dn).size,
        uo: units(op).size,
        secs: median(dn.map((e) => e.p.secs).filter((x) => typeof x === 'number')),
      };
    });
    out.push(
      table(rows, [
        ['Last 30 days', (r) => `**${r.name}**`],
        ['Opened', (r) => `${r.op.length} (by ${plural(r.uo, r.unit.slice(0, -1))})`],
        ['Finished', (r) => `${of(r.dn.length, r.op.length)} (by ${plural(r.u, r.unit.slice(0, -1))})`],
        ['Short / Long / Deep / not said', (r) => `${r.lens.q} / ${r.lens.f} / ${r.lens.d} / ${r.lens.x}`],
        ['Median time', (r) => secsWords(r.secs)],
        [
          'Finished per active one, last 7 days',
          (r) => (r.act7 ? `${(r.dn7 / r.act7).toFixed(1)} (${r.dn7} by ${plural(r.act7, 'active ' + r.unit.slice(0, -1))})` : '-'),
        ],
      ]),
    );
    out.push('"Not said" is a lesson finished on a build from before the length was counted.');
    out.push('');
    const all = since([...by.A, ...by.N], W30);
    const per = new Map();
    for (const e of all) {
      if ((e.n !== 'lesson_open' && e.n !== 'lesson_done') || !e.p.lesson) continue;
      if (!per.has(e.p.lesson)) per.set(e.p.lesson, { id: e.p.lesson, o: 0, d: 0, left: 0 });
      per.get(e.p.lesson)[e.n === 'lesson_open' ? 'o' : 'd']++;
    }
    for (const e of named(all, 'lesson_left')) if (per.has(e.p.lesson)) per.get(e.p.lesson).left++;
    out.push('**Which lessons (last 30 days, accounts and no account together, most opened first, top 15)**');
    out.push('');
    out.push(
      table([...per.values()].sort((a, b) => b.o - a.o || b.d - a.d).slice(0, 15), [
        ['Lesson', (r) => r.id],
        ['Opened', (r) => r.o],
        ['Finished', (r) => of(r.d, r.o)],
        ['Left before the end', (r) => r.left],
      ]),
    );
  }

  /* ---------- SOS ---------- */
  out.push('### SOS');
  out.push('');
  {
    const rows = GROUPS.map(([g, name, unit]) => {
      const l = since(by[g], W30);
      const op = named(l, 'sos_open');
      const end = named(l, 'sos_end');
      const rode = end.filter((e) => e.p.outcome === 'rode').length;
      const slip = end.filter((e) => e.p.outcome === 'slipped').length;
      return {
        name,
        unit,
        op: op.length,
        uo: units(op).size,
        rode,
        slip,
        open: Math.max(0, op.length - end.length),
        mins: median(end.map((e) => e.p.secs).filter((x) => typeof x === 'number')),
      };
    });
    out.push(
      table(rows, [
        ['Last 30 days', (r) => `**${r.name}**`],
        ['Opened', (r) => `${r.op} (by ${plural(r.uo, r.unit.slice(0, -1))})`],
        ['The urge passed', (r) => of(r.rode, r.op)],
        ['Ended in a slip', (r) => of(r.slip, r.op)],
        ['Closed with no answer', (r) => of(r.open, r.op)],
        ['Median time (answered)', (r) => secsWords(r.mins)],
      ]),
    );
    const l = since([...by.A, ...by.N], W30);
    const tools = new Map();
    for (const e of named(l, 'sos_tool')) {
      const t = tools.get(e.p.tool) || { tool: e.p.tool, n: 0, rode: 0, slip: 0 };
      t.n++;
      if (e.p.outcome === 'rode') t.rode++;
      if (e.p.outcome === 'slipped') t.slip++;
      tools.set(e.p.tool, t);
    }
    for (const e of named(l, 'tool_open')) {
      const t = tools.get(e.p.tool) || { tool: e.p.tool, n: 0, rode: 0, slip: 0 };
      t.own = (t.own || 0) + 1;
      tools.set(e.p.tool, t);
    }
    out.push('**Tools (last 30 days, both groups): tried in SOS, and what came after; opened on their own**');
    out.push('');
    out.push(
      table(
        [...tools.values()].sort((a, b) => b.n + (b.own || 0) - a.n - (a.own || 0)),
        [
          ['Tool', (r) => r.tool],
          ['Tried in SOS', (r) => r.n],
          ['Urge passed after it', (r) => (r.n ? of(r.rode, r.n) : '-')],
          ['Slip after it', (r) => r.slip],
          ['Opened on its own', (r) => r.own || 0],
        ],
      ),
    );
    out.push(
      'An SOS that is closed with no answer (the person left SOS without saying whether the urge passed) is counted in Opened only. ' +
        'This is the one SOS number to use: the daily totals below count SOS too, but they reach the server a day or more late.',
    );
    out.push('');
  }

  /* ---------- slips, urges, comebacks ---------- */
  out.push('### Urges, slips and coming back');
  out.push('');
  {
    const rows = GROUPS.map(([g, name, unit]) => {
      const l = since(by[g], W30);
      const rode = named(l, 'urge', (p) => p.outcome === 'rode').length;
      const urges = named(l, 'urge').length;
      const slips = named(l, 'slip');
      /* one slip day per unit: did they open Daybook again, and how soon */
      const days = new Map();
      for (const e of by[g]) {
        if (!days.has(e.u)) days.set(e.u, new Set());
        days.get(e.u).add(e.day);
      }
      const slipDays = [...new Set(slips.map((e) => e.u + '|' + e.day))].map((x) => x.split('|'));
      const band = { b1: 0, b3: 0, b7: 0, no: 0, soon: 0 };
      for (const [u, d] of slipDays) {
        const after = [...days.get(u)].filter((x) => x > d).sort()[0];
        const gap = after ? dayDiff(d, after) : null;
        if (gap == null) band[dayDiff(d, today) >= 7 ? 'no' : 'soon']++;
        else if (gap <= 1) band.b1++;
        else if (gap <= 3) band.b3++;
        else if (gap <= 7) band.b7++;
        else band.no++;
      }
      return { name, unit, rode, urges, slips: slips.length, su: units(slips).size, sd: slipDays.length, band, cb: named(l, 'comeback').length };
    });
    out.push(
      table(rows, [
        ['Last 30 days', (r) => `**${r.name}**`],
        ['Urges logged', (r) => `${r.urges} (${r.rode} ridden out)`],
        ['Slips logged', (r) => `${r.slips} (by ${plural(r.su, r.unit.slice(0, -1))})`],
        ['Ridden out per slip', (r) => (r.slips ? (r.rode / r.slips).toFixed(1) : r.rode ? 'no slips' : '-')],
        ['Days with a slip', (r) => r.sd],
        ['Back next day', (r) => of(r.band.b1, r.sd)],
        ['Back in 2-3 days', (r) => r.band.b3],
        ['Back in 4-7 days', (r) => r.band.b7],
        ['Not back after 7 days', (r) => r.band.no],
        ['Under 7 days ago, not back yet', (r) => r.band.soon],
        ['Comebacks (all three flames)', (r) => r.cb],
      ]),
    );
    out.push(
      '"Back" counts each day with a slip once per account or phone and asks when Daybook was next opened, so it can never be more than the slips. ' +
        '(The daily totals\' old "came back" line counted every slip in the log, including slips added from the journal, synced from another phone or imported, which is how it read 12 from 6.)',
    );
    out.push('');
  }

  /* ---------- check-ins and reminders ---------- */
  out.push('### Check-ins and reminders');
  out.push('');
  {
    const rows = GROUPS.map(([g, name, unit]) => {
      const l = since(by[g], W30);
      const ck = named(l, 'checkin');
      /* reminders allowed: each unit's latest daily snapshot */
      const snap = new Map();
      for (const e of named(by[g], 'day')) snap.set(e.u, e.p.rem === true);
      const act = activeIn(by[g], W30).size;
      return { name, unit, ck: ck.length, cu: units(ck).size, act, rem: [...snap.values()].filter(Boolean).length, snaps: snap.size };
    });
    out.push(
      table(rows, [
        ['Last 30 days', (r) => `**${r.name}**`],
        ['Check-ins saved', (r) => `${r.ck} (by ${of(r.cu, r.act)} active ${r.unit})`],
        ['Reminders allowed (latest day seen)', (r) => of(r.rem, r.snaps)],
      ]),
    );
    const l = since([...by.A, ...by.N], W30);
    const kinds = new Map();
    const kOf = (k) => kinds.get(k) || (kinds.set(k, { k, came: 0, tap: 0, did: 0 }), kinds.get(k));
    for (const e of named(l, 'nudge')) kOf(e.p.kind).came++;
    for (const e of named(l, 'nudge_tap')) kOf(e.p.kind).tap++;
    for (const e of named(l, 'nudge_did')) kOf(e.p.kind).did++;
    out.push('**Reminders by kind (last 30 days, both groups)**');
    out.push('');
    out.push(
      table(
        [...kinds.values()].sort((a, b) => b.came - a.came),
        [
          ['Kind', (r) => r.k],
          ['Arrived', (r) => r.came],
          ['Opened Daybook from it', (r) => of(r.tap, r.came)],
          ['Did what it was for that day', (r) => of(r.did, r.came)],
        ],
      ),
    );
    out.push('"Arrived" is counted when Daybook is next opened, so a reminder on a phone that never opens again is not seen.');
    out.push('');
  }

  /* ---------- the asks ---------- */
  out.push('### Asks: rating, tips, accounts');
  out.push('');
  {
    const ask = (l, w) => named(l, 'ask', (p) => p.what === w);
    const tap = (l, w) => named(l, 'ask_tap', (p) => p.what === w);
    const rows = GROUPS.map(([g, name, unit]) => {
      const l = since(by[g], W30);
      const bought = named(l, 'bought');
      const tiers = {};
      for (const e of bought) tiers[e.p.tier] = (tiers[e.p.tier] || 0) + 1;
      const sup = new Map();
      for (const e of named(by[g], 'day')) sup.set(e.u, e.p.sup === true);
      return {
        name,
        unit,
        rate: ask(l, 'rate'),
        yes: tap(l, 'rate'),
        no: tap(l, 'idea'),
        store: tap(l, 'store'),
        tip: ask(l, 'tip'),
        tipTap: tap(l, 'tip'),
        bought,
        tiers,
        sup: [...sup.values()].filter(Boolean).length,
        snaps: sup.size,
        acctTap: tap(l, 'account'),
        made: named(l, 'account'),
        pat: ask(l, 'pattern'),
        patTap: tap(l, 'pattern'),
      };
    });
    const both = (r, k) => `${r[k].length} (${plural(units(r[k]).size, r.unit.slice(0, -1))})`;
    out.push('**"Do you like Daybook so far?" (protected: it must keep asking until a yes)**');
    out.push('');
    out.push(
      table(rows, [
        ['Last 30 days', (r) => `**${r.name}**`],
        ['Shown', (r) => both(r, 'rate')],
        ['Yes', (r) => `${of(r.yes.length, r.rate.length)}`],
        ['Not yet (opens feedback)', (r) => `${of(r.no.length, r.rate.length)}`],
        ['Rating sheet asked for', (r) => `${r.store.length}`],
      ]),
    );
    out.push('"Rating sheet asked for" is new in this build; Apple then decides whether its sheet shows (at most three times a year), and the web has none.');
    out.push('');
    out.push('**Tips, supporters and Daybook Pattern**');
    out.push('');
    out.push(
      table(rows, [
        ['Last 30 days', (r) => `**${r.name}**`],
        ['Tip ask shown', (r) => both(r, 'tip')],
        ['Tip page opened', (r) => both(r, 'tipTap')],
        [
          'Bought',
          (r) =>
            r.bought.length
              ? `${r.bought.length}: ` +
                Object.entries(r.tiers)
                  .map(([t, n]) => `${t} ${n}`)
                  .join(', ')
              : '0',
        ],
        ['Supporters (latest day seen)', (r) => of(r.sup, r.snaps)],
        ['Pattern ask shown / tapped', (r) => `${r.pat.length} / ${r.patTap.length}`],
      ]),
    );
    out.push('**Accounts**');
    out.push('');
    const signups = [...new Set(aPhones.filter((p) => p.ak).map((p) => p.ak))].length;
    out.push(
      table(rows, [
        ['Last 30 days', (r) => `**${r.name}**`],
        ['Account page opened', (r) => both(r, 'acctTap')],
        ['Accounts made with email', (r) => r.made.filter((e) => e.p.how === 'email').length],
      ]),
    );
    out.push(
      `${plural(signups, 'account')} sent its key so far. Sign in with Apple sends no 'account made' event; the key counts every account, however it was made, once its phone runs this build.`,
    );
    out.push('');
  }

  /* ---------- Friends ---------- */
  out.push('### Friends and the community waitlist');
  out.push('');
  {
    const l = since([...by.A, ...by.N], W30);
    const c = (n, f) => {
      const x = named(l, n, f);
      return `${x.length} (${units(x).size})`;
    };
    out.push(
      table(
        [
          ['Invites shared (new in this build)', c('friend_invite')],
          ['Became friends (counted on the side that accepted)', c('friend_added')],
          ['Sparks sent', c('friend_cheer')],
          ['Sparks that went into a lesson', c('friend_spark_used')],
          [
            'Chose how to hear: as it happens / daily / off',
            ['live', 'daily', 'off'].map((w) => named(l, 'friend_hear', (p) => p.what === w).length).join(' / '),
          ],
          ['Pre-joined the community', c('community_join')],
        ],
        [
          ['Last 30 days, both groups', (r) => r[0]],
          ['Times (accounts or phones)', (r) => r[1]],
        ],
      ),
    );
    out.push('The together streak and friend notes are kept on the server, not in the events, so they are not in this report.');
    out.push('');
  }

  /* ---------- versions ---------- */
  out.push('### By version and platform');
  out.push('');
  {
    const ver = new Map();
    for (const e of [...by.A, ...by.N]) {
      const k = e.v + ' ' + e.pf;
      if (!ver.has(k)) ver.set(k, { v: e.v, pf: e.pf, ph: new Set(), ev: [] });
      ver.get(k).ph.add(e.i);
      ver.get(k).ev.push(e);
    }
    const rows = [...ver.values()].sort((a, b) => verCmp(b.v, a.v) || (a.pf < b.pf ? -1 : 1));
    const rate = (r, a, b, f) => of(named(r.ev, a, f).length, named(r.ev, b).length);
    out.push(
      table(rows, [
        ['Version', (r) => r.v],
        ['Platform', (r) => r.pf],
        ['Phones', (r) => r.ph.size],
        [
          'Setup finished / started',
          (r) => of(new Set(named(r.ev, 'setup_done').map((e) => e.i)).size, new Set(named(r.ev, 'setup_page').map((e) => e.i)).size),
        ],
        ['Lessons finished / opened', (r) => rate(r, 'lesson_done', 'lesson_open')],
        ['SOS passed / opened', (r) => rate(r, 'sos_end', 'sos_open', (p) => p.outcome === 'rode')],
        ['Rating asked', (r) => named(r.ev, 'ask', (p) => p.what === 'rate').length],
      ]),
    );
    const latest = new Map();
    for (const p of phones.values()) if (p.group !== 'T') latest.set(p.v, (latest.get(p.v) || 0) + 1);
    const on134 = [...phones.values()].filter((p) => p.group !== 'T' && verCmp(p.v, '1.3.4') >= 0).length;
    out.push(
      `Phones by the version they run now: ${[...latest.entries()]
        .sort((a, b) => verCmp(b[0], a[0]))
        .map(([v, n]) => `${v} ${n}`)
        .join(', ')}. On 1.3.4 or later: ${of(on134, latest.size ? [...latest.values()].reduce((a, b) => a + b, 0) : 0)}.`,
    );
    out.push('');
    /* since 1.3.4: the same few rates, before and after */
    const split = (f) => [...by.A, ...by.N].filter((e) => f(verCmp(e.v, '1.3.4')));
    const cmp = [
      ['Before 1.3.4', split((x) => x < 0)],
      ['1.3.4 and later', split((x) => x >= 0)],
    ];
    out.push('**Since 1.3.4** (events sent from each version)');
    out.push('');
    out.push(
      table(cmp, [
        ['', (r) => r[0]],
        ['Phones', (r) => new Set(r[1].map((e) => e.i)).size],
        ['Setup finished', (r) => of(new Set(named(r[1], 'setup_done').map((e) => e.i)).size, new Set(named(r[1], 'setup_page').map((e) => e.i)).size)],
        ['Lessons finished', (r) => of(named(r[1], 'lesson_done').length, named(r[1], 'lesson_open').length)],
        ['SOS: urge passed', (r) => of(named(r[1], 'sos_end', (p) => p.outcome === 'rode').length, named(r[1], 'sos_open').length)],
        [
          'Active days per phone',
          (r) => {
            const ph = new Set(r[1].map((e) => e.i)).size;
            return ph ? (new Set(r[1].map((e) => e.i + e.day)).size / ph).toFixed(1) : '-';
          },
        ],
      ]),
    );
  }

  /* ---------- every event ---------- */
  out.push('### Every event on the list');
  out.push('');
  {
    const count = new Map();
    const ph = new Map();
    for (const e of evs) {
      count.set(e.n, (count.get(e.n) || 0) + 1);
      if (!ph.has(e.n)) ph.set(e.n, new Set());
      ph.get(e.n).add(e.i);
    }
    const names = o.names && o.names.length ? o.names : [...count.keys()];
    const zero = names.filter((n) => !count.get(n));
    out.push(
      `Every name on the list (core EV_NAMES) with how often it arrived since ${first}, testers included, so a name at 0 is either unused or not in a build people have yet. ` +
        `A core test fails if a name has no caller in the app.`,
    );
    out.push('');
    out.push(
      table(
        names.map((n) => ({ n, c: count.get(n) || 0, p: ph.get(n)?.size || 0 })),
        [
          ['Event', (r) => r.n],
          ['Times', (r) => r.c],
          ['Phones', (r) => r.p],
          ['', (r) => (r.c ? '' : '**never seen**')],
        ],
      ),
    );
    if (zero.length) out.push(`Never seen: ${zero.join(', ')}.`);
    out.push('');
  }

  /* ---------- what this suggests ---------- */
  {
    const a7 = activeIn(by.A, W7).size;
    const n7 = activeIn(by.N, W7).size;
    const aAll = units(by.A).size;
    const nAll = units(by.N).size;
    say.unshift(
      `Of everyone who is not a tester, ${of(aAll, aAll + nAll)} have an account; in the last 7 days ${plural(a7, 'account')} and ${plural(n7, 'phone')} with no account opened Daybook.`,
    );
    if (aAll + nAll < 30)
      say.push(
        `These are small numbers (${aAll + nAll} people in all): one person changes a percentage by a lot. Read them as stories about a few people, not as rates, until there are a few dozen.`,
      );
    const lop = named(since([...by.A, ...by.N], W30), 'lesson_open').length;
    const ldn = named(since([...by.A, ...by.N], W30), 'lesson_done').length;
    if (lop) say.push(`Lessons are finished ${of(ldn, lop)} of the times they are opened (last 30 days).`);
    const so = named(since([...by.A, ...by.N], W30), 'sos_open').length;
    const se = named(since([...by.A, ...by.N], W30), 'sos_end').length;
    if (so)
      say.push(
        `${of(so - se, so)} SOS opens end with no answer: the person leaves before saying whether the urge passed, so SOS's real success rate is unknown for most of them.`,
      );
    const rate = named(since([...by.A, ...by.N], W30), 'ask', (p) => p.what === 'rate').length;
    say.push(
      rate
        ? `The rating ask was shown ${plural(rate, 'time')} in 30 days.`
        : 'The rating ask was not shown once in 30 days outside testers: check that its moments are reached.',
    );
    out.push('### What this suggests');
    out.push('');
    for (const s of say) out.push('- ' + s);
    out.push('');
  }

  return { md: out.join('\n'), facts: facts(evs, phones, today) };
}

/** the first day a unit was seen in a list (worked out once per list) */
const firsts = new WeakMap();
function firstDayOf(list, u) {
  let m = firsts.get(list);
  if (!m) {
    m = new Map();
    for (const e of list) if (!m.has(e.u) || e.day < m.get(e.u)) m.set(e.u, e.day);
    firsts.set(list, m);
  }
  return m.get(u) ?? null;
}

/** the totals the cross-check compares with Athena's own count: rows kept, phones, and events by name (every group) */
function facts(evs, phones) {
  const byName = {};
  for (const e of evs) byName[e.n] = (byName[e.n] || 0) + 1;
  return { events: evs.length, phones: phones.size, byName };
}

/* ---------- Athena's CSV ---------- */
/** rows of a CSV as Athena writes it (every field quoted, "" inside a field), the first line the headings */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let f = '';
  let q = false;
  for (let j = 0; j < text.length; j++) {
    const c = text[j];
    if (q) {
      if (c === '"') {
        if (text[j + 1] === '"') {
          f += '"';
          j++;
        } else q = false;
      } else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(f);
      f = '';
    } else if (c === '\n') {
      row.push(f);
      rows.push(row);
      row = [];
      f = '';
    } else if (c !== '\r') f += c;
  }
  if (f || row.length) {
    row.push(f);
    rows.push(row);
  }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, j) => [h, r[j]])));
}
