/* The account sheet: create an account or sign in, right inside the app, with no browser page. Email and password, then the
   6-digit code from the email (it goes on by itself once all six digits are in), and the person is signed in. Also: choosing a
   password for an account made with a temporary one, and "Forgot password". Sign in with Apple, where it is offered, is one
   tap above all that (lib/apple.ts); it opens the same account as the email when that email is confirmed. Opened by sync.signInNow, from Settings, the
   account card on Today, and a lesson that opens with an account (which then opens by itself). */
import { CognitoError, emailOk, PASSWORD_MIN, passwordOk } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from '@/components/text';

import { AppleButton } from '@/components/apple-button';
import { Field } from '@/components/choices';
import { Segments } from '@/components/form';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { SYNC_NEED } from '@/components/support';
import { SyncBody, TrustChoice } from '@/components/sync-card';
import { LinkText } from '@/components/today';
import { Button, Icon, T } from '@/components/ui';
import { apple, appleOffered, askApple } from '@/lib/apple';
import { cognito, keepTokens, type Session } from '@/lib/auth';
import { HelpLine } from '@/components/help-line';
import { buzz } from '@/lib/feel';
import { useSync } from '@/lib/sync';
import { font, useTheme } from '@/lib/theme';

type Step = 'start' | 'code' | 'newpw' | 'forgot' | 'reset' | 'done';

