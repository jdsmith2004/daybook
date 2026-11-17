/* The usage report (scripts/stats-lib.mjs) on made-up rows: accounts lead and count once across phones, testers are left out,
   a batch sent twice counts once, "back after a slip" can never pass the slips, and Athena's CSV reads back. */
import { describe, expect, it } from 'vitest';

// @ts-expect-error a plain .mjs script with no types
import { buildReport, parseCsv, prepare } from '../../../scripts/stats-lib.mjs';
import { EV_NAMES } from '../src/events';

const hex = (c: string) => c.repeat(32).slice(0, 32);
const AK1 = hex('a');
const AK_T = hex('f');
const P1 = hex('1'); // account 1, phone one
const P2 = hex('2'); // account 1, phone two
const P3 = hex('3'); // no account
const P4 = hex('4'); // a tester's phone
const P5 = hex('5'); // a second phone on the tester's account, not marked itself
const P6 = hex('6'); // an account from before the key (its day snapshot says so)
let k = 0;
const row = (dt: string, i: string, n: string, d: number, p: Record<string, unknown> = {}) => ({
  dt,
  i,
  pf: 'ios',
  v: '1.3.6',
  k: String(k++),
  n,
  d: String(d),
  h: '9',
  p: JSON.stringify(p),
});
const TODAY = '2026-11-17';
const rows = [
  row('2026-11-10', P1, 'open', 0, { ak: AK1 }),
  row('2026-11-11', P1, 'open', 1, { ak: AK1 }),
  row('2026-11-11', P1, 'slip', 1, { ak: AK1 }),
  row('2026-11-11', P1, 'slip', 1, { ak: AK1 }),
  row('2026-11-12', P1, 'open', 2, { ak: AK1 }),
  row('2026-11-16', P2, 'open', 0, { ak: AK1 }),
  row('2026-11-16', P2, 'lesson_open', 0, { ak: AK1, lesson: 'l1' }),
  row('2026-11-16', P2, 'lesson_done', 0, { ak: AK1, lesson: 'l1', len: 'q', secs: 200 }),
  row('2026-11-15', P3, 'open', 0),
  row('2026-11-15', P3, 'setup_page', 0, { page: 'how' }),
  row('2026-11-15', P3, 'setup_page', 0, { page: 'habit', secs: 30 }),
  row('2026-11-15', P3, 'sos_open', 0, { from: 'other' }),
  row('2026-11-15', P4, 'open', 0, { ak: AK_T, tst: true }),
  row('2026-11-15', P4, 'sos_open', 0, { ak: AK_T, tst: true }),
  row('2026-11-16', P5, 'open', 0, { ak: AK_T }),
  row('2026-11-16', P6, 'day', 3, { acct: true }),
];
/* the same batch sent twice */
const twice = [...rows, { ...rows[2] }];

describe('the usage report', () => {
  it('groups phones into accounts, no account and testers', () => {
    const { phones, dupes, evs } = prepare(twice, {});
    expect(dupes).toBe(1);
    expect(evs.length).toBe(rows.length);
    const g = (i: string) => phones.get(i).group;
    expect([g(P1), g(P2), g(P3), g(P4), g(P5), g(P6)]).toEqual(['A', 'A', 'N', 'T', 'T', 'A']);
    expect(phones.get(P1).unit).toBe(phones.get(P2).unit);
    expect(phones.get(P6).keyless).toBe(true);
    /* the event's own day, from its phone's install day: P6 arrived on day 3 of an install 3 days before */
    expect(phones.get(P6).inst).toBe('2026-11-13');
  });

  it('keeps two different events that share a place in the stream (two tabs open)', () => {
    const a = row('2026-11-12', P3, 'open', 0);
    const b = { ...a, n: 'screen' };
    expect(prepare([a, b, { ...a }], {}).evs.length).toBe(2);
  });

  it('a listed install id or key makes a tester', () => {
    const { phones } = prepare(rows, { testers: [P3, AK1] });
    expect([phones.get(P1).group, phones.get(P2).group, phones.get(P3).group]).toEqual(['T', 'T', 'T']);
  });

  it('reads as a report with denominators, and testers out of every number', () => {
    const { md } = buildReport(twice, { today: TODAY, names: Object.keys(EV_NAMES), pages: ['hello', 'how', 'habit'] });
    expect(md).toMatch(/\*\*Accounts:\*\* 2 \(1 account with the account key, on 2 phones; 1 phone with an account from before the key/);
    expect(md).toMatch(/\*\*Phones with no account:\*\* 1\./);
    expect(md).toMatch(/Testers, left out of everything below:\*\* 2 phones \(1 account\), 3 events/);
    expect(md).toMatch(/1 of 17 rows were the same event arriving twice/);
    /* SOS: the tester's open is not counted, the other phone's is */
    expect(md).toMatch(/\| \*\*No account\*\* \| 1 \(by 1 phone\) \| 0 of 1 \(0%\)/);
    /* two slips on one day are one slip day, and the person was back the next day */
    expect(md).toMatch(/\| \*\*With an account\*\* \| 0 \(0 ridden out\) \| 2 \(by 1 account\) \| no slips|\| 0\.0 \| 1 \| 1 of 1 \(100%\)/);
    expect(md).toContain('| 1 | 1 of 1 (100%) |');
    /* setup: the time on "how" comes from the page after it */
    expect(md).toMatch(/\| how \| 1 of 1 \(100%\) \| 30s \| 1 \| 0 \|/);
    expect(md).toMatch(/\| habit \| 1 of 1 \(100%\) \| - \| 0 \| 1 \|/);
    /* lessons: the length */
    expect(md).toMatch(/1 \/ 0 \/ 0 \/ 0/);
    /* dead events are named */
    expect(md).toMatch(/Never seen: .*friend_invite/);
    expect(md).toMatch(/### What this suggests/);
  });

  it("reads Athena's CSV, quotes and all", () => {
    const csv = '"dt","i","p"\n"2026-11-17","x","{""ak"":""1"",""s"":""a,b""}"\n';
    expect(parseCsv(csv)).toEqual([{ dt: '2026-11-17', i: 'x', p: '{"ak":"1","s":"a,b"}' }]);
  });
});
