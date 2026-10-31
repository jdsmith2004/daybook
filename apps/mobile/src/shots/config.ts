/* The screenshot studio's one style file (dev only, EXPO_PUBLIC_SHOTS=1): every size, the device frames, the backgrounds,
   the fonts and the caption layout. Change something here and every shot changes with it. Sizes are in real pixels; each
   is drawn at w / scale by h / scale CSS pixels and captured at that device scale, so the PNG comes out exact. */

export type Kind = 'phone' | 'wide';
export interface Size {
  w: number;
  h: number;
  scale: number;
  kind: Kind;
  /** the device drawn in a phone shot */
  device?: 'iphone' | 'android';
  /** what it is for, for the README and the script's log */
  use: string;
}
export const SIZES: Record<string, Size> = {
  /* App Store, iPhone 6.9-inch: one of the three sizes Apple takes for it (1290 x 2796) */
  ios69: { w: 1290, h: 2796, scale: 3, kind: 'phone', device: 'iphone', use: 'App Store screenshots, iPhone 6.9-inch' },
  /* App Store, iPhone 6.3-inch (1206 x 2622), for the 6.1-inch and 6.3-inch slot */
  ios63: { w: 1206, h: 2622, scale: 3, kind: 'phone', device: 'iphone', use: 'App Store screenshots, iPhone 6.3-inch' },
  /* Google Play phone screenshots: 9:16, 1080 wide (big enough for Play's featured spots) */
  'play-phone': { w: 1080, h: 1920, scale: 3, kind: 'phone', device: 'android', use: 'Google Play phone screenshots' },
  /* Google Play feature graphic, the banner at the top of the listing */
  'play-feature': { w: 1024, h: 500, scale: 2, kind: 'wide', device: 'android', use: 'Google Play feature graphic' },
  /* App Store product page header (iOS 27 and later), 21:9 */
  'ios-header': { w: 3840, h: 1646, scale: 2, kind: 'wide', use: 'App Store product page header, 21:9' },
  /* App Store search results card (iOS 27 and later), 3:2 */
  'ios-search': { w: 3840, h: 2560, scale: 2, kind: 'wide', use: 'App Store search results, 3:2' },
};

/** the skies, in the set's order: one sky runs across all the shots, drifting from each color to the next, so a shot's left edge meets the last one's
    right edge. [top, middle, bottom], mixed in oklch so a gradient stays rich and never goes gray. hill: the far and near hills across the bottom. */
export interface Bg {
  sky: [string, string, string];
  hill: [string, string];
  ink: string;
  sub: string;
  stars: boolean;
}
export const BACKGROUNDS: Record<string, Bg> = {
  /* one sunrise, in the set's order: it starts in the night and ends in full sun, as the person does */
  night: { sky: ['#0C0A33', '#1E1766', '#3D2A9E'], hill: ['#2E2384', '#1B1558'], ink: '#FFFFFF', sub: '#D9D2FF', stars: true },
  dusk: { sky: ['#14104A', '#34208A', '#6E35B8'], hill: ['#4A2AA0', '#2A1A72'], ink: '#FFFFFF', sub: '#E0D8FF', stars: true },
  plum: { sky: ['#2A1468', '#6A2AA8', '#C4479A'], hill: ['#8A2F98', '#55208A'], ink: '#FFFFFF', sub: '#F6DDF2', stars: false },
  rose: { sky: ['#551E8A', '#B0358F', '#F06A7A'], hill: ['#C23F80', '#8A2A86'], ink: '#FFFFFF', sub: '#FFE3E6', stars: false },
  coral: { sky: ['#9A2A80', '#E5507A', '#FF9A5C'], hill: ['#E0566E', '#B83A78'], ink: '#FFFFFF', sub: '#FFEBDD', stars: false },
  amber: { sky: ['#E0507A', '#FF8A4C', '#FFC85C'], hill: ['#F5824A', '#E8603E'], ink: '#FFFFFF', sub: '#FFF2DC', stars: false },
  sun: { sky: ['#F7693D', '#FF9A3D', '#FFD36B'], hill: ['#F7A63E', '#EE8A34'], ink: '#FFFFFF', sub: '#FFF2DC', stars: false },
};

export const FONTS = {
  head: 'Fredoka_700Bold',
  body: 'InstrumentSans_600SemiBold',
};

/** the caption block, as shares of the shot's CSS width (so every size keeps the same look) */
export const CAPTION = {
  top: 0.085,
  side: 0.08,
  head: 0.098,
  sub: 0.044,
  gap: 0.024,
  /** where the phone starts, as a share of the shot's height */
  phoneTop: 0.165,
};

/** the phone in the shot: its width as a share of the shot's, the screen inside it, and the real app's viewport */
export const FRAME = {
  width: 0.84,
  /** the app is laid out at this phone size, then scaled into the frame */
  viewport: { w: 390, h: 844 },
  /** a picture from the iPhone simulator: its height over its width (iPhone 17 Pro, 1206 x 2622) */
  picRatio: 2622 / 1206,
  iphone: { bezel: 0.034, radius: 0.15, body: '#12101E', edge: '#3A3550', island: true, statusH: 50, homeBar: true },
  android: { bezel: 0.03, radius: 0.1, body: '#16141F', edge: '#3A3550', island: false, statusH: 34, homeBar: false },
  shadow: { y: 40, blur: 45, color: 'rgba(10,6,40,.45)' },
};

/** the day and time the demo log is seen at (scenes may set their own time on the same day) */
export const DEMO = { day: '2026-10-17', at: '2026-10-17T09:41:00', zone: 'America/Chicago' };
