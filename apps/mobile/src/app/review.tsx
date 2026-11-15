/* The Sunday review, rebuilt from its purpose (the owner, November 15, 2026: "clear feedback on what happened the previous
   week. And then clear feedback on what goals I should have for the next week", "walk them through their graphs", and "if I
   press late nights, what does that mean I'm gonna do?"). Two halves, and every page says what it is for:

   1. Look back. The week in seven days and three numbers, then the person's own graphs for that week, one a page: the very
      same cards as the Pattern page (components/pattern-cards.tsx, read for the seven days that end on this Sunday), each with
      one line on what it means for next week. A card with nothing this week is left out. Then last week's goal, when there was one.
   2. One goal. Two or three goals from the week (core sunday-goal.ts), each with why ("3 of your 4 slips came after 9 PM") and
      the plan it comes with ("When it gets to 10:30 PM, I will put my phone in another room"). One only, on purpose, and the
      page says so. Then the goal set: how many nights, and what happens, in plain rows: where it shows (Today, under the count),
      what counts it, the plan on Today and in SOS, and the reminder it turns on.
   Saving ends on the lesson finish, the app's best moment: the band, the flame gliding home, the points into the level line,
   and the Sundays line to the next month of them, with the flame saying the plan. Worth 20 points once.
   Every "Write my own" keeps the words for good (core saved-answers.ts, the owner: "If I write an option, it should persist").
   ?s=<a Sunday> opens that week's review (to write it late, or change it). */
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
  sunGoalOf,
  sunKey,
  sunList,
  sunOf,
  sunOptions,
  sunOwnGoal,
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
import { Link } from '@/components/choices';
import { SHORT } from '@/components/fit';
import { LessonFinish } from '@/components/lesson-finish';
import { OwnChip, OwnField, useOwn } from '@/components/own';
import { usePatternCards } from '@/components/pattern-cards';
import { PatternCard } from '@/components/pattern-deck';
import { DaysRow, GoalDots, StoryBars } from '@/components/review-art';
import { Dock, SceneFrame, Stage } from '@/components/scene';
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
const ORDER = ['ride', 'nights', 'when', 'what', 'helps', 'held', 'learn', 'days', 'apart'];
const MAX_GRAPHS = 5;
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
const SKY: Record<string, Sky> = { intro: 'violet', last: 'sun', pick: 'violet', set: 'sun' };
const UNIT_ONE = { nights: 'night', days: 'day' } as const;

