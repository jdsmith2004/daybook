/* PROTOTYPE (mockups only, not for merge): what Today holds under Your day, from the person's own words and record. ?below=1 on the
   web turns it on. Today so far (the day's entries, which only Journal shows now), Tonight's plan (the if-then lines from My plan,
   with the hard hours), and who you are becoming (the sentence from the end of setup, with one true line from the log). */
import { addDays, eventRow, eventsOf, fmtDate, planBlank, riskWindow, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { EntryRows } from '@/components/entry-rows';
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

/** the latest urge ridden out in the last two weeks, said as a moment: "Tuesday at 9:30 PM, you rode out an urge." */
function proofOf(snap: Snapshot, tk: string) {
  const st = snap.settings!;
  const all = eventsOf(snap.days).filter((e) => e.outcome === 'rode' && e.key <= tk);
  const last = all.filter((e) => e.key >= addDays(tk, -13)).pop();
  if (!last) return null;
  const when = last.key === tk ? 'Today' : last.key === addDays(tk, -1) ? 'Yesterday' : fmtDate(last.key, { weekday: 'long' });
  const at = last.time ? ' at ' + eventRow(last, st).time : '';
  return when + at + ', you rode out an urge. You have done it ' + all.length + ' times.';
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

export function TodayBelow({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const st = snap.settings!;
  const n = (snap.days[tk]?.events || []).length;
  const plan = BLANK ? [] : planTonight(snap, tk);
  const all = (st.plan || []).filter((p) => !planBlank(p) && p.then.trim()).length;
  const be = BLANK ? '' : String(st.becoming || '').trim();
  const win = riskWindow(snap.days, st, tk);
  const proof = proofOf(snap, tk);
  return (
    <View style={s.all}>
      {n ? (
        <View style={s.sec}>
          <View style={s.head}>
            <T v="h2">Today so far</T>
            <T v="small" tone="muted">
              {n === 1 ? '1 entry' : n + ' entries'}
            </T>
          </View>
          <EntryRows date={tk} />
        </View>
      ) : null}

      <View style={s.sec}>
        <View style={s.head}>
          <T v="h2">If it gets hard tonight</T>
          {win ? (
            <T v="small" tone="muted">
              {win.label}
            </T>
          ) : null}
        </View>
        {plan.length ? (
          <View>
            {plan.map((p, i) => (
              <Pressable
                key={i}
                accessibilityRole="button"
                onPress={() => go('/plan')}
                style={({ pressed }) => [s.row, { borderTopColor: c.line, opacity: pressed ? 0.75 : 1 }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="small" tone="muted">
                    When {p.when.replace(/^when\s+/i, '')}
                  </T>
                  <T v="label">{p.then}</T>
                </View>
                <Icon name="next" size={16} color={c.muted} />
              </Pressable>
            ))}
            {all > plan.length ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => go('/plan')}
                style={({ pressed }) => [s.row, { borderTopColor: c.line, minHeight: 48, opacity: pressed ? 0.75 : 1 }]}>
                <T v="label" tone="accentText" style={{ flex: 1 }}>
                  Your whole plan
                </T>
                <T v="small" tone="muted">
                  {all} lines
                </T>
                <Icon name="next" size={16} color={c.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => go('/talk')}
            style={({ pressed }) => [s.row, { borderTopColor: c.line, opacity: pressed ? 0.75 : 1 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="label">Make a plan for tonight</T>
              <T v="small" tone="muted">
                Two minutes now, while it is calm.
              </T>
            </View>
            <Icon name="next" size={16} color={c.muted} />
          </Pressable>
        )}
      </View>

      <Pressable accessibilityRole="button" onPress={() => go('/plan')} style={({ pressed }) => [s.be, { opacity: pressed ? 0.8 : 1 }]}>
        {be ? (
          <>
            <T v="small" tone="muted">
              You said
            </T>
            <T style={[s.beT, { color: c.ink }]}>{be}</T>
          </>
        ) : (
          <>
            <T style={[s.beT, { color: c.ink }]}>Who are you becoming?</T>
            <T v="label" tone="accentText">
              Say it in one sentence
            </T>
          </>
        )}
        {proof ? (
          <T tone="muted" style={s.proof}>
            {proof}
          </T>
        ) : null}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  all: { gap: 32, paddingTop: 8 },
  sec: { gap: 8 },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 4, borderTopWidth: 1, minHeight: 56 },
  be: { gap: 8, paddingHorizontal: 4, paddingBottom: 16 },
  beT: { fontFamily: font.display, fontSize: 34, lineHeight: 40 },
  proof: { fontSize: 15, lineHeight: 21, marginTop: 4 },
});
