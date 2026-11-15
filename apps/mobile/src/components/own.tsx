/* An answer in the person's own words, for any list of answers (Talk it through, the Sunday review, the morning, Walk it through):
   the "Write my own" chip at the end of the list, and the box that opens. The box and its button sit together near the top, so the
   keyboard never covers them.

   Saved answers (core saved-answers.ts): give OwnField a kind and Add keeps the words for good, in the settings, right after onSave.
   useOwn(kind, builtIn, picked) gives the choices to show: the built-in ones, then every one the person ever wrote of that kind, then
   anything picked that is neither. So a written answer stays a chip on its page when another chip is tapped, and shows on every
   other page that asks the same kind of thing. Written for the other pages in side-session notes, saved-answers.md. */
import { keepOwn, ownChoices, isOwn, type OwnKind } from '@daybook/core';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { Field, Link } from '@/components/choices';
import { Button, Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** the choices for one kind of answer, the built-in ones first, and keep(t) to save one written elsewhere (the store's apply) */
export function useOwn(kind: OwnKind, builtIn: readonly string[], picked: readonly string[] = []) {
  const { snap, apply } = useStore();
  const st = snap.settings;
  const key = builtIn.join('\n') + '\u0000' + picked.join('\n');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const choices = useMemo(() => ownChoices(st, kind, builtIn, picked), [st?.own, kind, key]);
  const keep = useCallback((t: string) => apply((cur) => ({ st: keepOwn(cur, kind, t, builtIn) })), [apply, kind, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = useCallback((t: string) => isOwn(st, kind, t), [st, kind]);
  return { choices, keep, mine };
}

/** the box for an answer in the person's own words. With a kind, Add keeps it for good (core keepOwn) before onSave. */
export function OwnField({
  placeholder,
  max,
  onSave,
  onCancel,
  kind,
  builtIn,
  shape,
}: {
  placeholder: string;
  max: number;
  onSave: (t: string) => void;
  onCancel: () => void;
  kind?: OwnKind;
  builtIn?: readonly string[];
  /** the words as they are kept and handed on (like "When I get home" kept as "I get home") */
  shape?: (t: string) => string;
}) {
  const { apply } = useStore();
  const [text, setText] = useState('');
  const save = () => {
    const raw = text.replace(/\s+/g, ' ').trim().slice(0, max);
    const t = shape ? shape(raw).trim() : raw;
    if (!t) return;
    onSave(t);
    /* after onSave, and reading the latest settings, so a save there that hands over older settings cannot drop it */
    if (kind) apply((cur) => ({ st: keepOwn(cur, kind, t, builtIn || []) }));
  };
  return (
    <Appear by={8} duration={220} style={s.fill}>
      <KeepAbove style={s.own}>
        <Field
          label="In your own words"
          hideLabel
          value={text}
          onChangeText={setText}
          maxLength={max}
          autoFocus
          placeholder={placeholder}
          returnKeyType="done"
          onSubmitEditing={save}
        />
        <View style={s.ownRow}>
          <View style={{ flex: 1 }}>
            <Button label="Add" onPress={save} />
          </View>
          <Link label="Cancel" onPress={onCancel} />
        </View>
      </KeepAbove>
    </Appear>
  );
}

/** "Write my own": the choice that opens a box for the person's own answer. A pencil and a dashed edge set it apart from
    the answers beside it, and it stays last in its group (Packed last). */
export function OwnChip({ onPress, label = 'Write my own', color }: { onPress: () => void; label?: string; color?: string }) {
  const c = useTheme();
  /* on a sky of its own (the morning's dawn), the page gives the color that reads there */
  const ink = color || c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.ownChip, { borderColor: color || c.accent, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name="pencil" size={16} color={ink} />
      <Text style={[s.ownChipT, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  fill: { alignSelf: 'stretch' },
  own: { alignSelf: 'stretch', gap: 10, marginTop: 4 },
  ownRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  ownChipT: { fontFamily: font.bodySemi, fontSize: 15, flexShrink: 1 },
});
