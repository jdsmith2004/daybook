/* My reasons: write, edit, order and read them. Nothing is saved while typing: Save and Add are explicit, so a half-written line
   never shows up on Today. Ported from the legacy viewReasons and reasonAction. */
import { moveReason, RCATS, REASON_LEN, REASON_MAX, reasonCat, reasonIdeas, removeReason, saveReason, setField } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';

import { Field } from '@/components/choices';
import { Collapse } from '@/components/form';
import { Screen } from '@/components/screen';
import { Button, Card, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme } from '@/lib/theme';

type CatId = (typeof RCATS)[number]['id'];

function CatChips({ cur, onPick, label }: { cur: string | null; onPick: (id: CatId) => void; label: string }) {
  const c = useTheme();
  return (
    <View style={s.chips} accessibilityLabel={label}>
      {RCATS.map((k) => {
        const t = toneOf(c, k.tone);
        const on = cur === k.id;
        return (
          <Pressable
            key={k.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onPick(k.id)}
            style={[s.cat, { backgroundColor: on ? t.soft : c.surface, borderColor: on ? t.ic : c.line }]}>
            <Icon name={k.ic} size={16} color={on ? t.text : c.muted} />
            <Text style={{ fontFamily: font.bodySemi, color: on ? t.text : c.ink }}>{k.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SmallBtn({
  icon,
  label,
  onPress,
  disabled,
  danger,
  text,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  text?: string;
}) {
  const c = useTheme();
  const col = disabled ? c.line : danger ? c.danger : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.sb, { borderColor: c.line }, text ? { paddingHorizontal: 12 } : { width: 44 }]}>
      <Icon name={icon} size={18} color={col} />
      {text ? <Text style={{ fontFamily: font.bodySemi, color: col }}>{text}</Text> : null}
    </Pressable>
  );
}

export default function Reasons() {
  const params = useLocalSearchParams<{ from?: string }>();
  const c = useTheme();
  const { snap, apply, say } = useStore();
  const [edit, setEdit] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [editText, setEditText] = useState('');
  const [editCat, setEditCat] = useState<string | null>(null);
  const [del, setDel] = useState<number | null>(null);
  const [add, setAdd] = useState('');
  const [addCat, setAddCat] = useState<string | null>(null);
  const [addKey, setAddKey] = useState(0);
  const [why, setWhy] = useState(false);
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const rs = st.reasons;
  const n = rs.length;

  const startEdit = (i: number) => {
    if (edit != null && edit !== i && draft.replace(/\s+/g, ' ').trim() !== editText) {
      say('Save or cancel the edit you started first.');
      return;
    }
    setEdit(i);
    setDel(null);
    setDraft(rs[i]);
    setEditText(rs[i]);
    setEditCat(reasonCat(st, rs[i]).id);
  };
  const save = () => {
    const r = saveReason(st, editText, draft, editCat);
    if (!r.ok) return say(r.toast);
    apply({ st: r.st, toast: r.toast });
    setEdit(null);
  };
  const addIt = () => {
    const r = saveReason(st, null, add, addCat);
    if (!r.ok) return say(r.toast);
    apply({ st: r.st, toast: r.toast });
    setAdd('');
    setAddCat(null);
    setAddKey((k) => k + 1);
  };
  const back = params.from === 'lesson' ? 'Back to the lesson' : 'My plan';

  return (
    <Screen title="My reasons" sub={<T tone="muted">Why this matters to you. Read them when it gets hard.</T>} back={back}>
      <Card>
        <View style={s.top}>
          <View style={[s.topIc, { backgroundColor: c.sunSoft }]}>
            <Icon name="star" size={22} color={c.sunText} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="label">{n ? n + ' reason' + (n === 1 ? '' : 's') : 'No reasons yet'}</T>
            <T v="small" tone="muted">
              {n ? 'Read them one at a time, the way you will on a hard night.' : 'Start with one true line. That is enough.'}
            </T>
          </View>
        </View>
        {n ? <Button label="Read them" onPress={() => router.push({ pathname: '/tool/[id]', params: { id: 'reasons' } })} /> : null}
      </Card>

      {n ? (
        <Card>
          <View style={s.between}>
            <T v="h2">My list</T>
            <T v="small" tone="muted">
              {n} of {REASON_MAX}
            </T>
          </View>
          <T v="small" tone="muted">
            The first one shows first when you read them. Use the arrows to change the order.
          </T>
          {rs.map((text, i) => {
            const cat = reasonCat(st, text);
            const t = toneOf(c, cat.tone);
            const lab = 'reason ' + (i + 1);
            if (edit === i)
              return (
                <View key={i} style={[s.item, { borderColor: t.ic }]}>
                  {/* the group comes first, so the box and its Save stay together above the keyboard */}
                  <CatChips label="Group" cur={editCat} onPick={setEditCat} />
                  <KeepAbove style={{ gap: 10 }}>
                    <Field label={'Reason ' + (i + 1)} multiline maxLength={REASON_LEN} value={draft} onChangeText={setDraft} autoFocus />
                    <T v="small" tone="muted" style={{ alignSelf: 'flex-end' }}>
                      {draft.length} of {REASON_LEN}
                    </T>
                    <View style={s.row}>
                      <Button label="Save" onPress={save} />
                      <Button kind="ghost" label="Cancel" onPress={() => setEdit(null)} />
                    </View>
                  </KeepAbove>
                </View>
              );
            const head = (
              <View style={s.main}>
                <View style={[s.ic, { backgroundColor: t.soft }]}>
                  <Icon name={cat.ic} size={18} color={t.text} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="small" tone="muted">
                    {cat.name}
                    {i === 0 && n > 1 ? ' · shows first' : ''}
                  </T>
                  <T>{text}</T>
                </View>
              </View>
            );
            if (del === i)
              return (
                <View key={i} style={[s.item, { borderColor: c.line }]}>
                  {head}
                  <View style={[s.confirm, { backgroundColor: c.dangerSoft }]}>
                    <T v="label">Remove this reason?</T>
                    <View style={s.row}>
                      <Button
                        kind="danger"
                        label="Yes, remove it"
                        onPress={() => {
                          const r = removeReason(st, i);
                          setDel(null);
                          if (r) apply(r);
                        }}
                      />
                      <Button kind="ghost" label="Keep it" onPress={() => setDel(null)} />
                    </View>
                  </View>
                </View>
              );
            return (
              <View key={i} style={[s.item, { borderColor: c.line }]}>
                {head}
                <View style={s.row} accessibilityLabel={`Reason ${i + 1} of ${n}`}>
                  <SmallBtn icon="pencil" text="Edit" label={'Edit ' + lab} onPress={() => startEdit(i)} />
                  <SmallBtn
                    icon="up"
                    label={'Move ' + lab + ' up'}
                    disabled={i === 0}
                    onPress={() => {
                      const r = moveReason(st, i, -1);
                      if (r) apply(r);
                    }}
                  />
                  <SmallBtn
                    icon="down"
                    label={'Move ' + lab + ' down'}
                    disabled={i === n - 1}
                    onPress={() => {
                      const r = moveReason(st, i, 1);
                      if (r) apply(r);
                    }}
                  />
                  <SmallBtn
                    icon="trash"
                    danger
                    label={'Remove ' + lab}
                    onPress={() => {
                      setDel(i);
                      setEdit(null);
                    }}
                  />
                </View>
              </View>
            );
          })}
        </Card>
      ) : null}

      {n >= REASON_MAX ? (
        <Card>
          <T tone="muted">That is {REASON_MAX} reasons, the most Daybook holds. Edit or remove one to make room for a new one.</T>
        </Card>
      ) : (
        <>
          <Card>
            <T v="h2">{n ? 'Add another' : 'Add a reason'}</T>
            <T v="small" tone="muted">
              In your own words. Short and true beats long and fancy.
            </T>
            <CatChips label="Group, optional" cur={addCat} onPick={(id) => setAddCat(addCat === id ? null : id)} />
            <T v="small" tone="muted">
              Picking a group is optional. If you skip it, Daybook guesses.
            </T>
            <KeepAbove style={{ gap: 10 }}>
              <Field key={addKey} label="New reason" hideLabel multiline maxLength={REASON_LEN} value={add} placeholder="I want to…" onChangeText={setAdd} />
              <T v="small" tone="muted" style={{ alignSelf: 'flex-end' }}>
                {add.length} of {REASON_LEN}
              </T>
              <Button label="Add reason" disabled={!add.trim()} onPress={addIt} />
            </KeepAbove>
          </Card>
          {reasonIdeas(rs).length ? (
            <Card>
              <T v="h2">Need a spark?</T>
              <T v="small" tone="muted">
                Tap one to start from it, then change it until it sounds like you.
              </T>
              {reasonIdeas(rs).map(([x, k]) => (
                <Pressable
                  key={k}
                  accessibilityRole="button"
                  onPress={() => {
                    setAdd(x[0]);
                    setAddCat(x[1]);
                  }}
                  style={[s.idea, { borderColor: c.line }]}>
                  <Icon name="plus" size={16} color={c.accentText} />
                  <T style={{ flex: 1 }}>{x[0]}</T>
                </Pressable>
              ))}
            </Card>
          ) : null}
        </>
      )}

      <Collapse title="In my own words" sub="A longer why, if you want one" open={why} onToggle={() => setWhy(!why)}>
        <T v="small" tone="muted">
          Not required. A few sentences about what you want your life to look like.
        </T>
        <Field
          label="Why I am doing this"
          multiline
          maxLength={1200}
          defaultValue={st.why}
          onChangeText={(v) => apply({ st: setField(snap.settings!, 'why', v) })}
        />
      </Collapse>
    </Screen>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5 },
  sb: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 12, borderWidth: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topIc: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  item: { gap: 10, padding: 12, borderRadius: 16, borderWidth: 1.5 },
  main: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  ic: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  confirm: { gap: 8, padding: 12, borderRadius: 14 },
  idea: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1 },
});
