/* The scripture library (the owner, November 12, 2026: "grab the scripture library i have on obsidian and add it to daybook ...
   for the audio just have it stream it and then any notes also sync to obsidian same way it's already setup").

   Daybook ships no scripture text. On an iPhone the person picks their own Obsidian vault, and Daybook reads the chapters the
   owner's Obsidian plugins already keep there (Scriptures/<N> · <Volume>/<NN> · <Book>/<Book> <n>.md, one verse a line as
   `**N** words ^N`), and writes verse notes back the way the scripture-reader plugin does: one file a chapter in Scriptures/Notes
   ("Alma 32 notes.md"), one section a verse or set of verses, an edit replacing that section. The owner chose this over shipping
   the text (November 12, 2026), since the Church's current edition is its own, and its terms allow personal use only.

   The audio streams Bradley Ross's reading (archive.org, CC BY-ND 3.0, so it is played as it is and credited) from the timings
   the scripture-audio plugin keeps in the vault, and follows the verse being read. Where he did not read a chapter, the person
   is offered the chapter in Gospel Library, which plays the Church's own recording. The Church's recordings are never streamed
   from Daybook (the owner's choice, November 12, 2026: they are copyrighted, with no permission for apps).

   A note is never lost and never written over. Daybook writes only into Scriptures/Notes, changes only the section it shows,
   and only when that section is still what it showed: the phone compares the whole file inside one coordinated write
   (modules/scripture-vault), so a change made in Obsidian in between is kept and the person's words wait on the phone. Nothing
   here goes to Daybook's server. The highlights the plugin writes into the chapter files are shown, never written. */

/** the folder the plugins keep the library in, inside the vault */
export const SCR_ROOT = 'Scriptures';
/** where the verse notes go, one file a chapter */
export const SCR_NOTES = SCR_ROOT + '/Notes';
/** the audio plugin's timings, the one file outside the library Daybook reads */
export const SCR_TIMINGS = '.obsidian/plugins/scripture-audio/timings.json';
/** the reading pass every note is stamped with, as the reader plugin does (its READ_THROUGH) */
export const SCR_PASS = 'firstreadthrough';
/** the highlight colors the reader plugin writes */
export const SCR_MARKS = ['yellow', 'green', 'blue', 'pink', 'purple'] as const;
export type ScrMark = (typeof SCR_MARKS)[number];

/* ---------- the library ---------- */

/** a folder named the plugins' way: "01 · Genesis" is { n: 1, name: 'Genesis' } */
export function scrNumbered(dir: string): { n: number; name: string } | null {
  const m = /^(\d+) · (.+)$/.exec(dir);
  return m ? { n: Number(m[1]), name: m[2].trim() } : null;
}
/** the chapter a file holds in a book's folder: "Alma 32.md" in Alma is 32; the book's own index ("Alma.md") and anything else is null */
export function scrChapterNo(file: string, book: string): number | null {
  if (!file.endsWith('.md') || !file.startsWith(book + ' ')) return null;
  const rest = file.slice(book.length + 1, -3);
  return /^\d{1,3}$/.test(rest) ? Number(rest) : null;
}
/** a chapter's name, the way the vault names it ("Alma 32", "D&C 4") */
export const scrKey = (book: string, n: number) => book + ' ' + n;
/** "Alma 32" is { book: 'Alma', n: 32 } */
export function scrSplit(key: string): { book: string; n: number } | null {
  const m = /^(.+) (\d{1,3})$/.exec(key.trim());
  return m ? { book: m[1], n: Number(m[2]) } : null;
}
/** a chapter file's path, from its volume's and book's folder names */
export const scrPath = (volDir: string, bookDir: string, key: string) => `${SCR_ROOT}/${volDir}/${bookDir}/${key}.md`;

export interface ScrVerse {
  n: number;
  text: string;
  /** a highlight the person made in Obsidian */
  mark: ScrMark | null;
}
export interface ScrChapter {
  /** the book's title line ("The Book of Alma"), or null */
  title: string | null;
  verses: ScrVerse[];
}

