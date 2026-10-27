/* SOS: one guided ride that starts on the first tap and keeps going until the urge passes. Nothing is asked first.
   It always opens with the sun (three slow breaths), then the moves take turns (core ride.ts rideNext): squeeze, fit
   the shapes, 5-4-3-2-1, name the feeling, the hour after, say the thought fast, your words. Every move comes round, and
   the ones that work for you come round sooner: the heart says this one helps, Next passes it over, and What helped
   most at the end counts too. A feeling named steers the next move. Each move runs by itself and flows into the next,
   because these skills work like scrolling: the person keeps going until it passes. Nothing asks how it is going. The
   book button under each move opens why it works, with its lesson.
   "It passed" in the corner ends it with a big celebration: the flame, confetti, how long it took, how many you have
   ridden out, which move helped most (one tap, and SOS leans on it next time), one line on why that move works with its
   lesson for later, and what set it off (one tap). More (next to it) holds the bigger moves (step away, text someone,
   talk it through, bed at night), every tool, and I slipped, which goes on to Rekindle (log.tsx). The X just closes.
   With ?practice=1 it is three moves, for a calm moment, and nothing is saved as an urge. */
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
  RIDE_MOVES,
  rideMark,
  rideNext,
  ridePracticeAsk,
  rideRecord,
  rideWeek,
  rideWhy,
  rkStepFor,
  urEntry,
  urFromYou,
  urLikeOf,
  urNight,
  urNote,
  urTags,
  urTool,
  urWon,
  withDay,
  type UrState,
} from '@daybook/core';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { RideBar } from '@/components/ride/bar';
import { MOVE_ICON, MOVE_NAME, MOVES, moveTint } from '@/components/ride/moves';
import { ScienceSheet } from '@/components/ride/science';
import { Dock, Finish, SceneFrame, Stage } from '@/components/scene';
import { Confetti } from '@/components/celebrate';
import { Text } from '@/components/text';
import { ToolGrid } from '@/components/tool-grid';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close, closeAll } from '@/lib/nav';
import { count } from '@/lib/pulse';
import { setupKeep } from '@/lib/setup-keep';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, NightContext, useSkyTheme, useTheme } from '@/lib/theme';
import { useVoice } from '@/lib/voice';

/** what the end of a ride that passed shows: the entry it saved, how long it took, the moves done, the points it earned */
interface Won {
  key: string;
  id: string;
  mins: number;
  moves: string[];
  gain: number;
  /* the trigger already saved (from a feeling named in the ride) */
  trig: string | null;
}

