/* Screen Time is not working (core pullTrouble, WP2): on Today, a strip like the notifications one, said plainly, with the one tap
   that fixes it. It shows only when the person believes the waits are on and they are not (a restore to a new phone, a schedule
   Apple would not start, apps that cannot be read back, more than Apple holds), never "On" over nothing. The X hides it until
   tomorrow; turning Screen Time off in More ends it too. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { getPullTrouble, PULL_DENIED, pullFix, usePullTrouble } from '@/lib/pull';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const KEY = 'daybook.pull.troubleHidden';

export function PullTroubleStrip() {
  const c = useTheme();
  const { tk, say } = useStore();
  const t = usePullTrouble();
  const [hidden, setHidden] = useState<string | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(setHidden)
      .catch(() => undefined);
  }, []);
  if (!t || hidden === tk) return null;
  const fix = async () => {
    buzz('tap');
    const r = await pullFix(t.fix).catch(() => 'closed' as const);
    if (r === 'denied') say(PULL_DENIED);
    else if (r === 'ok') say(getPullTrouble() ? 'It is still not working. Restart the phone, then try again.' : 'It is working again.');
  };
  const hide = () => {
    setHidden(tk);
    AsyncStorage.setItem(KEY, tk).catch(() => undefined);
  };
  return (
    <View style={[s.wrap, { backgroundColor: c.sun }]} accessibilityRole="summary">
      <Icon name="phone" size={24} color={c.onSun} />
      <Text style={[s.text, { color: c.onSun }]}>{t.line}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={fix}
        hitSlop={6}
        style={({ pressed }) => [s.btn, { backgroundColor: c.onSun, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={[s.btnT, { color: c.sun }]}>{t.btn}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Hide until tomorrow"
        onPress={hide}
        hitSlop={10}
        style={({ pressed }) => [s.x, { opacity: pressed ? 0.6 : 1 }]}>
        <Icon name="x" size={18} color={c.onSun} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingLeft: 14, paddingRight: 8, borderRadius: 20 },
  text: { flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  btn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 999 },
  btnT: { fontFamily: font.bodyBold, fontSize: 15 },
  x: { padding: 4 },
});
