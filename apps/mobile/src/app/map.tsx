/* Map your day: about thirty seconds each morning, opened right after the Last night taps (and from the sky card on Today).
   WOOP, done daily: tonight's feeling at the end of a clean day (Outcome), the hour that could be hard as a storm on the
   day's sky and what it counts on (Obstacle), a plain answer to any thought behind it, and one if-then plan, with a
   reminder at that hour on a phone. A day with no hard hour is "Clear skies". If yesterday's storm is still waiting for
   "Did it hold?", that comes first. Every map is a star in your sky. The rules and the research are in core (daymap.ts). */
import {
  gameCompute,
  holdMap,
  MAP_LAST,
  MAP_LINKS,
  MAP_OUTCOMES,
  mapAsk,
  mapClock,
  mapIfThen,
  mapMoveName,
  mapMoves,
  mapOf,
  mapStars,
  mapStart,
  mapThoughts,
  mapTime,
  saveMap,
  type DayMap,
  type MapHeld,
  type MapLink,
  type MapMove,
  type MapOutcome,
} from '@daybook/core';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { Appear } from '@/components/appear';
import { BigOption, Link } from '@/components/choices';
import { CountUp } from '@/components/count-up';
import { DaySky } from '@/components/day-sky';
import { Dock, SceneFrame } from '@/components/scene';
import { Slider } from '@/components/slider';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { remindersOffered, scheduleMap } from '@/lib/reminders';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Step = 'held' | 'outcome' | 'storm' | 'links' | 'thought' | 'plan' | 'end';

