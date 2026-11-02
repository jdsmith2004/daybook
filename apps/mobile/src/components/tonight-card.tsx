/* PROTOTYPE (mockups only, not for merge): three looks for Tonight on Today, by &tn=a|b|c. A night card stays a night card in
   both themes, the way Weather keeps its sky: deep indigo, warm cream words, one accent.
   a: the hours as an arc of the evening (Apple's sleep schedule), with now on it.
   b: the plan in the person's own words, in the lessons' cream speech bubbles, over a dusk glow.
   c: a block of color with a moon and the hours, beside the plan. */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { font } from '@/lib/theme';

const q = typeof window !== 'undefined' && window.location ? new URLSearchParams(window.location.search) : null;
export const TN = (q?.get('tn') || 'd') as 'a' | 'b' | 'c' | 'd' | 'e';

const CREAM = '#F6EFE2';
const CREAM2 = 'rgba(246,239,226,0.62)';
const GOLD = '#FFD25A';
const LAV = '#A99BFF';
const INK = '#1B1640';

type Line = { when: string; then: string };
type P = { start: number; label: string; lines: Line[]; more: number; now: number };

const open = (p: string) => {
  buzz('tap');
  router.push(p as never);
};
const whenOf = (w: string) => 'When ' + w.replace(/^when\s+/i, '');

function Moon({ size, color }: { size: number; color: string }) {
  const r = size / 2;
  return (
    <Svg width={size} height={size}>
      <Path
        d={`M ${r * 1.15} ${r * 0.08} A ${r * 0.92} ${r * 0.92} 0 1 0 ${r * 1.92} ${r * 1.25} A ${r * 0.74} ${r * 0.74} 0 0 1 ${r * 1.15} ${r * 0.08} Z`}
        fill={color}
      />
    </Svg>
  );
}

function More({ n, color }: { n: number; color: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => open('/plan')} style={({ pressed }) => [s.more, { opacity: pressed ? 0.75 : 1 }]}>
      <Text style={[s.moreT, { color }]}>Your whole plan</Text>
      <Icon name="next" size={16} color={color} />
    </Pressable>
  );
}

