/* Change, on Today: the daily list in the same view as its unlock (components/list-edit.tsx; the owner, November 13, 2026: "use
   the same view to edit the list when they press change from the home screen"). The very list on Today, drawn as Today draws it,
   changes live as a part is added or taken off. The main button keeps it for every day; the quiet link under it keeps it for today
   only (core routineDay), as the old Change sheet did, and anything already done today stays counted either way. */
import { ROUTINE_SHOWN, routineDay, setRoutine } from '@daybook/core';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListChips, ListPreview, listOf, type DayList } from '@/components/list-edit';
import { Ghost } from '@/components/lx';
import { Dock, SceneFrame } from '@/components/scene';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';

export default function DayListPage() {
  const { snap, tk, apply, update, say } = useStore();
  const st = snap.settings;
  /* it starts from today as it is, today's own changes included */
  const [list, setList] = useState<DayList>(() => (st ? listOf(st, snap.days, tk, true) : {}));
  if (!st) return null;

  /* every day: the usual list, and today's own changes let go, so today is the usual list too */
  const everyDay = () => {
    let next = st;
    for (const x of ROUTINE_SHOWN) if (!!st.routine[x.k] !== list[x.k]) next = setRoutine(next, x.k, list[x.k]);
    if (next !== st) apply({ st: next });
    update((s0) => {
      let days = s0.days;
      for (const x of ROUTINE_SHOWN) days = routineDay(days, next, tk, x.k, list[x.k]);
      return days === s0.days ? s0 : { ...s0, days };
    });
    buzz('lit');
    say('Your list is set for every day.');
    close();
  };
  /* today only: the usual list stays as it is */
  const today = () => {
    update((s0) => {
      let days = s0.days;
      for (const x of ROUTINE_SHOWN) days = routineDay(days, s0.settings!, tk, x.k, list[x.k]);
      return days === s0.days ? s0 : { ...s0, days };
    });
    buzz('tap');
    say('Changed for today only.');
    close();
  };

  return (
    <SceneFrame title="" sky="sun" onClose={() => close()}>
      <T v="title" style={s.c} accessibilityRole="header">
        Your list on Today
      </T>
      <T v="small" tone="muted" style={[s.c, { marginTop: 8 }]}>
        This is your day, just as Today shows it. Add a part, or tap one to take it off.
      </T>
      <View style={s.mid}>
        <ListPreview list={list} />
      </View>
      <Dock>
        <ListChips list={list} onChange={setList} />
        <View style={{ gap: 2 }}>
          <Button label="Keep it for every day" onPress={everyDay} />
          <Ghost label="Only for today" onPress={today} />
        </View>
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flex: 1, justifyContent: 'center', alignSelf: 'stretch' },
});
