/* The pieces Settings is built from, in the grammar of the best settings pages (the owner, November 9, 2026: "make it like a
   really good settings page"): rounded white groups on the paper, a heading in the display face over a group and a short note
   under it, one-line rows with the value in gray on the right, round checks for a choice, and the phone's own switch for on and
   off. Color is rare: each group's icons take one tone, purple marks what is chosen, red is only for deleting. */
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

export type Tone = 'coral' | 'sky' | 'violet' | 'mint' | 'sun' | 'accent';
export function useTone(t: Tone = 'accent') {
  const c = useTheme();
  return { coral: c.coralText, sky: c.skyText, violet: c.violetText, mint: c.mintText, sun: c.sunText, accent: c.accentText }[t];
}

/** a rounded white group, with a heading over it and a short note under it. Each row draws the line under it; the group's edge
    hides the last one. */
export function SetGroup({ head, foot, children }: { head?: string; foot?: ReactNode; children: ReactNode }) {
  const c = useTheme();
  return (
    <View style={s.wrap}>
      {head ? (
        <T style={[s.head, { color: c.ink }]} accessibilityRole="header">
          {head}
        </T>
      ) : null}
      <View style={[s.group, { backgroundColor: c.surface }]}>
        <View style={{ marginBottom: -1 }}>{children}</View>
      </View>
      {foot ? (
        <T v="small" tone="muted" style={s.foot}>
          {foot}
        </T>
      ) : null}
    </View>
  );
}

/** one row: an icon in its group's tone, the name, the value in gray, and a chevron when it opens a page. `act` makes the
    row a plain action (centered words, in purple or in red), and `right` puts a control where the value goes. */
export function SetRow({
  icon,
  tone,
  label,
  sub,
  value,
  onPress,
  chevron,
  act,
  right,
  left,
  bold,
  a11y,
}: {
  icon?: string;
  tone?: Tone;
  label: string;
  sub?: string;
  value?: string;
  onPress?: () => void;
  /** it opens a page: true unless it is an action or has a control */
  chevron?: boolean;
  act?: 'accent' | 'danger';
  right?: ReactNode;
  left?: ReactNode;
  bold?: boolean;
  a11y?: { role?: 'button' | 'radio' | 'switch'; checked?: boolean };
}) {
  const c = useTheme();
  const tint = useTone(tone);
  const ink = act === 'danger' ? c.danger : act === 'accent' ? c.accentText : c.ink;
  const body = (
    <View style={s.row}>
      {left}
      {icon ? (
        <View style={s.ic}>
          <Icon name={icon} size={22} color={tint} />
        </View>
      ) : null}
      <View style={[s.in, { borderBottomColor: c.line }]}>
        <View style={{ flex: 1, gap: 2, paddingVertical: sub ? 10 : 0 }}>
          <T style={[s.label, { color: ink, textAlign: act ? 'center' : 'left' }, bold || act ? { fontFamily: font.bodySemi } : null]}>{label}</T>
          {sub ? (
            <T v="small" tone="muted">
              {sub}
            </T>
          ) : null}
        </View>
        {value ? (
          <T style={[s.label, { color: c.muted, flexShrink: 1, maxWidth: '50%', textAlign: 'right' }]} numberOfLines={1}>
            {value}
          </T>
        ) : null}
        {right}
        {(chevron ?? (!!onPress && !act && !right)) ? <Icon name="next" size={16} color={c.muted} /> : null}
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole={a11y?.role || 'button'}
      accessibilityState={a11y?.checked != null ? { checked: a11y.checked } : undefined}
      accessibilityLabel={value ? label + ', ' + value : label}
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: pressed ? c.surface2 : 'transparent' })}>
      {body}
    </Pressable>
  );
}

/** a choice of one: a round check by each, filled in purple on the chosen one */
export function SetPick<V extends string | number | null>({
  options,
  value,
  onPick,
}: {
  options: readonly (readonly [V, string])[];
  value: V;
  onPick: (v: V) => void;
}) {
  const c = useTheme();
  return (
    <>
      {options.map(([v, l]) => {
        const on = v === value;
        return (
          <SetRow
            key={String(v)}
            label={l}
            bold={on}
            chevron={false}
            a11y={{ role: 'radio', checked: on }}
            onPress={() => {
              if (on) return;
              buzz('tap');
              onPick(v);
            }}
            left={
              <View style={[s.radio, on ? { backgroundColor: c.accent, borderColor: c.accent } : { borderColor: c.line }]}>
                {on ? <Icon name="check" size={14} color={c.accentInk} /> : null}
              </View>
            }
          />
        );
      })}
    </>
  );
}

/** on or off, with the phone's own switch */
export function SetSwitch({ label, sub, on, onChange }: { label: string; sub?: string; on: boolean; onChange: (on: boolean) => void }) {
  const c = useTheme();
  return (
    <SetRow
      label={label}
      sub={sub}
      chevron={false}
      right={
        <Switch
          value={on}
          onValueChange={onChange}
          accessibilityLabel={label}
          trackColor={{ false: c.line, true: c.accent }}
          thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
          ios_backgroundColor={c.line}
        />
      }
    />
  );
}

/** something that is not a row (a stepper, a date) inside a group, with the row's padding and line */
export function SetCell({ children }: { children: ReactNode }) {
  const c = useTheme();
  return <View style={[s.cell, { borderBottomColor: c.line }]}>{children}</View>;
}

const s = StyleSheet.create({
  wrap: { gap: 8 },
  head: { fontFamily: font.displayBold, fontSize: 17, lineHeight: 22, paddingHorizontal: 20 },
  foot: { paddingHorizontal: 20 },
  group: { borderRadius: 26, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingLeft: 16 },
  ic: { width: 30, marginRight: 14, alignItems: 'center' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, marginRight: 14, alignItems: 'center', justifyContent: 'center' },
  in: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, paddingRight: 16, borderBottomWidth: 1 },
  label: { fontFamily: font.body, fontSize: 17, lineHeight: 22 },
  cell: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, gap: 8 },
});
