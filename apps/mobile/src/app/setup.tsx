/* How Daybook works: the setup, and the walk-through that can be opened again any time. Seven sections, each with its own color;
   the bar at the top shows how far you are in this section only. One question per page, every question can be skipped, and
   single-choice pages move on by themselves after a tap. A new person's plan is built from their answers. Opened again, nothing
   changes until the last page, where the person ticks which changes to keep. Ported from the legacy SCENES.onb. */
import {
  fmtClock,
  fmtDate,
  isTime,
  keyOfDate,
  OB_BPS,
  OB_BPS_C,
  OB_GUESS,
  OB_SECS,
  OB_SO,
  OB_THEN,
  obCap,
  obChanges,
  obDate,
  obDay1,
  obFirst,
  obGoal,
  obGoalInfo,
  obGoals,
  obHeard,
  obLast,
  obPages,
  obPrefill,
  obReasonList,
  obReasonOpts,
  obReveal,
  obSave,
  obSosLine,
  obSrc,
  obSug,
  obThenOpts,
  obThenPick,
  obTop,
  obTries,
  readBackup,
  REASON_DEFAULT,
  REASON_LEN,
  REASON_MAX,
  restoreBackup,
  SETUP_PTS,
  toRecords,
  type ObOpt,
  type ObPage,
  type RecordId,
  type Settings,
  type SetupAnswers,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Field } from '@/components/choices';
import { Flame } from '@/components/flame';
import { LessonArt, LxCheck, LxIco } from '@/components/lesson-art';
import { Back, Next, Rich, Route } from '@/components/lx';
import {
  PicCurve,
  PicDay,
  PicDial,
  PicFlame,
  PicHeart,
  PicLesson,
  PicPattern,
  PicPeople,
  PicSlip,
  PicSos,
  PicSteps,
  PicTakes,
  PicToday,
  PicTries,
  PicWeek,
  whenIcon,
} from '@/components/setup-art';
import { Icon, T } from '@/components/ui';
import { pickBackupText } from '@/lib/backup';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { setupKeep, type SetupFlow } from '@/lib/setup-keep';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme, type Tone } from '@/lib/theme';

type Flow = SetupFlow;

