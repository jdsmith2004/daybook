/* The pictures of the iPhone app for the store images (npm run shots turns them into the App Store shots). It builds a release app in screenshot
   mode (EXPO_PUBLIC_SHOTS=1: the demo log, a fixed clock; src/shots/mode.native.ts), runs it on its own simulator with the status bar at 9:41,
   opens each screen that shots.json asks for, and saves store-assets/ios-screens/<look>-<screen>.png.
     npm run shots:ios                build, then every screen
     npm run shots:ios -- --no-build  reuse the last build
     npm run shots:ios -- --only sos  just the screens whose address has "sos" */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { screenFile } from './ios-screens.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iosDir = join(root, 'apps/mobile/ios');
const out = join(root, 'store-assets/ios-screens');
const derived = process.env.SHOTS_DERIVED || join(root, 'apps/mobile/dist-shots-ios');
const BUNDLE = 'com.jdsmith2004.daybook';
const NAME = 'Daybook Shots';
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const sim = (...a: string[]) => execFileSync('xcrun', ['simctl', ...a], { encoding: 'utf8' }).trim();
const wait = (s: number) => execFileSync('sleep', [String(s)]);

/* its own simulator, so the pictures never touch one in use */
const all = JSON.parse(sim('list', 'devices', 'available', '-j')).devices as Record<string, { name: string; udid: string; state: string }[]>;
const found = Object.values(all)
  .flat()
  .find((d) => d.name === NAME);
const id = found ? found.udid : sim('create', NAME, 'com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro');
if (found?.state !== 'Booted') execFileSync('xcrun', ['simctl', 'bootstatus', id, '-b'], { stdio: 'ignore' });
sim(
  'status_bar',
  id,
  'override',
  '--time',
  '9:41',
  '--dataNetwork',
  'wifi',
  '--wifiMode',
  'active',
  '--wifiBars',
  '3',
  '--cellularMode',
  'active',
  '--cellularBars',
  '4',
  '--batteryState',
  'discharging',
  '--batteryLevel',
  '100',
);

const app = join(derived, 'Build/Products/Release-iphonesimulator/Daybook.app');
if (!args.includes('--no-build') || !existsSync(app)) {
  console.log('Building the iPhone app in screenshot mode (some minutes)...');
  execFileSync(
    'xcodebuild',
    [
      '-workspace',
      'Daybook.xcworkspace',
      '-scheme',
      'Daybook',
      '-configuration',
      'Release',
      '-sdk',
      'iphonesimulator',
      '-destination',
      `id=${id}`,
      '-derivedDataPath',
      derived,
      'build',
    ],
    { cwd: iosDir, stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, EXPO_PUBLIC_SHOTS: '1' } },
  );
}
sim('install', id, app);

const scenes: { sizes: string[]; theme?: string; screen?: string; screen2?: string; screen3?: string }[] = JSON.parse(
  readFileSync(join(root, 'shots.json'), 'utf8'),
).scenes;
const want = new Map<string, { screen: string; theme: string }>();
for (const sc of scenes)
  if (sc.sizes.some((k) => k.startsWith('ios')))
    for (const screen of [sc.screen, sc.screen2, sc.screen3])
      if (screen && (!only || screen.includes(only))) want.set(screenFile(screen, sc.theme), { screen, theme: sc.theme === 'dark' ? 'dark' : 'light' });

mkdirSync(out, { recursive: true });
for (const [file, { screen, theme }] of want) {
  sim('ui', id, 'appearance', theme);
  try {
    sim('terminate', id, BUNDLE);
  } catch {
    /* it was not running */
  }
  sim('launch', id, BUNDLE, '-shotsScreen', screen);
  wait(screen === '/' ? 8 : 12);
  sim('io', id, 'screenshot', join(out, file));
  console.log('  ' + file);
}
console.log(`${want.size} pictures in store-assets/ios-screens. Now npm run shots.`);
