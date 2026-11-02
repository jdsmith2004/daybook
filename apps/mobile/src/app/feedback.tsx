/* Ideas and feedback: any idea or change, straight to the person who builds Daybook (the owner, November 2, 2026), with no
   name and no email unless the person adds one to get a reply (core feedbackClean, services/api pulse.ts, which keeps it
   and emails it to the owner). Reached from the Ideas button at the top left of Today and from More.
   It is a page like a lesson (the owner: "maybe a visual or something like a lesson page"): the warm sun sky, and the
   person's own flame below the box, asking for the idea and cheering when it is sent. The box stays near the top, where the
   keyboard leaves it in sight, and Send is the main button low. */
import { FEEDBACK_LEN, gameCompute } from '@daybook/core';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/choices';
import { SHORT, useFitRoom } from '@/components/fit';
import { Busy, HelpLine } from '@/components/help-line';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { Shell } from '@/components/lesson-parts';
import { Next } from '@/components/lx';
import { T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { lessonLook } from '@/lib/lesson-look';
import { close } from '@/lib/nav';
import { sendFeedback } from '@/lib/pulse';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

const ASK = 'Any idea, any change, big or small. It goes straight to the person who made me, and they will do their very best to make it happen.';

export default function Feedback() {
  const base = useTheme();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
  const { snap, tk } = useStore();
  const st = snap.settings;
  /* the person's own flame, as it is on Today */
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [st, snap.days, snap.reviews, tk]);
  const look = lessonLook('sun', 1, base.scheme);
  const [t, setT] = useState('');
  const [r, setR] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  const [pulse, setPulse] = useState(0);
  const want = SHORT ? 210 : 270;

  const send = async () => {
    if (!t.trim() || busy) return;
    setBusy(true);
    setErr('');
    const ok = await sendFeedback(t, r);
    setBusy(false);
    if (ok) {
      buzz('save');
      setSent(true);
      setPulse((n) => n + 1);
    } else setErr('It did not go through. Check the connection and try again. Your words are still here.');
  };

  const body = sent ? (
    <>
      <T v="title" style={SHORT ? s.titleShort : s.title} accessibilityRole="header">
        Thank you
      </T>
      <T tone="muted" style={s.p}>
        {r.trim() ? 'When there is news about your idea, it will come to the address you gave.' : 'You did not leave an address, so it stays anonymous.'}
      </T>
      <Bubble text="It is on its way to the person who made me. Every note is read." />
      <FlameSlot size={want + 40} min={SHORT ? 120 : 150} />
    </>
  ) : (
    <>
      <T v="title" style={SHORT ? s.titleShort : s.title} accessibilityRole="header">
        Your idea
      </T>
      <Field
        label="Your idea"
        hideLabel
        multiline
        maxLength={FEEDBACK_LEN}
        value={t}
        onChangeText={setT}
        placeholder="Like: I wish I could see my whole week at a glance."
        style={{ minHeight: SHORT ? 96 : 120 }}
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
      <T v="small" tone="muted">
        No name is sent, and no email unless you type one. Notes are kept for 180 days.
      </T>
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
      <Bubble text={ASK} style={s.bubble} />
      <FlameSlot size={want} min={SHORT ? 110 : 140} />
    </>
  );

  const foot = (
    <View style={s.foot}>
      {sent ? <Next label="Done" noIcon onPress={close} /> : <Next label={busy ? 'Sending…' : 'Send'} noIcon off={!t.trim() || busy} onPress={send} />}
    </View>
  );

  return (
    <Shell look={look} level={level} flameOn pulse={pulse} inset={inset} scroll={scroll} fit={fit} bodyKey={sent ? 'sent' : 'ask'} onClose={close} foot={foot}>
      {body}
    </Shell>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34 },
  titleShort: { fontSize: 22, lineHeight: 28 },
  p: { fontSize: SHORT ? 15 : 17, lineHeight: SHORT ? 21 : 24 },
  foot: { flex: 1 },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubble: { marginTop: 8 },
});
