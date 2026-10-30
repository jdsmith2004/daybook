/* A line of the person's own words that reads like a page, not a form: a small label, their words, and a pencil. Tap it to
   change the words in place; Done (or leaving the box) saves. With nothing written yet it shows a gentle prompt instead.
   With it, the plain parts of a page like that (My plan, My reasons): a part with its heading over one card, a thin line
   between two things in a card, and a link that is only words. */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { TextInput } from '@/components/text';

import { Appear } from '@/components/appear';
import { KeepAbove } from '@/components/keyboard';
import { Card, Icon, T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

export type PageTone = 'accent' | 'mint' | 'sky' | 'sun' | 'coral' | 'violet';

/** a part of the page: its icon at its own size, a heading and an optional count, a line if it needs one, then one card */
export function PageSec({
  icon,
  tone = 'accent',
  title,
  aside,
  sub,
  tight,
  children,
  onLayout,
}: {
  icon: string;
  tone?: PageTone;
  title: string;
  aside?: string;
  sub?: string;
  /** the card holds a plain list: its rows bring their own room */
  tight?: boolean;
  children: ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const c = useTheme();
  const ink = { accent: c.accentText, mint: c.mintText, sky: c.skyText, sun: c.sunText, coral: c.coralText, violet: c.violetText }[tone];
  return (
    <View onLayout={onLayout} style={s.sec}>
      <View style={s.head}>
        <Icon name={icon} size={20} color={ink} />
        <T v="h2" style={{ flex: 1 }} accessibilityRole="header">
          {title}
        </T>
        {aside ? (
          <T v="small" tone="muted">
            {aside}
          </T>
        ) : null}
      </View>
      {sub ? (
        <T v="small" tone="muted">
          {sub}
        </T>
      ) : null}
      <Card style={[{ marginTop: 4 }, tight && { gap: 0, paddingVertical: 4 }]}>{children}</Card>
    </View>
  );
}

/** a thin line between two things in a card */
export function Hair() {
  const c = useTheme();
  return <View style={{ height: 1, backgroundColor: c.line }} />;
}

/** an action that is only words, in the accent's color, with a small icon */
export function PageLink({ icon, label, onPress, disabled }: { icon?: string; label: string; onPress: () => void; disabled?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.link, { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}>
      {icon ? <Icon name={icon} size={18} color={c.accentText} /> : null}
      <T v="label" tone="accentText">
        {label}
      </T>
    </Pressable>
  );
}

export function Editable({
  label,
  value,
  prompt,
  placeholder,
  onSave,
  maxLength,
  big,
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
      <Appear by={4} duration={180}>
        <KeepAbove style={{ gap: 8 }}>
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
        </KeepAbove>
      </Appear>
    );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={(label ? label + ': ' : '') + (empty ? prompt : value)}
      accessibilityHint="Opens it to change"
      onPress={() => setEditing(true)}
      style={({ pressed }) => [s.row, { opacity: pressed ? 0.8 : 1 }]}>
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
  sec: { gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, minHeight: 44, paddingVertical: 4 },
  big: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  in: { fontFamily: font.body, fontSize: 15, lineHeight: 21, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 48 },
  inBig: {
    fontFamily: font.display,
    fontSize: 22,
    lineHeight: 28,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
  },
  done: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 999 },
});
