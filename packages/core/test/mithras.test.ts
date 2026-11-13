/* The Mithras import (mithras.ts): signing in and reading only the person's own rows (a made-up Supabase, never the real one),
   Mithras rows as Daybook records, landing them without lowering anything, the Campfire welcome as one moment, and a second
   import that changes nothing. */
import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import { keepEarned } from '../src/data';
import { mergePlay } from '../src/sync';
import type { MJournal, MithrasRows, Snapshot } from '../src/index';

const ME = '11111111-2222-4333-8444-555555555555';
const OTHER = '99999999-2222-4333-8444-555555555555';
const tk = '2026-11-13';
const now = new Date(2026, 10, 13, 9).getTime();
const uuid = (i: number) => 'aaaaaaaa-0000-4000-8000-' + String(i).padStart(12, '0');
const iso = (y: number, m: number, d: number, h = 21) => new Date(y, m - 1, d, h, 15).toISOString();

/** a made-up Mithras: rows in memory, answered the way Supabase's REST answers, with every call written down */
function fakeMithras(rows: { journals: (MJournal & { user_id: string })[]; streaks: object[]; profiles: object[] }, opts: { password?: string } = {}) {
  const calls: { url: string; method: string; auth: string; body?: string }[] = [];
  const fetchFn = async (url: string, init: { method: string; headers: Record<string, string>; body?: string }) => {
    calls.push({ url, method: init.method, auth: init.headers.authorization, body: init.body });
    const ok = (j: unknown, status = 200) => ({ ok: status < 300, status, text: async () => JSON.stringify(j) });
    const u = new URL(url);
    if (u.pathname === '/auth/v1/token') {
      const b = JSON.parse(init.body || '{}');
      if (u.searchParams.get('grant_type') === 'password')
        return b.password === (opts.password ?? 'right') ? ok({ access_token: 'tok', user: { id: ME } }) : ok({ error: 'invalid_grant' }, 400);
      if (u.searchParams.get('grant_type') === 'id_token')
        return b.id_token === 'apple-ok' ? ok({ access_token: 'tok', user: { id: ME } }) : ok({ msg: 'Unacceptable audience' }, 400);
    }
    if (u.pathname === '/auth/v1/logout') return ok({}, 204);
    if (init.headers.authorization !== 'Bearer tok') return ok([], 401);
    const table = u.pathname.replace('/rest/v1/', '');
    const who = (u.searchParams.get('user_id') || '').replace(/^eq\./, '');
    /* row-level security off, as Mithras's is on some tables: the filter in the url is the only thing that keeps others out */
    const all = table === 'journals' ? rows.journals : table === 'streaks' ? rows.streaks : rows.profiles;
    let out = (all as { user_id: string; is_deleted?: boolean }[]).filter((r) => !who || r.user_id === who);
    if (u.searchParams.get('is_deleted') === 'eq.false') out = out.filter((r) => !r.is_deleted);
    const off = Number(u.searchParams.get('offset') || 0);
    const lim = Number(u.searchParams.get('limit') || 1000);
    return ok(out.slice(off, off + lim));
  };
  return { fetchFn, calls, client: core.mithrasClient('https://mithras.example.co', 'anon-key', fetchFn) };
}

const journal = (i: number, extra: Partial<MJournal> = {}): MJournal & { user_id: string } => ({
  id: uuid(i),
  user_id: ME,
  created_at: iso(2026, 3, 1 + (i % 28), 21),
  title: 'Entry ' + i,
  content: 'I sat with it tonight and did not give in.',
  emotions: [{ id: 'anxious', name: 'Anxious' }, { id: 'hopeful' }, 'exhausted'],
  reflection_data: { location: 'Home', activity: 'Scrolling', people: 'Alone' },
  is_deleted: false,
  ...extra,
});

