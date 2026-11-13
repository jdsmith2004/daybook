/* The morning, in one page (docs/review-plan.md C3 and WP5, mockup docs/review/m1-morning-one-page.png; core morning-set.ts and
   two-moments.ts). It changes in place:

   - "How was last night?" A tap on Free of it or It happened is the answer and is kept at once (core answerNight): no Next. Before
     that, one quiet row, "And this morning?" Low, Okay, Good, kept with the answer.
   - Then the flame steps up, the reply line says what was kept ("A free night. That one is yours for good." / "Logged. Telling it
     is your part, and it is done."), and tonight shows already filled from yesterday: the time and the reason, each one tap to change.
     Set tonight, and today's lesson opens (or Today).
   - After It happened, one quiet link, "Look back on last night", opens Rekindle; never pushed, and never for a Rekindle already done.
   - When last night's slip was already logged that night, it does not ask again: it opens on "Last night is logged." and tonight.

   Nothing opens over it or straight after it (no Future-you invite, no tip, no account card, no "How are you feeling today?").
   The dawn sky runs from night violet at the top to the morning's warmth by the thumb. It holds at the largest text: the rows stack,
   and nothing breaks by the letter. The X skips it for today, which costs nothing. */
import {
  answerNight,
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
  morningReasons,
  morningReply,
  NIGHT_TIMES,
  nightAtStart,
  nightSlips,
  setMorningFeel,
  setTonight,
  skipMorning,
  tonightLine,
  fmtClock,
  addDays,
  type Clock,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Appear } from '@/components/appear';
