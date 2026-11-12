/* A lesson. One flow for every lesson: the cover (pick Quick or Full) > the cards >
   Done > Put it to work > Practiced. A lesson counts as finished only when the Done card is reached. Put it to work (core
   practice.ts) offers ready-made lines that go on the plan with one tap, right here, with Undo; a tool or page it opens comes
   back to the same step, as it was. Nothing on a card, and nothing on the practice step, can finish the lesson or send the
   person away without a way back. Ported from the legacy SCENES.lesson.
   Lessons open one at a time, in the order of the path (core lessonGate). A link to a lesson the path has not reached (a
   help page, My plan, the review, a nudge, a tool) opens its key idea instead: one card, with the tools it points to, that
   writes nothing and earns nothing. A lesson read before that rule, once the path reaches it, opens as a short welcome
   back: the key idea, then Keep going (core lessonReach: no points, nothing
   counted twice) or Read it all again (?at=all, the full lesson).
   The last lesson of a step ends with the step's deed, done in real life (core steps.ts): "I did it" or "Not yet, I will
   come back", and the path goes on either way. The first lesson of the next step asks once more, before its cover, unless
   the deed was done, was asked about already, or there was a slip today or yesterday. */
import {
  type Block,
  type Beat,
  type Card,
  cardArt,
  FLIP_ASK,
  FLIP_FEEL,
  cardBeat,
  cardLook,
  cardNumber,
  changeSettings,
  gameCompute,
  fmtDate,
  type Go,
  guessFeedback,
  lcheckAbout,
  lcheckWritten,
  type Lesson,
  lessonBeats,
  lessonById,
  lessonTo,
  lessonVoiced,
  faithVoice,
  lessonDoneOn,
  lessonGate,
  lessonHasQuick,
  lessonKeyIdea,
  lessonLog,
  lessonMine,
  lessonNo,
  itemAdd,
  itemHas,
  itemUndo,
  lessonOpen,
  lessonPairOf,
  lessonPractice,
  lessonPracticed,
  lessonReach,
  lessonSeq,
  lessonStats,
  lessonWalk,
  type LessonWalk,
  lfmt,
  LNOTE_LEN,
  PATH_STEPS,
  deedAfter,
  deedAnswer,
  deedAskBack,
  deedDone,
  deedSet,
  deedWords,
  lessonStep,
  lessonUnit,
  questionOf,
  nextAfter,
  type PItem,
  planRows,
  recordLesson,
  type Settings,
  srcNote,
  lessonDue,
  morningDue,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Linking, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FitArt, SHORT, useFitRoom } from '@/components/fit';
import { Dock } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Field } from '@/components/choices';
import { LessonArt, useCount } from '@/components/lesson-art';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { Answer, AnswerText, Prog, Question, Quiet, Shell } from '@/components/lesson-parts';
import { Ghost, Next, Rich, Route } from '@/components/lx';
import { GoRow, LineEditor, PLine, WriteBox } from '@/components/practice';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { lessonLook, PAPER, PAPER_INK, SUN_CARD, SUN_INK, type Look, type LookKind } from '@/lib/lesson-look';
import { count } from '@/lib/pulse';
import { track } from '@/lib/events';
import { close, closeAll } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { useSos } from '@/lib/sos';
import { copyText } from '@/lib/words';
import { useAccount } from '@/lib/sync';
import { font, MAX_WIDTH, PaletteOverride, toneOf, useTheme, type Tone } from '@/lib/theme';

/** deed: a step's deed, after its last lesson (core steps.ts) */
type Stage = 'cover' | 'run' | 'practice' | 'deed' | 'practiced';
/** recall questions answered on a welcome back while the app is open, by lesson id, with the day: the lesson after it does
    not ask the same question again that day */
const ASKED: Record<string, string> = {};
type Sheet =
  /** where the science comes from */
  | { t: 'src'; i?: number | null }
  /** a card's original words, and on a question the original comment on the answer picked */
  | { t: 'more'; i: number; pk: number | null }
  /** the lesson's one thing to keep, in full */
  | { t: 'key' };
/** a line added on the practice step: the words that went on the plan (changed or not), and what a sentence replaced */
interface Got {
  it: PItem;
  was?: string;
}

