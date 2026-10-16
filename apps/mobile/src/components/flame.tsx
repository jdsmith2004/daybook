/* The flame spirit, drawn from the same SVG the legacy app makes, so every level looks the same as before. */
import { emblemXml } from '@daybook/core';
import { memo, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

export const Flame = memo(function Flame({ level, size = 96 }: { level: number; size?: number }) {
  const xml = useMemo(() => emblemXml(level), [level]);
  return <SvgXml xml={xml} width={size} height={size} accessibilityLabel={`Your flame, level ${level}`} />;
});
