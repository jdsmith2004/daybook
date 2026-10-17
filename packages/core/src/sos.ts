/* SOS: help on the first tap, when an urge is happening right now. The legacy SOS reads the global Store, the clock, and a little
   memory kept on the device ("daybook.ur.v1": lines seen lately, suggestions passed over, the last SOS). Here each rule is a pure
   function: the log, the settings, the time and that memory are passed in, and randomness comes from the caller (rand), so the
   tests can pin it. The data (UR_FIT, TOOLS, ...) is extracted verbatim from the legacy app. Checked by test/sos.test.ts. */
import type { AheadPlan } from './ahead';
import {
  addDays,
  CU_FEEL,
  CU_WHERE,
  didIds,
  MENU_DEFAULT,
  TEXTS,
  eventsOf,
  isTime,
  LESSON_IDS,
  LESSONS,
  logicalKey,
  clockOf,
  TOOLS,
  TRIG_T,
  UR_BED_WITH,
  UR_DID,
  UR_DO,
  UR_FIT,
  UR_KNOW,
  UR_LPREF,
  UR_META,
  UR_PREF,
  UR_STR_ADJ,
  UR_STRN,
  UR_TR_T,
  UR_TRIG_PH,
  urLift,
  urMinText,
} from './legacy/core.js';
import { rkWaitOf } from './rekindle';
import { lessonsDone } from './lessons';
import type { DayEvent, DayKey, Days, Settings } from './types';

export type Strength = 'low' | 'mid' | 'high';
export type Rand = () => number;

/** what this device remembers between SOS uses. Never synced, never part of the log. */
export interface UrMem {
  pass?: Record<string, number>;
  last?: { t: number; tool: string | null; out: string };
  off?: Record<string, number>;
  rv?: Record<string, number>;
  rev?: number;
  fwd?: { a: string[]; b: string[] };
  bedPlan?: string;
  /** Move: whether the moves shown are the ones for a seat (in a meeting, at work, in a car) or for getting up */
  moveSit?: boolean;
  /** A plan for later: the hard hour and the moves picked for it (read it with aheadLive) */
  ahead?: AheadPlan;
  [bucket: string]: unknown;
}

/** one SOS, while it is open */
export interface UrState {
  t0: number;
  p0: number;
  step: 'now' | 'tools' | 'after' | 'stop';
  strength: Strength | null;
  trigger: string | null;
  used: string[];
  rounds: [string, 'p' | 's' | 'x'][];
  skip: string[];
  again: number;
  explore: boolean | null;
  roundDone: boolean;
  sug: string | null;
  comboFrom?: string | null;
  /** the line to do now and the thing worth knowing, picked once per screen */
  cx: { k?: string; do?: string; seen?: boolean; kk?: string; kn?: (typeof UR_KNOW)[number] } | null;
}

export function newUrge(now: number, pts: number): UrState {
  return {
    t0: now,
    p0: pts,
    step: 'now',
    strength: null,
    trigger: null,
    used: [],
    rounds: [],
    skip: [],
    again: 0,
    explore: null,
    roundDone: false,
    sug: null,
    cx: null,
  };
}

/** Move, for when you cannot get up (at work, in a meeting, in a car, at the movies): small moves no one has to notice.
    Like MOVES, each is [id, name, how]. Tensing and letting go of a muscle on purpose is the core of muscle relaxation. */
export const MOVES_SIT: [string, string, string][] = [
  ['squeeze', 'Squeeze and let go', 'Fists, arms or legs: hold for five, then let go'],
  ['feet', 'Press your feet down', 'Push into the floor, hold, then rest'],
  ['palms', 'Palm press', 'Push your hands together, hold, then let go'],
  ['shoulders', 'Shoulder rolls', 'Slow circles, up, back and down'],
  ['jaw', 'Jaw and neck', 'Unclench, then slow turns side to side'],
  ['toes', 'Curl your toes', 'Curl, hold, then spread them wide'],
];

export const urTool = (id: string) => TOOLS.find((t) => t.id === id) || null;
/** answers you added yourself act like "Other" when picking a tool */
export const urTrigKey = (t: string | null | undefined) => (!t || t === 'none' ? 'none' : TRIG_T[t] ? t : 'other');
/** late at night: the SOS screens go dark, and "Go to bed" can be suggested */
export const urNight = (hour: number) => hour >= 22 || hour < 5;
const hourOf = (ms: number) => new Date(ms).getHours();

