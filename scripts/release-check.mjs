/* The release checklist: everything CLAUDE.md asks before a store build, in one command.

     npm run release-check              run every step; exit 1 if any fails
     npm run release-check -- --quick   skip the slow steps (journey pictures and the icon step)

   Steps: format, typecheck, tests (which include the words test: no "clean", "addict" or "relapse" in the app's own voice), the store
   listing scan for the banned words (CLAUDE.md, "The store listing never names porn"), the journey pictures, the icon for the date,
   and a check that the version was bumped past origin/main. Then it prints what a machine cannot check: look at every picture, and
   ask the identity question of every screen (docs/craft-checklist.md, "The critic"). */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const quick = process.argv.includes('--quick');
const results = [];

const run = (cmd, args) => {
  try {
    execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
};
const step = (name, fn) => {
  console.log(`\n== ${name}`);
  let r;
  try {
    r = fn();
  } catch (e) {
    r = { ok: false, note: String(e.message ?? e) };
  }
  if (typeof r === 'boolean') r = { ok: r };
  results.push({ name, ...r });
  console.log(r.ok ? `   ok${r.note ? ': ' + r.note : ''}` : `   FAILED${r.note ? ': ' + r.note : ''}`);
};

step('format', () => run('npm', ['run', 'format:check']));
step('typecheck', () => run('npm', ['run', 'typecheck']));
step('tests, including the words test', () => run('npm', ['test']));

/* the store text: the listing section of docs/launch.md (name, subtitle, keywords, promo text, What's New, description) and any
   plain-text store file under store-assets */
const BANNED = /\b(porn\w*|nofap|sex\w*|xxx|erotic\w*|masturbat\w*)\b/i;
step('store listing has no banned words', () => {
  const texts = [];
  const launch = readFileSync(join(root, 'docs/launch.md'), 'utf8');
  /* from the name to the screenshots: the words a person reads on the store. The age rating answers below it name the topic on purpose. */
  const m = launch.match(/^- \*\*Name:\*\*[\s\S]*?(?=^- \*\*Screenshots:\*\*)/m);
  if (!m) return { ok: false, note: 'could not find the Name to Screenshots part of the listing in docs/launch.md' };
  const first = launch.slice(0, m.index).split('\n').length - 1;
  texts.push(['docs/launch.md', '\n'.repeat(first) + m[0]]);
  const sa = join(root, 'store-assets');
  if (existsSync(sa)) {
    const walk = (d) => {
      for (const f of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, f.name);
        if (f.isDirectory()) walk(p);
        else if (/\.(txt|md|json)$/.test(f.name)) texts.push([p.slice(root.length + 1), readFileSync(p, 'utf8')]);
      }
    };
    walk(sa);
  }
  const hits = [];
  for (const [name, text] of texts)
    text.split('\n').forEach((line, i) => {
      const w = line.match(BANNED);
      if (w) hits.push(`${name}:${i + 1} "${w[0]}"`);
    });
  return hits.length ? { ok: false, note: '\n   ' + hits.join('\n   ') } : { ok: true, note: 'screenshots are pictures: look at each one for these words' };
});

/* the lock screen test arrives with the Live Activity work; run it when it is there */
step('lock screen names no habit and no count', () => {
  const t = join(root, 'packages/core/test/lock-screen.test.ts');
  if (!existsSync(t)) return { ok: true, note: 'no lock-screen test on this branch yet (it is covered by npm test when it lands)' };
  return run('npm', ['test', '-w', '@daybook/core', '--', 'lock-screen']);
});

if (!quick) {
  step('journey pictures', () => run('npm', ['run', 'journey']));
  step('icon for the date', () => run('npm', ['run', 'icons', '--', '--auto']));
} else console.log('\n(--quick: journey pictures and icons skipped)');

step('version bumped', () => {
  const ver = (s) => JSON.parse(s).expo?.version ?? JSON.parse(s).version;
  const now = ver(readFileSync(join(root, 'apps/mobile/app.json'), 'utf8'));
  let before;
  try {
    before = ver(execFileSync('git', ['show', 'origin/main:apps/mobile/app.json'], { cwd: root, encoding: 'utf8' }));
  } catch {
    return { ok: false, note: 'could not read origin/main (run git fetch)' };
  }
  return now !== before ? { ok: true, note: `${before} to ${now}` } : { ok: false, note: `still ${now}, the same as origin/main` };
});

console.log('\n== summary');
for (const r of results) console.log(`${r.ok ? 'ok    ' : 'FAILED'} ${r.name}`);
console.log(
  '\nNot checkable by a machine: look at every journey picture (journey-shots/), run the critic, and ask of EVERY screen, not only the changed ones:\n' +
    'does it treat the person as an addict or a score, or as someone becoming free? (docs/craft-checklist.md, "The critic"). Say which icon the update carries.',
);
process.exit(results.every((r) => r.ok) ? 0 : 1);
