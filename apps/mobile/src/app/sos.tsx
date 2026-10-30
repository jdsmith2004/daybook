/* SOS: one guided ride that starts on the first tap and keeps going until the urge passes. Nothing is asked first.
   It always opens with the sun (three slow breaths), then the moves take turns (core ride.ts rideNext): squeeze, fit
   the shapes, 5-4-3-2-1, name the feeling, the hour after, say the thought fast, your words. Every move comes round, and
   the ones that work for you come round sooner: the heart says this one helps, Next passes it over, and What helped
   most at the end counts too. A feeling named steers the next move. Each move runs by itself and flows into the next,
   because these skills work like scrolling: the person keeps going until it passes. Nothing asks how it is going. The
   book button under each move opens why it works, with its lesson.
   "It passed" in the corner ends it with the one celebration every urge ridden out gets (components/rode-out.tsx): the
   flame, confetti, how long it took, how many you have ridden out, which move helped most (one tap, and SOS leans on it
   next time), one line on why that move works with its lesson for later, and what set it off (one tap). More (next to it)
   holds the bigger moves (step away, text someone, talk it through, and bed at night), every tool, and I slipped, which
   goes on to Rekindle (log.tsx). A tool picked there runs over SOS; when it is done, SOS asks one quiet question, "How is
   it now?": Better leads on to It passed, Still strong opens the tools again. The X on a tool comes back to the tools.
   The X here just closes. With ?practice=1 it is three moves, for a calm moment, and nothing is saved as an urge. */