/* ---------- what each tool did for you, read from the log (the last four months) ---------- */
type Rec = { n: number; w: number; l: number };
export function urStats(days: Days, tk: DayKey) {
  const all: Record<string, Rec> = {};
  const by: Record<string, Record<string, Rec>> = {};
  const rec = (o: Record<string, Rec>, id: string) => o[id] || (o[id] = { n: 0, w: 0, l: 0 });
  (eventsOf(days, addDays(tk, -119)) as (DayEvent & { key: string })[]).forEach((e) => {
    const k = e.trigger ? urTrigKey(e.trigger) : null;
    if (Array.isArray(e.tr) && e.tr.length) {
      e.tr.forEach((r) => {
        const id = r[0];
        const w = r[1] === 'p';
        if (!urTool(id)) return;
        [rec(all, id)].concat(k ? [rec(by[k] || (by[k] = {}), id)] : []).forEach((x) => {
          x.n++;
          if (w) x.w++;
        });
      });
    } else if (e.outcome === 'rode') {
      didIds(e.did).forEach((d) => {
        const id = d === 'reach' ? 'message' : d;
        if (!urTool(id)) return;
        rec(all, id).l++;
        if (k) rec(by[k] || (by[k] = {}), id).l++;
      });
    }
  });
  return { all, by };
}
/** every tool you have ever used, from Learn or from SOS */
export function urTried(days: Days): Record<string, 1> {
  const s: Record<string, 1> = {};
  Object.keys(days).forEach((k) => {
    const d = days[k];
    if (!d) return;
    ((d.p && d.p.tl) || []).forEach((t) => (s[t] = 1));
    (d.events || []).forEach((e) => {
      didIds(e.did).forEach((x) => (s[x === 'reach' ? 'message' : x] = 1));
      if (Array.isArray(e.tr)) e.tr.forEach((r) => (s[r[0]] = 1));
    });
  });
  return s;
}
/** the moment, when nothing was said about it: late at night counts as "late"; otherwise what usually sets it off around this hour */
export function urCtxTrig(sc: Pick<UrState, 'trigger'>, days: Days, tk: DayKey, now: number): string {
  if (sc.trigger) return urTrigKey(sc.trigger);
  const h = hourOf(now);
  if (urNight(h)) return 'late';
  const c: Record<string, number> = {};
  (eventsOf(days, addDays(tk, -59)) as (DayEvent & { key: string })[]).forEach((e) => {
    if (!e.trigger || !isTime(e.time)) return;
    const eh = +e.time.slice(0, 2);
    const d = Math.min(Math.abs(eh - h), 24 - Math.abs(eh - h));
    if (d <= 2) {
      const k = urTrigKey(e.trigger);
      c[k] = (c[k] || 0) + 1;
    }
  });
  const best = Object.keys(c)
    .filter((k) => k !== 'none')
    .sort((a, b) => c[b] - c[a])[0];
  return best || 'other';
}

export interface Ranked {
  id: string;
  score: number;
  r: Rec | null;
  rt: Rec | null;
  tk: string;
  pin: boolean;
  off: boolean;
}
export function urRank(
  sc: Pick<UrState, 'trigger' | 'strength' | 'used' | 'skip' | 'again'>,
  days: Days,
  st: Settings | null,
  tk: DayKey,
  now: number,
  mem: UrMem,
): Ranked[] {
  const ctx = urCtxTrig(sc, days, tk, now);
  const fit = (UR_FIT as Record<string, Record<string, number>>)[ctx] || UR_FIT.other;
  const sn = ((sc.strength && (UR_STRN as Record<string, Record<string, number>>)[sc.strength]) || {}) as Record<string, number>;
  const night = urNight(hourOf(now));
  const S = urStats(days, tk);
  const hb = S.by[ctx] || {};
  const pass = mem.pass && typeof mem.pass === 'object' ? mem.pass : {};
  const pin = st && st.urPin;
  const skip = sc.skip || [];
  return TOOLS.map((t) => {
    const id = t.id;
    const rt = hb[id] && hb[id].n >= 2 ? hb[id] : null;
    const ra = S.all[id] || null;
    const r = rt || ra;
    let s = (fit[id] || 0) + (sn[id] || 0);
    if (id === 'bed' && !night) s -= 20;
    s += urLift(r);
    if (id === pin) s += 40;
    if (sc.used.indexOf(id) >= 0) s -= 30;
    if (skip.indexOf(id) >= 0) s -= 20;
    s -= Math.min(4, (pass[id] | 0) * 0.8);
    const off = id !== pin && (id === 'message' || (id === 'breathe' && !sc.again));
    return { id, score: s, r, rt, tk: ctx, pin: id === pin, off };
  }).sort((a, b) => b.score - a.score || UR_PREF.indexOf(a.id) - UR_PREF.indexOf(b.id));
}

