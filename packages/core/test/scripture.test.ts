/* The scripture library (scripture.ts): the vault's chapters read as the plugins write them, and verse notes written the reader
   plugin's way, never over a change made in Obsidian. Every file here is made up; nothing is read from a real vault. */
import { describe, expect, it } from 'vitest';
import {
  parseChapter,
  parseScrNotes,
  saveScrNote,
  scrChapterNo,
  scrDate,
  scrGospelLibrary,
  scrLabel,
  scrNotesHeader,
  scrNumbered,
  scrPlain,
  scrSection,
  scrSplit,
  scrTracks,
  scrSource,
  SCR_LICENCE,
  scrUpsert,
  scrVerseAt,
  scrVerseList,
  SCR_NOTES,
  type ScrVaultIO,
} from '../src/scripture';
import { WRITTEN_GL } from '../src/written';

const CHAPTER = `---
cssclasses:
  - "scripture"
tags:
  - "scripture/new-testament/matthew"
volume: "New Testament"
book: "Matthew"
chapter: 4
library: "[[Scripture Library|Scriptures]]"
---

###### The Gospel According to St Matthew

**1** Then was Jesus led up of the Spirit into the wilderness to be tempted of the devil. ^1

**2** And when he had fasted forty days and forty nights, he was afterward an hungred. ^2

**4** But he answered and said, It is written, <mark class="green">Man shall not live by bread alone</mark> ^4

> [!nav|chapter]
> [[Matthew 3|← Matthew 3]] [[Matthew|All chapters]] [[Matthew 5|Matthew 5 →]]
`;

const NOV12 = new Date(2026, 10, 12, 9, 0).getTime();

/** a vault in memory; `dead` makes every call fail, the way a vault out of reach does, and `meddle` changes a file between the
    read and the write, the way Obsidian writing at the same moment does */
function vault(files: Record<string, string> = {}) {
  const st = { files, dead: false, meddle: null as null | ((t: string | null) => string), writes: 0 };
  const io: ScrVaultIO = {
    read: async (p) => {
      if (st.dead) throw new Error('away');
      return p in st.files ? st.files[p] : null;
    },
    swap: async (p, expected, text) => {
      if (st.dead) throw new Error('away');
      if (st.meddle) {
        st.files[p] = st.meddle(p in st.files ? st.files[p] : null);
        st.meddle = null;
      }
      const cur = p in st.files ? st.files[p] : null;
      if (cur !== expected) return false;
      st.files[p] = text;
      st.writes++;
      return true;
    },
  };
  return { st, io };
}
const P = `${SCR_NOTES}/Matthew 4 notes.md`;

describe('reading the library', () => {
  it('reads a chapter file as verses, with its highlights, and nothing else', () => {
    const ch = parseChapter(CHAPTER);
    expect(ch.title).toBe('The Gospel According to St Matthew');
    expect(ch.verses.map((v) => v.n)).toEqual([1, 2, 4]);
    expect(ch.verses[0]).toEqual({ n: 1, text: 'Then was Jesus led up of the Spirit into the wilderness to be tempted of the devil.', mark: null });
    expect(ch.verses[2].mark).toBe('green');
    expect(ch.verses[2].text).toBe('But he answered and said, It is written, Man shall not live by bread alone');
  });
  it('reads Windows line ends and a verse with no block id', () => {
    const ch = parseChapter('**1** In the beginning.\r\n\r\n**2** And the earth ^2\r\n');
    expect(ch.verses.map((v) => [v.n, v.text])).toEqual([
      [1, 'In the beginning.'],
      [2, 'And the earth'],
    ]);
  });
  it('takes Obsidian marks off verse words', () => {
    expect(scrPlain('See [[Alma 32#^21|faith]] and [[Ether 12]] <span>now</span> *here*')).toBe('See faith and Ether 12 now here');
  });
  it('knows the folders and files the plugins name', () => {
    expect(scrNumbered('01 · Genesis')).toEqual({ n: 1, name: 'Genesis' });
    expect(scrNumbered('22 · Solomon’s Song'.replace('’', "'"))).toEqual({ n: 22, name: "Solomon's Song" });
    expect(scrNumbered('Old Testament.md')).toBeNull();
    expect(scrChapterNo('Alma 32.md', 'Alma')).toBe(32);
    expect(scrChapterNo('D&C 138.md', 'D&C')).toBe(138);
    expect(scrChapterNo('Alma.md', 'Alma')).toBeNull();
    expect(scrChapterNo('Abraham Facsimiles.md', 'Abraham')).toBeNull();
    expect(scrChapterNo('1 Nephi 3.md', 'Nephi')).toBeNull();
    expect(scrSplit('1 Nephi 3')).toEqual({ book: '1 Nephi', n: 3 });
  });
});

