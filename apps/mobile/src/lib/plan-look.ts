/* My plan's chapters, each in its own color, the way How We Feel gives each feeling one: When it hits is ember, Why is gold,
   If I slip is sea green, My people is rose, and Getting ready is the quiet violet of a lesson's dawn. The same color is the
   chapter's card on My plan and the whole page when it opens, and everything inside it takes the chapter's palette. */
import type { Palette } from '@/lib/theme';

export type Part = 'urge' | 'why' | 'slip' | 'people' | 'ready';
export const PARTS: Part[] = ['urge', 'why', 'slip', 'people', 'ready'];

type Mode = { grad: [string, string, string]; ink: string; muted: string; glass: string; line: string };
export interface Chapter {
  title: string;
  icon: string;
  light: Mode;
  dark: Mode;
}

export const CHAPTERS: Record<Part, Chapter> = {
  urge: {
    title: 'When it hits',
    icon: 'shield',
    light: { grad: ['#FFC94D', '#FF9A4A', '#F0644A'], ink: '#3A1405', muted: '#6E2E12', glass: 'rgba(255,255,255,0.5)', line: 'rgba(58,20,5,0.16)' },
    dark: { grad: ['#9A4A1E', '#7A2C2C', '#4E1C3A'], ink: '#FFE9DA', muted: '#F6C2A6', glass: 'rgba(255,255,255,0.1)', line: 'rgba(255,233,218,0.18)' },
  },
  why: {
    title: 'Why I am doing this',
    icon: 'heart',
    light: { grad: ['#FFF3C4', '#FFE09A', '#FFC98A'], ink: '#4A2C00', muted: '#7A4B00', glass: 'rgba(255,255,255,0.55)', line: 'rgba(74,44,0,0.14)' },
    dark: { grad: ['#5A4614', '#5A3420', '#4A2848'], ink: '#FFF0C8', muted: '#F2D58E', glass: 'rgba(255,255,255,0.1)', line: 'rgba(255,240,200,0.18)' },
  },
  slip: {
    title: 'If I slip',
    icon: 'leaf',
    light: { grad: ['#C8F4DF', '#BDE8EC', '#CFE4FF'], ink: '#073B2D', muted: '#0B6A4C', glass: 'rgba(255,255,255,0.55)', line: 'rgba(7,59,45,0.14)' },
    dark: { grad: ['#14524A', '#16465E', '#1E3F78'], ink: '#DDFBEF', muted: '#9CEBCB', glass: 'rgba(255,255,255,0.1)', line: 'rgba(221,251,239,0.18)' },
  },
  people: {
    title: 'My people',
    icon: 'chat',
    light: { grad: ['#FFD9E6', '#F6DDF6', '#E6E0FF'], ink: '#46183F', muted: '#7A3A6E', glass: 'rgba(255,255,255,0.55)', line: 'rgba(70,24,63,0.14)' },
    dark: { grad: ['#5E2A58', '#4A2A6A', '#352C7C'], ink: '#FFE4F2', muted: '#EDB8DC', glass: 'rgba(255,255,255,0.1)', line: 'rgba(255,228,242,0.18)' },
  },
  ready: {
    title: 'Getting ready',
    icon: 'check',
    light: { grad: ['#E8E2FF', '#EFE6FF', '#FFEADF'], ink: '#2A2350', muted: '#5A4E92', glass: 'rgba(255,255,255,0.6)', line: 'rgba(42,35,80,0.12)' },
    dark: { grad: ['#2E2670', '#3A2B78', '#4A2E6E'], ink: '#F4F0FF', muted: '#C9C0F0', glass: 'rgba(255,255,255,0.1)', line: 'rgba(244,240,255,0.16)' },
  },
};

export const partOf = (v: string | undefined): Part | null => (PARTS.indexOf(v as Part) >= 0 ? (v as Part) : null);

/** the colors inside a chapter: its ink on its color, cards as a soft glass of the color, the accent left as it is */
export function chapterPalette(c: Palette & { scheme: 'light' | 'dark' }, p: Part): Palette & { scheme: 'light' | 'dark' } {
  const m = CHAPTERS[p][c.scheme];
  return {
    ...c,
    bg: m.grad[0],
    surface: m.glass,
    ink: m.ink,
    muted: m.muted,
    line: m.line,
    accentText: m.ink,
    mintText: m.ink,
    coralText: m.ink,
    sunText: m.ink,
    skyText: m.ink,
    violetText: m.ink,
  };
}

/** the parts a link may ask for, for the old ways in (My plan's tabs) */
export const partFor = (pane?: string, sub?: string, to?: string, fresh?: string): Part | null =>
  to === 'safe'
    ? 'people'
    : pane === 'plans'
      ? sub === 'slip'
        ? 'slip'
        : sub === 'safety' || sub === 'steps'
          ? 'ready'
          : 'urge'
      : pane === 'lists'
        ? (fresh || '').startsWith('words')
          ? 'why'
          : 'urge'
        : pane === 'why'
          ? 'why'
          : null;
