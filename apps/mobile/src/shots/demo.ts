/* The made-up log the screenshot studio shows (dev only): someone about six weeks in, whose flame is still a flame. They started on September 8, the day
   they set as their quit date, rode out an urge every few days, slipped once in September (lonely, late at night) and kept going, checked in most evenings and
   did a lesson now and then. Every value is fixed, so every shot is the same each time. Nothing here is anyone's real data. */
import {
  answerNight,
  defaultSettings,
  JN_NO_FEEL,
  PATH_STEPS,
  keepHard,
  logicalKey,
  newTalk,
  saveTalk,
  walkTalk,
  normDay,
  normSettings,
  riskToKeep,
  setTonight,
  type Days,
} from '@daybook/core';

import { DEMO } from './config';

const key = (d: Date) => d.toISOString().slice(0, 10);
const day = (s: string, n: number) => {
  const d = new Date(s + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return key(d);
};

/** the device's storage as the app would find it (key to JSON text), for the demo person, seen at the moment at (ms).
    theme: the app's theme choice */
export function demoStorage(at: number, theme: 'light' | 'dark' | 'auto' = 'light'): Record<string, string> {
  /* ?demo=hard: a person on step down whose days are about half slips, to see how a hard month looks. ?demo=grad: the same
     person, started in July, graduated on October 4 (the graduation page and the flame in its cap) */
  const q = typeof window !== 'undefined' && !!window.location ? new URLSearchParams(window.location.search).get('demo') : null;
  const hard = q === 'hard';
  /* the key moments of the lighting (core igniteWhy), played from the morning page by telling last night free: ?demo=comeback, a hard
     stretch (three slips in a week) ending the night before last; climb2 and climb3, the same stretch one and two free nights back;
     longrun, one slip the night before last, after weeks free */
  const SLIPS: Record<string, number[]> = { comeback: [-6, -4, -2], climb2: [-7, -5, -3], climb3: [-8, -6, -4], longrun: [-2] };
  const late = (q && SLIPS[q]) || [];
  const grad = q === 'grad';
  /* ?demo=month: a full month of what people really do, for the Pattern cards: urges at their own hours with what set them off, two
     slips, a lesson on most days, mornings that tell the night, and hard hours held (no feelings named, as most people name none) */
  const month = q === 'month';
  /* ?demo=update: a person updating from 1.3.4, to walk the update as they meet it: set up in September, when setup asked how often and
     not how long (so "How long does it usually last?" is still to ask, core lasts-ask.ts), never asked whether they like Daybook, last
     saw What's new at 1.3.4 (mode.ts), and Squeeze set to "In my seat" from before that switch was taken out */
  const update = q === 'update';
  /* ?demo=away: back after five days with the app unopened, so Welcome back rises over Today (components/welcome-back.tsx) */
  const away = q === 'away';
  const slipday = q === 'slipday';
  /* ?demo=phone: a person on the night track (most days, late) with the first three lessons read, so "Where the phone sleeps" is Up
     next and its first page offers "My phone already sleeps outside my room" (core lesson-have.ts) */
  const phone = q === 'phone';
  const MONTH_SLIPS = [day(DEMO.day, -17), day(DEMO.day, -9)];
  const URGE_AT = ['21:40', '22:15', '14:30', '23:05', '10:20', '22:50'];
  const URGE_WHY = ['late', 'stress', 'bored', 'tired', 'scroll', 'late'];
  const start = grad ? '2026-06-25' : '2026-09-08';
  const st = {
    ...defaultSettings(start),
    day1: start,
    /* on the one-count rule from the start, as a real phone is (core keepCounts), so no slip keeps the old rule's held run */
    countFrom: start,
    becoming: 'I am free of this.',
    reasons: ['Being fully present with the people I love', 'Clear mornings and steady energy'],
    menu: ['A brisk two-minute walk', 'Cold water on my face', 'Text a friend', 'Ten pushups'],
    u: 1792194562327,
    ...(hard ? { cleanMode: 'step', stepAt: start } : {}),
    ...(grad ? { gradAt: '2026-10-04' } : {}),
    ...(away ? { awayFrom: start } : {}),
    ...(phone
      ? { onb: { n: 1, at: new Date('2026-09-08T20:00:00').getTime(), a: { habit: 'porn', freq: 'f3', when: ['late'], for: ['love'] }, hist: [] } }
      : {}),
    ...(update
      ? { onb: { n: 1, at: new Date('2026-09-08T20:00:00').getTime(), a: { habit: 'porn', freq: 'f2', when: ['late'], for: ['love'] }, hist: [] } }
      : {}),
  };
  const o: Record<string, unknown> = { 'daybook:settings': st };
  const lessons = phone ? ['l1', 'l54', 'l34'] : ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10', 'l11', 'l12', 'l13', 'l14'];
  /* a lesson looked at again on four days this week, so the ring of lesson days is part lit */
  const RECENT = ['2026-10-12', '2026-10-13', '2026-10-15', '2026-10-16'];
  let id = 0;
  const ev = (time: string, outcome: 'rode' | 'slipped', trigger: string) => ({
    id: 'e' + ++id,
    time,
    outcome,
    trigger,
    paused: false,
    did: outcome === 'rode' ? ['Went for a walk'] : null,
    recovered: false,
    note: '',
  });
  for (let i = 0; ; i++) {
    const d = day(start, i);
    if (d >= DEMO.day) break;
    if (away && d >= day(DEMO.day, -5)) continue;
    const events = [];
    if (month) {
      if (i % 2 === 0) events.push(ev(URGE_AT[i % 6]!, 'rode', URGE_WHY[(i / 2) % 6]!));
      if (MONTH_SLIPS.includes(d)) events.push({ ...ev(i % 2 ? '23:30' : '00:40', 'slipped', i % 2 ? 'late' : 'tired'), id: 'ms' + i });
    } else if (i % 5 === 0) events.push(ev('21:30', 'rode', i % 2 ? 'Stressed' : 'Bored'));
    /* the one slip, with what was going on before it and how it felt after (the studio opens its comeback pages on it) */
    if (late.some((n) => day(DEMO.day, n) === d)) events.push({ ...ev('23:10', 'slipped', 'lonely'), id: 'late' + i });
    else if (!month && d === '2026-09-12') events.push({ ...ev('23:50', 'slipped', 'lonely'), id: 'slip', fa: 'flat' });
    else if (hard && (i * 37) % 11 < 5) {
      events.push({ ...ev('22:40', 'slipped', 'tired'), id: 'slip' + i });
      if (i % 9 === 4) events.push({ ...ev('23:55', 'slipped', 'tired'), id: 'slip' + i + 'b' });
    }
    o['daybook:days/' + d] = {
      d,
      events,
      checkin:
        i % 5 === 4 || (month && i % 4)
          ? null
          : { m: 6 + (i % 4), c: 6, e: 6 + (i % 3), s: 4 - (i % 3), h: 7, so: i % 3 === 0 ? 'Y' : 'N', ro: 'N', n: '', done: true, at: 0 },
      p: {
        w: [],
        wd: false,
        r: false,
        c: 0,
        m: false,
        tl: [],
        po: null,
        ls: month ? (i % 5 === 2 ? [] : ['l' + ((i % 30) + 1)]) : i % 5 === 0 && lessons.length ? [lessons.shift()] : [],
        ...(month && i % 4 === 1 ? { hw: i % 3 ? 22 : 21 } : {}),
        ...(month && i > 0 && i % 6 !== 5 ? { ms: { at: 1, set: 1, n: MONTH_SLIPS.includes(day(start, i - 1)) ? 'slip' : 'free' } } : {}),
        lv: RECENT.includes(d) ? ['l2'] : [],
        ov: {},
      },
      u: 1,
    };
  }
  /* the hard hours already passed are kept, as the app would have kept them the evening they passed, so no note pops up */
  const sn = normSettings(st);
  let days: Days = {};
  for (const k in o) if (k.startsWith('daybook:days/')) days[k.slice(13)] = normDay(o[k], k.slice(13));
  const tk = logicalKey(at, sn.rollover);
  for (let x = riskToKeep(days, sn, tk, at), n = 0; x && n < 4; x = riskToKeep(days, sn, tk, at), n++) days = keepHard(days, x.k, x.r.win.start, at);
  /* this morning is already set (last night free, tonight's reason and time), as a person who opens Daybook every morning has it, so the
     pictures open on Today and not on the morning page over it */
  /* (not for the lighting's key moments: their morning is left open, so Free of it lights the flame) */
  if (!late.length)
    days = setTonight(answerNight(days, sn, tk, 'free', at), sn, tk, { rs: slipday ? [st.becoming, ...st.reasons] : [st.reasons[0]!], nt: '22:30' }, at).days;
  /* ?demo=slipday: the owner's own Today of November 18, 2026: an urge ridden out early and a slip this morning, and three things tonight
     is for, the becoming sentence among them (Today so far, and the sentence said once) */
  if (slipday) {
    const t0 = days[tk] || normDay({ d: tk }, tk);
    days = {
      ...days,
      [tk]: { ...t0, events: [...t0.events, { ...ev('07:40', 'rode', 'scroll'), m: 6 }, { ...ev('10:26', 'slipped', 'bored'), id: 'slipnow' }] },
    };
  }
  /* ?demo=walked: Walk it through twice this week, the last with a plan, so a third walk opens on "Same plan as last time"
     (components/walk.tsx) */
  if (q === 'walked')
    for (const [n, h] of [
      [-5, 21],
      [-2, 22],
    ] as const) {
      const k = day(DEMO.day, n);
      const t = new Date(`${k}T${h}:10:00`).getTime();
      const w = { n0: 6, n1: 3, holds: [], holdOwn: '', where: null, feel: null, line: null, lineOwn: '', answer: '', explain: '', need: null, at: null };
      const plan = { moves: ['walk' as const], moveOwn: 'Ten pushups', mo: 'late', moAt: t + 2 * 3600_000 };
      days = saveTalk(days, k, { ...walkTalk(newTalk(t), { ...w, ...plan }), a: { went: false, t: t + 9 * 3600_000, f: [], g: null, c: [], mn: 1 } }, t);
    }
  const out: Record<string, string> = { 'daybook:settings': JSON.stringify(st) };
  for (const k in days) out['daybook:days/' + k] = JSON.stringify(days[k]);
  /* a few journal entries over the last week and a half, each started with a feeling, one with only the feeling */
  const jn: [number, string, string, string][] = [
    [
      -1,
      '21:40',
      'Proud',
      'Got through the late hours without opening the laptop. Called my brother instead and we talked for an hour. I forgot how much I like hearing him laugh.',
    ],
    [-1, '08:10', 'Hopeful', 'Slept well for the third night in a row. Mornings feel clearer than they used to.'],
    [-2, '22:30', 'Restless', 'Could not settle tonight. Went for a walk around the block and it passed. Writing it down helps me see it was only a wave.'],
    [-4, '19:05', 'Grateful', ''],
    [-6, '23:15', 'Lonely', 'Quiet weekend. Texted Sam to get coffee on Sunday. Small step, but I took it.'],
    [-9, '07:50', 'Calm', 'First morning run in weeks. Legs heavy, head light.'],
  ];
  /* ?jn=0 shows the journal before its first entry */
  const noJn = typeof window !== 'undefined' && !!window.location && new URLSearchParams(window.location.search).get('jn') === '0';
  if (!noJn)
    jn.forEach(([n, time, w, t], i) => {
      const d = day(DEMO.day, n);
      const at = new Date(`${d}T${time}:00`).getTime();
      const id = 'demo' + (i + 1);
      out['daybook:journal/' + id] = JSON.stringify({ id, d, at, w, t, u: at });
    });
  /* ?deed=1 adds what was written in step 4's deed box today (lesson at=deed), so the journal shows a deed's entry */
  if (typeof window !== 'undefined' && !!window.location && new URLSearchParams(window.location.search).get('deed') === '1') {
    const at = new Date(`${DEMO.day}T11:40:00`).getTime();
    const t = 'I am becoming someone who is free, and who shows up for the people I love.';
    out['daybook:journal/demodeed'] = JSON.stringify({ id: 'demodeed', d: DEMO.day, at, w: JN_NO_FEEL, t, q: PATH_STEPS[3].deed, u: at });
  }
  if (theme !== 'auto') out['daybook.theme'] = theme;
  /* the app was already opened today, so "How are you feeling today?" does not cover the shot (lib/day-open.ts); an updating person
     opens it fresh, as they would, unless ?seen= stands for a later open */
  const later = typeof window !== 'undefined' && !!window.location && new URLSearchParams(window.location.search).has('seen');
  if (!update || later) out['daybook.dayOpen'] = tk;
  else out['daybook.ur.v1'] = JSON.stringify({ moveSit: false });
  return out;
}