describe('notes, the reader plugin’s way', () => {
  it('names verses the way the plugin does', () => {
    expect(scrLabel('Alma 32', [27, 21, 22, 23])).toBe('Alma 32:21–23, 27');
    expect(scrVerseList('21–23, 27')).toEqual([21, 22, 23, 27]);
    expect(scrVerseList('21-22')).toEqual([21, 22]);
    expect(scrVerseList('a note')).toEqual([]);
    expect(scrDate(NOV12)).toBe('Nov 12, 2026');
  });
  it('writes a section word for word as the plugin does, and reads it back', () => {
    const sec = scrSection('Matthew 4:4', ['![[Matthew 4#^4]]'], ' Words only.\n', 'Nov 4, 2026');
    expect(sec).toBe('## Matthew 4:4\n![[Matthew 4#^4]]\n\nWords only.\n\n*Nov 4, 2026* #firstreadthrough\n');
    const notes = parseScrNotes(scrNotesHeader() + '\n' + sec, 'Matthew 4');
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ label: 'Matthew 4:4', verses: [4], body: 'Words only.', date: 'Nov 4, 2026', pass: 'firstreadthrough' });
  });
  it('replaces only its own section, and an empty one takes it out', () => {
    const a = scrSection('Matthew 4:1', ['![[Matthew 4#^1]]'], 'One.', 'Nov 1, 2026');
    const b = scrSection('Matthew 4:4', ['![[Matthew 4#^4]]'], 'Four.', 'Nov 2, 2026');
    const text = scrNotesHeader() + '\n' + a + '\n' + b;
    const next = scrUpsert(text, 'Matthew 4:1', scrSection('Matthew 4:1', ['![[Matthew 4#^1]]'], 'One, again.', 'Nov 1, 2026'));
    expect(next).toContain('One, again.');
    expect(next).toContain(b);
    expect(scrUpsert(text, 'Matthew 4:1', '')).toBe(scrNotesHeader() + '\n' + b);
  });
});

