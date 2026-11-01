/* Markdown, as Obsidian reads it, for journal entries when Obsidian is on (journal-notes.ts). The entry's words stay exactly as
   they were written: this only says how to show them. It is written here and not taken from a library because the page needs one
   thing most parsers do not give: every character of the words accounted for, so what is being typed can be colored in place
   and the same pieces, with the marks left out, are what is shown when reading.

   It covers what a journal uses: headings, bold, italic, strikethrough, highlight, code, quotes and callouts, lists, tasks,
   tables, rules, links, [[links]], #tags, and %%comments%%, which Obsidian hides when reading. */

/** a run of words with one look. Run them all together and you get the source back */
export interface MdSpan {
  t: string;
  /** a mark, like the ** around bold: faint while writing, and not there when reading */
  mk?: boolean;
  b?: boolean;
  i?: boolean;
  /** struck through */
  s?: boolean;
  /** highlighted */
  h?: boolean;
  /** code */
  c?: boolean;
  /** a [[link]] or a #tag, in the link color */
  link?: boolean;
  /** a web address to open */
  url?: string;
  /** an embed, ![[picture.png]], which the journal can only name */
  embed?: boolean;
}

export type MdBlock =
  | { k: 'blank'; line: number }
  | { k: 'p'; line: number; prefix: string; spans: MdSpan[] }
  | { k: 'h'; line: number; level: number; prefix: string; spans: MdSpan[] }
  | { k: 'quote'; line: number; prefix: string; spans: MdSpan[]; title?: boolean }
  | { k: 'li'; line: number; depth: number; n?: string; prefix: string; spans: MdSpan[] }
  | { k: 'task'; line: number; depth: number; done: boolean; prefix: string; spans: MdSpan[] }
  | { k: 'hr'; line: number; prefix: string }
  | { k: 'code'; line: number; source: string; lines: string[] }
  | { k: 'table'; line: number; source: string; head: MdSpan[][]; rows: MdSpan[][][] };

type Look = Omit<MdSpan, 't'>;

const WEB = /^https?:\/\/[^\s<>)\]]+/;
/** a pair of marks the inner words are looked at again inside. Underscores only count at the edge of a word, as in Obsidian */
const PAIRS: { mark: string; look: Look; edge?: boolean }[] = [
  { mark: '**', look: { b: true } },
  { mark: '__', look: { b: true }, edge: true },
  { mark: '~~', look: { s: true } },
  { mark: '==', look: { h: true } },
  { mark: '*', look: { i: true } },
  { mark: '_', look: { i: true }, edge: true },
];

const isWordCh = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);

/** where the closing mark is, or -1. Words cannot start or end with a space inside the marks */
function closes(s: string, from: number, mark: string, edge?: boolean): number {
  if (from >= s.length || /\s/.test(s[from])) return -1;
  for (let i = from + 1; i <= s.length - mark.length; i++) {
    if (s[i] === '\\') {
      i++;
      continue;
    }
    if (!s.startsWith(mark, i) || /\s/.test(s[i - 1])) continue;
    /* ** inside a * pair belongs to bold, not to the end of the italic */
    if (mark.length === 1 && s[i + 1] === mark) {
      i++;
      continue;
    }
    /* so does the last of three: ***both*** closes bold at its very end */
    if (mark.length === 2 && s[i + 2] === mark[0]) continue;
    if (edge && isWordCh(s[i + mark.length])) continue;
    return i;
  }
  return -1;
}