/** the last SOS, if it was under 90 minutes ago: waves often come in sets */
export function urLast(mem: UrMem, now: number) {
  const l = mem.last;
  return l && typeof l === 'object' && typeof l.t === 'number' && now - l.t < 90 * 60000 ? l : null;
}

export interface Pick_ {
  top: Ranked;
  mode: '' | 'pin' | 'last' | 'fresh';
  combo?: Ranked;
  last?: { t: number; tool: string | null; out: string };
}
/** the one suggestion (legacy urPickSug). Sets sc.explore the first time (that is where rand is used). */
export function urPickSug(sc: UrState, days: Days, st: Settings | null, tk: DayKey, now: number, mem: UrMem, rand: Rand): Pick_ {
  const rank = urRank(sc, days, st, tk, now, mem);
  const skip = sc.skip || [];
  const ok = (x: Ranked) => !x.off && sc.used.indexOf(x.id) < 0 && skip.indexOf(x.id) < 0;
  /* Go to bed is never offered alone: it always comes after one tool for the thoughts */
  const pair = (pk: Pick_): Pick_ => {
    if (pk.top.id !== 'bed') return pk;
    const with1 = rank.find((x) => UR_BED_WITH.indexOf(x.id) >= 0 && ok(x));
    if (with1) return { ...pk, combo: with1 };
    const other = rank.find((x) => x.id !== 'bed' && ok(x));
    return other ? { top: other, mode: '' } : pk;
  };
  const best = rank.find(ok) || rank.find((x) => !x.off) || rank[0];
  if (best.pin) return pair({ top: best, mode: 'pin' });
  if (sc.explore == null) sc.explore = !sc.again && rand() < (sc.strength === 'low' ? 0.35 : sc.strength === 'high' ? 0 : 0.2);
  const last = urLast(mem, now);
  if (!sc.again && last && last.tool) {
    const x = rank.find((y) => y.id === last.tool);
    if (x && ok(x)) return pair({ top: x, mode: 'last', last });
  }
  if (sc.explore) {
    const tried = urTried(days);
    const x = rank.find((y) => !tried[y.id] && y.score >= 4 && ok(y));
    if (x) return pair({ top: x, mode: 'fresh' });
  }
  return pair({ top: best, mode: '' });
}

export function urWhyTool(x: Ranked, mode: Pick_['mode'], last: Pick_['last'], days: Days, now: number): string {
  if (mode === 'fresh')
    return x.tk === 'late' && x.id === 'bed' ? 'New for you. Late at night, sleep is often the strongest move.' : 'New for you. Worth a try.';
  if (mode === 'last' && last) {
    const mn = Math.max(1, Math.round((now - last.t) / 60000));
    return 'It helped ' + (mn < 60 ? mn + (mn === 1 ? ' minute' : ' minutes') + ' ago' : 'about an hour ago') + '.';
  }
  if (mode === 'pin') return 'Your go-to.';
  const a = x.r || { n: 0, w: 0, l: 0 };
  const ph = (UR_TRIG_PH as Record<string, string>)[x.tk];
  if (x.rt && ph && x.rt.w) return 'Worked ' + x.rt.w + ' of ' + x.rt.n + ' times when ' + ph + '.';
  if (a.n >= 2 && a.w) return 'Worked ' + a.w + ' of the ' + a.n + ' times you tried it.';
  if (a.l >= 2) return 'Used in ' + a.l + ' urges you rode out.';
  if (x.tk === 'late' && x.id === 'bed') return 'Late at night, sleep is often the strongest move.';
  if (!urTried(days)[x.id]) return 'New for you.';
  return (UR_META as Record<string, { does: string }>)[x.id]?.does || '';
}

