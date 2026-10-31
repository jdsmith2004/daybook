/* A lesson. One flow for every lesson: the cover (pick Quick or Full) > one recall question on the lesson before > the cards >
   Done > Put it to work > Practiced. A lesson counts as finished only when the Done card is reached. Put it to work (core
   practice.ts) offers ready-made lines that go on the plan with one tap, right here, with Undo; a tool or page it opens comes
   back to the same step, as it was. Nothing on a card, and nothing on the practice step, can finish the lesson or send the
   person away without a way back. Ported from the legacy SCENES.lesson.
   Lessons open one at a time, in the order of the path (core lessonGate). A link to a lesson the path has not reached (a
   help page, My plan, the review, a nudge, a tool) opens its key idea instead: one card, with the tools it points to, that
   writes nothing and earns nothing. A lesson read before that rule, once the path reaches it, opens as a short welcome
   back: the key idea, its own recall question (not asked again by the next lesson that day), then Keep going (core lessonReach: no points, nothing
   counted twice) or Read it all again (?at=all, the full lesson). */
import {
  type Block,
  type Card,
  changeSettings,
  gameCompute,
  fmtDate,
  type Go,
  type Guess,
  guessFeedback,
  lcheckWritten,
  type Lesson,
  lessonById,
  lessonDoneOn,
  lessonFamily,
  lessonGate,
  lessonHasQuick,
  lessonKeyIdea,
  lessonLog,
  lessonNo,
  itemAdd,
  itemHas,
  itemUndo,
  lessonOpen,
  lessonPairOf,
  lessonPractice,
  lessonPracticed,
  lessonReach,
  lessonBackRecall,
  lessonRecallOf,
  lessonSeq,
  lessonStats,
  lessonWalk,
  type LessonWalk,
  lfmt,
  LNOTE_LEN,
  LUNITS,
  LX_E,
  lxGraded,
  lxPct,
  lxRcReply,
  nextAfter,
  type PItem,
  planRows,
  recordLesson,
  type Settings,
  srcNote,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { KeyboardRoom } from '@/components/keyboard';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { FitArt, FitProvider, SHORT, useFitRoom } from '@/components/fit';
import { Dock } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Field } from '@/components/choices';
import { FlameMedallion } from '@/components/flame-medallion';
import { LessonArt, LxIco, BigNumber } from '@/components/lesson-art';
import { Back, Ghost, Next, Rich, Route } from '@/components/lx';
import { GoRow, LineEditor, PLine, WriteBox } from '@/components/practice';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { count } from '@/lib/pulse';
import { close, closeAll } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { useSos } from '@/lib/sos';
import { copyText } from '@/lib/words';
import { useAccount } from '@/lib/sync';
import { font, MAX_WIDTH, toneOf, useTheme, type Tone } from '@/lib/theme';

type Stage = 'cover' | 'run' | 'practice' | 'practiced';
/** recall questions answered on a welcome back while the app is open, by lesson id, with the day: the lesson after it does
    not ask the same question again that day */
