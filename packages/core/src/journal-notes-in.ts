/* Journal notes, the way back: what the person does in Obsidian reaches the journal. A note in the picked folder with the first
   of the tags on every note (#daybook until they change it) comes in as an entry, and a change to a note changes its entry.
   Only that folder is read, never its subfolders, and a note without the tag stays out of Daybook, whatever it says.

   Words are never lost. When the note and the entry both changed since they were last in step, the entry keeps its words and
   the file moves aside (runNotePlan). A note deleted or moved in Obsidian leaves its entry in the journal, since moving a note
   to another folder looks the same as deleting it, and an entry is taken out only from Daybook. A note too long for an entry
   stays out rather than come in cut short. The file gets one line, its daybook_id, so it is known wherever it moves. */
import { cleanTag, cleanTags, logicalKey } from './legacy/core.js';
import { nextU } from './actions';
import { FEELINGS } from './feelings';
import { isJnId, isWord, jnEdit, JN_TEXT_MAX, onDay, type JEntry, type Journal } from './journal-entries';
import {
  frontKeys,
  isAsideName,
  JN_NO_FEEL,
  jnNoteFile,
  jnNoteTags,
  jnNoteText,
  noteHash,
  NOTE_REMOVE_MAX,
  type NoteFolderIO,
  type NoteLedger,
} from './journal-notes';
import { makeId } from './mutate';
import type { DayKey } from './types';

/** one file in the folder, as the phone lists it */
export interface NoteFile {
  name: string;
  /** modified, in ms */
  mod: number;
  /** created, in ms, when the phone can say */
  made?: number;
  /** in bytes */
  size?: number;
}
/** files read and found to be no entry's, with their modified time, so they are not read again until they change */
export type NoteSeen = Record<string, number>;

/** the most files one round reads to look for the tag: the rest wait for the next round */
export const NOTE_READ_MAX = 100;
/** a bigger file than this is not read at all */
export const NOTE_FILE_MAX = 200_000;

export interface ParsedNote {
  tags: string[];
  date?: DayKey;
  time?: string;
  /** the feeling, if the note names one */
  feeling?: string;
  /** the feeling, if a feeling/ tag names one */
  feelTag?: string;
  id?: string;
  /** what was written: everything under the frontmatter and the line of links */
  body: string;
}

const unquote = (v: string) => v.trim().replace(/^["']|["']$/g, '');
const allWords = FEELINGS.flat().map((f) => f.w);
/** a feeling as the person spelled it, in the field's own spelling, or as they wrote it when the field has no such word */
function feelWord(v: string): string | undefined {
  const raw = v.replace(/^\[\[|\]\]$/g, '').trim();
  const key = cleanTag(raw);
  const known = allWords.find((w) => cleanTag(w) === key);
  if (known) return known;
  const spaced = raw.replace(/-/g, ' ');
  const word = spaced.charAt(0).toUpperCase() + spaced.slice(1);
  return isWord(word) && word !== JN_NO_FEEL ? word : undefined;
}

const isDay = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v + 'T12:00:00Z').getTime());

/** reads a note: the frontmatter Obsidian understands, the tags in the words, and the words */
export function parseNote(raw: string): ParsedNote {
  const text = raw.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
  const front = /^---\n[\s\S]*?\n?---(?:\n|$)/.exec(text);
  const rest = front ? text.slice(front[0].length) : text;
  /* the line of links Daybook writes is not part of the words */
  const body = rest.replace(/^\s*(?:\[\[[^\]\n]+\]\] · )?\[\[\d{4}-\d{2}-\d{2}\]\][ \t]*(?:\n|$)/, '').trim();
  const out: ParsedNote = { tags: [], body };
  const tags: string[] = [];
  for (const { key, lines } of frontKeys(text)) {
    const k = key.toLowerCase();
    const first = lines[0].slice(lines[0].indexOf(':') + 1).trim();
    if (k === 'tags' || k === 'tag') {
      for (const l of lines.slice(1)) {
        const item = /^\s*-\s*(.+)$/.exec(l);
        if (item) tags.push(unquote(item[1]));
      }
      if (first)
        tags.push(
          ...first
            .replace(/^\[|\]$/g, '')
            .split(/[,\s]+/)
            .map(unquote),
        );
    } else if (k === 'date') {
      const v = unquote(first).slice(0, 10);
      if (isDay(v)) out.date = v;
    } else if (k === 'time') {
      const v = /^(\d{1,2}):(\d{2})/.exec(unquote(first));
      if (v && +v[1] < 24 && +v[2] < 60) out.time = v[1].padStart(2, '0') + ':' + v[2];
    } else if (k === 'feeling') {
      if (first) out.feeling = feelWord(unquote(first));
    } else if (k === 'daybook_id') {
      const v = unquote(first);
      if (isJnId(v)) out.id = v;
    }
  }
  /* a #tag in the words counts, the way Obsidian counts it; code does not */
  const prose = body.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ');
  for (const m of prose.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu)) tags.push(m[1]);
  const clean: string[] = [];
  for (const t of cleanTags(tags)) {
    if (t.startsWith('feeling/')) out.feelTag = out.feelTag ?? feelWord(t.slice(8));
    else clean.push(t);
  }
  out.tags = clean;
  return out;
}

