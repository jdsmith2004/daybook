/* Settings live at the bottom of the More tab. This page shows the same sections, for a link that opens one from
   somewhere else (a lesson, a help page, Today), so Back returns there. */
import { useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import type { ScrollViewInstance } from 'react-native';

import { Screen } from '@/components/screen';
import { SettingsSections } from '@/components/settings-sections';
import { T } from '@/components/ui';

export default function Settings() {
  const params = useLocalSearchParams<{ open?: string }>();
  const scroll = useRef<ScrollViewInstance>(null);
  return (
    <Screen title="Settings" sub={<T tone="muted">Make Daybook yours. Changes save as you go.</T>} back="More" scrollRef={scroll}>
      <SettingsSections open={params.open} onOpenLayout={(y) => setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }), 200)} />
    </Screen>
  );
}
