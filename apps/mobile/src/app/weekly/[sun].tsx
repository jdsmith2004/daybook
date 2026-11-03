/* One week, told in full, opened from a week in Pattern > Weeks (components/weeks-pane.tsx). The week is named by its Sunday. */
import { addDays, isKey, sunOf, sunRange } from '@daybook/core';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { WeekDetail } from '@/components/weeks-pane';
import { useStore } from '@/lib/store';

export default function Weekly() {
  const { sun } = useLocalSearchParams<{ sun: string }>();
  const { snap, tk } = useStore();
  if (!snap.settings || !sun || !isKey(sun) || sunOf(sun) !== sun) return <Redirect href="/pattern?pane=weeks" />;
  return (
    <Screen title={sun === sunOf(tk) ? 'This week' : sun === addDays(sunOf(tk), -7) ? 'Last week' : sunRange(sun)} back="Pattern">
      <WeekDetail sun={sun} />
    </Screen>
  );
}
