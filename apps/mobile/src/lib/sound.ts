/* The sound guide on iOS and Android: a soft tone on each breath, and a chime when a timer ends. Off unless the person turns it
   on. The tones are small files made by tools/make-sounds.mjs from the legacy tone() numbers. The web version is sound.web.ts. */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { getSoundPref } from './prefs';

export type SoundName = 'in' | 'in2' | 'out' | 'on' | 'chime';
const FILES: Record<SoundName, number> = {
  in: require('../../assets/sounds/in.wav'),
  in2: require('../../assets/sounds/in2.wav'),
  out: require('../../assets/sounds/out.wav'),
  on: require('../../assets/sounds/on.wav'),
  chime: require('../../assets/sounds/chime.wav'),
};
const players: Partial<Record<SoundName, AudioPlayer>> = {};
let ready = false;

export function play(name: SoundName, force = false) {
  if (!force && !getSoundPref()) return;
  try {
    if (!ready) {
      ready = true;
      /* the phone's silent switch wins, and other audio keeps playing */
      setAudioModeAsync({
        playsInSilentMode: false,
        interruptionMode: 'mixWithOthers',
      }).catch(() => undefined);
    }
    const p = players[name] || (players[name] = createAudioPlayer(FILES[name]));
    p.seekTo(0).catch(() => undefined);
    p.play();
  } catch {
    /* sound is a nicety: never let it break a hard moment */
  }
}
