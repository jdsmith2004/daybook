/* Settings: my plan and the walk-through, my daily routine, the schedule, how days are counted, look and feel, SOS, reminders,
   and saving, backing up and deleting. Changes save as you go. Ported from the legacy viewSettings. */
import {
  daysCsv,
  eventsCsv,
  fmtClock,
  fmtHour,
  gameCompute,
  makeBackup,
  minToClock,
  readBackup,
  restoreBackup,
  ROUTINE,
  setCelebrate,
  setCleanAuto,
  setCountMode,
  setDate,
  setRollover,
  setRoutine,
  setScreensOffTime,
  setUrPin,
  stepClock,
  toRecords,
  TOOLS,
  urTool,
  type RecordId,
} from '@daybook/core';
import Constants from 'expo-constants';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Link } from '@/components/choices';
import { DateStep } from '@/components/date-step';
import { Collapse, OnOff, Stepper } from '@/components/form';
import { LinkCard } from '@/components/link-card';
import { Screen } from '@/components/screen';
import { B } from '@/components/help-bits';
import { Button, Chip, T } from '@/components/ui';
import { pickBackupText, saveBackupFile } from '@/lib/backup';
import { forgetDrafts } from '@/lib/drafts';
import { setSoundPref, setThemePref, useSoundPref, useThemePref, type ThemePref } from '@/lib/prefs';
import { play } from '@/lib/sound';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

type Sec = 'routine' | 'sched' | 'count' | 'look' | 'sos' | 'remind' | 'data';

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <T v="label">{label}</T>
      {children}
      {hint ? (
        <T v="small" tone="muted">
          {hint}
        </T>
      ) : null}
    </View>
  );
}
const Chips = ({ children, label }: { children: ReactNode; label?: string }) => (
  <View style={s.chips} accessibilityLabel={label}>
    {children}
  </View>
);

