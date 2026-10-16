/* The small editors that open over a lesson and live in My plan: my reasons (the short box), my slip plan, and my urge plan.
   Every change saves right away. Ported from the legacy lessonRbox, slipEditor and urgeEditor. */
import { REASON_LEN, saveReason, saveSlip, setPlanRow, SLIP_LEN, SLIP_MAX, slipClean, slipIsStarter, slipSteps, resetSlip } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Field } from '@/components/choices';
import { Button, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** the reasons box inside a lesson: the list with Edit, and one box to write a new line or change one */
export function ReasonsBox({ onDraft }: { onDraft?: (save: () => boolean) => void }) {
  const c = useTheme();
  const { snap, apply } = useStore();
  const st = snap.settings!;
  const rs = st.reasons || [];
  const [edit, setEdit] = useState<number | null>(null);
  const [editText, setEditText] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState<{ t: string; ok: boolean }>({ t: '', ok: true });
  const save = () => {
    const r = saveReason(st, editText, draft, null, 'lesson');
    if (!r.ok) {
      setMsg({ t: r.toast, ok: false });
      return false;
    }
    apply({ st: r.st });
    setEdit(null);
    setEditText(null);
    setDraft('');
    setMsg({ t: r.toast, ok: true });
    return true;
  };
  /* a line typed here is kept when the person moves on (the lesson asks this box to save it first) */
  const ref = useRef(save);
  ref.current = save;
  useEffect(() => {
    onDraft?.(() => (draft.trim() ? ref.current() : true));
  }, [draft, onDraft]);
  const label = edit != null ? 'Change reason ' + (edit + 1) : rs.length ? 'Add another' : 'Write one true line';
  return (
    <View style={[s.box, { backgroundColor: c.surface2 }]}>
      <T v="small" tone="muted" style={{ fontFamily: font.bodyBold, letterSpacing: 0.6 }}>
        MY REASONS
      </T>
      {rs.length ? (
        rs.map((t, i) => (
          <View key={i} style={[s.rs, { borderColor: edit === i ? c.accent : 'transparent', backgroundColor: c.surface }]}>
            <T style={{ flex: 1 }}>{t}</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Edit reason ' + (i + 1)}
              onPress={() => {
                setEdit(i);
                setEditText(t);
                setDraft(t);
                setMsg({ t: '', ok: true });
              }}
              style={s.edit}>
              <Icon name="pencil" size={16} color={c.accentText} />
              <Text style={{ fontFamily: font.bodySemi, color: c.accentText }}>Edit</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <T v="small" tone="muted">
          Nothing here yet.
        </T>
      )}
      <Field label={label} multiline maxLength={REASON_LEN} value={draft} onChangeText={setDraft} placeholder="I want to…" />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Button label="Save" onPress={save} />
        </View>
        {edit != null ? (
          <View style={{ flex: 1 }}>
            <Button
              kind="ghost"
              label="Cancel"
              onPress={() => {
                setEdit(null);
                setEditText(null);
                setDraft('');
                setMsg({ t: '', ok: true });
              }}
            />
          </View>
        ) : null}
      </View>
      {msg.t ? (
        <T v="small" tone={msg.ok ? 'mintText' : 'danger'} accessibilityLiveRegion="polite">
          {msg.t}
        </T>
      ) : null}
    </View>
  );
}

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
        Read this now, while it is calm. A slip is data, not a reset. These are your steps: change them so they sound like you. After you log a slip, they show on Today. Changes save as you type.
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

/** my urge plan: if this, then I will */
export function UrgeEditor() {
  const { snap, apply } = useStore();
  const st = snap.settings!;
  return (
    <View style={{ gap: 12 }}>
      <T v="small" tone="muted">
        When an urge hits, Daybook offers this plan as one of the tools. Make each line sound like you. Changes save as you type.
      </T>
      {st.plan.map((r, i) => (
        <View key={i} style={{ gap: 6 }}>
          <Field label="If" maxLength={120} value={r.when} onChangeText={(v) => apply({ st: setPlanRow(snap.settings!, i, 'when', v) })} />
          <Field label="Then I will" multiline maxLength={400} value={r.then} onChangeText={(v) => apply({ st: setPlanRow(snap.settings!, i, 'then', v) })} />
        </View>
      ))}
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
  box: { gap: 8, padding: 12, borderRadius: 16 },
  rs: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 2 },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 6 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  confirm: { gap: 8, padding: 12, borderRadius: 14 },
  sq: { width: 44, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
