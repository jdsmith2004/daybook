/* How big Today's sky and flame are: the sky runs from the top of the screen, under the clock, and takes everything the next
   step and the two quiet buttons do not need, so on any phone the flame is the biggest thing on the screen and all of it fits
   above the tab bar (CLAUDE.md, "The flame is the heart of the app"; the thumb rule). A quiet line under the next step (what was
   logged today, the next moment) takes its room from the sky, never past SKY_MIN. Every form of the flame is drawn the same
   size inside it (big-flame.tsx). */
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** the sky's height, clock included, at its most and its least */
const SKY_MAX = 520;
const SKY_MIN = 300;
/** the next step and its gaps, the two quiet buttons, and the room the round SOS takes above the tab bar */
const BELOW = 16 + 84 + 8 + 48 + 40;
/** the tab bar, without the home indicator's room */
const TABS = 62;
/** the date and the words under it, and the number and the level along the bottom */
const HEAD = 88;
export const FOOT = 86;
/** the room a quiet line under the next step takes: what was logged today (one line), and the next moment (one line) */
export const NOTE_ROOM = 26;
export const MORE_ROOM = 26;
/** what the card on the day of a slip needs beyond the next step's room, so its button clears the round SOS */
export const SLIP_ROOM = 150;

/** the sky's height and the flame's drawing inside it, for a screen this tall and wide. extra: the quiet lines under the next step */
export function todaySize(height: number, width: number, top: number, bottom: number, extra = 0): { sky: number; flame: number } {
  const sky = Math.round(Math.max(SKY_MIN, Math.min(SKY_MAX, height - BELOW - TABS - bottom - extra)));
  /* the drawing has room around the figure, so its top may run up under the date */
  const flame = Math.round(Math.min(width, sky - top - HEAD - FOOT + 44));
  return { sky, flame };
}

/** the sky's size on this phone, given the quiet lines under the next step */
export function useTodaySize() {
  const { height, width } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  return (extra = 0) => todaySize(height, width, inset.top, inset.bottom, extra);
}