/** a Mithras streak: wins from March 1 for n days, with a setback (year minus 100) on the days given */
const streakRow = (n: number, setbacks: string[], longest = 12) => {
  const days: string[] = [];
  for (let i = 0; i < n; i++) days.push(core.addDays('2026-03-01', i));
  const back = setbacks.map((k) => String(Number(k.slice(0, 4)) - 100) + k.slice(4));
  return { user_id: ME, streak_days: [...days.filter((k) => !setbacks.includes(k)), ...back], longest_streak: longest, current_streak: 3 };
};

/** a new person, just through setup today */
const fresh = (): Snapshot => {
  const settings = core.obBegin({ habit: 'porn', freq: 'f2' }, tk, now);
  return { settings, days: {}, reviews: {}, journal: {} };
};

describe('signing in and reading', () => {
  it('reads only the signed-in person’s rows, a page at a time, and signs out', async () => {
    const js = Array.from({ length: 1234 }, (_, i) => journal(i));
    js.push({ ...journal(5000), user_id: OTHER });
    js.push(journal(6000, { is_deleted: true }));
    const m = fakeMithras({
      journals: js,
      streaks: [streakRow(30, []), { user_id: OTHER, streak_days: [] }],
      profiles: [{ user_id: ME, usage_pattern: 'daily', addiction_type: 'pornography' }],
    });
    const s = await m.client.signInEmail(' me@example.com ', 'right');
    expect(s).toEqual({ token: 'tok', user: ME });
    const rows = await m.client.read(s);
    await m.client.signOut(s);
    expect(rows.journals).toHaveLength(1234);
    expect(rows.journals.every((r) => (r as unknown as { user_id: string }).user_id === ME)).toBe(true);
    expect(rows.streak && (rows.streak as { user_id: string }).user_id).toBe(ME);
    const rest = m.calls.filter((c) => c.url.includes('/rest/v1/'));
    /* three pages of entries, the streak, the profile: every read names the person and carries their own sign-in */
    expect(rest).toHaveLength(5);
    expect(rest.every((c) => c.url.includes('user_id=eq.' + ME) && c.method === 'GET' && c.auth === 'Bearer tok')).toBe(true);
    expect(m.calls.filter((c) => c.method !== 'GET').map((c) => new URL(c.url).pathname)).toEqual(['/auth/v1/token', '/auth/v1/logout']);
    expect(JSON.parse(m.calls[0].body!).email).toBe('me@example.com');
  });

  it('a row that belongs to someone else is dropped even if the server sends it', async () => {
    const leaky = async (url: string) => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(url.includes('/auth/') ? { access_token: 'tok', user: { id: ME } } : [{ ...journal(1), user_id: OTHER }]),
    });
    const c = core.mithrasClient('https://x.co/', 'k', leaky);
    const rows = await c.read(await c.signInEmail('a', 'b'));
    expect(rows.journals).toEqual([]);
    expect(rows.streak).toBeNull();
  });

  it('says what went wrong, in words', async () => {
    const m = fakeMithras({ journals: [], streaks: [], profiles: [] });
    await expect(m.client.signInEmail('me@example.com', 'wrong')).rejects.toMatchObject({ code: 'bad' });
    await expect(m.client.signInApple('apple-not-allowed', 'n')).rejects.toMatchObject({ code: 'apple' });
    expect((await m.client.signInApple('apple-ok', 'n')).user).toBe(ME);
    const down = core.mithrasClient('https://x.co', 'k', async () => {
      throw new Error('offline');
    });
    await expect(down.signInEmail('a', 'b')).rejects.toMatchObject({ code: 'net' });
    for (const k of ['bad', 'apple', 'net', 'other'] as const) expect(core.MITHRAS_WORDS[k]).not.toMatch(/n't|'s /);
  });
});

