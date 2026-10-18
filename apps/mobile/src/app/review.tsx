/* The Sunday review (core: sunday.ts): one screen to look back on the week and ahead to the next. The week in one look sits
   at the top: the days with no slip shown big, a few facts, and how last week's goal went. Lower down, where the thumb
   is, three short answers, each mostly taps on what Daybook saw in the log: what worked, what to change, and one small
   goal for the week. The person's own words are always one tap away. Saving it is worth 20 points, once, and the goal
   waits on Today all week. ?s=<a Sunday> opens that week's review (to write it late, or change it). */
import {
  gameCompute,
  isSunday,
  saveSun,
  SUN_GOALS,
  SUN_LAST,
  SUN_LEN,
  sunChange,
  sunDue,
  sunGoalOf,
  sunGoalLine,
  sunGoals,
  sunKey,
  sunLastGoal,
  sunOf,
  sunRange,
  sunWeek,
  sunWorked,
  type SunGoal,
  type SunLast,
  type SunPick,
} from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AnswerChip, ChipWrap } from '@/components/answer';
import { Appear } from '@/components/appear';
import { CountUp } from '@/components/count-up';
import { OwnChip, OwnField } from '@/components/own';
import { Dock, Finish, SceneFrame } from '@/components/scene';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { setReminderPrefs, useReminderPrefs } from '@/lib/prefs';
import { allowReminders, remindersOffered } from '@/lib/reminders';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme } from '@/lib/theme';

type Own = 'w' | 'c' | 'g' | null;