/** the suggestion's button and the line under it (legacy urGoHtml and urCapText) */
export function urSuggestion(pk: Pick_, strength: Strength | null, days: Days, now: number) {
  const META = UR_META as Record<string, { mins: string; does: string }>;
  if (pk.combo) {
    const c = urTool(pk.combo.id)!;
    const m = META[pk.combo.id] || ({} as { mins?: string });
    return {
      tool: c,
      combo: 'bed' as const,
      title: c.name + ', then bed',
      sub: String(m.mins || 'A minute').replace(/^About /, '') + ', then phone away and lights off',
      label: 'Start ' + c.name + ', then go to bed',
      cap: 'Late at night, sleep is often the strongest move. This gives the thoughts somewhere to go first.',
    };
  }
  const t = urTool(pk.top.id)!;
  const m = META[pk.top.id] || ({} as { mins?: string; does?: string });
  const sub = [String(m.mins || '').replace(/^About /, ''), m.does].filter(Boolean).join(' · ');
  const w = urWhyTool(pk.top, pk.mode, pk.last, days, now);
  const own = w === m.does ? '' : w;
  const cap =
    strength && pk.mode !== 'pin' && pk.mode !== 'fresh'
      ? 'Picked for a ' + (UR_STR_ADJ as Record<string, string>)[strength] + ' urge.' + (/\d/.test(own) ? ' ' + own : '')
      : own;
  return { tool: t, combo: null, title: t.name, sub, label: t.name, cap };
}

/** what you chose against what was suggested: passing a suggestion over lowers it a little; using it eases that back */
export function urNote(mem: UrMem, sug: string | null, picked: string | null): UrMem {
  if (!sug) return mem;
  const pass = { ...(mem.pass && typeof mem.pass === 'object' ? mem.pass : {}) };
  if (picked === sug) pass[sug] = Math.max(0, (pass[sug] | 0) - 2);
  else {
    pass[sug] = Math.min(6, (pass[sug] | 0) + 1);
    if (picked && pass[picked]) pass[picked] = Math.max(0, pass[picked] - 1);
  }
  return { ...mem, pass };
}

/* ---------- the words ---------- */
/** picks from a pool, avoiding the ones seen lately (legacy urPick). Gives back the index and the memory to keep. */
export function urPick<T>(bucket: string, pool: T[], ok: ((x: T, i: number) => boolean) | null, mem: UrMem, rand: Rand): { i: number; mem: UrMem } {
  let idx = pool.map((_, i) => i).filter((i) => !ok || ok(pool[i], i));
  if (!idx.length) idx = pool.map((_, i) => i);
  const seen = Array.isArray(mem[bucket]) ? (mem[bucket] as number[]) : [];
  const n = Math.max(0, Math.min(seen.length, idx.length - 1));
  const recent = n ? seen.slice(-n) : [];
  const fresh = idx.filter((i) => recent.indexOf(i) < 0);
  const use = fresh.length ? fresh : idx;
  const i = use[Math.floor(rand() * use.length)];
  return { i, mem: { ...mem, [bucket]: seen.concat([i]).slice(-12) } };
}

/** the line at the top of the first SOS screen: what to do this minute */
export function urDoLine(sc: UrState, now: number, mem: UrMem, rand: Rand): { text: string; mem: UrMem } {
  const D = UR_DO as Record<string, string[]>;
  const pick = (b: string, pool: string[]) => {
    const r = urPick(b, pool, null, mem, rand);
    return { text: pool[r.i], mem: r.mem };
  };
  if (sc.again) return pick('do.again', D.again);
  if (sc.strength === 'high') return pick('do.high', D.high);
  if (urLast(mem, now) && !sc.cx?.seen) return { text: D.sets[0], mem };
  if (urNight(hourOf(now))) return pick('do.night', D.night);
  return pick('do.base', D.base);
}

/** one thing worth knowing, under "How is it now?" */
export function urKnow(sc: UrState, days: Days, tk: DayKey, now: number, mem: UrMem, rand: Rand) {
  const ctx = urCtxTrig(sc, days, tk, now);
  const s = sc.strength || (sc.again ? 'high' : 'mid');
  const r = urPick('know', UR_KNOW, (k) => !k.f || k.f.indexOf(ctx) >= 0 || k.f.indexOf(s) >= 0, mem, rand);
  return { know: UR_KNOW[r.i], mem: r.mem };
}

