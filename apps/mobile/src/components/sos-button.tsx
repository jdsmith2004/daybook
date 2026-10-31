/* The round SOS on the tab bar: the word itself on a warm button, the one thing in the bar that is not a tab. The word needs no
   decoding in a hard moment. It keeps the lip (design-standards.md), and it presses down. */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

/** the button's size */
export const SOS_SIZE = 70;

export function SosButton() {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="SOS. Help with an urge. Start here."
      onPress={() => {
        buzz('tap');
        router.push('/sos');
      }}>
      {({ pressed }) => (
        <View
          style={[
            s.btn,
            {
              backgroundColor: c.sosLow,
              shadowColor: c.sosDeep,
              shadowOffset: { width: 0, height: pressed ? 2 : 5 },
              transform: [{ translateY: pressed ? 3 : 0 }],
            },
          ]}>
          <LinearGradient colors={[c.sos, c.sosLow]} style={[StyleSheet.absoluteFill, s.round]} />
          <Text maxFontSizeMultiplier={1.15} style={[s.word, { color: c.sosInk }]}>
            SOS
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    width: SOS_SIZE,
    height: SOS_SIZE,
    borderRadius: SOS_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  round: { borderRadius: SOS_SIZE / 2 },
  word: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
});
