/* A short message after an action, at the bottom of the screen. Screen readers hear it too. */
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export function Toast() {
  const { toast } = useStore();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={[s.wrap, { bottom: inset.bottom + 96 }]}>
      <View accessibilityLiveRegion="polite" role="status" style={[s.toast, { backgroundColor: c.ink }]}>
        <T v="label" style={{ color: c.bg, textAlign: 'center' }}>
          {toast}
        </T>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: { maxWidth: 520, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16 },
});
