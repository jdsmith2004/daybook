/* The extra tags on one journal entry (core journal-notes.ts), low on the page, over Done. Only there once a folder is picked
   for journal notes. Every tag used before is one tap, so the spelling stays the same from entry to entry; the tags on every
   note are not shown, since nothing here changes them (the sheet in app/notes.tsx does). */
import { cleanTag, jnEdit, jnTagCounts, jnTagsOf } from '@daybook/core';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/choices';
import { JN } from '@/components/journal';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, MAX_WIDTH } from '@/lib/theme';

export function JournalTags({ id }: { id: string }) {
  const { snap, update } = useStore();
  const inset = useSafeAreaInsets();
  const e = snap.journal![id];
  const mine = useMemo(() => e.tags ?? [], [e.tags]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  /* the entry's own first, in the order they were opened with, then the rest, most used first. The order is set when the page
     opens, so a tag does not jump away under the thumb */
  const [order] = useState(() => [...new Set([...mine, ...jnTagCounts(snap.journal, jnTagsOf(snap.settings)).map((t) => t.tag)])]);
  const shown = [...new Set([...order, ...mine])];
  const setTags = (tags: string[]) => update((s0) => ({ ...s0, journal: jnEdit(s0.journal || {}, id, { tags }) }));
  const toggle = (t: string) => {
    buzz('tap');
    setTags(mine.includes(t) ? mine.filter((x) => x !== t) : [...mine, t]);
  };
  const clean = cleanTag(draft);
  const add = () => {
    if (!clean) return;
    buzz('tap');
    if (!mine.includes(clean)) setTags([...mine, clean]);
    setDraft('');
    setAdding(false);
  };
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.row} contentContainerStyle={s.rowIn} accessibilityLabel="Tags on this entry">
        {shown.map((t) => {
          const on = mine.includes(t);
          return (
            <Pressable
              key={t}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={'Tag ' + t}
              onPress={() => toggle(t)}
              style={({ pressed }) => [s.tag, on && s.tagOn, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[s.tagT, on && s.tagTOn]}>{'#' + t}</Text>
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New tag"
          onPress={() => setAdding(true)}
          style={({ pressed }) => [s.tag, { opacity: pressed ? 0.7 : 1 }]}>
          <Icon name="plus" size={15} color={JN.quiet} />
          <Text style={s.tagT}>Tag</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={adding} transparent animationType="slide" onRequestClose={() => setAdding(false)} statusBarTranslucent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={[StyleSheet.absoluteFill, s.scrim]} onPress={() => setAdding(false)} />
          <View style={[s.sheet, { paddingBottom: Math.max(inset.bottom, 16) }]}>
            <View style={s.head}>
              <T v="h2" accessibilityRole="header" style={{ flex: 1 }}>
                New tag
              </T>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setAdding(false)} hitSlop={8} style={s.x}>
                <Icon name="x" color={JN.ink} />
              </Pressable>
            </View>
            <Field
              label="New tag"
              hideLabel
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              keyboardAppearance="dark"
              maxLength={40}
              placeholder="prayer"
              value={draft}
              onChangeText={setDraft}
              returnKeyType="done"
              onSubmitEditing={add}
            />
            <Button label={clean ? 'Add #' + clean : 'Add'} disabled={!clean} onPress={add} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  row: { flexGrow: 0, marginBottom: 4, marginHorizontal: -24 },
  rowIn: { paddingHorizontal: 24, gap: 4, alignItems: 'center' },
  tag: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, borderRadius: 22 },
  tagOn: { backgroundColor: 'rgba(255, 255, 255, 0.14)' },
  tagT: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 20, color: JN.quiet },
  tagTOn: { fontFamily: font.bodySemi, color: JN.ink },
  wrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  scrim: { backgroundColor: 'rgba(11, 9, 32, 0.5)' },
  sheet: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#24213D',
  },
  head: { flexDirection: 'row', alignItems: 'center' },
  x: { width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' },
});
