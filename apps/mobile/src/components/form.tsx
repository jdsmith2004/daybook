/* Small form parts shared by Today, the Journal and My plan: a 0 to 10 rating you can tap or drag, a Yes/No pair, a stepper,
   a checkbox row, an On/Off pair, and a section that opens and closes (like the legacy <details>). */
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

/** an honest 0 to 10. Nothing is picked until the person picks; tap or drag along the track, or use the screen reader's adjust */
export function Rate({ label, lo, hi, value, onChange }: { label: string; lo: string; hi: string; value: number | null; onChange: (v: number) => void }) {
  const c = useTheme();
  const [w, setW] = useState(0);
  const has = value != null;
  const at = (e: GestureResponderEvent) => {
    if (!w) return;
    const v = Math.max(0, Math.min(10, Math.round((e.nativeEvent.locationX / w) * 10)));
    if (v !== value) {
      onChange(v);
      buzz('tap');
    }
  };
  const pct = ((has ? value! : 5) / 10) * 100;
  return (
    <View style={{ gap: 6 }}>
      <View style={s.between}>
        <T v="label">{label}</T>
        <Text style={[s.out, { color: has ? c.ink : c.muted }]}>{has ? value : '–'}</Text>
      </View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={has ? { min: 0, max: 10, now: value! } : { text: 'Not set' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => onChange(Math.max(0, Math.min(10, (has ? value! : 5) + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))}
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={at}
        onResponderMove={at}
        style={s.track}>
        <View pointerEvents="none" style={[s.rail, { backgroundColor: c.surface2 }]}>
          {has ? <View style={[s.fill, { width: `${pct}%`, backgroundColor: c.accent }]} /> : null}
        </View>
        <View pointerEvents="none" style={[s.knob, { left: `${pct}%`, backgroundColor: has ? c.accent : c.surface, borderColor: has ? c.accent : c.line }]} />
      </View>
      <View style={s.between}>
        <T v="small" tone="muted">
          {lo}
        </T>
        <T v="small" tone="muted">
          {hi}
        </T>
      </View>
    </View>
  );
}

/** Yes or No; tapping the one that is on turns it off */
export function YesNo({ label, value, onPick }: { label: string; value: 'Y' | 'N' | null; onPick: (v: 'Y' | 'N') => void }) {
  return (
    <View style={s.yn} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <T v="label" style={{ flex: 1 }}>
        {label}
      </T>
      <View style={s.seg}>
        <Pill label="Yes" on={value === 'Y'} onPress={() => onPick('Y')} />
        <Pill label="No" on={value === 'N'} onPress={() => onPick('N')} />
      </View>
    </View>
  );
}

/** On or Off */
export function OnOff({ name, sub, on, onPick }: { name: string; sub?: string; on: boolean; onPick: (on: boolean) => void }) {
  return (
    <View style={s.yn}>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{name}</T>
        {sub ? (
          <T v="small" tone="muted">
            {sub}
          </T>
        ) : null}
      </View>
      <View style={s.seg} accessibilityRole="radiogroup" accessibilityLabel={name}>
        <Pill label="On" on={on} onPress={() => onPick(true)} />
        <Pill label="Off" on={!on} onPress={() => onPick(false)} />
      </View>
    </View>
  );
}

export function Pill({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={({ pressed }) => [s.pill, { backgroundColor: on ? c.accent : c.surface, borderColor: on ? c.accent : c.line, opacity: pressed ? 0.85 : 1 }]}>
      <Text style={[s.pillT, { color: on ? c.accentInk : c.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** − 7.0 h + */
export function Stepper({ label, text, unset, onStep, less, more }: { label: string; text: string; unset: boolean; onStep: (d: number) => void; less: string; more: string }) {
  const c = useTheme();
  return (
    <View style={s.yn}>
      <T v="label" style={{ flex: 1 }}>
        {label}
      </T>
      <View style={s.seg}>
        <Pressable accessibilityRole="button" accessibilityLabel={less} onPress={() => onStep(-1)} style={[s.sq, { borderColor: c.line, backgroundColor: c.surface }]}>
          <Text style={[s.sqT, { color: c.ink }]}>−</Text>
        </Pressable>
        <Text style={[s.stepV, { color: unset ? c.muted : c.ink }]} accessibilityLiveRegion="polite">
          {text}
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={more} onPress={() => onStep(1)} style={[s.sq, { borderColor: c.line, backgroundColor: c.surface }]}>
          <Text style={[s.sqT, { color: c.ink }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** a checkbox line, with an optional small line under it */
export function Check({ label, why, on, onPress }: { label: string; why?: string; on: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={({ pressed }) => [s.chk, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={[s.box, { backgroundColor: on ? c.mint : 'transparent', borderColor: on ? c.mint : c.line }]}>{on ? <Icon name="check" size={16} color="#FFFFFF" /> : null}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{label}</T>
        {why ? (
          <T v="small" tone="muted">
            {why}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

/** a section that opens and closes */
export function Collapse({
  title,
  sub,
  right,
  icon,
  iconBg,
  iconInk,
  open,
  onToggle,
  children,
  tone,
}: {
  title: string;
  sub?: string;
  right?: string;
  icon?: string;
  iconBg?: string;
  iconInk?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  tone?: 'now' | 'done' | 'plain';
}) {
  const c = useTheme();
  return (
    <View style={[s.det, { borderColor: tone === 'now' ? c.accent : c.cardEdge, backgroundColor: c.surface }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={s.sum}>
        {icon ? (
          <View style={[s.ic, { backgroundColor: iconBg || c.accentSoft }]}>
            <Icon name={icon} size={20} color={iconInk || c.accentText} />
          </View>
        ) : null}
        <View style={{ flex: 1, gap: 1 }}>
          <T v="label">{title}</T>
          {sub ? (
            <T v="small" tone="muted">
              {sub}
            </T>
          ) : null}
        </View>
        {right ? (
          <T v="small" tone={tone === 'now' ? 'accentText' : tone === 'done' ? 'mintText' : 'muted'} style={{ fontFamily: font.bodySemi }}>
            {right}
          </T>
        ) : null}
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <Icon name="next" size={18} color={c.muted} />
        </View>
      </Pressable>
      {open ? <View style={s.in}>{children}</View> : null}
    </View>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  out: { fontFamily: font.display, fontSize: 18, minWidth: 24, textAlign: 'right' },
  track: { height: 36, justifyContent: 'center' },
  rail: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  knob: { position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 2, marginLeft: -13, top: 5 },
  yn: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  seg: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { minWidth: 56, minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 1.5 },
  pillT: { fontFamily: font.bodySemi, fontSize: 15 },
  sq: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  sqT: { fontFamily: font.bodyBold, fontSize: 20, lineHeight: 22 },
  stepV: { fontFamily: font.display, fontSize: 17, minWidth: 58, textAlign: 'center', fontVariant: ['tabular-nums'] },
  chk: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 4 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  det: { borderRadius: 18, borderWidth: 1.5, overflow: 'hidden' },
  sum: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 60 },
  ic: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  in: { paddingHorizontal: 14, paddingBottom: 14, gap: 12 },
});
