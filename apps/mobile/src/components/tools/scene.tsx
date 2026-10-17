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
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Field, Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { fmtMS, useSeconds } from '@/components/orb';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { Appear } from '@/components/appear';
import { Dock, Finish, Middle, Stage } from '@/components/scene';
import { buzz } from '@/lib/feel';
import { play } from '@/lib/sound';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

import type { ToolProps } from './types';

const copy = (text: string, say: (m: string) => void, ok = 'Copied. Paste it in your messages.') =>
  Clipboard.setStringAsync(text)
    .then(() => say(ok))
    .catch(() => say('Could not copy. Press and hold the text to copy it.'));

/* ---------- move ---------- */
export function Move({ finish, level }: ToolProps) {
  const c = useTheme();
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
          title="Nice. Notice your breath."
          text="Your heart is going a little faster, and your head had something else to do. That is the point."
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
        <T style={s.c}>Body first, decision later. Pick one. Any pace counts.</T>
        <Dock>
          <View style={s.grid}>
            {MOVES.map(([id, name, sub]) => (
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
          <T v="small" tone="muted" style={s.c}>
            Stop if anything hurts. A slow walk counts too.
          </T>
        </Dock>
      </Stage>
    );
  const m = MOVES.find((x) => x[0] === pick) || MOVES[0];
  const R = 112;
  const C = 2 * Math.PI * R;
  return (
    <Stage key="run" dir={1}>
      <Middle>
        <View style={s.ring}>
          <Svg width={240} height={240} style={StyleSheet.absoluteFill}>
            <Circle cx={120} cy={120} r={R} stroke={c.ink} strokeOpacity={0.12} strokeWidth={10} fill="none" />
            <Circle
              cx={120}
              cy={120}
              r={R}
              stroke={c.coral}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${C}`}
              strokeDashoffset={C * (1 - left / MOVE_MS)}
              transform="rotate(-90 120 120)"
            />
          </Svg>
          <T v="label">{m[1]}</T>
          <Text style={[s.time, { color: c.ink }]}>{fmtMS(left)}</Text>
        </View>
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
  const st = snap.settings;
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
  return (
    <>
      <View style={[s.moon, { backgroundColor: c.violetSoft }]}>
        <Icon name="moon" size={40} color={c.violetText} />
      </View>
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
      <Dock>
        <T v="h2" style={{ alignSelf: 'flex-start' }}>
          If the thoughts get loud in bed
        </T>
        <View style={{ alignSelf: 'stretch', gap: 8 }} accessibilityRole="radiogroup">
          {plans.map(([id, t, sub]) => {
            const on = plan === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  setPlan(id);
                  sos.setMem((m) => ({ ...m, bedPlan: id }));
                  buzz('tap');
                }}
                style={[s.check, { backgroundColor: on ? c.accentSoft : c.surface, borderColor: on ? c.accent : 'transparent' }]}>
                <View style={{ flex: 1 }}>
                  <T v="label" tone={on ? 'accentText' : 'ink'}>
                    {t}
                  </T>
                  <T v="small" tone="muted">
                    {sub}
                  </T>
                </View>
              </Pressable>
            );
          })}
        </View>
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
export function Surprise({ finish }: ToolProps) {
  const c = useTheme();
  const { snap } = useStore();
  const menu = snap.settings?.menu || [];
  const [pick, setPick] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [doing, setDoing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spin = () => {
    const final = menu[Math.floor(Math.random() * menu.length)] || 'Walk around the block';
    setDoing(false);
    if (menu.length < 2) return setPick(final);
    setSpinning(true);
    let n = 0;
    const total = 15;
    const step = () => {
      n++;
      if (n >= total) {
        setSpinning(false);
        setPick(final);
        buzz('lit');
        return;
      }
      setPick(menu[Math.floor(Math.random() * menu.length)]);
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
  const card = (small: string, text: string) => (
    <View style={[s.sur, { backgroundColor: c.violetSoft, shadowColor: c.lip }]} accessibilityLiveRegion="polite">
      {small ? (
        <T v="small" tone="violetText">
          {small}
        </T>
      ) : null}
      <Text style={[s.surT, { color: c.ink }]}>{text}</Text>
    </View>
  );
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
      <Middle>
        {spinning ? (
          card('', pick || '…')
        ) : (
          <Appear key={'got:' + pick} by={0} duration={320} style={s.got}>
            {card('Try this', pick || '')}
          </Appear>
        )}
      </Middle>
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
export function Message({ finish, exit, sos }: ToolProps) {
  const c = useTheme();
  const { snap, say } = useStore();
  const st = snap.settings;
  const nm = safeName(st);
  const list = messageTexts(st);
  const [own, setOwn] = useState('');
  return (
    <>
      <T v="title" style={s.c} accessibilityRole="header">
        {nm ? 'Text ' + nm : 'A short text is enough'}
      </T>
      <T style={s.c}>{(nm ? 'Your safe person. ' : '') + 'Pick one, copy it, and send it in your messages app. Reaching out is strength, not weakness.'}</T>
      {list.map((m) => (
        <Card key={m} style={{ alignSelf: 'stretch' }}>
          <T selectable>{m}</T>
          <View style={s.row}>
            <Chip label="Copy" on={false} onPress={() => copy(m, say)} />
          </View>
        </Card>
      ))}
      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        <Field label="Or write your own" multiline maxLength={300} value={own} onChangeText={setOwn} placeholder="In your own words" />
        <View style={s.row}>
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
        <Button label={sos ? 'Not now, back to SOS' : 'Not now'} kind="ghost" onPress={exit} />
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
  const { snap } = useStore();
  const st = snap.settings;
  const r = st?.reasons || [];
  const note = String(st?.note || '').trim();
  const [i0, setI] = useState(0);
  /* the next reason slides in from the side it was asked for */
  const [dir, setDir] = useState<1 | -1>(1);
  const turn = (d: 1 | -1) => {
    setDir(d);
    setI(i0 + d);
    buzz('tap');
  };
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
  ring: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center' },
  time: { fontFamily: font.displayBold, fontSize: 56, lineHeight: 64, fontVariant: ['tabular-nums'] },
  moon: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 2 },
  box: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sur: {
    alignSelf: 'stretch',
    minHeight: 170,
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
  },
  surT: { fontFamily: font.display, fontSize: 30, lineHeight: 36, textAlign: 'center' },
  got: { alignSelf: 'stretch' },
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
  sq: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
