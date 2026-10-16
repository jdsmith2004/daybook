#!/usr/bin/env node
/* Bundles the Lambda into one file and zips it: services/api/dist/sync.zip, which Terraform uploads.
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
await build({
  entryPoints: [join(here, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: join(dist, 'index.mjs'),
  external: ['@aws-sdk/*'],
  minify: true,
  sourcemap: 'linked',
  legalComments: 'none',
});
/* the same bytes every time for the same code (fixed file times), so Terraform only updates the Lambda when the code changed */
for (const f of ['index.mjs', 'index.mjs.map']) utimesSync(join(dist, f), 946684800, 946684800);
execFileSync('zip', ['-X', '-q', '-j', join(dist, 'sync.zip'), join(dist, 'index.mjs'), join(dist, 'index.mjs.map')]);
console.log('built', join(dist, 'sync.zip'));
