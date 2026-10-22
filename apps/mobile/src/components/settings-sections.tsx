/* Every setting, as collapsible sections (the More tab and the Settings page both show them): sync, my daily routine, the
   schedule, how days are counted, look and feel, SOS, reminders, and saving, backing up and deleting. Ported from the legacy viewSettings. */
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
  setUrOff,
  setUrPin,
  stepClock,
  toRecords,
  TOOLS,
  urOffOf,
  urTool,
  type RecordId,
  NUDGE_LEARNED,
  NUDGE_PREF,
  NOTIFY_WORDS,
  notifyCanAsk,
  notifyNever,
  nudgeResume,
} from '@daybook/core';
import Constants from 'expo-constants';
import { Redirect, router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Link } from '@/components/choices';
import { DateStep } from '@/components/date-step';
import { STORAGE_LINE } from '@/components/home-screen';
import { Collapse, OnOff, Stepper } from '@/components/form';
import { confirmUnlock, lockOffered } from '@/components/lock';
import { SyncBody } from '@/components/sync-card';
import { B } from '@/components/help-bits';
import { Button, Chip, T } from '@/components/ui';
import { pickBackupText, saveBackupFile } from '@/lib/backup';
import { BACKUP_FILES } from '@/lib/backup-files';
import { forgetDrafts } from '@/lib/drafts';
import {
  setLockPref,
  setNotifyMem,
  setNudgeLog,
  setReminderPrefs,
  setSoundPref,
  setThemePref,
  useLockPref,
  useNotifyMem,
  useReminderPrefs,
  useSoundPref,
  useThemePref,
  type ReminderPrefs,
  type ThemePref,
  REVIEW_AT,
} from '@/lib/prefs';
import { useNotifyEnv } from '@/lib/notify-env';
import { allowReminders, exactAlarmsAsk, exactAlarmsOk, remindersOffered } from '@/lib/reminders';
import { play } from '@/lib/sound';
import { useSos } from '@/lib/sos';
import { useSync } from '@/lib/sync';
import { useStore } from '@/lib/store';
import { dropVoice, voiceOk } from '@/lib/voice';

type Sec = 'sync' | 'routine' | 'sched' | 'count' | 'look' | 'sos' | 'remind' | 'lock' | 'data';

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

