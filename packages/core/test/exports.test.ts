/* A name exported both by the generated legacy core and by a TypeScript file is silently dropped by "export *" (it becomes
   ambiguous). This makes sure that never happens. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const src = join(dirname(fileURLToPath(import.meta.url)), '../src');
it('no name is exported twice', () => {
  const core = readFileSync(join(src, 'legacy/core.js'), 'utf8');
  const legacy = new Set(core.slice(core.lastIndexOf('export {')).match(/\b[A-Za-z_$][\w$]*\b/g)!.slice(1));
  const twice: string[] = [];
  for (const f of readdirSync(src).filter((x) => x.endsWith('.ts'))) {
    const s = readFileSync(join(src, f), 'utf8');
    for (const m of s.matchAll(/^export (?:async )?(?:function|const|let|class) ([A-Za-z_$][\w$]*)/gm)) if (legacy.has(m[1])) twice.push(f + ': ' + m[1]);
  }
  expect(twice).toEqual([]);
});
