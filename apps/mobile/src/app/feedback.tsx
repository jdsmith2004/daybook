/* Ideas and feedback: any idea or change, straight to the person who builds Daybook (the owner, November 2, 2026), with no
   name and no email unless the person adds one to get a reply (core feedbackClean, services/api pulse.ts, which keeps it
   and emails it to the owner). Reached from the Ideas button at the top left of Today, from More, and from the lesson finish
   ("Feedback on this lesson"), which opens it about that lesson.
   It slides up as a sheet (the owner, November 14, 2026: "the add feedback page should actually be a slide up page and so
   should this one"). The box and Send stay together near the top, where the keyboard leaves them in sight; the person's own
   flame waits below and cheers when it is sent. A lesson's feedback says which lesson it is about at the start of the words,
   so nothing new is sent beside them (the privacy page, Feedback). */
import { FEEDBACK_LEN, gameCompute } from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field } from '@/components/choices';
import { FlameMedallion } from '@/components/flame-medallion';
import { Busy, HelpLine } from '@/components/help-line';
import { Dock, Finish } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { sendFeedback } from '@/lib/pulse';
import { useStore } from '@/lib/store';

/** what a lesson's feedback starts with, so the owner knows which lesson it is about */
const aboutLesson = (n: string, title: string) => `About lesson ${n}, ${title}: `;

export default function Feedback() {
  const { snap, tk } = useStore();
  const st = snap.settings;
  const q = useLocalSearchParams<{ n?: string; title?: string }>();
  const lesson = q.n && q.title ? { n: String(q.n).slice(0, 4), title: String(q.title).slice(0, 80) } : null;
  /* the person's own flame, as it is on Today */
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [st, snap.days, snap.reviews, tk]);
  const [t, setT] = useState('');
  const [r, setR] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const head = lesson ? aboutLesson(lesson.n, lesson.title) : '';

  const send = async () => {
    if (!t.trim() || busy) return;
    setBusy(true);
    setErr('');
    const ok = await sendFeedback((head + t.trim()).slice(0, FEEDBACK_LEN), r);
    setBusy(false);
    if (ok) {
      buzz('save');
      setSent(true);
    } else setErr('It did not go through. Check the connection and try again. Your words are still here.');
  };

  if (sent)
    return (
      <SheetFrame title="Thank you">
        <Finish
          level={level}
          cheer
          size={180}
          title="It is on its way"
          text={
            r.trim()
              ? 'Every note is read. When there is news, it will come to the address you gave.'
              : 'Every note is read. You left no address, so it stays anonymous.'
          }
        />
        <Dock>
          <Button label="Done" onPress={closeSheet} />
        </Dock>
      </SheetFrame>
    );

  return (
    <SheetFrame
      title={lesson ? 'This lesson' : 'Your idea'}
      sub={lesson ? `Lesson ${lesson.n}, ${lesson.title}` : 'Big or small, it goes straight to the person who builds Daybook.'}>
      <View style={s.form}>
        <Field
          label={lesson ? 'What you thought of this lesson' : 'Your idea'}
          hideLabel
          multiline
          maxLength={FEEDBACK_LEN - head.length}
          value={t}
          onChangeText={setT}
          placeholder={lesson ? 'Like: this one hit home, or this part lost me.' : 'Like: I wish I could see my whole week at a glance.'}
          style={{ minHeight: 120 }}
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
          <View style={s.busy}>
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
      </View>
      <View style={s.flame} pointerEvents="none">
        <FlameMedallion level={level} size={150} />
      </View>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  form: { gap: 14, marginTop: 8 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flame: { alignItems: 'center', marginTop: 28 },
});
