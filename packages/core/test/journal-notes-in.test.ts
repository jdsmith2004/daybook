/* Journal notes, the way back (journal-notes-in.ts): what is done in Obsidian reaches the journal, and nobody's words are lost. */
import { describe, expect, it } from 'vitest';
import type { JEntry, Journal } from '../src/journal-entries';
import { applyNotePull, parseNote, pullNotes, withNoteId, type NoteFile, type NoteSeen } from '../src/journal-notes-in';
import { jnNote, jnNotePlan, noteHash, NOTE_REMOVE_MAX, runNotePlan, type NoteFolderIO, type NoteLedger } from '../src/journal-notes';

const EVERY = ['daybook', 'journal'];
const now = new Date(2026, 10, 1, 12, 0).getTime();
const at = new Date(2026, 9, 30, 9, 5).getTime();
const entry = (over: Partial<JEntry> = {}): JEntry => ({ id: 'abc12345', d: '2026-10-30', at, w: 'Calm', t: 'A good morning.', u: 1, ...over });

/** a folder in memory, with a clock, the way a phone lists one */
function folder(start: Record<string, string> = {}) {
  const files = { ...start };
  const mods: Record<string, number> = {};
  let clock = 1000;
  const touch = (f: string) => (mods[f] = ++clock);
  Object.keys(files).forEach(touch);
  const io: NoteFolderIO = {
    read: async (f) => files[f] ?? null,
    write: async (f, t) => {
      files[f] = t;
      touch(f);
    },
    remove: async (f) => void delete files[f],
    move: async (a, b) => {
      files[b] = files[a];
      delete files[a];
      touch(b);
    },
  };
  const list = (): NoteFile[] => Object.keys(files).map((name) => ({ name, mod: mods[name] }));
  return { files, io, list, edit: (f: string, t: string) => io.write(f, t), drop: (f: string) => io.remove(f) };
}

/** one whole round, the way the phone runs it: from the folder to the journal, then from the journal to the folder */
async function round(f: ReturnType<typeof folder>, jn: Journal, ledger: NoteLedger, seen: NoteSeen = {}, every = EVERY) {
  const pull = await pullNotes({ files: f.list(), jn, every, ledger, seen, roll: 4, now }, f.io);
  const next = applyNotePull(jn, pull, now);
  const run = await runNotePlan(jnNotePlan(next, every, pull.ledger), pull.ledger, f.io);
  return { jn: next, ledger: run.ledger, seen: pull.seen, pull, run };
}

const inSync = async (e: JEntry) => {
  const note = jnNote(e, EVERY);
  const f = folder({ [note.file]: note.text });
  const ledger: NoteLedger = { [e.id]: { f: note.file, h: noteHash(note.text) } };
  return { f, note, ledger, jn: { [e.id]: e } as Journal };
};

describe('reading a note', () => {
  it('reads what Daybook wrote back to the same entry', () => {
    const e = entry({ w: 'Burned out', tags: ['prayer'] });
    const p = parseNote(jnNote(e, EVERY).text);
    expect(p).toMatchObject({ date: e.d, time: '09:05', feeling: 'Burned out', feelTag: 'Burned out', id: e.id, body: e.t });
    expect(p.tags).toEqual(['daybook', 'journal', 'prayer']);
  });
  it('takes tags in every way Obsidian allows, and leaves code out', () => {
    expect(parseNote('---\ntags: [daybook, "a b"]\n---\nHello').tags).toEqual(['daybook', 'a', 'b']);
    expect(parseNote('---\ntags: daybook\n---\nHello').tags).toEqual(['daybook']);
    expect(parseNote('---\ntag:\n  - "#daybook"\n---\nHello').tags).toEqual(['daybook']);
    expect(parseNote('Hello #daybook and #sleep/deep\n').tags).toEqual(['daybook', 'sleep/deep']);
    expect(parseNote('Use `#daybook` here\n```\n#daybook\n```\n').tags).toEqual([]);
    expect(parseNote('See page#daybook').tags).toEqual([]);
  });
  it('copes with Windows lines and a mark at the start of the file', () => {
    const p = parseNote('﻿---\r\ntags:\r\n  - daybook\r\n---\r\n\r\nHello\r\n');
    expect(p.tags).toEqual(['daybook']);
    expect(p.body).toBe('Hello');
  });
  it('finds the feeling in the field, whatever its case, and keeps a word of the person’s own', () => {
    expect(parseNote('---\nfeeling: calm\n---\n').feeling).toBe('Calm');
    expect(parseNote('---\nfeeling: "[[Calm]]"\n---\n').feeling).toBe('Calm');
    expect(parseNote('---\ntags:\n  - feeling/burned-out\n---\n').feelTag).toBe('Burned out');
    expect(parseNote('---\nfeeling: Wistful\n---\n').feeling).toBe('Wistful');
  });
  it('adds its id without touching anything else', () => {
    expect(withNoteId('---\ntags: [daybook]\naliases: [x]\n---\nHello', 'abc12345')).toBe(
      '---\ntags: [daybook]\naliases: [x]\ndaybook_id: abc12345\n---\nHello',
    );
    expect(withNoteId('Hello #daybook', 'abc12345')).toBe('---\ndaybook_id: abc12345\n---\n\nHello #daybook');
    expect(withNoteId('---\ndaybook_id: old12345\n---\nHello', 'abc12345')).toBe('---\ndaybook_id: abc12345\n---\nHello');
  });
});

