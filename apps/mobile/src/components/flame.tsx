/* The flame spirit, drawn from the same SVG the legacy app makes, so every level looks the same as before. */
import { emblemXml } from '@daybook/core';
import { memo, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';

export const Flame = memo(function Flame({ level, size = 96, locked = false, label }: { level: number; size?: number; locked?: boolean; label?: string }) {
  const xml = useMemo(() => emblemXml(level, locked), [level, locked]);
  return <SvgXml xml={xml} width={size} height={size} accessibilityLabel={label ?? `Your flame, level ${level}`} opacity={locked ? 0.55 : 1} />;
});
