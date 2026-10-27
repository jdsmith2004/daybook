/* The evening check-in: three quick numbers, then Goodnight. Mood, urges and stress, one at a time, each an honest 0 to 10 on
   a slider low on the screen where the thumb is, with the number big in the open middle. Then one screen under the night
   sky: "Tap this when you put your phone down", and one big Goodnight button saves the check-in, puts the phone away (what
   "Putting my phone away" in the wind-down records: core sayGoodnight) and plays the going-to-bed moment
   (components/goodnight.tsx). Above the button, folded rows: More (sleep last night in hours, kept in checkin.h, which the
   Sunday sleep goal and the week read; whether you reached out; one line), the wind-down list, and the plan for a loud
   night with SOS. "Save for now" under the button saves without the phone going away, for a check-in done early.
   A day before today (`k`) ends with Save instead, and no Goodnight.
   Answers are kept as a draft on this device until saved (lib/drafts), so closing halfway loses nothing. Opened from the
   Check-in stop in "Your day"; `k` picks the day (today when left out). */
import {
  ASKED,
  checkinAnswered,
  checkinFormOf,
  checkinSaveText,
  fmtClock,
  gameCompute,
  rateKeys,
  ratingOf,
  rhythm,
  saveCheckin,
  stopStatus,
  windLine,
  type CheckinForm,
  type DayKey,
  type RateKey,
} from '@daybook/core';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { DoneMark } from '@/components/done-mark';
import { Field, Link } from '@/components/choices';
import { CountUp } from '@/components/count-up';
import { FitArt } from '@/components/fit';
import { YesNo } from '@/components/form';
import { Fold, GoingToBed, GoodnightButton, LoudFold, useGoodnight, WindFold, type Bed } from '@/components/goodnight';
import { NightSky } from '@/components/night-sky';
import { TalkDoor } from '@/components/talk-card';
import { Dock, Middle, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { count } from '@/lib/pulse';
import { loadDrafts, saveDraft } from '@/lib/drafts';
import { close, closeAll } from '@/lib/nav';
import { setReminderPrefs, useReminderPrefs } from '@/lib/prefs';
import { allowReminders, remindersOffered } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { WORDS } from '@/lib/words';
import { font, useTheme } from '@/lib/theme';

/** the reminder offered after a check-in: about the time it was done, but never at night (core nudges.ts: Daybook never
    picks a night time on its own), so a check-in after 10 PM offers 10 PM, the latest time the setup offers */
const clockNear = (ms: number) => {
  const d = new Date(ms);
  const h = d.getHours();
  if (h >= 22 || h < 5) return '22:00';
  return String(h).padStart(2, '0') + ':' + String(Math.floor(d.getMinutes() / 15) * 15).padStart(2, '0');
};
/* the three numbers, then Goodnight (or, for a day before today, Save) */
const STEPS = [...ASKED, 'night'] as const;
type Step = (typeof STEPS)[number] | 'end';
const hoursText = (h: number) => (h % 1 ? h.toFixed(1) : String(h));
/* a few words under each question */
const HINT: Partial<Record<RateKey, string>> = {
  md: 'An honest 0 to 10. Do not round up to feel better.',
  u: 'Zero is fine, and so is ten. An urge is not a slip.',
};

export default function Checkin() {
  const c = useTheme();
  const { snap, tk, now, update, say } = useStore();
  const prefs = useReminderPrefs();
  const goodnight = useGoodnight();
  const st = snap.settings;
  const { k: kp } = useLocalSearchParams<{ k?: string }>();
  const k = (kp && kp <= tk ? kp : tk) as DayKey;
  const tonight = k === tk;
  const [form, setForm] = useState<CheckinForm>(() => checkinFormOf(snap.days, k));
  const [step, setStep] = useState<Step>('md');
  const [hist, setHist] = useState<Step[]>([]);
  /* which way the steps slide: forward from the right, Back from the left */
  const [dir, setDir] = useState(1);
  const [msg, setMsg] = useState('');
  const [bed, setBed] = useState<Bed | null>(null);
  /* the folded rows on the Goodnight screen: all closed at first */
  const [fold, setFold] = useState<'more' | 'wind' | 'loud' | null>(null);
  const [pts0] = useState(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).pts : 0));

  /* a draft from before comes back */
  useEffect(() => {
    let on = true;
    loadDrafts().then((d) => {
      /* a draft from before mood and urges were asked has neither; one from before sleep was asked keeps the saved hours */
      if (on && d[k]) setForm({ md: null, u: null, ...d[k] });
    });
    return () => {
      on = false;
    };
  }, [k]);

  if (!st) return <Redirect href="/" />;
  /* the reminder offer (no reminder yet: the setup's "Not now", or none asked), at about the time this check-in was done */
  const remAt = clockNear(now);
  const offer =
    remindersOffered && !prefs.checkin && tonight ? (
      <Chip
        label={'Remind me at ' + fmtClock(remAt) + ' each day'}
        on={false}
        onPress={async () => {
          const ok = await allowReminders();
          if (ok) {
            setReminderPrefs({ ...prefs, checkin: true, checkinAt: remAt });
            say('Daybook will remind you at ' + fmtClock(remAt) + ', unless you have checked in already.');
          } else say(WORDS.notifyOff);
        }}
      />
    ) : null;

  if (bed) return <GoingToBed bed={bed} extra={offer ? <View style={s.offer}>{offer}</View> : null} />;

  const go = (next: Step) => {
    setHist((h) => h.concat(step));
    setDir(1);
    setStep(next);
  };
  const next = () => go(STEPS[STEPS.indexOf(step as (typeof STEPS)[number]) + 1] || 'night');
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
  const any = checkinAnswered(form);
  /* Save: the check-in alone (a day before today, or "Save for now" tonight) */
  const save = () => {
    let text = '';
    update((s0) => {
      const days = saveCheckin(s0.days, k, form);
      text = checkinSaveText(days, s0.settings!, k, tk);
      return { ...s0, days };
    });
    saveDraft(k, null, tk);
    count('checkin');
    buzz('lit');
    setMsg(text);
    setHist([]);
    setDir(1);
    setStep('end');
  };
  /* Goodnight: the check-in (when anything is answered) and the phone away, in one tap */
  const sayGoodnight = () => {
    const b = goodnight(any ? form : null);
    saveDraft(k, null, tk);
    if (any) count('checkin');
    setBed(b);
  };

  const i = step === 'end' ? STEPS.length : STEPS.indexOf(step);
  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (step === 'md' || step === 'u' || step === 's') {
    const R = ratingOf(step);
    const v = form[step] ?? null;
    body = (
      <>
        <T v="eyebrow" tone="muted">
          {R.name}
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {R.q}
        </T>
        {HINT[step] ? (
          <T style={s.c} tone="muted">
            {HINT[step]}
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
  } else if (step === 'night') {
    const r = rhythm(snap.days, st, tk, now);
    const toggle = (f: 'more' | 'wind' | 'loud') => setFold(fold === f ? null : f);
    const more = (
      <More
        form={form}
        set={set}
        tonight={tonight}
        open={!tonight || fold === 'more'}
        onToggle={() => toggle('more')}
        fixed={!tonight}
        saveBtn={tonight ? null : any ? <Button label="Save this day" onPress={save} /> : null}
      />
    );
    body = tonight ? (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          {any ? 'Alright. That is today.' : 'Alright. Time for bed.'}
        </T>
        <T style={s.c} tone="muted">
          {windLine(st, r.leftToOff, snap.days[tk]?.p)}
        </T>
        {/* the night sky in the open middle; it steps aside on a short phone or when a row opens, so Goodnight stays in reach */}
        <Middle>
          <FitArt drop={0.55}>
            <NightSky />
          </FitArt>
        </Middle>
        <Dock>
          {form.md != null && form.md <= 3 ? <TalkDoor line="A heavy day is a state, not who you are. Talk it through before tonight." /> : null}
          {more}
          <WindFold open={fold === 'wind'} onToggle={() => toggle('wind')} />
          <LoudFold open={fold === 'loud'} onToggle={() => toggle('loud')} />
          <T style={[s.c, s.tap]}>Tap this when you put your phone down.</T>
          <GoodnightButton onPress={sayGoodnight} />
        </Dock>
      </>
    ) : (
      <>
        <T v="eyebrow" tone="muted">
          More
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Anything else about this day?
        </T>
        <Dock>
          {more}
          {any ? null : (
            <T v="small" tone="muted" style={s.c}>
              Go back and answer at least one, then save.
            </T>
          )}
        </Dock>
      </>
    );
    footer = tonight && any ? <Link label="Save for now, and say goodnight later" onPress={save} /> : null;
  } else {
    const g = gameCompute(snap.days, st, snap.reviews, tk);
    const gain = Math.max(0, g.pts - pts0);
    const r = tonight ? rhythm(snap.days, st, tk, now) : null;
    const wind = r && r.stops.find((x) => x.k === 'night' && !x.done);
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
          {rateKeys(form).map((f, j) => (
            <Appear key={f} delay={360 + j * 70} by={14} style={[s.tile, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <Text style={[s.tileV, { color: c.ink }]}>{form[f] == null ? '–' : form[f]}</Text>
              <T v="small" tone="muted">
                {ratingOf(f).name}
              </T>
            </Appear>
          ))}
        </View>
        {form.md != null && form.md <= 3 ? (
          <Appear delay={640} style={{ alignSelf: 'stretch' }}>
            <TalkDoor line="A heavy day is a state, not who you are. Talk it through before tonight." />
          </Appear>
        ) : null}
        {wind && r ? (
          <Appear delay={700} style={[s.next, { backgroundColor: c.surface }]}>
            <View style={[s.nextIc, { backgroundColor: c.violetSoft }]}>
              <Icon name="moon" size={18} color={c.violetText} />
            </View>
            <T style={{ flex: 1 }}>
              <T v="label">Next: Goodnight, when the phone goes down.</T> {stopStatus(wind, r.windMin)}.
            </T>
          </Appear>
        ) : null}
        <Dock>
          {offer}
          <Button label="Done" onPress={closeAll} />
        </Dock>
      </>
    );
    footer = null;
  }

  return (
    <SceneFrame
      title={step === 'night' && tonight ? 'Good night' : 'Check-in'}
      sky={step === 'night' && tonight ? 'night' : 'violet'}
      dots={{ n: STEPS.length, i, label: step === 'end' ? 'All done' : 'Step ' + (i + 1) + ' of ' + STEPS.length }}
      onBack={step !== 'end' && hist.length ? back : null}
      onClose={close}
      footer={footer}>
      <Appear key={step} x={step === 'md' && !hist.length ? 0 : 36 * dir} by={0} duration={280} style={s.stage}>
        {body}
      </Appear>
    </SceneFrame>
  );
}

/** More: sleep last night, reached out, and one line. Folded on the Goodnight screen; open, with Save, for a day before
    today (`fixed`). The line and its Save stay together above the keyboard. */
function More({
  form,
  set,
  tonight,
  open,
  onToggle,
  fixed,
  saveBtn,
}: {
  form: CheckinForm;
  set: (f: CheckinForm) => void;
  tonight: boolean;
  open: boolean;
  onToggle: () => void;
  fixed: boolean;
  saveBtn: React.ReactNode;
}) {
  const said = [form.h != null ? 'Slept ' + hoursText(form.h) + ' h' : '', form.ro === 'Y' ? 'Reached out' : '', form.n.trim() ? 'A line' : '']
    .filter(Boolean)
    .join(' · ');
  const inside = (
    <>
      <T v="label">{tonight ? 'Sleep last night' : 'Sleep the night before'}</T>
      <Slider
        label="Hours of sleep"
        value={form.h ?? null}
        min={3}
        max={12}
        step={0.5}
        show={hoursText}
        unit="hours"
        hint="A guess is fine"
        onChange={(n) => set({ ...form, h: n })}
      />
      <YesNo
        label={tonight ? 'Reached out to someone today?' : 'Reached out to someone that day?'}
        value={form.ro}
        onPick={(v) => set({ ...form, ro: form.ro === v ? null : v })}
      />
      <KeepAbove style={{ alignSelf: 'stretch', gap: 12 }}>
        <Field
          label="One line about the day (optional)"
          multiline
          maxLength={200}
          value={form.n}
          placeholder="Rough day at work. Texted a friend."
          onChangeText={(t) => set({ ...form, n: t })}
        />
        {saveBtn}
      </KeepAbove>
    </>
  );
  if (fixed) return <View style={s.moreOpen}>{inside}</View>;
  return (
    <Fold icon="pencil" title="More about today" sub={said || 'Sleep, reaching out, one line'} open={open} onToggle={onToggle}>
      {inside}
    </Fold>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  /* each step fills the card, so its Dock still sits at the bottom */
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', minHeight: 180 },
  tap: { fontFamily: font.bodySemi, marginTop: 4 },
  pts: { fontFamily: font.display, fontSize: 18 },
  offer: { alignItems: 'center' },
  moreOpen: { alignSelf: 'stretch', gap: 12 },
  /* keeps the slider in the same place before and after Next shows */
  btnSpace: { height: 52 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' },
  tile: {
    flexGrow: 1,
    flexBasis: '22%',
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
