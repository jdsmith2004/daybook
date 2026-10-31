/* The wind-down: put your flame to bed. One act at the end of the day: the phone goes on its charger, away from the bed, and Goodnight puts the flame to
   sleep where it stands (components/goodnight.tsx, NightPage). Today's check-in, when it is still open, the person's list and the plan for a loud night
   sit quietly above the button. Opened from Wind-down in "Your day" and from Next up. Opened again after Goodnight, the flame is already asleep. Too early in
   the day it still opens, and says when Goodnight does (core goodnightOpens). */
import { clockOf, goodnightOpens, rhythm, windWhen } from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';

import { NightPage, NightRow, useGoodnight, type Bed } from '@/components/goodnight';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';

export default function Wind() {
  const { snap, tk, now } = useStore();
  const goodnight = useGoodnight();
  const [bed, setBed] = useState<Bed | null>(null);
  const [opened] = useState(tk);
  const st = snap.settings;
  const p = snap.days[tk]?.p;
  /* a wind-down left open overnight with no Goodnight is yesterday's: a new day does not ask for it */
  const stale = tk !== opened && !bed;
  useEffect(() => {
    if (stale) close();
  }, [stale]);
  if (!st) return <Redirect href="/" />;
  const r = rhythm(snap.days, st, tk, now);
  const ci = r.stops.find((x) => x.k === 'evening' && !x.done);
  /* opened again later the same night: the phone is already away, so the flame is asleep */
  const held: Bed | null = bed || (p && p.po ? { at: p.po, gain: 0, msg: '' } : null);
  return (
    <NightPage
      bed={held}
      when={windWhen(st, r.leftToOff)}
      opens={goodnightOpens(st, clockOf(now))}
      onGoodnight={() => setBed(goodnight(null))}
      rowAbove={
        ci ? <NightRow icon="pencil" title="Check in first?" sub="Three quick numbers, then Goodnight" onPress={() => router.replace('/checkin')} /> : null
      }
    />
  );
}
