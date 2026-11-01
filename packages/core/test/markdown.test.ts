/* Markdown for journal entries (markdown.ts): it reads the way Obsidian reads it, and it never changes a character of the words. */
import { describe, expect, it } from 'vitest';
import { mdBlocks, mdContinue, mdInline, mdPlain, mdSource, mdToggleTask } from '../src/markdown';

const shown = (s: string) =>
  mdInline(s)
    .filter((x) => !x.mk)
    .map((x) => x.t)
    .join('');
const whole = (s: string) =>
  mdInline(s)
    .map((x) => x.t)
    .join('');
const find = (s: string, t: string) => mdInline(s).find((x) => x.t === t);

describe('words on a line', () => {
  it('reads bold, italic, both, strikethrough, highlight and code', () => {
    expect(find('a **b** c', 'b')).toMatchObject({ b: true });
    expect(find('a __b__ c', 'b')).toMatchObject({ b: true });
    expect(find('a *b* c', 'b')).toMatchObject({ i: true });
    expect(find('a _b_ c', 'b')).toMatchObject({ i: true });
    expect(find('***both***', 'both')).toMatchObject({ b: true, i: true });
    expect(find('a ~~b~~ c', 'b')).toMatchObject({ s: true });
    expect(find('a ==b== c', 'b')).toMatchObject({ h: true });
    expect(find('a `b` c', 'b')).toMatchObject({ c: true });
    expect(find('**bold and *both* in it**', 'both')).toMatchObject({ b: true, i: true });
  });
  it('leaves marks with nothing to close them as words', () => {
    for (const s of ['2 * 3 * 4', 'a ** b', 'snake_case_name', 'an unclosed **bold', 'x == y', '`open']) expect(shown(s)).toBe(s);
    expect(mdInline('snake_case_name').some((x) => x.i)).toBe(false);
    expect(mdInline('2 * 3 * 4').some((x) => x.i)).toBe(false);
  });
  it('code keeps its marks as words inside', () => {
    expect(find('`**not bold**`', '**not bold**')).toMatchObject({ c: true });
    expect(find('`**not bold**`', '**not bold**')?.b).toBeUndefined();
  });
  it('a backslash keeps a mark as a word', () => {
    expect(shown('\\*not italic\\*')).toBe('*not italic*');
    expect(mdInline('\\*not italic\\*').some((x) => x.i)).toBe(false);
  });
  it('reads links, [[links]] with a name, embeds and #tags', () => {
    expect(find('see [[Calm]] now', 'Calm')).toMatchObject({ link: true });
    expect(shown('see [[Calm|that day]] now')).toBe('see that day now');
    expect(find('see [[Calm|that day]] now', 'that day')).toMatchObject({ link: true });
    expect(find('![[walk.png]]', 'walk.png')).toMatchObject({ embed: true });
    expect(find('[a site](https://example.com/x)', 'a site')).toMatchObject({ link: true, url: 'https://example.com/x' });
    expect(find('go to https://example.com/x.', 'https://example.com/x')).toMatchObject({ url: 'https://example.com/x' });
    expect(find('at #prayer tonight', '#prayer')).toMatchObject({ link: true });
    expect(mdInline('page#2 and #123').some((x) => x.link)).toBe(false);
  });
  it('a link with no web address opens nothing', () => {
    expect(find('[a](javascript:alert(1))', 'a')?.url).toBeUndefined();
    expect(find('[a](file:///etc/x)', 'a')?.url).toBeUndefined();
  });
  it('hides a comment', () => {
    expect(shown('kept %%not this%% kept')).toBe('kept  kept');
  });
});

describe('blocks', () => {
  const kinds = (t: string) => mdBlocks(t).map((b) => b.k);
  it('reads headings, quotes, lists, tasks, rules and blank lines', () => {
    const b = mdBlocks('# One\n### Three\n> said\n- item\n  - under\n1. first\n- [ ] to do\n- [x] done\n---\n\nwords');
    expect(b.map((x) => x.k)).toEqual(['h', 'h', 'quote', 'li', 'li', 'li', 'task', 'task', 'hr', 'blank', 'p']);
    expect(b[1]).toMatchObject({ level: 3 });
    expect(b[4]).toMatchObject({ depth: 1 });
    expect(b[5]).toMatchObject({ n: '1.' });
    expect(b[6]).toMatchObject({ done: false });
    expect(b[7]).toMatchObject({ done: true });
  });
  it('does not take a #tag or seven hashes for a heading', () => {
    expect(kinds('#tag here')).toEqual(['p']);
    expect(kinds('####### seven')).toEqual(['p']);
  });
  it('holds code together, closed or not, and reads nothing inside it', () => {
    const b = mdBlocks('```js\n# not a heading\n**x**\n```\nafter');
    expect(b.map((x) => x.k)).toEqual(['code', 'p']);
    expect(b[0]).toMatchObject({ lines: ['# not a heading', '**x**'] });
    expect(kinds('```\nstill writing')).toEqual(['code']);
  });
  it('reads a table', () => {
    const b = mdBlocks('| Day | How |\n|---|---|\n| Mon | **good** |\nafter');
    expect(b.map((x) => x.k)).toEqual(['table', 'p']);
    const t = b[0] as Extract<(typeof b)[number], { k: 'table' }>;
    expect(t.head.map((c) => c[0].t)).toEqual(['Day', 'How']);
    expect(t.rows[0][1].find((s) => s.t === 'good')).toMatchObject({ b: true });
  });
  it('a line with a bar and no rule under it is words', () => {
    expect(kinds('this | that\nmore')).toEqual(['p', 'p']);
  });
  it('reads a callout, with its name as the title when it has no other', () => {
    expect(mdBlocks('> [!note] Remember this\n> the words')[0]).toMatchObject({ k: 'quote', title: true });
    const b = mdBlocks('> [!tip]')[0] as Extract<ReturnType<typeof mdBlocks>[number], { k: 'quote' }>;
    expect(b.spans[0].t).toBe('Tip');
  });
});

