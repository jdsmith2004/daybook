/* The morning, in one page (docs/review-plan.md C3 and WP5, mockup docs/review/m1-morning-one-page.png; core morning-set.ts and
   two-moments.ts). It changes in place:

   - "How was last night?" A tap on Free of it or It happened is the answer and is kept at once (core answerNight): no Next. Before
     that, one quiet row, "And this morning?" Low, Okay, Good, kept with the answer.
   - Then the flame steps up and the reply line says what was kept ("A free night. That one is yours for good." / "Logged. Telling
     it is your part, and it is done."). Set up tonight goes on.
   - Tonight is chosen fresh each morning (the owner, November 15, 2026: "it has to be something that I specifically choose that
     day"): first when it starts, on the setup's wheels, starting on last night's time, with Next; then "What is tonight for?", every
     reason the person has and every one they wrote (core saved-answers.ts), as many as are true, with Write my own. Nothing is
     picked to start. Set tonight keeps them all (core setTonight rs), and today's lesson opens (or Today).
   - After It happened, one quiet link, "Look back on last night", opens Rekindle; never pushed, and never for a Rekindle already done.
   - When last night's slip was already logged that night, it does not ask again: it opens on "Last night is logged." and tonight.

   Nothing opens over it or straight after it (no Future-you invite, no tip, no account card, no "How are you feeling today?").
   The dawn sky runs from night violet at the top to the morning's warmth by the thumb. It holds at the largest text: the rows stack,
   and nothing breaks by the letter. The X skips it for today, which costs nothing. */
import {
  answerNight,
  careLastAt,
  answerNightBefore,
  nightBeforeAsk,
  nightBeforeDue,
  gameCompute,
  habitOf,
  igniteCount,
  igniteWhy,
  lastNightSlip,
  rkOpenFor,
  lastNightStart,
  lessonDue,
  MORNING_FEEL,
  MORNING_WORDS as W,
  morningOf,
  morningPicksStart,
  morningReasons,
  morningReply,
  morningWhenSet,
  heldByMorning,
  nightAtStart,
  nightSlips,
  setMorningFeel,
  setTonight,
  skipMorning,
  tonightLine,
  fmtClock,
  addDays,
  ownChoices,
  type Clock,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Appear } from '@/components/appear';
import { AnswerChip, ChipWrap } from '@/components/answer';
import { Link } from '@/components/choices';
import { OwnChip, OwnField } from '@/components/own';
import { ClockWheels } from '@/components/when';
import { FlameMedallion } from '@/components/flame-medallion';
import { StepUp } from '@/components/ignite';
import { Dock, Middle, SceneFrame, Stage } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { endLiveNight } from '@/lib/flame-widget';
import { buzz } from '@/lib/feel';
import { nightWaitsOn, pullTroubleLine } from '@/lib/morning';
import { close } from '@/lib/nav';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { useAccount } from '@/lib/sync';
import { font, nightInk, useTheme } from '@/lib/theme';

/* the dawn: night violet at the top, where the words are light, to the morning's warmth by the thumb */
const DAWN = {
  light: ['#33276F', '#6E4597', '#C9808C', '#FFCB94'] as const,
  dark: ['#1E1752', '#47306F', '#8A5068', '#B2715A'] as const,
};
const AT = [0, 0.38, 0.72, 1] as const;
/* the answers' own colors: they sit on the warm part of the sky in either theme */
const INK = '#2B1F57';
const OFF = 'rgba(255,255,255,0.62)';
const ON = '#FFFFFF';

/** "Good morning · Thursday" before noon; after it, only the day */
const hello = (now: number) => {
  const day = new Date(now).toLocaleDateString('en-US', { weekday: 'long' });
  return new Date(now).getHours() < 12 ? W.title + ' · ' + day : day;
};

