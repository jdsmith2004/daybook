/* My playbook: the person's own words and what each lesson gave them, on one page, with a button to copy it all as text.
   Ported from the legacy viewBook. */
import { LCHECKS, LESSONS, lessonIndex, lessonsDone, lwriteOf, playbookText, slipSteps } from '@daybook/core';
import * as Clipboard from 'expo-clipboard';
import { Redirect, router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Link } from '@/components/choices';
import { HelpFoot } from '@/components/help-foot';
import { Screen } from '@/components/screen';
import { Button, Card, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

function Box({ title, children, link }: { title: string; children: ReactNode; link?: [string, () => void] }) {
  return (
    <Card>
      <T v="h2">{title}</T>
      {children}
      {link ? <Link label={link[0]} onPress={link[1]} /> : null}
    </Card>
  );
}

function Note({ label, text }: { label: string; text: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 2, padding: 10, borderRadius: 12, backgroundColor: c.surface2 }}>
      <T v="small" tone="muted">
        {label}
      </T>
      <T>{text}</T>
    </View>
  );
}

export default function Book() {
  const { snap, say } = useStore();
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const done = lessonsDone(snap.days);
  const notes = (st.learn && st.learn.notes) || {};
  const picks = (st.learn && st.learn.picks) || {};
  const rule = (st.rule || '').trim();
  const plan = (st.plan || []).filter((r) => r.when && r.when.trim() && r.when.indexOf('______') < 0);
  const slip = slipSteps(st);
  const mine = LESSONS.filter((L) => done.has(L.id));
  const wrote = LCHECKS.map((C, k) => ({ n: k + 1, C, a: lwriteOf(st, k + 1) })).filter((x) => x.a.some((t) => t.trim()));
  const openPlan = (sub: string) => router.push({ pathname: '/plan', params: { pane: 'plans', sub } });
  const toLearn = () => router.navigate('/learn');
  const copy = () => {
    const text = playbookText(st, done, LESSONS, (id) => LESSONS.findIndex((L) => L.id === id), LCHECKS);
    Clipboard.setStringAsync(text)
      .then(() => say('Copied.'))
      .catch(() => say('Could not copy. Press and hold the text to copy it.'));
  };
  return (
    <Screen title="My playbook" sub={<T tone="muted">My reasons, my plan, and what the lessons gave me</T>} back="My plan">
      <T>Read this on a hard night, or just before one. It gathers what you wrote and what you took from each lesson, in one place. Only you see it.</T>
      <Box title="Why I am doing this" link={['Open my reasons', () => router.push('/reasons')]}>
        {st.reasons.length ? st.reasons.map((r, i) => <T key={i}>• {r}</T>) : <T tone="muted">No reasons yet. Add one and it shows up here.</T>}
      </Box>
      {rule ? (
        <Box title="My rule">
          <T>{rule}</T>
        </Box>
      ) : null}
      <Box title="If this, then that" link={['Open my urge plan', () => openPlan('urge')]}>
        {plan.length ? (
          plan.map((r, i) => (
            <T key={i}>
              <T v="label">If</T> {r.when}
              {'\n'}
              <T v="label">Then</T> {r.then && r.then.trim() ? r.then : <T tone="muted" style={{ fontStyle: 'italic' }}>not filled in yet</T>}
            </T>
          ))
        ) : (
          <T tone="muted">Your urge plan is empty. Fill in a line and it shows up here.</T>
        )}
      </Box>
      <Box title="If I slip" link={['Open my slip plan', () => openPlan('slip')]}>
        {slip.length ? (
          slip.map((t, i) => (
            <T key={i}>
              {i + 1}. {t}
            </T>
          ))
        ) : (
          <T tone="muted">No steps yet. Add one and it shows up here.</T>
        )}
      </Box>
      <Box title="What I have learned" link={['All lessons', toLearn]}>
        {mine.length ? (
          mine.map((L) => (
            <View key={L.id} style={{ gap: 6 }}>
              <T v="label">
                {lessonIndex(L) + 1}. {L.title}
              </T>
              <T>{L.key}</T>
              {picks[L.id] ? <Note label="What I picked" text={picks[L.id]} /> : null}
              {notes[L.id] ? <Note label={L.np} text={String(notes[L.id])} /> : null}
            </View>
          ))
        ) : (
          <T tone="muted">Finish a lesson and its one-line takeaway shows up here, with your note.</T>
        )}
      </Box>
      <Box title="What I wrote" link={wrote.length ? undefined : ['Open the lessons', toLearn]}>
        {wrote.length ? (
          wrote.map((x) => (
            <View key={x.n} style={{ gap: 6 }}>
              <T v="label">
                Checkpoint {x.n}: {x.C.t}
              </T>
              {x.C.q.map((q, i) => (x.a[i] && x.a[i].trim() ? <Note key={i} label={q} text={x.a[i]} /> : null))}
            </View>
          ))
        ) : (
          <T tone="muted">After every second lesson there is a short piece of writing. What you write shows up here. Only you see it.</T>
        )}
      </Box>
      <Button kind="ghost" icon="copy" label="Copy it all as text" onPress={copy} />
      <HelpFoot />
    </Screen>
  );
}
