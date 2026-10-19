/* A checkpoint: after every second lesson, a longer piece of writing about that pair. Three prompts, one box each, saved as it is
   typed (settings.learn.wr). It earns no points: it is for the person, not for a score. Ported from the legacy SCENES.lwrite. */
import { LCHECKS, LESSONS, LUNITS, LWRITE_LEN, lwriteOf, lwriteSave } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LxCheck } from '@/components/lesson-art';
import { Icon, T } from '@/components/ui';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme } from '@/lib/theme';

export default function Lwrite() {
  const { n: nRaw } = useLocalSearchParams<{ n: string }>();
  const n = Number(nRaw) || 0;
  const { snap, apply } = useStore();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const [i, setI] = useState(0);
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const C = LCHECKS[n - 1];
  const A = LESSONS[2 * n - 2];
  const B = LESSONS[2 * n - 1];
  const t = toneOf(c, B ? LUNITS[B.u].tone : 'accent');
  const total = C ? C.q.length : 0;
  const fin = i === total;
  const txt = lwriteOf(st, n);
  const btn = (label: string, onPress: () => void, icon = true) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.next, { backgroundColor: c.accent, shadowColor: c.accentDeep }]}>
      <Text style={[s.nextT, { color: c.accentInk }]}>{label}</Text>
      {icon ? <Icon name="next" size={20} color={c.accentInk} /> : null}
    </Pressable>
  );
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: inset.top + 8, paddingBottom: inset.bottom + 12, paddingHorizontal: 16 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', gap: 12 }}>
        <View style={s.top}>
          <T v="eyebrow" tone="muted">
            {C && A && B ? 'Checkpoint ' + n + ' · lessons ' + (2 * n - 1) + ' and ' + 2 * n : 'Checkpoint'}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={[s.x, { backgroundColor: c.scBtn, borderColor: c.cardEdge }]}>
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
            <ScrollView
              style={[s.card, { backgroundColor: c.surface, shadowColor: c.lip }]}
              contentContainerStyle={s.cardIn}
              automaticallyAdjustKeyboardInsets
              keyboardShouldPersistTaps="handled">
              {!fin ? (
                <>
                  <View style={s.eye}>
                    <View style={[s.ei, { backgroundColor: t.soft }]}>
                      <Icon name="pencil" size={16} color={t.text} />
                    </View>
                    <Text style={[s.eyeT, { color: t.text }]}>
                      WRITE IT OUT · {i + 1} OF {total}
                    </Text>
                  </View>
                  <T style={s.h} accessibilityRole="header">
                    {C.q[i]}
                  </T>
                  <T tone="muted" style={{ fontSize: 17 }}>
                    A few sentences is plenty. Only you see this.
                  </T>
                  <TextInput
                    key={i}
                    accessibilityLabel="Your answer"
                    multiline
                    maxLength={LWRITE_LEN}
                    defaultValue={txt[i] || ''}
                    placeholder="Start anywhere"
                    placeholderTextColor={c.muted}
                    onChangeText={(v) => apply({ st: lwriteSave(snap.settings!, n, i, v) })}
                    style={[s.wr, { borderColor: c.accent, color: c.ink, backgroundColor: c.surface }]}
                  />
                  <T v="small" tone="mintText">
                    ✓ Saved as you type
                  </T>
                </>
              ) : (
                <>
                  <View style={{ alignItems: 'center' }}>
                    <LxCheck />
                  </View>
                  <T v="label" tone="mintText">
                    CHECKPOINT SAVED
                  </T>
                  <T style={s.h} accessibilityRole="header">
                    That is in your plan.
                  </T>
                  <T style={{ fontSize: 18, lineHeight: 26 }}>You wrote it for yourself. It stays in My plan, under Learned, to read whenever you want.</T>
                  <Route
                    label="Read it in My plan"
                    onPress={() => {
                      close();
                      router.push({ pathname: '/plan', params: { pane: 'learned' } });
                    }}
                  />
                  <Route
                    label="Back to Learn"
                    onPress={() => {
                      close();
                      router.navigate('/learn');
                    }}
                  />
                </>
              )}
            </ScrollView>
            <View style={s.foot}>
              {!fin && i > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                  onPress={() => setI(i - 1)}
                  style={[s.back, { backgroundColor: c.scBtn, borderColor: c.cardEdge }]}>
                  <Icon name="back" size={22} color={c.ink} />
                </Pressable>
              ) : null}
              {fin ? btn('Done', close, false) : btn(i === total - 1 ? 'Finish' : 'Next', () => setI(i + 1))}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Route({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.soft, { backgroundColor: c.accentSoft }]}>
      <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 17, color: c.accentText }}>{label}</Text>
      <Icon name="next" size={20} color={c.accentText} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  x: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  prog: { flexDirection: 'row', gap: 4 },
  progI: { flex: 1, height: 8, borderRadius: 4 },
  card: { flex: 1, borderRadius: 28, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0 },
  cardIn: { padding: 22, gap: 14 },
  eye: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ei: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  eyeT: { fontFamily: font.bodyBold, fontSize: 12.5, letterSpacing: 1.2 },
  h: { fontFamily: font.display, fontSize: 26, lineHeight: 31 },
  wr: { minHeight: 170, padding: 14, borderRadius: 16, borderWidth: 2, fontFamily: font.body, fontSize: 17, lineHeight: 24, textAlignVertical: 'top' },
  foot: { flexDirection: 'row', gap: 10 },
  next: {
    flex: 1,
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  nextT: { fontFamily: font.bodySemi, fontSize: 19 },
  back: { width: 60, height: 60, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  soft: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingHorizontal: 16, borderRadius: 16 },
});