describe('Mithras rows as Daybook records', () => {
  it('every Mithras feeling has a Daybook word', () => {
    expect(core.mithrasWordsOk()).toBe(true);
    expect(Object.keys(core.MITHRAS_FEEL).length).toBeGreaterThanOrEqual(150);
  });

  it('an entry keeps its words, its first feeling as the feeling, the rest as tags, and a steady id', () => {
    const e = core.mithrasEntry(journal(7), 4, tk, now)!;
    expect(e.id).toBe(core.mithrasEntryId(uuid(7)));
    expect(core.isJnId(e.id)).toBe(true);
    expect(e.w).toBe('Anxious');
    expect(e.tags).toEqual(['hopeful', 'exhausted', 'mithras']);
    expect(e.t).toBe('Entry 7\n\nI sat with it tonight and did not give in.\n\nWhere: Home\nDoing: Scrolling\nWith: Alone');
    expect(e.d).toBe('2026-03-08');
    /* after midnight and before the rollover, it belongs to the night before */
    expect(core.mithrasEntry(journal(1, { created_at: new Date(2026, 2, 10, 2).toISOString() }), 4, tk, now)!.d).toBe('2026-03-09');
    /* no feeling Daybook knows: a quiet one; deleted rows and rows with no date are not entries */
    expect(core.mithrasEntry(journal(1, { emotions: ['not-a-feeling'] }), 4, tk, now)!.w).toBe(core.MITHRAS_FEEL_NONE);
    expect(core.mithrasEntry(journal(1, { is_deleted: true }), 4, tk, now)).toBeNull();
    expect(core.mithrasEntry(journal(1, { created_at: 'soon' }), 4, tk, now)).toBeNull();
  });

  it('setbacks are kept a hundred years back; a day that is both is a setback', () => {
    const d = core.mithrasDays({ streak_days: ['2026-03-01', '1926-03-02', '2026-03-02', '2026-03-03T00:00:00', '2027-01-01', 'junk'] }, tk);
    expect(d).toEqual({ wins: ['2026-03-01', '2026-03-03'], slips: ['2026-03-02'] });
  });

  it('the habit and how often, for setup', () => {
    expect(core.mithrasProfile({ usage_pattern: 'daily', addiction_type: 'Pornography' })).toEqual({ habit: 'porn', freq: 'f3' });
    expect(core.mithrasProfile({ usage_pattern: 'weekly', addiction_type: 'alcohol' })).toEqual({ habit: 'alcohol', freq: 'f1' });
    expect(core.mithrasProfile({ usage_pattern: 'sometimes', addiction_type: null })).toEqual({});
  });
});

/** a Mithras person: 40 days from March 1 with two setbacks, then a gap until today, and n entries */
const rowsOf = (n: number): MithrasRows => ({
  journals: Array.from({ length: n }, (_, i) => journal(i)),
  streak: streakRow(40, ['2026-03-10', '2026-03-25'], 14),
  profile: { usage_pattern: 'weekly' },
});

