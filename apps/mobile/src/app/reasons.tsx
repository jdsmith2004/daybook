/* My reasons: write, edit, order and read them. Nothing is saved while typing: Save and Add are explicit, so a half-written line
   never shows up on Today. Ported from the legacy viewReasons and reasonAction. */
import { moveReason, RCATS, REASON_LEN, REASON_MAX, reasonCat, reasonIdeas, removeReason, saveReason, setField } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';

import { Field } from '@/components/choices';
import { Hair } from '@/components/editable';
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
            <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: on ? t.text : c.ink }}>{k.name}</Text>
          </Pressable>
        );
      })}
    </View>
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
    <Screen title="My reasons" sub={n ? undefined : <T tone="muted">Start with one true line. That is enough.</T>} back={back}>
      {n ? <Button label="Read them one at a time" onPress={() => router.push({ pathname: '/tool/[id]', params: { id: 'reasons' } })} /> : null}

      {n ? (
        <Card>
          {rs.map((text, i) => {
            const cat = reasonCat(st, text);
            const t = toneOf(c, cat.tone);
            const lab = 'reason ' + (i + 1);
            const line = (
              <>
                <View style={s.tag}>
                  <Icon name={cat.ic} size={14} color={t.text} />
                  <T v="small" tone="muted" style={{ flex: 1 }}>
                    {cat.name}
                    {i === 0 && n > 1 ? ' · shows first' : ''}
                  </T>
                </View>
                <T>{text}</T>
              </>
            );
            return (
              <View key={i} style={{ gap: 12 }}>
                {i > 0 ? <Hair /> : null}
                {edit === i ? (
                  <View style={{ gap: 8 }}>
                    {/* the group comes first, so the box and its Save stay together above the keyboard */}
                    <CatChips label="Group" cur={editCat} onPick={setEditCat} />
                    <KeepAbove style={{ gap: 8 }}>
                      <Field label={'Reason ' + (i + 1)} multiline maxLength={REASON_LEN} value={draft} onChangeText={setDraft} autoFocus />
                      <View style={s.row}>
                        <View style={{ flex: 1 }}>
                          <Button label="Save" onPress={save} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Button kind="ghost" label="Cancel" onPress={() => setEdit(null)} />
                        </View>
                      </View>
                      <View style={s.tools} accessibilityLabel={`Reason ${i + 1} of ${n}`}>
                        <Tool
                          icon="up"
                          text="Up"
                          label={'Move ' + lab + ' up'}
                          disabled={i === 0}
                          onPress={() => {
                            const r = moveReason(st, i, -1);
                            if (r) {
                              apply(r);
                              setEdit(i - 1);
                            }
                          }}
                        />
                        <Tool
                          icon="down"
                          text="Down"
                          label={'Move ' + lab + ' down'}
                          disabled={i === n - 1}
                          onPress={() => {
                            const r = moveReason(st, i, 1);
                            if (r) {
                              apply(r);
                              setEdit(i + 1);
                            }
                          }}
                        />
                        <Tool
                          icon="trash"
                          text="Remove"
                          danger
                          label={'Remove ' + lab}
                          onPress={() => {
                            setDel(i);
                            setEdit(null);
                          }}
                        />
                      </View>
                    </KeepAbove>
                  </View>
                ) : del === i ? (
                  <View style={{ gap: 8 }}>
                    <View style={{ gap: 2 }}>{line}</View>
                    <T v="label">Remove this reason?</T>
                    <View style={s.row}>
                      <View style={{ flex: 1 }}>
                        <Button
                          kind="danger"
                          label="Yes, remove it"
                          onPress={() => {
                            const r = removeReason(st, i);
                            setDel(null);
                            if (r) apply(r);
                          }}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button kind="ghost" label="Keep it" onPress={() => setDel(null)} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={text}
                    accessibilityHint="Opens it to reword, move or remove"
                    onPress={() => startEdit(i)}
                    style={({ pressed }) => [s.main, { opacity: pressed ? 0.6 : 1 }]}>
                    <View style={{ flex: 1, gap: 2 }}>{line}</View>
                    <Icon name="pencil" size={16} color={c.muted} />
                  </Pressable>
                )}
              </View>
            );
          })}
        </Card>
      ) : null}

      {n >= REASON_MAX ? (
        <T tone="muted">That is {REASON_MAX} reasons, the most Daybook holds. Change or remove one to make room for a new one.</T>
      ) : (
        <>
          <Card>
            <T v="h2">{n ? 'Add another' : 'Add a reason'}</T>
            <T v="small" tone="muted">
              In your own words. Short and true beats long and fancy.
            </T>
            <CatChips label="Group, optional" cur={addCat} onPick={(id) => setAddCat(addCat === id ? null : id)} />
            <T v="small" tone="muted">
              A group is optional. Skip it, and Daybook guesses.
            </T>
            <KeepAbove style={{ gap: 8 }}>
              <Field key={addKey} label="New reason" hideLabel multiline maxLength={REASON_LEN} value={add} placeholder="I want to…" onChangeText={setAdd} />
              {add.length > REASON_LEN - 40 ? (
                <T v="small" tone="muted" style={{ alignSelf: 'flex-end' }}>
                  {add.length} of {REASON_LEN}
                </T>
              ) : null}
              <Button label="Add reason" disabled={!add.trim()} onPress={addIt} />
            </KeepAbove>
          </Card>
          {reasonIdeas(rs).length ? (
            <Card>
              <T v="h2">Need a spark?</T>
              <T v="small" tone="muted">
                Tap one to start from it, then change it until it sounds like you.
              </T>
              <View>
                {reasonIdeas(rs).map(([x, k]) => (
                  <Pressable
                    key={k}
                    accessibilityRole="button"
                    onPress={() => {
                      setAdd(x[0]);
                      setAddCat(x[1]);
                    }}
                    style={({ pressed }) => [s.idea, { opacity: pressed ? 0.6 : 1 }]}>
                    <Icon name="plus" size={16} color={c.accentText} />
                    <T style={{ flex: 1 }}>{x[0]}</T>
                  </Pressable>
                ))}
              </View>
            </Card>
          ) : null}
        </>
      )}

      <Collapse title="In my own words" sub="A longer why, if you want one" open={why} onToggle={() => setWhy(!why)}>
        <T v="small" tone="muted">
          A few sentences about what you want your life to look like.
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

/** an action on an open reason: only its words and a small icon */
function Tool({
  icon,
  text,
  label,
  onPress,
  disabled,
  danger,
}: {
  icon: string;
  text: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const c = useTheme();
  const col = danger ? c.danger : c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.tool, { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 }]}>
      <Icon name={icon} size={16} color={col} />
      <T v="small" style={{ fontFamily: font.bodySemi, color: col }}>
        {text}
      </T>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cat: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  main: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', minHeight: 44 },
  row: { flexDirection: 'row', gap: 8 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 4 },
  idea: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingVertical: 6 },
});
