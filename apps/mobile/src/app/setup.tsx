/* Setup in two minutes (WP10; the owner's decisions D4 and D14, November 12, 2026), with Duolingo as the model (the owner,
   November 12, 2026: "heavily use this for inspiration everywhere in the app for celebrations streaks onboarding lessons").

   A new person: hello (the flame says how many quick questions), what they are quitting, how often, when it pulls hardest,
   thirty seconds of breathing (the first win, the way SOS starts), the promise ("You are here. This time is different."),
   who it is for, faith, tonight (the phone-down time, and on a phone the note an hour before), then they light their flame
   for the first time, with a swipe up, and pick a small first goal. Then the free account ask, with "Keep it on this phone".
   Counting starts tonight (core obBegin). Everything else arrives one part a day in the first week (core unlock.ts).

   As in a lesson (components/lesson-parts.tsx): one sky, one flame that glides from page to page and answers each pick in its
   bubble, one question a page with big answers low, a bar of dashes across the top. Every question can be skipped; setup
   itself cannot (closing it brings it back). Opened again from More ("How Daybook works"), it asks the same questions and ends
   on the changes to keep; nothing changes until then. */
import {
  accountLater,
  fmtClock,
  fmtDate,
  FOR_MAX,
  gameCompute,
  igniteStartRow,
  isTime,
  keyOfDate,
  LEARN_FREE,
  NUDGE_WORDS,
  OB_FIRST,
  OB_PAGES,
  obAskCount,
  obBegin,
  obChanges,
  obGoal,
  obHabit,
  obPages,
  obPrefill,
  obPromise,
  obReply,
  obSave,
  obSay,
  obTonightAt,
  readBackup,
  restoreBackup,
  setFirstGoal,
  toRecords,
  type ObOpt,
  type RecordId,
  type SetupAnswers,
  addDays,
  lessonStop,
  type DayKey,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Appear } from '@/components/appear';
