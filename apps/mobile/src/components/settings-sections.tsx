/* Every setting (the owner, November 9, 2026: "long and chaotic"; docs/plan.md, "Settings, rebuilt"), in the grammar of a really
   good settings page (components/settings-ui.tsx): a card at the top for where the log lives, then short groups by what the person
   came to do, each row one line with how it stands now in gray, and each row opening its own page (app/settings/[part].tsx) built
   from the same pieces. The More tab and the Settings page both show the list. Ported from the legacy viewSettings. */
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
  NIGHT_TIMES,
  PULL_LIFT,
  PULL_LONG,
  PULL_NIGHT_END,
  PULL_OPEN,
  PULL_WAIT,
  PULL_WEB_OPEN,
  pullEarly,
  pullEarlier,
  pullInNight,
  pullNightStart,
  pullQuietUntil,
  pullSettle,
  pullShown,
  pullWaitLabel,
  tonightOf,
  keyOfDate,
  clockOf,
  type Days,
  type PullPrefs,
  type Settings,
  setHabit,
  habitOf,
  HABIT_NAME,
  habitMedical,
  OB_HABIT,
  PULL_NAME,
  packLitCount,
} from '@daybook/core';
import Constants from 'expo-constants';
import { Redirect, router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { BigFlame } from '@/components/big-flame';
import { OwnAnswers } from '@/components/own-answers';
import { DateStep } from '@/components/date-step';
import { SYNC_NEED_SHORT } from '@/components/support';
import { STORAGE_LINE } from '@/components/home-screen';
import { Stepper } from '@/components/form';
import { Screen } from '@/components/screen';
import { ScriptureSetting } from '@/components/scripture';
import { SetCell, SetGroup, SetPick, SetRow, SetSwitch, useTone, type Tone } from '@/components/settings-ui';
import { confirmUnlock, lockOffered } from '@/components/lock';
import { SyncBody } from '@/components/sync-card';
import { B } from '@/components/help-bits';
import { Icon, T } from '@/components/ui';
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
import { NightPackBody } from '@/components/night-pack';
import { packOffered, usePack } from '@/lib/night-pack';
import { Pull, PULL_DENIED, pullLiftAll, pullOffered, pullPick, pullSet, pullStart, pullStop, setPullPrefs, usePullPrefs } from '@/lib/pull';
import { connectHealth, forgetHealth, healthOffered, useNights } from '@/lib/health';
import { play } from '@/lib/sound';
import { useSos } from '@/lib/sos';
import { useSync } from '@/lib/sync';
import { SAVE_FAILED, useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import { restoredWords, WORDS } from '@/lib/words';
import { forgetFuture } from '@/lib/future';
import { dropVoice, voiceOk } from '@/lib/voice';

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
  | 'nightpack'
  | 'look'
  | 'lock'
  | 'health'
  | 'notes'
  | 'sync'
  | 'copy'
  | 'wipe';

/** the list, grouped by what the person came to do; each group's icons take one tone. Delete everything stands alone at the end. */
const GROUPS: [string, Tone, PartId[]][] = [
  ['Your quit', 'coral', ['habit', 'count', 'faith']],
  ['Your days', 'sky', ['routine', 'bed', 'remind']],
  ['When it hits', 'violet', ['sos', 'pull', 'nightpack', 'answers']],
  ['This phone', 'mint', ['look', 'lock', 'health', 'notes']],
  ['Your log', 'accent', ['sync', 'copy']],
];
const ALL: PartId[] = [...GROUPS.flatMap(([, , ids]) => ids), 'wipe'];
const toneOf = (id: PartId): Tone => GROUPS.find(([, , ids]) => ids.includes(id))?.[1] ?? 'accent';

/** the ids links used before the redesign (November 9, 2026), so an old link still opens the right page */
const OLD: Record<string, PartId> = { sched: 'bed', data: 'copy' };
export function partOf(asked?: string): PartId | null {
  const k = (asked || '').replace(/^s-/, '');
  const id = (OLD[k] || k) as PartId;
  return ALL.includes(id) ? id : null;
}

interface Part {
  icon: string;
  title: string;
  /** how it stands now, a word or two, in gray on the row */
  value?: string;
  body?: ReactNode;
  /** a part that lives on a page of its own elsewhere */
  go?: () => void;
}

const ON_OFF = [
  [true, 'On'],
  [false, 'Off'],
] as const;

/** every part, with what it shows now; a part this phone does not offer is null */
function useParts(): Partial<Record<PartId, Part | null>> | null {
  const { snap, tk, now, apply, replace, erase, say, hooks, current } = useStore();
  const c = useTheme();
  const notes = useNotes();
  const sos = useSos();
  const sync = useSync();
  const signedIn = sync.status.k !== 'off' && sync.status.k !== 'out';
  /* Delete everything (WP4, November 12, 2026): it promises the account's 7-day copy only where the log reached the account,
     and a sign-in that ran out gets a way through (sign in again, or this device only) instead of "could not reach" */
  const wipeOut = sync.status.k === 'expired';
  const wipeAcct = signedIn && !wipeOut && sync.status.k !== 'need';
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
  const pack = usePack();
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
  const lessonSub = 'Once a day, around ' + fmtClock(la.at) + (la.from === 'last' ? ', about when you did your last one.' : ', when you usually open Daybook.');

  const ownN = st.opts.trig.filter((o) => !o.off).length + st.opts.did.filter((o) => !o.off).length;
  const routineOn = ROUTINE_SHOWN.filter((x: { k: string }) => st.routine[x.k]).length;
  const fa = (st.onb && st.onb.a && (st.onb.a.faith as string)) || '';
  const cr = (st.onb && st.onb.a && (st.onb.a.creed as string)) || '';
  const remN = [rem.lesson, rem.checkin, rem.wind, rem.review, rem.risk].filter(Boolean).length;
  /* the phone's own permission comes first: reminders chosen here send nothing while it is off */
  const notifyOff = !!notifyEnv && notifyEnv.offered && !notifyEnv.granted;
  const wipeWhat = 'every entry, check-in, setting and note';

  return {
    sync:
      sync.status.k === 'off'
        ? null
        : {
            icon: 'up',
            title: 'Sync between devices',
            value: signedIn
              ? sync.status.k === 'expired'
                ? 'Sign in again'
                : sync.status.k === 'error'
                  ? 'Not syncing'
                  : sync.status.k === 'need'
                    ? SYNC_NEED_SHORT
                    : 'On'
              : 'Off',
            body: <SyncBody />,
          },

    habit: st.onb
      ? {
          icon: 'flame',
          title: 'What I am quitting',
          value: HABIT_NAME[habitOf(st)],
          body: (
            <SetGroup
              head="What do you want to quit?"
              foot={
                'Lessons written for porn stay out for another habit. Everything you finished, earned and logged stays.' +
                (habitMedical(habitOf(st)) ? '\n\n' + habitMedical(habitOf(st)) : '')
              }>
              <SetPick options={OB_HABIT.map(([v, l]) => [v, l] as const)} value={habitOf(st)} onPick={(v) => apply({ st: setHabit(st, v) })} />
            </SetGroup>
          ),
        }
      : null,

    count: {
      icon: 'flag',
      title: 'Counting days',
      value: st.cleanMode === 'gentle' ? 'Gentle' : st.cleanMode === 'step' ? 'Step down' : 'Strict',
      body: (
        <>
          <SetGroup
            head="How days count"
            foot={
              <>
                {COUNT_HOW[st.cleanMode === 'gentle' ? 'gentle' : st.cleanMode === 'step' ? 'step' : 'strict']}
                {'\n\n'}
                Graduation is the same in all three: 90 days with no slip within 100. Your points, level, badges, longest run and comebacks stay when you
                switch.
              </>
            }>
            <SetPick
              options={[
                ['gentle', 'Gentle', 'Counts the no-slip days in the last 7. A slip takes one day off.'],
                ['strict', 'Strict', 'Counts days in a row. A slip puts it back to 0.'],
                ['step', 'Step down', 'Counts the hours since your last slip, for when it happens often.'],
              ]}
              value={st.cleanMode === 'gentle' ? 'gentle' : st.cleanMode === 'step' ? 'step' : 'strict'}
              onPick={(v) => apply(setCountMode(st, v, tk))}
            />
          </SetGroup>
          <SetGroup foot="Daybook moves you between step down and counting days as your log changes, and tells you when it does.">
            <SetSwitch label="Switch for me" on={st.cleanAuto !== false} onChange={(on) => apply(setCleanAuto(st, on))} />
          </SetGroup>
          <SetGroup
            head="Dates"
            foot="A day counts when no slip is logged on it. After two days in a row with Daybook not opened, the days after wait until you say how they went. They never take anything away.">
            <SetCell>
              <DateStep label="Day 1 of quitting" value={st.day1} from={st.day1 || tk} onPick={(k) => apply(setDate(st, 'day1', k))} />
            </SetCell>
            {st.day1 ? <SetRow label="No Day 1 yet, keep tracking" act="accent" onPress={() => apply(setDate(st, 'day1', null))} /> : null}
            <SetCell>
              <DateStep label="Tracking starts" value={st.start} from={tk} onPick={(k) => apply(setDate(st, 'start', k))} />
            </SetCell>
            <SetRow label="Tracking week, quitting and just tracking" onPress={() => router.push('/mode')} />
          </SetGroup>
        </>
      ),
    },

    faith: st.onb
      ? {
          icon: 'star',
          title: 'Faith in the lessons',
          value: fa === 'no' ? 'Off' : cr === 'lds' ? 'Latter-day Saint' : cr === 'christian' ? 'Christian' : 'On',
          body: (
            <>
              <SetGroup
                head="Does faith play a part in this for you?"
                foot="Yes or Somewhat adds lessons that speak of God, and a Faith and recovery page in Get help. No leaves them all out.">
                <SetPick
                  options={[
                    ['big', 'Yes'],
                    ['some', 'Somewhat'],
                    ['no', 'No'],
                  ]}
                  value={(fa || null) as 'big' | 'some' | 'no' | null}
                  onPick={(v) => v && apply({ st: setFaith(st, v) })}
                />
              </SetGroup>
              {fa === 'no' ? null : (
                <SetGroup head="Which faith is yours?" foot="The lessons that speak of God use its words.">
                  <SetPick
                    options={OB_CREED.map(([v, l]) => [v, l] as const)}
                    value={(cr || null) as (typeof OB_CREED)[number][0] | null}
                    onPick={(v) => v && apply({ st: setFaith(st, fa === 'some' ? 'some' : 'big', v) })}
                  />
                </SetGroup>
              )}
              {fa === 'no' ? null : <ScriptureSetting />}
            </>
          ),
        }
      : null,

    routine: {
      icon: 'check',
      title: 'Daily routine',
      value: routineOn + ' of ' + ROUTINE_SHOWN.length,
      body: (
        <SetGroup
          head="On Today"
          foot="A part switched off leaves Today, and still earns its points if you do it. To skip one for a single day, do that from Today. Skipping the check-in never costs you a day.">
          {ROUTINE_SHOWN.map((x) => (
            <SetSwitch key={x.k} label={x.name} sub={x.sub} on={!!st.routine[x.k]} onChange={(on) => apply({ st: setRoutine(st, x.k, on) })} />
          ))}
        </SetGroup>
      ),
    },

    bed: {
      icon: 'moon',
      title: 'Bedtime',
      value: so,
      body: (
        <>
          <SetGroup foot="The wind-down opens an hour before. Tapping Good night before then counts as screens off on time.">
            <SetCell>
              <Stepper
                label="Screens off"
                text={so}
                unset={false}
                less="15 minutes earlier"
                more="15 minutes later"
                onStep={(d) => apply({ st: setScreensOffTime(st, stepClock(st.screensOff, d * 15)) })}
              />
            </SetCell>
          </SetGroup>
          <SetGroup head="A new day starts at" foot="Entries before this hour count toward the day before, so a 1 AM entry stays with that night.">
            <SetPick
              options={[0, 1, 2, 3, 4, 5, 6].map((x) => [x, x === 0 ? 'Midnight' : fmtHour(x)] as const)}
              value={st.rollover}
              onPick={(x) => apply({ st: setRollover(st, x) })}
            />
          </SetGroup>
        </>
      ),
    },

    remind: {
      icon: 'timer',
      title: 'Reminders',
      value: remindersOffered ? (notifyOff || !remN ? 'Off' : remN + ' on') : 'Alarms',
      body: remindersOffered ? (
        <>
          {notifyOff ? (
            <SetGroup foot="Notifications are off for Daybook on this phone, so none of these can come. Turning one on asks the phone first.">
              <SetRow label="Notifications" value="Off" />
            </SetGroup>
          ) : null}
          <SetGroup
            head="Each day"
            foot="Up to three a day, and none about something you already did. The words never say what Daybook is for, because a reminder can show on a locked screen.">
            <SetSwitch label="Today’s lesson" sub={lessonSub} on={rem.lesson} onChange={(on) => setRem({ lesson: on })} />
            <SetSwitch label="Check in" sub={'Each evening at ' + fmtClock(rem.checkinAt)} on={rem.checkin} onChange={(on) => setRem({ checkin: on })} />
            {rem.checkin ? (
              <SetCell>
                <Stepper
                  label="Check-in at"
                  text={fmtClock(rem.checkinAt)}
                  unset={false}
                  less="15 minutes earlier"
                  more="15 minutes later"
                  onStep={(d) => setRem({ checkinAt: stepClock(rem.checkinAt, d * 15) })}
                />
              </SetCell>
            ) : null}
            <SetSwitch label="Wind down" sub={'At ' + wind + ', an hour before screens off'} on={rem.wind} onChange={(on) => setRem({ wind: on })} />
          </SetGroup>
          <SetGroup head="Now and then" foot="One that stops helping goes quiet, and Today says so.">
            <SetSwitch
              label="Sunday review"
              sub={'Sundays at ' + fmtClock(REVIEW_AT) + ', to look back on the week'}
              on={rem.review}
              onChange={(on) => setRem({ review: on })}
            />
            <SetSwitch
              label="Heads-up before hard hours"
              sub="90 minutes before a time of day that is often hard"
              on={rem.risk}
              onChange={(on) => setRem({ risk: on })}
            />
            <SetSwitch
              label="If you are away for a while"
              sub="A few short notes over a month, then quiet"
              on={rem.back !== false}
              onChange={(on) => setRem({ back: on })}
            />
          </SetGroup>
          {rem.risk && !exact ? (
            <SetGroup foot="Without it, this phone may send the heads-up up to an hour late. It opens the phone’s page to allow it.">
              <SetRow label="Allow exact times" act="accent" onPress={() => exactAlarmsAsk().then(setExact, () => undefined)} />
            </SetGroup>
          ) : null}
          {notifyEnv && notifyCanAsk(notifyEnv, notifyMem) ? (
            <SetGroup foot="While notifications are off, a strip at the top of Today offers to turn them on.">
              <SetRow
                label={NOTIFY_WORDS.never}
                act="accent"
                onPress={() => {
                  setNotifyMem(notifyNever);
                  say('Daybook will not ask again on this phone. Reminders can still be turned on here.');
                }}
              />
            </SetGroup>
          ) : null}
        </>
      ) : (
        <SetGroup
          head="Set them as phone alarms"
          foot="A web page cannot remind you once it is closed. Use your clock app and name each alarm the way it is written here. In the Daybook app on a phone, Daybook can remind you itself.">
          <SetRow label="Lesson" value={fmtClock(lessonLast(snap.days, tk) || '12:00')} />
          <SetRow label="Check in" value={minToClock(18 * 60)} />
          <SetRow label="Wind down" value={wind} />
          <SetRow label="Look back on my week" value={'Sun ' + fmtClock(REVIEW_AT)} />
        </SetGroup>
      ),
    },

    sos: {
      icon: 'life',
      title: 'SOS',
      value: pin ? pin.name : 'Best fit',
      body: (
        <>
          <SetGroup
            head="SOS suggests first"
            foot={
              pin
                ? 'SOS puts ' + pin.name + ' first when it can. It still keeps track of what helps.'
                : 'SOS learns which tools help you, and picks the best fit for the moment.'
            }>
            <SetPick
              options={[[null, 'The best fit for the moment'] as const, ...TOOLS.map((x) => [x.id, x.name] as const)]}
              value={st.urPin || null}
              onPick={(id) => apply({ st: setUrPin(st, id) })}
            />
          </SetGroup>
          {urOffOf(st).length ? (
            <SetGroup head="Not suggested" foot="You said Not for me to these. They stay in the SOS list.">
              {urOffOf(st).map((id) => (
                <SetRow
                  key={id}
                  label={urTool(id)!.name}
                  right={<T style={{ color: c.accentText, fontFamily: font.bodySemi }}>Suggest again</T>}
                  onPress={() => apply({ st: setUrOff(st, id, false) })}
                />
              ))}
            </SetGroup>
          ) : null}
          <SetGroup foot="A soft tone on each breath, and a chime when a timer ends. Saved on this device.">
            <SetSwitch
              label="Breath sound"
              on={sound}
              onChange={(on) => {
                setSoundPref(on);
                if (on) play('on', true);
              }}
            />
          </SetGroup>
        </>
      ),
    },

    pull: pullOffered
      ? { icon: 'phone', title: PULL_NAME, value: pull.on ? 'On' : 'Off', body: <PullBody pull={pull} days={snap.days} st={st} now={now} say={say} /> }
      : null,

    /* the night pack (WP21, core night-pack.ts): its own part, since Screen Time is not in every build and the pack is */
    nightpack: packOffered ? { icon: 'moon', title: 'The night pack', value: packLitCount(pack) + ' of 4', body: <NightPackBody /> } : null,

    answers: {
      icon: 'pencil',
      title: 'Check-in answers',
      value: ownN ? String(ownN) : 'None',
      body: <OwnAnswers />,
    },

    look: {
      icon: 'sparkle',
      title: 'Appearance',
      value: theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto',
      body: (
        <>
          <SetGroup head="Theme" foot="Auto follows your phone.">
            <SetPick
              options={
                [
                  ['auto', 'Auto'],
                  ['light', 'Light'],
                  ['dark', 'Dark'],
                ] as [ThemePref, string][]
              }
              value={theme}
              onPick={(v) => setThemePref(v)}
            />
          </SetGroup>
          <SetGroup foot="Confetti and pop-ups for level-ups and badges. Off gives a quiet message instead. If your phone is set to reduce motion, the movement is already off.">
            <SetSwitch label="Celebrations" on={st.celebrate} onChange={(on) => apply({ st: setCelebrate(st, on) })} />
            <SetRow
              label="Preview a celebration"
              act="accent"
              onPress={() =>
                hooks.current.onCelebrate?.([{ type: 'level', level: gameCompute(snap.days, st, snap.reviews, tk).level, from: 0, evolve: false }])
              }
            />
          </SetGroup>
        </>
      ),
    },

    lock: lockOffered
      ? {
          icon: 'lock',
          title: 'App lock',
          value: lock ? 'On' : 'Off',
          body: (
            <SetGroup foot="With the lock on, Daybook asks for Face ID, Touch ID or your passcode each time it opens, and again when you come back after more than a minute away. A shorter trip away does not lock it. In the app switcher, your log is covered. It locks Daybook only: not its reminders or the widget on your Home Screen.">
              <SetSwitch
                label="Lock Daybook"
                on={!!lock}
                onChange={async (on) => {
                  const r = await confirmUnlock(on ? 'Turn on the lock' : 'Turn off the lock');
                  if (r.ok) setLockPref(on);
                  else if (r.why) say(r.why);
                }}
              />
            </SetGroup>
          ),
        }
      : null,

    health: healthOffered()
      ? {
          icon: 'heart',
          title: 'Apple Health',
          value: health.on ? (nightsN === 1 ? '1 night' : nightsN + ' nights') : 'Off',
          body: (
            <SetGroup
              foot={
                'Daybook reads how long you slept, from your watch or ring, so the check-in does not have to ask and Pattern can show how your nights and your hard days line up. Only sleep. It stays on this phone: never synced, backed up or sent.' +
                (health.on && !nightsN ? '\n\nNo nights yet. If you sleep with a watch or a ring, check in the Health app that Daybook can read Sleep.' : '')
              }>
              <SetSwitch
                label="Read my sleep"
                on={health.on}
                onChange={async (on) => {
                  if (on === health.on) return;
                  if (on) {
                    if (!(await connectHealth(st.rollover))) say('Apple Health did not open. Try again in a moment.');
                  } else {
                    await forgetHealth();
                    say('Daybook stopped reading your sleep and forgot the nights it had.');
                  }
                }}
              />
            </SetGroup>
          ),
        }
      : null,

    notes: notes.can ? { icon: 'pencil', title: 'Obsidian', value: notes.on ? 'On' : 'Off', go: () => router.push('/notes') } : null,

    copy: {
      icon: 'copy',
      title: 'Save a copy',
      body: (
        <SetGroup
          foot={
            signedIn && sync.status.k !== 'need'
              ? 'Your log is saved on this device and in your account.'
              : 'Your log is saved on this device only. Supporters with an account get a safe copy.' + (STORAGE_LINE ? ' ' + STORAGE_LINE : '')
          }>
          <SetRow label="Days as a spreadsheet" value="CSV" onPress={() => save('days')} chevron={false} />
          <SetRow label="Every entry with its time" value="CSV" onPress={() => save('events')} chevron={false} />
          {BACKUP_FILES ? (
            <>
              <SetRow label="A full backup" value="JSON" onPress={() => save('json')} chevron={false} />
              <SetRow label={busy ? 'Restoring…' : 'Restore from a backup'} act="accent" onPress={busy ? undefined : restore} />
            </>
          ) : null}
        </SetGroup>
      ),
    },

    wipe: {
      icon: 'trash',
      title: 'Delete everything',
      body: (
        <SetGroup
          head={wipeAcct ? `Delete ${wipeWhat}, on this device and in your account?` : wipeOut ? `Delete ${wipeWhat} on this device?` : `Delete ${wipeWhat}?`}
          foot={
            (wipeAcct
              ? 'Your other devices clear it too when they next sync. Your account keeps a copy for 7 days, so it can be brought back until then.'
              : wipeOut
                ? 'Your sign-in ran out, so your account cannot be reached from here. Sign in again to delete it there too, or delete it on this device only: your account and your other devices keep their copy.'
                : sync.status.k === 'need'
                  ? 'Your log here has not been saved in your account, so this cannot be undone.'
                  : 'Your log is only on this device, so this cannot be undone.') +
            (wipeAcct && voiceOk ? ' Voice notes are only on this phone and cannot be brought back.' : '')
          }>
          {wipeOut ? <SetRow label="Sign in again" act="accent" onPress={() => sync.signInNow({ why: 'in', email: sync.email })} /> : null}
          <SetRow
            label={busy ? 'Deleting…' : wipeOut ? 'Delete on this device only' : 'Yes, delete everything'}
            act="danger"
            onPress={
              busy
                ? undefined
                : async () => {
                    setBusy(true);
                    /* a person whose log reached the account erases it there first; one with no tip yet tries too (an
                       older copy may be there), but nothing here waits on it */
                    const got = wipeAcct || sync.status.k === 'need' ? await sync.eraseAccount() : 'ok';
                    setBusy(false);
                    if (wipeAcct && got === 'expired') {
                      /* the sign-in ran out just now: the page turns to the way through */
                      say('Your sign-in ran out, so nothing was deleted. Sign in again, or delete it on this device only.');
                      return;
                    }
                    if (wipeAcct && got !== 'ok') {
                      say('Could not reach your account, so nothing was deleted. Check the connection and try again.');
                      return;
                    }
                    await erase();
                    await sos.forget();
                    await forgetDrafts();
                    dropVoice();
                    await forgetFuture();
                    say(wipeOut ? 'Everything on this device was deleted.' : 'Everything was deleted.');
                    router.replace('/');
                  }
            }
          />
          <SetRow label="Keep my log" act={wipeOut ? undefined : 'accent'} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </SetGroup>
      ),
    },
  };
}

const openPart = (id: PartId) => router.push({ pathname: '/settings/[part]', params: { part: id } });

/** every setting, as groups, then Delete everything on its own. More puts its own groups in the same list: `lead` before the
    settings (the journal, the plan, help, the tip) and `foot` after Delete everything (the crisis line, core crisis.ts). */
export function SettingsSections({ lead, foot }: { lead?: ReactNode; foot?: ReactNode }) {
  const parts = useParts();
  const { snap, tk, dirty } = useStore();
  const sync = useSync();
  if (!parts || !snap.settings) return <Redirect href="/" />;
  const signedIn = sync.status.k !== 'off' && sync.status.k !== 'out';
  const unsynced = Object.keys(dirty).length;
  return (
    <View style={{ gap: 28 }}>
      {lead}
      {GROUPS.map(([name, tone, ids]) => {
        const shown = ids.filter((id) => parts[id]);
        if (!shown.length) return null;
        return (
          <SetGroup key={name} head={name}>
            {shown.map((id) => {
              const p = parts[id]!;
              return <SetRow key={id} icon={p.icon} tone={tone} label={p.title} value={p.value} chevron onPress={p.go || (() => openPart(id))} />;
            })}
          </SetGroup>
        );
      })}
      <SetGroup>
        <SetRow label="Delete everything" act="danger" onPress={() => openPart('wipe')} />
      </SetGroup>
      {foot}
      <View style={s.foot}>
        <View style={{ height: 44, justifyContent: 'flex-end' }}>
          <BigFlame level={gameCompute(snap.days, snap.settings, snap.reviews, tk).level.n} size={40} noLand />
        </View>
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          Daybook {Constants.expoConfig?.version ?? ''} · a self-tracking tool, not medical care
          {signedIn && unsynced ? `\n${unsynced} change${unsynced === 1 ? '' : 's'} not synced yet` : ''}
        </T>
      </View>
    </View>
  );
}

/** one part of Settings on its own page, titled with its name and its icon in its group's tone */
export function SettingsPart({ id }: { id: PartId }) {
  const parts = useParts();
  const tint = useTone(toneOf(id));
  if (!parts) return <Redirect href="/" />;
  const p = parts[id];
  if (!p || !p.body) return <Redirect href="/settings" />;
  return (
    <Screen title={p.title} back="Settings" icon={id === 'wipe' || id === 'sync' ? undefined : <Icon name={p.icon} size={30} color={tint} />}>
      <View style={{ gap: 28 }}>{p.body}</View>
    </Screen>
  );
}

/* Screen Time (iPhone only; core pull.ts). Apple's own list picks the apps and Daybook never learns which. A stricter choice works
   at once; a looser one made outside the morning waits for 6 AM and says so (loosen slowly, tighten at once). Lift every wait now
   and Turn Screen Time off are always instant, as is Settings, Screen Time on the phone. */
function PullBody({ pull, days, st, now, say }: { pull: PullPrefs; days: Days; st: Settings; now: number; say: (m: string) => void }) {
  const start = async () => {
    const r = await pullStart().catch(() => 'closed' as const);
    if (r === 'denied') say(PULL_DENIED);
    else if (r === 'closed') say('Nothing was picked, so nothing changed.');
  };
  if (!pull.on)
    return (
      <SetGroup foot="Pick the apps that pull you in. Each one waits a few seconds before it opens, and at night adult sites wait longer. Apple keeps the list, and nothing about your apps leaves this phone.">
        <SetRow label="Choose the apps" act="accent" onPress={start} />
      </SetGroup>
    );
  const t = Date.now();
  const p = pullSettle(pull, t);
  const shown = pullShown(p);
  const waits = p.later ? fmtClock(PULL_NIGHT_END) : null;
  const held = (k: keyof PullPrefs) => !!p.later && k in p.later.p;
  /* a choice from here: when it waits for the morning, the flame says so */
  const set = (c: Partial<PullPrefs>) => {
    const at = pullSet(c);
    if (at) say('Looser settings start in the morning. This one starts at ' + fmtClock(PULL_NIGHT_END) + '.');
  };
  const porn = habitOf(st) === 'porn';
  const from = pullNightStart(days, st, p, t);
  const night = pullInNight(t, from);
  const quiet = (pullQuietUntil(days, st, now) ?? 0) > now;
  const span = fmtClock(from) + ' to ' + fmtClock(PULL_NIGHT_END);
  /* by day, tonight can start earlier than the morning said (never later: that is the morning's choice) */
  const morning = tonightOf(days, st, keyOfDate(new Date(t))).at;
  const earlier = NIGHT_TIMES.filter((x) => x !== morning && pullEarlier(morning, x) === x).slice(-3);
  const hours = (n: number) => (n === 0 ? 'Off' : n === 1 ? '1 hour' : n + ' hours');
  const mins = (n: number) => n + ' minutes';
  const foot = (k: keyof PullPrefs, base?: string) => (held(k) ? (base ? base + ' ' : '') + 'Your change starts at ' + waits + '.' : base);
  return (
    <>
      <SetGroup foot="Apple keeps the list, and nothing about your apps leaves this phone.">
        <SetRow
          label="Change the apps"
          onPress={async () => {
            const at = await pullPick();
            if (at) say('The apps you took out still wait until ' + fmtClock(PULL_NIGHT_END) + '. Looser settings start in the morning.');
          }}
        />
      </SetGroup>
      <SetGroup head="A short wait before them" foot={foot('feeds', 'All day, each time you open one.')}>
        <SetSwitch label="Wait first" on={shown.feeds} onChange={(on) => set({ feeds: on })} />
      </SetGroup>
      {shown.feeds ? (
        <>
          <SetGroup head="The wait" foot={foot('wait')}>
            <SetPick options={PULL_WAIT.map((n) => [n, pullWaitLabel(n)] as const)} value={shown.wait} onPick={(n) => set({ wait: n })} />
          </SetGroup>
          <SetGroup head="Then open for" foot={foot('open', 'Minutes of use, then the wait is back.')}>
            <SetPick options={PULL_OPEN.map((n) => [n, mins(n)] as const)} value={shown.open} onPick={(n) => set({ open: n })} />
          </SetGroup>
        </>
      ) : null}
      <SetGroup head={'Tonight, ' + span} foot={night ? undefined : 'Set each morning. You can start it earlier tonight.'}>
        {porn ? <SetSwitch label="Adult sites wait" on={shown.adult} onChange={(on) => set({ adult: on })} /> : null}
        <SetSwitch label="Notes at 10 and 20 minutes" on={p.hard} onChange={(on) => setPullPrefs({ hard: on })} />
      </SetGroup>
      {!night && earlier.length ? (
        <SetGroup head="Start tonight at">
          <SetPick
            options={[...earlier, morning].map((x) => [x, fmtClock(x)] as const)}
            value={from}
            onPick={(x) => setPullPrefs({ early: pullEarly(p, days, st, x, Date.now()).early })}
          />
        </SetGroup>
      ) : null}
      {porn && shown.adult ? (
        <SetGroup
          head="Before adult sites open"
          foot={foot(
            'lift',
            'Apple’s adult filter, in Safari and other browsers. After the wait they open for ' + PULL_WEB_OPEN + ' minutes, then it is back.',
          )}>
          <SetPick options={PULL_LIFT.map((n) => [n, mins(n)] as const)} value={shown.lift} onPick={(n) => set({ lift: n })} />
          {night && p.adult ? (
            <SetRow label={'Start the ' + p.lift + '-minute wait'} onPress={() => router.push({ pathname: '/pause', params: { w: 'long' } })} />
          ) : null}
        </SetGroup>
      ) : null}
      <SetGroup head="A note after long use" foot="One note a day. When today’s lesson is not done, a tap takes you to it.">
        <SetPick options={PULL_LONG.map((n) => [n, hours(n)] as const)} value={p.long} onPick={(n) => setPullPrefs({ long: n })} />
      </SetGroup>
      <SetGroup
        foot={
          (night && !quiet ? 'Tonight, lifting every wait or turning this off counts as a night you went through. ' : '') +
          'You can also turn this off in the phone’s Settings, under Screen Time.'
        }>
        {packOffered ? <SetRow label="The night pack, for the whole phone" onPress={() => router.push('/settings/nightpack')} /> : null}
        <SetRow
          label="Lift every wait now"
          act="accent"
          onPress={async () => {
            const until = await pullLiftAll(days, st, !quiet);
            say('Every wait is lifted until ' + fmtClock(clockOf(until)) + '.');
          }}
        />
        <SetRow label="Turn Screen Time off" act="danger" onPress={() => pullStop(night && !quiet)} />
      </SetGroup>
    </>
  );
}

const s = StyleSheet.create({
  foot: { alignItems: 'center', gap: 4 },
});
