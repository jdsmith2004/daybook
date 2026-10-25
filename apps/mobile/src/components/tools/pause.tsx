/* The 10-minute pause. The timer is kept on this device, so it keeps counting when the app is closed. At the end: how is the urge
   now? Ported from the legacy SCENES.pause, creditPause and the pause part of ciPick. */
import {
  addEvent,
  blankP,
  changeDay,
  clockOf,
  didIds,
  gameCompute,
  logicalKey,
  PAUSE_MS,
  pickIdea,
  rkStepFor,
  rkWaitOf,
  trigFits,
  urAnswer,
  urEntry,
  urWon,
  withDay,
  type Outcome,
} from '@daybook/core';
import { router } from 'expo-router';
import { useNextTool } from '@/lib/tools';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BigOption, Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { useSeconds } from '@/components/orb';
import { Button, Card, T } from '@/components/ui';
import { Dock, Middle, Stage } from '@/components/scene';
import { buzz } from '@/lib/feel';
import { play } from '@/lib/sound';
import { close } from '@/lib/nav';
import { useSos, type PauseTimer } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

import { BEAT_BREATH, ToolTimer } from './timer';
import type { ToolProps } from './types';

export function Pause({ level, now: openedAt }: ToolProps & { now: number }) {
  const nextTool = useNextTool();
  const { snap, update, say } = useStore();
  const c = useTheme();
  const sos = useSos();
  const st = useCareSettings();
  const t = sos.timer;
  const [idea, setIdea] = useState(() => pickIdea(st, null, Math.random));
  const [again, setAgain] = useState(false);
  const sec = useSeconds(t ? t.start : null, !!t);
  const nowMs = t ? t.start + sec * 1000 : openedAt;
  const mode: 'ready' | 'run' | 'done' = !t ? 'ready' : nowMs < t.start + t.dur ? 'run' : 'done';

  /* the pause counts as a calm move once it ends; only a full ten minutes counts as the pause tool itself */
  const credit = (tm: PauseTimer): PauseTimer => {
    if (tm.credited) return tm;
    let gain = 0;
    update((s) => {
      if (!s.settings) return s;
      const key = logicalKey(tm.start, s.settings.rollover);
      const before = gameCompute(s.days, s.settings, s.reviews, key).pts;
      const day = changeDay(s.days[key], key, (d) => {
        const p = d.p || blankP();
        p.c = Math.min(50, p.c + 1);
        if (!tm.early && p.tl.indexOf('pause') < 0) p.tl.push('pause');
        d.p = p;
      });
      const days = withDay(s.days, key, day);
      gain = Math.max(0, gameCompute(days, s.settings, s.reviews, key).pts - before);
      return { ...s, days };
    });
    const next = { ...tm, credited: true, gain };
    sos.setTimer(next);
    return next;
  };
  useEffect(() => {
    if (mode === 'done' && t && !t.credited) {
      credit(t);
      buzz('lit');
      play('chime');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const start = () => {
    sos.setTimer({ start: Date.now(), dur: PAUSE_MS, credited: false });
    setAgain(false);
    buzz('tap');
  };
  /* from SOS the ten minutes start at once: the urge is already here, so there is nothing to read first */
  useEffect(() => {
    if (sos.ur && !t) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* the one thing that helps most while waiting: a different room (in bed, out of it) */
  const room = trigFits('late', clockOf(nowMs)) ? 'If you are in bed, get up and leave the room.' : 'If you can, step into another room.';
  const endEarly = () => {
    if (!t) return;
    credit({ ...t, early: true, dur: Math.max(1000, Date.now() - t.start) });
  };

  /* the answer to "How is the urge now?" */
  const answer = (v: Outcome | 'again') => {
    if (!t || !st) return;
    const full = !t.early;
    if (sos.ur) {
      /* started from SOS: the pause is one more round, and SOS carries on (the entry keeps SOS's start time) */
      sos.setTimer(null);
      const u = { ...sos.ur, used: sos.ur.used.concat('pause'), roundDone: false };
      if (v === 'again') {
        sos.set(urAnswer(u, 'again'));
        router.back();
        return;
      }
      const a = urAnswer(u, v);
      const e = urEntry(a, v, st, Date.now(), v === 'rode' && full ? { paused: true } : {});
      let id = '';
      let days = snap.days;
      days = update((s) => {
        const r = addEvent(s.days, e.key, v, e.time, e.fields);
        id = r.id;
        return { ...s, days: r.days };
      }).days;
      sos.setMem((m) => ({ ...(v === 'rode' ? urWon(m, a) : m), last: e.last }));
      const step = v === 'slipped' ? rkStepFor(days, e.key) : !e.trig ? 'trigger' : v === 'rode' && !e.did.length ? 'did' : 'done';
      sos.end();
      router.dismissAll();
      router.push({
        pathname: '/log',
        params: { date: e.key, evId: id, outcome: v, step, from: 'urge', pts0: String(a.p0), st: a.strength || '', m: String(e.mins) },
      });
      return;
    }
    if (v === 'again') {
      setAgain(true);
      return;
    }
    const key = logicalKey(t.start, st.rollover);
    const time = clockOf(t.start);
    const pts0 = gameCompute(snap.days, st, snap.reviews, key).pts;
    const did = v === 'rode' ? didIds(['pause']) : [];
    const waited = Math.round((Date.now() - t.start) / 60000);
    let id = '';
    const days = update((s) => {
      const r = addEvent(s.days, key, v, time, {
        paused: v === 'rode' && full ? true : null,
        did: did.length ? did : null,
        ...(v === 'slipped' ? { wt: rkWaitOf(waited) } : {}),
      });
      id = r.id;
      return { ...s, days: r.days };
    }).days;
    sos.setTimer(null);
    const step = v === 'slipped' ? rkStepFor(days, key) : 'trigger';
    router.replace({ pathname: '/log', params: { date: key, evId: id, outcome: v, step, from: 'pause', pts0: String(pts0) } });
  };

  if (mode === 'ready')
    return (
      <Stage key="ready" dir={0}>
        <Middle>
          <Flame level={level} size={140} />
          <T v="title" style={s.c} accessibilityRole="header">
            Ten minutes. That is all.
          </T>
          <T style={s.c}>An urge is a wave: it builds, peaks, and passes. You do not have to fight it or obey it. Just outlast this one.</T>
        </Middle>
        <Dock>
          <Button label="Start the 10 minutes" onPress={start} />
          <T v="small" tone="muted" style={s.c}>
            {room + ' The timer keeps counting if you close the app.'}
          </T>
        </Dock>
      </Stage>
    );
  if (mode === 'run' && t) {
    const left = t.start + t.dur - nowMs;
    const el = (nowMs - t.start) / 1000;
    return (
      <Stage key="run" dir={1}>
        <T v="title" style={s.c} accessibilityRole="header">
          Let the wave pass.
        </T>
        <T style={s.c}>{room}</T>
        <Middle>
          {/* Move's timer: the squiggle ring fills as the ten minutes pass, and a soft shape inside breathes slowly by
              itself (4 in, 6 out) */}
          <ToolTimer
            p={1 - left / t.dur}
            left={left}
            sec={el}
            beat={BEAT_BREATH}
            label="Waiting it out"
            color={c.scheme === 'dark' ? c.sun : c.accent}
            ink={c.accentText}
          />
        </Middle>
        <Dock>
          <Card style={{ alignSelf: 'stretch', alignItems: 'center' }}>
            <T v="small" tone="muted">
              While you wait, try
            </T>
            <T v="label" style={s.c}>
              {idea}
            </T>
            <Link label="Another idea" onPress={() => setIdea(pickIdea(st, idea, Math.random))} />
          </Card>
          {/* ten minutes is a guide: the pause can end whenever the urge eases, or hand on to a person */}
          <View style={s.row}>
            <Link label="End the pause" onPress={endEarly} />
            <Link
              label="Want a person right now?"
              onPress={() => {
                endEarly();
                sos.setTimer(null);
                if (sos.ur) sos.set({ ...sos.ur, used: sos.ur.used.concat('pause') });
                nextTool('message');
              }}
            />
          </View>
        </Dock>
      </Stage>
    );
  }
  if (again)
    return (
      <Stage key="again" dir={1}>
        <Flame level={level} size={96} />
        <T v="title" style={s.c} accessibilityRole="header">
          That is okay. Waves can come back.
        </T>
        <T style={s.c}>You do not have to fight it or obey it. Pick what feels doable.</T>
        <Dock>
          <View style={s.opts}>
            <BigOption tone="sun" icon="timer" title="Another 10 minutes" sub="Same wave, more time." onPress={start} />
            <BigOption tone="accent" icon="wind" title="Breathe" sub="One slow minute." onPress={() => nextTool('breathe')} />
            <BigOption tone="accent" icon="chat" title="Reach a person" sub="A short text is enough." onPress={() => nextTool('message')} />
          </View>
        </Dock>
        <Link
          label="I am okay for now"
          onPress={() => {
            sos.setTimer(null);
            close();
            say('Okay. The pause counted.');
          }}
        />
      </Stage>
    );
  return (
    <Stage key="after" dir={1}>
      <Flame level={level} size={110} />
      <T v="title" style={s.c} accessibilityRole="header">
        {t?.early ? 'You paused. That counts.' : 'You made it through ten minutes.'}
      </T>
      {t?.gain ? (
        <T v="label" tone="mintText">
          +{t.gain} points
        </T>
      ) : null}
      <T v="h2">How is the urge now?</T>
      <Dock>
        <View style={s.opts}>
          <BigOption tone="mint" icon="wave" title="It passed" sub="I rode it out." onPress={() => answer('rode')} />
          <BigOption tone="sun" icon="timer" title="Still strong" sub="I need a bit longer." onPress={() => answer('again')} />
          <BigOption tone="slip" icon="leaf" title="I slipped" sub="A slip is data, not a reset." onPress={() => answer('slipped')} />
        </View>
      </Dock>
      <Link
        label="Skip this question"
        onPress={() => {
          sos.setTimer(null);
          close();
          say('Okay. The pause counted.');
        }}
      />
      <T v="small" tone="muted" style={s.c}>
        The pause already counted. Skipping is fine.
      </T>
    </Stage>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, justifyContent: 'center' },
  opts: { alignSelf: 'stretch', gap: 10 },
});
