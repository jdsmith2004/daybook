/* The evening check-in: a one-minute full-screen moment, one question at a time, like the sunrise check. Four honest 0 to 10
   numbers (a tap moves on), whether you reached out, one optional line, then the day as it is saved and what comes next.
   Answers are kept as a draft on this device until saved (lib/drafts), so closing halfway loses nothing. Opened from the
   Check-in stop in "Your day"; `k` picks the day (today when left out). */
import {
  checkinFormOf,
  checkinSaveText,
  gameCompute,
  rhythm,
  saveCheckin,
  stopStatus,
  type CheckinForm,
  type DayKey,
} from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BigOption, Field, Link } from '@/components/choices';
import { PickRow, type PickOpt } from '@/components/picks';
import { SceneFrame } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { loadDrafts, saveDraft } from '@/lib/drafts';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Rated = 'm' | 'c' | 'e' | 's';
const RATE: Record<Rated, { name: string; q: string; lo: string; hi: string }> = {
  m: { name: 'Motivation', q: 'How much motivation did you have today?', lo: 'none', hi: 'lots' },
  c: { name: 'Connection', q: 'How close did you feel to people today?', lo: 'distant', hi: 'close' },
  e: { name: 'Energy', q: 'How much energy did you have?', lo: 'drained', hi: 'full' },
  s: { name: 'Stress', q: 'How much stress did you feel?', lo: 'calm', hi: 'high' },
};
const STEPS = ['m', 'c', 'e', 's', 'ro', 'n'] as const;
type Step = (typeof STEPS)[number] | 'end';
const LOW: PickOpt<number>[] = [0, 1, 2, 3, 4, 5].map((n) => ({ k: n, label: String(n) }));
const HIGH: PickOpt<number>[] = [6, 7, 8, 9, 10].map((n) => ({ k: n, label: String(n) }));

export default function Checkin() {
  const c = useTheme();
  const { snap, tk, now, update } = useStore();
  const st = snap.settings;
  const { k: kp } = useLocalSearchParams<{ k?: string }>();
  const k = (kp && kp <= tk ? kp : tk) as DayKey;
  const [form, setForm] = useState<CheckinForm>(() => checkinFormOf(snap.days, k));
  const [step, setStep] = useState<Step>('m');
  const [hist, setHist] = useState<Step[]>([]);
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
    setStep(next);
  };
  const next = () => go(STEPS[STEPS.indexOf(step as (typeof STEPS)[number]) + 1] || 'n');
  const back = () => {
    const h = hist.slice();
    const p = h.pop();
    if (!p) return;
    setHist(h);
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
    setStep('end');
  };

  const i = step === 'end' ? STEPS.length : STEPS.indexOf(step);
  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (step === 'm' || step === 'c' || step === 'e' || step === 's') {
    const R = RATE[step];
    const pick = (v: number) => {
      set({ ...form, [step]: v });
      setTimeout(next, 220);
    };
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
        <View style={s.grid}>
          <PickRow big label={R.name + ', 0 to 5'} list={LOW} cur={form[step]} onPick={pick} />
          <PickRow big label={R.name + ', 6 to 10'} list={HIGH} cur={form[step]} onPick={pick} />
          <View style={s.ends}>
            <T v="small" tone="muted">
              0 · {R.lo}
            </T>
            <T v="small" tone="muted">
              {R.hi} · 10
            </T>
          </View>
        </View>
      </>
    );
    footer = <Link label={form[step] == null ? 'Skip this one' : 'Next'} onPress={next} />;
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
        <View style={s.opts}>
          <BigOption tone="mint" icon="chat" title="Yes" selected={form.ro === 'Y'} onPress={() => pick('Y')} />
          <BigOption tone="sun" icon="leaf" title="Not today" sub="Tomorrow is another chance." selected={form.ro === 'N'} onPress={() => pick('N')} />
        </View>
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
        <View style={{ alignSelf: 'stretch', gap: 12 }}>
          <Field
            label="One line about the day (optional)"
            hideLabel
            multiline
            maxLength={200}
            value={form.n}
            placeholder="Rough day at work. Texted a friend."
            onChangeText={(t) => set({ ...form, n: t })}
          />
          {any ? null : (
            <T v="small" tone="muted" style={s.c}>
              Go back and answer at least one, then save.
            </T>
          )}
          <T v="small" tone="muted" style={s.c}>
            If something happened today, log it too. A slip is data, not a reset.
          </T>
        </View>
      </>
    );
    footer = any ? (
      <View style={s.foot}>
        <Button label={k === tk ? 'Save today' : 'Save this day'} onPress={save} />
      </View>
    ) : null;
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
        <View style={[s.badge, { backgroundColor: c.mintSoft }]}>
          <Icon name="check" size={36} color={c.mintText} />
        </View>
        <T v="title" style={s.c} accessibilityRole="header">
          Day logged.
        </T>
        <T style={s.c}>
          {msg}
          {gain ? <T v="label" tone="mintText">{`  +${gain} points`}</T> : null}
        </T>
        <View style={s.tiles}>{[tile(form.m, 'Motivation'), tile(form.c, 'Connection'), tile(form.e, 'Energy'), tile(form.s, 'Stress')]}</View>
        {wind && r ? (
          <View style={[s.next, { backgroundColor: c.surface }]}>
            <Icon name="moon" size={20} color={c.violetText} />
            <T style={{ flex: 1 }}>
              <T v="label">Next: the wind-down.</T> {stopStatus(wind, r.windMin)}.
            </T>
          </View>
        ) : null}
      </>
    );
    footer = (
      <View style={s.foot}>
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
      {body}
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  foot: { alignSelf: 'stretch' },
  grid: { alignSelf: 'stretch', gap: 8 },
  ends: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
  opts: { width: '100%', gap: 10 },
  badge: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  tiles: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  tile: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, gap: 2 },
  tileV: { fontFamily: font.display, fontSize: 22 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', padding: 14, borderRadius: 16 },
});
