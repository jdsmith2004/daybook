/* Journal entries as Markdown notes, in a folder the person picks (their Obsidian vault, on iCloud). Daybook writes and
   Obsidian reads: one note per entry, one way. It is off until a folder is picked, and the phone's side is lib/notes.ts.

   The tags are one list on every note (Settings.jnTags), so a change to it changes every note, plus the feeling
   (feeling/calm) and whatever was picked for the entry alone (JEntry.tags).

   A note's words are never lost to Daybook. A file that is not what Daybook last wrote there (changed in Obsidian, or
   already there when a folder is picked again) is moved aside before writing, and kept instead of deleted. Only files
   Daybook wrote are ever touched: the ledger says which, and it stays on this device. Checked by test/journal-notes.test.ts. */
import { cleanTag, cleanTags } from './legacy/core.js';
import type { JEntry, Journal } from './journal-entries';
import { nextU } from './actions';
import type { Settings } from './types';

/** the tags on every note until the person changes them */
export const JN_TAGS = ['daybook', 'journal'];
/** the tags on every note */
export const jnTagsOf = (st: Pick<Settings, 'jnTags'> | null | undefined): string[] => st?.jnTags ?? JN_TAGS;

/** more entries than this gone at once is not a person deleting entries (a log replaced by the account's, or everything
    erased), so their notes stay in the folder */
export const NOTE_REMOVE_MAX = 5;

/** the feeling as a tag: Burned out is feeling/burned-out */
export const jnFeelTag = (w: string) => 'feeling/' + cleanTag(w);

/** every tag on an entry's note, in the order the note lists them */
export const jnNoteTags = (e: Pick<JEntry, 'w' | 'tags'>, every: string[]): string[] => cleanTags([...every, jnFeelTag(e.w), ...(e.tags || [])]);

const two = (n: number) => String(n).padStart(2, '0');

/** the note's file name. It sorts by time, it does not change when the words or the feeling do, and the end of the id keeps
    two entries in one minute apart. Changing when the entry happened is the one thing that renames it. */
export function jnNoteFile(e: Pick<JEntry, 'id' | 'd' | 'at'>): string {
  const t = new Date(e.at);
  return `${e.d} ${two(t.getHours())}${two(t.getMinutes())} ${e.id.slice(-4)}.md`;
}

/** the note's text: the tags and links Obsidian reads, the question if there was one, and what was written. The day links to
    a Daily Note named by date, wherever in the vault it is. */
export function jnNoteText(e: JEntry, every: string[]): string {
  const t = new Date(e.at);
  const head = [
    '---',
    'tags:',
    ...jnNoteTags(e, every).map((x) => '  - ' + x),
    `date: ${e.d}`,
    `time: "${two(t.getHours())}:${two(t.getMinutes())}"`,
    `feeling: "[[${e.w}]]"`,
    `daybook_id: ${e.id}`,
    '---',
    '',
    `[[${e.w}]] · [[${e.d}]]`,
    '',
  ];
  const q = e.q ? ['> ' + e.q.replace(/\s*\n\s*/g, ' '), ''] : [];
  const words = e.t.trim() ? [e.t.trim(), ''] : [];
  return [...head, ...q, ...words].join('\n');
}

/** the note for an entry: its file name and text */
export const jnNote = (e: JEntry, every: string[]) => ({ file: jnNoteFile(e), text: jnNoteText(e, every) });

/** a short mark of a note's text, to tell whether a file is still what Daybook wrote (FNV-1a, and the length) */
export function noteHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36) + '-' + text.length.toString(36);
}

/** what Daybook wrote for an entry: the file, and the mark of its text */
export interface NoteMark {
  f: string;
  h: string;
}
/** what Daybook has written to this folder, by entry id. It stays on this device. */
export type NoteLedger = Record<string, NoteMark>;

export const normLedger = (v: unknown): NoteLedger => {
  const out: NoteLedger = {};
  if (!v || typeof v !== 'object') return out;
  for (const [id, m] of Object.entries(v as Record<string, { f?: unknown; h?: unknown }>)) {
    if (m && typeof m.f === 'string' && typeof m.h === 'string') out[id] = { f: m.f, h: m.h };
  }
  return out;
};

export interface NotePlan {
  write: { id: string; f: string; text: string; h: string; was?: NoteMark }[];
  remove: { id: string; mark: NoteMark }[];
  /** entries gone in numbers too large to be a person deleting them: forgotten, and their notes stay */
  letGo: string[];
}

