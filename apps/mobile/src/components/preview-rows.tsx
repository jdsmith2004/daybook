/* The owner's preview buttons (the owner, November 13, 2026: "build some buttons i can press to run the feature unlocks"): replay
   the first tour, the Walk it through unlock, and each first-week part, to check them on a phone. Only a build made with
   EXPO_PUBLIC_DAYBOOK_PREVIEW=1 has them (Metro writes the value into the bundle); a store build never sets it, so no one else sees
   them. Each replay clears the quiet hours after an SOS or a care tool on this device first, since those would hold it back. */
import { router } from 'expo-router';

import { SetGroup, SetRow } from '@/components/settings-ui';
import { useSos } from '@/lib/sos';

export const PREVIEW = process.env.EXPO_PUBLIC_DAYBOOK_PREVIEW === '1';

const PARTS: [string, string, string][] = [
  ['bed', 'moon', 'Unlock: the phone’s bed'],
  ['person', 'heart', 'Unlock: one person'],
  ['plan', 'shield', 'Unlock: the plan’s first line'],
  ['doors', 'lock', 'Unlock: the other doors'],
  ['voice', 'chat', 'Unlock: your own voice'],
];

export function PreviewRows() {
  const { setMem } = useSos();
  if (!PREVIEW) return null;
  const replay = (k: 'tour' | 'walk') => {
    setMem((m) => {
      const n = { ...m };
      delete n.careAt;
      delete n.sosAt;
      if (k === 'tour') n.tour = Date.now();
      else n.walk = 'locked';
      return n;
    });
    router.navigate('/');
  };
  return (
    <SetGroup head="Preview">
      <SetRow icon="sparkle" label="Replay the first tour" onPress={() => replay('tour')} />
      <SetRow icon="compass" label="Replay Walk it through unlocked" onPress={() => replay('walk')} />
      {PARTS.map(([id, icon, label]) => (
        <SetRow key={id} icon={icon} label={label} onPress={() => router.push({ pathname: '/unlock', params: { id } })} />
      ))}
    </SetGroup>
  );
}
