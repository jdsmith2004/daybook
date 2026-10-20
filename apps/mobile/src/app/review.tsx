/* The Sunday review (core: sunday.ts, sunday-story.ts): a walk through the week, one thing at a time, like a year-in-review
   story. Bars along the top show where you are; a tap on the right side of the picture goes on, the left side goes back,
   and Next is always at the bottom too. The screens: the week, the seven days, the urges ridden out, when it came, what
   set it off, what helped, the slips (honestly, and kindly), the foundations, last week's goal, the long view over eight
   weeks, and one longer thing to know, picked for the hardest pattern of the week. A screen with nothing to show is left
   out. Each one has a line of science with its source and the lesson to read.

   Then getting ready for the next week, kept short: your take (what worked, what to change), and one small goal. Saving
   it says All done, worth 20 points once, and the goal waits on Today. After that, and only if the person wants them: an
   if-then plan for the hardest moment, the harder days ahead, and a note to their future self, shown midweek.
   ?s=<a Sunday> opens that week's review (to write it late, or change it). */
import {
  addDays,
  gameCompute,
  isSunday,
  LESSONS,
  saveSun,
  SRC,
  story,
  storyHardDays,
  storyIfLine,
  storyIfThen,
  storyIfWhen,
  storyStretch,
  storyTeach,
  SUN_GOALS,
  SUN_LAST,
  SUN_LEN,
  SUN_NOTE_LEN,
  sunChange,
  sunDue,
  sunGoalLine,
  sunGoalOf,
  sunGoals,
  sunKey,
  sunOf,
  sunRange,
  sunWorked,
  type StoryScreen,
  type SunGoal,
  type SunLast,
  type SunPick,
  type SunReview,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { KeepAbove } from '@/components/keyboard';
import { Text } from '@/components/text';

import { AnswerChip, ChipWrap } from '@/components/answer';
import { Appear } from '@/components/appear';
import { FitArt, SHORT } from '@/components/fit';
import { Field, Link } from '@/components/choices';
import { CountUp } from '@/components/count-up';
import { Flame } from '@/components/flame';
import { OwnChip, OwnField } from '@/components/own';
import { Clock } from '@/components/pattern-charts';
import { SourceLine } from '@/components/research';
import { Big, DaysRow, GoalDots, HelpList, RideWave, Rings, StoryBars, Teach, TrigBars, WeekBars } from '@/components/review-art';
import { Dock, Finish, SceneFrame, Stage } from '@/components/scene';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { setReminderPrefs, useReminderPrefs } from '@/lib/prefs';
import { allowReminders, remindersOffered } from '@/lib/reminders';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme, type Sky } from '@/lib/theme';

type After = 'take' | 'goal' | 'done' | 'xIt' | 'xHard' | 'xNote';
type Own = 'w' | 'c' | 'g' | 'iw' | 'it' | null;
const SKY: Record<StoryScreen, Sky> = {
  intro: 'violet',
  days: 'sun',
  ride: 'mint',
  clock: 'sky',
  trig: 'coral',
  help: 'mint',
  slips: 'sun',
  base: 'violet',
  last: 'sun',
  long: 'sky',
  deep: 'violet',
};
const SRCS = SRC as unknown as Record<string, [string, string]>;
const IF_TEACH = {
  t: 'Across many studies, people who made if-then plans followed through on their goals more than people who only set the goal.',
  src: ['gollwitzer'],
};
const NOTES = [
  'You have done this before.',
  'One day at a time. Today counts.',
  'Phone in the other room. Then bed.',
  'Text someone. You are not alone in this.',
];

