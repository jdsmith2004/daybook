/* The pieces of "Put it to work" at the end of a lesson (core practice.ts): a ready-made line with one button that puts it on
   the plan (and Undo), a line to copy and send, the box for the lesson's own line with examples to tap, the editor that
   changes a line's words before it is added (it sits at the top, above the keyboard), and a tool or page to open. */
import { ITEM_WHEN_LEN, ITEM_WHERE, itemButton, itemDone, itemLen, type PItem } from '@daybook/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon, T } from '@/components/ui';
import { font, useTheme, type Tone } from '@/lib/theme';

const ICON: Record<PItem['k'], string> = {
  plan: 'shield',
  reason: 'star',
  menu: 'leaf',
  wind: 'moon',
  words: 'sparkle',
  slip: 'heart',
  be: 'flag',
  note: 'pencil',
  copy: 'copy',
};

/** the words of a line: an if-then reads "If …, then I will …" */
export function LineWords({ it, big }: { it: PItem; big?: boolean }) {
  const c = useTheme();
  const st = [s.words, big && s.wordsBig, { color: c.ink }];
  if (it.k === 'plan')
    return (
      <Text selectable style={st}>
        <Text style={s.b}>If</Text> {it.when}, <Text style={s.b}>then I will</Text> {lower(it.text)}
      </Text>
    );
  return (
    <Text selectable style={st}>
      {it.text}
    </Text>
  );
}
const lower = (t: string) => (/^[A-Z][a-z]/.test(t) && !/^I\b/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t);

