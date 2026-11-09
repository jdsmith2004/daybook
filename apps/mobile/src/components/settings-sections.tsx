/* Every setting, as short grouped lists by what the person came to do (the owner, November 9, 2026: "long and chaotic"; docs/plan.md,
   "Settings, rebuilt"). Each row says how that part stands now and opens the part's own page (app/settings/[part].tsx). The More tab
   and the Settings page both show the list. Ported from the legacy viewSettings. */
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
  ROUTINE_SHOWN,
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
  lessonAt,
  lessonLast,
  OB_CREED,
  setFaith,
  PULL_LONG,
  PULL_OPEN,
  PULL_WAIT,
  riskWindow,
  type PullPrefs,
  setHabit,
  habitOf,
  HABIT_NAME,
  habitMedical,
  OB_HABIT,
  PULL_NAME,
  pullLine,
} from '@daybook/core';
import Constants from 'expo-constants';
import { Redirect, router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OwnAnswers } from '@/components/own-answers';
import { Link } from '@/components/choices';
import { DateStep } from '@/components/date-step';
import { SYNC_NEED_SHORT } from '@/components/support';
import { STORAGE_LINE } from '@/components/home-screen';
import { OnOff, Stepper } from '@/components/form';
import { Screen } from '@/components/screen';
import { confirmUnlock, lockOffered } from '@/components/lock';
import { SyncBody } from '@/components/sync-card';
import { B } from '@/components/help-bits';
import { LinkCard, Rows } from '@/components/link-card';
import { Button, Chip, Icon, T } from '@/components/ui';
import { pickBackupText, saveBackupFile } from '@/lib/backup';
import { useNotes } from '@/lib/notes';
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
  useNudgeLog,
  useReminderPrefs,
  useSoundPref,
  useThemePref,
  type ReminderPrefs,
  type ThemePref,
  REVIEW_AT,
} from '@/lib/prefs';
import { useNotifyEnv } from '@/lib/notify-env';
import { allowReminders, exactAlarmsAsk, exactAlarmsOk, remindersOffered } from '@/lib/reminders';
import { Pull, PULL_DENIED, pullOffered, pullStart, pullStop, setPullPrefs, usePullPrefs } from '@/lib/pull';
import { connectHealth, forgetHealth, healthOffered, useNights } from '@/lib/health';
import { play } from '@/lib/sound';
import { useSos } from '@/lib/sos';
import { useSync } from '@/lib/sync';
import { SAVE_FAILED, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { restoredWords, WORDS } from '@/lib/words';
import { dropVoice, voiceOk } from '@/lib/voice';

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
/** a plain line that does something, inside a row that opened: a save, a restore, a delete */
function Act({ label, onPress, disabled, danger, icon }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean; icon?: string }) {
  const c = useTheme();
  const ink = danger ? c.danger : c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.act, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}>
      {icon ? <Icon name={icon} size={18} color={ink} /> : null}
      <T v="label" style={{ color: ink }}>
        {label}
      </T>
    </Pressable>
  );
}
const Chips = ({ children, label }: { children: ReactNode; label?: string }) => (
  <View style={s.chips} accessibilityLabel={label}>
    {children}
  </View>
);

/* the words for each way of counting: only the one chosen shows */
const COUNT_HOW = {
  strict: (
    <>
      <B>Strict:</B> a day counts when no slip is logged. The number is your days in a row. A slip puts it to 0, and it climbs again from the next day. Every
      day you earned stays on your record.
    </>
  ),
  gentle: (
    <>
      <B>Gentle:</B> the number is the days that hold, in your last week or on the way to graduation. A slip takes one day off, never all of them.
    </>
  ),
  step: (
    <>
      <B>Step down:</B> for when slips happen most days. The number is the hours since your last slip, with your best stretch beside it, and you aim for longer
      stretches and fewer slips each week. When your stretch passes a week, or a week has one slip or none, you are ready to count days, and Daybook moves you
      there (or offers to, when switching is left to you).
    </>
  ),
};

