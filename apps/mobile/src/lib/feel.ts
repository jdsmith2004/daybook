/* A small buzz under the finger for the moments that matter. Off on the web, and off when celebrations are off. */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function buzz(kind: 'tap' | 'save' | 'lit' = 'tap', on = true) {
  if (!on || Platform.OS === 'web') return;
  const run =
    kind === 'lit'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(kind === 'save' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  run.catch(() => undefined);
}
