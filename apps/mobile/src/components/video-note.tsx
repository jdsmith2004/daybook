/* What fills the player's box when no video can show in it: one calm line and a quiet button, light on the dark frame. */
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font } from '@/lib/theme';

export function PlayerNote({ line, act, onPress }: { line: string; act: string; onPress: () => void }) {
  return (
    <View style={s.wrap}>
      <T style={s.line}>{line}</T>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          buzz('tap');
          onPress();
        }}
        style={({ pressed }) => [s.btn, { opacity: pressed ? 0.7 : 1 }]}>
        <Text style={s.act}>{act}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  line: { color: 'rgba(255,255,255,0.86)', textAlign: 'center' },
  btn: { minHeight: 44, paddingHorizontal: 24, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  act: { fontFamily: font.bodySemi, fontSize: 15, color: '#FFFFFF' },
});
