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
  rkAskNow,
  rkCard,
  rkEnded,
  rkChoice,
  rkFresh,
  rkKeep,
  rkKeptForNow,
  sortedEvents,
  sumDay,
  withDay,
  type RkAsk,
  type Snapshot,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { BigOption, Link } from '@/components/choices';
import { EntryRows } from '@/components/entry-rows';
import { Missions } from '@/components/rekindle';
import { SunArt } from '@/components/sun-art';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useNow } from '@/lib/now';
import { useSos } from '@/lib/sos';
import { count } from '@/lib/pulse';
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
    count('rk_small');
    say('Good. That is the move.');
  };
  const phoneAway = () => {
    const st = snap.settings;
    if (!st) return;
    const at = clockOf(Date.now());
    count('rk_phone');
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
  /* keep the run going, or start fresh: what was picked, while it can still change (core rkAskNow) */
  const a = rkAskNow(snap.days, st, tk);
  if (!r) return a ? <FreshCard snap={snap} tk={tk} a={a} /> : <RunKeptCard snap={snap} tk={tk} />;
  const k = rkCard(snap.days, st, tk, r, new Date(now).getHours());
  const ask = a && a.k === r.k ? a : null;
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
        </View>
      </View>
      {k.why && !(ask && ask.keep !== true) ? <T>{k.why}</T> : null}
      {ask ? ask.keep == null && !r.m3 ? <RunWait snap={snap} tk={tk} a={ask} sun={sun} /> : <RunChoice snap={snap} tk={tk} a={ask} sun={sun} /> : null}
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

/* the answer to "keep the run going, or start fresh?", while it can still change: unanswered (the app closed in the middle of the
   slip's Rekindle), the same question and two choices; answered, which one, and a quiet link to the other */
function RunChoice({ snap, tk, a, sun }: { snap: Snapshot; tk: string; a: RkAsk; sun?: boolean }) {
  const { update } = useStore();
  /* the morning-after card keeps its light sunrise colors in either theme, so its words do too */
  const lit = sun ? { ink: '#2A2350', muted: '#625A85', link: '#4A33C2' } : null;
  const choose = (keep: boolean) => {
    update((s0) => {
      const d = s0.settings ? rkKeep(s0.days, s0.settings, tk, a.k, a.evId, keep) : null;
      return d ? { ...s0, days: d } : s0;
    });
    buzz('tap');
  };
  if (a.keep == null) {
    const w = rkChoice(snap.days, snap.settings!, tk, a);
    return (
      <View style={{ gap: 10 }}>
        <T v="label" style={lit ? { color: lit.ink } : undefined}>
          {'Keep your ' + a.run + '-day run going, or start fresh? ' + w.line}
        </T>
        <BigOption tone="sun" icon="flame" title="Keep it going" sub={w.keep} onPress={() => choose(true)} />
        <BigOption tone="mint" icon="sparkle" title="Start fresh" sub={w.fresh} onPress={() => choose(false)} />
      </View>
    );
  }
  const f = a.keep ? null : rkFresh(snap.days, snap.settings!, tk, a);
  return (
    <View style={{ gap: 2 }}>
      <T v="small" tone="muted" style={lit ? { color: lit.muted } : undefined}>
        {f ? 'You chose to start fresh. ' + f.b + ' ' + f.rest : 'You chose to keep it going.'}
      </T>
      <View style={{ alignItems: 'flex-start', marginLeft: -6 }}>
        <Link label={a.keep ? 'Start fresh instead' : 'Keep my run going instead'} color={lit?.link} onPress={() => choose(!a.keep)} />
      </View>
    </View>
  );
}

/* the question not answered yet, before the sunrise check: the run is kept for now and the sunrise check asks, so the night
   of a slip is not a night for deciding about a count. A quiet link opens the question for someone who wants to decide now. */
function RunWait({ snap, tk, a, sun }: { snap: Snapshot; tk: string; a: RkAsk; sun?: boolean }) {
  const [open, setOpen] = useState(false);
  if (open) return <RunChoice snap={snap} tk={tk} a={a} sun={sun} />;
  const w = rkKeptForNow(a, tk);
  return (
    <View style={{ gap: 2 }}>
      <T style={sun ? { color: '#2A2350' } : undefined}>
        <T v="label" style={sun ? { color: '#2A2350' } : undefined}>
          {w.b}
        </T>{' '}
        {w.rest}
      </T>
      <View style={{ alignItems: 'flex-start', marginLeft: -6 }}>
        <Link label="Decide now" color={sun ? '#4A33C2' : undefined} onPress={() => setOpen(true)} />
      </View>
    </View>
  );
}

/* after the first day of a fresh start, Today has no quest card, but the answer can still change until the window closes */
function FreshCard({ snap, tk, a }: { snap: Snapshot; tk: string; a: RkAsk }) {
  const c = useTheme();
  return (
    <View style={[s.card, { borderColor: c.cardEdge, backgroundColor: c.surface }]} accessibilityRole="summary">
      <View style={[s.top, { alignItems: 'center' }]}>
        <View style={[s.ico, { backgroundColor: c.mintSoft }]}>
          <Icon name="sparkle" size={22} color={c.mintText} />
        </View>
        <T v="h2" style={{ flex: 1 }} accessibilityRole="header">
          {a.keep === false ? 'A fresh start' : 'Your ' + a.run + '-day run'}
        </T>
      </View>
      <RunChoice snap={snap} tk={tk} a={a} />
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