export default function LessonScreen() {
  const { id, at } = useLocalSearchParams<{ id: string; at?: string }>();
  const { snap, tk, update, apply, say } = useStore();
  const account = useAccount();
  /* fixed when the page opens: whether this is today's lesson and the morning set has not been done yet */
  const [morningFirst] = useState(() =>
    snap.settings && morningDue(snap.days, snap.settings, tk, Date.now()) ? lessonDue(snap.days, snap.settings, tk, account) : null,
  );
  const base = useTheme();
  const inset = useSafeAreaInsets();
  const st = snap.settings;
  /* a God lesson speaks in the voice of this person's faith, and a lesson written for porn in the words of their habit (core lessonTo) */
  const found = lessonById(id);
  const L = found && lessonTo(found, st);
  /* back from a tool or a page the practice step sent the person to: straight to the result, nothing is replayed */
  const [stage, setStage] = useState<Stage>(at === 'practiced' ? 'practiced' : 'cover');
  const [i, setI] = useState(0);
  /* what Daybook learns: when it opened, each part reached, and a lesson left before its end (lib/events.ts) */
  const opened = useRef(Date.now());
  const finished = useRef(false);
  const beatAt = useRef(0);
  useEffect(() => {
    beatAt.current = i;
    if (L && i > 0) track('lesson_beat', { lesson: L.id, beat: i });
  }, [i, L?.id]);
  useEffect(
    () => () => {
      if (L && !finished.current) track('lesson_left', { lesson: L.id, beat: beatAt.current });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [L?.id],
  );
  const [len, setLen] = useState<'q' | 'f'>('f');
  const [pick, setPick] = useState<Record<number, number>>({});
  const [tried, setTried] = useState<Record<number, number[]>>({});
  const [gu, setGu] = useState<Record<number, { v: number | null; lock: boolean }>>({});
  /* the turn cards: how true the old thought felt (FLIP_FEEL), which turns the card over; it stays turned on the way back */
  const [flip, setFlip] = useState<Record<number, number>>({});
  const [gain, setGain] = useState(0);
  const [again, setAgain] = useState(false);
  const [rec, setRec] = useState(at === 'practiced');
  const [prac, setPrac] = useState(at === 'practiced');
  const [sheet, setSheet] = useState<Sheet | null>(null);
  /* the step's deed: what was chosen at the end of this lesson, and whether the one ask back was answered as it opened */
  const [deedA, setDeedA] = useState<'did' | 'later' | null>(null);
  const [askedBack, setAskedBack] = useState(false);
  /* the practice step: what was added, opened and copied here, and the line whose words are being changed */
  const [got, setGot] = useState<Record<number, Got>>({});
  const [went, setWent] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState<Record<number, boolean>>({});
  const [editing, setEditing] = useState<number | null>(null);
  const [wrote, setWrote] = useState<string | null>(null);
  /* the flame blooms when the right answer is found */
  const [pulse, setPulse] = useState(0);
  const scroll = useRef<ScrollViewInstance>(null);
  /* the picture on a card gives up height so the card fits a short phone (components/fit) */
  const fit = useFitRoom();
  /* a new card starts at its top, set as it comes in (it is still clear then): the old card never jumps before it goes */
  useLayoutEffect(() => scroll.current?.scrollTo({ y: 0, animated: false }), [stage, i]);
  /* the first time a lesson lights a day on the week's ring (core lessonWeek, app/lessons-week.tsx), the last card says what the ring is. Once
     per phone (kept with SOS's memory); fixed when the lesson opens, so the line stays while this lesson is on screen. */
  const sos = useSos();
  const [ringNote] = useState(() => !sos.mem.ringNote);
  const ringLit = ringNote && stage === 'practiced' && lessonDoneOn(snap.days[tk]?.p);
  useEffect(() => {
    if (ringLit) sos.setMem((m) => ({ ...m, ringNote: tk }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ringLit]);
  /* the anonymous counts: a lesson was opened (lesson_done and ld_<id> say it was finished, and which) */
  useEffect(() => {
    if (!L) return;
    count('lesson_open');
    track('lesson_open', { lesson: L.id });
    opened.current = Date.now();
  }, [L?.id]);

  if (!st) return <Redirect href="/" />;
  if (!L)
    return (
      <Shell
        look={lessonLook('sky', 0, base.scheme)}
        level={1}
        flameOn={false}
        pulse={0}
        onClose={close}
        inset={inset}
        scroll={scroll}
        fit={fit}
        bodyKey="none"
        foot={null}>
        <T v="title">That lesson is not here</T>
      </Shell>
    );
  /* the morning set comes before today's lesson (core morning-set.ts): today's new lesson, opened while the morning set is
     due (from the morning note, or Learn), opens the morning set first, and the morning set opens this lesson after it */
  if (!at && morningFirst === id) return <Redirect href={{ pathname: '/morning', params: { then: id } }} />;
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
  /* the step whose deed comes after this lesson (its last on the path), shown once the lesson is read, unless it was done already */
  const dk = care ? -1 : deedAfter(L, st);
  const deedNext = dk >= 0 && !deedDone(st, dk) && deedA == null;
  /* the step before this one, asked about once more as its first lesson opens (never after a slip) */
  const askK = care || askedBack ? -1 : deedAskBack(L, snap.days, st, tk);
  const seq = lessonSeq(L, len);
  const top = () => scroll.current?.scrollTo({ y: 0, animated: false });
  const beats = lessonBeats(L);
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);

  /* where this card is: the sky turns from night to day as the lesson goes on; the answer is the sun, and a number is the violet card */
  let kind: LookKind = 'sky';
  let p = 0;
  let lockKey = false;
  if (stage === 'run') {
    const ix = Math.max(0, Math.min(seq.length - 1, i));
    const cur = seq[ix];
    p = (ix + 1) / seq.length;
    if (cur.t === 'card') {
      const cl = cardLook(cur.c, cardBeat(L, cur.ci));
      lockKey = (cl === 'guess' && !!gu[cur.ci]?.lock) || (cl === 'flip' && flip[cur.ci] != null);
      /* a turn keeps the sky it has: the card itself turns over (a change of sky read as a flash, the owner, November 2, 2026) */
      kind = cl === 'sun' ? 'sun' : cl === 'number' || (cl === 'guess' && lockKey) ? 'violet' : 'sky';
    }
  } else if (stage !== 'cover') p = 1;
  const look = lessonLook(kind, p, base.scheme);
  const c = look.c;
  const t = toneOf(c, lessonUnit(L).tone);
  const flameOn = kind !== 'violet' && !(stage === 'practice' && editing != null);
  let backBtn: (() => void) | undefined;

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
    count('ld_' + L.id);
    track('lesson_done', { lesson: L.id, secs: Math.round((Date.now() - opened.current) / 1000) });
    finished.current = true;
    buzz(a ? 'save' : 'lit');
  };
  const step = (d: number) => {
    const to = i + d;
    if (to < 0 || to >= seq.length) return;
    const cur = seq[i];
    if (d > 0 && cur.t === 'card' && cur.c.k === 'guess' && !(gu[cur.ci] && gu[cur.ci].lock)) return;
    if (d > 0 && cur.t === 'card' && cur.c.k === 'flip' && flip[cur.ci] == null) return;
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
  /* a deed's answer, at the end of the step or asked once more: "I did it" gives its points on today, kept for good */
  const deedSave = (fn: (st0: Settings) => Settings) => {
    let g = 0;
    update((s0) => {
      const b0 = gameCompute(s0.days, s0.settings!, s0.reviews, tk).rawPts;
      const st1 = fn(s0.settings!);
      g = Math.max(0, gameCompute(s0.days, st1, s0.reviews, tk).rawPts - b0);
      return { ...s0, settings: st1 };
    });
    return g;
  };
  const chooseDeed = (a: 'did' | 'later') => {
    const g = deedSave((st0) => deedSet(st0, dk, a, tk));
    setDeedA(a);
    if (a === 'did') {
      setGain(g);
      setPulse((x) => x + 1);
      buzz('lit');
    } else buzz('tap');
    toStage('practiced');
  };
  const answerBack = (did: boolean) => {
    const g = deedSave((st0) => deedAnswer(st0, askK, did, tk));
    setAskedBack(true);
    if (did) {
      setPulse((x) => x + 1);
      buzz('lit');
      say((g > 0 ? '+' + g + ' points. ' : '') + 'Step ' + (askK + 1) + ', done for real.');
    } else {
      buzz('tap');
      say('That is all right. It will be there when you are ready.');
    }
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
  /* the flame grows a little as the lesson goes on */
  const want = (SHORT ? 210 : 260) + (SHORT ? 40 : 70) * p;
  if (stage === 'cover' && askK >= 0) {
    /* the one ask back, before the next step starts: two answers, and either way it is never asked again */
    body = (
      <>
        <T v="small" tone="muted">
          Before step {lessonStep(L) + 1}
        </T>
        <T style={s.h} accessibilityRole="header">
          You were going to {PATH_STEPS[askK].back}. Did you get to?
        </T>
        <FlameSlot size={SHORT ? 260 : 330} min={120} />
        <Dock>
          <View style={{ gap: 12 }}>
            <DeedBtn title="I did it" sub={'Step ' + (askK + 1) + ' lights up on your map.'} onPress={() => answerBack(true)} />
            <DeedBtn title="Not yet" sub="Daybook will not ask again." onPress={() => answerBack(false)} />
          </View>
        </Dock>
      </>
    );
  } else if (stage === 'cover') {
    const pref = st.learn.len;
    const start = (l: 'q' | 'f') => {
      const ln = l === 'q' && lessonHasQuick(L) ? 'q' : 'f';
      setLen(ln);
      setI(0);
      setStage('run');
      if (lessonHasQuick(L) && st.learn.len !== ln) apply({ st: changeSettings(st, (s0) => void (s0.learn.len = ln)) });
    };
    body = (
      <>
        <FlameSlot size={SHORT ? 280 : 360} min={120} />
        <T v="small" tone="muted">
          {n ? 'Lesson ' + n + ' · Step ' + (lessonStep(L) + 1) + ', ' + lessonUnit(L).name : lessonUnit(L).name}
        </T>
        <T style={s.h} accessibilityRole="header">
          {L.title}
        </T>
        <T style={s.p}>{L.ask || L.tag}</T>
        {done.has(L.id) ? (
          <View style={s.tag}>
            <Icon name="check" size={15} color={c.ink} />
            <T v="small">You finished this one</T>
          </View>
        ) : null}
        {lessonHasQuick(L) ? (
          <Dock>
            <View style={{ gap: 12 }} accessibilityLabel="Pick a length">
              <LenBtn
                on={pref === 'q'}
                title="Quick"
                sub={L.v === 3 ? 'The turn, what to do, one check' : L.v === 2 ? 'The answer, what to do, one check' : 'The main idea, then one question'}
                mins="1–2 min"
                onPress={() => start('q')}
              />
              <LenBtn
                on={pref !== 'q'}
                title="Full"
                sub={
                  L.v === 3
                    ? 'Adds a question and what is behind the turn'
                    : L.v === 2
                      ? 'Adds a guess and the science behind it'
                      : 'Adds the evidence and why it works'
                }
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
    prog = <Prog total={seq.length} i={ix} look={look} />;
    if (ix > 0) backBtn = () => step(-1);
    const nextLabel = seq[ix + 1] && seq[ix + 1].t === 'done' ? 'Finish' : 'Next';
    if (it.t === 'done') {
      const pr = lessonPractice(L, st);
      const note = (st.learn.notes && st.learn.notes[L.id]) || '';
      const key = beats?.key || L.key;
      body = (
        <>
          <View style={s.doneHead}>
            <T style={[s.h, { flexShrink: 1 }]} accessibilityRole="header">
              {again ? 'Lesson ' + n + ', again' : 'Lesson ' + n + ' done'}
            </T>
            {gain > 0 ? (
              <View style={[s.pill, { backgroundColor: c.sun }]}>
                <Text style={{ fontFamily: font.bodySemi, color: c.onSun, fontSize: 15, lineHeight: 20 }}>+{gain} points</Text>
              </View>
            ) : null}
          </View>
          <Bubble text={key} more={key !== L.key} onMore={() => setSheet({ t: 'key' })} />
          <FlameSlot size={want} min={SHORT ? 96 : 130} />
          {pr && pr.write ? null : <NoteField L={L} note={note} />}
          {w.path.every((x) => done.has(x.id)) ? <T>That is all {w.path.length} lessons. They stay in Learn whenever you want to read one again.</T> : null}
          <Pressable accessibilityRole="button" onPress={() => setSheet({ t: 'src' })} style={s.link}>
            <Text style={[s.linkT, { color: c.accentText }]}>Behind this lesson</Text>
          </Pressable>
          {L.u === 1 || L.id === 'l22' || L.care ? (
            <T v="small" tone="muted">
              If this stirs up something heavy, you can call or text <Text style={{ fontFamily: font.bodyBold }}>988</Text>, the Suicide &amp; Crisis Lifeline,
              any time, day or night (US). It is open to anyone who is struggling.
            </T>
          ) : null}
        </>
      );
      foot = pr ? (
        <Next label="Put it to work" onPress={() => toStage('practice')} />
      ) : deedNext ? (
        <Next label="Next" onPress={() => toStage('deed')} />
      ) : next ? (
        <Next label={'Next: ' + next.title} onPress={() => router.replace({ pathname: '/lesson/[id]', params: { id: next.id } })} />
      ) : (
        <Next label="Done" noIcon onPress={closeAll} />
      );
    } else {
      const card = it.c;
      const ci = it.ci;
      const b = cardBeat(L, ci);
      if (card.k === 'choose') {
        /* the question's words: rewritten to make the person think (core lesson-questions.ts), or the card's own */
        const q = questionOf(L, ci, card, b);
        const gr = q.a != null;
        const pk = pick[ci] ?? null;
        const saved = card.sv ? ' Saved to My plan.' : '';
        body = (
          <Question
            h={q.h}
            list={q.o}
            best={gr ? q.a! : null}
            pk={pk}
            tried={tried[ci] || []}
            comments={q.c.map((x) => x + saved)}
            want={want}
            onMore={b.c && !q.rewritten ? () => setSheet({ t: 'more', i: ci, pk }) : undefined}
            onPick={(j) => {
              setPick((p0) => ({ ...p0, [ci]: j }));
              track('lesson_pick', { lesson: L.id, beat: i, ix: j });
              setTried((x) => ({ ...x, [ci]: (x[ci] || []).indexOf(j) < 0 ? (x[ci] || []).concat(j) : x[ci] }));
              if (card.sv) apply({ st: changeSettings(st, (s0) => void ((s0.learn.picks || (s0.learn.picks = {}))[L.id] = String(q.o[j]).slice(0, 200))) });
              if (!gr || j === q.a) setPulse((x) => x + 1);
              buzz('tap');
            }}
          />
        );
        /* a rewritten question waits for an answer, any answer: it is the person's own */
        foot = <Next label={nextLabel} off={(gr || q.rewritten) && pk == null} onPress={() => step(1)} />;
      } else if (card.k === 'guess') {
        const g = card.g!;
        const gs = gu[ci] || { v: null, lock: false };
        body = gs.lock ? (
          <NumberCard
            n={b.rv?.n || String(g.ans)}
            h={b.rv?.h || g.rv?.h || card.h}
            lead={guessFeedback(g, gs.v!)}
            p={b.rv?.p || g.rv?.b}
            st={st}
            fact={card.fact?.s}
            onSrc={() => setSheet({ t: 'src', i: ci })}
          />
        ) : (
          <>
            <T style={[s.h, s.hsm]} accessibilityRole="header">
              {b.h || card.h}
            </T>
            <View style={s.guessMid}>
              <SliderValue big value={gs.v} caption={g.unit + ' · your guess'} hint="Slide below to guess" />
            </View>
            <FlameSlot size={want * 0.8} min={84} />
            <Dock>
              <Slider
                label={card.h}
                value={gs.v}
                min={g.min}
                max={g.max}
                step={g.step || 1}
                unit={g.unit}
                readout={false}
                onChange={(v) => setGu((x) => ({ ...x, [ci]: { v, lock: false } }))}
              />
            </Dock>
          </>
        );
        foot = gs.lock ? (
          <View style={s.footCol}>
            <Quiet label="More" onPress={() => setSheet({ t: 'more', i: ci, pk: null })} />
            <Next label={nextLabel} onPress={() => step(1)} />
          </View>
        ) : (
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
        );
      } else if (card.k === 'flip') {
        const felt = flip[ci] ?? null;
        body = (
          <FlipCard
            think={b.h || card.h}
            see={b.p || card.see || ''}
            felt={felt}
            want={want}
            onFeel={(j) => {
              if (felt != null) return;
              setFlip((x) => ({ ...x, [ci]: j }));
              buzz('tap');
            }}
            onLanded={() => {
              setPulse((x) => x + 1);
              buzz('lit');
            }}
          />
        );
        foot =
          felt != null ? (
            <View style={s.footCol}>
              <Quiet label="More" onPress={() => setSheet({ t: 'more', i: ci, pk: null })} />
              <Next label={nextLabel} onPress={() => step(1)} />
            </View>
          ) : null;
      } else {
        body =
          cardLook(card, b) === 'number' ? (
            <NumberCard n={cardNumber(card, b)} h={b.h || card.h} p={b.p} st={st} fact={card.fact?.s} onSrc={() => setSheet({ t: 'src', i: ci })} />
          ) : (
            <TextCard L={L} card={card} beat={b} look={look} st={st} want={want} onSrc={() => setSheet({ t: 'src', i: ci })} />
          );
        foot = (
          <View style={s.footCol}>
            <Quiet label="More" onPress={() => setSheet({ t: 'more', i: ci, pk: null })} />
            <Next label={nextLabel} onPress={() => step(1)} />
          </View>
        );
      }
    }
  } else if (stage === 'practice') {
    const a = lessonPractice(L, st)!;
    const items = a.items || [];
    const note = wrote ?? ((st.learn.notes && st.learn.notes[L.id]) || '');
    const ed = editing != null ? items[editing] : null;
    prog = <Prog total={1} i={0} all look={look} />;
    body = ed ? (
      /* changing a line's words: the box and its button at the top, above the keyboard */
      <LineEditor key={editing} it={ed} t={t} onAdd={(x) => add(editing!, x)} onCancel={() => setEditing(null)} />
    ) : (
      <>
        <T style={[s.h, s.hsm]} accessibilityRole="header">
          {a.h}
        </T>
        <Rich text={a.p} st={st} style={s.p} />
        {a.write ? <WriteBox label={L.np} value={note} examples={a.write} t={t} onChange={write} /> : null}
        <Blocks bs={a.b} L={L} t={t} st={st} />
        <FlameSlot size={SHORT ? 200 : 260} min={110} />
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
            toStage(deedNext ? 'deed' : 'practiced');
          }}
        />
        <Quiet label="Skip practice" onPress={() => toStage(deedNext ? 'deed' : 'practiced')} />
      </View>
    );
  } else if (stage === 'deed') {
    /* the end of a step: its deed, done in real life. Nothing waits on the answer. */
    prog = <Prog total={1} i={0} all look={look} />;
    body = (
      <>
        <T v="small" tone="muted">
          The end of step {dk + 1}, {PATH_STEPS[dk].name}
        </T>
        <T style={s.h} accessibilityRole="header">
          Now do it for real
        </T>
        <Bubble text={deedWords(dk, st)} />
        <FlameSlot size={SHORT ? 230 : 300} min={110} />
        <Dock>
          <View style={{ gap: 12 }}>
            <DeedBtn title="I did it" sub={'Step ' + (dk + 1) + ' lights up on your map.'} onPress={() => chooseDeed('did')} />
            <DeedBtn title="Not yet, I will come back" sub="Daybook asks once more, at the next step." onPress={() => chooseDeed('later')} />
          </View>
        </Dock>
      </>
    );
  } else {
    const a = lessonPractice(L, st);
    const pair = lessonPairOf(L);
    const due = pair && (w.walked.has(pair.a.id) || (w.path.indexOf(pair.a) < 0 && done.has(pair.a.id))) && !lcheckWritten(st, pair.n);
    prog = <Prog total={1} i={0} all look={look} />;
    body = (
      <>
        <T style={s.h} accessibilityRole="header">
          {deedA === 'did' ? 'You did step ' + (dk + 1) + '.' : prac ? (a && a.ok) || 'Nicely done.' : 'That is the lesson.'}
        </T>
        {deedA === 'did' ? (
          <T style={s.p}>
            {PATH_STEPS[dk].name}, done in real life{gain > 0 ? ': +' + gain + ' points' : ''}.
          </T>
        ) : prac || deedA ? null : (
          <T style={s.p}>The practice stays in Learn whenever you want it.</T>
        )}
        {ringLit ? <T style={s.p}>That lit today on your lessons ring, in Learn. One part for each day you do a lesson this week.</T> : null}
        {/* the end of a lesson is the flame's moment */}
        <FlameSlot size={SHORT ? 330 : 420} min={150} />
        {due && pair ? (
          <Dock>
            <Route
              label="Write it out"
              small={'3–5 min · a short checkpoint for ' + lcheckAbout(pair, st)}
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
    <Shell
      look={look}
      level={level}
      flameOn={flameOn}
      pulse={pulse}
      onClose={close}
      onBack={backBtn}
      prog={prog}
      inset={inset}
      scroll={scroll}
      fit={fit}
      bodyKey={stage + ':' + i + (lockKey ? ':lock' : '')}
      foot={foot}
      over={sheet ? <SheetOver sheet={sheet} L={L} st={st} onClose={() => setSheet(null)} onSrc={(i0) => setSheet({ t: 'src', i: i0 })} /> : null}>
      {body}
    </Shell>
  );
}

/** where a tool or page from a lesson goes; it comes back to the lesson. Tools are care, so they open from any lesson,
    reached or not. */
function goTo(g: Go) {
  if (g.a === 'scene') router.push({ pathname: '/tool/[id]', params: { id: g.v!, lr: '1' } });
  else if (g.a === 'talk') router.push('/trail');
  else if (g.a === 'help') router.push({ pathname: '/help/[id]', params: { id: g.v!, sub: g.sub || '' } });
  else if (g.a === 'growth') router.push('/growth');
  else if (g.a === 'week') router.push('/review');
  else if (g.a === 'tab' && g.v === 'settings') router.push({ pathname: '/settings', params: { open: g.open || '' } });
  else if (g.a === 'tab' && g.v === 'plan') router.push({ pathname: '/plan', params: { pane: g.open || '' } });
}

/* ---------- a lesson the path has not reached, and one read early ---------- */
/** 'key': a lesson further on the path, opened from a link. Its key idea on one card, the tools it points to, and where it
    sits on the path; nothing is saved. 'back': a lesson read early, now Up next. A short welcome back: when it was read,
    the flame, the key idea, then Keep going or Read it all again. */
function PathGate({ L, w, gate }: { L: Lesson; w: LessonWalk; gate: 'key' | 'back' }) {
  const { snap, tk, apply } = useStore();
  const account = useAccount();
  const base = useTheme();
  const look = lessonLook('sky', gate === 'back' ? 0.74 : 0.3, base.scheme);
  const inset = useSafeAreaInsets();
  const st = snap.settings!;
  const [went, setWent] = useState<Record<number, boolean>>({});
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
  const n = lessonNo(L, st);
  const k = lessonKeyIdea(L);
  const first = lessonStats(snap.days).first[L.id];
  const read = first
    ? 'You read this one on ' + fmtDate(first, first.slice(0, 4) === tk.slice(0, 4) ? { month: 'long', day: 'numeric' } : { dateStyle: 'long' }) + '.'
    : '';
  const again = () => router.replace({ pathname: '/lesson/[id]', params: { id: L.id, at: 'all' } });
  const beats = lessonBeats(L);
  const said = beats?.key || k.key;
  let body: ReactNode;
  let foot: ReactNode;
  if (gate === 'key') {
    const go = (lessonPractice(L, st) || { go: [] as Go[] }).go || [];
    const nx = w.next;
    body = (
      <>
        <T v="small" tone="muted">
          Lesson {n} · {lessonUnit(L).name}
        </T>
        <T style={[s.h, L.title.length > 30 && s.hsm]} accessibilityRole="header">
          {L.title}
        </T>
        {k.ask ? <T style={s.p}>{k.ask}</T> : null}
        <Bubble text={said} />
        <FlameSlot size={SHORT ? 210 : 280} min={96} />
        <T style={s.p}>
          {read ? read + ' ' : ''}This is lesson {n} on your path. It opens as you go.
        </T>
        {go.length ? (
          <Dock>
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
    const keep = () => {
      apply((cur) => ({ st: lessonReach(cur, L.id) }));
      buzz('save');
      const nx = nextAfter(L, w);
      if (nx && lessonOpen(nx, w.done, account)) router.replace({ pathname: '/lesson/[id]', params: { id: nx.id } });
      else closeAll();
    };
    body = (
      <>
        <T v="small" tone="muted">
          Welcome back. {read}
        </T>
        <T style={[s.h, s.hsm]} accessibilityRole="header">
          {L.title}
        </T>
        <Bubble text={said} />
        <FlameSlot size={SHORT ? 210 : 280} min={96} />
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
    <Shell
      look={look}
      level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)}
      flameOn
      pulse={0}
      onClose={close}
      inset={inset}
      scroll={scroll}
      fit={fit}
      bodyKey={gate}
      foot={foot}>
      {body}
    </Shell>
  );
}
/* ---------- small pieces ---------- */
/** one answer to a step's deed: a plain choice on paper, like a question's answers, neither one marked as the right one */
function DeedBtn({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) {
  return (
    <Answer sel={false} right={false} onPress={onPress} style={{ gap: 2 }}>
      <Text style={{ fontFamily: font.display, fontSize: 17, lineHeight: 22, color: PAPER_INK }}>{title}</Text>
      <Text style={{ fontFamily: font.body, fontSize: 13, lineHeight: 18, color: PAPER_INK }}>{sub}</Text>
    </Answer>
  );
}
function LenBtn({ on, title, sub, mins, onPress }: { on: boolean; title: string; sub: string; mins: string; onPress: () => void }) {
  const c = useTheme();
  const ink = on ? c.onSun : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) => [
        s.len,
        on
          ? { backgroundColor: c.sun, shadowColor: c.sun2, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0 }
          : { backgroundColor: c.accentSoft },
        { transform: [{ translateY: pressed ? 3 : 0 }] },
      ]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: font.display, fontSize: 17, lineHeight: 22, color: ink }}>{title}</Text>
        <Text style={{ fontFamily: font.body, fontSize: 13, lineHeight: 18, color: ink }}>{sub}</Text>
      </View>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: ink }}>{mins}</Text>
    </Pressable>
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
  const { snap, tk } = useStore();
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
        if (b[0] === 'mine')
          return (
            <View key={k} style={[s.plan, { backgroundColor: c.surface }]}>
              <Text style={[s.eye2, { color: c.muted }]}>From your log, on this phone</Text>
              <T style={s.mine}>{lessonMine(b[1], snap.days, st, tk)}</T>
            </View>
          );
        if (b[0] === 'words') {
          const w = st.words || [];
          return (
            <View key={k} style={[s.plan, { backgroundColor: c.surface }]}>
              <Text style={[s.eye2, { color: c.muted }]}>Words that steady me</Text>
              {w.length ? (
                w.map((x, j) => <T key={j}>{x}</T>)
              ) : (
                <T>No words yet. A verse, a prayer, or a line that steadies you fills this. Add them in My plan, under Why.</T>
              )}
            </View>
          );
        }
        return null;
      })}
    </>
  );
}

/** the words of a card: one thought, with a real picture when it has one, and room left for the flame */
function TextCard({ L, card, beat, look, st, want, onSrc }: { L: Lesson; card: Card; beat: Beat; look: Look; st: Settings; want: number; onSrc: () => void }) {
  const art = cardArt(card);
  const h = beat.h || card.h;
  /* what is the person's own stays on the card; the rest of the original words are in More */
  const own = (card.b || []).filter((x) => x[0] === 'mylog' || x[0] === 'plan' || x[0] === 'words' || x[0] === 'mine');
  const tone = look.art as Tone;
  /* a card that builds on an earlier lesson names it, as part of the thought, not as a review */
  const B = card.back ? lessonById(card.back) : null;
  const bn = B ? lessonNo(B, st) : null;
  return (
    <>
      {B ? (
        <T v="small" tone="muted">
          {(bn ? 'From lesson ' + bn : 'From') + ', ' + B.title}
        </T>
      ) : null}
      <T style={[s.h, SHORT && h.length > 40 && s.hsm]} accessibilityRole="header">
        {h}
      </T>
      {beat.p ? <Rich text={beat.p} st={st} style={s.p} /> : null}
      {beat.l ? (
        <View style={{ gap: 8, marginTop: 4 }}>
          {beat.l.map((x, j) => (
            <View key={j} style={[s.line, { backgroundColor: look.row }]}>
              <Rich text={x} st={st} style={{ fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: look.rowInk }} />
            </View>
          ))}
        </View>
      ) : null}
      {own.length ? <Blocks bs={own} L={L} t={tone} st={st} /> : null}
      {card.fact ? <Fact text={card.fact.s} onPress={onSrc} /> : null}
      {art ? (
        <FitArt style={s.art} drop={0.5} stretch={art[0] === 'research' || art[0] === 'wave'}>
          <LessonArt key={L.id + card.h} art={art} ic={L.ic} t={tone} st={st} />
        </FitArt>
      ) : null}
      {beat.say ? <Bubble text={beat.say} style={{ marginTop: 16 }} /> : null}
      <FlameSlot size={art || own.length ? Math.min(want, SHORT ? 180 : 230) : want} min={art || own.length ? 84 : 96} />
    </>
  );
}
/** a turn, as a card held up between the person and the flame (the owner, November 9, 2026: the old flash cards were "really bad").
    The front is the old thought, said in the person's voice, set a little crooked on warm paper. The flame asks how true it feels,
    and the answer, in one tap, turns the card over: it lifts, turns and lands straight, sun yellow, with the other way to see it, and
    the flame answers what was picked. After that, a tap on the card turns it back to compare, and again. Nothing is marked right or
    wrong: the person's answer is theirs. With Reduce Motion on, the back simply shows. */
function FlipCard({
  think,
  see,
  felt,
  want,
  onFeel,
  onLanded,
}: {
  think: string;
  see: string;
  felt: number | null;
  want: number;
  onFeel: (j: number) => void;
  onLanded: () => void;
}) {
  const still = useReducedMotion();
  /* 0 is the old thought up, 1 the new way to see it */
  const a = useRef(new Animated.Value(felt != null ? 1 : 0)).current;
  const [up, setUp] = useState<0 | 1>(felt != null ? 1 : 0);
  const landed = useRef(felt != null);
  /* the flame answers once the card has landed, not while it turns */
  const [said, setSaid] = useState(felt != null);
  const turnTo = (to: 0 | 1) => {
    setUp(to);
    const done = () => {
      if (to === 1 && !landed.current) {
        landed.current = true;
        setSaid(true);
        onLanded();
      }
    };
    if (still) {
      a.setValue(to);
      return done();
    }
    Animated.timing(a, { toValue: to, duration: 640, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }).start(done);
  };
  useEffect(() => {
    if (felt != null && !landed.current) turnTo(1);
  }, [felt]); // eslint-disable-line react-hooks/exhaustive-deps
  const front = a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const back = a.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] });
  /* the faces trade places at the edge, for Android, which does not hide a card's back side */
  const frontOn = a.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] });
  const backOn = a.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [0, 0, 1, 1] });
  /* it lifts toward the person as it turns, and the crooked thought lands straight */
  const lift = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 1] });
  const tilt = a.interpolate({ inputRange: [0, 1], outputRange: ['-2.5deg', '0deg'] });
  const long = see.length > 90;
  return (
    <>
      <Pressable
        accessibilityRole={felt != null ? 'button' : undefined}
        accessibilityLabel={up ? 'Another way to see it: ' + see : 'You may think: ' + think}
        accessibilityHint={felt != null ? (up ? 'Turns it back to the old thought' : 'Turns it over again') : undefined}
        disabled={felt == null}
        onPress={() => {
          buzz('tap');
          turnTo(up ? 0 : 1);
        }}
        style={s.flipRoom}>
        <Animated.View style={{ transform: [{ scale: lift }, { rotate: tilt }] }}>
          <Animated.View style={[s.flip, s.flipFront, { opacity: frontOn, transform: [{ perspective: 1000 }, { rotateY: front }] }]}>
            <Text style={s.flipMark}>“</Text>
            <Text style={s.flipT}>{think}</Text>
          </Animated.View>
          <Animated.View style={[s.flip, s.flipBack, { opacity: backOn, transform: [{ perspective: 1000 }, { rotateY: back }] }]}>
            <Text style={[s.flipT, s.flipSee, long && s.flipLong]}>{see}</Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
      <Bubble text={felt != null && said ? FLIP_FEEL[felt].say : FLIP_ASK} style={{ marginTop: 8 }} />
      <FlameSlot size={want * 0.85} min={84} />
      {felt == null ? (
        <Dock>
          <View style={s.feel}>
            {FLIP_FEEL.map((f, j) => (
              <Answer key={j} sel={false} right={false} onPress={() => onFeel(j)} style={s.feelOpt}>
                <AnswerText right={false} center>
                  {f.o}
                </AnswerText>
              </Answer>
            ))}
          </View>
        </Dock>
      ) : null}
    </>
  );
}
/** the solid violet card: a giant number that starts a sentence, one line of what it means, and where it comes from. No sky, no flame. */
function NumberCard({ n, h, lead, p, st, fact, onSrc }: { n: string; h: string; lead?: string; p?: string; st: Settings; fact?: string; onSrc: () => void }) {
  const c = useTheme();
  const shown = useCount(n);
  const size = n.length <= 3 ? 128 : n.length <= 5 ? 96 : 72;
  return (
    <View style={s.number}>
      <Text
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        adjustsFontSizeToFit
        accessibilityLabel={n}
        style={{ fontFamily: font.displayBold, fontSize: size, lineHeight: size * 1.08, color: c.sun, fontVariant: ['tabular-nums'] }}>
        {shown}
      </Text>
      <T style={[s.h, h.length > 56 && s.hsm]} accessibilityRole="header">
        {h}
      </T>
      {lead || p ? (
        <T style={s.p} tone="muted">
          {lead ? lead + (p ? ' ' : '') : ''}
          {p ? <Rich text={p} st={st} style={s.p} /> : null}
        </T>
      ) : null}
      {fact ? <Fact text={fact} onPress={onSrc} /> : null}
    </View>
  );
}
/** where the science comes from: one small line under the words, a bonus, never in the way. A tap opens the detail. */
function Fact({ text, onPress }: { text: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={'Source: ' + text + '. Behind this.'}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [s.fact, pressed && { opacity: 0.7 }]}>
      <Text style={[s.factT, { color: c.ink }]}>{text}</Text>
      <Icon name="next" size={13} color={c.ink} />
    </Pressable>
  );
}