/** your own record, kept short: how many urges ridden out, and how long yours usually take */
export function urEvidence(days: Days) {
  const evs = eventsOf(days) as (DayEvent & { key: string })[];
  const ds = evs
    .filter((e) => e.outcome === 'rode')
    .map((e) => e.m)
    .filter((x): x is number => Number.isInteger(x) && (x as number) > 0 && (x as number) <= 120)
    .sort((a, b) => a - b);
  return { n: evs.filter((e) => e.outcome === 'rode').length, med: ds.length >= 3 ? ds[Math.floor(ds.length / 2)] : null };
}

/* ---------- saving ---------- */
/** what the entry from an SOS holds (legacy urRecord): when it started, how strong, how long, and each tool with what happened next */
export function urEntry(sc: UrState, v: 'rode' | 'slipped', st: Settings, now: number, extra: Partial<DayEvent> = {}) {
  const key = logicalKey(sc.t0, st.rollover);
  const time = clockOf(sc.t0);
  const trig = sc.trigger && sc.trigger !== 'none' ? sc.trigger : null;
  const did = v === 'rode' ? didIds(sc.used.map((x) => (UR_DID as Record<string, string>)[x] || x)) : [];
  const mins = Math.max(0, Math.min(240, Math.round((now - sc.t0) / 60000)));
  const rounds = (sc.rounds || []).slice(0, 8);
  const fields: Partial<DayEvent> = {
    trigger: trig,
    did: did.length ? did : null,
    st: sc.strength || undefined,
    m: mins,
    tr: rounds.length ? rounds : undefined,
    ...(v === 'slipped' ? { wt: rkWaitOf(mins) } : {}),
    ...extra,
  };
  const lastTool = sc.used[sc.used.length - 1] || null;
  return { key, time, fields, trig, did, mins, last: { t: now, tool: v === 'rode' ? lastTool : null, out: v } };
}

/** the answer to "How is it now?": the round is kept, and "Still strong" goes back for another tool */
export function urAnswer(sc: UrState, v: 'rode' | 'slipped' | 'again'): UrState {
  const out = { ...sc, rounds: sc.rounds.slice() };
  const last = sc.used[sc.used.length - 1] || null;
  if (last && !sc.roundDone) {
    out.rounds.push([last, v === 'rode' ? 'p' : v === 'again' ? 's' : 'x']);
    out.roundDone = true;
  }
  if (v === 'again') {
    out.again = (sc.again || 0) + 1;
    out.explore = null;
    out.step = 'now';
    out.cx = null;
  }
  return out;
}

/* ---------- after SOS: a lesson that fits, offered when your head is clear ---------- */
export function urLessonFor(trigger: string | null | undefined, slipped: boolean, hint: string | null, days: Days, mem: UrMem, now: number) {
  const L = LESSONS as unknown as { id: string; tags?: string[]; title: string; ic?: string; tag?: string }[];
  const done = lessonsDone(days);
  const key = slipped ? 'slipped' : urTrigKey(trigger);
  const pref = (UR_LPREF as Record<string, string[]>)[key] || UR_LPREF.other;
  const score = (l: (typeof L)[number]) => {
    const tags = Array.isArray(l.tags) ? l.tags : [];
    const i = pref.indexOf(l.id);
    return (
      (tags.indexOf(key) >= 0 ? 6 : 0) +
      (!slipped && tags.indexOf('urge') >= 0 ? 2 : 0) +
      (i >= 0 ? pref.length - i : 0) +
      (!slipped && hint && l.id === hint ? 9 : 0)
    );
  };
  const off = { ...(mem.off && typeof mem.off === 'object' ? mem.off : {}) };
  const H = 3600000;
  const fits = L.filter((l) => score(l) > 0).sort((a, b) => score(b) - score(a));
  const open = fits.filter((l) => !done.has(l.id));
  const fresh = open.filter((l) => !(off[l.id] && now - off[l.id] < 6 * H));
  if (fresh.length) {
    off[fresh[0].id] = now;
    return { pair: { l: fresh[0], rev: false }, mem: { ...mem, off } };
  }
  if (open.length) return { pair: null, mem };
  const rv = { ...(mem.rv && typeof mem.rv === 'object' ? mem.rv : {}) };
  const back = fits.filter((l) => done.has(l.id)).sort((a, b) => (rv[a.id] || 0) - (rv[b.id] || 0) || score(b) - score(a));
  if (back.length && (!mem.rev || now - (mem.rev as number) > 3 * 24 * H)) {
    rv[back[0].id] = now;
    return { pair: { l: back[0], rev: true }, mem: { ...mem, rev: now, rv } };
  }
  return { pair: null, mem };
}

