/* The evening check-in: a one-minute full-screen moment, one question at a time, like the sunrise check. Four honest 0 to 10
   numbers on a slider, low on the screen where the thumb is, whether you reached out, one optional line, then the day as it is saved and what comes next.
   Answers are kept as a draft on this device until saved (lib/drafts), so closing halfway loses nothing. Opened from the
   Check-in stop in "Your day"; `k` picks the day (today when left out). */
import { checkinFormOf, checkinSaveText, fmtClock, gameCompute, rhythm, saveCheckin, stopStatus, type CheckinForm, type DayKey } from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { DoneMark } from '@/components/done-mark';
import { BigOption, Field, Link } from '@/components/choices';
import { CountUp } from '@/components/count-up';
import { TalkDoor } from '@/components/talk-card';
import { Dock, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { loadDrafts, saveDraft } from '@/lib/drafts';
import { close } from '@/lib/nav';
import { setReminderPrefs, useReminderPrefs } from '@/lib/prefs';
import { allowReminders, remindersOffered } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Rated = 'm' | 'c' | 'e' | 's';
/** the clock now, rounded down to a quarter hour: "21:45" */
/** the reminder offered after a check-in: about the time it was done, but never at night (core nudges.ts: Daybook never
    picks a night time on its own), so a check-in after 10 PM offers 10 PM, the latest time the setup offers */
const clockNear = (ms: number) => {
  const d = new Date(ms);
  const h = d.getHours();
  if (h >= 22 || h < 5) return '22:00';
  return String(h).padStart(2, '0') + ':' + String(Math.floor(d.getMinutes() / 15) * 15).padStart(2, '0');
};
const RATE: Record<Rated, { name: string; q: string; lo: string; hi: string }> = {
  m: { name: 'Motivation', q: 'How much motivation did you have today?', lo: 'none', hi: 'lots' },
  c: { name: 'Connection', q: 'How close did you feel to people today?', lo: 'distant', hi: 'close' },
  e: { name: 'Energy', q: 'How much energy did you have?', lo: 'drained', hi: 'full' },
  s: { name: 'Stress', q: 'How much stress did you feel?', lo: 'calm', hi: 'high' },
};
const STEPS = ['m', 'c', 'e', 's', 'ro', 'n'] as const;
type Step = (typeof STEPS)[number] | 'end';

export default function Checkin() {
  const c = useTheme();
  const { snap, tk, now, update, say } = useStore();
  const prefs = useReminderPrefs();
  const st = snap.settings;
  const { k: kp } = useLocalSearchParams<{ k?: string }>();
  const k = (kp && kp <= tk ? kp : tk) as DayKey;
  const [form, setForm] = useState<CheckinForm>(() => checkinFormOf(snap.days, k));
  const [step, setStep] = useState<Step>('m');
  const [hist, setHist] = useState<Step[]>([]);
  /* which way the steps slide: forward from the right, Back from the left */
  const [dir, setDir] = useState(1);
  const [msg, setMsg] = useState('');
  const [pts0] = useState(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).pts : 0));

  /* a draft from before comes back */
  useEffect(() => {
    let on = true;
    loadDrafts().then((d) => {
      if (on && d[k]) setForm(d[k]);
    });
    return () => {
      on = false;
    };
  }, [k]);

  if (!st) return null;
  const go = (next: Step) => {
    setHist((h) => h.concat(step));
    setDir(1);
    setStep(next);
  };
  const next = () => go(STEPS[STEPS.indexOf(step as (typeof STEPS)[number]) + 1] || 'n');
  const back = () => {
    const h = hist.slice();
    const p = h.pop();
    if (!p) return;
    setHist(h);
    setDir(-1);
    setStep(p);
  };
  const set = (f: CheckinForm) => {
    setForm(f);
    saveDraft(k, f, tk);
  };
  const save = () => {
    let text = '';
    update((s0) => {
      const days = saveCheckin(s0.days, k, form);
      text = checkinSaveText(days, s0.settings!, k, tk);
      return { ...s0, days };
    });
    saveDraft(k, null, tk);
    buzz('lit');
    setMsg(text);
    setHist([]);
    setDir(1);
    setStep('end');
  };

  const i = step === 'end' ? STEPS.length : STEPS.indexOf(step);
  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (step === 'm' || step === 'c' || step === 'e' || step === 's') {
    const R = RATE[step];
    const v = form[step];
    body = (
      <>
        <T v="eyebrow" tone="muted">
          {R.name}
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {R.q}
        </T>
        {step === 'm' ? (
          <T style={s.c} tone="muted">
            An honest 0 to 10. Do not round up to feel better.
          </T>
        ) : null}
        {/* the answer, huge, in the open middle of the screen; the slider that sets it sits under the thumb */}
        <View style={s.middle}>
          <SliderValue big value={v} caption="out of 10" hint="Slide below to answer" />
        </View>
        <Dock>
          <Slider key={step} label={R.name} value={v} lo={R.lo} hi={R.hi} readout={false} onChange={(n) => set({ ...form, [step]: n })} />
          {v != null ? (
            <Appear by={10} duration={240}>
              <Button label="Next" onPress={next} />
            </Appear>
          ) : (
            <View style={s.btnSpace} />
          )}
        </Dock>
      </>
    );
    footer = <Link label="Skip this one" onPress={next} hidden={v != null} />;
  } else if (step === 'ro') {
    const pick = (v: 'Y' | 'N') => {
      set({ ...form, ro: v });
      setTimeout(next, 220);
    };
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Connection
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Did you reach out to someone today?
        </T>
        <T style={s.c} tone="muted">
          A text, a call, a real talk. Small counts.
        </T>
        <Dock>
          <BigOption tone="mint" icon="chat" title="Yes" selected={form.ro === 'Y'} onPress={() => pick('Y')} />
          <BigOption tone="sun" icon="leaf" title="Not today" sub="Tomorrow is another chance." selected={form.ro === 'N'} onPress={() => pick('N')} />
        </Dock>
      </>
    );
    footer = <Link label="Skip this one" onPress={next} />;
  } else if (step === 'n') {
    const any = [form.m, form.c, form.e, form.s, form.ro].some((v) => v != null) || !!form.n.trim();
    body = (
      <>
        <T v="eyebrow" tone="muted">
          One line
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Anything about today?
        </T>
        <KeepAbove style={{ alignSelf: 'stretch', gap: 12 }}>
          <Field
            label="One line about the day (optional)"
            hideLabel
            multiline
            maxLength={200}
            value={form.n}
            placeholder="Rough day at work. Texted a friend."
            onChangeText={(t) => set({ ...form, n: t })}
          />
          {any ? (
            <Button label={k === tk ? 'Save today' : 'Save this day'} onPress={save} />
          ) : (
            <T v="small" tone="muted" style={s.c}>
              Go back and answer at least one, then save.
            </T>
          )}
          <T v="small" tone="muted" style={s.c}>
            If something happened today, log it too. A slip is data, not a reset.
          </T>
        </KeepAbove>
      </>
    );
  } else {
    const g = gameCompute(snap.days, st, snap.reviews, tk);
    const gain = Math.max(0, g.pts - pts0);
    const r = k === tk ? rhythm(snap.days, st, tk, now) : null;
    const wind = r && r.stops.find((x) => x.k === 'night' && !x.done);
    const tile = (v: number | null, l: string) => (
      <View key={l} style={[s.tile, { backgroundColor: c.surface }]}>
        <Text style={[s.tileV, { color: c.ink }]}>{v == null ? '–' : v}</Text>
        <T v="small" tone="muted">
          {l}
        </T>
      </View>
    );
    body = (
      <>
        <DoneMark />
        <Appear delay={180}>
          <T v="title" style={s.c} accessibilityRole="header">
            Day logged.
          </T>
        </Appear>
        <Appear delay={260} style={{ alignItems: 'center', gap: 4 }}>
          <T style={s.c}>{msg}</T>
          {gain ? <CountUp to={gain} prefix="+" suffix=" points" delay={700} style={[s.pts, { color: c.mintText }]} /> : null}
        </Appear>
        <View style={s.tiles}>
          {(
            [
              [form.m, 'Motivation'],
              [form.c, 'Connection'],
              [form.e, 'Energy'],
              [form.s, 'Stress'],
            ] as [number | null, string][]
          ).map(([v, l], j) => (
            <Appear key={l} delay={360 + j * 70} by={14} style={[s.tile, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <Text style={[s.tileV, { color: c.ink }]}>{v == null ? '–' : v}</Text>
              <T v="small" tone="muted">
                {l}
              </T>
            </Appear>
          ))}
        </View>
        {form.m != null && form.m <= 3 ? (
          <Appear delay={640} style={{ alignSelf: 'stretch' }}>
            <TalkDoor line="Low on caring today? That is a state, not who you are. Talk it through before tonight." />
          </Appear>
        ) : null}
        {wind && r ? (
          <Appear delay={700} style={[s.next, { backgroundColor: c.surface }]}>
            <View style={[s.nextIc, { backgroundColor: c.violetSoft }]}>
              <Icon name="moon" size={18} color={c.violetText} />
            </View>
            <T style={{ flex: 1 }}>
              <T v="label">Next: the wind-down.</T> {stopStatus(wind, r.windMin)}.
            </T>
          </Appear>
        ) : null}
      </>
    );
    /* no reminder yet (the setup's "Not now", or none asked): one offer, at about the time this check-in was done */
    const remAt = clockNear(now);
    const offer = remindersOffered && !prefs.checkin && k === tk;
    footer = (
      <View style={[s.foot, { gap: 10 }]}>
        {offer ? (
          <Chip
            label={'Remind me at ' + fmtClock(remAt) + ' each day'}
            on={false}
            onPress={async () => {
              const ok = await allowReminders();
              if (ok) {
                setReminderPrefs({ ...prefs, checkin: true, checkinAt: remAt });
                say('Daybook will remind you at ' + fmtClock(remAt) + ', unless you have checked in already.');
              } else say('Notifications are off for Daybook. You can turn them on in your phone’s settings.');
            }}
          />
        ) : null}
        <Button label="Done" onPress={close} />
      </View>
    );
  }

  return (
    <SceneFrame
      title="Check-in"
      sky="violet"
      dots={{ n: STEPS.length, i, label: step === 'end' ? 'All done' : 'Step ' + (i + 1) + ' of ' + STEPS.length }}
      onBack={step !== 'end' && hist.length ? back : null}
      onClose={close}
      footer={footer}>
      <Appear key={step} x={step === 'm' && !hist.length ? 0 : 36 * dir} by={0} duration={280} style={s.stage}>
        {body}
      </Appear>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  /* each step fills the card, so its Dock still sits at the bottom */
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', minHeight: 180 },
  pts: { fontFamily: font.display, fontSize: 18 },
  foot: { alignSelf: 'stretch' },
  /* keeps the slider in the same place before and after Next shows */
  btnSpace: { height: 52 },
  tiles: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 2,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
  },
  tileV: { fontFamily: font.display, fontSize: 26 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', padding: 14, borderRadius: 18 },
  nextIc: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
