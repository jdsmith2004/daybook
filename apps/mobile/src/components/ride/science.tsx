/* Why it works: the sheet behind the small book button on every SOS move and every tool. It says in one line why the
   move works, then the lesson behind it in brief (its answer, and each study with its size and year), and opens the
   whole lesson for a calm moment (core ride.ts rideScience). The ride waits under it. */
import { rideScience } from '@daybook/core';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, NightContext, useSkyTheme, type Sky } from '@/lib/theme';

export const hasScience = (id: string) => !!rideScience(id);

/** the small round button that opens it */
export function ScienceButton({ onPress, sky }: { onPress: () => void; sky: Sky }) {
  const c = useSkyTheme(sky);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Why it works: the science"
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => [s.btn, { backgroundColor: c.scBtn, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name="book" size={18} color={c.ink} />
    </Pressable>
  );
}

export function ScienceSheet({ id, name, open, night, onClose }: { id: string; name: string; open: boolean; night: boolean; onClose: () => void }) {
  const c = useSkyTheme(night ? 'night' : 'violet');
  const inset = useSafeAreaInsets();
  const sci = rideScience(id);
  return (
    <Modal visible={open && !!sci} transparent animationType="slide" onRequestClose={onClose}>
      <NightContext.Provider value={night}>
        <View style={s.wrap}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[s.sheet, { backgroundColor: c.surface, paddingBottom: inset.bottom + 16 }]}>
            <View style={s.top}>
              <View style={[s.grab, { backgroundColor: c.line }]} />
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8} style={[s.x, { backgroundColor: c.bg }]}>
                <Icon name="x" size={18} color={c.ink} />
              </Pressable>
            </View>
            {sci ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                <View style={{ gap: 6 }}>
                  <View style={s.eye}>
                    <Icon name="book" size={14} color={c.accentText} />
                    <Text style={[s.eyeT, { color: c.accentText }]}>Why {name} works</Text>
                  </View>
                  <Text style={[s.h, { color: c.ink }]} accessibilityRole="header">
                    {sci.t}
                  </Text>
                </View>
                {sci.lesson ? (
                  <View style={{ gap: 4 }}>
                    {sci.lesson.ask ? <Text style={[s.ask, { color: c.muted }]}>{sci.lesson.ask}</Text> : null}
                    <T>{sci.lesson.key}</T>
                  </View>
                ) : null}
                {sci.proofs.length ? (
                  <View style={[s.studies, { backgroundColor: c.bg }]}>
                    {sci.proofs.map((p, i) => (
                      <View key={i} style={[s.study, i ? { borderTopWidth: 1, borderTopColor: c.line } : null]}>
                        <Text style={[s.studyH, { color: c.ink }]}>{p.h}</Text>
                        <Text style={[s.studyS, { color: c.muted }]}>{p.s}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {sci.lesson ? (
                  <Button
                    label={'Read the lesson · ' + sci.lesson.mins + ' min'}
                    icon="book"
                    onPress={() => {
                      onClose();
                      router.push({ pathname: '/lesson/[id]', params: { id: sci.lesson!.id } });
                    }}
                  />
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </NightContext.Provider>
    </Modal>
  );
}

const s = StyleSheet.create({
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  wrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,10,40,0.38)' },
  sheet: { maxHeight: '82%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 10 },
  top: { height: 40, alignItems: 'center', justifyContent: 'center' },
  grab: { width: 40, height: 5, borderRadius: 3 },
  x: { position: 'absolute', right: 0, top: 2, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  eye: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyeT: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  h: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  ask: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  studies: { borderRadius: 20, paddingHorizontal: 16 },
  study: { paddingVertical: 12, gap: 3 },
  studyH: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  studyS: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
});
