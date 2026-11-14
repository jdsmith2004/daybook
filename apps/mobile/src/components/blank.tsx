/* A blank to fill in, on Today (the owner, November 13, 2026: "blanks that they need to press to add"): a short dashed line where the
   person's own words will go, the way a form leaves a line to write on. It shows what is missing with no sentence asking for it
   (docs/design-standards.md, "Show it, do not say it"); the row around it is what the tap opens. */
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { SVG_HIDE } from '@/components/shapes';

export function Blank({ color, h = 24, flex = 1 }: { color: string; h?: number; flex?: number }) {
  return (
    <View style={{ flex, height: h, justifyContent: 'flex-end', minWidth: 48 }}>
      <Svg width="100%" height={4} {...SVG_HIDE}>
        <Line x1={2} y1={2} x2="100%" y2={2} stroke={color} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" />
      </Svg>
    </View>
  );
}
