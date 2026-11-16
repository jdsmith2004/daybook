/* Tonight on Today (components/today-below.tsx): the hard hours and the two lines of the urge plan that fit them (core planTonight),
   on a dusk that warms to an ember at the bottom. The hours sit inside a small arc of the evening, 6 PM to 2 AM, gold where they are
   and a dot for now, the way Apple's sleep schedule draws a stretch of time as a shape. The plan comes back in the person's own words,
   in the cream bubbles the lessons speak in. A night card stays a night card in both themes, the way Weather keeps its sky.
   Before the hard hours are known: the same arc drawn empty, titled, so it is plain what will fill it (docs/design-standards.md, "Show
   it, do not say it"). With no plan: one bubble with blanks where the person's when and then go, which opens Walk it through. */
import { riskDay, riskPlanLabel, riskWhen, talkPlanNow, type DayKey, type Snapshot } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Blank } from '@/components/blank';
import { SVG_HIDE } from '@/components/shapes';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font } from '@/lib/theme';

/* the card's own night, the same in both themes */
const N = {
  dusk: ['#231E5E', '#3B2468', '#5A2C5E'] as const,
  ember: '#F0906C',
  cream: '#FFF6E8',
  creamInk: '#1B1640',
  creamMuted: '#6A5A8E',
  ink: '#F6EFE2',
  lav: '#B9ADFF',
  gold: '#FFD25A',
  track: 'rgba(185,173,255,0.24)',
};

const go = (pathname: string, params?: Record<string, string>) => {
  buzz('tap');
  router.push((params ? { pathname, params } : pathname) as never);
};
const whenOf = (w: string) => 'When ' + w.replace(/^when\s+/i, '');

