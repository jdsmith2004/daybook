/* The owner reads their own log (the owner, November 15, 2026: "I want us to build it in where you can at least see my logs
   because I'm using that to train the data so that doesn't have to be anonymous").

     npm run mylog                      asks for the account's email and password, saves the log, prints only counts
     npm run mylog -- --out <folder>    somewhere else (default: ~/personal/daybook-private, outside every repository)

   How it stays narrow: it signs in with the account's own email and password (sent only to Cognito, never kept), then reads
   the log through the same sync API the app uses, GET /sync. That API answers only with the records of the account whose
   sign-in it checked (the `sub` in the token API Gateway verified), so this script can never read anyone else's log, and
   nothing on the server was added or widened for it. The password is typed at the prompt by the owner, never passed on the
   command line or saved, and the tokens live only in memory while it runs.

   The file is the app's own backup format (core makeBackup), so it can also be brought back in the app with Restore, plus a
   `records` list exactly as the account holds them. It never goes into git: the default folder is outside the repository, and
   `mylog/` is ignored in case one is made inside it. Run with: node --import ./scripts/ts-resolve.mjs scripts/mylog.ts */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

import { cognitoClient, CognitoError, regionOfAuthDomain } from '../packages/core/src/cognito.ts';
import { makeBackup } from '../packages/core/src/data.ts';
import { isPullPage, pullAll, snapshotOf } from '../packages/core/src/sync.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k: string) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : undefined;
};

/* the app's public addresses, from the store build's settings (nothing secret: they ship inside the app) */
const env = (JSON.parse(readFileSync(join(root, 'apps/mobile/eas.json'), 'utf8')) as { build: { production: { env: Record<string, string> } } }).build
  .production.env;
const SYNC_URL = process.env.EXPO_PUBLIC_SYNC_URL || env.EXPO_PUBLIC_SYNC_URL;
const AUTH_DOMAIN = process.env.EXPO_PUBLIC_AUTH_DOMAIN || env.EXPO_PUBLIC_AUTH_DOMAIN;
const CLIENT_ID = process.env.EXPO_PUBLIC_CLIENT_ID || env.EXPO_PUBLIC_CLIENT_ID;

function ask(q: string, hidden = false): Promise<string> {
  return new Promise((done) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      /* the password is not shown as it is typed */
      const w = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
        if (s.startsWith(q)) w.call(rl, q);
        else if (s.includes('\n') || s.includes('\r')) w.call(rl, '\n');
      };
    }
    rl.question(q, (a) => {
      rl.close();
      done(a);
    });
  });
}

async function main() {
  const email = process.env.DAYBOOK_EMAIL || (await ask('Email: '));
  const password = await ask('Password: ', true);
  const c = cognitoClient(regionOfAuthDomain(AUTH_DOMAIN) || 'us-east-2', CLIENT_ID);
  let access: string;
  try {
    const r = await c.signIn(email, password);
    if (r.k !== 'ok')
      throw new Error(r.k === 'confirm' ? 'This account is not confirmed yet.' : 'This account needs a new password first: sign in once in the app.');
    access = r.tokens.access;
  } catch (e) {
    if (e instanceof CognitoError) throw new Error(e.message + ' (an account that only signs in with Apple has no password: see the note in scripts/mylog.ts)');
    throw e;
  }
  const call = async (query: string) => {
    const res = await fetch(SYNC_URL + query, { headers: { authorization: 'Bearer ' + access } });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`The sync API answered ${res.status}` + (body && typeof body.error === 'string' ? ': ' + body.error : ''));
    return body;
  };
  const { records, now } = await pullAll(
    {
      pull: async (since, cursor) => {
        const p = await call(`?since=${since}` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''));
        if (!isPullPage(p)) throw new Error('The sync API sent something that is not a page of records.');
        return p;
      },
      push: async () => {
        throw new Error('mylog only reads');
      },
    },
    0,
  );
  const snap = snapshotOf(records);
  const at = new Date(now);
  const out = resolve(arg('out') || join(homedir(), 'personal', 'daybook-private'));
  mkdirSync(out, { recursive: true, mode: 0o700 });
  const file = join(out, `mylog-${at.toISOString().slice(0, 10)}.json`);
  writeFileSync(file, JSON.stringify({ ...makeBackup(snap, at), records }, null, 2), { mode: 0o600 });
  const days = Object.values(snap.days);
  const events = days.reduce((n, d) => n + (d.events?.length || 0), 0);
  /* counts only: the log itself is read from the file, never printed */
  console.log(
    `Saved ${records.length} records: ${days.length} days, ${events} entries, ${Object.keys(snap.reviews).length} reviews, ${Object.keys(snap.journal || {}).length} journal days.`,
  );
  console.log(file);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