export default function Account() {
  const c = useTheme();
  const sync = useSync();
  const p = useLocalSearchParams<{ why?: string; then?: string; email?: string }>();
  const [mode, setMode] = useState<'new' | 'in'>(p.why === 'in' ? 'in' : 'new');
  const [step, setStep] = useState<Step>('start');
  const [email, setEmail] = useState(p.email || '');
  /* a new account types the email twice: it is the way back in, and a typo there cannot be fixed later */
  const [email2, setEmail2] = useState('');
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const chal = useRef('');
  const session = useRef<Session | null>(null);
  /* the code (or the new password) was taken, and only the sign-in after it failed (no connection): trying again signs in
     without using the code twice, which the account would turn down */
  const codeTaken = useRef(false);
  const [appleOk, setAppleOk] = useState(false);
  /* signed in with Apple: the email is Apple's, already confirmed */
  const [viaApple, setViaApple] = useState(false);
  useEffect(() => {
    let live = true;
    appleOffered().then((v) => live && setAppleOk(v));
    return () => {
      live = false;
    };
  }, []);
  if (sync.status.k === 'off') return <Redirect href="/" />;

  const run = async (f: () => Promise<void>) => {
    if (busy) return;
    setErr('');
    setNote('');
    setBusy(true);
    try {
      await f();
    } catch (e) {
      setErr(e instanceof CognitoError ? e.message : 'Could not reach your account. Check the connection and try again. Your log is safe on this phone.');
      buzz('tap');
    } finally {
      setBusy(false);
    }
  };
  /* signed in: keep the session, let sync carry on, and go where the person was headed */
  const finish = async (t: Parameters<typeof keepTokens>[0]) => {
    const s = await keepTokens(t);
    session.current = s;
    setStep('done');
    buzz('save');
    await sync.startWith(s);
  };
  /* signed in, but the account could not be reached to bring the log together: try again */
  const retry = () =>
    run(async () => {
      if (session.current) await sync.startWith(session.current);
    });
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
  /* Apple's sheet, then the account it opens (made the first time); closing the sheet changes nothing and says nothing */
  const withApple = () =>
    run(async () => {
      try {
        const t = await apple.signIn(await askApple());
        setViaApple(true);
        await finish(t);
      } catch (e) {
        if (e instanceof CognitoError && e.code === 'AppleCancel') return;
        throw e;
      }
    });
  const start = () =>
    run(async () => {
      if (!emailOk(email)) throw new CognitoError('InvalidParameterException', 'Check the email address and try again.');
      if (mode === 'new' && email.trim().toLowerCase() !== email2.trim().toLowerCase())
        throw new CognitoError('InvalidParameterException', 'The two emails do not match. Check them both.');
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
          } catch (e2) {
            /* no connection is said as that; anything else: this email has an account, so the sheet turns to Sign in */
            if (e2 instanceof CognitoError && e2.code === 'Network') throw e2;
            setMode('in');
            setPw('');
            throw new CognitoError(
              'UsernameExistsException',
              'There is already an account with this email. Sign in with its password, or tap Forgot password.',
            );
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
      if (!codeTaken.current) {
        try {
          await cognito.confirm(email, v);
        } catch (e) {
          /* already confirmed (the code went through before the connection dropped): sign in */
          if (!(e instanceof CognitoError && e.code === 'NotAuthorizedException')) throw e;
        }
        codeTaken.current = true;
      }
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
          ? 'Your plan is built. A free account opens every lesson, and for supporters it keeps your plan, your log and your progress safe, and the same on every device you use. It is private to you.'
          : 'A free account opens every lesson, and for supporters it keeps a copy of your progress safe and the same on every device you use. It is private to you.';

  let body;
  const failed = sync.status.k === 'error' || sync.status.k === 'expired';
  if (step === 'done')
    body =
      sync.status.k === 'ask' ? (
        <SyncBody />
      ) : failed ? (
        <View style={{ gap: 14, paddingVertical: 8 }}>
          <T v="h2">{mode === 'new' ? 'Your account is made.' : 'You are signed in.'}</T>
          <T tone="danger" accessibilityLiveRegion="polite">
            {sync.status.k === 'error' ? sync.status.msg : 'Sign in again to keep syncing.'}
          </T>
          <T tone="muted">Your log is safe on this device. Daybook tries again each time it opens.</T>
          {busy ? <ActivityIndicator color={c.accent} /> : <Button label="Try again" onPress={retry} />}
          {p.then ? <LinkText label="Open the lesson" onPress={leave} /> : null}
        </View>
      ) : (
        <View style={{ gap: 14, alignItems: 'center', paddingVertical: 8 }}>
          <View style={[s.ok, { backgroundColor: c.mintSoft }]}>
            <Icon name="check" size={34} color={c.mintText} />
          </View>
          <T v="h2" style={{ textAlign: 'center' }}>
            {mode === 'new' && !viaApple ? 'Your account is ready.' : 'You are signed in.'}
          </T>
          <T tone="muted" style={{ textAlign: 'center' }}>
            {sync.status.k === 'busy'
              ? sync.status.what
              : (sync.status.k === 'need' ? 'Every lesson is open. ' + SYNC_NEED : 'Your log is kept safe, and every lesson is open.') +
                (mode === 'new' && !viaApple ? ' Confirm your email in Settings any time, so a forgotten password can be reset.' : '')}
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
              codeTaken.current = false;
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
              if (!codeTaken.current) await cognito.reset(email, code, pw);
              codeTaken.current = true;
              await signIn();
            })
          }
        />
      </>
    );
  else
    body = (
      <>
        {appleOk ? (
          <View style={s.apple}>
            <AppleButton onPress={withApple} disabled={busy} />
            <View style={s.or} accessibilityRole="text" accessibilityLabel="Or use your email">
              <View style={[s.orLine, { backgroundColor: c.line }]} />
              <T v="small" tone="muted">
                or use your email
              </T>
              <View style={[s.orLine, { backgroundColor: c.line }]} />
            </View>
          </View>
        ) : null}
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
        {mode === 'new' ? (
          <Field
            label="Email again"
            value={email2}
            onChangeText={setEmail2}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />
        ) : null}
        <Pw value={pw} onChange={setPw} show={show} setShow={setShow} label="Password" isNew={mode === 'new'} onSubmit={start} />
        {mode === 'new' ? (
          <T v="small" tone="muted">
            At least {PASSWORD_MIN} characters. A short sentence you will remember works well.
          </T>
        ) : null}
        <Button
          label={mode === 'new' ? 'Create my account' : 'Sign in'}
          onPress={start}
          disabled={busy || !email.trim() || !pw || (mode === 'new' && !email2.trim())}
        />
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
        <>
          <T tone="danger" accessibilityLiveRegion="polite">
            {err}
          </T>
          <HelpLine subject="Daybook: signing in" />
        </>
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
  apple: { gap: 22, paddingTop: 10, paddingBottom: 8 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth * 2, borderRadius: 1 },
  ok: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  pwHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
