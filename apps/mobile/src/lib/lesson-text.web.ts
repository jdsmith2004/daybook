/* On the web the lessons' text (@daybook/core/lesson-content, about a megabyte) is not in the first load, so Today and SOS open
   sooner. A screen that shows a lesson imports it itself, and scripts/web-shell.ts fetches its code quietly with every other screen's
   once the app has drawn. Nothing here may import it: the root layout's code is preloaded on the first load (web-shell.ts), so an
   import from here would put the text back on it. lesson-text.ts is the phone's. */
export {};
