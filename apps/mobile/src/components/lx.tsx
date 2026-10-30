/* The buttons and text every full-screen step uses: the lesson player and the setup. Moved here from the lesson player. */
import type { Settings } from '@daybook/core';
import { lfmt } from '@daybook/core';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Icon, T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

export function Next({ label, onPress, noIcon, off }: { label: string; onPress: () => void; noIcon?: boolean; off?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        s.next,
        off
          ? { backgroundColor: c.lip }
          : {
              backgroundColor: c.accent,
              shadowColor: c.accentDeep,
              shadowOffset: { width: 0, height: pressed ? 1 : 4 },
              transform: [{ translateY: pressed ? 3 : 0 }],
            },
      ]}>
      <Text style={[s.nextT, { color: off ? c.muted : c.accentInk }]} numberOfLines={2}>
        {label}
      </Text>
      {noIcon ? null : <Icon name="next" size={20} color={off ? c.muted : c.accentInk} />}
    </Pressable>
  );
}

export function Back({ onPress }: { onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      style={({ pressed }) => [s.back, { backgroundColor: c.scBtn, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name="back" size={22} color={c.ink} />
    </Pressable>
  );
}

/** the quiet way on: plain words where the main button will be, the same height, so nothing moves when an answer turns it into Next */
export function Ghost({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.ghost, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[s.ghostT, { color: c.accentText }]}>{label}</Text>
    </Pressable>
  );
}

export function Route({ label, small, onPress }: { label: string; small?: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.soft, { backgroundColor: c.accentSoft, opacity: pressed ? 0.75 : 1 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.softT, { color: c.accentText }]}>{label}</Text>
        {small ? (
          <T v="small" tone="muted">
            {small}
          </T>
        ) : null}
      </View>
      <Icon name="next" size={20} color={c.accentText} />
    </Pressable>
  );
}

export /** lesson text with **bold** and {loop} */
function Rich({ text, st, style }: { text: string; st: Settings | null; style?: object }) {
  return (
    <T style={style}>
      {lfmt(text, st).map((x, k) =>
        x.b ? (
          <Text key={k} style={{ fontFamily: font.bodyBold }}>
            {x.t}
          </Text>
        ) : (
          x.t
        ),
      )}
    </T>
  );
}

const s = StyleSheet.create({
  /* the capsule, with the small lip that makes it feel pressed */
  next: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    borderRadius: 999,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  nextT: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22, textAlign: 'center' },
  back: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ghost: { flex: 1, minHeight: 56, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  ghostT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, textAlign: 'center' },
  soft: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  softT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, flexShrink: 1 },
});
