/* Apple's daily downloads for the Stats workflow (.github/workflows/stats.yml), from the App Store Connect API's sales
   reports: first-time downloads, redownloads, updates and in-app purchases per day, and the countries they came from.
   Plain Node with no packages, so it runs in the workflow without npm. The key comes from secrets (ASC_KEY_ID, ASC_ISSUER_ID,
   ASC_KEY: the .p8 text, ASC_VENDOR: the vendor number). Apple posts a day's report the next morning, so the newest day may
   not be there yet. Usage: node scripts/stats-apple.mjs [days] */
import { createSign } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const { ASC_KEY_ID: kid, ASC_ISSUER_ID: iss, ASC_KEY: key, ASC_VENDOR: vendor } = process.env;
const APP = '6824362830';
const DAYS = Math.min(60, Math.max(1, parseInt(process.argv[2] || '14', 10) || 14));

if (!kid || !iss || !key || !vendor) {
  console.log('Apple: not set up yet (the App Store Connect API key is not in the repository secrets; see docs/launch.md, "Stats").');
  process.exit(0);
}

const b64 = (x) => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'ES256', kid, typ: 'JWT' });
  const body = b64({ iss, iat: now, exp: now + 15 * 60, aud: 'appstoreconnect-v1' });
  const sig = createSign('SHA256')
    .update(head + '.' + body)
    .sign({ key: key.replace(/\\n/g, '\n'), dsaEncoding: 'ieee-p1363' })
    .toString('base64url');
  return head + '.' + body + '.' + sig;
}

/** what a product type counts as: Apple's identifiers (1 app, 3 redownload, 7 update, IA and FI in-app) */
function kind(t) {
  if (/^IA|^FI/.test(t)) return 'iap';
  if (/^3/.test(t)) return 're';
  if (/^7/.test(t)) return 'up';
  if (/^1/.test(t)) return 'new';
  return null;
}

async function day(d, jwt) {
  const q = new URLSearchParams({
    'filter[frequency]': 'DAILY',
    'filter[reportType]': 'SALES',
    'filter[reportSubType]': 'SUMMARY',
    'filter[vendorNumber]': vendor,
    'filter[reportDate]': d,
  });
  const r = await fetch('https://api.appstoreconnect.apple.com/v1/salesReports?' + q, { headers: { Authorization: 'Bearer ' + jwt } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('Apple said ' + r.status + ' for ' + d + ': ' + (await r.text()).slice(0, 300));
  const rows = gunzipSync(Buffer.from(await r.arrayBuffer()))
    .toString('utf8')
    .trim()
    .split('\n')
    .map((l) => l.split('\t'));
  const h = rows.shift();
  const col = (n) => h.indexOf(n);
  const [cT, cU, cA, cP, cC] = ['Product Type Identifier', 'Units', 'Apple Identifier', 'Parent Identifier', 'Country Code'].map(col);
  const out = { new: 0, re: 0, up: 0, iap: 0, where: {} };
  for (const x of rows) {
    const k = kind(x[cT]);
    if (!k || (x[cA] !== APP && x[cP] !== APP && k !== 'iap')) continue;
    const n = parseInt(x[cU], 10) || 0;
    out[k] += n;
    if (k === 'new') out.where[x[cC]] = (out.where[x[cC]] || 0) + n;
  }
  return out;
}

const jwt = token();
const tot = { new: 0, re: 0, up: 0, iap: 0, where: {} };
console.log('Apple, by day (UTC). New = first-time downloads.\n');
console.log('day         new  redownload  update  in-app');
for (let i = DAYS; i >= 1; i--) {
  const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
  const r = await day(d, jwt);
  if (!r) {
    console.log(d + '   (no report yet)');
    continue;
  }
  for (const k of ['new', 're', 'up', 'iap']) tot[k] += r[k];
  for (const [c, n] of Object.entries(r.where)) tot.where[c] = (tot.where[c] || 0) + n;
  console.log(d + String(r.new).padStart(6) + String(r.re).padStart(12) + String(r.up).padStart(8) + String(r.iap).padStart(8));
}
console.log(
  '\nIn ' + DAYS + ' days: ' + tot.new + ' first-time downloads, ' + tot.re + ' redownloads, ' + tot.up + ' updates, ' + tot.iap + ' in-app purchases.',
);
const where = Object.entries(tot.where).sort((a, b) => b[1] - a[1]);
if (where.length) console.log('From: ' + where.map(([c, n]) => c + ' ' + n).join(', ') + '.');