export default function MapDay() {
  const c = useTheme();
  const { snap, tk, update, say } = useStore();
  const st = snap.settings;
  const [now] = useState(() => Date.now());
  /* minutes after the day's midnight, for the sun on the sky */
  const nowMin = Math.round((now - mapTime(tk, 0)) / 60000);
  const [ask] = useState(() => {
    const a = mapAsk(snap.days, tk, now);
    return a && a.k !== tk ? a : null;
  });
  const old = mapOf(snap.days, tk);
  const first = mapStart(tk, now);
  const [step, setStep] = useState<Step>(ask ? 'held' : 'outcome');
  const [hist, setHist] = useState<Step[]>([]);
  const [dir, setDir] = useState(1);
  const [heldAns, setHeldAns] = useState<MapHeld | null>(null);
  const [o, setO] = useState<MapOutcome | null>(old?.o ?? null);
  const [h, setH] = useState<number | null>(old?.h ?? null);
  const [links, setLinks] = useState<MapLink[]>(old?.l ?? []);
  const [moves, setMoves] = useState<MapMove[]>(old?.m ?? []);
  const [remind, setRemind] = useState(remindersOffered);
  const [clear, setClear] = useState(false);
  const [pts0] = useState(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).pts : 0));
  /* the ring on the storm pops on a moment after the end screen opens */
  const [ringOn, setRingOn] = useState(false);
  useEffect(() => {
    if (step !== 'end') return;
    const id = setTimeout(() => setRingOn(true), 500);
    return () => clearTimeout(id);
  }, [step]);

  if (!st) return null;
  const thoughts = mapThoughts(links);
  const order: Step[] = [...(ask ? (['held'] as Step[]) : []), 'outcome', 'storm', 'links', ...(thoughts.length ? (['thought'] as Step[]) : []), 'plan', 'end'];
  const go = (next: Step) => {
    setHist((x) => x.concat(step));
    setDir(1);
    setStep(next);
  };
  const next = () => go(order[order.indexOf(step) + 1] || 'end');
  const back = () => {
    const x = hist.slice();
    const p = x.pop();
    if (!p) return;
    setHist(x);
    setDir(-1);
    setStep(p);
  };
  const toggle = <K extends string>(list: K[], k: K, set: (l: K[]) => void) => {
    buzz('tap');
    set(list.indexOf(k) >= 0 ? list.filter((x) => x !== k) : list.concat(k));
  };
  /* the map is saved as the end screen opens */
  const finish = (mp: DayMap) => {
    update((s0) => ({ ...s0, days: saveMap(s0.days, tk, mp) }));
    if (mp.h != null && remind && remindersOffered) scheduleMap(mapTime(tk, mp.h), mapClock(mp.h) + ': ' + mp.m.map(mapMoveName).join('. ') + '.');
    buzz('lit');
    play('chime');
    setHist([]);
    setDir(1);
    setStep('end');
  };
  const done = () => {
    close();
    say(clear ? 'Clear skies. Enjoy them.' : 'Your day is mapped.');
  };

  let body: React.ReactNode;
  let footer: React.ReactNode = null;
  if (step === 'held' && ask) {
    const pick = (r: MapHeld) => {
      update((s0) => ({ ...s0, days: holdMap(s0.days, ask.k, r) }));
      setHeldAns(r);
      buzz(r === 'n' ? 'tap' : 'lit');
    };
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Yesterday
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {heldAns == null
            ? 'Your ' + mapClock(ask.mp.h!) + ' storm. Did your plan hold?'
            : heldAns === 'n'
              ? 'Thanks for being honest.'
              : 'It held. That is a star.'}
        </T>
        <View style={s.middle}>
          <DaySky now={null} storm={ask.mp.h} planned held={heldAns === 'y' || heldAns === 'm'} />
          {heldAns === 'n' ? (
            <Appear by={10}>
              <T style={s.c}>A slip is data, not a reset. Today’s map can use what you learned. If you have not logged it, you can do that from Today.</T>
            </Appear>
          ) : heldAns ? (
            <Appear by={10}>
              <T style={s.c}>You saw it coming and you met it. That is how a new habit is built.</T>
            </Appear>
          ) : (
            <T style={s.c} tone="muted">
              {mapIfThen(ask.mp)}
            </T>
          )}
        </View>
        <Dock>
          {heldAns == null ? (
            <>
              <BigOption tone="mint" icon="check" title="It held" onPress={() => pick('y')} />
              <BigOption tone="sun" icon="wave" title="Mostly" sub="A close call, and I came through" onPress={() => pick('m')} />
              <BigOption tone="slip" icon="leaf" title="It slipped" sub="A slip is data, not a reset." onPress={() => pick('n')} />
            </>
          ) : (
            <Appear by={10} duration={240}>
              <Button label="On to today" onPress={next} />
            </Appear>
          )}
        </Dock>
      </>
    );
  } else if (step === 'outcome') {
    const word = MAP_OUTCOMES.find((x) => x[0] === o);
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Tonight
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          At the end of a clean day, how will you feel?
        </T>
        <View style={s.middle}>
          <View style={s.glow}>
            <Svg width={250} height={250} style={StyleSheet.absoluteFill}>
              <Defs>
                <RadialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#FFD45E" stopOpacity={0.55} />
                  <Stop offset="0.55" stopColor="#FFD45E" stopOpacity={0.28} />
                  <Stop offset="1" stopColor="#FFD45E" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={125} cy={125} r={125} fill="url(#mapGlow)" />
            </Svg>
            {word ? (
              <Appear key={word[0]} by={8} duration={260} style={{ alignItems: 'center' }}>
                <Text style={[s.word, { color: c.ink }]}>{word[1]}</Text>
                <T v="small" tone="muted" style={s.c}>
                  {word[2]}
                </T>
              </Appear>
            ) : (
              <Icon name="sun" size={56} color={c.sunText} />
            )}
          </View>
        </View>
        <Dock>
          <View style={s.grid} accessibilityRole="radiogroup" accessibilityLabel="How you will feel tonight">
            {MAP_OUTCOMES.map(([k, name]) => (
              <Pressable
                key={k}
                accessibilityRole="radio"
                accessibilityState={{ checked: o === k }}
                onPress={() => {
                  buzz('tap');
                  setO(k);
                }}
                style={({ pressed }) => [
                  s.tile,
                  {
                    backgroundColor: o === k ? c.accentSoft : c.surface,
                    borderColor: o === k ? c.accent : 'transparent',
                    shadowColor: c.lip,
                    transform: [{ translateY: pressed ? 2 : 0 }],
                  },
                ]}>
                <Text style={[s.tileT, { color: o === k ? c.accentText : c.ink }]}>{name}</Text>
              </Pressable>
            ))}
          </View>
          {o ? (
            <Appear by={10} duration={240}>
              <Button label="Next" onPress={next} />
            </Appear>
          ) : (
            <View style={s.btnSpace} />
          )}
        </Dock>
      </>
    );
    footer = o ? null : <Link label="Skip this one" onPress={next} />;
  } else if (step === 'storm') {
    const lo = first ?? MAP_LAST;
    const v = h == null ? null : Math.max(lo, h);
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Today
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Is there an hour that could be hard?
        </T>
        <T style={s.c} tone="muted">
          Slide the storm to it. Finding it now, while it is quiet, is half the work.
        </T>
        <View style={s.middle}>
          <DaySky now={nowMin} storm={v} />
          <Text style={[s.clock, { color: v == null ? c.muted : c.ink }]}>{v == null ? 'Slide below' : mapClock(v)}</Text>
        </View>
        <Dock>
          {first != null ? <Slider label="The hard hour" value={v} min={lo} max={MAP_LAST} step={30} show={mapClock} readout={false} onChange={setH} /> : null}
          {v != null ? (
            <Appear by={10} duration={240}>
              <Button label="Next" onPress={next} />
            </Appear>
          ) : (
            <View style={s.btnSpace} />
          )}
        </Dock>
      </>
    );
    footer = (
      <Link
        label="No hard hour today: clear skies"
        onPress={() => {
          setClear(true);
          finish({ o, h: null, l: [], m: [], r: null });
        }}
      />
    );
  } else if (step === 'links') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          {mapClock(h!)}
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          What is it counting on?
        </T>
        <T style={s.c} tone="muted">
          Pick any. Each one is a link you can change.
        </T>
        <Dock>
          <View style={s.list}>
            {MAP_LINKS.map(([k, name, sub]) => (
              <Check key={k} on={links.indexOf(k) >= 0} title={name} sub={sub} onPress={() => toggle(links, k, setLinks)} />
            ))}
          </View>
          <Button label="Next" onPress={next} />
        </Dock>
      </>
    );
  } else if (step === 'thought') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          The thought behind it
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {thoughts.length > 1 ? 'Answer them now' : 'Answer it now'}
        </T>
        <View style={[s.middle, { gap: 12 }]}>
          {thoughts.map(([q, a], j) => (
            <Appear key={q} delay={120 + j * 90} by={12} style={[s.card, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <Text style={[s.quote, { color: c.violetText }]}>“{q}”</Text>
              <T>{a}</T>
            </Appear>
          ))}
        </View>
        <Dock>
          <Button label="Next" onPress={next} />
        </Dock>
      </>
    );
  } else if (step === 'plan') {
    const line = mapIfThen({ h, l: links, m: moves });
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Your plan
        </T>
        <Appear key={moves.join()} by={4} duration={200} style={[s.card, { backgroundColor: c.surface, shadowColor: c.lip }]}>
          <Text style={[s.quote, { color: moves.length ? c.ink : c.muted }]}>{moves.length ? line : 'If it is ' + mapClock(h!) + ', then I…'}</Text>
        </Appear>
        <Dock>
          <View style={s.list}>
            {mapMoves(links).map(([k, name, sub]) => (
              <Check key={k} on={moves.indexOf(k) >= 0} title={name} sub={sub} onPress={() => toggle(moves, k, setMoves)} />
            ))}
          </View>
          {remindersOffered ? (
            <View style={s.row}>
              <Chip label={'Remind me at ' + mapClock(h!)} on={remind} onPress={() => setRemind(!remind)} />
            </View>
          ) : null}
          {moves.length ? (
            <Appear by={10} duration={240}>
              <Button label="Map my day" onPress={() => finish({ o, h, l: links, m: moves, r: null })} />
            </Appear>
          ) : (
            <T v="small" tone="muted" style={[s.c, s.pickOne]}>
              Pick at least one.
            </T>
          )}
        </Dock>
      </>
    );
  } else {
    const g = gameCompute(snap.days, st, snap.reviews, tk);
    const gain = Math.max(0, g.pts - pts0);
    const stars = mapStars(snap.days);
    const word = MAP_OUTCOMES.find((x) => x[0] === o);
    body = (
      <>
        <View style={s.endMid}>
          <View style={s.endSky}>
            <DaySky height={230} now={nowMin} storm={clear ? null : h} planned={ringOn} clear={clear} />
          </View>
          <Appear delay={200}>
            <T v="title" style={s.c} accessibilityRole="header">
              {clear ? 'Clear skies.' : 'Your day is mapped.'}
            </T>
          </Appear>
          <Appear delay={300} style={{ alignItems: 'center', gap: 6, alignSelf: 'stretch' }}>
            {clear ? (
              <T style={s.c}>Enjoy it. If that changes, SOS is one tap away.</T>
            ) : (
              <View style={[s.card, { backgroundColor: c.surface, shadowColor: c.lip }]}>
                <Text style={[s.quote, { color: c.ink }]}>{mapIfThen({ h, l: links, m: moves })}</Text>
                {word ? (
                  <T v="small" tone="muted">
                    And tonight: {word[1].toLowerCase()}.
                  </T>
                ) : null}
              </View>
            )}
            {gain ? <CountUp to={gain} prefix="+" suffix={gain === 1 ? ' point' : ' points'} delay={700} style={[s.pts, { color: c.mintText }]} /> : null}
          </Appear>
          <Appear delay={520} style={[s.stars, { backgroundColor: c.scheme === 'dark' ? '#1B1650' : '#2D2A70' }]}>
            <Icon name="star" size={18} color="#FFD45E" />
            <Text style={s.starsT}>
              Star {stars.all} in your sky{stars.held ? ' · ' + stars.held + (stars.held === 1 ? ' storm' : ' storms') + ' weathered' : ''}
            </Text>
          </Appear>
        </View>
        <Dock>
          <Button label="Done" onPress={done} />
        </Dock>
      </>
    );
  }

  const n = order.length - 1;
  const i = order.indexOf(step);
  return (
    <SceneFrame
      title="Map your day"
      sky="sky"
      dots={{ n, i, label: step === 'end' ? 'All done' : 'Step ' + (i + 1) + ' of ' + n }}
      onBack={step !== 'end' && hist.length ? back : null}
      onClose={step === 'end' ? done : close}
      footer={footer}>
      <Appear key={step} x={hist.length || step === 'end' ? 36 * dir : 0} by={0} duration={280} style={s.stage}>
        {body}
      </Appear>
    </SceneFrame>
  );
}