const MARK = /<mark class="([a-z]+)">([\s\S]*?)<\/mark>/;
/** a chapter file as words: the verses in order, each with its highlight. Frontmatter, the title line and the plugin's
    chapter links are left out, and so is anything that is not a verse line */
export function parseChapter(md: string): ScrChapter {
  let title: string | null = null;
  const verses: ScrVerse[] = [];
  for (const raw of md.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trim();
    const t = /^######\s+(.+)$/.exec(line);
    if (t && title == null) {
      title = t[1].trim();
      continue;
    }
    const m = /^\*\*(\d{1,3})\*\*\s+(.*?)(?:\s+\^(\d{1,3}))?$/.exec(line);
    if (!m) continue;
    let text = m[2];
    let mark: ScrMark | null = null;
    const k = MARK.exec(text);
    if (k) {
      mark = (SCR_MARKS as readonly string[]).includes(k[1]) ? (k[1] as ScrMark) : 'yellow';
      text = text.replace(MARK, '$2');
    }
    verses.push({ n: Number(m[1]), text: scrPlain(text), mark });
  }
  return { title, verses };
}
/** verse words with Obsidian's marks taken off: links keep their words, tags and emphasis go */
export function scrPlain(s: string): string {
  return s
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/(\*\*|__|\*|_)(\S[^*_]*?)\1/g, '$2')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- verse notes, as the reader plugin writes them ---------- */

/** the notes file for a chapter, in Scriptures/Notes */
export const scrNotesFile = (key: string) => key + ' notes.md';
/** a new notes file's frontmatter, word for word the plugin's notesHeader */
export const scrNotesHeader = () => `---\ntags:\n  - scripture/notes\n  - ${SCR_PASS}\nlibrary: "[[Scripture Library|Scriptures]]"\n---\n`;

/** the heading of a note on these verses: "Alma 32:21" or "Alma 32:21–23, 27" (the plugin's refLabel) */
export function scrLabel(key: string, verses: number[]): string {
  const v = [...new Set(verses)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < v.length; i++) {
    let j = i;
    while (j + 1 < v.length && v[j + 1] === v[j] + 1) j++;
    parts.push(j > i ? `${v[i]}–${v[j]}` : `${v[i]}`);
    i = j;
  }
  return `${key}:${parts.join(', ')}`;
}
/** "21–23, 27" as [21, 22, 23, 27], or [] when it is not a verse list (the plugin's parseVerseList) */
export function scrVerseList(s: string): number[] {
  const out: number[] = [];
  for (const part of s.split(',')) {
    const m = /^(\d+)(?:\s*[–-]\s*(\d+))?$/.exec(part.trim());
    if (!m) return [];
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let i = a; i <= b && i - a < 500; i++) out.push(i);
  }
  return out;
}

