/* The slider for an honest number: the check-in's 0 to 10 and last night's hours of sleep.
   - The value shows large above it (or huge, elsewhere on the screen, with SliderValue) and bumps each time it changes.
   - A thick track with a mark at every step; the marks light up as the fill passes them.
   - While held, the knob follows the finger exactly and a soft glow sits under it; let go, and it springs onto the
     nearest step. A tap anywhere on the track glides the knob there.
   - Nothing is set until it is touched: until then there is no knob, only the marks and a hint. The first touch pops the
     knob in.
   - A faint tick under the finger at each step (on phones). Screen readers step it up and down. With Reduce Motion on,
     everything moves straight to where it ends. */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { font, useTheme } from '@/lib/theme';

const KNOB = 40;
/* how far the track's rounded ends reach past the first and last marks */
const CAP = 8;

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
  readout = true,
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
  /** false when the screen shows the number itself, larger, somewhere else (with SliderValue) */
  readout?: boolean;
}) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const has = value != null;
  const n = Math.round((max - min) / step);
  const fracOf = (v: number) => (v - min) / (max - min);

  /* where the knob is (0 to 1), how held it is (0 to 1), and whether it is shown */
  const pos = useRef(new Animated.Value(has ? fracOf(value!) : 0)).current;
  const hold = useRef(new Animated.Value(0)).current;
  const seen = useRef(new Animated.Value(has ? 1 : 0)).current;
  const dragging = useRef(false);
  const last = useRef<number | null>(value);
  const left = useRef(0);

  /* a value set from outside (a draft coming back, a screen reader) moves the knob too */
  useEffect(() => {
    last.current = value;
    if (value == null || dragging.current) return;
    to(fracOf(value), 'glide');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const to = (f: number, how: 'glide' | 'spring' | 'set') => {
    pos.stopAnimation();
    if (reduce || how === 'set') pos.setValue(f);
    else if (how === 'spring') Animated.spring(pos, { toValue: f, useNativeDriver: false, friction: 7, tension: 140 }).start();
    else Animated.timing(pos, { toValue: f, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  };
  const appear = () => {
    if (reduce) return seen.setValue(1);
    Animated.spring(seen, { toValue: 1, useNativeDriver: false, friction: 6, tension: 160 }).start();
  };
  const holdTo = (v: 0 | 1) => {
    if (reduce) return hold.setValue(v);
    Animated.spring(hold, { toValue: v, useNativeDriver: false, friction: 7, tension: 180 }).start();
  };

  /* the finger's place along the track (0 to 1), and the step nearest it */
  const fracAt = (pageX: number) => Math.max(0, Math.min(1, (pageX - left.current - KNOB / 2) / Math.max(1, w - KNOB)));
  const snap = (f: number) => Math.max(min, Math.min(max, Math.round((min + Math.round(f * n) * step) * 1e6) / 1e6));
  const pick = (v: number) => {
    if (v === last.current) return;
    const first = last.current == null;
    last.current = v;
    onChange(v);
    buzz(first ? 'tap' : 'tick');
  };

  const grant = (e: GestureResponderEvent) => {
    const { pageX, locationX } = e.nativeEvent;
    left.current = pageX - locationX;
    dragging.current = true;
    holdTo(1);
    const f = fracAt(pageX);
    const v = snap(f);
    if (last.current == null) {
      to(fracOf(v), 'set');
      appear();
    } else to(fracOf(v), 'glide');
    pick(v);
  };
  const move = (e: GestureResponderEvent) => {
    const f = fracAt(e.nativeEvent.pageX);
    pos.stopAnimation();
    pos.setValue(f);
    pick(snap(f));
  };
  const release = () => {
    dragging.current = false;
    holdTo(0);
    if (last.current == null) return;
    to(fracOf(last.current), 'spring');
    onRelease?.(last.current);
  };
  const nudge = (d: number) => {
    const v = Math.max(min, Math.min(max, (has ? value! : snap(0.5)) + d * step));
    if (!has) appear();
    onChange(v);
    onRelease?.(v);
  };

  const span = Math.max(1, w - KNOB);
  const knobX = pos.interpolate({ inputRange: [0, 1], outputRange: [0, span] });
  /* the track starts CAP before the first mark, so the fill reaches the knob's center at CAP + the knob's travel */
  const fillW = pos.interpolate({ inputRange: [0, 1], outputRange: [CAP, CAP + span] });
  const v = has ? value! : null;

  return (
    <View style={s.wrap}>
      {readout ? <SliderValue value={v} show={show} unit={unit} hint={hint} /> : null}
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={v != null ? { min, max, now: v, text: show(v) + (unit ? ' ' + unit : '') } : { text: 'Not set' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={grant}
        onResponderMove={move}
        onResponderRelease={release}
        onResponderTerminate={release}
        style={[s.hit, WEB_DRAG]}>
        {/* the track, and the fill up to the knob's center */}
        <View pointerEvents="none" style={[s.track, { backgroundColor: c.accentSoft }]}>
          {v != null ? <Animated.View style={[s.fill, { width: fillW, backgroundColor: c.accent }]} /> : null}
        </View>
        {/* a mark at every step (whole numbers only, when the step is a half) */}
        <View pointerEvents="none" style={s.marks}>
          {Array.from({ length: n + 1 }, (_, i) => {
            const at = min + i * step;
            if (step < 1 && at % 1 !== 0) return <View key={i} style={s.markGap} />;
            const lit = v != null && at <= v;
            return <View key={i} style={[s.mark, { backgroundColor: lit ? c.accentInk : c.muted, opacity: lit ? 0.75 : 0.4 }]} />;
          })}
        </View>
        {v != null ? (
          <Animated.View pointerEvents="none" style={[s.knobBox, { transform: [{ translateX: knobX }] }]}>
            {/* a soft glow under the finger while held */}
            <Animated.View
              style={[
                s.glow,
                {
                  backgroundColor: c.accent,
                  opacity: hold.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] }),
                  transform: [{ scale: hold.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                },
              ]}
            />
            <Animated.View
              style={[
                s.knob,
                {
                  backgroundColor: c.accent,
                  borderColor: c.surface,
                  shadowColor: c.lip,
                  opacity: seen,
                  transform: [
                    {
                      scale: Animated.multiply(
                        seen.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                        hold.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }),
                      ),
                    },
                  ],
                },
              ]}
            />
          </Animated.View>
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

/** the slider's number, large, with a small bump each time it changes. Under the slider by default; a screen with room
    (the check-in) shows it huge in its middle instead (`big`), with the caption under it. Hidden from screen readers,
    which hear the slider's own value. */
export function SliderValue({
  value,
  show = (v) => String(v),
  unit,
  caption,
  hint = 'Slide or tap the line',
  big,
}: {
  value: number | null;
  show?: (v: number) => string;
  unit?: string;
  /** a line under a big number, like "out of 10" */
  caption?: string;
  hint?: string;
  big?: boolean;
}) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const bump = useRef(new Animated.Value(0)).current;
  const was = useRef(value);
  useEffect(() => {
    if (value === was.current) return;
    was.current = value;
    if (reduce || value == null) return;
    bump.setValue(1);
    Animated.spring(bump, { toValue: 0, useNativeDriver: NATIVE, friction: 5, tension: 220 }).start();
  }, [value, reduce, bump]);
  const lift = {
    transform: [
      { scale: bump.interpolate({ inputRange: [0, 1], outputRange: [1, big ? 1.08 : 1.12] }) },
      { translateY: bump.interpolate({ inputRange: [0, 1], outputRange: [0, big ? -6 : -3] }) },
    ],
  };
  return (
    <View style={big ? s.readBig : s.read} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {value != null ? (
        <Animated.View style={[s.readRow, lift]}>
          <Animated.Text style={[big ? s.huge : s.big, { color: c.ink }]}>{show(value)}</Animated.Text>
          {unit ? <Animated.Text style={[s.unit, { color: c.muted }]}>{unit}</Animated.Text> : null}
        </Animated.View>
      ) : big ? (
        <View style={[s.wait, { borderColor: c.accent, opacity: 0.55 }]}>
          <Icon name="down" size={30} color={c.muted} />
        </View>
      ) : (
        <T v="label" tone="muted" style={s.hint}>
          {hint}
        </T>
      )}
      {big ? (
        <T v="label" tone="muted">
          {value == null ? hint : caption || ''}
        </T>
      ) : null}
    </View>
  );
}

/* on the web: a drag across the slider moves it instead of scrolling the page sideways, and never selects the number */
const WEB_DRAG = Platform.OS === 'web' ? ({ touchAction: 'pan-y', cursor: 'pointer' } as object) : null;

const s = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 4, userSelect: 'none' },
  read: { minHeight: 64, alignItems: 'center', justifyContent: 'flex-end' },
  readBig: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  /* before the first touch: a quiet ring pointing down at the slider */
  wait: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  huge: { fontFamily: font.displayBold, fontSize: 128, lineHeight: 140, fontVariant: ['tabular-nums'] },
  readRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  big: { fontFamily: font.displayBold, fontSize: 52, lineHeight: 60, fontVariant: ['tabular-nums'] },
  unit: { fontFamily: font.bodySemi, fontSize: 16 },
  hint: { paddingBottom: 12 },
  hit: { height: 60, justifyContent: 'center' },
  track: { position: 'absolute', left: KNOB / 2 - CAP, right: KNOB / 2 - CAP, height: 16, borderRadius: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 8 },
  marks: { position: 'absolute', left: KNOB / 2, right: KNOB / 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mark: { width: 4, height: 4, borderRadius: 2 },
  markGap: { width: 4, height: 4 },
  knobBox: { position: 'absolute', left: 0, width: KNOB, height: KNOB, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: KNOB * 1.9, height: KNOB * 1.9, borderRadius: KNOB },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    borderWidth: 5,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
});
