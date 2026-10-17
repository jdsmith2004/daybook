/* A lesson. One flow for every lesson: the cover (pick Quick or Full) > one recall question on the lesson before > the cards >
   Done > Put it to work > Practiced. A lesson counts as finished only when the Done card is reached. Nothing on a card, and nothing
   on the practice step, can finish it or send the person away without a way back. Ported from the legacy SCENES.lesson. */
import {
  changeSettings,
  gameCompute,
  guessFeedback,
  LESSONS,
  lessonById,
  lessonHasQuick,
  lessonFamily,
  lessonOpen,
  lessonIndex,
  lessonLog,
  lessonPairOf,
  lessonPractice,
  lessonPracticed,
  lessonRecallOf,
  lessonsDone,
  lessonSeq,
  lcheckWritten,
  lfmt,
  LIST_OF,
  LNOTE_LEN,
  LUNITS,
  LX_E,
  lxGraded,
  lxPct,
  lxPeek,
  lxRcReply,
  lxSheetOf,
  nextAfter,
  faithOf,
  planRows,
  recordLesson,
  srcNote,
  weekOf,
  type Block,
  type Card,
  type Go,
  type Guess,
  type Lesson,
  type Settings,
} from '@daybook/core';
import * as Clipboard from 'expo-clipboard';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, type GestureResponderEvent, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/choices';
import { Flame } from '@/components/flame';
import { LessonArt, LxCheck, LxIco, LxShield, BigNumber } from '@/components/lesson-art';
import { Back, Ghost, Next, Rich, Route } from '@/components/lx';
import { ReasonsBox, SlipEditor, UrgeEditor } from '@/components/plan-editors';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { useAccount } from '@/lib/sync';
import { font, MAX_WIDTH, toneOf, useTheme, type Tone } from '@/lib/theme';

type Stage = 'cover' | 'run' | 'practice' | 'practiced';
interface Sheet {
  t: 'src' | 'reasons' | 'slip' | 'urge';
  i?: number | null;
  from: 'card' | 'practice';
}

