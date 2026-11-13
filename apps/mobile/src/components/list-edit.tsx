/* The daily list, changed where it can be seen (the owner, November 13, 2026: "it should look the same as home ... it's hard to
   tell they're editing the home screen", then "use the same view to edit the list when they press change from the home screen").
   The very list on Today, drawn as Today draws it (your-day.tsx DayPreview), changes live as a part is added (+) or taken off.
   Used by the daily list's unlock (app/unlock.tsx) and by Change on Today (app/day-list.tsx). */
import { routineOn, ROUTINE_SHOWN, stopTiles, type Days, type Settings } from '@daybook/core';
import { StyleSheet, View } from 'react-native';

import { Answer, AnswerText } from '@/components/lesson-parts';
import { Icon } from '@/components/ui';
import { DayPreview } from '@/components/your-day';
import { buzz } from '@/lib/feel';
import { PAPER_INK } from '@/lib/lesson-look';
import { useStore } from '@/lib/store';
import { useAccount } from '@/lib/sync';

export type DayList = Record<string, boolean>;

/* the routine's parts by the names Today gives them (the routine's Wind-down is Good night on Today) */
const ON_TODAY: Record<string, string> = { wind: 'Good night', reach: 'Reach out' };
export const todayName = (x: { k: string; name: string }) => ON_TODAY[x.k] || x.name;

/** the list as it starts: the usual one, or with today's changes when it is for today */
export function listOf(st: Settings, days: Days, tk: string, today: boolean): DayList {
  const p = days[tk]?.p;
  return Object.fromEntries(ROUTINE_SHOWN.map((x) => [x.k, today ? routineOn(st, p, x.k) : !!st.routine[x.k]]));
}

/** Today's list with these parts on, as Today would draw it */
export function ListPreview({ list }: { list: DayList }) {
  const { snap, tk, now } = useStore();
  const account = useAccount();
  const st = snap.settings;
  if (!st) return null;
  /* the picture shows exactly this list: today's own changes are set aside, since the list here already holds them */
  const d = snap.days[tk];
  const days = d && d.p && d.p.ov ? { ...snap.days, [tk]: { ...d, p: { ...d.p, ov: {} } } } : snap.days;
  const tiles = stopTiles(days, { ...st, routine: { ...st.routine, ...list } }, tk, now, snap.journal, !!account).tiles;
  return (
    <DayPreview
      tiles={tiles}
      label={
        'Your day on Today: ' +
        ROUTINE_SHOWN.filter((x) => list[x.k])
          .map(todayName)
          .join(', ') +
        '.'
      }
    />
  );
}

/** each part, low: on (a check) to take off, off (+) to add */
export function ListChips({ list, onChange }: { list: DayList; onChange: (l: DayList) => void }) {
  return (
    <View style={s.grid}>
      {ROUTINE_SHOWN.map((x) => (
        <Answer
          key={x.k}
          sel={list[x.k]}
          right={list[x.k]}
          onPress={() => {
            buzz('tap');
            onChange({ ...list, [x.k]: !list[x.k] });
          }}
          style={s.cell}
          label={list[x.k] ? todayName(x) + ', on Today. Tap to take it off.' : 'Add ' + todayName(x) + ' to Today'}>
          <View style={s.cellIn}>
            {list[x.k] ? null : <Icon name="plus" size={16} color={PAPER_INK} />}
            <AnswerText right={list[x.k]}>{todayName(x)}</AnswerText>
          </View>
        </Answer>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { paddingVertical: 12, flexGrow: 1, flexBasis: '45%' },
  cellIn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