export default function Review() {
  const c = useTheme();
  const win = useWindowDimensions();
  const { snap, tk, now, update, say } = useStore();
  const prefs = useReminderPrefs();
  const params = useLocalSearchParams<{ s?: string }>();
  const st = snap.settings;
  /* which week: the one asked for, the one Today is asking about, or this one so far */
  const [sun] = useState(() => {
    const s = params.s;
    if (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && isSunday(s) && s <= sunOf(tk)) return s;
    return (st && sunDue(snap.reviews, st, tk)?.sun) || sunOf(tk);
  });
  const saved = snap.reviews[sunKey(sun)]?.sun || null;
  const [w, setW] = useState<string[]>(() => saved?.w || []);
  const [ch, setCh] = useState<string[]>(() => saved?.c || []);
  const [goal, setGoal] = useState<SunGoal | null>(() => saved?.g || null);
  const [last, setLast] = useState<SunLast | undefined>(() => saved?.last);
  const [own, setOwn] = useState<Own>(null);
  /* where we are: a screen of the story (i), or one of the steps after it */
  const [i, setI] = useState(0);
  const [after, setAfter] = useState<After | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [pts0] = useState(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).pts : 0));
  /* the extras, while being made */
  const [itW, setItW] = useState<string | null>(() => saved?.it?.w || null);
  const [itT, setItT] = useState<string | null>(() => saved?.it?.t || null);
  const [note, setNote] = useState(() => saved?.nt || '');
  const S = useMemo(
    () => (st ? story(snap.days, st, snap.reviews, sun, tk, Date.now(), gameCompute(snap.days, st, snap.reviews, tk).perDay) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snap.days, st, sun, tk],
  );
  if (!st || !S) return null;

  const screens = S.screens;
  const scr = screens[Math.min(i, screens.length - 1)];
  const over = tk > sun;
  const toggle = (list: string[], t: string) => (list.indexOf(t) >= 0 ? list.filter((x) => x !== t) : list.concat(t).slice(-6));
  const worked = sunWorked(S.w, st);
  const change = sunChange(S.w, st);
  const changeIds = change.filter((x) => ch.indexOf(x.t) >= 0).map((x) => x.id);
  const goals = sunGoals(changeIds.length ? changeIds : change.slice(0, 1).map((x) => x.id), st);
  const goalKind = goal?.k ? SUN_GOALS[goal.k] : null;

  const next = () => {
    buzz('tap');
    setDir(1);
    if (i < screens.length - 1) setI(i + 1);
    else setAfter('take');
  };
  const back = () => {
    setDir(-1);
    if (after === 'goal') setAfter('take');
    else if (after === 'take') setAfter(null);
    else if (after && after[0] === 'x') setAfter('done');
    else if (i > 0) setI(i - 1);
  };
  /* the review as it stands, and saving it (again, for the extras: the points come once) */
  const cur = (): SunReview => ({ ...(saved || {}), w, c: ch, g: goal, ...(last ? { last } : {}) });
  const store = (extra: Partial<SunReview> = {}) => update((s0) => ({ ...s0, reviews: saveSun(s0.reviews, sun, { ...cur(), ...extra }) }));
  const save = (g: SunGoal | null) => {
    setGoal(g);
    update((s0) => ({ ...s0, reviews: saveSun(s0.reviews, sun, { ...cur(), g }) }));
    buzz('lit');
    play('chime');
    setDir(1);
    setAfter('done');
  };
  const sky: Sky = after ? (after === 'done' ? 'sun' : 'violet') : SKY[scr];

  /* the picture area of a story screen: a tap on its right side goes on, on its left side goes back */
  const tapZone = (e: { nativeEvent: { pageX: number } }) => (e.nativeEvent.pageX < win.width * 0.3 ? i > 0 && back() : next());
  const eyebrow = (t: string) => (
    <T v="eyebrow" tone="muted" style={s.c}>
      {t}
    </T>
  );
  const nextBtn = <Button label={i < screens.length - 1 ? 'Next' : 'Get ready for next week'} onPress={next} />;

  let body: React.ReactNode = null;
  let key = after || scr;

  /* ---------- the story ---------- */
  if (!after) {
    const slipDays = S.days.filter((d) => d.state === 'slip').length;
    const teach = storyTeach(scr, { slipDays });
    let main: React.ReactNode = null;
    if (scr === 'intro') {
      main = (
        <>
          {eyebrow(sunRange(sun) + (over ? ' · last week' : tk < sun ? ' · so far' : ''))}
          <Text style={[s.h1, { color: c.ink }]} accessibilityRole="header">
            Your week,{'\n'}looked back on
          </Text>
          <FitArt>
            <Appear delay={200} by={10}>
              <Flame level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)} size={150} />
            </Appear>
          </FitArt>
          <T tone="muted" style={[s.c, s.lead]}>
            A few minutes, one thing at a time. Tap the right side to go on, the left side to go back.
          </T>
        </>
      );
    } else if (scr === 'days') {
      const zero = S.w.noSlip === 0;
      main = (
        <>
          {eyebrow('YOUR SEVEN DAYS')}
          <Big>{zero ? S.w.days : S.w.noSlip}</Big>
          <T style={[s.c, s.lead, { fontFamily: font.bodySemi }]}>{zero ? 'days you showed up and logged it' : 'days with no slip'}</T>
          <DaysRow days={S.days} />
          {S.best >= 1 ? (
            <Appear delay={1300}>
              <View style={[s.pill, { backgroundColor: c.surface }]}>
                <Icon name="flame" size={16} color={c.sunText} />
                <T v="small" style={{ fontFamily: font.bodySemi }}>
                  Your longest stretch: {storyStretch(S.best)}
                </T>
              </View>
            </Appear>
          ) : null}
        </>
      );
    } else if (scr === 'ride') {
      main = (
        <>
          {eyebrow('URGES')}
          <Big color={c.mintText}>{S.w.rode}</Big>
          <T style={[s.c, s.lead, { fontFamily: font.bodySemi }]}>{S.w.rode === 1 ? 'urge ridden out' : 'urges ridden out'}</T>
          <FitArt>
            <RideWave mins={S.rideMins} />
          </FitArt>
          <T tone="muted" style={[s.c, s.lead]}>
            {S.w.rode === 1 ? 'That one is proof you can.' : 'Every one of them is proof you can.'}
          </T>
        </>
      );
    } else if (scr === 'clock') {
      const top = S.when.hours.slice().sort((a, b) => b.rode + b.slipped - (a.rode + a.slipped))[0];
      const hard = S.when.hard.weekdays || S.when.hard.weekends;
      main = (
        <>
          {eyebrow('WHEN IT CAME')}
          <Text style={[s.h2, { color: c.ink }]} accessibilityRole="header">
            Most often around {(top.h % 12 || 12) + (top.h < 12 ? ' AM' : ' PM')}
          </Text>
          <FitArt stretch>
            <View style={[s.card, { backgroundColor: c.surface, borderColor: c.cardEdge, alignItems: 'center', paddingVertical: 8 }]}>
              <View style={{ width: Math.min(250, win.width - 72) }}>
                <Clock hours={S.when.hours} hard={S.when.hard} />
              </View>
            </View>
          </FitArt>
          {hard ? (
            <T tone="muted" style={[s.c, s.lead]}>
              {hard.line} Those are your hard hours.
            </T>
          ) : null}
        </>
      );
    } else if (scr === 'trig') {
      main = (
        <>
          {eyebrow('WHAT SET IT OFF')}
          <Text style={[s.h2, { color: c.ink }]} accessibilityRole="header">
            {S.trig[0].t} came up most
          </Text>
          <FitArt stretch>
            <TrigBars rows={S.trig} />
          </FitArt>
        </>
      );
    } else if (scr === 'help') {
      main = (
        <>
          {eyebrow('WHAT HELPED')}
          <Text style={[s.h2, { color: c.ink }]} accessibilityRole="header">
            {S.help[0].t} worked best
          </Text>
          <FitArt stretch>
            <HelpList rows={S.help} />
          </FitArt>
          <T tone="muted" style={[s.c, s.lead]}>
            Keep these close. They are proven, by you.
          </T>
        </>
      );
    } else if (scr === 'slips') {
      main = (
        <>
          {eyebrow('THE HARD MOMENTS')}
          <Big color={c.slipText}>{S.slips.n}</Big>
          <T style={[s.c, s.lead, { fontFamily: font.bodySemi }]}>{S.slips.n === 1 ? 'slip, logged honestly' : 'slips, logged honestly'}</T>
          <View style={{ alignSelf: 'stretch', gap: 8 }}>
            {S.slips.waited ? (
              <Fact icon="timer" text={'You waited first ' + S.slips.waited + ' of ' + S.slips.n + ' times. That wait is the skill growing.'} />
            ) : null}
            {S.slips.top ? <Fact icon="compass" text={'Most came with: ' + S.slips.top + '.'} /> : null}
            <Fact icon="leaf" text="Each one is data for the week ahead, not a reset." />
          </View>
        </>
      );
    } else if (scr === 'base') {
      const b = S.base;
      const line =
        b.sleep != null && b.sleep < 7
          ? 'About ' + b.sleep + ' hours of sleep a night. More rest makes the nights easier.'
          : b.phone >= 3
            ? 'Phone away ' + b.phone + ' nights. That is less to fight.'
            : 'Small habits here make every hard moment smaller.';
      main = (
        <>
          {eyebrow('THE FOUNDATIONS')}
          <Text style={[s.h2, { color: c.ink }]} accessibilityRole="header">
            What holds the rest up
          </Text>
          <FitArt>
            <Rings base={b} />
          </FitArt>
          <T tone="muted" style={[s.c, s.lead]}>
            {line}
          </T>
        </>
      );
    } else if (scr === 'last' && S.last) {
      const L = S.last;
      main = (
        <>
          {eyebrow('LAST WEEK’S GOAL')}
          <Text style={[s.h2, { color: c.ink }]} accessibilityRole="header">
            {L.g.t}
          </Text>
          {L.done != null && L.g.n ? (
            <>
              <GoalDots n={L.g.n} done={L.done} />
              <Appear delay={300 + L.g.n * 160}>
                <T style={[s.c, s.lead, { fontFamily: font.bodySemi, color: L.met ? c.mintText : c.ink }]}>{sunGoalLine(L.g, L.done, over || tk >= sun)}</T>
              </Appear>
            </>
          ) : (
            <View style={{ gap: 10, alignItems: 'center' }}>
              <T tone="muted">How did it go?</T>
              <View style={s.row}>
                {SUN_LAST.map(([k, l]) => (
                  <Chip key={k} label={l} on={last === k} onPress={() => setLast(last === k ? undefined : k)} />
                ))}
              </View>
              {last ? <T style={s.c}>{SUN_LAST.find((x) => x[0] === last)![2]}</T> : null}
            </View>
          )}
        </>
      );
    } else if (scr === 'long') {
      main = (
        <>
          {eyebrow('THE LONG VIEW')}
          <Text style={[s.h2, { color: c.ink }]} accessibilityRole="header">
            {S.weeks.length} weeks, side by side
          </Text>
          <FitArt stretch>
            <WeekBars weeks={S.weeks} />
          </FitArt>
          <T style={[s.c, s.lead, { fontFamily: font.bodySemi }]}>{S.trend.line}</T>
          {S.pts ? <CountUp to={S.pts} prefix="+" suffix=" points this week" delay={900} style={[s.pts, { color: c.mintText }]} /> : null}
          {String(st.becoming || '').trim() ? (
            <Appear delay={1200}>
              <T style={[s.c, s.be]}>{String(st.becoming).trim()}</T>
            </Appear>
          ) : null}
        </>
      );
    } else if (scr === 'deep') {
      const d = S.deep;
      const l = (LESSONS as unknown as { id: string; title: string }[]).find((x) => x.id === d.l);
      main = (
        <>
          {eyebrow('ONE THING TO KNOW')}
          <FitArt min={0}>
            <View style={[s.deepIc, { backgroundColor: c.violetSoft }]}>
              <Icon name={d.ic} size={30} color={c.violetText} />
            </View>
          </FitArt>
          <Text style={[s.h2, { color: c.ink }]} accessibilityRole="header">
            {d.title}
          </Text>
          <View style={[s.card, { backgroundColor: c.surface, borderColor: c.cardEdge }]}>
            {d.paras.map((p, j) => (
              <Appear key={j} delay={150 + j * 260}>
                <T style={{ fontSize: SHORT ? 15 : 16, lineHeight: SHORT ? 21 : 23 }}>{p}</T>
              </Appear>
            ))}
            <View style={s.foot2}>
              {l ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: l.id } })}
                  style={s.lesson}
                  hitSlop={6}>
                  <Icon name="book" size={14} color={c.accentText} />
                  <Text style={[s.lessonT, { color: c.accentText }]} numberOfLines={1}>
                    {l.title}
                  </Text>
                </Pressable>
              ) : null}
              <SourceLine keys={d.src} map={SRCS} />
            </View>
          </View>
        </>
      );
    }
    body = (
      <>
        <StoryBars n={screens.length} i={i} />
        <Pressable accessible={false} onPress={tapZone} style={s.zone}>
          {main}
        </Pressable>
        {teach ? <Teach teach={teach} /> : null}
        <Dock>{scr === 'intro' ? <Button label="Start" onPress={next} /> : nextBtn}</Dock>
      </>
    );
  } else if (after === 'take') {
    /* ---------- your take ---------- */
    const ownLines = (list: string[], picks: SunPick[]) => list.filter((t) => !picks.some((p) => p.t === t));
    body =
      own === 'w' || own === 'c' ? (
        <>
          {eyebrow(own === 'w' ? 'WHAT WORKED' : 'WHAT TO CHANGE')}
          <OwnField
            placeholder={own === 'w' ? 'Like: going for a run after work' : 'Like: Sunday evenings'}
            max={SUN_LEN}
            onSave={(t) => {
              if (own === 'w') setW(toggle(w, t));
              else setCh(toggle(ch, t));
              setOwn(null);
            }}
            onCancel={() => setOwn(null)}
          />
        </>
      ) : (
        <>
          {eyebrow('GETTING READY · 1 OF 2')}
          <T v="title" style={s.c} accessibilityRole="header">
            Your take on the week
          </T>
          <T tone="muted" style={[s.c, s.lead]}>
            Tap what fits. Daybook found these in your log.
          </T>
          <Dock>
            <Part icon="check" tone="mint" title="What worked">
              {worked.map((p) => (
                <Pick key={p.id} p={p} tone="mint" on={w.indexOf(p.t) >= 0} onPress={() => setW(toggle(w, p.t))} />
              ))}
              {ownLines(w, worked).map((t) => (
                <AnswerChip key={'o' + t} label={t} tone="mint" on onPress={() => setW(toggle(w, t))} />
              ))}
              <OwnChip onPress={() => setOwn('w')} />
            </Part>
            <Part icon="compass" tone="coral" title="What to change">
              {change.map((p) => (
                <Pick key={p.id} p={p} tone="coral" on={ch.indexOf(p.t) >= 0} onPress={() => setCh(toggle(ch, p.t))} />
              ))}
              {ownLines(ch, change).map((t) => (
                <AnswerChip key={'o' + t} label={t} tone="coral" on onPress={() => setCh(toggle(ch, t))} />
              ))}
              <OwnChip onPress={() => setOwn('c')} />
            </Part>
            <Button
              label={w.length + ch.length ? 'Next' : 'Skip'}
              kind={w.length + ch.length ? 'primary' : 'ghost'}
              onPress={() => {
                setDir(1);
                setAfter('goal');
              }}
            />
          </Dock>
        </>
      );
  } else if (after === 'goal') {
    /* ---------- one small goal ---------- */
    body =
      own === 'g' ? (
        <>
          {eyebrow('ONE SMALL GOAL')}
          <OwnField placeholder="Like: a walk after dinner" max={80} onSave={(t) => (setGoal({ t }), setOwn(null))} onCancel={() => setOwn(null)} />
        </>
      ) : (
        <>
          {eyebrow('GETTING READY · 2 OF 2')}
          <T v="title" style={s.c} accessibilityRole="header">
            One small goal for next week
          </T>
          <T tone="muted" style={[s.c, s.lead]}>
            Small and close. It waits on Today all week, and Daybook counts it for you.
          </T>
          {goal ? (
            <Appear key={goal.t} by={6} style={[s.goalCard, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <Icon name="flag" size={22} color={c.sunText} />
              <Text style={[s.goalT, { color: c.ink }]}>{goal.t}</Text>
            </Appear>
          ) : null}
          <Dock>
            <ChipWrap>
              {goals.map((g) => {
                const on = !!goal && (goal.k ? goal.k === g.k : goal.t === g.t);
                return (
                  <AnswerChip
                    key={g.k || g.t}
                    label={on && goal ? goal.t : g.t}
                    tone="sun"
                    on={on}
                    onPress={() => setGoal(on ? null : g.k ? sunGoalOf(g.k, st, goal?.k === g.k ? goal.n : undefined) : g)}
                  />
                );
              })}
              {goal && !goals.some((g) => (goal.k ? goal.k === g.k : goal.t === g.t)) ? (
                <AnswerChip label={goal.t} tone="sun" on onPress={() => setGoal(null)} />
              ) : null}
              <OwnChip onPress={() => setOwn('g')} />
            </ChipWrap>
            {goal && goal.k && goalKind ? (
              <View style={s.stepRow} accessibilityLabel={'How many ' + goalKind.unit}>
                <Step label="One less" sign="−" off={(goal.n || 1) <= 1} onPress={() => setGoal(sunGoalOf(goal.k!, st, Math.max(1, (goal.n || 1) - 1)))} />
                <T style={{ fontFamily: font.bodyBold, minWidth: 92, textAlign: 'center' }}>
                  {goal.n} {goalKind.unit}
                </T>
                <Step label="One more" sign="+" off={(goal.n || 1) >= 7} onPress={() => setGoal(sunGoalOf(goal.k!, st, Math.min(7, (goal.n || 1) + 1)))} />
              </View>
            ) : null}
            {remindersOffered && !prefs.review ? (
              <View style={s.row}>
                <Chip
                  label="Remind me next Sunday"
                  on={false}
                  onPress={async () => {
                    const ok = await allowReminders();
                    if (ok) {
                      setReminderPrefs({ ...prefs, review: true });
                      say('Daybook will remind you on Sunday evenings.');
                    } else say('Notifications are off for Daybook. You can turn them on in your phone’s settings.');
                  }}
                />
              </View>
            ) : null}
            <Button label={saved ? 'Save my week' : 'Save my week · +20'} onPress={() => save(goal)} />
            {!goal ? (
              <View style={{ alignItems: 'center' }}>
                <Link label="No goal this week" onPress={() => save(null)} />
              </View>
            ) : null}
          </Dock>
        </>
      );
  } else if (after === 'done') {
    /* ---------- all done, and more if wanted ---------- */
    const gain = Math.max(0, gameCompute(snap.days, st, snap.reviews, tk).pts - pts0);
    const r = snap.reviews[sunKey(sun)]?.sun;
    const extra = (k: After, icon: string, tone: string, title: string, sub: string, done: boolean) => {
      const t = toneOf(c, tone);
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={title + (done ? ', done' : '')}
          onPress={() => {
            buzz('tap');
            setDir(1);
            setOwn(null);
            setAfter(k);
          }}
          style={({ pressed }) => [
            s.extra,
            { backgroundColor: c.surface, borderColor: done ? c.mint : c.cardEdge, shadowColor: c.lip, transform: [{ translateY: pressed ? 2 : 0 }] },
          ]}>
          <View style={[s.extraIc, { backgroundColor: t.soft }]}>
            <Icon name={icon} size={20} color={t.text} />
          </View>
          <View style={{ flex: 1 }}>
            <T v="label">{title}</T>
            <T v="small" tone="muted">
              {sub}
            </T>
          </View>
          {done ? <Icon name="check" size={20} color={c.mintText} /> : <Icon name="next" size={18} color={c.muted} />}
        </Pressable>
      );
    };
    body = (
      <>
        <Finish
          level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)}
          title="All done!"
          text={goal ? 'Your goal waits on Today all week.' : 'Your week is saved.'}
        />
        <Appear delay={300} style={[s.summary, { backgroundColor: c.surface, shadowColor: c.lip }]}>
          <T v="eyebrow" tone="muted">
            {sunRange(sun)}
          </T>
          <T style={{ fontFamily: font.bodySemi }}>
            {[
              S.w.noSlip ? S.w.noSlip + ' of ' + S.w.days + ' days with no slip' : '',
              S.w.rode ? S.w.rode + (S.w.rode === 1 ? ' urge' : ' urges') + ' ridden out' : '',
            ]
              .filter(Boolean)
              .join(' · ') || 'A week looked back on, honestly.'}
          </T>
          {goal ? (
            <View style={s.sumGoal}>
              <Icon name="flag" size={16} color={c.sunText} />
              <T v="small" style={{ flex: 1, fontFamily: font.bodySemi }}>
                {goal.t}
              </T>
            </View>
          ) : null}
        </Appear>
        {gain ? <CountUp to={gain} prefix="+" suffix=" points" delay={650} style={[s.pts, { color: c.mintText }]} /> : null}
        <Dock>
          <T v="eyebrow" tone="muted" style={s.c}>
            WANT TO DO MORE? ALL OPTIONAL
          </T>
          {extra('xIt', 'compass', 'violet', 'Plan for your hardest moment', r?.it ? storyIfLine(r.it) : 'An if-then plan, made while you are calm', !!r?.it)}
          {extra('xHard', 'calendar', 'coral', 'See your harder days ahead', r?.hd ? 'Marked on Today' : 'From your log, with a heads-up', !!r?.hd)}
          {extra('xNote', 'pencil', 'sun', 'A note to future you', r?.nt ? '“' + r.nt + '”' : 'Shown to you from Wednesday on', !!r?.nt)}
          <Button label="Done" onPress={close} />
        </Dock>
      </>
    );
  } else if (after === 'xIt') {
    /* ---------- an if-then plan ---------- */
    const whens = storyIfWhen(snap.days, st, tk);
    const thens = storyIfThen(S.w, st);
    if (itW && whens.indexOf(itW) < 0) whens.push(itW);
    if (itT && thens.indexOf(itT) < 0) thens.push(itT);
    body =
      own === 'iw' || own === 'it' ? (
        <>
          {eyebrow(own === 'iw' ? 'WHEN…' : 'I WILL…')}
          <OwnField
            placeholder={own === 'iw' ? 'Like: I get home from work tired' : 'Like: make tea and call my brother'}
            max={80}
            onSave={(t) => {
              const v = t.replace(/[.!]+$/, '');
              if (own === 'iw') setItW(v.replace(/^when\s+/i, ''));
              else setItT(v.replace(/^i will\s+/i, ''));
              setOwn(null);
            }}
            onCancel={() => setOwn(null)}
          />
        </>
      ) : (
        <>
          {eyebrow('YOUR HARDEST MOMENT')}
          <T v="title" style={s.c} accessibilityRole="header">
            Decide now, while you are calm
          </T>
          <Appear key={(itW || '') + (itT || '')} by={6} style={[s.goalCard, { backgroundColor: c.surface, shadowColor: c.lip }]}>
            <Icon name="compass" size={22} color={c.violetText} />
            <Text style={[s.goalT, { color: itW && itT ? c.ink : c.muted }]}>
              {itW && itT ? storyIfLine({ w: itW, t: itT }) : 'When ' + (itW || '…') + ', I will ' + (itT || '…')}
            </Text>
          </Appear>
          {/* the science, short here, so the choices fit (left out on a short phone, where the choices need the room) */}
          {SHORT ? null : (
            <View style={{ alignSelf: 'stretch', gap: 6 }}>
              <T v="small" tone="muted" style={s.c}>
                {IF_TEACH.t}
              </T>
              <SourceLine keys={IF_TEACH.src} map={SRCS} />
            </View>
          )}
          <Dock>
            <Part icon="timer" tone="violet" title="When…">
              {whens.map((x) => (
                <AnswerChip key={x} label={x} tone="violet" on={itW === x} onPress={() => setItW(itW === x ? null : x)} />
              ))}
              <OwnChip onPress={() => setOwn('iw')} />
            </Part>
            <Part icon="check" tone="mint" title="I will…">
              {thens.map((x) => (
                <AnswerChip key={x} label={x} tone="mint" on={itT === x} onPress={() => setItT(itT === x ? null : x)} />
              ))}
              <OwnChip onPress={() => setOwn('it')} />
            </Part>
            <Button
              label="Save my plan"
              disabled={!itW || !itT}
              onPress={() => {
                store({ it: { w: itW!, t: itT! } });
                buzz('save');
                say('Your plan is saved. SOS and Today show it this week.');
                setDir(-1);
                setAfter('done');
              }}
            />
          </Dock>
        </>
      );
  } else if (after === 'xHard') {
    /* ---------- the harder days ahead ---------- */
    const hd = storyHardDays(snap.days, tk);
    const dateOf = (d: number) => {
      const k = addDays(sun, d === 0 ? 7 : d);
      const [y, m, dd] = k.split('-').map(Number);
      return new Date(y, m - 1, dd).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };
    body = (
      <>
        {eyebrow('THE WEEK AHEAD')}
        <T v="title" style={s.c} accessibilityRole="header">
          {hd.length ? (hd.length === 1 ? 'One day to plan for' : 'Two days to plan for') : 'No day stands out'}
        </T>
        <T tone="muted" style={[s.c, s.lead]}>
          {hd.length
            ? 'From your last two months of slips. Knowing ahead is half the plan.'
            : 'Your slips are not piling up on any one day of the week. That is good news.'}
        </T>
        <View style={{ alignSelf: 'stretch', gap: 10 }}>
          {hd.map((x, j) => (
            <Appear key={x.d} delay={150 + j * 200} style={[s.extra, { backgroundColor: c.surface, borderColor: c.coral, shadowColor: c.lip }]}>
              <View style={[s.extraIc, { backgroundColor: c.coralSoft }]}>
                <Icon name="calendar" size={20} color={c.coralText} />
              </View>
              <View style={{ flex: 1 }}>
                <T v="label">{dateOf(x.d)}</T>
                <T v="small" tone="muted">
                  {x.slips} of your last {x.of} slips came on a {x.name}.
                </T>
              </View>
            </Appear>
          ))}
        </View>
        <Dock>
          {hd.length && remindersOffered && !prefs.risk ? (
            <View style={s.row}>
              <Chip
                label="Heads-up before my hard hours"
                on={false}
                onPress={async () => {
                  const ok = await allowReminders();
                  if (ok) {
                    setReminderPrefs({ ...prefs, risk: true });
                    say('Daybook will give you a heads-up before your hard hours.');
                  } else say('Notifications are off for Daybook. You can turn them on in your phone’s settings.');
                }}
              />
            </View>
          ) : null}
          {hd.length ? (
            <Button
              label="Mark them on Today"
              onPress={() => {
                store({ hd: hd.map((x) => x.d) });
                buzz('save');
                say('On those days, Today reminds you, with your plan.');
                setDir(-1);
                setAfter('done');
              }}
            />
          ) : (
            <Button label="Back" onPress={back} />
          )}
        </Dock>
      </>
    );
  } else if (after === 'xNote') {
    /* ---------- a note to future you: the box and its button stay near the top, above the keyboard ---------- */
    body = (
      <>
        {eyebrow('A NOTE TO FUTURE YOU')}
        <T v="title" style={s.c} accessibilityRole="header">
          What will you need to hear midweek?
        </T>
        <KeepAbove style={{ alignSelf: 'stretch', gap: 14 }}>
          <Field
            label="My note"
            hideLabel
            multiline
            maxLength={SUN_NOTE_LEN}
            value={note}
            onChangeText={setNote}
            placeholder="Like: You have done this before."
          />
          <Button
            label="Save my note"
            disabled={!note.trim()}
            onPress={() => {
              store({ nt: note.trim() });
              buzz('save');
              say('Today shows it to you from Wednesday on.');
              setDir(-1);
              setAfter('done');
            }}
          />
        </KeepAbove>
        <T v="small" tone="muted" style={s.c}>
          Or start from one of these:
        </T>
        <ChipWrap>
          {NOTES.map((x) => (
            <AnswerChip key={x} label={x} tone="sun" on={note === x} onPress={() => setNote(x)} />
          ))}
        </ChipWrap>
      </>
    );
  }
  if (after) key = after + (own || '');

  return (
    <SceneFrame title="Sunday review" sky={sky} onBack={(!after && i > 0) || (after && after !== 'done') ? back : null} onClose={close}>
      <Stage key={key} dir={dir}>
        {body}
      </Stage>
    </SceneFrame>
  );
}

