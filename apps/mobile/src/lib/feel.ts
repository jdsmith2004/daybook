/* A small buzz under the finger for the moments that matter. Off on the web, and off when celebrations are off. */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function buzz(kind: 'tap' | 'tick' | 'roll' | 'land' | 'save' | 'lit' = 'tap', on = true) {
  if (!on || Platform.OS === 'web') return;
  /* tick: the faint click of a slider passing each step. roll: the soft bump of a ball rolling over the next one.
     land: the firmer knock of it coming to rest. */
  const style = { roll: Haptics.ImpactFeedbackStyle.Soft, land: Haptics.ImpactFeedbackStyle.Rigid, save: Haptics.ImpactFeedbackStyle.Medium };
  const run =
    kind === 'tick'
      ? Haptics.selectionAsync()
      : kind === 'lit'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(kind === 'tap' ? Haptics.ImpactFeedbackStyle.Light : style[kind]);
  run.catch(() => undefined);
}