import { Link } from '@/components/choices';
import { FlameMedallion } from '@/components/flame-medallion';
import { StepUp } from '@/components/ignite';
import { Dock, Middle, SceneFrame, Stage } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { nightWaitsOn, pullTroubleLine } from '@/lib/morning';
import { close } from '@/lib/nav';
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
      nt: st ? nightAtStart(st) : '22:30',
      /* the night before last, when nobody told Daybook about it (WP1, core nightBeforeDue): one quiet row to catch it up */
      before: st ? nightBeforeDue(snap.days, st, tk) : null,
      n2: ms?.n2 ?? null,
    };
  });
  const [n, setN] = useState<'free' | 'slip' | null>(start.n);
  const [f, setF] = useState<1 | 2 | 3 | null>(start.f);
  const [n2, setN2] = useState<'free' | 'slip' | null>(start.n2);
  const [r, setR] = useState<string>(start.reasons[0] || '');
  const [nt, setNt] = useState<Clock>(start.nt);
  /* tonight's reason opens in place; the time has its own page, under the night sky */
  const [pickR, setPickR] = useState(false);
  const [when, setWhen] = useState(false);
  const leaving = useRef(false);

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
    if (v !== 'free' || n === 'free') {
      buzz('save');
      return;
    }
    /* the full lighting only when the person comes back to it, or keeps a small goal (the owner, November 13, 2026: "it should be
       when they start and come back not every day"); its button comes back here, to tonight */
    const c = igniteCount(after, st, tk, now);
    if (igniteWhy(after, st, tk)) {
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
    if (!st || leaving.current || !n) return;
    leaving.current = true;
    const t = Date.now();
    update(
      (s0) => {
        if (!s0.settings) return s0;
        /* a night logged that night is told here too, so the record holds the morning (no second slip is added) */
        const days = morningOf(s0.days[tk])?.n ? s0.days : answerNight(s0.days, s0.settings, tk, n, t);
        const out = setTonight(days, s0.settings, tk, { r, nt }, t);
        return { ...s0, days: out.days, settings: out.st };
      },
      { noWin: true },
    );
    buzz('lit');
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

  if (when) {
    const i = Math.max(0, NIGHT_TIMES.indexOf(nt));
    return (
      <SceneFrame title={W.setup} sky="night" onBack={() => setWhen(false)} onClose={() => setWhen(false)}>
        <Stage key="when" dir={1}>
          <T v="title" style={s.h} accessibilityRole="header">
            {W.when}
          </T>
          <Middle>
            <SliderValue big value={i} show={(v) => fmtClock(NIGHT_TIMES[v]).replace(/ [AP]M$/, '')} caption={fmtClock(nt).slice(-2)} hint="" />
          </Middle>
          <Dock>
            <Slider
              label={W.when}
              value={i}
              min={0}
              max={NIGHT_TIMES.length - 1}
              show={(v) => fmtClock(NIGHT_TIMES[v])}
              readout={false}
              onChange={(v) => setNt(NIGHT_TIMES[v])}
            />
            <Button label={W.whenDone} kind="warm" onPress={() => setWhen(false)} />
          </Dock>
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
            {told && step && n === 'free' ? <StepUp {...step} color={ON} /> : null}
          </View>
        </Middle>
        <Dock>
          {told ? (
            <Appear by={10} duration={280}>
              <View style={s.told}>
                {start.logged ? null : <Choice label={n === 'free' ? W.free : W.slip} on onPress={() => setN(null)} />}
                <Text style={s.reply} accessibilityLiveRegion="polite">
                  {morningReply(n!, start.logged)}
                </Text>
                <View style={s.card}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={tonightLine({ waits, habit: habitOf(st) }) + ' ' + fmtClock(nt) + '. Change'}
                    onPress={() => {
                      buzz('tap');
                      setWhen(true);
                    }}
                    style={({ pressed }) => [s.row, pressed && s.pressed]}>
                    <View style={s.rowWords}>
                      <Text style={s.rowL}>Tonight</Text>
                      <Text style={s.rowV}>{tonightLine({ waits, habit: habitOf(st) }) + ' ' + fmtClock(nt)}</Text>
                    </View>
                    <Icon name="next" size={16} color={nightInk.ink} />
                  </Pressable>
                  <View style={s.rule} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: pickR }}
                    accessibilityLabel={'For ' + r + '. Change'}
                    onPress={() => {
                      buzz('tap');
                      setPickR((x) => !x);
                    }}
                    style={({ pressed }) => [s.row, pressed && s.pressed]}>
                    <View style={s.rowWords}>
                      <Text style={s.rowL}>For</Text>
                      <Text style={s.rowV}>{r}</Text>
                    </View>
                    <Icon name={pickR ? 'up' : 'next'} size={16} color={nightInk.ink} />
                  </Pressable>
                  {pickR ? (
                    <View style={s.picks} accessibilityRole="radiogroup" accessibilityLabel={W.why}>
                      {start.reasons
                        .filter((t) => t !== r)
                        .map((t) => (
                          <Pressable
                            key={t}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: false }}
                            onPress={() => {
                              buzz('tap');
                              setR(t);
                              setPickR(false);
                            }}
                            style={({ pressed }) => [s.pick, pressed && s.pressed]}>
                            <Text style={s.rowV}>{t}</Text>
                          </Pressable>
                        ))}
                    </View>
                  ) : null}
                </View>
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
          {told && trouble ? (
            <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/settings/[part]', params: { part: 'pull' } })} hitSlop={6}>
              <Text style={s.trouble}>{trouble}</Text>
            </Pressable>
          ) : null}
          {told ? <Button label={W.set} kind="warm" onPress={set} disabled={!r} /> : null}
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

/** one answer: a wide row, white when picked, with a check. A tap on the picked one opens the choice again. */
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
  card: { borderRadius: 20, backgroundColor: 'rgba(43,31,87,0.42)', paddingHorizontal: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 64, paddingVertical: 10 },
  rowWords: { flex: 1, gap: 2 },
  rowL: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18, color: nightInk.ink, opacity: 0.78 },
  rowV: { fontFamily: font.bodyBold, fontSize: 15, lineHeight: 20, color: nightInk.ink },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.3)' },
  picks: { gap: 4, paddingBottom: 10 },
  pick: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)' },
  pressed: { opacity: 0.8 },
  trouble: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, textAlign: 'center', paddingHorizontal: 8, color: INK },
});
