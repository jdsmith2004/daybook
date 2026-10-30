/* The parts the tip sheet and the Daybook Pattern sheet share: the list of what opens, and a row to pay with. */
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Icon, T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

/** what a payment opens: an icon, the name and a line, with a check once it is open */
export function Perks({ list, open }: { list: { icon: string; name: string; sub: string }[]; open?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ gap: 10, alignSelf: 'stretch' }}>
      {list.map((p) => (
        <View key={p.name} style={[s.perk, { backgroundColor: open ? c.mintSoft : c.surface2 }]}>
          <View style={[s.perkIc, { backgroundColor: open ? c.mint : c.sunSoft }]}>
            <Icon name={open ? 'check' : p.icon} size={20} color={open ? '#FFFFFF' : c.sunText} />
          </View>
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

/** one way to pay: an icon in a circle, its name (and a line under it), and its price in a pill. The suggested one (badge) is
    drawn bigger, with a border, a filled price and the badge. */
export function PayRow({
  n,
  icon = 'heart',
  name,
  sub,
  price,
  badge,
  busy,
  off,
  onPress,
}: {
  /** 0, 1 or 2: the circle's color, and how big its icon is */
  n: number;
  icon?: string;
  name: string;
  sub?: string;
  price: string;
  badge?: string;
  busy: boolean;
  off: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  const tone = [
    { bg: c.sunSoft, fg: c.sunText },
    { bg: c.coralSoft, fg: c.coralText },
    { bg: c.accentSoft, fg: c.accentText },
  ][n];
  const pick = !!badge;
  const pillBg = pick ? c.accent : c.accentSoft;
  const pillFg = pick ? c.accentInk : c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${price}${sub ? '. ' + sub : ''}${badge ? ', ' + badge : ''}`}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        pick && s.pick,
        {
          backgroundColor: c.surface,
          borderColor: pick ? c.accent : 'transparent',
          shadowColor: c.lip,
          opacity: off && !busy ? 0.6 : 1,
          transform: [{ translateY: pressed ? 3 : 0 }],
        },
      ]}>
      <View style={[s.rowIc, { backgroundColor: tone.bg }]}>
        <Icon name={icon} size={16 + n * 4} color={tone.fg} />
      </View>
      <View style={{ flex: 1, gap: 4, alignItems: 'flex-start' }}>
        <Text style={[s.rowT, { color: c.ink }]}>{name}</Text>
        {sub ? (
          <T v="small" tone="muted">
            {sub}
          </T>
        ) : null}
        {badge ? (
          <View style={[s.badge, { backgroundColor: c.sun }]}>
            <Text style={[s.badgeT, { color: c.onSun }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={[s.pill, { backgroundColor: pillBg }]}>
        {busy ? <ActivityIndicator color={pillFg} size="small" /> : <Text style={[s.pillT, { color: pillFg }]}>{price}</Text>}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
  perkIc: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 20,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  rowIc: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pick: { minHeight: 78 },
  rowT: { fontFamily: font.bodyBold, fontSize: 17 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeT: { fontFamily: font.bodyBold, fontSize: 11.5, letterSpacing: 0.3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 84, minHeight: 40, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center' },
  pillT: { fontFamily: font.bodyBold, fontSize: 15 },
});
