/* The Sunday review, rebuilt from its purpose. Its two jobs (the owner, November 15, 2026): help the person understand the week
   they had, and get ready for the next one with a goal that changes them, "not on not watching porn but on changing your mindset
   and doing things that will make you not want to watch porn more". Every page changes something real for next week.

   1. Look back. The week in seven days and three numbers, then up to three of the person's own graphs for that week: the very
      same cards as the Pattern page (components/pattern-cards.tsx, read for the seven days that end on this Sunday). A card the
      free side does not keep shows locked, with the tip ask, as on Pattern ("they need to donate for that"), and only one of
      those. Then what the week says, in three plain lines (core sunSays), and last week's goal, when there was one.
   2. One goal. Three goals that grow the person, from the week (core sunday-goal.ts): a lesson every day, the phone out of the
      bedroom, sleep, real connection, moving, faith for the person it matters to, who they are becoming. Each says why and comes
      with its plan; the rest are a tap away, and their own words are welcome. One only, on purpose, and the page says so. Then
      the goal set: how many, and what happens, in plain rows: where it shows, what counts it, the plan, the reminder it turns on.
   Saving ends on its own celebration (the owner: "it has to be a different animation"): dawn, the lesson finish's engine with
   no band, the flame rising from below like a sun into a warm horizon, the goal's nights lighting in a row, the points into the
   level line, and the Sundays line. Worth 20 points once.
   Every "Write my own" keeps the words for good (core saved-answers.ts). ?s=<a Sunday> opens that week's review. */
import {
  gameCompute,
  isSunday,
  saveSun,
  story,
  storyIfLine,
  SUN_GOALS,
  SUN_HOW,
  SUN_LAST,
  sunDue,
  sunGoalLine,
  sunKey,
  sunList,
  sunOf,
  sunGoalNamed,
  sunMore,
  sunOptions,
  sunOwnGoal,
  sunSays,
  sunRange,
  sunRemindLine,
  type SunGoal,
  type SunLast,
  type SunOption,
} from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AnswerChip, ChipWrap } from '@/components/answer';
import { Appear } from '@/components/appear';
import { FitArt, SHORT } from '@/components/fit';
import { FlameMedallion } from '@/components/flame-medallion';
import { LessonFinish } from '@/components/lesson-finish';
import { OwnChip, OwnField, useOwn } from '@/components/own';
import { FREE_CARDS, usePatternCards } from '@/components/pattern-cards';
import { PatternCard } from '@/components/pattern-deck';
import { DaysRow, GoalDots, StoryBars } from '@/components/review-art';
import { Dock, SceneFrame, Stage } from '@/components/scene';
import { useLocked } from '@/components/support';
import { useQuietAsks } from '@/lib/quiet-asks';
import { Text } from '@/components/text';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useNights } from '@/lib/health';
import { close, closeAll } from '@/lib/nav';
import { setReminderPrefs, useReminderPrefs } from '@/lib/prefs';
import { allowReminders, remindersOffered } from '@/lib/reminders';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme, type Sky } from '@/lib/theme';
import { WORDS } from '@/lib/words';

/* the graphs a week is walked through, in this order (the feelings cards stay on Pattern: the week rarely has them) */
const ORDER = ['ride', 'learn', 'nights', 'when', 'held', 'what', 'helps', 'days', 'apart'];
const MAX_GRAPHS = 3;
/* what each graph means for next week, in one line under it */
const BRIDGE: Record<string, string> = {
  ride: 'Every urge ridden out is the skill growing. Your goal protects it.',
  nights: 'Nights shape the days after them. A goal can start here.',
  when: 'Your hard hours are where one plan does the most.',
  what: 'Knowing what sets it off means you can plan for it.',
  helps: 'These worked for you. SOS offers them first.',
  held: 'Each hard hour held is proof the plan works.',
  learn: 'Each lesson turns one belief over. Days with one are steadier.',
  days: 'Small things the day before change the hard days.',
  apart: 'The long view. One goal next week moves it.',
};
const SKY: Record<string, Sky> = { intro: 'violet', says: 'sun', last: 'sun', pick: 'violet', set: 'sun' };
const UNIT_ONE = { nights: 'night', days: 'day' } as const;

