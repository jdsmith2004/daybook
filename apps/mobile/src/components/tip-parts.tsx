/* The parts the tip sheet and the Daybook Pattern sheet share: the list of what opens, and a row to pay with. */
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Icon, T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

/** what a payment opens: an icon, the name and a line, with a check once it is open */
export function Perks({ list, open }: { list: { icon: string; name: string; sub: string }[]; open?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ gap: 12, alignSelf: 'stretch' }}>
      {list.map((p) => (
        <View key={p.name} style={s.perk}>
          <Icon name={open ? 'check' : p.icon} size={22} color={open ? c.mintText : c.sunText} />
          <View style={{ flex: 1, gap: 1 }}>
            <T v="label">{p.name}</T>
            <T v="small" tone="muted">
              {p.sub}
            </T>
          </View>
        </View>
      ))}
    </View>
  );
}

/** one way to pay, the whole row one tap: its name (and a line under it), and its price. The suggested one (badge) has an edge
    in the accent and its price on the one filled button. */
export function PayRow({
  name,
  sub,
  price,
  badge,
  busy,
  off,
  onPress,
}: {
  name: string;
  sub?: string;
  price: string;
  badge?: string;
  busy: boolean;
  off: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  const pick = !!badge;
  const fg = pick ? c.accentInk : c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${price}${sub ? '. ' + sub : ''}${badge ? ', ' + badge : ''}`}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        { backgroundColor: c.surface, borderColor: pick ? c.accent : 'transparent', opacity: off && !busy ? 0.6 : pressed ? 0.8 : 1 },
      ]}>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[s.rowT, { color: c.ink }]}>{name}</Text>
        {badge ? <Text style={[s.badgeT, { color: c.sunText }]}>{badge}</Text> : null}
        {sub ? (
          <T v="small" tone="muted">
            {sub}
          </T>
        ) : null}
      </View>
      <View style={[s.pill, pick && { backgroundColor: c.accent }]}>
        {busy ? <ActivityIndicator color={fg} size="small" /> : <Text style={[s.pillT, { color: fg }]}>{price}</Text>}
      </View>
    </Pressable>
  );
}

/** what Daybook Pattern opens: plain lines, each with a check */
export function PerkLines({ list, open }: { list: string[]; open?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ gap: 8, alignSelf: 'stretch' }}>
      {list.map((t) => (
        <View key={t} style={s.line}>
          <Icon name="check" size={18} color={open ? c.mint : c.sunText} />
          <T v="small" style={{ flex: 1 }}>
            {t}
          </T>
        </View>
      ))}
    </View>
  );
}

/** one choice in a group of ways to pay: a radio, what it is, and its price with how often it is paid */
export interface PlanChoice {
  id: string;
  name: string;
  sub: string;
  price: string;
  per: string;
  badge?: string;
}
export function Plans({ list, on, off, onPick }: { list: PlanChoice[]; on: string; off: boolean; onPick: (id: string) => void }) {
  const c = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={[s.plans, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
      {list.map((p, i) => {
        const here = p.id === on;
        return (
          <Pressable
            key={p.id}
            accessibilityRole="radio"
            accessibilityLabel={`${p.name}, ${p.price} ${p.per}. ${p.sub}${p.badge ? '. ' + p.badge : ''}`}
            accessibilityState={{ checked: here, disabled: off }}
            disabled={off}
            onPress={() => onPick(p.id)}
            style={({ pressed }) => [
              s.plan,
              i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
              here && { backgroundColor: c.accentSoft },
              pressed && { opacity: 0.8 },
            ]}>
            <View style={[s.radio, { borderColor: here ? c.accent : c.line, backgroundColor: here ? c.accent : 'transparent' }]}>
              {here ? <View style={[s.dot, { backgroundColor: c.accentInk }]} /> : null}
            </View>
            <View style={{ flex: 1, gap: 1 }}>
              <View style={s.nameRow}>
                <Text style={[s.rowT, { color: c.ink }]}>{p.name}</Text>
                {p.badge ? <Text style={[s.badgeT, { color: c.sunText }]}>{p.badge}</Text> : null}
              </View>
              <T v="small" tone="muted">
                {p.sub}
              </T>
            </View>
            <View style={s.price}>
              <Text style={[s.priceT, { color: c.ink }]}>{p.price}</Text>
              <T v="small" tone="muted">
                {p.per}
              </T>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  plans: { borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 66, paddingVertical: 10, paddingHorizontal: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { alignItems: 'flex-end' },
  priceT: { fontFamily: font.bodyBold, fontSize: 20 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 20,
    borderWidth: 2,
  },
  rowT: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  badgeT: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  pill: { alignItems: 'center', justifyContent: 'center', minWidth: 84, minHeight: 44, paddingHorizontal: 14, borderRadius: 999 },
  pillT: { fontFamily: font.bodySemi, fontSize: 17 },
});
