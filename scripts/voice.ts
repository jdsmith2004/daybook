/* Records the lesson cards for Listen with Kokoro (packages/core voice.ts). Safe to run at any time: a card is named by a hash of its
   voice and words, so only cards that are new or changed are recorded.

     npm run voice                          every voice, into apps/mobile/public/voice (kept out of git), for trying it on the web
     npm run voice -- --voice am_michael    one voice
     npm run voice -- --limit 20            only the first 20 cards still to record (the Mac is short on memory: go in batches)
     npm run voice -- --missing-from site   only the cards the live website does not have yet (or give an address in place of site)
     npm run voice -- --list <file>         write the cards to record to a file, record nothing

   Kokoro runs in a Python virtual environment outside the repository: ~/.cache/daybook-voice/.venv by default, or VOICE_PY. Set one up:
     uv venv --python 3.12 ~/.cache/daybook-voice/.venv
     uv pip install --python ~/.cache/daybook-voice/.venv/bin/python kokoro soundfile "misaki[en]" en_core_web_sm@https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
   It needs ffmpeg and espeak-ng too (brew install ffmpeg espeak-ng). Run with: node --import ./scripts/ts-resolve.mjs scripts/voice.ts */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SITE_URL } from '../packages/core/src/supporter.ts';
import { VOICE_SPEED, VOICES, voiceLines, voiceUrl, type VoiceLine } from '../packages/core/src/voice.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k: string) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const voices = arg('voice') ? VOICES.filter((v) => v.id === arg('voice')) : VOICES;
if (!voices.length) throw new Error('no such voice: ' + arg('voice') + ' (core voice.ts VOICES)');
const out = arg('out') || join(root, 'apps/mobile/public/voice');
const limit = Number(arg('limit')) || 0;
const site = arg('missing-from') === 'site' ? SITE_URL : arg('missing-from');

/* the cards a site already has: its timing file is there, and is JSON (a missing file comes back as the app's page) */
async function missing(lines: VoiceLine[]): Promise<VoiceLine[]> {
  const need: VoiceLine[] = [];
  for (let i = 0; i < lines.length; i += 24)
    await Promise.all(
      lines.slice(i, i + 24).map(async (x) => {
        try {
          const r = await fetch(voiceUrl(site!, x.key, 'json'), { method: 'HEAD' });
          if (!r.ok || !/json/.test(r.headers.get('content-type') || '')) need.push(x);
        } catch {
          need.push(x);
        }
      }),
    );
  return need;
}

for (const v of voices) {
  let lines = voiceLines(v.id);
  const all = lines.length;
  if (site) lines = await missing(lines);
  console.log(`${v.id}: ${all} cards${site ? `, ${lines.length} not on the site yet` : ''}`);
  if (arg('list')) {
    const f = arg('list')!.replace('{voice}', v.id);
    writeFileSync(f, JSON.stringify(lines));
    continue;
  }
  if (!lines.length) continue;
  mkdirSync(out, { recursive: true });
  const tmp = join(mkdtempSync(join(tmpdir(), 'voice-')), 'lines.json');
  writeFileSync(tmp, JSON.stringify(lines));
  const py = process.env.VOICE_PY || join(homedir(), '.cache/daybook-voice/.venv/bin/python');
  if (!existsSync(py)) throw new Error('no Kokoro environment at ' + py + ': see the top of scripts/voice.ts');
  const r = spawnSync(
    py,
    [
      '-I',
      join(root, 'scripts/voice_render.py'),
      tmp,
      out,
      '--voice',
      v.id,
      '--speed',
      String(VOICE_SPEED),
      ...(limit ? ['--limit', String(limit)] : []),
      ...(arg('minutes') ? ['--minutes', arg('minutes')!] : []),
    ],
    { stdio: 'inherit' },
  );
  if (r.status) process.exit(r.status);
}