/* ---------- in words, for the entry sheet ---------- */
export function urTrText(e: DayEvent): string {
  return Array.isArray(e.tr)
    ? e.tr
        .map((r) => {
          const t = urTool(r[0]);
          return (t ? t.name : r[0]) + ' (' + ((UR_TR_T as Record<string, string>)[r[1]] || '') + ')';
        })
        .join(', then ')
    : '';
}
export function urSosLines(e: DayEvent): string[] {
  if (!e || (e.st == null && e.m == null && !e.tr && !e.sp)) return [];
  const bits: string[] = [];
  if (e.sp) bits.push('Stopped partway.');
  if (e.st) bits.push('Started ' + (UR_STR_ADJ as Record<string, string>)[e.st] + '.');
  if (Number.isInteger(e.m)) bits.push((e.outcome === 'rode' ? 'Passed in ' : 'Took ') + urMinText(e.m as number) + '.');
  const tr = urTrText(e);
  return [bits.join(' '), tr ? 'Tried: ' + tr + '.' : ''].filter(Boolean);
}

/* ---------- reach a person ---------- */
/** the texts ready to copy: written to your safe person when you have one */
export function messageTexts(st: Settings | null): string[] {
  const n = String((st && st.safePerson) || '').trim();
  const nm = n.length <= 24 ? n : n.split(/\s+/)[0];
  if (!nm) return TEXTS.slice();
  return [
    'Hey ' + nm + ', I am having an urge and I am not acting on it. Just telling you. No advice needed.',
    'Hey ' + nm + ', rough moment. Can you text me back about anything for a few minutes?',
    'Hey ' + nm + ', can you talk for five minutes?',
  ];
}

/** "Get curious": the line about where and how it feels */
export function cuLine(body: string | null, feel: string | null): string {
  const w = body ? (CU_WHERE as Record<string, string>)[body] : undefined;
  const f = CU_FEEL.find((x) => x[0] === feel && x[0] !== 'else');
  if (f && w) return f[1] + ' ' + w + '.';
  if (w) return 'You feel it ' + w + '.';
  if (f) return 'It feels ' + f[1].toLowerCase() + '.';
  return '';
}

/** "Go to bed": what to do if the thoughts get loud. Your own note from a calm day, when there is one. */
export function bedPlans(st: Settings | null): [string, string, string][] {
  const note = String((st && st.note) || '').trim();
  return [
    ['breath', 'Slow breathing', 'In for 4, out for 6. Count to ten, then start again.'],
    ['shuffle', 'Picture boring things', 'One at a time, slowly: a spoon, a tree, a door.'],
    note ? ['note', 'Say your note', 'The words you wrote on a calm day.'] : ['reason', 'Say one reason', 'Why you are doing this, in a few words.'],
    ['up', 'Get up if still awake', 'After about 20 minutes, read on paper in another room.'],
  ];
}

/** an idea from the calm-move menu, not the one just shown */
export function pickIdea(st: Settings | null, avoid: string | null, rand: Rand): string {
  const m = (st && st.menu) || MENU_DEFAULT;
  if (m.length < 2) return m[0] || 'Walk around the block';
  let x: string;
  do x = m[Math.floor(rand() * m.length)];
  while (x === avoid);
  return x;
}

/* ---------- from you ---------- */
/** what SOS shows in your own words: the note written on a calm day, or else one of your reasons. pick (0 to 1) chooses the
    reason, and is kept for the whole SOS so the line does not change while you read it. */
export function urFromYou(st: Settings, pick: number): { k: 'note' | 'reason'; cap: string; t: string } | null {
  const note = String(st.note || '').trim();
  if (note) return { k: 'note', cap: 'From you, on a calm day', t: note };
  const rs = (st.reasons || []).map((x) => String(x || '').trim()).filter(Boolean);
  if (!rs.length) return null;
  return { k: 'reason', cap: 'Your reason', t: rs[Math.min(rs.length - 1, Math.floor(Math.max(0, pick) * rs.length))] };
}