const two = (n: number) => String(n).padStart(2, '0');
const clockOf = (ms: number) => {
  const t = new Date(ms);
  return two(t.getHours()) + ':' + two(t.getMinutes());
};

/** the note's words, without the question the entry was started from */
function wordsOf(p: ParsedNote, q: string | undefined): string {
  if (!q) return p.body;
  const line = '> ' + q.replace(/\s*\n\s*/g, ' ');
  return p.body === line ? '' : p.body.startsWith(line + '\n') ? p.body.slice(line.length).trim() : p.body;
}

type Patch = Parameters<typeof jnEdit>[2];
/** what changed in an entry, going by its note. Nothing the note leaves out is taken from the entry but its tags */
function patchFrom(e: JEntry, p: ParsedNote, every: string[], roll: number): Patch {
  const patch: Patch = {};
  const t = wordsOf(p, e.q);
  if (t !== e.t.trim()) patch.t = t;
  /* the note can say the feeling in two places, and the one that differs is the one that was changed */
  const w = [p.feeling, p.feelTag].find((x) => x && x !== e.w);
  if (w) patch.w = w;
  const tags = p.tags.filter((x) => !every.includes(x));
  if ([...tags].sort().join(' ') !== [...(e.tags || [])].sort().join(' ')) patch.tags = tags;
  const clock = clockOf(e.at);
  if ((p.date && p.date !== e.d) || (p.time && p.time !== clock)) {
    const d = p.date ?? e.d;
    patch.when = { at: onDay(d, p.time ?? clock, roll), d };
  }
  return patch;
}

/** the entry after a patch, as jnEdit would leave it, for the mark of its note */
const patched = (e: JEntry, patch: Patch, now: number) => jnEdit({ [e.id]: e }, e.id, patch, now)[e.id];

/** a new entry from a note. When it happened: what the note says, then a day in its file name, then when the file was made */
function entryFrom(id: string, p: ParsedNote, file: NoteFile, every: string[], roll: number, now: number): JEntry {
  const named = /^(\d{4}-\d{2}-\d{2})/.exec(file.name)?.[1];
  const made = file.made ?? file.mod;
  const d0 = p.date ?? (named && isDay(named) ? named : undefined);
  const at = d0 ? (p.time ? onDay(d0, p.time, roll) : logicalKey(made, roll) === d0 ? made : onDay(d0, null, roll)) : made;
  const e: JEntry = {
    id,
    d: d0 ?? logicalKey(made, roll),
    at,
    w: p.feeling ?? p.feelTag ?? JN_NO_FEEL,
    t: p.body,
    u: nextU(null, now),
  };
  const tags = p.tags.filter((x) => !every.includes(x));
  if (tags.length) e.tags = tags;
  return e;
}

/** the note's text, carrying this id */
export function withNoteId(raw: string, id: string): string {
  const text = raw.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '');
  const line = `daybook_id: ${id}`;
  const front = /^---\n([\s\S]*?)\n?---(\n|$)/.exec(text);
  if (front) {
    const inner = /^daybook_id:.*$/m.test(front[1]) ? front[1].replace(/^daybook_id:.*$/m, line) : (front[1] ? front[1] + '\n' : '') + line;
    return `---\n${inner}\n---${front[2]}` + text.slice(front[0].length);
  }
  return `---\n${line}\n---\n\n${text}`;
}

export interface NotePull {
  edits: { id: string; patch: Patch }[];
  adds: JEntry[];
  ledger: NoteLedger;
  seen: NoteSeen;
  /** notes that came in, and entries changed by their notes */
  added: number;
  changed: number;
  /** notes that left the folder this round; their entries stay */
  gone: number;
  /** notes too long to come in */
  tooLong: number;
  /** a file could not be reached; what is left waits for the next round */
  failed: boolean;
}

/** one round from the folder to the journal: it reads what changed, and says what the journal should do. It writes only a note's
    daybook_id. Apply the answer with applyNotePull. */
