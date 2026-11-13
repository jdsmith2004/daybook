/* Lighting the night: the morning's Free of it opens this over the morning (app/morning.tsx), and its button goes back to it. The
   moment itself is the shared `Ignition` (components/ignite.tsx); this page only reads the count and the words (core ignite.ts). */
import { freeRun, gameCompute, goalStep, heroNumber, igniteLine, igniteRow } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Ignition } from '@/components/ignite';
import { useStore } from '@/lib/store';

export default function Ignite() {
  const p = useLocalSearchParams<{ from?: string }>();
  const { snap, tk, now } = useStore();
  /* what it says is fixed when it opens */
  const [m] = useState(() => {
    const st = snap.settings;
    const hn = st ? heroNumber(snap.days, st, tk, now) : null;
    const to = hn?.n ?? '';
    return {
      level: st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1,
      from: p.from ?? to,
      to,
      unit: hn?.unit ?? '',
      line: st ? igniteLine(snap.days, st, tk) : '',
      row: st ? igniteRow(snap.days, st, tk) : [],
      /* the small goal: 3 free nights, then 7, then each week (no big goal before a clean week) */
      goal: st ? goalStep(freeRun(snap.days, st, tk)) : undefined,
    };
  });
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  return <Ignition {...m} onDone={close} />;
}