function Fact({ icon, text }: { icon: string; text: string }) {
  const c = useTheme();
  return (
    <View style={[s.fact, { backgroundColor: c.surface }]}>
      <Icon name={icon} size={18} color={c.accentText} />
      <T style={{ flex: 1, fontSize: 15.5, lineHeight: 21 }}>{text}</T>
    </View>
  );
}

/* one of the answers: its title, and its choices */
function Part({ icon, tone, title, children }: { icon: string; tone: string; title: string; children: React.ReactNode }) {
  const c = useTheme();
  const t = toneOf(c, tone);
  return (
    <View style={s.part}>
      <View style={s.partHead}>
        <View style={[s.partIc, { backgroundColor: t.soft }]}>
          <Icon name={icon} size={15} color={t.text} />
        </View>
        <T v="label">{title}</T>
      </View>
      <ChipWrap>{children}</ChipWrap>
    </View>
  );
}

/* a choice Daybook saw in the log: its words, and what it saw, small, underneath */
function Pick({ p, tone, on, onPress }: { p: SunPick; tone: string; on: boolean; onPress: () => void }) {
  const c = useTheme();
  const t = toneOf(c, tone);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={p.t + (p.ev ? ', ' + p.ev : '')}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.pick, { backgroundColor: on ? t.ic : c.surface, shadowColor: c.lip, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
      <Text style={[s.pickT, { color: on ? t.ink : c.ink }]}>{p.t}</Text>
      {p.ev ? <Text style={[s.pickS, { color: on ? t.ink : c.muted }]}>{p.ev}</Text> : null}
    </Pressable>
  );
}

