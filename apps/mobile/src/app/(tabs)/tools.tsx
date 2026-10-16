/* The Tools tab: every tool in its four groups, plus the SOS button first (the same two the legacy Tools tab opens with).
   Each tool opens full screen on its own; from here it is not inside an SOS, so finishing it just counts as a calm move. */
import { router } from 'expo-router';

import { Screen } from '@/components/screen';
import { LogLink } from '@/components/today-log';
import { ToolGrid } from '@/components/tool-grid';
import { T } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function Tools() {
  const { snap } = useStore();
  if (!snap.settings) return <Screen title="Tools">{null}</Screen>;
  return (
    <Screen eyebrow="When you need a hand" title="Tools">
      <LogLink />
      <T tone="muted">Any of these helps on its own, not only in an urge. Practicing one now makes it easier to reach for later.</T>
      <ToolGrid days={snap.days} onPick={(id) => router.push({ pathname: '/tool/[id]', params: { id } })} />
    </Screen>
  );
}
