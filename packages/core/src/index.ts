/* Every rule and the lessons' text together, for the tests and scripts. The app imports @daybook/core, which is rules.ts (the
   rules, without the lesson text), and @daybook/core/lesson-content where it shows a lesson. A new file's exports go in
   rules.ts, not here: test/lesson-catalog.test.ts checks this file stays these two lines. */
export * from './rules';
export * from './lesson-content';