import { Confetti } from '@/components/celebrate';
import { SHORT, useFitRoom } from '@/components/fit';
import { Ignition } from '@/components/ignite';
import { Bubble, FlameSlot } from '@/components/lesson-flame';
import { Answer, AnswerText, BESIDE, Prog, Question, Shell } from '@/components/lesson-parts';
import { Ghost, Next } from '@/components/lx';
import { Middle } from '@/components/scene';
import { useClock } from '@/components/shapes';
import { TIP_ON } from '@/components/support';
import { BEAT_BREATH, ToolTimer, type BeatOf } from '@/components/tools/timer';
import { Icon, T } from '@/components/ui';
import { ClockWheels } from '@/components/when';
import { pickBackupText } from '@/lib/backup';
import { BACKUP_FILES } from '@/lib/backup-files';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { lessonLook, PAPER_INK, type LookKind } from '@/lib/lesson-look';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { close } from '@/lib/nav';
import { setReminderPrefs, useReminderPrefs } from '@/lib/prefs';
import { countSetup } from '@/lib/pulse';
import { allowReminders, remindersOffered } from '@/lib/reminders';
import { setupKeep, setupStored, storeSetup, type SetupFlow } from '@/lib/setup-keep';
import { SAVE_FAILED, useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { font, MAX_WIDTH, nightInk, skies, useTheme } from '@/lib/theme';
import { restoredWords, WORDS } from '@/lib/words';

type Flow = SetupFlow;
const NUM = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

export default function Setup() {
  const base = useTheme();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const fit = useFitRoom();
  /* the flame leaps when it answers a pick, and when it is lit */
  const [pulse, setPulse] = useState(0);
  const { snap, tk, replace, say, current, apply } = useStore();
  const sync = useSync();
  const st = snap.settings;
  const [f, setF] = useState<Flow>(() => {
    const redo = !!st;
    const k = setupKeep.flow;
    setupKeep.shut = false;
    if (k && k.redo === redo && !k.saved) return { ...k };
    return { redo, i: 0, a: obPrefill(st), hg: null, keep: null, saved: false, changed: 0 };
  });
  /* opened straight onto this page (a Home Screen icon on the web): someone whose setup is done goes to Today instead */
  const [cold] = useState(() => !router.canGoBack());
  useEffect(() => {
    if (cold && st && !f.saved) router.replace('/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rem = useReminderPrefs();
  const env = { notify: remindersOffered, account: !f.redo && sync.status.k === 'out', redo: f.redo };
  const until = useRef(0);
  const asking = useRef(false);
  const P = obPages(f.a, env);
  const i = Math.max(0, Math.min(P.length - 1, f.i));
  const pg = P[i];
  const a = f.a;
  const habit = obHabit(a, st);
  const voice = obSay(pg.id, f.redo, habit);
  /* the sky goes from night to dawn across setup; the lighting is on the violet night until the flame is lit */
  const [lit, setLit] = useState(false);
  const kind: LookKind = pg.k === 'account' ? 'sun' : 'sky';
  const p = P.length > 1 ? i / (P.length - 1) : 1;
  /* the goal stays under the night the flame was just lit in, as Duolingo's streak goal stays on its streak's screen */
  const look = pg.k === 'light' ? lessonLook('sky', 0.1, 'dark') : lessonLook(kind, p, base.scheme);
  const c = look.c;
  /* the flame grows a little as setup goes on */
  const want = (SHORT ? 190 : 230) + (SHORT ? 40 : 70) * p;
  const flameLevel = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [st, snap.days, snap.reviews, tk]);

  /* a log arrived some other way (a restored backup, a sign-in) while a new person was in setup: setup steps aside */
  useEffect(() => {
    if (!f.redo && !f.saved && st) {
      setupKeep.flow = null;
      storeSetup(null);
      close();
    }
  }, [f.redo, f.saved, st]);
  /* a new person's place is kept on the device as they go, and let go once the flame is lit */
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
  useEffect(() => {
    setupKeep.flow = !f.saved ? { ...f, i } : null;
    if (!f.redo) storeSetup(f.saved ? null : f);
  }, [f, i]);
  /* the anonymous counts: how far a new person got (core pulse.ts) */
  useEffect(() => {
    if (f.redo) return;
    countSetup(
      OB_PAGES.findIndex((x) => x.id === pg.id),
      false,
    );
    track('setup_page', { page: pg.id });
  }, [f.redo, pg.id]);

  const busy = () => Date.now() < until.current;
  const set = (patch: Partial<Flow>) => setF((x) => ({ ...x, ...patch }));
  const setA = (patch: SetupAnswers) => setF((x) => ({ ...x, a: { ...x.a, ...patch } }));
  const go = (d: number) => {
    setF((x) => {
      const PP = obPages(x.a, env);
      const to = Math.max(0, Math.min(PP.length - 1, x.i + d));
      if (to === x.i) return x;
      until.current = Date.now() + 260;
      return { ...x, i: to };
    });
  };
  /* the end of a new person's setup: a small "Great job" with two ways on, the first lesson or Today (the owner, November 13, 2026:
     "a minor celebration like the popup good job in duolingo ... keep going and go to the lesson or say go home give them both options") */
  const [cheer, setCheer] = useState(false);
  const done = () => {
    if (busy()) return;
    buzz('lit');
    setCheer(true);
  };
  const finish = () => {
    setupKeep.flow = null;
    storeSetup(null);
    close();
  };
  const exit = () => {
    setupKeep.flow = !f.saved ? { ...f, i } : null;
    if (!st) setupKeep.shut = true;
    close();
  };
  /* the flame is lit: the plan is saved (counting starts tonight), and setup is finished */
  const light = async () => {
    if (f.saved) return;
    setLit(true);
    setPulse((x) => x + 1);
    buzz('lit');
    set({ saved: true });
    setupKeep.flow = null;
    storeSetup(null);
    countSetup(
      OB_PAGES.findIndex((x) => x.id === 'light'),
      true,
    );
    track('setup_done', { page: 'light' });
    await replace({ ...snap, settings: obBegin(a, tk) }, ['settings']);
  };
  const saveRedo = async () => {
    if (f.saved) return;
    const r = obSave(a, st, f.keep ?? obChanges(a, st, tk).map((x) => x.k), tk);
    buzz('lit');
    until.current = Date.now() + 500;
    setF((x) => ({ ...x, saved: true, changed: r.changed, i: Math.min(obPages(x.a, env).length - 1, x.i + 1) }));
    await replace({ ...snap, settings: r.st }, ['settings']);
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
  /* a one-tap answer the flame answers: the pick stays, the flame leaps and says its piece, and Next goes on */
  const answer = (key: string, v: string, ix: number) => {
    if (busy()) return;
    if (a[key] !== v) setPulse((x) => x + 1);
    setA({ [key]: v });
    if (!f.redo) track('setup_pick', { page: pg.id, ix });
    buzz('tap');
  };

  let body: ReactNode = null;
  let foot: ReactNode = null;
  switch (pg.k) {
    case 'hello': {
      if (f.redo) {
        const prev = st && st.onb;
        body = (
          <>
            <Head h="Walk through it again." />
            <Talk text={voice} want={want} />
            {prev && prev.at ? (
              <T v="small" tone="muted" style={s.c}>
                Last time: {fmtDate(keyOfDate(new Date(prev.at)), { month: 'long', day: 'numeric', year: 'numeric' })}.
              </T>
            ) : null}
          </>
        );
        foot = nextBtn('Start');
        break;
      }
      const n = obAskCount(a, env);
      body = (
        <>
          <Head h="Get free of it, one honest night at a time." />
          {/* the first thing a new person sees: the flame, big and alive, saying hello. It is the same one they will light. */}
          <Talk text={`Hi. I am your flame. ${NUM[n] || n} quick questions, and tonight is set.`} want={want} />
        </>
      );
      foot = (
        <View key="h" style={[s.footOne, { gap: 2 }]}>
          <Next label="Start" onPress={() => !busy() && go(1)} off={false} />
          {sync.status.k !== 'off' && sync.status.k !== 'on' ? (
            <TextLink label={sync.status.k === 'busy' ? sync.status.what : 'I already have an account'} onPress={() => sync.signInNow({ why: 'in' })} />
          ) : null}
          {BACKUP_FILES ? <TextLink label="I have a backup file" onPress={restore} /> : null}
        </View>
      );
      break;
    }
    case 'tiles': {
      /* a question the flame answers, as in a lesson: the question at the top, the flame and what it says in the middle, the answers low */
      const key = pg.key!;
      const list = pg.list!;
      const at = list.findIndex((x) => x[0] === a[key]);
      body = (
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
          onPick={(j) => answer(key, list[j][0], j)}
        />
      );
      foot = nextBtn(ans(a[key]) ? 'Next' : 'Skip', !ans(a[key]));
      break;
    }
    case 'multi': {
      const key = pg.key!;
      const arr = (a[key] as string[]) || [];
      const max = pg.max || pg.list!.length;
      body = (
        <>
          <Head h={pg.h!} sub={pg.sub} />
          <Middle>{null}</Middle>
          <Say text={voice} />
          <Tiles
            list={pg.list!}
            cols={pg.cols || 2}
            cur={arr}
            onPick={(v) => {
              const k = arr.indexOf(v);
              if (k < 0 && arr.length >= max) return buzz('tick');
              setA({ [key]: k >= 0 ? arr.filter((x) => x !== v) : arr.concat(v) });
              if (k < 0) setPulse((x) => x + 1);
              buzz('tap');
            }}
          />
        </>
      );
      foot = nextBtn(arr.length ? 'Next' : 'Skip', !arr.length);
      break;
    }
    case 'breathe': {
      const done = !!a.breathed;
      body = <Breathe done={done} onDone={() => setA({ breathed: true })} />;
      foot = done ? nextBtn('Next') : nextBtn('Skip', true);
      break;
    }
    case 'promise': {
      const pr = obPromise(a);
      body = (
        <>
          <Head h={pr.h} />
          <Talk text={pr.say} want={want * 0.8} />
          <View style={s.rows}>
            {pr.rows.map(([ic, t], j) => (
              <Appear key={ic} delay={350 + j * 450} by={12}>
                <View style={s.row}>
                  <View style={[s.rowIc, { backgroundColor: c.surface }]}>
                    <Icon name={ic} size={22} color={c.accentText} />
                  </View>
                  <T style={{ flex: 1 }}>{t}</T>
                </View>
              </Appear>
            ))}
          </View>
        </>
      );
      foot = nextBtn('This is my night');
      break;
    }
    case 'tonight': {
      /* the phone-down time on wheels like the phone's own clock, and the note an hour before it, pictured on a locked screen */
      const so = obTonightAt(a);
      const note = NUDGE_WORDS.wind(fmtClock(so));
      const keep = () => setA({ so });
      const yes = async () => {
        if (busy() || asking.current) return;
        keep();
        if (!remindersOffered) {
          buzz('lit');
          return go(1);
        }
        asking.current = true;
        until.current = Date.now() + 1500;
        const ok = await allowReminders().catch(() => false);
        asking.current = false;
        until.current = 0;
        if (ok) {
          setReminderPrefs({ ...rem, wind: true });
          buzz('lit');
        } else say(WORDS.notifyOff);
        go(1);
      };
      body = (
        <>
          <Head h="Tonight is the first night." />
          <Middle>
            <View style={{ alignSelf: 'stretch', gap: 12 }}>
              <View style={[s.card, { backgroundColor: c.surface }]}>
                <T tone="muted">{habit === 'porn' ? 'Phone down at' : 'Wind down at'}</T>
                <Text style={[s.time, { color: c.ink }]}>{fmtClock(so)}</Text>
              </View>
              {remindersOffered ? (
                <View
                  style={[s.lock, { backgroundColor: skies.light.night[0] }]}
                  accessible
                  accessibilityLabel={'An hour before, a note will look like this: Daybook. ' + note.t + '. ' + note.b}>
                  <View style={[s.lockIc, { backgroundColor: c.accent }]}>
                    <Icon name="flame" size={16} color={c.accentInk} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.lockT, { color: nightInk.ink }]}>{note.t}</Text>
                    <Text style={[s.lockB, { color: nightInk.ink }]}>{note.b}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          </Middle>
          <Say text={voice} />
          <ClockWheels {...hm(so)} step={5} onChange={(h, m) => setA({ so: clockOf(h, m) })} />
        </>
      );
      foot = (
        <View key="t" style={[s.footOne, { gap: 2 }]}>
          <Next label="Set tonight" onPress={yes} off={false} noIcon />
          {remindersOffered ? (
            <Ghost
              label="Set it without the note"
              onPress={() => {
                if (busy() || asking.current) return;
                keep();
                if (!f.redo) track('setup_skip', { page: pg.id });
                go(1);
              }}
            />
          ) : null}
        </View>
      );
      break;
    }
    case 'light': {
      body = (
        <FirstGoal
          tk={tk}
          goal={st?.fwGoal ?? null}
          onGoal={(n) => {
            if (st) apply({ st: setFirstGoal(st, n) });
            setPulse((x) => x + 1);
            buzz('tap');
          }}
        />
      );
      foot = st?.fwGoal ? (
        <Appear key="n" delay={200} style={s.footOne}>
          <Next label="Commit to my goal" noIcon onPress={() => (i < P.length - 1 ? go(1) : done())} />
        </Appear>
      ) : (
        <View key="n0" style={s.footOne}>
          <Next label="Commit to my goal" noIcon off onPress={() => {}} />
        </View>
      );
      break;
    }
    case 'account': {
      /* the flame was just lit: a free account keeps it. Staying on this phone is a quiet link that records the choice. */
      body = (
        <>
          <Head h="Keep what you build." />
          <Talk text={obSay('account')} want={want} />
          <View style={{ gap: 8 }}>
            {[
              'Every lesson open, not just the first ' + LEARN_FREE,
              'Your days kept safe if this phone is lost',
              'Free, and private to you. Nothing is shared or sold.',
              ...(TIP_ON ? ['With a tip, the same on every device'] : []),
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
        <View key="f" style={[s.footOne, { gap: 2 }]}>
          <Next label="Make my free account" noIcon onPress={() => !busy() && sync.signInNow({ why: 'setup' })} off={false} />
          <TextLink
            label="Keep it on this phone"
            onPress={() => {
              if (busy()) return;
              /* a choice, kept: Today does not ask again for a week (accounts.ts) */
              if (st) apply(accountLater(st, tk));
              done();
            }}
          />
        </View>
      );
      break;
    }
    case 'review': {
      const ch = obChanges(a, st, tk);
      const keep = f.keep ?? ch.map((x) => x.k);
      body = !ch.length ? (
        <>
          <Head h="Your plan already matches." />
          <Talk text="Nothing in your answers changes your plan." want={want} />
        </>
      ) : (
        <>
          <Head h="Which changes do you want to keep?" />
          <Middle>{null}</Middle>
          <Say text={voice} />
          <View style={{ gap: 10, alignSelf: 'stretch' }}>
            {ch.map((x) => {
              const on = keep.indexOf(x.k) >= 0;
              return (
                <Answer key={x.k} sel={on} right={on} onPress={() => set({ keep: on ? keep.filter((k) => k !== x.k) : keep.concat(x.k) })}>
                  <View style={{ gap: 2 }}>
                    <AnswerText right={on}>{x.l}</AnswerText>
                    <Text style={[s.optSub, { color: on ? '#FFFFFF' : PAPER_INK }]}>
                      {x.from} → {x.k === 'goal' ? obGoal(a, st, tk).goal : x.to}
                    </Text>
                  </View>
                </Answer>
              );
            })}
          </View>
        </>
      );
      foot = (
        <View key="r" style={s.footOne}>
          <Next label={ch.length ? 'Save what is ticked' : 'Finish'} noIcon onPress={saveRedo} />
        </View>
      );
      break;
    }
    case 'done': {
      body = (
        <>
          <Head h={f.changed ? 'Saved. Your plan is up to date.' : 'All set.'} />
          <Talk text={f.changed ? 'Your changes are in My plan.' : 'Nothing in your plan changed.'} want={want} />
        </>
      );
      foot = (
        <View key="d" style={s.footOne}>
          <Next label="Done" noIcon onPress={() => !busy() && close()} />
        </View>
      );
      break;
    }
  }

  /* the first lighting is WP8's Ignition, the whole screen: from 0 to Day 1, with the coming week as its row. The plan is saved as
     the person goes on from it (counting starts tonight), and the goal step follows on this same page. */
  if (pg.k === 'light' && !f.saved)
    return (
      <Ignition
        level={1}
        from="0"
        to="1"
        unit="Tonight is night one"
        line="You lit me. Tonight is the first night, and I am with you for it."
        row={igniteStartRow(tk)}
        pop={0}
        button="Keep going"
        onDone={() => void light()}
        onClose={exit}
      />
    );
  const fin = f.saved && !f.redo;
  const noBack = i === 0 || f.saved;
  const barLabel = fin ? 'Setup complete' : (f.redo ? 'How Daybook works: ' : 'Set up Daybook: ') + 'page ' + (i + 1) + ' of ' + P.length;
  return (
    <View style={{ flex: 1 }}>
      <Shell
        look={look}
        level={flameLevel}
        /* before it is lit, the flame is the ember on the lighting page, not the gliding flame */
        flameOn
        pulse={pulse}
        inset={inset}
        scroll={scroll}
        fit={fit}
        bodyKey={pg.id}
        prog={<Prog total={P.length} i={i} all={fin} look={look} label={barLabel} />}
        onBack={noBack ? undefined : () => go(-1)}
        onClose={fin ? finish : exit}
        foot={foot}
        topRight={
          /* help is one tap away on every page; setup waits underneath, where it was left */
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="SOS. Help with an urge right now. No setup needed. Setup waits for you."
            onPress={() => router.push('/sos')}
            style={({ pressed }) => [s.sosPill, { backgroundColor: c.sos, opacity: pressed ? 0.85 : 1 }]}>
            <Icon name="life" size={17} color={c.sosInk} />
            <Text style={[s.sosPillT, { color: c.sosInk }]}>SOS</Text>
          </Pressable>
        }>
        {body}
      </Shell>
      {cheer ? (
        <Cheer
          onLesson={() => {
            const id = snap.settings ? lessonStop(snap.days, snap.settings, tk).L?.id : null;
            finish();
            if (id) setTimeout(() => router.push({ pathname: '/lesson/[id]', params: { id } }), 50);
          }}
          onHome={finish}
        />
      ) : null}
    </View>
  );
}

/* ---------- the end: a small celebration from the bottom, as Duolingo's "Awesome!" banner, with both ways on ---------- */
function Cheer({ onLesson, onHome }: { onLesson: () => void; onHome: () => void }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const still = useReducedMotion();
  const up = useRef(new Animated.Value(still ? 1 : 0)).current;
  useEffect(() => {
    if (!still) Animated.spring(up, { toValue: 1, friction: 7, tension: 70, useNativeDriver: NATIVE }).start();
  }, [still, up]);
  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,6,24,0.45)', opacity: up }]} />
      {still ? null : <Confetti big={false} />}
      <Animated.View
        style={[
          s.cheer,
          { backgroundColor: c.mintSoft, paddingBottom: Math.max(16, inset.bottom + 8) },
          { transform: [{ translateY: up.interpolate({ inputRange: [0, 1], outputRange: [320, 0] }) }] },
        ]}>
        <View style={s.cheerTop} accessible accessibilityRole="header" accessibilityLabel="Great job! Tonight is set.">
          <Icon name="check" size={28} color={c.mint} />
          <Text style={[s.cheerH, { color: c.mintText }]}>Great job!</Text>
        </View>
        <T style={{ color: c.mintText }}>Tonight is set. Your first lesson takes two minutes.</T>
        <View style={{ gap: 2, marginTop: 6 }}>
          <Next label="Keep going" noIcon onPress={onLesson} />
          <Ghost label="Go home" onPress={onHome} />
        </View>
      </Animated.View>
    </View>
  );
}

/* ---------- the first small goal, after the flame is lit (core ignite.ts igniteGoal: three nights, then seven) ----------
   The lighting itself is WP8's Ignition (components/ignite.tsx), shown as the whole screen before this. Then the flame, big, asks
   for a first goal, and the person picks it: three nights or seven, nothing bigger before a clean week (CLAUDE.md). Picking is the
   commitment (Duolingo found an active choice, with nothing picked for you, holds better), so the button waits for it. */
function FirstGoal({ goal, onGoal, tk }: { goal: number | null; onGoal: (n: number) => void; tk: DayKey }) {
  /* the morning the goal is kept: the person tells the last night of it that morning */
  const by = (n: number) => new Date(addDays(tk, n) + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }) + ' morning';
  return (
    <>
      <Bubble
        text={
          goal
            ? goal === 3
              ? 'Three nights. Then we go for seven.'
              : 'A whole week. I will light up every morning you tell me.'
            : 'Let us set your first goal. Small is how it starts.'
        }
      />
      <FlameSlot size={SHORT ? 240 : 330} min={SHORT ? 160 : 220} />
      <View style={{ gap: 10, alignSelf: 'stretch' }} accessibilityRole="radiogroup">
        {OB_FIRST.map((n) => (
          <Answer key={n} sel={goal === n} right={goal === n} onPress={() => onGoal(n)} style={s.goalRow} label={n + ' free nights, kept by ' + by(n)}>
            <Text style={[s.goalN, { color: goal === n ? '#FFFFFF' : PAPER_INK }]}>{n}</Text>
            <View style={{ flex: 1 }}>
              <AnswerText right={goal === n}>{n === 3 ? 'Three free nights' : 'A free week'}</AnswerText>
              <Text style={[s.optSub, { color: goal === n ? '#FFFFFF' : PAPER_INK }]}>Kept by {by(n)}</Text>
            </View>
          </Answer>
        ))}
      </View>
    </>
  );
}

/* ---------- the first win: thirty seconds of the breathing SOS starts with ---------- */
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
      <Head h={done ? 'You just did the whole skill.' : 'Try it once. Thirty seconds.'} />
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
      <Say text={done ? 'When an urge comes, SOS starts right here, with you.' : obSay('breathe')} />
    </>
  );
}

/* ---------- small pieces ---------- */
function Head({ h, sub }: { h: string; sub?: string }) {
  return (
    <View style={s.head}>
      <T v="title" style={SHORT ? s.titleShort : s.title26} accessibilityRole="header">
        {h}
      </T>
      {sub ? (
        <T tone="muted" style={s.p}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}
/** the flame big in the open middle, saying something above it (or nothing) */
function Talk({ text, want }: { text: string | null; want: number }) {
  return (
    <>
      {text ? <Bubble text={text} /> : null}
      <FlameSlot size={want} min={SHORT ? 110 : 140} />
    </>
  );
}
/** the flame beside what it says, low on the page above the answers */
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
/** the answers of a question with more than one: paper, the icon beside the words (one across) or over them (two across) */
function Tiles({ list, cols, cur, onPick }: { list: ObOpt[]; cols: number; cur: string[]; onPick: (v: string) => void }) {
  const two = cols === 2;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {list.map((it) => {
        const sel = cur.indexOf(it[0]) >= 0;
        return (
          <Answer key={it[0]} sel={sel} right={sel} onPress={() => onPick(it[0])} style={two ? s.tall : s.wide} label={String(it[1])}>
            {typeof it[2] === 'string' ? <Icon name={it[2]} size={24} color={sel ? '#FFFFFF' : PAPER_INK} /> : null}
            <AnswerText right={sel} center={two}>
              {it[1]}
            </AnswerText>
          </Answer>
        );
      })}
    </View>
  );
}
function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'center' }}>
      <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.accentText }}>{label}</Text>
    </Pressable>
  );
}

