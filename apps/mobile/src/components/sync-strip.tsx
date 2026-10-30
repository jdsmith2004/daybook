/* Today's quiet word when sync has not worked for a while (the premium pass, October 26, 2026): sync failing for more than
   a day says so here, with Try again, so the person is never left wondering whether the safe copy is safe. A short time
   offline says nothing: the log is kept on the phone and sync catches up by itself. The full story is in Settings. */
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { here } from '@/lib/here';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { font, useTheme } from '@/lib/theme';

/** how long sync can fail before Today mentions it */
const QUIET_MS = 24 * 3600_000;

export function SyncStrip() {
  const c = useTheme();
  const sync = useSync();
  const { now } = useStore();
  const k = sync.status.k;
  if (k !== 'error' && k !== 'expired') return null;
  if (sync.at && now - sync.at < QUIET_MS) return null;
  const text = here(
    k === 'expired' ? 'Sign in again to keep syncing. Your log is safe on this phone.' : 'Not syncing right now. Your log is safe on this phone.',
  );
  return (
    <View style={[s.wrap, { backgroundColor: c.surface2 }]} accessibilityRole="summary" accessibilityLiveRegion="polite">
      <Icon name="up" size={20} color={c.ink} />
      <Text style={[s.text, { color: c.ink }]}>{text}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => (k === 'expired' ? sync.signInNow({ why: 'in', email: sync.email }) : sync.syncNow())}
        hitSlop={6}
        style={({ pressed }) => [s.btn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={[s.btnT, { color: c.accentInk }]}>{k === 'expired' ? 'Sign in' : 'Try again'}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, borderRadius: 16, marginBottom: 12 },
  text: { flex: 1, fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  btnT: { fontFamily: font.bodyBold, fontSize: 13 },
});
