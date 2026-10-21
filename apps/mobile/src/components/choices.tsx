/* The answers in a full-screen question: big options with an icon (like "I rode it out"), tiles (like "What set it off?"),
   the box for an answer of your own, a quiet text link, and a text field. */
import { OPT_LEN } from '@daybook/core';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';
import { Text, TextInput } from '@/components/text';

import { Button, Icon, T } from '@/components/ui';
import { font, useTheme, type Palette } from '@/lib/theme';

export type OptTone = 'mint' | 'slip' | 'sun' | 'accent';
const toneOf = (c: Palette, t: OptTone) =>
  ({
    mint: { soft: c.mintSoft, ic: c.mint, text: c.mintText },
    slip: { soft: c.slipSoft, ic: c.slip, text: c.slipText },
    sun: { soft: c.sunSoft, ic: c.sun, text: c.sunText },
    accent: { soft: c.accentSoft, ic: c.accent, text: c.accentText },
  })[t];

export function BigOption({
  tone,
  icon,
  title,
  sub,
  selected,
  onPress,
  tag,
}: {
  tone: OptTone;
  icon: string;
  title: string;
  sub?: string;
  selected?: boolean | null;
  onPress: () => void;
  tag?: string;
}) {
  const c = useTheme();
  const t = toneOf(c, tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={selected == null ? undefined : { selected }}
      onPress={onPress}
      style={({ pressed }) => [
        s.opt,
        {
          backgroundColor: c.surface,
          borderColor: selected ? t.ic : 'transparent',
          shadowColor: c.lip,
          transform: [{ translateY: pressed ? 3 : 0 }],
        },
      ]}>
      <View style={[s.optIc, { backgroundColor: t.soft }]}>
        <Icon name={icon} size={24} color={t.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.optT, { color: c.ink }]}>
          {title}
          {tag ? <Text style={[s.tag, { color: c.mintText }]}>{'  ' + tag}</Text> : null}
        </Text>
        {sub ? (
          <T v="small" tone="muted">
            {sub}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

/** a grid of short answers. cur is the one picked, or a list when several can be picked. */
export function Tiles({
  list,
  cur,
  onPick,
  extra,
}: {
  list: [string, string][];
  cur: string | string[] | null | undefined;
  onPick: (id: string) => void;
  extra?: React.ReactNode;
}) {
  const c = useTheme();
  const on = (id: string) => (Array.isArray(cur) ? cur.indexOf(id) >= 0 : cur === id);
  return (
    <View style={s.grid}>
      {list.map(([id, label]) => {
        const sel = on(id);
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            onPress={() => onPick(id)}
            style={({ pressed }) => [
              s.tile,
              {
                backgroundColor: sel ? c.accentSoft : c.surface,
                borderColor: sel ? c.accent : 'transparent',
                shadowColor: c.lip,
                transform: [{ translateY: pressed ? 3 : 0 }],
              },
            ]}>
            <Text style={[s.tileT, { color: sel ? c.accentText : c.ink }]}>{label}</Text>
          </Pressable>
        );
      })}
      {extra}
    </View>
  );
}

/** "Add your own": a dashed tile in a grid, or a full-width row in a list (block) */
export function AddTile({ label, icon = 'plus', onPress, block }: { label: string; icon?: string; onPress: () => void; block?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.tile, s.add, block && s.block, { borderColor: c.line, opacity: pressed ? 0.8 : 1 }]}>
      <Icon name={icon} size={18} color={c.accentText} />
      <Text style={[s.tileT, { color: c.accentText }]}>{label}</Text>
    </Pressable>
  );
}

/** the little form for typing an answer of your own; saved to your list, so it is there next time */
export function AddOwn({ kind, onSave, onCancel }: { kind: 'trig' | 'did'; onSave: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState('');
  return (
    <View style={{ width: '100%', gap: 8 }}>
      <Field
        label="Your own answer"
        hideLabel
        value={text}
        onChangeText={setText}
        maxLength={OPT_LEN}
        autoFocus
        placeholder={kind === 'did' ? 'Like “Played guitar”' : 'Like “Work stress”'}
        returnKeyType="done"
        onSubmitEditing={() => onSave(text)}
      />
      <View style={s.row}>
        <Button label="Add" onPress={() => onSave(text)} />
        <Link label="Cancel" onPress={onCancel} />
      </View>
      <T v="small" tone="muted">
        Saved to your list, so it is there next time.
      </T>
    </View>
  );
}

/** a quiet link. hidden: keeps its room but cannot be seen or tapped, so what sits above it does not jump when it goes */
export function Link({
  label,
  onPress,
  tone = 'accentText',
  color,
  hidden,
}: {
  label: string;
  onPress: () => void;
  tone?: keyof Palette;
  /** a fixed color, for a card that keeps its own light colors in either theme */
  color?: string;
  hidden?: boolean;
}) {
  const c = useTheme();
  if (hidden)
    return (
      <View style={[s.link, { opacity: 0 }]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={s.linkT}>{label}</Text>
      </View>
    );
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={({ pressed }) => [s.link, pressed && { opacity: 0.7 }]}>
      <Text style={[s.linkT, { color: color || (c[tone] as string) }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, hideLabel, style, ...rest }: TextInputProps & { label: string; hideLabel?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ width: '100%', gap: 6 }}>
      {hideLabel ? null : <T v="label">{label}</T>}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...rest}
        style={[
          s.input,
          { backgroundColor: c.surface, borderColor: c.line, color: c.ink },
          rest.multiline && { minHeight: 76, textAlignVertical: 'top' },
          style,
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  opt: {
    width: '100%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  optIc: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optT: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22 },
  tag: { fontFamily: font.bodySemi, fontSize: 12 },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 54,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  tileT: { fontFamily: font.bodySemi, fontSize: 16, textAlign: 'center' },
  add: { flexDirection: 'row', gap: 6, borderStyle: 'dashed', backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  block: { flexGrow: 0, flexBasis: 'auto', width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  linkT: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
  input: { width: '100%', minHeight: 48, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontFamily: font.body, fontSize: 16 },
});
