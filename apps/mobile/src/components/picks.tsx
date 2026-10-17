/* A row of big answers to tap: Yes or Not this time, hours of sleep, a 0 to 10 rating. Nothing is picked until the person taps,
   and the one picked fills with the accent. Each answer is a real button with room for a thumb. */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

export type PickOpt<K> = { k: K; label: string; a11y?: string };

export function PickRow<K extends string | number>({
  label,
  list,
  cur,
  onPick,
  big,
}: {
  /** what the row answers, for screen readers */
  label: string;
  list: PickOpt<K>[];
  cur: K | null | undefined;
  onPick: (k: K) => void;
  /** taller buttons, for the check-in */
  big?: boolean;
}) {
  const c = useTheme();
  return (
    <View style={s.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {list.map((o) => {
        const on = cur === o.k;
        return (
          <Pressable
            key={String(o.k)}
            accessibilityRole="radio"
            accessibilityLabel={o.a11y || o.label}
            accessibilityState={{ checked: on }}
            onPress={() => {
              buzz('tap');
              onPick(o.k);
            }}
            style={({ pressed }) => [
              s.btn,
              big && s.big,
              {
                backgroundColor: on ? c.accent : c.surface,
                borderColor: on ? c.accent : c.line,
                transform: [{ translateY: pressed ? 2 : 0 }],
              },
            ]}>
            <Text style={[s.t, big && s.tBig, { color: on ? c.accentInk : c.ink }]} numberOfLines={1} adjustsFontSizeToFit>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  big: { minHeight: 56, borderRadius: 16 },
  t: { fontFamily: font.bodySemi, fontSize: 15 },
  tBig: { fontFamily: font.display, fontSize: 22 },
});
