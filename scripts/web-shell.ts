/* Makes the exported web app show itself at once (the owner, November 15, 2026: "I want a more permanent fix. So it loads quickly, like
   almost immediately, and then it can load all that other stuff in the background as they're using it"). Run on the folder that
   `expo export --platform web` made, after the export (the Deploy workflow and npm run preview do):
     node --no-warnings --import ./scripts/ts-resolve.mjs scripts/web-shell.ts apps/mobile/dist
   An export made with EXPO_BASE_URL (the demo at /demo/ on the live site) passes the same base after the folder: its files sit at the
   folder's root, but the page asks for them under the base.
   It changes only index.html, in three ways:
   - the first picture is in the page itself: the flame asleep on the launch night, the same drawing as the opening scene's first
     frame (core launchFlameSvg, components/launch.tsx), so it shows before any code has arrived. The app takes it away on its first real
     frame (apps/mobile src/lib/web-shell.ts), so on Today the opening takes over with no seam, and any other page simply appears;
   - the code every screen needs and the fonts are asked for at once (preload), alongside the entry, instead of after it has run;
   - once the app has drawn and the phone is idle, the code for every other screen is fetched quietly, one file at a time, so the
     next screen opens at once (skipped when the browser asks to save data). The files never change once made (their names are
     hashes), so the browser keeps them. */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { LAUNCH_BG, LAUNCH_W, launchFlameSvg } from '../packages/core/src/big-layers.ts';

const dir = process.argv[2];
if (!dir) throw new Error('Usage: web-shell.ts <export folder> [base, like /demo]');
const base = (process.argv[3] || '').replace(/\/+$/, '');
if (base && !/^\/[\w-]+$/.test(base)) throw new Error('web-shell: the base is one folder, like /demo');
const page = join(dir, 'index.html');
let html = readFileSync(page, 'utf8');
if (html.includes('id="shell"')) {
  console.log('web-shell: already done');
  process.exit(0);
}

const files = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]));
/* every file as the page asks for it, under the base */
const all = files(dir).map((f) => base + '/' + relative(dir, f).split(sep).join('/'));
/* the fonts the app waits for before its first frame: the ones the root layout loads (useFonts in apps/mobile src/app/_layout.tsx) */
const layout = readFileSync(join(import.meta.dirname, '../apps/mobile/src/app/_layout.tsx'), 'utf8');
const wanted = new Set([...layout.matchAll(/^import \{ (\w+) \} from '@expo-google-fonts\//gm)].map((m) => m[1]));
const fonts = all.filter((f) => f.startsWith(base + '/assets/') && f.endsWith('.ttf') && wanted.has(f.split('/').pop()!.split('.')[0]));
/* The code a screen needs, read from the entry: Expo Router's table of routes names each screen's module ("./(tabs)/index.tsx":
   ...d[N]...), and the entry's map of chunks (d.paths, Expo's granular chunks) lists the files each module needs. Without these the
   page asks for a screen's files only once the entry (about 1.3 MB) has arrived and run, one wait after another. */
const named = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
const entry = named.find((f) => /\/index-[0-9a-f]+\.js$/.test(f));
const code = entry ? readFileSync(join(dir, entry.slice(base.length)), 'utf8') : '';
function routeFiles(route: string): string[] {
  const at = code.indexOf(JSON.stringify(route) + ':{');
  if (at < 0) return [];
  const n = code.slice(at, at + 200).match(/d\[(\d+)\],d\.paths/)?.[1];
  /* the module's dependency map, which holds both its numbered dependencies and the paths, comes after the route table */
  const deps = code.slice(at).match(/\{"0":\d+(?:,"\d+":\d+)*,"paths":\{.*?\}\}/s)?.[0];
  if (!n || !deps) return [];
  const id = deps.match(new RegExp(`"${n}":(\\d+)`))?.[1];
  const list = id && deps.match(new RegExp(`"${id}":\\[([^\\]]*)\\]`))?.[1];
  return list ? [...list.matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
}
/* every screen needs the root layout */
const early = routeFiles('./_layout.tsx');
if (!early.length) console.warn("web-shell: the root layout's files were not found, so they are not asked for early (the page still works)");
/* Today needs its tabs and its own page too, asked for only when the page opens on Today: the opening scene flies the flame to its
   place on Today's sky, and when Today's code comes late the scene gives up and only fades (the owner, November 15, 2026: "the logo
   never like moves or does the thing") */
const today = [...new Set([...routeFiles('./(tabs)/_layout.tsx'), ...routeFiles('./(tabs)/index.tsx')])].filter((f) => !early.includes(f));
if (!today.length) console.warn("web-shell: Today's files were not found, so they are not asked for early on Today");
/* every other chunk is fetched later, once the app has drawn and the phone is idle */
const now = new Set([...named, ...early]);
const later = all.filter((f) => f.startsWith(base + '/_expo/static/js/web/') && f.endsWith('.js') && !now.has(f));

const half = LAUNCH_W / 2;
const head = [
  ...early.map((f) => `<link rel="preload" href="${f}" as="script">`),
  `<script>if(location.pathname.replace(/\\/+$/,'')===${JSON.stringify(base)}){${JSON.stringify(today)}.forEach(function(u){var l=document.createElement('link');l.rel='preload';l.as='script';l.href=u;document.head.appendChild(l)})}</script>`,
  ...fonts.map((f) => `<link rel="preload" href="${f}" as="font" type="font/ttf" crossorigin>`),
  `<style>#shell{position:fixed;inset:0;background:${LAUNCH_BG};z-index:1}` +
    `#shell svg{position:absolute;left:50%;top:50%;width:${LAUNCH_W}px;height:${LAUNCH_W}px;margin:-${half}px 0 0 -${half}px}` +
    `</style>`,
].join('');
const shell = `<div id="shell" aria-hidden="true">${launchFlameSvg()}</div>`;
/* starts when the app says it has drawn (lib/web-shell.ts sends daybook:drawn), so it never slows the first screen */
const fetchLater =
  `<script>(function(){var l=${JSON.stringify(later)};var c=navigator.connection;if(c&&c.saveData)return;` +
  `var idle=window.requestIdleCallback||function(f){return setTimeout(f,200)};var on=0;` +
  `function next(){var u=l.shift();if(!u)return;fetch(u,{priority:'low'}).catch(function(){}).then(function(){idle(next)})}` +
  `function go(){if(on)return;on=1;setTimeout(function(){idle(next)},1500)}` +
  `addEventListener('daybook:drawn',go)})()</script>`;

html = html.replace('</head>', head + '</head>');
if (!/<div id="root"><\/div>/.test(html)) throw new Error('web-shell: no empty #root in index.html');
html = html.replace('<div id="root"></div>', '<div id="root"></div>' + shell + fetchLater);
writeFileSync(page, html);
console.log(
  `web-shell: the first picture, ${early.length} files every screen needs and ${today.length} more on Today asked for at once, ${fonts.length} fonts, ${later.length} files fetched once drawn`,
);
