import { describe, expect, it } from 'vitest';
import * as core from '../src/index';
import {
  appleTier,
  extraLocked,
  LOOKS_READY,
  patPartOpen,
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
