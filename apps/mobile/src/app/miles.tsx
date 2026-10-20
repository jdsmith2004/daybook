/* Milestones: your flame and its twelve forms, how points work, and your badges. Ported from the legacy
   viewMiles and rewardsBody. */
import {
  badgeDone,
  fmtDate,
  gameCompute,
  GRAD_ABOUT,
  GRAD_DAYS,
  gradInfo,
  gradLine,
  hoursBack,
  identityLines,
  LEVELS,
  nextLine,
  shownBadges,
  STAGES,
  stageLevel,
  stagePts,
  stageState,
  STEPS,
} from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { BadgeArt } from '@/components/celebrate';
import { Flame } from '@/components/flame';
import { GradCap, GradFlame } from '@/components/grad';
import { Collapse } from '@/components/form';
import { PointsList } from '@/components/points-list';
import { Screen } from '@/components/screen';
import { Bar, Button, Card, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function Miles() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const st = snap.settings;
  const [how, setHow] = useState(false);
  if (!st) return <Redirect href="/" />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const lvl = g.level;
  const shown = shownBadges(g.badges, st);
  const earned = shown.filter((b) => badgeDone(b, st));
  const gi = gradInfo(snap.days, st, tk);
  const who = identityLines(snap.days, st, snap.reviews, tk);
  const back = hoursBack(snap.days, st, tk);
  const todo = shown.filter((b) => !badgeDone(b, st)).sort((a, b) => b.now / b.goal - a.now / a.goal);
  return (
    <Screen title="Milestones" sub={<T tone="muted">Your flame, graduation, and your badges.</T>} back="More">
      <Card>
        <View style={s.lvl}>
          <GradFlame level={lvl.n} size={124} />
          <View style={{ flex: 1, gap: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Level ${lvl.n} of ${LEVELS.length}. See how your flame grows.`}
              onPress={() => router.push('/growth')}
              style={[s.pill, { backgroundColor: c.accentSoft }]}>
              <Text style={{ fontFamily: font.bodySemi, color: c.accentText }}>
                Level {lvl.n} of {LEVELS.length}
              </Text>
              <Icon name="next" size={14} color={c.accentText} />
            </Pressable>
            <T v="h2">{lvl.name}</T>
            <T v="small" tone="muted">
              {lvl.step}
            </T>
            <T>
              <Text style={{ fontFamily: font.display, fontSize: 22 }}>{g.pts.toLocaleString('en-US')}</Text> points
            </T>
            <Bar frac={lvl.frac} from={c.sun} />
            <T v="small" tone="muted">
              {nextLine(lvl)}
            </T>
          </View>
        </View>
      </Card>
      {who.length || back ? (
        <Card>
          <T v="h2">Who you are becoming</T>
          {who.map((x) => (
            <View key={x.who} style={s.row}>
              <View style={[s.whoIc, { backgroundColor: c.mintSoft }]}>
                <Icon name={x.ic} size={18} color={c.mintText} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="label">{x.who}</T>
                <T v="small" tone="muted">
                  {x.n}
                </T>
              </View>
            </View>
          ))}
          {back ? (
            <T v="small" tone="mintText" style={{ fontFamily: font.bodySemi }}>
              About {back.toLocaleString('en-US')} {back === 1 ? 'hour' : 'hours'} given back to your life so far, at the pace you told the setup.
            </T>
          ) : null}
        </Card>
      ) : null}
      {gi.at ? (
        <Card style={{ backgroundColor: c.sunSoft }}>
          <View style={s.row}>
            <GradCap size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="h2">Graduated</T>
              <T v="small" tone="muted">
                {fmtDate(gi.at, { month: 'long', day: 'numeric', year: 'numeric' })} · yours for good
              </T>
            </View>
          </View>
          <T v="small">{gradLine(gi)}</T>
          <Button kind="ghost" label="See your graduation" onPress={() => router.push('/graduated')} />
        </Card>
      ) : gi.show ? (
        <Card>
          <View style={s.between}>
            <T v="h2">Toward graduation</T>
            <T v="small" tone="muted">
              {gi.count} of {GRAD_DAYS}
            </T>
          </View>
          <Bar frac={gi.count / GRAD_DAYS} from={c.accent} />
          <T v="small">{gradLine(gi)}</T>
          <T v="small" tone="muted">
            A hard day takes one day off the count, never the rest. Graduation is a party and an award that stays yours, and Today stays just as it is.
          </T>
        </Card>
      ) : (
        <T v="small" tone="muted" style={{ paddingHorizontal: 4 }}>
          {GRAD_ABOUT}
        </T>
      )}
      <Card>
        <View style={s.between}>
          <T v="h2">Growth path</T>
          <T v="small" tone="muted">
            Form {lvl.stage + 1} of {STAGES.length}
          </T>
        </View>
        <T v="small" tone="muted">
          Your flame grows a little with every level and turns into something new every fifth one. Tap a form to see how it grows.
        </T>
        {STAGES.map((sg, i) => {
          const state = stageState(i, lvl);
          const a = i * STEPS + 1;
          const b = i * STEPS + STEPS;
          const say = state === 'done' ? 'reached' : state === 'now' ? 'you are here, level ' + lvl.n : 'starts at ' + stagePts(i) + ' points';
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`${sg.name}, levels ${a} to ${b}, ${say}`}
              onPress={() => router.push({ pathname: '/growth', params: { stage: String(i) } })}
              style={[s.gp, { backgroundColor: state === 'now' ? c.sunSoft : c.surface2, borderColor: state === 'now' ? c.sun : 'transparent' }]}>
              <Flame level={stageLevel(i, lvl)} size={56} locked={state === 'later'} label="" />
              <View style={{ flex: 1 }}>
                <T v="label">{sg.name}</T>
                <T v="small" tone="muted">
                  Levels {a} to {b}
                </T>
              </View>
              {state === 'done' ? (
                <View style={s.row}>
                  <Icon name="check" size={16} color={c.mintText} />
                  <T v="small" tone="mintText">
                    Reached
                  </T>
                </View>
              ) : (
                <T v="small" tone={state === 'now' ? 'sunText' : 'muted'} style={{ fontFamily: font.bodySemi }}>
                  {state === 'now' ? 'Level ' + lvl.n : stagePts(i) + ' pts'}
                </T>
              )}
            </Pressable>
          );
        })}
      </Card>
      <Collapse title="How points work" open={how} onToggle={() => setHow(!how)}>
        <PointsList />
      </Collapse>
      <Card>
        <View style={s.between}>
          <T v="h2">Badges</T>
          <T v="small" tone="muted">
            {earned.length} of {shown.length}
          </T>
        </View>
        <View style={s.badges}>
          {earned.concat(todo).map((b) => {
            const d = badgeDone(b, st);
            return (
              <Pressable
                key={b.id}
                accessibilityRole="button"
                accessibilityLabel={`${b.name}: ${d ? 'earned' : 'locked, ' + b.now + ' of ' + b.goal}`}
                onPress={() => router.push({ pathname: '/badge/[id]', params: { id: b.id } })}
                style={s.badge}>
                <BadgeArt icon={b.icon} tone={b.tone} size={64} earned={d} />
                <T v="small" style={{ fontFamily: font.bodyBold, textAlign: 'center' }} numberOfLines={2}>
                  {b.name}
                </T>
                <T v="small" tone="muted">
                  {d ? 'Earned' : b.now + ' of ' + b.goal}
                </T>
              </Pressable>
            );
          })}
        </View>
        <T v="small" tone="muted">
          Badges are never taken away. A slip does not undo any of them.
        </T>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  whoIc: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  lvl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 12, minHeight: 32, borderRadius: 999 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  gp: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 16, borderWidth: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { width: '31%', flexGrow: 1, alignItems: 'center', gap: 4, paddingVertical: 8 },
});
