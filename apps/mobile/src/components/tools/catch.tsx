/* Catch the shapes, on its own (from Tools, or from SOS's list): the ride's game for the eyes (components/ride/moves),
   then the finish. */
import { useState } from 'react';

import { CatchMove } from '@/components/ride/moves';
import { Dock, Finish, Stage } from '@/components/scene';
import { Button } from '@/components/ui';

import type { ToolProps } from './types';

export function CatchTool({ finish, level }: ToolProps) {
  const [done, setDone] = useState(false);
  if (done)
    return (
      <Stage key="done" dir={0}>
        <Finish level={level} tone="sky" title="Eyes busy, urge quieter." text="Notice how it feels now. The pictures in your head had less room." />
        <Dock>
          <Button label="Done" onPress={() => finish('catch', { msg: 'Eyes busy, urge quieter.' })} />
        </Dock>
      </Stage>
    );
  return <CatchMove on onDone={() => setDone(true)} />;
}
