/* SOS: help on the first tap, when an urge is happening right now. The legacy SOS reads the global Store, the clock, and a little
   memory kept on the device ("daybook.ur.v1": lines seen lately, suggestions passed over, the last SOS). Here each rule is a pure
   function: the log, the settings, the time and that memory are passed in, and randomness comes from the caller (rand), so the
   tests can pin it. The data (UR_FIT, TOOLS, ...) is extracted verbatim from the legacy app. Checked by test/sos.test.ts. */
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
  urRate,
} from './legacy/core.js';
import { lowerFirst, rkWaitOf } from './rekindle';
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
  /** the tools you chose yourself over the one suggested, counted up to 4: SOS leans toward what you pick */
  pick?: Record<string, number>;
  /** Move: whether the moves shown are the ones for a seat (in a meeting, at work, in a car) or for getting up */
  moveSit?: boolean;
  /** the tools you chose yourself that ended in "It passed", counted up to 4: only these make the "You like this" tag */
  won?: Record<string, number>;
  /** when an SOS was last open on this device (opened or closed): Today holds the one tip ask for a few hours after it */
  sosAt?: number;
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
  /** the tools picked in this SOS over the one suggested (for urWon) */
  mine?: string[];
  /** "Would you use this again?" answered in this SOS (1 yes, -1 not really), so a change of mind counts once */
  rate?: Record<string, 1 | -1>;
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
/** the tools you asked SOS not to suggest ("Not for me"). They stay in the list, to pick yourself. */
export const urOffOf = (st: Settings | null): string[] =>
  st && Array.isArray(st.urOff) ? st.urOff.filter((id, i, a) => typeof id === 'string' && !!urTool(id) && a.indexOf(id) === i) : [];
/** what you said after using a tool ("Would you use this again?"): one up for each Yes, one down for each Not really, from -3 to 3 */
export function urLikeOf(st: Settings | null, id: string): number {
  const v = st && st.urLike && typeof st.urLike === 'object' ? (st.urLike as Record<string, unknown>)[id] : 0;
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(-3, Math.min(3, Math.round(v))) : 0;
}
const pickOf = (mem: UrMem, id: string) => (mem.pick && typeof mem.pick === 'object' ? mem.pick[id] | 0 : 0);
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
  /** the whole record for this tool, whatever set the urge off */
  ra: Rec | null;
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
  const hide = urOffOf(st);
  return TOOLS.map((t) => {
    const id = t.id;
    const rt = hb[id] && hb[id].n >= 2 ? hb[id] : null;
    const ra = S.all[id] || null;
    const r = rt || ra;
    let s = (fit[id] || 0) + (sn[id] || 0) + (UR_BEST[id] || 0);
    if (id === 'bed' && !night) s -= 20;
    s += urLift(r);
    if (id === pin) s += 40;
    if (sc.used.indexOf(id) >= 0) s -= 30;
    if (skip.indexOf(id) >= 0) s -= 20;
    /* what you do with the suggestions counts: passing one over lowers it, choosing a tool yourself raises it, and so does
       saying you would use it again (Not really lowers it more than Yes raises it) */
    s -= Math.min(7, (pass[id] | 0) * 1.5);
    s += Math.min(5, pickOf(mem, id) * 1.25);
    const lk = urLikeOf(st, id);
    s += lk > 0 ? lk * 2 : lk * 3;
    /* Reach a person is never the suggestion (it is in the list); Breathe can be, from the first round, as one of the two
       that help most. Surprise me is not a tool of its own any more (the owner, October 24, 2026): its ideas are the
       pause's "While you wait, try", and it opens only from What do I need? (bored). */
    const off = id !== pin && (hide.indexOf(id) >= 0 || id === 'message' || UR_QUIET.indexOf(id) >= 0);
    return { id, score: s, r, rt, ra, tk: ctx, pin: id === pin, off };
  }).sort((a, b) => b.score - a.score || UR_PREF.indexOf(a.id) - UR_PREF.indexOf(b.id));
}

