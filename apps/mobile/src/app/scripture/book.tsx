/* A book's chapters, as a grid of numbers: one tap opens a chapter. The chapter read last in this book is filled in. */
import { scrKey, scrNumbered } from '@daybook/core';
import { router, Redirect, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ScrLost } from '@/components/scripture';
import { Text } from '@/components/text';
import { buzz } from '@/lib/feel';
import { lastRead, scrChapters, scrIndex, useScripture } from '@/lib/scripture';
import { font, useTheme } from '@/lib/theme';

export default function Book() {
  const c = useTheme();
  const lib = useScripture();
  const { vol, book } = useLocalSearchParams<{ vol: string; book: string }>();
  const name = scrNumbered(book || '')?.name ?? '';
  const [chs, setChs] = useState<number[] | null>(null);
  const [lost, setLost] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      let live = true;
      (async () => {
        const v = (await scrIndex()).find((x) => x.dir === vol);
        const b = v?.books.find((x) => x.dir === book);
        if (!v || !b) throw new Error('gone');
        const list = await scrChapters(v, b);
        if (live) (setChs(list), setLost(false));
      })().catch(() => live && setLost(true));
      lastRead().then((k) => live && setLast(k));
      return () => void (live = false);
    }, [vol, book]),
  );
  if (!lib.ready) return null;
  if (!lib.can || !lib.on) return <Redirect href="/scripture" />;
  return (
    <Screen title={name} back>
      {lost ? <ScrLost /> : null}
      <View style={s.grid}>
        {(chs || []).map((n) => {
          const key = scrKey(name, n);
          const was = key === last;
          return (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${name} ${n}`}
              onPress={() => {
                buzz('tap');
                router.push({ pathname: '/scripture/read', params: { key } });
              }}
              style={({ pressed }) => [s.cell, { backgroundColor: was ? c.sun : c.surface, opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[s.num, { color: was ? c.onSun : c.ink }]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: font.display, fontSize: 20 },
});
