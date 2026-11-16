/* The Squeeze figure on a phone: the same picture the web draws (lib/squeeze-scene.ts says what is where at each moment),
   drawn by Skia on the UI thread, so it stays smooth while the JS thread is busy. The words are real text over it, in the
   figure's color. The timing is core squeeze.ts. */
import { squeezeAt } from '@daybook/core';
import { Canvas, createPicture, Picture, Skia } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { squeezeScene, sqzInkAt, SQZ_WORDS } from '@/lib/squeeze-scene';
import { useOnScreen, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

export type SqueezeFieldProps = {
  on?: boolean;
  start: number | null;
  freeze?: number;
  light?: boolean;
};

function col(r: number, g: number, b: number, a: number) {
  'worklet';
  return Float32Array.of(r / 255, g / 255, b / 255, a);
}

export function SqueezeField({ on = true, start, freeze, light = false }: SqueezeFieldProps) {
  const still = useReducedMotion();
  const onScreen = useOnScreen();
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const run = on && onScreen && start != null && freeze == null;
  const t = useSharedValue(freeze ?? 0);
  const t0 = start ?? 0;
  const frame = useFrameCallback(() => {
    'worklet';
    t.value = (Date.now() - t0) / 1000;
  }, false);
  useEffect(() => {
    frame.setActive(run);
    return () => frame.setActive(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, t0]);
  useEffect(() => {
    if (freeze != null) t.value = freeze;
  }, [freeze, t]);
  const w = box?.w ?? 0;
  const h = box?.h ?? 0;
  const picture = useDerivedValue(() => {
    const sc = squeezeScene(t.value, w, h, still, light);
    return createPicture((c) => {
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      const d = sc.dots;
      for (let i = 0; i < d.length; i += 7) {
        if (d[i + 6] <= 0.01) continue;
        paint.setColor(col(d[i + 3], d[i + 4], d[i + 5], d[i + 6]));
        c.drawCircle(d[i], d[i + 1], d[i + 2], paint);
      }
    });
  });
  /* the words: what they say ten times a second, their color and fade from the same clock as the figure */
  const [now, setNow] = useState(freeze ?? 0);
  useEffect(() => {
    if (!run) return;
    const tick = setInterval(() => setNow((Date.now() - t0) / 1000), 100);
    return () => clearInterval(tick);
  }, [run, t0]);
  const at = squeezeAt(now);
  const count = at.kind === 'hold' && at.left <= 3;
  /* a screen reader hears each change (iOS has no live regions, so it is told) */
  useEffect(() => {
    if (Platform.OS !== 'ios' || !run) return;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((yes) => yes && AccessibilityInfo.announceForAccessibility(at.words))
      .catch(() => undefined);
  }, [at.words, run]);
  const ink = useAnimatedStyle(() => {
    const k = sqzInkAt(t.value, still, light);
    return { color: `rgb(${Math.round(k[0])},${Math.round(k[1])},${Math.round(k[2])})`, opacity: k[3] };
  });
  return (
    <View style={s.room} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {box ? (
        <Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Picture picture={picture} />
        </Canvas>
      ) : null}
      <View style={s.words} accessible accessibilityLabel={at.words} accessibilityLiveRegion="polite">
        <Reanimated.Text maxFontSizeMultiplier={1.2} style={[count ? s.count : s.phase, ink]}>
          {at.words}
        </Reanimated.Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  room: { flexGrow: 1, alignSelf: 'stretch', minHeight: SQZ_WORDS + 140 },
  words: { position: 'absolute', left: 0, right: 0, bottom: 0, height: SQZ_WORDS, alignItems: 'center' },
  phase: { fontFamily: font.serifItalic, fontSize: 28, lineHeight: 34, marginTop: 13 },
  count: { fontFamily: font.serifItalic, fontSize: 44, lineHeight: 52, marginTop: 4 },
});