type Page = string; // 'intro' | 'g:<card id>' | 'last' | 'pick' | 'set'

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
  /* the goals the person wrote before, kept for good, offered after Daybook's */
  const own = useOwn(
    'goal',
    options.map((o) => o.g.t),
    goal && !goal.k ? [goal.t] : [],
  );
  if (!st || !S) return null;

  /* the week's graphs: the Pattern cards that have something this week */
  const graphs = ORDER.map((id) => cards.find((x) => x.id === id && !x.ghost && !x.bare)).filter((x) => !!x).slice(0, MAX_GRAPHS);
  const pages: Page[] = ['intro', ...graphs.map((g) => 'g:' + g!.id)];
  if (S.last) pages.push('last');
  pages.push('pick', 'set');
  const page = pages[Math.min(i, pages.length - 1)];
  const over = tk > sun;
  const go = (to: number) => {
    buzz('tap');
    setDir(to > i ? 1 : -1);
    setOwnOpen(false);
    setI(Math.max(0, Math.min(pages.length - 1, to)));
  };
  const next = () => go(i + 1);
  const opt = goal?.k ? options.find((o) => o.g.k === goal.k) : null;
  /* the plan that comes with the goal: the option's, or for a goal the log counts but no option offered, its own */
  const plan = goal?.k ? opt?.plan || null : null;
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

  /* the finish: the lesson finish, with the week's words, and the Sundays line to the next four */
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
          keep={plan ? storyIfLine(plan) : goal ? 'I will be on Today all week, counting it with you.' : 'A week looked back on, honestly. See you on Today.'}
          next={null}
          onNext={closeAll}
          onDone={closeAll}
          head="Your week is set"
          line={{ label: n === 1 ? '1 Sunday' : n + ' Sundays', right: to === 4 ? 'a month of them' : to + ' Sundays', from: (n - 1) / to, to: n / to }}
          button="Done"
          feedback={false}
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
            <MapStep icon="chart" text={graphs.length ? 'Your graphs for the week' : 'Your week'} on />
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
    const card = graphs.find((g) => g!.id === id)!;
    const k = graphs.findIndex((g) => g!.id === id);
    body = (
      <>
        {eyebrow('Your graphs · ' + (k + 1) + ' of ' + graphs.length)}
        <View style={s.cardZone}>
          <PatternCard d={card} H={Math.max(SHORT ? 300 : 360, win.height - (SHORT ? 330 : 380))} />
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
    const ownGoals = own.choices.filter((t) => !options.some((o) => o.g.t === t));
    body = ownOpen ? (
      <>
        {eyebrow('Your own goal')}
        <OwnField
          kind="goal"
          builtIn={options.map((o) => o.g.t)}
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
        <Dock>
          <View style={{ alignSelf: 'stretch', gap: 10 }}>
            {options.map((o) => (
              <GoalCard
                key={o.id}
                o={o}
                on={!!goal?.k && goal.k === o.g.k}
                onPress={() => setGoal(goal?.k === o.g.k ? null : sunGoalOf(o.g.k!, st, o.g.n))}
              />
            ))}
          </View>
          <ChipWrap last={1}>
            {ownGoals.map((t) => (
              <AnswerChip key={t} label={t} tone="sun" on={!!goal && !goal.k && goal.t === t} onPress={() => setGoal(goal && !goal.k && goal.t === t ? null : sunOwnGoal(t))} />
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
    const name = goal.k ? SUN_GOALS[goal.k].t(st) : goal.t;
    body = (
      <>
        {eyebrow('Your goal for next week')}
        <T v="title" style={s.c} accessibilityRole="header">
          {name}
        </T>
        {kind && goal.k ? (
          <View style={s.stepRow} accessibilityLabel={gn + ' ' + kind.unit}>
            <Step label="One less" sign="−" off={gn <= 1} onPress={() => setGoal(sunGoalOf(goal.k!, st, gn - 1))} />
            <View style={{ alignItems: 'center', minWidth: 96 }}>
              <Text style={[s.stepN, { color: c.ink }]}>{gn}</Text>
              <T v="small" tone="muted">
                {gn === 1 ? UNIT_ONE[kind.unit] : kind.unit}
              </T>
            </View>
            <Step label="One more" sign="+" off={gn >= 7} onPress={() => setGoal(sunGoalOf(goal.k!, st, gn + 1))} />
          </View>
        ) : null}
        <Dock>
          {/* what happens, said plainly: every row is a thing that will really change */}
          <View style={{ alignSelf: 'stretch' }}>
            <Happens
              icon="sun"
              title="On Today, under your count"
              text={kind ? '0 of ' + gn + ' ' + kind.unit + ' this week, filling in as you go' : 'In Pattern, Days, all week. Next Sunday asks how it went.'}
            />
            {goal.k ? <Happens icon="check" title="What counts it" text={SUN_HOW[goal.k].count} /> : null}
            {plan ? <Happens icon="compass" title="Your plan, on Today and in SOS" text={storyIfLine(plan)} /> : null}
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
      <Text style={[s.goalWhy, { color: on ? t.ink : c.muted }]}>{o.why}</Text>
      <Text style={[s.goalPlan, { color: ink }]}>{'Your plan: ' + storyIfLine(o.plan)}</Text>
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
  goalPlan: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, flexGrow: 1 },
  stepN: { fontFamily: font.display, fontSize: 64, lineHeight: 72 },
  step: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  stepT: { fontFamily: font.bodyBold, fontSize: 22, lineHeight: 24 },
  happen: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, borderBottomWidth: 1 },
});
