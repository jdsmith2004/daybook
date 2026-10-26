/* Name it: the ride's feeling move. The four colors of Name the feeling come first; one tap opens the whole field of
   feelings over the ride (the same pannable grid as the tool, components/tools/feel), and the feeling named comes back
   into the ride with one short line on what that kind of feeling is really asking for (core feelings.ts FEEL_ASKS). It
   is not a lesson; it is what a good friend would say. The feeling goes on today's log, and it steers the rest of the
   ride: the move that fits it comes next, and the urge's trigger is set from it (core ride.ts rideNext, sos.ts urRank). */
import { FEEL_ASKS, FEEL_QUADS, FEEL_TRIG, feelAt, feelFam, feelLead, feelLog, TOOLS, urNight, withDay } from '@daybook/core';
import { useState } from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Appear } from '@/components/appear';
import { Text } from '@/components/text';
import { BreathingShape, FEEL_COLORS, FeelGrid, feelKind, QuadBubbles, type FeelFrom } from '@/components/tools/feel';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

import type { MoveProps } from './moves';

/** the ride's moves; a named feeling's own tool is shown as a button when it is not one of them */
const IN_RIDE = ['breathe', 'move', 'stack', 'ground', 'forward', 'thought', 'reasons'];

export function FeelMove({ onDone, onFeel, onTool }: MoveProps) {
  const c = useTheme();
  const { width: W } = useWindowDimensions();
  const { tk, now, update } = useStore();
  const [from, setFrom] = useState(FEEL_QUADS[0]);
  const [grid, setGrid] = useState(false);
  const [at, setAt] = useState<FeelFrom | undefined>(undefined);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const night = urNight(new Date(now).getHours());

  if (sel) {
    const f = feelAt(sel.r, sel.c)!;
    const fam = feelFam(sel.r, sel.c)!;
    const ask = FEEL_ASKS[fam];
    const lead = feelLead(sel.r, sel.c, night);
    const own = lead && IN_RIDE.indexOf(lead.tool) < 0 ? TOOLS.find((t) => t.id === lead.tool) : null;
    return (
      <View style={s.move}>
        <View style={s.words}>
          <T v="eyebrow" tone="muted" style={s.c}>
            Name it to tame it
          </T>
          <Text style={[s.word, { color: c.ink }]} accessibilityRole="header">
            {f.w}
          </Text>
          <T v="small" tone="muted" style={s.c}>
            {'Say it on a slow breath out: “I feel ' + f.w.toLowerCase() + '.”'}
          </T>
        </View>
        <View style={s.mid}>
          <BreathingShape kind={feelKind(sel.r, sel.c)} color={FEEL_COLORS[sel.r][sel.c]} ink={c.muted} />
        </View>
        <Appear delay={500} by={14} duration={380} style={[s.card, { backgroundColor: c.surface }]}>
          <T v="eyebrow" tone="muted">
            What it is asking for
          </T>
          <Text style={[s.askH, { color: c.ink }]}>{ask.h}</Text>
          <T v="small" style={{ lineHeight: 20 }}>
            {ask.t}
          </T>
        </Appear>
        <View style={s.dock}>
          {own ? <Button label={own.name} onPress={() => onTool?.(own.id)} /> : null}
          <Button label={own ? 'Keep riding' : 'Next'} kind={own ? 'ghost' : 'primary'} onPress={onDone} />
        </View>
      </View>
    );
  }

  const d = Math.min(W - 120, 300) / 2;
  return (
    <View style={s.move}>
      <View style={s.words}>
        <Text style={[s.head, { color: c.ink }]} accessibilityRole="header">
          Name it
        </Text>
        <T v="small" tone="muted" style={s.c}>
          Where is the feeling under the urge? Tap the closest color.
        </T>
      </View>
      <View style={s.mid}>
        <QuadBubbles
          d={d}
          onPick={(q, p) => {
            setFrom(q);
            setAt(p);
            setGrid(true);
          }}
        />
      </View>
      <Modal visible={grid} animationType="fade" onRequestClose={() => setGrid(false)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <FeelGrid
            start={{ r: from.r, c: from.c }}
            from={at}
            onBack={() => setGrid(false)}
            onClose={() => setGrid(false)}
            onNext={(r, cc) => {
              const f = feelAt(r, cc)!;
              const fam = feelFam(r, cc)!;
              const lead = feelLead(r, cc, night);
              update((st) => ({ ...st, days: withDay(st.days, tk, feelLog(st.days[tk], tk, f.w, Date.now())) }));
              onFeel?.({ w: f.w, lead: lead ? lead.tool : null, trig: FEEL_TRIG[fam] });
              buzz('save');
              setGrid(false);
              setSel({ r, c: cc });
            }}
          />
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  move: { flexGrow: 1, alignSelf: 'stretch', gap: 12 },
  words: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  head: { fontFamily: font.displayBold, fontSize: 30, lineHeight: 36, textAlign: 'center' },
  word: { fontFamily: font.displayBold, fontSize: 40, lineHeight: 46, textAlign: 'center' },
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  card: { alignSelf: 'stretch', gap: 4, padding: 16, borderRadius: 22 },
  askH: { fontFamily: font.display, fontSize: 19, lineHeight: 24 },
  dock: { gap: 8 },
});