/* a: the evening as an arc from 6 PM to 2 AM; the hard hours in gold on it, and a dot for now */
function Arc({ start, now, w = 300 }: { start: number; now: number; w?: number }) {
  const k = w / 300;
  const W = w;
  const H = 158 * k;
  const cx = W / 2;
  const cy = 146 * k;
  const R = 128 * k;
  const sw = Math.max(8, 14 * k);
  const from = 18;
  const span = 8;
  const pt = (h: number) => {
    const a = Math.PI * (1 - (h - from) / span);
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
  const s0 = start < 6 ? start + 24 : start;
  const inArc = h >= from && h <= from + span;
  const [nx, ny] = pt(Math.min(from + span, Math.max(from, h)));
  return (
    <Svg width={W} height={H}>
      <Defs>
        <RadialGradient id="glow" cx={pt(s0 + 1)[0]} cy={pt(s0 + 1)[1]} r={90 * k} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={GOLD} stopOpacity={0.35} />
          <Stop offset="1" stopColor={GOLD} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={W} height={H} fill="url(#glow)" />
      <Path d={arc(from, from + span)} stroke="rgba(169,155,255,0.22)" strokeWidth={sw} strokeLinecap="round" fill="none" />
      <Path d={arc(s0, s0 + 2)} stroke={GOLD} strokeWidth={sw} strokeLinecap="round" fill="none" />
      {inArc ? <Circle cx={nx} cy={ny} r={Math.max(6, 9 * k)} fill={CREAM} stroke={INK} strokeWidth={Math.max(3, 4 * k)} /> : null}
    </Svg>
  );
}

const soonOf = (start: number, now: number) => {
  const d = new Date(now);
  const left = start - d.getHours();
  return left > 0 && left <= 6 ? 'In ' + (left === 1 ? 'an hour' : left + ' hours') : left <= 0 && left > -2 ? 'Now' : 'Tonight';
};

/* d and e: the arc, smaller, over the plan in the person's own words, on the dusk with its ember. d puts the arc beside the hours,
   e holds the hours inside a smaller arc */
function Dusk() {
  return (
    <>
      <LinearGradient colors={['#231E5E', '#3B2468', '#5A2C5E']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="ember" cx="85%" cy="105%" r="70%">
            <Stop offset="0" stopColor="#F0906C" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#F0906C" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#ember)" />
      </Svg>
    </>
  );
}
function Said({ lines }: { lines: Line[] }) {
  return (
    <View style={{ gap: 12, paddingHorizontal: 16 }}>
      {lines.map((p, i) => (
        <Pressable key={i} onPress={() => open('/plan')} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <View style={s.bubble}>
            <Text style={[s.when, { color: '#6A5A8E' }]}>{whenOf(p.when)}</Text>
            <Text style={[s.then, { color: INK }]}>{p.then}</Text>
          </View>
          <View style={[s.tail, i % 2 ? { right: 28 } : { left: 28 }]} />
        </Pressable>
      ))}
    </View>
  );
}
function ArcSide({ start, label, lines, more, now }: P) {
  return (
    <View style={s.wrap}>
      <Dusk />
      <View style={s.dHead}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.arcSub, { color: LAV }]}>{soonOf(start, now)}</Text>
          <Text style={[s.dBig, { color: GOLD }]}>{label}</Text>
        </View>
        <Arc start={start} now={now} w={116} />
      </View>
      <Said lines={lines} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>{more ? <More n={more} color={CREAM} /> : null}</View>
    </View>
  );
}
function ArcTop({ start, label, lines, more, now }: P) {
  return (
    <View style={s.wrap}>
      <Dusk />
      <View style={s.eBox}>
        <Arc start={start} now={now} w={196} />
        <View style={s.eIn}>
          <Text style={[s.arcSub, { color: LAV }]}>{soonOf(start, now)}</Text>
          <Text style={[s.dBig, { color: GOLD }]}>{label}</Text>
        </View>
      </View>
      <Said lines={lines} />
      <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>{more ? <More n={more} color={CREAM} /> : null}</View>
    </View>
  );
}

