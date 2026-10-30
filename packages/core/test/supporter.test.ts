import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import {
  APPLE_MONTHLY,
  appleTier,
  extraLocked,
  extraOpen,
  keepPat,
  LOOKS_READY,
  normPat,
  PAT_GRACE,
  LIFETIME_CENTS,
  PAT_MONTHLY_USD,
  patActive,
  patBest,
  patMonthOpen,
  patOpen,
  patPartOpen,
  PATTERN_FROM,
  type PatRec,
  supPerks,
  APPLE_TIPS,
  isSupporter,
  keepSup,
  normSup,
  STRIPE_SESSION_RE,
  supActive,
  supBest,
  TIP_USD,
  tipEnough,
  tipLink,
  TIP_TIER_IDS,
  type Supporter,
} from '../src/supporter';

const tip: Supporter = { since: 1, kind: 'tip', until: null, src: 'apple', cents: 500 };
const month: Supporter = { since: 1, kind: 'monthly', until: 1000, src: 'stripe' };

describe('supporter', () => {
  it('a tip never ends, a month ends at its until', () => {
    expect(supActive(tip, 1e15)).toBe(true);
    expect(supActive(month, 999)).toBe(true);
    expect(supActive(month, 1000)).toBe(false);
    expect(supActive(null)).toBe(false);
  });
  it('reads the record on the settings', () => {
    expect(isSupporter({ sup: tip } as never)).toBe(true);
    expect(isSupporter({} as never)).toBe(false);
    expect(isSupporter(null)).toBe(false);
  });
  it('five dollars or more makes a supporter', () => {
    expect(tipEnough(500)).toBe(true);
    expect(tipEnough(499)).toBe(false);
    expect(tipEnough(NaN)).toBe(false);
  });
  it('keeps the better record', () => {
    expect(supBest(month, tip)).toBe(tip);
    expect(supBest(tip, month)).toBe(tip);
    expect(supBest(month, { ...month, until: 2000 })?.until).toBe(2000);
    expect(supBest(null, month)).toBe(month);
    expect(supBest(undefined, null)).toBe(null);
  });
  it('a malformed record is not a supporter', () => {
    expect(supActive('yes' as never)).toBe(false);
    expect(supActive({ kind: 'tip', src: 'apple' } as never)).toBe(false);
    expect(supActive({ since: 1, kind: 'tip', until: null, src: 'paypal' } as never)).toBe(false);
    /* monthly support always has an end */
    expect(normSup({ since: 1, kind: 'monthly', until: null, src: 'stripe' })).toBeNull();
    /* a tip has none, whatever was written */
    expect(normSup({ since: 1, kind: 'tip', until: 5, src: 'apple' })?.until).toBeNull();
    expect(normSup({ ...tip, cents: -3, ref: 'x y' })).toEqual({ since: 1, kind: 'tip', until: null, src: 'apple' });
    expect(normSup({ ...tip, ref: 'cs_test_abc' })?.ref).toBe('cs_test_abc');
  });
});

describe('keeping a tip when settings are replaced', () => {
  const st = (u: number, sup?: Supporter | null) => ({ ...core.normSettings({ start: '2026-10-01', u }), u, ...(sup === undefined ? {} : { sup }) });

  it('keepSup takes the better record, and leaves settings alone when there is nothing better', () => {
    const a = st(1);
    expect(keepSup(a, null)).toBe(a);
    expect(keepSup(a, tip).sup).toEqual(tip);
    const b = st(1, tip);
    expect(keepSup(b, month)).toBe(b);
    expect(keepSup(null, tip)).toBeNull();
  });

  it('newer settings from the account without the record do not take it away', () => {
    const snap = { settings: st(100, tip), days: {}, reviews: {} };
    const m = core.mergeRemote(snap, {}, [{ id: 'settings', u: 200, data: st(200) }]);
    expect(m.snap.settings?.u).toBe(200);
    expect(m.snap.settings?.sup).toEqual(tip);
  });

  it('a device joining an account keeps the record from either side', () => {
    const here = { settings: st(100, tip), days: {}, reviews: {} };
    const recs = [
      { id: 'settings' as const, u: 50, data: st(50) },
      { id: 'days/2026-10-02' as const, u: 50, data: core.normDay({ events: [{ id: 'e', time: '22:00', outcome: 'rode' }] }, '2026-10-02') },
    ];
    /* the account's log has more days, so its settings win, with this device's tip on them */
    const j = core.joinRecords(here, recs);
    expect(j.mine).toBeNull();
    expect((j.recs.find((r) => r.id === 'settings')!.data as { sup?: Supporter }).sup).toEqual(tip);
  });

  it('an older backup does not take it away', () => {
    const here = { settings: st(100, tip), days: {}, reviews: {} };
    const r = core.restoreBackup(here, { settings: st(10), days: {}, reviews: {} }, 500).snap;
    expect(r.settings?.sup).toEqual(tip);
  });
});

