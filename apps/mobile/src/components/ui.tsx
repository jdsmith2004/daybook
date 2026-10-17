/* The small building blocks every screen uses: text, cards, buttons, chips, icons and progress bars. */
import { ICO } from '@daybook/core';
import { createContext, useContext, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';
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
  return <Text {...rest} style={[styles[v], { color }, style]} />;
}

export function Card({ children, style, tone }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'plain' | 'note' }) {
  const c = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: tone === 'note' ? c.sunSoft : c.surface,
          borderColor: tone === 'note' ? c.sunSoft : c.cardEdge,
          shadowColor: c.shadow,
        },
        style,
      ]}>
      {children}
    </View>
  );
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
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  icon?: string;
}) {
  const c = useTheme();
  const bg = kind === 'primary' ? c.accent : kind === 'danger' ? c.danger : 'transparent';
  const fg = kind === 'primary' ? c.accentInk : kind === 'danger' ? '#FFFFFF' : c.accentText;
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

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
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

const styles = StyleSheet.create({
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 21 },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 19 },
  eyebrow: { fontFamily: font.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontFamily: font.display, fontSize: 30, lineHeight: 36 },
  h2: { fontFamily: font.display, fontSize: 20, lineHeight: 26 },
  big: { fontFamily: font.display, fontSize: 46, lineHeight: 50 },
  card: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 16,
    gap: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 2,
  },
  btn: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { fontFamily: font.bodyBold, fontSize: 15 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: font.bodySemi, fontSize: 14 },
});