export function TonightCard({ start, label, lines, more, now }: P) {
  if (TN === 'd') return <ArcSide start={start} label={label} lines={lines} more={more} now={now} />;
  if (TN === 'e') return <ArcTop start={start} label={label} lines={lines} more={more} now={now} />;
  if (TN === 'b') return <Bubbles start={start} label={label} lines={lines} more={more} now={now} />;
  if (TN === 'c') return <Block start={start} label={label} lines={lines} more={more} now={now} />;
  const d = new Date(now);
  const h = d.getHours();
  const left = start - h;
  const sub = left > 0 && left <= 6 ? 'In ' + (left === 1 ? 'an hour' : left + ' hours') : left <= 0 && left > -2 ? 'Now' : 'Tonight';
  return (
    <View style={s.wrap}>
      <LinearGradient colors={['#2A2470', '#1E1A52']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={s.arcBox}>
        <Arc start={start} now={now} />
        <View style={s.arcIn}>
          <Text style={[s.arcSub, { color: LAV }]}>{sub}</Text>
          <Text style={[s.arcBig, { color: GOLD }]}>{label}</Text>
        </View>
      </View>
      <View style={s.body}>
        {lines.map((p, i) => (
          <Pressable key={i} onPress={() => open('/plan')} style={({ pressed }) => [s.aLine, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={[s.when, { color: LAV }]}>{whenOf(p.when)}</Text>
            <Text style={[s.then, { color: CREAM }]}>{p.then}</Text>
          </Pressable>
        ))}
        {more ? <More n={more} color={LAV} /> : null}
      </View>
    </View>
  );
}

/* b: the person's own plan, said back to them in the lessons' bubbles, over a dusk that warms toward the bottom */
function Bubbles({ label, lines, more }: P) {
  return (
    <View style={s.wrap}>
      <LinearGradient colors={['#231E5E', '#3B2468', '#5A2C5E']} locations={[0, 0.6, 1]} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <RadialGradient id="ember" cx="85%" cy="105%" r="70%">
            <Stop offset="0" stopColor="#F0906C" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#F0906C" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#ember)" />
      </Svg>
      <View style={s.bHead}>
        <Moon size={30} color={GOLD} />
        <View>
          <Text style={[s.bTitle, { color: CREAM }]}>Tonight, {label}</Text>
          <Text style={[s.bSub, { color: CREAM2 }]}>What you told yourself</Text>
        </View>
      </View>
      <View style={{ gap: 12, paddingHorizontal: 16 }}>
        {lines.map((p, i) => (
          <Pressable key={i} onPress={() => open('/plan')} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <View style={s.bubble}>
              <Text style={[s.when, { color: '#6A5A8E' }]}>{whenOf(p.when)}</Text>
              <Text style={[s.then, { color: INK }]}>{p.then}</Text>
            </View>
            <View style={[s.tail, i % 2 ? { right: 28 } : { left: 28 }]} />
          </Pressable>
        ))}
      </View>
      <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>{more ? <More n={more} color={CREAM} /> : null}</View>
    </View>
  );
}

/* c: a lavender block holds the moon and the hours, the plan sits beside it on the night */
function Block({ label, lines, more }: P) {
  const [a, b] = label.split(' to ');
  return (
    <View style={[s.wrap, { flexDirection: 'row', backgroundColor: '#211C54' }]}>
      <LinearGradient colors={['#B9ADFF', '#8C7CF0']} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={s.block}>
        <Moon size={44} color={INK} />
        <View style={{ gap: 0 }}>
          <Text style={[s.blockBig, { color: INK }]}>{a}</Text>
          <Text style={[s.blockTo, { color: 'rgba(27,22,64,0.6)' }]}>to {b}</Text>
        </View>
      </LinearGradient>
      <View style={[s.body, { flex: 1, paddingTop: 16 }]}>
        <Text style={[s.cTitle, { color: CREAM }]}>Tonight</Text>
        {lines.map((p, i) => (
          <Pressable key={i} onPress={() => open('/plan')} style={({ pressed }) => [s.aLine, { opacity: pressed ? 0.8 : 1 }]}>
            <Text style={[s.when, { color: LAV }]}>{whenOf(p.when)}</Text>
            <Text style={[s.then, { color: CREAM, fontSize: 15, lineHeight: 20 }]}>{p.then}</Text>
          </Pressable>
        ))}
        {more ? <More n={more} color={LAV} /> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 24, overflow: 'hidden', paddingBottom: 8 },
  body: { paddingHorizontal: 16, gap: 4 },
  arcBox: { alignItems: 'center', paddingTop: 20, height: 182 },
  arcIn: { position: 'absolute', top: 92, alignItems: 'center' },
  arcSub: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  arcBig: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  aLine: { gap: 2, paddingVertical: 8 },
  when: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18 },
  then: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  moreT: { fontFamily: font.bodySemi, fontSize: 15 },
  bHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 16 },
  dHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  dBig: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  eBox: { alignItems: 'center', paddingTop: 16, height: 130 },
  eIn: { position: 'absolute', top: 64, alignItems: 'center' },
  bTitle: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
  bSub: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18 },
  bubble: { backgroundColor: '#FFF6E8', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
  tail: { position: 'absolute', bottom: -6, width: 14, height: 14, backgroundColor: '#FFF6E8', transform: [{ rotate: '45deg' }], borderRadius: 2 },
  block: { width: 112, padding: 16, justifyContent: 'space-between', minHeight: 220, borderRadius: 24, margin: 0 },
  blockBig: { fontFamily: font.display, fontSize: 34, lineHeight: 38 },
  blockTo: { fontFamily: font.display, fontSize: 17, lineHeight: 22 },
  cTitle: { fontFamily: font.display, fontSize: 20, lineHeight: 25, marginBottom: 4 },
});