/** what has to change in the folder: a note whose text is not what was last written, and a note whose entry is gone */
export function jnNotePlan(jn: Journal | undefined, every: string[], ledger: NoteLedger): NotePlan {
  const plan: NotePlan = { write: [], remove: [], letGo: [] };
  const all = jn || {};
  for (const e of Object.values(all)) {
    const { file, text } = jnNote(e, every);
    const h = noteHash(text);
    const was = ledger[e.id];
    if (was && was.f === file && was.h === h) continue;
    plan.write.push({ id: e.id, f: file, text, h, ...(was ? { was } : null) });
  }
  const gone = Object.keys(ledger).filter((id) => !all[id]);
  if (gone.length > NOTE_REMOVE_MAX) plan.letGo = gone;
  else plan.remove = gone.map((id) => ({ id, mark: ledger[id] }));
  return plan;
}

/** the folder, as the phone reaches it. read gives null for a file that is not there, and throws when the folder cannot be
    reached (iCloud has not brought the file down, no room, the folder is gone). */
export interface NoteFolderIO {
  read(file: string): Promise<string | null>;
  write(file: string, text: string): Promise<void>;
  remove(file: string): Promise<void>;
  move(from: string, to: string): Promise<void>;
}

export interface NoteRun {
  ledger: NoteLedger;
  wrote: number;
  removed: number;
  /** files with someone's own changes, kept (moved aside, or left where they were) */
  kept: number;
  /** the folder could not be reached part of the way through; what is left waits for the next round */
  failed: boolean;
}

/** the name a changed file moves to: "2026-10-30 0915 k3f9 (edited).md", then (edited 2), and so on */
async function asideName(file: string, io: NoteFolderIO): Promise<string> {
  const base = file.replace(/\.md$/, '');
  for (let n = 1; n < 100; n++) {
    const name = `${base} (edited${n > 1 ? ' ' + n : ''}).md`;
    if ((await io.read(name)) == null) return name;
  }
  throw new Error('Too many edited copies of ' + file);
}

/** carries out a plan, one file at a time, so a failure part of the way loses nothing: the ledger comes back as far as it got */
export async function runNotePlan(plan: NotePlan, ledger: NoteLedger, io: NoteFolderIO): Promise<NoteRun> {
  const out: NoteRun = { ledger: { ...ledger }, wrote: 0, removed: 0, kept: 0, failed: false };
  for (const id of plan.letGo) delete out.ledger[id];
  try {
    for (const w of plan.write) {
      const cur = await io.read(w.f);
      if (cur != null) {
        const h = noteHash(cur);
        /* someone's own words in the way: they move aside, and the entry's note takes the name */
        if (h !== w.h && !(w.was && w.was.f === w.f && w.was.h === h)) {
          await io.move(w.f, await asideName(w.f, io));
          out.kept++;
        }
      }
      if (cur == null || noteHash(cur) !== w.h) await io.write(w.f, w.text);
      /* the time changed, so the note has a new name: the old file goes, unless someone changed it */
      if (w.was && w.was.f !== w.f) {
        const old = await io.read(w.was.f);
        if (old != null) {
          if (noteHash(old) === w.was.h) await io.remove(w.was.f);
          else out.kept++;
        }
      }
      out.ledger[w.id] = { f: w.f, h: w.h };
      out.wrote++;
    }
    for (const r of plan.remove) {
      const cur = await io.read(r.mark.f);
      if (cur != null) {
        if (noteHash(cur) === r.mark.h) {
          await io.remove(r.mark.f);
          out.removed++;
        } else out.kept++;
      }
      delete out.ledger[r.id];
    }
  } catch {
    out.failed = true;
  }
  return out;
}

/* ---------- the tags ---------- */
/** the tags on entries, most used first, with how many entries each is on; the ones on every note are left out */
export function jnTagCounts(jn: Journal | undefined, every: string[]): { tag: string; n: number }[] {
  const by = new Map<string, number>();
  for (const e of Object.values(jn || {})) for (const t of e.tags || []) if (!every.includes(t)) by.set(t, (by.get(t) || 0) + 1);
  return [...by.entries()].map(([tag, n]) => ({ tag, n })).sort((a, b) => b.n - a.n || (a.tag < b.tag ? -1 : 1));
}

/** a tag changed on every entry that has it, so the spelling stays the same across all of them. An empty new name takes it off. */
export function jnRenameTag(jn: Journal, from: string, to: string, now = Date.now()): Journal {
  const name = cleanTag(to);
  const next: Journal = { ...jn };
  for (const e of Object.values(jn)) {
    if (!e.tags?.includes(from)) continue;
    next[e.id] = { ...e, tags: cleanTags(e.tags.map((t) => (t === from ? name : t))), u: nextU(e, now) };
  }
  return next;
}
