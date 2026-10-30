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
      style={[
        s.back,
        {
          backgroundColor: c.scBtn,
          shadowColor: c.lip,
          borderColor: c.cardEdge,
        },
      ]}>
      <Icon name="back" size={22} color={c.ink} />
    </Pressable>
  );
}

export function Ghost({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.ghost, { backgroundColor: c.scBtn, borderColor: c.cardEdge }]}>
      <Text style={[s.nextT, { color: c.ink, fontSize: 17 }]}>{label}</Text>
    </Pressable>
  );
}

export function Route({ label, small, onPress }: { label: string; small?: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.soft, { backgroundColor: c.accentSoft, shadowColor: c.lip }]}>
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
  next: {
    flex: 1,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: 18,
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  nextT: { fontFamily: font.bodySemi, fontSize: 20, textAlign: 'center' },
  back: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    minHeight: 60,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  softT: { fontFamily: font.bodySemi, fontSize: 17, flexShrink: 1 },
});
