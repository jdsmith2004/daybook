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

/** the brand's backgrounds: [top, middle, bottom] of a soft vertical gradient, a warm glow, and the caption colors */
export interface Bg {
  sky: [string, string, string];
  glow: string;
  ink: string;
  sub: string;
  stars: boolean;
}
export const BACKGROUNDS: Record<string, Bg> = {
  night: { sky: ['#15103C', '#2B2169', '#4A3592'], glow: 'rgba(255,194,90,.30)', ink: '#FFFFFF', sub: '#D9D2FF', stars: true },
  dawn: { sky: ['#2C2175', '#7A3F98', '#F08C7C'], glow: 'rgba(255,214,140,.32)', ink: '#FFFFFF', sub: '#FFE6DA', stars: true },
  cream: { sky: ['#FFF8EB', '#FFEFD6', '#FFE2BC'], glow: 'rgba(255,170,80,.28)', ink: '#2A2350', sub: '#6B6489', stars: false },
  day: { sky: ['#5AA8FF', '#9CD3FF', '#E4F4FF'], glow: 'rgba(255,230,140,.40)', ink: '#14244A', sub: '#2E4A7A', stars: false },
};

export const FONTS = {
  head: 'Fredoka_700Bold',
  body: 'InstrumentSans_600SemiBold',
};

/** the caption block, as shares of the shot's CSS width (so every size keeps the same look) */
export const CAPTION = {
  top: 0.085,
  side: 0.08,
  head: 0.088,
  sub: 0.043,
  gap: 0.022,
  /** where the phone starts, as a share of the shot's height */
  phoneTop: 0.235,
};

/** the phone in the shot: its width as a share of the shot's, the screen inside it, and the real app's viewport */
export const FRAME = {
  width: 0.72,
  /** the app is laid out at this phone size, then scaled into the frame */
  viewport: { w: 390, h: 844 },
  iphone: { bezel: 0.034, radius: 0.15, body: '#12101E', edge: '#3A3550', island: true, statusH: 50, homeBar: true },
  android: { bezel: 0.03, radius: 0.1, body: '#16141F', edge: '#3A3550', island: false, statusH: 34, homeBar: false },
  shadow: '0 40px 90px rgba(10,6,40,.45)',
};

/** the day and time the demo log is seen at (scenes may set their own time on the same day) */
export const DEMO = { day: '2026-10-17', at: '2026-10-17T09:41:00', zone: 'America/Chicago' };