describe('a new note in Obsidian', () => {
  it('comes in with its words, tags, feeling, day and time, and gets an id', async () => {
    const f = folder({
      'Tonight.md': '---\ntags:\n  - daybook\n  - prayer\n  - feeling/proud\ndate: 2026-10-31\ntime: "21:40"\n---\n\nWrote this on my Mac.\n',
    });
    const r = await round(f, {}, {});
    const [e] = Object.values(r.jn);
    expect(e).toMatchObject({ d: '2026-10-31', w: 'Proud', t: 'Wrote this on my Mac.', tags: ['prayer'] });
    expect(new Date(e.at).getHours()).toBe(21);
    expect(f.files['Tonight.md']).toContain('daybook_id: ' + e.id);
    expect(f.files['Tonight.md']).toContain('Wrote this on my Mac.');
    /* nothing else was written, and the note keeps the person's name for it */
    expect(Object.keys(f.files)).toEqual(['Tonight.md']);
    expect(r.ledger[e.id]).toMatchObject({ f: 'Tonight.md', o: true });
  });
  it('comes in only once', async () => {
    const f = folder({ 'Tonight.md': 'Hello #daybook' });
    const one = await round(f, {}, {});
    const text = f.files['Tonight.md'];
    const two = await round(f, one.jn, one.ledger, one.seen);
    expect(Object.keys(two.jn)).toHaveLength(1);
    expect(two.run.wrote).toBe(0);
    expect(f.files['Tonight.md']).toBe(text);
  });
  it('stays out without the tag, and the file is left alone and not read again until it changes', async () => {
    const f = folder({ 'Private.md': 'Nothing for Daybook. #journal' });
    const reads: string[] = [];
    const io = { ...f.io, read: (n: string) => (reads.push(n), f.io.read(n)) };
    const one = await pullNotes({ files: f.list(), jn: {}, every: EVERY, ledger: {}, seen: {}, roll: 4, now }, io);
    expect(one.adds).toEqual([]);
    expect(f.files['Private.md']).toBe('Nothing for Daybook. #journal');
    const again = await pullNotes({ files: f.list(), jn: {}, every: EVERY, ledger: {}, seen: one.seen, roll: 4, now }, io);
    expect(again.adds).toEqual([]);
    expect(reads).toHaveLength(1);
    await f.edit('Private.md', 'Now it is for Daybook. #daybook');
    const after = await pullNotes({ files: f.list(), jn: {}, every: EVERY, ledger: {}, seen: again.seen, roll: 4, now }, io);
    expect(after.adds).toHaveLength(1);
  });
  it('with no feeling named has none made up: the note stays clean', async () => {
    const f = folder({ '2026-10-29.md': 'Just a thought. #daybook' });
    const r = await round(f, {}, {});
    const [e] = Object.values(r.jn);
    expect(e).toMatchObject({ w: 'Note', d: '2026-10-29' });
    const note = jnNote({ ...e, t: 'Changed in the app.' }, EVERY).text;
    expect(note).not.toContain('feeling');
    expect(note).not.toContain('[[Note]]');
  });
  it('follows the first tag on every note, whatever it is', async () => {
    const f = folder({ 'A.md': 'One #recovery', 'B.md': 'Two #daybook' });
    const r = await round(f, {}, {}, {}, ['recovery']);
    expect(Object.values(r.jn).map((e) => e.t)).toEqual(['One #recovery']);
    const none = folder({ 'A.md': 'One #daybook' });
    expect(Object.keys((await round(none, {}, {}, {}, [])).jn)).toEqual([]);
  });
  it('too long for an entry stays out rather than come in cut short', async () => {
    const f = folder({ 'Long.md': '#daybook ' + 'x'.repeat(20001) });
    const r = await round(f, {}, {});
    expect(r.jn).toEqual({});
    expect(r.pull.tooLong).toBe(1);
    expect(f.files['Long.md']).toHaveLength(20010);
  });
  it('a copy of a note is a new entry, not a second name for the first', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    await f.edit('Copy.md', note.text);
    const r = await round(f, jn, ledger);
    expect(Object.keys(r.jn)).toHaveLength(2);
    expect(r.ledger.abc12345.f).toBe(note.file);
  });
  it('reads only so many files in one round, and the rest come next time', async () => {
    const start: Record<string, string> = {};
    for (let i = 0; i < 130; i++) start[`n${i}.md`] = `Note ${i} #daybook`;
    const f = folder(start);
    const one = await round(f, {}, {});
    expect(Object.keys(one.jn)).toHaveLength(100);
    const two = await round(f, one.jn, one.ledger, one.seen);
    expect(Object.keys(two.jn)).toHaveLength(130);
  });
});

