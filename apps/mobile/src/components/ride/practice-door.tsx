/* The door to a practice ride (SOS with ?practice=1), in Tools: the same three moves as SOS, run on a calm day so the
   routine is already familiar when an urge comes. Practicing a craving strategy while calm carried over to real cravings
   (Lopez, Ochsner and Kober 2022). */
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

export function PracticeDoor() {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Practice a ride. The three SOS moves, on a calm day. About two minutes."
      onPress={() => {
        buzz('tap');
        router.push({ pathname: '/sos', params: { practice: '1' } });
      }}
      style={({ pressed }) => [s.door, { backgroundColor: c.skySoft, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name="wave" size={22} color={c.skyText} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.t, { color: c.skyText }]}>Practice a ride</Text>
        <Text style={[s.sub, { color: c.ink }]}>The three SOS moves, on a calm day.</Text>
      </View>
      <Icon name="next" size={16} color={c.skyText} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  door: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
  },
  t: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  sub: { fontFamily: font.body, fontSize: 13, lineHeight: 18, marginTop: 1 },
});