/** tools kept for the pages that open them, but never suggested and not in the tool lists */
export const UR_QUIET = ['surprise'];

/** the two tools that help most people first (the owner, October 24, 2026): a slow breath with a long breath out, and
    5-4-3-2-1. They get a lift for everyone, so they are suggested more often until a person's own record says otherwise. */
export const UR_BEST: Record<string, number> = { breathe: 2, ground: 3 };

/** a tool that has worked for you at least twice (the last four months) */
const urProven = (r: Rec | null | undefined): r is Rec => !!r && r.w >= 2;

/** the last SOS, if it was under 90 minutes ago: waves often come in sets */
export function urLast(mem: UrMem, now: number) {
  const l = mem.last;
  return l && typeof l === 'object' && typeof l.t === 'number' && now - l.t < 90 * 60000 ? l : null;
}

export interface Pick_ {
  top: Ranked;
  /** own: picked from your own record (a tool that has worked for you at least twice) */
  mode: '' | 'pin' | 'last' | 'fresh' | 'own';
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
  /* your own record wins: a tool that has worked for you at least twice comes first, the surest of them (by its rate of
     wins), unless you said Not really to it, and Go to bed only at night */
  const night = urNight(hourOf(now));
  const own = rank
    .filter((x) => ok(x) && urProven(x.ra) && urLikeOf(st, x.id) >= 0 && (x.id !== 'bed' || night))
    .sort((a, b) => urRate(b.ra) - urRate(a.ra) || b.ra!.w - a.ra!.w)[0];
  if (own) return pair({ top: own, mode: 'own' });
  if (sc.explore) {
    const tried = urTried(days);
    const x = rank.find((y) => !tried[y.id] && y.score >= 4 && ok(y));
    if (x) return pair({ top: x, mode: 'fresh' });
  }
  return pair({ top: best, mode: '' });
}

export function urWhyTool(x: Ranked, mode: Pick_['mode'], last: Pick_['last'], days: Days, now: number, st?: Settings | null, mem?: UrMem): string {
  if (mode === 'fresh')
    return x.tk === 'late' && x.id === 'bed' ? 'Not tried yet. Late at night, sleep is often the strongest move.' : 'Not tried yet.' + urHowLong(x.id);
  if (mode === 'own') {
    const ph = (UR_TRIG_PH as Record<string, string>)[x.tk];
    if (x.rt && ph && x.rt.w >= 2) return 'Worked ' + x.rt.w + ' of ' + x.rt.n + ' times when ' + ph + '.';
    const a = x.ra || { n: 0, w: 0 };
    return 'Worked ' + a.w + ' of the ' + a.n + ' times you tried it.';
  }
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
  if (st && urLikeOf(st, x.id) > 0) return 'You said you would use it again.';
  if (mem && pickOf(mem, x.id) >= 2) return 'You often pick this one.';
  if (!urTried(days)[x.id]) return 'Not tried yet.';
  return (UR_META as Record<string, { does: string }>)[x.id]?.does || '';
}

/** how long a tool takes, as a few words after "Not tried yet." (" Two minutes."), or nothing when it is not a set time */
function urHowLong(id: string): string {
  const m = String((UR_META as Record<string, { mins: string }>)[id]?.mins || '').match(/^(?:About )?(\d+) min$/);
  const n = m ? +m[1] : 0;
  const w = ['', 'One minute', 'Two minutes', 'Three minutes'][n];
  return w ? ' ' + w + '.' : '';
}

/** the suggestion's button and the line under it (legacy urGoHtml and urCapText) */
export function urSuggestion(pk: Pick_, strength: Strength | null, days: Days, now: number, st?: Settings | null, mem?: UrMem) {
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
  const w = urWhyTool(pk.top, pk.mode, pk.last, days, now, st, mem);
  const own = w === m.does ? '' : w;
  const cap =
    strength && pk.mode !== 'pin' && pk.mode !== 'fresh' && pk.mode !== 'own'
      ? 'Picked for a ' + (UR_STR_ADJ as Record<string, string>)[strength] + ' urge.' + (/\d/.test(own) ? ' ' + own : '')
      : own;
  return { tool: t, combo: null, title: t.name, sub, label: t.name, cap };
}

