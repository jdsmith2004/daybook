/* Colors and type, taken from the legacy app's :root tokens so the new app looks like the one people already know. */
import { Platform, useColorScheme } from 'react-native';

const light = {
  bg: '#FFF8EB',
  surface: '#FFFFFF',
  surface2: '#FFF0D6',
  ink: '#2A2350',
  muted: '#625A85',
  line: '#F0E0C4',
  cardEdge: '#F3E3C6',
  accent: '#6246EA',
  accentInk: '#FFFFFF',
  accentSoft: '#ECE7FF',
  accentText: '#4A33C2',
  sun: '#FFC832',
  sun2: '#FFA23A',
  onSun: '#3A2A00',
  sunSoft: '#FFF0BF',
  sunText: '#7A4B00',
  mint: '#14956F',
  mintSoft: '#D8F6EA',
  mintText: '#0B6A4C',
  coral: '#E5503F',
  coralSoft: '#FFE3DE',
  coralText: '#A8321F',
  sky: '#2F7DE1',
  skySoft: '#DDEEFF',
  skyText: '#1B5FB0',
  violet: '#7B5CF0',
  violetSoft: '#EBE5FF',
  violetText: '#4B35B8',
  slip: '#D26F00',
  slipSoft: '#FFE8C7',
  slipText: '#8A4A00',
  danger: '#B8322A',
  dangerSoft: '#FFE3DF',
  saved: '#F2BF3A',
  shadow: 'rgba(98,70,234,0.09)',
  lip: 'rgba(42,35,80,0.14)',
  scBtn: 'rgba(255,255,255,0.74)',
  heroTop: '#BEE3FF',
  heroBottom: '#FFF1C4',
};

export type Palette = typeof light;

const dark: Palette = {
  bg: '#15123A',
  surface: '#211D55',
  surface2: '#2C2768',
  ink: '#F4F0FF',
  muted: '#BDB5E6',
  line: '#3A3484',
  cardEdge: '#2F2A72',
  accent: '#A99BFF',
  accentInk: '#1A1250',
  accentSoft: '#332C7A',
  accentText: '#C5BBFF',
  sun: '#FFD25A',
  sun2: '#FFB347',
  onSun: '#3A2A00',
  sunSoft: '#4A3A12',
  sunText: '#FFD98A',
  mint: '#5EE0B5',
  mintSoft: '#16474A',
  mintText: '#8CF0CE',
  coral: '#FF9A8D',
  coralSoft: '#4A2540',
  coralText: '#FFB9AF',
  sky: '#7DBDFF',
  skySoft: '#1E3F78',
  skyText: '#A8D3FF',
  violet: '#B9A6FF',
  violetSoft: '#3B3185',
  violetText: '#D5C9FF',
  slip: '#FFB547',
  slipSoft: '#4A3414',
  slipText: '#FFD08A',
  danger: '#FF8A80',
  dangerSoft: '#4A2230',
  saved: '#F2BF3A',
  shadow: 'rgba(0,0,0,0.4)',
  lip: 'rgba(0,0,0,0.3)',
  scBtn: 'rgba(255,255,255,0.16)',
  heroTop: '#2A2275',
  heroBottom: '#3B2C6E',
};

export const palettes = { light, dark };

/* the full-screen moments each have a soft sky; night is the same in both modes */
export type Sky = 'sky' | 'mint' | 'sun' | 'coral' | 'violet' | 'night' | 'ember';
export const skies: Record<'light' | 'dark', Record<Sky, [string, string]>> = {
  light: {
    sky: ['#CFEBFF', '#FFF0C2'],
    mint: ['#D3F3FF', '#D9F7E9'],
    sun: ['#FFF0BF', '#FFE3DE'],
    coral: ['#FFE3DE', '#FFF0D6'],
    violet: ['#EBE5FF', '#FFE6F1'],
    night: ['#2A2275', '#120E38'],
    ember: ['#2A2275', '#120E38'],
  },
  dark: {
    sky: ['#1C2A78', '#3D2B7C'],
    mint: ['#12456A', '#135B57'],
    sun: ['#4C2F6E', '#6B3F5E'],
    coral: ['#5A2A5E', '#6E2F4F'],
    violet: ['#37287F', '#5A2F86'],
    night: ['#2A2275', '#120E38'],
    ember: ['#2A2275', '#120E38'],
  },
};
/* on a night sky, the words are light */
export const nightInk = { ink: '#F7F3FF', muted: '#CFC8F2', btn: 'rgba(255,255,255,0.16)' };

export function useTheme(): Palette & { scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { ...palettes[scheme], scheme };
}

/* Fredoka for numbers and headings, Instrument Sans for everything else (both loaded in the root layout) */
export const font = {
  body: 'InstrumentSans_400Regular',
  bodyMedium: 'InstrumentSans_500Medium',
  bodySemi: 'InstrumentSans_600SemiBold',
  bodyBold: 'InstrumentSans_700Bold',
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
};

export const MAX_WIDTH = 560;
export const isWeb = Platform.OS === 'web';
