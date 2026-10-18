/* A text to your safe person, ready to send: the button opens the messages app with the words already written, to their
   number when one is saved in My plan (on this device only), or for you to pick who. On a computer, where there is no
   messages app to open, the words are copied instead. */
import { safeName, smsLink } from '@daybook/core';
import * as Clipboard from 'expo-clipboard';
import { Linking, Platform } from 'react-native';

import { Button } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

const ua = () => (Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.userAgent : '');
/* an iPad asking for the desktop site says it is a Mac, but it has a touch screen */
const isIos = () =>
  Platform.OS === 'ios' || /iPhone|iPad|iPod/.test(ua()) || (/Macintosh/.test(ua()) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
const canText = () => Platform.OS !== 'web' || isIos() || /Android/.test(ua());

/** opens the messages app with the text ready, or copies it where there is none */
export function useSendText() {
  const { snap, say } = useStore();
  const { phone } = useSos();
  const nm = safeName(snap.settings);
  const copy = (body: string) =>
    Clipboard.setStringAsync(body)
      .then(() => say(nm ? 'Copied. Paste it in a message to ' + nm + '.' : 'Copied. Paste it in your messages.'))
      .catch(() => say('Could not copy. Press and hold the text to copy it.'));
  return (body: string) => {
    buzz('tap');
    if (!canText()) return copy(body);
    const link = smsLink(phone, body, isIos());
    /* on a phone's browser, going to the link (not a new tab) is what opens the messages app */
    if (Platform.OS === 'web') window.location.href = link;
    else Linking.openURL(link).catch(() => copy(body));
  };
}

/** "Text Sam": one tap to a ready message */
export function SafeTextButton({ body, kind = 'primary' }: { body: string; kind?: 'primary' | 'ghost' }) {
  const { snap } = useStore();
  const send = useSendText();
  const nm = safeName(snap.settings);
  return <Button icon="chat" kind={kind} label={nm ? 'Text ' + nm : 'Text someone'} onPress={() => send(body)} />;
}
