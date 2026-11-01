/* Obsidian: the journal, copied to a folder in the person's vault (core journal-notes.ts; lib/notes.ts does the copying). A row
   in Settings on an iPhone, and nowhere else: it is not marketed, and nobody meets it who does not go looking.

   It is a page of the journal, so it has the journal's night and the light of the newest entry's feeling, and the one thing on
   it is a note, the person's newest, as Obsidian will show it. The tags below it change that note as they change. A tag is
   edited where it stands, so nothing is hidden by the keyboard, and a change reaches every entry and every note, so the
   spelling stays the same across them. */
import { changeSettings, cleanTag, cleanTags, jnList, jnNoteFile, jnNoteTags, jnRenameTag, jnTagCounts, jnTagsOf, type JEntry } from '@daybook/core';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Link } from '@/components/choices';
import { entryLook, feelColor, JN, Light } from '@/components/journal';
import { Rows } from '@/components/link-card';
import { Dock } from '@/components/scene';
import { SheetFrame, SheetH } from '@/components/sheet';
import { Text, TextInput } from '@/components/text';
import { Button, Icon, InkContext, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { pickNoteFolder, stopNotes, useNotes } from '@/lib/notes';
import { useStore } from '@/lib/store';
import { font, NightContext, nightInk, PaletteOverride, useSkyTheme, useTheme } from '@/lib/theme';

const INK = { ink: nightInk.ink, muted: nightInk.muted };
/** shown until there is an entry with words to show */
const SAMPLE: JEntry = { id: 'sample00', d: '2026-11-01', at: new Date(2026, 10, 1, 8, 30).getTime(), w: 'Calm', t: 'A few honest lines, just for you.', u: 0 };

export default function Notes() {
  const notes = useNotes();
  const { snap } = useStore();
  const { width: W } = useWindowDimensions();
  const base = useSkyTheme('paper');
  /* the journal's night, with the bar's color for the lists, so a list sits on the page the way New entry does */
  const look = useMemo(() => ({ ...base, bg: 'transparent', surface: JN.bar, line: 'rgba(235, 235, 245, 0.12)' }), [base]);
  /* an old link on a device with no way to do it */
  if (!notes.can) return <Redirect href="/" />;
  const newest = jnList(snap.journal).find((e) => e.t.trim()) ?? SAMPLE;
  return (
    <NightContext.Provider value={true}>
      <InkContext.Provider value={INK}>
        <NightPage look={look} color={entryLook(newest).color} width={W}>
          {notes.on ? <On newest={newest} /> : <Off newest={newest} />}
        </NightPage>
      </InkContext.Provider>
    </NightContext.Provider>
  );
}

function NightPage({
  look,
  color,
  width,
  children,
}: {
  look: React.ContextType<typeof PaletteOverride>;
  color: string;
  width: number;
  children: React.ReactNode;
}) {
  return (
    <PaletteOverride.Provider value={look}>
      <StatusBar style="light" />
      <View style={s.page}>
        <Light colors={[color]} w={width * 1.9} h={610} strength={0.42} style={{ left: -width * 0.4, top: -250 }} />
        {children}
      </View>
    </PaletteOverride.Provider>
  );
}

/** the person's newest entry, as the note Obsidian will show. It has no edge but its fill, and no heading: it is the page's one thing */
function NotePreview({ e }: { e: JEntry }) {
  const { snap } = useStore();
  const tags = jnNoteTags(e, jnTagsOf(snap.settings));
  return (
    <View style={s.note} accessible accessibilityLabel={`A note in your vault: ${e.w}, ${e.d}. Tags: ${tags.join(', ')}.`}>
      <Text style={s.noteFile} numberOfLines={1}>
        {jnNoteFile(e).replace(/\.md$/, '')}
      </Text>
      <Text style={s.noteLinks}>
        <Text style={{ color: feelColor(e.w) }}>{e.w}</Text>
        <Text style={s.noteDot}>{'  ·  '}</Text>
        {e.d}
      </Text>
      <Text style={s.noteBody} numberOfLines={3}>
        {e.t.trim()}
      </Text>
      <Text style={s.noteTags}>{tags.map((t) => '#' + t).join('  ')}</Text>
    </View>
  );
}

function Off({ newest }: { newest: JEntry }) {
  const { say } = useStore();
  return (
    <SheetFrame title="Obsidian" sub="Each journal entry becomes a note in your vault.">
      <View style={s.middle}>
        <NotePreview e={newest} />
      </View>
      <Dock>
        <T v="small" tone="muted" style={s.c}>
          Next, go to iCloud Drive, then Obsidian, and open the folder in your vault. Daybook writes only its own notes there.
        </T>
        <Button label="Pick a folder" onPress={() => pick(say)} />
      </Dock>
    </SheetFrame>
  );
}

async function pick(say: (m: string) => void) {
  buzz('tap');
  try {
    if (await pickNoteFolder()) buzz('save');
  } catch {
    say('That folder could not be opened. Try another one.');
  }
}

function On({ newest }: { newest: JEntry }) {
  const notes = useNotes();
  const { snap, update, say } = useStore();
  const [sure, setSure] = useState(false);
  const every = jnTagsOf(snap.settings);
  const others = jnTagCounts(snap.journal, every);
  const setEvery = (list: string[], rename?: [string, string]) =>
    update((s0) => ({
      ...s0,
      settings: s0.settings ? changeSettings(s0.settings, (x) => void (x.jnTags = cleanTags(list))) : s0.settings,
      journal: rename ? jnRenameTag(s0.journal || {}, rename[0], rename[1]) : s0.journal,
    }));
  const renameOther = (from: string, to: string) => update((s0) => ({ ...s0, journal: jnRenameTag(s0.journal || {}, from, to) }));
  const place = notes.name + '  ·  ' + (notes.count === 1 ? '1 note' : notes.count + ' notes');
  return (
    <SheetFrame title="Obsidian" sub={place}>
      {notes.lost ? <T>Daybook cannot reach this folder right now. It tries again each time the app opens. If this stays, pick the folder again.</T> : null}
      {notes.kept ? (
        <T tone="muted" v="small">
          {notes.kept === 1
            ? 'One note was changed outside Daybook, so it was kept beside the new one.'
            : notes.kept + ' notes were changed outside Daybook, so they were kept beside the new ones.'}
        </T>
      ) : null}
      <NotePreview e={newest} />

      <View style={s.group}>
        <SheetH title="On every note" />
        <Rows>
          {every.map((t) => (
            <TagRow
              key={t}
              tag={t}
              onSave={(to) =>
                setEvery(
                  every.map((x) => (x === t ? to : x)),
                  [t, to],
                )
              }
              onRemove={() => setEvery(every.filter((x) => x !== t))}
            />
          ))}
          <AddRow onAdd={(t) => setEvery([...every, t])} />
        </Rows>
        <T tone="muted" v="small">
          The feeling goes on too. Tap a tag to rename it, and every note follows.
        </T>
      </View>

      {others.length ? (
        <View style={s.group}>
          <SheetH title="On some entries" />
          <Rows>
            {others.map((o) => (
              <TagRow key={o.tag} tag={o.tag} count={o.n} onSave={(to) => renameOther(o.tag, to)} onRemove={() => renameOther(o.tag, '')} />
            ))}
          </Rows>
        </View>
      ) : null}

      <Dock>
        <Button label="Change folder" kind="ghost" onPress={() => pick(say)} />
        <View style={s.c2}>
          <Link
            label={sure ? 'Tap again to stop. The notes stay.' : 'Stop copying'}
            onPress={() => {
              buzz('tap');
              if (!sure) return setSure(true);
              setSure(false);
              void stopNotes();
            }}
          />
        </View>
      </Dock>
    </SheetFrame>
  );
}

/** one tag, editable where it stands. Its name is saved when the keyboard goes away; taking it off takes two taps, since it
    leaves every note */
function TagRow({ tag, count, onSave, onRemove }: { tag: string; count?: number; onSave: (to: string) => void; onRemove: () => void }) {
  const c = useTheme();
  const [draft, setDraft] = useState(tag);
  const [typing, setTyping] = useState(false);
  const [sure, setSure] = useState(false);
  const gone = useRef(false);
  const commit = () => {
    setTyping(false);
    setSure(false);
    if (gone.current) return;
    const clean = cleanTag(draft);
    if (clean && clean !== tag) onSave(clean);
    else setDraft(tag);
  };
  return (
    <View style={[s.row, { borderBottomColor: c.line }]}>
      <Text style={s.hash}>#</Text>
      <TextInput
        accessibilityLabel={'Tag ' + tag + (count ? ', on ' + count + (count === 1 ? ' entry' : ' entries') : '')}
        value={draft}
        onChangeText={setDraft}
        onFocus={() => setTyping(true)}
        onEndEditing={commit}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={40}
        returnKeyType="done"
        keyboardAppearance="dark"
        selectionColor={JN.accent}
        style={s.input}
      />
      {typing ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sure ? 'Tap again to take ' + tag + ' off' : 'Take ' + tag + ' off'}
          hitSlop={8}
          onPress={() => {
            buzz('tap');
            if (!sure) return setSure(true);
            gone.current = true;
            onRemove();
          }}
          style={s.off}>
          {sure ? <Text style={s.offT}>Take off</Text> : <Icon name="x" size={17} color={JN.quiet} />}
        </Pressable>
      ) : count ? (
        <Text style={s.count}>{count}</Text>
      ) : null}
    </View>
  );
}

