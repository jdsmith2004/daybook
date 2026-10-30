/* One day (core: calendar.ts, daySummary), opened from the month calendar, the Journal list or Today's week dots. It shows the
   day first, at a glance: how it went, what happened (each entry with its time, what set it off, what helped, what SOS
   kept and any note), the check-in as small bars, and the rest of the day (tools, lessons, a talk-through, phone away).
   Editing is one tap away: an entry opens its own sheet, and Edit opens the check-in and that night's screens-off and
   sleep. ‹ and › step to the day before and after. Ported from the legacy sheetDay, and made to be read. */
import {
  calNeighbors,
  daySummary,
  fmtClock,
  fmtDate,
  isKey,
  phaseLabel,
  rateKeys,
  ratingOf,
  setScreensOff,
  stepSleep,
  type CalKind,
  type RateKey,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { useChartColors } from '@/components/charts';
import { CheckinBlock } from '@/components/checkin';
import { Stepper, YesNo } from '@/components/form';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Dock } from '@/components/scene';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme, type Palette } from '@/lib/theme';

/* how the day went: its fill, its words, and a plain icon */
const HEAD: Record<CalKind, { ic: string; tone: (c: Palette) => [string, string] }> = {
  ok: { ic: 'check', tone: (c) => [c.mintSoft, c.mintText] },
  saved: { ic: 'leaf', tone: (c) => [c.slipSoft, c.slipText] },
  slip: { ic: 'leaf', tone: (c) => [c.slipSoft, c.slipText] },
  logged: { ic: 'pencil', tone: (c) => [c.skySoft, c.skyText] },
  none: { ic: 'calendar', tone: (c) => [c.surface2, c.muted] },
  away: { ic: 'leaf', tone: (c) => [c.surface2, c.muted] },
  before: { ic: 'calendar', tone: (c) => [c.surface2, c.muted] },
  ahead: { ic: 'calendar', tone: (c) => [c.surface2, c.muted] },
};

export default function DaySheet() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const c = useTheme();
  const { snap, tk, update } = useStore();
  const [edit, setEdit] = useState<string | null>(null);
  const st = snap.settings;
  if (!st || !isKey(date)) return <Redirect href="/" />;
  const x = daySummary(snap.days, st, date, tk);
  const nb = calNeighbors(snap.days, st, date, tk);
  const ci = snap.days[date]?.checkin;
  const editing = edit === date || !x.ci;
  const [bg, ink] = HEAD[x.kind].tone(c);
  const go = (k: string | null) => {
    if (!k) return;
    buzz('tap');
    router.setParams({ date: k });
  };
  const facts = x.ci
    ? [
        x.ci.h != null ? 'Slept ' + x.ci.h + ' h' : '',
        x.ci.so ? (x.ci.so === 'Y' ? 'Screens off on time' : x.po ? 'Picked the phone back up' : 'Screens on late') : '',
        x.ci.ro === 'Y' ? 'Reached out' : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : '';
  const stat = [x.rode ? x.rode + (x.rode === 1 ? ' urge ridden out' : ' urges ridden out') : '', x.pts ? '+' + x.pts + ' points' : ''].filter(Boolean);

  return (
    <SheetFrame title={fmtDate(date, { weekday: 'long', month: 'short', day: 'numeric' })} sub={phaseLabel(date, st)}>
      {/* the day before and after */}
      <View style={s.steps}>
        <Step label={nb.prev ? '‹ ' + fmtDate(nb.prev, { weekday: 'short' }) : ''} onPress={() => go(nb.prev)} a11y="The day before" />
        <Step label={nb.next ? fmtDate(nb.next, { weekday: 'short' }) + ' ›' : ''} onPress={() => go(nb.next)} a11y="The day after" />
      </View>

      {/* how it went */}
      <View style={[s.hero, { backgroundColor: bg }]}>
        <Icon name={HEAD[x.kind].ic} size={28} color={ink} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.heroT, { color: ink }]}>{x.head}</Text>
          {stat.length ? <Text style={[s.heroS, { color: ink }]}>{stat.join(' · ')}</Text> : null}
        </View>
      </View>

      {/* what happened */}
      <SheetH title="What happened" />
      {x.events.length ? (
        <Card style={{ gap: 0, paddingVertical: 4 }}>
          {x.events.map((e, i) => (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={e.time + '. ' + e.what + (e.meta ? '. ' + e.meta : '') + '. Open it.'}
              onPress={() => router.push({ pathname: '/entry', params: { date, id: e.id } })}
              style={({ pressed }) => [s.ev, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }, pressed && { opacity: 0.75 }]}>
              <T v="small" style={s.evTime}>
                {e.time}
              </T>
              <View style={[s.evMark, { backgroundColor: e.outcome === 'rode' ? c.mint : c.slip }, e.outcome !== 'rode' && { borderRadius: 3 }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="label">{e.what}</T>
                {e.meta ? (
                  <T v="small" tone="muted">
                    {e.meta}
                  </T>
                ) : null}
                {e.sos.map((l, j) => (
                  <T key={j} v="small" tone="muted">
                    {l}
                  </T>
                ))}
                {e.note ? <T style={s.note}>“{e.note}”</T> : null}
              </View>
              <Icon name="next" size={16} color={c.muted} />
            </Pressable>
          ))}
        </Card>
      ) : (
        <T tone="muted">No urges or slips logged.</T>
      )}
      <Button kind="ghost" label="+ Add an entry" onPress={() => router.push({ pathname: '/entry', params: { date } })} />

      {/* the check-in */}
      <View style={s.secHead}>
        <View style={{ flex: 1 }}>
          <SheetH title="Check-in" />
        </View>
        {x.ci && !editing ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Edit the check-in" onPress={() => setEdit(date)} style={s.editB}>
            <Text style={[s.edit, { color: c.accentText }]}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      {!editing && x.ci ? (
        <Card>
          <Bars ci={x.ci} />
          {facts ? (
            <T v="small" tone="muted">
              {facts}
            </T>
          ) : null}
          {x.ci.n ? <T style={s.note}>“{x.ci.n}”</T> : null}
        </Card>
      ) : (
        <>
          <Card>
            <CheckinBlock key={date} dkey={date} isToday={date === tk} onSaved={() => setEdit(null)} onCancel={() => setEdit(null)} />
          </Card>
          <SheetH title="Night and sleep" />
          <Card>
            <View style={{ gap: 6 }}>
              <YesNo
                label={(x.po ? 'Phone away at ' + fmtClock(x.po) + '. ' : '') + 'Screens off around ' + fmtClock(st.screensOff) + ' that night?'}
                value={ci ? ci.so : null}
                onPick={(v) => {
                  update((s0) => ({ ...s0, days: setScreensOff(s0.days, date, v) }));
                  buzz('tap');
                }}
              />
              <Stepper
                label="Sleep the night before"
                text={ci && ci.h != null ? ci.h.toFixed(1) + ' h' : '–'}
                unset={!ci || ci.h == null}
                less="Less sleep"
                more="More sleep"
                onStep={(d) => update((s0) => ({ ...s0, days: stepSleep(s0.days, date, d * 0.5) }))}
              />
            </View>
          </Card>
        </>
      )}

      {/* the rest of the day */}
      {x.more.length ? (
        <>
          <SheetH title="Also that day" />
          <Card style={{ gap: 10 }}>
            {x.more.map((m) => (
              <View key={m.t} style={s.more}>
                <Icon name={m.ic} size={22} color={c.accentText} />
                <T style={{ flex: 1 }}>{m.t}</T>
              </View>
            ))}
          </Card>
        </>
      ) : null}
      <Dock>
        {/* the check-in's Save is the one filled button while its form is open */}
        <Button kind={editing ? 'ghost' : 'primary'} label="Done" onPress={closeSheet} />
      </Dock>
    </SheetFrame>
  );
}

