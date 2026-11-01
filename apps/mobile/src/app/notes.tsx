/* Copy journal to a folder (core journal-notes.ts; lib/notes.ts does the copying). A quiet sheet from the data part of the
   settings, on an iPhone only. Before a folder is picked it says what this does; after, it shows the folder and the tags on
   every note. A change to a tag changes it on every entry and every note, so the spelling stays the same across them. */
import { changeSettings, cleanTag, cleanTags, jnRenameTag, jnTagCounts, jnTagsOf } from '@daybook/core';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Field, Link } from '@/components/choices';
import { Rows } from '@/components/link-card';
import { Dock } from '@/components/scene';
import { SheetFrame, SheetH } from '@/components/sheet';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { pickNoteFolder, stopNotes, useNotes } from '@/lib/notes';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const TITLE = 'Copy journal to a folder';

export default function Notes() {
  const notes = useNotes();
  const { snap, update, say } = useStore();
  const [sure, setSure] = useState(false);
  const pick = async () => {
    buzz('tap');
    try {
      await pickNoteFolder();
    } catch {
      say('That folder could not be opened. Try another one.');
    }
  };
  /* an old link on a device with no way to do it */
  if (!notes.can) return <Redirect href="/" />;
  if (!notes.on) {
    return (
      <SheetFrame title={TITLE}>
        <T>Each entry becomes a Markdown note in a folder you pick, such as one in your Obsidian vault. Your entries stay in Daybook too.</T>
        <T tone="muted">Daybook writes only its own notes there. Your other files are left alone.</T>
        <Dock>
          <Button label="Pick a folder" onPress={pick} />
        </Dock>
      </SheetFrame>
    );
  }
  const every = jnTagsOf(snap.settings);
  const others = jnTagCounts(snap.journal, every);
  const setEvery = (list: string[], rename?: [string, string]) =>
    update((s0) => ({
      ...s0,
      settings: s0.settings ? changeSettings(s0.settings, (x) => void (x.jnTags = cleanTags(list))) : s0.settings,
      journal: rename ? jnRenameTag(s0.journal || {}, rename[0], rename[1]) : s0.journal,
    }));
  const renameOther = (from: string, to: string) => update((s0) => ({ ...s0, journal: jnRenameTag(s0.journal || {}, from, to) }));
  return (
    <SheetFrame title={TITLE}>
      <View style={{ gap: 2 }}>
        <T v="h2">{notes.name}</T>
        <T tone={notes.lost ? undefined : 'muted'} v="small">
          {notes.lost
            ? 'Daybook cannot reach this folder right now. It tries again each time the app opens. If it keeps saying this, pick the folder again.'
            : notes.count === 1
              ? '1 note'
              : notes.count + ' notes'}
        </T>
        {notes.kept ? (
          <T tone="muted" v="small">
            {notes.kept === 1
              ? 'One note was changed outside Daybook, so it was kept beside the new one.'
              : notes.kept + ' notes were changed outside Daybook, so they were kept beside the new ones.'}
          </T>
        ) : null}
      </View>

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
        The feeling goes on too, such as #feeling/calm.
      </T>

      {others.length ? (
        <>
          <SheetH title="On some entries" />
          <Rows>
            {others.map((o) => (
              <TagRow key={o.tag} tag={o.tag} aside={String(o.n)} onSave={(to) => renameOther(o.tag, to)} onRemove={() => renameOther(o.tag, '')} />
            ))}
          </Rows>
        </>
      ) : null}

      <Dock>
        <Button label="Pick another folder" kind="ghost" onPress={pick} />
        <Link
          label={sure ? 'Tap again to stop. The notes stay in the folder.' : 'Stop copying'}
          onPress={() => {
            buzz('tap');
            if (!sure) return setSure(true);
            setSure(false);
            void stopNotes();
          }}
        />
      </Dock>
    </SheetFrame>
  );
}

/** one tag: a tap opens it to rename it or take it off */
function TagRow({ tag, aside, onSave, onRemove }: { tag: string; aside?: string; onSave: (to: string) => void; onRemove: () => void }) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(tag);
  if (!open) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Tag ' + tag + (aside ? ', on ' + aside + ' entries' : '') + '. Change it'}
        onPress={() => {
          buzz('tap');
          setDraft(tag);
          setOpen(true);
        }}
        style={({ pressed }) => [s.row, { borderBottomColor: c.line, opacity: pressed ? 0.7 : 1 }]}>
        <T v="label" style={{ flex: 1 }}>
          {'#' + tag}
        </T>
        {aside ? <T tone="muted">{aside}</T> : null}
        <Icon name="pencil" size={15} color={c.muted} />
      </Pressable>
    );
  }
  const clean = cleanTag(draft);
  const save = () => {
    setOpen(false);
    if (clean && clean !== tag) onSave(clean);
  };
  return (
    <View style={[s.edit, { borderBottomColor: c.line }]}>
      <Field
        label={'Rename ' + tag}
        hideLabel
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={40}
        value={draft}
        onChangeText={setDraft}
        returnKeyType="done"
        onSubmitEditing={save}
      />
      <View style={s.editBar}>
        <Link
          label="Take it off"
          tone="danger"
          onPress={() => {
            setOpen(false);
            onRemove();
          }}
        />
        <Link label={clean && clean !== tag ? 'Save as #' + clean : 'Close'} onPress={save} />
      </View>
    </View>
  );
}

function AddRow({ onAdd }: { onAdd: (t: string) => void }) {
  const c = useTheme();
  const [draft, setDraft] = useState('');
  const clean = cleanTag(draft);
  const add = () => {
    if (!clean) return;
    buzz('tap');
    onAdd(clean);
    setDraft('');
  };
  return (
    <View style={[s.edit, { borderBottomColor: c.line }]}>
      <Field
        label="Add a tag"
        hideLabel
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={40}
        placeholder="Add a tag"
        value={draft}
        onChangeText={setDraft}
        returnKeyType="done"
        onSubmitEditing={add}
      />
      {clean ? (
        <View style={s.editBar}>
          <Link label={'Add #' + clean} onPress={add} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderBottomWidth: 1 },
  edit: { paddingHorizontal: 16, paddingVertical: 12, gap: 4, borderBottomWidth: 1 },
  editBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
