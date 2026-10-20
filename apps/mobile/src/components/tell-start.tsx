/* Day 1, once: tell the safe person you started (core startTellText). A start that someone else knows about is not a
   secret, and not hiding is part of who the person is becoming. Daybook sends nothing: the messages app opens with the
   words ready, and either answer puts the card away for good. */
import { safeName, startTellText, tellStartDone, tellStartDue, type Snapshot } from '@daybook/core';
import { View } from 'react-native';

import { Link } from '@/components/choices';
import { useSendText } from '@/components/safe-text';
import { Button, Card, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export function TellStartCard({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const { apply } = useStore();
  const send = useSendText();
  const st = snap.settings!;
  if (!tellStartDue(st, tk)) return null;
  const nm = safeName(st);
  const text = startTellText(st);
  const done = () => apply({ st: tellStartDone(st, tk) });
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="chat" size={22} color={c.accentText} />
        <T v="label" style={{ flex: 1 }}>
          Day 1. Tell {nm} you started?
        </T>
      </View>
      <T v="small">One short message. You do not have to say what it is. A start someone else knows about is easier to keep.</T>
      <View style={{ padding: 12, borderRadius: 14, backgroundColor: c.surface2 }}>
        <T v="small" selectable>
          {text}
        </T>
      </View>
      <Button
        icon="chat"
        label={'Text ' + nm}
        onPress={() => {
          send(text);
          done();
        }}
      />
      <Link label="Not this time" onPress={done} />
    </Card>
  );
}
