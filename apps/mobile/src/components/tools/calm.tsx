/* Calm your body: Breathe, and 5-4-3-2-1. Ported from the legacy SCENES.breathe and SCENES.ground. */
import { breathPhase, GROUND, PATTERNS } from '@daybook/core';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Flame } from '@/components/flame';
import { fmtMS, Orb, useSeconds } from '@/components/orb';
import { Button, Chip, Icon, T } from '@/components/ui';
import { Dock } from '@/components/scene';
import { buzz } from '@/lib/feel';
import { setSoundPref, useSoundPref } from '@/lib/prefs';
import { play } from '@/lib/sound';
import { font, useTheme } from '@/lib/theme';

import type { ToolProps } from './types';

export function Breathe({ finish, sos, level }: ToolProps) {
  /* from SOS it starts right away, with the sigh, for three minutes */
  const [pat, setPat] = useState<keyof typeof PATTERNS>(sos ? 'sigh' : 'calm');
  const [mins, setMins] = useState(sos ? 3 : 1);
  const [startedAt, setStartedAt] = useState<number | null>(sos ? Date.now() : null);
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
  if (done)
    return (
      <>
        <Flame level={level} size={120} />
        <T v="title" style={s.c} accessibilityRole="header">
          Nice. Notice how you feel.
        </T>
        <T style={s.c}>Shoulders, jaw, hands. Even a little softer is a win.</T>
        <Dock>
          <Button label="Done" onPress={() => finish('breathe')} />
        </Dock>
      </>
    );
  if (!startedAt)
    return (
      <>
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
          <Button label="Start" onPress={() => setStartedAt(Date.now())} />
        </Dock>
      </>
    );
  const P = PATTERNS[pat] || PATTERNS.calm;
  return (
    <>
      <Orb pattern={pat} sec={sec} time={fmtMS((total - sec) * 1000)} />
      <T v="small" tone="muted" style={s.c}>
        {P.name}: {P.desc}
      </T>
      <View style={s.row}>
        <Chip
          label="Sound guide"
          on={snd}
          onPress={() => {
            setSoundPref(!snd);
            if (!snd) play('on', true);
          }}
        />
        <Chip label="Change or stop" on={false} onPress={() => setStartedAt(null)} />
      </View>
    </>
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

export function Ground({ finish, level }: ToolProps) {
  const c = useTheme();
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  if (i >= GROUND.length)
    return (
      <>
        <Flame level={level} size={120} />
        <T v="title" style={s.c} accessibilityRole="header">
          You are here.
        </T>
        <T style={s.c}>Feel your feet on the floor. Take one slow breath. The wave has less to hold on to now.</T>
        <Dock>
          <Button label="Done" onPress={() => finish('ground', { msg: 'You came back to the room.' })} />
        </Dock>
      </>
    );
  const g = GROUND[i];
  return (
    <>
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
        <View style={s.dots} accessibilityLabel="Tap once for each one you find">
          {Array.from({ length: g[0] }, (_, j) => (
            <Pressable
              key={j}
              accessibilityRole="button"
              accessibilityLabel="Found one"
              accessibilityState={{ checked: j < n }}
              onPress={() => {
                if (n >= g[0]) return;
                setN(n + 1);
                buzz('tap');
              }}
              style={[
                s.dot,
                {
                  backgroundColor: j < n ? c.mint : c.surface,
                  borderColor: j < n ? c.mint : c.line,
                },
              ]}>
              {j < n ? <Icon name="check" color="#FFFFFF" size={22} /> : null}
            </Pressable>
          ))}
        </View>
        <T v="small" tone="muted" style={s.c}>
          {n >= g[0] ? 'All ' + g[0] + ' found.' : n + ' of ' + g[0] + '. Tap a circle each time you find one.'}
        </T>
        <Button
          label={i === GROUND.length - 1 ? 'Finish' : 'Next'}
          disabled={n < g[0]}
          onPress={() => {
            setI(i + 1);
            setN(0);
          }}
        />
      </Dock>
    </>
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
    gap: 12,
    justifyContent: 'center',
  },
  dot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
