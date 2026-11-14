/* How big Today's sky and flame are: the sky runs from the top of the screen, under the clock, and takes everything the next
   step and the two quiet buttons do not need, so on any phone the flame is the biggest thing on the screen and all of it fits
   above the tab bar (CLAUDE.md, "The flame is the heart of the app"; the thumb rule). A quiet line under the next step (what was
   logged today, the next moment) takes its room from the sky, never past SKY_MIN. Every form of the flame is drawn the same
   size inside it (big-flame.tsx). */
import { todaySize } from '@daybook/core';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** the tab bar, without the home indicator's room. Inside the iPhone's own bar the bottom safe area already counts it. */
const TABS = Platform.OS === 'ios' ? 0 : 62;
/** the number and the level along the bottom; the sky's sizes are worked out in core hero-room.ts, where a test holds the words on the hills */
export { FOOT } from '@daybook/core';
/** the room a quiet line above the card takes */
export const NOTE_ROOM = 26;
/** the room the words above the SOS circle take, so they never lie over the last row (sos-lead.tsx) */
export const LEAD_ROOM = 30;

/** the sky's size on this phone, given the quiet lines under the next step */
export function useTodaySize() {
  const { height, width } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  return (extra = 0) => todaySize(height, width, inset.top, inset.bottom, extra, TABS);
}

/** the stops a day's list holds before the sky gives anything up: the big card and the two rows BELOW counts */
const ROWS_IN_BELOW = 3;
/** how much of the empty sky over the flame each stop past those gives up */
const TRIM_PER_ROW = 28;
/** a long day's list takes a little of the empty sky over the flame (the owner, November 13, 2026: "when they add more to todo the
    avatar window should shrink to make room just a bit ... the upper half take off a little bit"). Only the top of the sky gives the
    room; the hero caps it (SKY_TRIM_MAX of the sky, and never past the top of the flame), and the flame keeps its size and place. */
export const skyTrim = (rows: number) => Math.max(0, rows - ROWS_IN_BELOW) * TRIM_PER_ROW;
/** the most of the sky a long list takes */
export const SKY_TRIM_MAX = 0.18;
