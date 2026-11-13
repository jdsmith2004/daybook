/* One urge ridden out, one ending (the UX audit of October 27, 2026). The ride's "It passed", the 10-minute pause's "It
   passed" and Already happened's "I rode it out" all end on this page, so riding out an urge feels the same wherever it
   is logged. Rebuilt on November 13, 2026 (the owner: "the screen just doesn't match the app and doesn't look that good"):
   it is Daybook's night, the same as the lesson finish, a proud moment and nothing else. Beats, one at a time: the opener
   (the band, the flame huge, "Rode it out!", confetti) hands the flame over, and it stands big on the night with gold stars
   twinkling; the headline that names what this one proved rises (core rodeHeadline: "You rode it out. Now you know you can."
   the first time); the lines fill as gold stars fly into them (the urges ridden out toward the next small mark, and the
   points into the level); then the two questions come up low, with no card around them: what helped (the moves of an SOS,
   with one line on why that one works and its lesson for later, or what you did, for one logged afterwards) and what set it
   off. Each answer is one tap or none, and saved as it is tapped. Done comes in last, pinned at the bottom, with Undo under
   it for an entry logged by hand. With celebrations off or Reduce Motion, the same page, all in place at once. */
import {
  didIds,
  didToggle,
  habitOf,
  optList,
  patchEvent,
  rateUrTool,
  rideRecord,
  ridePracticeAsk,
  rideWhy,
  rodeHeadline,
  urTool,
  type DayKey,
  lessonFor,
  noneTail,
  gameCompute,
  levelOf,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Link } from '@/components/choices';
import { Appear } from '@/components/appear';
import { BigFlame } from '@/components/big-flame';
import { FutureInvite, useFutureInvite } from '@/components/future-invite';
import { MOVE_ICON, MOVE_NAME } from '@/components/ride/moves';
import { Packed } from '@/components/packed';
import { btnStyle, Meter, meterTime, Sparkles, type MeterSpec } from '@/components/reward-kit';
import { Opener } from '@/components/opener';
import { SceneFrame } from '@/components/scene';
import { Text } from '@/components/text';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useFuture } from '@/lib/future';
import { close, closeAll } from '@/lib/nav';
import { useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, useSkyTheme } from '@/lib/theme';

/** an urge ridden out, as saved: the entry, how long it took (when SOS or the pause measured it), the moves done in SOS, and
    the points it earned */
export interface Rode {
  key: DayKey;
  id: string;
  mins: number | null;
  /** the moves and tools of an SOS (What helped most?); none asks what you did instead */
  moves: string[];
  gain: number;
  /** ridden out in SOS: the practice ride can be suggested once */
  sos?: boolean;
}

const moveName = (x: string) => MOVE_NAME[x] || urTool(x)?.name || x;

/* `night` is kept for the callers: the page is always on the night now */
type RodeProps = { won: Rode; night?: boolean; level: number; title?: string; onUndo?: () => void };

/** the ending: first the big opener every win gets (components/opener.tsx: the band, the flame huge, "Rode it out!", confetti),
    then this page shows under it as it leaves. With celebrations off or Reduce Motion, the page alone, as before. */
export function RodeOut(props: RodeProps) {
  const st = useCareSettings();
  const still = useReducedMotion();
  const [stage, setStage] = useState<0 | 1 | 2>(() => (st.celebrate === false || still ? 2 : 0));
  return (
    <View style={s.full}>
      {stage > 0 ? <RodeOutPage {...props} after={stage > 0 && !(st.celebrate === false || still)} /> : null}
      {stage < 2 ? <Opener level={props.level} shout="Rode it out!" onLeave={() => setStage(1)} onEnd={() => setStage(2)} /> : null}
    </View>
  );
}

