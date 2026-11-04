/* The trail's mirror (the owner, November 4, 2026: "use the camera and show me what you look like and be like, is this who
   you want to be?"): for one cue of the guided 2 minutes, the front camera shows the person their own face, in a round
   window where the place's picture was. Only a live preview: nothing is taken, recorded, saved or sent. With no camera (a
   simulator, a computer without one) or no permission, the cue asks them to picture their face instead. */
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Device from 'expo-device';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { TW } from '@/components/trail-art';
import { font } from '@/lib/theme';

/** whether the mirror can show, and a way to ask for the camera (once: a no is kept, and the cue pictures the face) */
export function useMirror() {
  const [perm, request] = useCameraPermissions();
  const [has, setHas] = useState(Platform.OS !== 'web' && Device.isDevice);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    CameraView.isAvailableAsync()
      .then(setHas)
      .catch(() => setHas(false));
  }, []);
  const on = has && !!perm?.granted;
  const ask = async () => {
    if (!has) return false;
    if (perm?.granted) return true;
    if (perm && !perm.canAskAgain) return false;
    try {
      return (await request()).granted;
    } catch {
      return false;
    }
  };
  return { on, ask };
}

/** the round window with their face in it, fading in */
export function Mirror({ size }: { size: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a]);
  return (
    <Animated.View
      accessible
      accessibilityLabel="Your face, from the front camera. Nothing is recorded."
      style={[s.wrap, { opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
      <View style={[s.ring, { width: size, height: size, borderRadius: size / 2 }]}>
        <CameraView style={StyleSheet.absoluteFill} facing="front" />
      </View>
      <Text style={s.note}>Nothing is recorded</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  ring: { overflow: 'hidden', borderWidth: 3, borderColor: TW.sun, backgroundColor: TW.room },
  note: { fontFamily: font.body, fontSize: 13, color: TW.muted },
});
