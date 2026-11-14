/* A video's still picture, 16:9, from YouTube (core loveThumb). YouTube's picture is 4:3 with black bands, and filling a 16:9
   box crops the bands away. With no connection the box stays its dark color, so a card never looks broken. A big card carries
   a play mark in its middle. */
import { loveThumb } from '@daybook/core';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const FRAME = '#14101F';

export function VideoThumb({ id, radius = 20, play }: { id: string; radius?: number; play?: boolean }) {
  return (
    <View style={[s.box, { borderRadius: radius }]}>
      <Image source={{ uri: loveThumb(id) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityIgnoresInvertColors />
      {play ? (
        <View style={s.center} pointerEvents="none">
          <View style={s.play}>
            <PlayMark size={26} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function PlayMark({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill={color} />
    </Svg>
  );
}

const s = StyleSheet.create({
  box: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', backgroundColor: FRAME },
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  play: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', paddingLeft: 3, backgroundColor: 'rgba(20,16,31,0.55)' },
});