describe('a note changed in Obsidian', () => {
  it('changes its entry, and the note is not written back', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    const edited = note.text.replace('A good morning.', 'A good morning. Added on my Mac.').replace('  - journal\n', '  - journal\n  - prayer\n');
    await f.edit(note.file, edited);
    const r = await round(f, jn, ledger);
    expect(r.jn.abc12345).toMatchObject({ t: 'A good morning. Added on my Mac.', tags: ['prayer'] });
    expect(r.jn.abc12345.u).toBeGreaterThan(1);
    expect(f.files[note.file]).toBe(edited);
    expect(Object.keys(f.files)).toEqual([note.file]);
  });
  it('can change the feeling, by its line or its tag', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    await f.edit(note.file, note.text.replace('feeling: "[[Calm]]"', 'feeling: "[[Proud]]"'));
    const r = await round(f, jn, ledger);
    expect(r.jn.abc12345.w).toBe('Proud');
    const b = await inSync(entry());
    await b.f.edit(b.note.file, b.note.text.replace('feeling/calm', 'feeling/proud'));
    expect((await round(b.f, b.jn, b.ledger)).jn.abc12345.w).toBe('Proud');
  });
  it('can change when it happened, and the file follows', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    await f.edit(note.file, note.text.replace('date: 2026-10-30', 'date: 2026-10-28').replace('"09:05"', '"10:15"'));
    const r = await round(f, jn, ledger);
    expect(r.jn.abc12345.d).toBe('2026-10-28');
    expect(new Date(r.jn.abc12345.at).getHours()).toBe(10);
    expect(Object.keys(f.files)).toEqual(['2026-10-28 1015 2345.md']);
  });
  it('when the entry changed too, the entry keeps its words and the file is kept beside it', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    await f.edit(note.file, note.text.replace('A good morning.', 'Words from Obsidian.'));
    const changed = { abc12345: { ...jn.abc12345, t: 'Words from the app.', u: 2 } };
    const r = await round(f, changed, ledger);
    expect(r.jn.abc12345.t).toBe('Words from the app.');
    expect(f.files[note.file]).toContain('Words from the app.');
    expect(f.files[note.file.replace('.md', ' (edited).md')]).toContain('Words from Obsidian.');
    expect(r.run.kept).toBe(1);
    /* and the copy kept beside it does not come in as an entry of its own */
    const again = await round(f, r.jn, r.ledger, r.seen);
    expect(Object.keys(again.jn)).toHaveLength(1);
  });
  it('a change only to the rest of the frontmatter touches nothing, and survives the next write', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    const withKey = note.text.replace('daybook_id:', 'aliases:\n  - morning\ndaybook_id:');
    await f.edit(note.file, withKey);
    const one = await round(f, jn, ledger);
    expect(one.pull.changed).toBe(0);
    expect(one.run.wrote).toBe(0);
    const edited = { abc12345: { ...one.jn.abc12345, t: 'Changed in the app.', u: 3 } };
    const two = await round(f, edited, one.ledger);
    expect(f.files[note.file]).toContain('Changed in the app.');
    expect(f.files[note.file]).toContain('aliases:\n  - morning');
    expect(Object.keys(f.files)).toEqual([note.file]);
    expect(two.run.kept).toBe(0);
  });
  it('that grew too long leaves the entry as it is, and its words stay in the file', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    const long = note.text + 'x'.repeat(20001);
    await f.edit(note.file, long);
    const r = await round(f, jn, ledger);
    expect(r.jn.abc12345.t).toBe('A good morning.');
    expect(r.pull.tooLong).toBe(1);
    expect(f.files[note.file]).toBe(long);
  });
  it('a note renamed in Obsidian keeps its entry and its new name', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    const text = f.files[note.file];
    await f.drop(note.file);
    await f.edit('A better name.md', text);
    const r = await round(f, jn, ledger);
    expect(Object.keys(r.jn)).toEqual(['abc12345']);
    expect(r.ledger.abc12345).toMatchObject({ f: 'A better name.md', o: true });
    const edited = { abc12345: { ...r.jn.abc12345, t: 'Changed in the app.', u: 3 } };
    await round(f, edited, r.ledger);
    expect(Object.keys(f.files)).toEqual(['A better name.md']);
    expect(f.files['A better name.md']).toContain('Changed in the app.');
  });
});

