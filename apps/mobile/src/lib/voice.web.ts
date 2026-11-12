/* The web has no voice note: a recording would have nowhere private to live. See voice.ts. */
export const voiceOk = false;
export const VOICE_MAX = 60;
export const useVoice = (): { uri: string | null; v: number } => ({ uri: null, v: 0 });
export async function keepVoice(_tmp: string) {}
export function dropVoice() {}
export const noteUri = (_id: string): string | null => null;
export async function keepNoteFile(_tmp: string, _id: string) {}
export function dropNoteFile(_id: string) {}
export async function takeOldVoice(_id: string): Promise<{ at: number } | null> {
  return null;
}
