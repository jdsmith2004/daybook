/* The slider for an honest number: the check-in's 0 to 10 and last night's hours of sleep. The value shows large above it; a
   thick track with a mark at every step; a round knob that grows while held. Tap anywhere on the track or drag; it snaps to
   each step with a small buzz. Nothing is set until the person touches it: until then there is no knob, only the marks and
   a hint. Screen readers can step it up or down. */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

const KNOB = 38;

export function Slider({
  label,
  value,
  onChange,
  onRelease,
  min = 0,
  max = 10,
  step = 1,
  lo,
  hi,
  show = (v) => String(v),
  unit,
  hint = 'Slide or tap the line',
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  /** the finger came up (after a tap or a drag), with the value it left */
  onRelease?: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** the words at each end, like "none" and "lots" (without them, the ends show the number and unit) */
  lo?: string;
  hi?: string;
  show?: (v: number) => string;
  /** a small word after the big number, like "hours" */
  unit?: string;
  hint?: string;
}) {
  const c = useTheme();
  const [w, setW] = useState(0);
  const [held, setHeld] = useState(false);
  const last = useRef<number | null>(value);
  last.current = value;
  const has = value != null;
  const n = Math.round((max - min) / step);
  const frac = has ? (value! - min) / (max - min) : 0;

  const at = (e: GestureResponderEvent) => {
    if (!w) return;
    const x = Math.max(0, Math.min(w, e.nativeEvent.locationX - KNOB / 2));
    const v = Math.round(min + Math.round((x / (w - KNOB)) * n) * step * 1e6) / 1e6;
    const cl = Math.max(min, Math.min(max, v));
    if (cl !== last.current) {
      last.current = cl;
      onChange(cl);
      buzz('tap');
    }
  };
  const nudge = (d: number) => {
    const v = Math.max(min, Math.min(max, (has ? value! : Math.round((min + max) / 2 / step) * step) + d * step));
    onChange(v);
    onRelease?.(v);
  };

  return (
    <View style={s.wrap}>
      <View style={s.read} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {has ? (
          <>
            <Text style={[s.big, { color: c.ink }]}>{show(value!)}</Text>
            {unit ? <Text style={[s.unit, { color: c.muted }]}>{unit}</Text> : null}
          </>
        ) : (
          <Text style={[s.hint, { color: c.muted }]}>{hint}</Text>
        )}
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={has ? { min, max, now: value!, text: show(value!) + (unit ? ' ' + unit : '') } : { text: 'Not set' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          setHeld(true);
          at(e);
        }}
        onResponderMove={at}
        onResponderRelease={() => {
          setHeld(false);
          if (last.current != null) onRelease?.(last.current);
        }}
        onResponderTerminate={() => setHeld(false)}
        style={s.hit}>
        <View pointerEvents="none" style={[s.track, { backgroundColor: c.surface2 }]}>
          {has ? <View style={[s.fill, { width: `${frac * 100}%`, backgroundColor: c.accent }]} /> : null}
        </View>
        {/* a mark at every step (whole numbers only, when the step is a half) */}
        <View pointerEvents="none" style={s.marks}>
          {Array.from({ length: n + 1 }, (_, i) => {
            const v = min + i * step;
            if (step < 1 && v % 1 !== 0) return <View key={i} style={s.markGap} />;
            const lit = has && v <= value!;
            return <View key={i} style={[s.mark, { backgroundColor: lit ? c.accentInk : c.muted, opacity: lit ? 0.7 : 0.45 }]} />;
          })}
        </View>
        {has ? (
          <View
            pointerEvents="none"
            style={[
              s.knob,
              {
                left: `${frac * 100}%`,
                marginLeft: -KNOB * frac,
                backgroundColor: c.accent,
                borderColor: c.surface,
                shadowColor: c.lip,
                transform: [{ scale: held ? 1.14 : 1 }],
              },
            ]}
          />
        ) : null}
      </View>
      <View style={s.ends}>
        <T v="small" tone="muted">
          {lo ? show(min) + ' · ' + lo : show(min) + (unit ? ' ' + unit : '')}
        </T>
        <T v="small" tone="muted">
          {hi ? hi + ' · ' + show(max) : show(max) + (unit ? ' ' + unit : '')}
        </T>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  /* a drag on the web must not select the number as text */
  wrap: { alignSelf: 'stretch', gap: 6, userSelect: 'none' },
  read: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 6, minHeight: 58 },
  big: { fontFamily: font.displayBold, fontSize: 48, lineHeight: 56 },
  unit: { fontFamily: font.bodySemi, fontSize: 16 },
  hint: { fontFamily: font.bodySemi, fontSize: 15, alignSelf: 'center' },
  hit: { height: 56, justifyContent: 'center' },
  track: { position: 'absolute', left: KNOB / 2 - 7, right: KNOB / 2 - 7, height: 14, borderRadius: 7, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7 },
  marks: { position: 'absolute', left: KNOB / 2, right: KNOB / 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mark: { width: 4, height: 4, borderRadius: 2 },
  markGap: { width: 4, height: 4 },
  knob: {
    position: 'absolute',
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    borderWidth: 4,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
});
