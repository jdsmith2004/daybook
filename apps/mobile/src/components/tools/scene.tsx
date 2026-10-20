/* Change the scene and reach out: Move, Go to bed, Surprise me, What do I need?, Reach a person, My reasons.
   Ported from the legacy SCENES.move, bed, surprise, halt, message and reasons. */
import {
  BED,
  bedPlans,
  blankP,
  changeDay,
  clockOf,
  FREE_LINES,
  gameCompute,
  messageTexts,
  MOVE_MS,
  MOVES,
  MOVES_SIT,
  NEEDS,
  reasonCat,
  safeName,
  urEntry,
  urNight,
  addEvent,
  withDay,
} from '@daybook/core';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/text';

import { Field, Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { fmtMS, useSeconds } from '@/components/orb';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { Appear } from '@/components/appear';
import { PickRow } from '@/components/picks';
import { Dock, Finish, Middle, Stage } from '@/components/scene';
import { Shape, WavyRing, type ShapeKind } from '@/components/shapes';
import { buzz } from '@/lib/feel';
import { play } from '@/lib/sound';
import { useSendText } from '@/components/safe-text';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

import type { ToolProps } from './types';

const copy = (text: string, say: (m: string) => void, ok = 'Copied. Paste it in your messages.') =>
  Clipboard.setStringAsync(text)
    .then(() => say(ok))
    .catch(() => say('Could not copy. Press and hold the text to copy it.'));

/* ---------- move ---------- */
/* the beat a move keeps: two parts that take turns (seconds each), how far the shape shrinks, and the words for each
   part. A squeeze is held for five, then let go; rolls and turns go slow; on your feet it is a livelier, steady pulse. */
type BeatOf = { dur: [number, number]; low: number; words?: [string, string] };
const BEAT_HOLD: BeatOf = { dur: [5, 3], low: 0.74, words: ['Hold', 'Let go'] };
const BEAT_FLOW: BeatOf = { dur: [3, 3], low: 0.86 };
const BEAT_UP: BeatOf = { dur: [0.45, 0.55], low: 0.9 };
/** the seated moves that are a hold and a letting go */
const HOLDS = ['squeeze', 'feet', 'palms', 'toes'];

/** a soft cookie that grows through the first part of the beat and eases back in the second, kept in step with the clock.
    With Reduce Motion on it stays still, and the words (Hold, Let go) still keep the beat. */
function Beat({ beat, sec, color, reduce, children }: { beat: BeatOf; sec: number; color: string; reduce: boolean; children: React.ReactNode }) {
  const [a, b] = beat.dur;
  const cyc = a + b;
  const into = sec % cyc;
  const first = into < a;
  /* which part of which round: changes once per part, and each change starts the next easing */
  const part = Math.floor(sec / cyc) * 2 + (first ? 0 : 1);
  const v = useRef(new Animated.Value(beat.low)).current;
  useEffect(() => {
    if (reduce) return v.setValue(1);
    const left = (first ? a - into : cyc - into) * 1000;
    Animated.timing(v, {
      toValue: first ? 1 : beat.low,
      duration: Math.max(60, left),
      easing: first ? Easing.inOut(Easing.sin) : Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part, reduce]);
  return (
    <View style={s.beat}>
      <Animated.View style={[StyleSheet.absoluteFill, s.beatIn, { transform: [{ scale: v }] }]}>
        <Shape kind="cookie" size={206} color={color} />
      </Animated.View>
      {children}
      {beat.words ? (
        <T v="label" tone="coralText">
          {beat.words[first ? 0 : 1]}
        </T>
      ) : null}
    </View>
  );
}

export function Move({ finish, level }: ToolProps) {
  const c = useTheme();
  const reduce = useReducedMotion();
  const sos = useSos();
  /* in a seat (at work, in a meeting, in a car) or free to get up. Remembered on this device, and a seat is the start,
     because it works anywhere. */
  const sit = sos.mem.moveSit !== false;
  const list = sit ? MOVES_SIT : MOVES;
  const [pick, setPick] = useState<string | null>(null);
  const [m0, setM0] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const sec = useSeconds(m0, !!m0 && !done);
  const left = m0 ? Math.max(0, MOVE_MS - sec * 1000) : MOVE_MS;
  const over = !!m0 && !done && left <= 0;
  useEffect(() => {
    if (!over) return;
    setDone(true);
    buzz('lit');
    play('chime');
  }, [over]);
  if (done)
    return (
      <Stage key="done" dir={0}>
        <Finish
          level={level}
          tone="coral"
          title="Nice. Notice your breath."
          text={
            sit
              ? 'Your body let go a little, and your head had something else to do. That is the point.'
              : 'Your heart is going a little faster, and your head had something else to do. That is the point.'
          }
        />
        <Dock>
          <Button label="Done" onPress={() => finish('move', { msg: 'Body first. Nice work.' })} />
        </Dock>
      </Stage>
    );
  if (!pick)
    return (
      <Stage key="pick" dir={0}>
        <T v="title" style={s.c} accessibilityRole="header">
          Move for 2 minutes.
        </T>
        <T style={s.c}>Body first, decision later. Moving in your seat counts, and no one has to notice.</T>
        <Dock>
          <T v="small" tone="muted" style={s.c}>
            Can you get up right now?
          </T>
          <PickRow
            label="Can you get up right now?"
            list={[
              { k: 'sit', label: 'Not right now' },
              { k: 'up', label: 'Yes' },
            ]}
            cur={sit ? 'sit' : 'up'}
            onPick={(k) => sos.setMem((m) => ({ ...m, moveSit: k === 'sit' }))}
          />
          <Appear key={sit ? 'sit' : 'up'} by={6} duration={240}>
            <View style={s.grid}>
              {list.map(([id, name, sub]) => (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  onPress={() => {
                    setPick(id);
                    setM0(Date.now());
                    buzz('tap');
                  }}
                  style={({ pressed }) => [s.tile, { backgroundColor: c.surface, shadowColor: c.lip, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
                  <Text style={[s.tileT, { color: c.ink }]}>{name}</Text>
                  <Text style={[s.tileS, { color: c.muted }]}>{sub}</Text>
                </Pressable>
              ))}
            </View>
          </Appear>
          <T v="small" tone="muted" style={s.c}>
            {sit ? 'Slow and small still counts. Stop if anything hurts.' : 'Stop if anything hurts. A slow walk counts too.'}
          </T>
        </Dock>
      </Stage>
    );
  const m = list.find((x) => x[0] === pick) || list[0];
  const beat = !sit ? BEAT_UP : HOLDS.indexOf(m[0]) >= 0 ? BEAT_HOLD : BEAT_FLOW;
  return (
    <Stage key="run" dir={1}>
      <Middle>
        <WavyRing size={270} p={1 - left / MOVE_MS} color={c.coral} track={c.line} stroke={9} waves={16} phase={reduce ? 0 : -sec * 0.8}>
          <Beat beat={beat} sec={sec} color={c.surface} reduce={reduce}>
            <T v="label" style={[s.c, { maxWidth: 170 }]}>
              {m[1]}
            </T>
            <Text style={[s.time, { color: c.ink }]}>{fmtMS(left)}</Text>
          </Beat>
        </WavyRing>
        <T v="title" style={s.c} accessibilityRole="header">
          Go.
        </T>
        <T style={s.c}>{m[2]}. Keep going until the ring closes, or stop when you feel the shift.</T>
      </Middle>
      <Dock>
        <Button label="I am done" kind="ghost" onPress={() => setDone(true)} />
      </Dock>
    </Stage>
  );
}

/* ---------- go to bed ---------- */
export function Bed({ finish, combo, now }: ToolProps & { now: number }) {
  const c = useTheme();
  const { snap, tk, update } = useStore();
  const sos = useSos();
  const st = useCareSettings();
  const night = urNight(new Date(now).getHours());
  const plans = bedPlans(st);
  const [tick, setTick] = useState<string[]>([]);
  const [plan, setPlan] = useState(() => (plans.some((x) => x[0] === sos.mem.bedPlan) ? (sos.mem.bedPlan as string) : 'breath'));
  const go = () => {
    const p = plans.find((x) => x[0] === plan);
    const planText = p ? p[1] + '. ' + p[2] : '';
    if (!night) return finish('bed', { msg: 'Ready for tonight.' });
    /* bed, at night: the phone is marked as put away, and the night screen closes things. From SOS it saves the urge as ridden out. */
    let gain = 0;
    const at = clockOf(Date.now());
    update((s) => {
      if (!s.settings) return s;
      const b0 = sos.ur ? sos.ur.p0 : gameCompute(s.days, s.settings, s.reviews, tk).pts;
      let days = s.days;
      if (sos.ur) {
        const ur = sos.ur;
        const first: [string, 'p'][] = ur.comboFrom && !(ur.rounds || []).some((r) => r[0] === ur.comboFrom) ? [[ur.comboFrom, 'p']] : [];
        const sc = { ...ur, used: ur.used.concat('bed'), rounds: (ur.rounds || []).concat(first, [['bed', 'p']]) };
        const e = urEntry(sc, 'rode', s.settings, Date.now());
        days = addEvent(days, e.key, 'rode', e.time, e.fields).days;
        sos.setMem((m) => ({ ...m, last: e.last }));
      }
      const day = changeDay(days[tk], tk, (d) => {
        const q = d.p || blankP();
        q.po = at;
        if (q.tl.indexOf('bed') < 0) q.tl.push('bed');
        q.c = Math.min(50, q.c + 1);
        d.p = q;
      });
      days = withDay(days, tk, day);
      const next = { ...s, days };
      gain = Math.max(0, gameCompute(days, s.settings, s.reviews, tk).pts - b0);
      return next;
    });
    sos.end();
    buzz('save');
    router.dismissAll();
    router.push({ pathname: '/night', params: { at, gain: String(gain), plan: planText } });
  };
  const cur = plans.find((x) => x[0] === plan) || plans[0];
  return (
    <>
      <Shape kind="scallop" size={96} color={c.violetSoft} turn={8}>
        {/* in a View, so on the web it sits over the shape and not under it */}
        <View>
          <Icon name="moon" size={40} color={c.violetText} />
        </View>
      </Shape>
      <T v="title" style={s.c} accessibilityRole="header">
        {night ? 'The best move tonight is sleep.' : 'Practice the bedtime move.'}
      </T>
      <T style={s.c}>
        {night
          ? combo
            ? 'Three things, then a plan for the thoughts.'
            : 'Urges are often harder to resist when you are tired. Three things, then a plan for the thoughts.'
          : 'Late at night this is often the strongest tool. Walk through it now so it is easy later.'}
      </T>
      <Dock>
        <View style={{ alignSelf: 'stretch', gap: 8 }}>
          {BED.map(([id, t, sub]) => {
            const on = tick.indexOf(id) >= 0;
            return (
              <Pressable
                key={id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  setTick(on ? tick.filter((x) => x !== id) : tick.concat(id));
                  buzz('tap');
                }}
                style={[s.check, { backgroundColor: c.surface, borderColor: on ? c.mint : 'transparent' }]}>
                <View style={[s.box, { backgroundColor: on ? c.mint : 'transparent', borderColor: on ? c.mint : c.line }]}>
                  {on ? <Icon name="check" size={16} color="#FFFFFF" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <T v="label">{t}</T>
                  <T v="small" tone="muted">
                    {sub}
                  </T>
                </View>
              </Pressable>
            );
          })}
        </View>
        {/* one plan for the thoughts, picked from a few chips, with the picked one's words under them */}
        <T v="label" style={{ alignSelf: 'flex-start', marginTop: 6 }}>
          If the thoughts get loud in bed
        </T>
        <View style={[s.wrap, { justifyContent: 'flex-start', alignSelf: 'stretch' }]} accessibilityRole="radiogroup">
          {plans.map(([id, t]) => (
            <Chip
              key={id}
              label={t}
              on={plan === id}
              onPress={() => {
                setPlan(id);
                sos.setMem((m) => ({ ...m, bedPlan: id }));
                buzz('tap');
              }}
            />
          ))}
        </View>
        <Appear key={cur[0]} by={4} duration={200} style={[s.planLine, { backgroundColor: c.violetSoft }]}>
          <T tone="violetText" accessibilityLiveRegion="polite">
            {cur[2]}
          </T>
        </Appear>
        <Button label={night ? 'Good night' : 'Done'} onPress={go} />
      </Dock>
      {night ? (
        <T v="small" tone="muted" style={s.c}>
          Tomorrow morning Daybook asks one thing: did the phone stay away?
        </T>
      ) : null}
    </>
  );
}

/* ---------- surprise me ---------- */
/* while it picks, the card flips through soft shapes and colors; it lands on the first, a plain cookie that stands out on the sky */
const SUR_KINDS: ShapeKind[] = ['cookie', 'flower', 'scallop', 'clover', 'pent'];
const SUR_SOFT = ['surface', 'sunSoft', 'mintSoft', 'coralSoft', 'accentSoft'] as const;

export function Surprise({ finish }: ToolProps) {
  const c = useTheme();
  const { snap } = useStore();
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const menu = snap.settings?.menu || [];
  const [pick, setPick] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [doing, setDoing] = useState(false);
  const [face, setFace] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* flip: each new face turns in from its edge; land: the last one settles with a soft bounce */
  const flip = useRef(new Animated.Value(1)).current;
  const land = useRef(new Animated.Value(1)).current;
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const turnFace = (k: number) => {
    setFace(k);
    if (reduceRef.current) return;
    flip.setValue(0.15);
    Animated.timing(flip, { toValue: 1, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start();
  };
  const settle = () => {
    setFace(0);
    flip.setValue(1);
    if (reduceRef.current) return;
    land.setValue(0.78);
    Animated.spring(land, { toValue: 1, friction: 3.6, tension: 120, useNativeDriver: NATIVE }).start();
  };
  const spin = () => {
    const final = menu[Math.floor(Math.random() * menu.length)] || 'Walk around the block';
    setDoing(false);
    if (menu.length < 2) {
      settle();
      return setPick(final);
    }
    setSpinning(true);
    let n = 0;
    const total = 15;
    const step = () => {
      n++;
      if (n >= total) {
        setSpinning(false);
        setPick(final);
        settle();
        buzz('lit');
        return;
      }
      setPick(menu[Math.floor(Math.random() * menu.length)]);
      turnFace(n);
      timer.current = setTimeout(step, 55 + n * n * 2.4);
    };
    timer.current = setTimeout(step, 55);
  };
  useEffect(() => {
    spin();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const size = Math.min(300, width - 56);
  const card = (small: string, text: string) => {
    const k = face % SUR_KINDS.length;
    const fs = text.length <= 22 ? 28 : text.length <= 44 ? 24 : 20;
    return (
      <Animated.View
        style={{ transform: [{ scaleX: flip }, { scale: land }] }}
        accessibilityLiveRegion={spinning ? 'none' : 'polite'}
        accessible
        accessibilityLabel={(small ? small + ': ' : '') + text}>
        <Shape kind={SUR_KINDS[k]} size={size} color={c[SUR_SOFT[k]]} turn={face * 23}>
          <View style={[s.surIn, { maxWidth: size * 0.66 }]}>
            {small ? (
              <T v="small" tone="violetText">
                {small}
              </T>
            ) : null}
            <Text style={[s.surT, { color: c.ink, fontSize: fs, lineHeight: fs * 1.2 }]}>{text}</Text>
          </View>
        </Shape>
      </Animated.View>
    );
  };
  if (doing)
    return (
      <Stage key="doing" dir={1}>
        <T v="title" style={s.c} accessibilityRole="header">
          Leave the phone here.
        </T>
        <T style={s.c}>Go do it, then come back and tap Done. It does not have to be perfect.</T>
        <Middle>{card('Go do', pick || '')}</Middle>
        <Dock>
          <Button label="Done" onPress={() => finish('surprise', { msg: 'Small things add up.' })} />
        </Dock>
      </Stage>
    );
  return (
    <Stage key="pick" dir={0}>
      <T v="title" style={s.c} accessibilityRole="header">
        {spinning ? 'Picking something…' : 'Try this one.'}
      </T>
      <T style={s.c} tone="muted">
        From your calm-move menu.
      </T>
      <Middle>{spinning ? card('', pick || '…') : card('Try this', pick || '')}</Middle>
      <Dock>
        {spinning ? (
          <View style={s.btnSpace} />
        ) : (
          <>
            <Button label="I will do it" onPress={() => setDoing(true)} />
            <Button label="Another one" kind="ghost" icon="dice" onPress={spin} />
            <T v="small" tone="muted" style={s.c}>
              {menu.length} ideas in your menu. Edit them in My plan, under Lists.
            </T>
          </>
        )}
      </Dock>
    </Stage>
  );
}

/* ---------- what do I need? ---------- */
export function Halt({ finish, now }: ToolProps & { now: number }) {
  const c = useTheme();
  const [sel, setSel] = useState<string[]>([]);
  const night = urNight(new Date(now).getHours());
  const picked = NEEDS.filter((n) => sel.indexOf(n[0]) >= 0);
  return (
    <>
      <T v="title" style={s.c} accessibilityRole="header">
        What is true right now?
      </T>
      <T style={s.c}>Urges often show up when a plain need is going unmet. Tap anything that fits. You can pick more than one.</T>
      <Dock>
        <View style={s.wrap}>
          {NEEDS.map((n) => (
            <Chip
              key={n[0]}
              label={n[1]}
              on={sel.indexOf(n[0]) >= 0}
              onPress={() => setSel(sel.indexOf(n[0]) >= 0 ? sel.filter((x) => x !== n[0]) : sel.concat(n[0]))}
            />
          ))}
        </View>
        {picked.length ? (
          <>
            {picked.map((n) => {
              /* at night, "Tired" goes straight to bed */
              const go = n[0] === 'tired' && night ? (['bed', 'Go to bed'] as [string, string]) : n[3];
              return (
                <Card key={n[0]} style={{ alignSelf: 'stretch', backgroundColor: c.sunSoft, borderColor: c.sunSoft }}>
                  <T v="label">{n[1]}</T>
                  <T>{n[2]}</T>
                  {go ? <Button label={go[1]} kind="ghost" onPress={() => router.replace({ pathname: '/tool/[id]', params: { id: go[0] } })} /> : null}
                </Card>
              );
            })}
            <Button label="Done" onPress={() => finish('halt')} />
          </>
        ) : (
          <T v="small" tone="muted" style={s.c}>
            Nothing is wrong with a need. Naming it is the first move.
          </T>
        )}
      </Dock>
    </>
  );
}

/* ---------- reach a person ---------- */
export function Message({ finish }: ToolProps) {
  const c = useTheme();
  const { say } = useStore();
  const st = useCareSettings();
  const nm = safeName(st);
  const list = messageTexts(st);
  const [own, setOwn] = useState('');
  const send = useSendText();
  return (
    <>
      <T v="title" style={s.c} accessibilityRole="header">
        {nm ? 'Text ' + nm : 'A short text is enough'}
      </T>
      <T style={s.c}>
        {(nm ? 'Your safe person. ' : '') + 'Pick one and it opens in your messages app, ready to send. Reaching out is strength, not weakness.'}
      </T>
      {list.map((m) => (
        <Card key={m} style={{ alignSelf: 'stretch' }}>
          <T selectable>{m}</T>
          <View style={s.row}>
            <Chip label={nm ? 'Text ' + nm : 'Send'} on={false} onPress={() => send(m)} />
            <Chip label="Copy" on={false} onPress={() => copy(m, say)} />
          </View>
        </Card>
      ))}
      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        <Field label="Or write your own" multiline maxLength={300} value={own} onChangeText={setOwn} placeholder="In your own words" />
        <View style={s.row}>
          <Chip label="Send mine" on={false} onPress={() => (own.trim() ? send(own.trim()) : say('Write a few words first.'))} />
          <Chip label="Copy mine" on={false} onPress={() => (own.trim() ? copy(own.trim(), say) : say('Write a few words first.'))} />
        </View>
      </View>
      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        <T v="eyebrow" tone="muted">
          No one to text right now?
        </T>
        {FREE_LINES.map(([name, how, sub, num]) => (
          <Card key={name} style={{ alignSelf: 'stretch' }}>
            <T v="label">{name}</T>
            <T v="label" tone="accentText">
              {how}
            </T>
            <T v="small" tone="muted">
              {sub}
            </T>
            <View style={s.row}>
              <Chip label="Copy" on={false} onPress={() => copy(num, say, 'Copied ' + num + '.')} />
            </View>
          </Card>
        ))}
      </View>
      <Dock>
        <Button label="I sent it" onPress={() => finish('message', { noCalm: true, reach: true, msg: 'Reaching out takes guts.' })} />
      </Dock>
      <T v="small" tone="muted" style={s.c}>
        Only if and when you want to. Calling counts too, and so does sitting with someone.
      </T>
    </>
  );
}

/* ---------- my reasons ---------- */
export function Reasons({ finish }: ToolProps) {
  const c = useTheme();
  const st = useCareSettings();
  const r = st?.reasons || [];
  const note = String(st?.note || '').trim();
  const reduce = useReducedMotion();
  const [i0, setI] = useState(0);
  /* the next reason slides in from the side it was asked for */
  const [dir, setDir] = useState<1 | -1>(1);
  const turn = (d: 1 | -1) => {
    setDir(d);
    setI((x) => x + d);
    buzz('tap');
  };
  /* a sideways swipe turns the card too: it follows the finger, and past a short way (or a quick flick) it flies off and
     the next one comes in from the other side; a short drag springs back */
  const dx = useRef(new Animated.Value(0)).current;
  const live = useRef({ n: r.length, reduce, turn });
  live.current = { n: r.length, reduce, turn };
  const back = () => Animated.spring(dx, { toValue: 0, friction: 6, tension: 140, useNativeDriver: NATIVE }).start();
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => live.current.n > 1 && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => dx.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        const d: 0 | 1 | -1 = g.dx < -60 || (g.dx < 0 && g.vx < -0.5) ? 1 : g.dx > 60 || (g.dx > 0 && g.vx > 0.5) ? -1 : 0;
        if (!d) return back();
        if (live.current.reduce) {
          dx.setValue(0);
          return live.current.turn(d);
        }
        Animated.timing(dx, { toValue: -d * 420, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }).start(() => live.current.turn(d));
      },
      onPanResponderTerminate: back,
    }),
  ).current;
  /* the card that flew off comes back to the middle only once the next reason is in it */
  useEffect(() => dx.setValue(0), [i0, dx]);
  const noteCard = note ? (
    <Card tone="note" style={{ alignSelf: 'stretch' }}>
      <T v="small" tone="muted">
        From you, on a calm day
      </T>
      <T>{note}</T>
    </Card>
  ) : null;
  if (!r.length)
    return (
      <>
        {noteCard}
        <Middle>
          <Icon name="star" size={48} color={c.sun} />
          <T v="title" style={s.c}>
            Add your reasons
          </T>
          <T style={s.c}>Write a few lines about why this matters to you. They show up here when you need them.</T>
        </Middle>
        <Dock>{note ? <Button label="Done" onPress={() => finish('reasons', { msg: 'Good to remember.' })} /> : null}</Dock>
      </>
    );
  const n = r.length;
  const i = ((i0 % n) + n) % n;
  const text = r[i];
  const cat = reasonCat(st, text);
  const size = text.length <= 36 ? 30 : text.length <= 80 ? 24 : text.length <= 120 ? 20 : 17;
  return (
    <>
      {noteCard}
      <T v="eyebrow" tone="muted">
        Why I am doing this
      </T>
      <Middle>
        {/* a light stack: a soft shape and the next card peek out from behind the one on top */}
        <View style={s.stack}>
          <Shape kind="cookie" size={160} color={c.accentSoft} wobble={0.5} seed={i + 1} turn={i * 25} style={s.peekShape} />
          {n > 1 ? <View style={[s.peek, { backgroundColor: c.surface2, borderColor: c.cardEdge }]} /> : null}
          <Animated.View
            {...pan.panHandlers}
            style={{
              transform: [{ translateX: dx }, { rotate: dx.interpolate({ inputRange: [-300, 0, 300], outputRange: ['-7deg', '0deg', '7deg'] }) }],
            }}>
            <Appear
              key={'r' + i}
              by={0}
              x={dir * 28}
              duration={260}
              style={[s.reason, { backgroundColor: c.surface, borderColor: c.cardEdge, shadowColor: c.lip }]}>
              <View style={s.row}>
                <Icon name={cat.ic} size={18} color={c.muted} />
                <T v="small" tone="muted">
                  {cat.name}
                </T>
              </View>
              <Text style={{ fontFamily: font.display, fontSize: size, lineHeight: size * 1.25, color: c.ink, textAlign: 'center' }}>{text}</Text>
            </Appear>
          </Animated.View>
        </View>
      </Middle>
      <Dock>
        {n > 1 ? (
          <View style={[s.row, { alignItems: 'center' }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous reason" onPress={() => turn(-1)} style={[s.sq, { backgroundColor: c.surface }]}>
              <Icon name="back" />
            </Pressable>
            <T v="small" tone="muted" accessibilityLabel={`Reason ${i + 1} of ${n}`}>
              {i + 1} of {n}
            </T>
            <Pressable accessibilityRole="button" accessibilityLabel="Next reason" onPress={() => turn(1)} style={[s.sq, { backgroundColor: c.surface }]}>
              <Icon name="next" />
            </Pressable>
          </View>
        ) : null}
        <Button label="Done" onPress={() => finish('reasons', { msg: 'Good to remember.' })} />
      </Dock>
    </>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  grid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 64,
    borderRadius: 18,
    padding: 10,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  tileT: { fontFamily: font.bodyBold, fontSize: 16 },
  tileS: { fontFamily: font.body, fontSize: 13 },
  beat: { width: 206, height: 206, alignItems: 'center', justifyContent: 'center', gap: 2 },
  beatIn: { alignItems: 'center', justifyContent: 'center' },
  time: { fontFamily: font.displayBold, fontSize: 48, lineHeight: 56, fontVariant: ['tabular-nums'] },
  planLine: { alignSelf: 'stretch', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 2 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  surIn: { alignItems: 'center', gap: 6 },
  surT: { fontFamily: font.display, textAlign: 'center' },
  btnSpace: { height: 104 },
  reason: {
    alignSelf: 'stretch',
    minHeight: 220,
    borderRadius: 26,
    borderWidth: 2,
    padding: 22,
    gap: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
  },
  stack: { alignSelf: 'stretch' },
  peekShape: { position: 'absolute', top: -46, right: -30 },
  peek: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 26, borderWidth: 2, transform: [{ rotate: '-4deg' }, { translateY: 10 }] },
  sq: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
