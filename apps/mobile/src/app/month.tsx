/* What changed this month (core pattern-offer.ts, monthRead): a short read of one finished month against the one before, from
   the person's own log. Part of Daybook Pattern. A month that finished while the plan was active stays readable after it
   ends (core patMonthOpen). The flame stays at the top, because a month read is a picture of the person changing. */
import { gameCompute, monthNext, monthRead, PAT_WORDS } from '@daybook/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Flame } from '@/components/flame';
import { Dock } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { useOpenMonths } from '@/components/support';
import { Button, Chip, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function Month() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const st = snap.settings;
  const months = useOpenMonths();
  const [pick, setPick] = useState<string | null>(null);
  const ym = pick || months[0] || null;
  const r = st && ym ? monthRead(snap.days, st, ym) : null;
  const w = PAT_WORDS.month;
  const level = st ? gameCompute(snap.days, st, snap.reviews, tk).level.n : 1;
  return (
    <SheetFrame title={r ? w.in + r.name : w.title}>
      <View style={s.top}>
        <Flame level={level} size={110} alive />
        <T v="title" style={s.c} accessibilityRole="header">
          {r ? r.head : w.waiting + monthNext(tk) + w.waitingEnd}
        </T>
      </View>
      {r ? (
        <View style={{ gap: 10 }}>
          {r.lines.map((l) => (
            <View key={l.k} style={[s.line, { backgroundColor: c.surface2 }]}>
              <View style={[s.ic, { backgroundColor: c.accentSoft }]}>
                <Icon name={l.icon} size={18} color={c.accentText} />
              </View>
              <T style={{ flex: 1 }}>{l.t}</T>
            </View>
          ))}
        </View>
      ) : null}
      <Dock>
        {months.length > 1 ? (
          <View style={{ gap: 6 }}>
            <T v="small" tone="muted">
              {w.earlier}
            </T>
            <View style={s.chips}>
              {months.map((m) => (
                <Chip key={m} label={monthRead(snap.days, st!, m)?.name || m} on={m === ym} onPress={() => setPick(m)} />
              ))}
            </View>
          </View>
        ) : null}
        <Button label={PAT_WORDS.sheet.done} onPress={closeSheet} />
      </Dock>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  top: { alignItems: 'center', gap: 10, paddingVertical: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
  ic: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
