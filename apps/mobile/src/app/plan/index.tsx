/* My plan: the person's own page, to read on a hard night and to change on a calm day. The flame stands big in its sky with
   who I am becoming beside it; under it each part of the plan is a chapter in its own color (lib/plan-look.ts), showing its
   best line, and a tap opens it (plan/[part]). When it hits leads with the two lines that fit tonight (core planTonight, the
   same two Today shows).
   The old tabs still work as links: ?pane=plans&sub=slip opens If I slip, ?pane=learned opens What I have learned. */
import {
  gameCompute,
  identityLines,
  planBlank,
  planTonight,
  recordLines,
  riskWindow,
  safeName,
  slipSteps,
  computeMetrics,
  SAFETY,
  HELP_STEPS,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlameSky } from '@/components/flame-sky';
import { skyInk } from '@/components/hero';
import { Screen } from '@/components/screen';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useBackLabel, useHoldsBar, useOverModal } from '@/lib/nav';
import { chapterPalette, CHAPTERS, partFor, type Part } from '@/lib/plan-look';
import { useStore } from '@/lib/store';
import { font, PaletteOverride, useTheme } from '@/lib/theme';

export default function MyPlan() {
  const params = useLocalSearchParams<{ pane?: string; sub?: string; to?: string; fresh?: string; add?: string }>();
  const { snap, tk } = useStore();
  const { width, height } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const over = useOverModal();
  const backLabel = useBackLabel('More');
  const holdsBar = useHoldsBar();
  const base = useTheme();
  /* the sky runs under the clock: the clock takes the sky's ink until the page has scrolled past it */
  const [past, setPast] = useState(false);
  const ask = partFor(params.pane, params.sub, params.to, params.fresh);
  /* an old link to one of the tabs opens its chapter over this page, so Back lands here */
  const went = useRef(false);
  useEffect(() => {
    if (!ask || went.current) return;
    went.current = true;
    router.push({
      pathname: '/plan/[part]',
      params: { part: ask, ...(params.fresh ? { fresh: params.fresh } : {}), ...(params.add ? { add: params.add } : {}) },
    });
  }, [ask, params.fresh, params.add]);
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  if (params.pane === 'learned' || params.pane === 'book') return <Redirect href="/learned" />;

  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);
  const ink = skyInk(level);
  const top = Platform.OS === 'ios' && over ? 0 : inset.top;
  const sky = Math.round(Math.max(340, Math.min(460, height * 0.5)));
  const flame = Math.max(160, Math.round(Math.min(width * 0.8, sky - top - 28)));
  const be = String(st.becoming || '').trim();
  const proof = [...identityLines(snap.days, st, snap.reviews, tk), ...recordLines(snap.days, st, tk)][0];
  const open = (p: Part) => () => {
    buzz('tap');
    router.push({ pathname: '/plan/[part]', params: { part: p } });
  };

  const lines = planTonight(snap.days, st, tk);
  const all = st.plan.filter((r) => !planBlank(r)).length;
  const win = riskWindow(snap.days, st, tk);
  const reasons = st.reasons.filter((r) => r.trim());
  const slip = slipSteps(st);
  const name = safeName(st);
  const m = computeMetrics(snap.days, st, tk);
  const ready = m.safety + m.help;
  const readyOf = SAFETY.length + HELP_STEPS.length;

  return (
    <Screen
      title="My plan"
      bare
      onScroll={(y) => {
        if (y > sky - 60 !== past) setPast(y > sky - 60);
      }}
      top={
        <FlameSky level={level} height={sky} flame={flame} foot={10} right={-flame * 0.16}>
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
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Opens Why I am doing this"
            onPress={open('why')}
            style={[s.be, { top: top + 56, width: Math.min(width * 0.5, 280) }]}>
            <T v="eyebrow" style={{ color: ink.soft }}>
              Who I am becoming
            </T>
            <T style={[s.beT, { color: ink.ink }]} accessibilityRole="header">
              {be || 'Write who you are becoming'}
            </T>
            {proof ? (
              <T v="small" style={{ color: ink.soft }}>
                {proof.who} {proof.n}.
              </T>
            ) : null}
          </Pressable>
        </FlameSky>
      }>
      {holdsBar ? <StatusBar style={past ? (base.scheme === 'dark' ? 'light' : 'dark') : ink.light ? 'light' : 'dark'} /> : null}
      <Chapter part="urge" onPress={open('urge')}>
        <View style={s.chHead}>
          <T style={s.chTitle}>When it hits</T>
          {win ? (
            <T v="small" style={s.chSide}>
              {'Tonight, ' + win.label}
            </T>
          ) : null}
        </View>
        {lines.length ? (
          lines.map((r, i) => (
            <View key={i} style={{ gap: 2 }}>
              <T style={s.if}>If {r.when},</T>
              <T style={s.then}>{r.then}</T>
            </View>
          ))
        ) : (
          <T style={s.then}>Decide now, while it is calm, what you will do when an urge hits.</T>
        )}
        <More label={all > lines.length ? `All ${all} lines` : lines.length ? 'Change my lines' : 'Add my first line'} />
      </Chapter>
      <View style={s.pair}>
        <Chapter part="why" onPress={open('why')} style={{ flex: 1 }}>
          <T style={s.chTitle}>Why</T>
          <T style={s.small} numberOfLines={4}>
            {reasons[0] || 'What you want back. You read it when it gets hard.'}
          </T>
          <More label={reasons.length > 1 ? `${reasons.length} reasons` : reasons.length ? 'My reason' : 'Add one'} />
        </Chapter>
        <Chapter part="slip" onPress={open('slip')} style={{ flex: 1 }}>
          <T style={s.chTitle}>If I slip</T>
          <T style={s.small} numberOfLines={4}>
            {slip[0] || 'A slip is data, not a reset.'}
          </T>
          <More label={slip.length + (slip.length === 1 ? ' step' : ' steps')} />
        </Chapter>
      </View>
      <Chapter part="people" onPress={open('people')}>
        <T style={s.chTitle}>{name ? name + ' has my back' : 'Who has your back?'}</T>
        <More label={name ? 'My people' : 'Add someone I trust'} />
      </Chapter>
      <Chapter part="ready" onPress={open('ready')}>
        <T style={s.chTitle}>Getting ready</T>
        <More label={`${ready} of ${readyOf} set up`} />
      </Chapter>
    </Screen>
  );
}