export interface ScrNote {
  label: string;
  verses: number[];
  body: string;
  date: string;
  pass: string;
  embeds: string[];
  /** where the section starts and ends in the file */
  start: number;
  end: number;
}
/** every note in a notes file (the plugin's parseNotes); `key` gives the verses of the notes on this chapter */
export function parseScrNotes(text: string, key: string): ScrNote[] {
  const heads = [...text.matchAll(/^## (.+)$/gm)];
  return heads.map((h, i) => {
    const start = h.index ?? 0;
    const end = i + 1 < heads.length ? (heads[i + 1].index ?? text.length) : text.length;
    const label = h[1].trim();
    const prefix = key + ':';
    const verses = key && label.startsWith(prefix) ? scrVerseList(label.slice(prefix.length)) : [];
    const lines = text.slice(start + h[0].length, end).split('\n');
    const isEmbed = (l: string) => /^!\[\[.*\]\]\s*$/.test(l);
    const embeds = lines.filter(isEmbed);
    const rest = lines.filter((l) => !isEmbed(l));
    while (rest.length && !rest[rest.length - 1].trim()) rest.pop();
    let date = '';
    let pass = '';
    const m = /^\*([^*]+)\*(?:\s+#([\w/-]+))?$/.exec((rest[rest.length - 1] || '').trim());
    if (m) {
      date = m[1];
      pass = m[2] || '';
      rest.pop();
    }
    return { label, verses, body: rest.join('\n').trim(), date, pass, embeds, start, end };
  });
}
/** one note as the plugin writes it (its buildSection) */
export function scrSection(label: string, embeds: string[], body: string, date: string, pass: string = SCR_PASS): string {
  return `## ${label}\n${embeds.join('\n')}\n\n${body.trim()}\n\n*${date}*${pass ? ` #${pass}` : ''}\n`;
}
/** the file with the note under this heading replaced, or added at the end; an empty section takes it out (the plugin's upsertSection) */
export function scrUpsert(text: string, label: string, section: string): string {
  const found = parseScrNotes(text, '').find((n) => n.label === label);
  if (found) {
    const before = text.slice(0, found.start);
    const after = text.slice(found.end).replace(/^\n+/, '');
    const mid = section ? section + (after ? '\n' : '') : '';
    return (before + mid + after).replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '\n');
  }
  if (!section) return text;
  return text.replace(/\s*$/, '\n\n') + section;
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** a note's date, as the plugin writes it: "Nov 4, 2026" */
export const scrDate = (ms: number) => {
  const d = new Date(ms);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/** the vault, as the phone reaches it: reads anywhere in the library, and writes a notes file only when it is still `expected`
    (null: the file is not there yet). `swap` gives false when the file changed, and throws when the vault is out of reach */
export interface ScrVaultIO {
  read(path: string): Promise<string | null>;
  swap(path: string, expected: string | null, text: string): Promise<boolean>;
}
export interface ScrNoteSave {
  key: string;
  verses: number[];
  /** the person's words; empty takes the note out */
  body: string;
  /** the note's words as Daybook last showed them, or null when there was no note */
  base: string | null;
}
/** saved: the note is in the vault; same: the vault already says this; changed: the note changed in Obsidian since it was shown,
    so nothing was written and the person's words wait; unreachable: the vault could not be reached, and they wait too */
export type ScrSaveResult = 'saved' | 'same' | 'changed' | 'unreachable';

const norm = (s: string | null | undefined) => (s == null ? null : s.replace(/\r\n?/g, '\n').trim());

/** writes one note, only over what was shown. A retry of a save that already landed finds the words there and is `same` */
export async function saveScrNote(io: ScrVaultIO, save: ScrNoteSave, now: number): Promise<ScrSaveResult> {
  const path = `${SCR_NOTES}/${scrNotesFile(save.key)}`;
  const label = scrLabel(save.key, save.verses);
  const body = norm(save.body) || '';
  /* one more try when the file changes between the read and the write, and the note itself did not */
  for (let attempt = 0; attempt < 2; attempt++) {
    let cur: string | null;
    try {
      cur = await io.read(path);
    } catch {
      return 'unreachable';
    }
    const found = cur == null ? undefined : parseScrNotes(cur, save.key).find((n) => n.label === label);
    const there = found ? norm(found.body) : null;
    /* the note changed in Obsidian since it was shown: it is kept, unless it already says what the person wrote */
    if (there !== norm(save.base)) return there === (body || null) ? 'same' : 'changed';
    if (!body && !found) return 'same';
    if (body && there === body) return 'same';
    const section = body
      ? scrSection(
          label,
          found?.embeds.length ? found.embeds : [...new Set(save.verses)].sort((a, b) => a - b).map((n) => `![[${save.key}#^${n}]]`),
          body,
          found?.date || scrDate(now),
          found ? found.pass : SCR_PASS,
        )
      : '';
    const next = cur == null ? `${scrNotesHeader()}\n${section}` : scrUpsert(cur, label, section);
    try {
      if (await io.swap(path, cur, next)) return 'saved';
    } catch {
      return 'unreachable';
    }
  }
  return 'changed';
}

/* ---------- audio ---------- */

export interface ScrTrack {
  url: string;
  /** where the chapter starts in the recording, in seconds (a chapter cut from a longer episode starts later) */
  from: number;
  /** where it ends, or null at the end of the file */
  to: number | null;
  /** when each verse starts, in seconds from `from`; verse 1 first */
  verses: number[];
}
/** the voice Daybook streams, and its credit (CC BY-ND 3.0 asks for the reader, the source and the license) */
export const SCR_VOICE = 'ross';
export const SCR_CREDIT = 'Read by Bradley Ross';
/** the recordings' licence, named and linked beside the credit */
export const SCR_LICENCE = { name: 'CC BY-ND 3.0', url: 'https://creativecommons.org/licenses/by-nd/3.0/' };
/** archive.org's page for the recording a track streams (its source, linked beside the credit) */
export function scrSource(url: string): string {
  const m = /^https:\/\/(?:[a-z0-9-]+\.)*archive\.org\/(?:download|details)\/([^/?#]+)/i.exec(url);
  return m ? 'https://archive.org/details/' + m[1] : 'https://archive.org';
}

const isNum = (x: unknown): x is number => typeof x === 'number' && isFinite(x);
/* only archive.org, where Bradley Ross's recordings are published under their licence: a timings file that points anywhere else
   (another host, a podcast feed, a plain http address) is not streamed, and that chapter offers Gospel Library instead */
const isUrl = (x: unknown): x is string => typeof x === 'string' && /^https:\/\/(?:[a-z0-9-]+\.)*archive\.org\/[^\s@]*$/i.test(x);
/** Bradley Ross's chapters from the audio plugin's timings.json, by chapter name. The Church's recordings in it are left out */
export function scrTracks(json: unknown): Record<string, ScrTrack> {
  const out: Record<string, ScrTrack> = {};
  const ch = json && typeof json === 'object' ? (json as { chapters?: unknown }).chapters : null;
  if (!ch || typeof ch !== 'object') return out;
  for (const [key, v] of Object.entries(ch as Record<string, unknown>)) {
    const r = v && typeof v === 'object' ? (v as Record<string, unknown>)[SCR_VOICE] : null;
    if (!r || typeof r !== 'object') continue;
    const o = r as { u?: unknown; v?: unknown; e?: { u?: unknown; a?: unknown; b?: unknown } };
    const verses = Array.isArray(o.v) ? o.v.filter(isNum) : [];
    if (o.e && isUrl(o.e.u) && isNum(o.e.a) && isNum(o.e.b) && o.e.b > o.e.a) out[key] = { url: o.e.u, from: o.e.a, to: o.e.b, verses };
    else if (isUrl(o.u)) out[key] = { url: o.u, from: 0, to: null, verses };
  }
  return out;
}
/** the verse being read `t` seconds into the chapter, or 0 before the first (the title and the heading) */
export function scrVerseAt(track: Pick<ScrTrack, 'verses'>, t: number): number {
  let n = 0;
  for (let i = 0; i < track.verses.length; i++) {
    if (track.verses[i] <= t + 0.05) n = i + 1;
    else break;
  }
  return n;
}

/* ---------- Gospel Library ---------- */

const GL_VOL: Record<string, string> = {
  'Old Testament': 'ot',
  'New Testament': 'nt',
  'Book of Mormon': 'bofm',
  'Doctrine and Covenants': 'dc-testament',
  'Pearl of Great Price': 'pgp',
};
/* the Church's short names for the books, in its study links */
const GL_BOOK: Record<string, string> = {
  Genesis: 'gen',
  Exodus: 'ex',
  Leviticus: 'lev',
  Numbers: 'num',
  Deuteronomy: 'deut',
  Joshua: 'josh',
  Judges: 'judg',
  Ruth: 'ruth',
  '1 Samuel': '1-sam',
  '2 Samuel': '2-sam',
  '1 Kings': '1-kgs',
  '2 Kings': '2-kgs',
  '1 Chronicles': '1-chr',
  '2 Chronicles': '2-chr',
  Ezra: 'ezra',
  Nehemiah: 'neh',
  Esther: 'esth',
  Job: 'job',
  Psalms: 'ps',
  Proverbs: 'prov',
  Ecclesiastes: 'eccl',
  "Solomon's Song": 'song',
  Isaiah: 'isa',
  Jeremiah: 'jer',
  Lamentations: 'lam',
  Ezekiel: 'ezek',
  Daniel: 'dan',
  Hosea: 'hosea',
  Joel: 'joel',
  Amos: 'amos',
  Obadiah: 'obad',
  Jonah: 'jonah',
  Micah: 'micah',
  Nahum: 'nahum',
  Habakkuk: 'hab',
  Zephaniah: 'zeph',
  Haggai: 'hag',
  Zechariah: 'zech',
  Malachi: 'mal',
  Matthew: 'matt',
  Mark: 'mark',
  Luke: 'luke',
  John: 'john',
  Acts: 'acts',
  Romans: 'rom',
  '1 Corinthians': '1-cor',
  '2 Corinthians': '2-cor',
  Galatians: 'gal',
  Ephesians: 'eph',
  Philippians: 'philip',
  Colossians: 'col',
  '1 Thessalonians': '1-thes',
  '2 Thessalonians': '2-thes',
  '1 Timothy': '1-tim',
  '2 Timothy': '2-tim',
  Titus: 'titus',
  Philemon: 'philem',
  Hebrews: 'heb',
  James: 'james',
  '1 Peter': '1-pet',
  '2 Peter': '2-pet',
  '1 John': '1-jn',
  '2 John': '2-jn',
  '3 John': '3-jn',
  Jude: 'jude',
  Revelation: 'rev',
  '1 Nephi': '1-ne',
  '2 Nephi': '2-ne',
  Jacob: 'jacob',
  Enos: 'enos',
  Jarom: 'jarom',
  Omni: 'omni',
  'Words of Mormon': 'w-of-m',
  Mosiah: 'mosiah',
  Alma: 'alma',
  Helaman: 'hel',
  '3 Nephi': '3-ne',
  '4 Nephi': '4-ne',
  Mormon: 'morm',
  Ether: 'ether',
  Moroni: 'moro',
  'D&C': 'dc',
  Moses: 'moses',
  Abraham: 'abr',
  'Joseph Smith—Matthew': 'js-m',
  'Joseph Smith—History': 'js-h',
  'Articles of Faith': 'a-of-f',
};
/** the chapter in Gospel Library (its universal link opens the app when it is there, else the page), marking the verses when
    there are some; null for a book it has no name for */
export function scrGospelLibrary(volume: string, key: string, verses: number[] = []): string | null {
  const s = scrSplit(key);
  const vol = GL_VOL[volume];
  const book = s && GL_BOOK[s.book];
  if (!s || !vol || !book) return null;
  const base = `https://www.churchofjesuschrist.org/study/scriptures/${vol}/${book}/${s.n}?lang=eng`;
  const v = [...verses].sort((a, b) => a - b);
  if (!v.length) return base;
  const a = v[0];
  const b = v[v.length - 1];
  return `${base}&id=${b > a ? `p${a}-p${b}` : `p${a}`}#p${a}`;
}

/** It is written's two chapters, opened on their verses in the library when it is on (written.ts link and link5) */
export const SCR_WRITTEN = { link: { key: 'Matthew 4', v: '1-11' }, link5: { key: 'Matthew 5', v: '1-16' } } as const;
/** its link's words in the library: "Read Matthew 4", the app's name left off */
export const scrWrittenLabel = (label: string) => label.replace(/ in (Gospel Library|your Bible app)$/, '');
