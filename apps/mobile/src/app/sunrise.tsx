/* The sunrise check, now one question: keep the run going or start fresh, when the slip's Rekindle was closed before that
   answer (core sunriseAsk). Today's card opens it from the day after the slip until it is answered. Coming back is the
   check itself: Today marks it as it opens (core srDone), so nothing else is asked here (the owner, October 24, 2026: no
   "what came before the slip", no questions out of the blue). A welcome, the question, and what it means. */
import {
  addDays,
  gameCompute,
  lowerFirst,
  patchEvent,
  rkBack,
  rkLights,
  rkChoice,
  rkComebackLine,
  rkComebacks,
  rkKeep,
  rkAsk,
  rkMissions,
  rkOf,
  rkUntil,
  srDone,
  srEnd,
  srWhen,
  sunriseAsk,
} from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BigOption } from '@/components/choices';
import { LineNote } from '@/components/line-note';
import { Flames, Lights, Missions } from '@/components/rekindle';
import { Comebacks } from '@/components/rk-art';
import { Dock, SceneFrame } from '@/components/scene';
import { SunArt } from '@/components/sun-art';
import { Button, Card, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { count } from '@/lib/pulse';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font } from '@/lib/theme';

const STEPS = ['hi', 'run'];

export default function Sunrise() {
  const { snap, tk, now, update } = useStore();
  const st = snap.settings;
  /* what this check is about is fixed when it opens: the run question still open from an earlier day */
  const [start] = useState(() => {
    if (!st) return null;
    const a = sunriseAsk(snap.days, st, tk);
    const r = a ? rkOf(snap.days, a.k, st) : null;
    return a && r ? { k: a.k, evId: r.ev.id, run0: a.run } : null;
  });
  const [step, setStep] = useState<'hi' | 'run' | 'end'>('hi');
  const [pts0] = useState(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).pts : 0));

  if (!st || !start) return <Redirect href="/" />;
  const { k, evId, run0 } = start;
  const ev = snap.days[k]?.events.find((x) => x.id === evId) || null;
  const r = rkOf(snap.days, k, st);
  if (!ev || !r)
    return (
      <SceneFrame title="Sunrise" onClose={close}>
        <T v="title" style={s.c}>
          This entry is not here anymore.
        </T>
        <T style={s.c}>It may have been removed. Nothing else changed.</T>
        <Dock>
          <Button label="Close" onPress={close} />
        </Dock>
      </SceneFrame>
    );

  /* the answer, and coming back marked too in case Today has not marked it yet (it waits for sync) */
  const answer = (keep: boolean | null) => {
    update((s0) => {
      if (!s0.settings) return s0;
      const a = rkAsk(s0.days, s0.settings, tk, k);
      let days = keep != null && a && a.open ? rkKeep(s0.days, s0.settings, tk, k, a.evId, keep) || s0.days : s0.days;
      days = srDone(days, k, evId, tk);
      return days === s0.days ? s0 : { ...s0, days };
    });
    count('sunrise');
    buzz(keep == null ? 'tap' : 'lit');
    setStep('end');
  };

  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const gain = Math.max(0, g.pts - pts0);
  const hour = new Date(now).getHours();
  const comeback = rkBack(k);
  let body: React.ReactNode;

  if (step === 'hi') {
    const cb = rkComebacks(snap.days, st, k);
    const after = tk === addDays(k, 1);
    body = (
      <>
        <SunArt />
        <T v="eyebrow" tone="muted">
          Rekindle · your run
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Welcome back.
        </T>
        <T style={s.c}>
          {after ? 'Yesterday is logged and done, and nothing reset.' : 'The slip is logged and done, and nothing reset.'} One question about your run, and the
          day goes on.
        </T>
        {/* who the person said they are becoming: one slip does not change it */}
        {String(st.becoming || '').trim() ? <T style={[s.c, { fontFamily: font.bodySemi }]}>{'Still true: ' + String(st.becoming).trim()}</T> : null}
        <LineNote
          b={`Your ${run0}-day run is kept for now.`}
          rest={
            comeback
              ? `Coming back saves it: the next urge you ride out, or a day with no slip, by ${rkUntil(k)} night.`
              : `The Rekindle quest saves it, any time until ${rkUntil(k)} night.`
          }
        />
        <Flames on={comeback ? rkLights(snap.days, st, tk, k).flames.map((f) => f.on) : [r.m1, r.m2, r.m3]} big />
        {cb.before ? (
          <>
            <Comebacks cb={cb} />
            <T style={s.c}>{rkComebackLine(cb)}</T>
          </>
        ) : null}
        <Dock>
          <Button label="Next" onPress={() => setStep('run')} />
        </Dock>
      </>
    );
  } else if (step === 'run') {
    /* keep the run going, or start fresh. Until now the run was kept for now; both answers are good ones. */
    const a = rkAsk(snap.days, st, tk, k);
    const choice = a && a.open ? rkChoice(snap.days, st, tk, a) : null;
    body =
      a && choice ? (
        <>
          <T v="eyebrow" tone="muted">
            Your run
          </T>
          <T v="title" style={s.c} accessibilityRole="header">
            {'Keep your ' + a.run + '-day run going, or start fresh?'}
          </T>
          <T style={s.c}>{choice.line}</T>
          <View style={s.middle} accessible accessibilityLabel={a.run + ' days in a row'}>
            <T v="big" style={s.runN}>
              {String(a.run)}
            </T>
            <T tone="muted">days in a row</T>
          </View>
          <Dock>
            <BigOption tone="sun" icon="flame" title="Keep it going" sub={choice.keep} selected={a.keep == null ? null : a.keep} onPress={() => answer(true)} />
            <BigOption
              tone="mint"
              icon="sparkle"
              title="Start fresh"
              sub={choice.fresh}
              selected={a.keep == null ? null : !a.keep}
              onPress={() => answer(false)}
            />
          </Dock>
        </>
      ) : (
        <>
          <T v="title" style={s.c} accessibilityRole="header">
            {a && a.saved ? 'Your run is saved.' : 'Nothing to decide here now.'}
          </T>
          <Dock>
            <Button label="Next" onPress={() => answer(null)} />
          </Dock>
        </>
      );
  } else {
    const e = srEnd(snap.days, st, tk, k, r, run0);
    const pl = ev.rk && ev.rk.pl;
    body = (
      <>
        <Flames on={e.flames} big />
        <T v="title" style={s.c} accessibilityRole="header">
          {e.h}
        </T>
        <T style={s.c}>
          {e.sub}
          {gain ? <T v="label" tone="mintText">{`  +${gain} points`}</T> : null}
        </T>
        {e.lights ? (
          <Lights list={e.lights} />
        ) : e.op ? (
          <Missions
            list={rkMissions(r, st, { where: 'scene', deep: e.op.deep, left: true, hour, until: rkUntil(k) })}
            onAction={(_m, act) => {
              if (act === 'small') {
                update((s0) => ({ ...s0, days: patchEvent(s0.days, k, evId, { recovered: true }) }));
                count('rk_small');
              } else if (act === 'trace' || act === 'tell') router.push({ pathname: '/deeper', params: { k, kind: act } });
            }}
          />
        ) : null}
        {/* a plan saved by an older sunrise check, kept on the slip */}
        {pl ? (
          <Card style={{ alignSelf: 'stretch' }}>
            <T v="small" tone="muted">
              Your plan
            </T>
            <T>
              <T v="label">If</T> {srWhen(ev.trigger, st)}, <T v="label">then</T> {lowerFirst(pl)}
            </T>
          </Card>
        ) : null}
        <Dock>
          <Button label="Done" onPress={close} />
        </Dock>
      </>
    );
  }

  const i = step === 'end' ? STEPS.length : STEPS.indexOf(step);
  return (
    <SceneFrame
      title="Sunrise"
      sky="sun"
      dots={{ n: STEPS.length, i, label: step === 'end' ? 'All done' : 'Step ' + (i + 1) + ' of ' + STEPS.length }}
      onBack={step === 'run' ? () => setStep('hi') : null}
      onClose={close}>
      {body}
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 140 },
  runN: { fontSize: 84, lineHeight: 92 },
});