function Step({ label, sign, off, onPress }: { label: string; sign: string; off: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: off }}
      disabled={off}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={[s.step, { backgroundColor: c.surface, borderColor: c.line, opacity: off ? 0.4 : 1 }]}>
      <Text style={[s.stepT, { color: c.ink }]}>{sign}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  lead: { maxWidth: 380, alignSelf: 'center' },
  zone: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 6 },
  h1: { fontFamily: font.displayBold, fontSize: 38, lineHeight: 44, textAlign: 'center' },
  h2: { fontFamily: font.display, fontSize: 27, lineHeight: 33, textAlign: 'center', maxWidth: 400 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  card: { alignSelf: 'stretch', gap: SHORT ? 9 : 12, padding: SHORT ? 13 : 16, borderRadius: 20, borderWidth: 1.5 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16 },
  deepIc: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 28, flexShrink: 1 },
  lessonT: { fontFamily: font.bodySemi, fontSize: 13.5, textDecorationLine: 'underline', flexShrink: 1 },
  foot2: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12 },
  be: { fontFamily: font.display, fontSize: 17, lineHeight: 23, opacity: 0.85 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  part: { alignSelf: 'stretch', gap: 8 },
  partHead: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  partIc: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pick: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  pickT: { fontFamily: font.bodySemi, fontSize: 15 },
  pickS: { fontFamily: font.body, fontSize: 12, marginTop: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  step: { width: 40, height: 40, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  stepT: { fontFamily: font.bodyBold, fontSize: 20, lineHeight: 22 },
  goalCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  goalT: { flex: 1, fontFamily: font.display, fontSize: 19, lineHeight: 26 },
  summary: { alignSelf: 'stretch', gap: 6, padding: 16, borderRadius: 20, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  sumGoal: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  extra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SHORT ? 9 : 12,
    borderRadius: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  extraIc: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  pts: { fontFamily: font.display, fontSize: 18, textAlign: 'center' },
});
