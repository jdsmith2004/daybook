/* The slip plan editor in My plan: my own steps, in order. Every change saves right away. Ported from the legacy slipEditor. */
import { saveSlip, SLIP_LEN, SLIP_MAX, slipClean, slipIsStarter, slipSteps, resetSlip } from '@daybook/core';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Field } from '@/components/choices';
import { Button, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** if I slip: my own steps, in order. Blank steps stay on screen until filled in, and are never saved. */
export function SlipEditor() {
  const c = useTheme();
  const { snap, apply, say } = useStore();
  const st = snap.settings!;
  const saved = slipSteps(st);
  const [rows, setRows] = useState<string[]>(() => saved.slice());
  const [del, setDel] = useState<number | null>(null);
  const [ask, setAsk] = useState(false);
  /* the saved list changed some other way: show it */
  useEffect(() => {
    if (slipClean(rows).join('\n') !== saved.join('\n')) setRows(saved.slice());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved.join('\n')]);
  const put = (next: string[]) => {
    setRows(next);
    apply({ st: saveSlip(st, next) });
  };
  const n = rows.length;
  const filled = slipClean(rows).length;
  const mv = (i: number, j: number) => {
    if (!(i >= 0 && i < n && j >= 0 && j < n)) return;
    const next = rows.slice();
    const x = next[i];
    next[i] = next[j];
    next[j] = x;
    setDel(null);
    put(next);
  };
  return (
    <View style={{ gap: 12 }}>
      <View style={s.between}>
        <T v="h2">If I slip</T>
        <T v="small" tone="muted">
          {filled} of {SLIP_MAX} steps
        </T>
      </View>
      <T v="small" tone="muted">
        Read this now, while it is calm. A slip is data, not a reset. These are your steps: change them so they sound like you. After you log a slip, they show
        on Today. Changes save as you type.
      </T>
      {!n ? <T tone="muted">No steps yet. Add one, or go back to the starter plan.</T> : null}
      {rows.map((t, i) =>
        del === i && t.trim() ? (
          <View key={i} style={[s.confirm, { backgroundColor: c.dangerSoft }]}>
            <T>
              <Text style={{ fontFamily: font.bodyBold }}>Step {i + 1}.</Text> {t}
            </T>
            <T v="label">Remove this step?</T>
            <View style={s.row}>
              <Button
                kind="danger"
                label="Yes, remove it"
                onPress={() => {
                  setDel(null);
                  put(rows.filter((_, k) => k !== i));
                }}
              />
              <Button kind="ghost" label="Keep it" onPress={() => setDel(null)} />
            </View>
          </View>
        ) : (
          <View key={i} style={{ gap: 6 }}>
            <Field
              label={'Step ' + (i + 1)}
              multiline
              maxLength={SLIP_LEN}
              value={t}
              placeholder="What I will do after a slip"
              onChangeText={(v) => put(rows.map((x, k) => (k === i ? v : x)))}
            />
            <View style={s.row} accessibilityLabel={`Step ${i + 1} of ${n}`}>
              <Sq icon="up" label={`Move step ${i + 1} up`} off={i === 0} onPress={() => mv(i, i - 1)} />
              <Sq icon="down" label={`Move step ${i + 1} down`} off={i === n - 1} onPress={() => mv(i, i + 1)} />
              <Sq
                icon="trash"
                label={`Remove step ${i + 1}`}
                danger
                onPress={() => {
                  if (!t.trim()) put(rows.filter((_, k) => k !== i));
                  else setDel(i);
                }}
              />
            </View>
          </View>
        ),
      )}
      <Button
        kind="ghost"
        icon="plus"
        label="Add a step"
        disabled={n >= SLIP_MAX}
        onPress={() => {
          setAsk(false);
          setDel(null);
          setRows(rows.concat(''));
        }}
      />
      {n >= SLIP_MAX ? (
        <T v="small" tone="muted">
          That is the most steps. Shorter is easier to follow on a hard night.
        </T>
      ) : null}
      {ask ? (
        <View style={[s.confirm, { backgroundColor: c.dangerSoft }]}>
          <T v="label">Replace my steps with the starter plan?</T>
          <View style={s.row}>
            <Button
              kind="danger"
              label="Yes, replace them"
              onPress={() => {
                const r = resetSlip(st);
                setAsk(false);
                setDel(null);
                setRows(r.st.slipPlan.slice());
                apply(r);
                say(r.toast!);
              }}
            />
            <Button kind="ghost" label="Keep mine" onPress={() => setAsk(false)} />
          </View>
        </View>
      ) : slipIsStarter(rows) ? null : (
        <Pressable accessibilityRole="button" onPress={() => setAsk(true)} style={{ alignSelf: 'center', minHeight: 40, justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>Go back to the starter plan</Text>
        </Pressable>
      )}
    </View>
  );
}

function Sq({ icon, label, off, danger, onPress }: { icon: string; label: string; off?: boolean; danger?: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!off }}
      disabled={off}
      onPress={onPress}
      style={[s.sq, { borderColor: c.line, backgroundColor: c.surface, opacity: off ? 0.4 : 1 }]}>
      <Icon name={icon} size={18} color={danger ? c.danger : c.ink} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  confirm: { gap: 8, padding: 12, borderRadius: 14 },
  sq: { width: 44, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