type Page = string; // 'intro' | 'g:<card id>' | 'says' | 'last' | 'pick' | 'set'

export default function Review() {
  const c = useTheme();
  const win = useWindowDimensions();
  const { snap, tk, update, say } = useStore();
  const prefs = useReminderPrefs();
  const params = useLocalSearchParams<{ s?: string }>();
  const st = snap.settings;
  const health = useNights();
  /* which week: the one asked for, the one Today is asking about, or this one so far */
  const [sun] = useState(() => {
    const s = params.s;
    if (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && isSunday(s) && s <= sunOf(tk)) return s;
    return (st && sunDue(snap.reviews, st, tk)?.sun) || sunOf(tk);
  });
  const saved = snap.reviews[sunKey(sun)]?.sun || null;
  const [goal, setGoal] = useState<SunGoal | null>(() => saved?.g || null);
  const [last, setLast] = useState<SunLast | undefined>(() => saved?.last);
  const [ownOpen, setOwnOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isLocked = useLocked('stats');
  const quiet = useQuietAsks();
  const [remind, setRemind] = useState(true);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [done, setDone] = useState(false);
  const [gain, setGain] = useState(0);
  const { cards } = usePatternCards('7', sun);
  const S = useMemo(
    () => (st ? story(snap.days, st, snap.reviews, sun, tk, Date.now(), gameCompute(snap.days, st, snap.reviews, tk).perDay, health.nights) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snap.days, st, sun, tk, health.nights],
  );
  const options = useMemo<SunOption[]>(() => (S && st ? sunOptions(S.w, st, S.last, prefs.checkinAt) : []), [S, st, prefs.checkinAt]);
  const more = useMemo<SunOption[]>(() => (S && st ? sunMore(S.w, st, options, prefs.checkinAt) : []), [S, st, options, prefs.checkinAt]);
  /* the goals the person wrote before, kept for good, offered after Daybook's */
  const own = useOwn(
    'goal',
    options.concat(more).map((o) => o.g.t),
    goal && !goal.k ? [goal.t] : [],
  );
  if (!st || !S) return null;
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);

  /* the week's graphs: the Pattern cards that have something this week, and at most one the free side keeps locked */
  const shut = (id: string) => isLocked && !FREE_CARDS.includes(id);
  const graphs: typeof cards = [];
  for (const id of ORDER) {
    const d = cards.find((x) => x.id === id && !x.ghost && !x.bare);
    if (!d || graphs.length >= MAX_GRAPHS) continue;
    if (shut(id) && graphs.some((g) => shut(g.id))) continue;
    graphs.push(d);
  }
  const says = sunSays(S.w, S.when.hard.weekdays?.label || S.when.hard.weekends?.label || null);
  const pages: Page[] = ['intro', ...graphs.map((g) => 'g:' + g.id), 'says'];
  if (S.last) pages.push('last');
  pages.push('pick', 'set');
  const page = pages[Math.min(i, pages.length - 1)];
  const over = tk > sun;
  const go = (to: number) => {
    buzz('tap');
    setDir(to > i ? 1 : -1);
    setOwnOpen(false);
    setMoreOpen(false);
    setI(Math.max(0, Math.min(pages.length - 1, to)));
  };
  const next = () => go(i + 1);
  const all = options.concat(more);
  const same = (o: SunOption, g: SunGoal) => (g.k ? o.g.k === g.k : o.g.t === g.t);
  /* the plan that comes with the goal (one in the person's own words has none) */
  const plan = goal ? all.find((o) => same(o, goal))?.plan || null : null;
  const remindLine = goal?.k ? sunRemindLine(goal.k, st, prefs.checkinAt) : null;
  const remindKey = goal?.k ? SUN_HOW[goal.k].remind : null;
  const remindOn = !!remindKey && !!prefs[remindKey];

  const save = async () => {
    update((s0) => ({
      ...s0,
      reviews: saveSun(s0.reviews, sun, {
        ...(saved || {}),
        w: saved?.w || [],
        c: saved?.c || [],
        g: goal,
        ...(last ? { last } : {}),
        ...(plan ? { it: plan } : {}),
      }),
    }));
    /* the review's points come once (core gameCompute) */
    setGain(saved ? 0 : 20);
    if (remindKey && remind && !remindOn && remindersOffered) {
      const ok = await allowReminders();
      if (ok) setReminderPrefs({ ...prefs, [remindKey]: true });
      else say(WORDS.notifyOff);
    }
    buzz('lit');
    play('chime');
    setDone(true);
  };

  /* the finish: dawn, its own celebration on the lesson finish's engine, the goal's nights lighting, and the Sundays line to the next four */
  if (done) {
    const n = sunList(snap.reviews).length;
    const to = Math.ceil(Math.max(1, n) / 4) * 4;
    return (
      <View style={StyleSheet.absoluteFill}>
        <LessonFinish
          lessonId=""
          title={goal ? goal.t : 'Your week is saved'}
          n={n}
          gain={gain}
          again={!!saved}
          stats={{ cards: 0, combo: 0, secs: 0 }}
          keep={
            plan
              ? storyIfLine(plan)
              : goal
                ? 'It waits on Today all week. I will be right there with you.'
                : 'A week looked back on, honestly. See you on Today.'
          }
          next={null}
          onNext={closeAll}
          onDone={closeAll}
          head="Your week is set"
          line={{ label: n === 1 ? '1 Sunday' : n + ' Sundays', right: to === 4 ? 'a month of them' : to + ' Sundays', from: (n - 1) / to, to: n / to }}
          button="Done"
          feedback={false}
          look="dawn"
          marks={goal?.n || 0}
        />
      </View>
    );
  }

  const eyebrow = (t: string) => (
    <T v="small" tone="muted" style={s.c}>
      {t}
    </T>
  );
  let body: React.ReactNode = null;

  if (page === 'intro') {
    /* ---------- the week in seven days and three numbers ---------- */
    const nums: [number, string, string][] = [
      [S.w.noSlip, S.w.noSlip === 1 ? 'day with no slip' : 'days with no slip', c.sunText],
      [S.w.rode, S.w.rode === 1 ? 'urge ridden out' : 'urges ridden out', c.mintText],
      [S.w.lessons, S.w.lessons === 1 ? 'day with a lesson' : 'days with a lesson', c.violetText],
    ];
    body = (
      <>
        {eyebrow(sunRange(sun) + (over ? '' : tk < sun ? ' · so far' : ''))}
        <Text style={[s.h1, { color: c.ink }]} accessibilityRole="header">
          Your week
        </Text>
        <View style={s.zone}>
          <FitArt>
            <Appear delay={150} by={10}>
              <FlameMedallion level={level} size={SHORT ? 130 : 170} />
            </Appear>
          </FitArt>
          <DaysRow days={S.days} />
          <View style={s.nums}>
            {nums.map(([v, l, col], j) => (
              <Appear key={l} delay={500 + j * 160} by={8} style={s.num}>
                <Text style={[s.numV, { color: col }]}>{v}</Text>
                <T v="small" tone="muted" style={s.c}>
                  {l}
                </T>
              </Appear>
            ))}
          </View>
          <Appear delay={1000} style={{ alignSelf: 'stretch', gap: 4 }}>
            <T style={[s.c, s.lead, { fontFamily: font.bodySemi }]}>{S.read.says}</T>
            <T tone="muted" style={[s.c, s.lead]}>
              {S.read.held}
            </T>
          </Appear>
        </View>
        <Dock>
          {/* the two halves, so the person knows what is coming and how long */}
          <View style={s.map} accessible accessibilityLabel={'First, ' + (graphs.length + 1) + ' pages on your week. Then one goal for next week.'}>
            <MapStep icon="chart" text={graphs.length ? 'Your graphs' : 'Your week'} on />
            <Icon name="next" size={14} color={c.muted} />
            <MapStep icon="flag" text="One goal for next week" />
          </View>
          <Button label="Start" onPress={next} />
        </Dock>
      </>
    );
  } else if (page.startsWith('g:')) {
    /* ---------- one of the week's graphs, as Pattern shows it ---------- */
    const id = page.slice(2);
    const card = graphs.find((g) => g.id === id)!;
    const k = graphs.findIndex((g) => g.id === id);
    body = (
      <>
        {eyebrow('Your graphs · ' + (k + 1) + ' of ' + graphs.length)}
        <View style={s.cardZone}>
          <PatternCard d={card} shut={shut(id)} quiet={quiet} H={Math.max(SHORT ? 300 : 360, win.height - (SHORT ? 300 : 340))} />
        </View>
        <Dock>
          <Appear delay={500} by={6}>
            <View style={s.bridge}>
              <Icon name="flag" size={18} color={c.sunText} />
              <T style={{ flex: 1, fontFamily: font.bodySemi }}>{BRIDGE[id] || 'This is yours, from your own log.'}</T>
            </View>
          </Appear>
          <Button label="Next" onPress={next} />
        </Dock>
      </>
    );
  } else if (page === 'says') {
    /* ---------- what the week says, in three plain lines ---------- */
    body = (
      <>
        {eyebrow('Your week, in plain words')}
        <T v="title" style={s.c} accessibilityRole="header">
          What your week says
        </T>
        <View style={s.zone}>
          <FitArt>
            <FlameMedallion level={level} size={SHORT ? 110 : 150} />
          </FitArt>
        </View>
        <Dock>
          <View style={{ alignSelf: 'stretch', gap: 14 }}>
            {says.map((x, j) => (
              <Appear key={x.t} delay={250 + j * 350} by={8} style={s.say}>
                <Icon name={x.ic} size={24} color={c.accentText} />
                <T style={{ flex: 1, fontFamily: font.bodySemi }}>{x.t}</T>
              </Appear>
            ))}
          </View>
          <Button label="Next" onPress={next} />
        </Dock>
      </>
    );
  } else if (page === 'last' && S.last) {
    /* ---------- last week's goal ---------- */
    const L = S.last;
    body = (
      <>
        {eyebrow('Last week’s goal')}
        <T v="title" style={s.c} accessibilityRole="header">
          {L.g.t}
        </T>
        <View style={s.zone}>
          {L.done != null && L.g.n ? (
            <>
              <GoalDots n={L.g.n} done={L.done} />
              <Appear delay={300 + L.g.n * 160}>
                <T style={[s.c, s.lead, { fontFamily: font.bodySemi, color: L.met ? c.mintText : c.ink }]}>{sunGoalLine(L.g, L.done, over || tk >= sun)}</T>
              </Appear>
            </>
          ) : (
            <Icon name="flag" size={56} color={c.sunText} />
          )}
        </View>
        <Dock>
          {L.done == null ? (
            <View style={{ gap: 8, alignItems: 'center' }}>
              <T tone="muted">How did it go?</T>
              <View style={s.row}>
                {SUN_LAST.map(([k, l]) => (
                  <Chip key={k} label={l} on={last === k} onPress={() => setLast(last === k ? undefined : k)} />
                ))}
              </View>
              {last ? <T style={s.c}>{SUN_LAST.find((x) => x[0] === last)![2]}</T> : null}
            </View>
          ) : null}
          <Button label="Next" onPress={next} />
        </Dock>
      </>
    );
  } else if (page === 'pick') {
    /* ---------- one goal: why, and the plan it comes with ---------- */
    const ownGoals = own.choices.filter((t) => !all.some((o) => o.g.t === t));
    const picked = goal ? more.find((o) => same(o, goal)) : null;
    body = ownOpen ? (
      <>
        {eyebrow('Your own goal')}
        <OwnField
          kind="goal"
          builtIn={all.map((o) => o.g.t)}
          placeholder="Like: a walk after dinner"
          max={80}
          onSave={(t) => {
            setGoal(sunOwnGoal(t));
            setOwnOpen(false);
          }}
          onCancel={() => setOwnOpen(false)}
        />
      </>
    ) : (
      <>
        {eyebrow('Next week')}
        <T v="title" style={s.c} accessibilityRole="header">
          Pick one goal
        </T>
        {/* one, on purpose (Dalton and Spiller 2012): said plainly, so it never surprises */}
        <T tone="muted" style={[s.c, s.lead]}>
          Just one. One goal gets kept far more often than three.
        </T>
        {moreOpen || goal ? null : (
          <FitArt>
            <FlameMedallion level={level} size={SHORT ? 80 : 110} />
          </FitArt>
        )}
        <Dock>
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            {options.map((o) => {
              const on = !!goal && same(o, goal);
              return <GoalCard key={o.id} o={o} on={on} onPress={() => setGoal(on ? null : o.g)} />;
            })}
          </View>
          {moreOpen ? (
            <>
              <ChipWrap>
                {more.map((o) => {
                  const on = !!goal && same(o, goal);
                  return <AnswerChip key={o.id} label={o.g.t} tone="sun" on={on} onPress={() => setGoal(on ? null : o.g)} />;
                })}
              </ChipWrap>
              {picked ? (
                <T v="small" tone="muted" style={s.c}>
                  {picked.why}
                </T>
              ) : null}
            </>
          ) : null}
          <ChipWrap last={1}>
            {moreOpen ? null : <AnswerChip label="More goals" tone="sun" on={false} onPress={() => setMoreOpen(true)} />}
            {ownGoals.map((t) => (
              <AnswerChip
                key={t}
                label={t}
                tone="sun"
                on={!!goal && !goal.k && goal.t === t}
                onPress={() => setGoal(goal && !goal.k && goal.t === t ? null : sunOwnGoal(t))}
              />
            ))}
            <OwnChip onPress={() => setOwnOpen(true)} />
          </ChipWrap>
          <Button label="Next" disabled={!goal} onPress={next} />
        </Dock>
      </>
    );
  } else if (page === 'set' && goal) {
    /* ---------- the goal set: how many, and what happens ---------- */
    const kind = goal.k ? SUN_GOALS[goal.k] : null;
    const gn = goal.n || 1;
    const name = goal.k ? (goal.k === 'lesson' && gn === 7 ? 'A lesson every day' : SUN_GOALS[goal.k].t(st)) : goal.t;
    body = (
      <>
        {eyebrow('Your goal for next week')}
        <T v="title" style={s.c} accessibilityRole="header">
          {name}
        </T>
        {kind && goal.k ? (
          <View style={s.stepRow} accessibilityLabel={gn + ' ' + kind.unit}>
            <Step label="One less" sign="−" off={gn <= 1} onPress={() => setGoal(sunGoalNamed(goal.k!, st, gn - 1))} />
            <View style={{ alignItems: 'center', minWidth: 96 }}>
              <Text style={[s.stepN, { color: c.ink }]}>{gn}</Text>
              <T v="small" tone="muted">
                {gn === 1 ? UNIT_ONE[kind.unit] : kind.unit}
              </T>
            </View>
            <Step label="One more" sign="+" off={gn >= 7} onPress={() => setGoal(sunGoalNamed(goal.k!, st, gn + 1))} />
          </View>
        ) : (
          <FitArt>
            <FlameMedallion level={level} size={SHORT ? 110 : 150} />
          </FitArt>
        )}
        {kind ? <GoalDots key={gn} n={gn} done={0} /> : null}
        <Dock>
          {/* what happens, said plainly: every row is a thing that will really change */}
          <View style={{ alignSelf: 'stretch' }}>
            <Happens
              icon="sun"
              title="On Today, from Monday"
              text={kind ? '0 of ' + gn + ' ' + kind.unit + ' this week, filling in as you go' : '“This week: ' + goal.t + '”, under your next step'}
            />
            {goal.k ? (
              <Happens icon="check" title="What counts it" text={SUN_HOW[goal.k].count} />
            ) : (
              <Happens icon="check" title="Next Sunday" text="Daybook asks how it went." />
            )}
            {plan ? <Happens icon="compass" title="Your plan, in Pattern all week" text={storyIfLine(plan)} /> : null}
            {remindLine && remindersOffered ? (
              <Happens
                icon="timer"
                title={remindOn ? 'Your reminder is on' : 'Remind me'}
                text={remindLine}
                toggle={remindOn ? undefined : { on: remind, set: setRemind }}
              />
            ) : null}
          </View>
          <Button label={saved ? 'Save my week' : 'Save my week · +20'} onPress={save} />
        </Dock>
      </>
    );
  }

  const sky: Sky = page.startsWith('g:') ? 'violet' : SKY[page] || 'violet';
  return (
    <SceneFrame title="Sunday review" sky={sky} onBack={i > 0 ? () => go(i - 1) : null} onClose={close}>
      <StoryBars n={pages.length} i={i} />
      <Stage key={page + (ownOpen ? ':own' : '')} dir={dir}>
        {body}
      </Stage>
    </SceneFrame>
  );
}

