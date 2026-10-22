/* The Sunday review on Today (core: sunday.ts). On Sunday (and on Monday, while last week's is still open) a card asks for
   a few minutes to look back on the week. Once it is done, the goal waits here: on Sunday as the goal for the week ahead,
   and through the week with how it is going when the log can count it ("2 of 5 nights so far"). With it, whatever extras
   the person chose on Sunday: their if-then plan, a word on one of the harder days, and their note to themselves from
   Wednesday on. */
import { isSunday, storyIfLine, SUN_GOALS, sunDue, sunGoalLine, sunGoalNow, sunKey, sunPlanNow, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Icon, T } from '@/components/ui';
import { toneOf, useTheme } from '@/lib/theme';

export function SundayCard({ snap, tk, due: withDue = true }: { snap: Snapshot; tk: string; due?: boolean }) {
  const c = useTheme();
  const st = snap.settings;
  if (!st) return null;
  const due = withDue ? sunDue(snap.reviews, st, tk) : null;
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
              Your week, one thing at a time, and one small goal for the next. +20 points.
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
  const plan = sunPlanNow(snap.reviews, tk);
  const extras = plan ? (
    <>
      {plan.hard ? (
        <Extra
          icon="calendar"
          tone="coral"
          title="Today is one of your harder days"
          text={plan.it ? storyIfLine(plan.it) : 'Plan the hard hours ahead. SOS is one tap.'}
        />
      ) : plan.it ? (
        <Extra icon="compass" tone="violet" title="Your plan this week" text={storyIfLine(plan.it)} />
      ) : null}
      {plan.nt ? <Extra icon="pencil" tone="sun" title="From you, on Sunday" text={'“' + plan.nt + '”'} /> : null}
    </>
  ) : null;
  if (!now) return plan && (plan.hard || plan.it || plan.nt) ? <Card>{extras}</Card> : null;
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
      {extras}
    </Card>
  );
}

/* one of the extras from Sunday: an icon, a small title, and the words */
function Extra({ icon, tone, title, text }: { icon: string; tone: string; title: string; text: string }) {
  const c = useTheme();
  const t = toneOf(c, tone);
  return (
    <View style={s.head}>
      <View style={[s.ic, { backgroundColor: t.soft }]}>
        <Icon name={icon} size={20} color={t.text} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="eyebrow" tone="muted">
          {title}
        </T>
        <T v="label">{text}</T>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ic: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 6, paddingLeft: 52 },
  dot: { flex: 1, maxWidth: 40, height: 10, borderRadius: 5, borderWidth: 1.5 },
});
