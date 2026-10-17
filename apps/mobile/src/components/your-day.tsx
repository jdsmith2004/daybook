/* "Your day" on Today: a few short stops, each opening where it is answered. Last night (asked the next morning, because that
   is when you know), the lesson, the evening check-in, and the wind-down. Below them, switching parts of today on or off.
   Ported from the legacy pathHtml. Every word and rule comes from @daybook/core. */
import {
  clockOf,
  fmtClock,
  fmtDate,
  gameCompute,
  lessonStop,
  lmin,
  morningDone,
  morningInfo,
  pathNote,
  phoneAway,
  rhythm,
  ROUTINE,
  routineChanged,
  routineDay,
  routineOn,
  setScreensOff,
  setSleep,
  stopStatus,
  STOP_IC,
  STOP_WHEN,
  windLine,
  windToggle,
  type Snapshot,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckinBlock } from '@/components/checkin';
import { useHoldCelebrations } from '@/components/celebrate';
import { Check, Collapse, OnOff } from '@/components/form';
import { PickRow } from '@/components/picks';
import { Slider } from '@/components/slider';
import { Button, Card, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** openStop: Next up asked for this stop to be open (n changes on each ask) */
export function YourDay({ snap, tk, now, openStop }: { snap: Snapshot; tk: string; now: number; openStop?: { k: string; n: number } | null }) {
  const c = useTheme();
  const st = snap.settings!;
  const r = rhythm(snap.days, st, tk, now);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [rtOpen, setRtOpen] = useState(false);
  useEffect(() => {
    if (openStop) setOpen((o) => ({ ...o, ['path-' + openStop.k]: true }));
  }, [openStop]);
  const day = snap.days[tk];
  const n = r.stops.length;
  const note = pathNote(snap.days, st, tk, r.stops);
  const toggle = (k: string, def: boolean) => setOpen((o) => ({ ...o, [k]: !(o[k] ?? def) }));
  const shut = (k: string) => setOpen((o) => ({ ...o, [k]: false }));
  const changed = routineChanged(st, day?.p);
  return (
    <Card>
      <View style={s.between}>
        <T v="h2" accessibilityRole="header">
          Your day
        </T>
        <T v="small" tone="muted">
          {n} short stop{n === 1 ? '' : 's'}
        </T>
      </View>
      {note ? (
        <T v="small" tone="muted">
          {note}
        </T>
      ) : null}
      {r.stops.length ? (
        r.stops.map((sp) => {
          const isOpen = open['path-' + sp.k] ?? sp.k === r.cur;
          const done = sp.state === 'done';
          return (
            <Collapse
              key={sp.k}
              title={sp.title}
              sub={STOP_WHEN[sp.k]}
              right={stopStatus(sp, r.windMin)}
              icon={done ? 'check' : STOP_IC[sp.k]}
              iconBg={done ? c.mintSoft : sp.state === 'now' ? c.accentSoft : c.surface2}
              iconInk={done ? c.mintText : sp.state === 'now' ? c.accentText : c.muted}
              tone={sp.state === 'now' ? 'now' : done ? 'done' : 'plain'}
              open={isOpen}
              onToggle={() => toggle('path-' + sp.k, sp.k === r.cur)}>
              {sp.k === 'morning' ? (
                <Morning snap={snap} tk={tk} onDone={() => shut('path-morning')} />
              ) : sp.k === 'lesson' ? (
                <LessonStop snap={snap} tk={tk} />
              ) : sp.k === 'evening' ? (
                <CheckinBlock dkey={tk} isToday scene />
              ) : (
                <Wind snap={snap} tk={tk} leftToOff={r.leftToOff} />
              )}
            </Collapse>
          );
        })
      ) : (
        <T tone="muted">Nothing is switched on for today. You can turn parts of the day back on below.</T>
      )}
      <Collapse
        title="Change today’s routine"
        sub={changed ? changed + ' changed for today' : 'Turn parts of today on or off'}
        open={rtOpen}
        onToggle={() => setRtOpen(!rtOpen)}>
        <RoutineToday snap={snap} tk={tk} />
      </Collapse>
    </Card>
  );
}

/* ---------- last night ---------- */
/* two answers: screens off, then hours of sleep on a slider. It finishes itself once both are in (for the slider, when the
   finger comes up); until then celebrations wait. */
const sleepText = (h: number) => (h % 1 ? h.toFixed(1) : String(h));
function Morning({ snap, tk, onDone }: { snap: Snapshot; tk: string; onDone: () => void }) {
  const { update, say } = useStore();
  const st = snap.settings!;
  const mi = morningInfo(snap.days, st, tk);
  /* finished when this opened, or finished here */
  const [fin, setFin] = useState(mi.done);
  useHoldCelebrations(!fin && (mi.so != null || mi.h != null));
  const finish = () => {
    if (fin) return;
    setFin(true);
    buzz('save');
    say('Thanks for being honest.');
    onDone();
  };
  return (
    <View style={{ gap: 14 }}>
      <T v="small" tone="muted">
        About {fmtDate(mi.prev, { weekday: 'long' })} night. Honest beats perfect.
      </T>
      <View style={{ gap: 8 }}>
        {mi.po ? <T>You put your phone away at {fmtClock(mi.po)}.</T> : null}
        <T v="label">Were screens off by {fmtClock(st.screensOff)}?</T>
        <PickRow
          label={'Screens off by ' + fmtClock(st.screensOff)}
          list={[
            { k: 'Y', label: 'Yes' },
            { k: 'N', label: 'Not this time' },
          ]}
          cur={mi.so}
          onPick={(v) => {
            update((s0) => ({ ...s0, days: setScreensOff(s0.days, mi.prev, v) }));
            if (mi.so !== v && mi.h != null) finish();
          }}
        />
      </View>
      <View style={{ gap: 2 }}>
        <T v="label">How long did you sleep?</T>
        <Slider
          label="Hours of sleep"
          value={mi.h}
          min={3}
          max={12}
          step={0.5}
          show={sleepText}
          unit="hours"
          onChange={(h) => update((s0) => ({ ...s0, days: setSleep(s0.days, tk, h) }))}
          onRelease={() => {
            if (mi.so != null) finish();
          }}
        />
      </View>
      {!fin && (mi.so != null || mi.h != null) ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            update((s0) => ({ ...s0, days: morningDone(s0.days, tk) }));
            finish();
          }}
          style={{ alignSelf: 'center', minHeight: 40, justifyContent: 'center' }}>
          <LinkWords>That is all for today</LinkWords>
        </Pressable>
      ) : null}
    </View>
  );
}
function LinkWords({ children }: { children: string }) {
  const c = useTheme();
  return <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>{children}</Text>;
}

