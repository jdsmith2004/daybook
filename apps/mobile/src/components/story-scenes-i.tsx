/* Scenes for the God lessons, g1 to g12, told as a story (see story-kit.tsx), one file a lesson. Every key starts with g1-, g2- and so on. */
import { type ComponentType } from 'react';

import { type Ink } from './story-kit';
import { SCENES_I1 } from './story-scenes-i1';
import { SCENES_I2 } from './story-scenes-i2';
import { SCENES_I3 } from './story-scenes-i3';
import { SCENES_I4 } from './story-scenes-i4';
import { SCENES_I5 } from './story-scenes-i5';
import { SCENES_I6 } from './story-scenes-i6';

export const SCENES_I: Record<string, ComponentType<{ k: Ink }>> = {
  ...SCENES_I1,
  ...SCENES_I2,
  ...SCENES_I3,
  ...SCENES_I4,
  ...SCENES_I5,
  ...SCENES_I6,
};