/** one ready-made line. state: added here (Undo shows), already there before, or not yet */
export function PLine({
  it,
  t,
  state,
  replaces,
  onAdd,
  onUndo,
  onEdit,
  onCopy,
}: {
  it: PItem;
  t: Tone;
  state: 'added' | 'had' | null;
  /** the sentence or note this one would replace */
  replaces?: string;
  onAdd: () => void;
  onUndo: () => void;
  onEdit: () => void;
  onCopy: () => void;
}) {
  const c = useTheme();
  const copy = it.k === 'copy';
  const on = !!state;
  return (
    <View style={[s.card, { backgroundColor: c.surface, borderColor: on ? c.mint : c.line }]}>
      <View style={s.eye}>
        <View style={[s.ei, { backgroundColor: on ? c.mintSoft : t.soft }]}>
          <Icon name={on ? 'check' : ICON[it.k]} size={14} color={on ? c.mintText : t.text} />
        </View>
        <Text style={[s.eyeT, { color: on ? c.mintText : t.text }]} numberOfLines={1}>
          {(copy ? it.label || 'To send' : ITEM_WHERE[it.k]).toUpperCase()}
        </Text>
      </View>
      <LineWords it={it} />
      {replaces && !on ? (
        <T v="small" tone="muted">
          In place of: “{replaces}”
        </T>
      ) : null}
      {on && !copy ? (
        <View style={s.doneRow} accessibilityLiveRegion="polite">
          <View style={[s.done, { backgroundColor: c.mintSoft }]}>
            <Icon name="check" size={18} color={c.mintText} />
            <Text style={[s.btnT, { color: c.mintText }]} numberOfLines={1}>
              {state === 'had' ? 'Already ' + itemDone(it).replace(/^On/, 'on').replace(/^Your/, 'your') : itemDone(it)}
            </Text>
          </View>
          {state === 'added' ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Undo. Take it back off." onPress={onUndo} hitSlop={6} style={s.undo}>
              <Text style={[s.linkT, { color: c.accentText }]}>Undo</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <>
          <Pressable
            accessibilityRole="button"
            onPress={copy ? onCopy : onAdd}
            style={({ pressed }) => [
              s.btn,
              { backgroundColor: on ? c.mintSoft : c.accent, shadowColor: on ? c.lip : c.accentDeep, transform: [{ translateY: pressed ? 2 : 0 }] },
            ]}>
            <Icon name={on ? 'check' : copy ? 'copy' : 'plus'} size={19} color={on ? c.mintText : c.accentInk} />
            <Text style={[s.btnT, { color: on ? c.mintText : c.accentInk }]} numberOfLines={1}>
              {on ? 'Copied · copy again' : itemButton(it)}
            </Text>
          </Pressable>
          {copy ? null : (
            <Pressable accessibilityRole="button" onPress={onEdit} hitSlop={4} style={s.link}>
              <Icon name="pencil" size={15} color={c.accentText} />
              <Text style={[s.linkT, { color: c.accentText }]}>Change the words first</Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

/** change a line's words, then add it. It sits at the top of the card, so the keyboard never covers it. */
export function LineEditor({ it, t, onAdd, onCancel }: { it: PItem; t: Tone; onAdd: (x: PItem) => void; onCancel: () => void }) {
  const c = useTheme();
  const [when, setWhen] = useState(it.when || '');
  const [text, setText] = useState(it.text);
  const ok = !!text.trim() && (it.k !== 'plan' || !!when.trim());
  const input = [s.in, { color: c.ink, backgroundColor: c.surface, borderColor: c.line }];
  return (
    <View style={{ gap: 10 }}>
      <View style={s.eye}>
        <View style={[s.ei, { backgroundColor: t.soft }]}>
          <Icon name="pencil" size={14} color={t.text} />
        </View>
        <Text style={[s.eyeT, { color: t.text }]}>CHANGE THE WORDS · {ITEM_WHERE[it.k].toUpperCase()}</Text>
      </View>
      {it.k === 'plan' ? (
        <>
          <T v="label">If</T>
          <TextInput value={when} onChangeText={setWhen} maxLength={ITEM_WHEN_LEN} accessibilityLabel="If" style={input} placeholderTextColor={c.muted} />
          <T v="label">Then I will</T>
        </>
      ) : null}
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
        maxLength={itemLen(it)}
        accessibilityLabel={it.k === 'plan' ? 'Then I will' : 'The words'}
        style={[input, { minHeight: 84, textAlignVertical: 'top' }]}
        placeholderTextColor={c.muted}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !ok }}
        disabled={!ok}
        onPress={() => onAdd({ ...it, when: it.k === 'plan' ? when.trim() : it.when, text: text.trim() })}
        style={({ pressed }) => [s.btn, { backgroundColor: ok ? c.accent : c.lip, shadowColor: c.accentDeep, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
        <Icon name="plus" size={19} color={ok ? c.accentInk : c.muted} />
        <Text style={[s.btnT, { color: ok ? c.accentInk : c.muted }]}>{itemButton(it)}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onCancel} style={s.link}>
        <Text style={[s.linkT, { color: c.accentText }]}>Cancel</Text>
      </Pressable>
    </View>
  );
}

/** the lesson's own line, with examples to tap: a tap puts the example in the box, to keep or change */
export function WriteBox({
  label,
  value,
  examples,
  t,
  onChange,
}: {
  label: string;
  value: string;
  examples: string[];
  t: Tone;
  onChange: (v: string) => void;
}) {
  const c = useTheme();
  return (
    <View style={[s.write, { backgroundColor: t.soft }]}>
      <T v="label">{label}</T>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline
        maxLength={400}
        placeholder="Write a line, or tap one below"
        placeholderTextColor={c.muted}
        accessibilityLabel={label}
        style={[s.in, { color: c.ink, backgroundColor: c.surface, borderColor: c.line, minHeight: 76, textAlignVertical: 'top' }]}
      />
      <View style={{ gap: 6 }}>
        {examples.map((x, k) => {
          const on = value.trim() === x;
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={'Use this: ' + x}
              accessibilityState={{ selected: on }}
              onPress={() => onChange(x)}
              style={({ pressed }) => [s.ex, { backgroundColor: c.surface, borderColor: on ? t.ic : 'transparent', opacity: pressed ? 0.8 : 1 }]}>
              <Icon name={on ? 'check' : 'plus'} size={15} color={t.text} />
              <Text style={[s.exT, { color: c.ink }]}>{x}</Text>
            </Pressable>
          );
        })}
      </View>
      <T v="small" tone="muted">
        Saved as you type. Only you see it.
      </T>
    </View>
  );
}

/** a tool or a page to open; it comes back here */
export function GoRow({ label, ic, went, onPress }: { label: string; ic?: string; went: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label + (went ? '. Done. Open it again.' : '')}
      onPress={onPress}
      style={({ pressed }) => [s.go, { backgroundColor: c.accentSoft, shadowColor: c.lip, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
      <Icon name={went ? 'check' : ic || 'next'} size={20} color={c.accentText} />
      <Text style={[s.goT, { color: c.accentText }]}>{label}</Text>
      <Icon name="next" size={18} color={c.accentText} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { gap: 10, padding: 14, borderRadius: 20, borderWidth: 2 },
  eye: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ei: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  eyeT: { flexShrink: 1, fontFamily: font.bodyBold, fontSize: 11.5, letterSpacing: 1.1 },
  words: { fontFamily: font.bodyMedium, fontSize: 17, lineHeight: 24 },
  wordsBig: { fontSize: 19, lineHeight: 26 },
  b: { fontFamily: font.bodyBold },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  btnT: { flexShrink: 1, fontFamily: font.bodyBold, fontSize: 16.5 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  done: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 14, borderRadius: 16 },
  undo: { minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40 },
  linkT: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
  in: { fontFamily: font.body, fontSize: 16.5, lineHeight: 23, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, minHeight: 48 },
  write: { gap: 10, padding: 14, borderRadius: 20 },
  ex: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 14, borderWidth: 2 },
  exT: { flex: 1, fontFamily: font.body, fontSize: 15.5, lineHeight: 21 },
  go: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  goT: { flex: 1, fontFamily: font.bodySemi, fontSize: 17 },
});
