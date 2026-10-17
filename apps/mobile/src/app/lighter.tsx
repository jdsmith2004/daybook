/* A lighter Today: what it keeps, what goes quiet, what happens after a slip, and the switch. Offered on Today after a long
   stretch with no slip and a quiet couple of weeks (see lighter.ts); it can be undone here or from Today at any time. */
import { fmtDate, LEAN_DAYS, LEAN_QUIET_DAYS, leanInfo, leanStart, leanStop } from '@daybook/core';
import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Button, Card, T } from '@/components/ui';
import { useStore } from '@/lib/store';

const KEEPS = [
  'SOS, and every tool in it',
  'Your plan, your reasons, and who you are becoming',
  'Your points, level and badges',
  'Logging any urge or slip, and Rekindle after a slip',
  'Learn and Journal, whenever you want them',
];
const QUIET = ['The daily stops: morning, wind-down and check-in', 'The days card and Next up', 'The weekly review nudge'];

export default function Lighter() {
  const { snap, tk, apply } = useStore();
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const li = leanInfo(snap.days, st, tk);
  const list = (rows: string[]) => (
    <View style={{ gap: 4 }}>
      {rows.map((r) => (
        <T key={r}>· {r}</T>
      ))}
    </View>
  );
  return (
    <SheetFrame title="A lighter Today" sub="Lean on Daybook less, for as long as you like">
      <Card tone="note">
        {li.on ? (
          <T>You have been leaning on Daybook less since {fmtDate(li.on, { month: 'long', day: 'numeric' })}.</T>
        ) : li.ready ? (
          <T>
            You have gone {li.clean} days with no slip, and the last two weeks have been quiet. That is a lot of practice. Daybook can step back and let you
            carry more of it yourself.
          </T>
        ) : (
          <T>
            Daybook offers this after {LEAN_DAYS} days in a row with no slip and a quiet {LEAN_QUIET_DAYS} days. You are at {li.clean} days now. Keep going; it
            will be here.
          </T>
        )}
      </Card>
      <SheetH title="What stays" />
      {list(KEEPS)}
      <SheetH title="What goes quiet" />
      {list(QUIET)}
      <T v="small" tone="muted">
        Reminders stay as you set them in Settings.
      </T>
      <SheetH title="If you slip" />
      <T>
        A slip is a slip, not a verdict. Rekindle opens the same as always, nothing is taken away, and you decide whether you want the full Today back for a
        while.
      </T>
      {li.on ? (
        <Button
          label="Bring back the full Today"
          onPress={() => {
            apply(leanStop(st, tk));
            closeSheet();
          }}
        />
      ) : li.ready ? (
        <>
          <Button
            label="Lean on Daybook less"
            onPress={() => {
              apply(leanStart(st, tk));
              closeSheet();
            }}
          />
          <Button kind="ghost" label="Keep everything as it is" onPress={closeSheet} />
        </>
      ) : (
        <Button label="Done" onPress={closeSheet} />
      )}
    </SheetFrame>
  );
}
