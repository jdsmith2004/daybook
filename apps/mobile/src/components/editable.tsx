/* A line of the person's own words that reads like a page, not a form: a small label, their words, and a pencil. Tap it to
   change the words in place; Done (or leaving the box) saves. With nothing written yet it shows a gentle prompt instead. */
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Appear } from '@/components/appear';
import { Icon, T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

export function Editable({
  label,
  value,
  prompt,
  placeholder,
  onSave,
  maxLength,
  big,
  icon,
}: {
  label?: string;
  value: string;
  /** what shows when nothing is written yet */
  prompt: string;
  placeholder?: string;
  onSave: (v: string) => void;
  maxLength?: number;
  /** the large words at the top of My plan */
  big?: boolean;
  icon?: string;
}) {
  const c = useTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);
  const latest = useRef(draft);
  latest.current = draft;
  const done = () => {
    if (latest.current !== value) onSave(latest.current);
    setEditing(false);
  };
  const empty = !value.trim();

  if (editing)
    return (
      <Appear by={4} duration={180} style={{ gap: 8 }}>
        {label ? <T v="label">{label}</T> : null}
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onBlur={done}
          autoFocus
          multiline
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={c.muted}
          accessibilityLabel={label || prompt}
          style={[big ? s.inBig : s.in, { color: c.ink, backgroundColor: c.surface, borderColor: c.accent }]}
        />
        <Pressable
          accessibilityRole="button"
          onPress={done}
          hitSlop={8}
          style={({ pressed }) => [s.done, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
          <Icon name="check" size={16} color={c.accentInk} />
          <T v="label" style={{ color: c.accentInk }}>
            Done
          </T>
        </Pressable>
      </Appear>
    );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={(label ? label + ': ' : '') + (empty ? prompt : value)}
      accessibilityHint="Opens it to change"
      onPress={() => setEditing(true)}
      style={({ pressed }) => [s.row, { opacity: pressed ? 0.8 : 1 }]}>
      {icon ? (
        <View style={[s.ic, { backgroundColor: c.accentSoft }]}>
          <Icon name={icon} size={16} color={c.accentText} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        {label ? (
          <T v="small" tone="muted" style={{ fontFamily: font.bodySemi }}>
            {label}
          </T>
        ) : null}
        {empty ? (
          <T tone="accentText" style={{ fontFamily: font.bodySemi }}>
            {prompt}
          </T>
        ) : (
          <T style={big ? s.big : undefined}>{value}</T>
        )}
      </View>
      <Icon name={empty ? 'plus' : 'pencil'} size={16} color={empty ? c.accentText : c.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 40, paddingVertical: 4 },
  ic: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  big: { fontFamily: font.display, fontSize: 23, lineHeight: 29 },
  in: { fontFamily: font.body, fontSize: 15, lineHeight: 21, borderWidth: 2, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, minHeight: 48 },
  inBig: {
    fontFamily: font.display,
    fontSize: 21,
    lineHeight: 27,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
  },
  done: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, paddingHorizontal: 16, borderRadius: 999 },
});
