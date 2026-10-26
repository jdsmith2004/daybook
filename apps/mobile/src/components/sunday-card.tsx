/* The week's goal from Sunday, in Pattern, Days (core: sunday.ts). The review itself is Today's card on Sunday and Monday
   (core moment.ts), and Today's standing row keeps one line of the goal ("2 of 5 nights this week"). Here: on Sunday the
   goal for the week ahead, and through the week how it is going when the log can count it. With it, whatever extras the
   person chose on Sunday: their if-then plan, a word on one of the harder days, and their note to themselves from
   Wednesday on. */
import { isSunday, storyIfLine, SUN_GOALS, sunGoalLine, sunGoalNow, sunKey, sunPlanNow, type Snapshot } from '@daybook/core';
import { StyleSheet, View } from 'react-native';

import { Card, Icon, T } from '@/components/ui';
import { toneOf, useTheme } from '@/lib/theme';

export function SundayCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const st = snap.settings;
  if (!st) return null;
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
