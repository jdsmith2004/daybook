/* Fit the shapes, on its own (from Tools, or from More in SOS): the ride's block puzzle (components/ride/stack), then the
   finish. */
import { useState } from 'react';

import { StackMove } from '@/components/ride/stack';
import { Dock, Finish, Stage } from '@/components/scene';
import { Button } from '@/components/ui';

import type { ToolProps } from './types';

export function StackTool({ finish, level }: ToolProps) {
  const [done, setDone] = useState(false);
  if (done)
    return (
      <Stage key="done" dir={0}>
        <Finish level={level} tone="sky" title="Eyes busy, urge quieter." text="Notice how it feels now. The pictures in your head had less room." />
        <Dock>
          <Button label="Done" onPress={() => finish('stack', { msg: 'Eyes busy, urge quieter.' })} />
        </Dock>
      </Stage>
    );
  return <StackMove on onDone={() => setDone(true)} />;
}
