import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import {
  applePatKind,
  APPLE_PATTERN,
  appleTier,
  extraLocked,
  extraOpen,
  keepPat,
  LOOKS_READY,
  normPat,
  PAT_GRACE,
  PAT_LIFETIME_CENTS,
  patActive,
  patBest,
  patLink,
  patMonthOpen,
  patOpen,
  patPartOpen,
  PATTERN_FROM,
  PATTERN_LINK,
  type PatRec,
  supPerks,
  APPLE_TIPS,
  isSupporter,
  keepSup,
  normSup,
  STRIPE_SESSION_RE,
  supActive,
  supBest,
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
  const monthly: PatRec = { since: FROM + 5, kind: 'monthly', until: FROM + 100, src: 'apple', cents: 299, ref: 'abc' };
  const lifetime: PatRec = { since: FROM + 5, kind: 'lifetime', until: null, src: 'stripe', cents: 2499, ref: 'cs_test_abc' };
  const NOW = FROM + 50;
  const DAY = 86400_000;

  it('is off until it goes on sale, and then a day has to be set for it', () => {
    expect(PATTERN_FROM == null || !!PATTERN_LINK).toBe(true);
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
    for (const pat of [monthly, lifetime]) {
      const st = { pat } as never;
      expect(patOpen(st, NOW, FROM)).toBe(true);
      expect(extraOpen(st, 'sync', NOW, FROM)).toBe(true);
      expect(isSupporter(st, NOW)).toBe(true);
      expect(extraLocked(st, 'stats', { canTip: true, now: NOW, from: FROM })).toBe(false);
    }
  });
  it('a monthly plan runs past its end by the grace days, then goes back to the tip rules; lifetime never ends', () => {
    const end = monthly.until!;
    expect(patActive(monthly, end + (PAT_GRACE * DAY - 1))).toBe(true);
    expect(patActive(monthly, end + PAT_GRACE * DAY)).toBe(false);
    expect(patActive(lifetime, 1e15)).toBe(true);
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
    expect(patMonthOpen({ pat: lifetime } as never, 1e15, NOW, FROM)).toBe(true);
  });
  it('cleans a record from elsewhere', () => {
    expect(normPat('yes')).toBeNull();
    expect(normPat({ ...monthly, until: null })).toBeNull();
    expect(normPat({ ...monthly, src: 'grandfather' })).toBeNull();
    expect(normPat({ ...monthly, kind: 'tip' })).toBeNull();
    expect(normPat({ ...lifetime, until: 7 })?.until).toBeNull();
    expect(normPat({ ...lifetime, ref: 'x y', cents: -1 })).toEqual({ since: lifetime.since, kind: 'lifetime', until: null, src: 'stripe' });
  });
  it('keeps the better record: lifetime, then the later end, with the earlier start', () => {
    expect(patBest(monthly, lifetime)).toBe(lifetime);
    expect(patBest(lifetime, monthly)).toBe(lifetime);
    expect(patBest(null, monthly)).toBe(monthly);
    const next = { ...monthly, since: monthly.since + 9, until: monthly.until! + 30 };
    expect(patBest(monthly, next)).toEqual({ ...next, since: monthly.since });
    expect(patBest(next, monthly)).toEqual({ ...next, since: monthly.since });
  });
  it('settings that come back without the record get it back, and a monthly never replaces lifetime', () => {
    const a = { pat: lifetime } as never;
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
    expect(applePatKind(APPLE_PATTERN.monthly)).toBe('monthly');
    expect(applePatKind(APPLE_PATTERN.lifetime)).toBe('lifetime');
    expect(applePatKind(APPLE_TIPS.kind)).toBeNull();
    expect(appleTier(APPLE_PATTERN.lifetime)).toBeNull();
    expect(PAT_LIFETIME_CENTS).toBe(2499);
  });
  it('the web page carries the account, as a tip does', () => {
    expect(patLink(null, '')).toBe('');
    expect(patLink(null, 'https://buy.stripe.com/x')).toBe('https://buy.stripe.com/x');
    expect(patLink('aaaaaaaa-1111-4111-8111-111111111111', 'https://buy.stripe.com/x')).toBe(
      'https://buy.stripe.com/x?client_reference_id=aaaaaaaa-1111-4111-8111-111111111111',
    );
  });
  it('the sheet lists what is really open', () => {
    expect(supPerks(true).map((p) => p.id)).toEqual(['sync', 'stats']);
    expect(supPerks(false).map((p) => p.id)).toEqual(['sync']);
  });
});