export async function pullNotes(
  args: { files: NoteFile[]; jn: Journal | undefined; every: string[]; ledger: NoteLedger; seen: NoteSeen; roll: number; now: number },
  io: NoteFolderIO,
): Promise<NotePull> {
  const { files, every, roll, now } = args;
  const jn = args.jn || {};
  const out: NotePull = { edits: [], adds: [], ledger: { ...args.ledger }, seen: {}, added: 0, changed: 0, gone: 0, tooLong: 0, failed: false };
  const byName = new Map(files.map((f) => [f.name, f]));
  for (const f of files) if (args.seen[f.name] != null) out.seen[f.name] = args.seen[f.name];
  const render = (e: JEntry) => noteHash(jnNoteText(e, every));
  const tag = every[0];

  /* a change to a note reaches its entry, unless the entry changed too: then runNotePlan keeps both */
  const pullKnown = (id: string, name: string, file: NoteFile, text: string) => {
    const e = jn[id];
    const m = out.ledger[id];
    const h = noteHash(text);
    out.ledger[id] = { ...m, f: name, m: file.mod };
    delete out.ledger[id].g;
    if (name !== jnNoteFile(e)) out.ledger[id].o = true;
    if (h === m.h) return;
    if ((m.e ?? m.h) !== render(e)) return;
    const p = parseNote(text);
    if (wordsOf(p, e.q).length > JN_TEXT_MAX) {
      out.tooLong++;
      return;
    }
    const patch = patchFrom(e, p, every, roll);
    if (Object.keys(patch).length) {
      out.edits.push({ id, patch });
      out.changed++;
      out.ledger[id] = { ...out.ledger[id], h, e: render(patched(e, patch, now)) };
    } else out.ledger[id] = { ...out.ledger[id], h, e: m.e ?? m.h };
  };

  try {
    const known = new Set<string>();
    for (const [id, m] of Object.entries(args.ledger)) {
      if (m.g) continue;
      known.add(m.f);
      if (!jn[id]) continue;
      const file = byName.get(m.f);
      if (!file || m.m === file.mod) continue;
      const text = await io.read(m.f);
      if (text != null) pullKnown(id, m.f, file, text);
    }

    const used = new Set(Object.keys(jn));
    const unread = files.filter((f) => !known.has(f.name) && out.seen[f.name] !== f.mod).sort((a, b) => b.mod - a.mod);
    let reads = 0;
    let complete = true;
    for (const file of unread) {
      if (isAsideName(file.name) || (file.size ?? 0) > NOTE_FILE_MAX) {
        out.seen[file.name] = file.mod;
        continue;
      }
      if (reads >= NOTE_READ_MAX) {
        complete = false;
        break;
      }
      reads++;
      const text = await io.read(file.name);
      if (text == null) continue;
      const p = parseNote(text);
      const m = p.id ? out.ledger[p.id] : undefined;
      const e = p.id ? jn[p.id] : undefined;
      /* a note Daybook knows, under a new name (renamed, or moved back into the folder) */
      if (p.id && e && m && (m.g || !byName.has(m.f))) {
        pullKnown(p.id, file.name, file, text);
        known.add(file.name);
        continue;
      }
      /* an entry's note found again with nothing to compare it to (the folder picked again). Words that differ are kept by
         moving the file aside when the entry is written */
      if (p.id && e && !m) {
        const same = wordsOf(p, e.q) === e.t.trim();
        out.ledger[p.id] = { f: file.name, h: same ? noteHash(text) : '', e: render(e) === noteHash(text) ? noteHash(text) : '', m: file.mod };
        if (file.name !== jnNoteFile(e)) out.ledger[p.id].o = true;
        known.add(file.name);
        continue;
      }
      /* anything else needs the tag to come in. A copy of a known note counts as a new note */
      if (!tag || !p.tags.includes(tag)) {
        out.seen[file.name] = file.mod;
        continue;
      }
      if (p.body.length > JN_TEXT_MAX) {
        out.seen[file.name] = file.mod;
        out.tooLong++;
        continue;
      }
      let id = p.id && !used.has(p.id) && !out.ledger[p.id] ? p.id : makeId(now);
      while (used.has(id)) id = makeId(now);
      used.add(id);
      const next = id === p.id ? text : withNoteId(text, id);
      if (next !== text) await io.write(file.name, next);
      const added = entryFrom(id, p, file, every, roll, now);
      out.adds.push(added);
      out.added++;
      out.ledger[id] = { f: file.name, h: noteHash(next), e: render(added) };
      if (file.name !== jnNoteFile(added)) out.ledger[id].o = true;
      delete out.seen[file.name];
    }

    /* a note gone from the folder. An empty folder, or many gone at once, is more likely the folder than the person */
    if (complete && files.length) {
      const missing = Object.entries(out.ledger).filter(([id, m]) => !m.g && jn[id] && !byName.has(m.f));
      if (missing.length <= NOTE_REMOVE_MAX) {
        for (const [id, m] of missing) out.ledger[id] = { ...m, g: true };
        out.gone = missing.length;
      }
    }
  } catch {
    out.failed = true;
  }
  return out;
}

/** the journal after a round from the folder */
export function applyNotePull(jn: Journal | undefined, pull: Pick<NotePull, 'edits' | 'adds'>, now = Date.now()): Journal {
  let next: Journal = { ...(jn || {}) };
  for (const { id, patch } of pull.edits) next = jnEdit(next, id, patch, now);
  for (const e of pull.adds) if (!next[e.id]) next[e.id] = e;
  return next;
}
