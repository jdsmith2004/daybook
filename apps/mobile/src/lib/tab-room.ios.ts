/* The iPhone's own tab bar floats over the page (app-tabs.ios.tsx), and inside a tab the bottom safe area already counts it, so a tab
   page leaves that much room to scroll out from under it. */
export const tabRoom = (bottom: number) => bottom;
/** how far up from the bottom of the screen the bar and its SOS circle reach, on a phone with a home button or without one */
export const TAB_TOP = 88;
