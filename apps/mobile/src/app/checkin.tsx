/* The check-in of a day before today, opened from that day's page (`k`): the same three one-tap rows as Bedtime (mood, urges,
   stress), with what a day page can still fill in under them (sleep the night before, whether you reached out, one line),
   on one screen, then Save. Tonight's check-in is Bedtime (app/bedtime.tsx, October 25, 2026): without a day before today,
   this opens Bedtime. Answers are kept as a draft on this device until saved (lib/drafts). */
import { checkinAnswered, checkinFormOf, checkinSaveText, fmtDate, saveCheckin, type CheckinForm, type DayKey } from '@daybook/core';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { BedRows } from '@/components/bed-rows';
import { Field } from '@/components/choices';
import { DoneMark } from '@/components/done-mark';
import { YesNo } from '@/components/form';
import { KeepAbove } from '@/components/keyboard';
import { Dock, SceneFrame } from '@/components/scene';
import { Slider } from '@/components/slider';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { loadDrafts, saveDraft } from '@/lib/drafts';
import { close } from '@/lib/nav';
import { count } from '@/lib/pulse';
import { useStore } from '@/lib/store';

const hoursText = (h: number) => (h % 1 ? h.toFixed(1) : String(h));

export default function Checkin() {
  const { snap, tk, update } = useStore();
  const { k: kp } = useLocalSearchParams<{ k?: string }>();
  const k = (kp && kp < tk ? kp : null) as DayKey | null;
  const [form, setForm] = useState<CheckinForm>(() => checkinFormOf(snap.days, k || tk));
  const [msg, setMsg] = useState<string | null>(null);

  /* a draft from before comes back */
  useEffect(() => {
    let on = true;
    if (k)
      loadDrafts().then((d) => {
        if (on && d[k]) setForm((f) => ({ ...f, md: null, u: null, ...d[k] }));
      });
    return () => {
      on = false;
    };
  }, [k]);

  if (!k) return <Redirect href="/bedtime" />;
  if (!snap.settings) return <Redirect href="/" />;
  const set = (f: CheckinForm) => {
    setForm(f);
    saveDraft(k, f, tk);
  };
  const any = checkinAnswered(form);
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
  };

  if (msg != null)
    return (
      <SceneFrame title="Check-in" sky="night" onClose={close}>
        <View style={s.mid}>
          <DoneMark />
          <Appear delay={180} style={{ alignItems: 'center', gap: 6 }}>
            <T v="title" style={s.c} accessibilityRole="header">
              Day logged.
            </T>
            <T style={s.c}>{msg}</T>
          </Appear>
        </View>
        <Dock>
          <Button label="Done" onPress={close} />
        </Dock>
      </SceneFrame>
    );

  return (
    <SceneFrame title="Check-in" sky="night" onClose={close}>
      <T v="eyebrow" tone="muted">
        {fmtDate(k, { weekday: 'long', month: 'long', day: 'numeric' })}
      </T>
      <T v="title" style={s.c} accessibilityRole="header">
        How did that day go?
      </T>
      {/* the text box and its Save stay together near the top while typing (the keyboard covers the bottom) */}
      <KeepAbove style={s.line}>
        <Field
          label="One line about the day (optional)"
          multiline
          maxLength={200}
          value={form.n}
          placeholder="Rough day at work. Texted a friend."
          onChangeText={(t) => set({ ...form, n: t })}
        />
      </KeepAbove>
      <Dock>
        <BedRows form={form} onChange={set} />
        <Slider
          label="Sleep the night before"
          value={form.h ?? null}
          min={3}
          max={12}
          step={0.5}
          show={hoursText}
          unit="hours"
          hint="A guess is fine"
          onChange={(n) => set({ ...form, h: n })}
        />
        <YesNo label="Reached out to someone that day?" value={form.ro} onPick={(v) => set({ ...form, ro: form.ro === v ? null : v })} />
        <Button label="Save this day" onPress={save} disabled={!any} />
      </Dock>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 14 },
  line: { alignSelf: 'stretch', gap: 10 },
});
