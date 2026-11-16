/* The breathing figure on a phone: the same picture the web draws (lib/breath-scene.ts says what is where at each moment),
   drawn by Skia on the UI thread, so it stays smooth while the JS thread is busy. The words are real text over it, in the
   step's color. The timing is core breath-field.ts. */
import { FIELD_SETTLE, fieldAt, type FieldId } from '@daybook/core';
import { Canvas, createPicture, PaintStyle, Picture, Skia, StrokeCap, StrokeJoin } from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { inkAt, SCENE_LIPS, SCENE_NOSE, SCENE_WORDS, sceneAt } from '@/lib/breath-scene';
import { useOnScreen, useReducedMotion } from '@/lib/motion';
import { font } from '@/lib/theme';

export type BreathFieldProps = {
  id?: FieldId;
  /** it runs only while on */
  on?: boolean;
  /** the moment it started (milliseconds); the figure, the words and the taps all count from it */
  start: number | null;
  /** seconds to settle first (0 for none) */
  settle?: number;
  /** told how many whole breaths are done, each time one ends */
  onBreaths?: (n: number) => void;
  /** hold the figure at this many seconds in, for a picture of one moment */
  freeze?: number;
  /** on a light sky (SOS by day): deeper dots and words */
  light?: boolean;
};

function col(r: number, g: number, b: number, a: number) {
  'worklet';
  return Float32Array.of(r / 255, g / 255, b / 255, a);
}

export function BreathField({ id = 'sigh', on = true, start, settle = FIELD_SETTLE, onBreaths, freeze, light = false }: BreathFieldProps) {
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
  const nose = useMemo(() => Skia.Path.MakeFromSVGString(SCENE_NOSE), []);
  const lips = useMemo(() => SCENE_LIPS.map((p) => Skia.Path.MakeFromSVGString(p)), []);
  const w = box?.w ?? 0;
  const h = box?.h ?? 0;
  const picture = useDerivedValue(() => {
    const sc = sceneAt(id, t.value, w, h, settle, still, light);
    return createPicture((c) => {
      const paint = Skia.Paint();
      paint.setAntiAlias(true);
      const dots = sc.dots;
      for (let i = 0; i < dots.length; i += 7) {
        if (dots[i + 6] <= 0.01) continue;
        paint.setColor(col(dots[i + 3], dots[i + 4], dots[i + 5], dots[i + 6]));
        c.drawCircle(dots[i], dots[i + 1], dots[i + 2], paint);
      }
      /* the nose or the lips */
      if (sc.by && sc.ink[3] > 0.01) {
        const line = Skia.Paint();
        line.setAntiAlias(true);
        line.setStyle(PaintStyle.Stroke);
        line.setStrokeWidth(1.25);
        line.setStrokeCap(StrokeCap.Round);
        line.setStrokeJoin(StrokeJoin.Round);
        line.setColor(col(sc.ink[0], sc.ink[1], sc.ink[2], sc.ink[3]));
        c.save();
        c.translate(sc.ix, sc.iy);
        c.scale(sc.u, sc.u);
        if (sc.by === 1) {
          if (nose) c.drawPath(nose, line);
        } else for (let i = 0; i < lips.length; i++) if (lips[i]) c.drawPath(lips[i]!, line);
        c.restore();
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
  const at = fieldAt(id, now, settle);
  const told = useRef(0);
  useEffect(() => {
    if (at.done === told.current) return;
    told.current = at.done;
    if (at.done) onBreaths?.(at.done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at.done]);
  /* a screen reader hears each turn of the breath (iOS has no live regions, so it is told) */
  useEffect(() => {
    if (Platform.OS !== 'ios' || !run) return;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((yes) => yes && AccessibilityInfo.announceForAccessibility(at.words))
      .catch(() => undefined);
  }, [at.words, run]);
  const ink = useAnimatedStyle(() => {
    const k = inkAt(id, t.value, settle, still, light);
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
        <Reanimated.Text maxFontSizeMultiplier={1.2} style={[s.phase, ink]}>
          {at.words}
        </Reanimated.Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  room: { flexGrow: 1, alignSelf: 'stretch', minHeight: SCENE_WORDS },
  words: { position: 'absolute', left: 0, right: 0, bottom: 0, height: SCENE_WORDS, alignItems: 'center' },
  phase: { fontFamily: font.serifItalic, fontSize: 28, lineHeight: 34, marginTop: 5 },
});
