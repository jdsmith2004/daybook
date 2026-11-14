/* Writing in the journal: a full-screen moment over the Journal tab (components/journal-page.tsx). new: it opens on the four
   colors; open: on an entry, to read it back; feel: from a door after a slip, on the page, ready to write. */
import { useLocalSearchParams } from 'expo-router';

import { JournalPage } from '@/components/journal-page';

export default function Write() {
  const p = useLocalSearchParams<{ new?: string; open?: string; feel?: string }>();
  return <JournalPage mode="entry" fresh={p.new === '1'} open={p.open} feel={p.feel} />;
}
