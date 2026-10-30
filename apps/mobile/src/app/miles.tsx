/* Milestones: your flame, big, in its own sky, who you are becoming, graduation, the twelve forms it grows through, how points
   work, and your badges (the biggest ones first, the rest one tap away). Ported from the legacy viewMiles and rewardsBody. */
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
  recordLines,
  LEVELS,
  nextLine,
  shownBadges,
  STAGES,
  stageLevel,
  stagePts,
  stageState,
  STEPS,
} from '@daybook/core';
import { StatusBar } from 'expo-status-bar';
import { Redirect, router, useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { FlameSky } from '@/components/flame-sky';
import { Collapse } from '@/components/form';
import { GradCap } from '@/components/grad';
import { skyInk } from '@/components/hero';
import { Medal } from '@/components/medal';
import { PointsList } from '@/components/points-list';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { Bar, Card, Icon, T } from '@/components/ui';
import { useBackLabel, useOverModal } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** a form in the row of twelve */
const FORM_W = 132;
const FORM_GAP = 12;
/** how many badges show before See all */
const EARNED_CAP = 6;
const CLOSE_CAP = 3;

export default function Miles() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const st = snap.settings;
  const inset = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const over = useOverModal();
  const focused = useIsFocused();
  const backLabel = useBackLabel('More');
  const forms = useRef<ScrollViewInstance>(null);
  const [how, setHow] = useState(false);
  const [all, setAll] = useState(false);
  /* the page frame, your level, who you are becoming and graduation show at once; the twelve flame forms (SVG) and the badges
     (small drawings) come right after, in two steps, so the page is never blank while they draw */
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setFill(1), 30);
    const b = setTimeout(() => setFill(2), 260);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  if (!st) return <Redirect href="/" />;
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const lvl = g.level;
  const shown = shownBadges(g.badges, st);
  const earned = shown.filter((b) => badgeDone(b, st));
  const gi = gradInfo(snap.days, st, tk);
  const who = [...recordLines(snap.days, st, tk), ...identityLines(snap.days, st, snap.reviews, tk)];
  const back = hoursBack(snap.days, st, tk);
  const todo = shown.filter((b) => !badgeDone(b, st)).sort((a, b) => b.now / b.goal - a.now / a.goal);
  /* the biggest wins first */
  const big = [...earned].sort((a, b) => b.goal - a.goal);
  const ink = skyInk(lvl.n);
  /* on iOS a page opened over a sheet is itself a card below the status bar (components/screen.tsx) */
  const top = Platform.OS === 'ios' && over ? 0 : inset.top;
  const FOOT = 84;
  const sky = Math.round(Math.max(320, Math.min(460, height * 0.52)));
  const flame = Math.round(Math.min(width, sky - top - FOOT - 24));
  const badge = (b: (typeof shown)[number]) => {
    const d = badgeDone(b, st);
    return (
      <Pressable
        key={b.id}
        accessibilityRole="button"
        accessibilityLabel={`${b.name}: ${d ? 'earned' : 'locked, ' + b.now + ' of ' + b.goal}`}
        onPress={() => router.push({ pathname: '/badge/[id]', params: { id: b.id } })}
        style={({ pressed }) => [s.badge, { opacity: pressed ? 0.7 : 1 }]}>
        <Medal id={b.id} icon={b.icon} tone={b.tone} size={64} earned={d} />
        <T v="small" style={{ fontFamily: font.bodySemi, textAlign: 'center' }} numberOfLines={2}>
          {b.name}
        </T>
        <T v="small" tone="muted">
          {d ? 'Earned' : b.now + ' of ' + b.goal}
        </T>
      </Pressable>
    );
  };
  return (
    <Screen
      title="Milestones"
      bare
      top={
        <FlameSky level={lvl.n} height={sky} flame={flame} foot={FOOT - 18}>
          <View style={[s.head, { top: top + 4 }]} pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              style={s.back}>
              <Icon name="back" size={22} color={ink.ink} />
              <T v="label" style={{ color: ink.ink }}>
                {backLabel}
              </T>
            </Pressable>
            <T v="title" accessibilityRole="header" style={{ color: ink.ink }}>
              Milestones
            </T>
          </View>
          <View style={s.foot} pointerEvents="box-none">
            <View style={{ flex: 1, gap: 2 }} pointerEvents="box-none">
              <T v="title" style={{ color: ink.ink }}>
                {lvl.name}
              </T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Level ${lvl.n} of ${LEVELS.length}. See how your flame grows.`}
                onPress={() => router.push('/growth')}
                hitSlop={12}
                style={s.level}>
                <T v="label" style={{ color: ink.ink }}>
                  Level {lvl.n} of {LEVELS.length}
                </T>
                <Icon name="next" size={14} color={ink.ink} />
              </Pressable>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }} accessible accessibilityLabel={`${g.pts.toLocaleString('en-US')} points`}>
              <Text style={[s.pts, { color: ink.ink }]}>{g.pts.toLocaleString('en-US')}</Text>
              <T v="label" style={{ color: ink.ink }}>
                points
              </T>
            </View>
          </View>
        </FlameSky>
      }>
      {focused ? <StatusBar style={ink.light ? 'light' : 'dark'} /> : null}
      <View style={{ gap: 8 }}>
        <T>{lvl.step}</T>
        <Bar frac={lvl.frac} from={c.sun} />
        <T v="small" tone="muted">
          {nextLine(lvl)}
        </T>
      </View>
      {who.length || back ? (
        <Card>
          <T v="h2">Who you are becoming</T>
          {who.map((x) => (
            <View key={x.who} style={s.who}>
              <Icon name={x.ic} size={20} color={c.mintText} />
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
        <Card tone="note">
          <View style={s.who}>
            <GradCap size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="h2">Graduated</T>
              <T v="small" tone="muted">
                {fmtDate(gi.at, { month: 'long', day: 'numeric', year: 'numeric' })} · yours for good
              </T>
            </View>
          </View>
          <T v="small">{gradLine(gi)}</T>
          <View style={{ alignItems: 'flex-start', marginLeft: -6 }}>
            <Link label="See your graduation" onPress={() => router.push('/graduated')} />
          </View>
        </Card>
      ) : gi.show ? (
        <Card>
          <T v="h2">Toward graduation</T>
          <Bar frac={gi.count / GRAD_DAYS} from={c.accent} />
          <T v="small">{gradLine(gi)}</T>
          <T v="small" tone="muted">
            A hard day takes one day off the count, never the rest. Graduation is an award that stays yours.
          </T>
        </Card>
      ) : (
        <T v="small" tone="muted">
          {GRAD_ABOUT}
        </T>
      )}
      {fill >= 1 ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          <View style={s.between}>
            <T v="h2">Growth path</T>
            <T v="small" tone="muted">
              Form {lvl.stage + 1} of {STAGES.length}
            </T>
          </View>
          <T v="small" tone="muted">
            A new form every five levels. Tap one to see how it grows.
          </T>
          <ScrollView
            ref={forms}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.forms}
            contentContainerStyle={s.formsIn}
            onContentSizeChange={() =>
              forms.current?.scrollTo({ x: Math.max(0, lvl.stage * (FORM_W + FORM_GAP) - (width - FORM_W) / 2 + 16), animated: false })
            }>
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
                  style={({ pressed }) => [s.form, { opacity: pressed ? 0.7 : 1 }]}>
                  <Flame level={stageLevel(i, lvl)} size={FORM_W} locked={state === 'later'} label="" />
                  <T v="label">{sg.name}</T>
                  <T
                    v="small"
                    tone={state === 'now' ? 'sunText' : state === 'done' ? 'mintText' : 'muted'}
                    style={state === 'now' ? { fontFamily: font.bodySemi } : null}>
                    {state === 'done' ? 'Reached' : state === 'now' ? 'You are here' : stagePts(i) + ' points'}
                  </T>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
      {fill >= 1 ? (
        <Collapse title="How points work" open={how} onToggle={() => setHow(!how)}>
          <PointsList />
        </Collapse>
      ) : null}
      {fill >= 2 ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          <View style={s.between}>
            <T v="h2">Badges</T>
            <T v="small" tone="muted">
              {earned.length} of {shown.length}
            </T>
          </View>
          <View style={s.badges}>{all ? big.concat(todo).map(badge) : big.slice(0, EARNED_CAP).map(badge)}</View>
          {!all && todo.length ? (
            <>
              <T v="label" style={{ marginTop: 8 }}>
                Closest
              </T>
              <View style={s.badges}>{todo.slice(0, CLOSE_CAP).map(badge)}</View>
            </>
          ) : null}
          {shown.length > EARNED_CAP + CLOSE_CAP ? (
            <View style={{ alignItems: 'center' }}>
              <Link label={all ? 'Show fewer' : 'See all ' + shown.length + ' badges'} onPress={() => setAll(!all)} />
            </View>
          ) : null}
          <T v="small" tone="muted" style={{ textAlign: 'center' }}>
            Badges are never taken away. A slip does not undo any of them.
          </T>
        </View>
      ) : null}
      <View style={{ height: inset.bottom }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  head: { position: 'absolute', left: 16, right: 16, gap: 0 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', minHeight: 44, minWidth: 44, marginLeft: -4 },
  foot: { position: 'absolute', left: 16, right: 16, bottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  level: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  pts: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  forms: { marginHorizontal: -16, flexGrow: 0 },
  formsIn: { paddingHorizontal: 16, gap: FORM_GAP },
  form: { width: FORM_W, alignItems: 'center', gap: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  badge: { width: '33.33%', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 4 },
});