import {
  addEvent,
  blankP,
  changeDay,
  famOfWord,
  feelTrigOf,
  gameCompute,
  newUrge,
  rateUrTool,
  RIDE_MOVES,
  rideMark,
  rideNext,
  slipFeltLine,
  urEntry,
  urEvidence,
  urFromYou,
  urLikeOf,
  urMark,
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

import { BigOption, Link } from '@/components/choices';
import { RideBar } from '@/components/ride/bar';
import { MOVE_ICON, MOVE_NAME, MOVES, moveTint } from '@/components/ride/moves';
import { ScienceSheet } from '@/components/ride/science';
import { RodeOut, type Rode } from '@/components/rode-out';
import { Dock, Finish, Middle, SceneFrame, Stage } from '@/components/scene';
import { Shape } from '@/components/shapes';
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

/* the screenshot studio (EXPO_PUBLIC_SHOTS=1, dev only) can open SOS on its finish, a ride that passed (?won=1) */
const SHOTS = process.env.EXPO_PUBLIC_SHOTS === '1';
const SHOT_WON: Rode = { key: '2026-10-16', id: 'shot', mins: 8, moves: ['breathe', 'move', 'ground'], gain: 15, sos: true };

export default function Sos() {
  const { snap, tk, now, update, apply } = useStore();
  /* late at night the screens go dark */
  const night = urNight(new Date(now).getHours());
  const sky = night ? 'night' : 'violet';
  const c = useSkyTheme(sky);
  const sos = useSos();
  const st = useCareSettings();
  const voice = useVoice();
  const { practice: pq, won: wq } = useLocalSearchParams<{ practice?: string; won?: string }>();
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
  const [won, setWon] = useState<Rode | null>(() => (SHOTS && wq === '1' ? SHOT_WON : null));
  const [more, setMore] = useState(false);
  const [sci, setSci] = useState(false);
  /* "How is it now?" after a tool, answered Better: It passed is the next step */
  const [better, setBetter] = useState(false);
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

  /* back from a tool's X: the tools open again, to pick another (docs/design-standards.md, "The X goes one step back") */
  useEffect(() => {
    if (!front || !ur || ur.step !== 'tools') return;
    setUr({ ...ur, step: 'now' });
    setMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [front, ur?.step]);

  const tags = useMemo(() => urTags(snap.days, st, tk, sos.mem), [snap.days, st, tk, sos.mem]);
  /* how it felt after the last slips, in their own record (core slipFeltLine), for the hour after: never in a practice
     ride, and never in the first 30 seconds */
  const feltLine = useMemo(() => (practice ? null : slipFeltLine(snap.days)), [practice, snap.days]);
  const mark = useMemo(() => rideMark(snap.days), [snap.days]);

  const level = Math.max(1, g.level.n);
  const title = practice ? 'Practice' : 'SOS';

  if (won) return <RodeOut won={won} night={night} level={level} />;
  if (practice && seq.length > PRACTICE_N) return <PracticeDone sky={sky} level={level} />;
  if (!ur || !seq.length)
    return (
      <SceneFrame title={title} sky={sky} onClose={close}>
        {null}
      </SceneFrame>
    );

  /* It passed (in the corner, any time), or I slipped (under More): every move done since the last answer goes into the
     entry's rounds */
  const save = (v: 'rode' | 'slipped') => {
    const a: UrState = urMark(ur, v === 'rode' ? 'p' : 'x');
    const e = urEntry(a, v, st, Date.now());
    let id = '';
    let gain = 0;
    update((s) => {
      const r = addEvent(s.days, e.key, v, e.time, e.fields);
      id = r.id;
      if (s.settings) gain = gameCompute(r.days, s.settings, s.reviews, tk).pts - gameCompute(s.days, s.settings, s.reviews, tk).pts;
      return { ...s, days: r.days };
    });
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
          step: 'slHold',
          from: 'urge',
          pts0: String(a.p0),
          m: String(e.mins),
          night: night ? '1' : '',
        },
      });
      return;
    }
    setWon({ key: e.key, id, mins: e.mins, moves: a.used.filter((x, i, l) => l.indexOf(x) === i), gain, sos: true });
    sos.end();
  };

  /* any tool, from More: it opens over SOS, and the ride goes on where it was when the tool is done */
  const pickTool = (id: string) => {
    if (!urTool(id)) return;
    setMore(false);
    buzz('tap');
    router.push({ pathname: '/tool/[id]', params: { id } });
  };

  /* ---------- after a tool: how is it now? ---------- */
  if (!practice && ur.step === 'after') {
    const last = ur.used[ur.used.length - 1] || '';
    const rec = urEvidence(snap.days);
    return (
      <SceneFrame title={title} sky={sky} onClose={close}>
        <RideBar t0={ur.t0} mark={mark} on={front && !more} color={c.mint} />
        <Stage key={better ? 'better' : 'ask'} dir={better ? 1 : 0}>
          {better ? (
            <>
              <T v="title" style={s.c} accessibilityRole="header">
                That is the urge easing.
              </T>
              <T style={s.c}>When it has passed, say so. Each one you wait out makes the next one easier.</T>
              <Middle>
                <Shape kind="cookie12" size={150} color={c.mintSoft}>
                  <View>
                    <Icon name="wave" size={60} color={c.mintText} />
                  </View>
                </Shape>
              </Middle>
              <Dock>
                <Button label="It passed" onPress={() => save('rode')} />
                <View style={s.center}>
                  <Link
                    label="Keep going"
                    tone="muted"
                    onPress={() => {
                      buzz('tap');
                      setBetter(false);
                      setUr({ ...ur, step: 'now' });
                    }}
                  />
                </View>
              </Dock>
            </>
          ) : (
            <>
              <T v="eyebrow" tone="muted" style={s.c}>
                {moveName(last) + ', done'}
              </T>
              <T v="title" style={s.c} accessibilityRole="header">
                How is it now?
              </T>
              <T tone="muted" style={s.c}>
                {rec.n
                  ? 'You have ridden out ' + rec.n + (rec.n === 1 ? ' urge' : ' urges') + (rec.med ? '. Yours usually pass in about ' + rec.med + ' min.' : '.')
                  : 'Urges rise, peak and pass.'}
              </T>
              <Middle>
                <Shape kind="cookie9" size={150} color={moveTint(c, last) + '33'}>
                  <View>
                    <Icon name={MOVE_ICON[last] || urTool(last)?.ic || 'check'} size={60} color={c.ink} />
                  </View>
                </Shape>
              </Middle>
              <Dock>
                <BigOption
                  tone="mint"
                  icon="wave"
                  title="Better"
                  sub="It is easing."
                  onPress={() => {
                    buzz('tap');
                    setBetter(true);
                  }}
                />
                <BigOption
                  tone="sun"
                  icon="timer"
                  title="Still strong"
                  sub="Pick another tool."
                  onPress={() => {
                    buzz('tap');
                    setUr({ ...urMark(ur, 's'), step: 'now' });
                    setMore(true);
                  }}
                />
              </Dock>
            </>
          )}
        </Stage>
      </SceneFrame>
    );
  }

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
  /* Talk it through at every hour (a slip that feels planned is most often planned at night), and Go to bed too at night */
  const big: [string, string, string][] = [
    ['pause', 'timer', 'Step away 10 min'],
    ['message', 'chat', 'Text someone'],
    ['talk', 'ask', 'Talk it through'],
    ...(night ? ([['bed', 'moon', 'Go to bed']] as [string, string, string][]) : []),
  ];
  return (
    <SceneFrame title={title} sky={sky} onClose={close} topRight={top}>
      <RideBar t0={ur.t0} mark={practice ? null : mark} on={front && !more && !sci} color={moveTint(c, id)} />
      <Stage key={n + '-' + id} dir={n > 1 ? 1 : 0}>
        <Move
          on={front && !more && !sci}
          onDone={() => next(true)}
          onFeel={(f) => {
            /* a feeling names the trigger only when it plainly is one (core feelTrigOf: never shame as stress) */
            const trig = f.trig ? feelTrigOf(famOfWord(f.w)) : null;
            if (trig && !ur.trigger) setUr({ ...ur, trigger: trig });
            lead.current = f.lead && RIDE_MOVES.indexOf(f.lead) >= 0 ? f.lead : null;
          }}
          onTool={pickTool}
          felt={feltLine && Date.now() - ur.t0 >= FELT_AFTER ? feltLine : null}
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
              style={({ pressed }) => [s.bigB, big.length > 3 && s.bigB2, { backgroundColor: c.bg, opacity: pressed ? 0.8 : 1 }]}>
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
/** the record of how it felt after slips is never shown before this far into an SOS */
const FELT_AFTER = 30000;

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  passed: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 36, paddingLeft: 11, paddingRight: 13, borderRadius: 18 },
  passedT: { fontFamily: font.bodyBold, fontSize: 15 },
  ctl: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  round: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, gap: 7, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center', height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  segT: { fontFamily: font.bodySemi, fontSize: 15 },
  why: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  whyT: { fontFamily: font.bodySemi, fontSize: 13 },
  center: { alignItems: 'center' },
  bigRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bigB: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 70, paddingHorizontal: 6, borderRadius: 20 },
  /* four of them (at night): two rows of two */
  bigB2: { flexBasis: '45%', flexDirection: 'row', minHeight: 56, gap: 8 },
  bigT: { fontFamily: font.bodySemi, fontSize: 13, textAlign: 'center' },
  topR: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moreB: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moreWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,10,40,0.38)' },
  moreSheet: { maxHeight: '86%', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 16, paddingTop: 10 },
  moreTop: { height: 40, alignItems: 'center', justifyContent: 'center' },
  grab: { width: 40, height: 5, borderRadius: 3 },
  moreX: { position: 'absolute', right: 0, top: 2, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  moreH: { fontFamily: font.display, fontSize: 17, lineHeight: 22, marginTop: 4 },
  slip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, marginTop: 6 },
  slipT: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
});
