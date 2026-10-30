/* The evening check-in for one day: three honest 0 to 10 ratings (mood, urges, stress), whether you reached out, and one
   line. A day saved before October 24, 2026 keeps and shows its own ratings (motivation, connection, energy), and editing it
   keeps them too (core rateKeys). Once saved it shows as a summary with Edit. Used on a day in the Journal. On Today
   (`scene`), the form is the full-screen check-in (app/checkin.tsx) instead, and this shows only its start button or the
   saved summary. Ported from the legacy checkinBlock. */
import { checkinAnswered, checkinFormOf, checkinLine, checkinSaveText, rateKeys, ratingOf, saveCheckin, type CheckinForm, type DayKey } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';

import { Field } from '@/components/choices';
import { Rate, YesNo } from '@/components/form';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { loadDrafts, saveDraft } from '@/lib/drafts';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export function CheckinBlock({
  dkey,
  isToday,
  onSaved,
  onCancel,
  scene,
}: {
  dkey: DayKey;
  isToday: boolean;
  onSaved?: () => void;
  /** the page around it shows the saved answers, and its Edit opens this form directly; Cancel goes back to them */
  onCancel?: () => void;
  scene?: boolean;
}) {
  const c = useTheme();
  const { snap, tk, update, say } = useStore();
  const st = snap.settings!;
  const saved = snap.days[dkey]?.checkin;
  const done = !!(saved && saved.done);
  const [editing, setEditing] = useState(!!onCancel);
  const [form, setForm] = useState<CheckinForm>(() => checkinFormOf(snap.days, dkey));
  const [drafted, setDrafted] = useState(false);

  /* a draft from before comes back */
  useEffect(() => {
    let on = true;
    loadDrafts().then((d) => {
      if (on && d[dkey]) {
        setForm({ md: null, u: null, ...d[dkey] });
        setDrafted(true);
      }
    });
    return () => {
      on = false;
    };
  }, [dkey]);

  const touch = (f: CheckinForm) => {
    setForm(f);
    setDrafted(true);
    saveDraft(dkey, f, tk);
  };

  if (done && !editing && !drafted) {
    const tile = (v: number | null, l: string) => (
      <View key={l} style={[s.tile, { backgroundColor: c.surface2 }]}>
        <Text style={[s.tileV, { color: c.ink }]}>{v == null ? '–' : v}</Text>
        <T v="small" tone="muted">
          {l}
        </T>
      </View>
    );
    const line = checkinLine(snap.days, dkey, saved!);
    return (
      <View style={{ gap: 10 }}>
        <View style={s.between}>
          <T v="label" tone="mintText">
            ✓ Day logged
          </T>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              if (scene) return router.push({ pathname: '/checkin', params: { k: dkey } });
              setForm(checkinFormOf(snap.days, dkey));
              setEditing(true);
            }}>
            <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>Edit</Text>
          </Pressable>
        </View>
        <View style={s.tiles}>{rateKeys(saved!).map((k) => tile(saved![k] ?? null, ratingOf(k).name))}</View>
        {line ? (
          <T v="small" tone="muted">
            {line}
          </T>
        ) : null}
        {saved!.n ? <T style={{ fontStyle: 'italic' }}>“{saved!.n}”</T> : null}
      </View>
    );
  }

  if (scene)
    return (
      <View style={{ gap: 10 }}>
        <T v="small" tone="muted">
          Three quick numbers about today, then Goodnight when the phone goes down. Under a minute.
        </T>
        <Button label={drafted ? 'Finish my check-in' : 'Check in'} icon="pencil" onPress={() => router.push({ pathname: '/checkin', params: { k: dkey } })} />
      </View>
    );

  const set = (k: keyof CheckinForm, v: unknown) => touch({ ...form, [k]: v } as CheckinForm);
  const save = () => {
    if (!checkinAnswered({ ...form, h: null })) {
      say('Answer at least one first.');
      return;
    }
    let msg = '';
    update((s0) => {
      /* sleep is set under Night and sleep on the day's page, so this keeps what is saved there */
      const days = saveCheckin(s0.days, dkey, { ...form, h: undefined });
      msg = checkinSaveText(days, s0.settings!, dkey, tk);
      return { ...s0, days };
    });
    saveDraft(dkey, null, tk);
    setDrafted(false);
    setEditing(false);
    buzz('save');
    say(msg);
    onSaved?.();
  };
  const cancel = () => {
    saveDraft(dkey, null, tk);
    setDrafted(false);
    setEditing(false);
    setForm(checkinFormOf(snap.days, dkey));
    onCancel?.();
  };
  return (
    <View style={{ gap: 14 }}>
      <T v="small" tone="muted">
        Give each one an honest 0 to 10. Do not round up to feel better.
      </T>
      {rateKeys(form).map((k) => {
        const R = ratingOf(k);
        return <Rate key={k} label={R.name} lo={R.lo} hi={R.hi} value={form[k] ?? null} onChange={(v) => set(k, v)} />;
      })}
      <YesNo label="Reached out to someone today?" value={form.ro} onPick={(v) => set('ro', form.ro === v ? null : v)} />
      <KeepAbove style={{ gap: 14 }}>
        <Field
          label="One line about the day (optional)"
          value={form.n}
          maxLength={200}
          placeholder="Rough day at work. Texted a friend."
          onChangeText={(t) => set('n', t)}
        />
        <Button label={done ? 'Update check-in' : isToday ? 'Save today' : 'Save this day'} onPress={save} />
      </KeepAbove>
      {done ? (
        <Pressable accessibilityRole="button" onPress={cancel} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.accentText, textDecorationLine: 'underline' }}>Cancel changes</Text>
        </Pressable>
      ) : null}
      <T v="small" tone="muted">
        If something happened, log it first. A slip is data, not a reset.
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { flexGrow: 1, flexBasis: '22%', alignItems: 'center', paddingVertical: 12, borderRadius: 12, gap: 2 },
  tileV: { fontFamily: font.display, fontSize: 22 },
});
