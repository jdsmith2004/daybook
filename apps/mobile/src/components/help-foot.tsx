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
    <View style={[s.foot, { backgroundColor: c.surface2 }]}>
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
        style={[s.chip, { borderColor: c.line, backgroundColor: c.surface }]}>
        <Icon name="copy" size={16} color={c.ink} />
        <Text style={{ fontFamily: font.bodySemi, color: c.ink }}>Copy</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  foot: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5 },
});
