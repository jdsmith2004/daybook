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
  MENU_DEFAULT,
  MOVES_SIT,
  NEEDS,
  urTool,
  needDo,
  ideaTool,
  reasonCat,
  safeName,
  urEntry,
  urNight,
  urWon,
  addEvent,
  phoneAway,
  withDay,
} from '@daybook/core';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useNextTool } from '@/lib/tools';
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
import { Shape, type ShapeKind } from '@/components/shapes';
import { buzz } from '@/lib/feel';
import { play } from '@/lib/sound';
import { useSendText } from '@/components/safe-text';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, useTheme, type Palette } from '@/lib/theme';

import { ToolTimer, type BeatOf } from './timer';
import type { ToolProps } from './types';

const copy = (text: string, say: (m: string) => void, ok = 'Copied. Paste it in your messages.') =>
  Clipboard.setStringAsync(text)
    .then(() => say(ok))
    .catch(() => say('Could not copy. Press and hold the text to copy it.'));

/* ---------- move ---------- */
/* the beat a move keeps: a squeeze is held for five, then let go; rolls and turns go slow; on your feet it is a livelier,
   steady pulse (components/tools/timer.tsx) */
const BEAT_HOLD: BeatOf = { dur: [5, 3], low: 0.74, words: ['Hold', 'Let go'], kind: 'cookie12' };
const BEAT_FLOW: BeatOf = { dur: [3, 3], low: 0.86, kind: 'cookie9' };
const BEAT_UP: BeatOf = { dur: [0.45, 0.55], low: 0.9, kind: 'softBurst' };
/** the seated moves that are a hold and a letting go */
const HOLDS = ['squeeze', 'feet', 'palms', 'toes'];

/** each move's own small shape on the pick list: the shape its beat keeps on the run page */
const beatOf = (sit: boolean, id: string): BeatOf => (!sit ? BEAT_UP : HOLDS.indexOf(id) >= 0 ? BEAT_HOLD : BEAT_FLOW);