/* one answer that can be picked with others: a check circle, the words, and a short line under them */
function Check({ on, title, sub, onPress }: { on: boolean; title: string; sub: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={({ pressed }) => [
        s.check,
        {
          backgroundColor: on ? c.accentSoft : c.surface,
          borderColor: on ? c.accent : 'transparent',
          shadowColor: c.lip,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}>
      <View style={[s.box, { borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : 'transparent' }]}>
        {on ? <Icon name="check" size={16} color={c.accentInk} /> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.checkT, { color: on ? c.accentText : c.ink }]}>{title}</Text>
        <Text style={[s.checkS, { color: c.muted }]}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 160 },
  endMid: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 14 },
  endSky: { alignSelf: 'stretch' },
  glow: { width: 250, height: 250, alignItems: 'center', justifyContent: 'center', padding: 34 },
  word: { fontFamily: font.displayBold, fontSize: 44, lineHeight: 52, textAlign: 'center' },
  clock: { fontFamily: font.displayBold, fontSize: 40, lineHeight: 46, fontVariant: ['tabular-nums'] },
  btnSpace: { height: 52 },
  pickOne: { minHeight: 52, paddingTop: 16 },
  row: { flexDirection: 'row', justifyContent: 'center' },
  grid: { alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  tileT: { fontFamily: font.bodyBold, fontSize: 16.5 },
  list: { alignSelf: 'stretch', gap: 8 },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  box: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkT: { fontFamily: font.bodyBold, fontSize: 16, lineHeight: 21 },
  checkS: { fontFamily: font.body, fontSize: 13.5, lineHeight: 18 },
  card: {
    alignSelf: 'stretch',
    gap: 6,
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  quote: { fontFamily: font.display, fontSize: 20, lineHeight: 27 },
  pts: { fontFamily: font.display, fontSize: 18 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  starsT: { fontFamily: font.bodyBold, fontSize: 14, color: '#FFFFFF' },
});
