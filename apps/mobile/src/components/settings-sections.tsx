/* Every setting, as one plain grouped list whose rows open in place (the More tab and the Settings page both show it): sync, my
   daily routine, the schedule, how days are counted, look and feel, SOS, reminders, and saving, backing up and deleting. Each
   row's line says how that setting stands now. Ported from the legacy viewSettings. */
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
} from '@daybook/core';
import Constants from 'expo-constants';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { OwnAnswers } from '@/components/own-answers';
import { Link } from '@/components/choices';
import { DateStep } from '@/components/date-step';
import { SYNC_NEED_SHORT } from '@/components/support';
import { STORAGE_LINE } from '@/components/home-screen';
import { OnOff, Reveal, Stepper } from '@/components/form';
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
import { NATIVE, useReducedMotion } from '@/lib/motion';
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

type SecId = 'sync' | 'routine' | 'sched' | 'count' | 'faith' | 'look' | 'sos' | 'remind' | 'pull' | 'lock' | 'health' | 'answers' | 'data';

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

/** one row of the list: an icon, the title, how it stands now, and a chevron that turns as the row opens in place */
function Sec({
  icon,
  title,
  sub,
  open,
  onToggle,
  onLayoutY,
  children,
}: {
  icon: string;
  title: string;
  sub: string;
  open: boolean;
  onToggle: () => void;
  onLayoutY?: (y: number) => void;
  children: ReactNode;
}) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const turn = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) turn.setValue(open ? 1 : 0);
    else Animated.timing(turn, { toValue: open ? 1 : 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [open, reduce, turn]);
  return (
    <View onLayout={onLayoutY ? (e) => onLayoutY(e.nativeEvent.layout.y) : undefined}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        style={({ pressed }) => [s.row, { opacity: pressed ? 0.7 : 1 }]}>
        <Icon name={icon} size={22} color={c.accentText} />
        <View style={{ flex: 1, gap: 1 }}>
          <T v="label">{title}</T>
          <T v="small" tone="muted">
            {sub}
          </T>
        </View>
        <Animated.View style={{ transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }] }}>
          <Icon name="next" size={16} color={c.muted} />
        </Animated.View>
      </Pressable>
      <Reveal open={open} style={s.body}>
        {children}
      </Reveal>
      <View style={[s.line, { backgroundColor: c.line }]} />
    </View>
  );
}

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