/** every settings section, as collapsible rows. `open` opens one ("s-count"), and `onOpenLayout` tells where it is. */
export function SettingsSections({ open: asked, onOpenLayout }: { open?: string; onOpenLayout?: (y: number) => void }) {
  const { snap, tk, apply, replace, erase, say, dirty, hooks, current } = useStore();
  const sos = useSos();
  const sync = useSync();
  const signedIn = sync.status.k !== 'off' && sync.status.k !== 'out';
  const theme = useThemePref();
  const sound = useSoundPref();
  const rem = useReminderPrefs();
  const notifyEnv = useNotifyEnv();
  const notifyMem = useNotifyMem();
  /* Android: whether notes can come at their exact time (the heads-up before hard hours needs it) */
  const [exact, setExact] = useState(true);
  useEffect(() => {
    exactAlarmsOk().then(setExact, () => undefined);
  }, []);
  const lock = useLockPref();
  /* turning a reminder on asks the phone for permission first */
  const setRem = async (patch: Partial<ReminderPrefs>) => {
    const turningOn = Object.entries(patch).some(
      ([k, v]) => v === true && (k === 'morning' || k === 'checkin' || k === 'wind' || k === 'risk' || k === 'review'),
    );
    if (turningOn && !(await allowReminders())) {
      say('Notifications are off for Daybook. Turn them on in your phone’s settings, then try again.');
      return;
    }
    setReminderPrefs({ ...rem, ...patch });
    /* a reminder turned on again starts fresh, every day (core nudges.ts) */
    for (const k of NUDGE_LEARNED) if (patch[NUDGE_PREF[k]] === true) setNudgeLog((l) => nudgeResume(l, k));
  };
  const first = (asked || '').replace(/^s-/, '') as Sec;
  const [open, setOpen] = useState<Partial<Record<Sec, boolean>>>(first ? { [first]: true } : {});
  const [wipe, setWipe] = useState(false);
  const [busy, setBusy] = useState(false);
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const tog = (k: Sec) => () => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const sec = (k: Sec, title: string, sub: string, body: ReactNode) => (
    <View key={k} onLayout={k === first && onOpenLayout ? (e) => onOpenLayout(e.nativeEvent.layout.y) : undefined}>
      <Collapse title={title} sub={sub} open={!!open[k]} onToggle={tog(k)}>
        {body}
      </Collapse>
    </View>
  );

  const restore = async () => {
    setBusy(true);
    try {
      const text = await pickBackupText();
      if (text == null) return;
      const { snap: next, restored } = restoreBackup(current().snap, readBackup(text));
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
    const data =
      kind === 'days' ? '﻿' + daysCsv(snap.days, st, tk) : kind === 'events' ? '﻿' + eventsCsv(snap.days, st) : JSON.stringify(makeBackup(snap), null, 1);
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
    <>
      {sync.status.k === 'off'
        ? null
        : sec(
            'sync',
            'Sync between devices',
            signedIn
              ? sync.status.k === 'expired'
                ? 'Sign in again to keep syncing'
                : 'On' + (sync.email ? ' · ' + sync.email : '')
              : 'Off · your log stays on this device',
            <SyncBody />,
          )}

      {sec(
        'routine',
        'My daily routine',
        'Turn parts of the day on or off',
        <>
          <T v="small" tone="muted">
            Switch off anything that does not fit your life right now. It leaves Today. If you do it anyway, it still earns its points. You can also skip things
            for a single day from Today.
          </T>
          {ROUTINE.map((x) => (
            <OnOff key={x.k} name={x.name} sub={x.sub} on={!!st.routine[x.k]} onPick={(on) => apply({ st: setRoutine(st, x.k, on) })} />
          ))}
          <T v="small" tone="muted">
            <B>Check-in.</B> Skipping it never costs you a day. A day counts as no-slip whenever no slip is logged, check-in or not.
          </T>
          <T v="small" tone="muted">
            <B>Reached out.</B> This one starts switched off. Turn it on whenever a text or call to a real person feels right.
          </T>
        </>,
      )}

      {sec(
        'sched',
        'Schedule',
        'Screens-off time, start date, new day',
        <>
          <Field label="Screens off" hint="The wind-down opens an hour before. The next morning, Daybook asks if it happened.">
            <Stepper
              label="Each night by"
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
        st.cleanMode === 'gentle'
          ? 'Gentle: one slip or fewer'
          : st.cleanMode === 'step'
            ? 'Step down: longer stretches, fewer slips'
            : 'Strict: no slip logged',
        <>
          <T v="small" tone="muted">
            A day counts when no slip is logged on it. A day with nothing logged counts too, as long as you are around: after two days in a row with Daybook not
            opened, the days after are not known. They do not count, and they never take anything away. When you come back, Daybook asks how they went. This
            only changes how days are counted. It never changes what you log.
          </T>
          <Field
            label="Counting"
            hint={
              <>
                <B>Strict:</B> a day counts with no slip. <B>Gentle:</B> a day counts with one slip or fewer. In both, the first slip in any 7 days can be
                saved: finish the Rekindle quest within three days and your run keeps going.{'\n\n'}
                <B>Step down:</B> for when slips happen most days. Instead of a run you lose every day or two, you aim for longer stretches between slips and
                fewer slips each week. When your stretch passes a week, or a week has one slip or none, you are ready to count days, and Daybook moves you there
                (or offers to, when switching is left to you).
              </>
            }>
            <Chips label="Counting">
              <Chip label="Strict" on={st.cleanMode === 'strict'} onPress={() => apply(setCountMode(st, 'strict', tk))} />
              <Chip label="Gentle" on={st.cleanMode === 'gentle'} onPress={() => apply(setCountMode(st, 'gentle', tk))} />
              <Chip label="Step down" on={st.cleanMode === 'step'} onPress={() => apply(setCountMode(st, 'step', tk))} />
            </Chips>
          </Field>
          <Field label="Switching" hint="Daybook moves you between step down and counting days as your log changes, and tells you when it does.">
            <Chips label="Switching">
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
        'Go-to tool, suggestions, sound',
        <>
          <Field
            label="SOS suggests first"
            hint={
              pin
                ? 'SOS puts ' + pin.name + ' first every time. It still keeps track of what helps.'
                : 'SOS learns which tools help you, and picks the best fit for the moment.'
            }>
            <Chips label="SOS suggests first">
              <Chip label="The best fit for the moment" on={!st.urPin} onPress={() => apply({ st: setUrPin(st, null) })} />
              {TOOLS.map((x) => (
                <Chip key={x.id} label={x.name} on={st.urPin === x.id} onPress={() => apply({ st: setUrPin(st, x.id) })} />
              ))}
            </Chips>
          </Field>
          {urOffOf(st).length ? (
            <Field label="Not suggested" hint="You said Not for me to these. They stay in the SOS list. Tap one to have it suggested again.">
              <Chips label="Not suggested">
                {urOffOf(st).map((id) => (
                  <Chip key={id} label={urTool(id)!.name + ' ×'} on onPress={() => apply({ st: setUrOff(st, id, false) })} />
                ))}
              </Chips>
            </Field>
          ) : null}
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
        remindersOffered
          ? (rem.morning || rem.checkin || rem.wind ? 'On' : 'Off') + ' · a gentle nudge at the right times'
          : 'Phone alarms that keep the rhythm',
        remindersOffered ? (
          <>
            <T v="small" tone="muted">
              Up to three a day, and none about something you already did. They are made on this phone, and the words never say what Daybook is for, because a
              reminder can show on a locked screen. One that stops helping goes quiet, and Today says so.
            </T>
            <OnOff name="Last night’s questions" sub={'Each morning at ' + fmtClock(rem.morningAt)} on={rem.morning} onPick={(on) => setRem({ morning: on })} />
            {rem.morning ? (
              <Stepper
                label="Morning reminder"
                text={fmtClock(rem.morningAt)}
                unset={false}
                less="15 minutes earlier"
                more="15 minutes later"
                onStep={(d) => setRem({ morningAt: stepClock(rem.morningAt, d * 15) })}
              />
            ) : null}
            <OnOff name="Check in" sub={'Each evening at ' + fmtClock(rem.checkinAt)} on={rem.checkin} onPick={(on) => setRem({ checkin: on })} />
            {rem.checkin ? (
              <Stepper
                label="Check-in reminder"
                text={fmtClock(rem.checkinAt)}
                unset={false}
                less="15 minutes earlier"
                more="15 minutes later"
                onStep={(d) => setRem({ checkinAt: stepClock(rem.checkinAt, d * 15) })}
              />
            ) : null}
            <OnOff name="Wind down" sub={'At ' + wind + ', an hour before screens-off at ' + so} on={rem.wind} onPick={(on) => setRem({ wind: on })} />
            <OnOff
              name="Sunday review"
              sub={'Sundays at ' + fmtClock(REVIEW_AT) + ': two minutes to look back on the week and pick one small goal'}
              on={rem.review}
              onPick={(on) => setRem({ review: on })}
            />
            <OnOff
              name="Heads-up before hard hours"
              sub="When your log shows a time of day that is often hard, a nudge 90 minutes before, to talk it through"
              on={rem.risk}
              onPick={(on) => setRem({ risk: on })}
            />
            {rem.risk && !exact ? (
              <Field label="Exact times" hint="Without it, this phone may send the heads-up up to an hour late. It opens the phone’s page to allow it.">
                <Link label="Allow exact times" onPress={() => exactAlarmsAsk().then(setExact, () => undefined)} />
              </Field>
            ) : null}
            <OnOff
              name="If you are away for a while"
              sub="A few short notes that Daybook is still here, over a month. Then it stays quiet until you open it."
              on={rem.back !== false}
              onPick={(on) => setRem({ back: on })}
            />
            {notifyEnv && notifyCanAsk(notifyEnv, notifyMem) ? (
              <Field label="The ask on Today" hint="While notifications are off, a strip at the top of Today offers to turn them on.">
                <Link
                  label={NOTIFY_WORDS.never}
                  onPress={() => {
                    setNotifyMem(notifyNever);
                    say('Daybook will not ask again on this phone. Reminders can still be turned on here.');
                  }}
                />
              </Field>
            ) : null}
          </>
        ) : (
          <>
            <T>A web page cannot remind you once it is closed, so phone alarms are the reliable way. Three a day are enough, and one on Sunday:</T>
            <T>
              • <B>When I wake up:</B> “Last night's questions.” Two taps.
            </T>
            <T>
              • <B>{minToClock(18 * 60)}:</B> “Check in.” Under a minute.
            </T>
            <T>
              • <B>{wind}:</B> “Wind down.” One hour before screens-off at {so}.
            </T>
            <T>
              • <B>Sunday, {fmtClock(REVIEW_AT)}:</B> “Look back on my week.” A few minutes.
            </T>
            <T v="small" tone="muted">
              Use your clock app. Name each alarm the way it is written above. In the Daybook app on a phone, Daybook can remind you itself.
            </T>
          </>
        ),
      )}

      {lockOffered
        ? sec(
            'lock',
            'Lock',
            lock ? 'On · Face ID or passcode to open' : 'Off',
            <>
              <T v="small" tone="muted">
                Daybook asks for Face ID, Touch ID or your phone’s passcode when it opens, and again after a minute away. In the app switcher, your log is
                covered.
              </T>
              <OnOff
                name="Lock Daybook"
                on={!!lock}
                onPick={async (on) => {
                  const r = await confirmUnlock(on ? 'Turn on the lock' : 'Turn off the lock');
                  if (r.ok) setLockPref(on);
                  else if (r.why) say(r.why);
                }}
              />
            </>,
          )
        : null}

      {sec(
        'data',
        BACKUP_FILES ? 'Save, back up, delete' : 'Save or delete',
        BACKUP_FILES ? 'Spreadsheet and backup files' : 'Spreadsheets, or delete everything',
        <>
          <T v="small" tone="muted">
            {signedIn
              ? 'Your log is saved on this device and in your account.'
              : 'Your log is saved on this device only. A free account keeps a safe copy.' + (STORAGE_LINE ? ' ' + STORAGE_LINE : '')}
          </T>
          <Button kind="ghost" label="Save days as a spreadsheet (CSV)" onPress={() => save('days')} />
          <Button kind="ghost" label="Save every entry with its time (CSV)" onPress={() => save('events')} />
          {BACKUP_FILES ? (
            <>
              <Button kind="ghost" label="Save a full backup (JSON)" onPress={() => save('json')} />
              <Button kind="ghost" label="Restore from a backup…" onPress={restore} disabled={busy} />
            </>
          ) : null}
          {wipe ? (
            <View style={{ gap: 8 }}>
              <T v="label" tone="danger">
                {signedIn
                  ? `Delete every entry, check-in${voiceOk ? ', setting and voice note' : ' and setting'}, on this device and in your account? Your other devices clear it too when they next sync. This cannot be undone.`
                  : `Delete every entry, check-in${voiceOk ? ', setting and voice note' : ' and setting'}? This cannot be undone.`}
              </T>
              <Chips>
                <Button
                  kind="danger"
                  label="Yes, delete everything"
                  onPress={async () => {
                    if (signedIn && !(await sync.eraseAccount())) {
                      setWipe(false);
                      say('Could not reach your account. Nothing was deleted.');
                      return;
                    }
                    await erase();
                    await sos.forget();
                    await forgetDrafts();
                    dropVoice();
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
        {signedIn && unsynced ? ` · ${unsynced} change${unsynced === 1 ? '' : 's'} not synced yet` : ''}
      </T>
    </>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
