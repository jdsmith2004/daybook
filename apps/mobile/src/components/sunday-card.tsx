/* The Sunday review on Today (core: sunday.ts). On Sunday (and on Monday, while last week's is still open) a card asks for
   two minutes: what worked, what to change, and one small goal. Once it is done, the goal waits here: on Sunday as the
   goal for the week ahead, and through the week with how it is going when the log can count it ("2 of 5 nights so
   far"). */
import { isSunday, SUN_GOALS, sunDue, sunGoalLine, sunGoalNow, sunKey, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Icon, T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

export function SundayCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const st = snap.settings;
  if (!st) return null;
  const due = sunDue(snap.reviews, st, tk);
  if (due)
    return (
      <Card style={{ backgroundColor: c.sunSoft, borderColor: c.sun }}>
        <View style={s.head}>
          <View style={[s.ic, { backgroundColor: c.sun }]}>
            <Icon name="calendar" size={20} color={c.onSun} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="label">{due.late ? 'Last week’s review is still open' : 'Your Sunday review'}</T>
            <T v="small" tone="muted">
              Two minutes: what worked, what to change, and one small goal. +20 points.
            </T>
          </View>
        </View>
        <Button
          label={due.late ? 'Look back on last week' : 'Look back on my week'}
          onPress={() => router.push({ pathname: '/review', params: { s: due.sun } })}
        />
      </Card>
    );
  /* on Sunday, once the review is done, the goal just set is for the week ahead */
  const ahead = isSunday(tk) ? snap.reviews[sunKey(tk)]?.sun?.g : null;
  if (ahead)
    return (
      <Card>
        <View style={s.head}>
          <View style={[s.ic, { backgroundColor: c.sunSoft }]}>
            <Icon name="flag" size={20} color={c.sunText} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="eyebrow" tone="muted">
              Your goal for the week ahead
            </T>
            <T v="label">{ahead.t}</T>
            <T v="small" tone="muted">
              It starts tomorrow. Small steps count.
            </T>
          </View>
        </View>
      </Card>
    );
  const now = sunGoalNow(snap.days, snap.reviews, tk);
  if (!now) return null;
  const k = now.g.k ? SUN_GOALS[now.g.k] : null;
  const frac = now.done != null && now.g.n ? Math.min(1, now.done / now.g.n) : null;
  return (
    <Card>
      <View style={s.head}>
        <View style={[s.ic, { backgroundColor: c.sunSoft }]}>
          <Icon name="flag" size={20} color={c.sunText} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="eyebrow" tone="muted">
            This week’s goal
          </T>
          <T v="label">{now.g.t}</T>
          {now.done != null ? (
            <T v="small" tone={frac === 1 ? 'mintText' : 'muted'}>
              {sunGoalLine(now.g, now.done, false)}
            </T>
          ) : (
            <T v="small" tone="muted">
              Set on Sunday. Small steps count.
            </T>
          )}
        </View>
      </View>
      {frac != null && k ? (
        <View style={s.dots} accessibilityLabel={now.done + ' of ' + now.g.n + ' ' + k.unit}>
          {Array.from({ length: now.g.n! }, (_, i) => (
            <View key={i} style={[s.dot, { backgroundColor: i < now.done! ? c.mint : c.surface2, borderColor: i < now.done! ? c.mint : c.line }]} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ic: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, paddingLeft: 52 },
  dot: { flex: 1, maxWidth: 40, height: 10, borderRadius: 5, borderWidth: 1.5 },
});
