/* Scenes for lessons 22 to 32, told as a story (see story-kit.tsx). Each lesson's scenes live in their own file, and every key starts
   with l22- so it never clashes with another file's. */
import { type ComponentType } from 'react';

import { type Ink } from './story-kit';
import { SCENES_L22 } from './story-scenes-f-l22';
import { SCENES_L23 } from './story-scenes-f-l23';
import { SCENES_L24 } from './story-scenes-f-l24';
import { SCENES_L25 } from './story-scenes-f-l25';

export const SCENES_F: Record<string, ComponentType<{ k: Ink }>> = { ...SCENES_L22, ...SCENES_L23, ...SCENES_L24, ...SCENES_L25 };
