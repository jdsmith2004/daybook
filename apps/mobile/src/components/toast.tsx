/* A short message after an action: a line of words, or what the action earned ("+15 points", and why). After a slip it is
   said quietly, with no yellow. Screen readers hear it too. Like the legacy toast and winPop. On the tabs it sits low, above
   the tab bar; in a full-screen moment it sits at the top, so it never covers the answers there. A message from before SOS
   or the log opened stays behind: it never shows over someone saying they slipped. Its words wrap, never cut off. */
import { usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** the full-screen moments (app/_layout.tsx), where answers sit low */
const MOMENT = /^\/(sos|tool|log|sunrise|morning|checkin|talk|review|deeper|wind|night|lesson|lwrite|setup|graduated)(\/|$)/;
/** where a message from the screen before is left behind */
const HUSH = /^\/(sos|log)(\/|$)/;

export function Toast() {
  const { toast } = useStore();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const path = usePathname();
  const [left, setLeft] = useState<typeof toast>(null);
  const shown = useRef(toast);
  shown.current = toast;
  useEffect(() => {
    if (HUSH.test(path)) setLeft(shown.current);
  }, [path]);
  if (!toast || toast === left) return null;
  const at = MOMENT.test(path) ? { top: inset.top + 62 } : { bottom: inset.bottom + 96 };
  if ('pts' in toast) {
    const bg = toast.quiet ? c.ink : c.sun;
    const fg = toast.quiet ? c.bg : c.onSun;
    return (
      <View pointerEvents="none" style={[s.wrap, at]}>
        <View accessibilityLiveRegion="polite" role="status" style={[s.toast, s.win, { backgroundColor: bg }]}>
          <Icon name={toast.quiet ? 'heart' : 'sparkle'} size={22} color={fg} />
          <View style={{ flexShrink: 1 }}>
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
    <View pointerEvents="none" style={[s.wrap, at]}>
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
