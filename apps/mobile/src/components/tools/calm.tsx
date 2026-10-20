/* Calm your body: Breathe, and 5-4-3-2-1. Ported from the legacy SCENES.breathe and SCENES.ground. */
import { breathPhase, GROUND, PATTERNS } from '@daybook/core';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Reanimated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/text';
import { Shape, type ShapeKind } from '@/components/shapes';

import { fmtMS, Orb, useSeconds } from '@/components/orb';
import { Button, Chip, Icon, T } from '@/components/ui';
import { Dock, Finish, Middle, Stage } from '@/components/scene';
import { buzz } from '@/lib/feel';
import { getBreathePref, setBreathePref, setSoundPref, useSoundPref } from '@/lib/prefs';
import { play } from '@/lib/sound';
import { useReducedMotion } from '@/lib/motion';
import { font, toneOf, useTheme, type Tone } from '@/lib/theme';

import type { ToolProps } from './types';

const isPat = (k: string): k is keyof typeof PATTERNS => k in PATTERNS;

export function Breathe({ finish, exit, sos, level }: ToolProps) {
  /* from SOS it starts right away with the sigh, for three minutes; from Tools it starts right away with the last choice */
  const [pat, setPat] = useState<keyof typeof PATTERNS>(() => {
    const k = getBreathePref().pat;
    return sos ? 'sigh' : isPat(k) ? k : 'calm';
  });
  const [mins, setMins] = useState(() => (sos ? 3 : getBreathePref().mins || 1));
  const [startedAt, setStartedAt] = useState<number | null>(() => Date.now());
  const [done, setDone] = useState(false);
  const sec = useSeconds(startedAt, !!startedAt && !done);
  const total = mins * 60;
  const over = !!startedAt && !done && sec >= total;
  const snd = useSoundPref();
  useEffect(() => {
    if (!over) return;
    setDone(true);
    buzz('lit');
    play('chime');
  }, [over]);
  /* the sound guide: a soft tone as each breath starts */
  const ph = startedAt && !done ? breathPhase(pat, sec) : null;
  const phIdx = ph ? ph.idx : -1;
  const phK = ph ? ph.k : '';
  useEffect(() => {
    if (phIdx < 0) return;
    if (phK === 'in' || phK === 'in1') play('in');
    else if (phK === 'in2') play('in2');
    else if (phK === 'out') play('out');
  }, [phIdx, phK]);
  const P = PATTERNS[pat] || PATTERNS.calm;
  /* a breath counts once its breath out is done */
  const cycle = P.ph.reduce((a, b) => a + b[1], 0);
  const breaths = Math.floor(Math.min(sec, total) / cycle);
  if (done)
    return (
      <Stage key="done" dir={0}>
        <Finish
          level={level}
          tone="sky"
          title="Nice. Notice how you feel."
          text={(breaths > 1 ? 'You took ' + breaths + ' slow breaths. ' : '') + 'Shoulders, jaw, hands. Even a little softer is a win.'}
        />
        <Dock>
          <Button label="Done" onPress={() => finish('breathe')} />
        </Dock>
      </Stage>
    );
  if (!startedAt)
    return (
      <Stage key="setup" dir={0}>
        <T v="title" style={s.c} accessibilityRole="header">
          Slow it down
        </T>
        <T style={s.c}>A longer breath out helps many people settle. If it makes you dizzy, go back to normal breathing.</T>
        <Dock>
          <View style={s.group} accessibilityRole="radiogroup" accessibilityLabel="Pattern">
            {(Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).map((k) => (
              <Pick key={k} on={pat === k} title={PATTERNS[k].name} sub={PATTERNS[k].desc} onPress={() => setPat(k)} />
            ))}
          </View>
          <View style={s.group} accessibilityRole="radiogroup" accessibilityLabel="Length">
            {[1, 3, 5].map((m) => (
              <Pick key={m} on={mins === m} title={m + ' min'} onPress={() => setMins(m)} />
            ))}
          </View>
          <Button
            label="Start"
            onPress={() => {
              setBreathePref({ pat, mins });
              setStartedAt(Date.now());
            }}
          />
        </Dock>
      </Stage>
    );
  return (
    <Stage key="run" dir={0}>
      <Middle>
        <Orb pattern={pat} sec={sec} size={270} time={fmtMS((total - sec) * 1000)} />
        <T v="small" tone="muted" style={s.c}>
          {P.name}: {P.desc} · {mins} min
        </T>
      </Middle>
      <Dock>
        <View style={s.row}>
          <Chip label="Change" on={false} onPress={() => setStartedAt(null)} />
          <Chip
            label="Sound guide"
            on={snd}
            onPress={() => {
              setSoundPref(!snd);
              if (!snd) play('on', true);
            }}
          />
          {/* stopping after a breath or more still counts: it goes to the finish */}
          <Chip label="Stop" on={false} onPress={() => (breaths > 0 ? setDone(true) : exit())} />
        </View>
      </Dock>
    </Stage>
  );
}

function Pick({ on, title, sub, onPress }: { on: boolean; title: string; sub?: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={[
        s.pick,
        {
          backgroundColor: on ? c.accentSoft : c.surface,
          borderColor: on ? c.accent : 'transparent',
          shadowColor: c.lip,
        },
      ]}>
      <Text style={[s.pickT, { color: on ? c.accentText : c.ink }]}>{title}</Text>
      {sub ? <Text style={[s.pickS, { color: c.muted }]}>{sub}</Text> : null}
    </Pressable>
  );
}

