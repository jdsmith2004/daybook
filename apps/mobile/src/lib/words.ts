/* Lines the app says in more than one place, kept here so every screen says them the same way (the premium pass, October
   26, 2026: one journey, one voice). Plain words, no contractions, never shame. */
import * as Clipboard from 'expo-clipboard';

export const WORDS = {
  /** a text box that has to have something in it before it saves */
  needWords: 'Write a few words first.',
  /** the phone does not let Daybook notify */
  notifyOff: 'Notifications are off for Daybook. You can turn them on in your phone’s settings.',
  /** the person said no to reminders, or the phone did */
  remindersOff: 'Reminders stay off. You can turn them on any time in Settings.',
  copied: 'Copied.',
  copiedToSend: 'Copied. Paste it in your messages.',
  copyFailed: 'Could not copy. Press and hold the text to copy it.',
  countsOn: 'All counts are on. Thank you. That helps the next person.',
  countsOff: 'Counts are off. Nothing is sent.',
  /** a file picked to restore that is not a backup */
  notBackup: 'That file is not a Daybook backup. Nothing was changed.',
} as const;

/** said after a backup is restored */
export const restoredWords = (n: number) => `Restored ${n} day${n === 1 ? '' : 's'}.`;

/** copies words and says so (or says how to copy them by hand); true when it worked */
export function copyText(text: string, say: (m: string) => void, ok: string = WORDS.copied): Promise<boolean> {
  return Clipboard.setStringAsync(text).then(
    () => {
      say(ok);
      return true;
    },
    () => {
      say(WORDS.copyFailed);
      return false;
    },
  );
}
