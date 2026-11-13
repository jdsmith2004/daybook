/* Bringing a Mithras journal over (core mithras.ts, lib/mithras.ts). Opened by the link from Mithras (daybook://import/mithras), which
   is the only way it opens up front, or from the quiet row in More, Save a copy.

   One thing per page. Sign in to Mithras: Apple, low by the thumb, with the Mithras email and password as the quiet second way (those two
   boxes and their button sit at the top, since the keyboard covers the bottom). Then what was found, the number of entries big in the
   middle and the longest run and the Campfire under it, with Bring it over. Then the fire, big: "Your fire came with you". The Mithras
   sign-in is used once to read, then signed out and forgotten. Before setup, the yes is held in memory, setup's first answers come from
   Mithras, and the journal lands as setup ends (Today opens this again). The X closes it, and the link is not offered again. */
import {
  CognitoError,
  evBand,
  gameCompute,
  mithrasApply,
  mithrasPlan,
  mithrasPreview,
  MITHRAS_WORDS,
  MithrasError,
  type MithrasDone,
  type MithrasRows,
  type MSession,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppleButton } from '@/components/apple-button';
import { Appear } from '@/components/appear';
import { Field, Link } from '@/components/choices';
import { FlameMedallion } from '@/components/flame-medallion';
import { Dock, Finish, SceneFrame, Stage } from '@/components/scene';
import { Button, T } from '@/components/ui';
import { askApple } from '@/lib/apple';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { mithras, mithrasAppleOffered, mithrasHeld, setMithrasOpen, setMithrasPending } from '@/lib/mithras';
import { close, closeAll } from '@/lib/nav';
import { SAVE_FAILED, useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Step = 'sign' | 'email' | 'reading' | 'found' | 'landing' | 'done';

export default function MithrasImport() {
  const params = useLocalSearchParams<{ from?: string }>();
  const { snap, tk, replace, current, ready } = useStore();
  const win = useWindowDimensions();
  const c = useTheme();
  const st = snap.settings;
  const [step, setStep] = useState<Step>(() => (st && mithrasHeld.rows ? 'landing' : 'sign'));
  const [apple, setApple] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState<MithrasRows | null>(null);
  const [done, setDone] = useState<MithrasDone | null>(null);
  const how = useRef<'apple' | 'email'>('email');
  /* the Mithras entries that came (a very long one lands as several Daybook entries, but is one entry to the person) */
  const rowsIn = useRef(0);
  const fromLink = params.from !== 'settings';

  useEffect(() => {
    setMithrasOpen(true);
    return () => setMithrasOpen(false);
  }, []);
  useEffect(() => {
    mithrasAppleOffered().then(setApple, () => setApple(false));
    /* the link: remembered until the journal lands or this is closed, so a setup that must come first does not lose it */
    if (fromLink && !mithrasHeld.rows) {
      setMithrasPending(true);
      track('import', { stage: 'link' });
    } else if (!mithrasHeld.rows) track('import', { stage: 'open' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = useMemo(() => (rows ? mithrasPlan(rows, st?.rollover ?? 4, tk) : null), [rows, st?.rollover, tk]);
  const look = useMemo(() => (plan ? mithrasPreview(snap, plan, tk) : null), [plan, snap, tk]);
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [snap, st, tk]);

  /* ---------- landing it ---------- */
  /* one landing at a time: saving it changes the settings, which wakes the effect below again before this one has finished; a second
     landing would find everything already here and put "Everything was already here" over the real moment */
  const landing = useRef(false);
  const land = async (r: MithrasRows) => {
    if (landing.current) return;
    landing.current = true;
    setStep('landing');
    try {
      const cur = current().snap;
      const p = mithrasPlan(r, cur.settings?.rollover ?? 4, tk);
      const out = mithrasApply(cur, p, tk);
      rowsIn.current = out.added + out.replaced ? p.rows : 0;
      await replace(out.snap, out.changed);
      mithrasHeld.rows = null;
      setMithrasPending(false);
      track('import', { stage: 'landed', how: how.current, ents: evBand(out.added + out.replaced), days: evBand(p.wins.length + p.slips.length) });
      buzz('lit');
      setDone(out);
      setStep('done');
    } catch {
      track('import', { stage: 'failed' });
      landing.current = false;
      /* back on the found page with what was read, so Bring it over can be tried again (after setup, the page began with none) */
      setRows(r);
      setErr(SAVE_FAILED);
      setStep('found');
    }
  };
  /* back from setup with the yes already given: it lands at once */
  useEffect(() => {
    if (!ready || step !== 'landing' || done || !st || !mithrasHeld.rows) return;
    how.current = mithrasHeld.how || 'email';
    land(mithrasHeld.rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, step, st]);

  /* ---------- signing in and reading ---------- */
  const read = async (signIn: () => Promise<MSession>) => {
    setErr('');
    setStep('reading');
    let s: MSession;
    try {
      s = await signIn();
    } catch (e) {
      const code = e instanceof MithrasError ? e.code : 'other';
      track('import', { stage: 'failed', how: how.current });
      setErr(MITHRAS_WORDS[code]);
      setStep(how.current === 'email' ? 'email' : 'sign');
      return;
    }
    track('import', { stage: 'signed_in', how: how.current });
    try {
      const r = await mithras.read(s);
      setRows(r);
      setPw('');
      setStep('found');
      track('import', { stage: 'read', how: how.current });
    } catch (e) {
      setErr(MITHRAS_WORDS[e instanceof MithrasError ? e.code : 'other']);
      setStep(how.current === 'email' ? 'email' : 'sign');
      track('import', { stage: 'failed', how: how.current });
    } finally {
      /* the Mithras sign-in is used once: signed out, and the token dropped with this page */
      mithras.signOut(s);
    }
  };
  const withApple = async () => {
    how.current = 'apple';
    let a;
    try {
      a = await askApple();
    } catch (e) {
      if (e instanceof CognitoError && e.code === 'AppleCancel') return;
      setErr(e instanceof CognitoError ? e.message : MITHRAS_WORDS.apple);
      return;
    }
    await read(() => mithras.signInApple(a.token, a.nonce));
  };
  const withEmail = () => {
    how.current = 'email';
    if (!email.trim() || !pw) return;
    read(() => mithras.signInEmail(email, pw));
  };

  const bring = () => {
    if (!rows) return;
    if (!st) {
      /* setup comes first: the yes is held here, setup starts from Mithras's answers, and the journal lands as it ends */
      mithrasHeld.rows = rows;
      mithrasHeld.how = how.current;
      router.replace('/setup');
      return;
    }
    land(rows);
  };
  const shut = () => {
    if (step !== 'done') {
      setMithrasPending(false);
      mithrasHeld.rows = null;
      track('import', { stage: 'closed' });
    }
    close();
  };
  const again = () => {
    setRows(null);
    setErr('');
    setStep(apple ? 'sign' : 'email');
  };

  const flame = (n: number, pulse?: number) => (
    <View style={s.mid}>
      <FlameMedallion level={n} size={Math.min(win.width - 120, win.height * 0.3, 240)} pulse={pulse} />
    </View>
  );
  const error = err ? (
    <T tone="danger" style={s.c} accessibilityLiveRegion="polite">
      {err}
    </T>
  ) : null;

  /* ---------- the pages ---------- */
  if (step === 'done' && done) {
    const n = rowsIn.current;
    const words = done.campfire
      ? {
          h: 'Your fire came with you.',
          p: `${n ? entries(n) + ' and ' : ''}the work you did in Mithras. Your flame starts as a ${done.level.name}, and everything you do here grows it.`,
        }
      : n || done.slips || done.wins
        ? {
            h: 'Your journal came with you.',
            p: n ? `${entries(n)} are in your journal now, with the days you kept in Mithras.` : 'The days you kept in Mithras are on your record now.',
          }
        : { h: 'Everything was already here.', p: 'Nothing in Mithras has changed since the last time.' };
    return (
      <SceneFrame title="From Mithras" sky="ember" onClose={closeAll}>
        <Stage key="done" dir={0}>
          {/* the first import is a celebration: the fire pops in at its new form and the shapes burst out once (scene.tsx Finish) */}
          {done.campfire ? (
            <Finish level={done.level.n} size={Math.min(win.width - 140, 220)} title={words.h} text={words.p} alive always least={0.7} />
          ) : (
            <>
              {flame(done.level.n, 1)}
              <Appear by={12} delay={260} duration={420}>
                <T v="title" style={s.c} accessibilityRole="header">
                  {words.h}
                </T>
                <T style={[s.c, s.gap]}>{words.p}</T>
              </Appear>
            </>
          )}
          <Dock>
            <Button label="Done" onPress={closeAll} />
            {n ? <Link label="Open the journal" onPress={() => (closeAll(), setTimeout(() => router.push('/journal'), 350))} /> : null}
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  if (step === 'reading' || step === 'landing')
    return (
      <SceneFrame title="From Mithras" sky="night" onClose={shut}>
        <T v="title" style={s.c} accessibilityRole="header">
          {step === 'reading' ? 'Finding your journal.' : 'Bringing it over.'}
        </T>
        {flame(level)}
        <Dock>
          <ActivityIndicator color={c.sun} />
        </Dock>
      </SceneFrame>
    );

  if (step === 'found' && plan && look) {
    const empty = !look.entries && !look.days;
    return (
      <SceneFrame title="From Mithras" sky="night" onClose={shut}>
        <Stage key="found">
          <T v="title" style={s.c} accessibilityRole="header">
            {empty ? 'This Mithras account is empty.' : look.entries ? 'Your journal is here.' : 'Your streak is here.'}
          </T>
          {empty ? (
            <T tone="muted" style={s.c}>
              It has no journal entries and no streak to bring.
            </T>
          ) : null}
          {empty ? (
            flame(level)
          ) : (
            <View style={s.mid}>
              <T style={s.num} accessibilityLabel={entries(look.entries || look.days)}>
                {look.entries || look.days}
              </T>
              <T v="label" style={s.c}>
                {look.entries ? (look.entries === 1 ? 'entry' : 'entries') : look.days === 1 ? 'day kept' : 'days kept'}
              </T>
              <View style={s.facts}>
                {look.entries && look.days ? <T style={s.c}>{look.days + (look.days === 1 ? ' day' : ' days')} of your streak</T> : null}
                {look.longest ? <T style={s.c}>Your longest run, {look.longest + (look.longest === 1 ? ' day' : ' days')}</T> : null}
                {look.form ? <T style={[s.c, { color: c.sun }]}>Your fire starts as a {look.form}</T> : null}
              </View>
              <T v="small" tone="muted" style={[s.c, s.stay]}>
                Your goals, reflections and coach chats stay in Mithras.
              </T>
            </View>
          )}
          {error}
          <Dock>
            {!st && !empty ? (
              <T v="small" tone="muted" style={s.c}>
                First a few questions, so Daybook fits you. Your journal comes in as you finish.
              </T>
            ) : null}
            {empty ? <Button label="Use another account" onPress={again} /> : <Button label="Bring it over" onPress={bring} />}
            {empty ? null : <Link label="Use another Mithras account" onPress={again} />}
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  if (step === 'email' || !apple)
    return (
      <SceneFrame title="From Mithras" sky="night" onBack={apple ? () => (setErr(''), setStep('sign')) : null} onClose={shut}>
        <Stage key="email">
          <T v="title" style={s.c} accessibilityRole="header">
            Bring your Mithras journal
          </T>
          <T tone="muted" style={s.c}>
            Sign in with your Mithras email. It goes only to Mithras, and Daybook reads only your own journal and streak.
          </T>
          {/* the boxes and their button stay together at the top: the keyboard covers the bottom while typing */}
          <View style={s.form}>
            <Field
              label="Mithras email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="username"
              returnKeyType="next"
            />
            <Field
              label="Mithras password"
              value={pw}
              onChangeText={setPw}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={withEmail}
            />
            {error}
            <Button label="Find my journal" onPress={withEmail} disabled={!email.trim() || !pw} />
          </View>
          {flame(level)}
        </Stage>
      </SceneFrame>
    );

  return (
    <SceneFrame title="From Mithras" sky="night" onClose={shut}>
      <Stage key="sign" dir={0}>
        <T v="title" style={s.c} accessibilityRole="header">
          Bring your Mithras journal
        </T>
        <T tone="muted" style={s.c}>
          Your entries, your streak and your longest run come with you. Daybook reads only your own Mithras journal, straight to this phone.
        </T>
        {flame(level)}
        {error}
        <Dock>
          <AppleButton onPress={withApple} label="Continue with Apple" />
          <Link label="Use my Mithras email" onPress={() => (setErr(''), setStep('email'))} />
        </Dock>
      </Stage>
    </SceneFrame>
  );
}

const entries = (n: number) => n + (n === 1 ? ' entry' : ' entries');

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  gap: { marginTop: 8 },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  num: { fontFamily: font.display, fontSize: 88, lineHeight: 96, textAlign: 'center' },
  facts: { marginTop: 18, gap: 6 },
  stay: { marginTop: 16 },
  form: { gap: 14, marginTop: 20, alignSelf: 'stretch' },
});