/* one of the two halves on the first page */
function MapStep({ icon, text, on }: { icon: string; text: string; on?: boolean }) {
  const c = useTheme();
  return (
    <View style={s.mapStep}>
      <Icon name={icon} size={16} color={on ? c.accentText : c.muted} />
      <T v="small" style={{ fontFamily: font.bodySemi, color: on ? c.ink : c.muted }}>
        {text}
      </T>
    </View>
  );
}

/* a goal to pick: the goal, why (from the week), and the plan it comes with */
function GoalCard({ o, on, onPress }: { o: SunOption; on: boolean; onPress: () => void }) {
  const c = useTheme();
  const t = toneOf(c, 'sun');
  const ink = on ? t.ink : c.ink;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={o.g.t + '. ' + o.why + ' Plan: ' + storyIfLine(o.plan)}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.goal, { backgroundColor: on ? t.ic : c.surface, shadowColor: c.lip, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
      <View style={s.goalHead}>
        <Text style={[s.goalT, { color: ink }]}>{o.g.t}</Text>
        <Icon name={on ? 'check' : 'flag'} size={18} color={on ? t.ink : c.sunText} />
      </View>
      <Text style={[s.goalPlan, { color: on ? t.ink : c.muted }]}>{storyIfLine(o.plan)}</Text>
      {/* why, from the week, once it is the one picked */}
      {on ? <Text style={[s.goalWhy, { color: t.ink }]}>{o.why}</Text> : null}
    </Pressable>
  );
}