const hm = (x: string) => ({ h: Number(x.slice(0, 2)), m: Number(x.slice(3, 5)) });
const clockOf = (h: number, m: number) => String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
/** the widest a page gets, for the week row */
export const SETUP_W = MAX_WIDTH;

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  footOne: { flex: 1 },
  say: { alignSelf: 'stretch', justifyContent: 'center', minHeight: BESIDE },
  head: { gap: 8, alignSelf: 'stretch' },
  title26: { fontSize: 28, lineHeight: 34 },
  titleShort: { fontSize: 22, lineHeight: 28 },
  p: { fontSize: SHORT ? 15 : 17, lineHeight: SHORT ? 21 : 24 },
  optSub: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  wide: { flexBasis: '100%', flexDirection: 'row', alignItems: 'center', gap: 12 },
  tall: { flexBasis: '46%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: SHORT ? 72 : 84, paddingLeft: 8, paddingRight: 8 },
  rows: { alignSelf: 'stretch', gap: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowIc: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, paddingVertical: 16, paddingHorizontal: 20 },
  time: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'] },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  lockIc: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  lockT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  lockB: { fontFamily: font.body, fontSize: 15, lineHeight: 20 },
  sosPill: { height: 44, paddingHorizontal: 16, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sosPillT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  emberWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, minHeight: 320 },
  ember: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  coal: { position: 'absolute', left: 62, top: 120 },
  hint: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  big: { fontFamily: font.displayBold, fontSize: SHORT ? 64 : 84, lineHeight: SHORT ? 70 : 92, fontVariant: ['tabular-nums'] },
  week: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 8 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12 },
  cheer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 20,
    paddingHorizontal: 20,
    gap: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cheerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cheerH: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 34 },
  goalN: { fontFamily: font.displayBold, fontSize: 34, lineHeight: 40 },
});
