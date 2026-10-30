/* The small building blocks every screen uses: text, cards, buttons, chips, icons and progress bars. */
import { ICO } from '@daybook/core';
import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
import { BIG_MAX, Text, TEXT_MAX } from '@/components/text';
import { SvgXml } from 'react-native-svg';

import { font, useTheme, type Palette } from '@/lib/theme';

type Tone = 'ink' | 'muted' | keyof Palette;

/** on a night sky the words turn light: a scene sets this, and T uses it for plain and muted words */
export const InkContext = createContext<{ ink: string; muted: string } | null>(null);

export function T({
  v = 'body',
  tone = 'ink',
  style,
  ...rest
}: TextProps & { v?: 'body' | 'small' | 'label' | 'eyebrow' | 'title' | 'big' | 'h2'; tone?: Tone; style?: StyleProp<TextStyle> }) {
  const c = useTheme();
  const ink = useContext(InkContext);
  const color = ink && (tone === 'ink' || tone === 'muted') ? ink[tone] : (c[tone as keyof Palette] as string);
  return <Text maxFontSizeMultiplier={v === 'title' || v === 'big' || v === 'h2' ? BIG_MAX : TEXT_MAX} {...rest} style={[styles[v], { color }, style]} />;
}

export function Card({ children, style, tone }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'plain' | 'note' }) {
  const c = useTheme();
  return <View style={[styles.card, { backgroundColor: tone === 'note' ? c.sunSoft : c.surface }, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  /** warm: the sun's yellow, for a page lit by fire (Rekindle) */
  kind?: 'primary' | 'ghost' | 'danger' | 'warm';
  disabled?: boolean;
  icon?: string;
}) {
  const c = useTheme();
  const bg = kind === 'primary' ? c.accent : kind === 'danger' ? c.danger : kind === 'warm' ? c.sun : 'transparent';
  const fg = kind === 'primary' ? c.accentInk : kind === 'danger' ? '#FFFFFF' : kind === 'warm' ? c.onSun : c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, borderColor: kind === 'ghost' ? c.line : bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 }]}>
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

/** a small choice. role radio: one of a few answers inside a radiogroup (it reads as checked, not selected) */
export function Chip({ label, on, onPress, role }: { label: string; on: boolean; onPress: () => void; role?: 'radio' }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole={role || 'button'}
      accessibilityState={role ? { checked: on } : { selected: on }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: on ? c.accent : c.surface, borderColor: on ? c.accent : c.line, opacity: pressed ? 0.85 : 1 }]}>
      <Text style={[styles.chipText, { color: on ? c.accentInk : c.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** a line icon from the legacy set */
export function Icon({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const c = useTheme();
  const xml = `<svg viewBox="0 0 24 24" fill="none" stroke="${color || c.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICO[name] || ''}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export function Bar({ frac, from, to, height = 12, track }: { frac: number; from: string; to?: string; height?: number; track?: string }) {
  const c = useTheme();
  const pct = Math.max(0, Math.min(1, frac)) * 100;
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track || c.surface2, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height / 2, backgroundColor: to || from }} />
    </View>
  );
}

/* one type scale (design-standards.md): 13 small, 15 reading, 20 and 28 for headings, and a big number. Weight and color do
   the rest. A card has one edge: its fill. */
const styles = StyleSheet.create({
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  eyebrow: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  h2: { fontFamily: font.display, fontSize: 20, lineHeight: 25 },
  big: { fontFamily: font.display, fontSize: 46, lineHeight: 50 },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  btn: {
    minHeight: 50,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { fontFamily: font.bodyBold, fontSize: 15 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: font.bodySemi, fontSize: 15 },
});
