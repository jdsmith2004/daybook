/* The line at the bottom of More and the help pages: the crisis line for where the phone is (core crisis.ts: 988 in the US
   and Canada, Samaritans in the UK and Ireland, Lifeline in Australia, 1737 in New Zealand), with a Copy button. From the
   legacy helpFoot. */
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Icon, T } from '@/components/ui';
import { useCrisis } from '@/lib/crisis';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import { copyText } from '@/lib/words';

export function HelpFoot() {
  const c = useTheme();
  const { say } = useStore();
  const { line } = useCrisis();
  return (
    <View style={s.foot}>
      <T v="small" style={{ flex: 1 }}>
        Want to talk to someone right now?{' '}
        <Text style={{ fontFamily: font.bodyBold }} onPress={() => Linking.openURL('tel:' + line.dial)}>
          {line.foot[0]}
        </Text>{' '}
        {line.foot[1]}
      </T>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Copy ' + line.num}
        onPress={() => {
          buzz('tap');
          copyText(line.dial, say);
        }}
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