describe('a note gone from the folder', () => {
  it('leaves its entry in the journal, and is not written back, even when the entry changes', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    await f.edit('Other.md', 'Keeps the folder from looking empty.');
    await f.drop(note.file);
    const r = await round(f, jn, ledger);
    expect(r.jn.abc12345.t).toBe('A good morning.');
    expect(r.pull.gone).toBe(1);
    expect(f.files[note.file]).toBeUndefined();
    const edited = { abc12345: { ...r.jn.abc12345, t: 'Changed in the app.', u: 3 } };
    await round(f, edited, r.ledger, r.seen);
    expect(f.files[note.file]).toBeUndefined();
  });
  it('comes back when the note does', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    const text = f.files[note.file];
    await f.edit('Other.md', 'Keeps the folder from looking empty.');
    await f.drop(note.file);
    const one = await round(f, jn, ledger);
    await f.edit(note.file, text.replace('A good morning.', 'Moved back and changed.'));
    const two = await round(f, one.jn, one.ledger, one.seen);
    expect(two.jn.abc12345.t).toBe('Moved back and changed.');
    expect(two.ledger.abc12345.g).toBeUndefined();
  });
  it('an empty folder, or many gone at once, is not taken to mean the person deleted them', async () => {
    const { f, note, ledger, jn } = await inSync(entry());
    await f.drop(note.file);
    const r = await round(f, jn, ledger);
    expect(r.pull.gone).toBe(0);
    const many: Journal = {};
    const marks: NoteLedger = {};
    for (let i = 0; i <= NOTE_REMOVE_MAX; i++) {
      const id = 'abcd000' + i;
      many[id] = entry({ id });
      marks[id] = { f: id + '.md', h: 'x' };
    }
    const other = folder({ 'Other.md': 'Something else.' });
    expect((await pullNotes({ files: other.list(), jn: many, every: EVERY, ledger: marks, seen: {}, roll: 4, now }, other.io)).gone).toBe(0);
  });
});

describe('the folder picked again', () => {
  it('finds the notes that are there, with no copies and nothing moved aside', async () => {
    const e = entry();
    const n = jnNote(e, EVERY);
    const f = folder({ [n.file]: n.text });
    const r = await round(f, { [e.id]: e }, {});
    expect(Object.keys(r.jn)).toEqual([e.id]);
    expect(Object.keys(f.files)).toEqual([n.file]);
    expect(r.run.kept).toBe(0);
  });
  it('a note brought in from Obsidian is known by its id, so it does not come in twice', async () => {
    const f = folder({ 'Tonight.md': 'Hello #daybook' });
    const one = await round(f, {}, {});
    const again = await round(f, one.jn, {});
    expect(Object.keys(again.jn)).toHaveLength(1);
    expect(Object.keys(f.files)).toEqual(['Tonight.md']);
  });
  it('a note whose words differ from its entry keeps both', async () => {
    const e = entry();
    const n = jnNote(e, EVERY);
    const f = folder({ [n.file]: n.text.replace('A good morning.', 'Written while copying was off.') });
    const r = await round(f, { [e.id]: e }, {});
    expect(r.jn[e.id].t).toBe('A good morning.');
    expect(f.files[n.file]).toContain('A good morning.');
    expect(f.files[n.file.replace('.md', ' (edited).md')]).toContain('Written while copying was off.');
  });
  it('a new phone with an empty journal takes the id from the note, so the account’s copy lands on the same entry', async () => {
    const e = entry();
    const n = jnNote(e, EVERY);
    const f = folder({ [n.file]: n.text });
    const r = await round(f, {}, {});
    expect(Object.keys(r.jn)).toEqual([e.id]);
    expect(f.files[n.file]).toBe(n.text);
  });
});

describe('when the folder cannot be reached', () => {
  it('says so, changes nothing and loses nothing', async () => {
    const { f, ledger, jn } = await inSync(entry());
    const dead: NoteFolderIO = { ...f.io, read: async () => Promise.reject(new Error('out of reach')) };
    const list = f.list().map((x) => ({ ...x, mod: x.mod + 1 }));
    const r = await pullNotes({ files: list, jn, every: EVERY, ledger, seen: {}, roll: 4, now }, dead);
    expect(r.failed).toBe(true);
    expect(r.edits).toEqual([]);
    expect(r.gone).toBe(0);
    expect(r.ledger.abc12345.g).toBeUndefined();
  });
});