const ASKED: Record<string, string> = {};
interface Sheet {
  t: 'src';
  i?: number | null;
}
/** a line added on the practice step: the words that went on the plan (changed or not), and what a sentence replaced */
interface Got {
  it: PItem;
  was?: string;
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
  /* the practice step: what was added, opened and copied here, and the line whose words are being changed */
  const [got, setGot] = useState<Record<number, Got>>({});
  const [went, setWent] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState<Record<number, boolean>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const [wrote, setWrote] = useState<string | null>(null);
  const scroll = useRef<ScrollViewInstance>(null);
  /* the picture on a card gives up height so the card fits a short phone (components/fit) */
  const fit = useFitRoom();
  /* a new card starts at its top, set as it comes in (it is still clear then): the old card never jumps before it goes */
  useLayoutEffect(() => scroll.current?.scrollTo({ y: 0, animated: false }), [stage, i]);
  /* the first time a lesson lights a day on the ring on Today (core lessonWeek), the last card says what the ring is. Once
     per phone (kept with SOS's memory); fixed when the lesson opens, so the line stays while this lesson is on screen. */
  const sos = useSos();
  const [ringNote] = useState(() => !sos.mem.ringNote);
  const ringLit = ringNote && stage === 'practiced' && lessonDoneOn(snap.days[tk]?.p);
  useEffect(() => {
    if (ringLit) sos.setMem((m) => ({ ...m, ringNote: tk }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringLit]);

  if (!st) return <Redirect href="/" />;
  if (!L)
    return (
      <Frame title="Lesson" onClose={close} c={c} inset={inset}>
        <T v="title">That lesson is not here</T>
      </Frame>
    );
  const t = toneOf(c, LUNITS[L.u].tone);
  const n = lessonNo(L, st);
  const w = lessonWalk(snap.days, st);
  const done = w.done;
  /* one lesson opens at a time: further on, the key idea; read early and reached now, the welcome back. "Read it all
     again" (?at=all) opens a finished one in full. */
  const gate = lessonGate(L, w);
  const back = gate === 'back';
  /* ?at=care: a door from a hard moment (Rekindle, the second slip in a week): it opens in full, and never asks for an account
     (never after a slip). It comes back to where it was opened. */
  const care = at === 'care';
  if (gate !== 'open' && !care && !(at === 'all' && done.has(L.id))) return <PathGate L={L} w={w} gate={gate} />;
  /* a lesson that opens with an account goes straight to the account sheet, and opens by itself after signing up */
  if (!care && !lessonOpen(L, done, account)) return <Redirect href={{ pathname: '/account', params: { why: 'lesson', then: L.id } }} />;
  const next = nextAfter(L, w);
  const seq = lessonSeq(L, rcOf, len);
  const top = () => scroll.current?.scrollTo({ y: 0, animated: false });

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
      /* read in full on its welcome back: the path moves past it, as Keep going does */
      return { ...s0, days: r.days, settings: back ? lessonReach(s0.settings!, L.id) : s0.settings };
    });
    setGain(g);
    setAgain(a);
    count('lesson_done');
    buzz(a ? 'save' : 'lit');
  };
  const step = (d: number) => {
    const to = i + d;
    if (to < 0 || to >= seq.length) return;
    const cur = seq[i];
    if (d > 0 && cur.t === 'card' && cur.c.k === 'guess' && !(gu[cur.ci] && gu[cur.ci].lock)) return;
    setI(to);
    if (seq[to].t === 'done') record();
  };
  const practiced = () => {
    setPrac(true);
    apply((cur) => ({ st: lessonPracticed(cur, L.id) }));
  };
  const toStage = (s: Stage) => {
    setStage(s);
  };

  /* the practice step. Nothing here finishes the lesson, and a tool or page it opens comes back to this same step. */
  const add = (k: number, it: PItem) => {
    const r = itemAdd(snap.settings!, it);
    if (!r.ok) {
      if (r.toast) say(r.toast);
      return;
    }
    apply({ st: r.st });
    setGot((x) => ({ ...x, [k]: { it, was: r.was } }));
    setEditing(null);
    buzz('save');
    say(r.toast);
    practiced();
  };
  const undo = (k: number) => {
    const g = got[k];
    if (!g) return;
    apply((cur) => ({ st: itemUndo(cur, g.it, g.was) }));
    setGot((x) => {
      const y = { ...x };
      delete y[k];
      return y;
    });
    buzz('tap');
  };
  const copyLine = (k: number, text: string) => {
    copyText(text, say, 'Copied. Paste it into a message.').then((ok) => {
      if (!ok) return;
      setCopied((x) => ({ ...x, [k]: true }));
      practiced();
    });
  };
  const write = (v: string) => {
    setWrote(v);
    apply((cur) => ({
      st: changeSettings(cur, (s0) => {
        if (v.trim()) s0.learn.notes[L.id] = v;
        else delete s0.learn.notes[L.id];
      }),
    }));
  };
  const open = (k: number, g: Go) => {
    setWent((x) => ({ ...x, [k]: true }));
    practiced();
    goTo(g);
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
      /* the lesson before asked its own question on its welcome back today: not again */
      const P = lessonRecallOf(L, done, new Set(Object.keys(ASKED).filter((x) => ASKED[x] === tk)), st);
      setRcOf(P ? P.id : null);
      setRc(null);
      setRcTried([]);
      setStage('run');
      if (lessonHasQuick(L) && st.learn.len !== ln) apply({ st: changeSettings(st, (s0) => void (s0.learn.len = ln)) });
    };
    body = (
      <>
        <FitArt style={s.art}>
          <LxIco name={L.ic} t={t} />
        </FitArt>
        <Eyebrow label={u.name} t={t} />
        <T style={s.h} accessibilityRole="header">
          {L.title}
        </T>
        {fam ? (
          <T v="small" tone="muted">
            Part {fam.n} of {fam.of} on {fam.f.name === u.name ? 'this idea' : 'one idea: ' + fam.f.name}
          </T>
        ) : null}
        {L.ask ? (
          <View style={s.askB}>
            <Text style={[s.eye2, { color: t.text }]}>This lesson answers</Text>
            <T style={s.p}>{L.ask}</T>
          </View>
        ) : (
          <T style={s.p}>{L.tag}</T>
        )}
        {done.has(L.id) ? (
          <View style={s.tag}>
            <Icon name="check" size={15} color={c.mintText} />
            <T v="eyebrow" tone="mintText">
              You finished this one
            </T>
          </View>
        ) : null}
        {lessonHasQuick(L) ? (
          <Dock>
            <View style={{ gap: 12 }} accessibilityLabel="Pick a length">
              <LenBtn
                t={t}
                on={pref === 'q'}
                title="Quick"
                sub={L.v === 2 ? 'The answer, what to do, one check' : 'The main idea, then one question'}
                mins="1–2 min"
                onPress={() => start('q')}
              />
              <LenBtn
                t={t}
                on={pref === 'f'}
                title="Full"
                sub={L.v === 2 ? 'Adds a guess and the science behind it' : 'Adds the evidence and why it works'}
                mins="3–5 min"
                onPress={() => start('f')}
              />
            </View>
          </Dock>
        ) : null}
      </>
    );
    if (!lessonHasQuick(L)) foot = <Next label={'Start · about ' + (L.mins || 3) + ' min'} onPress={() => start('f')} />;
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
          <Eyebrow label={'Quick recall · lesson ' + lessonNo(P, st)} t={t} />
          <T style={[s.h, s.hsm]} accessibilityRole="header">
            {r.q}
          </T>
          <ReplyRoom pk={rc}>
            {rc != null ? <Reply text={lxRcReply(r, rc)} t={t} /> : null}
            {r.cr && rc != null ? (
              <T v="small" tone="muted">
                Tap any other answer to read its comment.
              </T>
            ) : null}
          </ReplyRoom>
          <Dock>
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
            <T v="small" tone="muted">
              No points for this one. It just helps the last lesson stick.
            </T>
          </Dock>
        </>
      );
      foot = rc == null ? <Ghost label="Skip" onPress={() => step(1)} /> : <Next label="Next" onPress={() => step(1)} />;
    } else if (it.t === 'done') {
      const pr = lessonPractice(L);
      const note = (st.learn.notes && st.learn.notes[L.id]) || '';
      body = (
        <View style={{ alignItems: 'center', gap: 12 }}>
          {/* the flame, drawn big in its own sky, every form the same size (the owner, October 27, 2026); on a short phone
              it shrinks a little before the words do, and never steps aside */}
          <FitArt min={0.62}>
            <FlameMedallion level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)} size={136} />
          </FitArt>
          <T style={[s.h, { textAlign: 'center' }]} accessibilityRole="header">
            {again ? 'Lesson ' + n + ', again' : 'Lesson ' + n + ' done'}
          </T>
          {gain > 0 ? (
            <View style={[s.pill, { backgroundColor: c.sun }]}>
              <Text style={{ fontFamily: font.bodySemi, color: c.onSun, fontSize: 15, lineHeight: 20 }}>+{gain} points</Text>
            </View>
          ) : again && !SHORT ? (
            <T tone="muted">Already counted. Read it as often as you like.</T>
          ) : null}
          <View style={[s.key, { backgroundColor: t.soft }]}>
            {L.ask ? (
              <>
                <Text style={[s.eye2, { color: t.text }]}>You asked</Text>
                <T>{L.ask}</T>
                <Text style={[s.eye2, { color: t.text, marginTop: 8 }]}>The answer</Text>
              </>
            ) : (
              <Text style={[s.eye2, { color: t.text }]}>The one thing to keep</Text>
            )}
            <Text style={[s.keyP, { color: c.ink }]}>{L.key}</Text>
          </View>
          {pr && pr.write ? null : <NoteField L={L} note={note} />}
          {w.path.every((x) => done.has(x.id)) ? (
            <T tone="mintText">That is all {w.path.length} lessons. They stay in Learn whenever you want to read one again.</T>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => setSheet({ t: 'src' })} style={s.link}>
            <Text style={[s.linkT, { color: c.accentText }]}>Behind this lesson</Text>
          </Pressable>
          {L.u === 1 || L.id === 'l22' || L.care ? (
            <T v="small" tone="muted">
              If this stirs up something heavy, you can call or text <Text style={{ fontFamily: font.bodyBold }}>988</Text>, the Suicide &amp; Crisis Lifeline,
              any time, day or night (US). It is open to anyone who is struggling.
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
            <Next label="Done" noIcon onPress={closeAll} />
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
            <Eyebrow label={card.el || (LX_E[card.e || 'turn'] || LX_E.turn)[1]} t={t} />
            <T style={[s.h, s.hsm]} accessibilityRole="header">
              {card.h}
            </T>
            {card.ask || typeof card.q === 'string' ? <T style={[s.p, { fontFamily: font.bodySemi }]}>{card.ask || (card.q as unknown as string)}</T> : null}
            <ReplyRoom pk={pk}>
              {pk != null ? <Reply text={card.c![pk][1]} t={t} /> : null}
              {gr && pk != null ? (
                <T v="small" tone="muted">
                  Tap any other answer to read its comment.
                </T>
              ) : null}
              {card.sv && pk != null ? (
                <View style={s.tag}>
                  <Icon name="check" size={15} color={c.mintText} />
                  <T v="eyebrow" tone="mintText">
                    Saved to My plan
                  </T>
                </View>
              ) : null}
            </ReplyRoom>
            <Dock>
              <Opts
                list={card.c!.map((x) => x[0])}
                best={gr ? card.a! : null}
                pk={pk}
                tried={tried[ci] || []}
                t={t}
                onPick={(j) => {
                  setPick((p) => ({ ...p, [ci]: j }));
                  setTried((x) => ({ ...x, [ci]: (x[ci] || []).indexOf(j) < 0 ? (x[ci] || []).concat(j) : x[ci] }));
                  if (card.sv)
                    apply({ st: changeSettings(st, (s0) => void ((s0.learn.picks || (s0.learn.picks = {}))[L.id] = String(card.c![j][0]).slice(0, 200))) });
                  buzz('tap');
                }}
              />
            </Dock>
          </>
        );
        foot = (
          <>
            {back}
            <Next label={seq[ix + 1] && seq[ix + 1].t === 'done' ? 'Finish' : 'Next'} off={gr && pk == null} onPress={() => step(1)} />
          </>
        );
      } else if (card.k === 'guess') {
        const g = card.g!;
        const gs = gu[ci] || { v: null, lock: false };
        body = (
          <GuessCard
            card={card}
            g={g}
            gs={gs}
            t={t}
            onSet={(v) => setGu((x) => ({ ...x, [ci]: { v, lock: false } }))}
            onSrc={() => setSheet({ t: 'src', i: ci })}
          />
        );
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
        body = <TextCard L={L} card={card} t={t} st={st} onSrc={() => setSheet({ t: 'src', i: ci })} />;
        foot = (
          <>
            {back}
            <Next label={seq[ix + 1] && seq[ix + 1].t === 'done' ? 'Finish' : 'Next'} onPress={() => step(1)} />
          </>
        );
      }
    }
  } else if (stage === 'practice') {
    const a = lessonPractice(L)!;
    const items = a.items || [];
    const note = wrote ?? ((st.learn.notes && st.learn.notes[L.id]) || '');
    const ed = editing != null ? items[editing] : null;
    prog = <Prog total={1} i={0} all />;
    body = ed ? (
      /* changing a line's words: the box and its button at the top, above the keyboard */
      <LineEditor key={editing} it={ed} t={t} onAdd={(x) => add(editing!, x)} onCancel={() => setEditing(null)} />
    ) : (
      <>
        <Eyebrow label={'Put it to work · ' + a.mins + ' min'} t={t} />
        <T style={[s.h, s.hsm]} accessibilityRole="header">
          {a.h}
        </T>
        <Rich text={a.p} st={st} style={s.p} />
        {a.write ? <WriteBox label={L.np} value={note} examples={a.write} t={t} onChange={write} /> : null}
        <Blocks bs={a.b} L={L} t={t} st={st} />
        <Dock>
          {items.map((it, k) => {
            const g = got[k];
            const on = it.k === 'copy' ? (copied[k] ? 'added' : null) : g && itemHas(st, g.it) ? 'added' : itemHas(st, it) ? 'had' : null;
            const old = it.k === 'be' ? st.becoming : it.k === 'note' ? st.note : '';
            return (
              <PLine
                key={k}
                it={g && on === 'added' ? g.it : it}
                t={t}
                state={on}
                replaces={old && old.trim() && !itemHas(st, it) ? old.trim() : undefined}
                onAdd={() => add(k, it)}
                onUndo={() => undo(k)}
                onEdit={() => {
                  setEditing(k);
                  top();
                }}
                onCopy={() => copyLine(k, it.text)}
              />
            );
          })}
          {(a.go || []).map((g, k) => (
            <GoRow key={'g' + k} label={g.t} ic={g.ic} went={!!went[k]} onPress={() => open(k, g)} />
          ))}
        </Dock>
      </>
    );
    const acted = Object.keys(got).length > 0 || Object.keys(went).length > 0 || Object.keys(copied).length > 0 || !!(wrote && wrote.trim());
    foot = ed ? null : (
      <View style={s.footCol}>
        <Next
          label="Done"
          noIcon
          onPress={() => {
            if (acted) practiced();
            toStage('practiced');
          }}
        />
        <Quiet label="Skip practice" onPress={() => toStage('practiced')} />
      </View>
    );
  } else {
    const a = lessonPractice(L);
    const pair = lessonPairOf(L);
    const due = pair && w.walked.has(pair.a.id) && !lcheckWritten(st, pair.n);
    prog = <Prog total={1} i={0} all />;
    body = (
      <>
        {/* the flame again, grown a little by this: the end of a lesson is its moment */}
        <FitArt style={s.art} min={0.62}>
          <FlameMedallion level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)} size={160} />
        </FitArt>
        {prac ? <Eyebrow label="Practiced" t={{ ...t, text: c.mintText }} /> : <Eyebrow label="Lesson done" t={t} />}
        <T style={s.h} accessibilityRole="header">
          {prac ? (a && a.ok) || 'Nicely done.' : 'That is the lesson.'}
        </T>
        {prac ? null : <T style={s.p}>The practice stays in Learn whenever you want it.</T>}
        {ringLit ? (
          <T style={s.p} tone="sunText">
            That lit today on your lessons ring, on the flame in Today. One part for each day you do a lesson this week.
          </T>
        ) : null}
        {due && pair ? (
          <Dock>
            <Route
              label="Write it out"
              small={'3–5 min · a short checkpoint for lessons ' + lessonNo(pair.a, st) + ' and ' + lessonNo(pair.b, st)}
              onPress={() => router.push({ pathname: '/lwrite/[n]', params: { n: String(pair.n) } })}
            />
          </Dock>
        ) : null}
      </>
    );
    foot = (
      <View style={s.footCol}>
        {next && !care ? (
          <Next label={'Next: ' + next.title} onPress={() => router.replace({ pathname: '/lesson/[id]', params: { id: next.id } })} />
        ) : (
          <Next label="Done" noIcon onPress={closeAll} />
        )}
        {care ? null : (
          <View style={s.quiets}>
            <Quiet
              half
              label="Back to Learn"
              onPress={() => {
                closeAll();
                router.navigate('/learn');
              }}
            />
            <Quiet
              half
              label="Back to Today"
              onPress={() => {
                closeAll();
                router.navigate('/');
              }}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <Frame
      title={(n ? 'Lesson ' + n + ' of ' + w.path.length : LUNITS[L.u].name) + (stage === 'practice' || stage === 'practiced' ? ' · done' : '')}
      onClose={close}
      c={c}
      inset={inset}
      over={sheet ? <SheetOver sheet={sheet} L={L} onClose={() => setSheet(null)} /> : null}>
      {prog}
      <ScrollView
        ref={scroll}
        onLayout={fit.onLayout}
        onContentSizeChange={fit.onContentSizeChange}
        style={s.card}
        contentContainerStyle={s.cardIn}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled">
        <FitProvider value={fit.ctx}>
          <KeyboardRoom scroll={scroll}>
            <Appear key={stage + ':' + i} by={10} style={s.cardBody}>
              {body}
            </Appear>
          </KeyboardRoom>
        </FitProvider>
      </ScrollView>
      {foot ? <View style={s.foot}>{foot}</View> : null}
    </Frame>
  );
}

/** where a tool or page from a lesson goes; it comes back to the lesson. Tools are care, so they open from any lesson,
    reached or not. */
function goTo(g: Go) {
  if (g.a === 'scene') router.push({ pathname: '/tool/[id]', params: { id: g.v!, lr: '1' } });
  else if (g.a === 'talk') router.push('/talk');
  else if (g.a === 'help') router.push({ pathname: '/help/[id]', params: { id: g.v!, sub: g.sub || '' } });
  else if (g.a === 'growth') router.push('/growth');
  else if (g.a === 'week') router.push('/review');
  else if (g.a === 'tab' && g.v === 'settings') router.push({ pathname: '/settings', params: { open: g.open || '' } });
  else if (g.a === 'tab' && g.v === 'plan') router.push({ pathname: '/plan', params: { pane: g.open || '' } });
}

/* ---------- a lesson the path has not reached, and one read early ---------- */
/** 'key': a lesson further on the path, opened from a link. Its key idea on one card, the tools it points to, and where it
    sits on the path; nothing is saved. 'back': a lesson read early, now Up next. A short welcome back: when it was read,
    the flame, the key idea, its own recall question, then Keep going or Read it all again. */
function PathGate({ L, w, gate }: { L: Lesson; w: LessonWalk; gate: 'key' | 'back' }) {
  const { snap, tk, apply } = useStore();
  const account = useAccount();
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const st = snap.settings!;
  const [rc, setRc] = useState<number | null>(null);
  const [rcTried, setRcTried] = useState<number[]>([]);
  const [went, setWent] = useState<Record<number, boolean>>({});
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
  const t = toneOf(c, LUNITS[L.u].tone);
  const n = lessonNo(L, st);
  const k = lessonKeyIdea(L);
  const first = lessonStats(snap.days).first[L.id];
  const read = first
    ? 'You read this one on ' + fmtDate(first, first.slice(0, 4) === tk.slice(0, 4) ? { month: 'long', day: 'numeric' } : { dateStyle: 'long' }) + '.'
    : '';
  const again = () => router.replace({ pathname: '/lesson/[id]', params: { id: L.id, at: 'all' } });
  const keyBox = (
    <View style={[s.key, { backgroundColor: t.soft }]}>
      {k.ask ? (
        <>
          <Text style={[s.eye2, { color: t.text }]}>This lesson answers</Text>
          <T>{k.ask}</T>
          <Text style={[s.eye2, { color: t.text, marginTop: 8 }]}>The key idea</Text>
        </>
      ) : (
        <Text style={[s.eye2, { color: t.text }]}>The key idea</Text>
      )}
      <Text style={[s.keyP, { color: c.ink }]}>{k.key}</Text>
    </View>
  );
  let body: ReactNode;
  let foot: ReactNode;
  if (gate === 'key') {
    const go = (lessonPractice(L) || { go: [] as Go[] }).go || [];
    const nx = w.next;
    body = (
      <>
        <Eyebrow label={'Lesson ' + n + ' · ' + LUNITS[L.u].name} t={t} />
        <T style={[s.h, L.title.length > 30 && s.hsm]} accessibilityRole="header">
          {L.title}
        </T>
        {keyBox}
        <T style={s.p}>
          {read ? read + ' ' : ''}This is lesson {n} on your path. It opens as you go.
        </T>
        {go.length ? (
          <Dock>
            <Text style={[s.eye2, { color: t.text }]}>Try it now</Text>
            {go.map((g, j) => (
              <GoRow
                key={j}
                label={g.t}
                ic={g.ic}
                went={!!went[j]}
                onPress={() => {
                  setWent((x) => ({ ...x, [j]: true }));
                  goTo(g);
                }}
              />
            ))}
          </Dock>
        ) : null}
      </>
    );
    foot = (
      <View style={s.footCol}>
        <Next label="Done" noIcon onPress={closeAll} />
        {read ? (
          <Quiet label="Read it all again" onPress={again} />
        ) : nx ? (
          <Quiet label={'Up next: lesson ' + lessonNo(nx, st)} onPress={() => router.replace({ pathname: '/lesson/[id]', params: { id: nx.id } })} />
        ) : null}
      </View>
    );
  } else {
    const P = lessonBackRecall(L);
    const r = P ? P.rc! : null;
    const keep = () => {
      apply((cur) => ({ st: lessonReach(cur, L.id) }));
      buzz('save');
      const nx = nextAfter(L, w);
      if (nx && lessonOpen(nx, w.done, account)) router.replace({ pathname: '/lesson/[id]', params: { id: nx.id } });
      else closeAll();
    };
    body = (
      <>
        {/* the flame stays beside the words, never dropped for room */}
        <View style={s.backHead}>
          <FlameMedallion level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)} size={SHORT ? 80 : 104} />
          <View style={{ flex: 1, gap: 6 }}>
            <Eyebrow label="Welcome back" t={t} />
            <T style={[s.h, s.hsm]} accessibilityRole="header">
              {L.title}
            </T>
          </View>
        </View>
        {read ? <T style={s.p}>{read}</T> : null}
        {keyBox}
        {r && P ? (
          <>
            <Text style={[s.eye2, { color: t.text }]}>Quick recall</Text>
            <T style={[s.p, { fontFamily: font.bodySemi }]}>{r.q}</T>
            <ReplyRoom pk={rc}>{rc != null ? <Reply text={lxRcReply(r, rc)} t={t} /> : null}</ReplyRoom>
            <Dock>
              <Opts
                list={r.c}
                best={r.a}
                pk={rc}
                tried={rcTried}
                t={t}
                onPick={(j) => {
                  setRc(j);
                  setRcTried((x) => (x.indexOf(j) < 0 ? x.concat(j) : x));
                  ASKED[L.id] = tk;
                  buzz('tap');
                }}
              />
            </Dock>
          </>
        ) : null}
      </>
    );
    foot = (
      <View style={s.footCol}>
        <Next label="Keep going" onPress={keep} />
        <Quiet label="Read it all again" onPress={again} />
      </View>
    );
  }
  return (
    <Frame title={'Lesson ' + n + ' of ' + w.path.length} onClose={close} c={c} inset={inset}>
      <ScrollView ref={scroll} onLayout={fit.onLayout} onContentSizeChange={fit.onContentSizeChange} style={s.card} contentContainerStyle={s.cardIn}>
        <FitProvider value={fit.ctx}>
          <Appear key={gate} by={10} style={s.cardBody}>
            {body}
          </Appear>
        </FitProvider>
      </ScrollView>
      <View style={s.foot}>{foot}</View>
    </Frame>
  );
}
/** a quiet link under the main button, for something the X does not do */
function Quiet({ label, onPress, half }: { label: string; onPress: () => void; half?: boolean }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={4} style={({ pressed }) => [half ? s.quietHalf : s.quiet, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[s.linkT, { color: c.accentText, textDecorationLine: 'none' }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------- the frame ---------- */
function Frame({
  title,
  onClose,
  children,
  c,
  inset,
  over,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  c: ReturnType<typeof useTheme>;
  inset: { top: number; bottom: number };
  /** something over the whole screen, like the sources sheet (outside the padded column, so it reaches the edges) */
  over?: ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: inset.top + 8, paddingBottom: inset.bottom + 12, paddingHorizontal: 16 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', gap: 8 }}>
        <View style={s.top}>
          <T v="eyebrow" tone="muted" accessibilityRole="header">
            {title}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.x, { backgroundColor: c.scBtn }]}>
            <Icon name="x" color={c.ink} />
          </Pressable>
        </View>
        {children}
      </View>
      {over}
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
function Eyebrow({ label, t }: { label: string; t: Pick<Tone, 'text'> }) {
  return <Text style={[s.eyeT, { color: t.text }]}>{label}</Text>;
}
function LenBtn({ t, on, title, sub, mins, onPress }: { t: Tone; on: boolean; title: string; sub: string; mins: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.len,
        { borderColor: on ? t.ic : 'transparent', backgroundColor: c.surface, shadowColor: c.lip, transform: [{ translateY: pressed ? 3 : 0 }] },
      ]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: font.display, fontSize: 20, lineHeight: 25, color: c.ink }}>{title}</Text>
        <T v="small" tone="muted">
          {sub}
        </T>
        {on ? <Text style={[s.eye2, { color: t.text, marginTop: 4 }]}>Your usual</Text> : null}
      </View>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: t.text }}>{mins}</Text>
    </Pressable>
  );
}
/** the choices: the first pick shows the best answer in green; every choice stays tappable so its comment can be read */
function Opts({
  list,
  best,
  pk,
  tried,
  t,
  onPick,
}: {
  list: string[];
  best: number | null;
  pk: number | null;
  tried: number[];
  t: Tone;
  onPick: (j: number) => void;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {list.map((o, j) => {
        const ok = best != null && pk != null && j === best;
        const no = best != null && pk != null && j !== best && tried.indexOf(j) >= 0;
        const sel = pk === j;
        const bc = ok ? c.mint : sel ? t.ic : 'transparent';
        const bg = ok ? c.mintSoft : sel && best == null ? t.soft : c.surface;
        const fg = ok ? c.mintText : no ? c.muted : sel && best == null ? t.text : c.ink;
        return (
          <Pressable
            key={j}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            onPress={() => onPick(j)}
            style={[s.opt, { borderColor: bc, backgroundColor: bg }]}>
            {ok || (best == null && sel) ? <Icon name="check" size={18} color={fg} /> : null}
            <Text style={[s.optT, { color: fg }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
/* the comment on a picked answer fades in over the answers, in the open middle, so the answers never move under the thumb, and the thumb is not over it.
   Picking another answer fades in its comment. */
function ReplyRoom({ pk, children }: { pk: number | null; children: ReactNode }) {
  return (
    <View style={s.replyRoom}>
      {pk != null ? (
        <Appear key={pk} by={6} style={{ gap: 8 }}>
          {children}
        </Appear>
      ) : null}
    </View>
  );
}
function Reply({ text, t }: { text: string; t: Tone }) {
  const c = useTheme();
  return (
    <View style={[s.reply, { backgroundColor: t.soft }]} accessibilityLiveRegion="polite">
      <Text style={{ fontFamily: font.body, fontSize: 15, lineHeight: 21, color: c.ink }}>{text}</Text>
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
function Blocks({ bs, t, st }: { bs?: Block[]; L: Lesson; t: Tone; st: Settings }) {
  const c = useTheme();
  const { snap } = useStore();
  if (!bs || !bs.length) return null;
  return (
    <>
      {bs.map((b, k) => {
        if (b[0] === 'p') return <Rich key={k} text={b[1]} st={st} style={s.p} />;
        if (b[0] === 'q')
          return (
            <View key={k} style={s.quote}>
              <Text style={{ fontFamily: font.display, fontSize: 20, lineHeight: 26, color: t.text }}>
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
                  <T style={s.p}>•</T>
                  <Rich text={x} st={st} style={[s.p, { flex: 1 }]} />
                </View>
              ))}
            </View>
          );
        if (b[0] === 'plan') {
          const rows = planRows(st);
          if (!rows.length) return null;
          return (
            <View key={k} style={[s.plan, { backgroundColor: c.surface }]}>
              <Text style={[s.eye2, { color: c.muted }]}>Your urge plan right now</Text>
              {rows.map((r, j) => (
                <T key={j}>
                  <Text style={{ fontFamily: font.bodyBold }}>If</Text> {r.when}
                  {'\n'}
                  <Text style={{ fontFamily: font.bodyBold }}>Then</Text>{' '}
                  {r.then && r.then.trim() ? r.then : <Text style={{ fontStyle: 'italic' }}>not filled in yet</Text>}
                </T>
              ))}
            </View>
          );
        }
        if (b[0] === 'mylog') {
          const lg = lessonLog(snap.days, st);
          return (
            <View key={k} style={[s.plan, { backgroundColor: c.surface }]}>
              {lg.few ? (
                <>
                  <Text style={[s.eye2, { color: c.muted }]}>Your log so far</Text>
                  <T>
                    {(lg.n ? lg.n + (lg.n === 1 ? ' entry' : ' entries') : 'No entries yet') +
                      '. A week of honest entries is enough to start seeing a pattern.'}
                  </T>
                </>
              ) : (
                <>
                  <Text style={[s.eye2, { color: c.muted }]}>What your log shows right now</Text>
                  <T>
                    <Text style={{ fontFamily: font.bodyBold }}>{lg.n}</Text> entries, <Text style={{ fontFamily: font.bodyBold }}>{lg.rode}</Text> of them rode
                    out.
                  </T>
                  {lg.tt ? (
                    <T>
                      The reason you picked most: <Text style={{ fontFamily: font.bodyBold }}>{lg.tt.t}</Text> ({lg.tt.n} time{lg.tt.n === 1 ? '' : 's'}).
                    </T>
                  ) : (
                    <T>No reasons yet. Picking one on each entry fills this in and makes the pattern much clearer.</T>
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
            <View key={k} style={[s.plan, { backgroundColor: c.surface }]}>
              <Text style={[s.eye2, { color: c.muted }]}>Words that steady me</Text>
              {w.length ? (
                w.map((x, j) => <T key={j}>{x}</T>)
              ) : (
                <T>No words yet. A verse, a prayer, or a line that steadies you fills this. Add them in My plan, under Lists.</T>
              )}
            </View>
          );
        }
        return null;
      })}
    </>
  );
}

function TextCard({ L, card, t, st, onSrc }: { L: Lesson; card: Card; t: Tone; st: Settings; onSrc: () => void }) {
  const e = LX_E[card.e || 'insight'] || LX_E.insight;
  /* a real picture (a chain, a wave, a number, a loop) always shows. A plain icon says nothing the words do not, so it shows
     only on the answer, the card the lesson turns on, and the words get the room on the others. */
  const art = card.art && (card.art[0] !== 'icon' || card.e === 'answer') ? card.art : null;
  return (
    <>
      {art ? (
        <FitArt style={s.art} drop={0.5} stretch={art[0] === 'research' || art[0] === 'wave'}>
          <LessonArt key={L.id + card.h} art={art} ic={L.ic} t={t} st={st} />
        </FitArt>
      ) : null}
      <Eyebrow label={card.el || e[1]} t={t} />
      <T style={[s.h, card.h.length > 46 && s.hsm]} accessibilityRole="header">
        {card.h}
      </T>
      <Blocks bs={card.b} L={L} t={t} st={st} />
      {card.so ? (
        <View style={s.so}>
          <Text style={[s.eye2, { color: t.text }]}>What this means for you</Text>
          <Rich text={card.so} st={st} style={[s.p, { fontFamily: font.bodyMedium }]} />
        </View>
      ) : null}
      {card.fact ? <Fact text={card.fact.s} t={t} onPress={onSrc} /> : null}
    </>
  );
}
/** where the science comes from: one small line at the bottom, a bonus, never in the way. A tap opens the detail. */
function Fact({ text, t, onPress }: { text: string; t: Tone; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Source: ' + text + '. Behind this.'}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [s.fact, pressed && { opacity: 0.7 }]}>
      <Icon name="book" size={13} color={t.text} />
      <Text style={[s.factT, { color: t.text }]} numberOfLines={1}>
        {text}
      </Text>
      <Icon name="next" size={13} color={t.text} />
    </Pressable>
  );
}

/* a number the person guesses before it is shown */
function GuessCard({
  card,
  g,
  gs,
  t,
  onSet,
  onSrc,
}: {
  card: Card;
  g: Guess;
  gs: { v: number | null; lock: boolean };
  t: Tone;
  onSet: (v: number) => void;
  onSrc: () => void;
}) {
  const c = useTheme();
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
    return (
      <>
        <Eyebrow label={card.el || LX_E.guess[1]} t={t} />
        <T style={[s.h, s.hsm]} accessibilityRole="header">
          {card.h}
        </T>
        <T style={s.p}>{card.p || 'Guess first. Guessing helps the answer stick.'}</T>
        <View style={s.guessMid}>
          <SliderValue big value={gs.v} caption={g.unit + ' · your guess'} hint="Slide below to guess" />
        </View>
        <Dock>
          <Slider label={card.h} value={gs.v} min={g.min} max={g.max} step={stepV} unit={g.unit} readout={false} onChange={onSet} />
        </Dock>
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
        <View
          style={{ alignSelf: 'stretch', gap: 6, paddingTop: 30 }}
          accessible
          accessibilityLabel={`You guessed ${v} ${g.unit}. The answer is ${a} ${g.unit}. People ranged from ${g.lo} to ${g.hi}.`}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: `${Math.min(85, Math.max(15, pv))}%`,
              transform: [{ translateX: -40 }],
              width: 80,
              alignItems: 'center',
            }}>
            <Text
              style={{
                paddingHorizontal: 10,
                paddingVertical: 3,
                borderRadius: 999,
                overflow: 'hidden',
                backgroundColor: c.sun,
                color: c.onSun,
                fontFamily: font.bodyBold,
                fontSize: 13,
              }}>
              You · {v}
            </Text>
          </View>
          <View style={{ height: 12, borderRadius: 6, backgroundColor: c.accentSoft }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                height: 12,
                borderRadius: 6,
                left: `${lo}%`,
                width: `${hi - lo}%`,
                backgroundColor: c.accent,
                opacity: 0.28,
              }}
            />
            <View style={[s.mk, { left: `${pv}%`, backgroundColor: c.sun, borderColor: c.surface }]} />
            <View style={[s.mk, { left: `${pa}%`, backgroundColor: c.accent, borderColor: c.surface }]} />
          </View>
          {Ticks}
          <Text style={{ fontFamily: font.body, fontSize: 13, color: c.muted, textAlign: 'center' }}>
            {g.cap || 'People ranged from ' + g.lo + ' to ' + g.hi + ' ' + g.unit}
          </Text>
        </View>
      </View>
      <Eyebrow label={LX_E.proof[1]} t={t} />
      <T style={[s.h, s.hsm]} accessibilityRole="header">
        {rv.h || card.h}
      </T>
      <T style={s.p}>
        {guessFeedback(g, v)}
        {rv.b ? ' ' : ''}
        {rv.b ? <Rich text={rv.b} st={null} style={s.p} /> : null}
      </T>
      {card.fact ? <Fact text={card.fact.s} t={t} onPress={onSrc} /> : null}
    </>
  );
}

/* ---------- the sheet that opens over the lesson ---------- */
/* where the science comes from, over the lesson */
function SheetOver({ sheet, L, onClose }: { sheet: Sheet; L: Lesson; onClose: () => void }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const title = 'Behind this lesson';
  const btn = 'Close';
  let body: ReactNode;
  {
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
              <Pressable
                accessibilityRole="link"
                onPress={() => Linking.openURL(e[1])}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 }}>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.accentText }}>Open the source</Text>
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,16,50,0.45)' }]}
        onPress={onClose}
      />
      <View style={[s.sheet, { backgroundColor: c.bg, paddingBottom: inset.bottom + 12, maxWidth: MAX_WIDTH }]}>
        <View style={[s.grab, { backgroundColor: c.lip }]} />
        <View style={s.top}>
          <T v="h2" accessibilityRole="header">
            {title}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.x, { backgroundColor: c.surface }]}>
            <Icon name="x" color={c.ink} />
          </Pressable>
        </View>
        <ScrollView
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 12, paddingBottom: 12 }}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
        <Next label={btn} noIcon onPress={onClose} />
      </View>
    </View>
  );
}

