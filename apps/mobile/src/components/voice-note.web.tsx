/* The web has no voice note (see lib/voice.web.ts), so these show nothing there. */
export function VoicePlay(_p: { uri: string; label: string }) {
  return null;
}
export function useNoteRecorder(_max: number) {
  return { on: false, sec: 0, start: async () => {}, stop: async () => {}, tmp: null as string | null, denied: false, fail: '', clear: () => {} };
}
export function BigPlay(_p: { uri: string; label: string; onPlay?: () => void; onEnd?: () => void; size?: number }) {
  return null;
}
