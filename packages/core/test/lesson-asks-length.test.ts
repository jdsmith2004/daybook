/* Every lesson asks its length first, every time, from every way in (the owner, November 14, 2026: "Always"; November 17: "it should ask
   EVERY TIME"). Reads the lesson screen's source: the ask must not be skipped, and the screen must restart for each lesson, because Next,
   Up next and Again open a lesson with router.replace on the same route, which keeps state (a length already chosen) unless keyed. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { LESSONS, lessonHasQuick } from '../src/index';

const text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../apps/mobile/src/app/lesson/[id].tsx'), 'utf8');

describe('the lesson length ask', () => {
  it('starts unanswered for any lesson with a short cut, outside the demo preview', () => {
    expect(text).toMatch(/useState\(\(\) => preview \|\| !\(found && lessonHasQuick\(found\)\)\)/);
    expect(text).toMatch(/!chose && !care \? 'len'/);
  });
  it('restarts the screen for each lesson, so a length chosen before never carries over', () => {
    expect(text).toMatch(/export default function LessonRoute\(\)[\s\S]*<LessonScreen key=\{String\(id\)/);
  });
  it('a care lesson, which skips the ask, offers the other length on its first card', () => {
    expect(text).toMatch(/const swap = care && ix === 0 && lessonHasQuick\(L\)/);
    expect(text).toMatch(/'Make it 5 minutes'/);
  });
  it('has a short cut for most lessons, so the ask shows', () => {
    expect(LESSONS.filter(lessonHasQuick).length).toBeGreaterThan(LESSONS.length / 2);
  });
  it('nothing outside the demo preview passes a length into a lesson', () => {
    expect(text).toMatch(/const preview = PREVIEW_ON && \(at === 'preview' \|\| at === 'deed'\)/);
  });
});
