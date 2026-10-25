/* Bedtime: the evening's one moment (core bedtime.ts). One screen under the night sky: the words at the top (screens-off
   and how long until it, the wind-down to read), the flame breathing slowly in the middle, and low under the thumb, how
   today went in three one-tap rows (mood, urges, stress, each skippable), the plan for a loud night in one line with SOS,
   and one big Goodnight button. Goodnight logs the day, puts the phone away, and on time is the wind-down too; then the
   going-to-bed moment plays. Nothing is asked about sleep: the morning works it out. Early in the evening, "Save for now"
   logs the day and leaves Goodnight for later. Opened again after Goodnight (or after SOS "Go to bed"), it says when the
   phone went away and still lets the day be logged. Answers are kept as a draft on this device until saved (lib/drafts).
   Opened from Bedtime on Today, the reminders, and the old check-in and wind-down links. */
import {
  checkinAnswered,
  checkinFormOf,
  checkinSaveText,
  fmtClock,
  gameCompute,
  moodStart,
  rhythm,
  routineOn,
  saveCheckin,
  windLine,
  type CheckinForm,
} from '@daybook/core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { BedRows } from '@/components/bed-rows';
import { Field, Link } from '@/components/choices';
import { GoingToBed, GoodnightButton, PlanLine, SleepyFlame, useGoodnight, type Bed } from '@/components/goodnight';
import { KeepAbove } from '@/components/keyboard';
import { Dock, Middle, SceneFrame } from '@/components/scene';
import { TalkDoor } from '@/components/talk-card';
import { Button, Chip, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { loadDrafts, saveDraft } from '@/lib/drafts';
import { close } from '@/lib/nav';
import { setReminderPrefs, useReminderPrefs } from '@/lib/prefs';
import { count } from '@/lib/pulse';
import { allowReminders, remindersOffered } from '@/lib/reminders';
import { useStore } from '@/lib/store';

/** the reminder offered after Goodnight: about the time it was said, but never at night (core nudges.ts: Daybook never picks
    a night time on its own), so a Goodnight after 10 PM offers 10 PM, the latest time the setup offers */
const clockNear = (ms: number) => {
  const d = new Date(ms);
  const h = d.getHours();
  if (h >= 22 || h < 5) return '22:00';
  return String(h).padStart(2, '0') + ':' + String(Math.floor(d.getMinutes() / 15) * 15).padStart(2, '0');
};
/* more than this many minutes before screens-off, the day can be logged now and Goodnight said later */
const EARLY_MIN = 60;

export default function Bedtime() {
  const { snap, tk, now, update, say } = useStore();
  const { height } = useWindowDimensions();
  const prefs = useReminderPrefs();
  const goodnight = useGoodnight();
  const st = snap.settings;
  const logged = !!snap.days[tk]?.checkin?.done;
  /* the mood starts from today's feeling, when there is one and the day is not logged yet */
  const [start] = useState(() => (logged ? null : moodStart(snap.days, tk)));
  const [form, setForm] = useState<CheckinForm>(() => {
    const f = checkinFormOf(snap.days, tk);
    return f.md == null && start != null ? { ...f, md: start } : f;
  });
  const [bed, setBed] = useState<Bed | null>(null);
  const [line, setLine] = useState(false);
  const [touched, setTouched] = useState(false);

  /* a draft from before comes back */
  useEffect(() => {
    let on = true;
    loadDrafts().then((d) => {
      if (on && d[tk]) {
        setForm((f) => ({ ...f, md: null, u: null, ...d[tk] }));
        setTouched(true);
      }
    });
    return () => {
      on = false;
    };
  }, [tk]);

  if (!st) return <Redirect href="/" />;

  const remAt = clockNear(now);
  const offer =
    remindersOffered && !prefs.checkin ? (
      <View style={s.offer}>
        <Chip
          label={'Remind me at ' + fmtClock(remAt) + ' each day'}
          on={false}
          onPress={async () => {
            const ok = await allowReminders();
            if (ok) {
              setReminderPrefs({ ...prefs, checkin: true, checkinAt: remAt });
              say('Daybook will remind you at ' + fmtClock(remAt) + ', unless bedtime is done already.');
            } else say('Notifications are off for Daybook. You can turn them on in your phone’s settings.');
          }}
        />
      </View>
    ) : null;
  if (bed) return <GoingToBed bed={bed} extra={offer} />;

  const p = snap.days[tk]?.p;
  const r = rhythm(snap.days, st, tk, now);
  const away = p && p.po ? p.po : null;
  const rows = routineOn(st, p, 'checkin') || logged;
  const any = checkinAnswered(form);
  const set = (f: CheckinForm) => {
    setForm(f);
    setTouched(true);
    saveDraft(tk, f, tk);
  };
  const lvl = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);
  /* the day alone: early in the evening ("Save for now"), or after Goodnight was already said */
  const save = () => {
    let text = '';
    update((s0) => {
      const days = saveCheckin(s0.days, tk, form);
      text = checkinSaveText(days, s0.settings!, tk, tk);
      return { ...s0, days };
    });
    saveDraft(tk, null, tk);
    count('checkin');
    buzz('lit');
    say(away ? text : text + ' Goodnight when the phone goes down.');
    close();
  };
  const sayGoodnight = () => {
    /* an untouched mood that only came from this morning is still the person's answer: they saw it and let it stand */
    const b = goodnight(any ? form : null);
    saveDraft(tk, null, tk);
    if (any) count('checkin');
    setBed(b);
  };
  const early = !away && r.leftToOff > EARLY_MIN;
  /* the room the screen leaves for the flame: the rest of it takes about 640 points (a little more with the wind-down line) */
  const room = height - 640 - (!away && r.leftToOff > 0 && st.wind.length ? 36 : 0);
  const flameSize = Math.round(Math.max(48, Math.min(120, (room - (room > 190 ? 26 : 0)) / 1.4)));

  return (
    <SceneFrame
      title="Bedtime"
      sky="night"
      onClose={close}
      footer={early && any && touched ? <Link label="Save for now, and say goodnight later" onPress={save} /> : null}>
      <T v="title" style={s.c} accessibilityRole="header">
        {away ? 'Phone away at ' + fmtClock(away) + '.' : early ? 'Bedtime' : 'Time for bed'}
      </T>
      <T style={s.c} tone="muted">
        {away ? (logged ? 'Today is logged. Good night.' : 'Good night. Log today too, if you like.') : windLine(st, r.leftToOff, p)}
      </T>
      {/* the wind-down to read, in the hour before screens-off (two lines at most: Goodnight on time counts as all of it) */}
      {!away && r.leftToOff > 0 && st.wind.length ? (
        <T v="small" tone="muted" style={s.c} numberOfLines={2}>
          {'Your wind-down: ' + st.wind.join(' · ')}
        </T>
      ) : null}
      {/* the flame breathing in the open middle, as big as the room under the words allows (it is the heart of the screen, so it
          only shrinks, never steps aside); the line inviting the breath shows when there is room for it */}
      <Middle>
        <SleepyFlame level={lvl} size={flameSize} words={room > 190} />
      </Middle>
      <Dock>
        {form.md != null && form.md <= 3 && !away ? <TalkDoor line="A heavy day is a state, not who you are. Talk it through before tonight." /> : null}
        {line ? (
          /* the one line and its button stay together, above the keyboard */
          <KeepAbove style={s.line}>
            <Field
              label="One line about today"
              multiline
              autoFocus
              maxLength={200}
              value={form.n}
              placeholder="Rough day at work. Texted a friend."
              onChangeText={(t) => set({ ...form, n: t })}
            />
            <Button label="Keep it" onPress={() => setLine(false)} />
          </KeepAbove>
        ) : rows ? (
          <BedRows
            form={form}
            onChange={set}
            from={start != null && !touched ? 'Mood from earlier today. Move it if it changed.' : null}
            foot={
              <View style={s.add}>
                <Link
                  label={
                    form.n.trim() ? 'Your line: ' + (form.n.trim().length > 36 ? form.n.trim().slice(0, 34) + '…' : form.n.trim()) : 'Add a line about today'
                  }
                  onPress={() => setLine(true)}
                />
              </View>
            }
          />
        ) : null}
        {line ? null : (
          <>
            <PlanLine />
            {away ? <Button label={any && touched ? 'Save' : 'Done'} onPress={any && touched ? save : close} /> : <GoodnightButton onPress={sayGoodnight} />}
          </>
        )}
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  offer: { alignItems: 'center' },
  line: { alignSelf: 'stretch', gap: 12 },
  add: { alignItems: 'center' },
});
