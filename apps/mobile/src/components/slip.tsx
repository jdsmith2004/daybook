/* The pieces of the comeback after a slip (log.tsx; the rules and the research are in core slip.ts): the four colors that
   open the field of feelings, the feeling named big and breathing in its own color, and the one column of choices
   (docs/design-standards.md: a small shape in the choice's color, the name, a line on it, and a chevron; a tap starts
   it). */
import { FEEL_MID } from '@daybook/core';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Shape, type ShapeKind } from '@/components/shapes';
import { Text } from '@/components/text';
import { BreathingShape, FEEL_COLORS, FeelGrid, feelKind, QuadBubbles, type FeelFrom } from '@/components/tools/feel';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, toneOf, useTheme } from '@/lib/theme';

/** the four colors, big and low where the thumb is; one tap opens the whole field of feelings on that color, and the
    word picked comes back through onPick */
export function FeelQuads({ onPick, start }: { onPick: (r: number, c: number) => void; start?: { r: number; c: number } | null }) {
  const { width: W } = useWindowDimensions();
  const [from, setFrom] = useState<{ r: number; c: number } | null>(null);
  const [at, setAt] = useState<FeelFrom | undefined>(undefined);
  const d = Math.min((Math.min(W, 430) - 32 - 12) / 2, 150);
  return (
    <>
      <QuadBubbles
        d={d}
        gap={12}
        onPick={(q, p) => {
          /* the field opens on the word picked before, when it is in this color */
          const near = start && start.r < FEEL_MID === q.r < FEEL_MID && start.c < FEEL_MID === q.c < FEEL_MID;
          setAt(p);
          setFrom(near ? start : { r: q.r, c: q.c });
        }}
      />
      <Modal visible={!!from} animationType="fade" onRequestClose={() => setFrom(null)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          {from ? (
            <FeelGrid
              start={from}
              from={at}
              onBack={() => setFrom(null)}
              onClose={() => setFrom(null)}
              onNext={(r, c) => {
                setFrom(null);
                onPick(r, c);
              }}
            />
          ) : null}
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

/** the feeling named: its shape in its own color, breathing slowly (still with Reduce Motion) */
export function FeelShape({ r, c }: { r: number; c: number }) {
  const t = useTheme();
  return <BreathingShape kind={feelKind(r, c)} color={FEEL_COLORS[r][c]} ink={t.muted} />;
}

export interface ChoiceRow {
  id: string;
  name: string;
  sub?: string;
  icon: string;
  tone: string;
  shape?: ShapeKind;
  /** a line under the name in the tone's color: what has worked before */
  tag?: string;
}
/** one column of choices; a tap picks it and moves on */
export function ChoiceRows({ list, onPick }: { list: ChoiceRow[]; onPick: (id: string) => void }) {
  const c = useTheme();
  return (
    <View style={s.list}>
      {list.map((x, j) => {
        const tn = toneOf(c, x.tone);
        /* on a dark sky the shape takes the tone's bright color, so it reads */
        const dark = c.scheme === 'dark';
        return (
          <Pressable
            key={x.id}
            accessibilityRole="button"
            accessibilityLabel={x.name + (x.sub ? '. ' + x.sub : '') + (x.tag ? '. ' + x.tag : '')}
            onPress={() => {
              buzz('tap');
              onPick(x.id);
            }}
            style={({ pressed }) => [s.row, { backgroundColor: c.surface, shadowColor: c.lip, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
            <Shape kind={x.shape || 'cookie9'} size={40} color={dark ? tn.ic : tn.soft} turn={j * 17}>
              <View>
                <Icon name={x.icon} size={20} color={dark ? '#1C2030' : tn.text} />
              </View>
            </Shape>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={[s.name, { color: c.ink }]}>{x.name}</Text>
              {x.sub ? <Text style={[s.sub, { color: c.muted }]}>{x.sub}</Text> : null}
              {x.tag ? <Text style={[s.sub, { color: dark ? tn.ic : tn.text, fontFamily: font.bodySemi }]}>{x.tag}</Text> : null}
            </View>
            <Icon name="next" size={18} color={c.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  list: { alignSelf: 'stretch', gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  name: { fontFamily: font.bodyBold, fontSize: 16 },
  sub: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
});
