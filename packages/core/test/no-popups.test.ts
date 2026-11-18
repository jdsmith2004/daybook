/* Today does not get pop-ups (CLAUDE.md, "Today does not get pop-ups"; the owner, November 18, 2026: "I'm just getting really,
   really annoyed with these pop-ups because they don't add value and you keep adding them ... I do not like it switching up the order
   at all"). Only three kinds of thing may interrupt Today: something the person started, a real earned celebration, and the
   required asks (rating, tip, account). Everything else is a line on the day's spine or nothing, and the spine's order never changes.

   Every card Today can show comes from a MomentKind (moment.ts). This test fails when a new one appears without being listed here,
   so a new card is a choice the owner made, never a side effect. Adding one: get the owner's yes, then list it with the reason.
   The kinds still under review in the pop-up audit (side-session notes, popups-audit.md, November 18, 2026) are marked so. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ALLOWED: Record<string, string> = {
  pause: 'started by the person: a pause they are in the middle of',
  talk: 'started by the person: a talk-through they chose to wait on, coming due',
  calm: "the spine itself: the day's next stop",
  done: 'the spine itself: the day is done',
  /* under review in the pop-up audit (November 18, 2026); the owner picks keep, a line on the spine, or remove */
  sunday: 'audit: kept in the type; the Sunday review is a step on the spine (next-step.ts)',
  'first-week': 'audit: the first week looked back on',
  'tell-start': 'audit: Day 1, tell the safe person',
  'count-note': 'audit: a note about how days count',
  'step-offer': 'audit: slips on most days, a gentler plan',
  nudge: 'audit: a word about reminders',
  'first-pattern': 'audit: the first pattern',
  recheck: 'audit: the five questions again, every 30 days',
  unlock: 'audit: a part unlocked in the first weeks',
};

const src = readFileSync(join(import.meta.dirname, '../src/moment.ts'), 'utf8');
const kinds = [...(/export type MomentKind =([^;]+);/.exec(src)?.[1] ?? '').matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);

describe('Today does not get pop-ups', () => {
  it('reads the kinds', () => expect(kinds.length).toBeGreaterThan(3));
  it('every card Today can show is one the owner allowed', () => {
    expect(kinds.filter((k) => !(k in ALLOWED))).toEqual([]);
    /* and the list stays true: a kind taken out of moment.ts comes off it too */
    expect(Object.keys(ALLOWED).filter((k) => !kinds.includes(k))).toEqual([]);
  });
  it('the day of a slip has no card of its own (removed November 18, 2026)', () => {
    expect(kinds).not.toContain('slip-day');
    /* nor do days away (removed November 18, 2026: Welcome back is a light sheet, once) */
    expect(kinds).not.toContain('away');
    expect(ALLOWED).not.toHaveProperty('slip-day');
  });
});
