/* The morning: a short full-screen moment, like the check-in, under a sunrise sky. It asks what the app does not know about
   last night (core: morningAsk): whether the phone stayed away, when it was put away, or else whether screens went off.
   Then sleep, big in the middle with the slider under the thumb. Then the morning is done, and today's lesson is one tap
   away. Answers are saved as they are given, so closing early keeps them. Opened from Last night in "Your day" and from
   Next up. */
import {
  clockOf,
  fmtClock,
  gameCompute,
  lessonStop,
  lmin,
  morningAsk,
  morningDone,
  morningInfo,
  morningSaid,
  setScreensOff,
  setSleep,
  stopTiles,
} from '@daybook/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Appear } from '@/components/appear';
import { BigOption, Link } from '@/components/choices';
import { CountUp } from '@/components/count-up';
import { DoneMark } from '@/components/done-mark';
import { Dock, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

const STEPS = ['so', 'h', 'end'] as const;
type Step = (typeof STEPS)[number];
const hoursText = (h: number) => (h % 1 ? h.toFixed(1) : String(h));

export default function Morning() {
  const c = useTheme();
  const { snap, tk, now, update } = useStore();
  const st = snap.settings;
  const [step, setStep] = useState<Step>('so');
  const [hist, setHist] = useState<Step[]>([]);
  const [dir, setDir] = useState(1);
  const [pts0] = useState(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).pts : 0));
  if (!st) return null;
  const mi = morningInfo(snap.days, st, tk);
  const a = morningAsk(snap.days, st, tk);
  const answered = mi.so != null || mi.h != null;

  const go = (to: Step) => {
    setHist((h) => h.concat(step));
    setDir(1);
    if (to === 'end' && answered && !mi.m) update((s0) => ({ ...s0, days: morningDone(s0.days, tk) }));
    if (to === 'end' && answered) buzz('lit');
    setStep(to);
  };
  const next = () => go(STEPS[STEPS.indexOf(step) + 1]);
  const back = () => {
    const h = hist.slice();
    const p = h.pop();
    if (!p) return;
    setHist(h);
    setDir(-1);
    setStep(p);
  };

  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (!mi.applies) {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          Nothing to ask yet
        </T>
        <T style={s.c} tone="muted">
          From your second morning, this asks two quick things about the night before.
        </T>
        <Dock>
          <Button label="Done" onPress={close} />
        </Dock>
      </>
    );
  } else if (step === 'so') {
    const pick = (v: 'Y' | 'N') => {
      buzz('tap');
      /* the same answer again would clear it; here it only moves on */
      if (mi.so !== v) update((s0) => ({ ...s0, days: setScreensOff(s0.days, mi.prev, v) }));
      setTimeout(next, 220);
    };
    body = (
      <>
        <T v="eyebrow" tone="muted">
          {a.eyebrow}
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {a.q}
        </T>
        <T style={s.c} tone="muted">
          {a.sub}
        </T>
        <View style={s.middle}>
          <NightArc from={fmtClock(a.from)} to={fmtClock(clockOf(now))} />
        </View>
        <Dock>
          <BigOption tone="mint" icon="moon" title={a.yes.t} sub={a.yes.s} selected={mi.so === 'Y'} onPress={() => pick('Y')} />
          <BigOption tone="sun" icon="leaf" title={a.no.t} sub={a.no.s} selected={mi.so === 'N'} onPress={() => pick('N')} />
        </Dock>
      </>
    );
    footer = <Link label="Skip this one" onPress={next} />;
  } else if (step === 'h') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Sleep
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          How long did you sleep?
        </T>
        <T style={s.c} tone="muted">
          A guess is fine.
        </T>
        <View style={s.middle}>
          <SliderValue big value={mi.h} show={hoursText} unit="hours" hint="Slide below to answer" />
        </View>
        <Dock>
          <Slider
            label="Hours of sleep"
            value={mi.h}
            min={3}
            max={12}
            step={0.5}
            show={hoursText}
            unit="hours"
            readout={false}
            onChange={(h) => update((s0) => ({ ...s0, days: setSleep(s0.days, tk, h) }))}
          />
          {mi.h != null ? (
            <Appear by={10} duration={240}>
              <Button label="Next" onPress={next} />
            </Appear>
          ) : (
            <View style={s.btnSpace} />
          )}
        </Dock>
      </>
    );
    footer = <Link label="Skip this one" onPress={next} hidden={mi.h != null} />;
  } else if (!answered) {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          Nothing saved yet
        </T>
        <T style={s.c} tone="muted">
          Last night stays open on Your day. Answer any time today.
        </T>
        <Dock>
          <Button label="Done" onPress={close} />
        </Dock>
      </>
    );
  } else {
    const gain = Math.max(0, gameCompute(snap.days, st, snap.reviews, tk).pts - pts0);
    const said = morningSaid(snap.days, st, tk);
    /* today's lesson, when it is part of today and not read yet */
    const lt = stopTiles(snap.days, st, tk, now).tiles.find((t) => t.k === 'lesson' && !t.done);
    const ls = lt ? lessonStop(snap.days, st, tk) : null;
    body = (
      <>
        <DoneMark />
        <Appear delay={180}>
          <T v="title" style={s.c} accessibilityRole="header">
            Morning done.
          </T>
        </Appear>
        {gain ? <CountUp to={gain} prefix="+" suffix=" points" delay={600} style={[s.pts, { color: c.mintText }]} /> : null}
        <Appear delay={300} style={s.chips}>
          {said.map((x) => (
            <View key={x} style={[s.chip, { backgroundColor: c.surface }]}>
              <Text style={[s.chipT, { color: c.ink }]}>{x}</Text>
            </View>
          ))}
        </Appear>
        <Dock>
          {ls ? (
            <>
              <Appear delay={420} by={14} style={[s.lesson, { backgroundColor: c.surface, shadowColor: c.lip }]}>
                <View style={[s.lessonIc, { backgroundColor: c.skySoft }]}>
                  <Icon name="book" size={22} color={c.skyText} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.lessonEb, { color: c.skyText }]}>{ls.kind === 'next' ? 'TODAY’S LESSON' : 'READ ONE AGAIN'}</Text>
                  <Text style={[s.lessonT, { color: c.ink }]}>{ls.L.title}</Text>
                  <T v="small" tone="muted">
                    {[ls.kind === 'next' ? 'Lesson ' + ls.n + ' of ' + ls.total : '', lmin(ls.L), ls.kind === 'next' ? '+10 points' : '+5 points']
                      .filter(Boolean)
                      .join(' · ')}
                  </T>
                </View>
              </Appear>
              <Button
                label={ls.kind === 'next' ? 'Start today’s lesson' : 'Read it again'}
                icon="play"
                onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: ls.L.id } })}
              />
            </>
          ) : (
            <Button label="Done" onPress={close} />
          )}
        </Dock>
      </>
    );
  }

  const i = STEPS.indexOf(step);
  return (
    <SceneFrame
      title="Morning"
      sky="sun"
      dots={mi.applies ? { n: STEPS.length, i, label: step === 'end' ? 'All done' : 'Step ' + (i + 1) + ' of ' + STEPS.length } : null}
      onBack={step !== 'end' && hist.length ? back : null}
      onClose={close}
      footer={footer}>
      <Appear key={step} x={step === 'so' && !hist.length ? 0 : 36 * dir} by={0} duration={280} style={s.stage}>
        {body}
      </Appear>
    </SceneFrame>
  );
}

