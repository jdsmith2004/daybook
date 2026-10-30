/* Day 1, once: tell the safe person you started (core startTellText). A start that someone else knows about is not a
   secret, and not hiding is part of who the person is becoming. Daybook sends nothing: the messages app opens with the
   words ready, and either answer puts the card away for good. */
import { safeName, startTellText, tellStartDone, tellStartDue, type Snapshot } from '@daybook/core';
import { View } from 'react-native';

import { Link } from '@/components/choices';
import { useSendText } from '@/components/safe-text';
import { Button, Card, T } from '@/components/ui';
import { useStore } from '@/lib/store';

export function TellStartCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const { apply } = useStore();
  const send = useSendText();
  const st = snap.settings!;
  if (!tellStartDue(st, tk)) return null;
  const nm = safeName(st);
  const text = startTellText(st);
  const done = () => apply({ st: tellStartDone(st, tk) });
  return (
    <Card>
      <T v="h2">Day 1. Tell {nm} you started?</T>
      <T tone="muted">One short message. You do not have to say what it is. A start someone else knows about is easier to keep.</T>
      <T selectable>{'“' + text + '”'}</T>
      <Button
        icon="chat"
        label={'Text ' + nm}
        onPress={() => {
          send(text);
          done();
        }}
      />
      <View style={{ alignItems: 'center' }}>
        <Link label="Not this time" onPress={done} />
      </View>
    </Card>
  );
}
