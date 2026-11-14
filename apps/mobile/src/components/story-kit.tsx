/* The drawing kit for the scenes of a lesson told as a story (story-art.tsx and story-scenes-*.tsx): the lesson's colors, the frame
   every scene settles into, a label, a person, a thought cloud and the white bear. Scenes are flat shapes in the lesson's own
   colors, 300 by 200, with one short line of words at most. */
import { type ReactNode } from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { pop, useAppear } from '@/lib/motion';
import { font, useTheme, type Tone } from '@/lib/theme';

export type Ink = { ink: string; line: string; muted: string; acc: string; soft: string; bg: string };
export const useInk = (t: Tone): Ink => {
  const c = useTheme();
  return { ink: c.ink, line: c.line, muted: c.muted, acc: t.ic, soft: t.soft, bg: c.bg };
};

export const W = 300;
export const H = 200;
/* a scene is the main thing on its card: it spans the width of the phone, up to a limit, and keeps its shape */
export function Frame({ label, children, h = H }: { label: string; children: ReactNode; h?: number }) {
  const v = useAppear(0, 520);
  const w = Math.min(useWindowDimensions().width - 32, 420);
  return (
    <Animated.View style={pop(v, 0.94)} accessible accessibilityLabel={label}>
      <Svg width={w} height={(w * h) / W} viewBox={`0 0 ${W} ${h}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}
export function Say({
  x,
  y,
  s,
  fill,
  size = 13,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  s: string;
  fill: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
}) {
  return (
    <SvgText x={x} y={y} fontSize={size} fontWeight="700" fill={fill} textAnchor={anchor} fontFamily={font.bodyBold}>
      {s}
    </SvgText>
  );
}

/* a person, standing: a round head and a soft body */
export function Person({ x, y, s = 1, fill, face }: { x: number; y: number; s?: number; fill: string; face?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Circle cx={0} cy={-48} r={11} fill={fill} />
      <Path d="M-17 0 L-17 -16 Q-17 -33 0 -33 Q17 -33 17 -16 L17 0 Z" fill={fill} />
      {face ? <Circle cx={4} cy={-47} r={1.8} fill={face} /> : null}
    </G>
  );
}
/* a white bear, small, as a thought: a dark line keeps it clear on a pale cloud and a dark sky alike */
export const BEAR_LINE = '#2A1E5C';
export function Bear({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill: string; eye?: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`} stroke={BEAR_LINE} strokeWidth={1.6}>
      <Rect x={-15} y={4} width={7} height={13} rx={3.5} fill={fill} />
      <Rect x={8} y={4} width={7} height={13} rx={3.5} fill={fill} />
      <Ellipse cx={0} cy={0} rx={20} ry={12} fill={fill} />
      <Circle cx={13} cy={-16} r={3.4} fill={fill} />
      <Circle cx={22} cy={-16} r={3.4} fill={fill} />
      <Circle cx={18} cy={-8} r={9} fill={fill} />
      <Circle cx={21} cy={-9} r={1.4} fill={BEAR_LINE} stroke="none" />
      <Circle cx={26} cy={-6} r={1.8} fill={BEAR_LINE} stroke="none" />
    </G>
  );
}
/* a thought cloud */
export function Cloud({ x, y, w, h, fill }: { x: number; y: number; w: number; h: number; fill: string }) {
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />
      <Circle cx={x + w * 0.22} cy={y + h + 9} r={5} fill={fill} />
      <Circle cx={x + w * 0.14} cy={y + h + 19} r={3} fill={fill} />
    </G>
  );
}