export function Move({ finish, level }: ToolProps) {
  const c = useTheme();
  const sos = useSos();
  /* in a seat (at work, in a meeting, in a car) or free to get up. Remembered on this device, and a seat is the start,
     because it works anywhere. */
  const sit = sos.mem.moveSit !== false;
  const list = sit ? MOVES_SIT : MOVES;
  /* it starts at once and walks through every move for the place you are in, one after the other, so the two minutes
     keep changing and there is nothing to choose first (short bursts of squeezing and moving cut cravings: Ussher and
     others 2006, and the review by Taylor, Ussher and Faulkner 2007) */
  const [m0, setM0] = useState(() => Date.now());
  const [done, setDone] = useState(false);
  const sec = useSeconds(m0, !done);
  const left = Math.max(0, MOVE_MS - sec * 1000);
  const over = !done && left <= 0;
  const per = MOVE_MS / list.length;
  const i = Math.min(list.length - 1, Math.floor((sec * 1000) / per));
  useEffect(() => {
    if (i > 0) buzz('tap');
  }, [i]);
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
  const m = list[i];
  /* the move and how to do it at the top, to be read; the timer in the middle; done at the bottom */
  return (
    <Stage key={'run' + (sit ? 's' : 'u')} dir={0}>
      <View style={{ alignSelf: 'stretch' }}>
        <PickRow
          label="Where are you?"
          list={[
            { k: 'sit', label: 'In my seat' },
            { k: 'up', label: 'On my feet' },
          ]}
          cur={sit ? 'sit' : 'up'}
          onPick={(k) => {
            sos.setMem((x) => ({ ...x, moveSit: k === 'sit' }));
            setM0(Date.now());
          }}
        />
      </View>
      <T v="eyebrow" tone="muted">
        {'Move ' + (i + 1) + ' of ' + list.length}
      </T>
      <Appear key={m[0]} by={8} duration={240} style={{ alignItems: 'center', gap: 6 }}>
        <T v="title" style={s.c} accessibilityRole="header" accessibilityLiveRegion="polite">
          {m[1]}
        </T>
        <T style={s.c}>{m[2]}.</T>
      </Appear>
      <Middle>
        <ToolTimer
          p={1 - left / MOVE_MS}
          left={left}
          sec={sec}
          beat={beatOf(sit, m[0])}
          label={sit ? 'Slow and steady' : 'Keep it going'}
          color={c.coral}
          ink={c.coralText}
        />
      </Middle>
      <Dock>
        <Button label="I am done" onPress={() => setDone(true)} />
        <T v="small" tone="muted" style={s.c}>
          {sit ? 'Slow and small counts, and no one has to notice. Stop if anything hurts.' : 'A slow walk counts too. Stop if anything hurts.'}
        </T>
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
        sos.setMem((m) => ({ ...urWon(m, sc), last: e.last }));
      }
      const day = changeDay(days[tk], tk, (d) => {
        const q = d.p || blankP();
        if (q.tl.indexOf('bed') < 0) q.tl.push('bed');
        q.c = Math.min(50, q.c + 1);
        d.p = q;
      });
      /* Good night: the phone away, and screens off on time when it is before the screens-off time (core phoneAway) */
      days = phoneAway(withDay(days, tk, day), tk, at, Date.now(), s.settings);
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
      <Shape kind="cookie6" size={96} color={c.violetSoft} turn={8}>
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
            : 'Urges are louder when you are tired. Three things, then a plan for the thoughts.'
          : 'Late at night this is often the strongest tool. Walk through it now so it is easy later.'}
      </T>
      {/* read at the top, not under the main button (the thumb rule) */}
      {night ? (
        <T v="small" tone="muted" style={s.c}>
          Good night puts the phone away for the night. That counts, and nothing is asked tomorrow.
        </T>
      ) : null}
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
        <View
          style={[s.wrap, { justifyContent: 'flex-start', alignSelf: 'stretch' }]}
          accessibilityRole="radiogroup"
          accessibilityLabel="If the thoughts get loud in bed">
          {plans.map(([id, t]) => (
            <Chip
              key={id}
              role="radio"
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
    </>
  );
}

/* ---------- surprise me ---------- */
/* while it picks, the card flips through Android's shapes and soft colors; it lands on the first, a calm cookie in the
   card color that stands out on the sky */
const SUR_KINDS: ShapeKind[] = ['cookie9', 'sunny', 'clover4', 'gem', 'puffy', 'cookie6', 'softBurst', 'heart', 'pentagon', 'clover8'];
const SUR_SOFT = ['surface', 'sunSoft', 'mintSoft', 'coralSoft', 'accentSoft', 'skySoft', 'violetSoft', 'coralSoft', 'sunSoft', 'mintSoft'] as const;

export function Surprise({ finish, exit, sos: fromSos }: ToolProps) {
  const nextTool = useNextTool();
  const c = useTheme();
  const { snap } = useStore();
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  /* an empty menu is the starting menu, as everywhere else */
  const menu = snap.settings?.menu?.length ? snap.settings.menu : MENU_DEFAULT;
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
    /* about a second in all: eight faces, slowing down (55 ms, then 55 + 3n² ms), so the idea can be read soon */
    let n = 0;
    const total = 8;
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
      timer.current = setTimeout(step, 55 + n * n * 3);
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
  const tid = !spinning && pick ? ideaTool(pick) : null;
  const pickTool = tid ? urTool(tid) : null;
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
            <View style={s.two}>
              <View style={{ flex: 1 }}>
                <Button label="Another one" kind="ghost" icon="dice" onPress={spin} />
              </View>
              {/* an idea that is one of the tools (a walk is Move, a text is Reach a person) opens it */}
              {pickTool ? (
                <View style={{ flex: 1 }}>
                  <Button label={'Open ' + pickTool.name} kind="ghost" icon={pickTool.ic} onPress={() => nextTool(pickTool.id)} />
                </View>
              ) : null}
            </View>
            {fromSos ? (
              <View style={s.quiet}>
                <Link label="Back to the tools" onPress={exit} />
              </View>
            ) : null}
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
/* one question with five big choices low on the screen. A need with a tool for it (lonely: Reach a person) opens that
   tool at once; the others get one page: its shape big in the middle, what helps, and one button that does it (core
   needDo) */
const NEED_SHAPE: Record<string, ShapeKind> = { hungry: 'cookie9', angry: 'softBurst', lonely: 'cookie12', tired: 'cookie6', bored: 'clover4' };
const NEED_TONE: Record<string, readonly [keyof Palette, keyof Palette]> = {
  hungry: ['sunSoft', 'sunText'],
  angry: ['coralSoft', 'coralText'],
  lonely: ['violetSoft', 'violetText'],
  tired: ['skySoft', 'skyText'],
  bored: ['mintSoft', 'mintText'],
};

export function Halt({ finish, now }: ToolProps & { now: number }) {
  const nextTool = useNextTool();
  const c = useTheme();
  const [need, setNeed] = useState<string | null>(null);
  /* back to the five from a need slides in from the left; the first time it just appears */
  const [back, setBack] = useState(false);
  const night = urNight(new Date(now).getHours());
  const n = NEEDS.find((x) => x[0] === need);
  if (!n)
    return (
      <Stage key="ask" dir={back ? -1 : 0}>
        <T v="title" style={s.c} accessibilityRole="header">
          What do you need most right now?
        </T>
        <T style={s.c}>Urges often show up when a plain need is going unmet. Pick the one that is loudest.</T>
        <Dock>
          <View style={s.list}>
            {NEEDS.map(([id, name], j) => {
              const [bg, ink] = NEED_TONE[id] || (['accentSoft', 'accentText'] as const);
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  onPress={() => {
                    buzz('tap');
                    /* a need with a tool for it opens that tool straight away; the others say what helps */
                    const tl = needDo(id, night).tool;
                    if (tl) nextTool(tl);
                    else setNeed(id);
                  }}
                  style={({ pressed }) => [s.mrow, { backgroundColor: c.surface, shadowColor: c.lip, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
                  <Shape kind={NEED_SHAPE[id] || 'cookie9'} size={40} color={c[bg] as string} turn={j * 17}>
                    <View>
                      <Icon name={needDo(id, night).ic} size={20} color={c[ink] as string} />
                    </View>
                  </Shape>
                  <Text style={[s.tileT, { color: c.ink, flex: 1 }]}>{name}</Text>
                  <Icon name="next" size={18} color={c.muted} />
                </Pressable>
              );
            })}
          </View>
          <T v="small" tone="muted" style={s.c}>
            Nothing is wrong with a need. Naming it is the first move.
          </T>
        </Dock>
      </Stage>
    );
  const d = needDo(n[0], night);
  const [bg, ink] = NEED_TONE[n[0]] || (['accentSoft', 'accentText'] as const);
  return (
    <Stage key={'need' + n[0]} dir={1}>
      <T v="eyebrow" tone="muted">
        {n[1]}
      </T>
      <T v="title" style={s.c} accessibilityRole="header">
        {d.head}
      </T>
      <T style={s.c}>{d.text || n[2]}</T>
      <Middle>
        <Shape kind={NEED_SHAPE[n[0]] || 'cookie9'} size={150} color={c[bg] as string} turn={8}>
          <View>
            <Icon name={d.ic} size={60} color={c[ink] as string} />
          </View>
        </Shape>
      </Middle>
      <Dock>
        <Button label={d.label} onPress={() => (d.tool ? nextTool(d.tool) : finish('halt', { msg: 'You met the need. That is real care.' }))} />
        <View style={s.quiet}>
          <Link
            label="Pick another need"
            onPress={() => {
              setBack(true);
              setNeed(null);
            }}
          />
        </View>
      </Dock>
    </Stage>
  );
}

/* ---------- reach a person ---------- */
/* the three texts at the top, each one big button that opens the messages app (hold to copy); "I sent it" docked where
   the thumb is. Writing your own and
   the free lines (988, the Crisis Text Line) open in place from quiet links, so the page stays short enough for the
   button to sit low. */
export function Message({ finish }: ToolProps) {
  const c = useTheme();
  const { say } = useStore();
  const st = useCareSettings();
  const nm = safeName(st);
  const list = messageTexts(st);
  const [own, setOwn] = useState('');
  const [writing, setWriting] = useState(false);
  const [lines, setLines] = useState(false);
  const send = useSendText();
  return (
    <>
      <T v="title" style={s.c} accessibilityRole="header">
        {nm ? 'Text ' + nm : 'A short text is enough'}
      </T>
      <T style={s.c}>{(nm ? 'Your safe person. ' : '') + 'Pick one and it opens in your messages app, ready to send. Reaching out is strength.'}</T>
      {lines ? (
        <Appear key="lines" by={6} duration={240} style={s.list}>
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
        </Appear>
      ) : (
        <Appear key="texts" by={6} duration={240} style={s.list}>
          {/* each text is one big button: a tap opens it in the messages app, ready to send; holding it copies it */}
          {list.map((m) => (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityLabel={(nm ? 'Text ' + nm : 'Send') + ': ' + m}
              accessibilityHint="Opens your messages app. Hold to copy instead."
              accessibilityActions={[{ name: 'longpress', label: 'Copy' }]}
              onAccessibilityAction={() => copy(m, say)}
              onPress={() => send(m)}
              onLongPress={() => copy(m, say)}
              style={({ pressed }) => [s.text, { backgroundColor: c.surface, shadowColor: c.lip, transform: [{ translateY: pressed ? 3 : 0 }] }]}>
              <T style={{ flex: 1 }}>{m}</T>
              <View style={[s.send, { backgroundColor: c.skySoft }]}>
                <Icon name="next" size={20} color={c.skyText} />
              </View>
            </Pressable>
          ))}
          <T v="small" tone="muted" style={s.c}>
            Tap one to send it. Hold to copy.
          </T>
          {/* a text box and its buttons stay together near the top, where the keyboard does not cover them */}
          {writing ? (
            <View style={{ alignSelf: 'stretch', gap: 8 }}>
              <Field label="Your own words" multiline autoFocus maxLength={300} value={own} onChangeText={setOwn} placeholder="In your own words" />
              <View style={s.row}>
                <Chip label="Send mine" on={false} onPress={() => (own.trim() ? send(own.trim()) : say('Write a few words first.'))} />
                <Chip label="Copy mine" on={false} onPress={() => (own.trim() ? copy(own.trim(), say) : say('Write a few words first.'))} />
              </View>
            </View>
          ) : (
            <View style={s.quiet}>
              <Link label="Write my own" onPress={() => setWriting(true)} />
            </View>
          )}
        </Appear>
      )}
      <Dock>
        <T v="small" tone="muted" style={s.c}>
          Only if and when you want to. Calling counts too, and so does sitting with someone.
        </T>
        <Button label="I sent it" onPress={() => finish('message', { noCalm: true, reach: true, msg: 'Reaching out takes guts.' })} />
        <View style={s.quiet}>
          <Link label={lines ? 'Back to the texts' : 'No one to text?'} onPress={() => setLines(!lines)} />
        </View>
      </Dock>
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
        {/* a light stack: the next card peeks out from behind the one on top */}
        <View style={s.stack}>
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
              <Shape kind="cookie12" size={56} color={c.accentSoft} turn={i * 15}>
                {/* in a View, so on the web it sits over the shape and not under it */}
                <View>
                  <Icon name={cat.ic} size={24} color={c.accent} />
                </View>
              </Shape>
              <T v="small" tone="muted" style={s.medalName}>
                {cat.name}
              </T>
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
  text: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
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
  list: { alignSelf: 'stretch', gap: 8 },
  two: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  quiet: { alignSelf: 'stretch', alignItems: 'center' },
  mrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 58,
    borderRadius: 18,
    paddingVertical: 9,
    paddingHorizontal: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  planLine: { alignSelf: 'stretch', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 2 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  surIn: { alignItems: 'center', gap: 6 },
  surT: { fontFamily: font.display, textAlign: 'center' },
  btnSpace: { height: 160 },
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
  medalName: { marginTop: -8 },
  peek: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 26, borderWidth: 2, transform: [{ rotate: '-4deg' }, { translateY: 10 }] },
  sq: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
