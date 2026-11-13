/* Walk it through, unlocked (lib/tour.ts): the first time a new person is back on Today after a lesson, the shared Unlocked moment
   (components/unlocked.tsx) opens over it. It says what Walk it through is in two short sentences, shows its button as it now sits
   on Today, and the way on is to try it at once (the owner, November 13, 2026: "have it give a quick overview and then have them try
   it"). It is drawn in a Modal so it rises over the iPhone's own tab bar. */
import { Modal, View } from 'react-native';

import { CareButton } from '@/components/today-log';
import { UnlockSheet } from '@/components/unlocked';

export function WalkUnlock({ onDone }: { onDone: (tryIt: boolean) => void }) {
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => onDone(false)}>
      <UnlockSheet
        eb="Lesson done! You unlocked"
        name="Walk it through"
        art={
          <View style={{ width: 210 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <CareButton icon="compass" title="Walk it through" sub="When an urge keeps coming" />
          </View>
        }
        line="For an urge that keeps coming back, or a slip you are starting to plan. It finds where the urge has taken you and walks you out, one step at a time. It is on Today now, and always in SOS."
        go={{ label: 'Try it now', onPress: () => onDone(true) }}
        other={{ label: 'Back to Today', onPress: () => onDone(false) }}
      />
    </Modal>
  );
}