/** one chapter: a card of the chapter's own color, its words in its ink, the whole card one button */
function Chapter({ part, onPress, style, children }: { part: Part; onPress: () => void; style?: ViewStyle; children: ReactNode }) {
  const base = useTheme();
  const m = CHAPTERS[part][base.scheme];
  return (
    <PaletteOverride.Provider value={chapterPalette(base, part)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={CHAPTERS[part].title}
        onPress={onPress}
        style={({ pressed }) => [s.ch, style, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
        <LinearGradient colors={m.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={s.chIn}>{children}</View>
      </Pressable>
    </PaletteOverride.Provider>
  );
}

/** the way into a chapter, at its foot */
function More({ label }: { label: string }) {
  const c = useTheme();
  return (
    <View style={s.more}>
      <T v="small" style={{ fontFamily: font.bodySemi, color: c.muted }}>
        {label}
      </T>
      <Icon name="next" size={14} color={c.muted} />
    </View>
  );
}

const s = StyleSheet.create({
  head: { position: 'absolute', left: 16, right: 16 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start', minHeight: 44, minWidth: 44, marginLeft: -4 },
  be: { position: 'absolute', left: 16, gap: 6 },
  beT: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 34 },
  ch: { borderRadius: 20, overflow: 'hidden' },
  chIn: { padding: 16, gap: 12 },
  chHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  chTitle: { fontFamily: font.displayBold, fontSize: 22, lineHeight: 28 },
  chSide: { fontFamily: font.bodySemi },
  if: { fontFamily: font.displayBold, fontSize: 20, lineHeight: 25 },
  then: { fontSize: 17, lineHeight: 23 },
  small: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  pair: { flexDirection: 'row', gap: 12 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto' },
});
