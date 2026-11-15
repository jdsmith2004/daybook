/* Scenes for lessons told as a story (see story-kit.tsx): lessons 12 to 21 (core lesson-stories-c.ts). Every key starts with l12-. */
import { type ComponentType } from 'react';

import { type Ink } from './story-kit';
import { SCENES_E1 } from './story-scenes-e1';
import { SCENES_E2 } from './story-scenes-e2';
import { SCENES_E3 } from './story-scenes-e3';
import { SCENES_E4 } from './story-scenes-e4';

export const SCENES_E: Record<string, ComponentType<{ k: Ink }>> = { ...SCENES_E1, ...SCENES_E2, ...SCENES_E3, ...SCENES_E4 };