describe('saving a note never writes over Obsidian', () => {
  it('makes the notes file the way the plugin does', async () => {
    const { st, io } = vault();
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [4], body: 'Bread is not enough.', base: null }, NOV12)).toBe('saved');
    expect(st.files[P]).toBe(scrNotesHeader() + '\n' + scrSection('Matthew 4:4', ['![[Matthew 4#^4]]'], 'Bread is not enough.', 'Nov 12, 2026'));
  });
  it('adds to a file without touching a word already in it', async () => {
    const mine = scrNotesHeader() + '\n## Matthew 4:1\n![[Matthew 4#^1]]\n\nMy own words, [[links]] and #tags.\n\n*Nov 1, 2026* #firstreadthrough\n';
    const { st, io } = vault({ [P]: mine });
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [2, 1], body: 'Forty days.', base: null }, NOV12)).toBe('saved');
    expect(st.files[P].startsWith(mine)).toBe(true);
    expect(st.files[P]).toContain('## Matthew 4:1–2\n![[Matthew 4#^1]]\n![[Matthew 4#^2]]\n\nForty days.\n\n*Nov 12, 2026* #firstreadthrough\n');
  });
  it('edits a note in place, keeping its date, its pass and its embeds', async () => {
    const other = '## Matthew 4:2\n![[Matthew 4#^2]]\n\nKept.\n\n*Oct 1, 2026* #secondpass\n';
    const mine = scrNotesHeader() + '\n## Matthew 4:1\n![[Matthew 4#^1]]\n![[Matthew 4#^1]]\n\nFirst try.\n\n*Nov 1, 2026* #secondpass\n\n' + other;
    const { st, io } = vault({ [P]: mine });
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [1], body: 'Second try.', base: 'First try.' }, NOV12)).toBe('saved');
    expect(st.files[P]).toContain('## Matthew 4:1\n![[Matthew 4#^1]]\n![[Matthew 4#^1]]\n\nSecond try.\n\n*Nov 1, 2026* #secondpass\n');
    expect(st.files[P]).toContain(other);
    expect(st.files[P]).not.toContain('First try.');
  });
  it('keeps the Obsidian note when it changed since Daybook showed it', async () => {
    const mine = scrNotesHeader() + '\n' + scrSection('Matthew 4:1', ['![[Matthew 4#^1]]'], 'Changed on the Mac.', 'Nov 1, 2026');
    const { st, io } = vault({ [P]: mine });
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [1], body: 'From the phone.', base: 'What the phone saw.' }, NOV12)).toBe('changed');
    expect(st.files[P]).toBe(mine);
    expect(st.writes).toBe(0);
  });
  it('keeps a note written in Obsidian on verses Daybook thought had none', async () => {
    const mine = scrNotesHeader() + '\n' + scrSection('Matthew 4:1', ['![[Matthew 4#^1]]'], 'Just written on the Mac.', 'Nov 12, 2026');
    const { st, io } = vault({ [P]: mine });
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [1], body: 'From the phone.', base: null }, NOV12)).toBe('changed');
    expect(st.files[P]).toBe(mine);
  });
  it('a file changed between the read and the write is read again, and nothing in it is lost', async () => {
    const { st, io } = vault({ [P]: scrNotesHeader() });
    st.meddle = (t) => (t || '') + '\n## Matthew 4:9\n![[Matthew 4#^9]]\n\nWritten at the same moment.\n\n*Nov 12, 2026* #firstreadthrough\n';
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [4], body: 'Mine.', base: null }, NOV12)).toBe('saved');
    expect(st.files[P]).toContain('Written at the same moment.');
    expect(st.files[P]).toContain('Mine.');
  });
  it('a new file made in Obsidian at the same moment is not written over', async () => {
    const { st, io } = vault();
    st.meddle = () => scrNotesHeader() + '\n' + scrSection('Matthew 4:4', ['![[Matthew 4#^4]]'], 'The Mac got there first.', 'Nov 12, 2026');
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [4], body: 'Mine.', base: null }, NOV12)).toBe('changed');
    expect(st.files[P]).toContain('The Mac got there first.');
  });
  it('a vault out of reach writes nothing, and says so', async () => {
    const { st, io } = vault();
    st.dead = true;
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [4], body: 'Mine.', base: null }, NOV12)).toBe('unreachable');
  });
  it('a save tried again after it landed finds it there and writes nothing more', async () => {
    const { st, io } = vault();
    await saveScrNote(io, { key: 'Matthew 4', verses: [4], body: 'Mine.', base: null }, NOV12);
    const once = st.files[P];
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [4], body: 'Mine.', base: null }, NOV12 + 60_000)).toBe('same');
    expect(st.files[P]).toBe(once);
    expect(st.writes).toBe(1);
  });
  it('emptying a note takes out its section and nothing else', async () => {
    const a = scrSection('Matthew 4:1', ['![[Matthew 4#^1]]'], 'Keep me.', 'Nov 1, 2026');
    const b = scrSection('Matthew 4:4', ['![[Matthew 4#^4]]'], 'Take me out.', 'Nov 2, 2026');
    const { st, io } = vault({ [P]: scrNotesHeader() + '\n' + a + '\n' + b });
    expect(await saveScrNote(io, { key: 'Matthew 4', verses: [4], body: '  ', base: 'Take me out.' }, NOV12)).toBe('saved');
    expect(st.files[P]).toBe(scrNotesHeader() + '\n' + a);
  });
});