export default function LessonScreen() {
  const { id, at } = useLocalSearchParams<{ id: string; at?: string }>();
  const { snap, tk, update, apply, say } = useStore();
  const account = useAccount();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const st = snap.settings;
  const L = lessonById(id);
  /* back from a tool or a page the practice step sent the person to: straight to the result, nothing is replayed */
  const [stage, setStage] = useState<Stage>(at === 'practiced' ? 'practiced' : 'cover');
  const [i, setI] = useState(0);
  const [len, setLen] = useState<'q' | 'f'>('f');
  const [rcOf, setRcOf] = useState<string | null>(null);
  const [rc, setRc] = useState<number | null>(null);
  const [rcTried, setRcTried] = useState<number[]>([]);
  const [pick, setPick] = useState<Record<number, number>>({});
  const [tried, setTried] = useState<Record<number, number[]>>({});
  const [gu, setGu] = useState<Record<number, { v: number | null; lock: boolean }>>({});
  const [gain, setGain] = useState(0);
  const [again, setAgain] = useState(false);
  const [rec, setRec] = useState(at === 'practiced');
  const [prac, setPrac] = useState(at === 'practiced');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const draftSave = useRef<() => boolean>(() => true);
  const onDraft = useCallback((f: () => boolean) => {
    draftSave.current = f;
  }, []);
  const scroll = useRef<ScrollViewInstance>(null);

  if (!st) return <Redirect href="/" />;
  if (!L)
    return (
      <Frame title="Lesson" onClose={close} c={c} inset={inset}>
        <T v="title">That lesson is not here</T>
      </Frame>
    );
  const t = toneOf(c, LUNITS[L.u].tone);
  const n = lessonIndex(L) + 1;
  const done = lessonsDone(snap.days);
  /* a lesson that opens with an account goes straight to the account sheet, and opens by itself after signing up */
  if (!lessonOpen(L, done, faithOf(st), account)) return <Redirect href={{ pathname: '/account', params: { why: 'lesson', then: L.id } }} />;
  const next = nextAfter(L, done, faithOf(st));
  const seq = lessonSeq(L, rcOf, len);
  const top = () => scroll.current?.scrollTo({ y: 0, animated: false });

  /* a line typed into the reasons box is kept when the person moves on; if it cannot be saved, stay */
  const keepDraft = () => draftSave.current();

  const record = () => {
    if (rec) return;
    setRec(true);
    let g = 0;
    let a = false;
    update((s0) => {
      const b0 = gameCompute(s0.days, s0.settings!, s0.reviews, tk).rawPts;
      const r = recordLesson(s0.days, tk, L);
      a = r.again;
      g = Math.max(0, gameCompute(r.days, s0.settings!, s0.reviews, tk).rawPts - b0);
      return { ...s0, days: r.days };
    });
    setGain(g);
    setAgain(a);
    buzz(a ? 'save' : 'lit');
  };
  const step = (d: number) => {
    const to = i + d;
    if (to < 0 || to >= seq.length) return;
    const cur = seq[i];
    if (d > 0 && cur.t === 'card' && cur.c.k === 'guess' && !(gu[cur.ci] && gu[cur.ci].lock)) return;
    setI(to);
    if (seq[to].t === 'done') record();
    top();
  };
  const practiced = () => {
    setPrac(true);
    apply({ st: lessonPracticed(snap.settings!, L.id) });
  };
  const toStage = (s: Stage) => {
    setStage(s);
    top();
  };

  /* one action from the practice step. It never finishes the lesson and never leaves without a way back. */
  const doGo = (g: Go, primary: boolean) => {
    if (g.a === 'copy') {
      Clipboard.setStringAsync(g.text || '')
        .then(() => say('Copied.'))
        .catch(() => say('Could not copy. Press and hold the text to copy it.'));
      practiced();
      if (primary) toStage('practiced');
      return;
    }
    if (LIST_OF[g.a]) {
      addItem(g);
      practiced();
      if (primary) toStage('practiced');
      return;
    }
    const kind = lxSheetOf(g);
    if (kind) {
      practiced();
      setSheet({ t: kind, from: 'practice' });
      return;
    }
    if (!keepDraft()) return;
    practiced();
    setStage('practiced');
    if (g.a === 'scene') router.push({ pathname: '/tool/[id]', params: { id: g.v!, lr: '1' } });
    else if (g.a === 'help') router.push({ pathname: '/help/[id]', params: { id: g.v!, sub: g.sub || '' } });
    else if (g.a === 'growth') router.push('/growth');
    else if (g.a === 'week') router.push({ pathname: '/week/[k]', params: { k: String(Math.max(0, weekOf(tk, st))) } });
    else if (g.a === 'tab') {
      if (g.v === 'settings') router.push({ pathname: '/settings', params: { open: g.open || '' } });
      else if (g.v === 'plan') router.push({ pathname: '/plan', params: { pane: g.open || '' } });
      else {
        close();
        router.navigate('/journal');
      }
    }
  };
  const listHas = (g: Go) => {
    const Lx = LIST_OF[g.a];
    const list = ((snap.settings as unknown as Record<string, string[]>)[Lx[0]] || []) as string[];
    const tx = String(g.text || '')
      .trim()
      .toLowerCase();
    return list.some((x) => String(x).toLowerCase() === tx);
  };
  const addItem = (g: Go) => {
    const [key, max, name] = LIST_OF[g.a];
    const txt = String(g.text || '')
      .trim()
      .slice(0, 100);
    if (!txt) return;
    if (listHas(g)) {
      say('Already on your ' + name + '.');
      return;
    }
    const cur = ((snap.settings as unknown as Record<string, string[]>)[key] || []) as string[];
    if (cur.length >= max) {
      say('Your ' + name + ' is full. You can edit it in My plan, under Lists.');
      return;
    }
    apply({ st: changeSettings(snap.settings!, (s0) => void ((s0 as unknown as Record<string, string[]>)[key] = cur.concat([txt]))) });
    say('Added to your ' + name + '.');
  };

  /* ---------- the card ---------- */
  let prog: ReactNode = null;
  let body: ReactNode;
  let foot: ReactNode = null;
  if (stage === 'cover') {
    const pref = st.learn.len;
    const u = LUNITS[L.u];
    const fam = lessonFamily(L);
    const start = (l: 'q' | 'f') => {
      const ln = l === 'q' && lessonHasQuick(L) ? 'q' : 'f';
      setLen(ln);
      setI(0);
      const P = lessonRecallOf(L, done, faithOf(st));
      setRcOf(P ? P.id : null);
      setRc(null);
      setRcTried([]);
      setStage('run');
      if (lessonHasQuick(L) && st.learn.len !== ln) apply({ st: changeSettings(st, (s0) => void (s0.learn.len = ln)) });
      top();
    };
    body = (
      <>
        <View style={s.art}>
          <LxIco name={L.ic} t={t} />
        </View>
        <Eyebrow icon="flag" label={u.name} t={t} />
        <T style={s.h} accessibilityRole="header">
          {L.title}
        </T>
        {fam ? (
          <T v="small" tone="muted">
            Part {fam.n} of {fam.of} on {fam.f.name === u.name ? 'this idea' : 'one idea: ' + fam.f.name}
          </T>
        ) : null}
        {L.ask ? (
          <View style={[s.ask, { backgroundColor: t.soft }]}>
            <Text style={[s.eye2, { color: t.text }]}>THIS LESSON ANSWERS</Text>
            <Text style={[s.askP, { color: c.ink }]}>{L.ask}</Text>
          </View>
        ) : (
          <T style={s.p}>{L.tag}</T>
        )}
        {done.has(L.id) ? (
          <View style={[s.tag, { backgroundColor: c.mintSoft }]}>
            <Icon name="check" size={14} color={c.mintText} />
            <Text style={{ fontFamily: font.bodyBold, color: c.mintText, fontSize: 13.5 }}>You finished this one</Text>
          </View>
        ) : null}
        {lessonHasQuick(L) ? (
          <View style={{ gap: 10 }} accessibilityLabel="Pick a length">
            <LenBtn t={t} on={pref === 'q'} title="Quick" sub={L.v === 2 ? 'The answer, what to do, one check' : 'The main idea, then one question'} mins="1–2 min" onPress={() => start('q')} />
            <LenBtn t={t} on={pref === 'f'} title="Full" sub={L.v === 2 ? 'Adds a guess and the science behind it' : 'Adds the evidence and why it works'} mins="3–5 min" onPress={() => start('f')} />
            <T v="small" tone="muted">
              You can read it again in the other length any time.
            </T>
          </View>
        ) : (
          <Next label={'Start · about ' + (L.mins || 3) + ' min'} onPress={() => start('f')} />
        )}
      </>
    );
  } else if (stage === 'run') {
    const ix = Math.max(0, Math.min(seq.length - 1, i));
    const it = seq[ix];
    prog = <Prog total={seq.length} i={ix} />;
    const back = ix > 0 ? <Back onPress={() => step(-1)} /> : null;
    if (it.t === 'rc') {
      const P = lessonById(rcOf)!;
      const r = P.rc!;
      body = (
        <>
          <Eyebrow icon={LX_E.recall[0]} label={'Quick recall · lesson ' + (lessonIndex(P) + 1)} t={t} />
          <T style={[s.h, s.hsm]} accessibilityRole="header">
            {r.q}
          </T>
          <Opts
            list={r.c}
            best={r.a}
            pk={rc}
            tried={rcTried}
            t={t}
            onPick={(j) => {
              setRc(j);
              setRcTried((x) => (x.indexOf(j) < 0 ? x.concat(j) : x));
              buzz('tap');
            }}
          />
          {rc != null ? <Reply text={lxRcReply(r, rc)} t={t} /> : null}
          {r.cr && rc != null ? (
            <T v="small" tone="muted">
              Tap any other answer to read its comment.
            </T>
          ) : null}
          <T v="small" tone="muted">
            No points for this one. It just helps the last lesson stick.
          </T>
        </>
      );
      foot = <Next label={rc == null ? 'Skip' : 'Next'} onPress={() => step(1)} />;
    } else if (it.t === 'done') {
      const pr = lessonPractice(L);
      const note = (st.learn.notes && st.learn.notes[L.id]) || '';
      body = (
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Flame level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)} size={92} />
          <T style={[s.h, { textAlign: 'center' }]} accessibilityRole="header">
            {again ? 'Lesson ' + n + ', again' : 'Lesson ' + n + ' done'}
          </T>
          {gain > 0 ? (
            <View style={[s.pill, { backgroundColor: c.sun }]}>
              <Text style={{ fontFamily: font.bodyBold, color: c.onSun, fontSize: 15 }}>+{gain} points</Text>
            </View>
          ) : again ? (
            <T tone="muted">Already counted. Read it as often as you like.</T>
          ) : null}
          <View style={[s.key, { backgroundColor: t.soft }]}>
            {L.ask ? (
              <>
                <Text style={[s.eye2, { color: t.text }]}>YOU ASKED</Text>
                <T>{L.ask}</T>
                <Text style={[s.eye2, { color: t.text, marginTop: 6 }]}>THE ANSWER</Text>
              </>
            ) : (
              <Text style={[s.eye2, { color: t.text }]}>THE ONE THING TO KEEP</Text>
            )}
            <Text style={[s.keyP, { color: c.ink }]}>{L.key}</Text>
          </View>
          {pr && pr.note ? null : <NoteField L={L} note={note} />}
          {done.size >= LESSONS.length ? <T tone="mintText">That is all {LESSONS.length} lessons. They stay in Learn whenever you want to read one again.</T> : null}
          <Pressable accessibilityRole="button" onPress={() => setSheet({ t: 'src', from: 'card' })} style={s.link}>
            <Text style={[s.linkT, { color: c.accentText }]}>Behind this lesson</Text>
          </Pressable>
          {L.u === 1 || L.id === 'l22' || L.care ? (
            <T v="small" tone="muted">
              If this stirs up something heavy, you can call or text <Text style={{ fontFamily: font.bodyBold }}>988</Text>, the Suicide &amp; Crisis Lifeline, any time, day or night (US). It is open to
              anyone who is struggling.
            </T>
          ) : null}
        </View>
      );
      foot = (
        <>
          {back}
          {pr ? (
            <Next label="Put it to work" onPress={() => toStage('practice')} />
          ) : next ? (
            <Next label={'Next: ' + next.title} onPress={() => router.replace({ pathname: '/lesson/[id]', params: { id: next.id } })} />
          ) : (
            <Next label="Done" noIcon onPress={close} />
          )}
        </>
      );
    } else {
      const card = it.c;
      const ci = it.ci;
      if (card.k === 'choose') {
        const gr = lxGraded(card);
        const pk = pick[ci] ?? null;
        body = (
          <>
            <Eyebrow icon={(LX_E[gr && LX_E[card.e || ''] ? card.e! : 'turn'] || LX_E.turn)[0]} label={card.el || (LX_E[card.e || 'turn'] || LX_E.turn)[1]} t={t} />
            <T style={[s.h, s.hsm]} accessibilityRole="header">
              {card.h}
            </T>
            {card.ask || typeof card.q === 'string' ? <T style={[s.p, { fontFamily: font.bodySemi }]}>{card.ask || (card.q as unknown as string)}</T> : null}
            <Opts
              list={card.c!.map((x) => x[0])}
              best={gr ? card.a! : null}
              pk={pk}
              tried={tried[ci] || []}
              t={t}
              onPick={(j) => {
                setPick((p) => ({ ...p, [ci]: j }));
                setTried((x) => ({ ...x, [ci]: (x[ci] || []).indexOf(j) < 0 ? (x[ci] || []).concat(j) : x[ci] }));
                if (card.sv) apply({ st: changeSettings(st, (s0) => void ((s0.learn.picks || (s0.learn.picks = {}))[L.id] = String(card.c![j][0]).slice(0, 200))) });
                buzz('tap');
              }}
            />
            {pk != null ? <Reply text={card.c![pk][1]} t={t} /> : null}
            {gr && pk != null ? (
              <T v="small" tone="muted">
                Tap any other answer to read its comment.
              </T>
            ) : null}
            {card.sv && pk != null ? <T tone="mintText">✓ Saved to your playbook</T> : null}
          </>
        );
        foot = (
          <>
            {back}
            <Next label={seq[ix + 1] && seq[ix + 1].t === 'done' ? 'Finish' : 'Next'} onPress={() => step(1)} />
          </>
        );
      } else if (card.k === 'guess') {
        const g = card.g!;
        const gs = gu[ci] || { v: null, lock: false };
        body = <GuessCard card={card} g={g} gs={gs} t={t} onSet={(v) => setGu((x) => ({ ...x, [ci]: { v, lock: false } }))} onSrc={() => setSheet({ t: 'src', i: ci, from: 'card' })} />;
        foot = gs.lock ? (
          <>
            {back}
            <Next label={seq[ix + 1] && seq[ix + 1].t === 'done' ? 'Finish' : 'Next'} onPress={() => step(1)} />
          </>
        ) : (
          <>
            {back}
            <Next
              label="Lock in my guess"
              noIcon
              off={gs.v == null}
              onPress={() => {
                if (gs.v == null) return;
                setGu((x) => ({ ...x, [ci]: { v: gs.v, lock: true } }));
                buzz('save');
                top();
              }}
            />
          </>
        );
      } else {
        body = <TextCard L={L} card={card} t={t} st={st} onSrc={() => setSheet({ t: 'src', i: ci, from: 'card' })} onDraft={onDraft} />;
        foot = (
          <>
            {back}
            <Next
              label={seq[ix + 1] && seq[ix + 1].t === 'done' ? 'Finish' : 'Next'}
              onPress={() => {
                if (!keepDraft()) return;
                step(1);
              }}
            />
          </>
        );
      }
    }
  } else if (stage === 'practice') {
    const a = lessonPractice(L) || {};
    const go = a.go || [];
    const first = a.note ? null : go[0];
    const kind = first ? lxSheetOf(first) : null;
    const rest = go.slice(a.note ? 0 : 1);
    const peek = kind ? lxPeek(kind, st) : null;
    prog = <Prog total={1} i={0} all />;
    body = (
      <>
        <View style={s.art}>{kind || a.shield ? <LxShield t={t} /> : <LxIco name={a.ic || (go[0] && go[0].ic) || L.ic} t={t} size={a.note || go.length > 1 ? 96 : 120} />}</View>
        <Eyebrow icon="bolt" label={'Put it to work · ' + (a.mins || 2) + ' min'} t={t} />
        <T style={s.h} accessibilityRole="header">
          {a.h || 'Try it'}
        </T>
        {a.p ? <Rich text={a.p} st={st} style={s.p} /> : null}
        <Blocks bs={a.b} L={L} t={t} st={st} onDraft={onDraft} />
        {a.note ? <NoteField L={L} note={(st.learn.notes && st.learn.notes[L.id]) || ''} /> : null}
        {peek ? (
          <View style={[s.act, { backgroundColor: t.soft }]}>
            <Text style={[s.eye2, { color: t.text }]}>{peek.title.toUpperCase()}</Text>
            {peek.rows.map((r, k) => (
              <View key={k} style={[s.stepLi, { backgroundColor: c.surface }]}>
                <View style={[s.stepN, { backgroundColor: t.soft }]}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 12.5, color: t.text }}>{k + 1}</Text>
                </View>
                <T style={{ flex: 1 }}>{r}</T>
              </View>
            ))}
            {peek.more ? (
              <T tone="muted" style={{ fontFamily: font.bodySemi }}>
                +{peek.more} more
              </T>
            ) : null}
          </View>
        ) : null}
        {rest.length ? (
          <View style={{ gap: 10 }}>
            {rest.map((g, k) => {
              const has = !!LIST_OF[g.a] && listHas(g);
              return (
                <Pressable
                  key={k}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: has }}
                  disabled={has}
                  onPress={() => doGo(g, false)}
                  style={[s.soft, { backgroundColor: c.accentSoft, shadowColor: c.lip, opacity: has ? 0.7 : 1 }]}>
                  {has ? <Icon name="check" size={20} color={c.accentText} /> : g.ic ? <Icon name={g.ic} size={20} color={c.accentText} /> : null}
                  <Text style={[s.softT, { color: c.accentText }]}>{has ? 'On my ' + LIST_OF[g.a][2] : g.t}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </>
    );
    foot = (
      <>
        <Ghost
          label="Not now"
          onPress={() => {
            if (keepDraft()) toStage('practiced');
          }}
        />
        {first ? (
          <Next label={first.t} noIcon onPress={() => doGo(first, true)} />
        ) : (
          <Next
            label={a.btn || 'I tried it'}
            noIcon
            onPress={() => {
              if (!keepDraft()) return;
              practiced();
              toStage('practiced');
            }}
          />
        )}
      </>
    );
  } else {
    const a = lessonPractice(L) || {};
    const pair = lessonPairOf(L);
    const due = pair && done.has(pair.a.id) && !lcheckWritten(st, pair.n);
    prog = <Prog total={1} i={0} all />;
    body = (
      <>
        <View style={s.art}>{prac ? <LxCheck /> : <LxIco name={L.ic} t={t} />}</View>
        {prac ? (
          <Eyebrow icon="check" label="Practiced" t={{ ...t, soft: c.mintSoft, text: c.mintText }} />
        ) : (
          <Eyebrow icon="flag" label="Lesson done" t={t} />
        )}
        <T style={s.h} accessibilityRole="header">
          {prac ? a.ok || 'Nicely done.' : 'That is the lesson.'}
        </T>
        <T style={s.p}>{prac ? 'That is the lesson and the practice. Pick what comes next.' : 'The practice stays in Learn whenever you want it.'}</T>
        <View style={{ gap: 10 }}>
          {due && pair ? (
            <Route
              label="Write it out"
              small={'3–5 min · a short checkpoint for lessons ' + (lessonIndex(pair.a) + 1) + ' and ' + (lessonIndex(pair.b) + 1)}
              onPress={() => router.push({ pathname: '/lwrite/[n]', params: { n: String(pair.n) } })}
            />
          ) : null}
          <Route
            label="Back to Learn"
            onPress={() => {
              close();
              router.navigate('/learn');
            }}
          />
          <Route
            label="Back to Today"
            onPress={() => {
              close();
              router.navigate('/');
            }}
          />
        </View>
      </>
    );
    foot = next ? <Next label={'Next: ' + next.title} onPress={() => router.replace({ pathname: '/lesson/[id]', params: { id: next.id } })} /> : <Next label="Done" noIcon onPress={close} />;
  }

  return (
    <Frame title={'Lesson ' + n + ' of ' + LESSONS.length + (stage === 'practice' || stage === 'practiced' ? ' · done' : '')} onClose={close} c={c} inset={inset}>
      {prog}
      <ScrollView ref={scroll} style={[s.card, { backgroundColor: c.surface, shadowColor: c.lip }]} contentContainerStyle={s.cardIn} keyboardShouldPersistTaps="handled">
        {body}
      </ScrollView>
      {foot ? <View style={s.foot}>{foot}</View> : null}
      {sheet ? (
        <SheetOver
          sheet={sheet}
          L={L}
          onDraft={onDraft}
          onClose={() => {
            if (sheet.t === 'reasons' && !keepDraft()) return;
            const from = sheet.from;
            setSheet(null);
            if (from === 'practice') toStage('practiced');
          }}
        />
      ) : null}
    </Frame>
  );
}

/* ---------- the frame ---------- */
function Frame({ title, onClose, children, c, inset }: { title: string; onClose: () => void; children: ReactNode; c: ReturnType<typeof useTheme>; inset: { top: number; bottom: number } }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: inset.top + 8, paddingBottom: inset.bottom + 12, paddingHorizontal: 16 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', gap: 12 }}>
        <View style={s.top}>
          <T v="eyebrow" tone="muted" accessibilityRole="header">
            {title}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.x, { backgroundColor: c.scBtn, borderColor: c.cardEdge }]}>
            <Icon name="x" color={c.ink} />
          </Pressable>
        </View>
        {children}
      </View>
    </View>
  );
}