export default function Morning() {
  const { then } = useLocalSearchParams<{ then?: string }>();
  const { snap, tk, update, say, now } = useStore();
  const sos = useSos();
  const account = useAccount();
  const c = useTheme();
  const win = useWindowDimensions();
  const st = snap.settings;
  const level = useMemo(() => (st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1), [snap, st, tk]);
  /* what the page starts on is fixed when it opens */
  const [start] = useState(() => {
    const ms = morningOf(snap.days[tk]);
    /* a slip logged that night: nothing to ask */
    const logged = !!st && !ms?.n && nightSlips(snap.days, st, addDays(tk, -1)).length > 0;
    return {
      n: ms?.n ?? (logged ? ('slip' as const) : null),
      logged,
      f: ms?.f ?? null,
      reasons: st ? morningReasons(snap.days, st, tk) : [],
      picks: morningPicksStart(snap.days, tk),
      nt: st ? nightAtStart(st) : '22:30',
      /* the night before last, when nobody told Daybook about it (WP1, core nightBeforeDue): one quiet row to catch it up */
      before: st ? nightBeforeDue(snap.days, st, tk) : null,
      n2: ms?.n2 ?? null,
    };
  });
  const [n, setN] = useState<'free' | 'slip' | null>(start.n);
  const [f, setF] = useState<1 | 2 | 3 | null>(start.f);
  const [n2, setN2] = useState<'free' | 'slip' | null>(start.n2);
  /* tonight is chosen fresh each morning (the owner, November 15, 2026: "it has to be something that I specifically choose that
     day"): first the time, starting on last night's, then what tonight is for, as many as are true, nothing picked to start */
  const [rs, setRs] = useState<string[]>(start.picks);
  const [nt, setNt] = useState<Clock>(start.nt);
  const [part, setPart] = useState<'night' | 'when' | 'why'>('night');
  const [writing, setWriting] = useState(false);
  const leaving = useRef(false);
  /* the morning is here: the night's Live Activity goes (opened from it, or from Today), and again once last night is told */
  useEffect(() => endLiveNight(tk), [tk]);

  const skip = () => {
    if (leaving.current) return;
    leaving.current = true;
    update((s0) => ({ ...s0, days: skipMorning(s0.days, tk, Date.now()) }));
    /* opened in front of a lesson: the X goes on to it */
    if (then) router.replace({ pathname: '/lesson/[id]', params: { id: then, at: 'morning' } });
    else close();
  };
  /* an ordinary free morning: the flame grows a step in place, and the count turns over under it (components/ignite.tsx StepUp) */
  const [step, setStep] = useState<{ from: string; to: string; unit: string } | null>(null);
  const [pulse, setPulse] = useState(0);
  /* a tap is the answer, kept at once. Earned as usual, and nothing is said about points here (noWin) */
  const answer = (v: 'free' | 'slip') => {
    if (!st || leaving.current) return;
    const t = Date.now();
    /* the log as it will be, to know whether this night lights the flame in full (core igniteWhy) */
    const after = answerNight(snap.days, st, tk, v, t);
    /* the count before and after, read now: the store's snapshot holds the answer once update has run */
    const c = igniteCount(after, st, tk, now, snap.days);
    /* never in the quiet hours after an SOS, a care tool or a slip: then the quick step in place (core igniteWhy near) */
    const why = igniteWhy(after, st, tk, { now: t, sos: careLastAt(sos.mem) });
    update(
      (s0) => {
        if (!s0.settings) return s0;
        let days = answerNight(s0.days, s0.settings, tk, v, t);
        days = setMorningFeel(days, tk, f, t);
        return { ...s0, days };
      },
      { noWin: true },
    );
    setN(v);
    endLiveNight(tk);
    if (v !== 'free' || n === 'free') {
      buzz('save');
      return;
    }
    /* the full lighting only when the person comes back to it, or keeps a small goal (the owner, November 13, 2026: "it should be
       when they start and come back not every day"); its button comes back here, to tonight */
    if (why) {
      router.push({ pathname: '/ignite', params: c.from ? { from: c.from } : {} });
      return;
    }
    buzz('lit');
    setStep(c.to ? c : null);
    setPulse((x) => x + 1);
  };
  /* the night before last, told with a tap and kept at once (WP1, core answerNightBefore); the same answer again changes nothing */
  const answerBefore = (v: 'free' | 'slip') => {
    if (!st || !start.before || leaving.current || n2 === v) return;
    const t = Date.now();
    update((s0) => (s0.settings ? { ...s0, days: answerNightBefore(s0.days, s0.settings, tk, v, t) } : s0), { noWin: true });
    setN2(v);
    buzz('save');
  };
  const set = () => {
    if (!st || leaving.current || !n || !rs.length) return;
    leaving.current = true;
    const t = Date.now();
    update(
      (s0) => {
        if (!s0.settings) return s0;
        /* a night logged that night is told here too, so the record holds the morning (no second slip is added) */
        const days = morningOf(s0.days[tk])?.n ? s0.days : answerNight(s0.days, s0.settings, tk, n, t);
        const out = setTonight(days, s0.settings, tk, { rs, nt }, t);
        return { ...s0, days: out.days, settings: out.st };
      },
      { noWin: true },
    );
    buzz('save');
    say(W.done);
    /* then the lesson: the one this was opened in front of, or today's next one when it is open */
    const lid = then || lessonDue(snap.days, st, tk, account);
    if (lid) router.replace({ pathname: '/lesson/[id]', params: { id: lid, at: 'morning' } });
    else close();
  };
  /* after It happened: Rekindle, one quiet tap away and never pushed, and never once it is done */
  const last = n === 'slip' ? lastNightSlip(snap.days, tk) : null;
  const rk = last && rkOpenFor(snap.days, last.k, last.id) ? last : null;

  if (!st) return null;

  const told = !!n;
  const big = Math.min(win.width - 120, win.height * (told ? 0.2 : 0.32), told ? 200 : 280);
  const dawn = <LinearGradient colors={c.scheme === 'dark' ? DAWN.dark : DAWN.light} locations={AT} style={StyleSheet.absoluteFill} pointerEvents="none" />;
  const waits = nightWaitsOn();
  /* Screen Time not working: said under tonight, with a tap to More's Screen Time page (WP2, core pullTrouble) */
  const trouble = pullTroubleLine();

  /* ---------- the time tonight starts: the setup's wheels, on last night's time; Next goes on ---------- */
  if (part === 'when') {
    const [h, m] = nt.split(':').map(Number);
    return (
      <SceneFrame title={W.setup} sky="night" backdrop={dawn} onBack={() => setPart('night')} onClose={skip}>
        <Stage key="when" dir={1}>
          <T v="title" style={s.h} accessibilityRole="header">
            {W.when}
          </T>
          <Text style={s.sub}>{morningWhenSet(fmtClock(start.nt))}</Text>
          <Middle>
            <View style={s.c} accessible accessibilityLabel={tonightLine({ waits, habit: habitOf(st) }) + ' ' + fmtClock(nt)}>
              <Text style={s.timeL}>{tonightLine({ waits, habit: habitOf(st) })}</Text>
              <Text style={s.time}>{fmtClock(nt)}</Text>
            </View>
          </Middle>
          <Dock>
            <View style={s.wheels}>
              <ClockWheels h={h} m={m} step={5} onChange={(nh, nm) => setNt((String(nh).padStart(2, '0') + ':' + String(nm).padStart(2, '0')) as Clock)} />
            </View>
            {told && trouble ? (
              <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/settings/[part]', params: { part: 'pull' } })} hitSlop={6}>
                <Text style={s.trouble}>{trouble}</Text>
              </Pressable>
            ) : null}
            <Button
              label={W.whenDone}
              kind="warm"
              onPress={() => {
                buzz('tap');
                setPart('why');
              }}
            />
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  /* ---------- what tonight is for: every reason the person has and every one they wrote, as many as are true ---------- */
  if (part === 'why') {
    const choices = ownChoices(st, 'reason', start.reasons, rs);
    const flip = (t: string) => setRs((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]));
    return (
      <SceneFrame
        title={W.setup}
        sky="night"
        backdrop={dawn}
        onBack={() => (writing ? setWriting(false) : setPart('when'))}
        onClose={writing ? () => setWriting(false) : skip}>
        <Stage key={writing ? 'write' : 'why'} dir={1}>
          <T v="title" style={s.h} accessibilityRole="header">
            {W.why}
          </T>
          {writing ? (
            <OwnField
              kind="reason"
              builtIn={start.reasons}
              placeholder="Like: my daughter"
              max={120}
              onSave={(t) => {
                setRs((l) => (l.includes(t) ? l : [...l, t]));
                setWriting(false);
              }}
              onCancel={() => setWriting(false)}
            />
          ) : (
            <>
              <Text style={s.sub}>{W.whyMany}</Text>
              <Middle>
                <View style={s.c}>
                  <FlameMedallion level={level} size={Math.min(win.width - 160, win.height * 0.2, 180)} pulse={rs.length} />
                </View>
              </Middle>
              <Dock>
                <View accessibilityRole="list" accessibilityLabel={W.why}>
                  <ChipWrap last={1}>
                    {choices.map((t) => (
                      <AnswerChip key={t} label={t} on={rs.includes(t)} onPress={() => flip(t)} />
                    ))}
                    <OwnChip color={INK} onPress={() => setWriting(true)} />
                  </ChipWrap>
                </View>
                <Button label={W.set} kind="warm" onPress={set} disabled={!rs.length} />
              </Dock>
            </>
          )}
        </Stage>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame title={hello(now)} sky="night" backdrop={dawn} onClose={skip}>
      <Stage key="morning" dir={0}>
        <T v="title" style={s.h} accessibilityRole="header">
          {W.night}
        </T>
        <Middle>
          <View style={s.c}>
            <FlameMedallion level={level} size={big} pulse={pulse} />
            {/* a free night: the flame's own bloom carries it; no confetti on an everyday moment (docs/design-standards.md) */}
            {told && step && n === 'free' ? <StepUp {...step} color={ON} /> : null}
          </View>
        </Middle>
        <Dock>
          {told ? (
            <Appear by={10} duration={280}>
              <View style={s.told}>
                {/* both answers stay in sight, the one given checked; a tap on the other changes it (the owner, November 15, 2026:
                    "how come it only give me a free of it option") */}
                {start.logged ? null : (
                  <View style={s.list} accessibilityRole="radiogroup" accessibilityLabel={W.night}>
                    <Choice label={W.free} on={n === 'free'} onPress={() => n !== 'free' && answer('free')} />
                    <Choice label={W.slip} on={n === 'slip'} onPress={() => n !== 'slip' && answer('slip')} />
                  </View>
                )}
                <Text style={s.reply} accessibilityLiveRegion="polite">
                  {morningReply(n!, start.logged, n === 'free' && heldByMorning(snap.days, tk, Date.now()) > 0)}
                </Text>
              </View>
            </Appear>
          ) : (
            <>
              <View style={s.list} accessibilityRole="radiogroup" accessibilityLabel={W.night}>
                <Choice label={W.free} on={false} onPress={() => answer('free')} />
                <Choice label={W.slip} on={false} onPress={() => answer('slip')} />
              </View>
              {/* a night before last nobody told Daybook about (mockup m1, the third page): asked in the quiet row's place */}
              {start.before ? (
                <View style={s.feel} accessibilityRole="radiogroup" accessibilityLabel={nightBeforeAsk(start.before)}>
                  <Text style={s.feelL}>{nightBeforeAsk(start.before)}</Text>
                  <View style={s.pills}>
                    <Pill label={W.free} on={n2 === 'free'} onPress={() => answerBefore('free')} />
                    <Pill label={W.slip} on={n2 === 'slip'} onPress={() => answerBefore('slip')} />
                  </View>
                </View>
              ) : null}
              {!start.before || n2 ? (
                <View style={s.feel} accessibilityRole="radiogroup" accessibilityLabel={W.feel}>
                  <Text style={s.feelL}>{W.feel}</Text>
                  <View style={s.pills}>
                    {MORNING_FEEL.map((o) => (
                      <Pill key={o.n} label={o.w} on={f === o.n} onPress={() => setF(f === o.n ? null : o.n)} />
                    ))}
                  </View>
                </View>
              ) : null}
            </>
          )}
          {told ? (
            <Button
              label={W.setup}
              kind="warm"
              onPress={() => {
                buzz('tap');
                setPart('when');
              }}
            />
          ) : null}
          {rk ? (
            <View style={s.c}>
              <Link
                label="Look back on last night"
                color={INK}
                onPress={() => router.push({ pathname: '/log', params: { date: rk.k, evId: rk.id, outcome: 'slipped', from: 'entry' } })}
              />
            </View>
          ) : null}
        </Dock>
      </Stage>
    </SceneFrame>
  );
}

/** one answer: a wide row, white when picked, with a check */
function Choice({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      accessibilityHint={on ? 'Change the answer' : undefined}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.choice, { backgroundColor: on ? ON : OFF, transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
      <Text style={[s.choiceT, on && s.choiceOn]}>{label}</Text>
      {on ? <Icon name="check" size={20} color="#5B3FD0" /> : null}
    </Pressable>
  );
}

/** a small answer in the optional row */
function Pill({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.pill, { backgroundColor: on ? ON : OFF, opacity: pressed ? 0.85 : 1 }]}>
      <Text style={[s.pillT, on && s.choiceOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  h: { color: nightInk.ink, alignSelf: 'stretch', textAlign: 'left' },
  c: { alignItems: 'center' },
  list: { gap: 12 },
  choice: { minHeight: 62, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  choiceT: { flex: 1, fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22, color: INK, opacity: 0.86 },
  choiceOn: { opacity: 1 },
  feel: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 8, minHeight: 44 },
  feelL: { flexGrow: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: INK },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { minHeight: 40, minWidth: 60, borderRadius: 20, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  pillT: { fontFamily: font.bodySemi, fontSize: 15, color: INK, opacity: 0.86 },
  told: { gap: 14 },
  reply: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 24, color: INK },
  sub: { alignSelf: 'stretch', fontFamily: font.bodyMedium, fontSize: 17, lineHeight: 24, color: nightInk.ink, opacity: 0.86, marginTop: 6 },
  timeL: { fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22, color: nightInk.ink, opacity: 0.86 },
  time: { fontFamily: font.display, fontSize: 56, lineHeight: 64, color: nightInk.ink },
  wheels: { alignSelf: 'stretch' },
  trouble: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, textAlign: 'center', paddingHorizontal: 8, color: INK },
});
