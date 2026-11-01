/* An entry's words as Markdown, the way Obsidian shows them (core markdown.ts). Only used while Obsidian is on. NoteText is the
   page when reading, with the marks gone; NoteSource goes inside the text box while writing, where every mark stays, faint, and
   the words take their look as they are typed. Neither changes a character of what was written. */
import { mdBlocks, mdSource, mdToggleTask, type MdBlock, type MdSpan } from '@daybook/core';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View, type TextStyle } from 'react-native';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font } from '@/lib/theme';

import { JN } from './journal';

/* the two fonts Markdown needs that nothing else does; lib/notes.ts loads them when Obsidian is on */
export const ITALIC = 'InstrumentSans_400Regular_Italic';
export const BOLD_ITALIC = 'InstrumentSans_700Bold_Italic';

const WORDS = '#F4F2F8';
const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

/** a heading's look. The entry's feeling is the page's title, at 28, so a heading stays under it */
const heading = (level: number): TextStyle =>
  level === 1
    ? { fontFamily: font.display, fontSize: 22, lineHeight: 30 }
    : level === 2
      ? { fontFamily: font.display, fontSize: 20, lineHeight: 28 }
      : { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 27 };

/** how a piece of the words looks */
function look(p: MdSpan): TextStyle {
  return {
    ...(p.b && p.i ? { fontFamily: BOLD_ITALIC } : p.b ? { fontFamily: font.bodyBold } : p.i ? { fontFamily: ITALIC } : null),
    ...(p.s ? { textDecorationLine: 'line-through' as const } : null),
    ...(p.h ? { backgroundColor: 'rgba(255, 210, 90, 0.28)' } : null),
    ...(p.c ? { fontFamily: MONO, backgroundColor: 'rgba(255, 255, 255, 0.1)' } : null),
    ...(p.link ? { color: JN.accent } : null),
    ...(p.embed ? { color: JN.quiet } : null),
  };
}

function Spans({ spans }: { spans: MdSpan[] }) {
  return spans
    .filter((p) => !p.mk)
    .map((p, i) =>
      p.url ? (
        <Text key={i} accessibilityRole="link" style={[look(p), s.linkLine]} onPress={() => void Linking.openURL(p.url!)}>
          {p.t}
        </Text>
      ) : (
        <Text key={i} style={look(p)}>
          {p.t}
        </Text>
      ),
    );
}

/** the words when reading. A task can be ticked here, as in Obsidian, and a tap on a line starts writing there */
export function NoteText({ text, onChange, onWrite }: { text: string; onChange: (t: string) => void; onWrite: (line: number) => void }) {
  return (
    <View style={s.page}>
      {mdBlocks(text.trim()).map((b) => (
        <Pressable key={b.line} accessible={false} onPress={() => onWrite(b.line)}>
          {blockView(b, text, onChange)}
        </Pressable>
      ))}
    </View>
  );
}

function blockView(b: MdBlock, text: string, onChange: (t: string) => void) {
  if (b.k === 'blank') return <View style={s.blank} />;
  if (b.k === 'hr') return <View style={s.hr} />;
  if (b.k === 'h')
    return (
      <Text accessibilityRole="header" style={[s.words, heading(b.level), b.level > 3 && { color: JN.page }, { marginTop: 8 }]}>
        <Spans spans={b.spans} />
      </Text>
    );
  if (b.k === 'quote')
    return (
      <View style={s.quote}>
        <Text style={[s.words, { color: JN.page }]}>
          <Spans spans={b.spans} />
        </Text>
      </View>
    );
  if (b.k === 'li')
    return (
      <View style={[s.row, { marginLeft: b.depth * 20 }]}>
        <Text style={[s.words, s.lead]}>{b.n ?? '•'}</Text>
        <Text style={[s.words, s.rowT]}>
          <Spans spans={b.spans} />
        </Text>
      </View>
    );
  if (b.k === 'task')
    return (
      <Pressable
        key={b.line}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: b.done }}
        hitSlop={8}
        onPress={() => {
          buzz('tap');
          onChange(mdToggleTask(text.trim(), b.line));
        }}
        style={[s.row, { marginLeft: b.depth * 20 }]}>
        <View style={[s.box, b.done && s.boxOn]}>{b.done ? <Icon name="check" size={13} color={JN.accentInk} /> : null}</View>
        <Text style={[s.words, s.rowT, b.done && s.done]}>
          <Spans spans={b.spans} />
        </Text>
      </Pressable>
    );
  if (b.k === 'code')
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.code}>
        <Text style={s.codeT}>{b.lines.join('\n')}</Text>
      </ScrollView>
    );
  if (b.k === 'table')
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {[b.head, ...b.rows].map((row, r) => (
            <View key={r} style={[s.tr, r > 0 && s.trLine]}>
              {row.map((cell, c) => (
                <Text key={c} style={[s.words, s.td, r === 0 && { fontFamily: font.bodySemi }]}>
                  <Spans spans={cell} />
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  return (
    <Text style={s.words}>
      <Spans spans={b.spans} />
    </Text>
  );
}

/** the words while writing: every character stays, and only its look changes. It goes inside the TextInput */
export function NoteSource({ text }: { text: string }) {
  return mdSource(text).map((p, i) => (
    <Text
      key={i}
      style={[
        look(p),
        p.level ? heading(p.level) : null,
        p.mk || p.quiet ? { color: 'rgba(235, 235, 245, 0.4)' } : null,
        /* a mark takes no look of its own but its faintness */
        p.mk && !p.level ? { fontFamily: font.body, backgroundColor: 'transparent' } : null,
      ]}>
      {p.t}
    </Text>
  ));
}

const s = StyleSheet.create({
  /* the same place on the page as the text box, so nothing jumps when one takes over from the other */
  page: { marginTop: 14, paddingTop: 4, paddingBottom: 12 },
  words: { fontFamily: font.body, fontSize: 17, lineHeight: 27, color: WORDS },
  linkLine: { textDecorationLine: 'underline' },
  blank: { height: 12 },
  hr: { height: StyleSheet.hairlineWidth, marginVertical: 14, backgroundColor: 'rgba(235, 235, 245, 0.25)' },
  quote: { paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: JN.accent },
  row: { flexDirection: 'row', gap: 8 },
  lead: { minWidth: 16, color: JN.quiet },
  rowT: { flex: 1 },
  box: { width: 20, height: 20, marginTop: 3, borderRadius: 6, borderWidth: 1.5, borderColor: JN.quiet, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: JN.accent, borderColor: JN.accent },
  done: { color: JN.quiet, textDecorationLine: 'line-through' },
  code: { marginVertical: 4, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.07)' },
  codeT: { fontFamily: MONO, fontSize: 13, lineHeight: 20, color: WORDS },
  tr: { flexDirection: 'row' },
  trLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(235, 235, 245, 0.25)' },
  td: { minWidth: 96, maxWidth: 220, paddingVertical: 6, paddingRight: 16 },
});
