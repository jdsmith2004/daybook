/* PROTOTYPE (mockups only, not for merge): what Today holds under Your day, from the person's own words and record. ?below=1 on the
   web turns it on. Today so far (the day's entries, which only Journal shows now), Tonight's plan (the if-then lines from My plan,
   with the hard hours), and who you are becoming (the sentence from the end of setup, with one true line from the log). */
import { addDays, eventRow, eventsOf, fmtDate, planBlank, riskWindow, sortedEvents, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Shape } from '@/components/shapes';
import { Text } from '@/components/text';
import { TonightCard } from '@/components/tonight-card';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font, useTheme } from '@/lib/theme';

const q = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : null;
export const BELOW = q?.get('below') === '1';
/** ?blank=1: a person who skipped the becoming sentence and the plan */
export const BLANK = BELOW && q?.get('blank') === '1';

const go = (p: string) => {
  buzz('tap');
  router.push(p as never);
};

/** the latest urge ridden out in the last two weeks, said as a moment ("Tuesday at 9:30 PM, you rode out an urge."), and how many in all */
function proofOf(snap: Snapshot, tk: string) {
  const st = snap.settings!;
  const all = eventsOf(snap.days).filter((e) => e.outcome === 'rode' && e.key <= tk);
  if (!all.length) return null;
  /* one ridden out today is already in Today so far: say who that makes them instead */
  if (all[all.length - 1].key === tk) return { t: 'You are someone who rides out urges:', n: all.length + '\u00a0times\u00a0now.' };
  const last = all.filter((e) => e.key >= addDays(tk, -13)).pop();
  if (!last) return null;
  const when = last.key === tk ? 'Today' : last.key === addDays(tk, -1) ? 'Yesterday' : fmtDate(last.key, { weekday: 'long' });
  const at = last.time ? ' at ' + eventRow(last, st).time : '';
  return {
    t: 'You rode out an urge ' + (when === 'Today' || when === 'Yesterday' ? when.toLowerCase() : when) + at + '.',
    n: all.length === 1 ? 'Your\u00a0first.' : all.length + '\u00a0times\u00a0now.',
  };
}

/** the two lines of the urge plan that fit tonight: the one for late at night when the hard hours are late, and the one for the
    feeling that comes before a slip most often (or an urge, when there is no slip), each cut to its first sentence */
function planTonight(snap: Snapshot, tk: string) {
  const st = snap.settings!;
  const rows = (st.plan || []).filter((p) => !planBlank(p) && p.then.trim());
  const win = riskWindow(snap.days, st, tk);
  const out: typeof rows = [];
  const add = (re: RegExp) => {
    const r = rows.find((p) => re.test(p.when) && !out.includes(p));
    if (r) out.push(r);
  };
  if (win && (win.start >= 20 || win.start < 4)) add(/\b(bed|night|late)\b/i);
  const ev = eventsOf(snap.days, addDays(tk, -59)).filter((e) => e.trigger);
  const tally: Record<string, number> = {};
  ev.forEach((e) => (tally[e.trigger!.toLowerCase()] = (tally[e.trigger!.toLowerCase()] || 0) + (e.outcome === 'slipped' ? 3 : 1)));
  Object.keys(tally)
    .sort((a, b) => tally[b] - tally[a])
    .forEach((t) => out.length < 2 && add(new RegExp('\\b' + t + '\\b', 'i')));
  rows.forEach((p) => out.length < 2 && !out.includes(p) && out.push(p));
  return out.map((p) => ({ when: p.when, then: p.then.trim().split(/(?<=[.!?])\s+/)[0] }));
}