/* ---------- the sheet that opens over the lesson ---------- */
/* the original words of a card, or where the science comes from. It takes the app's own colors, not the card's. */
function SheetOver({ sheet, L, st, onClose, onSrc }: { sheet: Sheet; L: Lesson; st: Settings; onClose: () => void; onSrc: (i?: number) => void }) {
  return (
    <PaletteOverride.Provider value={null}>
      <SheetBody sheet={sheet} L={L} st={st} onClose={onClose} onSrc={onSrc} />
    </PaletteOverride.Provider>
  );
}
function SheetBody({ sheet, L, st, onClose, onSrc }: { sheet: Sheet; L: Lesson; st: Settings; onClose: () => void; onSrc: (i?: number) => void }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const t = toneOf(c, lessonUnit(L).tone);
  let title = 'Behind this lesson';
  let body: ReactNode;
  if (sheet.t === 'src') {
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
  } else if (sheet.t === 'key') {
    title = L.ask || 'The one thing to keep';
    body = <T style={s.p}>{L.key}</T>;
  } else {
    const card = L.cards[sheet.i];
    const rv = card.k === 'guess' ? card.g!.rv : null;
    title = rv?.h || card.h;
    body = (
      <>
        {rv?.b ? <Rich text={rv.b} st={st} style={s.p} /> : null}
        {card.k === 'guess' && card.g!.cap ? <T tone="muted">{card.g!.cap}</T> : null}
        <Blocks bs={card.b} L={L} t={t} st={st} />
        {card.so ? (
          <View style={s.so}>
            <T v="label">What this means for you</T>
            <Rich text={card.so} st={st} style={s.p} />
          </View>
        ) : null}
        {card.k === 'choose' && sheet.pk != null ? (
          <>
            <T v="label">{card.c![sheet.pk][0]}</T>
            <T style={s.p}>{card.c![sheet.pk][1]}</T>
          </>
        ) : null}
        {card.fact ? <Fact text={card.fact.s} onPress={() => onSrc(sheet.i)} /> : null}
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
        <View style={s.sheetTop}>
          <T v="h2" accessibilityRole="header" style={{ flex: 1 }}>
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
        <Next label="Close" noIcon onPress={onClose} />
      </View>
    </View>
  );
}

/* the words sit on the sky itself, with no card around them: a box here is something the person is meant to see as one thing (an answer, what
   the flame says, a line to do, their plan). */
const s = StyleSheet.create({
  sheetTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 44 },
  x: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  guessMid: { alignItems: 'center', justifyContent: 'center', minHeight: 110 },
  art: { alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  eye2: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  h: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  hsm: { fontSize: 22, lineHeight: 28 },
  p: { fontSize: 17, lineHeight: 24 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'center', paddingHorizontal: 8 },
  linkT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, textDecorationLine: 'underline' },
  footCol: { flex: 1, gap: 4 },
  quiets: { width: '100%', flexDirection: 'row' },
  len: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  line: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20 },
  number: { gap: 12, paddingTop: SHORT ? 8 : 40 },
  quote: { paddingVertical: 4 },
  flipRoom: { paddingTop: SHORT ? 8 : 24, paddingHorizontal: 8 },
  flip: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
    minHeight: SHORT ? 200 : 236,
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
  },
  flipFront: { backgroundColor: PAPER },
  flipBack: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: SUN_CARD },
  flipMark: { fontFamily: font.display, fontSize: 64, lineHeight: 72, marginTop: -8, marginBottom: -24, color: '#E8665A' },
  flipT: { fontFamily: font.display, fontSize: 28, lineHeight: 34, color: PAPER_INK },
  flipSee: { color: SUN_INK },
  flipLong: { fontSize: 22, lineHeight: 28 },
  feel: { flexDirection: 'row', gap: 8 },
  feelOpt: { flex: 1, paddingLeft: 8, paddingRight: 8 },
  mine: { fontFamily: font.display, fontSize: 20, lineHeight: 27 },
  plan: { gap: 8, padding: 16, borderRadius: 20 },
  so: { gap: 4, marginTop: 8 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28 },
  factT: { flexShrink: 1, fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
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
