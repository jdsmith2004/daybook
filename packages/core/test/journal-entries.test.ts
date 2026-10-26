/* The journal (journal-entries.ts): an entry starts with a feeling, keeps what is written, comes back from sync and backups
   cleaned, and each is its own record, so two devices writing on the same day never overwrite each other. */
import { describe, expect, it } from 'vitest';
import { makeBackup, normRecord, parseId, readBackup, restoreBackup, toRecords, applyRecords } from '../src/data';
import { FEEL_MID, FEELINGS } from '../src/feelings';
import {
  JN_PROMPTS,
  JN_TEXT_MAX,
  jnDayLabel,
  jnDays,
  jnEdit,
  jnGroups,
  jnList,
  jnPos,
  jnPrompt,
  jnPrompts,
  jnRemove,
  jnStart,
  jnTimeline,
  normJEntry,
  type Journal,
} from '../src/journal-entries';
import { hasLog, mergeRemote, pendingRecords, recordOf, restampRecords } from '../src/sync';
import type { Snapshot } from '../src/types';

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).getTime();
const snap = (journal: Journal): Snapshot => ({ settings: null, days: {}, reviews: {}, journal });

describe('an entry', () => {
  it('starts with the feeling alone, before a word is written', () => {
    const { jn, id } = jnStart({}, '2026-10-26', 'Hopeful', at(26, 21, 4));
    expect(jn[id]).toEqual({ id, d: '2026-10-26', at: at(26, 21, 4), w: 'Hopeful', t: '', u: at(26, 21, 4) });
    expect(jnPos(jn[id])).toEqual({ r: 3, c: 7 });
  });

  it('keeps what is written, the question it answers and a feeling named again, with a change time that moves on', () => {
    let { jn, id } = jnStart({}, '2026-10-26', 'Tired', at(26, 21));
    jn = jnEdit(jn, id, { t: 'Long day. I went for a walk instead.', q: 'What helped you today?' }, at(26, 21, 2));
    jn = jnEdit(jn, id, { w: 'Calm' }, at(26, 21, 2));
    expect(jn[id].t).toBe('Long day. I went for a walk instead.');
    expect(jn[id].q).toBe('What helped you today?');
    expect(jn[id].w).toBe('Calm');
    expect(jn[id].u).toBe(at(26, 21, 2) + 1);
    /* a word that is not a feeling is not taken */
    expect(jnEdit(jn, id, { w: '<b>' })[id].w).toBe('Calm');
    /* the question can be let go */
    expect(jnEdit(jn, id, { q: null })[id].q).toBeUndefined();
  });

  it('holds a long entry, up to a limit far past what anyone writes at once', () => {
    const { jn, id } = jnStart({}, '2026-10-26', 'Thoughtful', at(26, 9));
    const long = 'a'.repeat(JN_TEXT_MAX + 50);
    expect(jnEdit(jn, id, { t: long })[id].t.length).toBe(JN_TEXT_MAX);
    /* an entry that big still fits in one record */
    expect(JSON.stringify(jnEdit(jn, id, { t: long })[id]).length).toBeLessThan(64_000);
  });

  it('comes out cleanly, and nothing else does', () => {
    const a = jnStart({}, '2026-10-26', 'Glad', at(26, 9));
    const b = jnStart(a.jn, '2026-10-26', 'Calm', at(26, 10));
    const left = jnRemove(b.jn, a.id);
    expect(Object.keys(left)).toEqual([b.id]);
    expect(jnRemove(left, 'nothere')).toBe(left);
  });
});

describe('the list', () => {
  const build = () => {
    let jn: Journal = {};
    const add = (d: string, w: string, t: number) => (jn = jnStart(jn, d, w, t).jn);
    add('2026-10-24', 'Tired', at(24, 22));
    add('2026-10-26', 'Hopeful', at(26, 8));
    add('2026-10-25', 'Lonely', at(25, 20));
    add('2026-10-26', 'Proud', at(26, 21));
    return jn;
  };

  it('is newest first, by day, each day with a plain heading', () => {
    const jn = build();
    expect(jnList(jn).map((e) => e.w)).toEqual(['Proud', 'Hopeful', 'Lonely', 'Tired']);
    const g = jnGroups(jn, '2026-10-26');
    expect(g.map((x) => x.label)).toEqual(['Today', 'Yesterday', 'Saturday, Oct 24']);
    expect(g[0].items.map((e) => e.w)).toEqual(['Proud', 'Hopeful']);
  });

  it('keeps an entry under the day it was started on, after the new-day hour too', () => {
    /* written at 1 AM on the 27th, still the 26th's log */
    const jn = jnStart({}, '2026-10-26', 'Restless', at(27, 1)).jn;
    expect(jnGroups(jn, '2026-10-26')[0].label).toBe('Today');
  });

  it('says the year for an entry from another year', () => {
    expect(jnDayLabel('2025-12-31', '2026-10-26')).toBe('Dec 31, 2025');
  });

  it('counts days written, a number that only grows', () => {
    expect(jnDays(build())).toBe(3);
    expect(jnDays(undefined)).toBe(0);
  });
});

