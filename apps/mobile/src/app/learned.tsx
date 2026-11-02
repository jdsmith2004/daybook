/* What I have learned: each finished lesson's takeaway with my notes and picks, what I wrote at the checkpoints, and "Copy it
   all as text". It lived in My plan as the Learned part until November 2026; it sits with Learn now, where it is made. */
import { LCHECKS, lcheckNo, lessonCount, lessonNo, lessonWalk, LESSONS, lessonsDone, lwriteOf, playbookText } from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Hair, PageLink, PageSec } from '@/components/editable';
import { Screen } from '@/components/screen';
import { T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font } from '@/lib/theme';
import { copyText } from '@/lib/words';

/** what the lessons gave me (the old My playbook): each takeaway with my notes, what I wrote, and copy it all */
export default function Learned() {
  const { snap, say } = useStore();
  const st = snap.settings;
  if (!st) return <Redirect href="/" />;
  const done = lessonsDone(snap.days);
  const notes = (st.learn && st.learn.notes) || {};
  const picks = (st.learn && st.learn.picks) || {};
  const mine = LESSONS.filter((L) => done.has(L.id));
  /* each checkpoint's writing under its own record, shown in the path's order and with the number the path gives it */
  const wrote = LCHECKS.map((C, k) => ({ n: k + 1, C, a: lwriteOf(st, k + 1) }))
    .filter((x) => x.a.some((t) => t.trim()))
    .sort((a, b) => lcheckNo(a.n, st) - lcheckNo(b.n, st));
  const toLearn = () => router.navigate('/learn');
  const copy = () => {
    const text = playbookText(
      st,
      done,
      LESSONS,
      (id) => LESSONS.findIndex((L) => L.id === id),
      LCHECKS,
      (n) => lcheckNo(n, st),
    );
    copyText(text, say);
  };
  const Note = ({ label, text }: { label: string; text: string }) => (
    <View style={s.note}>
      <T v="small" tone="muted">
        {label}
      </T>
      <T>{text}</T>
    </View>
  );
  return (
    <Screen title="What I have learned" back="Learn">
      <PageSec icon="book" tone="sky" title="From each lesson" aside={`${mine.length} of ${lessonCount(lessonWalk(snap.days, st)).of}`}>
        {mine.length ? (
          mine.map((L, j) => (
            <View key={L.id} style={{ gap: 12 }}>
              {j > 0 ? <Hair /> : null}
              <View style={{ gap: 4 }}>
                <T v="small" tone="muted" style={{ fontFamily: font.bodySemi }}>
                  {lessonNo(L, st) ? 'Lesson ' + lessonNo(L, st) + ' · ' : ''}
                  {L.title}
                </T>
                <T>{L.key}</T>
                {picks[L.id] ? <Note label="What I picked" text={picks[L.id]} /> : null}
                {notes[L.id] ? <Note label={L.np} text={String(notes[L.id])} /> : null}
              </View>
            </View>
          ))
        ) : (
          <T tone="muted">No lessons finished yet. Each one leaves a one-line takeaway here, with your note.</T>
        )}
        <PageLink icon="book" label="Open Learn" onPress={toLearn} />
      </PageSec>
      <PageSec icon="pencil" tone="violet" title="What I wrote" sub="Only you see it.">
        {wrote.length ? (
          wrote.map((x) => (
            <View key={x.n} style={{ gap: 4 }}>
              <T v="label">
                Checkpoint {lcheckNo(x.n, st)}: {x.C.t}
              </T>
              {x.C.q.map((q, i) => (x.a[i] && x.a[i].trim() ? <Note key={i} label={q} text={x.a[i]} /> : null))}
            </View>
          ))
        ) : (
          <T tone="muted">No writing yet. After every second lesson there is a short piece of writing, and what you write shows up here.</T>
        )}
      </PageSec>
      <PageLink icon="copy" label="Copy my whole plan as text" onPress={copy} />
    </Screen>
  );
}

const s = StyleSheet.create({
  note: { gap: 2, marginTop: 4 },
});