function AddRow({ onAdd }: { onAdd: (t: string) => void }) {
  const c = useTheme();
  const [draft, setDraft] = useState('');
  const add = () => {
    const clean = cleanTag(draft);
    setDraft('');
    if (!clean) return;
    buzz('tap');
    onAdd(clean);
  };
  return (
    <View style={[s.row, { borderBottomColor: c.line }]}>
      <Icon name="plus" size={15} color={JN.quiet} />
      <TextInput
        accessibilityLabel="Add a tag"
        placeholder="Add a tag"
        placeholderTextColor={JN.quiet}
        value={draft}
        onChangeText={setDraft}
        onEndEditing={add}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={40}
        returnKeyType="done"
        keyboardAppearance="dark"
        selectionColor={JN.accent}
        style={s.input}
      />
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: JN.paper, overflow: 'hidden' },
  middle: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  c: { textAlign: 'center' },
  c2: { alignItems: 'center' },
  group: { gap: 8, marginTop: 8 },
  note: { gap: 8, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.07)' },
  noteFile: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18, color: JN.quiet },
  noteLinks: { fontFamily: font.display, fontSize: 22, lineHeight: 28, color: JN.accent },
  noteDot: { color: JN.quiet },
  noteBody: { fontFamily: font.body, fontSize: 17, lineHeight: 25, color: JN.page },
  noteTags: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 20, color: JN.accent },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, borderBottomWidth: 1 },
  hash: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: JN.quiet },
  input: { flex: 1, minHeight: 44, paddingVertical: 0, fontFamily: font.bodySemi, fontSize: 15, color: JN.ink },
  off: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  offT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: '#FF9A8D' },
  count: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 20, color: JN.quiet },
});
