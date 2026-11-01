/* Journal notes (journal-notes.ts): what a note says, and that a person's own words and files are never lost to Daybook. */
import { describe, expect, it } from 'vitest';
import { normRecord } from '../src/data';
import { jnEdit, normJEntry, type JEntry, type Journal } from '../src/journal-entries';
import {
  jnFeelTag,
  jnNote,
  jnNoteFile,
  jnNotePlan,
  jnNoteTags,
  jnRenameTag,
  jnTagCounts,
  jnTagsOf,
  noteHash,
  NOTE_REMOVE_MAX,
  runNotePlan,
  type NoteFolderIO,
  type NoteLedger,
} from '../src/journal-notes';
import { cleanTag, cleanTags, normSettings } from '../src/legacy/core.js';
import { mergeRemote } from '../src/sync';

const at = new Date(2026, 9, 30, 9, 5).getTime();
const entry = (over: Partial<JEntry> = {}): JEntry => ({ id: 'abc12345', d: '2026-10-30', at, w: 'Calm', t: 'A good morning.', u: 1, ...over });
const EVERY = ['daybook', 'journal'];

/** a folder in memory; `dead` makes every read fail, the way a folder out of reach does */
function folder(files: Record<string, string> = {}) {
  const state = { files, dead: false };
  const io: NoteFolderIO = {
    read: async (f) => {
      if (state.dead) throw new Error('out of reach');
      return state.files[f] ?? null;
    },
    write: async (f, t) => void (state.files[f] = t),
    remove: async (f) => void delete state.files[f],
    move: async (a, b) => {
      state.files[b] = state.files[a];
      delete state.files[a];
    },
  };
  return { state, io };
}
const round = async (jn: Journal, ledger: NoteLedger, io: NoteFolderIO, every = EVERY) => runNotePlan(jnNotePlan(jn, every, ledger), ledger, io);

describe('a tag', () => {
  it('comes out the way Obsidian takes it, the same every time', () => {
    expect(cleanTag('  #Prayer ')).toBe('prayer');
    expect(cleanTag('Quiet Time')).toBe('quiet-time');
    expect(cleanTag('work/hard!')).toBe('work/hard');
    expect(cleanTag('2026')).toBe('');
    expect(cleanTag('///')).toBe('');
    expect(cleanTag(7)).toBe('');
    expect(cleanTags(['Prayer', 'prayer', '#PRAYER', 'hope'])).toEqual(['prayer', 'hope']);
  });
  it('the list on every note starts with the starting tags, and an empty one stays empty', () => {
    expect(jnTagsOf(null)).toEqual(EVERY);
    expect(jnTagsOf({ jnTags: [] })).toEqual([]);
    const st = normSettings({ start: '2026-10-01', jnTags: ['#Daybook', 'prayer', ''] });
    expect(st.jnTags).toEqual(['daybook', 'prayer']);
    expect('jnTags' in normSettings({ start: '2026-10-01' })).toBe(false);
  });
});

describe('a note', () => {
  it('has the tags, the feeling linked and tagged, and the day linked', () => {
    const { file, text } = jnNote(entry({ tags: ['prayer'], q: 'What helped you today?' }), EVERY);
    expect(file).toBe('2026-10-30 0905 2345.md');
    expect(text).toBe(
      [
        '---',
        'tags:',
        '  - daybook',
        '  - journal',
        '  - feeling/calm',
        '  - prayer',
        'date: 2026-10-30',
        'time: "09:05"',
        'feeling: "[[Calm]]"',
        'daybook_id: abc12345',
        '---',
        '',
        '[[Calm]] · [[2026-10-30]]',
        '',
        '> What helped you today?',
        '',
        'A good morning.',
        '',
      ].join('\n'),
    );
  });
  it('a feeling on its own is a note too', () => {
    const { text } = jnNote(entry({ t: '  ' }), EVERY);
    expect(text.endsWith('[[Calm]] · [[2026-10-30]]\n')).toBe(true);
  });
  it('a feeling of two words makes one tag and keeps its link', () => {
    expect(jnFeelTag('Burned out')).toBe('feeling/burned-out');
    expect(jnNote(entry({ w: 'Burned out' }), EVERY).text).toContain('[[Burned out]]');
  });
  it('does not repeat a tag', () => {
    expect(jnNoteTags(entry({ tags: ['daybook', 'hope'] }), EVERY)).toEqual(['daybook', 'journal', 'feeling/calm', 'hope']);
  });
  it('keeps its file name when the words or the feeling change, and only when the time changes does it move', () => {
    const a = entry();
    expect(jnNoteFile({ ...a, t: 'other', w: 'Sad' } as JEntry)).toBe(jnNoteFile(a));
    expect(jnNoteFile({ ...a, at: at + 3600_000 })).not.toBe(jnNoteFile(a));
  });
});

