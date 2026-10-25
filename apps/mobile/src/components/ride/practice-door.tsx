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
      style={({ pressed }) => [s.door, { backgroundColor: c.skySoft, borderColor: c.sky, shadowColor: c.lip, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
      <View style={[s.ic, { backgroundColor: c.sky }]}>
        <Icon name="wave" size={22} color={c.scheme === 'dark' ? '#0B2340' : '#FFFFFF'} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.t, { color: c.skyText }]}>Practice a ride</Text>
        <Text style={[s.sub, { color: c.ink }]}>The three SOS moves, on a calm day. Practiced calm, they come easier when it counts.</Text>
      </View>
      <Icon name="next" size={20} color={c.skyText} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  door: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  ic: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  t: { fontFamily: font.bodyBold, fontSize: 16 },
  sub: { fontFamily: font.body, fontSize: 14, lineHeight: 19, marginTop: 1 },
});
