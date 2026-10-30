/* The line at the bottom of More and the help pages: 988, any hour (US), with a Copy button. From the legacy helpFoot. */
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import { copyText } from '@/lib/words';

export function HelpFoot() {
  const c = useTheme();
  const { say } = useStore();
  return (
    <View style={s.foot}>
      <T v="small" style={{ flex: 1 }}>
        Want to talk to someone right now?{' '}
        <Text style={{ fontFamily: font.bodyBold }} onPress={() => Linking.openURL('tel:988')}>
          988
        </Text>{' '}
        is the Suicide &amp; Crisis Lifeline. It takes calls and texts from anyone who is struggling, any hour (US).
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Copy 988"
        onPress={() => copyText('988', say)}
        style={({ pressed }) => [s.chip, { opacity: pressed ? 0.7 : 1 }]}>
        <Icon name="copy" size={16} color={c.accentText} />
        <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.accentText }}>Copy</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, minWidth: 44 },
});
