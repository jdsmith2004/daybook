/* How Daybook works: the setup, and the walk-through that can be opened again any time. It is built like a lesson, from the lesson's
   own parts (components/lesson-parts.tsx; the owner, November 2, 2026): one sky that goes from night to day across the three acts, one
   flame that glides from page to page and coaches the person in its bubble (core obSay, obReply), answers on paper low on the screen,
   the hours on the violet card and the kind words on the sun. The line at the top has a dash for each act. One question per page, every
   question can be skipped; the flame answers a one-tap question and Next goes on, and the quick checks move on by themselves. A new
   person's plan is built from their answers. Opened again, nothing changes until the last page, where the person ticks which changes
   to keep. Ported from the legacy SCENES.onb. */
import {
  accountLater,
  BE_LEN,
  fmtClock,
  fmtDate,
  FREE_HI,
  FREE_LO,
  FREE_Q,
  freeAtSetup,
  freeCounts,
  freeKeep,
  freeLater,
  freeProof,
  isTime,
  keyOfDate,
  LEARN_FREE,
  gameCompute,
  levelOf,
  OB_BE,
  OB_PAGES,
  OB_BPS,
  OB_BPS_C,
  OB_GUESS,
  OB_SECS,
  NUDGE_WORDS,
  OB_THEN,
  obBecoming,
  obCap,
  obChanges,
  obDate,
  obDay1,
  obGoal,
  obGoalInfo,
  obGoals,
  obHeard,
  obLast,
  obPages,
  obReply,
  obSay,
  obPrefill,
  obReasonList,
  obReasonOpts,
  obReveal,
  obSave,
  obSosLine,
  obWave,
  obSrc,
  obSug,
  obThenOpts,
  obThenPick,
  obTop,
  obTries,
  readBackup,
  REASON_DEFAULT,
  REASON_LEN,
  REASON_MAX,
  restoreBackup,
  SETUP_PTS,
  toRecords,
  type ObOpt,
  type RecordId,
  type Settings,
  type SetupAnswers,
  type Habit,
  LIKE_WORDS,
  likeAnswer,
  likeAskDue,
  careLastAt,
  type LikeAnswer,
  HABIT_NOUN,
  habitSay,
  obHabit,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Linking, Platform, Pressable, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/text';
import Svg, { Circle, Path } from 'react-native-svg';

import { Appear } from '@/components/appear';
import { Confetti } from '@/components/celebrate';
import { Field } from '@/components/choices';
import { FreeProof } from '@/components/free-proof';
import { CountUp } from '@/components/count-up';
import { FitArt, SHORT, useFitRoom } from '@/components/fit';
import { LessonArt } from '@/components/lesson-art';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { Answer, AnswerText, BESIDE, Prog, Question, Shell } from '@/components/lesson-parts';
import { Ghost, Next, Rich, Route } from '@/components/lx';
import { Dock, Middle } from '@/components/scene';
import { ClockWheels } from '@/components/when';
import { PicCurve, PicDay, PicDial, PicSlip, PicTries, PicWeek, whenIcon } from '@/components/setup-art';
import { useClock } from '@/components/shapes';
import { Slider, SliderValue } from '@/components/slider';
import { TIP_ON } from '@/components/support';
import { ToolShape } from '@/components/tool-grid';
import { BEAT_BREATH, ToolTimer, type BeatOf } from '@/components/tools/timer';
import { Icon, T } from '@/components/ui';
import { Packed } from '@/components/packed';
import { pickBackupText } from '@/lib/backup';
import { BACKUP_FILES } from '@/lib/backup-files';
import { buzz } from '@/lib/feel';
import { askStoreReview } from '@/lib/review';
import { close } from '@/lib/nav';
import { setReminderPrefs, useReminderPrefs } from '@/lib/prefs';
import { allowReminders, remindersOffered } from '@/lib/reminders';
import { track } from '@/lib/events';
import { countSetup } from '@/lib/pulse';
import { setupKeep, setupStored, storeSetup, type SetupFlow } from '@/lib/setup-keep';
import { useSos } from '@/lib/sos';
import { SAVE_FAILED, useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { lessonLook, PAPER_INK, type LookKind } from '@/lib/lesson-look';
import { NATIVE, SPRING, useReducedMotion } from '@/lib/motion';
import { font, MAX_WIDTH, nightInk, skies, toneOf, useTheme, type Tone } from '@/lib/theme';
import { restoredWords, WORDS } from '@/lib/words';

type Flow = SetupFlow;

export default function Setup() {
  const base = useTheme();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
  /* the flame leaps when it answers a pick, and when the plan is committed */
  const [pulse, setPulse] = useState(0);
  const win = useWindowDimensions();
  const { snap, tk, replace, say, current, apply } = useStore();
  const sync = useSync();
  const st = snap.settings;
  const [f, setF] = useState<Flow>(() => {
    const redo = !!st;
    const k = setupKeep.flow;
    setupKeep.shut = false;
    if (k && k.redo === redo && !k.saved) return { ...k };
    return {
      redo,
      i: 0,
      a: obPrefill(st),
      hg: null,
      keep: null,
      saved: false,
      changed: 0,
    };
  });
  /* opened straight onto this page, not from inside the app: on the web, a Home Screen icon saved while the setup was
     showing opens it every time. Someone whose setup is done goes to Today instead. */
  const [cold] = useState(() => !router.canGoBack());
  useEffect(() => {
    if (cold && st) router.replace('/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rem = useReminderPrefs();
  const [remAt, setRemAt] = useState(rem.checkinAt);
  /* the north star's starting point (core north.ts): asked when there is no answer yet, never in the hours after a slip or an
     SOS. Decided once, so the page keeps its place in the list after it is answered. */
  const sosNow = useSos();
  const [freeAsk] = useState(() => freeAtSetup(snap.days, st, tk, { now: Date.now(), sos: careLastAt(sosNow.mem) }));
  /* the reminder page shows on a phone, and on a walk-through only while the check-in reminder is off */
  /* the account page shows to a new person while this build has accounts and they are not signed in; once they are, it
     drops out of the list and the setup moves on by itself */
  const env = {
    notify: remindersOffered && !(f.redo && rem.checkin),
    account: !f.redo && sync.status.k === 'out',
    free: freeAsk,
  };
  const [breathed, setBreathed] = useState(false);
  /* the hold finished: the flame in the plan lights, and the setup moves on a moment later */
  const [lit, setLit] = useState(false);
  const litTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopLit = () => {
    if (litTimer.current) clearTimeout(litTimer.current);
    litTimer.current = null;
  };
  useEffect(() => stopLit, []);
  const until = useRef(0);
  /* the phone's permission question is open: Remind me and Not now wait for it, so one answer moves on once */
  const asking = useRef(false);
  const P = obPages(f.a, env);
  const i = Math.max(0, Math.min(P.length - 1, f.i));
  const pg = P[i];
  const a = f.a;
  const sec = OB_SECS.find((x) => x[0] === pg.s) || OB_SECS[0];
  /* one sky for the whole setup, as in a lesson: night at the first page, day (a warm dawn at night) at the plan. The number of hours is the
     violet card; the kind word after the five statements, the slip and the finish are the sun. */
  const kind: LookKind = pg.k === 'hours' ? 'violet' : pg.k === 'heard' || pg.k === 'slip' || pg.k === 'done' ? 'sun' : 'sky';
  const p = P.length > 1 ? i / (P.length - 1) : 1;
  const look = lessonLook(kind, p, base.scheme);
  const c = look.c;
  const t = toneOf(c, sec[2]);
  /* the flame grows a little as the setup goes on */
  const want = (SHORT ? 200 : 240) + (SHORT ? 40 : 70) * p;
  const habit = obHabit(a, st);
  const voice = obSay(pg.id, f.redo, habit);
  /* the flame as it is now: a spark for a new person, the grown form on a walk-through */
  const flameLevel = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [st, snap.days, snap.reviews, tk]);

  /* a log arrived some other way (a restored backup) while a new person was in the setup: the setup steps aside */
  useEffect(() => {
    if (!f.redo && !f.saved && st) {
      setupKeep.flow = null;
      storeSetup(null);
      close();
    }
  }, [f.redo, f.saved, st]);
  /* a new person's place is kept on the device as they go, and let go once the setup is saved. Opened right at launch,
     the page may come up before the kept place is read: it picks up there if nothing was answered yet. */
  useEffect(() => {
    if (f.redo) return;
    let live = true;
    setupStored.then((v) => {
      if (live && v) setF((x) => (x.i === 0 && !Object.keys(x.a).length && !x.saved ? { ...v } : x));
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* the place is kept as it changes, not only on the X: a back gesture or the browser's Back leaves without it, and setup must pick up there */
  useEffect(() => {
    setupKeep.flow = !f.saved && pg.k !== 'done' ? { ...f, i } : null;
    if (!f.redo) storeSetup(f.saved || pg.k === 'done' ? null : f);
  }, [f, i, pg.k]);
  /* the anonymous counts: how far a new person got (core pulse.ts), a basic count sent without asking */
  useEffect(() => {
    if (f.redo) return;
    countSetup(OB_PAGES.indexOf(pg), pg.k === 'done');
    track(pg.k === 'done' ? 'setup_done' : 'setup_page', { page: pg.id });
  }, [f.redo, pg]);

  const busy = () => Date.now() < until.current;
  const set = (patch: Partial<Flow> | ((x: Flow) => Partial<Flow>)) =>
    setF((x) => ({
      ...x,
      ...(typeof patch === 'function' ? patch(x) : patch),
    }));
  const setA = (patch: SetupAnswers) => set((x) => ({ a: { ...x.a, ...patch } }));
  const go = (d: number) => {
    if (litTimer.current) {
      stopLit();
      setLit(false);
    }
    setF((x) => {
      const PP = obPages(x.a, env);
      const cur = PP[x.i];
      const to = Math.max(0, Math.min(PP.length - 1, x.i + d));
      if (to === x.i) return x;
      if (cur.k === 'review' && d > 0 && !x.saved) return x;
      until.current = Date.now() + 260;
      return { ...x, i: to };
    });
  };
  /* a one-tap answer moves on by itself, unless the person already moved */
  const later = () => {
    const at = i;
    until.current = Date.now() + 420;
    setTimeout(() => {
      setF((x) => {
        if (x.i !== at) return x;
        until.current = 0;
        return { ...x, i: Math.min(obPages(x.a, env).length - 1, x.i + 1) };
      });
    }, 380);
  };
  const exit = () => {
    setupKeep.flow = !f.saved && pg.k !== 'done' ? { ...f, i } : null;
    if (!st) setupKeep.shut = true;
    close();
  };
  const save = async (quiet?: boolean) => {
    if (f.saved) return;
    const r = obSave(a, st, f.keep ?? obChanges(a, st, tk).map((x) => x.k), tk);
    setupKeep.flow = null;
    if (!quiet) buzz('lit');
    until.current = Date.now() + 700;
    setF((x) => ({
      ...x,
      saved: true,
      changed: r.changed,
      /* the page after the review: when to check in (on a phone), the account ask, then the end */
      i: Math.min(obPages(x.a, env).length - 1, obPages(x.a, env).findIndex((p) => p.k === 'review') + 1),
    }));
    await replace({ ...snap, settings: r.st }, ['settings']);
  };
  /* the hold is done: a small buzz, the flame lights, and about half a second later the plan is saved and the next page opens */
  const commit = () => {
    if (litTimer.current || f.saved) return;
    buzz('lit');
    setLit(true);
    setPulse((x) => x + 1);
    litTimer.current = setTimeout(() => {
      litTimer.current = null;
      save(true);
    }, 500);
  };
  const restore = async () => {
    try {
      const text = await pickBackupText();
      if (text == null) return;
      let b;
      try {
        b = readBackup(text);
      } catch {
        say(WORDS.notBackup);
        return;
      }
      const { snap: next, restored } = restoreBackup(current().snap, b);
      await replace(
        next,
        toRecords(next).map((r) => r.id as RecordId),
      );
      say(restoredWords(restored));
    } catch {
      say(SAVE_FAILED);
    }
  };

  const ans = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '');
  const noBack = i === 0 || pg.k === 'done' || pg.k === 'remind' || pg.k === 'star' || pg.k === 'account';
  /* Skip is quiet, so an answer is the easy way on; Next is the main button */
  const nextBtn = (label: string, skip?: boolean) =>
    skip ? (
      <View key="s" style={s.footOne}>
        <Ghost
          label={label}
          onPress={() => {
            if (busy()) return;
            if (!f.redo) track('setup_skip', { page: pg.id });
            go(1);
          }}
        />
      </View>
    ) : (
      <View key="n" style={s.footOne}>
        <Next label={label} onPress={() => !busy() && go(1)} off={false} />
      </View>
    );
  const pick = (key: string, v: string, auto: boolean) => {
    if (busy()) return;
    setA({ [key]: v });
    buzz('tap');
    if (!f.redo) track('setup_pick', { page: pg.id });
    if (auto) later();
  };
  /* a one-tap question the flame answers: the pick stays, the flame leaps and says its piece, and Next goes on */
  const answer = (key: string, v: string) => {
    if (busy()) return;
    if (a[key] !== v) setPulse((x) => x + 1);
    setA({ [key]: v });
    if (!f.redo) track('setup_pick', { page: pg.id });
    buzz('tap');
  };

  let body: ReactNode = null;
  let foot: ReactNode = null;
  const lastLine = (key: string, list: ObOpt[]) => {
    const l = obLast(st, f.redo, key, list);
    return l ? (
      <T v="small" tone="muted" style={s.c}>
        {l}
      </T>
    ) : null;
  };
  const W = Math.min(win.width, MAX_WIDTH) - 32;

  switch (pg.k) {
    case 'hello': {
      const prev = st && st.onb;
      body = f.redo ? (
        <>
          <Head h="Walk through it again." />
          <Talk text={voice} want={want} />
          {prev && prev.at ? (
            <T v="small" tone="muted" style={s.c}>
              Last time:{' '}
              {fmtDate(keyOfDate(new Date(prev.at)), {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              .
            </T>
          ) : null}
        </>
      ) : (
        <>
          <Head
            h={habitSay('Get free of porn, one honest day at a time.', habit)}
            sub="A plan built from your answers, a short lesson a day, and help when urges hit."
          />
          {/* the first thing a new person sees: the flame, big and alive, saying hello. It is the same one they will watch grow. */}
          <Talk text={voice} want={want} />
          {/* someone opening Daybook in the middle of an urge gets help before any question */}
          <SosRow />
          <View style={s.links}>
            {sync.status.k !== 'off' && sync.status.k !== 'on' ? (
              <TextLink
                label={sync.status.k === 'busy' ? sync.status.what : 'I already have an account: sign in'}
                onPress={() => sync.signInNow({ why: 'in' })}
              />
            ) : null}
            {BACKUP_FILES ? <TextLink label="I have a backup file" onPress={restore} /> : null}
          </View>
        </>
      );
      foot = nextBtn(f.redo ? 'Start' : 'Get started');
      break;
    }
    case 'how': {
      body = (
        <>
          <Head h="Three parts, about 8 minutes." sub="Your answers stay private, never tied to who you are. You can skip any question." />
          <Middle>
            <View style={s.acts}>
              {OB_SECS.map((x) => {
                const at = toneOf(c, x[2]);
                const time = ACT_TIME[x[0]] || '';
                return (
                  <View key={x[0]} style={s.act} accessible accessibilityLabel={`${x[1]} · ${time}`}>
                    <ShapePic id={ACT_SHAPE[x[0]] || 'pause'} ic={x[3]} t={at} size={64} />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.actT, { color: c.ink }]}>{x[1]}</Text>
                      <T tone="muted">{time}</T>
                    </View>
                  </View>
                );
              })}
            </View>
          </Middle>
          <Say text={voice} />
        </>
      );
      foot = nextBtn('Next');
      break;
    }
    case 'tiles':
    case 'years': {
      /* a question the flame answers, as in a lesson: the question at the top, the flame and what it says in the middle, the answers low */
      const key = pg.key!;
      const list = pg.list!;
      const at = list.findIndex((x) => x[0] === a[key]);
      body = (
        <>
          <Question
            h={pg.h!}
            list={list.map((x) => x[1])}
            best={null}
            retry={false}
            pk={at >= 0 ? at : null}
            tried={[]}
            comments={list.map((x) => obReply(key, x[0]) || '')}
            first={voice || pg.sub}
            want={want}
            onPick={(j) => answer(key, list[j][0])}
          />
          {lastLine(key, list)}
        </>
      );
      foot = nextBtn(ans(a[key]) ? 'Next' : 'Skip', !ans(a[key]));
      break;
    }
    case 'slide': {
      const key = pg.key!;
      const list = pg.list!;
      const idx = list.findIndex((x) => x[0] === a[key]);
      body = (
        <>
          <Head h={pg.h!} sub={voice ? undefined : pg.sub} />
          <Middle>
            <SlideShow
              grow={key === 'freq' ? 1.12 : 1.3}
              idx={idx}
              pic={key === 'freq' ? <PicWeek i={idx} /> : <PicDial i={idx} />}
              words={idx >= 0 ? obCap(String(list[idx][3])) : null}
            />
          </Middle>
          <Say text={voice} />
          <Slider
            label={pg.h!}
            value={idx >= 0 ? idx : null}
            min={0}
            max={list.length - 1}
            lo={pg.lo!}
            hi={pg.hi!}
            readout={false}
            endsShowValue={false}
            show={(v) => obCap(String(list[v][3]))}
            onChange={(j) => pick(key, list[j][0], false)}
          />
          {lastLine(key, list)}
        </>
      );
      foot = nextBtn(ans(a[key]) ? 'Next' : 'Skip', !ans(a[key]));
      break;
    }
    case 'bps': {
      const v = a['b' + pg.n] as string | undefined;
      body = (
        <>
          <Head h="In the last 6 months, how often is this true for you?" small />
          {/* the statement, big, in the middle; the flame listens beside it, and the three answers sit low, as one row. A pick moves on by
              itself: this is a quick check, and the flame does not comment on it. */}
          <Middle>
            <Text style={[s.quoteT, { color: c.ink }]}>{OB_BPS[pg.n!]}</Text>
          </Middle>
          <Say text={voice} />
          <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
            {OB_BPS_C.map(([id, label], j) => {
              const on = v === id;
              return (
                <Answer key={id} sel={on} right={on} label={label} onPress={() => pick('b' + pg.n, id, true)} style={s.freq}>
                  <FreqDot n={j} col={on ? '#FFFFFF' : PAPER_INK} />
                  <AnswerText right={on} center>
                    {label}
                  </AnswerText>
                </Answer>
              );
            })}
          </View>
        </>
      );
      foot = nextBtn(v != null ? 'Next' : 'Skip', v == null);
      break;
    }
    case 'heard': {
      const h = obHeard(a);
      /* the sun card: the flame itself says the kind word, big */
      body = (
        <>
          <Head h={h.h} />
          <Talk text={plain(h.line)} want={want} />
          {h.line2 ? <Rich text={h.line2} st={st} style={s.p} /> : null}
          {h.more ? <More more={h.more} /> : null}
        </>
      );
      foot = nextBtn('Keep going');
      break;
    }
    case 'multi': {
      const key = pg.key!;
      const arr = (a[key] as string[]) || [];
      const own = pg.own ? String(a[pg.own] || '').trim() : '';
      body = (
        <>
          <Head h={pg.h!} sub={voice ? undefined : pg.sub} />
          {/* the tiles are the thing, so they sit low, with the flame just above them (an open middle only when it fits) */}
          {pg.list!.length > 6 ? null : <Middle>{null}</Middle>}
          <Say text={voice} />
          <IconTiles
            list={pg.list!}
            cols={pg.cols || 2}
            cur={arr}
            onPick={(v) => {
              const k = arr.indexOf(v);
              setA({
                [key]: k >= 0 ? arr.filter((x) => x !== v) : arr.concat(v),
              });
              buzz('tap');
            }}
          />
          {pg.own ? (
            <Field
              label="Write my own"
              maxLength={60}
              defaultValue={String(a[pg.own] || '')}
              placeholder="Something else it cost me"
              onChangeText={(v) => setA({ [pg.own!]: v })}
            />
          ) : null}
        </>
      );
      foot = nextBtn(arr.length || own ? 'Next' : 'Skip', !(arr.length || own));
      break;
    }
    case 'guess': {
      body = (
        <>
          <Head h={habitSay('How many hours a year do you think you spend on porn?', habit)} />
          <Middle>
            <Text style={[s.huge, { color: c.ink }]}>{f.hg && f.hg !== 'skip' ? (f.hg === 800 ? '800+' : f.hg) : '?'}</Text>
            <T tone="muted">hours a year</T>
          </Middle>
          <Say text={voice} />
          <View style={s.grid3}>
            {OB_GUESS.map((n) => (
              <Opt
                key={n}
                on={f.hg === n}
                style={s.third}
                onPress={() => {
                  if (busy()) return;
                  set({ hg: n });
                  buzz('tap');
                  later();
                }}>
                {(on) => (
                  <AnswerText right={on} center>
                    {n === 800 ? '800+' : n}
                  </AnswerText>
                )}
              </Opt>
            ))}
          </View>
        </>
      );
      foot = (
        <View key="n" style={s.footOne}>
          <Next
            label="Just show me"
            onPress={() => {
              if (busy()) return;
              set({ hg: 'skip' });
              until.current = 0;
              go(1);
            }}
          />
        </View>
      );
      break;
    }
    case 'hours': {
      const R = obReveal(a, f.hg);
      body = (
        <>
          {/* the payoff of the first act: the number, big, with what it means under it and the comparisons low */}
          <Middle>
            <Hours to={R.yr} color={c.sun} />
            <T tone="muted">hours a year at your pace</T>
            <Appear delay={HOURS_VERDICT}>
              <T v="title" style={[s.c, SHORT ? s.titleShort : s.title26]} accessibilityRole="header">
                {R.h}
              </T>
            </Appear>
          </Middle>
          <View style={s.rows}>
            {R.guess != null ? (
              <Appear delay={HOURS_BARS - 100}>
                <Compare g={R.guess} yr={R.yr} t={t} />
              </Appear>
            ) : null}
            {R.rows.map((r, j) => (
              <Appear key={r[0]} delay={HOURS_ROWS + j * 120}>
                <View style={s.eq}>
                  <Icon name={r[0]} size={20} color={c.sun} />
                  <Rich text={r[1]} st={st} style={{ flex: 1 }} />
                </View>
              </Appear>
            ))}
            <Appear delay={HOURS_ROWS + R.rows.length * 120}>
              <Soft icon="leaf" text={R.soft} />
            </Appear>
            <Appear delay={HOURS_ROWS + R.rows.length * 120}>
              <More more={R.more} />
            </Appear>
          </View>
        </>
      );
      foot = nextBtn('Next');
      break;
    }
    case 'breathe':
      body = <Breathe done={breathed} onDone={() => setBreathed(true)} />;
      foot = breathed ? nextBtn('Next') : nextBtn('Skip', true);
      break;
    case 'tour': {
      const x = obSosLine(a);
      body = (
        <Show st={st} art={<PicDay a={a} />} h="A day in Daybook" line="About five minutes a day, one stop at a time.">
          <Rich
            text={
              (a.when || []).length > 0
                ? `When an urge hits, tap SOS: slow breathing starts on its own, then one thing to try, like **${x.tool.name}**.`
                : 'When an urge hits, tap SOS: slow breathing starts on its own, then one thing to try.'
            }
            st={st}
            style={s.p}
          />
        </Show>
      );
      foot = nextBtn('Next');
      break;
    }
    case 'tries': {
      const x = obTries(a);
      body = <Show st={st} art={<PicTries width={W} />} h={x.h} line={x.line} more={x.more} />;
      foot = nextBtn('Next');
      break;
    }
    case 'so': {
      /* three wheels like the phone's own clock, starting on the usual 11 PM; Next keeps what they show, Skip keeps nothing */
      const so = isTime(a.so) ? (a.so as string) : SO_USUAL;
      body = (
        <>
          <Head h="What time should your screens go off at night?" />
          <Middle>{null}</Middle>
          <Say text={voice} />
          <ClockWheels {...hm(so)} step={5} onChange={(h, m) => setA({ so: clockOf(h, m) })} />
        </>
      );
      foot = (
        <View key="f" style={[s.footOne, { gap: 6 }]}>
          <Next
            key="n"
            label="Next"
            onPress={() => {
              if (busy()) return;
              setA({ so });
              go(1);
            }}
          />
          <Ghost
            label="Skip this one"
            onPress={() => {
              if (busy()) return;
              setA({ so: undefined });
              go(1);
            }}
          />
        </View>
      );
      break;
    }
    case 'goal': {
      const sug = obSug(a, st, tk);
      const goals = obGoals(st, tk);
      const v = goals.some((g) => g.id === a.goal) ? a.goal : sug;
      const gi = obGoalInfo(a, st, tk);
      body = (
        <>
          <Head h="Which starting point fits you best?" />
          <Middle>{null}</Middle>
          <Say text={voice} />
          <View style={{ gap: 8 }}>
            {goals.map((g) => (
              <Opt key={g.id} on={v === g.id} onPress={() => pick('goal', g.id, false)}>
                {(on) => (
                  <View style={s.optRow}>
                    <Icon name={g.ic} size={24} color={on ? '#FFFFFF' : PAPER_INK} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <AnswerText right={on}>{g.t}</AnswerText>
                      <Text style={[s.optSub, { color: on ? '#FFFFFF' : PAPER_INK }]}>
                        {g.s}
                        {g.id === sug ? <Text style={{ fontFamily: font.bodyBold }}> Suggested for you.</Text> : null}
                      </Text>
                    </View>
                  </View>
                )}
              </Opt>
            ))}
          </View>
          <Soft icon="calendar" text={gi.soft} />
          <More more={gi.more} />
        </>
      );
      foot = nextBtn('Next');
      break;
    }
    case 'reasons': {
      const n = obReasonList(a).length;
      const rs = a.rs || [];
      body = (
        <>
          <Head h="What do you want your life to look like instead?" />
          <Middle>{null}</Middle>
          <Say text={voice} />
          <Packed>
            {obReasonOpts(a, st, f.redo).map((x) => {
              const on = rs.indexOf(x) >= 0;
              return (
                <Answer
                  key={x}
                  sel={on}
                  right={on}
                  onPress={() => {
                    if (!on && rs.length >= REASON_MAX) return;
                    setA({ rs: on ? rs.filter((y) => y !== x) : rs.concat(x) });
                    buzz('tap');
                  }}
                  style={s.pill}>
                  <AnswerText right={on}>{x}</AnswerText>
                </Answer>
              );
            })}
          </Packed>
          <Field label="Write my own" maxLength={REASON_LEN} placeholder="I want to…" defaultValue={a.own || ''} onChangeText={(v) => setA({ own: v })} />
        </>
      );
      foot = nextBtn(n ? 'Next' : 'Skip', !n);
      break;
    }
    case 'then': {
      const tp = obTop(a);
      const T0 = OB_THEN[tp];
      const cur = obThenPick(a, st, f.redo, tp);
      body = (
        <>
          <Head h={`When ${T0[2]}, what will you do instead?`} />
          <Middle>{null}</Middle>
          <Say text={voice} />
          <View style={{ gap: 8 }}>
            {obThenOpts(a, st, f.redo, tp).map((x) => (
              <Opt
                key={x}
                on={cur === x}
                onPress={() => {
                  if (busy()) return;
                  setA({ then: x, thenT: tp, thenOwn: '' });
                  buzz('tap');
                  later();
                }}>
                {(on) => <AnswerText right={on}>{x}</AnswerText>}
              </Opt>
            ))}
          </View>
          <Field
            key={'own' + (a.thenOwn ? 1 : 0)}
            label="Write my own"
            maxLength={140}
            placeholder="I will…"
            defaultValue={a.thenOwn || ''}
            onChangeText={(v) => {
              const prevOwn = String(a.thenOwn || '').trim();
              const x = v.trim();
              if (x) setA({ thenOwn: v, then: x.slice(0, 140), thenT: tp });
              else
                setA({
                  thenOwn: v,
                  ...(a.then === prevOwn ? { then: null } : {}),
                });
            }}
          />
          <More
            more={{
              label: 'Why plan ahead?',
              paras: ['A plan made ahead is easier to follow than a decision made in the moment. You can add plans for your other hard moments in My plan.'],
              keys: ['gollwitzer'],
            }}
          />
        </>
      );
      foot = nextBtn(cur ? 'Next' : 'Skip', !cur);
      break;
    }
    case 'becoming': {
      const cur = obBecoming(a);
      const own = OB_BE.indexOf(cur) < 0 ? cur : '';
      /* the text box near the top; the starter sentences low */
      body = (
        <>
          <Head h="Who are you becoming?" />
          <Field
            key={'be' + (own ? 1 : 0)}
            label="Write my own"
            maxLength={BE_LEN}
            placeholder="I am someone who…"
            defaultValue={own}
            onChangeText={(v) => setA({ be: v })}
          />
          <Middle>{null}</Middle>
          <Say text={voice} />
          <View style={{ gap: 8 }}>
            {OB_BE.map((x) => (
              <Opt
                key={x}
                on={cur === x}
                onPress={() => {
                  if (busy()) return;
                  setA({ be: x });
                  buzz('tap');
                  later();
                }}>
                {(on) => <AnswerText right={on}>{x}</AnswerText>}
              </Opt>
            ))}
          </View>
          <T v="small" tone="muted" style={s.c}>
            Say who you are, not what you avoid. You can change it any time in My plan.
          </T>
        </>
      );
      foot = nextBtn(cur ? 'Next' : 'Skip', !cur);
      break;
    }
    case 'review': {
      const ch = obChanges(a, st, tk);
      if (!f.redo) {
        const g = obGoal(a, st, tk);
        const tp = obTop(a);
        const T0 = OB_THEN[tp];
        const th = a.thenT === tp ? a.then : null;
        const rs = obReasonList(a);
        const planRows = 4 + (th ? 1 : 0) + (obBecoming(a) ? 1 : 0);
        body = (
          <>
            <Head h="Here is your plan." />
            {SHORT ? null : <Bubble text={voice || ''} />}
            <Middle>
              {/* the flame first, big and alive, with Day 1 beside it; then the plan builds itself, row by row, top to bottom. When the
                  hold is done the flame leaps. On a short phone the flame gives up room before Hold to commit leaves the screen. */}
              <FitArt min={SHORT ? 0.7 : 0.9}>
                <Appear by={12} delay={PLAN_AT} duration={320}>
                  <View style={s.day1}>
                    <FlameSlot size={SHORT ? 150 : 200} min={SHORT ? 96 : 120} style={s.planFlame} />
                    <View style={{ gap: 2, flex: 1 }} accessible accessibilityLabel={lit ? 'Your flame, lit. Day 1.' : undefined}>
                      <T v="label" tone="muted">
                        Day 1
                      </T>
                      <Text style={{ fontFamily: font.display, fontSize: SHORT ? 22 : 28, lineHeight: SHORT ? 28 : 34, color: c.ink }}>
                        {obDate(obDay1(g, null, tk))}
                      </Text>
                    </View>
                  </View>
                </Appear>
              </FitArt>
              <View style={[s.plan, { backgroundColor: c.surface }]}>
                {[
                  <PlanRow key="g" icon="flag" l="Goal" v={g.t} first />,
                  <View key="sp" style={[s.planRow, { borderTopColor: c.line, gap: 10 }]}>
                    <PlanBit
                      icon="moon"
                      l="Screens off"
                      v={isTime(a.so) ? fmtClock(a.so as string) : fmtClock(SO_USUAL) + ' (the usual; change it any time)'}
                    />
                    {String(a.person || '').trim() ? <PlanBit icon="chat" l="Safe person" v={String(a.person).trim()} /> : null}
                  </View>,
                  th ? <PlanRow key="t" icon={whenIcon(tp)} l={'If ' + T0[1]} v={th} /> : null,
                  <PlanRow key="w" icon="heart" l="Why" v={(rs.length ? rs : REASON_DEFAULT).slice(0, 2).join(' · ')} />,
                  obBecoming(a) ? <PlanRow key="b" icon="star" l="Who I am becoming" v={obBecoming(a)} /> : null,
                ]
                  .filter(Boolean)
                  .map((row, j) => (
                    <Appear key={j} by={12} delay={PLAN_AT + (j + 1) * PLAN_STEP} duration={320}>
                      {row}
                    </Appear>
                  ))}
              </View>
            </Middle>
            {SHORT ? null : (
              <Appear delay={PLAN_AT + planRows * PLAN_STEP + 150}>
                <Text style={[s.pledge, { color: c.ink }]}>{PLEDGE}</Text>
              </Appear>
            )}
          </>
        );
        foot = (
          <View key="h" style={s.footOne}>
            <Appear delay={PLAN_AT + planRows * PLAN_STEP + 150}>
              <Hold onDone={commit} pledge={SHORT ? PLEDGE : undefined} />
            </Appear>
          </View>
        );
      } else {
        const keep = f.keep ?? ch.map((x) => x.k);
        body = !ch.length ? (
          <>
            <Head h="Your plan already matches." />
            <T style={[s.p, s.c]}>Nothing in your answers changes your goal, reasons, or plan. Your self-check is saved, so next time you can compare.</T>
            <Talk text={null} want={want} />
          </>
        ) : (
          <>
            <Head h="Which changes do you want to keep?" sub="Ticked items change. Anything you untick stays as it is." />
            <Middle>
              <View style={{ gap: 10, alignSelf: 'stretch' }}>
                {ch.map((x) => {
                  const on = keep.indexOf(x.k) >= 0;
                  return (
                    <Pressable
                      key={x.k}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      onPress={() =>
                        set({
                          keep: on ? keep.filter((k) => k !== x.k) : keep.concat(x.k),
                        })
                      }
                      style={[
                        s.ch,
                        {
                          backgroundColor: c.surface,
                          borderColor: on ? t.ic : 'transparent',
                        },
                      ]}>
                      <View
                        style={[
                          s.bx,
                          {
                            backgroundColor: on ? t.ic : c.surface,
                            borderColor: on ? t.ic : c.line,
                          },
                        ]}>
                        {on ? <Icon name="check" size={16} color={t.ink} /> : null}
                      </View>
                      <View style={{ flex: 1, gap: 3 }}>
                        <T v="label">{x.l}</T>
                        <T v="small" tone="muted">
                          Now: {x.from}
                          {x.sub0 ? ' · ' + x.sub0 : ''}
                        </T>
                        <T v="small" tone="accentText">
                          New: {x.to}
                          {x.sub1 ? ' · ' + x.sub1 : ''}
                        </T>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Middle>
            <Say text="Your self-check answers are saved either way, so next time you can compare." />
          </>
        );
        foot = (
          <View key="s" style={s.footOne}>
            <Next label={ch.length ? 'Save what is ticked' : 'Finish'} noIcon onPress={save} />
          </View>
        );
      }
      break;
    }
    case 'remind': {
      /* when to check in, with the phone's one permission prompt: the question at the top, the time and what the
         notification will look like in the middle, the times low, Remind me at the bottom (core nudges.ts) */
      const yes = async () => {
        if (busy() || asking.current) return;
        asking.current = true;
        until.current = Date.now() + 1500;
        const ok = await allowReminders().catch(() => false);
        asking.current = false;
        until.current = 0;
        if (ok) {
          setReminderPrefs({ ...rem, checkin: true, checkinAt: remAt, review: true });
          buzz('lit');
        } else {
          /* the time is kept, so turning them on later uses it */
          setReminderPrefs({ ...rem, checkinAt: remAt });
          say(WORDS.notifyOff);
        }
        go(1);
      };
      /* not now: nothing is turned on, but the time picked is kept for the ask on Today */
      const notNow = () => {
        if (busy() || asking.current) return;
        setReminderPrefs({ ...rem, checkinAt: remAt });
        go(1);
      };
      body = (
        <>
          <Head h="When should Daybook check in with you?" />
          <Middle>
            <View style={{ alignItems: 'center', gap: 14, alignSelf: 'stretch' }}>
              {/* what they will look like on a locked screen: the morning lesson note and the evening honest tap, plain words
                  that say nothing about what Daybook is for (core NUDGE_WORDS.preview) */}
              {[
                { w: NUDGE_WORDS.preview.am, at: 'Morning' },
                { w: NUDGE_WORDS.preview.pm, at: fmtClock(remAt) },
              ].map(({ w, at }) => (
                <View
                  key={at}
                  style={[s.lock, { backgroundColor: skies.light.night[0] }]}
                  accessible
                  accessibilityLabel={at + ', a reminder will look like this: Daybook. ' + w.t + '. ' + w.b}>
                  <View style={[s.lockIc, { backgroundColor: c.accent }]}>
                    <Icon name="flame" size={16} color={c.accentInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.lockT, { color: nightInk.ink }]}>{w.t}</Text>
                    <Text style={[s.lockB, { color: nightInk.ink }]}>{w.b}</Text>
                  </View>
                  <Text style={[s.lockW, { color: nightInk.muted }]}>{at}</Text>
                </View>
              ))}
            </View>
          </Middle>
          <Say text={voice} />
          <ClockWheels {...hm(remAt)} step={5} onChange={(h, m) => setRemAt(clockOf(h, m))} />
          <T v="small" tone="muted" style={s.c}>
            Skipped on days you have already checked in. Also a heads-up before your hard hours, and one on Sundays for your week. Nothing at night unless you
            pick a time there.
          </T>
        </>
      );
      foot = (
        <View key="f" style={[s.footOne, { gap: 6 }]}>
          <Next key="n" label="Remind me" onPress={yes} off={false} />
          <Ghost label="Not now" onPress={notNow} />
        </View>
      );
      break;
    }
    case 'star': {
      /* the north star's starting point (core north.ts): the question at the top, the person's own proof under it (none yet
         for someone new), the number huge in the open middle, the slider under the thumb, Next at the bottom. Skip waits a week. */
      const v = typeof a.free === 'number' ? a.free : null;
      const proof = st ? freeProof(snap.days, st, snap.reviews, tk) : [];
      body = (
        <>
          <Head h={FREE_Q} />
          <FreeProof lines={proof} color={c.mintText} />
          <Middle>
            <SliderValue big value={v} caption="out of 10" hint="Slide below to answer" />
          </Middle>
          <Say text={voice} />
          <Slider label={FREE_Q} value={v} lo={FREE_LO} hi={FREE_HI} readout={false} onChange={(n) => setA({ free: n })} />
        </>
      );
      foot =
        v != null ? (
          <View key="n" style={s.footOne}>
            <Next
              label="Next"
              off={false}
              onPress={() => {
                if (busy()) return;
                if (st) apply({ st: freeKeep(st, tk, v) });
                track('free', { free: v, ...freeCounts(snap.days, tk) });
                go(1);
              }}
            />
          </View>
        ) : (
          <View key="s" style={s.footOne}>
            <Ghost
              label="Skip"
              onPress={() => {
                if (busy()) return;
                if (st) apply({ st: freeLater(st, tk) });
                if (!f.redo) track('setup_skip', { page: pg.id });
                go(1);
              }}
            />
          </View>
        );
      break;
    }
    case 'account': {
      /* the plan is built: a free account keeps it. The ask is the main button; staying on this phone is a quiet link that
         records that choice and goes on. */
      body = (
        <>
          <Head h="Your plan is ready. Make it yours." />
          {/* the flame has just grown a level from the plan: it says so, big */}
          <Talk text={voice} want={want} />
          <View style={{ gap: 8 }}>
            {[
              'Every lesson open, not just the first ' + LEARN_FREE,
              'Free, and private to you. Nothing is shared or sold.',
              ...(TIP_ON ? ['With a tip, a safe copy of your log and the same on every device'] : []),
            ].map((x) => (
              <View key={x} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Icon name="check" size={18} color={c.mintText} />
                <T style={{ flex: 1 }}>{x}</T>
              </View>
            ))}
          </View>
        </>
      );
      foot = (
        <View key="f" style={[s.footOne, { gap: 4 }]}>
          <Next label="Make my free account" noIcon onPress={() => !busy() && sync.signInNow({ why: 'setup' })} off={false} />
          <TextLink
            label="Keep it on this phone"
            onPress={() => {
              if (busy()) return;
              /* a choice, kept: Today does not ask again for a week (accounts.ts) */
              if (st) apply(accountLater(st, tk));
              go(1);
            }}
          />
        </View>
      );
      break;
    }
    case 'done': {
      if (f.redo) {
        body = (
          <>
            <Head
              h={f.changed ? 'Saved. Your plan is up to date.' : 'All set.'}
              sub={
                (f.changed ? 'Your changes are in My plan and Settings.' : 'Nothing in your plan changed.') +
                ' Your answers are kept, so the next walk-through can show how things moved.'
              }
            />
            <Talk text={null} want={want} />
            <Route label="Read my plan" onPress={() => !busy() && router.replace('/plan')} />
          </>
        );
        foot = (
          <View key="d" style={s.footOne}>
            <Next label="Done" noIcon onPress={() => !busy() && close()} />
          </View>
        );
      } else {
        /* the finale, on the sun's sky: "You finished setup!", the flame big and alive with confetti falling, and once,
           "Do you like Daybook so far?" (core like.ts). It has its own Dock. */
        body = <Cheer />;
        foot = null;
      }
      break;
    }
    default:
      body = <ShowPage k={pg.k} t={t} st={st} a={a} W={W} habit={habit} />;
      foot = nextBtn('Next');
  }

  const fin = pg.k === 'done';
  /* the line at the top: one dash for each of the three acts, the one we are in filling as it goes; a screen reader hears the act and the page */
  const act = Math.max(0, OB_SECS.indexOf(sec));
  const inAct = P.filter((x) => x.s === sec[0]);
  const actFrac = (inAct.indexOf(pg) + 1) / inAct.length;
  const barLabel = fin ? 'Setup complete' : (f.redo ? 'How Daybook works: ' : 'Set up Daybook: ') + sec[1] + ': page ' + (i + 1) + ' of ' + P.length;
  return (
    <Shell
      look={look}
      level={flameLevel}
      /* the violet card is the number alone, as in a lesson */
      flameOn={kind !== 'violet'}
      pulse={pulse}
      inset={inset}
      scroll={scroll}
      fit={fit}
      bodyKey={pg.id}
      prog={<Prog total={OB_SECS.length} i={act} frac={actFrac} all={fin} look={look} label={barLabel} />}
      onBack={noBack ? undefined : () => !f.saved && go(-1)}
      onClose={exit}
      foot={foot}
      topRight={
        /* help is one tap away on every page; the setup waits underneath, where it was left */
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="SOS. Help with an urge right now. The setup waits for you."
          onPress={() => router.push('/sos')}
          style={({ pressed }) => [s.sosPill, { backgroundColor: c.sos, opacity: pressed ? 0.85 : 1 }]}>
          <Icon name="life" size={17} color={c.sosInk} />
          <Text style={[s.sosPillT, { color: c.sosInk }]}>SOS</Text>
        </Pressable>
      }>
      {body}
    </Shell>
  );
}

/** markdown bold off, for words the flame says in its bubble */
const plain = (x: string) => x.replace(/\*\*/g, '');

/** the flame big in the open middle, saying something above it (or nothing) */
function Talk({ text, want }: { text: string | null; want: number }) {
  return (
    <>
      {text ? <Bubble text={text} /> : null}
      <FlameSlot size={want} min={SHORT ? 110 : 140} />
    </>
  );
}
/** the flame beside what it says, low on the page above the answers: the lesson's flame once an answer is picked. With no words, it stands
    on its own at the right. */
function Say({ text }: { text: string | null }) {
  return (
    <View style={[s.say, !text && { minHeight: BESIDE * 0.8 }]}>
      {text ? (
        <View style={{ marginRight: BESIDE - 8 }}>
          <Bubble text={text} tail="right" />
        </View>
      ) : null}
      <FlameSlot size={BESIDE * 1.9} min={0} side style={StyleSheet.absoluteFill} />
    </View>
  );
}

/* the pages that only show something */
function ShowPage({ k, t, st, a, W, habit }: { k: string; t: Tone; st: Settings | null; a: SetupAnswers; W: number; habit: Habit }) {
  const porn = habit === 'porn';
  switch (k) {
    case 'loop':
      return (
        <Show
          st={st}
          art={
            <LessonArt
              art={[
                'loop',
                {
                  n: ['Feel low', porn ? 'Use porn' : habit === 'gambling' ? 'Gamble' : habit === 'alcohol' ? 'Drink' : 'Give in', 'Feel worse', 'Pull away'],
                  c: 'THE LOOP',
                },
              ]}
              ic="leaf"
              t={t}
              st={st}
            />
          }
          h={
            porn
              ? 'Low mood and porn feed each other.'
              : habit === 'other'
                ? 'Low mood and a habit feed each other.'
                : 'Low mood and ' + HABIT_NOUN[habit] + ' feed each other.'
          }
          line="The way out is people. **One text to a friend** breaks the loop."
          more={
            porn
              ? {
                  label: 'Behind this',
                  paras: [
                    'In a survey of 1,247 adults, the lonelier people were, the more porn they tended to use. The researchers think it runs both ways.',
                    'A review of about 25 years of research on recovery groups found that a change in who people spend time with was one of the main ways the groups helped.',
                    '**Relationships.** A review of 50 studies, about 50,000 people, found men who used more porn were less satisfied with their sex lives and relationships. In a national US survey, married people who started watching porn were about twice as likely to be divorced by the next survey: 11% against 6%. These are links, not proof of cause.',
                  ],
                  keys: ['butler', 'kelly17', 'wright', 'perry'],
                }
              : {
                  label: 'Behind this',
                  paras: [
                    'A review of about 25 years of research on recovery groups found that a change in who people spend time with was one of the main ways the groups helped.',
                  ],
                  keys: ['kelly17'],
                }
          }
        />
      );
    case 'waves':
      return (
        <Show
          st={st}
          art={<LessonArt art={['wave', {}]} ic="wave" t={t} st={st} />}
          h={obWave(a).h}
          line="You can ride one out without acting on it. SOS walks you through it."
          more={{
            label: 'Behind this',
            paras: [
              'In a study with smokers, people who learned to watch a craving rise and fall without acting on it (“urge surfing”) smoked less over the following week.',
            ],
            keys: ['bowen'],
          }}
        />
      );
    case 'curve':
      return (
        <Show
          st={st}
          art={<PicCurve width={W} />}
          h="Change takes weeks, not days."
          line="A new habit took about **66 days** to feel automatic. One missed day barely mattered."
          more={{
            label: 'Behind this',
            paras: [
              'In a study of 96 people building a new daily habit, the typical person took 66 days before it felt automatic. Some took much longer, and missing a single day made little difference.',
              /* porn only: stopping alcohol or a daily drug can bring dangerous withdrawal (habit.ts HABIT_MEDICAL) */
              ...(porn ? ['In a trial where regular porn users stopped for a week, stopping did not bring on withdrawal symptoms on average.'] : []),
            ],
            keys: porn ? ['lally', 'fernandez'] : ['lally'],
          }}
        />
      );
    case 'slip':
      return (
        <Show st={st} art={<PicSlip width={W} />} h="A slip is data, not a reset." line="Your points, level, and badges stay. The next day counts again." />
      );
    default:
      return null;
  }
}

/* Thirty seconds of slow breathing on the real SOS breath (4 in, 6 out), on the shared timer. It starts by itself the moment the
   page shows. While it runs, the page offers only Skip; when it ends the words change, the phone gives a small buzz, and Next
   comes. Back on the page after it ended, it shows the finished words and does not start again. Under Reduce Motion the
   shape stays still and the words keep the beat. */
const BREATHE_SECS = 30;
const BREATHE_BEAT: BeatOf = { ...BEAT_BREATH, words: ['Breathe in', 'Breathe out'] };
function Breathe({ done, onDone }: { done: boolean; onDone: () => void }) {
  const c = useTheme();
  const sec = useClock(true);
  const gone = done ? BREATHE_SECS : Math.min(sec, BREATHE_SECS);
  useEffect(() => {
    if (done || sec < BREATHE_SECS) return;
    buzz('lit');
    onDone();
  }, [done, sec, onDone]);
  return (
    <>
      <Head h={done ? 'You just rode one out.' : 'Try it now. Thirty seconds of slow breathing.'} />
      <Middle>
        <ToolTimer
          p={gone / BREATHE_SECS}
          left={(BREATHE_SECS - gone) * 1000}
          sec={sec}
          beat={done ? BEAT_BREATH : BREATHE_BEAT}
          touch={done ? undefined : BREATHE_SECS}
          label={done ? 'Well done' : 'Breathing'}
          color={c.scheme === 'dark' ? c.sun : c.accent}
          ink={c.accentText}
        />
      </Middle>
      <Say text={done ? 'That is the whole skill. SOS does this with you, any time.' : obSay('breathe')} />
    </>
  );
}

/* the freq and mins pages: the picture big on its own with a muted "Slide to answer" under it; once there is an answer, the picture
   settles smaller above the chosen words. The block under the picture keeps one height, so nothing jumps. */
function SlideShow({ idx, pic, words, grow }: { idx: number; pic: ReactNode; words: string | null; grow: number }) {
  const reduce = useReducedMotion();
  const BIG = SHORT ? Math.min(grow, 1.12) : grow;
  const k = useRef(new Animated.Value(idx >= 0 ? 0 : 1)).current;
  const set = idx >= 0;
  useEffect(() => {
    if (reduce) return k.setValue(set ? 0 : 1);
    Animated.spring(k, { toValue: set ? 0 : 1, ...SPRING.default, useNativeDriver: NATIVE }).start();
  }, [set, reduce, k]);
  return (
    <>
      <FitArt min={0.6} drop={0.7}>
        <Animated.View style={{ transform: [{ scale: k.interpolate({ inputRange: [0, 1], outputRange: [1, BIG] }) }], marginVertical: SHORT ? 6 : 18 }}>
          {pic}
        </Animated.View>
      </FitArt>
      <View style={{ minHeight: SHORT ? 80 : 104, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' }}>
        {words != null ? (
          <SliderValue big words value={idx} show={() => words} />
        ) : (
          <T v="label" tone="muted" style={s.c}>
            Slide to answer
          </T>
        )}
      </View>
    </>
  );
}

/* a page that shows something: the title at the top and the words under it, then the picture in the open middle, and
   "Behind this" under the picture */
function Show({
  art,
  h,
  line,
  more,
  children,
  st,
}: {
  art: ReactNode;
  h: string;
  line?: string;
  more?: { label: string; paras: string[]; keys: string[] };
  children?: ReactNode;
  st: Settings | null;
}) {
  return (
    <>
      <Head h={h} />
      {children}
      <Middle>
        <FitArt min={0.5} stretch>
          {art}
        </FitArt>
      </Middle>
      <Say text={line ? plain(line) : null} />
      {more ? <More more={more} /> : null}
    </>
  );
}

/* ---------- small pieces ---------- */
/* the top of a page: the title, then the words under it (a string, or a Rich line) */
function Head({ h, sub, small }: { h: string; sub?: ReactNode; small?: boolean }) {
  return (
    <View style={s.head}>
      {small ? (
        <T tone="muted" style={s.p} accessibilityRole="header">
          {h}
        </T>
      ) : (
        <T v="title" style={SHORT ? s.titleShort : s.title26} accessibilityRole="header">
          {h}
        </T>
      )}
      {typeof sub === 'string' ? (
        <T tone="muted" style={s.p}>
          {sub}
        </T>
      ) : (
        sub
      )}
    </View>
  );
}
/* a small picture in the act's color: a Material shape with the page's icon on it, the app's look for a picture */
function ShapePic({ id, ic, t, size }: { id: string; ic: string; t: Tone; size: number }) {
  return <ToolShape id={id} ic={ic} size={size} iconSize={Math.round(size * 0.42)} color={t.ic} ink={t.ink} />;
}
/* which shape each act wears */
const ACT_SHAPE: Record<string, string> = { you: 'curious', hour: 'breathe', plan: 'surprise' };
const ACT_TIME: Record<string, string> = { you: 'about 3 minutes', hour: 'about 2 minutes', plan: 'about 3 minutes' };
/* how often, as a circle: empty for Never, half for Occasionally, full for Very often */
function FreqDot({ n, col }: { n: number; col: string }) {
  return (
    <Svg width={38} height={38} viewBox="0 0 38 38">
      <Circle cx={19} cy={19} r={16} fill="none" stroke={col} strokeWidth={3} />
      {n === 1 ? <Path d="M19 3a16 16 0 0 1 0 32z" fill={col} /> : n === 2 ? <Circle cx={19} cy={19} r={16} fill={col} /> : null}
    </Svg>
  );
}
/** an answer on paper, as in a lesson: picked, it turns green. children: what it says, given whether it is picked */
function Opt({ on, onPress, children, style }: { on: boolean; onPress: () => void; children: (on: boolean) => ReactNode; style?: object }) {
  return (
    <Answer sel={on} right={on} onPress={onPress} style={{ ...s.optIn, ...style }}>
      {children(on)}
    </Answer>
  );
}
/** the tiles of a question with more than one answer: paper, two across, the icon over the words. Picked, a tile turns green. */
function IconTiles({ list, cols, cur, onPick }: { list: ObOpt[]; cols: number; cur: string[] | undefined; onPick: (v: string) => void }) {
  const on = (x: string) => !!cur && cur.indexOf(x) >= 0;
  const tall = cols === 2;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {list.map((it) => {
        const sel = on(it[0]);
        return (
          <Answer
            key={it[0]}
            sel={sel}
            right={sel}
            onPress={() => onPick(it[0])}
            style={tall ? (list.length > 6 ? { ...s.tall, ...s.short } : s.tall) : s.wide}>
            {typeof it[2] === 'string' ? <Icon name={it[2]} size={24} color={sel ? '#FFFFFF' : PAPER_INK} /> : null}
            <AnswerText right={sel} center={tall}>
              {it[1]}
            </AnswerText>
          </Answer>
        );
      })}
    </View>
  );
}
function Soft({ icon, text }: { icon: string; text: string }) {
  const c = useTheme();
  return (
    <View style={[s.soft, { backgroundColor: c.surface }]}>
      <Icon name={icon} size={20} color={c.ink} />
      <Rich text={text} st={null} style={{ flex: 1 }} />
    </View>
  );
}
/** "Behind this": the detail and the sources, one tap away */
function More({ more }: { more: { label: string; paras: string[]; keys: string[] } }) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  const xs = more.keys.map(obSrc).filter(Boolean) as [string, string][];
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minHeight: 44,
        }}>
        <Icon name={open ? 'up' : 'down'} size={16} color={c.accentText} />
        <Text style={{ fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: c.accentText }}>{more.label}</Text>
      </Pressable>
      {open ? (
        <View style={[s.more, { backgroundColor: c.surface2 }]}>
          {more.paras.map((p, k) => (
            <Rich key={k} text={p} st={null} style={{ fontSize: 15, lineHeight: 22 }} />
          ))}
          {xs.map((x) => (
            <Text
              key={x[1]}
              accessibilityRole="link"
              onPress={() => Linking.openURL(x[1]).catch(() => undefined)}
              style={{
                fontFamily: font.body,
                fontSize: 15,
                color: c.accentText,
                textDecorationLine: 'underline',
              }}>
              {x[0]}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
/* the first page: for someone who opened Daybook in the middle of an urge */
function SosRow() {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Having an urge right now? Open SOS first. No setup needed."
      onPress={() => router.push('/sos')}
      style={({ pressed }) => [s.sosRow, { backgroundColor: c.surface, opacity: pressed ? 0.75 : 1 }]}>
      <Icon name="life" size={24} color={c.sos} />
      <View style={{ flex: 1 }}>
        <T v="label">Having an urge right now?</T>
        <T v="small" tone="muted">
          Open SOS first. No setup needed.
        </T>
      </View>
      <Icon name="next" size={18} color={c.muted} />
    </Pressable>
  );
}
function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'center' }}>
      <Text
        style={{
          fontFamily: font.bodySemi,
          fontSize: 15,
          color: c.accentText,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}
/* the plan builds itself: rows come in about 90 ms apart, after a short wait (ms) */
const PLAN_AT = 200;
const PLEDGE = 'I will log honestly, slips included.';
const PLAN_STEP = 90;
/** "Level 1 → Level 2": the bar fills over about a second as the page shows (Reduce Motion: full at once). It is only a picture of
    what setup already gives (SETUP_PTS points, which is the first level up: core levels.ts), so it is full. */
function LevelBar() {
  const c = useTheme();
  const reduce = useReducedMotion();
  const from = levelOf(0);
  const to = levelOf(SETUP_PTS);
  const share = from.next ? Math.min(1, SETUP_PTS / from.next) : 1;
  const v = useRef(new Animated.Value(reduce ? share : 0)).current;
  useEffect(() => {
    if (reduce) return v.setValue(share);
    Animated.timing(v, { toValue: share, delay: 700, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.stopAnimation();
  }, [reduce, share, v]);
  return (
    <View style={{ alignSelf: 'stretch', gap: 6 }} accessible accessibilityLabel={`Level ${from.n} to level ${to.n}. Plus ${SETUP_PTS} points.`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <T v="label">
          Level {from.n} → Level {to.n}
        </T>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: c.mintText }}>+{SETUP_PTS} points</Text>
      </View>
      <View style={{ height: 14, borderRadius: 7, backgroundColor: c.mintSoft, overflow: 'hidden' }}>
        <Animated.View
          style={{ height: '100%', borderRadius: 7, backgroundColor: c.mint, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}
        />
      </View>
    </View>
  );
}
/** one half of a row that holds two short things side by side (the goal and the screens-off time) */
function PlanBit({ icon, l, v }: { icon: string; l: string; v: string }) {
  const c = useTheme();
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Icon name={icon} size={20} color={c.accentText} />
      <View style={{ flex: 1 }}>
        <T v="small" tone="muted">
          {l}
        </T>
        <T v="label" style={SHORT ? s.planVal : undefined}>
          {v}
        </T>
      </View>
    </View>
  );
}
function PlanRow({ icon, l, v, first }: { icon: string; l: string; v: string; first?: boolean }) {
  const c = useTheme();
  return (
    <View style={[s.planRow, { borderTopColor: c.line }, first && { borderTopWidth: 0 }]}>
      <Icon name={icon} size={20} color={c.accentText} />
      <View style={{ flex: 1 }}>
        <T v="small" tone="muted">
          {l}
        </T>
        <T v="label" style={SHORT ? s.planVal : undefined}>
          {v}
        </T>
      </View>
    </View>
  );
}
/* the close of the first act, in order: the number counts up, then the verdict, then the bars grow, then the rows (ms after the page) */
const HOURS_COUNT = 250;
const HOURS_VERDICT = 1450;
const HOURS_BARS = 1950;
const HOURS_ROWS = 2500;
/** your own number counts up, big, over about a second. With Reduce Motion on, it is the final number at once. */
function Hours({ to, color }: { to: number; color: string }) {
  /* the size follows the digits of the final number, so it never changes while it counts and never runs off the screen */
  const len = to.toLocaleString('en-US').length;
  const size = Math.round((len >= 7 ? 72 : len >= 6 ? 88 : len >= 5 ? 104 : 128) * (SHORT ? 0.78 : 1));
  return (
    <CountUp
      to={to}
      delay={HOURS_COUNT}
      duration={1100}
      format={(n) => n.toLocaleString('en-US')}
      label={`${to.toLocaleString('en-US')} hours a year at your pace`}
      style={{ fontFamily: font.displayBold, fontSize: size, lineHeight: Math.round(size * 1.1), color, fontVariant: ['tabular-nums'] }}
    />
  );
}
/** the two bars grow from the left to their lengths, one after the other (Reduce Motion: already there) */
function Bar({ share, color, delay }: { share: number; color: string; delay: number }) {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return v.setValue(1);
    Animated.timing(v, { toValue: 1, delay, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.stopAnimation();
  }, [reduce, delay, v]);
  return (
    <Animated.View
      style={{
        width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${share}%`] }),
        minWidth: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: color,
      }}
    />
  );
}
function Compare({ g, yr, t }: { g: number; yr: number; t: Tone }) {
  const c = useTheme();
  const top = Math.max(g, yr) || 1;
  const row = (l: string, v: number, txt: string, col: string, delay: number) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <T v="small" tone="muted" style={{ width: 86 }}>
        {l}
      </T>
      <View style={{ flex: 1 }}>
        <Bar share={Math.max(6, Math.round((v / top) * 100))} color={col} delay={delay} />
      </View>
      <T v="label">{txt}</T>
    </View>
  );
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={`You guessed ${g} hours. Your pace is about ${yr} hours.`}>
      {row('You guessed', g, g + (g >= 800 ? '+' : ''), c.muted, HOURS_BARS)}
      {row('Your pace', yr, yr.toLocaleString('en-US'), t.ic, HOURS_BARS + 350)}
    </View>
  );
}
/** hold to commit: a short hold, so the plan feels like a promise. A tap, then a second tap, also works. The fill grows as you
    hold; with Reduce Motion on it shows full at once, and the hold still takes the same time. */
function Hold({ onDone, pledge }: { onDone: () => void; pledge?: string }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  const [label, setLabel] = useState('Hold to commit');
  const [wide, setWide] = useState(0);
  const done = useRef(false);
  const tap2 = useRef(false);
  const held = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Hold to commit"
      accessibilityHint={(pledge ? pledge + ' ' : '') + 'Press and hold, or tap twice'}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={finish}
      onPressIn={() => {
        held.current = false;
        buzz('tap');
        if (timer.current) clearTimeout(timer.current);
        if (reduce) {
          v.setValue(1);
          timer.current = setTimeout(() => {
            held.current = true;
            finish();
          }, 1100);
          return;
        }
        Animated.timing(v, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished) {
            held.current = true;
            finish();
          }
        });
      }}
      onPressOut={() => {
        if (timer.current) clearTimeout(timer.current);
        if (!done.current) {
          v.stopAnimation();
          if (reduce) v.setValue(0);
          else
            Animated.timing(v, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start();
        }
      }}
      onPress={() => {
        if (done.current || held.current) return;
        /* the words say "tap again" for as long as they show, so a second tap always counts */
        if (tap2.current) return finish();
        tap2.current = true;
        setLabel('Keep holding, or tap again');
      }}
      onLayout={(e) => setWide(e.nativeEvent.layout.width)}
      style={[s.hold, { backgroundColor: c.accentSoft, borderColor: c.accent }]}>
      <Text style={[s.holdT, { color: c.ink }]} accessibilityLiveRegion="polite">
        {label}
      </Text>
      {pledge ? <Text style={[s.holdP, { color: c.ink }]}>{pledge}</Text> : null}
      {/* the words show twice: in the button's own ink on the pale button, and in the fill's ink on the fill (cut to the fill's edge), so they read all the way across */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'hidden',
          backgroundColor: c.accent,
          width: v.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}>
        <View style={{ width: Math.max(0, wide - 4), flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[s.holdT, { color: c.accentInk }]}>{label}</Text>
          {pledge ? <Text style={[s.holdP, { color: c.accentInk }]}>{pledge}</Text> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** the reminder times the setup offers */
/** the screens-off time the wheels start on, and what the plan says when the question was skipped */
const SO_USUAL = '23:00';
const hm = (x: string) => ({ h: Number(x.slice(0, 2)), m: Number(x.slice(3, 5)) });
const clockOf = (h: number, m: number) => String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');

/* The end of a new person's setup: a celebration, like the end of a game's first level. "You finished setup!" big at the
   top, the flame big and alive in the middle with its burst of shapes, confetti falling over the whole page, and the level
   bar filling. Once, and never after a slip or an SOS (core like.ts), it asks "Do you like Daybook so far?" with the two
   answers low, where the thumb is. A Yes opens the phone's rating sheet over Today (the web has none, so it thanks them);
   "Not yet" thanks them and offers to say what would help. When it does not ask, the first lesson and Today are the way on.
   Under Reduce Motion the flame and the bar are still and no confetti falls. */
function Cheer() {
  const { snap, tk, apply, say } = useStore();
  const sos = useSos();
  const st = snap.settings;
  /* decided once, when the plan is saved, so answering does not swap the page under the person */
  const [step, setStep] = useState<'ask' | 'no' | 'off' | null>(null);
  useEffect(() => {
    if (step || !st) return;
    setStep(likeAskDue(snap.days, st, false, { now: Date.now(), sos: careLastAt(sos.mem) }) ? 'ask' : 'off');
  }, [step, st, snap.days, sos.mem]);
  const [rain] = useState(() => Date.now());
  const answer = (a: LikeAnswer) => {
    if (!st) return;
    buzz('tap');
    apply(likeAnswer(st, a, tk));
    if (a === 'no') return setStep('no');
    say(LIKE_WORDS.thanks);
    close();
    /* a moment later, so the sheet comes up over Today, not over a page on its way out */
    setTimeout(() => void askStoreReview(), 700);
  };
  const W = LIKE_WORDS;
  return (
    <>
      <Confetti key={rain} big rain />
      <Head h={W.h} sub={W.sub} />
      {step === 'ask' ? (
        <T v="label" style={s.cheerQ} accessibilityRole="header">
          {W.q}
        </T>
      ) : step === 'no' ? (
        <Appear>
          <View style={{ gap: 6, alignSelf: 'stretch' }}>
            <T v="label" style={s.cheerQ} accessibilityRole="header" accessibilityLiveRegion="polite">
              {W.noH}
            </T>
            <T tone="muted">{W.noLine}</T>
          </View>
        </Appear>
      ) : null}
      {/* the setup's one flame, at its biggest: it has just grown a level */}
      <FlameSlot size={SHORT ? 260 : 340} min={SHORT ? 140 : 180} />
      <Appear delay={500}>
        <LevelBar />
      </Appear>
      <Dock>
        {step === 'ask' ? (
          <View key="ask" style={{ gap: 10 }}>
            <Next label={W.yes} noIcon onPress={() => answer('yes')} off={false} />
            <Ghost label={W.no} onPress={() => answer('no')} />
          </View>
        ) : step === 'no' ? (
          <View key="no" style={{ gap: 4 }}>
            <Next label={W.go} noIcon onPress={close} off={false} />
            <TextLink
              label={W.tell}
              onPress={() => {
                close();
                router.push('/feedback');
              }}
            />
          </View>
        ) : (
          <View key="off" style={{ gap: 10 }}>
            <Route
              label="Start lesson 1"
              small="1–5 min · You do not need to feel ready"
              onPress={() =>
                router.replace({
                  pathname: '/lesson/[id]',
                  params: { id: 'l1' },
                })
              }
            />
            <Next label={W.go} noIcon onPress={close} />
          </View>
        )}
      </Dock>
    </>
  );
}

const s = StyleSheet.create({
  lock: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  lockIc: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  lockT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  lockB: { fontFamily: font.body, fontSize: 15, lineHeight: 20 },
  lockW: { fontFamily: font.body, fontSize: 12, lineHeight: 16, alignSelf: 'flex-start' },
  c: { textAlign: 'center' },
  footOne: { flex: 1 },
  say: { alignSelf: 'stretch', justifyContent: 'center', minHeight: BESIDE },
  optIn: { paddingLeft: 16, paddingRight: 38 },
  optRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 22 },
  optSub: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  third: { flexBasis: '30%', flexGrow: 1, alignItems: 'center', paddingLeft: 8, paddingRight: 8 },
  half: { flexBasis: '45%', flexGrow: 1, alignItems: 'center', paddingLeft: 8, paddingRight: 8 },
  wide: { flexBasis: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  planFlame: { flexGrow: 0, width: SHORT ? 96 : 120, height: SHORT ? 96 : 120 },
  page: { flexGrow: 1, alignSelf: 'stretch', gap: 12 },
  /* the review page on a short phone: the plan, the flame and Hold to commit all on one screen */
  pageShort: { gap: 8 },
  head: { gap: 8, alignSelf: 'stretch' },
  cheerQ: { fontFamily: font.bodySemi, fontSize: SHORT ? 17 : 20, lineHeight: SHORT ? 22 : 25, alignSelf: 'stretch' },
  title26: { fontSize: 28, lineHeight: 34 },
  titleShort: { fontSize: 22, lineHeight: 28 },
  rows: { alignSelf: 'stretch', gap: 8 },
  acts: { alignSelf: 'stretch', gap: 24, paddingHorizontal: 16 },
  act: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actT: { fontFamily: font.display, fontSize: 20, lineHeight: 25 },
  huge: { fontFamily: font.displayBold, fontSize: SHORT ? 72 : 96, lineHeight: SHORT ? 78 : 104, fontVariant: ['tabular-nums'] },
  sosPill: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sosPillT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  /* the door to SOS on the first page: plain, so it does not shout over the way in; the red is in its icon and in the pill above */
  sosRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', columnGap: 16 },
  p: { fontSize: SHORT ? 15 : 17, lineHeight: SHORT ? 21 : 24 },
  quoteT: { fontFamily: font.display, fontSize: 22, lineHeight: 28, textAlign: 'center', paddingHorizontal: 8 },
  freq: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 12, paddingLeft: 4, paddingRight: 4 },
  freqT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  /* a time that sits beside an icon: its own width, never squeezed into two lines (flex: 0 gave the web a width of zero) */
  optTime: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  optT: { flex: 1, fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tall: { flexBasis: '46%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 88, paddingLeft: 8, paddingRight: 8 },
  short: { minHeight: 72 },
  tallT: { flex: 0, textAlign: 'center', fontSize: 15, lineHeight: 20 },
  tick: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eq: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  soft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
  },
  more: { gap: 8, padding: 16, borderRadius: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 2,
    maxWidth: '100%',
  },
  planVal: { fontSize: 15, lineHeight: 20 },
  day1: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  plan: { alignSelf: 'stretch', borderRadius: 20, paddingHorizontal: 16 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: SHORT ? 4 : 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pledge: {
    fontFamily: font.display,
    fontSize: SHORT ? 17 : 20,
    lineHeight: SHORT ? 22 : 25,
    textAlign: 'center',
    marginTop: SHORT ? 0 : 4,
  },
  ch: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
  },
  bx: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hold: {
    flex: 1,
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  holdT: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  holdP: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
});