describe('paying a tip', () => {
  it('three Apple products, one per tip', () => {
    expect(TIP_TIER_IDS.map((t) => APPLE_TIPS[t])).toEqual(['daybook.tip.kind', 'daybook.tip.generous', 'daybook.tip.amazing']);
    expect(appleTier('daybook.tip.amazing')).toBe('amazing');
    expect(appleTier('daybook.tip')).toBeNull();
  });

  it('the web tip page carries the account id, and only a real one', () => {
    const links = { kind: 'https://buy.stripe.com/k', generous: 'https://buy.stripe.com/g', amazing: '' };
    const id = 'aaaaaaaa-1111-4111-8111-111111111111';
    expect(tipLink('generous', id, links)).toBe('https://buy.stripe.com/g?client_reference_id=' + id);
    expect(tipLink('generous', null, links)).toBe('https://buy.stripe.com/g');
    expect(tipLink('generous', 'x&y=1', links)).toBe('https://buy.stripe.com/g');
    expect(tipLink('amazing', id, links)).toBe('');
    /* until the owner makes the three links, the old tip page stands in for the Kind tip */
    expect(tipLink('kind', null, { kind: '', generous: '', amazing: '' })).toBe(core.SUPPORT_URL);
    expect(tipLink('generous', null, { kind: '', generous: '', amazing: '' })).toBe('');
  });

  it('knows a Checkout Session id', () => {
    expect(STRIPE_SESSION_RE.test('cs_live_a1B2c3D4e5F6g7H8')).toBe(true);
    expect(STRIPE_SESSION_RE.test('cs_live_../x')).toBe(false);
    expect(STRIPE_SESSION_RE.test('{CHECKOUT_SESSION_ID}')).toBe(false);
  });
});

describe('locks', () => {
  const st = { start: '2026-10-01' } as never;
  const sup = { start: '2026-10-01', sup: tip } as never;
  it('a supporter has every extra open; anyone else sees the locks, where a tip can be paid', () => {
    expect(extraLocked(st, 'stats', { canTip: true })).toBe(true);
    expect(extraLocked(st, 'sync', { canTip: true })).toBe(true);
    expect(extraLocked(sup, 'stats', { canTip: true })).toBe(false);
    expect(extraLocked(sup, 'sync', { canTip: true })).toBe(false);
  });
  it('an account from before tips keeps sync only, and is not a supporter', () => {
    const old = { start: '2026-10-01', sup: { since: 1, kind: 'tip', until: null, src: 'grandfather' } } as never;
    expect(extraLocked(old, 'sync', { canTip: true })).toBe(false);
    expect(extraLocked(old, 'stats', { canTip: true })).toBe(true);
    expect(isSupporter(old)).toBe(false);
    /* a tip after it replaces it */
    const g: Supporter = { since: 1, kind: 'tip', until: null, src: 'grandfather' };
    expect(supBest(g, tip)).toBe(tip);
    expect(supBest(tip, g)).toBe(tip);
    expect(isSupporter(keepSup(old, tip))).toBe(true);
  });
  it('where no tip can be paid (Android for now), nothing is locked', () => {
    expect(extraLocked(st, 'stats', { canTip: false })).toBe(false);
    expect(extraLocked(st, 'sync', { canTip: false })).toBe(false);
  });
  it('sync shows its lock only while signed out: the server decides for an account', () => {
    expect(extraLocked(st, 'sync', { canTip: true, signedIn: true })).toBe(false);
    expect(extraLocked(st, 'sync', { canTip: true, signedIn: false })).toBe(true);
  });
  it('flame looks are neither offered nor locked until they exist', () => {
    expect(LOOKS_READY).toBe(false);
    expect(extraLocked(st, 'looks', { canTip: true })).toBe(false);
    expect(supPerks().map((p) => p.id)).toEqual(['sync', 'stats']);
  });
  it('the pattern in one look, the gaps between slips and My numbers stay free; the deeper parts lock', () => {
    for (const p of ['look', 'apart', 'numbers'] as const) expect(patPartOpen(p, true)).toBe(true);
    for (const p of ['when', 'what', 'days', 'helps'] as const) {
      expect(patPartOpen(p, true)).toBe(false);
      expect(patPartOpen(p, false)).toBe(true);
    }
  });
  it('a monthly plan that ended locks again at its end', () => {
    const ended = { start: '2026-10-01', sup: { since: 1, kind: 'monthly', until: 1000, src: 'stripe' } } as never;
    expect(extraLocked(ended, 'stats', { canTip: true, now: 999 })).toBe(false);
    expect(extraLocked(ended, 'stats', { canTip: true, now: 1000 })).toBe(true);
  });
});

