/* Future you (core future.ts): a short note, on a good day, to the self who will face the next urge. Opened from a win (the
   ridden-out page, a new level or form) and from My plan. A page like a lesson, as the feedback page is: the warm sun sky,
   the question at the top, the person's own flame in the middle saying why, and the answer low, where the thumb is. One tap
   records (up to 45 seconds, spoken to "you"); "Write it instead" opens a box. Nothing is kept until Keep it. The note stays
   on this phone. The web writes only (no private place for a recording there). */
import { FUTURE_QS, FUTURE_TEXT_MAX, FUTURE_VOICE_MAX, gameCompute } from '@daybook/core';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field, Link } from '@/components/choices';
import { SHORT, useFitRoom } from '@/components/fit';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { Shell } from '@/components/lesson-parts';
import { Next } from '@/components/lx';
import { Text } from '@/components/text';
import { T } from '@/components/ui';
import { BigPlay, useNoteRecorder } from '@/components/voice-note';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { keepFutureText, keepFutureVoice, nextFutureQ } from '@/lib/future';
import { lessonLook } from '@/lib/lesson-look';
import { close } from '@/lib/nav';
import { openPhoneSettings } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import { voiceOk } from '@/lib/voice';

const clock = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

export default function Future() {
  const base = useTheme();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
  const { snap, tk } = useStore();
  const st = snap.settings;
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [st, snap.days, snap.reviews, tk]);
  const look = lessonLook('sun', 1, base.scheme);
  const [q] = useState(nextFutureQ);
  const ask = FUTURE_QS[q] || FUTURE_QS[0];
  const rec = useNoteRecorder(FUTURE_VOICE_MAX);
  const [write, setWrite] = useState(!voiceOk);
  const [t, setT] = useState('');
  const [kept, setKept] = useState<'voice' | 'text' | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pulse, setPulse] = useState(0);
  const want = SHORT ? 190 : 250;

  const keep = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    try {
      if (write) {
        if (!(await keepFutureText(t, q))) return;
      } else if (rec.tmp) await keepFutureVoice(rec.tmp, q);
      else return;
      const k = write ? 'text' : 'voice';
      track('future_kept', { note: k });
      buzz('save');
      setKept(k);
      setPulse((n) => n + 1);
    } catch {
      setErr('That did not save. Try again.');
    } finally {
      setBusy(false);
    }
  };

  let body: React.ReactNode;
  let foot: React.ReactNode;
  if (kept) {
    body = (
      <>
        <T v="title" style={SHORT ? s.titleShort : s.title} accessibilityRole="header">
          Kept for the next hard moment
        </T>
        <Bubble
          text={
            kept === 'voice'
              ? 'When SOS opens, you will hear yourself right after the first breath.'
              : 'When SOS opens, your words come right after the first breath.'
          }
        />
        <FlameSlot size={want + 40} min={SHORT ? 120 : 150} />
      </>
    );
    foot = <Next label="Done" noIcon onPress={close} />;
  } else if (write) {
    body = (
      <>
        <T v="title" style={SHORT ? s.titleShort : s.title} accessibilityRole="header">
          {ask.q}
        </T>
        <Field
          label={ask.q}
          hideLabel
          multiline
          autoFocus
          maxLength={FUTURE_TEXT_MAX}
          value={t}
          onChangeText={setT}
          placeholder={ask.ex}
          style={{ minHeight: SHORT ? 96 : 120 }}
        />
        {err ? <T tone="danger">{err}</T> : null}
        <Bubble text="Say it to the next you, like a friend who knows." style={s.bubble} />
        <FlameSlot size={want} min={SHORT ? 110 : 140} />
      </>
    );
    foot = (
      <View style={s.foot}>
        <Next label={busy ? 'Keeping…' : 'Keep it'} noIcon off={!t.trim() || busy} onPress={keep} />
        {voiceOk ? (
          <View style={s.c}>
            <Link label="Record it instead" tone="muted" onPress={() => setWrite(false)} />
          </View>
        ) : null}
      </View>
    );
  } else {
    body = (
      <>
        <T v="title" style={SHORT ? s.titleShort : s.title} accessibilityRole="header">
          {ask.q}
        </T>
        <T tone="muted" style={s.p}>
          {ask.ex}
        </T>
        {rec.on ? (
          <View style={s.mid}>
            <Text style={[s.clock, { color: base.ink }]} accessibilityLiveRegion="polite" accessibilityLabel={'Recording, ' + rec.sec + ' seconds'}>
              {clock(rec.sec)}
            </Text>
          </View>
        ) : rec.tmp ? (
          <View style={s.mid}>
            <BigPlay key={rec.tmp} uri={rec.tmp} label="Hear it back" size={96} />
          </View>
        ) : (
          <>
            <Bubble text="The next time it gets hard, this is the first voice you hear. Yours." style={s.bubble} />
            <FlameSlot size={want} min={SHORT ? 110 : 140} />
          </>
        )}
        {rec.denied ? (
          <View style={{ gap: 4 }}>
            <T tone="danger">Daybook needs the microphone to record. You can turn it on in your phone’s settings, or write it instead.</T>
            <Link label="Open settings" onPress={openPhoneSettings} />
          </View>
        ) : null}
        {rec.fail || err ? <T tone="danger">{rec.fail || err}</T> : null}
      </>
    );
    foot = (
      <View style={s.foot}>
        {rec.on ? (
          <Next label="Stop" noIcon onPress={rec.stop} />
        ) : rec.tmp ? (
          <Next label={busy ? 'Keeping…' : 'Keep it'} noIcon off={busy} onPress={keep} />
        ) : (
          <Next label="Record" noIcon onPress={rec.start} />
        )}
        {rec.on ? null : (
          <View style={s.c}>
            {rec.tmp ? (
              <Link label="Record again" tone="muted" onPress={rec.start} />
            ) : (
              <Link label="Write it instead" tone="muted" onPress={() => setWrite(true)} />
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <Shell
      look={look}
      level={level}
      flameOn={!rec.on && !rec.tmp}
      pulse={pulse}
      inset={inset}
      scroll={scroll}
      fit={fit}
      bodyKey={kept ? 'kept' : write ? 'write' : 'rec'}
      onClose={close}
      foot={foot}>
      {body}
    </Shell>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 28, lineHeight: 34 },
  titleShort: { fontSize: 22, lineHeight: 28 },
  p: { fontSize: SHORT ? 15 : 17, lineHeight: SHORT ? 21 : 24 },
  foot: { flex: 1, gap: 4 },
  c: { alignItems: 'center' },
  bubble: { marginTop: 8 },
  mid: { flexGrow: 1, minHeight: 200, alignItems: 'center', justifyContent: 'center' },
  clock: { fontFamily: font.displayBold, fontSize: 64, lineHeight: 72, fontVariant: ['tabular-nums'] },
});
