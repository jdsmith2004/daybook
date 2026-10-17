/* The sunrise check: the morning after a slip. Day 1 of the comeback: last night's screens (if not answered yet), what came
   just before, and one if-then plan. Finishing it is the third mission. Ported from the legacy SCENES.sunrise. */
import {
  addOption,
  changeDay,
  fmtClock,
  gameCompute,
  lowerFirst,
  normCheckin,
  optList,
  OPT_MAX,
  patchEvent,
  rkActive,
  rkComebackLine,
  rkComebacks,
  rkMissions,
  rkOf,
  rkOpen,
  srEnd,
  srFinish,
  srPlanInfo,
  srSteps,
  srWhen,
  withDay,
} from '@daybook/core';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AddOwn, AddTile, BigOption, Field, Link, Tiles } from '@/components/choices';
import { LineNote } from '@/components/line-note';
import { Flames, Missions } from '@/components/rekindle';
import { Comebacks } from '@/components/rk-art';
import { Dock, SceneFrame } from '@/components/scene';
import { SunArt } from '@/components/sun-art';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function Sunrise() {
  const { snap, tk, now, update, say } = useStore();
  const st = snap.settings;
  /* what this check is about is fixed when it opens */
  const [start] = useState(() => {
    if (!st) return null;
    const r = rkActive(snap.days, st, tk);
    if (!r || r.phase !== 'sun') return null;
    const { op } = rkOpen(snap.days, st, tk, r.k);
    return { k: r.k, evId: r.ev.id, seq: srSteps(snap.days, r), first: r.m3 ? 'end' : 'hi', run0: op ? op.run : 0 };
  });
  const [step, setStep] = useState(start?.first || 'hi');
  const [hist, setHist] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [own, setOwn] = useState<string | null>(null);
  const [toPlan, setToPlan] = useState(false);
  const [pts0] = useState(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).pts : 0));

  if (!st || !start) return <Redirect href="/" />;
  const { k, evId, seq, run0 } = start;
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

  const go = (next: string, back = false) => {
    if (!back) setHist((h) => h.concat(step));
    setStep(next);
    setAdding(false);
  };
  const next = () => go(seq[seq.indexOf(step) + 1] || 'plan');
  const back = () => {
    const h = hist.slice();
    const p = h.pop();
    if (!p) return;
    setHist(h);
    setStep(p);
  };
  const setTrig = (v: string) => {
    update((s) => ({ ...s, days: patchEvent(s.days, k, evId, { trigger: v === 'none' ? null : v }) }));
    buzz('tap');
    next();
  };
  const finish = (text: string) => {
    let moved = false;
    update((s) => {
      const f = srFinish(s.days, s.settings!, k, evId, text, tk);
      moved = f.toPlan;
      return { ...s, days: f.days, settings: f.st };
    });
    setToPlan(moved);
    buzz('lit');
    setHist([]);
    setOwn(null);
    setStep('end');
  };

  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const gain = Math.max(0, g.pts - pts0);
  const hour = new Date(now).getHours();
  const i = step === 'end' ? seq.length : seq.indexOf(step);
  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (step === 'hi') {
    const cb = rkComebacks(snap.days, st, k);
    body = (
      <>
        <SunArt />
        <T v="eyebrow" tone="muted">
          Rekindle · the morning after
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Day 1 of your comeback.
        </T>
        <T style={s.c}>Yesterday is logged and done, and nothing reset. Two minutes to finish your quest.</T>
        {run0 ? <LineNote b={`Your ${run0}-day run can keep going.`} rest="This check is what keeps it." /> : null}
        <Flames on={[r.m1, r.m2, r.m3]} big />
        {cb.before ? (
          <>
            <Comebacks cb={cb} />
            <T style={s.c}>{rkComebackLine(cb)}</T>
          </>
        ) : null}
        <Dock>
          <Button label="Start" onPress={next} />
        </Dock>
      </>
    );
  } else if (step === 'so') {
    const pickSo = (v: 'Y' | 'N') => {
      update((s) => {
        const day = changeDay(s.days[k], k, (d) => {
          const c = d.checkin || (d.checkin = normCheckin({})!);
          c.so = v;
        });
        return { ...s, days: withDay(s.days, k, day) };
      });
      buzz('tap');
      next();
    };
    body = (
      <>
        <MoonArt />
        <T v="title" style={s.c} accessibilityRole="header">
          Last night, were screens off by {fmtClock(st.screensOff)}?
        </T>
        <T style={s.c}>Honest beats perfect. It counts either way.</T>
        <Dock>
          <BigOption tone="mint" icon="moon" title="Yes" sub="Screens were off on time." onPress={() => pickSo('Y')} />
          <BigOption tone="slip" icon="leaf" title="Not this time" sub="That is okay. Tonight is another try." onPress={() => pickSo('N')} />
        </Dock>
      </>
    );
  } else if (step === 'before') {
    const L = optList('trig', st.opts, { time: ev.time, sel: ev.trigger, notSure: true });
    const full = st.opts.trig.filter((x) => !x.off).length >= OPT_MAX;
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Look one step back
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          What came just before the slip?
        </T>
        <T style={s.c}>The moment before is the easiest place to change things.</T>
        {adding ? (
          <AddOwn
            kind="trig"
            onCancel={() => setAdding(false)}
            onSave={(text) => {
              const a = addOption(st, 'trig', text);
              if (!a.id) return say(text.trim() ? 'That list is full. Remove one in My plan, under Lists, first.' : 'Type a few words first.');
              update((s) => ({ ...s, settings: a.st }));
              setTrig(a.id);
            }}
          />
        ) : (
          <Dock>
            <Tiles list={L.list} cur={ev.trigger} onPick={setTrig} extra={full ? null : <AddTile label="Add your own" onPress={() => setAdding(true)} />} />
          </Dock>
        )}
      </>
    );
    footer = <Link label="Skip" onPress={next} />;
  } else if (step === 'plan') {
    const P = srPlanInfo(ev, st);
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Make the plan
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Next time {srWhen(P.t, st)}…
        </T>
        <T style={s.c}>…then I will:</T>
        {own != null ? (
          <View style={{ width: '100%', gap: 10 }}>
            <Field
              label="My own plan"
              hideLabel
              multiline
              autoFocus
              maxLength={200}
              value={own}
              onChangeText={setOwn}
              placeholder="Like: Leave my phone in the kitchen and read for 10 minutes."
            />
            <View style={s.row}>
              <Button
                label="Save my plan"
                onPress={() => {
                  const t = own.replace(/\s+/g, ' ').trim().slice(0, 200);
                  if (t) finish(t);
                }}
              />
              <Link label="Cancel" onPress={() => setOwn(null)} />
            </View>
          </View>
        ) : (
          <Dock>
            {P.opts.map((o, j) => {
              const mine = j === 0 && !!P.mine;
              return (
                <BigOption
                  key={o}
                  tone={mine ? 'mint' : 'sun'}
                  icon={mine ? 'star' : 'flag'}
                  title={o}
                  tag={mine ? 'Your plan' : undefined}
                  onPress={() => finish(o)}
                />
              );
            })}
            <AddTile label="Write my own" icon="pencil" block onPress={() => setOwn('')} />
          </Dock>
        )}
      </>
    );
    footer = own != null ? null : <Link label="Skip the plan" onPress={() => finish('')} />;
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
        {e.op ? (
          <Missions
            list={rkMissions(r, st, { where: 'today', deep: e.op.deep, left: true, hour })}
            onAction={(_m, act) => {
              if (act === 'small') update((s) => ({ ...s, days: patchEvent(s.days, k, evId, { recovered: true }) }));
              else if (act === 'trace' || act === 'tell') router.push({ pathname: '/deeper', params: { k, kind: act } });
            }}
          />
        ) : null}
        {pl ? (
          <Card style={{ alignSelf: 'stretch' }}>
            <T v="small" tone="muted">
              Your plan
            </T>
            <T>
              <T v="label">If</T> {srWhen(ev.trigger, st)}, <T v="label">then</T> {lowerFirst(pl)}
            </T>
            {toPlan ? (
              <T v="small" tone="muted">
                Saved to your if-then plans in My plan.
              </T>
            ) : null}
          </Card>
        ) : null}
        <Dock>
          <Button label="Start my day" onPress={close} />
        </Dock>
      </>
    );
  }

  return (
    <SceneFrame
      title="Sunrise"
      sky="sun"
      dots={{ n: seq.length, i, label: step === 'end' ? 'All done' : 'Step ' + (i + 1) + ' of ' + seq.length }}
      onBack={step !== 'hi' && step !== 'end' && hist.length ? back : null}
      onClose={close}
      footer={footer}>
      {body}
    </SceneFrame>
  );
}

function MoonArt() {
  const c = useTheme();
  return (
    <View style={[s.moon, { backgroundColor: c.violetSoft }]}>
      <Icon name="moon" size={40} color={c.violetText} />
    </View>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  opts: { width: '100%', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  moon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
});
