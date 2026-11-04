/* Daybook's own anonymous daily totals for the Stats workflow, from a DynamoDB query of the pulse table's totals (pk "c",
   services/api/src/pulse-store.ts): per day and platform, how many phones opened the app (act_*: days since first open), how
   far setup got (setup_*), and the versions seen. The names mean what core pulse.ts says. Usage: node scripts/stats-pulse.mjs pulse.json */
import { readFileSync } from 'node:fs';

const items = JSON.parse(readFileSync(process.argv[2], 'utf8')).Items || [];
const val = (x) => (x.N !== undefined ? Number(x.N) : x.S);
const ACT = { act_0: 'first day', act_1: 'next day', act_2_6: 'days 2-6', act_7_13: 'week 2', act_14_29: 'weeks 3-4', act_30: 'day 30+' };

const days = {};
for (const it of items) {
  const sk = val(it.sk);
  const [d, a, b] = sk.split('#');
  const row = (days[d] ||= { opens: {}, setup: {}, versions: {}, used: {} });
  const c = Object.fromEntries(Object.entries(it).map(([k, x]) => [k, val(x)]));
  if (a === 'v') {
    row.versions[b] = (row.versions[b] || 0) + (c.batches || 0);
    continue;
  }
  for (const [k, n] of Object.entries(c)) {
    if (k === 'pk' || k === 'sk' || k === 'batches') continue;
    if (ACT[k]) row.opens[a + ' ' + ACT[k]] = n;
    else if (k.startsWith('setup_')) row.setup[k.slice(6)] = (row.setup[k.slice(6)] || 0) + n;
    else row.used[k] = (row.used[k] || 0) + n;
  }
}

const list = (o) =>
  Object.entries(o)
    .map(([k, n]) => k + ' ' + n)
    .join(', ') || '-';
console.log('Phones and browsers that opened Daybook, by day (each counts once a day; sent on a later open, so the last day fills in late).\n');
for (const d of Object.keys(days).sort()) {
  const r = days[d];
  console.log(d + '  opened: ' + list(r.opens));
  if (Object.keys(r.setup).length) console.log('            setup reached: ' + list(r.setup));
  if (Object.keys(r.used).length) console.log('            used: ' + list(r.used));
  console.log('            versions: ' + list(r.versions));
}
if (!Object.keys(days).length) console.log('Nothing yet in these days.');
