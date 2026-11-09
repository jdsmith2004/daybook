/* My own answers: the words a person added to "What set it off?" and "What did you do?" on a check-in, with Remove for each.
   Removing one only hides it, so entries that used it keep their words. In Settings since November 2026 (it was in My plan). */
import { optionRestore, removeOption } from '@daybook/core';

import { SetGroup, SetRow } from '@/components/settings-ui';
import { T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export function OwnAnswers() {
  const c = useTheme();
  const { snap, apply, say } = useStore();
  const st = snap.settings!;
  const mine = (kind: 'trig' | 'did') => st.opts[kind].filter((o) => !o.off);
  const one = (kind: 'trig' | 'did', title: string, foot?: string) => (
    <SetGroup head={title} foot={foot}>
      {mine(kind).length ? (
        mine(kind).map((o) => (
          <SetRow
            key={o.id}
            label={o.t}
            right={
              <T style={{ fontFamily: font.bodySemi, color: c.danger }} accessibilityLabel={'Remove ' + o.t}>
                Remove
              </T>
            }
            onPress={() => {
              const at = st.opts[kind].findIndex((y) => y.id === o.id);
              apply((cur) => ({ st: removeOption(cur, snap.days, kind, o.id) }));
              say('Removed. Older entries keep it.', () => apply((cur) => ({ st: optionRestore(cur, kind, o, at) })));
            }}
          />
        ))
      ) : (
        <SetRow label="None yet" />
      )}
    </SetGroup>
  );
  return (
    <>
      {one('trig', 'What set it off')}
      {one('did', 'What did you do', 'To add one, tap “Add your own” on a check-in question. Removing one hides it; entries that used it keep their words.')}
    </>
  );
}