/* ---------- the lesson for the day ---------- */
function LessonStop({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const r = lessonStop(snap.days, snap.settings!, tk);
  const go = (id: string) => router.push({ pathname: '/lesson/[id]', params: { id } });
  if (r.kind === 'read')
    return (
      <View style={{ gap: 8 }}>
        <T>
          ✓ Done today: <Text style={{ fontFamily: font.bodyBold }}>{r.L.title}</Text>
        </T>
        <T v="small" tone="muted">
          {r.L.key}
        </T>
        {r.next ? (
          <>
            <Button kind="ghost" label={'Another one: ' + r.next.title} onPress={() => go(r.next!.id)} />
            <T v="small" tone="muted">
              One a day is plenty. This is here if you want more.
            </T>
          </>
        ) : null}
      </View>
    );
  if (r.kind === 'next')
    return (
      <View style={{ gap: 10 }}>
        <View style={{ gap: 2 }}>
          <T v="label">
            Lesson {r.n} of {r.total}: {r.L.title}
          </T>
          <T v="small" tone="muted">
            {r.L.tag}
          </T>
        </View>
        <Button label={'Start · ' + lmin(r.L)} icon="play" onPress={() => go(r.L.id)} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/learn')}
          style={{ alignSelf: 'center', minHeight: 40, justifyContent: 'center' }}>
          <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>Pick a different lesson</Text>
        </Pressable>
      </View>
    );
  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 2 }}>
        <T v="label">Read again: {r.L.title}</T>
        <T v="small" tone="muted">
          You have finished every lesson. A quick re-read keeps one fresh each day.
        </T>
      </View>
      <T v="small" tone="muted">
        {r.L.key}
      </T>
      {r.note ? (
        <View style={[s.note, { backgroundColor: c.surface2 }]}>
          <T v="small" tone="muted">
            Your note
          </T>
          <T>{r.note}</T>
        </View>
      ) : null}
      <Button kind="ghost" label="Read it again" onPress={() => go(r.L.id)} />
    </View>
  );
}

/* ---------- the wind-down ---------- */
function Wind({ snap, tk, leftToOff }: { snap: Snapshot; tk: string; leftToOff: number }) {
  const { update } = useStore();
  const st = snap.settings!;
  const p = snap.days[tk]?.p;
  return (
    <View style={{ gap: 6 }}>
      <T v="small" tone="muted">
        {windLine(st, leftToOff, p)}
      </T>
      {st.wind.map((t, i) => (
        <Check
          key={i}
          label={t}
          on={!!p && p.w.indexOf(i) >= 0}
          onPress={() => {
            update((s0) => ({ ...s0, days: windToggle(s0.days, s0.settings!, tk, i) }));
            buzz('tap');
          }}
        />
      ))}
      {p && p.po ? (
        <T>✓ Phone away at {fmtClock(p.po)}. See you in the morning.</T>
      ) : (
        <>
          <Button
            label="Putting my phone away"
            icon="moon"
            onPress={() => {
              const at = clockOf(Date.now());
              let gain = 0;
              update((s0) => {
                const b0 = gameCompute(s0.days, s0.settings!, s0.reviews, tk).pts;
                const days = phoneAway(s0.days, tk, at);
                gain = Math.max(0, gameCompute(days, s0.settings!, s0.reviews, tk).pts - b0);
                return { ...s0, days };
              });
              buzz('save');
              router.push({ pathname: '/night', params: { at, gain: String(gain) } });
            }}
          />
          <T v="small" tone="muted">
            Tap this just before you do. Tomorrow morning the app asks whether it stayed away.
          </T>
        </>
      )}
    </View>
  );
}

/* ---------- today's routine ---------- */
function RoutineToday({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const { update } = useStore();
  const st = snap.settings!;
  const p = snap.days[tk]?.p;
  return (
    <View style={{ gap: 4 }}>
      <T v="small" tone="muted">
        Skip what does not fit today. This is for today only, and anything you already did stays counted.
      </T>
      {ROUTINE.map((x) => (
        <OnOff
          key={x.k}
          name={x.name}
          sub={x.sub}
          on={routineOn(st, p, x.k)}
          onPick={(on) => update((s0) => ({ ...s0, days: routineDay(s0.days, s0.settings!, tk, x.k, on) }))}
        />
      ))}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/settings', params: { open: 's-routine' } })}
        style={{ minHeight: 40, justifyContent: 'center' }}>
        <Text style={{ fontFamily: font.bodySemi, color: c.accentText, textDecorationLine: 'underline' }}>Change my usual routine in Settings</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  note: { gap: 2, padding: 10, borderRadius: 12 },
});
