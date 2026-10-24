/* The wind-down: a short full-screen moment under the night sky, the same Goodnight screen the check-in ends with
   (components/goodnight.tsx). "Tap this when you put your phone down": the big Goodnight button puts the phone away and
   plays the going-to-bed moment. Above it, folded rows: today's check-in when it is still open (three quick numbers, which
   end in Goodnight too), the wind-down list, and the plan for a loud night with SOS. Opened from Wind-down in "Your day"
   and from Next up. */
import { fmtClock, rhythm, windLine } from '@daybook/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { GoingToBed, GoodnightButton, LoudFold, NightRow, useGoodnight, WindFold, type Bed } from '@/components/goodnight';
import { FitArt } from '@/components/fit';
import { NightSky } from '@/components/night-sky';
import { Dock, Middle, SceneFrame } from '@/components/scene';
import { Button, T } from '@/components/ui';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font } from '@/lib/theme';

export default function Wind() {
  const { snap, tk, now } = useStore();
  const goodnight = useGoodnight();
  const [bed, setBed] = useState<Bed | null>(null);
  const [fold, setFold] = useState<'wind' | 'loud' | null>(null);
  const st = snap.settings;
  if (!st) return null;
  if (bed) return <GoingToBed bed={bed} />;
  const p = snap.days[tk]?.p;
  const r = rhythm(snap.days, st, tk, now);
  const ci = r.stops.find((x) => x.k === 'evening' && !x.done);
  const toggle = (f: 'wind' | 'loud') => setFold(fold === f ? null : f);
  return (
    <SceneFrame title="Wind-down" sky="night" onClose={close}>
      <T v="title" style={s.c} accessibilityRole="header">
        Time to wind down
      </T>
      <T style={s.c} tone="muted">
        {windLine(st, r.leftToOff, p)}
      </T>
      {/* the night sky in the open middle; it gives way when a row opens, so the rows and Goodnight all fit */}
      <Middle>
        <FitArt drop={0.6}>
          <NightSky />
        </FitArt>
      </Middle>
      <Dock>
        {ci ? <NightRow icon="pencil" title="Check in first?" sub="Three quick numbers, then Goodnight" onPress={() => router.replace('/checkin')} /> : null}
        <WindFold open={fold === 'wind'} onToggle={() => toggle('wind')} />
        <LoudFold open={fold === 'loud'} onToggle={() => toggle('loud')} />
        {p && p.po ? (
          <>
            <T style={s.c}>Phone away at {fmtClock(p.po)}. Good night.</T>
            <Button label="Done" onPress={close} />
          </>
        ) : (
          <>
            <T style={[s.c, s.tap]}>Tap this when you put your phone down.</T>
            <T v="small" tone="muted" style={s.c}>
              Before {fmtClock(st.screensOff)}, it counts as screens off on time too.
            </T>
            <GoodnightButton onPress={() => setBed(goodnight(null))} />
          </>
        )}
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  tap: { fontFamily: font.bodySemi, marginTop: 4 },
});