describe('the copy', () => {
  it('writes each entry once, and nothing when nothing changed', async () => {
    const { state, io } = folder();
    const jn = { [entry().id]: entry() };
    const r1 = await round(jn, {}, io);
    expect(r1.wrote).toBe(1);
    expect(state.files['2026-10-30 0905 2345.md']).toContain('A good morning.');
    const r2 = await round(jn, r1.ledger, io);
    expect(r2.wrote).toBe(0);
  });
  it('a change to the list of tags changes every note', async () => {
    const { state, io } = folder();
    const jn = { a1b2: entry({ id: 'a1b2' }), c3d4: entry({ id: 'c3d4' }) };
    const r1 = await round(jn, {}, io);
    const r2 = await round(jn, r1.ledger, io, ['faith']);
    expect(r2.wrote).toBe(2);
    for (const t of Object.values(state.files)) {
      expect(t).toContain('  - faith');
      expect(t).not.toContain('  - daybook');
    }
  });
  it('a note changed in Obsidian moves aside when the entry changes, so both sets of words stay', async () => {
    const { state, io } = folder();
    const e = entry();
    const r1 = await round({ [e.id]: e }, {}, io);
    state.files[r1.ledger[e.id].f] = 'My own words.';
    const r2 = await round({ [e.id]: { ...e, t: 'Changed in Daybook.' } }, r1.ledger, io);
    expect(r2.kept).toBe(1);
    expect(state.files['2026-10-30 0905 2345 (edited).md']).toBe('My own words.');
    expect(state.files['2026-10-30 0905 2345.md']).toContain('Changed in Daybook.');
  });
  it('a note changed in Obsidian stays as it is while the entry does not change', async () => {
    const { state, io } = folder();
    const e = entry();
    const r1 = await round({ [e.id]: e }, {}, io);
    state.files[r1.ledger[e.id].f] = 'My own words.';
    const r2 = await round({ [e.id]: e }, r1.ledger, io);
    expect(r2.wrote).toBe(0);
    expect(state.files[r1.ledger[e.id].f]).toBe('My own words.');
  });
  it('a note deleted in Obsidian stays deleted until the entry changes', async () => {
    const { state, io } = folder();
    const e = entry();
    const r1 = await round({ [e.id]: e }, {}, io);
    delete state.files[r1.ledger[e.id].f];
    await round({ [e.id]: e }, r1.ledger, io);
    expect(Object.keys(state.files)).toEqual([]);
  });
  it('a file already in a folder picked for the first time is kept', async () => {
    const { state, io } = folder({ '2026-10-30 0905 2345.md': 'Already here.' });
    const e = entry();
    const r = await round({ [e.id]: e }, {}, io);
    expect(r.kept).toBe(1);
    expect(state.files['2026-10-30 0905 2345 (edited).md']).toBe('Already here.');
  });
  it('picking the same folder again writes nothing new', async () => {
    const { state, io } = folder();
    const e = entry();
    await round({ [e.id]: e }, {}, io);
    const r = await round({ [e.id]: e }, {}, io);
    expect(r.kept).toBe(0);
    expect(Object.keys(state.files)).toEqual(['2026-10-30 0905 2345.md']);
  });
  it('changing when it happened renames the note, and the old file goes', async () => {
    const { state, io } = folder();
    const e = entry();
    const r1 = await round({ [e.id]: e }, {}, io);
    const moved = { ...e, d: '2026-10-29', at: new Date(2026, 9, 29, 22, 0).getTime() };
    const r2 = await round({ [e.id]: moved }, r1.ledger, io);
    expect(Object.keys(state.files)).toEqual(['2026-10-29 2200 2345.md']);
    expect(state.files['2026-10-29 2200 2345.md']).toContain('[[2026-10-29]]');
    expect(r2.ledger[e.id].f).toBe('2026-10-29 2200 2345.md');
  });
  it('deleting an entry deletes its note, unless someone changed the note', async () => {
    const { state, io } = folder();
    const a = entry({ id: 'aaaa1111' });
    const b = entry({ id: 'bbbb2222' });
    const r1 = await round({ [a.id]: a, [b.id]: b }, {}, io);
    state.files[r1.ledger[b.id].f] = 'My own words.';
    const r2 = await round({}, r1.ledger, io);
    expect(r2.removed).toBe(1);
    expect(r2.kept).toBe(1);
    expect(Object.values(state.files)).toEqual(['My own words.']);
    expect(r2.ledger).toEqual({});
  });
  it('many entries gone at once (a log replaced or erased) leaves every note in the folder', async () => {
    const { state, io } = folder();
    const jn: Journal = {};
    for (let i = 0; i <= NOTE_REMOVE_MAX; i++) jn['entry00' + i] = entry({ id: 'entry00' + i });
    const r1 = await round(jn, {}, io);
    const r2 = await round({}, r1.ledger, io);
    expect(r2.removed).toBe(0);
    expect(Object.keys(state.files).length).toBe(NOTE_REMOVE_MAX + 1);
    expect(r2.ledger).toEqual({});
  });
  it('a folder out of reach loses nothing: the ledger stays, and the next round finishes', async () => {
    const { state, io } = folder();
    const e = entry();
    state.dead = true;
    const r1 = await round({ [e.id]: e }, {}, io);
    expect(r1.failed).toBe(true);
    expect(r1.ledger).toEqual({});
    state.dead = false;
    const r2 = await round({ [e.id]: e }, r1.ledger, io);
    expect(r2.wrote).toBe(1);
    expect(r2.failed).toBe(false);
  });
  it('only touches files it wrote', async () => {
    const { state, io } = folder({ 'My own note.md': 'Mine.', '2026-10-30.md': 'Daily.' });
    const e = entry();
    const r1 = await round({ [e.id]: e }, {}, io);
    await round({}, r1.ledger, io);
    expect(state.files).toEqual({ 'My own note.md': 'Mine.', '2026-10-30.md': 'Daily.' });
  });
  it('the mark changes with the text', () => {
    expect(noteHash('a')).not.toBe(noteHash('b'));
    expect(noteHash('a')).toBe(noteHash('a'));
  });
});

