/* The parts of a lesson that any flame-led flow can use: the frame (the sky, the top line, the one flame behind the words, the main button
   low), the progress line, a quiet link, and a question the flame answers. Moved here from the lesson player so setup is built from the
   same parts (docs/design-standards.md, "A lesson"). */
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useState, type ReactNode, type RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent, type ScrollViewInstance, type ViewStyle } from 'react-native';

import { Appear } from '@/components/appear';
import { FitProvider, SHORT, useFitRoom } from '@/components/fit';
import { KeyboardRoom } from '@/components/keyboard';
import { Bubble, FlameSlot, FlameStage } from '@/components/lesson-flame';
import { LessonBackdrop } from '@/components/lesson-sky';
import { Dock } from '@/components/scene';
import { Text } from '@/components/text';
import { Icon, T } from '@/components/ui';
import { PAPER, PAPER_INK, PAPER_LIP, RIGHT, RIGHT_LIP, type Look } from '@/lib/lesson-look';
import { useHoldsBar } from '@/lib/nav';
import { font, PaletteOverride } from '@/lib/theme';

/** the color of quiet words low on the screen, where the sky is brightest */
export const LowInk = createContext('#FFFFFF');

/** a quiet link under the main button, for something the X does not do */
export function Quiet({ label, onPress, half }: { label: string; onPress: () => void; half?: boolean }) {
  const low = useContext(LowInk);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={4} style={({ pressed }) => [half ? s.quietHalf : s.quiet, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[s.quietT, { color: low }]}>{label}</Text>
    </Pressable>
  );
}

/** the whole screen of a lesson: its sky or card behind everything, the top line, the words over the one flame, and the main button low */
export function Shell({
  look,
  level,
  flameOn,
  pulse,
  onClose,
  onBack,
  prog,
  topRight,
  inset,
  scroll,
  fit,
  bodyKey,
  foot,
  over,
  children,
}: {
  look: Look;
  level: number;
  flameOn: boolean;
  pulse: number;
  onClose: () => void;
  onBack?: () => void;
  prog?: ReactNode;
  /** beside the X: the SOS pill in setup */
  topRight?: ReactNode;
  inset: { top: number; bottom: number };
  scroll: RefObject<ScrollViewInstance | null>;
  fit: ReturnType<typeof useFitRoom>;
  bodyKey: string;
  foot: ReactNode;
  /** something over the whole screen, like the sources sheet (outside the padded column, so it reaches the edges) */
  over?: ReactNode;
  children: ReactNode;
}) {
  const c = look.c;
  const holdsBar = useHoldsBar();
  return (
    <PaletteOverride.Provider value={c}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {holdsBar ? <StatusBar style={look.bar} /> : null}
        <LessonBackdrop look={look} />
        <View style={{ flex: 1, paddingTop: inset.top + 8, paddingBottom: inset.bottom + 12, paddingHorizontal: 16 }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', gap: 8 }}>
            <View style={s.top}>
              {onBack ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={[s.x, { backgroundColor: c.scBtn }]}>
                  <Icon name="back" color={c.ink} />
                </Pressable>
              ) : null}
              <View style={{ flex: 1 }}>{prog}</View>
              {topRight}
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[s.x, { backgroundColor: c.scBtn }]}>
                <Icon name="x" color={c.ink} />
              </Pressable>
            </View>
            <ScrollView
              ref={scroll}
              onLayout={fit.onLayout}
              onContentSizeChange={fit.onContentSizeChange}
              style={s.card}
              contentContainerStyle={s.cardIn}
              automaticallyAdjustKeyboardInsets
              keyboardShouldPersistTaps="handled">
              <FitProvider value={fit.ctx}>
                <KeyboardRoom scroll={scroll}>
                  <FlameStage level={level} on={flameOn} pulse={pulse}>
                    <Appear key={bodyKey} by={0} style={s.cardBody}>
                      {children}
                    </Appear>
                  </FlameStage>
                </KeyboardRoom>
              </FitProvider>
            </ScrollView>
            {foot ? (
              <LowInk.Provider value={look.low}>
                <View style={s.foot}>{foot}</View>
              </LowInk.Provider>
            ) : null}
          </View>
        </View>
        {over}
      </View>
    </PaletteOverride.Provider>
  );
}

