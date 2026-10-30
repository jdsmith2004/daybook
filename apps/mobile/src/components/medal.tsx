/* A badge's picture: its icon on a shape of its own (components/shapes.tsx), in the badge's color once it is earned, and quiet
   until then. The shape comes from the badge's name, so it never changes and no two neighbors look like the same stamp. */
import { StyleSheet, View } from 'react-native';

import { Shape, type ShapeKind } from '@/components/shapes';
import { Icon } from '@/components/ui';
import { toneOf, useTheme } from '@/lib/theme';

/* the shapes with room in the middle for an icon */
const KINDS: ShapeKind[] = ['cookie9', 'sunny', 'clover4', 'cookie6', 'gem', 'cookie12', 'flower', 'puffy', 'softBurst', 'pentagon', 'verySunny', 'clover8'];

const kindOf = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9973;
  return KINDS[h % KINDS.length];
};

export function Medal({ id, icon, tone, size, earned }: { id: string; icon: string; tone: string; size: number; earned: boolean }) {
  const c = useTheme();
  const t = toneOf(c, tone || 'accent');
  return (
    <View style={s.wrap}>
      <Shape kind={kindOf(id)} size={size} color={earned ? t.ic : c.surface2}>
        <Icon name={icon} size={size * 0.44} color={earned ? t.ink : c.muted} />
      </Shape>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