/** the pieces of one line of words. Marks with nothing to close them are plain words */
export function mdInline(s: string, look: Look = {}): MdSpan[] {
  const out: MdSpan[] = [];
  let plain = '';
  const flush = () => {
    if (plain) out.push({ t: plain, ...look });
    plain = '';
  };
  const mark = (t: string) => out.push({ t, ...look, mk: true });
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    const rest = s.slice(i);
    if (ch === '\\' && i + 1 < s.length && /[\\`*_~=[\]()#!|>%-]/.test(s[i + 1])) {
      flush();
      mark('\\');
      plain = s[i + 1];
      i += 2;
      continue;
    }
    if (ch === '`') {
      const end = s.indexOf('`', i + 1);
      if (end > i + 1) {
        flush();
        mark('`');
        out.push({ t: s.slice(i + 1, end), ...look, c: true });
        mark('`');
        i = end + 1;
        continue;
      }
    }
    if (rest.startsWith('%%')) {
      const end = s.indexOf('%%', i + 2);
      if (end > 0) {
        flush();
        mark(s.slice(i, end + 2));
        i = end + 2;
        continue;
      }
    }
    const wiki = /^(!?)\[\[([^\]\n]+)\]\]/.exec(rest);
    if (wiki) {
      flush();
      const [target, alias] = wiki[2].split('|');
      if (alias) {
        mark(wiki[1] + '[[' + target + '|');
        out.push({ t: alias, ...look, link: true, ...(wiki[1] ? { embed: true } : null) });
      } else {
        mark(wiki[1] + '[[');
        out.push({ t: target, ...look, link: true, ...(wiki[1] ? { embed: true } : null) });
      }
      mark(']]');
      i += wiki[0].length;
      continue;
    }
    const link = /^(!?)\[([^\]\n]*)\]\(([^)\s]+)\)/.exec(rest);
    if (link) {
      flush();
      const url = /^https?:\/\//.test(link[3]) ? link[3] : undefined;
      mark(link[1] + '[');
      out.push(...mdInline(link[2], { ...look, link: true, ...(url ? { url } : null), ...(link[1] ? { embed: true } : null) }));
      mark('](' + link[3] + ')');
      i += link[0].length;
      continue;
    }
    if (ch === '#' && (i === 0 || /\s/.test(s[i - 1]))) {
      const tag = /^#[\p{L}\p{N}_/-]*[\p{L}_/-][\p{L}\p{N}_/-]*/u.exec(rest);
      if (tag) {
        flush();
        out.push({ t: tag[0], ...look, link: true });
        i += tag[0].length;
        continue;
      }
    }
    if (ch === 'h' && !isWordCh(s[i - 1])) {
      const web = WEB.exec(rest);
      if (web) {
        /* a mark or a stop straight after an address is not part of it */
        const url = web[0].replace(/[.,;:!?*_~]+$/, '');
        flush();
        out.push({ t: url, ...look, link: true, url });
        i += url.length;
        continue;
      }
    }
    const pair = PAIRS.find((p) => rest.startsWith(p.mark));
    if (pair && (!pair.edge || !isWordCh(s[i - 1]))) {
      const from = i + pair.mark.length;
      const end = closes(s, from, pair.mark, pair.edge);
      if (end > from) {
        flush();
        mark(pair.mark);
        out.push(...mdInline(s.slice(from, end), { ...look, ...pair.look }));
        mark(pair.mark);
        i = end + pair.mark.length;
        continue;
      }
    }
    plain += ch;
    i++;
  }
  flush();
  return out;
}

const splitRow = (line: string): string[] => {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split(/(?<!\\)\|/).map((c) => c.trim());
};
const isTableRule = (line: string) => /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(line) && line.includes('-');