/* ---------- small pieces ---------- */
function Prog({ total, i, all }: { total: number; i: number; all?: boolean }) {
  const c = useTheme();
  return (
    <View style={s.prog} accessible accessibilityLabel={all ? 'Lesson complete' : 'Card ' + (i + 1) + ' of ' + total}>
      {Array.from({ length: total }, (_, j) => (
        <View key={j} style={[s.progI, { backgroundColor: all || j < i ? c.mint : j === i ? c.accent : c.lip }]} />
      ))}
    </View>
  );
}
function Eyebrow({ icon, label, t }: { icon: string; label: string; t: Tone }) {
  return (
    <View style={s.eye}>
      <View style={[s.ei, { backgroundColor: t.soft }]}>
        <Icon name={icon} size={16} color={t.text} />
      </View>
      <Text style={[s.eyeT, { color: t.text }]}>{label.toUpperCase()}</Text>
    </View>
  );
}
function LenBtn({ t, on, title, sub, mins, onPress }: { t: Tone; on: boolean; title: string; sub: string; mins: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[s.len, { borderColor: on ? t.ic : c.line, backgroundColor: c.surface, shadowColor: c.lip }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: font.display, fontSize: 22, color: c.ink }}>{title}</Text>
        <T v="small" tone="muted">
          {sub}
        </T>
        {on ? <Text style={[s.eye2, { color: t.text, marginTop: 3 }]}>YOUR USUAL</Text> : null}
      </View>
      <View style={[s.lm, { backgroundColor: t.soft }]}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: t.text }}>{mins}</Text>
      </View>
    </Pressable>
  );
}
/** the choices: the first pick shows the best answer in green; every choice stays tappable so its comment can be read */
function Opts({ list, best, pk, tried, t, onPick }: { list: string[]; best: number | null; pk: number | null; tried: number[]; t: Tone; onPick: (j: number) => void }) {
  const c = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {list.map((o, j) => {
        const ok = best != null && pk != null && j === best;
        const no = best != null && pk != null && j !== best && tried.indexOf(j) >= 0;
        const sel = pk === j;
        const bc = ok ? c.mint : sel ? t.ic : c.line;
        const bg = ok ? c.mintSoft : sel && best == null ? t.soft : c.surface;
        const fg = ok ? c.mintText : no ? c.muted : sel && best == null ? t.text : c.ink;
        return (
          <Pressable key={j} accessibilityRole="button" accessibilityState={{ selected: sel }} onPress={() => onPick(j)} style={[s.opt, { borderColor: bc, backgroundColor: bg }]}>
            {ok || (best == null && sel) ? <Icon name="check" size={18} color={fg} /> : null}
            <Text style={[s.optT, { color: fg }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
function Reply({ text, t }: { text: string; t: Tone }) {
  const c = useTheme();
  return (
    <View style={[s.reply, { backgroundColor: t.soft }]} accessibilityLiveRegion="polite">
      <Text style={{ fontFamily: font.body, fontSize: 16, lineHeight: 23, color: c.ink }}>{text}</Text>
    </View>
  );
}
function NoteField({ L, note }: { L: Lesson; note: string }) {
  const { snap, apply } = useStore();
  return (
    <View style={{ alignSelf: 'stretch', gap: 4 }}>
      <Field
        label={L.np}
        multiline
        maxLength={LNOTE_LEN}
        defaultValue={note}
        placeholder="Write a line, or skip it"
        onChangeText={(v) =>
          apply({
            st: changeSettings(snap.settings!, (s0) => {
              if (v.trim()) s0.learn.notes[L.id] = v;
              else delete s0.learn.notes[L.id];
            }),
          })
        }
      />
      <T v="small" tone="muted">
        Optional. Only you see it.
      </T>
    </View>
  );
}

/* ---------- the blocks inside a card ---------- */
function Blocks({ bs, t, st, onDraft }: { bs?: Block[]; L: Lesson; t: Tone; st: Settings; onDraft: (f: () => boolean) => void }) {
  const c = useTheme();
  const { snap } = useStore();
  if (!bs || !bs.length) return null;
  return (
    <>
      {bs.map((b, k) => {
        if (b[0] === 'p') return <Rich key={k} text={b[1]} st={st} style={s.p} />;
        if (b[0] === 'q')
          return (
            <View key={k} style={[s.quote, { backgroundColor: t.soft, borderLeftColor: t.ic }]}>
              <Text style={{ fontFamily: font.display, fontSize: 18, lineHeight: 25, color: c.ink }}>
                {lfmt(b[1], st)
                  .map((x) => x.t)
                  .join('')}
              </Text>
            </View>
          );
        if (b[0] === 'l')
          return (
            <View key={k} style={{ gap: 6 }}>
              {b[1].map((x, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 8 }}>
                  <T style={{ fontSize: 17 }}>•</T>
                  <Rich text={x} st={st} style={{ flex: 1, fontSize: 17, lineHeight: 24 }} />
                </View>
              ))}
            </View>
          );
        if (b[0] === 'plan') {
          const rows = planRows(st);
          if (!rows.length) return null;
          return (
            <View key={k} style={[s.plan, { backgroundColor: c.surface2 }]}>
              <Text style={[s.eye2, { color: c.muted }]}>YOUR URGE PLAN RIGHT NOW</Text>
              {rows.map((r, j) => (
                <T key={j}>
                  <Text style={{ fontFamily: font.bodyBold }}>If</Text> {r.when}
                  {'\n'}
                  <Text style={{ fontFamily: font.bodyBold }}>Then</Text> {r.then && r.then.trim() ? r.then : <Text style={{ fontStyle: 'italic' }}>not filled in yet</Text>}
                </T>
              ))}
            </View>
          );
        }
        if (b[0] === 'rbox') return <ReasonsBox key={k} onDraft={onDraft} />;
        if (b[0] === 'mylog') {
          const lg = lessonLog(snap.days, st);
          return (
            <View key={k} style={[s.plan, { backgroundColor: c.surface2 }]}>
              {lg.few ? (
                <>
                  <Text style={[s.eye2, { color: c.muted }]}>YOUR LOG SO FAR</Text>
                  <T>{(lg.n ? lg.n + (lg.n === 1 ? ' entry' : ' entries') : 'No entries yet') + '. A week of honest entries is enough to start seeing a pattern.'}</T>
                </>
              ) : (
                <>
                  <Text style={[s.eye2, { color: c.muted }]}>WHAT YOUR LOG SHOWS RIGHT NOW</Text>
                  <T>
                    <Text style={{ fontFamily: font.bodyBold }}>{lg.n}</Text> entries, <Text style={{ fontFamily: font.bodyBold }}>{lg.rode}</Text> of them rode out.
                  </T>
                  {lg.tt ? (
                    <T>
                      The reason you picked most: <Text style={{ fontFamily: font.bodyBold }}>{lg.tt.t}</Text> ({lg.tt.n} time{lg.tt.n === 1 ? '' : 's'}).
                    </T>
                  ) : (
                    <T>No reasons picked yet. Picking one on each entry makes this much clearer.</T>
                  )}
                  {lg.bw ? (
                    <T>
                      Your busiest hours: <Text style={{ fontFamily: font.bodyBold }}>{lg.bw.label}</Text> ({lg.bw.n} of {lg.bw.total} timed entries).
                    </T>
                  ) : null}
                </>
              )}
            </View>
          );
        }
        if (b[0] === 'words') {
          const w = st.words || [];
          return (
            <View key={k} style={[s.plan, { backgroundColor: c.surface2 }]}>
              <Text style={[s.eye2, { color: c.muted }]}>WORDS THAT STEADY ME</Text>
              {w.length ? w.map((x, j) => <T key={j}>{x}</T>) : <T>Nothing here yet. A verse, a prayer, or a line that steadies you works well. Add them in My plan, under Lists.</T>}
            </View>
          );
        }
        return null;
      })}
    </>
  );
}

function TextCard({ L, card, t, st, onSrc, onDraft }: { L: Lesson; card: Card; t: Tone; st: Settings; onSrc: () => void; onDraft: (f: () => boolean) => void }) {
  const e = LX_E[card.e || 'insight'] || LX_E.insight;
  return (
    <>
      {card.art ? (
        <View style={s.art}>
          <LessonArt key={L.id + card.h} art={card.art} ic={L.ic} t={t} st={st} />
        </View>
      ) : null}
      <Eyebrow icon={e[0]} label={card.el || e[1]} t={t} />
      <T style={[s.h, card.h.length > 46 && s.hsm]} accessibilityRole="header">
        {card.h}
      </T>
      <Blocks bs={card.b} L={L} t={t} st={st} onDraft={onDraft} />
      {card.so ? (
        <View style={[s.so, { borderColor: t.ic }]}>
          <Text style={[s.eye2, { color: t.text }]}>WHAT THIS MEANS FOR YOU</Text>
          <Rich text={card.so} st={st} style={s.p} />
        </View>
      ) : null}
      {card.fact ? <Fact text={card.fact.s} t={t} onPress={onSrc} /> : null}
    </>
  );
}
function Fact({ text, t, onPress }: { text: string; t: Tone; onPress: () => void }) {
  return (
    <View style={[s.fact, { backgroundColor: t.soft }]}>
      <Text style={{ flex: 1, fontFamily: font.bodySemi, fontSize: 13.5, color: t.text, lineHeight: 18 }}>{text}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 13.5, color: t.text, textDecorationLine: 'underline' }}>Behind this</Text>
      </Pressable>
    </View>
  );
}

/* a number the person guesses before it is shown */
function GuessCard({ card, g, gs, t, onSet, onSrc }: { card: Card; g: Guess; gs: { v: number | null; lock: boolean }; t: Tone; onSet: (v: number) => void; onSrc: () => void }) {
  const c = useTheme();
  const [w, setW] = useState(0);
  const stepV = g.step || 1;
  const ticks = g.ticks || [g.min, g.max];
  const Ticks = (
    <View style={s.ticks}>
      {ticks.map((x, k) => (
        <Text key={k} style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.muted }}>
          {x}
          {k === ticks.length - 1 ? ' ' + g.unit : ''}
        </Text>
      ))}
    </View>
  );
  if (!gs.lock) {
    const has = gs.v != null;
    const v = has ? gs.v! : Math.round((g.min + g.max) / 2);
    const at = (e: GestureResponderEvent) => {
      if (!w) return;
      const raw = g.min + (e.nativeEvent.locationX / w) * (g.max - g.min);
      const nv = Math.max(g.min, Math.min(g.max, Math.round(raw / stepV) * stepV));
      if (nv !== gs.v) onSet(nv);
    };
    const pct = lxPct(g, v);
    return (
      <>
        <View style={{ alignItems: 'center', gap: 18 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: font.display, fontSize: 96, lineHeight: 100, color: has ? c.accent : c.lip }}>{has ? gs.v : '?'}</Text>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 17, color: c.ink }}>{has ? g.unit + ' · your guess' : 'Drag to guess'}</Text>
          </View>
          <View style={{ alignSelf: 'stretch', gap: 4 }}>
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={card.h}
              accessibilityValue={has ? { min: g.min, max: g.max, now: gs.v!, text: gs.v + ' ' + g.unit } : { text: 'No guess yet' }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(e) => onSet(Math.max(g.min, Math.min(g.max, v + (e.nativeEvent.actionName === 'increment' ? stepV : -stepV))))}
              onLayout={(e) => setW(e.nativeEvent.layout.width)}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderTerminationRequest={() => false}
              onResponderGrant={at}
              onResponderMove={at}
              style={{ height: 44, justifyContent: 'center' }}>
              <View pointerEvents="none" style={{ height: 12, borderRadius: 6, backgroundColor: c.accentSoft, overflow: 'hidden' }}>
                {has ? <View style={{ width: `${pct}%`, height: '100%', backgroundColor: c.accent }} /> : null}
              </View>
              {has ? (
                <View
                  pointerEvents="none"
                  style={{ position: 'absolute', left: `${pct}%`, marginLeft: -17, width: 34, height: 34, borderRadius: 17, backgroundColor: c.accent, borderWidth: 5, borderColor: c.surface }}
                />
              ) : null}
            </View>
            {Ticks}
          </View>
        </View>
        <Eyebrow icon={LX_E.guess[0]} label={card.el || LX_E.guess[1]} t={t} />
        <T style={[s.h, s.hsm]} accessibilityRole="header">
          {card.h}
        </T>
        <T style={s.p}>{card.p || 'Guess first. Guessing helps the answer stick.'}</T>
      </>
    );
  }
  const v = gs.v!;
  const a = g.ans;
  const rv = g.rv || {};
  const pv = lxPct(g, v);
  const pa = lxPct(g, a);
  const lo = lxPct(g, g.lo);
  const hi = lxPct(g, g.hi);
  return (
    <>
      <View style={{ alignItems: 'center', gap: 16 }}>
        <BigNumber n={a} s={g.big || g.unit} />
        <View style={{ alignSelf: 'stretch', gap: 6, paddingTop: 30 }} accessible accessibilityLabel={`You guessed ${v} ${g.unit}. The answer is ${a} ${g.unit}. People ranged from ${g.lo} to ${g.hi}.`}>
          <View style={{ position: 'absolute', top: 0, left: `${Math.min(85, Math.max(15, pv))}%`, transform: [{ translateX: -40 }], width: 80, alignItems: 'center' }}>
            <Text style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden', backgroundColor: c.sun, color: c.onSun, fontFamily: font.bodyBold, fontSize: 13 }}>You · {v}</Text>
          </View>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: c.accentSoft }}>
            <View style={{ position: 'absolute', top: 0, height: 12, borderRadius: 6, left: `${lo}%`, width: `${hi - lo}%`, backgroundColor: c.accent, opacity: 0.28 }} />
            <View style={[s.mk, { left: `${pv}%`, backgroundColor: c.sun, borderColor: c.surface }]} />
            <View style={[s.mk, { left: `${pa}%`, backgroundColor: c.accent, borderColor: c.surface }]} />
          </View>
          {Ticks}
          <Text style={{ fontFamily: font.body, fontSize: 13.5, color: c.muted, textAlign: 'center' }}>{g.cap || 'People ranged from ' + g.lo + ' to ' + g.hi + ' ' + g.unit}</Text>
        </View>
      </View>
      <Eyebrow icon={LX_E.proof[0]} label={LX_E.proof[1]} t={t} />
      <T style={[s.h, s.hsm]} accessibilityRole="header">
        {rv.h || card.h}
      </T>
      <T style={s.p}>
        {guessFeedback(g, v)}
        {rv.b ? ' ' : ''}
        {rv.b ? <Rich text={rv.b} st={null} /> : null}
      </T>
      {card.fact ? <Fact text={card.fact.s} t={t} onPress={onSrc} /> : null}
    </>
  );
}

