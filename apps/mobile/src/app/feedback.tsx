/* Ideas and feedback: any idea or change, straight to the person who builds Daybook (the owner, November 2, 2026), with no
   name and no email unless the person adds one to get a reply (core feedbackClean, services/api pulse.ts, which keeps it
   and emails it to the owner). Reached from the Ideas button at the top left of Today and from More. The box and its Send
   button stay together at the top, where the keyboard does not cover them. */
import { FEEDBACK_LEN } from '@daybook/core';
import { useState } from 'react';
import { View } from 'react-native';

import { Field } from '@/components/choices';
import { Busy, HelpLine } from '@/components/help-line';
import { Dock } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { sendFeedback } from '@/lib/pulse';

export default function Feedback() {
  const [t, setT] = useState('');
  const [r, setR] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const send = async () => {
    if (!t.trim() || busy) return;
    setBusy(true);
    setErr('');
    const ok = await sendFeedback(t, r);
    setBusy(false);
    if (ok) {
      buzz('save');
      setSent(true);
    } else setErr('It did not go through. Check the connection and try again. Your words are still here.');
  };
  if (sent)
    return (
      <SheetFrame title="Thank you">
        <T>
          It is with me now. I read every note, and I will do my very best with yours.{' '}
          {r.trim() ? 'When there is news about it, it will come to the address you gave.' : 'You did not leave an address, so it stays anonymous.'}
        </T>
        <Dock>
          <Button label="Done" onPress={closeSheet} />
        </Dock>
      </SheetFrame>
    );
  return (
    <SheetFrame title="Your idea">
      <T>
        Any idea, any change, anything that would make Daybook better for you. It comes straight to me, the person who builds Daybook, and I will do my very
        best to make it happen.
      </T>
      <Field
        label="Your words"
        hideLabel
        multiline
        autoFocus
        maxLength={FEEDBACK_LEN}
        value={t}
        onChangeText={setT}
        placeholder="Like: I wish I could see my whole week at a glance."
        style={{ minHeight: 140 }}
      />
      <Field
        label="Your email, to hear back (optional)"
        value={r}
        onChangeText={setR}
        placeholder="Only if you want a reply"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        inputMode="email"
      />
      <Button label={busy ? 'Sending…' : 'Send'} disabled={!t.trim() || busy} onPress={send} />
      {busy ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Busy label="Sending" />
          <T tone="muted">Your words are on their way…</T>
        </View>
      ) : null}
      {err ? (
        <>
          <T tone="muted">{err}</T>
          <HelpLine subject="Daybook feedback" />
        </>
      ) : null}
      <T v="small" tone="muted">
        No name is sent, and no email unless you type one. Notes are kept for 180 days.
      </T>
    </SheetFrame>
  );
}
