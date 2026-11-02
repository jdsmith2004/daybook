/* My own answers: the words a person added to "What set it off?" and "What did you do?" on a check-in, with Remove for each.
   Removing one only hides it, so entries that used it keep their words. In Settings since November 2026 (it was in My plan). */
import { optionRestore, removeOption } from '@daybook/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { Hair } from '@/components/editable';
import { T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export function OwnAnswers() {
  const c = useTheme();
  const { snap, apply, say } = useStore();
  const st = snap.settings!;
  const mine = (kind: 'trig' | 'did') => st.opts[kind].filter((o) => !o.off);
  const one = (kind: 'trig' | 'did', title: string) => (
    <View style={{ gap: 2 }}>
      <T v="label">{title}</T>
      {mine(kind).length ? (
        mine(kind).map((o) => (
          <View key={o.id} style={s.opt}>
            <T style={{ flex: 1 }}>{o.t}</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Remove ' + o.t}
              onPress={() => {
                const at = st.opts[kind].findIndex((y) => y.id === o.id);
                apply((cur) => ({ st: removeOption(cur, snap.days, kind, o.id) }));
                say('Removed. Older entries keep it.', () => apply((cur) => ({ st: optionRestore(cur, kind, o, at) })));
              }}
              style={({ pressed }) => [s.drop, { opacity: pressed ? 0.6 : 1 }]}>
              <T v="small" style={{ fontFamily: font.bodySemi, color: c.danger }}>
                Remove
              </T>
            </Pressable>
          </View>
        ))
      ) : (
        <T v="small" tone="muted">
          None yet.
        </T>
      )}
    </View>
  );
  return (
    <View style={{ gap: 12 }}>
      <T v="small" tone="muted">
        To add one, tap “Add your own” on a check-in question. Entries that used one keep their words.
      </T>
      {one('trig', 'What set it off')}
      <Hair />
      {one('did', 'What did you do')}
    </View>
  );
}

const s = StyleSheet.create({
  opt: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  drop: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
});
