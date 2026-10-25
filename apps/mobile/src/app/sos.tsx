/* SOS: one short guided ride, the same shape every time, that starts on the first tap. Nothing is asked first.
   The ride is three moves (core ride.ts): breathe with the sun, then one for the body or the eyes (squeeze, catch the
   shapes, 5-4-3-2-1), then one for the mind in your own words (the hour after, say the thought fast, your words). Each
   is picked from what has worked for you, runs by itself and flows into the next; Swap trades it for another of its kind
   and Next skips it. A line across the top shows the minutes going by, and where yours usually pass. "It passed" is in
   the corner the whole time.
   After the three moves, "How is it now?": It passed, Still here (another round, with different moves) or I slipped,
   and under them the bigger moves (step away for ten minutes, text someone, talk it through, bed at night, every tool).
   It passed shows what you did: how long it took, how many you have ridden out, which move helped most (one tap, and SOS
   leans on it next time), one line on why that move works with its lesson for later, and what set it off (one tap).
   I slipped goes on to Rekindle (log.tsx), as before.
   With ?practice=1 it is a practice ride for a calm moment: the same three moves, nothing saved as an urge. */
import {
  addEvent,
  blankP,
  changeDay,
  gameCompute,
  LESSONS,
  newUrge,
  optList,
  patchEvent,
  rateUrTool,
  RIDE_SLOTS,
  rideMark,
  ridePlan,
  ridePracticeAsk,
  rideRecord,
  rideSlotOf,
  rideSwap,
  rideWeek,
  rideWhy,
  rkStepFor,
  urEntry,
  urEvidence,
  urFromYou,
  urNight,
  urTags,
  urTool,
  urWon,
  withDay,
  type UrState,
} from '@daybook/core';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { BigOption } from '@/components/choices';
import { RideBar } from '@/components/ride/bar';
import { MOVE_ICON, MOVE_NAME, MOVES, moveTint } from '@/components/ride/moves';
import { Dock, Finish, Middle, SceneFrame, Stage } from '@/components/scene';
import { Shape, WavyRing, type ShapeKind } from '@/components/shapes';
import { NATIVE, SPRING, useReducedMotion } from '@/lib/motion';
import { Text } from '@/components/text';
import { ToolGrid } from '@/components/tool-grid';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { count } from '@/lib/pulse';
import { setupKeep } from '@/lib/setup-keep';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, useSkyTheme, useTheme } from '@/lib/theme';
import { useVoice } from '@/lib/voice';

/** what the end of a ride that passed shows: the entry it saved, how long it took, the moves done, the points it earned */
interface Won {
  key: string;
  id: string;
  mins: number;
  moves: string[];
  gain: number;
}

