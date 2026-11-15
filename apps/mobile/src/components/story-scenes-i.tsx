/* Scenes for the God lessons, g1 to g12, told as a story (see story-kit.tsx), one file a lesson. Every key starts with g1-, g2- and so on. */
import { type ComponentType } from 'react';

import { type Ink } from './story-kit';
import { SCENES_I1 } from './story-scenes-i1';
import { SCENES_I2 } from './story-scenes-i2';
import { SCENES_I3 } from './story-scenes-i3';
import { SCENES_I4 } from './story-scenes-i4';
import { SCENES_I5 } from './story-scenes-i5';
import { SCENES_I6 } from './story-scenes-i6';
import { SCENES_I7 } from './story-scenes-i7';
import { SCENES_I8 } from './story-scenes-i8';
import { SCENES_I9 } from './story-scenes-i9';
import { SCENES_I10 } from './story-scenes-i10';
import { SCENES_I11 } from './story-scenes-i11';
import { SCENES_I12 } from './story-scenes-i12';

export const SCENES_I: Record<string, ComponentType<{ k: Ink }>> = {
  ...SCENES_I1,
  ...SCENES_I2,
  ...SCENES_I3,
  ...SCENES_I4,
  ...SCENES_I5,
  ...SCENES_I6,
  ...SCENES_I7,
  ...SCENES_I8,
  ...SCENES_I9,
  ...SCENES_I10,
  ...SCENES_I11,
  ...SCENES_I12,
};
