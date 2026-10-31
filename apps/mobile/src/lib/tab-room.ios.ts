/* The iPhone's own tab bar floats over the page (app-tabs.ios.tsx), and inside a tab the bottom safe area already counts it, so a tab
   page leaves that much room to scroll out from under it. */
export const tabRoom = (bottom: number) => bottom;
