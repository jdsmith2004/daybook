/* Walk it through, unlocked (lib/tour.ts): the first time a new person is back on Today after a lesson, the shared Unlocked moment
   (components/unlocked.tsx) opens over it. It says what Walk it through is in two short sentences, with its compass in a shape, and the way on is to try it at once (the owner, November 13, 2026: "have it give a quick overview and then have them try
   it"). It is drawn in a Modal so it rises over the iPhone's own tab bar. */
import { Modal, View } from 'react-native';

import { Shape } from '@/components/shapes';
import { Icon } from '@/components/ui';
import { UnlockSheet } from '@/components/unlocked';
import { useTheme } from '@/lib/theme';

export function WalkUnlock({ onDone }: { onDone: (tryIt: boolean) => void }) {
  const c = useTheme();
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => onDone(false)}>
      <UnlockSheet
        eb="Lesson done! You unlocked"
        name="Walk it through"
        art={
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Shape kind="cookie9" size={76} color={c.surface}>
              <Icon name="compass" size={34} color={c.accentText} />
            </Shape>
          </View>
        }
        line="For an urge that keeps coming back, or a slip you start to plan. It walks you out one step at a time. Now on Today, and always in SOS."
        go={{ label: 'Try it now', onPress: () => onDone(true) }}
        other={{ label: 'Back to Today', onPress: () => onDone(false) }}
      />
    </Modal>
  );
}