/* each sense has its own shape and color, so each step of 5-4-3-2-1 looks and feels new */
const SENSE: { kind: ShapeKind; tone: string }[] = [
  { kind: 'cookie', tone: 'sun' },
  { kind: 'clover', tone: 'mint' },
  { kind: 'scallop', tone: 'sky' },
  { kind: 'flower', tone: 'coral' },
  { kind: 'pent', tone: 'violet' },
];
/** how big the shapes are for a count, so they fill the lower half without crowding (5 sit as 3 and 2) */
const SHAPE_SIZE = [0, 150, 124, 100, 112, 96];

export function Ground({ finish, level }: ToolProps) {
  const c = useTheme();
  const [i, setI] = useState(0);
  const [found, setFound] = useState<boolean[]>([]);
  const g = GROUND[i];
  const n = found.filter(Boolean).length;
  const all = !!g && n >= g[0];
  /* after the last one of a step, a short beat, then on to the next by itself */
  useEffect(() => {
    if (!all) return;
    const t = setTimeout(() => {
      setI((x) => x + 1);
      setFound([]);
    }, 900);
    return () => clearTimeout(t);
  }, [all]);
  if (!g)
    return (
      <Stage key="done" dir={0}>
        <Finish
          level={level}
          tone="mint"
          title="You are here."
          text="Feel your feet on the floor. Take one slow breath. The wave has less to hold on to now."
        />
        <Dock>
          <Button label="Done" onPress={() => finish('ground', { msg: 'You came back to the room.' })} />
        </Dock>
      </Stage>
    );
  const sense = SENSE[i % SENSE.length];
  const tone = toneOf(c, sense.tone);
  const size = SHAPE_SIZE[g[0]] || 96;
  return (
    <Stage key={'g' + i} dir={i ? 1 : 0}>
      <View style={s.steps} accessibilityElementsHidden>
        {GROUND.map((_, j) => (
          <View key={j} style={[s.step, { backgroundColor: j < i ? c.accent : j === i ? c.sun : c.line }]} />
        ))}
      </View>
      <View style={s.mid}>
        <Text style={[s.big, { color: c.ink }]} accessibilityLiveRegion="polite">
          {g[0]}
        </Text>
        <T style={s.c}>{g[2]}</T>
      </View>
      <Dock>
        <View style={s.dots} accessibilityLabel="Tap a shape for each one you find">
          {Array.from({ length: g[0] }, (_, j) => (
            <Bloom
              key={j}
              on={!!found[j]}
              kind={sense.kind}
              turn={(j * 37) % 90}
              size={size}
              tone={tone}
              word={g[1]}
              onPress={() => {
                if (found[j] || all) return;
                setFound((f) => {
                  const x = f.slice();
                  x[j] = true;
                  return x;
                });
                buzz(n + 1 >= g[0] ? 'lit' : 'tap');
              }}
            />
          ))}
        </View>
        <T v="small" tone="muted" style={s.c} accessibilityLiveRegion="polite">
          {all
            ? i === GROUND.length - 1
              ? 'All found.'
              : 'All ' + g[0] + ' found. On to the next.'
            : n + ' of ' + g[0] + '. Tap a shape each time you find one.'}
        </T>
      </Dock>
    </Stage>
  );
}

/** one thing to find: a soft shape with the sense's word, that blooms (a pop and a fill of color) when tapped */
function Bloom({
  on,
  kind,
  turn,
  size,
  tone,
  word,
  onPress,
}: {
  on: boolean;
  kind: ShapeKind;
  turn: number;
  size: number;
  tone: Tone;
  word: string;
  onPress: () => void;
}) {
  const c = useTheme();
  const still = useReducedMotion();
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!on || still) return;
    pop.value = withSequence(withTiming(0.82, { duration: 90 }), withSpring(1, { damping: 7, stiffness: 220 }));
  }, [on, still, pop]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? word + ': found' : word + ': tap when you find one'}
      accessibilityState={{ checked: on }}
      onPress={onPress}
      hitSlop={6}>
      <Reanimated.View style={st}>
        <Shape kind={kind} size={size} color={on ? tone.ic : c.surface} turn={turn}>
          {/* in a View, so on the web it paints over the shape */}
          {on ? (
            <View>
              <Icon name="check" color={tone.ink} size={Math.round(size * 0.3)} />
            </View>
          ) : null}
          <Text style={[s.word, { color: on ? tone.ink : tone.text, fontSize: Math.round(size * 0.17) }]}>{word}</Text>
        </Shape>
      </Reanimated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  /* the count and what to look for, in the open middle of the screen */
  mid: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 10 },
  c: { textAlign: 'center' },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  group: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pick: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  pickT: { fontFamily: font.bodyBold, fontSize: 16 },
  pickS: { fontFamily: font.body, fontSize: 13 },
  steps: { flexDirection: 'row', gap: 6, alignSelf: 'stretch' },
  step: { flex: 1, height: 6, borderRadius: 3 },
  big: { fontFamily: font.displayBold, fontSize: 128, lineHeight: 140 },
  dots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  word: { fontFamily: font.bodyBold },
});
