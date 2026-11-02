/* What's new, once after an update (core whats-new.ts, lib/whats-new.ts). The person's own flame, big, says there is
   something new, and the new things rise in under it one by one, each with a small drawing of the part it is about.
   Continue at the bottom; the X closes it too. Opened with nothing to show (a typed address), it goes back to Today. */
import { gameCompute, type NewArt } from '@daybook/core';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Appear } from '@/components/appear';
import { FitArt } from '@/components/fit';
import { FlameMedallion } from '@/components/flame-medallion';
import { Bubble } from '@/components/lesson-flame';
import { SceneFrame } from '@/components/scene';
import { Button, T } from '@/components/ui';
import { BUBBLE, PAPER_INK } from '@/lib/lesson-look';
import { closeAll } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { whatsNewItems } from '@/lib/whats-new';

/* the flame's own orange, as the big flame draws it, in both themes */
const FLAME = '#F07A2E';
const COUNT = ['', '', 'two new things', 'three new things'];

export default function WhatsNew() {
  const { snap, tk } = useStore();
  const st = snap.settings;
  const [items] = useState(whatsNewItems);
  /* the flame leaps once the page is up */
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!items.length || !st) {
      closeAll();
      return;
    }
    const t = setTimeout(() => setPulse(1), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!items.length || !st) return null;
  const level = gameCompute(snap.days, st, snap.reviews, tk).level.n;
  return (
    <SceneFrame title="What is new" sky="sun" onClose={closeAll} pin={<Button label="Continue" onPress={closeAll} />}>
      <View style={s.mid}>
        <Appear delay={150}>
          <Bubble style={s.say} text={items.length === 1 ? 'I learned one new thing.' : 'I learned ' + (COUNT[items.length] || 'some new things') + '.'} />
        </Appear>
        <FitArt min={0.55}>
          <FlameMedallion level={level} size={196} pulse={pulse} />
        </FitArt>
      </View>
      <View style={s.list}>
        {items.map((x, i) => (
          <Appear key={x.t} delay={500 + i * 160} by={12}>
            <View style={s.row} accessible accessibilityLabel={x.t + '. ' + x.line}>
              <View style={s.art}>
                <ItemArt k={x.art ?? 'flame'} />
              </View>
              <View style={s.words}>
                <T v="label">{x.t}</T>
                <T v="small" tone="muted">
                  {x.line}
                </T>
              </View>
            </View>
          </Appear>
        ))}
      </View>
    </SceneFrame>
  );
}

/* a small drawing of the part each new thing is about, at its own size: the week's seven days, the person's sentence,
   the turning wheel, the hill of the first chart, the glass bar with SOS, or the flame */
function ItemArt({ k }: { k: NewArt }) {
  const c = useTheme();
  if (k === 'week')
    return (
      <Svg width={40} height={32} viewBox="0 0 40 32">
        {[14, 22, 10, 26, 18, 30, 16].map((h, i) => (
          <Rect key={i} x={1 + i * 5.6} y={32 - h} width={4} height={h} rx={2} fill={c.mint} opacity={i === 5 ? 1 : 0.7} />
        ))}
      </Svg>
    );
  if (k === 'plan') {
    /* the person's sentence: a paper bubble in the dark, an ink one on a light sky, where paper would not show */
    const [paper, ink] = c.scheme === 'dark' ? [BUBBLE, PAPER_INK] : [PAPER_INK, BUBBLE];
    return (
      <Svg width={40} height={32} viewBox="0 0 40 32">
        <Path d="M6 2h28a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5H17l-6 6v-6H6a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" fill={paper} />
        <Rect x={8} y={9} width={20} height={3} rx={1.5} fill={ink} opacity={0.45} />
        <Rect x={8} y={15} width={24} height={3} rx={1.5} fill={ink} />
      </Svg>
    );
  }
  if (k === 'chart')
    return (
      <Svg width={40} height={32} viewBox="0 0 40 32">
        <Path d="M1 30C8 30 10 14 20 12s14 6 19 4v14z" fill={c.mint} opacity={0.35} />
        <Path d="M1 30C8 30 10 14 20 12s14 6 19 4" stroke={c.mint} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d="M33 14c1 2 3 3 3 5a3 3 0 0 1-6 0c0-1.5 1-2 1.5-3 .5 1 1 1 1.5 1-.3-1 0-2 0-3z" fill={FLAME} />
      </Svg>
    );
  if (k === 'tabs')
    return (
      <Svg width={40} height={32} viewBox="0 0 40 32">
        <Rect x={0} y={10} width={27} height={14} rx={7} fill={c.ink} opacity={0.14} />
        <Circle cx={7} cy={17} r={2} fill={c.ink} />
        <Circle cx={13.5} cy={17} r={2} fill={c.ink} opacity={0.4} />
        <Circle cx={20} cy={17} r={2} fill={c.ink} opacity={0.4} />
        <Circle cx={34} cy={17} r={6} fill={c.coral} />
      </Svg>
    );
  if (k === 'when')
    return (
      <Svg width={40} height={32} viewBox="0 0 40 32">
        <Rect x={0} y={11} width={40} height={10} rx={5} fill={c.sky} opacity={0.55} />
        <Rect x={8} y={3} width={18} height={2.5} rx={1.25} fill={c.ink} opacity={0.25} />
        <Rect x={6} y={14.75} width={24} height={2.5} rx={1.25} fill={c.ink} />
        <Rect x={8} y={26.5} width={18} height={2.5} rx={1.25} fill={c.ink} opacity={0.25} />
        <Circle cx={34} cy={16} r={2} fill={c.ink} />
      </Svg>
    );
  return (
    <Svg width={40} height={32} viewBox="0 0 40 32">
      <Path d="M20 2c3 6 10 10 10 18a10 10 0 0 1-20 0c0-5 3-7 4-11 2 3 3 4 4 4-1-4 0-8 2-11z" fill={FLAME} />
      <Path d="M20 17c1.5 2.5 4 4 4 7a4 4 0 0 1-8 0c0-2.5 2-4 4-7z" fill="#FFC832" />
    </Svg>
  );
}

const s = StyleSheet.create({
  say: { maxWidth: 300 },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  list: { gap: 16, paddingTop: 8, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  art: { width: 40, paddingTop: 2 },
  words: { flex: 1, gap: 2 },
});
