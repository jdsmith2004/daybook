/* A small buzz under the finger for the moments that matter. Off on the web, and off when the Haptics switch in Settings
   (Appearance) is off. The phone's own setting always wins: iOS gives no haptics when System Haptics is off, and on Android
   every buzz goes through the system's haptic feedback (not the vibrator), which stays silent when touch feedback is off.
   Reduce Motion does not turn haptics off: Apple keeps them apart, and a buzz is often how a still screen still feels alive.

   The language (the owner, November 13, 2026: "for the app can we make sure we have haptics added"). One small set, used the
   same way everywhere, the way Duolingo and Apple do it:
   - 'tap'   a light tick: any tap that opens, moves or picks (a button, a tab, a card, a chip, a pager step, a switch).
   - 'tick'  the selection click: a slider passing each step, a wheel or stepper moving one notch, a limit reached.
   - 'save'  a firmer knock for a choice that commits: Save, Done, Log it, an answer given, a step finished.
   - 'lit'   success, for wins only: a lesson done, a level, a badge, an unlock, an urge ridden out, three flames lit.
   - 'roll' / 'land'   the soft bump of a ball rolling over the next one, and the firmer knock of it coming to rest.
   - breathTap   the soft rhythm of a breath in SOS: soft, light, firm (core breath-touch).
   There is no warning or error buzz, on purpose. A slip is data, not a failure: logging one gets 'save' like any honest log,
   never a warning. Rules: one buzz per touch (buzz merges a control's tap and its caller's buzz into the stronger one), the shared
   controls tap by themselves (Button, Chip, Pill, Next, Segments, the tabs), Back, Close and plain list rows stay silent as
   on iOS, nothing on scroll except a picker wheel's notch, nothing every frame. */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const { ImpactFeedbackStyle: I, AndroidHaptics: A } = Haptics;

/** the Haptics switch in Settings; the store sets it from the saved settings */
let hapticsOn = true;
export function setHapticsOn(on: boolean) {
  hapticsOn = on;
}
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
  if (!hapticsOn || Platform.OS === 'web') return;
  const run = Platform.OS === 'android' ? Haptics.performAndroidHapticsAsync(ANDROID[style]) : Haptics.impactAsync(style);
  run.catch(() => undefined);
}

type Kind = 'tap' | 'tick' | 'roll' | 'land' | 'save' | 'lit';
/** how strong each kind is: when several are asked for in the same moment, only the strongest plays */
const RANK: Record<Kind, number> = { tick: 0, roll: 1, tap: 2, land: 3, save: 4, lit: 5 };
let waiting: Kind | null = null;

/* One buzz per touch. A shared control taps ('tap') and the screen's own handler may ask for more ('save' for an answer, 'lit'
   for a win) in the same press, or two parts of one celebration may each say 'lit' as it opens. Every buzz asked for in one
   go waits for that go to finish, and only the strongest plays: the caller's choice wins over the control's tap, and a win is
   felt once. Buzzes spaced out on timers (a celebration's rhythm) are separate moments and all play. */
export function buzz(kind: Kind = 'tap', on = true) {
  if (!on || !hapticsOn || Platform.OS === 'web') return;
  if (waiting !== null) {
    if (RANK[kind] > RANK[waiting]) waiting = kind;
    return;
  }
  waiting = kind;
  Promise.resolve().then(() => {
    const k = waiting;
    waiting = null;
    if (k) play(k);
  });
}

function play(kind: Kind) {
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
