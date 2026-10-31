/* How much of a tab page the tab bar covers. The bar drawn by the app (app-tabs.tsx) sits under the page, so it covers nothing; the
   iPhone's own bar floats over it (tab-room.ios.ts). */
export const tabRoom = (_bottom: number) => 0;