/** the progress line: one dash for each card. parts: a dash for each part instead, filled as far as `frac` within the part `i`. */
export function Prog({ total, i, all, look, label, frac }: { total: number; i: number; all?: boolean; look: Look; label?: string; frac?: number }) {
  return (
    <View
      style={s.prog}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label || (all ? 'Lesson complete' : 'Card ' + (i + 1) + ' of ' + total)}>
      {Array.from({ length: total }, (_, j) => (
        <View key={j} style={[s.progI, { backgroundColor: all || j < i || (j === i && frac == null) ? look.dashOn : look.dashOff }]}>
          {!all && j === i && frac != null ? (
            <View style={[s.progIn, { width: `${Math.round(Math.max(0.08, frac) * 100)}%`, backgroundColor: look.dashOn }]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** the flame's width beside its words, once an answer is picked */
export const BESIDE = SHORT ? 88 : 104;

/** a question. It sits at the top; the flame sits between it and the answers and says the comment; the answers stay put, low, whatever is tapped.
    The room between is as tall as the longest comment needs from the first frame, so nothing moves. retry: a wrong pick adds "Try another."
    (a graded lesson question); setup's questions have no wrong answer. */
export function Question({
  h,
  head,
  list,
  best,
  pk,
  tried,
  comments,
  first,
  want,
  onMore,
  onPick,
  retry = true,
}: {
  h?: string;
  /** in place of the big line, when the screen already has one */
  head?: ReactNode;
  list: string[];
  best: number | null;
  pk: number | null;
  tried: number[];
  comments: string[];
  /** what the flame says before anything is picked */
  first?: string;
  want: number;
  onMore?: () => void;
  onPick: (j: number) => void;
  retry?: boolean;
}) {
  const found = best != null && tried.indexOf(best) >= 0;
  const reply = (j: number) => comments[j] + (retry && best != null && j !== best && !found ? ' Try another.' : '');
  const said = pk != null ? reply(pk) : first || null;
  const [room, setRoom] = useState({ w: 0, h: 0 });
  const [tall, setTall] = useState(0);
  const wide = Math.max(120, room.w - BESIDE + 8);
  const measure = (e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.height;
    setTall((x) => (y > x ? y : x));
  };
  /* the words and the flame stand together, in the middle of the room when it has more than they need. In a short room the flame stands beside
     the words instead of under them: the words leave it that width. */
  const pair = tall + BESIDE - 12;
  const top = Math.max(0, (room.h - pair) / 2);
  const flameTop = Math.min(top + tall - 12, Math.max(0, room.h - BESIDE));
  return (
    <>
      {head || (
        <T style={[s.h, s.hsm]} accessibilityRole="header">
          {h}
        </T>
      )}
      <View
        style={[s.room, { minHeight: Math.max(tall, BESIDE) + 8 }]}
        onLayout={(e) => setRoom({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <FlameSlot
          size={said ? BESIDE * 1.9 : want}
          min={0}
          side={!!said}
          style={said ? { position: 'absolute', left: 0, right: 0, top: flameTop, height: BESIDE } : StyleSheet.absoluteFill}
        />
        {/* every comment, unseen, to learn how tall the longest is */}
        {room.w
          ? comments.concat(first || []).map((x, j) => (
              <View
                key={j}
                style={[s.ghost, { width: wide }]}
                onLayout={measure}
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants">
                <Bubble text={x + (x === first || !retry ? '' : ' Try another.')} tail="right" more={!!onMore} />
              </View>
            ))
          : null}
        {said ? (
          <Appear key={said} by={0} delay={120} style={[s.said, { width: wide, top }]}>
            <Bubble text={said} tail="right" more={!!onMore && pk != null} onMore={onMore} />
          </Appear>
        ) : null}
      </View>
      <Dock>
        <Opts list={list} best={best} pk={pk} tried={tried} onPick={onPick} />
      </Dock>
    </>
  );
}

/** one answer: bright paper with a lip you can press, fixed in place. right: it turns green. quiet: it steps back. */
export function Answer({
  sel,
  right,
  quiet,
  onPress,
  label,
  style,
  children,
}: {
  sel: boolean;
  right: boolean;
  quiet?: boolean;
  onPress: () => void;
  label?: string;
  style?: ViewStyle;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: sel }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        s.opt,
        right
          ? { backgroundColor: RIGHT, shadowColor: RIGHT_LIP, shadowOpacity: 1 }
          : quiet
            ? { backgroundColor: sel ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.62)', shadowOpacity: 0 }
            : { backgroundColor: PAPER, shadowColor: PAPER_LIP, shadowOpacity: 1 },
        { borderColor: sel && !right ? PAPER_INK : 'transparent', transform: [{ translateY: pressed && !quiet ? 2 : 0 }] },
        style,
      ]}>
      {children}
      {right ? (
        <View style={s.optTick}>
          <Icon name="check" size={18} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}
/** the words on an answer, in its ink */
export function AnswerText({ right, quiet, sel, children, center }: { right: boolean; quiet?: boolean; sel?: boolean; children: ReactNode; center?: boolean }) {
  return (
    <Text style={[s.optT, center && { textAlign: 'center' }, { color: right ? '#FFFFFF' : PAPER_INK, opacity: quiet && !sel ? 0.72 : 1 }]}>{children}</Text>
  );
}

/** the answers: the right one turns green and the rest go quiet. A wrong pick shows as picked, and the others stay bright to try. Every one
    stays tappable, so its comment can be read. */
export function Opts({
  list,
  best,
  pk,
  tried,
  onPick,
}: {
  list: string[];
  best: number | null;
  pk: number | null;
  tried: number[];
  onPick: (j: number) => void;
}) {
  const found = best != null && tried.indexOf(best) >= 0;
  return (
    <View style={{ gap: 8 }}>
      {list.map((o, j) => {
        const sel = pk === j;
        const right = best == null ? sel : found && j === best;
        const quiet = !right && (found || (best != null && tried.indexOf(j) >= 0));
        return (
          <Answer key={j} sel={sel} right={right} quiet={quiet} onPress={() => onPick(j)}>
            <AnswerText right={right} quiet={quiet} sel={sel}>
              {o}
            </AnswerText>
          </Answer>
        );
      })}
    </View>
  );
}

export const lessonText = StyleSheet.create({
  h: { fontFamily: font.display, fontSize: 28, lineHeight: 34 },
  hsm: { fontSize: 22, lineHeight: 28 },
  p: { fontSize: 17, lineHeight: 24 },
});

const s = StyleSheet.create({
  ...lessonText,
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  x: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  prog: { flexDirection: 'row', gap: 4 },
  progI: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  progIn: { height: 4, borderRadius: 2 },
  card: { flex: 1, marginHorizontal: -16 },
  cardIn: { paddingHorizontal: 16, paddingTop: SHORT ? 8 : 16, paddingBottom: 8, flexGrow: 1 },
  cardBody: { gap: 12, flexGrow: 1 },
  foot: { flexDirection: 'row', gap: 12 },
  quiet: { width: '100%', minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quietHalf: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  quietT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  room: { flexGrow: 1, alignSelf: 'stretch' },
  ghost: { position: 'absolute', left: 0, top: 0, opacity: 0 },
  said: { position: 'absolute', left: 0, top: 0 },
  opt: {
    minHeight: SHORT ? 48 : 54,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 38,
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 0,
  },
  optT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
  optTick: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
});