/* one thing that will happen, in a plain row: an icon at its own size, a small title, the words, and a switch when it is a choice */
function Happens({ icon, title, text, toggle }: { icon: string; title: string; text: string; toggle?: { on: boolean; set: (v: boolean) => void } }) {
  const c = useTheme();
  const row = (
    <View style={[s.happen, { borderBottomColor: c.line }]}>
      <Icon name={icon} size={20} color={c.accentText} />
      <View style={{ flex: 1 }}>
        <T v="small" tone="muted">
          {title}
        </T>
        <T style={{ fontFamily: font.bodySemi }}>{text}</T>
      </View>
      {toggle ? <Icon name={toggle.on ? 'check' : 'plus'} size={20} color={toggle.on ? c.mintText : c.muted} /> : null}
    </View>
  );
  if (!toggle) return row;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: toggle.on }}
      onPress={() => {
        buzz('tap');
        toggle.set(!toggle.on);
      }}>
      {row}
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
      style={[s.step, { backgroundColor: c.surface, opacity: off ? 0.4 : 1 }]}>
      <Text style={[s.stepT, { color: c.ink }]}>{sign}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  lead: { maxWidth: 380, alignSelf: 'center' },
  zone: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 8 },
  cardZone: { flexGrow: 1, alignSelf: 'stretch' },
  h1: { fontFamily: font.displayBold, fontSize: 38, lineHeight: 44, textAlign: 'center' },
  nums: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around', gap: 8 },
  num: { flex: 1, alignItems: 'center', gap: 2 },
  numV: { fontFamily: font.display, fontSize: 38, lineHeight: 44 },
  map: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  mapStep: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bridge: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', paddingHorizontal: 4 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  goal: {
    padding: 14,
    borderRadius: 20,
    gap: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  goalHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goalT: { flex: 1, fontFamily: font.display, fontSize: 17, lineHeight: 22 },
  goalWhy: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  goalPlan: { fontFamily: font.body, fontSize: 15, lineHeight: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, flexGrow: 1 },
  stepN: { fontFamily: font.display, fontSize: 64, lineHeight: 72 },
  step: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  stepT: { fontFamily: font.bodyBold, fontSize: 22, lineHeight: 24 },
  say: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch' },
  happen: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, borderBottomWidth: 1 },
});
