/* Send feedback: a few words to the person who builds Daybook, with no name and no email unless the person adds one to get
   a reply (core feedbackClean, services/api pulse.ts). The box and its Send button stay together at the top, where the
   keyboard does not cover them. */
import { FEEDBACK_LEN } from '@daybook/core';
import { useState } from 'react';

import { Field } from '@/components/choices';
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
      <SheetFrame title="Thank you" sub="It went straight to the person who builds Daybook.">
        <T>
          Every note is read. {r.trim() ? 'If a reply helps, it will come to the address you gave.' : 'You did not leave an address, so it stays anonymous.'}
        </T>
        <Dock>
          <Button label="Done" onPress={closeSheet} />
        </Dock>
      </SheetFrame>
    );
  return (
    <SheetFrame title="Send feedback" sub="What helps, what does not, what is missing. No name and no email are sent.">
      <Field
        label="Your words"
        hideLabel
        multiline
        autoFocus
        maxLength={FEEDBACK_LEN}
        value={t}
        onChangeText={setT}
        placeholder="Like: the sunrise check helped, but I did not know what the flames meant."
        style={{ minHeight: 140 }}
      />
      <Field
        label="To get a reply (optional)"
        value={r}
        onChangeText={setR}
        placeholder="An email address, only if you want an answer"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        inputMode="email"
      />
      <Button label={busy ? 'Sending' : 'Send'} disabled={!t.trim() || busy} onPress={send} />
      {err ? <T tone="muted">{err}</T> : null}
      <T v="small" tone="muted">
        Do not include anything you would not want read. Feedback is kept for 180 days.
      </T>
    </SheetFrame>
  );
}