/** every settings section, as one list of rows that open. `open` opens one ("s-count"), and `onOpenLayout` tells where it is. */
export function SettingsSections({ open: asked, onOpenLayout }: { open?: string; onOpenLayout?: (y: number) => void }) {
  const { snap, tk, now, apply, replace, erase, say, dirty, hooks, current } = useStore();
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
  const first = (asked || '').replace(/^s-/, '') as SecId;
  const [open, setOpen] = useState<Partial<Record<SecId, boolean>>>(first ? { [first]: true } : {});
  const [wipe, setWipe] = useState(false);
  const [busy, setBusy] = useState(false);
  /* where the row asked for sits: its place in the list, plus the list's place on the page, told once when both are known */
  const place = useRef<{ list?: number; row?: number; told?: boolean }>({});
  const tell = (k: 'list' | 'row', y: number) => {
    const p = place.current;
    p[k] = y;
    if (p.told || p.list == null || p.row == null) return;
    p.told = true;
    onOpenLayout?.(p.list + p.row);
  };
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const tog = (k: SecId) => () => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const sec = (k: SecId, icon: string, title: string, sub: string, body: ReactNode) => (
    <Sec
      key={k}
      icon={icon}
      title={title}
      sub={sub}
      open={!!open[k]}
      onToggle={tog(k)}
      onLayoutY={k === first && onOpenLayout ? (y) => tell('row', y) : undefined}>
      {body}
    </Sec>
  );

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
  const unsynced = Object.keys(dirty).length;
  /* the lesson reminder's time is not set by hand: it follows the last lesson (core lessonAt) */
  const la = lessonAt(snap.days, nlog, tk, now);
  const lessonSub =
    'Once a day, around ' +
    fmtClock(la.at) +
    (la.from === 'last' ? ', about when you did your last one.' : ', when you usually open Daybook.') +
    ' Never once today’s is done.';
  /* the hard hours the log has found, for the Screen Time section */
  const hw = riskWindow(snap.days, st, tk);
  const pullHard = hw ? (hw.scope === 'weekdays' ? 'Weekdays, ' : hw.scope === 'weekends' ? 'Weekends, ' : 'Every day, ') + hw.label : null;

  const ownN = st.opts.trig.filter((o) => !o.off).length + st.opts.did.filter((o) => !o.off).length;
  const ownSub = ownN ? ownN + (ownN === 1 ? ' answer' : ' answers') + ' added on check-ins' : 'Words you add on a check-in';
  const routineOn = ROUTINE_SHOWN.filter((x: { k: string }) => st.routine[x.k]).length;
  const fa = (st.onb && st.onb.a && (st.onb.a.faith as string)) || '';
  const cr = (st.onb && st.onb.a && (st.onb.a.creed as string)) || '';
  const themeWord = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto';
  return (
    <>
      <View onLayout={(e) => tell('list', e.nativeEvent.layout.y)}>
        <Rows>
          {sync.status.k === 'off'
            ? null
            : sec(
                'sync',
                'up',
                'Sync between devices',
                signedIn
                  ? sync.status.k === 'expired'
                    ? 'Sign in again to keep syncing'
                    : sync.status.k === 'error'
                      ? 'Not syncing right now · your log is safe here'
                      : sync.status.k === 'need'
                        ? SYNC_NEED_SHORT
                        : 'On' + (sync.email ? ' · ' + sync.email : '')
                  : 'Off · your log stays on this device',
                <SyncBody />,
              )}

          {sec(
            'routine',
            'check',
            'My daily routine',
            routineOn + ' of ' + ROUTINE_SHOWN.length + ' parts on',
            <>
              <T v="small" tone="muted">
                A part switched off leaves Today, and still earns its points if you do it. To skip one for a single day, do that from Today.
              </T>
              {ROUTINE_SHOWN.map((x) => (
                <OnOff key={x.k} name={x.name} sub={x.sub} on={!!st.routine[x.k]} onPick={(on) => apply({ st: setRoutine(st, x.k, on) })} />
              ))}
              <T v="small" tone="muted">
                <B>Check-in.</B> Skipping it never costs you a day.
              </T>
              <T v="small" tone="muted">
                <B>Reached out.</B> It starts switched off. Turn it on whenever a text or call to a real person feels right.
              </T>
            </>,
          )}

          {sec(
            'sched',
            'moon',
            'Schedule',
            'Screens off at ' + so,
            <>
              <Field label="Screens off" hint="The wind-down opens an hour before. Tapping Good night before then counts as screens off on time.">
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
            'flag',
            'How I count days',
            st.cleanMode === 'gentle' ? 'A slip takes one day off' : st.cleanMode === 'step' ? 'Longer stretches between slips' : 'Days in a row with no slip',
            <>
              <T v="small" tone="muted">
                A day counts when no slip is logged on it. After two days in a row with Daybook not opened, the days after wait until you say how they went.
                They never take anything away. This only changes how days are counted, never what you log.
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
            </>,
          )}

          {/* the setup's faith answers (core faith.ts): whether lessons speak of God, and in which faith's words */}
          {st.onb
            ? sec(
                'faith',
                'star',
                'Faith in the lessons',
                fa === 'no' ? 'Off' : (OB_CREED.find((x) => x[0] === cr) || [null, 'On'])[1],
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
                </>,
              )
            : null}

          {sec(
            'look',
            'sparkle',
            'Look and feel',
            themeWord + ' theme · celebrations ' + (st.celebrate ? 'on' : 'off'),
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
            'life',
            'SOS',
            (pin ? pin.name + ' first' : 'The best fit first') + ' · sound ' + (sound ? 'on' : 'off'),
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
            'timer',
            'Reminders',
            remindersOffered ? (rem.lesson || rem.checkin || rem.wind ? 'On' : 'Off') : 'Phone alarms that keep the rhythm',
            remindersOffered ? (
              <>
                <T v="small" tone="muted">
                  Up to three a day, and none about something you already did. The words never say what Daybook is for, because a reminder can show on a locked
                  screen. One that stops helping goes quiet, and Today says so.
                </T>
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
                <T>
                  A web page cannot remind you once it is closed, so phone alarms are the reliable way. The lesson matters most; the others help if you like:
                </T>
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
          )}

          {pullOffered
            ? sec(
                'pull',
                'phone',
                'Apps that pull you in',
                pull.on ? (pull.pause ? 'On · nudges, then a pause' : 'On · nudges') : 'Off',
                <PullBody pull={pull} hard={pullHard} say={say} />,
              )
            : null}

          {lockOffered
            ? sec(
                'lock',
                'lock',
                'Lock',
                lock ? 'On · Face ID or passcode to open' : 'Off',
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
                </>,
              )
            : null}

          {healthOffered()
            ? sec(
                'health',
                'heart',
                'Apple Health',
                health.on ? (nightsN ? 'On · ' + nightsN + ' nights of sleep' : 'On · No nights yet') : 'Off',
                <>
                  <T v="small" tone="muted">
                    Daybook reads how long you slept, from your watch or ring, so the check-in does not have to ask and Pattern can show how your nights and
                    your hard days line up. Only sleep. It stays on this phone: never synced, backed up or sent.
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
                </>,
              )
            : null}

          {notes.can ? (
            <LinkCard
              icon="pencil"
              title="Obsidian"
              sub={notes.on ? 'Syncing your journal with ' + notes.name : 'Sync your journal with your vault'}
              onPress={() => router.push('/notes')}
            />
          ) : null}
          {sec('answers', 'pencil', 'My own answers', ownSub, <OwnAnswers />)}
          {sec(
            'data',
            'copy',
            BACKUP_FILES ? 'Save, back up, delete' : 'Save or delete',
            BACKUP_FILES ? 'Spreadsheet and backup files' : 'Spreadsheets, or delete everything',
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
                {wipe ? null : <Act danger icon="trash" label="Delete everything…" onPress={() => setWipe(true)} />}
              </View>
              {wipe ? (
                <View style={{ gap: 8 }}>
                  <T v="label">
                    {signedIn
                      ? `Delete every entry, check-in${voiceOk ? ', setting and voice note' : ' and setting'}, on this device and in your account?`
                      : `Delete every entry, check-in${voiceOk ? ', setting and voice note' : ' and setting'}?`}
                  </T>
                  <T v="small" tone="muted">
                    {signedIn
                      ? 'Your other devices clear it too when they next sync. Your account keeps a copy for 7 days, so it can be brought back until then.' +
                        (voiceOk ? ' The voice note is only on this phone and cannot be brought back.' : '')
                      : 'Your log is only on this device, so this cannot be undone.'}
                  </T>
                  <Button
                    kind="danger"
                    label={busy ? 'Deleting…' : 'Yes, delete everything'}
                    disabled={busy}
                    onPress={async () => {
                      setBusy(true);
                      const ok = !signedIn || (await sync.eraseAccount());
                      setBusy(false);
                      if (!ok) {
                        setWipe(false);
                        say('Could not reach your account, so nothing was deleted. Check the connection and try again.');
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
                  <View style={{ alignItems: 'center' }}>
                    <Link label="Keep my log" onPress={() => setWipe(false)} />
                  </View>
                </View>
              ) : null}
            </>,
          )}
        </Rows>
      </View>

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

/* Apps that pull you in (Screen Time, iPhone only; core pull.ts). Apple's own list picks the apps and Daybook never learns which;
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60, paddingVertical: 10, paddingLeft: 16, paddingRight: 14 },
  body: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  line: { height: 1, marginLeft: 52 },
  act: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
});