/** each part of Settings: its own page (app/settings/[part].tsx), one row on the list */
export type PartId =
  | 'routine'
  | 'bed'
  | 'remind'
  | 'habit'
  | 'count'
  | 'faith'
  | 'answers'
  | 'sos'
  | 'pull'
  | 'look'
  | 'lock'
  | 'health'
  | 'notes'
  | 'sync'
  | 'copy'
  | 'wipe';
/** the ids links used before the redesign (November 9, 2026), so an old link still opens the right page */
const OLD: Record<string, PartId> = { sched: 'bed', data: 'copy' };
export function partOf(asked?: string): PartId | null {
  const k = (asked || '').replace(/^s-/, '');
  const id = OLD[k] || k;
  return (GROUPS.some(([, ids]) => ids.includes(id as PartId)) ? id : null) as PartId | null;
}

/** the list, grouped by what the person came to do */
const GROUPS: [string, PartId[]][] = [
  ['Your days', ['routine', 'bed', 'remind']],
  ['Your quit', ['habit', 'count', 'faith', 'answers']],
  ['When it hits', ['sos', 'pull']],
  ['This phone', ['look', 'lock', 'health', 'notes']],
  ['Your log', ['sync', 'copy', 'wipe']],
];

interface Part {
  icon: string;
  title: string;
  /** how it stands now, in a few words */
  sub: string;
  body?: ReactNode;
  /** a part that lives on a page of its own elsewhere */
  go?: () => void;
  danger?: boolean;
}

/** "Lesson, check-in and wind-down" */
const andList = (xs: string[]) => (xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]);

