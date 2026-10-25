/* Every tool, in its four groups (the legacy toolCard and the Tools grid). Used by the Tools tab and by the second SOS screen,
   where each tool can carry a small tag ("Worked 3 of 4", core: urTags). */
import { TOOL_GROUPS, TOOLS, UR_QUIET, urTried, type Days } from '@daybook/core';
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

/* each tool's own Material shape, picked for what the tool does, and turned a little as if placed by hand: sunny for
   breath, a steady arch to come back to the room, a flower to get curious, a cloud for a thought, an arrow forward, a
   cookie to wait, a burst to move, a moon-like oval for bed, a very sunny surprise, a gem for a need, a heart for a person,
   and a 12-sided cookie for your reasons */
const TOOL_SHAPES: Record<string, { kind: ShapeKind; turn: number }> = {
  breathe: { kind: 'sunny', turn: 8 },
  ground: { kind: 'arch', turn: 0 },
  curious: { kind: 'flower', turn: -6 },
  thought: { kind: 'puffy', turn: -8 },
  feel: { kind: 'clover8', turn: -8 },
  forward: { kind: 'arrow', turn: 90 },
  pause: { kind: 'cookie9', turn: 12 },
  move: { kind: 'softBurst', turn: 6 },
  bed: { kind: 'oval', turn: 0 },
  surprise: { kind: 'verySunny', turn: 16 },
  halt: { kind: 'gem', turn: 0 },
  message: { kind: 'heart', turn: 0 },
  reasons: { kind: 'cookie12', turn: -4 },
};

/** a tool's icon on its own soft shape (the Tools grid, the SOS button) */
export function ToolShape({ id, ic, size, iconSize, color, ink }: { id: string; ic: string; size: number; iconSize: number; color: string; ink: string }) {
  const k = TOOL_SHAPES[id] || { kind: 'cookie9', turn: 0 };
  return (
    <Shape kind={k.kind} size={size} color={color} turn={k.turn}>
      {/* on the web the shape's drawing is placed absolutely and would paint over a plain child, so the icon is placed too */}
      <View style={{ position: 'relative' }}>
        <Icon name={ic} size={iconSize} color={ink} />
      </View>
    </Shape>
  );
}

/** fresh: mark the tools not tried yet with "New" (Learn). SOS leaves it off: in the middle of an urge eleven badges are
    noise, and its tags say what has worked instead. `night` (SOS only): Go to bed is in the list only late at night; Learn
    leaves it out, so Go to bed is always there to practice. Surprise me is in neither (core UR_QUIET). */
export function ToolGrid({
  days,
  onPick,
  tags,
  fresh = true,
  night,
}: {
  days: Days;
  onPick: (id: string) => void;
  tags?: Record<string, string>;
  fresh?: boolean;
  night?: boolean;
}) {
  const c = useTheme();
  const tried = urTried(days);
  const any = fresh && TOOLS.some((t) => tried[t.id]);
  return (
    <View style={{ alignSelf: 'stretch', gap: 14 }}>
      {TOOL_GROUPS.map(([g, name]) => (
        <View key={g} style={{ gap: 8 }}>
          <T v="eyebrow" tone="muted" accessibilityRole="header">
            {name}
          </T>
          <View style={s.grid}>
            {TOOLS.filter((t) => t.g === g && UR_QUIET.indexOf(t.id) < 0 && !(t.id === 'bed' && night === false)).map((t) => {
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
