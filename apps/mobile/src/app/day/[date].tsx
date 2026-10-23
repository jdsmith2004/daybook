/* One day (core: calendar.ts, daySummary), opened from the month calendar, the Journal list or Today's week dots. It shows the
   day first, at a glance: how it went, what happened (each entry with its time, what set it off, what helped, what SOS
   kept and any note), the check-in as small bars, and the rest of the day (tools, lessons, a talk-through, phone away).
   Editing is one tap away: an entry opens its own sheet, and Edit opens the check-in and that night's screens-off and
   sleep. ‹ and › step to the day before and after. Ported from the legacy sheetDay, and made to be read. */
import { calNeighbors, daySummary, fmtClock, fmtDate, isKey, phaseLabel, setScreensOff, stepSleep, type CalKind } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { CheckinBlock } from '@/components/checkin';
import { Stepper, YesNo } from '@/components/form';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Dock } from '@/components/scene';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme, type Palette } from '@/lib/theme';

const HEAD: Record<CalKind, { ic: string; tone: (c: Palette) => [string, string] }> = {
  ok: { ic: 'check', tone: (c) => [c.mintSoft, c.mintText] },
  one: { ic: 'leaf', tone: (c) => [c.slipSoft, c.slipText] },
  saved: { ic: 'leaf', tone: (c) => [c.slipSoft, c.slipText] },
  open: { ic: 'leaf', tone: (c) => [c.slipSoft, c.slipText] },
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
        <View style={[s.heroIc, { backgroundColor: c.surface }]}>
          <Icon name={HEAD[x.kind].ic} size={26} color={ink} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.heroT, { color: ink }]}>{x.head}</Text>
          {stat.length ? <Text style={[s.heroS, { color: ink }]}>{stat.join(' · ')}</Text> : null}
        </View>
      </View>

      {/* what happened */}
      <SheetH title="What happened" aside={x.events.length ? String(x.events.length) : undefined} />
      {x.events.length ? (
        <Card style={{ gap: 0, paddingVertical: 4 }}>
          {x.events.map((e, i) => (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={e.time + '. ' + e.what + (e.meta ? '. ' + e.meta : '') + '. Open it.'}
              onPress={() => router.push({ pathname: '/entry', params: { date, id: e.id } })}
              style={({ pressed }) => [s.ev, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }, pressed && { opacity: 0.75 }]}>
              <View style={{ alignItems: 'center', gap: 6, width: 64 }}>
                <Text style={[s.evTime, { color: c.ink }]}>{e.time}</Text>
                <View style={[s.evMark, { backgroundColor: e.outcome === 'rode' ? c.mint : c.slip }]}>
                  <Icon name={e.outcome === 'rode' ? 'wave' : 'leaf'} size={14} color="#FFFFFF" />
                </View>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <T v="label">{e.what}</T>
                {e.meta ? (
                  <T v="small" tone="muted">
                    {e.meta}
                  </T>
                ) : null}
                {e.sos.map((l, j) => (
                  <T key={j} v="small" tone="violetText">
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
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setEdit(date)}>
            <Text style={[s.edit, { color: c.accentText }]}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      {!editing && x.ci ? (
        <Card>
          <Bars ci={x.ci} />
          <View style={s.facts}>
            {x.ci.h != null ? <Fact ic="moon" t={'Slept ' + x.ci.h + ' h'} /> : null}
            {x.ci.so ? <Fact ic="phone" t={x.ci.so === 'Y' ? 'Screens off on time' : x.po ? 'Picked the phone back up' : 'Screens on late'} /> : null}
            {x.ci.ro === 'Y' ? <Fact ic="heart" t="Reached out" /> : null}
          </View>
          {x.ci.n ? <T style={s.note}>“{x.ci.n}”</T> : null}
        </Card>
      ) : (
        <>
          <Card>
            <CheckinBlock dkey={date} isToday={date === tk} />
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
                <View style={[s.moreIc, { backgroundColor: c.accentSoft }]}>
                  <Icon name={m.ic} size={16} color={c.accentText} />
                </View>
                <T style={{ flex: 1 }}>{m.t}</T>
              </View>
            ))}
          </Card>
        </>
      ) : null}
      <Dock>
        <Button label="Done" onPress={closeSheet} />
      </Dock>
    </SheetFrame>
  );
}

function Step({ label, onPress, a11y }: { label: string; onPress: () => void; a11y: string }) {
  const c = useTheme();
  if (!label) return <View />;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} hitSlop={8} onPress={onPress} style={[s.step, { backgroundColor: c.surface2 }]}>
      <Text style={[s.stepT, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

/* the check-in's four answers, as short bars out of 10 */
function Bars({ ci }: { ci: { m: number | null; c: number | null; e: number | null; s: number | null } }) {
  const c = useTheme();
  const rows: [string, number | null, string][] = [
    ['Motivation', ci.m, c.mint],
    ['Connection', ci.c, c.sky],
    ['Energy', ci.e, c.sun],
    ['Stress', ci.s, c.coral],
  ];
  return (
    <View style={{ gap: 8 }}>
      {rows
        .filter((r) => r[1] != null)
        .map(([l, v, col]) => (
          <View key={l} style={s.bar} accessible accessibilityLabel={l + ' ' + v + ' of 10'}>
            <Text style={[s.barL, { color: c.ink }]}>{l}</Text>
            <View style={[s.track, { backgroundColor: c.surface2 }]}>
              <View style={{ width: ((v as number) / 10) * 100 + '%', height: '100%', borderRadius: 5, backgroundColor: col }} />
            </View>
            <Text style={[s.barV, { color: c.ink }]}>{v}</Text>
          </View>
        ))}
    </View>
  );
}

function Fact({ ic, t }: { ic: string; t: string }) {
  const c = useTheme();
  return (
    <View style={[s.fact, { backgroundColor: c.surface2 }]}>
      <Icon name={ic} size={14} color={c.ink} />
      <Text style={[s.factT, { color: c.ink }]}>{t}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  steps: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  step: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  stepT: { fontFamily: font.bodySemi, fontSize: 14 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22 },
  heroIc: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroT: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
  heroS: { fontFamily: font.bodySemi, fontSize: 14.5 },
  ev: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  evTime: { fontFamily: font.bodyBold, fontSize: 13.5 },
  evMark: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  note: { fontFamily: font.display, fontSize: 15.5, lineHeight: 21, opacity: 0.85 },
  secHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  edit: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline', paddingBottom: 2 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barL: { width: 94, fontFamily: font.bodySemi, fontSize: 14 },
  track: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  barV: { width: 22, textAlign: 'right', fontFamily: font.bodyBold, fontSize: 14 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  factT: { fontFamily: font.bodySemi, fontSize: 13 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moreIc: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