function Step({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  const c = useTheme();
  if (!label) return <View />;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} style={({ pressed }) => [s.step, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[s.stepT, { color: c.accentText }]}>{label}</Text>
    </Pressable>
  );
}

/* the check-in's answers, as short bars out of 10: mood, urges and stress, and an older day's own ratings (core rateKeys).
   One color: a rating is not good or bad by its hue, and the number says the rest. */
function Bars({ ci }: { ci: Partial<Record<RateKey, number | null>> }) {
  const c = useTheme();
  const { acc } = useChartColors();
  const rows: [string, number | null][] = rateKeys(ci).map((k) => [ratingOf(k).name, ci[k] ?? null]);
  return (
    <View style={{ gap: 8 }}>
      {rows
        .filter((r) => r[1] != null)
        .map(([l, v]) => (
          <View key={l} style={s.bar} accessible accessibilityLabel={l + ' ' + v + ' of 10'}>
            <Text style={[s.barL, { color: c.ink }]}>{l}</Text>
            <View style={[s.track, { backgroundColor: c.surface2 }]}>
              <View style={{ width: ((v as number) / 10) * 100 + '%', height: '100%', borderRadius: 4, backgroundColor: acc }} />
            </View>
            <Text style={[s.barV, { color: c.ink }]}>{v}</Text>
          </View>
        ))}
    </View>
  );
}

const s = StyleSheet.create({
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: -8 },
  step: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  stepT: { fontFamily: font.bodySemi, fontSize: 15 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20 },
  heroT: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  heroS: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  ev: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  evTime: { width: 60, fontFamily: font.bodySemi },
  evMark: { width: 12, height: 12, borderRadius: 6 },
  note: { fontFamily: font.display, fontSize: 15, lineHeight: 21, opacity: 0.85 },
  secHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editB: { minHeight: 44, minWidth: 44, marginVertical: -8, alignItems: 'flex-end', justifyContent: 'center' },
  edit: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  barL: { width: 94, fontFamily: font.bodySemi, fontSize: 15 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barV: { width: 22, textAlign: 'right', fontFamily: font.bodySemi, fontSize: 15 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
