/* One tool, full screen. Started from SOS, Close goes back to SOS and Done goes on to "How is it now?"; on its own, it closes. */
import { gameCompute, TOOLS } from '@daybook/core';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { SceneFrame } from '@/components/scene';
import { Breathe, Ground } from '@/components/tools/calm';
import { Pause } from '@/components/tools/pause';
import { Curious, Forward, Thought } from '@/components/tools/ride';
import { Bed, Halt, Message, Move, Reasons, Surprise } from '@/components/tools/scene';
import type { ToolProps } from '@/components/tools/types';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { urNight } from '@daybook/core';
import { close } from '@/lib/nav';
import { useFinishTool, useToolExit } from '@/lib/tools';
import type { Sky } from '@/lib/theme';

const SKY: Record<string, Sky> = {
  breathe: 'sky',
  ground: 'mint',
  curious: 'violet',
  pause: 'sun',
  thought: 'violet',
  forward: 'mint',
  move: 'coral',
  bed: 'night',
  surprise: 'violet',
  halt: 'sun',
  message: 'sky',
  reasons: 'sun',
};

export default function Tool() {
  const { id, combo, lr } = useLocalSearchParams<{ id: string; combo?: string; lr?: string }>();
  const { snap, tk, now } = useStore();
  const sos = useSos();
  const finish = useFinishTool(lr === '1');
  const exit = useToolExit(lr === '1');
  const [step, setStep] = useState(0);
  const [text, setText] = useState<string | null>(null);
  const tool = TOOLS.find((t) => t.id === id);
  const st = snap.settings;
  if (!tool || !st) return <Redirect href="/" />;
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);
  /* a pause that is running (or done) closes everything on X, like the legacy sceneExit: the timer keeps going, and Today shows it */
  const exitHere =
    tool.id === 'pause' && sos.timer
      ? () => {
          sos.end();
          close();
        }
      : exit;
  const p: ToolProps = { finish, exit: exitHere, sos: !!sos.ur, combo: combo === '1', level };
  /* late at night, a tool from SOS goes dark too */
  const sky: Sky = sos.ur && urNight(new Date(now).getHours()) ? 'night' : SKY[tool.id] || 'sky';
  const stepped = tool.id === 'curious' || tool.id === 'forward';
  const nSteps = tool.id === 'curious' ? 5 : 3;
  let body: React.ReactNode;
  switch (tool.id) {
    case 'breathe':
      body = <Breathe {...p} />;
      break;
    case 'ground':
      body = <Ground {...p} />;
      break;
    case 'curious':
      body = <Curious {...p} step={step} setStep={setStep} />;
      break;
    case 'thought':
      body = <Thought {...p} text={text} setText={setText} />;
      break;
    case 'forward':
      body = <Forward {...p} step={step} setStep={setStep} />;
      break;
    case 'pause':
      body = <Pause {...p} now={now} />;
      break;
    case 'move':
      body = <Move {...p} />;
      break;
    case 'bed':
      body = <Bed {...p} now={now} />;
      break;
    case 'surprise':
      body = <Surprise {...p} />;
      break;
    case 'halt':
      body = <Halt {...p} now={now} />;
      break;
    case 'message':
      body = <Message {...p} />;
      break;
    default:
      body = <Reasons {...p} />;
  }
  return (
    <SceneFrame
      title={tool.id === 'bed' && p.combo ? 'Go to bed · step 2 of 2' : tool.name}
      sky={sky}
      dots={stepped ? { n: nSteps, i: step, label: `Step ${step + 1} of ${nSteps}` } : null}
      onBack={stepped && step > 0 ? () => setStep(step - 1) : tool.id === 'thought' && text ? () => setText(null) : null}
      onClose={p.exit}>
      {body}
    </SceneFrame>
  );
}
