/* The lesson catalog (src/lesson-catalog.ts) is what the rules know of each lesson without loading its text: its title, section,
   key line and the rest of its head, which habits it opens to, and the proof lines SOS shows. It is made from the full lessons, so
   it can never say something they do not. When a lesson is added or its head changes, this test fails; make the catalog again with
     cd packages/core && UPDATE_LESSON_CATALOG=1 npx vitest run test/lesson-catalog.test.ts
   and commit it with the change. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { LESSONS as FULL } from '../src/legacy/lessons-old.js';
import { HABIT_ONLY, HABIT_OPEN, HABIT_TURNS, habitOpen, habitOwn, PORN_ONLY } from '../src/lesson-habit';
import { NIGHT } from '../src/lessons-night';
import { RIDE_WHY } from '../src/ride';
import type { Habit } from '../src/habit';
import type { Lesson } from '../src/lessons';

const FILE = join(__dirname, '../src/lesson-catalog.ts');
const BODY = new Set(['cards', 'rc', 'scope', 'src']);
const HABITS: Habit[] = ['porn', 'alcohol', 'gambling', 'other'];
/* the lessons a move's Why it works opens after a ride (ride.ts rideScience) */
const RIDE_LESSONS = new Set(Object.values(RIDE_WHY).map((w) => w.l));

function catalogText(): string {
  const head = (L: Lesson) => Object.fromEntries(Object.entries(L).filter(([k, v]) => !BODY.has(k) && v !== undefined));
  const opens = Object.fromEntries(
    Object.entries(HABIT_OPEN)
      .map(([id, o]) => [id, (['alcohol', 'gambling', 'other'] as const).filter((h) => o[h])])
      .filter(([, hs]) => hs.length),
  );
  const own = Object.fromEntries(Object.entries(HABIT_ONLY).map(([id, o]) => [id, o.h]));
  const proofs = Object.fromEntries(
    FULL.filter((L) => RIDE_LESSONS.has(L.id))
      .map((L) => [L.id, L.cards.filter((c) => c.e === 'proof' && c.fact).map((c) => ({ h: c.h, s: c.fact!.s }))])
      .filter(([, p]) => p.length),
  );
  const j = (v: unknown) => JSON.stringify(v);
  return [
    '/* Made by test/lesson-catalog.test.ts from the full lessons: do not edit by hand. Each lesson as the rules know it before its',
    '   text loads (legacy/core.js LESSONS, lesson-content.ts), which habits a lesson opens to (lesson-habit.ts), and the proof lines',
    '   SOS shows after a ride (ride.ts). When a lesson is added or changed, make it again:',
    '     cd packages/core && UPDATE_LESSON_CATALOG=1 npx vitest run test/lesson-catalog.test.ts */',
    "import type { OtherHabit } from './lesson-habit';",
    '',
    'export const CATALOG: Record<string, string | number | boolean>[] = [',
    ...FULL.map((L) => '  ' + j(head(L)) + ','),
    '];',
    'export const HABIT_IDS: string[] = ' + j(Object.keys(HABIT_TURNS)) + ';',
    'export const NIGHT_IDS: string[] = ' + j(Object.keys(NIGHT)) + ';',
    'export const PORN_ONLY_IDS: string[] = ' + j([...PORN_ONLY]) + ';',
    'export const HABIT_OPENS: Record<string, OtherHabit[]> = ' + j(opens) + ';',
    'export const HABIT_OWN: Record<string, OtherHabit> = ' + j(own) + ';',
    'export const PROOFS: Record<string, { h: string; s: string }[]> = {',
    ...Object.entries(proofs).map(([id, p]) => '  ' + j(id) + ': ' + j(p) + ','),
    '};',
    '',
  ].join('\n');
}

describe('the lesson catalog', () => {
  it('is made from the full lessons', () => {
    const want = catalogText();
    if (process.env.UPDATE_LESSON_CATALOG) writeFileSync(FILE, want);
    expect(readFileSync(FILE, 'utf8'), 'the lesson catalog is out of date: see the top of test/lesson-catalog.test.ts').toBe(want);
  });

  it('fills LESSONS in place with the full lessons, in the same order', () => {
    expect(core.LESSONS.length).toBe(FULL.length);
    core.LESSONS.forEach((L, i) => {
      expect(L.id).toBe(FULL[i].id);
      expect(JSON.stringify(L)).toBe(JSON.stringify(FULL[i]));
    });
    expect(core.LESSON_IDS).toEqual(FULL.map((L) => L.id));
  });

  it('keeps the lesson text out of the rules the app loads first', () => {
    /* every file rules.ts reaches by a value import or export, with the file that brought it in */
    const SRC = join(__dirname, '../src');
    const from = new Map<string, string>([['rules.ts', '']]);
    const todo = ['rules.ts'];
    while (todo.length) {
      const f = todo.pop()!;
      const text = readFileSync(join(SRC, f), 'utf8');
      for (const m of text.matchAll(/^(?:import|export)\s+(?!type\b)(?:[^'";]*?\sfrom\s+)?'(\.[^']+)'/gm)) {
        let to = join(f, '..', m[1]).replace(/\\/g, '/');
        if (!/\.(ts|js)$/.test(to)) to += '.ts';
        if (!from.has(to)) {
          from.set(to, f);
          todo.push(to);
        }
      }
    }
    const text = /^(lesson-(stories|turns|beats|habit|fill|content)|lessons-(more|night)|practice|voice-lines|legacy\/lessons-old)/;
    const why = (f: string): string => (from.get(f) ? why(from.get(f)!) + ' -> ' + f : f);
    expect([...from.keys()].filter((f) => text.test(f)).map(why)).toEqual([]);
    expect(from.has('lesson-catalog.ts')).toBe(true);
  });

  it('index.ts is the rules and the lesson text together, and nothing else', () => {
    const lines = readFileSync(join(__dirname, '../src/index.ts'), 'utf8')
      .split('\n')
      .filter((l) => /^(import|export)/.test(l));
    expect(lines, 'a new file’s exports go in rules.ts, the entry the app loads').toEqual(["export * from './rules';", "export * from './lesson-content';"]);
  });

  it('gives SOS the same proof lines as the lesson cards', () => {
    for (const id of Object.keys(RIDE_WHY)) {
      const sc = core.rideScience(id);
      const L = sc?.lesson && core.lessonById(sc.lesson.id);
      expect(sc?.proofs, id).toEqual(L ? L.cards.filter((c) => c.e === 'proof' && c.fact).map((c) => ({ h: c.h, s: c.fact!.s })) : []);
    }
  });

  it('says which habits a lesson opens to, as lesson-habit.ts does', () => {
    for (const L of FULL) {
      expect(core.PORN_ONLY.has(L.id), L.id).toBe(PORN_ONLY.has(L.id));
      for (const h of HABITS) {
        expect(core.lessonOpenTo(L.id, h), L.id + ' ' + h).toBe(habitOpen(L.id, h));
        expect(core.lessonOwnTo(L.id, h), L.id + ' ' + h).toBe(habitOwn(L.id, h));
      }
    }
  });
});
