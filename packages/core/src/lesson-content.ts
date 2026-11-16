/* The lessons' text: every card, the short words each card shows, the stories, the voices and habit versions, and the practice
   after a lesson. It is its own entry (@daybook/core/lesson-content) so the web app's first load, Today and SOS included, does
   not carry it: only the screens that show a lesson import it (the lesson player, Learn, What I learned, Help's sources).
   Importing it fills LESSONS with the full lessons first (lesson-fill.ts). On the phone the app imports it at start
   (apps/mobile src/lib/lesson-text.ts), so nothing there waits on it. */
import './lesson-fill';

export * from './lesson-beats';
export * from './lesson-turns';
export { STORIES, storyLesson, type StoryForm, type StoryPart } from './lesson-stories';
export * from './practice';
export { lessonSaid, voiceLines, type VoiceLine } from './voice-lines';