/* the evening as an arc from 6 PM to 2 AM: the hard hours in gold with a glow, and a dot for now while it is on the arc */
const FROM = 18;
const SPAN = 8;
function Arc({ start, now, w }: { start: number | null; now: number; w: number }) {
  /* room above the arc, so its glow fades out before the edge of the drawing */
  const PAD = 28;
  const k = w / 300;
  const H = 158 * k + PAD;
  const cx = w / 2;
  const cy = 146 * k + PAD;
  const R = 128 * k;
  const sw = 10;
  const pt = (h: number) => {
    const a = Math.PI * (1 - (h - FROM) / SPAN);
    return [cx + R * Math.cos(a), cy - R * Math.sin(a)];
  };
  const arc = (h0: number, h1: number) => {
    const [x0, y0] = pt(h0);
    const [x1, y1] = pt(h1);
    return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`;
  };
  const d = new Date(now);
  let h = d.getHours() + d.getMinutes() / 60;
  if (h < 6) h += 24;
  const s0 = start == null ? FROM + 3 : Math.min(FROM + SPAN - 2, Math.max(FROM, start < 6 ? start + 24 : start));
  const [nx, ny] = pt(h);
  const [gx, gy] = pt(s0 + 1);
  return (
    <Svg width={w} height={H} {...SVG_HIDE}>
      <Defs>
        <RadialGradient id="tnGlow" cx={gx} cy={gy} r={52} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={N.gold} stopOpacity={0.35} />
          <Stop offset="1" stopColor={N.gold} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {start == null ? null : <Rect width={w} height={H} fill="url(#tnGlow)" />}
      <Path d={arc(FROM, FROM + SPAN)} stroke={N.track} strokeWidth={sw} strokeLinecap="round" fill="none" />
      {start == null ? null : <Path d={arc(s0, s0 + 2)} stroke={N.gold} strokeWidth={sw} strokeLinecap="round" fill="none" />}
      {h >= FROM && h <= FROM + SPAN ? <Circle cx={nx} cy={ny} r={7} fill={N.ink} stroke={N.creamInk} strokeWidth={3} /> : null}
    </Svg>
  );
}

function Bubble({ i, when, then, onPress, label }: { i: number; when?: string; then: string; onPress: () => void; label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <View style={s.bubble}>
        {when ? <Text style={[s.when, { color: N.creamMuted }]}>{when}</Text> : null}
        <Text style={[s.then, { color: N.creamInk }]}>{then}</Text>
      </View>
      <View style={[s.tail, i % 2 ? { right: 28 } : { left: 28 }]} />
    </Pressable>
  );
}

export function TonightCard({
  snap,
  tk,
  now,
  lines,
  more,
}: {
  snap: Snapshot;
  tk: DayKey;
  now: number;
  lines: { when: string; then: string }[];
  more: boolean;
}) {
  const st = snap.settings!;
  const r = riskDay(snap.days, st, tk, now);
  const near = r ? riskWhen(r, now) : null;
  /* from two hours before, while there is no short plan for tonight yet, the card offers one (Talk it through, ready for tonight) */
  const prep = !!r && r.phase === 'soon' && !r.talked && !talkPlanNow(snap.days, st, tk, now);
  return (
    <View style={s.wrap}>
      <LinearGradient colors={N.dusk} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" {...SVG_HIDE}>
        <Defs>
          <RadialGradient id="tnEmber" cx="85%" cy="105%" r="70%">
            <Stop offset="0" stopColor={N.ember} stopOpacity={0.55} />
            <Stop offset="1" stopColor={N.ember} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#tnEmber)" />
      </Svg>
      {r ? (
        <View style={s.arcBox} accessible accessibilityLabel={'Hard hours, ' + r.win.label + (near ? ', ' + near : '')}>
          <Arc start={r.win.start} now={now} w={244} />
          <View style={s.arcIn}>
            <Text style={[s.small, { color: N.lav }]}>{'Hard hours' + (near ? ' · ' + near : '')}</Text>
            <Text style={[s.big, { color: N.gold }, r.win.label.length > 10 && s.bigLong]}>{r.win.label}</Text>
          </View>
        </View>
      ) : (
        <View style={s.arcBox} accessible accessibilityLabel="Hard hours, not known yet. They show here once the log has a few urges.">
          <Arc start={null} now={now} w={244} />
          <View style={s.arcIn}>
            <Text style={[s.small, { color: N.lav }]}>Hard hours</Text>
            <View style={s.arcBlank}>
              <Blank color={N.lav} h={34} />
            </View>
          </View>
        </View>
      )}
      <View style={s.bubbles}>
        {lines.length ? (
          lines.map((p, i) => (
            <Bubble
              key={i}
              i={i}
              when={whenOf(p.when)}
              then={p.then}
              label={whenOf(p.when) + ', ' + p.then + ' Opens this line in My plan.'}
              onPress={() => {
                /* straight to this line in the urge plan, open to change */
                const at = (st.plan || []).findIndex((x) => x.when === p.when && x.then === p.then);
                go('/plan/[part]', at >= 0 ? { part: 'urge', line: String(at) } : { part: 'urge' });
              }}
            />
          ))
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Your plan, not made yet. Make a plan for your hard moments."
            onPress={() => go('/trail')}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <View style={s.bubble}>
              <View style={s.blankRow}>
                <Text style={[s.when, { color: N.creamMuted }]}>When</Text>
                <Blank color={N.creamMuted} h={18} />
              </View>
              <View style={s.blankRow}>
                <Text style={[s.then, { color: N.creamInk }]}>I will</Text>
                <Blank color={N.creamMuted} h={22} />
              </View>
            </View>
            <View style={[s.tail, { left: 28 }]} />
          </Pressable>
        )}
      </View>
      {prep || (more && lines.length) || !lines.length ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => (prep ? go('/talk', { prep: '1' }) : lines.length ? go('/plan') : go('/trail'))}
          style={({ pressed }) => [s.foot, { opacity: pressed ? 0.75 : 1 }]}>
          <Text style={[s.footT, { color: N.ink }]}>{prep ? riskPlanLabel(r!.win.start) : lines.length ? 'Your whole plan' : 'Make my plan'}</Text>
          <Icon name="next" size={16} color={N.ink} />
        </Pressable>
      ) : (
        <View style={{ height: 16 }} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 24, overflow: 'hidden' },
  arcBox: { alignItems: 'center', height: 160 },
  arcIn: { position: 'absolute', top: 88, alignItems: 'center' },
  small: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  big: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  bigLong: { fontSize: 22, lineHeight: 28, marginTop: 3, marginBottom: 3 },
  bubbles: { gap: 12, paddingHorizontal: 16 },
  blankRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  arcBlank: { width: 96, marginTop: 2 },
  bubble: { backgroundColor: N.cream, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
  tail: { position: 'absolute', bottom: -6, width: 14, height: 14, backgroundColor: N.cream, transform: [{ rotate: '45deg' }], borderRadius: 2 },
  when: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18 },
  then: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48, paddingHorizontal: 16, marginTop: 4 },
  footT: { fontFamily: font.bodySemi, fontSize: 15 },
});
