/* Scenes for lessons 33 to 40 and 42 to 44 told as a story (see story-kit.tsx), one file a lesson. */
import { type ComponentType } from 'react';

import { type Ink } from './story-kit';
import { SCENES_G33 } from './story-scenes-g33';
import { SCENES_G34 } from './story-scenes-g34';
import { SCENES_G35 } from './story-scenes-g35';
import { SCENES_G36 } from './story-scenes-g36';

export const SCENES_G: Record<string, ComponentType<{ k: Ink }>> = { ...SCENES_G33, ...SCENES_G34, ...SCENES_G35, ...SCENES_G36 };