describe('Daybook Pattern', () => {
  const FROM = 1_000_000;
  const before: Supporter = { since: FROM - 1, kind: 'tip', until: null, src: 'apple', cents: 500 };
  const after: Supporter = { since: FROM + 1, kind: 'tip', until: null, src: 'stripe', cents: 500 };
  const old: Supporter = { since: 5, kind: 'tip', until: null, src: 'grandfather' };
  const monthly: PatRec = { since: FROM + 5, kind: 'monthly', until: FROM + 100, src: 'apple', cents: 300, ref: 'abc' };
  const lifetime: Supporter = { since: FROM + 5, kind: 'tip', until: null, src: 'apple', cents: LIFETIME_CENTS, ref: 'def' };
  const NOW = FROM + 50;
  const DAY = 86400_000;

  it('costs what the owner chose, and the largest tip moves only when it goes on sale', () => {
    expect(PAT_MONTHLY_USD).toBe(3);
    expect(LIFETIME_CENTS).toBe(1000);
    expect(TIP_USD.generous * 100).toBe(LIFETIME_CENTS);
    expect(TIP_USD.amazing).toBe(PATTERN_FROM == null ? 20 : 30);
  });
  it('a tip of $10 or more after the day is lifetime, on Apple or the web; a smaller one opens sync', () => {
    for (const cents of [1000, 2000, 3000]) {
      const st = { sup: { ...after, cents } } as never;
      expect(patOpen(st, NOW + 1e12, FROM)).toBe(true);
      expect(extraOpen(st, 'stats', NOW + 1e12, FROM)).toBe(true);
      expect(extraOpen(st, 'sync', NOW + 1e12, FROM)).toBe(true);
    }
    expect(patOpen({ sup: { ...after, cents: 999 } } as never, NOW, FROM)).toBe(false);
    /* a tip with no amount on it is not lifetime, and a grandfathered account is never */
    expect(patOpen({ sup: { ...after, cents: undefined } } as never, NOW, FROM)).toBe(false);
    expect(patOpen({ sup: { ...old, cents: 1000 } } as never, NOW, FROM)).toBe(false);
  });
  it('what a person holds never shrinks when a second tip comes, in either order', () => {
    const big: Supporter = { ...after, since: FROM + 9, cents: 1000 };
    const later: Supporter = { ...after, since: FROM + 9 };
    /* the $5 tip first, then lifetime: lifetime is kept, though it is later */
    expect(supBest(after, big)).toBe(big);
    expect(supBest(big, after)).toBe(big);
    /* a tip from before the day and lifetime after it: either way everything stays open */
    expect(patOpen({ sup: supBest(before, big) } as never, NOW, FROM)).toBe(true);
    expect(patOpen({ sup: supBest(big, before) } as never, NOW, FROM)).toBe(true);
    /* two small ones: the earlier, whose date decides */
    expect(supBest(before, later)).toBe(before);
    expect(supBest(later, before)).toBe(before);
    /* the same tip seen twice keeps the same object, so settings do not churn */
    expect(supBest(big, { ...big })).toBe(big);
  });
  it('before it goes on sale, a tip opens everything it always did', () => {
    expect(patOpen({ sup: after } as never, NOW, null)).toBe(true);
    expect(extraOpen({ sup: after } as never, 'stats', NOW, null)).toBe(true);
  });
  it('a tip from before the day keeps the whole pattern for good; a tip after it opens sync', () => {
    expect(patOpen({ sup: before } as never, NOW + 1e12, FROM)).toBe(true);
    expect(extraOpen({ sup: before } as never, 'sync', NOW, FROM)).toBe(true);
    expect(patOpen({ sup: after } as never, NOW, FROM)).toBe(false);
    expect(extraOpen({ sup: after } as never, 'stats', NOW, FROM)).toBe(false);
    expect(extraOpen({ sup: after } as never, 'sync', NOW, FROM)).toBe(true);
  });
  it('an account from before tips has sync only, on sale or not', () => {
    for (const from of [null, FROM]) {
      expect(patOpen({ sup: old } as never, NOW, from)).toBe(false);
      expect(extraOpen({ sup: old } as never, 'sync', NOW, from)).toBe(true);
    }
    expect(isSupporter({ sup: old } as never, NOW)).toBe(false);
  });
  it('the product opens the pattern and sync, and makes a supporter, so every ask stops', () => {
    for (const st of [{ pat: monthly }, { sup: lifetime }] as never[]) {
      expect(patOpen(st, NOW, FROM)).toBe(true);
      expect(extraOpen(st, 'sync', NOW, FROM)).toBe(true);
      expect(isSupporter(st, NOW)).toBe(true);
      expect(extraLocked(st, 'stats', { canTip: true, now: NOW, from: FROM })).toBe(false);
    }
  });
  it('a monthly plan runs past its end by the grace days, then goes back to the tip rules', () => {
    const end = monthly.until!;
    expect(patActive(monthly, end + (PAT_GRACE * DAY - 1))).toBe(true);
    expect(patActive(monthly, end + PAT_GRACE * DAY)).toBe(false);
    const late = end + 30 * DAY;
    expect(patOpen({ pat: monthly } as never, late, FROM)).toBe(false);
    expect(isSupporter({ pat: monthly } as never, late)).toBe(false);
    expect(extraOpen({ pat: monthly } as never, 'sync', late, FROM)).toBe(false);
    /* a tip held alongside keeps what the tip opens */
    expect(extraOpen({ pat: monthly, sup: after } as never, 'sync', late, FROM)).toBe(true);
    expect(patOpen({ pat: monthly, sup: after } as never, late, FROM)).toBe(false);
    expect(patOpen({ pat: monthly, sup: before } as never, late, FROM)).toBe(true);
  });
  it('months that finished while a plan was active stay readable after it ends', () => {
    const end = monthly.until!;
    const late = end + 400 * DAY;
    const st = { pat: monthly } as never;
    expect(patMonthOpen(st, end - 10, late, FROM)).toBe(true);
    expect(patMonthOpen(st, end, late, FROM)).toBe(true);
    expect(patMonthOpen(st, end + 1, late, FROM)).toBe(false);
    expect(patMonthOpen({} as never, 0, late, FROM)).toBe(false);
    /* while it is open, every month */
    expect(patMonthOpen(st, end + 1, NOW, FROM)).toBe(true);
    expect(patMonthOpen({ sup: lifetime } as never, 1e15, NOW, FROM)).toBe(true);
  });
  it('cleans a record from elsewhere', () => {
    expect(normPat('yes')).toBeNull();
    expect(normPat({ ...monthly, until: null })).toBeNull();
    expect(normPat({ ...monthly, src: 'grandfather' })).toBeNull();
    expect(normPat({ ...monthly, kind: 'tip' })).toBeNull();
    expect(normPat({ ...monthly, ref: 'x y', cents: -1 })).toEqual({ since: monthly.since, kind: 'monthly', until: monthly.until, src: 'apple' });
  });
  it('keeps the better record: the later end, with the earlier start', () => {
    expect(patBest(null, monthly)).toBe(monthly);
    const next = { ...monthly, since: monthly.since + 9, until: monthly.until! + 30 };
    expect(patBest(monthly, next)).toEqual({ ...next, since: monthly.since });
    expect(patBest(next, monthly)).toEqual({ ...next, since: monthly.since });
  });
  it('settings that come back without the record get it back', () => {
    const a = { pat: monthly } as never;
    expect(keepPat(a, null)).toBe(a);
    expect(keepPat(a, monthly)).toBe(a);
    expect((keepPat({} as never, monthly) as { pat: PatRec }).pat).toEqual(monthly);
    expect(keepPat(null, monthly)).toBeNull();
  });
  it('between two paid tips the earlier one stays, because its date decides what it keeps', () => {
    expect(supBest(after, before)).toBe(before);
    expect(supBest(before, after)).toBe(before);
    expect(supBest(old, after)).toBe(after);
    expect(supBest(after, old)).toBe(after);
  });
  it('tells its products apart from the tips', () => {
    expect(appleTier(APPLE_MONTHLY)).toBeNull();
    expect(Object.values(APPLE_TIPS)).not.toContain(APPLE_MONTHLY);
  });
  it('the sheet lists what is really open', () => {
    expect(supPerks(true).map((p) => p.id)).toEqual(['sync', 'stats']);
    expect(supPerks(false).map((p) => p.id)).toEqual(['sync']);
  });
});
