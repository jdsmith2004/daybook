/* Fills LESSONS (legacy/core.js) with the full lessons, in place. Until this runs, each lesson holds only its head from
   lesson-catalog.ts, so the rules and Today load without the lesson text; a screen that shows a lesson's cards, sources or
   short words imports lesson-content.ts, which runs this first. Each lesson keeps its object, so anything already holding one
   (the path, a lesson walk) sees it filled. lesson-catalog.test.ts holds the catalog to these lessons. */
import { LESSONS } from './legacy/core.js';
import { LESSONS as FULL } from './legacy/lessons-old.js';
import type { Lesson } from './lessons';

if (FULL.length !== LESSONS.length) throw new Error('lesson-catalog.ts is out of date: see test/lesson-catalog.test.ts');
FULL.forEach((F, i) => {
  const L = LESSONS[i] as Partial<Lesson> & Record<string, unknown>;
  if (L.id !== F.id) throw new Error('lesson-catalog.ts is out of date: see test/lesson-catalog.test.ts');
  for (const k of Object.keys(L)) delete L[k];
  Object.assign(L, F);
});
