/* A small buzz under the finger for the moments that matter. Off on the web, and off when celebrations are off. The phone's
   own setting always wins: iOS gives no haptics when System Haptics is off, and on Android every buzz goes through the
   system's haptic feedback (not the vibrator), which stays silent when touch feedback is off. */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { ImpactFeedbackStyle: I, AndroidHaptics: A } = Haptics;
/** the nearest Android system feedback for each iOS knock (these four work on every Android version) */
const ANDROID: Record<Haptics.ImpactFeedbackStyle, Haptics.AndroidHaptics> = {
  [I.Soft]: A.Clock_Tick,
  [I.Light]: A.Context_Click,
  [I.Medium]: A.Virtual_Key,
  [I.Rigid]: A.Virtual_Key,
  [I.Heavy]: A.Long_Press,
};

/** one knock: on iOS the impact style itself, on Android the system feedback nearest to it */
export function knock(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS === 'web') return;
  const run = Platform.OS === 'android' ? Haptics.performAndroidHapticsAsync(ANDROID[style]) : Haptics.impactAsync(style);
  run.catch(() => undefined);
}

export function buzz(kind: 'tap' | 'tick' | 'roll' | 'land' | 'save' | 'lit' = 'tap', on = true) {
  if (!on || Platform.OS === 'web') return;
  /* tick: the faint click of a slider passing each step. roll: the soft bump of a ball rolling over the next one.
     land: the firmer knock of it coming to rest. */
  if (Platform.OS === 'android') {
    const type = { tap: A.Context_Click, tick: A.Clock_Tick, roll: A.Clock_Tick, land: A.Virtual_Key, save: A.Virtual_Key, lit: A.Confirm }[kind];
    /* Confirm is Android 11 and later; before that, a plain firm click */
    Haptics.performAndroidHapticsAsync(type)
      .catch(() => (kind === 'lit' ? Haptics.performAndroidHapticsAsync(A.Virtual_Key) : undefined))
      .catch(() => undefined);
    return;
  }
  const style = { roll: I.Soft, land: I.Rigid, save: I.Medium };
  const run =
    kind === 'tick'
      ? Haptics.selectionAsync()
      : kind === 'lit'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(kind === 'tap' ? I.Light : style[kind]);
  run.catch(() => undefined);
}

/** one tap of the breath by touch (core breath-touch): soft, light or firm */
export const breathTap = (level: 0 | 1 | 2) => knock([I.Soft, I.Light, I.Medium][level]);
