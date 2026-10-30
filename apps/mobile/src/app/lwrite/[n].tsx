/* A checkpoint: after every second lesson, a longer piece of writing about that pair. Three prompts, one box each, saved as it is
   typed (settings.learn.wr). It earns no points: it is for the person, not for a score. The route's n is the checkpoint's
   own record (c1 to c16, always about the same two lessons); the number shown is its place on the path (core lcheckNo).
   Ported from the legacy SCENES.lwrite. */
import { LCHECKS, lcheckNo, lcheckPair, lessonNo, LWRITE_LEN, lwriteOf, lwriteSave } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { KeyboardRoom } from '@/components/keyboard';
import { Text, TextInput } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LxCheck } from '@/components/lesson-art';
import { Button, Icon, T } from '@/components/ui';
import { close, closeAll } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Lwrite() {
  const { n: nRaw } = useLocalSearchParams<{ n: string }>();
  const n = Number(nRaw) || 0;
  const { snap, apply } = useStore();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const C = LCHECKS[n - 1];
  const pair = lcheckPair(n);
  const A = pair && pair.a;
  const B = pair && pair.b;
  const total = C ? C.q.length : 0;
  const fin = i === total;
  const txt = lwriteOf(st, n);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: inset.top + 8, paddingBottom: inset.bottom + 12, paddingHorizontal: 16 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', gap: 12 }}>
        <View style={s.top}>
          <T v="eyebrow" tone="muted">
            {C && A && B
              ? 'Checkpoint ' + lcheckNo(n, st) + (lessonNo(A, st) ? ' · lessons ' + lessonNo(A, st) + ' and ' + lessonNo(B, st) : '')
              : 'Checkpoint'}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={[s.x, { backgroundColor: c.scBtn }]}>
            <Icon name="x" color={c.ink} />
          </Pressable>
        </View>
        {!C || !A || !B ? (
          <T v="title">That checkpoint is not here</T>
        ) : (
          <>
            <View style={s.prog}>
              {Array.from({ length: total + 1 }, (_, j) => (
                <View key={j} style={[s.progI, { backgroundColor: fin || j < i ? c.mint : j === i ? c.accent : c.lip }]} />
              ))}
            </View>
            <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={s.cardIn} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled">
              <KeyboardRoom scroll={scroll}>
                {!fin ? (
                  <>
                    <T v="eyebrow" tone="muted">
                      Write it out · {i + 1} of {total}
                    </T>
                    <T v="title" accessibilityRole="header">
                      {C.q[i]}
                    </T>
                    <T tone="muted">A few sentences is plenty. Only you see this.</T>
                    <TextInput
                      key={i}
                      accessibilityLabel="Your answer"
                      multiline
                      maxLength={LWRITE_LEN}
                      defaultValue={txt[i] || ''}
                      placeholder="Start anywhere"
                      placeholderTextColor={c.muted}
                      onChangeText={(v) => apply({ st: lwriteSave(snap.settings!, n, i, v) })}
                      style={[s.wr, { borderColor: c.line, color: c.ink, backgroundColor: c.surface }]}
                    />
                    <T v="small" tone="muted">
                      Saved as you type
                    </T>
                  </>
                ) : (
                  <>
                    <View style={{ alignItems: 'center' }}>
                      <LxCheck />
                    </View>
                    <T v="eyebrow" tone="mintText">
                      Checkpoint saved
                    </T>
                    <T v="title" accessibilityRole="header">
                      That is in your plan.
                    </T>
                    <T>You wrote it for yourself. It stays in My plan, under Learned, to read whenever you want.</T>
                  </>
                )}
              </KeyboardRoom>
            </ScrollView>
            {fin ? (
              <View style={{ gap: 8 }}>
                <Route
                  label="Read it in My plan"
                  onPress={() => {
                    closeAll();
                    router.push({ pathname: '/plan', params: { pane: 'learned' } });
                  }}
                />
                <Route
                  label="Back to Learn"
                  onPress={() => {
                    closeAll();
                    router.navigate('/learn');
                  }}
                />
                <Button label="Done" onPress={closeAll} />
              </View>
            ) : (
              <View style={s.foot}>
                {i > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    onPress={() => setI(i - 1)}
                    style={({ pressed }) => [s.back, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
                    <Icon name="back" size={20} color={c.ink} />
                  </Pressable>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Button label={i === total - 1 ? 'Finish' : 'Next'} onPress={() => setI(i + 1)} />
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function Route({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.soft, { backgroundColor: c.accentSoft, opacity: pressed ? 0.7 : 1 }]}>
      <T v="label" tone="accentText" style={{ flex: 1 }}>
        {label}
      </T>
      <Icon name="next" size={16} color={c.accentText} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  x: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  prog: { flexDirection: 'row', gap: 4 },
  progI: { flex: 1, height: 4, borderRadius: 2 },
  cardIn: { paddingVertical: 12, gap: 12 },
  wr: { minHeight: 170, padding: 16, borderRadius: 20, borderWidth: 1.5, fontFamily: font.body, fontSize: 17, lineHeight: 24, textAlignVertical: 'top' },
  foot: { flexDirection: 'row', gap: 8 },
  back: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  soft: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50, paddingHorizontal: 16, borderRadius: 12 },
});