describe('landing it', () => {
  it('a new person: the journal, the slips and the wins land, Day 1 moves to the first Mithras day, and the fire starts at Campfire', () => {
    const snap = fresh();
    const plan = core.mithrasPlan(rowsOf(300), 4, tk, now);
    expect(plan.entries).toHaveLength(300);
    expect(plan.real).toBe(true);
    expect(core.mithrasPreview(snap, plan, tk)).toEqual({ entries: 300, longest: 14, days: 40, form: 'Campfire' });
    const r = core.mithrasApply(snap, plan, tk, now);
    expect(r.added).toBe(300);
    expect(r.slips).toBe(2);
    expect(r.wins).toBe(38);
    expect(Object.keys(r.snap.journal!)).toHaveLength(300);
    const st = r.snap.settings!;
    expect(st.start).toBe('2026-03-01');
    expect(st.day1).toBe('2026-03-01');
    expect(st.awayFrom).toBe('2026-03-01');
    /* a slip has no time and says where it came from; a win is a day told, with nothing done */
    expect(r.snap.days['2026-03-10'].events).toEqual([expect.objectContaining({ outcome: 'slipped', time: null, note: 'From Mithras' })]);
    expect(r.snap.days['2026-03-11'].p?.mw).toBe(true);
    expect(core.dayPoints(r.snap.days, '2026-03-11', st).total).toBe(0);
    /* Campfire's first step, and everything after it adds on top */
    const g = core.gameCompute(r.snap.days, st, {}, tk);
    expect(g.pts).toBe(core.CAMPFIRE_PTS);
    expect(g.level.name).toBe('Campfire');
    expect(r.campfire).toBe(true);
    expect(r.welcome).toBe(st.mith!.pts);
    /* one moment: nothing the import reached is waiting to be celebrated */
    expect(core.checkNew(r.snap.days, st, {}, tk, false).items).toEqual([]);
    /* the longest run comes too, and the run since the last setback counts */
    const mx = core.computeMetrics(r.snap.days, st, tk);
    expect(mx.longest).toBeGreaterThanOrEqual(15);
    expect(core.dayKnown(r.snap.days, st, '2026-03-30', tk)).toBe(true);
    expect(core.nightState(r.snap.days, st, '2026-03-30', tk)).toBe('free');
    /* the months after Mithras are not made up as free days: they are a gap, and Welcome back asks about it */
    expect(core.dayKnown(r.snap.days, st, '2026-06-01', tk)).toBe(false);
    expect(core.awayDue(r.snap.days, st, tk)).toMatchObject({ from: '2026-04-10' });
    /* a person who just arrived never meets a fire burning low: the weeks after Mithras are not days they let this fire go */
    expect(core.fireLow(r.snap.days, st, tk, now).step).toBe(0);
    expect(core.fireLow(r.snap.days, st, '2026-11-17', now + 4 * 864e5).step).toBeGreaterThan(0);
    /* changed records: settings, each day, each entry */
    expect(r.changed[0]).toBe('settings');
    expect(r.changed.filter((x) => x.startsWith('days/'))).toHaveLength(40);
    expect(r.changed.filter((x) => x.startsWith('journal/'))).toHaveLength(300);
  });

  it('a second import changes nothing', () => {
    const plan = core.mithrasPlan(rowsOf(300), 4, tk, now);
    const one = core.mithrasApply(fresh(), plan, tk, now);
    const later = now + 3600e3;
    const two = core.mithrasApply(one.snap, core.mithrasPlan(rowsOf(300), 4, tk, later), tk, later);
    expect([two.added, two.replaced, two.slips, two.wins, two.welcome]).toEqual([0, 0, 0, 0, 0]);
    expect(two.changed).toEqual(['settings']);
    expect(two.snap.days).toEqual(one.snap.days);
    expect(two.snap.journal).toEqual(one.snap.journal);
    const pts = (s: Snapshot) => core.gameCompute(s.days, s.settings!, {}, tk).pts;
    expect(pts(two.snap)).toBe(pts(one.snap));
    expect(two.snap.settings!.mith).toEqual({ ...one.snap.settings!.mith, at: later });
    expect(two.snap.settings!.start).toBe(one.snap.settings!.start);
  });

  it('a second import brings a changed entry, but never over one the person changed in Daybook', () => {
    const one = core.mithrasApply(fresh(), core.mithrasPlan(rowsOf(5), 4, tk, now), tk, now);
    const mine = core.mithrasEntryId(uuid(1));
    const jn = core.jnEdit(one.snap.journal!, mine, { t: 'My own words now' }, now + 1000);
    const rows = rowsOf(5);
    rows.journals[1] = { ...rows.journals[1], content: 'Changed in Mithras' };
    rows.journals[2] = { ...rows.journals[2], content: 'Changed in Mithras too' };
    const two = core.mithrasApply({ ...one.snap, journal: jn }, core.mithrasPlan(rows, 4, tk, now + 2000), tk, now + 2000);
    expect(two.replaced).toBe(1);
    expect(two.snap.journal![mine].t).toBe('My own words now');
    expect(two.snap.journal![core.mithrasEntryId(uuid(2))].t).toContain('Changed in Mithras too');
  });

  it('never lowers anything: points above Campfire stay, a slip logged here is not doubled, Day 1 picked earlier stays', () => {
    let snap = fresh();
    snap = {
      ...snap,
      settings: core.changeSettings(snap.settings!, (s) => void (s.seen = { badges: [], quests: [], level: 30, full: null, lad: 4, pts: 2000 })),
    };
    const before = core.gameCompute(snap.days, snap.settings!, {}, tk).pts;
    const r = core.mithrasApply(snap, core.mithrasPlan(rowsOf(4), 4, tk, now), tk, now);
    expect(r.welcome).toBe(0);
    expect(r.campfire).toBe(false);
    expect(core.gameCompute(r.snap.days, r.snap.settings!, {}, tk).pts).toBeGreaterThanOrEqual(before);

    const logged = fresh();
    logged.days = core.addEvent(logged.days, '2026-03-10', 'slipped', '22:00').days;
    const r2 = core.mithrasApply(logged, core.mithrasPlan(rowsOf(0), 4, tk, now), tk, now);
    expect(r2.snap.days['2026-03-10'].events.map((e) => e.time)).toEqual(['22:00']);
    expect(r2.slips).toBe(1);
  });

  it('no real history: no welcome, and no form promised', () => {
    const rows: MithrasRows = { journals: [journal(1)], streak: streakRow(3, []), profile: null };
    const plan = core.mithrasPlan(rows, 4, tk, now);
    expect(plan.real).toBe(false);
    expect(core.mithrasPreview(fresh(), plan, tk).form).toBeNull();
    expect(core.mithrasApply(fresh(), plan, tk, now).welcome).toBe(0);
  });

  it('under the true record, a Mithras win is a night told free', () => {
    const snap = fresh();
    snap.settings = core.normSettings({ ...snap.settings!, truthFrom: '2026-11-01', awayFrom: '2026-11-01', countFrom: '2026-11-01' });
    const rows: MithrasRows = { journals: [], streak: { streak_days: ['2026-11-10', '2026-11-11', '1926-11-12'] }, profile: null };
    const r = core.mithrasApply(snap, core.mithrasPlan(rows, 4, tk, now), tk, now);
    const st = r.snap.settings!;
    expect(core.nightState(r.snap.days, st, '2026-11-10', tk)).toBe('free');
    expect(core.nightState(r.snap.days, st, '2026-11-12', tk)).toBe('slip');
    expect(core.loggedDay(r.snap.days['2026-11-10'])).toBe(true);
  });
});

