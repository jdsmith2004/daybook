/* The web has no voice note: a recording would have nowhere private to live. See voice.ts. */
export const voiceOk = false;
export const VOICE_MAX = 60;
export const useVoice = (): { uri: string | null; v: number } => ({ uri: null, v: 0 });
export async function keepVoice(_tmp: string) {}
export function dropVoice() {}