export default function Settings() {
  const params = useLocalSearchParams<{ open?: string }>();
  const { snap, tk, apply, replace, erase, say, dirty, hooks } = useStore();
  const sos = useSos();
  const theme = useThemePref();
  const sound = useSoundPref();
  const first = (params.open || '').replace(/^s-/, '') as Sec;
  const [open, setOpen] = useState<Partial<Record<Sec, boolean>>>(first ? { [first]: true } : {});
  const [wipe, setWipe] = useState(false);
  const [busy, setBusy] = useState(false);
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const tog = (k: Sec) => () => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const sec = (k: Sec, title: string, sub: string, body: ReactNode) => (
    <Collapse title={title} sub={sub} open={!!open[k]} onToggle={tog(k)}>
      {body}
    </Collapse>
  );

  const restore = async () => {
    setBusy(true);
    try {
      const text = await pickBackupText();
      if (text == null) return;
      const { snap: next, restored } = restoreBackup(snap, readBackup(text));
      await replace(
        next,
        toRecords(next).map((r) => r.id as RecordId),
      );
      say(`Restored ${restored} day${restored === 1 ? '' : 's'}.`);
    } catch {
      say('That file is not a Daybook backup.');
    } finally {
      setBusy(false);
    }
  };
  const save = async (kind: 'days' | 'events' | 'json') => {
    const name = kind === 'days' ? 'daybook-days.csv' : kind === 'events' ? 'daybook-entries.csv' : 'daybook-backup.json';
    const data = kind === 'days' ? '﻿' + daysCsv(snap.days, st, tk) : kind === 'events' ? '﻿' + eventsCsv(snap.days, st) : JSON.stringify(makeBackup(snap), null, 1);
    try {
      await saveBackupFile(name, data, kind === 'json' ? 'application/json' : 'text/csv');
      say('Saved ' + name);
    } catch {
      say('Could not save ' + name + '.');
    }
  };
  const pin = st.urPin ? urTool(st.urPin) : null;
  const so = fmtClock(st.screensOff);
  const [h, m] = st.screensOff.split(':').map(Number);
  const wind = minToClock((h * 60 + m - 60 + 1440) % 1440);
  const unsynced = Object.keys(dirty).length;

  return (
    <Screen title="Settings" sub={<T tone="muted">Make Daybook yours. Changes save as you type.</T>} back="More">
      <View style={{ gap: 8 }}>
        <LinkCard icon="shield" title="My plan" sub="My goal, my safe person, and my lists" onPress={() => router.push('/plan')} />
        <LinkCard icon="sparkle" title="How Daybook works" sub="Walk through the setup again and update your goals" onPress={() => router.push('/setup')} />
      </View>

      {sec(
        'routine',
        'My daily routine',
        'Turn parts of the day on or off',
        <>
          <T v="small" tone="muted">
            Switch off anything that does not fit your life right now. It leaves Today and stops counting toward your ring. If you do it anyway, it still counts. You can also skip
            things for a single day from Today.
          </T>
          {ROUTINE.map((x) => (
            <OnOff key={x.k} name={x.name} sub={x.sub} on={!!st.routine[x.k]} onPick={(on) => apply({ st: setRoutine(st, x.k, on) })} />
          ))}
          <T v="small" tone="muted">
            <B>Check-in.</B> Skipping it never costs you a day. A day counts as no-slip whenever no slip is logged, check-in or not.
          </T>
          <T v="small" tone="muted">
            <B>Reached out.</B> This one starts switched off. Turn it on whenever a text or call to a real person feels right. While it is off, a weekly quest about it is swapped
            for a different one.
          </T>
        </>,
      )}

      {sec(
        'sched',
        'Schedule',
        'Screens-off time, start date, new day',
        <>
          <Field label="Screens off by (nightly)" hint="The wind-down opens an hour before. The next morning, Daybook asks if it happened.">
            <Stepper
              label="Screens off by"
              text={so}
              unset={false}
              less="15 minutes earlier"
              more="15 minutes later"
              onStep={(d) =>
                apply({
                  st: setScreensOffTime(st, stepClock(st.screensOff, d * 15)),
                })
              }
            />
          </Field>
          <DateStep label="Tracking starts" value={st.start} from={tk} onPick={(k) => apply(setDate(st, 'start', k))} />
          <DateStep label="Day 1 of quitting" value={st.day1} from={st.day1 || tk} onPick={(k) => apply(setDate(st, 'day1', k))} />
          {st.day1 ? (
            <Link label="No Day 1 yet, keep tracking" onPress={() => apply(setDate(st, 'day1', null))} />
          ) : (
            <T v="small" tone="muted">
              No Day 1 is set. Pick a date above when you are ready.
            </T>
          )}
          <Link label="What tracking week, quitting and just tracking mean" onPress={() => router.push('/mode')} />
          <Field label="A new day starts at" hint="Entries before this hour count toward the day before, so a 1 AM entry stays with that night.">
            <Chips label="A new day starts at">
              {[0, 1, 2, 3, 4, 5, 6].map((x) => (
                <Chip key={x} label={x === 0 ? 'Midnight' : fmtHour(x)} on={x === st.rollover} onPress={() => apply({ st: setRollover(st, x) })} />
              ))}
            </Chips>
          </Field>
        </>,
      )}

      {sec(
        'count',
        'How I count days',
        st.cleanMode === 'gentle' ? 'Gentle: one slip or fewer' : st.cleanMode === 'step' ? 'Step down: longer stretches, fewer slips' : 'Strict: no slip logged',
        <>
          <T v="small" tone="muted">
            A day counts when no slip is logged on it. A day with nothing logged counts too. This only changes how days are counted. It never changes what you log.
          </T>
          <Field
            label="Counting"
            hint={
              <>
                <B>Strict:</B> a day counts with no slip. <B>Gentle:</B> a day counts with one slip or fewer. In both, the first slip in any 7 days can be saved: finish the
                Rekindle quest by the next night and your run keeps going.{'\n\n'}
                <B>Step down:</B> for when slips happen most days. Instead of a run you lose every day or two, you aim for longer stretches between slips and fewer slips each week.
                When your stretch passes a week, or a week has one slip or none, Daybook offers to start counting days.
              </>
            }>
            <Chips label="Counting">
              <Chip label="Strict" on={st.cleanMode === 'strict'} onPress={() => apply(setCountMode(st, 'strict', tk))} />
              <Chip label="Gentle" on={st.cleanMode === 'gentle'} onPress={() => apply(setCountMode(st, 'gentle', tk))} />
              <Chip label="Step down" on={st.cleanMode === 'step'} onPress={() => apply(setCountMode(st, 'step', tk))} />
            </Chips>
          </Field>
          <Field label="Rough stretches" hint="If slips land on most days of a week, Daybook switches to step down by itself and tells you. It never switches back unless you do.">
            <Chips label="Rough stretches">
              <Chip label="Switch for me" on={st.cleanAuto !== false} onPress={() => apply(setCleanAuto(st, true))} />
              <Chip label="Leave it" on={st.cleanAuto === false} onPress={() => apply(setCleanAuto(st, false))} />
            </Chips>
          </Field>
        </>,
      )}

      {sec(
        'look',
        'Look and feel',
        'Theme, celebrations',
        <>
          <Field label="Theme" hint="Auto follows your phone.">
            <Chips label="Theme">
              {(
                [
                  ['auto', 'Auto'],
                  ['light', 'Light'],
                  ['dark', 'Dark'],
                ] as [ThemePref, string][]
              ).map(([v, l]) => (
                <Chip key={v} label={l} on={theme === v} onPress={() => setThemePref(v)} />
              ))}
            </Chips>
          </Field>
          <Field
            label="Celebrations"
            hint="Confetti and pop-ups for level-ups and badges. Off gives a quiet message instead. If your phone is set to reduce motion, the movement is already off.">
            <Chips label="Celebrations">
              <Chip label="On" on={st.celebrate} onPress={() => apply({ st: setCelebrate(st, true) })} />
              <Chip label="Off" on={!st.celebrate} onPress={() => apply({ st: setCelebrate(st, false) })} />
            </Chips>
          </Field>
          <Button
            kind="ghost"
            icon="sparkle"
            label="Preview a celebration"
            onPress={() =>
              hooks.current.onCelebrate?.([
                {
                  type: 'level',
                  level: gameCompute(snap.days, st, snap.reviews, tk).level,
                  from: 0,
                  evolve: false,
                },
              ])
            }
          />
        </>,
      )}

      {sec(
        'sos',
        'SOS',
        'Go-to tool, sound',
        <>
          <Field
            label="SOS suggests first"
            hint={
              pin ? 'SOS puts ' + pin.name + ' first every time. It still keeps track of what helps.' : 'SOS learns which tools help you, and picks the best fit for the moment.'
            }>
            <Chips label="SOS suggests first">
              <Chip label="The best fit for the moment" on={!st.urPin} onPress={() => apply({ st: setUrPin(st, null) })} />
              {TOOLS.map((x) => (
                <Chip key={x.id} label={x.name} on={st.urPin === x.id} onPress={() => apply({ st: setUrPin(st, x.id) })} />
              ))}
            </Chips>
          </Field>
          <Field label="Sound guide" hint="A soft tone on each breath, and a chime when a timer ends. Saved on this device.">
            <Chips label="Sound guide">
              <Chip
                label="On"
                on={sound}
                onPress={() => {
                  setSoundPref(true);
                  play('on', true);
                }}
              />
              <Chip label="Off" on={!sound} onPress={() => setSoundPref(false)} />
            </Chips>
          </Field>
        </>,
      )}

      {sec(
        'remind',
        'Reminders',
        'Phone alarms that keep the rhythm',
        <>
          <T>Reminders from Daybook itself are coming in a later update. Until then, phone alarms are the reliable way. Three are enough:</T>
          <T>
            • <B>When I wake up:</B> “Last night's questions.” Two taps.
          </T>
          <T>
            • <B>{minToClock(18 * 60)}:</B> “Check in.” Under a minute.
          </T>
          <T>
            • <B>{wind}:</B> “Wind down.” One hour before screens-off at {so}.
          </T>
          <T v="small" tone="muted">
            Use your clock app. Name each alarm the way it is written above.
          </T>
        </>,
      )}

      {sec(
        'data',
        'Save, back up, delete',
        'Spreadsheet and backup files',
        <>
          <T v="small" tone="muted">
            Your log is saved on this device only. Save a backup now and then so you can restore it.
          </T>
          <Button kind="ghost" label="Save days as a spreadsheet (CSV)" onPress={() => save('days')} />
          <Button kind="ghost" label="Save every entry with its time (CSV)" onPress={() => save('events')} />
          <Button kind="ghost" label="Save a full backup (JSON)" onPress={() => save('json')} />
          <Button kind="ghost" label="Restore from a backup…" onPress={restore} disabled={busy} />
          {wipe ? (
            <View style={{ gap: 8 }}>
              <T v="label" tone="danger">
                Delete every entry, check-in and setting? This cannot be undone.
              </T>
              <Chips>
                <Button
                  kind="danger"
                  label="Yes, delete everything"
                  onPress={async () => {
                    await erase();
                    await sos.forget();
                    await forgetDrafts();
                    setWipe(false);
                    say('Everything was deleted.');
                    router.replace('/');
                  }}
                />
                <Button kind="ghost" label="Keep my log" onPress={() => setWipe(false)} />
              </Chips>
            </View>
          ) : (
            <Button kind="ghost" icon="trash" label="Delete everything…" onPress={() => setWipe(true)} />
          )}
        </>,
      )}

      <T v="small" tone="muted" style={{ textAlign: 'center' }}>
        Daybook is a self-tracking tool. It is not medical care.
      </T>
      <T v="small" tone="muted" style={{ textAlign: 'center' }}>
        Daybook {Constants.expoConfig?.version ?? ''}
        {unsynced ? ` · ${unsynced} change${unsynced === 1 ? '' : 's'} not synced yet` : ''}
      </T>
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
