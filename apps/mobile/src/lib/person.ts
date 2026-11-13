/* The person's one person on Good night (docs/review-plan.md C6, WP7's first rung, D6 (a); moved into WP5 by docs/big-ideas.md). It is
   the safe person in My plan (My people): their name, and their number, which stays on this phone and is never synced. By choice (a
   switch in My people, kept on this phone), Good night offers "Text Dana good night", which opens Messages with the words ready
   (core two-moments.ts goodNightText). Nothing about the person or the text reaches Daybook's server. */
import { cleanPhone, goodNightText, safeName } from '@daybook/core';
import { Linking, Platform } from 'react-native';

import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

/** whether Good night offers the text: on by default once there is a name, off by the person's choice */
export function useGoodNightPerson(): { name: string; phone: string; on: boolean; set: (on: boolean) => void } | null {
  const { snap } = useStore();
  const sos = useSos();
  const name = snap.settings ? safeName(snap.settings) : '';
  if (!name) return null;
  return {
    name,
    phone: cleanPhone(sos.phone || '') || '',
    on: sos.mem.gnText !== false,
    set: (on) => sos.setMem((m) => ({ ...m, gnText: on })),
  };
}

/** Messages, with the good-night words ready. iPhone takes `&body=`, Android `?body=`. */
export function textGoodNight(p: { name: string; phone: string }) {
  const body = encodeURIComponent(goodNightText(p.name));
  const sep = Platform.OS === 'ios' ? '&' : '?';
  Linking.openURL(`sms:${p.phone}${sep}body=${body}`).catch(() => undefined);
}
