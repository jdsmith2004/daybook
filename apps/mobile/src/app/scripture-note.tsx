/* A note on some verses, written into the person's Obsidian vault the way the reader plugin writes it (core scripture.ts
   saveScrNote). The box and its Save stay together at the top, since the keyboard covers the bottom; the verses sit under it.

   The person's words are never lost. They are kept on this phone before anything is written, and let go only once the vault has
   them. When the note changed in Obsidian since this sheet read it, nothing is written: both are shown, and the person picks. */
import { scrLabel, scrVerseList, type ScrNote, type ScrVerse } from '@daybook/core';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Link } from '@/components/choices';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { scrType } from '@/components/scripture';
import { Text, TextInput } from '@/components/text';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { dropWaiting, openChapter, readNotes, saveNote, useScripture, waitingFor } from '@/lib/scripture';
import { font, useTheme } from '@/lib/theme';

export default function ScriptureNote() {
  const lib = useScripture();
  const { key, v } = useLocalSearchParams<{ key: string; v: string }>();
  const verses = scrVerseList(v || '');
  if (!lib.can || !lib.on || !key || !verses.length) return <Redirect href="/scripture" />;
  return <NoteSheet chKey={key} verses={verses} />;
}

type Phase = { k: 'edit' } | { k: 'saving' } | { k: 'away' } | { k: 'changed'; theirs: string | null };

function NoteSheet({ chKey, verses }: { chKey: string; verses: number[] }) {
  const c = useTheme();
  const label = scrLabel(chKey, verses);
  const [words, setWords] = useState<ScrVerse[]>([]);
  /* the note as the vault has it, which is what a save may write over; undefined until read */
  const [base, setBase] = useState<string | null | undefined>(undefined);
  const [text, setText] = useState('');
  const [phase, setPhase] = useState<Phase>({ k: 'edit' });

  useEffect(() => {
    let live = true;
    (async () => {
      const [o, wait] = await Promise.all([openChapter(chKey).catch(() => null), waitingFor(chKey, verses)]);
      if (!live) return;
      setWords((o?.chapter.verses ?? []).filter((x) => verses.includes(x.n)));
      const mine: ScrNote | undefined = o?.notes.find((n) => n.label === label);
      const there = mine ? mine.body : null;
      /* words still waiting from before come back into the box, compared with the note they were written over */
      if (wait) {
        setText(wait.body);
        setBase(wait.base);
        if (wait.base !== there && wait.changed) setPhase({ k: 'changed', theirs: there });
      } else {
        setText(there ?? '');
        setBase(o ? there : undefined);
        if (!o) setPhase({ k: 'away' });
      }
    })();
    return () => void (live = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chKey, label]);

  const save = async () => {
    if (base === undefined) return;
    buzz('tap');
    setPhase({ k: 'saving' });
    const r = await saveNote({ key: chKey, verses, body: text, base });
    if (r === 'saved' || r === 'same') {
      buzz('save');
      closeSheet();
      return;
    }
    if (r === 'unreachable') {
      setPhase({ k: 'away' });
      return;
    }
    const now = await readNotes(chKey).catch(() => null);
    const theirs = now ? (now.find((n) => n.label === label)?.body ?? null) : null;
    setPhase({ k: 'changed', theirs });
  };
  /* the person keeps the Obsidian note: their words go, and the box shows the note as it is now */
  const useTheirs = async (theirs: string | null) => {
    await dropWaiting(chKey, verses);
    setText(theirs ?? '');
    setBase(theirs);
    setPhase({ k: 'edit' });
  };
  /* the person keeps their own words over the Obsidian note */
  const keepMine = (theirs: string | null) => {
    setBase(theirs);
    setPhase({ k: 'edit' });
  };

  const changed = phase.k === 'changed' ? phase : null;
  return (
    <SheetFrame title={label}>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        autoFocus={!changed}
        placeholder="What do you notice?"
        placeholderTextColor={c.muted}
        accessibilityLabel={'Your note on ' + label}
        style={[s.box, { backgroundColor: c.surface, color: c.ink }]}
      />
      {changed ? (
        <View style={{ gap: 12 }}>
          <T>This note changed in Obsidian after you opened it. Your words are kept here until you choose.</T>
          <View style={[s.theirs, { backgroundColor: c.surface }]}>
            <T v="label">In your vault now</T>
            <T tone="muted">{changed.theirs ?? 'No note. It was taken out in Obsidian.'}</T>
          </View>
          <Button label="Keep my words" onPress={() => keepMine(changed.theirs)} />
          <View style={s.c}>
            <Link label="Use the note in my vault" tone="muted" onPress={() => void useTheirs(changed.theirs)} />
          </View>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {phase.k === 'away' ? (
            <T>Your vault cannot be reached right now. Your words are kept on this phone, and go into the vault the next time it can be reached.</T>
          ) : null}
          <Button
            label={phase.k === 'saving' ? 'Saving…' : base && !text.trim() ? 'Take the note out' : 'Save to my vault'}
            disabled={phase.k === 'saving' || base === undefined || (!text.trim() && !base)}
            onPress={() => void save()}
          />
        </View>
      )}
      <View style={{ gap: 8, marginTop: 8 }}>
        {words.map((w) => (
          <Text key={w.n} style={[s.verse, { color: c.ink }]}>
            <Text style={[scrType.n, { color: c.muted }]}>{w.n} </Text>
            {w.text}
          </Text>
        ))}
      </View>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  box: { minHeight: 140, borderRadius: 20, padding: 16, fontFamily: font.body, fontSize: 17, lineHeight: 24, textAlignVertical: 'top' },
  theirs: { borderRadius: 20, padding: 16, gap: 4 },
  verse: { fontFamily: font.serif, fontSize: 17, lineHeight: 26 },
  c: { alignItems: 'center' },
});