describe('kept through clean-up and sync', () => {
  it('the win mark and the welcome survive clean-up, sync and a restore', () => {
    const r = core.mithrasApply(fresh(), core.mithrasPlan(rowsOf(3), 4, tk, now), tk, now);
    const day = r.snap.days['2026-03-11'];
    expect(core.normDay(JSON.parse(JSON.stringify(day)), day.d).p?.mw).toBe(true);
    expect(mergePlay(day.p, null)?.mw).toBe(true);
    expect(mergePlay(core.normDay({}, day.d).p ?? { w: [], wd: false, r: false, c: 0, m: false, tl: [], po: null, ls: [], lv: [], ov: {} }, day.p)?.mw).toBe(
      true,
    );
    const st = r.snap.settings!;
    expect(core.normSettings(JSON.parse(JSON.stringify(st))).mith).toEqual(st.mith);
    expect(core.normSettings({ ...st, mith: { ...st.mith, pts: 9999 } }).mith!.pts).toBe(270);
    const other = core.changeSettings(st, (s) => void delete s.mith);
    expect(keepEarned(other, st).mith).toEqual(st.mith);
    const back = core.readBackup(JSON.stringify(core.makeBackup(r.snap)));
    expect(back.settings!.mith).toEqual(st.mith);
    expect(back.days['2026-03-11'].p?.mw).toBe(true);
  });
});