/** the words as blocks, one a line except for code and tables */
export function mdBlocks(text: string): MdBlock[] {
  const lines = text.split('\n');
  const out: MdBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      out.push({ k: 'blank', line: i });
      continue;
    }
    const fence = /^\s*(```+|~~~+)/.exec(line);
    if (fence) {
      let end = i + 1;
      while (end < lines.length && !lines[end].trim().startsWith(fence[1])) end++;
      const closed = end < lines.length;
      out.push({ k: 'code', line: i, source: lines.slice(i, closed ? end + 1 : end).join('\n'), lines: lines.slice(i + 1, end) });
      i = closed ? end : end - 1;
      continue;
    }
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && lines[i + 1].includes('|') && isTableRule(lines[i + 1])) {
      let end = i + 2;
      while (end < lines.length && lines[end].includes('|') && lines[end].trim()) end++;
      out.push({
        k: 'table',
        line: i,
        source: lines.slice(i, end).join('\n'),
        head: splitRow(line).map((c) => mdInline(c)),
        rows: lines.slice(i + 2, end).map((l) => splitRow(l).map((c) => mdInline(c))),
      });
      i = end - 1;
      continue;
    }
    if (/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push({ k: 'hr', line: i, prefix: line });
      continue;
    }
    const h = /^(#{1,6} +)(.*)$/.exec(line);
    if (h) {
      out.push({ k: 'h', line: i, level: h[1].trim().length, prefix: h[1], spans: mdInline(h[2]) });
      continue;
    }
    const q = /^(\s{0,3}> ?)(.*)$/.exec(line);
    if (q) {
      /* a callout is a quote whose first line names it; its name reads as the quote's title */
      const call = /^(\[![\w-]+\][+-]? ?)(.*)$/.exec(q[2]);
      if (call) {
        const name = call[1].replace(/^\[!|\][+-]? ?$/g, '');
        const title = call[2] || name.charAt(0).toUpperCase() + name.slice(1);
        out.push({
          k: 'quote',
          line: i,
          prefix: q[1] + call[1],
          spans: call[2] ? mdInline(call[2], { b: true }) : [{ t: title, b: true }],
          title: true,
        });
      } else out.push({ k: 'quote', line: i, prefix: q[1], spans: mdInline(q[2]) });
      continue;
    }
    const task = /^(\s*)([-*+] \[([ xX])\] )(.*)$/.exec(line);
    if (task) {
      out.push({
        k: 'task',
        line: i,
        depth: Math.floor(task[1].replace(/\t/g, '  ').length / 2),
        done: task[3] !== ' ',
        prefix: task[1] + task[2],
        spans: mdInline(task[4]),
      });
      continue;
    }
    const li = /^(\s*)([-*+]|\d+[.)]) (.*)$/.exec(line);
    if (li) {
      const n = /\d/.test(li[2]) ? li[2] : undefined;
      out.push({
        k: 'li',
        line: i,
        depth: Math.floor(li[1].replace(/\t/g, '  ').length / 2),
        ...(n ? { n } : null),
        prefix: li[1] + li[2] + ' ',
        spans: mdInline(li[3]),
      });
      continue;
    }
    out.push({ k: 'p', line: i, prefix: '', spans: mdInline(line) });
  }
  return out;
}

/** the look a block's words have while being written */
const blockLook = (b: MdBlock): Look => (b.k === 'h' ? { b: true } : {});

/** every character of the words, in order, with its look: what the page colors while they are being written. A heading's level
    comes back with it, for its size. Run the pieces together and the words come back exactly */
export function mdSource(text: string): (MdSpan & { level?: number; quiet?: boolean })[] {
  const out: (MdSpan & { level?: number; quiet?: boolean })[] = [];
  const blocks = mdBlocks(text);
  blocks.forEach((b, n) => {
    if (n) out.push({ t: '\n' });
    if (b.k === 'blank') return;
    if (b.k === 'code' || b.k === 'table') return void out.push({ t: b.source, c: b.k === 'code', quiet: b.k === 'table' });
    if (b.k === 'hr') return void out.push({ t: b.prefix, mk: true });
    if (b.prefix) out.push({ t: b.prefix, mk: true, ...(b.k === 'h' ? { level: b.level } : null) });
    /* the words of a callout's name are plain until they are written out */
    const line = text.split('\n')[b.line];
    const spans = b.k === 'quote' && b.title && line.length === b.prefix.length ? [] : b.spans;
    const extra = b.k === 'h' ? { level: b.level } : null;
    for (const s of spans) out.push({ ...s, ...blockLook(b), ...extra });
  });
  return out;
}

/** the words with the marks taken out, for a line in a list. A comment is left out, a link keeps its name */
export function mdPlain(text: string): string {
  const out: string[] = [];
  for (const b of mdBlocks(text)) {
    if (b.k === 'blank') out.push('');
    else if (b.k === 'hr') out.push('');
    else if (b.k === 'code') out.push(b.lines.join(' '));
    else if (b.k === 'table') out.push([b.head, ...b.rows].map((r) => r.map((c) => textOf(c)).join(' · ')).join('\n'));
    else {
      const lead = b.k === 'li' ? (b.n ? b.n + ' ' : '• ') : b.k === 'task' ? (b.done ? '☑ ' : '☐ ') : '';
      out.push(lead + textOf(b.spans));
    }
  }
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
const textOf = (spans: MdSpan[]) =>
  spans
    .filter((s) => !s.mk)
    .map((s) => s.t)
    .join('');

/** the words with one task ticked or unticked, by its line */
export function mdToggleTask(text: string, line: number): string {
  const lines = text.split('\n');
  const m = /^(\s*[-*+] \[)([ xX])(\] .*)$/.exec(lines[line] ?? '');
  if (!m) return text;
  lines[line] = m[1] + (m[2] === ' ' ? 'x' : ' ') + m[3];
  return lines.join('\n');
}

/** what return does in a list or a quote, as in Obsidian: the next line starts the same way, a task unticked and a number one on.
    Return on an empty item ends the list. Null when the change was not one return, or the line is not one of these */
export function mdContinue(prev: string, next: string, after?: number): { text: string; caret: number } | null {
  if (next.length !== prev.length + 1) return null;
  /* beside another line break the text alone cannot say where return was pressed. `after` is the caret just after it (iOS tells of
     the caret before the text), or it counts as the earlier place */
  const pressedAt = (i: number) => next[i] === '\n' && prev.slice(0, i) === next.slice(0, i) && prev.slice(i) === next.slice(i + 1);
  let at = 0;
  if (after != null && after > 0 && pressedAt(after - 1)) at = after - 1;
  else {
    while (at < prev.length && prev[at] === next[at]) at++;
    if (!pressedAt(at)) return null;
    while (at > 0 && prev[at - 1] === '\n') at--;
  }
  const start = prev.lastIndexOf('\n', at - 1) + 1;
  const line = prev.slice(start, at);
  const m = /^(\s*)(?:([-*+]) \[[ xX]\] |([-*+]) |(\d+)([.)]) |> ?)(.*)$/.exec(line);
  if (!m) return null;
  if (!m[6].trim()) return { text: prev.slice(0, start) + prev.slice(at), caret: start };
  const lead = m[2] ? `${m[2]} [ ] ` : m[3] ? `${m[3]} ` : m[4] ? `${+m[4] + 1}${m[5]} ` : '> ';
  const add = '\n' + m[1] + lead;
  return { text: prev.slice(0, at) + add + prev.slice(at), caret: at + add.length };
}
