/* Stats, for the owner only: the opt-in totals and the feedback (GET /pulse, core pulseSummary). The server answers only the
   owner's account (DAYBOOK_OWNER_SUB); anyone else sees their own account id, which is what the owner needs to set it up.
   Every number is a total for everyone, never one person's. */
import { addDays, fmtDate, pulseMeaning, pulseSummary, type PulseSummary } from '@daybook/core';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { EmptyChart } from '@/components/charts';
import { Busy } from '@/components/help-line';
import { Dock } from '@/components/scene';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Bar, Button, Chip, T } from '@/components/ui';
import { fetchStats, pulseOffered, setStatsSeen, type StatsBody } from '@/lib/pulse';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { useTheme } from '@/lib/theme';
import { copyText } from '@/lib/words';

const RANGES: [number, string][] = [
  [7, '7 days'],
  [30, '30 days'],
  [90, '90 days'],
];

export default function Stats() {
  const c = useTheme();
  const { tk, say } = useStore();
  const sync = useSync();
  const signed = sync.status.k !== 'off' && sync.status.k !== 'out' && sync.status.k !== 'expired';
  const [range, setRange] = useState(30);
  const [state, setState] = useState<{ k: 'wait' } | { k: 'ok'; b: StatsBody } | { k: 'no'; status: number; you?: string }>({ k: 'wait' });
  const from = addDays(tk, -range);
  const load = useCallback(async () => {
    setState({ k: 'wait' });
    let token = '';
    try {
      token = await sync.token();
    } catch {
      setState({ k: 'no', status: 401 });
      return;
    }
    const r = await fetchStats(token, from);
    if (r.ok) {
      setStatsSeen(true);
      setState({ k: 'ok', b: r.body });
    } else setState({ k: 'no', status: r.status, you: r.you });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);
  useEffect(() => {
    if (pulseOffered && signed) load();
  }, [load, signed]);

  if (!pulseOffered)
    return (
      <SheetFrame title="Stats" sub="The counts are not on in this build yet.">
        <Dock>
          <Button label="Done" onPress={closeSheet} />
        </Dock>
      </SheetFrame>
    );
  if (!signed || (state.k === 'no' && state.status === 401))
    return (
      <SheetFrame title="Stats" sub="For the owner of Daybook. Sign in with the owner's account to see them.">
        <Dock>
          <Button label="Sign in" onPress={() => sync.signInNow({ why: 'To see the stats' })} />
        </Dock>
      </SheetFrame>
    );
  if (state.k === 'no')
    return (
      <SheetFrame title="Stats" sub={state.status === 403 ? 'Only the owner can see these.' : 'Could not reach the server. Try again.'}>
        {state.you ? (
          <>
            <T>If you are the owner, add this account id as the repository secret DAYBOOK_OWNER_SUB, then deploy:</T>
            <T v="label" selectable>
              {state.you}
            </T>
            <Button kind="ghost" label="Copy the account id" onPress={() => copyText(state.you!, say)} />
          </>
        ) : null}
        <Dock>
          <Button label="Try again" onPress={load} />
        </Dock>
      </SheetFrame>
    );

  const sum = state.k === 'ok' ? pulseSummary(state.b.totals, from, tk) : null;
  return (
    <SheetFrame title="Stats" sub="Totals for everyone who said yes. Never one person's.">
      <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
        {RANGES.map(([n, l]) => (
          <Chip key={n} role="radio" label={l} on={range === n} onPress={() => setRange(n)} />
        ))}
      </View>
      {state.k === 'wait' || !sum ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Busy label="Loading" />
          <T tone="muted">Loading…</T>
        </View>
      ) : (
        <Summary s={sum} b={state.k === 'ok' ? state.b : null} bar={c.accent} />
      )}
      <Dock>
        <Button label="Done" onPress={closeSheet} />
      </Dock>
    </SheetFrame>
  );
}

function Rows({ rows, label, bar, note }: { rows: [string, number][]; label: (k: string) => string; bar: string; note?: string }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <View style={{ gap: 8 }}>
      {note ? (
        <T v="small" tone="muted">
          {note}
        </T>
      ) : null}
      {rows.map(([k, n]) => (
        <View key={k} style={{ gap: 3 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <T v="small" style={{ flex: 1 }}>
              {label(k)}
            </T>
            <T v="label">{String(n)}</T>
          </View>
          <Bar frac={n / max} from={bar} height={6} />
        </View>
      ))}
    </View>
  );
}

function Summary({ s, b, bar }: { s: PulseSummary; b: StatsBody | null; bar: string }) {
  const days = s.platforms.reduce((a, x) => a + x[1], 0);
  const back = s.back.reduce((a, x) => a + x[1], 0);
  const strip = (k: string, pre: string) => pulseMeaning(k).replace(pre, '');
  return (
    <>
      <SheetH title="Who sent counts" aside={days + ' device-days'} />
      <Rows rows={s.platforms} label={(k) => ({ ios: 'iPhone', android: 'Android', web: 'Web' })[k] || k} bar={bar} />
      {s.versions.length ? (
        <T v="small" tone="muted">
          {'Versions: ' + s.versions.map(([v, n]) => v + ' (' + n + ')').join(', ')}
        </T>
      ) : null}
      <SheetH title="Do people stay" />
      <Rows
        rows={s.active}
        label={(k) => strip(k, 'Opened Daybook, ').replace(' after first opening it', ' in')}
        bar={bar}
        note="Days the app was opened, by how long after a person first opened it."
      />
      <SheetH title="Coming back after a slip" aside={back + ' of ' + s.slips + ' slips'} />
      <Rows rows={s.back} label={(k) => strip(k, 'Came back ').replace(' after a slip', '')} bar={bar} />
      <SheetH title="Setup" />
      <Rows
        rows={s.setup}
        label={(k) => (k === 'setup_done' ? 'Finished setup' : k.slice(6))}
        bar={bar}
        note="People who reached each page. The reminder, tip and account pages show only to some, so read them as at most."
      />
      <SheetH title="What gets used" />
      {s.used.length ? <Rows rows={s.used} label={pulseMeaning} bar={bar} /> : <EmptyChart text="No counts yet. They fill in as people say yes to counts." />}
      <SheetH title="Feedback" aside={b ? String(b.feedback.length) : undefined} />
      {b && b.feedback.length ? (
        b.feedback.map((f) => (
          <View key={f.at + f.t.slice(0, 8)} style={{ gap: 2 }}>
            <T v="small" tone="muted">
              {fmtDate(new Date(f.at).toISOString().slice(0, 10), { month: 'short', day: 'numeric' }) + ' · ' + f.p + ' ' + f.v + (f.r ? ' · ' + f.r : '')}
            </T>
            <T selectable>{f.t}</T>
          </View>
        ))
      ) : (
        <EmptyChart text="No feedback yet. It shows up here when someone writes." />
      )}
    </>
  );
}