describe('the audio', () => {
  const TIMINGS = {
    voices: { ross: { label: 'Bradley Ross' } },
    chapters: {
      'Alma 32': {
        ross: { u: 'https://archive.org/download/x/127%20Alma%2032.mp3', d: 597, v: [2.7, 13.5, 24.7] },
        'church-male': { u: 'https://assets.example.org/a.mp3', d: 500, v: [1, 2] },
      },
      'Matthew 1': { ross: { e: { u: 'https://archive.org/download/ep/ep.mp3', a: 40.1, b: 236.4 }, d: 196, v: [1, 9] } },
      'Matthew 2': { ross: { e: { u: 'https://anchor.example/ep.mp3', a: 1, b: 9 }, v: [1] } },
      'Matthew 3': { ross: { u: 'https://archive.org.evil.example/x.mp3', v: [1] } },
      'Matthew 5': { ross: { u: 'https://archive.org@evil.example/x.mp3', v: [1] } },
      'Matthew 4': { 'church-male': { u: 'https://assets.example.org/m.mp3', v: [1] } },
      'Bad 1': { ross: { u: 'http://not-secure.example/x.mp3', v: [1] } },
    },
  };
  it('streams only Bradley Ross from archive.org, and a chapter cut from a longer recording plays from its place in it', () => {
    const t = scrTracks(TIMINGS);
    expect(Object.keys(t).sort()).toEqual(['Alma 32', 'Matthew 1']);
    expect(t['Alma 32']).toEqual({ url: 'https://archive.org/download/x/127%20Alma%2032.mp3', from: 0, to: null, verses: [2.7, 13.5, 24.7] });
    expect(t['Matthew 1']).toMatchObject({ url: 'https://archive.org/download/ep/ep.mp3', from: 40.1, to: 236.4 });
    expect(scrTracks(null)).toEqual({});
    expect(scrTracks({ chapters: 'no' })).toEqual({});
  });
  it('links the recording to its page on archive.org', () => {
    expect(scrSource('https://archive.org/download/TheBookOfMormonReadByBradleyRoss/127%20Alma%2032.mp3')).toBe(
      'https://archive.org/details/TheBookOfMormonReadByBradleyRoss',
    );
    expect(scrSource('https://ia800.us.archive.org/odd/path.mp3')).toBe('https://archive.org');
    expect(SCR_LICENCE.url).toBe('https://creativecommons.org/licenses/by-nd/3.0/');
  });
  it('follows the verse being read', () => {
    const tr = { verses: [2.7, 13.5, 24.7] };
    expect(scrVerseAt(tr, 0)).toBe(0);
    expect(scrVerseAt(tr, 2.7)).toBe(1);
    expect(scrVerseAt(tr, 20)).toBe(2);
    expect(scrVerseAt(tr, 999)).toBe(3);
  });
});

describe('Gospel Library', () => {
  it('opens the same verses It is written links to', () => {
    expect(scrGospelLibrary('New Testament', 'Matthew 4', [1, 11])).toBe(WRITTEN_GL);
    expect(scrGospelLibrary('Book of Mormon', 'Alma 32', [21])).toBe('https://www.churchofjesuschrist.org/study/scriptures/bofm/alma/32?lang=eng&id=p21#p21');
    expect(scrGospelLibrary('Doctrine and Covenants', 'D&C 4')).toBe('https://www.churchofjesuschrist.org/study/scriptures/dc-testament/dc/4?lang=eng');
    expect(scrGospelLibrary('Somewhere', 'Alma 32')).toBeNull();
  });
});
