/* One week's look back, on its own page (from the nudge on Today, or from a lesson). The same as Journal > Weeks. */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Screen } from '@/components/screen';
import { WeekView } from '@/components/week-view';
import { useStore } from '@/lib/store';

export default function Week() {
  const { k } = useLocalSearchParams<{ k: string }>();
  const { snap } = useStore();
  const [wk, setWk] = useState(() => Math.max(0, Number(k) || 0));
  if (!snap.settings) return <Screen title="Week" back>{null}</Screen>;
  return (
    <Screen title="Weekly review" back>
      <WeekView k={wk} onNav={setWk} />
    </Screen>
  );
}
