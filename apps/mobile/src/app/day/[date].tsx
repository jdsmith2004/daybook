/* One day: its entries, its check-in, and that night's screens-off and sleep. Ported from the legacy sheetDay. */
import { fmtClock, fmtDate, isKey, phaseLabel, setScreensOff, sortedEvents, stepSleep } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { CheckinBlock } from '@/components/checkin';
import { EntryRows } from '@/components/entry-rows';
import { Stepper, YesNo } from '@/components/form';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Button, Card, T } from '@/components/ui';
import { Dock } from '@/components/scene';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';

export default function DaySheet() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { snap, tk, update } = useStore();
  const st = snap.settings;
  if (!st || !isKey(date)) return <Redirect href="/" />;
  const day = snap.days[date];
  const evs = sortedEvents(day, st.rollover);
  const c = day?.checkin;
  return (
    <SheetFrame title={fmtDate(date, { weekday: 'long', month: 'short', day: 'numeric' })} sub={phaseLabel(date, st)}>
      <SheetH title="Entries" aside={String(evs.length)} />
      {evs.length ? <EntryRows date={date} /> : <T tone="muted">No entries for this day.</T>}
      <Button kind="ghost" label="+ Add an entry" onPress={() => router.push({ pathname: '/entry', params: { date } })} />
      <SheetH title="Check-in" />
      <Card>
        <CheckinBlock dkey={date} isToday={date === tk} />
      </Card>
      <SheetH title="Night and sleep" />
      <Card>
        <View style={{ gap: 6 }}>
          <YesNo
            label={'Screens off by ' + fmtClock(st.screensOff) + ' that night?'}
            value={c ? c.so : null}
            onPick={(v) => {
              update((s0) => ({ ...s0, days: setScreensOff(s0.days, date, v) }));
              buzz('tap');
            }}
          />
          <Stepper
            label="Sleep the night before"
            text={c && c.h != null ? c.h.toFixed(1) + ' h' : '–'}
            unset={!c || c.h == null}
            less="Less sleep"
            more="More sleep"
            onStep={(d) => update((s0) => ({ ...s0, days: stepSleep(s0.days, date, d * 0.5) }))}
          />
        </View>
      </Card>
      <Dock>
        <Button label="Done" onPress={closeSheet} />
      </Dock>
    </SheetFrame>
  );
}