/** what you chose against what was suggested: passing a suggestion over lowers it, and the tool you chose instead rises;
    using the suggestion eases that back */
export function urNote(mem: UrMem, sug: string | null, picked: string | null): UrMem {
  if (!sug) return mem;
  const pass = { ...(mem.pass && typeof mem.pass === 'object' ? mem.pass : {}) };
  const pick = { ...(mem.pick && typeof mem.pick === 'object' ? mem.pick : {}) };
  if (picked === sug) pass[sug] = Math.max(0, (pass[sug] | 0) - 2);
  else {
    pass[sug] = Math.min(6, (pass[sug] | 0) + 1);
    if (picked && pass[picked]) pass[picked] = Math.max(0, pass[picked] - 1);
    if (picked && urTool(picked)) pick[picked] = Math.min(4, (pick[picked] | 0) + 1);
  }
  return Object.keys(pick).length ? { ...mem, pass, pick } : { ...mem, pass };
}

/** an SOS that ended in "It passed": each tool you chose yourself whose round passed counts once (up to 4), for the tag */
export function urWon(mem: UrMem, sc: Pick<UrState, 'rounds' | 'mine'>): UrMem {
  const mine = sc.mine || [];
  const ids = (sc.rounds || []).filter((r) => r[1] === 'p' && mine.indexOf(r[0]) >= 0 && urTool(r[0])).map((r) => r[0]);
  if (!ids.length) return mem;
  const won = { ...(mem.won && typeof mem.won === 'object' ? mem.won : {}) };
  ids.filter((id, i) => ids.indexOf(id) === i).forEach((id) => (won[id] = Math.min(4, (won[id] | 0) + 1)));
  return { ...mem, won };
}
const wonOf = (mem: UrMem, id: string) => (mem.won && typeof mem.won === 'object' ? mem.won[id] | 0 : 0);

/** when an SOS was last open on this device: the later of the last one opened or closed (sosAt) and the last one saved */
export function urLastAt(mem: UrMem): number | null {
  const a = typeof mem.sosAt === 'number' && Number.isFinite(mem.sosAt) ? mem.sosAt : 0;
  const b = mem.last && typeof mem.last === 'object' && typeof mem.last.t === 'number' ? mem.last.t : 0;
  return Math.max(a, b) || null;
}

/** the small tag on each tool in SOS: how it went for you, or that you like it (a Yes to "Would you use it again?", or
    choosing it yourself in SOS when that ended in "It passed", twice). Opening a tool and stopping it does not count. */