/** every part, with what it shows now; a part this phone does not offer is null */
function useParts(): Partial<Record<PartId, Part | null>> | null {
  const { snap, tk, now, apply, replace, erase, say, hooks, current } = useStore();
  const notes = useNotes();
  const sos = useSos();
  const sync = useSync();
  const signedIn = sync.status.k !== 'off' && sync.status.k !== 'out';
  const theme = useThemePref();
  const sound = useSoundPref();
  const rem = useReminderPrefs();
  const nlog = useNudgeLog();
  const notifyEnv = useNotifyEnv();
  const notifyMem = useNotifyMem();
  /* Android: whether notes can come at their exact time (the heads-up before hard hours needs it) */
  const [exact, setExact] = useState(true);
  useEffect(() => {
    exactAlarmsOk().then(setExact, () => undefined);
  }, []);
  const lock = useLockPref();
  const pull = usePullPrefs();
  const health = useNights();
  const nightsN = Object.keys(health.nights).length;
  const [busy, setBusy] = useState(false);
  const st = snap.settings;
  if (!st) return null;
  /* turning a reminder on asks the phone for permission first */
  const setRem = async (patch: Partial<ReminderPrefs>) => {
    const turningOn = Object.entries(patch).some(
      ([k, v]) => v === true && (k === 'lesson' || k === 'checkin' || k === 'wind' || k === 'risk' || k === 'review'),
    );
    if (turningOn && !(await allowReminders())) {
      say(WORDS.notifyOff);
      return;
    }
    setReminderPrefs({ ...rem, ...patch });
    /* a reminder turned on again starts fresh, every day (core nudges.ts) */
    for (const k of NUDGE_LEARNED) if (patch[NUDGE_PREF[k]] === true) setNudgeLog((l) => nudgeResume(l, k));
  };

  const restore = async () => {
    setBusy(true);
    try {
      const text = await pickBackupText();
      if (text == null) return;
      let b;
      try {
        b = readBackup(text);
      } catch {
        say(WORDS.notBackup);
        return;
      }
      const { snap: next, restored } = restoreBackup(current().snap, b);
      await replace(
        next,
        toRecords(next).map((r) => r.id as RecordId),
      );
      say(restoredWords(restored));
    } catch {
      say(SAVE_FAILED);
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
      say('Could not save ' + name + '. Check there is room on the phone, then try again.');
    }
  };
  const pin = st.urPin ? urTool(st.urPin) : null;
  const so = fmtClock(st.screensOff);
  const [h, m] = st.screensOff.split(':').map(Number);
  const wind = minToClock((h * 60 + m - 60 + 1440) % 1440);
  /* the lesson reminder's time is not set by hand: it follows the last lesson (core lessonAt) */
  const la = lessonAt(snap.days, nlog, tk, now);
  const lessonSub =
    'Once a day, around ' +
    fmtClock(la.at) +
    (la.from === 'last' ? ', about when you did your last one.' : ', when you usually open Daybook.') +
    ' Never once today’s is done.';
  /* the hard hours the log has found, for Screen Time */
  const hw = riskWindow(snap.days, st, tk);
  const pullHard = hw ? (hw.scope === 'weekdays' ? 'Weekdays, ' : hw.scope === 'weekends' ? 'Weekends, ' : 'Every day, ') + hw.label : null;

  const ownN = st.opts.trig.filter((o) => !o.off).length + st.opts.did.filter((o) => !o.off).length;
  const routineOn = ROUTINE_SHOWN.filter((x: { k: string }) => st.routine[x.k]).length;
  const fa = (st.onb && st.onb.a && (st.onb.a.faith as string)) || '';
  const cr = (st.onb && st.onb.a && (st.onb.a.creed as string)) || '';
  const themeWord = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto';
  const remOn = [rem.lesson && 'lesson', rem.checkin && 'check-in', rem.wind && 'wind-down', rem.review && 'Sunday review', rem.risk && 'heads-ups'].filter(
    Boolean,
  ) as string[];
  const remLine = remOn.length ? andList(remOn) : 'Off';
  const wipeWhat = `every entry, check-in${voiceOk ? ', setting and voice note' : ' and setting'}`;

  return {
    routine: {
      icon: 'check',
      title: 'Daily routine',
      sub: routineOn + ' of ' + ROUTINE_SHOWN.length + ' parts on Today',
      body: (
        <>
          <T v="small" tone="muted">
            A part switched off leaves Today, and still earns its points if you do it. To skip one for a single day, do that from Today.
          </T>
          <View>
            {ROUTINE_SHOWN.map((x) => (
              <OnOff key={x.k} name={x.name} sub={x.sub} on={!!st.routine[x.k]} onPick={(on) => apply({ st: setRoutine(st, x.k, on) })} />
            ))}
          </View>
          <T v="small" tone="muted">
            <B>Check-in.</B> Skipping it never costs you a day.
          </T>
          <T v="small" tone="muted">
            <B>Reached out.</B> It starts switched off. Turn it on whenever a text or call to a real person feels right.
          </T>
        </>
      ),
    },

    bed: {
      icon: 'moon',
      title: 'Bedtime',
      sub: 'Screens off at ' + so + ' · a new day at ' + (st.rollover === 0 ? 'midnight' : fmtHour(st.rollover)),
      body: (
        <>
          <Field label="Screens off" hint="The wind-down opens an hour before. Tapping Good night before then counts as screens off on time.">
            <Stepper
              label="Each night by"
              text={so}
              unset={false}
              less="15 minutes earlier"
              more="15 minutes later"
              onStep={(d) => apply({ st: setScreensOffTime(st, stepClock(st.screensOff, d * 15)) })}
            />
          </Field>
          <Field label="A new day starts at" hint="Entries before this hour count toward the day before, so a 1 AM entry stays with that night.">
            <Chips label="A new day starts at">
              {[0, 1, 2, 3, 4, 5, 6].map((x) => (
                <Chip key={x} label={x === 0 ? 'Midnight' : fmtHour(x)} on={x === st.rollover} onPress={() => apply({ st: setRollover(st, x) })} />
              ))}
            </Chips>
          </Field>
        </>
      ),
    },

    remind: {
      icon: 'timer',
      title: 'Reminders',
      sub: remindersOffered ? remLine : 'Phone alarms that keep the rhythm',
      body: remindersOffered ? (
        <>
          <T v="small" tone="muted">
            Up to three a day, and none about something you already did. The words never say what Daybook is for, because a reminder can show on a locked
            screen. One that stops helping goes quiet, and Today says so.
          </T>
          <View>
            <OnOff name="Today’s lesson" sub={lessonSub} on={rem.lesson} onPick={(on) => setRem({ lesson: on })} />
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
              sub="A nudge 90 minutes before a time of day that is often hard, to talk it through. A plan you made for next time comes back at its hour."
              on={rem.risk}
              onPick={(on) => setRem({ risk: on })}
            />
            <OnOff
              name="If you are away for a while"
              sub="A few short notes that Daybook is still here, over a month. Then it stays quiet until you open it."
              on={rem.back !== false}
              onPick={(on) => setRem({ back: on })}
            />
          </View>
          {rem.risk && !exact ? (
            <Field label="Exact times" hint="Without it, this phone may send the heads-up up to an hour late. It opens the phone’s page to allow it.">
              <Link label="Allow exact times" onPress={() => exactAlarmsAsk().then(setExact, () => undefined)} />
            </Field>
          ) : null}
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
          <T>A web page cannot remind you once it is closed, so phone alarms are the reliable way. The lesson matters most; the others help if you like:</T>
          <T>
            • <B>{fmtClock(lessonLast(snap.days, tk) || '12:00')}:</B> “Lesson.” A few minutes, once a day.
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
    },

    /* what the person is quitting (core habit.ts): the words and the lessons follow it; nothing earned changes */
    habit: st.onb
      ? {
          icon: 'flame',
          title: 'What I am quitting',
          sub: HABIT_NAME[habitOf(st)],
          body: (
            <>
              <Field
                label="What do you want to quit?"
                hint="Lessons written for porn stay out for another habit. Everything you finished, earned and logged stays.">
                <Chips label="What I am quitting">
                  {OB_HABIT.map(([v, l]) => (
                    <Chip key={v} label={l} on={habitOf(st) === v} onPress={() => apply({ st: setHabit(st, v) })} />
                  ))}
                </Chips>
              </Field>
              {habitMedical(habitOf(st)) ? (
                <T v="small" tone="muted">
                  {habitMedical(habitOf(st))}
                </T>
              ) : null}
            </>
          ),
        }
      : null,

    count: {
      icon: 'flag',
      title: 'Counting days',
      sub:
        st.cleanMode === 'gentle'
          ? 'Gentle · a slip takes one day off'
          : st.cleanMode === 'step'
            ? 'Step down · longer stretches between slips'
            : 'Strict · days in a row with no slip',
      body: (
        <>
          <T v="small" tone="muted">
            A day counts when no slip is logged on it. After two days in a row with Daybook not opened, the days after wait until you say how they went. They
            never take anything away. This only changes how days are counted, never what you log.
          </T>
          <Field
            label="Counting"
            hint={
              <>
                {COUNT_HOW[st.cleanMode === 'gentle' ? 'gentle' : st.cleanMode === 'step' ? 'step' : 'strict']}
                {'\n\n'}
                Graduation is the same in all three: 90 days with no slip within 100. Your points, level, badges, longest run and comebacks stay when you
                switch.
              </>
            }>
            <Chips label="Counting">
              <Chip label="Gentle" on={st.cleanMode === 'gentle'} onPress={() => apply(setCountMode(st, 'gentle', tk))} />
              <Chip label="Strict" on={st.cleanMode === 'strict'} onPress={() => apply(setCountMode(st, 'strict', tk))} />
              <Chip label="Step down" on={st.cleanMode === 'step'} onPress={() => apply(setCountMode(st, 'step', tk))} />
            </Chips>
          </Field>
          <Field label="Switching" hint="Daybook moves you between step down and counting days as your log changes, and tells you when it does.">
            <Chips label="Switching">
              <Chip label="Switch for me" on={st.cleanAuto !== false} onPress={() => apply(setCleanAuto(st, true))} />
              <Chip label="Leave it" on={st.cleanAuto === false} onPress={() => apply(setCleanAuto(st, false))} />
            </Chips>
          </Field>
          <View style={{ gap: 12 }}>
            <DateStep label="Day 1 of quitting" value={st.day1} from={st.day1 || tk} onPick={(k) => apply(setDate(st, 'day1', k))} />
            {st.day1 ? (
              <Link label="No Day 1 yet, keep tracking" onPress={() => apply(setDate(st, 'day1', null))} />
            ) : (
              <T v="small" tone="muted">
                No Day 1 is set. Pick a date above when you are ready.
              </T>
            )}
            <DateStep label="Tracking starts" value={st.start} from={tk} onPick={(k) => apply(setDate(st, 'start', k))} />
            <Link label="What tracking week, quitting and just tracking mean" onPress={() => router.push('/mode')} />
          </View>
        </>
      ),
    },

    /* the setup's faith answers (core faith.ts): whether lessons speak of God, and in which faith's words */
    faith: st.onb
      ? {
          icon: 'star',
          title: 'Faith in the lessons',
          sub: fa === 'no' ? 'Off' : (OB_CREED.find((x) => x[0] === cr) || [null, 'On'])[1],
          body: (
            <>
              <Field label="Does faith play a part in this for you?" hint="Yes or Somewhat adds lessons that speak of God. Every tool stays the same.">
                <Chips label="Faith">
                  {(
                    [
                      ['big', 'Yes'],
                      ['some', 'Somewhat'],
                      ['no', 'No'],
                    ] as ['big' | 'some' | 'no', string][]
                  ).map(([v, l]) => (
                    <Chip key={v} label={l} on={fa === v} onPress={() => apply({ st: setFaith(st, v) })} />
                  ))}
                </Chips>
              </Field>
              {fa === 'no' ? null : (
                <Field label="Which faith is yours?" hint="The lessons that speak of God use its words.">
                  <Chips label="Which faith">
                    {OB_CREED.map(([v, l]) => (
                      <Chip key={v} label={l} on={cr === v} onPress={() => apply({ st: setFaith(st, fa === 'some' ? 'some' : 'big', v) })} />
                    ))}
                  </Chips>
                </Field>
              )}
            </>
          ),
        }
      : null,

    answers: {
      icon: 'pencil',
      title: 'Check-in answers',
      sub: ownN ? ownN + ' you added' : 'None added yet',
      body: <OwnAnswers />,
    },

    sos: {
      icon: 'life',
      title: 'SOS',
      sub: (pin ? pin.name + ' first' : 'The best fit first') + ' · breath sound ' + (sound ? 'on' : 'off'),
      body: (
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
          <Field label="Breath sound" hint="A soft tone on each breath, and a chime when a timer ends. Saved on this device.">
            <Chips label="Breath sound">
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
        </>
      ),
    },

    pull: pullOffered ? { icon: 'phone', title: PULL_NAME, sub: pullLine(pull), body: <PullBody pull={pull} hard={pullHard} say={say} /> } : null,

    look: {
      icon: 'sparkle',
      title: 'Appearance',
      sub: themeWord + ' theme · celebrations ' + (st.celebrate ? 'on' : 'off'),
      body: (
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
          <Act
            label="Preview a celebration"
            onPress={() => hooks.current.onCelebrate?.([{ type: 'level', level: gameCompute(snap.days, st, snap.reviews, tk).level, from: 0, evolve: false }])}
          />
        </>
      ),
    },

    lock: lockOffered
      ? {
          icon: 'lock',
          title: 'App lock',
          sub: lock ? 'On · Face ID or passcode to open' : 'Off',
          body: (
            <>
              <T v="small" tone="muted">
                Face ID, Touch ID or your phone’s passcode when Daybook opens, and again after a minute away. In the app switcher, your log is covered.
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
            </>
          ),
        }
      : null,

    health: healthOffered()
      ? {
          icon: 'heart',
          title: 'Apple Health',
          sub: health.on ? (nightsN ? 'Reading sleep · ' + nightsN + (nightsN === 1 ? ' night' : ' nights') : 'Reading sleep · no nights yet') : 'Off',
          body: (
            <>
              <T v="small" tone="muted">
                Daybook reads how long you slept, from your watch or ring, so the check-in does not have to ask and Pattern can show how your nights and your
                hard days line up. Only sleep. It stays on this phone: never synced, backed up or sent.
              </T>
              {health.on && !nightsN ? (
                <T v="small" tone="muted">
                  No nights yet. If you sleep with a watch or a ring, check in the Health app that Daybook can read Sleep.
                </T>
              ) : null}
              <OnOff
                name="Read my sleep"
                on={health.on}
                onPick={async (on) => {
                  if (on === health.on) return;
                  if (on) {
                    if (!(await connectHealth(st.rollover))) say('Apple Health did not open. Try again in a moment.');
                  } else {
                    await forgetHealth();
                    say('Daybook stopped reading your sleep and forgot the nights it had.');
                  }
                }}
              />
            </>
          ),
        }
      : null,

    notes: notes.can
      ? {
          icon: 'pencil',
          title: 'Obsidian',
          sub: notes.on ? 'Syncing your journal with ' + notes.name : 'Off · sync your journal with your vault',
          go: () => router.push('/notes'),
        }
      : null,

    sync:
      sync.status.k === 'off'
        ? null
        : {
            icon: 'up',
            title: 'Sync between devices',
            sub: signedIn
              ? sync.status.k === 'expired'
                ? 'Sign in again to keep syncing'
                : sync.status.k === 'error'
                  ? 'Not syncing right now · your log is safe here'
                  : sync.status.k === 'need'
                    ? SYNC_NEED_SHORT
                    : 'On' + (sync.email ? ' · ' + sync.email : '')
              : 'Off · your log stays on this device',
            body: <SyncBody />,
          },

    copy: {
      icon: 'copy',
      title: BACKUP_FILES ? 'Save or restore a copy' : 'Save a copy',
      sub: BACKUP_FILES ? 'A spreadsheet, or a backup file' : 'Your log as a spreadsheet',
      body: (
        <>
          <T v="small" tone="muted">
            {signedIn && sync.status.k !== 'need'
              ? 'Your log is saved on this device and in your account.'
              : 'Your log is saved on this device only. Supporters with an account get a safe copy.' + (STORAGE_LINE ? ' ' + STORAGE_LINE : '')}
          </T>
          <View>
            <Act label="Save days as a spreadsheet (CSV)" onPress={() => save('days')} />
            <Act label="Save every entry with its time (CSV)" onPress={() => save('events')} />
            {BACKUP_FILES ? (
              <>
                <Act label="Save a full backup (JSON)" onPress={() => save('json')} />
                <Act label="Restore from a backup…" onPress={restore} disabled={busy} />
              </>
            ) : null}
          </View>
        </>
      ),
    },

    wipe: {
      icon: 'trash',
      title: 'Delete everything',
      sub: signedIn ? 'On this device and in your account' : 'Every entry and setting on this device',
      danger: true,
      body: (
        <>
          <T v="label">{signedIn ? `Delete ${wipeWhat}, on this device and in your account?` : `Delete ${wipeWhat}?`}</T>
          <T v="small" tone="muted">
            {signedIn
              ? 'Your other devices clear it too when they next sync. Your account keeps a copy for 7 days, so it can be brought back until then.' +
                (voiceOk ? ' The voice note is only on this phone and cannot be brought back.' : '')
              : 'Your log is only on this device, so this cannot be undone.'}
          </T>
          <View style={{ gap: 8, marginTop: 8 }}>
            <Button
              kind="danger"
              label={busy ? 'Deleting…' : 'Yes, delete everything'}
              disabled={busy}
              onPress={async () => {
                setBusy(true);
                const ok = !signedIn || (await sync.eraseAccount());
                setBusy(false);
                if (!ok) {
                  say('Could not reach your account, so nothing was deleted. Check the connection and try again.');
                  return;
                }
                await erase();
                await sos.forget();
                await forgetDrafts();
                dropVoice();
                say('Everything was deleted.');
                router.replace('/');
              }}
            />
            <View style={{ alignItems: 'center' }}>
              <Link label="Keep my log" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            </View>
          </View>
        </>
      ),
    },
  };
}

/** every setting as short grouped lists, one row a part, each row saying how it stands now; a row opens the part's own page */
export function SettingsSections() {
  const c = useTheme();
  const parts = useParts();
  const { dirty } = useStore();
  const sync = useSync();
  if (!parts) return <Redirect href="/" />;
  const signedIn = sync.status.k !== 'off' && sync.status.k !== 'out';
  const unsynced = Object.keys(dirty).length;
  return (
    <>
      {GROUPS.map(([name, ids]) => {
        const shown = ids.filter((id) => parts[id]);
        if (!shown.length) return null;
        return (
          <View key={name} style={s.group}>
            <T v="label" tone="muted" accessibilityRole="header" style={s.head}>
              {name}
            </T>
            <Rows>
              {shown.map((id) => {
                const p = parts[id]!;
                return (
                  <LinkCard
                    key={id}
                    icon={p.icon}
                    title={p.title}
                    sub={p.sub}
                    ink={p.danger ? c.danger : undefined}
                    onPress={p.go || (() => router.push({ pathname: '/settings/[part]', params: { part: id } }))}
                  />
                );
              })}
            </Rows>
          </View>
        );
      })}

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

/** one part of Settings on its own page, titled with its name */
export function SettingsPart({ id }: { id: PartId }) {
  const parts = useParts();
  const { height } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  if (!parts) return <Redirect href="/" />;
  const p = parts[id];
  if (!p || !p.body) return <Redirect href="/settings" />;
  /* a short page sits low, where the thumb is: the title at the top, what is changed just above the bottom edge */
  return (
    <Screen title={p.title} back>
      <View style={[s.page, { minHeight: height - inset.top - inset.bottom - 200 }]}>{p.body}</View>
    </Screen>
  );
}
/* Screen Time (iPhone only; core pull.ts). Apple's own list picks the apps and Daybook never learns which;
   every choice here undoes at once, with no wait and no lock. */
function PullBody({ pull, hard, say }: { pull: PullPrefs; hard: string | null; say: (m: string) => void }) {
  const start = async () => {
    const r = await pullStart().catch(() => 'closed' as const);
    if (r === 'denied') say(PULL_DENIED);
    else if (r === 'closed') say('Nothing was picked, so nothing changed.');
  };
  if (!pull.on)
    return (
      <>
        <T v="small" tone="muted">
          Pick the apps that pull you in. When one has you too long, I will say so, and in your hard hours I will say it louder. Nothing about your apps leaves
          this phone.
        </T>
        <Link label="Choose the apps" onPress={start} />
      </>
    );
  const hours = (n: number) => (n === 0 ? 'Off' : n === 1 ? '1 hour' : n + ' hours');
  return (
    <>
      <Act icon="phone" label="Change the apps" onPress={() => Pull?.pick()} />
      <Field label="After long use" hint="One note a day, to today’s lesson when it is not done.">
        <Chips label="After long use">
          {PULL_LONG.map((n) => (
            <Chip key={n} role="radio" label={hours(n)} on={pull.long === n} onPress={() => setPullPrefs({ long: n })} />
          ))}
        </Chips>
      </Field>
      <OnOff
        name="In my hard hours"
        sub={hard ? hard + ': a note at 10 minutes, and at 20.' : 'Your hard hours show here once your log finds them.'}
        on={pull.hard}
        onPick={(on) => setPullPrefs({ hard: on })}
      />
      {pull.hard ? (
        <OnOff
          name="Pause it if I keep going"
          sub="After the two notes, the apps rest until your hard hours end. A short wait opens them for a few minutes."
          on={pull.pause}
          onPick={(on) => setPullPrefs({ pause: on })}
        />
      ) : null}
      {pull.hard && pull.pause ? (
        <>
          <Field label="The wait">
            <Chips label="The wait">
              {PULL_WAIT.map((n) => (
                <Chip key={n} role="radio" label={n === 60 ? '1 minute' : n + ' seconds'} on={pull.wait === n} onPress={() => setPullPrefs({ wait: n })} />
              ))}
            </Chips>
          </Field>
          <Field label="Then open for">
            <Chips label="Then open for">
              {PULL_OPEN.map((n) => (
                <Chip key={n} role="radio" label={n + ' minutes'} on={pull.open === n} onPress={() => setPullPrefs({ open: n })} />
              ))}
            </Chips>
          </Field>
        </>
      ) : null}
      <Act
        label="Lift every pause now"
        onPress={() => {
          Pull?.lift();
          say('Every pause is lifted.');
        }}
      />
      <Act label="Turn it all off" onPress={() => pullStop()} />
      <T v="small" tone="muted">
        Apple keeps the list of apps, and nothing about them leaves this phone. You can also turn this off in Settings, Screen Time.
      </T>
    </>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  group: { gap: 8, marginTop: 8 },
  head: { paddingLeft: 16 },
  page: { gap: 24, justifyContent: 'flex-end' },
  act: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
});
