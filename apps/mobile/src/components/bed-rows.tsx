/* How today went, in three one-tap rows (Bedtime, app/bedtime.tsx): mood, urges and stress, each an honest 0 to 10 on a
   thin row of eleven steps that fills as it is tapped or swept, with its name on the left and the number on the right. They sit together on the one
   screen, low where the thumb is, so the day is logged in three taps with no Next in between, and each can be left empty.
   The mood row may start from today's feeling (core moodStart), said quietly until it is moved. A faint tick at each step
   on phones; screen readers step each row up and down. */
import { ratingOf, type CheckinForm, type RateKey } from '@daybook/core';
import { useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/components/text';
import { T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, nightInk } from '@/lib/theme';

/* each row's color on the night sky: a warm sun for mood, coral for urges, a soft violet for stress */
const TONE: Partial<Record<RateKey, string>> = { md: '#FFD66B', u: '#FF9C86', s: '#B9A8FF' };
const ROWS: RateKey[] = ['md', 'u', 's'];

export function BedRows({
  form,
  onChange,
  from,
  foot,
}: {
  form: CheckinForm;
  onChange: (f: CheckinForm) => void;
  /** where the mood came from ("Mood from earlier today"), said until it is moved */
  from?: string | null;
  /** a quiet link under the rows (the one line about today) */
  foot?: ReactNode;
}) {
  /* the mood came from today's feeling and has not been moved yet */
  const [moved, setMoved] = useState(false);
  return (
    <View style={s.rows}>
      {from && !moved ? (
        <T v="small" tone="muted">
          {from}
        </T>
      ) : null}
      {ROWS.map((k) => (
        <TapRow
          key={k}
          k={k}
          value={form[k] ?? null}
          onChange={(n) => {
            if (k === 'md') setMoved(true);
            onChange({ ...form, [k]: n });
          }}
        />
      ))}
      {foot}
    </View>
  );
}

const STEPS = 11;
function TapRow({ k, value, onChange }: { k: RateKey; value: number | null; onChange: (n: number) => void }) {
  const R = ratingOf(k);
  const tone = TONE[k] || nightInk.ink;
  /* where the track starts on the screen (found on the first touch) and how wide it is */
  const box = useRef({ x: 0, w: 0 });
  const last = useRef<number | null>(value);
  last.current = value;
  const measure = (e: LayoutChangeEvent) => (box.current.w = e.nativeEvent.layout.width);
  const at = (e: GestureResponderEvent) => {
    const { x, w } = box.current;
    if (!w) return;
    const n = Math.max(0, Math.min(STEPS - 1, Math.floor(((e.nativeEvent.pageX - x) / w) * STEPS)));
    if (n === last.current) return;
    last.current = n;
    buzz('tick');
    onChange(n);
  };
  return (
    <View
      style={s.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={R.name + ', 0 ' + R.lo + ' to 10 ' + R.hi}
      accessibilityValue={value == null ? { text: 'Not answered' } : { min: 0, max: 10, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        const v = value == null ? 5 : value + (e.nativeEvent.actionName === 'increment' ? 1 : -1);
        onChange(Math.max(0, Math.min(10, v)));
      }}>
      <Text style={s.name}>{R.name}</Text>
      <View
        onLayout={measure}
        style={s.track}
        hitSlop={{ top: 12, bottom: 12 }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          /* the steps take no touches, so the first one lands on the track itself */
          box.current.x = e.nativeEvent.pageX - e.nativeEvent.locationX;
          at(e);
        }}
        onResponderMove={at}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} pointerEvents="none" style={[s.step, { backgroundColor: value != null && i <= value ? tone : 'rgba(255,255,255,0.14)' }]} />
        ))}
      </View>
      <Text style={[s.val, { color: tone }]}>{value == null ? '' : value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  rows: { alignSelf: 'stretch', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40 },
  name: { width: 58, fontFamily: font.bodySemi, fontSize: 15, color: nightInk.ink },
  val: { width: 26, fontFamily: font.display, fontSize: 20, textAlign: 'right' },
  track: { flex: 1, flexDirection: 'row', gap: 3, height: 36, alignItems: 'center' },
  step: { flex: 1, height: 12, borderRadius: 6 },
});