/* the night just gone, as an arc: the moon at the time screens went off, the sun now, and the phone in between */
function NightArc({ from, to }: { from: string; to: string }) {
  const c = useTheme();
  return (
    <View style={{ alignItems: 'center' }} accessible accessibilityLabel={'Last night, from ' + from + ' to ' + to}>
      <Svg width={300} height={150} viewBox="0 0 300 150">
        <Path d="M36 122 Q150 -14 264 122" fill="none" stroke={c.muted} strokeOpacity={0.55} strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" />
        <Circle cx={36} cy={122} r={24} fill="#2A2275" />
        <Circle cx={264} cy={122} r={33} fill={c.sun} fillOpacity={0.3} />
        <Circle cx={264} cy={122} r={23} fill={c.sun} />
        <Rect x={133} y={34} width={34} height={56} rx={8} fill="none" stroke={c.ink} strokeOpacity={0.8} strokeWidth={3} />
        <Circle cx={150} cy={81} r={3} fill={c.ink} fillOpacity={0.8} />
      </Svg>
      <View style={s.arcMoon} pointerEvents="none">
        <Icon name="moon" size={22} color="#FFE27A" />
      </View>
      <View style={s.arcRow}>
        <Text style={[s.arcT, { color: c.muted }]}>{from}</Text>
        <Text style={[s.arcT, { color: c.muted }]}>{to}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', minHeight: 180 },
  btnSpace: { height: 52 },
  pts: { fontFamily: font.display, fontSize: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipT: { fontFamily: font.bodySemi, fontSize: 14 },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    padding: 14,
    borderRadius: 20,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 3 },
  },
  lessonIc: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  lessonEb: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1 },
  lessonT: { fontFamily: font.display, fontSize: 20, lineHeight: 25 },
  arcMoon: { position: 'absolute', left: 25, top: 111 },
  arcRow: { flexDirection: 'row', justifyContent: 'space-between', width: 300, paddingHorizontal: 4, marginTop: 4 },
  arcT: { fontFamily: font.bodySemi, fontSize: 14, width: 64, textAlign: 'center' },
});