export default function Sos() {
  const { snap, tk, now, update } = useStore();
  /* late at night the screens go dark */
  const night = urNight(new Date(now).getHours());
  const sky = night ? 'night' : 'violet';
  const c = useSkyTheme(sky);
  const sos = useSos();
  const st = useCareSettings();
  const voice = useVoice();
  const { practice: pq } = useLocalSearchParams<{ practice?: string }>();
  const [practice] = useState(() => pq === '1');
  /* a practice ride is not counted as an SOS */
  useEffect(() => {
    if (!practice) count('sos');
  }, [practice]);
  const g = useMemo(() => gameCompute(snap.days, st, snap.reviews, tk), [snap, st, tk]);
  /* before setup, help comes first and the setup comes right after (components/welcome.tsx) */
  useState(() => {
    if (!snap.settings) setupKeep.shut = false;
  });

  /* the ride: its moves, which one is showing, and which round (Still here starts another) */
  const [plan, setPlan] = useState<string[] | null>(null);
  const [at, setAt] = useState(0);
  const [round, setRound] = useState(0);
  const [won, setWon] = useState<Won | null>(null);
  const [allTools, setAllTools] = useState(false);
  /* the moves already written into the entry's rounds */
  const logged = useRef(0);
  /* every move shown in this SOS, done or skipped: another round picks others */
  const shown = useRef<string[]>([]);

  /* the ride only runs while SOS is in front (not under a tool) */
  const [front, setFront] = useState(true);
  /* SOS opened first (a notification or a bookmark) stays under what it hands on to: once that ends the SOS and closes,
     SOS comes back into view with nothing open, so it closes too */
  const began = useRef(false);
  const open = useRef(false);
  open.current = practice || !!sos.ur || !!won;
  if (sos.ur) began.current = true;
  useFocusEffect(
    useCallback(() => {
      setFront(true);
      if (began.current && !open.current) close();
      return () => setFront(false);
    }, []),
  );
  /* a new SOS each time the screen opens, ended when it is dismissed (a practice ride is never an SOS) */
  useEffect(() => {
    if (practice) return;
    if (!sos.ur) sos.begin(g.pts);
    return () => sos.end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [pu, setPu] = useState<UrState>(() => newUrge(Date.now(), 0));
  const ur = practice ? pu : sos.ur;
  const setUr = practice ? setPu : sos.set;

  /* My reasons is a move only when there are words of your own (a note, a reason or a voice note) */
  const words = !!(snap.settings && urFromYou(st, 0)) || !!voice.uri;
  const can = useMemo(() => ({ words }), [words]);
  useEffect(() => {
    if (!ur || plan) return;
    const p = ridePlan({ ...ur, used: ur.used.concat(shown.current) }, snap.days, st, tk, Date.now(), sos.mem, can);
    /* a second round skips the breath: straight to new moves */
    setPlan(round ? p.slice(1) : p);
    setAt(0);
  }, [ur, plan, round, snap.days, st, tk, sos.mem, can]);

  const tags = useMemo(() => urTags(snap.days, st, tk, sos.mem), [snap.days, st, tk, sos.mem]);
  const mark = useMemo(() => rideMark(snap.days), [snap.days]);

  const level = Math.max(1, g.level.n);
  const title = practice ? 'Practice' : 'SOS';

  if (won) return <Passed won={won} night={night} />;
  if (practice && plan && at >= plan.length) return <PracticeDone sky={sky} level={level} />;
  if (!ur || !plan)
    return (
      <SceneFrame title={title} sky={sky} onClose={close}>
        {null}
      </SceneFrame>
    );

  /* the answer to "How is it now?" (or It passed, any time): the moves since the last answer go into the entry's rounds */
  const save = (v: 'rode' | 'slipped' | 'again') => {
    const fresh = ur.used.slice(logged.current);
    logged.current = ur.used.length;
    const code = v === 'rode' ? 'p' : v === 'again' ? 's' : 'x';
    const a: UrState = { ...ur, rounds: ur.rounds.concat(fresh.map((id) => [id, code] as [string, 'p' | 's' | 'x'])).slice(0, 8) };
    if (v === 'again') {
      setUr({ ...a, again: (ur.again || 0) + 1, step: 'now' });
      setRound((r) => r + 1);
      setPlan(null);
      setAllTools(false);
      buzz('tap');
      return;
    }
    const e = urEntry(a, v, st, Date.now());
    let id = '';
    let gain = 0;
    const days = update((s) => {
      const r = addEvent(s.days, e.key, v, e.time, e.fields);
      id = r.id;
      if (s.settings) gain = gameCompute(r.days, s.settings, s.reviews, tk).pts - gameCompute(s.days, s.settings, s.reviews, tk).pts;
      return { ...s, days: r.days };
    }).days;
    sos.setMem((m) => ({ ...(v === 'rode' ? urWon(m, a) : m), last: e.last }));
    count(v === 'rode' ? 'urge_logged' : 'slip_logged');
    if (v === 'slipped') {
      sos.end();
      buzz('save');
      router.replace({
        pathname: '/log',
        params: {
          date: e.key,
          evId: id,
          outcome: v,
          step: rkStepFor(days, e.key),
          from: 'urge',
          pts0: String(a.p0),
          m: String(e.mins),
          night: night ? '1' : '',
        },
      });
      return;
    }
    buzz('lit');
    setWon({ key: e.key, id, mins: e.mins, moves: a.used.filter((x, i, l) => l.indexOf(x) === i), gain });
    sos.end();
  };

  /* a bigger move, or any tool: it opens over SOS, and comes back to "How is it now?" when it is done */
  const pickTool = (id: string) => {
    if (!urTool(id)) return;
    setUr({ ...ur, step: 'after' });
    buzz('tap');
    router.push({ pathname: '/tool/[id]', params: { id } });
  };

  /* ---------- how is it now? ---------- */
  if (!practice && (ur.step === 'after' || ur.step === 'tools' || at >= plan.length)) {
    const did = ur.used.slice(logged.current).filter((x, i, l) => l.indexOf(x) === i);
    const rec = urEvidence(snap.days);
    const big: [string, string, string][] = [
      ['pause', 'timer', 'Step away 10 min'],
      ['message', 'chat', 'Text someone'],
      night ? ['bed', 'moon', 'Go to bed'] : ['talk', 'ask', 'Talk it through'],
    ];
    return (
      <SceneFrame title={title} sky={sky} onClose={close}>
        <RideBar t0={ur.t0} mark={mark} on={front} color={c.accent} />
        <Stage key={'check' + round} dir={1}>
          <T v="title" style={s.c} accessibilityRole="header">
            How is it now?
          </T>
          {did.length ? (
            <View style={s.did} accessible accessibilityLabel={'You did: ' + did.map(moveName).join(', ')}>
              {did.map((x) => (
                <View key={x} style={[s.didP, { backgroundColor: c.scBtn }]}>
                  <Icon name={MOVE_ICON[x] || urTool(x)?.ic || 'check'} size={15} color={moveTint(c, x)} />
                  <Text style={[s.didT, { color: c.ink }]}>{moveName(x)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Middle>
            <View style={s.rec} accessible accessibilityLabel={rec.n ? rec.n + ' urges ridden out before this one.' : 'Urges rise, peak and pass.'}>
              {rec.n ? (
                <>
                  <Text style={[s.recN, { color: c.ink }]}>{rec.n}</Text>
                  <T tone="muted" style={s.c}>
                    {rec.n === 1 ? 'urge' : 'urges'} ridden out before this one{rec.med ? '. Yours usually pass in about ' + rec.med + ' min.' : '.'}
                  </T>
                </>
              ) : (
                <T tone="muted" style={s.c}>
                  Urges rise, peak and pass. Each one you wait out makes the next one easier.
                </T>
              )}
            </View>
          </Middle>
          <Dock>
            <BigOption tone="mint" icon="wave" title="It passed" sub="I rode it out." onPress={() => save('rode')} />
            <BigOption tone="sun" icon="timer" title="Still here" sub="Another round, with different moves." onPress={() => save('again')} />
            <BigOption tone="slip" icon="leaf" title="I slipped" sub="A slip is data, not a reset." onPress={() => save('slipped')} />
            <T v="small" tone="muted" style={[s.c, { marginTop: 6 }]}>
              Or something bigger
            </T>
            <View style={s.bigRow}>
              {big.map(([id, ic, label]) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  onPress={() => {
                    if (id !== 'talk') return pickTool(id);
                    buzz('tap');
                    router.push('/talk');
                  }}
                  style={({ pressed }) => [s.bigB, { backgroundColor: c.scBtn, opacity: pressed ? 0.8 : 1 }]}>
                  <Icon name={ic} size={20} color={c.accentText} />
                  <Text style={[s.bigT, { color: c.ink }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: allTools }} onPress={() => setAllTools(!allTools)} style={s.all} hitSlop={8}>
              <Text style={[s.allT, { color: c.accentText }]}>{allTools ? 'Hide the tools' : 'Every tool'}</Text>
            </Pressable>
            {allTools ? <ToolGrid days={snap.days} tags={tags} fresh={false} night={night} onPick={pickTool} /> : null}
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  /* ---------- the ride ---------- */
  const id = plan[Math.min(at, plan.length - 1)];
  if (shown.current.indexOf(id) < 0) shown.current.push(id);
  const Move = MOVES[id] || MOVES.breathe;
  const slot = rideSlotOf(id);
  const swappable = !!slot && RIDE_SLOTS[slot].filter((x) => x !== 'reasons' || can.words).length > 1;
  const next = (done: boolean) => {
    if (done) setUr({ ...ur, used: ur.used.concat(id) });
    setAt((x) => x + 1);
    buzz(at + 1 >= plan.length ? 'save' : 'tap');
  };
  const passedPill = practice ? null : (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="It passed. Save it."
      onPress={() => save('rode')}
      hitSlop={6}
      style={({ pressed }) => [s.passed, { backgroundColor: c.mint, opacity: pressed ? 0.85 : 1 }]}>
      <Icon name="check" size={16} color={night ? '#0B3B2E' : '#FFFFFF'} />
      <Text style={[s.passedT, { color: night ? '#0B3B2E' : '#FFFFFF' }]}>It passed</Text>
    </Pressable>
  );
  return (
    <SceneFrame title={title} sky={sky} onClose={close} topRight={passedPill}>
      <RideBar t0={ur.t0} mark={practice ? null : mark} on={front} color={moveTint(c, id)} />
      <Stage key={round + '-' + at + '-' + id} dir={at || round ? 1 : 0}>
        <Move on={front} onDone={() => next(true)} />
      </Stage>
      <Dock>
        <View style={s.ctl}>
          <Round
            icon="swap"
            label={swappable ? 'Swap for another ' + (slot === 'mind' ? 'mind' : 'body') + ' move' : 'Nothing to swap'}
            disabled={!swappable}
            onPress={() => {
              setPlan(rideSwap(plan, at, can));
              buzz('tap');
            }}
          />
          <View style={s.mid} accessible accessibilityLabel={'Move ' + (at + 1) + ' of ' + plan.length + ': ' + moveName(id)}>
            <View style={s.segs}>
              {plan.map((x, j) => (
                <View
                  key={j}
                  style={[s.seg, { flexGrow: j === at ? 2.4 : 1, backgroundColor: j < at ? c.ink + '66' : j === at ? moveTint(c, x) : c.ink + '1F' }]}
                />
              ))}
            </View>
            <Text style={[s.segT, { color: c.muted }]} numberOfLines={1}>
              {moveName(id)} · {at + 1} of {plan.length}
            </Text>
          </View>
          <Round icon="next" label={at + 1 >= plan.length ? 'Done with the moves' : 'Next move'} onPress={() => next(false)} />
        </View>
      </Dock>
    </SceneFrame>
  );
}

const moveName = (x: string) => MOVE_NAME[x] || urTool(x)?.name || x;

/* ---------- the end of a ride that passed ---------- */
function Passed({ won, night }: { won: Won; night: boolean }) {
  const c = useSkyTheme(night ? 'night' : 'mint');
  const { snap, tk, update, apply } = useStore();
  const st = useCareSettings();
  const sos = useSos();
  const rec = rideRecord(snap.days, won.mins);
  const week = rideWeek(snap.days, tk);
  const [helped, setHelped] = useState<string | null>(null);
  const [trig, setTrig] = useState<string | null>(null);
  /* practice is offered once, after the first few rides */
  const [askPrac] = useState(() => ridePracticeAsk(snap.days, sos.mem));
  useEffect(() => {
    if (askPrac) sos.setMem((m) => ({ ...m, pracAsk: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const why = rideWhy(helped, won.moves);
  const lesson = why?.l ? (LESSONS as { id: string; title: string }[]).find((l) => l.id === why.l) : null;
  const trigs = (optList('trig', st.opts, { time: null, sel: trig, all: false }).list as [string, string][]).slice(0, 7);
  const mins = won.mins < 1 ? 'under a minute' : won.mins === 1 ? '1 minute' : won.mins + ' minutes';
  const pickHelped = (x: string) => {
    const nx = helped === x ? null : x;
    let s0 = st;
    if (helped) s0 = rateUrTool(s0, helped, -1);
    if (nx) s0 = rateUrTool(s0, nx, 1);
    apply({ st: s0 });
    setHelped(nx);
    buzz('tap');
  };
  const pickTrig = (v: string) => {
    const nx = trig === v ? null : v;
    setTrig(nx);
    update((s) => ({ ...s, days: patchEvent(s.days, won.key, won.id, { trigger: nx && nx !== 'none' ? nx : null }) }));
    buzz('tap');
  };
  const chips: string[] = ['Ride ' + rec.n];
  if (rec.faster && rec.med) chips.push('Faster than your usual ' + rec.med + ' min');
  if (week > 1) chips.push(week + ' this week');
  if (won.gain > 0) chips.push('+' + won.gain + ' points');
  return (
    <SceneFrame title="SOS" sky={night ? 'night' : 'mint'} onClose={close}>
      <WonHero mins={won.mins} />
      <View style={s.wonWords}>
        <T v="title" style={s.c} accessibilityRole="header">
          Ridden out.
        </T>
        <T style={s.c}>It passed in {mins}. You stayed with it, and it went.</T>
      </View>
      <Appear delay={420} style={s.chips}>
        {chips.map((t) => (
          <View key={t} style={[s.chip, { backgroundColor: c.scBtn }]}>
            <Text style={[s.chipT, { color: c.ink }]}>{t}</Text>
          </View>
        ))}
      </Appear>
      <Appear delay={560} style={[s.card, { backgroundColor: c.surface, shadowColor: c.lip }]}>
        {won.moves.length ? (
          <>
            <Text style={[s.q, { color: c.ink }]}>What helped most?</Text>
            <View style={s.wrap} accessibilityRole="radiogroup">
              {won.moves.map((x) => {
                const on = helped === x;
                return (
                  <Pressable
                    key={x}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    onPress={() => pickHelped(x)}
                    style={[s.pick, { backgroundColor: on ? c.accent : c.accentSoft }]}>
                    <Icon name={MOVE_ICON[x] || urTool(x)?.ic || 'check'} size={16} color={on ? c.accentInk : c.accentText} />
                    <Text style={[s.pickT, { color: on ? c.accentInk : c.accentText }]}>{moveName(x)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}
        {why ? (
          <Appear key={why.id} by={4} duration={220} style={{ gap: 4 }}>
            <T v="small" style={{ lineHeight: 20 }}>
              {why.t}
            </T>
            {lesson ? (
              <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })} hitSlop={8}>
                <Text style={[s.lesson, { color: c.accentText }]}>Later, when it is calm: {lesson.title} ›</Text>
              </Pressable>
            ) : null}
          </Appear>
        ) : null}
        {won.moves.length || why ? <View style={[s.rule, { backgroundColor: c.line }]} /> : null}
        <Text style={[s.q, { color: c.ink }]}>
          What set it off? <Text style={[s.opt, { color: c.muted }]}>Optional</Text>
        </Text>
        <View style={s.wrap}>
          {trigs.map(([v, label]) => {
            const on = trig === v;
            return (
              <Pressable
                key={v}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => pickTrig(v)}
                style={[s.pick, { backgroundColor: on ? c.ink : c.bg }]}>
                <Text style={[s.pickT, { color: on ? c.surface : c.ink }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Appear>
      {askPrac ? (
        <T v="small" tone="muted" style={s.c}>
          Tip: run a practice ride on a calm day (Learn, then Tools). Practiced calm, it comes easier when it counts.
        </T>
      ) : null}
      <Dock>
        <Button label="Done" onPress={close} />
      </Dock>
    </SceneFrame>
  );
}

/** where each shape of the burst around the ring lands: x, y from the middle, its kind, its turn */
const BURST: [number, number, ShapeKind, number][] = [
  [-112, -30, 'cookie4', 12],
  [-84, 62, 'heart', -10],
  [-30, -98, 'sunny', 0],
  [44, -96, 'clover4', 20],
  [110, -18, 'gem', 10],
  [92, 66, 'softBurst', 4],
];

/** the top of "Ridden out": the time line closed into a ring, with the minutes it took in the middle */
function WonHero({ mins }: { mins: number }) {
  const c = useTheme();
  const reduce = useReducedMotion();
  /* a few shapes spring out from behind the ring and settle around it, once */
  const fly = useRef(BURST.map(() => new Animated.Value(reduce ? 1 : 0))).current;
  useEffect(() => {
    if (reduce) return;
    Animated.stagger(
      50,
      fly.map((v) => Animated.spring(v, { toValue: 1, ...SPRING.default, delay: 120, useNativeDriver: NATIVE })),
    ).start();
  }, [reduce, fly]);
  const tints = [c.mint, c.sun, c.sky, c.coral, c.violet, c.sun2];
  return (
    <Appear by={0} duration={360} style={s.hero}>
      {BURST.map((b, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            s.burst,
            {
              opacity: fly[i],
              transform: [
                { translateX: fly[i].interpolate({ inputRange: [0, 1], outputRange: [0, b[0]] }) },
                { translateY: fly[i].interpolate({ inputRange: [0, 1], outputRange: [0, b[1]] }) },
                { rotate: fly[i].interpolate({ inputRange: [0, 1], outputRange: ['-90deg', b[3] + 'deg'] }) },
              ],
            },
          ]}>
          <Shape kind={b[2]} size={22} color={tints[i % tints.length]} />
        </Animated.View>
      ))}
      <WavyRing size={150} p={1} color={c.mint} track={c.mint + '33'} stroke={6}>
        <View style={{ alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[s.heroN, { color: c.ink }]}>{mins < 1 ? '<1' : mins}</Text>
          <Text style={[s.heroU, { color: c.muted }]}>{mins <= 1 ? 'minute' : 'minutes'}</Text>
        </View>
      </WavyRing>
    </Appear>
  );
}

/* ---------- the end of a practice ride ---------- */
function PracticeDone({ sky, level }: { sky: 'night' | 'violet'; level: number }) {
  const { tk, update } = useStore();
  const sos = useSos();
  const done = () => {
    /* a practice ride is a calm move on today's log, like a tool */
    update((s) => {
      if (!s.settings) return s;
      const day = changeDay(s.days[tk], tk, (d) => {
        const p = d.p || blankP();
        p.c = Math.min(50, p.c + 1);
        if (p.tl.indexOf('breathe') < 0) p.tl.push('breathe');
        d.p = p;
      });
      return { ...s, days: withDay(s.days, tk, day) };
    });
    sos.setMem((m) => ({ ...m, prac: (typeof m.prac === 'number' ? m.prac : 0) + 1 }));
    buzz('save');
    close();
  };
  return (
    <SceneFrame title="Practice" sky={sky} onClose={close}>
      <Finish level={level} size={130} title="Practice done." text="Run it while calm, and it runs itself when it counts. Same three moves, every time." />
      <Dock>
        <Button label="Done" onPress={done} />
      </Dock>
    </SceneFrame>
  );
}

/** a round button at the side of the ride's controls */
function Round({ icon, label, onPress, disabled }: { icon: string; label: string; onPress: () => void; disabled?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [s.round, { backgroundColor: c.scBtn, opacity: disabled ? 0.35 : pressed ? 0.7 : 1 }]}>
      <Icon name={icon} size={22} color={c.ink} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  passed: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingLeft: 11, paddingRight: 13, borderRadius: 18 },
  passedT: { fontFamily: font.bodyBold, fontSize: 14 },
  ctl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  round: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, gap: 7, alignItems: 'center' },
  segs: { flexDirection: 'row', gap: 5, alignSelf: 'stretch' },
  seg: { flex: 1, height: 6, borderRadius: 3 },
  segT: { fontFamily: font.bodySemi, fontSize: 13.5 },
  did: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  didP: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 9, paddingRight: 11, minHeight: 30, borderRadius: 15 },
  didT: { fontFamily: font.bodySemi, fontSize: 13.5 },
  bigRow: { flexDirection: 'row', gap: 8 },
  bigB: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 70, paddingHorizontal: 6, borderRadius: 18 },
  bigT: { fontFamily: font.bodySemi, fontSize: 13, textAlign: 'center' },
  all: { alignSelf: 'center', minHeight: 36, justifyContent: 'center' },
  allT: { fontFamily: font.bodySemi, fontSize: 14.5, textDecorationLine: 'underline' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  chip: { paddingHorizontal: 12, minHeight: 30, justifyContent: 'center', borderRadius: 15 },
  chipT: { fontFamily: font.bodyBold, fontSize: 13.5 },
  card: {
    alignSelf: 'stretch',
    gap: 10,
    padding: 16,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  q: { fontFamily: font.display, fontSize: 18, lineHeight: 23 },
  opt: { fontFamily: font.body, fontSize: 13 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 38, paddingHorizontal: 13, borderRadius: 19 },
  pickT: { fontFamily: font.bodySemi, fontSize: 14.5 },
  lesson: { fontFamily: font.bodySemi, fontSize: 13.5 },
  rule: { height: 1, marginVertical: 2 },
  rec: { alignItems: 'center', gap: 2, maxWidth: 300 },
  recN: { fontFamily: font.displayBold, fontSize: 56, lineHeight: 62, fontVariant: ['tabular-nums'] },
  hero: { alignItems: 'center', justifyContent: 'center', paddingTop: 6, height: 190, alignSelf: 'stretch' },
  burst: { position: 'absolute', left: '50%', top: '50%', marginLeft: -11, marginTop: -11 },
  heroN: { fontFamily: font.displayBold, fontSize: 48, lineHeight: 52, fontVariant: ['tabular-nums'] },
  heroU: { fontFamily: font.bodySemi, fontSize: 14 },
  wonWords: { alignItems: 'center', gap: 4 },
});
