/* The research cards' shared pieces (Talk it through and Rekindle): the sources as small chips that open the paper, and
   a card read before as its one line, which opens to the full card and its picture. */
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

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
            style={({ pressed }) => [s.src, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}>
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

/** the sources as one small line of names, each opening its paper: a bonus that takes almost no room */
export function SourceLine({ keys, map }: { keys: string[]; map: Record<string, [string, string]> }) {
  const c = useTheme();
  const ks = keys.filter((k) => map[k]);
  if (!ks.length) return null;
  return (
    <View style={s.line}>
      {ks.map((k, i) => (
        <Pressable
          key={k}
          accessibilityRole="link"
          accessibilityLabel={'Source: ' + map[k][0]}
          hitSlop={6}
          onPress={() => Linking.openURL(map[k][1]).catch(() => undefined)}
          style={({ pressed }) => [s.lineI, pressed && { opacity: 0.6 }]}>
          <Text style={[s.lineT, { color: c.muted }]} numberOfLines={1}>
            {srcName(map, k) + (i < ks.length - 1 ? ' ·' : '')}
          </Text>
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
  icon = 'check',
}: {
  short: string;
  body: string;
  src: string[];
  map: Record<string, [string, string]>;
  art: React.ReactNode;
  /** a check for a card read before; another icon for one shown only as its line */
  icon?: string;
}) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={[s.known, { backgroundColor: c.surface }]}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={s.knownHead}>
        <Icon name={icon} size={18} color={c.mintText} />
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
  body: { alignSelf: 'stretch', fontSize: 17, lineHeight: 24 },
  srcs: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  line: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 4, flexShrink: 1 },
  lineI: { minHeight: 24, justifyContent: 'center', maxWidth: '100%' },
  lineT: { fontFamily: font.bodyMedium, fontSize: 12, textDecorationLine: 'underline' },
  src: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%', minHeight: 32, paddingHorizontal: 12, borderRadius: 999 },
  srcT: { fontFamily: font.bodySemi, fontSize: 13, flexShrink: 1 },
  known: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  knownHead: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 32 },
});