export default function Sos() {
  const { snap, tk, now, update, apply } = useStore();
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

  /* the ride: every move shown in this SOS, oldest first; the last one is showing */
  const [seq, setSeq] = useState<string[]>([]);
  const [won, setWon] = useState<Won | null>(null);
  const [more, setMore] = useState(false);
  const [sci, setSci] = useState(false);
  /* the move a feeling just named points to: it comes next */
  const lead = useRef<string | null>(null);

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
      if (began.current && !open.current) closeAll();
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
  /* the first move, once there is an urge: always the sun */
  useEffect(() => {
    if (!ur || seq.length) return;
    setSeq([rideNext(ur, snap.days, st, tk, Date.now(), sos.mem, can, [])]);
  }, [ur, seq.length, snap.days, st, tk, sos.mem, can]);

  const tags = useMemo(() => urTags(snap.days, st, tk, sos.mem), [snap.days, st, tk, sos.mem]);
  const mark = useMemo(() => rideMark(snap.days), [snap.days]);

  const level = Math.max(1, g.level.n);
  const title = practice ? 'Practice' : 'SOS';

  if (won) return <Passed won={won} night={night} level={level} />;
  if (practice && seq.length > PRACTICE_N) return <PracticeDone sky={sky} level={level} />;
  if (!ur || !seq.length)
    return (
      <SceneFrame title={title} sky={sky} onClose={close}>
        {null}
      </SceneFrame>
    );

  /* It passed (in the corner, any time), or I slipped (under More): every move done goes into the entry's rounds */
  const save = (v: 'rode' | 'slipped') => {
    const code = v === 'rode' ? 'p' : 'x';
    const a: UrState = { ...ur, rounds: ur.rounds.concat(ur.used.map((id) => [id, code] as [string, 'p' | 's' | 'x'])).slice(0, 8) };
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
    setMore(false);
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
    setWon({
      key: e.key,
      id,
      mins: e.mins,
      moves: a.used.filter((x, i, l) => l.indexOf(x) === i),
      gain,
      trig: a.trigger && a.trigger !== 'none' ? a.trigger : null,
    });
    sos.end();
  };

  /* any tool, from More: it opens over SOS, and the ride goes on where it was when the tool is done */
  const pickTool = (id: string) => {
    if (!urTool(id)) return;
    setMore(false);
    buzz('tap');
    router.push({ pathname: '/tool/[id]', params: { id } });
  };

  /* ---------- the ride: one move after another, until it passes ---------- */
  const id = seq[seq.length - 1];
  const Move = MOVES[id] || MOVES.breathe;
  const n = seq.length;
  /* done: it counts as used; passed over with Next: it comes round a little later from now on (sos.ts urNote) */
  const next = (done: boolean) => {
    const u = done ? { ...ur, used: ur.used.concat(id) } : ur;
    if (done) setUr(u);
    else if (!practice) sos.setMem((m) => urNote(m, id, null));
    buzz('tap');
    if (practice && n >= PRACTICE_N) return setSeq(seq.concat('end'));
    const nx = rideNext(u, snap.days, st, tk, Date.now(), sos.mem, can, seq, lead.current);
    lead.current = null;
    setSeq(seq.concat(nx));
  };
  /* the heart: this one helps. It comes round sooner, in this SOS and the next ones (sos.ts urRank) */
  const liked = urLikeOf(st, id) > 0;
  const like = () => {
    apply({ st: rateUrTool(st, id, liked ? -1 : 1) });
    buzz(liked ? 'tap' : 'save');
  };
  const top = practice ? null : (
    <View style={s.topR}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More: other tools, someone to talk to, or I slipped"
        onPress={() => {
          setMore(true);
          buzz('tap');
        }}
        hitSlop={6}
        style={({ pressed }) => [s.moreB, { backgroundColor: c.scBtn, opacity: pressed ? 0.7 : 1 }]}>
        <Icon name="more" size={20} color={c.ink} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="It passed. Save it."
        onPress={() => save('rode')}
        hitSlop={6}
        style={({ pressed }) => [s.passed, { backgroundColor: c.mint, opacity: pressed ? 0.85 : 1 }]}>
        <Icon name="check" size={16} color={night ? '#0B3B2E' : '#FFFFFF'} />
        <Text style={[s.passedT, { color: night ? '#0B3B2E' : '#FFFFFF' }]}>It passed</Text>
      </Pressable>
    </View>
  );
  const big: [string, string, string][] = [
    ['pause', 'timer', 'Step away 10 min'],
    ['message', 'chat', 'Text someone'],
    night ? ['bed', 'moon', 'Go to bed'] : ['talk', 'ask', 'Talk it through'],
  ];
  return (
    <SceneFrame title={title} sky={sky} onClose={close} topRight={top}>
      <RideBar t0={ur.t0} mark={practice ? null : mark} on={front && !more && !sci} color={moveTint(c, id)} />
      <Stage key={n + '-' + id} dir={n > 1 ? 1 : 0}>
        <Move
          on={front && !more && !sci}
          onDone={() => next(true)}
          onFeel={(f) => {
            if (f.trig && !ur.trigger) setUr({ ...ur, trigger: f.trig });
            lead.current = f.lead && RIDE_MOVES.indexOf(f.lead) >= 0 ? f.lead : null;
          }}
          onTool={pickTool}
        />
      </Stage>
      <Dock>
        <View style={s.ctl}>
          <Round icon="heart" label={liked ? 'This one helps. Tap to undo.' : 'This one helps'} on={liked} onPress={like} />
          <Pressable
            style={s.mid}
            accessibilityRole="button"
            accessibilityLabel={'Move ' + n + ': ' + moveName(id) + '. Why it works.'}
            onPress={() => {
              buzz('tap');
              setSci(true);
            }}>
            <View style={s.dots}>
              {seq.slice(-7).map((x, j, l) => (
                <View
                  key={n - l.length + j}
                  style={[s.dot, j === l.length - 1 ? { width: 22, backgroundColor: moveTint(c, x) } : { backgroundColor: c.ink + '40' }]}
                />
              ))}
            </View>
            <Text style={[s.segT, { color: c.ink }]} numberOfLines={1}>
              {moveName(id)}
            </Text>
            <View style={s.why}>
              <Icon name="book" size={13} color={c.muted} />
              <Text style={[s.whyT, { color: c.muted }]}>Why it works</Text>
            </View>
          </Pressable>
          <Round icon="next" label="Next move" onPress={() => next(false)} />
        </View>
      </Dock>
      <ScienceSheet id={id} name={moveName(id)} open={sci} night={night} onClose={() => setSci(false)} />
      <More open={more} night={night} onClose={() => setMore(false)}>
        <Text style={[s.moreH, { color: c.ink }]}>Something bigger</Text>
        <View style={s.bigRow}>
          {big.map(([bid, ic, label]) => (
            <Pressable
              key={bid}
              accessibilityRole="button"
              onPress={() => {
                if (bid !== 'talk') return pickTool(bid);
                setMore(false);
                buzz('tap');
                router.push('/talk');
              }}
              style={({ pressed }) => [s.bigB, { backgroundColor: c.bg, opacity: pressed ? 0.8 : 1 }]}>
              <Icon name={ic} size={20} color={c.accentText} />
              <Text style={[s.bigT, { color: c.ink }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[s.moreH, { color: c.ink }]}>Every tool</Text>
        <ToolGrid days={snap.days} tags={tags} fresh={false} night={night} onPick={pickTool} />
        <Pressable accessibilityRole="button" onPress={() => save('slipped')} style={s.slip} hitSlop={8}>
          <Icon name="leaf" size={16} color={c.slipText} />
          <Text style={[s.slipT, { color: c.slipText }]}>I slipped. A slip is data, not a reset.</Text>
        </Pressable>
      </More>
    </SceneFrame>
  );
}

/** More: a sheet over the ride, with the bigger moves, every tool and I slipped. It slides up from the bottom; the ride
    pauses under it. */
function More({ open, night, onClose, children }: { open: boolean; night: boolean; onClose: () => void; children: ReactNode }) {
  const c = useSkyTheme(night ? 'night' : 'violet');
  const inset = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <NightContext.Provider value={night}>
        <View style={s.moreWrap}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[s.moreSheet, { backgroundColor: c.surface, paddingBottom: inset.bottom + 16 }]}>
            <View style={s.moreTop}>
              <View style={[s.grab, { backgroundColor: c.line }]} />
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8} style={[s.moreX, { backgroundColor: c.bg }]}>
                <Icon name="x" size={18} color={c.ink} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {children}
            </ScrollView>
          </View>
        </View>
      </NightContext.Provider>
    </Modal>
  );
}

const moveName = (x: string) => MOVE_NAME[x] || urTool(x)?.name || x;

/* ---------- the end of a ride that passed ---------- */
function Passed({ won, night, level }: { won: Won; night: boolean; level: number }) {
  const c = useSkyTheme(night ? 'night' : 'mint');
  const { snap, tk, update, apply } = useStore();
  const st = useCareSettings();
  const sos = useSos();
  const rec = rideRecord(snap.days, won.mins);
  const week = rideWeek(snap.days, tk);
  const [helped, setHelped] = useState<string | null>(null);
  const [trig, setTrig] = useState<string | null>(won.trig);
  /* practice is offered once, after the first few rides */
  const [askPrac] = useState(() => ridePracticeAsk(snap.days, sos.mem));
  useEffect(() => {
    if (askPrac) sos.setMem((m) => ({ ...m, pracAsk: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* the celebration: the flame pops in with its burst, confetti bursts out, a run of buzzes, and then a shower falls.
     With celebrations off it is the same page, quietly. */
  const cel = st.celebrate !== false;
  const [rain, setRain] = useState(false);
  useEffect(() => {
    if (!cel) return void buzz('save');
    buzz('lit');
    const t = [
      setTimeout(() => buzz('land'), 170),
      setTimeout(() => buzz('land'), 340),
      setTimeout(() => {
        buzz('lit');
        setRain(true);
      }, 760),
    ];
    return () => t.forEach(clearTimeout);
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
    <View style={{ flex: 1 }}>
      <SceneFrame title="SOS" sky={night ? 'night' : 'mint'} onClose={close}>
        <Finish
          level={level}
          size={170}
          tone="mint"
          alive
          always
          title="You rode it out."
          text={'It passed in ' + mins + '. Every one you ride out makes the next one easier.'}
        />
        <Appear delay={650} style={s.chips}>
          {chips.map((t) => (
            <View key={t} style={[s.chip, { backgroundColor: c.scBtn }]}>
              <Text style={[s.chipT, { color: c.ink }]}>{t}</Text>
            </View>
          ))}
        </Appear>
        <Appear delay={950} by={22} duration={420} style={[s.card, { backgroundColor: c.surface, shadowColor: c.lip }]}>
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
          <Button label="Done" onPress={closeAll} />
        </Dock>
      </SceneFrame>
      {cel ? <Confetti big /> : null}
      {cel && rain ? <Confetti big rain /> : null}
    </View>
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
    closeAll();
  };
  return (
    <SceneFrame title="Practice" sky={sky} onClose={close}>
      <Finish level={level} size={130} title="Practice done." text="Run it while calm, and it runs itself when it counts. It always starts with the sun." />
      <Dock>
        <Button label="Done" onPress={done} />
      </Dock>
    </SceneFrame>
  );
}

/** a round button at the side of the ride's controls; `on` fills it (the heart, once this move helps) */
function Round({ icon, label, onPress, on }: { icon: string; label: string; onPress: () => void; on?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={on === undefined ? undefined : { selected: on }}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [s.round, { backgroundColor: on ? c.coral : c.scBtn, opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
      <Icon name={icon} size={22} color={on ? '#FFFFFF' : c.ink} />
    </Pressable>
  );
}

/** a practice ride is this many moves */
const PRACTICE_N = 3;

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  passed: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingLeft: 11, paddingRight: 13, borderRadius: 18 },
  passedT: { fontFamily: font.bodyBold, fontSize: 14 },
  ctl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  round: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, gap: 7, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center', height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  segT: { fontFamily: font.bodySemi, fontSize: 15 },
  why: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  whyT: { fontFamily: font.bodySemi, fontSize: 12.5 },
  bigRow: { flexDirection: 'row', gap: 8 },
  bigB: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 70, paddingHorizontal: 6, borderRadius: 18 },
  bigT: { fontFamily: font.bodySemi, fontSize: 13, textAlign: 'center' },
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
  topR: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moreB: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moreWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,10,40,0.38)' },
  moreSheet: { maxHeight: '86%', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 18, paddingTop: 10 },
  moreTop: { height: 40, alignItems: 'center', justifyContent: 'center' },
  grab: { width: 40, height: 5, borderRadius: 3 },
  moreX: { position: 'absolute', right: 0, top: 2, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moreH: { fontFamily: font.display, fontSize: 18, lineHeight: 23, marginTop: 4 },
  slip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, marginTop: 6 },
  slipT: { fontFamily: font.bodySemi, fontSize: 14.5, textDecorationLine: 'underline' },
});
