/* Scenes for lessons told as a story (see story-kit.tsx), batch H: lessons 45 to 58, and 50 to 53, by the lessons-45 session.
   Each part is its own file so its scenes can be drawn side by side: h1 is lessons 45 and 49, h2 lesson 46, h3 lessons 47 and 48. */
import { type ComponentType } from 'react';

import { type Ink } from './story-kit';
import { SCENES_H1 } from './story-scenes-h1';
import { SCENES_H2 } from './story-scenes-h2';
import { SCENES_H3 } from './story-scenes-h3';

export const SCENES_H: Record<string, ComponentType<{ k: Ink }>> = { ...SCENES_H1, ...SCENES_H2, ...SCENES_H3 };
