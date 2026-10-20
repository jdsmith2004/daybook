/* The account sheet: create an account or sign in, right inside the app, with no browser page. Email and password, then the
   6-digit code from the email (it goes on by itself once all six digits are in), and the person is signed in. Also: choosing a
   password for an account made with a temporary one, and "Forgot password". Opened by sync.signInNow, from Settings, the
   account card on Today, and a lesson that opens with an account (which then opens by itself). */
import { CognitoError, emailOk, PASSWORD_MIN, passwordOk } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from '@/components/text';

import { Field } from '@/components/choices';
import { Segments } from '@/components/form';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { SyncBody, TrustChoice } from '@/components/sync-card';
import { LinkText } from '@/components/today';
import { Button, Icon, T } from '@/components/ui';
import { cognito, keepTokens } from '@/lib/auth';
import { buzz } from '@/lib/feel';
import { useSync } from '@/lib/sync';
import { font, useTheme } from '@/lib/theme';

type Step = 'start' | 'code' | 'newpw' | 'forgot' | 'reset' | 'done';

export default function Account() {
  const c = useTheme();
  const sync = useSync();
  const p = useLocalSearchParams<{ why?: string; then?: string }>();
  const [mode, setMode] = useState<'new' | 'in'>(p.why === 'in' ? 'in' : 'new');
  const [step, setStep] = useState<Step>('start');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const chal = useRef('');
  if (sync.status.k === 'off') return <Redirect href="/" />;

  const run = async (f: () => Promise<void>) => {
    if (busy) return;
    setErr('');
    setNote('');
    setBusy(true);
    try {
      await f();
    } catch (e) {
      setErr(e instanceof CognitoError ? e.message : 'Something went wrong. Try again in a moment.');
      buzz('tap');
    } finally {
      setBusy(false);
    }
  };
  /* signed in: keep the session, let sync carry on, and go where the person was headed */
  const finish = async (t: Parameters<typeof keepTokens>[0]) => {
    const s = await keepTokens(t);
    setStep('done');
    buzz('save');
    await sync.startWith(s);
  };
  const leave = () => {
    if (p.then) router.replace({ pathname: '/lesson/[id]', params: { id: p.then } });
    else closeSheet();
  };
  const signIn = async () => {
    const r = await cognito.signIn(email, pw);
    if (r.k === 'ok') await finish(r.tokens);
    else if (r.k === 'newPassword') {
      chal.current = r.session;
      setPw('');
      setStep('newpw');
    } else {
      await cognito.resend(email).catch(() => undefined);
      setCode('');
      setStep('code');
    }
  };
  const start = () =>
    run(async () => {
      if (!emailOk(email)) throw new CognitoError('InvalidParameterException', 'Check the email address and try again.');
      if (mode === 'new') {
        if (!passwordOk(pw))
          throw new CognitoError('InvalidPasswordException', `Pick a password with at least ${PASSWORD_MIN} characters. A short sentence works well.`);
        let r;
        try {
          r = await cognito.signUp(email, pw);
        } catch (e) {
          /* signed up before but never entered the code (or it is theirs and the password is right): carry on from there */
          if (!(e instanceof CognitoError && e.code === 'UsernameExistsException')) throw e;
          try {
            await signIn();
            return;
          } catch {
            throw e;
          }
        }
        if (r.confirmed) await signIn();
        else {
          setCode('');
          setStep('code');
        }
      } else await signIn();
    });
  const confirm = (v: string) =>
    run(async () => {
      await cognito.confirm(email, v);
      await signIn();
    });
  const onCode = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 6);
    setCode(d);
    if (d.length === 6) confirm(d);
  };

  const why =
    mode === 'in'
      ? 'Sign in to bring your log, your plan and your progress to this device.'
      : p.why === 'lesson'
        ? 'The first three lessons are open to everyone. A free account opens all of them.'
        : p.why === 'setup'
          ? 'Your plan is built. A free account keeps it, your log and your progress safe, and the same on every device you use. It is private to you.'
          : 'A free account keeps a copy of your progress safe and the same on every device you use. It is private to you.';

  let body;
  if (step === 'done')
    body =
      sync.status.k === 'ask' ? (
        <SyncBody />
      ) : (
        <View style={{ gap: 14, alignItems: 'center', paddingVertical: 8 }}>
          <View style={[s.ok, { backgroundColor: c.mintSoft }]}>
            <Icon name="check" size={34} color={c.mintText} />
          </View>
          <T v="h2" style={{ textAlign: 'center' }}>
            {mode === 'new' ? 'Your account is ready.' : 'You are signed in.'}
          </T>
          <T tone="muted" style={{ textAlign: 'center' }}>
            {sync.status.k === 'busy' ? sync.status.what : 'Your log is kept safe, and every lesson is open.'}
          </T>
          {sync.status.k === 'busy' ? <ActivityIndicator color={c.accent} /> : <Button label={p.then ? 'Open the lesson' : 'Done'} onPress={leave} />}
        </View>
      );
  else if (step === 'code')
    body = (
      <>
        <T>
          We sent a 6-digit code to <T style={{ fontFamily: font.bodyBold }}>{email.trim()}</T>. Enter it here.
        </T>
        <TextInput
          value={code}
          onChangeText={onCode}
          autoFocus
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === 'web' ? 'one-time-code' : 'sms-otp'}
          maxLength={6}
          accessibilityLabel="The 6-digit code"
          placeholder="••••••"
          placeholderTextColor={c.muted}
          style={[s.code, { backgroundColor: c.surface, borderColor: code.length === 6 ? c.accent : c.line, color: c.ink }]}
        />
        {busy ? <ActivityIndicator color={c.accent} /> : null}
        <View style={s.links}>
          <LinkText label="Send the code again" onPress={() => run(async () => (await cognito.resend(email), setNote('A new code is on its way.')))} />
          <LinkText label="Use a different email" onPress={() => (setStep('start'), setErr(''))} />
        </View>
        <T v="small" tone="muted">
          It can take a minute to arrive. Check the spam folder too.
        </T>
      </>
    );
  else if (step === 'newpw')
    body = (
      <>
        <T>Choose your own password to finish signing in.</T>
        <Pw value={pw} onChange={setPw} show={show} setShow={setShow} label="New password" isNew />
        <Button
          label="Save and sign in"
          onPress={() => run(async () => finish(await cognito.newPassword(email, chal.current, pw)))}
          disabled={busy || !passwordOk(pw)}
        />
      </>
    );
  else if (step === 'forgot')
    body = (
      <>
        <T>Enter your email, and we will send a code to set a new password.</T>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <Button
          label="Send the code"
          disabled={busy || !emailOk(email)}
          onPress={() =>
            run(async () => {
              await cognito.forgot(email);
              setCode('');
              setPw('');
              setStep('reset');
            })
          }
        />
        <LinkText label="Back to sign in" onPress={() => setStep('start')} />
      </>
    );
  else if (step === 'reset')
    body = (
      <>
        <T>
          Enter the code we sent to <T style={{ fontFamily: font.bodyBold }}>{email.trim()}</T>, and a new password.
        </T>
        <Field
          label="Code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={6}
        />
        <Pw value={pw} onChange={setPw} show={show} setShow={setShow} label="New password" isNew />
        <Button
          label="Save and sign in"
          disabled={busy || code.length !== 6 || !passwordOk(pw)}
          onPress={() =>
            run(async () => {
              await cognito.reset(email, code, pw);
              await signIn();
            })
          }
        />
      </>
    );
  else
    body = (
      <>
        <Segments
          label="Create an account or sign in"
          list={[
            ['new', 'Create an account'],
            ['in', 'Sign in'],
          ]}
          cur={mode}
          onPick={(m) => (setMode(m), setErr(''))}
        />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType={mode === 'new' ? 'emailAddress' : 'username'}
          returnKeyType="next"
        />
        <Pw value={pw} onChange={setPw} show={show} setShow={setShow} label="Password" isNew={mode === 'new'} onSubmit={start} />
        {mode === 'new' ? (
          <T v="small" tone="muted">
            At least {PASSWORD_MIN} characters. A short sentence you will remember works well.
          </T>
        ) : null}
        <Button label={mode === 'new' ? 'Create my account' : 'Sign in'} onPress={start} disabled={busy || !email.trim() || !pw} />
        {mode === 'in' ? <LinkText label="Forgot your password?" onPress={() => (setStep('forgot'), setErr(''))} /> : null}
        <TrustChoice />
      </>
    );

  return (
    <SheetFrame
      title={step === 'done' ? 'Welcome' : step !== 'start' ? 'Your account' : mode === 'new' ? 'Create your free account' : 'Welcome back'}
      sub={step === 'start' ? why : undefined}>
      {body}
      {busy && step === 'start' ? <ActivityIndicator color={c.accent} /> : null}
      {err ? (
        <T tone="danger" accessibilityLiveRegion="polite">
          {err}
        </T>
      ) : null}
      {note ? (
        <T tone="mintText" accessibilityLiveRegion="polite">
          {note}
        </T>
      ) : null}
      {step !== 'done' ? (
        <T v="small" tone="muted">
          SOS, your plan and logging always work, with or without an account. <LinkText label="What is kept" onPress={() => router.push('/privacy')} />
        </T>
      ) : null}
    </SheetFrame>
  );
}

/** a password field with a Show button */
function Pw({
  value,
  onChange,
  show,
  setShow,
  label,
  isNew,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: (b: boolean) => void;
  label: string;
  isNew?: boolean;
  onSubmit?: () => void;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <View style={s.pwHead}>
        <T v="label">{label}</T>
        <Pressable accessibilityRole="button" accessibilityLabel={show ? 'Hide the password' : 'Show the password'} onPress={() => setShow(!show)} hitSlop={10}>
          <T v="small" style={{ fontFamily: font.bodySemi, color: c.accentText }}>
            {show ? 'Hide' : 'Show'}
          </T>
        </Pressable>
      </View>
      <Field
        label={label}
        hideLabel
        value={value}
        onChangeText={onChange}
        secureTextEntry={!show}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete={isNew ? 'new-password' : 'current-password'}
        textContentType={isNew ? 'newPassword' : 'password'}
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

const s = StyleSheet.create({
  code: { fontFamily: font.display, fontSize: 32, letterSpacing: 12, textAlign: 'center', borderWidth: 2, borderRadius: 18, paddingVertical: 14 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  ok: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  pwHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