function RodeOutPage({ won, level, title = 'SOS', onUndo, after }: RodeProps & { after: boolean }) {
  const c = useSkyTheme('night');
  const win = useWindowDimensions();
  const { snap, tk, update, apply } = useStore();
  const st = useCareSettings();
  const sos = useSos();
  const ev = snap.days[won.key]?.events.find((e) => e.id === won.id) || null;
  /* the record as it was when it passed: this ride is already in it */
  const [rec] = useState(() => rideRecord(snap.days, won.mins ?? 0));
  /* one headline that names what this one proved (core rodeHeadline): the first ever, a comeback in the days after a slip, the
     fifth, or one inside the hardest hours */
  const [head] = useState(() => rodeHeadline(snap.days, st, won.key, won.id));
  const [helped, setHelped] = useState<string | null>(null);
  const [trig, setTrig] = useState<string | null>(() => ev?.trigger || null);
  /* practice is offered once, after the first few rides in SOS */
  const [askPrac] = useState(() => !!won.sos && ridePracticeAsk(snap.days, sos.mem));
  useEffect(() => {
    if (askPrac) sos.setMem((m) => ({ ...m, pracAsk: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* Future you: a win is the moment to leave a note for the next hard one (core futureAsk decides how often) */
  const invite = useFutureInvite();
  const firstNote = useFuture().notes.length === 0;
  const cel = st.celebrate !== false;
  /* the beats play only after the opener; with celebrations off or Reduce Motion everything is in place at once */
  const still = !after;
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!cel) return void buzz('save');
    if (still) return void buzz('lit');
    /* the opener had its burst; as it leaves, the flame it handed over leaps once */
    const t0 = setTimeout(() => setPulse(1), 250);
    return () => clearTimeout(t0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const why = won.moves.length ? rideWhy(helped, won.moves) : null;
  const lesson = why?.l ? lessonFor(why.l, st) : null;
  const trigs = (optList('trig', st.opts, { time: ev?.time || null, sel: trig, all: false, habit: habitOf(st) }).list as [string, string][]).slice(0, 7);
  const did = didIds(ev?.did);
  /* what you did, for one logged afterwards ("Something else" says nothing, so it is left out here) */
  const dids = won.moves.length
    ? []
    : (optList('did', st.opts, { sel: did, all: false }).list as [string, string][]).filter(([v]) => v !== 'else' || did.indexOf(v) >= 0);
  const pickHelped = (x: string) => {
    const nx = helped === x ? null : x;
    let s0 = st;
    if (helped) s0 = rateUrTool(s0, helped, -1);
    if (nx) s0 = rateUrTool(s0, nx, 1);
    apply({ st: s0 });
    setHelped(nx);
    buzz('tap');
  };
  const pickDid = (v: string) => {
    const nx = didToggle(ev?.did, v);
    update((s) => ({ ...s, days: patchEvent(s.days, won.key, won.id, { did: nx.length ? nx : null }) }));
    buzz('tap');
  };
  const pickTrig = (v: string) => {
    const nx = trig === v ? null : v;
    setTrig(nx);
    update((s) => ({ ...s, days: patchEvent(s.days, won.key, won.id, { trigger: nx && nx !== 'none' ? nx : null }) }));
    buzz('tap');
  };

  const mins = won.mins == null ? '' : won.mins < 1 ? 'under a minute' : won.mins === 1 ? '1 minute' : won.mins + ' minutes';
  const faster = won.mins != null && rec.faster && rec.med ? 'Faster than your usual ' + rec.med + ' minutes.' : '';
  const sub = (mins ? 'It passed in ' + mins + '. ' : '') + (faster || 'Every one you ride out makes the next one easier.');
  /* the lines, the way the lesson finish shows them (the owner, November 13, 2026: "i liked the previous celebration lines"):
     the urges ridden out, toward the next small mark (5, 15, 40, then every ten), and the points filling the level line,
     turning over when they make a new level. The very first ride has no line of its own: "1 of 1" says nothing the
     headline does not. */
  const [lines] = useState<MeterSpec[]>(() => {
    const n = rec.n;
    const goal = [1, 5, 15, 40].find((x) => x >= n) ?? Math.ceil(n / 10) * 10;
    const out: MeterSpec[] =
      goal > 1
        ? [
            {
              label: 'Ridden out',
              right: n + ' of ' + goal,
              from: Math.max(0, n - 1) / goal,
              to: n / goal,
              stars: 3,
              a11y: n + ' urges ridden out, of ' + goal,
            },
          ]
        : [];
    if (won.gain > 0 && snap.settings) {
      const pts = gameCompute(snap.days, snap.settings, snap.reviews, tk).pts;
      const was = levelOf(Math.max(0, pts - won.gain));
      const now = levelOf(pts);
      const right = '+' + won.gain + ' points';
      out.push(
        now.n > was.n
          ? { label: 'Level ' + was.n, right, from: was.frac, to: 1, next: { label: 'Level ' + now.n, right, to: now.frac }, stars: 5 }
          : { label: 'Level ' + now.n, right, from: was.frac, to: now.frac, stars: 4 },
      );
    }
    return out;
  });
  /* the beats: the flame is already there (the opener handed it over), the headline rises, the lines fill one after another,
     then the questions come up low, and Done comes in last */
  const T_HEAD = 150;
  const T_LINES = 650;
  const lineAt = lines.map((_, i) => T_LINES + lines.slice(0, i).reduce((s0, l) => s0 + meterTime(l) - 250, 0));
  const linesEnd = lines.length ? T_LINES + lines.reduce((s0, l) => s0 + meterTime(l) - 250, 0) : T_LINES;
  const T_ASK = still ? 0 : linesEnd;
  const T_DONE = still ? 0 : T_ASK + 450;
  const F = Math.round(Math.min(win.width - 150, win.height * 0.25, 230));

  const pick = (on: boolean) => [s.pick, { backgroundColor: on ? c.accent : c.accentSoft }];
  const pickT = (on: boolean) => [s.pickT, { color: on ? c.accentInk : c.accentText }];
  return (
    <SceneFrame
      title={title}
      sky="night"
      onClose={close}
      pin={
        <Appear delay={T_DONE} by={16} duration={still ? 0 : 320} style={s.pinCol}>
          {/* the gold button with its lip, the one way on from an earned moment (the lesson finish, a level) */}
          <Pressable accessibilityRole="button" onPress={closeAll}>
            {({ pressed }) => (
              <View style={[btnStyle.btn, pressed && btnStyle.down]}>
                <Text style={btnStyle.text}>Done</Text>
              </View>
            )}
          </Pressable>
          {onUndo ? (
            <View style={s.c}>
              <Link label="Undo this entry" tone="muted" onPress={onUndo} />
            </View>
          ) : null}
        </Appear>
      }>
      {/* the flame, standing big on the night with gold stars twinkling around it, as at the end of a lesson */}
      <View style={[s.flame, { width: F, height: F }]} accessible accessibilityRole="image" accessibilityLabel={'Your flame, level ' + level}>
        <Sparkles size={F} at={still ? 0 : 200} still={still || !cel} />
        <BigFlame level={level} size={F} pulse={pulse} noLand label="" />
      </View>
      <Appear delay={still ? 0 : T_HEAD} by={12} duration={still ? 0 : 380} style={s.words}>
        <T v="title" style={s.center} accessibilityRole="header">
          {head.h}
        </T>
        <T style={[s.center, { color: c.muted }]}>{sub}</T>
      </Appear>
      {lines.length ? (
        <View style={s.lines}>
          {lines.map((l, i) => (
            <Meter key={l.label} m={l} at={lineAt[i]} still={still} />
          ))}
        </View>
      ) : null}
      <Appear delay={T_ASK} by={20} duration={still ? 0 : 400} style={s.ask}>
        {won.moves.length ? (
          <View style={s.group}>
            <Text style={[s.q, { color: c.ink }]}>What helped most?</Text>
            <Packed accessibilityRole="radiogroup">
              {won.moves.map((x) => {
                const on = helped === x;
                return (
                  <Pressable key={x} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => pickHelped(x)} style={pick(on)}>
                    <Icon name={MOVE_ICON[x] || urTool(x)?.ic || 'check'} size={16} color={on ? c.accentInk : c.accentText} />
                    <Text style={pickT(on)}>{moveName(x)}</Text>
                  </Pressable>
                );
              })}
            </Packed>
            {why ? (
              <Appear key={why.id} by={4} duration={220} style={{ gap: 4 }}>
                <T v="small" style={{ lineHeight: 20, color: c.muted }}>
                  {why.t}
                </T>
                {lesson ? (
                  <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })} hitSlop={8}>
                    <Text style={[s.lesson, { color: c.accentText }]}>Later, when it is calm: {lesson.title} ›</Text>
                  </Pressable>
                ) : null}
              </Appear>
            ) : null}
          </View>
        ) : (
          <View style={s.group}>
            <Text style={[s.q, { color: c.ink }]}>
              What helped? <Text style={[s.opt, { color: c.muted }]}>Optional</Text>
            </Text>
            <Packed last={noneTail(dids.map((d) => d[1]))}>
              {dids.map(([v, label]) => {
                const on = did.indexOf(v) >= 0;
                return (
                  <Pressable key={v} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => pickDid(v)} style={pick(on)}>
                    {on ? <Icon name="check" size={15} color={c.accentInk} /> : null}
                    <Text style={pickT(on)}>{label}</Text>
                  </Pressable>
                );
              })}
            </Packed>
          </View>
        )}
        <View style={s.group}>
          <Text style={[s.q, { color: c.ink }]}>
            What set it off? <Text style={[s.opt, { color: c.muted }]}>Optional</Text>
          </Text>
          <Packed last={noneTail(trigs.map((t) => t[1]))}>
            {trigs.map(([v, label]) => {
              const on = trig === v;
              return (
                <Pressable key={v} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => pickTrig(v)} style={pick(on)}>
                  <Text style={pickT(on)}>{label}</Text>
                </Pressable>
              );
            })}
          </Packed>
        </View>
        {invite ? <FutureInvite first={firstNote} /> : null}
        {askPrac ? (
          <T v="small" style={[s.center, { color: c.muted }]}>
            Run a practice ride on a calm day (Learn, then Tools). Practiced calm, it comes easier when it counts.
          </T>
        ) : null}
      </Appear>
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  full: { flex: 1, overflow: 'hidden' },
  c: { alignItems: 'center' },
  center: { textAlign: 'center' },
  pinCol: { gap: 10 },
  flame: { alignSelf: 'center', marginTop: 4 },
  words: { gap: 8, paddingHorizontal: 8 },
  lines: { alignSelf: 'stretch', gap: 14, marginTop: 8 },
  ask: { alignSelf: 'stretch', gap: 24, marginTop: 16 },
  group: { gap: 12 },
  q: { fontFamily: font.display, fontSize: 17, lineHeight: 22 },
  opt: { fontFamily: font.body, fontSize: 13 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 22 },
  pickT: { fontFamily: font.bodySemi, fontSize: 15 },
  lesson: { fontFamily: font.bodySemi, fontSize: 13 },
});
