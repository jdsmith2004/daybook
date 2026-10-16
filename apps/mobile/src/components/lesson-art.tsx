/* The picture on a lesson card: an icon in a circle, a chain of steps, a wave, a snowball, your loop, a big number, a shield
   or a check mark. Ported from the legacy lxArt and friends, in the lesson's unit color. */
import { lxLoopNodes, type Art, type Settings } from '@daybook/core';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Marker, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Icon } from '@/components/ui';
import { font, useTheme, type Tone } from '@/lib/theme';

export function LxIco({ name, t, size = 120 }: { name: string; t: Tone; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name || 'sparkle'} size={size * 0.47} color={t.ic} />
    </View>
  );
}

export function LxShield({ t }: { t: Tone }) {
  const c = useTheme();
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120" accessibilityLabel="A shield">
      <Circle cx={60} cy={60} r={56} fill={t.soft} />
      <Path d="M60 26l26 11v20c0 18-11 30-26 37-15-7-26-19-26-37V37z" fill={c.surface} stroke={t.ic} strokeWidth={4} strokeLinejoin="round" />
      <Path d="M48 58l8 8 16-17" fill="none" stroke={t.ic} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function LxCheck() {
  const c = useTheme();
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120" accessibilityLabel="A check mark">
      <Circle cx={60} cy={60} r={56} fill={c.mintSoft} />
      <Circle cx={60} cy={60} r={38} fill={c.mint} />
      <Path d="M44 61l12 12 21-24" fill="none" stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Chain({ nodes, icons, t }: { nodes: string[]; icons?: string[]; t: Tone }) {
  const c = useTheme();
  const dense = nodes.length >= 5;
  return (
    <View style={{ alignSelf: 'stretch', alignItems: 'center' }} accessible accessibilityLabel={nodes.join(', then ')}>
      {nodes.map((n, i) => {
        const hot = i === nodes.length - 1;
        return (
          <View key={i} style={{ alignSelf: 'stretch', alignItems: 'center' }}>
            {i ? <View style={{ width: 3, height: dense ? 10 : 16, backgroundColor: t.ic, opacity: 0.5 }} /> : null}
            <View
              style={{
                alignSelf: 'stretch',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: dense ? 8 : 12,
                paddingHorizontal: 14,
                borderRadius: 16,
                backgroundColor: hot ? t.ic : t.soft,
              }}>
              {icons && icons[i] ? (
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={icons[i]} size={18} color={t.text} />
                </View>
              ) : null}
              <Text style={{ fontFamily: font.display, fontSize: dense ? 16 : 19, color: hot ? t.ink : t.text }}>{n}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Wave({ t, al }: { t: Tone; al?: string }) {
  const c = useTheme();
  return (
    <Svg width="100%" height={150} viewBox="0 0 330 150" style={{ maxWidth: 330 }} accessibilityLabel={al || 'An urge rises, peaks, and falls like a wave'}>
      <Path d="M8 128 C70 128 96 26 165 26 S262 128 322 128" fill="none" stroke={t.ic} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={165} cy={26} r={8} fill={t.ic} />
      <SvgText x={52} y={146} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
        RISES
      </SvgText>
      <SvgText x={165} y={14} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
        PEAKS
      </SvgText>
      <SvgText x={278} y={146} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
        PASSES
      </SvgText>
    </Svg>
  );
}

function Snow({ t, o }: { t: Tone; o: { a?: string; b?: string; al?: string } }) {
  const c = useTheme();
  return (
    <Svg width="100%" height={170} viewBox="0 0 330 170" style={{ maxWidth: 330 }} accessibilityLabel={o.al || 'A snowball rolling down a slope, growing as it goes'}>
      <Path d="M10 30 L320 150" stroke={c.line} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Circle cx={43} cy={34} r={8} fill={t.soft} stroke={t.ic} strokeWidth={2} />
      <Circle cx={110} cy={54} r={14} fill={t.soft} stroke={t.ic} strokeWidth={2} />
      <Circle cx={194} cy={75} r={24} fill={t.soft} stroke={t.ic} strokeWidth={2} />
      <Circle cx={288} cy={99} r={36} fill={t.ic} stroke={t.ic} strokeWidth={2} />
      <SvgText x={43} y={16} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
        {o.a || 'ONE SLIP'}
      </SvgText>
      <SvgText x={288} y={103} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={t.ink} textAnchor="middle" fontFamily={font.bodyBold}>
        {o.b || 'GIVING UP'}
      </SvgText>
    </Svg>
  );
}

function Loop({ t, o, st }: { t: Tone; o: { n?: string[]; c?: string }; st: Settings | null }) {
  const c = useTheme();
  const n = o.n && o.n.length === 4 ? o.n : lxLoopNodes(st);
  if (!n) return <Chain nodes={['Fail', 'Shame', 'Hide', 'Give up']} t={t} />;
  if (n.length !== 4)
    return (
      <View style={{ alignSelf: 'stretch', alignItems: 'center', gap: 8 }}>
        <Chain nodes={n} t={t} />
        <Text style={{ fontFamily: font.body, fontSize: 13.5, color: c.muted, textAlign: 'center' }}>…and back to the start. {o.c || 'YOUR LOOP'}</Text>
      </View>
    );
  const box = (x: number, y: number, s: string) => (
    <G key={s + x + y}>
      <Rect x={x} y={y} width={112} height={48} rx={16} fill={t.soft} />
      <SvgText x={x + 56} y={y + 31} fontSize={17} fill={t.text} textAnchor="middle" fontFamily={font.display}>
        {s}
      </SvgText>
    </G>
  );
  const arrow = (d: string) => <Path key={d} d={d} stroke={t.text} strokeWidth={3} strokeLinecap="round" markerEnd="url(#lxah)" />;
  return (
    <Svg width="100%" height={190} viewBox="0 0 330 190" style={{ maxWidth: 330 }} accessibilityLabel={`Your loop: ${n.join(', then ')}, and back to the start`}>
      <Defs>
        <Marker id="lxah" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse">
          <Path d="M1 1L9 5L1 9z" fill={t.text} />
        </Marker>
      </Defs>
      {box(14, 16, n[0])}
      {box(204, 16, n[1])}
      {box(204, 126, n[2])}
      {box(14, 126, n[3])}
      {arrow('M134 40H196')}
      {arrow('M260 72V118')}
      {arrow('M196 150H134')}
      {arrow('M70 118V72')}
      <SvgText x={165} y={100} fontSize={11} fontWeight="700" letterSpacing={1.1} fill={c.muted} textAnchor="middle" fontFamily={font.bodyBold}>
        {o.c || 'YOUR LOOP'}
      </SvgText>
    </Svg>
  );
}

export function BigNumber({ n, s }: { n: string | number; s?: string }) {
  const c = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontFamily: font.display, fontSize: 96, lineHeight: 100, color: c.accent, fontVariant: ['tabular-nums'] }}>{n}</Text>
      {s ? <Text style={{ fontFamily: font.bodySemi, fontSize: 17, maxWidth: 260, textAlign: 'center', color: c.ink, lineHeight: 22 }}>{s}</Text> : null}
    </View>
  );
}

export function LessonArt({ art, ic, t, st }: { art: Art; ic: string; t: Tone; st: Settings | null }) {
  const [k, o] = art as [string, Record<string, unknown>];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opts = (o || {}) as any;
  if (k === 'snow') return <Snow t={t} o={opts} />;
  if (k === 'loop') return <Loop t={t} o={opts} st={st} />;
  if (k === 'chain') return <Chain nodes={(opts as { n?: string[] }).n || []} icons={(opts as { i?: string[] }).i} t={t} />;
  if (k === 'wave') return <Wave t={t} al={(opts as { al?: string }).al} />;
  if (k === 'big') return <BigNumber n={(opts as { n: string }).n} s={(opts as { s?: string }).s} />;
  if (k === 'shield') return <LxShield t={t} />;
  return <LxIco name={(opts as { ic?: string }).ic || ic} t={t} />;
}