describe('the words stay exactly as they were written', () => {
  const samples = [
    '',
    'plain',
    '\n\nblank lines\n\n\nand more\n',
    '# Heading **bold**\nwords *here* and `code` and [[Calm|x]] and ![[a.png]] and [t](https://a.b) and https://a.b. #tag %%c%% \\* ~~s~~ ==h==',
    '> quote\n> [!note] Title\n> [!tip]\n- a\n  - [ ] b\n\t- [x] c\n1) d\n---\n***\n',
    '```\ncode **x**\n```\n| a | b |\n|---|---|\n| c | d |\ntail',
    '```\nnever closed\n# still',
    'unclosed ** and * and ` and [[ and [x]( and %% and == and ~~',
    'emoji 🙂 **bold 🙂** ñandú *é*',
    '\\',
    '    indented\n  - x',
  ];
  it('line by line and as a whole, so nothing typed is ever changed by showing it', () => {
    for (const s of samples) {
      for (const line of s.split('\n')) expect(whole(line)).toBe(line);
      expect(
        mdSource(s)
          .map((x) => x.t)
          .join(''),
      ).toBe(s);
    }
  });
  it('holds up for words thrown at it at random', () => {
    const bits = [
      '*',
      '**',
      '_',
      '__',
      '`',
      '~~',
      '==',
      '[[',
      ']]',
      '[',
      ']',
      '(',
      ')',
      '#',
      '> ',
      '- ',
      '- [ ] ',
      '|',
      '---',
      '\n',
      ' ',
      'a',
      'é',
      '%%',
      '\\',
      '```\n',
      '!',
      'https://a.b',
      '1. ',
      '> [!x]',
    ];
    let seed = 7;
    const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff);
    for (let n = 0; n < 500; n++) {
      let s = '';
      for (let i = next() % 30; i > 0; i--) s += bits[next() % bits.length];
      expect(
        mdSource(s)
          .map((x) => x.t)
          .join(''),
      ).toBe(s);
    }
  });
});

describe('mdPlain, for a line in a list', () => {
  it('takes the marks out and keeps the words', () => {
    expect(mdPlain('# A day\n**Good** walk with [[Sam|a friend]] %%hidden%%\n- [x] done\n- item')).toBe('A day\nGood walk with a friend \n☑ done\n• item');
  });
  it('leaves plain words as they are', () => {
    expect(mdPlain('A good morning.\n\nThe second part.')).toBe('A good morning.\n\nThe second part.');
  });
});

describe('ticking a task', () => {
  it('changes only that mark', () => {
    const t = '- [ ] one\nwords\n  * [x] two';
    expect(mdToggleTask(t, 0)).toBe('- [x] one\nwords\n  * [x] two');
    expect(mdToggleTask(t, 2)).toBe('- [ ] one\nwords\n  * [ ] two');
  });
  it('leaves anything else alone', () => {
    expect(mdToggleTask('words', 0)).toBe('words');
    expect(mdToggleTask('words', 9)).toBe('words');
  });
});

describe('return in a list', () => {
  const press = (t: string, at = t.length) => mdContinue(t, t.slice(0, at) + '\n' + t.slice(at));
  it('starts the next item the same way', () => {
    expect(press('- one')).toEqual({ text: '- one\n- ', caret: 8 });
    expect(press('  * one')?.text).toBe('  * one\n  * ');
    expect(press('- [x] done')?.text).toBe('- [x] done\n- [ ] ');
    expect(press('9. nine')?.text).toBe('9. nine\n10. ');
    expect(press('> said')?.text).toBe('> said\n> ');
  });
  it('carries on in the middle of the words too', () => {
    const r = press('- one\nafter', 5);
    expect(r).toEqual({ text: '- one\n- \nafter', caret: 8 });
  });
  it('goes by the caret when the text cannot say', () => {
    expect(mdContinue('- one\n', '- one\n\n', 7)).toBeNull();
    expect(mdContinue('- one\n', '- one\n\n', 6)?.text).toBe('- one\n- \n');
  });
  it('ends the list on an empty item', () => {
    expect(press('- one\n- ')).toEqual({ text: '- one\n', caret: 6 });
    expect(press('- [ ] ')).toEqual({ text: '', caret: 0 });
  });
  it('leaves everything else to the keyboard', () => {
    expect(press('plain words')).toBeNull();
    expect(mdContinue('- one', '- one more')).toBeNull();
    expect(mdContinue('- one', '- on')).toBeNull();
    expect(mdContinue('- one', '- one!')).toBeNull();
  });
});