export default function Review() {
  const c = useTheme();
  const { snap, tk, update, say } = useStore();
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
  const [done, setDone] = useState(false);
  const [pts0] = useState(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).pts : 0));
  if (!st) return null;

  const week = sunWeek(snap.days, st, sun, tk);
  const worked = sunWorked(week, st);
  const change = sunChange(week, st);
  const changeIds = change.filter((x) => ch.indexOf(x.t) >= 0).map((x) => x.id);
  const goals = sunGoals(changeIds.length ? changeIds : change.slice(0, 1).map((x) => x.id), st);
  const lastGoal = sunLastGoal(snap.days, snap.reviews, sun, tk);
  const over = tk > sun;
  const toggle = (list: string[], t: string) => (list.indexOf(t) >= 0 ? list.filter((x) => x !== t) : list.concat(t).slice(-6));
  const any = w.length + ch.length > 0 || !!goal;

  const save = () => {
    update((s0) => ({ ...s0, reviews: saveSun(s0.reviews, sun, { w, c: ch, g: goal, ...(last ? { last } : {}) }) }));
    buzz('lit');
    play('chime');
    setDone(true);
  };

  /* ---------- saved ---------- */
  if (done) {
    const gain = Math.max(0, gameCompute(snap.days, st, snap.reviews, tk).pts - pts0);
    return (
      <SceneFrame title="Sunday review" sky="sun" onClose={close}>
        <Appear by={8} style={s.stage}>
          <Finish
            level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)}
            title="Week looked back on."
            text={goal ? 'One small goal for the week. It waits on Today.' : 'Seeing your week clearly is how the next one gets easier.'}
          />
          {goal ? (
            <Appear delay={380} style={[s.goalCard, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <T v="eyebrow" tone="muted">
                This week’s goal
              </T>
              <Text style={[s.goalT, { color: c.ink }]}>{goal.t}</Text>
            </Appear>
          ) : null}
          {gain ? <CountUp to={gain} prefix="+" suffix=" points" delay={650} style={[s.pts, { color: c.mintText }]} /> : null}
          <Dock>
            <Button label="Done" onPress={close} />
          </Dock>
        </Appear>
      </SceneFrame>
    );
  }

  /* ---------- an answer in the person's own words ---------- */
  const ownBox =
    own === 'w' ? (
      <OwnField placeholder="Like: going for a run after work" max={SUN_LEN} onSave={(t) => (setW(toggle(w, t)), setOwn(null))} onCancel={() => setOwn(null)} />
    ) : own === 'c' ? (
      <OwnField placeholder="Like: Sunday evenings" max={SUN_LEN} onSave={(t) => (setCh(toggle(ch, t)), setOwn(null))} onCancel={() => setOwn(null)} />
    ) : own === 'g' ? (
      <OwnField placeholder="Like: a walk after dinner" max={80} onSave={(t) => (setGoal({ t }), setOwn(null))} onCancel={() => setOwn(null)} />
    ) : null;

  /* the person's own lines show next to Daybook's, picked */
  const ownLines = (list: string[], picks: SunPick[]) => list.filter((t) => !picks.some((p) => p.t === t));
  const goalKind = goal?.k ? SUN_GOALS[goal.k] : null;

  return (
    <SceneFrame title="Sunday review" sky="sun" onClose={close}>
      <T v="eyebrow" tone="muted" style={s.c}>
        {sunRange(sun)}
        {over ? ' · last week' : tk < sun ? ' · so far' : ''}
      </T>
      <T v="title" style={s.c} accessibilityRole="header">
        Your week, in one look
      </T>
      {own ? (
        ownBox
      ) : (
        <>
          <Glance week={week} />
          {lastGoal ? (
            <View style={[s.last, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <View style={s.lastHead}>
                <Icon name={lastGoal.met ? 'check' : 'flag'} size={18} color={lastGoal.met ? c.mintText : c.accentText} />
                <T v="small" tone="muted" style={{ flex: 1 }}>
                  Last week’s goal: <Text style={{ fontFamily: font.bodyBold, color: c.ink }}>{lastGoal.g.t}</Text>
                </T>
              </View>
              {lastGoal.done != null ? (
                <T style={{ fontFamily: font.bodySemi }}>{sunGoalLine(lastGoal.g, lastGoal.done, true)}</T>
              ) : (
                <>
                  <View style={s.row}>
                    {SUN_LAST.map(([k, l]) => (
                      <Chip key={k} label={l} on={last === k} onPress={() => setLast(last === k ? undefined : k)} />
                    ))}
                  </View>
                  {last ? <T v="small">{SUN_LAST.find((x) => x[0] === last)![2]}</T> : null}
                </>
              )}
            </View>
          ) : null}
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
            <Part icon="flag" tone="sun" title="One small goal this week">
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
            </Part>
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
            {any ? (
              <Appear by={10} duration={220}>
                <Button label={saved ? 'Save changes' : 'Save my week · +20'} onPress={save} />
              </Appear>
            ) : (
              <View style={s.btnSpace} />
            )}
          </Dock>
        </>
      )}
    </SceneFrame>
  );
}

/* the week in one look: the best true number, big, and a few facts under it */
function Glance({ week }: { week: ReturnType<typeof sunWeek> }) {
  const c = useTheme();
  const big =
    week.noSlip > 0
      ? { n: week.noSlip + ' of ' + week.days, s: week.noSlip === 1 ? 'day with no slip' : 'days with no slip' }
      : week.rode > 0
        ? { n: String(week.rode), s: week.rode === 1 ? 'urge ridden out' : 'urges ridden out' }
        : { n: String(week.checkins), s: week.checkins === 1 ? 'check-in' : 'check-ins' };
  const facts = [
    week.noSlip > 0 && week.rode ? week.rode + (week.rode === 1 ? ' urge' : ' urges') + ' ridden out' : '',
    week.slipped ? week.slipped + (week.slipped === 1 ? ' slip' : ' slips') + ', logged honestly' : '',
    week.checkins && big.s.indexOf('check-in') < 0 ? week.checkins + (week.checkins === 1 ? ' check-in' : ' check-ins') : '',
  ].filter(Boolean);
  return (
    <View style={s.glance} accessible accessibilityLabel={big.n + ' ' + big.s + '. ' + facts.join('. ')}>
      <Text style={[s.bigN, { color: c.ink }]}>{big.n}</Text>
      <T tone="muted">{big.s}</T>
      {facts.length ? (
        <View style={s.facts}>
          {facts.map((f) => (
            <View key={f} style={[s.fact, { backgroundColor: c.surface }]}>
              <T v="small">{f}</T>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/* one of the three answers: its title, and its choices */
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
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  glance: { alignItems: 'center', gap: 2, paddingVertical: 6 },
  bigN: { fontFamily: font.displayBold, fontSize: 52, lineHeight: 60 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 },
  fact: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  last: { alignSelf: 'stretch', gap: 8, padding: 12, borderRadius: 18, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  lastHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  btnSpace: { height: 52 },
  goalCard: { alignSelf: 'stretch', gap: 6, padding: 16, borderRadius: 20, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  goalT: { fontFamily: font.display, fontSize: 20, lineHeight: 27 },
  pts: { fontFamily: font.display, fontSize: 18, textAlign: 'center' },
});