export default function Setup() {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  const { snap, tk, replace, say } = useStore();
  const st = snap.settings;
  const [f, setF] = useState<Flow>(() => {
    const redo = !!st;
    const k = setupKeep.flow;
    setupKeep.shut = false;
    if (k && k.redo === redo && !k.saved) return { ...k };
    return {
      redo,
      i: 0,
      a: obPrefill(st),
      hg: null,
      keep: null,
      saved: false,
      changed: 0,
    };
  });
  const until = useRef(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const P = obPages(f.a);
  const i = Math.max(0, Math.min(P.length - 1, f.i));
  const pg = P[i];
  const a = f.a;
  const sec = OB_SECS.find((x) => x[0] === pg.s) || OB_SECS[0];
  const t = toneOf(c, sec[2]);

  /* a log arrived some other way (a restored backup) while a new person was in the setup: the setup steps aside */
  useEffect(() => {
    if (!f.redo && !f.saved && st) {
      setupKeep.flow = null;
      close();
    }
  }, [f.redo, f.saved, st]);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [i]);

  const busy = () => Date.now() < until.current;
  const set = (patch: Partial<Flow> | ((x: Flow) => Partial<Flow>)) =>
    setF((x) => ({
      ...x,
      ...(typeof patch === 'function' ? patch(x) : patch),
    }));
  const setA = (patch: SetupAnswers) => set((x) => ({ a: { ...x.a, ...patch } }));
  const go = (d: number) =>
    setF((x) => {
      const PP = obPages(x.a);
      const cur = PP[x.i];
      const to = Math.max(0, Math.min(PP.length - 1, x.i + d));
      if (to === x.i) return x;
      if (cur.k === 'review' && d > 0 && !x.saved) return x;
      until.current = Date.now() + 260;
      return { ...x, i: to };
    });
  /* a one-tap answer moves on by itself, unless the person already moved */
  const later = () => {
    const at = i;
    until.current = Date.now() + 420;
    setTimeout(() => {
      setF((x) => {
        if (x.i !== at) return x;
        until.current = 0;
        return { ...x, i: Math.min(obPages(x.a).length - 1, x.i + 1) };
      });
    }, 380);
  };
  const exit = () => {
    setupKeep.flow = !f.saved && pg.k !== 'done' ? { ...f, i } : null;
    if (!st) setupKeep.shut = true;
    close();
  };
  const save = async () => {
    if (f.saved) return;
    const r = obSave(a, st, f.keep ?? obChanges(a, st, tk).map((x) => x.k), tk);
    setupKeep.flow = null;
    buzz('lit');
    until.current = Date.now() + 700;
    setF((x) => ({
      ...x,
      saved: true,
      changed: r.changed,
      i: obPages(x.a).length - 1,
    }));
    await replace({ ...snap, settings: r.st }, ['settings']);
  };
  const restore = async () => {
    try {
      const text = await pickBackupText();
      if (text == null) return;
      const { snap: next, restored } = restoreBackup(snap, readBackup(text));
      await replace(
        next,
        toRecords(next).map((r) => r.id as RecordId),
      );
      say(`Restored ${restored} day${restored === 1 ? '' : 's'}.`);
    } catch {
      say('That file is not a Daybook backup.');
    }
  };

  const ans = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '');
  const back = i === 0 || pg.k === 'done' ? null : <Back onPress={() => !f.saved && go(-1)} />;
  const nextBtn = (label: string, skip?: boolean) => <Next label={label} onPress={() => !busy() && go(1)} off={false} key={skip ? 's' : 'n'} />;
  const pick = (key: string, v: string, auto: boolean) => {
    if (busy()) return;
    setA({ [key]: v });
    buzz('tap');
    if (auto) later();
  };

  let body: ReactNode = null;
  let foot: ReactNode = null;
  const lastLine = (key: string, list: ObOpt[]) => {
    const l = obLast(st, f.redo, key, list);
    return l ? (
      <T v="small" tone="muted" style={{ textAlign: 'center' }}>
        {l}
      </T>
    ) : null;
  };

  switch (pg.k) {
    case 'hello': {
      const prev = st && st.onb;
      body = f.redo ? (
        <Show st={st} art={<PicToday />} h="Walk through it again." line="Nothing changes until the last page.">
          {prev && prev.at ? (
            <T v="small" tone="muted">
              Last time:{' '}
              {fmtDate(keyOfDate(new Date(prev.at)), {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              .
            </T>
          ) : null}
        </Show>
      ) : (
        <Show st={st} art={<PicToday />} h="Quit porn, one honest day at a time." line="A plan built from your answers, help when urges hit, and progress you can see.">
          <TextLink label="I already have a backup file" onPress={restore} />
        </Show>
      );
      foot = nextBtn(f.redo ? 'Start' : 'Get started');
      break;
    }
    case 'tiles':
    case 'years': {
      const key = pg.key!;
      body = (
        <>
          <QArt pg={pg} t={t} />
          <Q h={pg.h!} sub={pg.sub} />
          <IconTiles list={pg.list!} cols={pg.k === 'years' ? 1 : pg.cols || 1} cur={a[key] as string} t={t} years={pg.k === 'years'} onPick={(v) => pick(key, v, !!pg.auto)} />
          {lastLine(key, pg.list!)}
        </>
      );
      foot = nextBtn(ans(a[key]) ? 'Next' : 'Skip', !ans(a[key]));
      break;
    }
    case 'slide': {
      const key = pg.key!;
      const list = pg.list!;
      const idx = list.findIndex((x) => x[0] === a[key]);
      body = (
        <>
          <Q h={pg.h!} sub={pg.sub} />
          <View style={s.art}>{key === 'freq' ? <PicWeek i={idx} /> : <PicDial i={idx} />}</View>
          <Text style={[s.slv, { color: idx >= 0 ? t.text : c.muted }]}>{idx >= 0 ? obCap(String(list[idx][3])) : 'Tap to answer'}</Text>
          <Steps n={list.length} cur={idx} t={t} labels={list.map((x) => String(x[3]))} lo={pg.lo!} hi={pg.hi!} onPick={(j) => pick(key, list[j][0], false)} />
          {lastLine(key, list)}
        </>
      );
      foot = nextBtn(ans(a[key]) ? 'Next' : 'Skip', !ans(a[key]));
      break;
    }
    case 'bps': {
      const v = a['b' + pg.n] as string | undefined;
      body = (
        <>
          <Text style={[s.h, { color: c.ink }]} accessibilityRole="header">
            In the last 6 months, how often is this true for you?
          </Text>
          <View style={[s.quote, { backgroundColor: t.soft, borderLeftColor: t.ic }]}>
            <Text style={[s.quoteT, { color: c.ink }]}>{OB_BPS[pg.n!]}</Text>
          </View>
          <View style={{ gap: 10 }}>
            {OB_BPS_C.map(([id, label], j) => (
              <Opt key={id} on={v === id} t={t} onPress={() => pick('b' + pg.n, id, true)}>
                <View style={[s.lv, { borderColor: t.ic }]}>
                  <View
                    style={{
                      width: `${j * 50}%`,
                      height: '100%',
                      backgroundColor: t.ic,
                    }}
                  />
                </View>
                <Text style={[s.optT, { color: c.ink }]}>{label}</Text>
              </Opt>
            ))}
          </View>
          {pg.n === 0 ? (
            <T v="small" tone="muted">
              Only you see your answers. A quick, tested check.
            </T>
          ) : null}
        </>
      );
      foot = nextBtn(v != null ? 'Next' : 'Skip', v == null);
      break;
    }
    case 'heard': {
      const h = obHeard(a);
      body = <Show st={st} art={<PicHeart />} h={h.h} line={h.line} more={h.more} />;
      foot = nextBtn('Keep going');
      break;
    }
    case 'multi': {
      const key = pg.key!;
      const arr = (a[key] as string[]) || [];
      const own = pg.own ? String(a[pg.own] || '').trim() : '';
      body = (
        <>
          <Q h={pg.h!} sub={pg.sub} />
          <IconTiles
            list={pg.list!}
            cols={pg.cols || 2}
            cur={arr}
            t={t}
            onPick={(v) => {
              const k = arr.indexOf(v);
              setA({
                [key]: k >= 0 ? arr.filter((x) => x !== v) : arr.concat(v),
              });
              buzz('tap');
            }}
          />
          {pg.own ? (
            <Field
              label="Write my own"
              maxLength={60}
              defaultValue={String(a[pg.own] || '')}
              placeholder="Something else it cost me"
              onChangeText={(v) => setA({ [pg.own!]: v })}
            />
          ) : null}
        </>
      );
      foot = nextBtn(arr.length || own ? 'Next' : 'Skip', !(arr.length || own));
      break;
    }
    case 'guess': {
      body = (
        <>
          <View style={s.art}>
            <Text style={[s.big, { color: t.text }]}>?</Text>
            <T tone="muted">hours a year</T>
          </View>
          <Q h="How many hours a year do you think you spend on porn?" sub="Guess first. Then see your number." />
          <View style={s.grid3}>
            {OB_GUESS.map((n) => (
              <Opt
                key={n}
                on={f.hg === n}
                t={t}
                style={{
                  flexBasis: '30%',
                  flexGrow: 1,
                  justifyContent: 'center',
                }}
                onPress={() => {
                  if (busy()) return;
                  set({ hg: n });
                  buzz('tap');
                  later();
                }}>
                <Text style={[s.optT, { color: c.ink, textAlign: 'center', flex: 0 }]}>{n === 800 ? '800+' : n}</Text>
              </Opt>
            ))}
          </View>
        </>
      );
      foot = (
        <Next
          label="Just show me"
          onPress={() => {
            if (busy()) return;
            set({ hg: 'skip' });
            until.current = 0;
            go(1);
          }}
        />
      );
      break;
    }
    case 'hours': {
      const R = obReveal(a, f.hg);
      body = (
        <>
          <View style={s.art}>
            <CountUp to={R.yr} color={t.text} />
            <T tone="muted">hours a year at your pace</T>
          </View>
          <Text style={[s.h, s.hsm, { color: c.ink }]} accessibilityRole="header">
            {R.h}
          </Text>
          {R.guess != null ? <Compare g={R.guess} yr={R.yr} t={t} /> : null}
          {R.rows.map((r) => (
            <View key={r[0]} style={s.eq}>
              <Icon name={r[0]} size={20} color={t.text} />
              <Rich text={r[1]} st={st} style={{ flex: 1 }} />
            </View>
          ))}
          <Soft icon="leaf" text={R.soft} />
          <More more={R.more} />
        </>
      );
      foot = nextBtn('Next');
      break;
    }
    case 'sos': {
      const x = obSosLine(a);
      body = <Show st={st} art={<PicSos a={a} when={x.when} />} h="When an urge hits, tap SOS." line={x.line} />;
      foot = nextBtn('Next');
      break;
    }
    case 'day':
      body = <Show st={st} art={<PicDay a={a} />} h="Your day takes about 5 minutes." line="Four short stops. Each one opens at its time." />;
      foot = nextBtn('Next');
      break;
    case 'pattern':
      body = <Show st={st} art={<PicPattern a={a} />} h="See when it hits hardest." line="Log an urge in a few taps. Your charts show the pattern." />;
      foot = nextBtn('Next');
      break;
    case 'tries': {
      const x = obTries(a);
      body = <Show st={st} art={<PicTries />} h={x.h} line={x.line} more={x.more} />;
      foot = nextBtn('Next');
      break;
    }
    case 'so': {
      const custom = isTime(a.so) && OB_SO.indexOf(a.so as string) < 0;
      body = (
        <>
          <View style={s.art}>
            <LxIco name="moon" t={t} size={90} />
          </View>
          <Q h="What time should your screens go off at night?" sub="An hour before, a short wind-down starts." />
          <View style={s.grid3}>
            {OB_SO.concat(custom ? [a.so as string] : []).map((x) => (
              <Opt
                key={x}
                on={a.so === x}
                t={t}
                style={{
                  flexBasis: '45%',
                  flexGrow: 1,
                  justifyContent: 'center',
                }}
                onPress={() => pick('so', x, true)}>
                {a.so === x ? <Icon name="check" size={18} color={t.text} /> : null}
                <Text style={[s.optT, { color: c.ink, flex: 0 }]}>{fmtClock(x)}</Text>
              </Opt>
            ))}
          </View>
          <Field
            label="Or type your own time (24-hour, like 22:15)"
            maxLength={5}
            keyboardType="numbers-and-punctuation"
            placeholder="22:15"
            defaultValue={custom ? (a.so as string) : ''}
            onChangeText={(v) => isTime(v) && setA({ so: v })}
          />
        </>
      );
      foot = nextBtn(a.so ? 'Next' : 'Skip', !a.so);
      break;
    }
    case 'goal': {
      const sug = obSug(a, st, tk);
      const goals = obGoals(st, tk);
      const v = goals.some((g) => g.id === a.goal) ? a.goal : sug;
      const gi = obGoalInfo(a, st, tk);
      body = (
        <>
          <Q h="Which starting point fits you best?" />
          <View style={{ gap: 10 }}>
            {goals.map((g) => (
              <Opt key={g.id} on={v === g.id} t={t} onPress={() => pick('goal', g.id, false)}>
                <View style={[s.ti, { backgroundColor: t.soft }]}>
                  <Icon name={g.ic} size={22} color={t.text} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[s.optT, { color: c.ink }]}>{g.t}</Text>
                  <T v="small" tone="muted">
                    {g.s}
                  </T>
                  {g.id === sug ? (
                    <T v="small" tone="mintText" style={{ fontFamily: font.bodyBold }}>
                      Suggested for you
                    </T>
                  ) : null}
                </View>
              </Opt>
            ))}
          </View>
          <Soft icon="calendar" text={gi.soft} />
          <More more={gi.more} />
        </>
      );
      foot = nextBtn('Next');
      break;
    }
    case 'reasons': {
      const n = obReasonList(a).length;
      const rs = a.rs || [];
      body = (
        <>
          <Q h="What do you want your life to look like instead?" sub="Pick what matters most. It shows up on hard nights." />
          <View style={s.pills}>
            {obReasonOpts(a, st, f.redo).map((x) => {
              const on = rs.indexOf(x) >= 0;
              return (
                <Pressable
                  key={x}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    if (!on && rs.length >= REASON_MAX) return;
                    setA({ rs: on ? rs.filter((y) => y !== x) : rs.concat(x) });
                    buzz('tap');
                  }}
                  style={[
                    s.pill,
                    {
                      backgroundColor: on ? t.soft : c.surface,
                      borderColor: on ? t.ic : c.line,
                    },
                  ]}>
                  {on ? <Icon name="check" size={16} color={t.text} /> : null}
                  <Text
                    style={{
                      fontFamily: font.bodySemi,
                      fontSize: 15.5,
                      color: on ? t.text : c.ink,
                      flexShrink: 1,
                    }}>
                    {x}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Field label="Write my own" maxLength={REASON_LEN} placeholder="I want to…" defaultValue={a.own || ''} onChangeText={(v) => setA({ own: v })} />
        </>
      );
      foot = nextBtn(n ? 'Next' : 'Skip', !n);
      break;
    }
    case 'then': {
      const tp = obTop(a);
      const T0 = OB_THEN[tp];
      const cur = obThenPick(a, st, f.redo, tp);
      body = (
        <>
          <Q h={`When ${T0[2]}, what will you do instead?`} sub="A plan made ahead is easier to follow." />
          <View style={{ gap: 10 }}>
            {obThenOpts(a, st, f.redo, tp).map((x) => (
              <Opt
                key={x}
                on={cur === x}
                t={t}
                onPress={() => {
                  if (busy()) return;
                  setA({ then: x, thenT: tp, thenOwn: '' });
                  buzz('tap');
                  later();
                }}>
                {cur === x ? <Icon name="check" size={18} color={t.text} /> : null}
                <Text style={[s.optT, { color: c.ink }]}>{x}</Text>
              </Opt>
            ))}
          </View>
          <Field
            key={'own' + (a.thenOwn ? 1 : 0)}
            label="Write my own"
            maxLength={140}
            placeholder="I will…"
            defaultValue={a.thenOwn || ''}
            onChangeText={(v) => {
              const prevOwn = String(a.thenOwn || '').trim();
              const x = v.trim();
              if (x) setA({ thenOwn: v, then: x.slice(0, 140), thenT: tp });
              else
                setA({
                  thenOwn: v,
                  ...(a.then === prevOwn ? { then: null } : {}),
                });
            }}
          />
          <More
            more={{
              label: 'Why plan ahead?',
              paras: ['A plan made ahead is easier to follow than a decision made in the moment. You can add plans for your other hard moments in My plan.'],
              keys: ['gollwitzer'],
            }}
          />
        </>
      );
      foot = nextBtn(cur ? 'Next' : 'Skip', !cur);
      break;
    }
    case 'person': {
      const has = !!String(a.person || '').trim();
      body = (
        <>
          <View style={s.art}>
            <LxIco name="chat" t={t} size={90} />
          </View>
          <Q h="Who could be your safe person?" sub="Someone calm you could tell when you slip. A first name is enough." />
          <Field label="Their name" maxLength={80} placeholder="A first name" defaultValue={a.person || ''} onChangeText={(v) => setA({ person: v })} />
          <T v="small" tone="muted">
            Only you see the name. Daybook never contacts anyone. You can skip this.
          </T>
        </>
      );
      foot = nextBtn(has ? 'Next' : 'Skip', !has);
      break;
    }
    case 'review': {
      const ch = obChanges(a, st, tk);
      if (!f.redo) {
        const g = obGoal(a, st, tk);
        const tp = obTop(a);
        const T0 = OB_THEN[tp];
        const th = a.thenT === tp ? a.then : null;
        const rs = obReasonList(a);
        body = (
          <>
            <Text style={[s.h, s.hsm, { color: c.ink }]} accessibilityRole="header">
              Here is your plan.
            </Text>
            <View style={[s.plan, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
              <View style={[s.planRow, { borderBottomWidth: 0 }]}>
                <Flame level={1} size={48} />
                <View>
                  <T v="small" tone="muted">
                    Day 1
                  </T>
                  <Text
                    style={{
                      fontFamily: font.display,
                      fontSize: 22,
                      color: c.ink,
                    }}>
                    {obDate(obDay1(g, null, tk))}
                  </Text>
                </View>
              </View>
              <PlanRow icon="flag" l="Goal" v={g.t} />
              <PlanRow icon="moon" l="Screens off" v={fmtClock(isTime(a.so) ? (a.so as string) : '23:00')} />
              {th ? <PlanRow icon={whenIcon(tp)} l={'If ' + T0[1].replace(/^I'm/, 'I am')} v={th} /> : null}
              <PlanRow icon="heart" l="Why" v={(rs.length ? rs : REASON_DEFAULT).slice(0, 2).join(' · ')} />
              <PlanRow icon="chat" l="Safe person" v={String(a.person || '').trim() || 'Add one later'} />
            </View>
            <Text style={[s.pledge, { color: c.ink }]}>I will log honestly, slips included.</Text>
          </>
        );
        foot = <Hold onDone={save} />;
      } else {
        const keep = f.keep ?? ch.map((x) => x.k);
        body = !ch.length ? (
          <>
            <Text style={[s.h, s.hsm, { color: c.ink }]} accessibilityRole="header">
              Your plan already matches.
            </Text>
            <T>Nothing in your answers changes your goal, reasons, or plan. Your self-check is saved, so next time you can compare.</T>
          </>
        ) : (
          <>
            <Text style={[s.h, s.hsm, { color: c.ink }]} accessibilityRole="header">
              Which changes do you want to keep?
            </Text>
            <T tone="muted">Ticked items change. Anything you untick stays as it is.</T>
            <View style={{ gap: 10 }}>
              {ch.map((x) => {
                const on = keep.indexOf(x.k) >= 0;
                return (
                  <Pressable
                    key={x.k}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    onPress={() =>
                      set({
                        keep: on ? keep.filter((k) => k !== x.k) : keep.concat(x.k),
                      })
                    }
                    style={[
                      s.ch,
                      {
                        backgroundColor: c.surface,
                        borderColor: on ? t.ic : c.line,
                      },
                    ]}>
                    <View
                      style={[
                        s.bx,
                        {
                          backgroundColor: on ? t.ic : c.surface,
                          borderColor: on ? t.ic : c.line,
                        },
                      ]}>
                      {on ? <Icon name="check" size={16} color="#fff" /> : null}
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <T v="label">{x.l}</T>
                      <T v="small" tone="muted">
                        Now: {x.from}
                        {x.sub0 ? ' · ' + x.sub0 : ''}
                      </T>
                      <T v="small" tone="accentText">
                        New: {x.to}
                        {x.sub1 ? ' · ' + x.sub1 : ''}
                      </T>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <T v="small" tone="muted">
              Your self-check answers are saved either way, so next time you can compare.
            </T>
          </>
        );
        foot = <Next label={ch.length ? 'Save what is ticked' : 'Finish'} noIcon onPress={save} />;
      }
      break;
    }
    case 'done': {
      if (f.redo) {
        body = (
          <>
            <View style={s.art}>
              <LxCheck />
            </View>
            <Text style={[s.h, { color: c.ink }]} accessibilityRole="header">
              {f.changed ? 'Saved. Your plan is up to date.' : 'All set.'}
            </Text>
            <T style={s.p}>
              {(f.changed ? 'Your changes are in My plan and Settings.' : 'Nothing in your plan changed.') +
                ' Your answers are kept, so the next walk-through can show how things moved.'}
            </T>
            <Route label="Read my playbook" onPress={() => !busy() && router.replace('/book')} />
            <Route label="Back to Today" onPress={() => !busy() && close()} />
          </>
        );
      } else {
        const g = obGoal(a, null, tk);
        body = (
          <>
            <View style={s.art}>
              <Flame level={2} size={124} />
            </View>
            <Text style={[s.h, { color: c.ink }]} accessibilityRole="header">
              Welcome in.
            </Text>
            <T style={s.p}>{obFirst(g.id, st ? st.screensOff : '23:00')}</T>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <View style={[s.gift, { backgroundColor: c.mintSoft }]}>
                <Text style={{ fontFamily: font.bodyBold, color: c.mintText }}>+{SETUP_PTS} points</Text>
              </View>
              <View style={[s.gift, { backgroundColor: c.sunSoft }]}>
                <Icon name="sun" size={16} color={c.sunText} />
                <Text style={{ fontFamily: font.bodyBold, color: c.sunText }}>Day Zero badge</Text>
              </View>
            </View>
            <Route
              label="Start lesson 1"
              small="1–5 min · You do not need to feel ready"
              onPress={() =>
                !busy() &&
                router.replace({
                  pathname: '/lesson/[id]',
                  params: { id: 'l1' },
                })
              }
            />
          </>
        );
      }
      foot = <Next label={f.redo ? 'Done' : 'Go to Today'} noIcon onPress={() => !busy() && close()} />;
      break;
    }
    default:
      body = <ShowPage k={pg.k} t={t} st={st} />;
      foot = nextBtn('Next');
  }

  const ps = P.filter((x) => x.s === pg.s);
  const k = ps.indexOf(pg);
  const fin = pg.k === 'done';
  const w = fin ? 1 : (k + 1) / ps.length;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        paddingTop: inset.top + 8,
        paddingBottom: inset.bottom + 12,
        paddingHorizontal: 16,
      }}>
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 520,
          alignSelf: 'center',
          gap: 12,
        }}>
        <View style={s.top}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessible accessibilityLabel={(f.redo ? 'How Daybook works: ' : 'Set up Daybook: ') + sec[1]}>
            <View style={[s.si, { backgroundColor: t.soft }]}>
              <Icon name={sec[3]} size={16} color={t.text} />
            </View>
            <Text style={[s.secT, { color: t.text }]}>{sec[1].toUpperCase()}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={exit} style={[s.x, { backgroundColor: c.scBtn, borderColor: c.cardEdge }]}>
            <Icon name="x" color={c.ink} />
          </Pressable>
        </View>
        <Bar w={w} col={fin ? c.mint : t.ic} label={fin ? 'Setup complete' : sec[1] + ': page ' + (k + 1) + ' of ' + ps.length} />
        <View style={[s.card, { backgroundColor: c.surface, shadowColor: c.lip }]}>
          <ScrollView ref={scroll} contentContainerStyle={s.cardIn} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
        </View>
        <View style={s.foot}>
          {back}
          {foot}
        </View>
      </View>
    </View>
  );
}

/* the pages that only show something */
function ShowPage({ k, t, st }: { k: string; t: Tone; st: Settings | null }) {
  switch (k) {
    case 'loop':
      return (
        <Show
          st={st}
          art={
            <LessonArt
              art={[
                'loop',
                {
                  n: ['Feel low', 'Use porn', 'Feel worse', 'Pull away'],
                  c: 'THE LOOP',
                },
              ]}
              ic="leaf"
              t={t}
              st={st}
            />
          }
          h="Low mood and porn feed each other."
          line="The way out is people. **One text to a friend** breaks the loop."
          more={{
            label: 'Behind this',
            paras: [
              'In a survey of 1,247 adults, the lonelier people were, the more porn they tended to use. The researchers think it runs both ways.',
              'A review of about 25 years of research on recovery groups found that a change in who people spend time with was one of the main ways the groups helped.',
              '**Relationships.** A review of 50 studies, about 50,000 people, found men who used more porn were less satisfied with their sex lives and relationships. In a national US survey, married people who started watching porn were about twice as likely to be divorced by the next survey: 11% against 6%. These are links, not proof of cause.',
            ],
            keys: ['butler', 'kelly17', 'wright', 'perry'],
          }}
        />
      );
    case 'common':
      return (
        <Show
          st={st}
          art={<PicPeople />}
          h="You are far from the only one."
          line="About **1 in 10 men** say urges like these cause them real distress. Help works."
          more={{
            label: 'Behind this',
            paras: [
              'In a national US survey, about 1 in 10 men reported real distress from sexual urges and behavior they found hard to control. In another national sample, about 11% of men and 3% of women agreed, at least somewhat, that they are addicted to porn.',
              'A 2022 review of treatments found that treatment appeared to improve symptoms, and therapy that builds skills (CBT) had the strongest support.',
            ],
            keys: ['dickenson', 'grubbs19', 'antons'],
          }}
        />
      );
    case 'lessons':
      return <Show st={st} art={<PicLesson />} h="32 short lessons. One a day is plenty." line="Each takes 1 to 5 minutes, with the research linked." />;
    case 'flame':
      return <Show st={st} art={<PicFlame />} h="Your flame grows as you show up." line="Honest logs, lessons, and urges you ride out earn points. **Points never go down.**" />;
    case 'waves':
      return (
        <Show
          st={st}
          art={<LessonArt art={['wave', {}]} ic="wave" t={t} st={st} />}
          h="Urges rise, peak, and pass."
          line="You can ride one out without acting on it. SOS walks you through it."
          more={{
            label: 'Behind this',
            paras: ['In a study with smokers, people who learned to watch a craving rise and fall without acting on it (“urge surfing”) smoked less over the following week.'],
            keys: ['bowen'],
          }}
        />
      );
    case 'curve':
      return (
        <Show
          st={st}
          art={<PicCurve />}
          h="Change takes weeks, not days."
          line="A new habit took about **66 days** to feel automatic. One missed day barely mattered."
          more={{
            label: 'Behind this',
            paras: [
              'In a study of 96 people building a new daily habit, the typical person took 66 days before it felt automatic. Some took much longer, and missing a single day made little difference.',
              'In a trial where regular porn users stopped for a week, stopping did not bring on withdrawal symptoms on average.',
            ],
            keys: ['lally', 'fernandez'],
          }}
        />
      );
    case 'slip':
      return <Show st={st} art={<PicSlip />} h="A slip is data, not a reset." line="Your points, level, and badges stay. The next day counts again." />;
    case 'takes':
      return <Show st={st} art={<PicTakes />} h="Here is what it takes." line="Small things, most days. Perfect is not required." />;
    default:
      return <Show st={st} art={<PicSteps />} h="Three steps, about 5 minutes." line="Only you see your answers. You can skip any question." />;
  }
}

function Show({
  art,
  h,
  line,
  more,
  children,
  st,
}: {
  art: ReactNode;
  h: string;
  line?: string;
  more?: { label: string; paras: string[]; keys: string[] };
  children?: ReactNode;
  st: Settings | null;
}) {
  const c = useTheme();
  return (
    <>
      <View style={s.art}>{art}</View>
      <Text style={[s.h, s.hsm, { color: c.ink }]} accessibilityRole="header">
        {h}
      </Text>
      {line ? <Rich text={line} st={st} style={s.p} /> : null}
      {more ? <More more={more} /> : null}
      {children}
    </>
  );
}

/* ---------- small pieces ---------- */
function Q({ h, sub }: { h: string; sub?: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text style={[s.h, s.hsm, { color: c.ink }]} accessibilityRole="header">
        {h}
      </Text>
      {sub ? (
        <T tone="muted" style={s.p}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}
function QArt({ pg, t }: { pg: ObPage; t: Tone }) {
  if (!pg.art) return null;
  return <View style={s.art}>{pg.art === 'flame' ? <Flame level={1} size={96} /> : <LxIco name={pg.art} t={t} size={90} />}</View>;
}
function Opt({ on, t, onPress, children, style }: { on: boolean; t: Tone; onPress: () => void; children: ReactNode; style?: object }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={({ pressed }) => [
        s.opt,
        {
          borderColor: on ? t.ic : c.line,
          backgroundColor: on ? t.soft : c.surface,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
        style,
      ]}>
      {children}
    </Pressable>
  );
}
function IconTiles({
  list,
  cols,
  cur,
  t,
  onPick,
  years,
}: {
  list: ObOpt[];
  cols: number;
  cur: string | string[] | undefined;
  t: Tone;
  onPick: (v: string) => void;
  years?: boolean;
}) {
  const c = useTheme();
  const on = (x: string) => (Array.isArray(cur) ? cur.indexOf(x) >= 0 : cur === x);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {list.map((it, j) => {
        const sel = on(it[0]);
        return (
          <Pressable
            key={it[0]}
            accessibilityRole="button"
            accessibilityState={{ selected: sel }}
            onPress={() => onPick(it[0])}
            style={({ pressed }) => [
              s.tile,
              cols === 2 ? { flexBasis: '46%', flexGrow: 1 } : { flexBasis: '100%' },
              {
                borderColor: sel ? t.ic : c.line,
                backgroundColor: sel ? t.soft : c.surface,
                transform: [{ translateY: pressed ? 2 : 0 }],
              },
            ]}>
            {years ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
                {[0, 1, 2, 3].map((q) => (
                  <View
                    key={q}
                    style={{
                      width: 6,
                      height: 8 + q * 5,
                      borderRadius: 2,
                      backgroundColor: q <= j ? t.ic : c.line,
                    }}
                  />
                ))}
              </View>
            ) : typeof it[2] === 'string' ? (
              <Icon name={it[2]} size={22} color={sel ? t.text : c.muted} />
            ) : null}
            <Text style={[s.optT, { color: sel ? t.text : c.ink }]}>{it[1]}</Text>
            {sel ? <Icon name="check" size={18} color={t.text} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
/** the answers on a scale, as stops along a track */
function Steps({ n, cur, t, labels, lo, hi, onPick }: { n: number; cur: number; t: Tone; labels: string[]; lo: string; hi: string; onPick: (j: number) => void }) {
  const c = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityRole="radiogroup">
        {Array.from({ length: n }, (_, j) => (
          <View key={j} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {j > 0 ? (
              <View
                style={{
                  flex: 1,
                  height: 6,
                  backgroundColor: cur >= j ? t.ic : c.line,
                }}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: cur === j }}
              accessibilityLabel={labels[j]}
              hitSlop={8}
              onPress={() => onPick(j)}
              style={[
                s.stop,
                {
                  borderColor: cur >= j && cur >= 0 ? t.ic : c.line,
                  backgroundColor: cur === j ? t.ic : cur > j ? t.ic : c.surface,
                },
              ]}
            />
            {j < n - 1 ? (
              <View
                style={{
                  flex: 1,
                  height: 6,
                  backgroundColor: cur > j ? t.ic : c.line,
                }}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T v="small" tone="muted">
          {lo}
        </T>
        <T v="small" tone="muted">
          {hi}
        </T>
      </View>
    </View>
  );
}
function Soft({ icon, text }: { icon: string; text: string }) {
  const c = useTheme();
  return (
    <View style={[s.soft, { backgroundColor: c.mintSoft }]}>
      <Icon name={icon} size={20} color={c.mintText} />
      <Rich text={text} st={null} style={{ flex: 1 }} />
    </View>
  );
}
/** "Behind this": the detail and the sources, one tap away */
function More({ more }: { more: { label: string; paras: string[]; keys: string[] } }) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  const xs = more.keys.map(obSrc).filter(Boolean) as [string, string][];
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          minHeight: 40,
        }}>
        <Icon name={open ? 'up' : 'down'} size={16} color={c.accentText} />
        <Text style={{ fontFamily: font.bodySemi, color: c.accentText }}>{more.label}</Text>
      </Pressable>
      {open ? (
        <View style={[s.more, { backgroundColor: c.surface2 }]}>
          {more.paras.map((p, k) => (
            <Rich key={k} text={p} st={null} style={{ fontSize: 15, lineHeight: 22 }} />
          ))}
          {xs.map((x) => (
            <Text
              key={x[1]}
              accessibilityRole="link"
              onPress={() => Linking.openURL(x[1]).catch(() => undefined)}
              style={{
                fontFamily: font.body,
                fontSize: 14,
                color: c.accentText,
                textDecorationLine: 'underline',
              }}>
              {x[0]}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'center' }}>
      <Text
        style={{
          fontFamily: font.bodySemi,
          fontSize: 15,
          color: c.accentText,
          textDecorationLine: 'underline',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}
function PlanRow({ icon, l, v }: { icon: string; l: string; v: string }) {
  const c = useTheme();
  return (
    <View style={[s.planRow, { borderTopColor: c.line }]}>
      <Icon name={icon} size={20} color={c.accentText} />
      <View style={{ flex: 1 }}>
        <T v="small" tone="muted">
          {l}
        </T>
        <T v="label">{v}</T>
      </View>
    </View>
  );
}
function Bar({ w, col, label }: { w: number; col: string; label: string }) {
  const c = useTheme();
  const v = useRef(new Animated.Value(w)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: w,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [v, w]);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={{
        height: 10,
        borderRadius: 5,
        backgroundColor: c.lip,
        overflow: 'hidden',
      }}>
      <Animated.View
        style={{
          height: '100%',
          borderRadius: 5,
          backgroundColor: col,
          width: v.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
}
/** your own number counts up */
function CountUp({ to, color }: { to: number; color: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / 1100);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <Text style={[s.big, { color }]}>{n.toLocaleString('en-US')}</Text>;
}
function Compare({ g, yr, t }: { g: number; yr: number; t: Tone }) {
  const c = useTheme();
  const top = Math.max(g, yr) || 1;
  const row = (l: string, v: number, txt: string, col: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <T v="small" tone="muted" style={{ width: 86 }}>
        {l}
      </T>
      <View style={{ flex: 1 }}>
        <View
          style={{
            width: `${Math.max(6, Math.round((v / top) * 100))}%`,
            height: 12,
            borderRadius: 6,
            backgroundColor: col,
          }}
        />
      </View>
      <T v="label">{txt}</T>
    </View>
  );
  return (
    <View style={{ gap: 8 }} accessible accessibilityLabel={`You guessed ${g} hours. Your pace is about ${yr} hours.`}>
      {row('You guessed', g, g + (g >= 800 ? '+' : ''), c.line)}
      {row('Your pace', yr, yr.toLocaleString('en-US'), t.ic)}
    </View>
  );
}
/** hold to commit: a short hold, so the plan feels like a promise. A tap, then a second tap, also works. */
function Hold({ onDone }: { onDone: () => void }) {
  const c = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  const [label, setLabel] = useState('Hold to commit');
  const done = useRef(false);
  const tap2 = useRef(0);
  const held = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Hold to commit"
      accessibilityHint="Press and hold, or tap twice"
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={finish}
      onPressIn={() => {
        held.current = false;
        buzz('tap');
        Animated.timing(v, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(({ finished }) => {
          if (finished) {
            held.current = true;
            finish();
          }
        });
      }}
      onPressOut={() => {
        if (!done.current) {
          v.stopAnimation();
          Animated.timing(v, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }}
      onPress={() => {
        if (done.current || held.current) return;
        if (Date.now() < tap2.current) return finish();
        tap2.current = Date.now() + 4000;
        setLabel('Keep holding, or tap again');
      }}
      style={[s.hold, { backgroundColor: c.accentSoft, borderColor: c.accent }]}>
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: c.accent,
          width: v.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
      <Text style={[s.holdT, { color: c.ink }]} accessibilityLiveRegion="polite">
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  si: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secT: { fontFamily: font.bodyBold, fontSize: 13, letterSpacing: 1.2 },
  x: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  cardIn: { padding: 22, gap: 14, flexGrow: 1 },
  art: { minHeight: 90, alignItems: 'center', justifyContent: 'center' },
  h: { fontFamily: font.display, fontSize: 30, lineHeight: 34 },
  hsm: { fontSize: 26, lineHeight: 31 },
  p: { fontSize: 18, lineHeight: 26 },
  quote: { padding: 14, borderRadius: 16, borderLeftWidth: 5 },
  quoteT: { fontFamily: font.display, fontSize: 20, lineHeight: 27 },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  optT: { flex: 1, fontFamily: font.bodySemi, fontSize: 16.5, lineHeight: 21 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  ti: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lv: {
    width: 44,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    overflow: 'hidden',
  },
  grid3: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  big: { fontFamily: font.display, fontSize: 64, lineHeight: 70 },
  slv: { fontFamily: font.display, fontSize: 22, textAlign: 'center' },
  stop: { width: 26, height: 26, borderRadius: 13, borderWidth: 3 },
  eq: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  soft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
  },
  more: { gap: 8, padding: 12, borderRadius: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 2,
    maxWidth: '100%',
  },
  plan: { borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 14 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  pledge: {
    fontFamily: font.display,
    fontSize: 20,
    textAlign: 'center',
    marginTop: 4,
  },
  ch: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
  },
  bx: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gift: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  foot: { flexDirection: 'row', gap: 10 },
  hold: {
    flex: 1,
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { userSelect: 'none' } : {}),
  },
  holdT: { fontFamily: font.bodySemi, fontSize: 19 },
});