export function TodayBelow({ snap, tk, now }: { snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const st = snap.settings!;
  const evs = sortedEvents(snap.days[tk], st.rollover);
  const plan = BLANK ? [] : planTonight(snap, tk);
  const all = (st.plan || []).filter((p) => !planBlank(p) && p.then.trim()).length;
  const be = BLANK ? '' : String(st.becoming || '').trim();
  const win = riskWindow(snap.days, st, tk);
  const proof = proofOf(snap, tk);
  return (
    <View style={s.all}>
      {evs.length ? (
        <View style={s.sec}>
          <T v="h2" style={s.pad}>
            Today so far
          </T>
          {evs.map((e) => {
            const r = eventRow(e, st);
            const rode = e.outcome === 'rode';
            return (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                onPress={() => go('/entry?date=' + tk + '&id=' + e.id)}
                style={({ pressed }) => [s.moment, { opacity: pressed ? 0.8 : 1 }]}>
                <Shape kind={rode ? 'cookie12' : 'clover4'} size={52} color={rode ? c.mint : c.slip} turn={rode ? 0 : 0.1}>
                  <Icon name={rode ? 'wave' : 'leaf'} size={24} color={c.bg} />
                </Shape>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="label">{rode ? 'Rode out an urge' : 'Logged a slip'}</T>
                  <T v="small" tone="muted">
                    {[r.time, e.m ? e.m + ' minutes' : '', (e.did || [])[0] || r.meta].filter(Boolean).join(' · ')}
                  </T>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {win && plan.length ? <TonightCard start={win.start} label={win.label} lines={plan} more={all > plan.length ? all : 0} now={now} /> : null}
      {win && plan.length ? null : (
        <View style={[s.card, { backgroundColor: c.surface }]}>
          <View style={s.cardHead}>
            <Icon name="moon" size={20} color={c.ink} />
            <Text style={[s.cardH, { color: c.ink }]}>{win ? 'Tonight, ' + win.label : 'If it gets hard tonight'}</Text>
          </View>
          {plan.length ? (
            plan.map((p, i) => (
              <Pressable key={i} accessibilityRole="button" onPress={() => go('/plan')} style={({ pressed }) => [s.line, { opacity: pressed ? 0.8 : 1 }]}>
                <T v="small" tone="muted">
                  When {p.when.replace(/^when\s+/i, '').replace(/^I am\b/, 'I am')}
                </T>
                <T style={[s.then, { color: c.ink }]}>{p.then}</T>
              </Pressable>
            ))
          ) : (
            <Pressable accessibilityRole="button" onPress={() => go('/talk')} style={({ pressed }) => [s.line, { opacity: pressed ? 0.8 : 1 }]}>
              <T style={[s.then, { color: c.ink }]}>Make a plan, while it is calm</T>
            </Pressable>
          )}
          {plan.length && all > plan.length ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => go('/plan')}
              style={({ pressed }) => [s.foot, { borderTopColor: c.line, opacity: pressed ? 0.8 : 1 }]}>
              <T v="label" tone="accentText" style={{ flex: 1 }}>
                Your whole plan
              </T>
              <Icon name="next" size={16} color={c.accentText} />
            </Pressable>
          ) : null}
        </View>
      )}

      <Pressable accessibilityRole="button" onPress={() => go('/plan')} style={({ pressed }) => [s.be, { opacity: pressed ? 0.85 : 1 }]}>
        <T v="small" tone="muted">
          Who you are becoming
        </T>
        <Text style={[s.beT, { color: be ? c.sunText : c.accentText }, !be && { fontSize: 28, lineHeight: 34 }]}>{be || 'Write it in one sentence'}</Text>
        {proof ? (
          <View style={s.proof}>
            <Text style={[s.proofT, { color: c.muted }]}>
              {proof.t} <Text style={{ color: c.mintText, fontFamily: font.bodySemi }}>{proof.n}</Text>
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  all: { gap: 32, paddingTop: 8 },
  sec: { gap: 12 },
  pad: {},
  moment: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 56 },
  card: { borderRadius: 20, padding: 16, paddingBottom: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  cardH: { fontFamily: font.display, fontSize: 20, lineHeight: 25 },
  line: { gap: 2, paddingVertical: 8 },
  then: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  foot: { flexDirection: 'row', alignItems: 'center', minHeight: 48, marginTop: 4, borderTopWidth: StyleSheet.hairlineWidth },
  be: { gap: 8, paddingBottom: 16 },
  beT: { fontFamily: font.display, fontSize: 34, lineHeight: 41 },
  proof: { marginTop: 4 },
  proofT: { fontFamily: font.body, fontSize: 15, lineHeight: 21 },
});
