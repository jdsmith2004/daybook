/* My plan's notes for hard moments (Future you, core future.ts): the notes left on good days, newest first, each to hear or
   read and to remove, and a link to leave a new one. They stay on this phone. */
import { FUTURE_MAX, futureAge } from '@daybook/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PageLink } from '@/components/editable';
import { Text } from '@/components/text';
import { Button, T } from '@/components/ui';
import { VoicePlay } from '@/components/voice-note';
import { dropFuture, futureUri, useFuture } from '@/lib/future';
import { font, useTheme } from '@/lib/theme';

export function FutureList() {
  const c = useTheme();
  const mem = useFuture();
  const [sure, setSure] = useState<string | null>(null);
  const now = Date.now();
  return (
    <View style={{ gap: 12 }}>
      {mem.notes.map((n) => {
        const uri = futureUri(n);
        return (
          <View key={n.id} style={{ gap: 6 }}>
            {n.k === 'text' ? <Text style={[s.t, { color: c.ink }]}>{n.t}</Text> : uri ? <VoicePlay uri={uri} label="Hear it" /> : null}
            <View style={s.row}>
              <T v="small" tone="muted" style={{ flex: 1 }}>
                {(n.k === 'voice' ? 'Your voice, ' : 'Written ') + futureAge(n.at, now)}
              </T>
              {sure === n.id ? null : <Button kind="ghost" icon="trash" label="Remove…" onPress={() => setSure(n.id)} />}
            </View>
            {sure === n.id ? (
              <View style={[s.confirm, { backgroundColor: c.dangerSoft }]}>
                <T v="label">Remove this note?</T>
                <T v="small" tone="muted">
                  It is only on this phone, so it cannot be brought back.
                </T>
                <View style={s.row}>
                  <Button
                    kind="danger"
                    label="Yes, remove it"
                    onPress={() => {
                      dropFuture(n.id);
                      setSure(null);
                    }}
                  />
                  <Button kind="ghost" label="Keep it" onPress={() => setSure(null)} />
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
      <PageLink icon="mic" label={mem.notes.length ? 'Leave a new note' : 'Leave a note for the next hard moment'} onPress={() => router.push('/future')} />
      <T v="small" tone="muted">
        {mem.notes.length >= FUTURE_MAX ? 'Up to ' + FUTURE_MAX + ' are kept: a new one takes the place of the oldest. ' : ''}
        SOS offers the newest right after the first breath. They stay on this phone.
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  t: { fontFamily: font.body, fontSize: 17, lineHeight: 24 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  confirm: { gap: 8, padding: 12, borderRadius: 14 },
});
