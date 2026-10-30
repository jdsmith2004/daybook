/* The pieces the Get help pages are made of: a card with a title, a list, a phone number with Copy, a link that leaves the app,
   a quiet note, and a lesson that goes with the page. Ported from the legacy hcard, hitem, numRow, ext, P, UL, OL, note and relLesson. */
import { lessonById, lessonGate, lessonNo, lessonWalk, lmin } from '@daybook/core';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { LinkCard } from '@/components/link-card';
import { Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import { copyText, WORDS } from '@/lib/words';

export function useCopy() {
  const { say } = useStore();
  return (text: string, ok: string = WORDS.copied) => copyText(text, say, ok);
}

/** a small plain button: Copy, or a link to somewhere in the app */
export function ChipBtn({ icon, label, onPress, a11y }: { icon?: string; label: string; onPress: () => void; a11y?: string }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y || label}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [s.chip, { opacity: pressed ? 0.7 : 1 }]}>
      {icon ? <Icon name={icon} size={16} color={c.accentText} /> : null}
      <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.accentText }}>{label}</Text>
    </Pressable>
  );
}

export function CopyChip({ text, label = 'Copy' }: { text: string; label?: string }) {
  const copy = useCopy();
  return <ChipBtn icon="copy" label={label} a11y={label === 'Copy' ? 'Copy ' + text : label} onPress={() => copy(text)} />;
}

/** a link that opens a web page outside the app */
export function Ext({ url, label }: { url: string; label: string }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityHint="Opens outside the app"
      onPress={() => Linking.openURL(url).catch(() => undefined)}
      hitSlop={6}
      style={s.ext}>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.accentText }}>{label}</Text>
      <Icon name="ext" size={14} color={c.accentText} />
    </Pressable>
  );
}

export const Links = ({ children }: { children: ReactNode }) => <View style={s.links}>{children}</View>;

/** a titled part of the page, read like a page of a book: the heading close to its words, with room above (legacy hcard) */
export function HCard({ title, children, links }: { title: string; children: ReactNode; links?: ReactNode }) {
  return (
    <View style={s.part}>
      <T v="h2" accessibilityRole="header">
        {title}
      </T>
      {children}
      {links ? <Links>{links}</Links> : null}
    </View>
  );
}

/** a titled section on the page, outside a card (legacy sec) */
export function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={s.part}>
      <T v="h2" accessibilityRole="header">
        {title}
      </T>
      {children}
    </View>
  );
}

export const P = ({ children }: { children: ReactNode }) => <T>{children}</T>;
export const B = ({ children }: { children: ReactNode }) => <Text style={{ fontFamily: font.bodyBold }}>{children}</Text>;
export function Code({ children }: { children: string }) {
  const c = useTheme();
  return <Text style={{ fontFamily: 'Courier', backgroundColor: c.surface2, color: c.ink }}>{children}</Text>;
}

export function UL({ items }: { items: ReactNode[] }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((x, i) => (
        <View key={i} style={s.li}>
          <T>•</T>
          <T style={{ flex: 1 }}>{x}</T>
        </View>
      ))}
    </View>
  );
}
export function OL({ items }: { items: ReactNode[] }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((x, i) => (
        <View key={i} style={s.li}>
          <T v="label">{i + 1}.</T>
          <T style={{ flex: 1 }}>{x}</T>
        </View>
      ))}
    </View>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <T v="label">{children}</T>;
}

/** a phone number with a Copy button (legacy numRow) */
export function NumRow({ name, num, note, copy, first }: { name: string; num: string; note: string; copy: string; first?: boolean }) {
  const c = useTheme();
  return (
    <View style={[s.num, { borderColor: c.line }, first && { borderTopWidth: 0 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{name}</T>
        <Text style={{ fontFamily: font.display, fontSize: 20, color: c.accentText }} selectable>
          {num}
        </Text>
        <T v="small" tone="muted">
          {note}
        </T>
      </View>
      <CopyChip text={copy} />
    </View>
  );
}

/** a lesson that goes with the page you are on (legacy relLesson) */
export function RelLesson({ id }: { id: string }) {
  const { snap } = useStore();
  const L = lessonById(id);
  if (!L) return null;
  /* a lesson the path has not reached yet opens as its key idea (lesson/[id]) */
  const w = lessonWalk(snap.days, snap.settings);
  const g = lessonGate(L, w);
  return (
    <LinkCard
      icon="book"
      title={(lessonNo(L, snap.settings) ? `Lesson ${lessonNo(L, snap.settings)}: ` : '') + L.title}
      sub={g === 'key' ? 'The key idea' : w.walked.has(id) ? 'Done · read it again' : lmin(L) + ' · up next'}
      onPress={() => router.push({ pathname: '/lesson/[id]', params: { id } })}
    />
  );
}

export function Fine({ children }: { children: ReactNode }) {
  return (
    <T v="small" tone="muted" style={{ textAlign: 'center' }}>
      {children}
    </T>
  );
}

const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, minWidth: 44 },
  ext: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, alignItems: 'center' },
  li: { flexDirection: 'row', gap: 8 },
  part: { gap: 8, marginTop: 8 },
  num: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1 },
});
