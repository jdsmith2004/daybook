/* The research cards' shared pieces (Talk it through and Rekindle): the sources as small chips that open the paper, and
   a card read before as its one line, which opens to the full card and its picture. */
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Reveal } from '@/components/form';
import { Icon, T } from '@/components/ui';
import { font, useTheme } from '@/lib/theme';

/** the short name of a source, for its chip: "Sayette, Loewenstein, Griffin & Black (2008)" */
const srcName = (map: Record<string, [string, string]>, k: string) => (map[k]?.[0] || '').split(':')[0];

export function Sources({ keys, map }: { keys: string[]; map: Record<string, [string, string]> }) {
  const c = useTheme();
  return (
    <View style={s.srcs}>
      {keys
        .filter((k) => map[k])
        .map((k) => (
          <Pressable
            key={k}
            accessibilityRole="link"
            accessibilityLabel={'Source: ' + map[k][0]}
            onPress={() => Linking.openURL(map[k][1]).catch(() => undefined)}
            style={({ pressed }) => [s.src, { backgroundColor: c.surface, borderColor: c.cardEdge, opacity: pressed ? 0.7 : 1 }]}>
            <Icon name="book" size={13} color={c.accentText} />
            <Text style={[s.srcT, { color: c.accentText }]} numberOfLines={1}>
              {srcName(map, k)}
            </Text>
            <Icon name="ext" size={12} color={c.accentText} />
          </Pressable>
        ))}
    </View>
  );
}

export function KnownLine({
  short,
  body,
  src,
  map,
  art,
}: {
  short: string;
  body: string;
  src: string[];
  map: Record<string, [string, string]>;
  art: React.ReactNode;
}) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={[s.known, { backgroundColor: c.surface, shadowColor: c.lip }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={s.knownHead}>
        <Icon name="check" size={18} color={c.mintText} />
        <T style={{ flex: 1 }}>{short}</T>
        <Icon name={open ? 'up' : 'down'} size={18} color={c.muted} />
      </Pressable>
      <Reveal open={open}>
        <View style={{ gap: 10, paddingTop: 8 }}>
          {open ? art : null}
          <T style={s.body}>{body}</T>
          <Sources keys={src} map={map} />
        </View>
      </Reveal>
    </View>
  );
}

const s = StyleSheet.create({
  body: { alignSelf: 'stretch', fontSize: 16.5, lineHeight: 24 },
  srcs: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  src: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%', minHeight: 32, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1.5 },
  srcT: { fontFamily: font.bodySemi, fontSize: 12.5, flexShrink: 1 },
  known: { borderRadius: 18, padding: 12, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  knownHead: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32 },
});
