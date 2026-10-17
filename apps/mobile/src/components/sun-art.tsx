import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/* the sun coming up over green hills */
export function SunArt({ height = 150 }: { height?: number }) {
  const rays = [-165, -140, -115, -90, -65, -40, -15].map((a) => {
    const r = (a * Math.PI) / 180;
    const c = Math.cos(r);
    const s = Math.sin(r);
    return `M${(150 + 52 * c).toFixed(1)} ${(112 + 52 * s).toFixed(1)}L${(150 + 66 * c).toFixed(1)} ${(112 + 66 * s).toFixed(1)}`;
  });
  return (
    <View style={{ width: '100%', borderRadius: 22, overflow: 'hidden' }}>
      <Svg width="100%" height={height} viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" accessibilityLabel="The sun coming up over green hills">
        <Rect width={300} height={height} fill="#FFE1BE" />
        <Circle cx={150} cy={112} r={96} fill="#FFF1D2" opacity={0.75} />
        <G stroke="#FFB43A" strokeWidth={4} strokeLinecap="round" opacity={0.75}>
          {rays.map((d) => (
            <Path key={d} d={d} />
          ))}
        </G>
        <Circle cx={150} cy={112} r={40} fill="#FFC832" />
        <Circle cx={150} cy={112} r={31} fill="#FFE27A" />
        <Ellipse cx={139.5} cy={95} rx={3.2} ry={4.3} fill="#2A2350" />
        <Ellipse cx={160.5} cy={95} rx={3.2} ry={4.3} fill="#2A2350" />
        <Path d="M142 103q8 7 16 0" fill="none" stroke="#2A2350" strokeWidth={3} strokeLinecap="round" />
        <Path d="M0 112C50 92 100 98 150 114S250 96 300 108V150H0Z" fill="#8ED1A8" />
        <Path d="M0 132C60 116 120 124 170 136S260 122 300 128V150H0Z" fill="#5BB48A" />
      </Svg>
    </View>
  );
}
