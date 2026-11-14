/* The Journal tab (components/journal-page.tsx), where More was (the owner, November 13, 2026). A link from before the tab, with
   new or feel, still opens the moment of writing over it; an old link to a Pattern section (the Pattern tab was called Journal
   until October 2026) goes there. */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { JournalPage } from '@/components/journal-page';
import { useStore } from '@/lib/store';

export default function JournalTab() {
  const { snap } = useStore();
  const p = useLocalSearchParams<{ pane?: string; new?: string; feel?: string }>();
  useEffect(() => {
    if (p.pane) router.replace({ pathname: '/pattern', params: { pane: p.pane } });
    else if (p.new === '1' || p.feel) {
      router.setParams({ new: undefined, feel: undefined });
      router.push({ pathname: '/write', params: p.feel ? { feel: p.feel } : { new: '1' } });
    }
  }, [p.pane, p.new, p.feel]);
  /* before setup the tabs wait behind the welcome page ((tabs)/_layout.tsx) */
  if (!snap.settings || p.pane) return null;
  return <JournalPage mode="tab" />;
}