describe('the question at the top', () => {
  it('is open and kind, in plain words, and never names a hard feeling', () => {
    const all = [...JN_PROMPTS.morning, ...JN_PROMPTS.day, ...JN_PROMPTS.evening, ...jnPrompts(12)];
    const words = FEELINGS.flatMap((row) => row.slice(0, FEEL_MID)).map((f) => f.w.toLowerCase());
    for (const q of all) {
      expect(q).toMatch(/[?.]$/);
      expect(q).not.toMatch(/n[’']t\b|[’'](re|ll|ve|m|d)\b|\bit[’']s\b/i);
      expect(q).not.toMatch(/\b(slip|slipped|urge|porn|fail|failed|wrong|should|lonely|sad|ashamed)\b/i);
      for (const w of words) expect(q.toLowerCase().split(/[^a-z]+/)).not.toContain(w);
    }
  });

  it('fits the time of day, stays the same for an entry, and a tap shows the next one', () => {
    expect(JN_PROMPTS.morning).toContain(jnPrompt('abc123', 7));
    expect(JN_PROMPTS.evening).toContain(jnPrompt('abc123', 21));
    expect(jnPrompt('abc123', 21)).toBe(jnPrompt('abc123', 21));
    const qs = jnPrompts(21);
    const first = qs.indexOf(jnPrompt('abc123', 21));
    expect(jnPrompt('abc123', 21, 1)).toBe(qs[(first + 1) % qs.length]);
  });
});

describe('sync and backups', () => {
  it('each entry is its own record, cleaned on the way in', () => {
    const { jn, id } = jnStart({}, '2026-10-26', 'Hopeful', at(26, 9));
    const recs = toRecords(snap(jnEdit(jn, id, { t: 'A good start.' }, at(26, 9, 1))));
    expect(recs.map((r) => r.id)).toEqual([`journal/${id}`]);
    expect(parseId(`journal/${id}`)).toEqual({ kind: 'journal', key: id });
    expect(parseId('journal/../x')).toBeNull();
    const back = normRecord({ ...recs[0], data: { ...recs[0].data, extra: 'dropped', t: 'A good start.\u0000' } });
    expect(back?.data).toEqual({ ...jn[id], t: 'A good start.', u: recs[0].u });
    /* a record with no feeling is not an entry */
    expect(normRecord({ id: `journal/${id}`, u: 5, data: { d: '2026-10-26', at: 1, t: 'x' } })).toBeNull();
    expect(normJEntry({ w: 'Calm', d: 'yesterday', at: 1 }, id)).toBeNull();
  });

  it('two devices writing on the same day keep both entries', () => {
    const a = jnStart({}, '2026-10-26', 'Calm', at(26, 9));
    const b = jnStart({}, '2026-10-26', 'Proud', at(26, 9, 5));
    const here = snap(a.jn);
    const m = mergeRemote(here, {}, toRecords(snap(b.jn)));
    expect(Object.keys(m.snap.journal!).sort()).toEqual([a.id, b.id].sort());
    expect(m.changed).toEqual([`journal/${b.id}`]);
    const ap = applyRecords(here, toRecords(snap(b.jn)));
    expect(Object.keys(ap.snap.journal!).sort()).toEqual([a.id, b.id].sort());
  });

  it('the newer copy of one entry wins, and a deletion removes it', () => {
    const { jn, id } = jnStart({}, '2026-10-26', 'Calm', at(26, 9));
    const older = snap(jnEdit(jn, id, { t: 'first' }, at(26, 9, 1)));
    const newer = snap(jnEdit(jn, id, { t: 'first, then more' }, at(26, 9, 3)));
    expect(mergeRemote(older, {}, toRecords(newer)).snap.journal![id].t).toBe('first, then more');
    expect(mergeRemote(newer, {}, toRecords(older)).snap.journal![id].t).toBe('first, then more');
    const gone = mergeRemote(newer, {}, [{ id: `journal/${id}`, u: at(26, 10), data: null }]);
    expect(gone.snap.journal![id]).toBeUndefined();
  });

  it('a deleted entry is sent as a deletion, and a restamp reaches entries too', () => {
    const { jn, id } = jnStart({}, '2026-10-26', 'Calm', at(26, 9));
    const s = snap(jnRemove(jn, id));
    expect(pendingRecords(s, { [`journal/${id}`]: at(26, 9, 2) })).toEqual([{ id: `journal/${id}`, u: at(26, 9, 2), data: null }]);
    const r = restampRecords(snap(jn), {}, [`journal/${id}`], at(26, 12));
    expect(r.snap.journal![id].u).toBe(at(26, 12));
    expect(recordOf(r.snap, `journal/${id}`)).toBe(r.snap.journal![id]);
  });

  it('a device with only journal entries has a log to keep', () => {
    expect(hasLog(snap({}))).toBe(false);
    expect(hasLog(snap(jnStart({}, '2026-10-26', 'Calm', at(26, 9)).jn))).toBe(true);
  });

  it('a backup keeps the entries, and restoring one keeps the entries written since', () => {
    const a = jnStart({}, '2026-10-25', 'Hopeful', at(25, 9));
    const file = JSON.stringify(makeBackup(snap(jnEdit(a.jn, a.id, { t: 'kept' }))));
    const read = readBackup(file);
    expect(read.journal![a.id].t).toBe('kept');
    const since = jnStart({}, '2026-10-26', 'Calm', at(26, 9));
    const { snap: out } = restoreBackup(snap(since.jn), read, at(26, 12));
    expect(Object.keys(out.journal!).sort()).toEqual([a.id, since.id].sort());
    /* a backup from before the journal has none, and that is fine */
    expect(readBackup(JSON.stringify({ app: 'daybook', v: 1, days: {}, reviews: {}, settings: null })).journal).toEqual({});
  });
});

describe('every feeling, by day', () => {
  const ev = (o: Record<string, unknown>) => ({
    id: 'e1',
    time: null,
    outcome: 'rode',
    trigger: null,
    paused: null,
    did: null,
    recovered: false,
    note: '',
    ...o,
  });
  const day = (d: string, o: Record<string, unknown>) => ({ d, events: [], checkin: null, p: null, u: 1, ...o }) as never;

  it('puts the journal, Name the feeling, the ride and a slip together, in the order they came', () => {
    const { jn } = jnStart({}, '2026-10-26', 'Grateful', at(26, 21, 40));
    const days = {
      '2026-10-26': day('2026-10-26', {
        events: [ev({ time: '18:10' })],
        p: {
          fe: [
            ['Restless', at(26, 18, 15)],
            ['Anxious', at(26, 9, 0)],
          ],
        },
      }),
      '2026-10-23': day('2026-10-23', { events: [ev({ time: '23:50', outcome: 'slipped', fb: 'Lonely' })] }),
    };
    const t = jnTimeline(jn, days, '2026-10-26');
    expect(t.map((g) => g.k)).toEqual(['2026-10-26', '2026-10-23']);
    expect(t[0].label).toBe('Today');
    expect(t[0].feels.map((f) => [f.w, f.from])).toEqual([
      ['Anxious', 'named'],
      ['Restless', 'urge'],
      ['Grateful', 'journal'],
    ]);
    expect(t[0].entries).toHaveLength(1);
    expect(t[1].feels).toEqual([{ w: 'Lonely', at: at(23, 23, 50), from: 'slip' }]);
  });

  it('keeps a slip after midnight on the night it belongs to, and leaves out days with no feeling and days to come', () => {
    const days = {
      '2026-10-24': day('2026-10-24', { events: [ev({ time: '01:30', outcome: 'slipped', fb: 'Tired' })] }),
      '2026-10-25': day('2026-10-25', { events: [ev({ time: '20:00' })] }),
      '2026-10-27': day('2026-10-27', { p: { fe: [['Calm', at(27, 9)]] } }),
    };
    const t = jnTimeline({}, days, '2026-10-26');
    expect(t.map((g) => g.k)).toEqual(['2026-10-24']);
    expect(t[0].feels[0].at).toBe(at(25, 1, 30));
  });
});