describe('nothing lost, nothing doubled (the owner, November 13, 2026: "all there data intact")', () => {
  const words = (t: string) => t.split(/\s+/).filter(Boolean);
  it('every non-deleted entry lands once, with its day, its time and every word, and the streak lands day for day', () => {
    const long = Array.from({ length: 9000 }, (_, i) => 'word' + i).join(' ');
    const js: MJournal[] = Array.from({ length: 1234 }, (_, i) => journal(i, { content: 'Line one ' + i + '\nLine two, with an emoji 🔥 and "quotes".' }));
    js[10] = journal(10, { content: long, title: 'A very long night' });
    js[11] = journal(11, { created_at: iso(2026, 12, 25) });
    js[12] = journal(12, { is_deleted: true });
    js[13] = journal(13, { title: null, content: '', emotions: [] });
    /* the same row twice (a page read twice) is still one entry */
    js.push({ ...js[20] });
    /* two rows whose short ids meet: the same first 8 and last 14 characters */
    js.push(journal(1300, { id: 'aaaaaaaa-1111-4000-8000-000000000020' }));
    const rows: MithrasRows = { journals: js, streak: streakRow(200, ['2026-04-01', '2026-05-15', '2026-07-04']), profile: null };
    const plan = core.mithrasPlan(rows, 4, tk, now);
    const live = new Set(js.filter((r) => !r.is_deleted).map((r) => r.id));
    expect(plan.rows).toBe(live.size);
    const r = core.mithrasApply(fresh(), plan, tk, now);
    const jn = r.snap.journal!;
    expect(Object.keys(jn)).toHaveLength(plan.entries.length);
    expect(r.added).toBe(plan.entries.length);
    /* each row, read back from the journal: its parts in order, every word of the title, the text and the where lines */
    for (const row of js) {
      if (row.is_deleted) continue;
      const id = plan.entries.find((e) => e.at === Date.parse(row.created_at) && e.t.startsWith((row.title || row.content || '').slice(0, 20)))?.id;
      expect(id, row.id).toBeTruthy();
      const parts = Object.values(jn)
        .filter((e) => e.id === id || (/^m[1-9]/.test(e.id) && e.id.slice(2) === id!.slice(2)))
        .sort((a, b) => b.at - a.at);
      const got = words(parts.map((e) => e.t).join(' '));
      const want = words([row.title || '', row.content || '', 'Where: Home', 'Doing: Scrolling', 'With: Alone'].join(' '));
      expect(got, row.id).toEqual(want);
      expect(parts[0].at).toBe(Date.parse(row.created_at));
    }
    /* the long one is several entries on one day, none over the limit */
    const longParts = Object.values(jn).filter((e) => e.t.includes('word4500') || e.t.includes('word10 '));
    expect(longParts.length).toBeGreaterThan(1);
    expect(Object.values(jn).every((e) => e.t.length <= core.JN_TEXT_MAX)).toBe(true);
    /* a clock that was ahead: kept, on today */
    expect(Object.values(jn).some((e) => e.at === Date.parse(iso(2026, 12, 25)) && e.d === tk)).toBe(true);
    /* the streak: every win a told day, every setback one slip */
    expect(r.wins + r.slips).toBe(200);
    for (const k of ['2026-04-01', '2026-05-15', '2026-07-04']) expect(r.snap.days[k].events.filter((e) => e.outcome === 'slipped')).toHaveLength(1);
    expect(Object.values(r.snap.days).filter((d) => d.p?.mw).length).toBe(197);
    /* and a second import of the same rows adds nothing */
    const two = core.mithrasApply(r.snap, core.mithrasPlan(rows, 4, tk, now + 1000), tk, now + 1000);
    expect([two.added, two.replaced, two.slips, two.wins]).toEqual([0, 0, 0, 0]);
    expect(Object.keys(two.snap.journal!)).toHaveLength(plan.entries.length);
  });
});
