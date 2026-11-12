/* Future you, for any screen that wants to hand the person their own note (core future.ts): SOS's second page uses the hook,
   and the Screen Time wait and the end of the morning set can call these (docs/plan.md, "The morning, not the moment").

   - `useHasFutureNote()`: whether there is a note to offer.
   - `useFutureNote(on)`: the note for this screen, picked once so it holds still (the newest until it has been offered, then
     they take turns), marked as offered once `on` is true.
   - `<FutureNoteCard on />`: the note itself, ready to drop in: "From you, 3 days ago" and one big play button (a recording,
     never played by itself), or the written words on a sun card. Nothing when there is no note.
   - To invite a new note, open the page: `router.push('/future')`. It asks one question, records or takes words, and keeps it.
   The notes never leave the phone. */
import { futureCap, futurePick, type FutureNote } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { T } from '@/components/ui';
import { BigPlay } from '@/components/voice-note';
import { track } from '@/lib/events';
import { futureUri, seenFuture, useFuture } from '@/lib/future';
import { font, useTheme } from '@/lib/theme';

export function useHasFutureNote(): boolean {
  return useFuture().notes.length > 0;
}

/** the note for this screen: picked once there is one, marked as offered once `on` (a written one counts as read then) */
export function useFutureNote(on: boolean): { n: FutureNote | null; uri: string | null; cap: string } {
  const mem = useFuture();
  const [n, setN] = useState<FutureNote | null>(() => futurePick(mem));
  /* the notes are read from the phone after the first render: pick as soon as they are there */
  useEffect(() => {
    if (!n && mem.notes.length) setN(futurePick(mem));
  }, [mem, n]);
  const [now] = useState(() => Date.now());
  const seen = useRef(false);
  useEffect(() => {
    if (!on || !n || seen.current) return;
    seen.current = true;
    seenFuture(n.id);
    if (n.k === 'text') track('future_heard', { note: 'text' });
  }, [on, n]);
  return { n, uri: n ? futureUri(n) : null, cap: n ? futureCap(n, now) : '' };
}

/** the note, ready to drop into a screen. `onEnd`: a recording played to the end. */
export function FutureNoteCard({ on = true, size = 112, onEnd }: { on?: boolean; size?: number; onEnd?: () => void }) {
  const c = useTheme();
  const { n, uri, cap } = useFutureNote(on);
  if (!n) return null;
  if (n.k === 'text')
    return (
      <View style={[s.note, { backgroundColor: c.sunSoft }]}>
        <T v="eyebrow" tone="sunText">
          {cap}
        </T>
        <Text style={[s.t, { color: c.ink }]}>{n.t}</Text>
      </View>
    );
  if (!uri) return null;
  return (
    <View style={s.voice}>
      <BigPlay uri={uri} label="Hear your note" size={size} onPlay={() => track('future_heard', { note: 'voice' })} onEnd={onEnd} />
      <T v="small" tone="muted">
        {cap}
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  note: { alignSelf: 'stretch', gap: 8, padding: 20, borderRadius: 20 },
  t: { fontFamily: font.displayBold, fontSize: 22, lineHeight: 30 },
  voice: { alignItems: 'center', gap: 10 },
});
