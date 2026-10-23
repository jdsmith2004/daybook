#!/usr/bin/env node
/* Bundles the Lambdas, each into one file, and zips them: services/api/dist/sync.zip (the sync API) and dist/signup.zip
   (the sign-up trigger, src/signup.ts) and dist/pulse.zip (the opt-in counts and feedback, src/pulse.ts), which Terraform
   uploads.
   The AWS SDK is left out because the Lambda Node.js runtime already has it. */
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, utimesSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(here, 'dist');
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const [name, entry] of [
  ['sync', 'src/index.ts'],
  ['signup', 'src/signup.ts'],
  ['pulse', 'src/pulse-index.ts'],
]) {
  const out = join(dist, name);
  mkdirSync(out, { recursive: true });
  await build({
    entryPoints: [join(here, entry)],
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    outfile: join(out, 'index.mjs'),
    external: ['@aws-sdk/*'],
    minify: true,
    sourcemap: 'linked',
    legalComments: 'none',
    /* Apple's library (sync) is CommonJS and requires Node's own modules; an ES module has no require, so give it one */
    banner: { js: "import { createRequire as __daybookRequire } from 'node:module'; const require = __daybookRequire(import.meta.url);" },
  });
  /* the same bytes every time for the same code (fixed file times), so Terraform only updates a Lambda when its code changed */
  for (const f of ['index.mjs', 'index.mjs.map']) utimesSync(join(out, f), 946684800, 946684800);
  execFileSync('zip', ['-X', '-q', '-j', join(dist, name + '.zip'), join(out, 'index.mjs'), join(out, 'index.mjs.map')]);
  console.log('built', join(dist, name + '.zip'));
}
