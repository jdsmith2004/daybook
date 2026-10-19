/* An answer in the person's own words, for any list of answers (Talk it through, the Sunday review): the small
   "+ Your own" chip at the end of the list, and the box that opens. The box and its button sit together near the top,
   so the keyboard never covers them. */
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Appear } from '@/components/appear';
import { Field, Link } from '@/components/choices';
import { Button, Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

export function OwnField({ placeholder, max, onSave, onCancel }: { placeholder: string; max: number; onSave: (t: string) => void; onCancel: () => void }) {
  const [text, setText] = useState('');
  const save = () => {
    const t = text.replace(/\s+/g, ' ').trim().slice(0, max);
    if (t) onSave(t);
  };
  return (
    <Appear by={8} duration={220} style={s.own}>
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
    </Appear>
  );
}

export function OwnChip({ onPress, label = 'Your own' }: { onPress: () => void; label?: string }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label === 'Your own' ? 'Add your own' : label}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.ownChip, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name="plus" size={16} color={c.accentText} />
      <Text style={[s.ownChipT, { color: c.accentText }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
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
  ownChipT: { fontFamily: font.bodySemi, fontSize: 15.5 },
});
