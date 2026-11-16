/* A fast web preview of the app with the made-up person, for showing a change (CLAUDE.md, "Merge, then show it on the web").
   It builds the demo build (EXPO_PUBLIC_SHOTS=1 and EXPO_PUBLIC_PREVIEW=1: the demo person from src/shots/demo.ts, kept in
   memory only and never saved, no network, full motion) as a minified static export, then serves it with gzip and a fallback to
   the app's page, so any deep link (/sos, /friends, /lesson/l3) opens straight on its screen with no setup.
     npm run preview                  build, then serve on port 4173
     npm run preview -- 8090          the same, on port 8090
     npm run preview -- --no-build    serve the last build again
   Demo states are the page's ?demo= (month, hard, grad, comeback, ...), and ?theme=dark shows the night colors. */
import { execFileSync } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { SITE_URL } from '../packages/core/src/supporter.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const app = join(root, 'apps/mobile');
const build = join(app, 'dist-preview');
const args = process.argv.slice(2);
const port = Number(args.find((a) => /^\d+$/.test(a)) ?? 4173);

if (!existsSync(join(root, 'node_modules/expo'))) {
  console.error('Install the packages first: npm ci');
  process.exit(1);
}
if (!args.includes('--no-build') || !existsSync(join(build, 'index.html'))) {
  console.log('Building the demo web app (about a minute)...');
  rmSync(build, { recursive: true, force: true });
  const t0 = Date.now();
  execFileSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', build], {
    cwd: app,
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, EXPO_PUBLIC_SHOTS: '1', EXPO_PUBLIC_PREVIEW: '1', EXPO_BASE_URL: '' },
  });
  /* the page's own first picture, the fonts asked for at once, and the other screens fetched when idle, as the live site has */
  execFileSync('node', ['--no-warnings', '--import', './scripts/ts-resolve.mjs', 'scripts/web-shell.ts', build], { cwd: root, stdio: 'inherit' });
  console.log(`Built in ${Math.round((Date.now() - t0) / 1000)} s.`);
}

const TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
};
const ZIP = new Set(['.js', '.html', '.css', '.json', '.txt', '.xml', '.svg']);
const zipped = new Map<string, Buffer>();

/* the file a path asks for: the file itself, then the same name with .html (the site's own pages), then the app's page, as
   the live site's CloudFront does for any path it has no file for */
function find(path: string) {
  const p = join(build, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!p.startsWith(build)) return join(build, 'index.html');
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(p + '.html')) return p + '.html';
  return join(build, 'index.html');
}

createServer(async (q, r) => {
  const path = decodeURIComponent((q.url || '/').split('?')[0]);
  /* Listen's recordings live only on the website (the Voice workflow), so they are fetched from there: Listen plays Kokoro here too */
  if (/^\/voice\/[\w-]+\.(m4a|json)$/.test(path) && !existsSync(join(build, path))) {
    try {
      const up = await fetch(SITE_URL + path);
      r.writeHead(up.status, { 'content-type': up.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'public, max-age=86400' });
      r.end(Buffer.from(await up.arrayBuffer()));
    } catch {
      r.writeHead(502).end();
    }
    return;
  }
  const file = find(path);
  const ext = extname(file);
  const headers: Record<string, string> = {
    'content-type': TYPES[ext] || 'application/octet-stream',
    'cache-control': file.includes('/_expo/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  };
  if (ZIP.has(ext) && /\bgzip\b/.test(String(q.headers['accept-encoding']))) {
    if (!zipped.has(file)) zipped.set(file, gzipSync(readFileSync(file)));
    r.writeHead(200, { ...headers, 'content-encoding': 'gzip', vary: 'accept-encoding' });
    r.end(zipped.get(file));
    return;
  }
  r.writeHead(200, headers);
  createReadStream(file).pipe(r);
})
  .on('error', (e: NodeJS.ErrnoException) => {
    console.error(e.code === 'EADDRINUSE' ? `Port ${port} is taken. Try another: npm run preview -- ${port + 1}` : e.message);
    process.exit(1);
  })
  .listen(port, () => {
    const at = `http://localhost:${port}`;
    console.log(`\nDaybook preview, with the made-up person (nothing is saved): ${at}/`);
    console.log(`  Today ${at}/   SOS ${at}/sos   Lessons ${at}/learn   A month of logs ${at}/?demo=month   Night ${at}/?theme=dark`);
    console.log('Ctrl+C stops it.');
  });
