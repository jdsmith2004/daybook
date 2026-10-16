/* A short message after an action, at the bottom of the screen: a line of words, or what the action earned ("+15 points",
   and why). After a slip it is said quietly, with no yellow. Screen readers hear it too. Like the legacy toast and winPop. */
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export function Toast() {
  const { toast } = useStore();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  if (!toast) return null;
  if ('pts' in toast) {
    const bg = toast.quiet ? c.ink : c.sun;
    const fg = toast.quiet ? c.bg : c.onSun;
    return (
      <View pointerEvents="none" style={[s.wrap, { bottom: inset.bottom + 96 }]}>
        <View accessibilityLiveRegion="polite" role="status" style={[s.toast, s.win, { backgroundColor: bg }]}>
          <Icon name={toast.quiet ? 'heart' : 'sparkle'} size={22} color={fg} />
          <View>
            <Text style={{ fontFamily: font.display, fontSize: 18, color: fg }}>
              +{toast.pts} point{toast.pts === 1 ? '' : 's'}
            </Text>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 13.5, color: fg, opacity: 0.9 }}>{toast.why}</Text>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View pointerEvents="none" style={[s.wrap, { bottom: inset.bottom + 96 }]}>
      <View accessibilityLiveRegion="polite" role="status" style={[s.toast, { backgroundColor: c.ink }]}>
        <T v="label" style={{ color: c.bg, textAlign: 'center' }}>
          {toast.text}
        </T>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { maxWidth: 420, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16 },
  win: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
