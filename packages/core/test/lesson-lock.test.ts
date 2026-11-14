/* The lessons are set in stone (the owner, November 14, 2026: "these lessons need to be enshrined in stone ... what i don't want to
   happen is have the lessons lose their soul and spirit when i'm doing design changes"). This keeps a fingerprint of every word a
   lesson says, in every faith voice and every habit, and fails when one changes. A lesson's words change only with the owner's yes for
   that change (docs/lessons.md). With that yes, update the fingerprints in the same commit and quote the yes in the message:
     cd packages/core && UPDATE_LESSON_LOCK=1 npx vitest run test/lesson-lock.test.ts */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import type { FaithVoice } from '../src/faith';
import type { Habit } from '../src/habit';

const LOCK = join(__dirname, 'lesson-lock.json');
const VOICES: (FaithVoice | null)[] = [null, 'lds', 'christian', 'plain'];
const HABITS: Habit[] = ['porn', 'alcohol', 'gambling', 'other'];

/** every word of one lesson as a person reads it, in every voice and habit */
function wordsOf(id: string): string {
  const L0 = core.lessonById(id)!;
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const v of VOICES)
    for (const h of HABITS) {
      const L = core.lessonAs(L0, v, h);
      const s = JSON.stringify({ title: L.title, tag: L.tag, ask: L.ask, key: L.key, np: L.np, cards: L.cards, beats: core.lessonBeats(L) });
      if (!seen.has(s)) (seen.add(s), parts.push(s));
    }
  return parts.join('\n');
}
const print = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);

describe('the lessons are locked', () => {
  const now: Record<string, string> = Object.fromEntries(core.LESSONS.map((L) => [L.id, print(wordsOf(L.id))]));
  if (process.env.UPDATE_LESSON_LOCK) writeFileSync(LOCK, JSON.stringify(now, null, 2) + '\n');
  const kept: Record<string, string> = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : {};

  it('no lesson changed its words without the owner’s yes (docs/lessons.md)', () => {
    const changed = Object.keys({ ...kept, ...now }).filter((id) => kept[id] !== now[id]);
    expect(
      changed,
      'These lessons changed: ' +
        changed.join(', ') +
        '. A lesson changes only with the owner’s yes for that change. With it, run UPDATE_LESSON_LOCK=1 npx vitest run test/lesson-lock.test.ts in packages/core.',
    ).toEqual([]);
  });

  it('Long plays every card of every lesson: no design hides one', () => {
    core.LESSONS.forEach((L) => {
      const long = core.lessonSeq(L, 'f').filter((x) => x.t === 'card').length;
      expect(long, L.id).toBe(core.lessonCore(L).length);
    });
  });
});
