/* Scenes for lessons told as a story (see story-kit.tsx), batch H: lessons 45 to 58, and 50 to 53, by the lessons-45 session.
   Each part is its own file so its scenes can be drawn side by side: h1 is lessons 45 and 49, h2 lesson 46, h3 lessons 47 and 48, h4 lessons 54 and 55, h5 lessons 56 and 58, h6 lesson 57, h7 lessons 50 and 51 (drinking), h8 lessons 52 and 53 (gambling). */
import { type ComponentType } from 'react';

import { type Ink } from './story-kit';
import { SCENES_H1 } from './story-scenes-h1';
import { SCENES_H2 } from './story-scenes-h2';
import { SCENES_H3 } from './story-scenes-h3';
import { SCENES_H4 } from './story-scenes-h4';
import { SCENES_H5 } from './story-scenes-h5';
import { SCENES_H6 } from './story-scenes-h6';
import { SCENES_H7 } from './story-scenes-h7';
import { SCENES_H8 } from './story-scenes-h8';

export const SCENES_H: Record<string, ComponentType<{ k: Ink }>> = { ...SCENES_H1, ...SCENES_H2, ...SCENES_H3, ...SCENES_H4, ...SCENES_H5, ...SCENES_H6, ...SCENES_H7, ...SCENES_H8 };
