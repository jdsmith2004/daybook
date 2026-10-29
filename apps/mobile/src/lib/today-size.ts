/* How tall Today can be: on a short phone (an iPhone SE, 375 by 667) the flame's sky, the next step, SOS and its two quiet
   buttons all have to fit above the tab bar, with the flame still the biggest thing on the screen (CLAUDE.md, "The flame
   is the heart of the app"; the thumb rule). Below about 832 points of room, Today goes compact: the page's small eyebrow,
   the "Pull down for your journal" hint (the journal is the first row in More) and the line naming the rest of the day
   are left out, SOS and its buttons (and the room around them and the next step) are a little shorter, and the sky gets the
   height that is left, never less than SKY_MIN.
   A quiet line under the next step (what was logged today, "And one more") takes its room first from the eyebrow and the
   hint (Today goes compact a little sooner), then from the sky, never past SKY_MIN. On the day of a slip the slip's card
   sits under SOS instead (app/(tabs)/index.tsx), so it needs no room here. Every form of the flame is drawn the same size
   inside the sky (big-flame.tsx). */
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** the sky's height on a tall phone, and the least it gets on a short one */
export const SKY_MAX = 262;
export const SKY_MIN = 180;
/** the room (between the safe edges) below which Today goes compact, and what the rest of compact Today takes */
const ROOM_FULL = 832;
const REST_COMPACT = 468;
/** the room a quiet line under the next step takes: what was logged today (one line), and "And one more" (two lines) */
export const NOTE_ROOM = 26;
export const MORE_ROOM = 46;

/** room: the height between the safe edges; extra: the quiet lines under the next step */
export function todaySize(room: number, extra = 0): { compact: boolean; sky: number } {
  if (room >= ROOM_FULL + extra) return { compact: false, sky: SKY_MAX };
  return { compact: true, sky: Math.round(Math.max(SKY_MIN, Math.min(SKY_MAX, room - REST_COMPACT - extra))) };
}

/** the room between the safe edges, for todaySize */
export function useTodayRoom() {
  const { height } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  return height - inset.top - inset.bottom;
}
