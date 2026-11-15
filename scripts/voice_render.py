"""Records lesson cards with Kokoro (Kokoro-82M, Apache-2.0), for Listen (packages/core voice.ts).

Reads a JSON list of {key, said} and writes, for each key not already in the output folder:
  <key>.m4a   the card read aloud: AAC, mono, 24 kHz, small
  <key>.json  its timing: {key, ms, w: [char index, start ms, ...]}, where each word starts, so the word being said can be lit

Run by scripts/voice.ts (npm run voice), never by hand. Safe to run again at any time: a key already recorded is skipped.

  python voice_render.py <lines.json> <out dir> [--voice af_heart] [--speed 0.95] [--limit N] [--minutes M]
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
import time

import numpy as np
import soundfile as sf
from kokoro import KPipeline

RATE = 24000


def timing(said, results):
    """The place in `said` of each word Kokoro spoke, and when it started (ms), across every chunk it split the text into."""
    w = []
    at = 0  # where to look next in said
    off = 0.0  # seconds of audio before this chunk
    for audio, tokens in results:
        for t in tokens or []:
            text = (t.text or '').strip()
            if not text or t.start_ts is None:
                continue
            # only words: punctuation on its own is not lit
            if not any(c.isalnum() for c in text):
                continue
            i = said.find(text, at)
            if i < 0:
                # Kokoro may spell a token differently (a number, a dash): find the next word start instead
                j = at
                while j < len(said) and not said[j].isalnum():
                    j += 1
                if j >= len(said):
                    continue
                i = j
                text = said[j:].split(' ', 1)[0]
            # a word's start is where its run of letters starts, so "said," lights from the s
            ms = int(round((off + t.start_ts) * 1000))
            if not w or i > w[-2]:
                if w and ms < w[-1]:
                    ms = w[-1]
                w += [i, ms]
            at = i + len(text)
        off += len(audio) / RATE
    return w, int(round(off * 1000))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('lines')
    ap.add_argument('out')
    ap.add_argument('--voice', default='af_heart')
    ap.add_argument('--speed', type=float, default=0.95)
    ap.add_argument('--limit', type=int, default=0)
    # stop starting new cards after this many minutes; what is left is recorded on the next run
    ap.add_argument('--minutes', type=float, default=0)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    lines = json.load(open(a.lines))
    todo = [x for x in lines if not os.path.exists(os.path.join(a.out, x['key'] + '.json'))]
    if a.limit:
        todo = todo[: a.limit]
    print(f'{len(lines)} cards, {len(todo)} to record', flush=True)
    if not todo:
        return
    pipe = KPipeline(lang_code=a.voice[0], repo_id='hexgrad/Kokoro-82M')
    gap = np.zeros(int(RATE * 0.4), dtype=np.float32)
    began = time.time()
    for n, x in enumerate(todo, 1):
        if a.minutes and time.time() - began > a.minutes * 60:
            print(f'out of time: {len(todo) - n + 1} cards left for the next run', flush=True)
            break
        said, h = x['said'], x.get('h', 0)
        # the heading and the words, each its own sentence, with a short pause between (h: where the heading ends)
        pieces = [(0, said[:h]), (h + 1, said[h + 1 :])] if 0 < h < len(said) - 1 else [(0, said)]
        audio, w, ms = [], [], 0
        for start, text in pieces:
            if not text.strip():
                continue
            res = []
            for r in pipe(text, voice=a.voice, speed=a.speed, split_pattern=r'\n+'):
                au = r.audio.numpy() if hasattr(r.audio, 'numpy') else np.asarray(r.audio)
                res.append((au, r.tokens))
            pw, pms = timing(text, res)
            for i in range(0, len(pw), 2):
                w += [pw[i] + start, pw[i + 1] + ms]
            for au, _ in res:
                audio.append(au.astype(np.float32))
            ms += pms
            audio.append(gap)
            ms += int(len(gap) / RATE * 1000)
        if audio:
            audio.pop()
            ms -= int(len(gap) / RATE * 1000)
        wav = np.concatenate(audio) if audio else np.zeros(RATE // 10, dtype=np.float32)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            tmp = f.name
        sf.write(tmp, wav, RATE)
        m4a = os.path.join(a.out, x['key'] + '.m4a')
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-ac', '1', '-ar', str(RATE), '-c:a', 'aac', '-b:a', '40k', '-movflags', '+faststart', m4a],
            check=True,
        )
        os.unlink(tmp)
        # the timing is written last: a card counts as recorded only once both files are there
        json.dump({'key': x['key'], 'ms': ms, 'w': w}, open(os.path.join(a.out, x['key'] + '.json'), 'w'), separators=(',', ':'))
        print(f'{n}/{len(todo)} {x["key"]} {ms / 1000:.1f}s', flush=True)


if __name__ == '__main__':
    sys.exit(main())