/* a short phone gets slightly smaller type and room, so a card fits (components/fit). The words sit on the page itself, with no
   card around them: a box here is something the person is meant to see as one thing (a choice, the answer, their plan). */
const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  x: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  prog: { flexDirection: 'row', gap: 4 },
  progI: { flex: 1, height: 6, borderRadius: 3 },
  card: { flex: 1, marginHorizontal: -16 },
  cardIn: { paddingHorizontal: 16, paddingTop: SHORT ? 12 : 16, paddingBottom: 16, flexGrow: 1 },
  cardBody: { gap: 12, flexGrow: 1 },
  guessMid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', minHeight: 170 },
  art: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  eyeT: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, marginBottom: -8 },
  eye2: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  h: { fontFamily: font.display, fontSize: SHORT ? 22 : 28, lineHeight: SHORT ? 28 : 34 },
  hsm: { fontSize: 22, lineHeight: 28 },
  p: { fontSize: 17, lineHeight: 24 },
  askB: { gap: 4, marginTop: 4 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999 },
  key: { alignSelf: 'stretch', gap: 4, padding: 16, borderRadius: 20 },
  keyP: { fontFamily: font.display, fontSize: SHORT ? 17 : 20, lineHeight: SHORT ? 23 : 26 },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  linkT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, textDecorationLine: 'underline' },
  foot: { flexDirection: 'row', gap: 12 },
  backHead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  footCol: { flex: 1, gap: 4 },
  quiet: { width: '100%', minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quiets: { width: '100%', flexDirection: 'row' },
  quietHalf: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  len: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 76,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 54, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2 },
  optT: { flex: 1, fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  replyRoom: { flexGrow: 1, justifyContent: 'flex-end' },
  reply: { padding: 16, borderRadius: 20 },
  quote: { paddingVertical: 4 },
  plan: { gap: 8, padding: 16, borderRadius: 20 },
  so: { gap: 4, marginTop: 8 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 28, marginTop: 'auto', opacity: 0.85 },
  factT: { flexShrink: 1, fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  ticks: { flexDirection: 'row', justifyContent: 'space-between' },
  mk: { position: 'absolute', top: -6, width: 24, height: 24, marginLeft: -12, borderRadius: 12, borderWidth: 4 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'center',
    maxHeight: '88%',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3 },
  src: { gap: 4, padding: 12, borderRadius: 12 },
});