/* ---------- the sheet that opens over the lesson ---------- */
function SheetOver({ sheet, L, onClose, onDraft }: { sheet: Sheet; L: Lesson; onClose: () => void; onDraft: (f: () => boolean) => void }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  let title = '';
  let btn = 'Back to the lesson';
  let body: ReactNode;
  if (sheet.t === 'slip') {
    title = 'My slip plan';
    body = <SlipEditor />;
  } else if (sheet.t === 'urge') {
    title = 'My urge plan';
    body = <UrgeEditor />;
  } else if (sheet.t === 'reasons') {
    title = 'My reasons';
    body = <ReasonsBox onDraft={onDraft} />;
  } else {
    title = 'Behind this lesson';
    btn = 'Close';
    const card = sheet.i != null ? L.cards[sheet.i] : null;
    const idx = card && card.fact && card.fact.i ? card.fact.i : L.src.map((_, k) => k);
    body = (
      <>
        <T v="small" tone="muted">
          {srcNote(L)}
        </T>
        {idx.map((k) => {
          const e = L.src[k];
          if (!e) return null;
          const cut = e[0].indexOf(': ');
          const name = cut > 0 ? e[0].slice(0, cut) : e[0];
          const topic = cut > 0 ? e[0].slice(cut + 2) : '';
          return (
            <View key={k} style={[s.src, { backgroundColor: c.surface2 }]}>
              <T v="label">{name}</T>
              {topic ? (
                <T v="small" tone="muted">
                  {topic}
                </T>
              ) : null}
              {e[2] ? <T v="small">Who: {e[2]}</T> : null}
              {e[3] ? <T v="small">Topic: {e[3]}</T> : null}
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(e[1])} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36 }}>
                <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>Open the source</Text>
                <Icon name="ext" size={14} color={c.accentText} />
              </Pressable>
            </View>
          );
        })}
        {L.scope ? (
          <View style={[s.src, { backgroundColor: c.sunSoft }]}>
            <T v="label">What it shows, and what it does not</T>
            <Rich text={L.scope} st={null} />
          </View>
        ) : null}
      </>
    );
  }
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
      <Pressable accessibilityLabel="Close" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,16,50,0.45)' }]} onPress={onClose} />
      <View style={[s.sheet, { backgroundColor: c.bg, paddingBottom: inset.bottom + 12, maxWidth: MAX_WIDTH }]}>
        <View style={[s.grab, { backgroundColor: c.lip }]} />
        <View style={s.top}>
          <T v="h2" accessibilityRole="header">
            {title}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.x, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
            <Icon name="x" color={c.ink} />
          </Pressable>
        </View>
        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 12, paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
        <Next label={btn} noIcon onPress={onClose} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  x: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  prog: { flexDirection: 'row', gap: 4 },
  progI: { flex: 1, height: 8, borderRadius: 4 },
  card: { flex: 1, borderRadius: 28, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2 },
  cardIn: { padding: 22, gap: 14, flexGrow: 1 },
  art: { minHeight: 110, alignItems: 'center', justifyContent: 'center' },
  eye: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ei: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  eyeT: { fontFamily: font.bodyBold, fontSize: 12.5, letterSpacing: 1.2 },
  eye2: { fontFamily: font.bodyBold, fontSize: 11.5, letterSpacing: 1.1 },
  h: { fontFamily: font.display, fontSize: 30, lineHeight: 34 },
  hsm: { fontSize: 26, lineHeight: 31 },
  p: { fontSize: 18, lineHeight: 26 },
  ask: { gap: 4, padding: 14, borderRadius: 18 },
  askP: { fontFamily: font.display, fontSize: 19, lineHeight: 26 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  key: { alignSelf: 'stretch', gap: 2, padding: 16, borderRadius: 18 },
  keyP: { fontFamily: font.display, fontSize: 19, lineHeight: 26, marginTop: 4 },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  linkT: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
  foot: { flexDirection: 'row', gap: 10 },
  next: { flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, borderRadius: 18, shadowOpacity: 1, shadowRadius: 0 },
  nextT: { fontFamily: font.bodySemi, fontSize: 19, textAlign: 'center' },
  back: { width: 60, height: 60, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ghost: { minHeight: 60, paddingHorizontal: 20, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  soft: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 16, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  softT: { fontFamily: font.bodySemi, fontSize: 17, flexShrink: 1 },
  len: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, padding: 14, borderRadius: 18, borderWidth: 2, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  lm: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2 },
  optT: { flex: 1, fontFamily: font.bodySemi, fontSize: 16.5, lineHeight: 21 },
  reply: { padding: 14, borderRadius: 16 },
  quote: { padding: 14, borderRadius: 16, borderLeftWidth: 5 },
  plan: { gap: 6, padding: 14, borderRadius: 16 },
  so: { gap: 4, paddingLeft: 12, borderLeftWidth: 3 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 14 },
  act: { gap: 10, padding: 14, borderRadius: 20 },
  stepLi: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 14 },
  stepN: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between' },
  mk: { position: 'absolute', top: -6, width: 24, height: 24, marginLeft: -12, borderRadius: 12, borderWidth: 4 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, alignSelf: 'center', maxHeight: '88%', gap: 12, paddingHorizontal: 16, paddingTop: 8, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3 },
  src: { gap: 4, padding: 12, borderRadius: 14 },
});
