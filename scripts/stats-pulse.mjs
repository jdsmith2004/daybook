/* Daybook's own anonymous totals for the Stats workflow, from a DynamoDB query of the pulse table's totals (pk "c",
   services/api/src/pulse-store.ts): per day and platform, one number per count name, plus the versions seen. The names mean
   what core pulse.ts says. This turns them into answers: how many phones, where setup loses people, who comes back, whether
   reminders lead to anything, what gets used and finished, whether SOS helps, comebacks after a slip, and the asks.

   No one is ever told apart: every number is a total over phones. So a rate here is one total over another (reminders opened
   over reminders delivered), not a path a person took. A line under "What this suggests" is printed only where the numbers
   behind it are big enough to mean something (MIN). Usage: node scripts/stats-pulse.mjs pulse.json [privacy.html] */
import { readFileSync } from 'node:fs';

const items = JSON.parse(readFileSync(process.argv[2], 'utf8')).Items || [];
const val = (x) => (x.N !== undefined ? Number(x.N) : x.S);
/** the smallest number a rate is said out loud on */
const MIN = 10;

/* setup's pages in order, from the privacy page (its list follows setup's order; core test/pulse.test.ts checks it) */
let PAGES = [];
try {
  const html = readFileSync(process.argv[3] || new URL('../apps/mobile/public/privacy.html', import.meta.url), 'utf8');
  const m = html.match(/<code>setup_<\/code> and a setup page's name \(([^)]*)\)/);
  if (m) PAGES = m[1].split(',').map((x) => x.trim());
} catch {
  /* no page: setup is shown most first */
}

const sum = {};
const byDay = {};
const plat = {};
const vers = {};
for (const it of items) {
  const [d, a, b] = val(it.sk).split('#');
  const c = Object.fromEntries(Object.entries(it).map(([k, x]) => [k, val(x)]));
  if (a === 'v') {
    vers[b] = (vers[b] || 0) + (c.batches || 0);
    continue;
  }
  const day = (byDay[d] ||= {});
  for (const [k, n] of Object.entries(c)) {
    if (k === 'pk' || k === 'sk' || typeof n !== 'number') continue;
    if (k === 'batches') continue;
    sum[k] = (sum[k] || 0) + n;
    day[k] = (day[k] || 0) + n;
    if (k.startsWith('act_')) plat[a] = (plat[a] || 0) + n;
  }
}
const g = (k) => sum[k] || 0;
const pct = (a, b) => (b ? Math.round((100 * a) / b) + '%' : '-');
const rate = (a, b) => `${a} of ${b}` + (b ? ` (${pct(a, b)})` : '');
const big = (b) => b >= MIN;
const out = [];
const say = [];
const line = (s = '') => out.push(s);
const head = (s) => {
  line();
  line(s);
};
const pad = (s, n) => String(s).padEnd(n);

const days = Object.keys(byDay).sort();
if (!days.length) {
  console.log('Nothing yet in these days.');
  process.exit(0);
}
const ACT = ['act_0', 'act_1', 'act_2_6', 'act_7_13', 'act_14_29', 'act_30'];
const actOf = (o) => ACT.reduce((t, k) => t + (o[k] || 0), 0);

/* ---------- phones ---------- */
line(`From ${days[0]} to ${days[days.length - 1]}. Each phone counts once a day. Days fill in late: most counts are sent on a later open.`);
head('Phones by day (opened / new that day)');
for (const d of days) line(`  ${d}  ${pad(actOf(byDay[d]), 4)} opened  ${pad(byDay[d].act_0 || 0, 3)} new`);
line(
  `  Platforms (phone-days): ${
    Object.entries(plat)
      .map(([p, n]) => p + ' ' + n)
      .join(', ') || '-'
  }`,
);
line(
  `  Versions (batches): ${
    Object.entries(vers)
      .sort((x, y) => y[1] - x[1])
      .map(([v, n]) => v + ' ' + n)
      .join(', ') || '-'
  }`,
);

/* ---------- coming back ---------- */
const fresh = g('act_0');
head('Coming back (of the phones new in these days; rough, since a phone new this week cannot be back a week later yet)');
line(`  Next day:        ${rate(g('act_1'), fresh)}`);
line(`  7 or more days:  ${rate(g('ret_7'), fresh)}  (only builds after 1.3.2 send ret_7 and ret_30)`);
line(`  30 or more days: ${rate(g('ret_30'), fresh)}`);
line(`  Phone-days by days since first open: ${ACT.map((k) => k.slice(4) + ': ' + g(k)).join(', ')}`);
if (big(fresh)) {
  const d1 = g('act_1') / fresh;
  if (d1 < 0.25) say.push(`Only ${pct(g('act_1'), fresh)} come back the next day: the first day (setup and the first Today) is where to work.`);
  else if (d1 >= 0.4) say.push(`${pct(g('act_1'), fresh)} come back the next day, which is good for a habit app; the next leak is later.`);
}

/* ---------- setup ---------- */
const setupKeys = Object.keys(sum).filter((k) => k.startsWith('setup_') && k !== 'setup_done');
if (setupKeys.length) {
  head('Setup: how many phones reached each page');
  const order = PAGES.length
    ? PAGES.filter((p) => sum['setup_' + p] != null)
    : setupKeys.map((k) => k.slice(6)).sort((a, b) => g('setup_' + b) - g('setup_' + a));
  const top = g('setup_' + order[0]) || 1;
  let worst = null;
  let prev = null;
  for (const p of order) {
    const n = g('setup_' + p);
    const drop = prev != null ? prev - n : 0;
    if (prev != null && (!worst || drop > worst.drop)) worst = { p, drop, from: prev };
    line(`  ${pad(p, 10)} ${pad(n, 4)} ${'#'.repeat(Math.round((20 * n) / top))}${drop > 0 ? '  -' + drop : ''}`);
    prev = n;
  }
  line(`  finished   ${g('setup_done')}  (${pct(g('setup_done'), top)} of those who started)`);
  if (big(top) && worst && worst.drop / worst.from >= 0.15)
    say.push(`Setup loses the most people at "${worst.p}" (${worst.drop} of ${worst.from}): look at that page first.`);
}

/* ---------- reminders ---------- */
const KINDS = { lesson: 'Lesson', checkin: 'Check-in', wind: 'Wind-down', sunday: 'Sunday review', risk: 'Hard hours', back: 'Come-back note', plan: 'Plan' };
const active = actOf(sum);
head('Reminders (counted when the app is next opened, so ones sent to people who never came back are missing)');
line(`  Reminders allowed: ${rate(g('rem_on'), active)} of phone-days`);
line(`  ${pad('', 15)} ${pad('arrived', 8)} ${pad('opened from it', 16)} did it that day`);
for (const [k, name] of Object.entries(KINDS)) {
  const n = g('nt_' + k);
  if (!n && !g('nt_' + k + '_tap')) continue;
  const did = k === 'back' || k === 'plan' ? '' : pct(g('nt_' + k + '_did'), n);
  line(`  ${pad(name, 15)} ${pad(n, 8)} ${pad(pct(g('nt_' + k + '_tap'), n), 16)} ${did}`);
  if (big(n)) {
    const t = g('nt_' + k + '_tap') / n;
    const dd = g('nt_' + k + '_did') / n;
    if (k !== 'back' && k !== 'plan' && dd < 0.2)
      say.push(`The ${name.toLowerCase()} reminder is rarely followed by doing it (${pct(g('nt_' + k + '_did'), n)}): try a different time or words.`);
    else if (t >= 0.3) say.push(`The ${name.toLowerCase()} reminder brings people in (${pct(g('nt_' + k + '_tap'), n)} opened from it).`);
  }
}

/* ---------- SOS, tools, lessons ---------- */
if (g('sos')) {
  head('SOS');
  const open = g('sos');
  const left = Math.max(0, open - g('sos_rode') - g('sos_slip'));
  line(`  Opened ${open}: It passed ${rate(g('sos_rode'), open)}, I slipped ${g('sos_slip')}, closed with no answer ${left}`);
  if (big(open)) {
    if (g('sos_rode') / open >= 0.5) say.push(`SOS works: ${pct(g('sos_rode'), open)} of SOS opens end with It passed.`);
    if (left / open >= 0.4) say.push(`${pct(left, open)} of SOS opens end with no answer: the end of SOS may not be clear, or people leave it early.`);
  }
}
const tools = [
  ...new Set(
    Object.keys(sum)
      .filter((k) => k.startsWith('tool_'))
      .map((k) => k.slice(5).replace(/_open$/, '')),
  ),
];
if (tools.length) {
  head('Tools (opened / finished)');
  for (const t of tools.sort((a, b) => g('tool_' + b) - g('tool_' + a))) {
    const o = g('tool_' + t + '_open');
    line(`  ${pad(t, 10)} ${pad(o || '-', 4)} ${pad(g('tool_' + t), 4)} ${o ? pct(g('tool_' + t), o) + ' finished' : ''}`);
    if (big(o) && g('tool_' + t) / o < 0.4) say.push(`The ${t} tool is often left before the end (${pct(g('tool_' + t), o)} finished).`);
  }
}
if (g('lesson_open') || g('lesson_done')) {
  head('Lessons');
  line(`  Opened ${g('lesson_open')}, finished ${rate(g('lesson_done'), g('lesson_open'))}`);
  const ld = Object.keys(sum)
    .filter((k) => k.startsWith('ld_l'))
    .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)));
  if (ld.length) line('  Finished, by lesson: ' + ld.map((k) => k.slice(3) + ' ' + g(k)).join(', '));
  if (big(g('lesson_open')) && g('lesson_done') / g('lesson_open') < 0.6)
    say.push(`Lessons are opened more than finished (${pct(g('lesson_done'), g('lesson_open'))}): they may be too long.`);
}

