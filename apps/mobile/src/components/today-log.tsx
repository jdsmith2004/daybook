/* Today, after logging: the Rekindle card (the quest the day of a slip, the sunrise check the morning after), today's entries,
   the care card after a slip, and the link to log something. Words from @daybook/core. */
import {
  blankP,
  changeDay,
  clockOf,
  fmtClock,
  countText,
  eventRow,
  gameCompute,
  GRAD_DAYS,
  rkActive,
  rkCard,
  rkEnded,
  slipCare,
  sortedEvents,
  sumDay,
  withDay,
  type Snapshot,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EntryRows } from '@/components/entry-rows';
import { Flames, Missions } from '@/components/rekindle';
import { SunArt } from '@/components/sun-art';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useNow } from '@/lib/now';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/* the actions a mission or a card can ask for */
export function useLogActions() {
  const { snap, tk, now, update, say } = useStore();
  const didSmall = (k: string) => {
    update((s) => {
      const day = changeDay(s.days[k], k, (d) => d.events.forEach((x) => x.outcome === 'slipped' && (x.recovered = true)));
      return { ...s, days: withDay(s.days, k, day) };
    });
    buzz('save');
    say('Good. That is the move.');
  };
  const phoneAway = () => {
    const st = snap.settings;
    if (!st) return;
    const at = clockOf(Date.now());
    const b0 = gameCompute(snap.days, st, snap.reviews, tk).pts;
    const next = update((s) => {
      const day = changeDay(s.days[tk], tk, (d) => {
        const p = d.p || blankP();
        p.po = at;
        d.p = p;
      });
      return { ...s, days: withDay(s.days, tk, day) };
    });
    const gain = Math.max(0, gameCompute(next.days, next.settings!, next.reviews, tk).pts - b0);
    buzz('save');
    router.push({ pathname: '/night', params: { at, gain: String(gain) } });
  };
  const act = (a: string, k: string) => {
    if (a === 'small') didSmall(k);
    else if (a === 'phone') phoneAway();
    else if (a === 'trace' || a === 'tell') router.push({ pathname: '/deeper', params: { k, kind: a } });
  };
  return { act, didSmall, phoneAway, now };
}

