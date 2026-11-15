/* Scenes for lessons 33 to 40 and 42 to 44 told as a story (see story-kit.tsx), one file a lesson. */
import { type ComponentType } from 'react';

import { type Ink } from './story-kit';
import { SCENES_G33 } from './story-scenes-g33';
import { SCENES_G34 } from './story-scenes-g34';
import { SCENES_G35 } from './story-scenes-g35';
import { SCENES_G36 } from './story-scenes-g36';
import { SCENES_G37 } from './story-scenes-g37';
import { SCENES_G38 } from './story-scenes-g38';
import { SCENES_G39 } from './story-scenes-g39';
import { SCENES_G40 } from './story-scenes-g40';
import { SCENES_G42 } from './story-scenes-g42';
import { SCENES_G43 } from './story-scenes-g43';
import { SCENES_G44 } from './story-scenes-g44';

export const SCENES_G: Record<string, ComponentType<{ k: Ink }>> = {
  ...SCENES_G33,
  ...SCENES_G34,
  ...SCENES_G35,
  ...SCENES_G36,
  ...SCENES_G37,
  ...SCENES_G38,
  ...SCENES_G39,
  ...SCENES_G40,
  ...SCENES_G42,
  ...SCENES_G43,
  ...SCENES_G44,
};
