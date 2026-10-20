/* Every tool, in its four groups (the legacy toolCard and the Tools grid). Used by the Tools tab and by the second SOS screen,
   where each tool can carry a small tag ("Worked 3 of 4", core: urTags). */
import { TOOL_GROUPS, TOOLS, urTried, type Days } from '@daybook/core';
import { Pressable, StyleSheet, View } from 'react-native';
import { Shape, type ShapeKind } from '@/components/shapes';
import { Text } from '@/components/text';

import { Icon, T } from '@/components/ui';
import { font, useTheme, type Palette } from '@/lib/theme';

/** a tool's soft color and its ink */
export const toolTone = (c: Palette, t: string) =>
  ({
    sky: [c.skySoft, c.skyText],
    mint: [c.mintSoft, c.mintText],
    accent: [c.accentSoft, c.accentText],
    sun: [c.sunSoft, c.sunText],
    violet: [c.violetSoft, c.violetText],
    coral: [c.coralSoft, c.coralText],
  })[t] || [c.surface2, c.ink];

/* each tool's own shape, turned a little as if placed by hand. `wobble` makes a loose blob. */
const TOOL_SHAPES: Record<string, { kind: ShapeKind; turn: number; wobble?: number }> = {
  breathe: { kind: 'scallop', turn: 8 },
  ground: { kind: 'clover', turn: 14 },
  curious: { kind: 'flower', turn: -6 },
  thought: { kind: 'circle', turn: 0, wobble: 0.7 },
  forward: { kind: 'tri', turn: -10 },
  pause: { kind: 'cookie', turn: 12 },
  move: { kind: 'pent', turn: 6 },
  bed: { kind: 'circle', turn: 0, wobble: 0.45 },
  surprise: { kind: 'flower', turn: 16 },
  halt: { kind: 'cookie', turn: -8 },
  message: { kind: 'clover', turn: -12 },
  reasons: { kind: 'scallop', turn: -4 },
};

/** a tool's icon on its own soft shape (the Tools grid, the SOS button) */
export function ToolShape({ id, ic, size, iconSize, color, ink }: { id: string; ic: string; size: number; iconSize: number; color: string; ink: string }) {
  const k = TOOL_SHAPES[id] || { kind: 'cookie', turn: 0 };
  return (
    <Shape kind={k.kind} size={size} color={color} turn={k.turn} wobble={k.wobble} seed={id.length}>
      {/* on the web the shape's drawing is placed absolutely and would paint over a plain child, so the icon is placed too */}
      <View style={{ position: 'relative' }}>
        <Icon name={ic} size={iconSize} color={ink} />
      </View>
    </Shape>
  );
}

export function ToolGrid({ days, onPick, tags }: { days: Days; onPick: (id: string) => void; tags?: Record<string, string> }) {
  const c = useTheme();
  const tried = urTried(days);
  const any = TOOLS.some((t) => tried[t.id]);
  return (
    <View style={{ alignSelf: 'stretch', gap: 14 }}>
      {TOOL_GROUPS.map(([g, name]) => (
        <View key={g} style={{ gap: 8 }}>
          <T v="eyebrow" tone="muted" accessibilityRole="header">
            {name}
          </T>
          <View style={s.grid}>
            {TOOLS.filter((t) => t.g === g).map((t) => {
              const [soft, ink] = toolTone(c, t.tone);
              const isNew = any && !tried[t.id];
              const tag = tags?.[t.id];
              return (
                <Pressable
                  key={t.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.name}. ${t.desc}${tag ? '. ' + tag : isNew ? '. New for you' : ''}`}
                  onPress={() => onPick(t.id)}
                  style={({ pressed }) => [s.tool, { backgroundColor: c.surface, shadowColor: c.lip, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
                  <ToolShape id={t.id} ic={t.ic} size={46} iconSize={22} color={soft} ink={ink} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.name, { color: c.ink }]}>{t.name}</Text>
                    <Text style={[s.desc, { color: c.muted }]}>{t.desc}</Text>
                    {tag ? <Text style={[s.tag, { color: c.mintText }]}>{tag}</Text> : null}
                  </View>
                  {isNew ? (
                    <View style={[s.new, { backgroundColor: c.sun }]}>
                      <Text style={[s.newT, { color: c.onSun }]}>New</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tool: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  name: { fontFamily: font.bodyBold, fontSize: 15 },
  desc: { fontFamily: font.body, fontSize: 12.5 },
  tag: { fontFamily: font.bodySemi, fontSize: 12, marginTop: 1 },
  new: { position: 'absolute', top: 6, right: 6, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 },
  newT: { fontFamily: font.bodyBold, fontSize: 11 },
});