export function urTags(days: Days, st: Settings | null, tk: DayKey, mem: UrMem): Record<string, string> {
  const S = urStats(days, tk);
  const out: Record<string, string> = {};
  TOOLS.forEach((t) => {
    const r = S.all[t.id];
    if (st && st.urPin === t.id) out[t.id] = 'Your go-to';
    else if (r && r.n >= 2 && r.w) out[t.id] = 'Worked ' + r.w + ' of ' + r.n;
    else if (r && r.l >= 2) out[t.id] = 'Helped ' + r.l + ' times';
    else if (urLikeOf(st, t.id) > 0 || wonOf(mem, t.id) >= 2) out[t.id] = 'You like this';
    else if (UR_BEST[t.id] && urLikeOf(st, t.id) >= 0) out[t.id] = 'A strong first pick';
  });
  return out;
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

/** a phone number as typed, kept for a text link: the digits, with a + in front when it had one. Empty when it is not a
    number (fewer than 3 digits or more than 15, as in the international standard). */
export function cleanPhone(s: unknown): string {
  const t = String(s ?? '').trim();
  const d = t.replace(/\D/g, '');
  if (d.length < 3 || d.length > 15 || /[^\d\s()+.\-]/.test(t)) return '';
  return (t.startsWith('+') ? '+' : '') + d;
}
/** the link that opens the messages app with a text ready to send: to that number, or with no number for the person to pick
    who. iPhones read the text after "&", other phones after "?". */
export function smsLink(phone: string, body: string, ios: boolean): string {
  return 'sms:' + cleanPhone(phone) + (ios ? '&' : '?') + 'body=' + encodeURIComponent(body);
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
  /* an empty menu is the starting menu */
  const m = st && st.menu && st.menu.length ? st.menu : MENU_DEFAULT;
  if (m.length < 2) return m[0] || 'Walk around the block';
  let x: string;
  do x = m[Math.floor(rand() * m.length)];
  while (x === avoid);
  return x;
}

/* ---------- what do I need? ---------- */
/** for each need in NEEDS: its icon, what helps in a few words, and the one thing to do about it: a tool to open, or null
    for something done away from the phone (the button then says what it is). Tired goes to bed at night and to a rest of
    ten minutes (the pause) in the daytime. */
export interface NeedDo {
  ic: string;
  head: string;
  tool: string | null;
  label: string;
  /** what helps, when it differs from the need's own words (tired, by the time of day) */
  text?: string;
}
const NEED_DO: Record<string, NeedDo> = {
  hungry: { ic: 'leaf', head: 'Eat something real.', tool: null, label: 'I will eat something' },
  angry: { ic: 'bolt', head: 'Move it out of your body first.', tool: 'move', label: 'Move for 2 minutes' },
  lonely: { ic: 'heart', head: 'Reach one person.', tool: 'message', label: 'Reach a person' },
  tired: {
    ic: 'moon',
    head: 'Rest is the move.',
    tool: 'pause',
    label: 'Rest for 10 minutes',
    text: 'Running on empty makes every urge louder. A short rest or a step outside clears the head. Ten minutes is enough.',
  },
  bored: { ic: 'dice', head: 'Give your hands a job.', tool: 'surprise', label: 'Surprise me' },
};
export function needDo(id: string, night: boolean): NeedDo {
  const d = NEED_DO[id] || { ic: 'heart', head: 'Name it, then meet it.', tool: null, label: 'I will do it' };
  if (id === 'tired' && night)
    return {
      ...d,
      head: 'Sleep is the move tonight.',
      tool: 'bed',
      label: 'Go to bed',
      text: 'Urges are louder when you are tired. Bed, with the phone charging in another room, is the strongest move tonight.',
    };
  return d;
}

/** the tool an idea from the calm-move menu is, when it is one: moving is Move, a text or a call is Reach a person, a slow
    breath is Breathe. Anything else (a hot drink, a shower, a hobby) is done away from the phone, so null. */
export function ideaTool(text: string): string | null {
  const t = String(text || '').toLowerCase();
  if (/\b(text|call|message)\b/.test(t)) return 'message';
  if (/\b(breath|breathe|breathing)\b/.test(t)) return 'breathe';
  if (/\b(walk|squats?|push-?ups?|stretch|jumping|run|move|dance)\b/.test(t)) return 'move';
  return null;
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

/* ---------- your urge plan ---------- */
/** the line of the urge plan that fits this moment, as one sentence: "When I am in bed late at night, I will get up and leave
    the room for 10 minutes." SOS knows the hour but not the feeling, so only late at night is a fit sure enough: the line for
    bed or late at night, its first sentence. It stands on the tools screen in place of the starting words. */
export function urPlanNow(st: Settings, hour: number): string | null {
  if (!urNight(hour)) return null;
  /* a line with a situation and something to do (the blank starting line, "Something else: ______", is not one: planBlank) */
  const r = (st.plan || []).find(
    (x) => x && x.when && x.when.trim() && x.when.indexOf('______') < 0 && String(x.then || '').trim() && /\b(bed|night|late)\b/i.test(x.when),
  );
  if (!r) return null;
  const first = String(r.then)
    .trim()
    .replace(/^I will\s+/i, '')
    .split(/(?<=[.!?])\s+/)[0];
  const when = 'When ' + lowerFirst(r.when).replace(/\.$/, '') + ', ';
  return /^I\b/.test(first) ? when + lowerFirst(first) : when + 'I will ' + lowerFirst(first);
}