/* ---------- slips, the rest, the asks ---------- */
head('Slips and comebacks');
const back = ['back_1', 'back_2_3', 'back_4_7', 'back_8'];
const backs = back.reduce((t, k) => t + g(k), 0);
line(`  Slips logged ${g('slip_logged')}, urges logged ${g('urge_logged')}`);
line(`  Came back after a slip: next day ${g('back_1')}, 2-3 days ${g('back_2_3')}, 4-7 days ${g('back_4_7')}, 8+ days ${g('back_8')}`);
if (big(backs)) say.push(`${pct(g('back_1'), backs)} of comebacks after a slip are the next day.`);

head('Used (each counted once a day for the tabs)');
const USED = ['checkin', 'sunrise', 'talk_done', 'goodnight', 'rk_small', 'rk_phone', 'feedback', 'tab_learn', 'tab_pattern', 'tab_more'];
line('  ' + USED.map((k) => k + ' ' + g(k)).join(', '));

head('Asks');
line(`  Tip ask shown ${g('ask_tip')} (phone-days), tip page opened ${g('tip_open')}. Tips themselves: see Apple above, and Stripe.`);
line(`  Account page opened ${g('acct_open')}, accounts made ${rate(g('acct_made'), g('acct_open'))}`);
if (big(g('ask_tip')) && g('tip_open') / g('ask_tip') < 0.05)
  say.push(`The tip ask is rarely tapped (${pct(g('tip_open'), g('ask_tip'))}): try another moment or line.`);

head('What this suggests');
if (say.length) for (const s of say) line('  - ' + s);
else line(`  Too few yet to say anything (a line shows once the numbers behind it reach ${MIN}).`);
console.log(out.join('\n'));
