/* Every tool, in its four groups (the legacy toolCard and the Tools grid). Used by the Tools tab and by the second SOS screen,
   where each tool can carry a small tag ("Worked 3 of 4", core: urTags). */
import { TOOL_GROUPS, TOOLS, urTried, type Days } from '@daybook/core';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
                  <View style={[s.ic, { backgroundColor: soft }]}>
                    <Icon name={t.ic} size={22} color={ink} />
                  </View>
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
  ic: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: font.bodyBold, fontSize: 15 },
  desc: { fontFamily: font.body, fontSize: 12.5 },
  tag: { fontFamily: font.bodySemi, fontSize: 12, marginTop: 1 },
  new: { position: 'absolute', top: 6, right: 6, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999 },
  newT: { fontFamily: font.bodyBold, fontSize: 11 },
});