describe('tags on an entry', () => {
  it('survive cleaning and sync, and an empty list stays', () => {
    expect(normJEntry({ ...entry(), tags: ['#Prayer', 'prayer'] }, 'abc12345')!.tags).toEqual(['prayer']);
    expect(normJEntry({ ...entry(), tags: [] }, 'abc12345')!.tags).toEqual([]);
    expect('tags' in normJEntry(entry(), 'abc12345')!).toBe(false);
    const r = normRecord({ id: 'journal/abc12345', u: 5, data: { ...entry(), tags: ['hope'] } });
    expect((r!.data as JEntry).tags).toEqual(['hope']);
  });
  it('a copy from an older app, with no tags at all, keeps them and is sent back', () => {
    const here = entry({ tags: ['prayer'], u: 5 });
    const snap = { settings: null, days: {}, reviews: {}, journal: { [here.id]: here } };
    const old = { ...entry({ t: 'Edited on the older app.', u: 9 }) };
    const m = mergeRemote(snap, {}, [{ id: `journal/${here.id}`, u: 9, data: old }]);
    expect(m.snap.journal![here.id].tags).toEqual(['prayer']);
    expect(m.snap.journal![here.id].t).toBe('Edited on the older app.');
    expect(m.dirty[`journal/${here.id}`]).toBe(10);
  });
  it('a newer copy with the tags taken off stays taken off', () => {
    const here = entry({ tags: ['prayer'], u: 5 });
    const snap = { settings: null, days: {}, reviews: {}, journal: { [here.id]: here } };
    const m = mergeRemote(snap, {}, [{ id: `journal/${here.id}`, u: 9, data: entry({ tags: [], u: 9 }) }]);
    expect(m.snap.journal![here.id].tags).toEqual([]);
    expect(m.dirty[`journal/${here.id}`]).toBeUndefined();
  });
  it('are changed by jnEdit, along with when it happened', () => {
    const jn = { [entry().id]: entry() };
    const e = jnEdit(jn, entry().id, { tags: ['#Hope'], when: { at: 123, d: '2026-10-29' } }, 50)[entry().id];
    expect(e.tags).toEqual(['hope']);
    expect(e.at).toBe(123);
    expect(e.d).toBe('2026-10-29');
    expect(jnEdit(jn, entry().id, { when: { at: 123, d: 'nope' } })[entry().id].d).toBe('2026-10-30');
  });
  it('a rename reaches every entry with the tag, and only those', () => {
    const jn: Journal = {
      aaaa1111: entry({ id: 'aaaa1111', tags: ['prayer', 'hope'], u: 1 }),
      bbbb2222: entry({ id: 'bbbb2222', tags: ['prayer'], u: 1 }),
      cccc3333: entry({ id: 'cccc3333', u: 1 }),
    };
    const out = jnRenameTag(jn, 'prayer', 'Quiet Time', 100);
    expect(out.aaaa1111.tags).toEqual(['quiet-time', 'hope']);
    expect(out.bbbb2222.tags).toEqual(['quiet-time']);
    expect(out.bbbb2222.u).toBeGreaterThan(1);
    expect(out.cccc3333).toBe(jn.cccc3333);
    expect(jnRenameTag(jn, 'prayer', '', 100).bbbb2222.tags).toEqual([]);
  });
  it('are counted, most used first, without the ones on every note', () => {
    const jn: Journal = {
      aaaa1111: entry({ id: 'aaaa1111', tags: ['hope', 'daybook'] }),
      bbbb2222: entry({ id: 'bbbb2222', tags: ['hope', 'prayer'] }),
    };
    expect(jnTagCounts(jn, EVERY)).toEqual([
      { tag: 'hope', n: 2 },
      { tag: 'prayer', n: 1 },
    ]);
  });
});