export function RekindleCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const { act, now } = useLogActions();
  const st = snap.settings!;
  const r = rkActive(snap.days, st, tk);
  if (!r) return <RunKeptCard snap={snap} tk={tk} />;
  const k = rkCard(snap.days, st, tk, r, new Date(now).getHours());
  const colors: [string, string] = k.kind === 'sun' ? ['#FFD9B4', '#FFF3DE'] : k.line ? [c.slipSoft, c.surface] : [c.sunSoft, c.surface];
  const sun = k.kind === 'sun';
  const ink = sun ? '#2A2350' : undefined;
  return (
    <View style={[s.card, { borderColor: k.line ? c.slip : sun ? '#F6D2A6' : c.cardEdge }]} accessibilityRole="summary">
      <LinearGradient colors={colors} locations={[0, 0.72]} style={StyleSheet.absoluteFill} />
      {sun ? <SunArt height={120} /> : null}
      <View style={s.top}>
        {sun ? null : (
          <View style={[s.ico, { backgroundColor: k.line ? c.slip : c.sun }]}>
            <Icon name={k.icon} size={22} color={k.line ? '#FFFFFF' : c.onSun} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <T v="h2" style={ink ? { color: ink } : undefined} accessibilityRole="header">
            {k.h}
          </T>
          <T v="small" tone="muted" style={sun ? { color: '#625A85' } : undefined}>
            {k.p}
          </T>
          <View style={{ alignItems: 'flex-start' }}>
            <Flames on={k.flames} />
          </View>
        </View>
      </View>
      {k.why ? <T>{k.why}</T> : null}
      {k.sunrise ? <Button label="Start my sunrise check" icon="sunrise" onPress={() => router.push('/sunrise')} /> : null}
      {k.missions.length ? <Missions list={k.missions} onAction={(_m, a) => act(a, r.k)} /> : null}
      {k.quote ? (
        <View style={[s.quote, { backgroundColor: c.surface, borderColor: c.line }]}>
          <T>
            <T v="label" tone="sunText">
              If
            </T>{' '}
            {k.quote.when},{' '}
            <T v="label" tone="sunText">
              then
            </T>{' '}
            {k.quote.then}
          </T>
        </View>
      ) : null}
      {k.care.length ? (
        <View style={{ gap: 4 }}>
          <T v="label" tone="sunText">
            My slip plan
          </T>
          {k.care.map((t, i) => (
            <T key={i} v="small">{`${i + 1}. ${t}`}</T>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* the morning a run ends (the quest closed with steps left, or a second slip within a week): what was built, said once, so a
   run never just disappears (core rkEnded) */
function RunKeptCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const e = rkEnded(snap.days, snap.settings!, tk);
  if (!e) return null;
  return (
    <View style={[s.card, { borderColor: c.cardEdge, backgroundColor: c.surface }]} accessibilityRole="summary">
      <View style={[s.top, { alignItems: 'center' }]}>
        <View style={[s.ico, { backgroundColor: c.sunSoft }]}>
          <Icon name="flame" size={22} color={c.sunText} />
        </View>
        <T v="h2" style={{ flex: 1 }} accessibilityRole="header">
          {'Your ' + e.run + (e.run === 1 ? ' day is kept' : ' days are kept')}
        </T>
      </View>
      <T tone="muted">{e.text}</T>
      <View style={s.chips}>
        <View style={[s.chip, { backgroundColor: c.sunSoft }]}>
          <Text style={[s.chipT, { color: c.sunText }]}>{'Longest run: ' + e.longest + (e.longest === 1 ? ' day' : ' days')}</Text>
        </View>
        {e.grad != null ? (
          <View style={[s.chip, { backgroundColor: c.accentSoft }]}>
            <Text style={[s.chipT, { color: c.accentText }]}>{'Graduation: ' + e.grad + ' of ' + GRAD_DAYS}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

/* the link under the flame: for when it already happened */
/* the one button that matters most: SOS, when an urge is happening right now (legacy hx-urge). Under it,
   two quieter ones for the other times: it already happened (log it), or a slip is being planned (Talk it through). */
export function LogLink() {
  const c = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="SOS. I am having an urge. Tap for help right now."
        onPress={() => router.push('/sos')}
        style={({ pressed }) => [
          s.sos,
          { backgroundColor: c.sos, shadowColor: c.sosDeep, shadowOffset: { width: 0, height: pressed ? 1 : 5 }, transform: [{ translateY: pressed ? 4 : 0 }] },
        ]}>
        <View style={[s.sosIc, { backgroundColor: c.sosSoft }]}>
          <Icon name="life" size={28} color={c.sosInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.sosB, { color: c.sosInk }]}>SOS</Text>
          <Text style={[s.sosS, { color: c.sosInk }]}>I am having an urge</Text>
        </View>
        <Icon name="next" size={22} color={c.sosInk} />
      </Pressable>
      {/* the other two times: it already happened, or it is being planned (Talk it through) */}
      <View style={s.pair}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Already happened? Log what happened."
          onPress={() => router.push('/log')}
          style={({ pressed }) => [s.log, { backgroundColor: c.surface, borderColor: c.cardEdge, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[s.logT, { color: c.accentText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            Already happened
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Planning a slip? Talk it through first."
          onPress={() => router.push('/talk')}
          style={({ pressed }) => [s.log, { backgroundColor: c.violetSoft, borderColor: c.violetSoft, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[s.logT, { color: c.violetText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            Planning a slip?
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* a pause in progress (or one that just ended) keeps a banner on Today, so it is one tap back (legacy timerBanner) */
export function PauseBanner() {
  const c = useTheme();
  const sos = useSos();
  const now = useNow(1000);
  const t = sos.timer;
  if (!t) return null;
  const left = t.start + t.dur - now;
  const done = left <= 0;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/tool/[id]', params: { id: 'pause' } })}
      style={[s.banner, { backgroundColor: done ? c.mintSoft : c.violetSoft }]}>
      <T v="label" style={{ flex: 1, color: done ? c.mintText : c.violetText }}>
        {done
          ? (t.early ? 'Your pause ended' : 'Your 10-minute pause finished') + ' at ' + fmtClock(clockOf(t.start + t.dur)) + '.'
          : 'Pause in progress · about ' + Math.max(1, Math.ceil(left / 60000)) + ' min left'}
      </T>
      <View style={[s.bannerBtn, { backgroundColor: c.surface }]}>
        <Text style={{ fontFamily: font.bodySemi, color: done ? c.mintText : c.violetText, fontSize: 15 }}>{done ? 'See how it went' : 'Resume'}</Text>
      </View>
    </Pressable>
  );
}

/* today's entries */
export function TodaySoFar({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const st = snap.settings!;
  const day = snap.days[tk];
  const sum = sumDay(day);
  if (!sum.n) return null;
  const ct = countText(sum);
  return (
    <Card>
      <View style={s.between}>
        <T v="h2">Today so far</T>
        <T v="small" tone="muted">
          {ct.n}
        </T>
      </View>
      <T v="small" tone="muted">
        {ct.detail}
      </T>
      <EntryRows date={tk} />
    </Card>
  );
}

/* after a slip that has no quest (not the first in 7 days): the slip plan, and one small thing */
export function CareCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const { didSmall } = useLogActions();
  const st = snap.settings!;
  const day = snap.days[tk];
  if (!sumDay(day).slipped || rkActive(snap.days, st, tk)) return null;
  const open = (day?.events || []).some((e) => e.outcome === 'slipped' && !e.recovered);
  const care = slipCare(st);
  return (
    <Card tone="note">
      <T v="h2">After a slip</T>
      <T>Logged. That took honesty. Nothing resets: your points, badges, check-ins and longest streak all stay.</T>
      {care.map((t, i) => (
        <T key={i} v="small">{`${i + 1}. ${t}`}</T>
      ))}
      {open ? (
        <Button label="I did one small thing" kind="ghost" onPress={() => didSmall(tk)} />
      ) : (
        <T v="label" tone="mintText">
          ✓ One small thing done.
        </T>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 2, padding: 16, gap: 12, overflow: 'hidden' },
  top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ico: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quote: { padding: 12, borderRadius: 14, borderWidth: 1.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  chipT: { fontFamily: font.bodyBold, fontSize: 13 },
  pair: { flexDirection: 'row', gap: 8 },
  log: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 52,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 2,
  },
  logT: { fontFamily: font.bodySemi, fontSize: 14, flexShrink: 1, textAlign: 'center' },
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 72,
    paddingVertical: 11,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 22,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  sosIc: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sosB: { fontFamily: font.display, fontSize: 28, letterSpacing: 1.5, lineHeight: 30 },
  sosS: { fontFamily: font.bodyMedium, fontSize: 13.5, marginTop: 2, opacity: 0.95 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingLeft: 14, paddingRight: 10, borderRadius: 16 },
  bannerBtn: { minHeight: 40, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  mark: { width: 12, height: 12, borderRadius: 6 },
});
