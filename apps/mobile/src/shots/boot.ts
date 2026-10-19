/* Imported first by the root layout. In a normal build EXPO_PUBLIC_SHOTS is not "1", the test folds away, and nothing of the
   screenshot studio is bundled. With EXPO_PUBLIC_SHOTS=1 (npm run shots), screenshot mode starts before anything else. */
if (process.env.EXPO_PUBLIC_SHOTS === '1') require('./mode');

/** in a screenshot of the Android app (?device=android), the app shows what Android shows: no tip link */
export const SHOTS_ANDROID = process.env.EXPO_PUBLIC_SHOTS === '1' && typeof window !== 'undefined' && /[?&]device=android\b/.test(window.location.search);
