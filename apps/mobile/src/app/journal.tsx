/* The journal (core journal-entries.ts; its pieces are components/journal.tsx). It comes down over Today like a shade when
   the page is pulled down past the line (components/pull-door.tsx), carrying on from where the thumb let go, and goes back
   up the same way: the X, a push up from its bottom edge, or Back. It is always the night sky, in either theme, like the
   field of feelings it opens into, so a private page feels like a quiet room.

   The list is every entry, newest first, by day, on the same plain dark page as the writing: a line for each, the
   feeling's word with a small dot in its color (components/journal.tsx). Low at the bottom, where the thumb is, New entry opens the same four colors as everywhere
   else in the app (QuadBubbles), and the field of feelings grows out of the one tapped (How We Feel's way in). The word
   named, the page to write on is kept bare: the word, one tiny line to start from ("Explore why you might be feeling
   hopeful", with the word in its color), and the page. It saves quietly as it is written; Done
   goes back to the list, where the new entry lands at the top. The feeling alone is an entry too: naming it is the part
   that helps most. */
import { feelAt, jnDayLabel, jnDays, jnEdit, jnGroups, jnList, jnRemove, jnStart, type FEEL_QUADS } from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { DayMark, entryLook, EntryRow, entryTime, JN, NewEntry, takeJournalStart } from '@/components/journal';
import { Dock, SceneFrame, Stage } from '@/components/scene';
import { Text, TextInput } from '@/components/text';
import { FEEL_COLORS, FeelGrid, QuadBubbles, type FeelFrom } from '@/components/tools/feel';
import { Icon, InkContext, T } from '@/components/ui';
import { webDeps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { useAccount } from '@/lib/sync';
import { useStore } from '@/lib/store';
import { font, MAX_WIDTH, NightContext, nightInk } from '@/lib/theme';

/** room above the shade, so its spring can overshoot a little without showing a gap at the top */
const EXTRA = 80;
/** the shade comes down with a little life in it, and goes back with none */
const OPEN = { damping: 24, stiffness: 210, mass: 1 };
const BACK = { damping: 30, stiffness: 320, mass: 1 };
/** how far up a push from the bottom closes it */
const PUSH = 90;

type Step =
  | { k: 'list'; fresh?: string }
  /** the four colors, the same step as everywhere else a feeling is named */
  | { k: 'quad' }
  /** naming the feeling: for a new entry (id null), or for this entry again */
  | { k: 'grid'; start: { r: number; c: number }; from?: FeelFrom; id: string | null; fresh?: boolean }
  | { k: 'write'; id: string; fresh: boolean };

export default function JournalScreen() {
  const params = useLocalSearchParams<{ pane?: string }>();
  /* the Pattern tab was called Journal until October 2026: an old link to one of its sections goes there */
  useEffect(() => {
    if (params.pane) router.replace({ pathname: '/pattern', params: { pane: params.pane } });
  }, [params.pane]);
  if (params.pane) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Journal />
    </GestureHandlerRootView>
  );
}

function Journal() {
  const { height: H, width: W } = useWindowDimensions();
  const reduce = useReducedMotion();
  const sos = useSos();
  const { snap, tk, update } = useStore();
  const [start] = useState(takeJournalStart);
  const [step, setStep] = useState<Step>({ k: 'list' });

  /* ---------- the shade ---------- */
  const y = useSharedValue(reduce ? 0 : Math.min(0, start - H));
  const shown = useSharedValue(reduce ? 0 : 1);
  useEffect(() => {
    if (reduce) shown.value = withTiming(1, { duration: 220 });
    else y.value = withSpring(0, OPEN);
    /* once the journal has been opened, Today stops showing how to find it */
    if (!sos.mem.jnSeen) sos.setMem((m) => ({ ...m, jnSeen: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const closing = useRef(false);
  const leave = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/')), []);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    Keyboard.dismiss();
    if (reduce) shown.value = withTiming(0, { duration: 180 }, (f) => f && runOnJS(leave)());
    else y.value = withTiming(-H - EXTRA, { duration: 320, easing: Easing.in(Easing.cubic) }, (f) => f && runOnJS(leave)());
  }, [reduce, H, leave, shown, y]);
  const shade = useAnimatedStyle(
    () => {
      /* rounded along its bottom edge while it moves, square once it rests, so no corner of Today peeks out */
      const r = Math.min(34, Math.max(0, -y.value) * 0.6);
      return { opacity: shown.value, transform: [{ translateY: y.value }], borderBottomLeftRadius: r, borderBottomRightRadius: r };
    },
    webDeps(y, shown),
  );
  /* Today dims a little behind it as it comes down */
  const dim = useAnimatedStyle(() => ({ opacity: shown.value * 0.4 * Math.max(0, Math.min(1, 1 + y.value / H)) }), webDeps(y, shown, H));
  /* a push up from the bottom edge takes it back up; a pull down only stretches it a little */
  const crossed = useRef(false);
  const tick = (over: boolean) => {
    if (over !== crossed.current) buzz(over ? 'tick' : 'roll');
    crossed.current = over;
  };
  const push = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-10, 10])
        .onUpdate((e) => {
          y.value = e.translationY < 0 ? e.translationY : e.translationY * 0.12;
          runOnJS(tick)(e.translationY < -PUSH);
        })
        .onEnd((e) => {
          if (e.translationY < -PUSH || e.velocityY < -900) runOnJS(close)();
          else y.value = withSpring(0, BACK);
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [close],
  );

  /* ---------- the steps ---------- */
  const startEntry = (q: (typeof FEEL_QUADS)[number], at?: FeelFrom) => setStep({ k: 'grid', start: { r: q.r, c: q.c }, from: at, id: null });
  const named = (r: number, c: number) => {
    const f = feelAt(r, c);
    if (!f || step.k !== 'grid') return;
    if (step.id) {
      const id = step.id;
      update((s0) => ({ ...s0, journal: jnEdit(s0.journal || {}, id, { w: f.w }) }));
      setStep({ k: 'write', id, fresh: !!step.fresh });
      return;
    }
    let id = '';
    update((s0) => {
      const r0 = jnStart(s0.journal || {}, tk, f.w);
      id = r0.id;
      return { ...s0, journal: r0.jn };
    });
    setStep({ k: 'write', id, fresh: true });
  };
  const back = useRef<() => void>(close);
  /* the page being written on sets this, so Android's Back does what its own back arrow does */
  const writeBack = useRef<(() => void) | null>(null);
  back.current =
    step.k === 'list'
      ? close
      : step.k === 'quad'
        ? () => setStep({ k: 'list' })
        : step.k === 'grid'
          ? () => setStep(step.id ? { k: 'write', id: step.id, fresh: !!step.fresh } : { k: 'quad' })
          : () => (writeBack.current ? writeBack.current() : setStep({ k: 'list' }));
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  return (
    <NightContext.Provider value={true}>
      <InkContext.Provider value={NIGHT_INK}>
        <View style={StyleSheet.absoluteFill}>
          <StatusBar style="light" />
          <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.dim, dim]} />
          <Reanimated.View style={[s.shade, { top: -EXTRA, height: H + EXTRA }, shade]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: JN.paper }]} />
            <View style={[StyleSheet.absoluteFill, { top: EXTRA }]}>
              {step.k === 'list' ? (
                <ListPage
                  key="list"
                  fresh={step.fresh}
                  push={push}
                  onClose={close}
                  onNew={() => setStep({ k: 'quad' })}
                  onOpen={(id) => setStep({ k: 'write', id, fresh: false })}
                />
              ) : step.k === 'quad' ? (
                <SceneFrame key="quad" title="Journal" sky="night" onClose={back.current}>
                  <Stage dir={0}>
                    <T v="title" style={s.c} accessibilityRole="header">
                      How are you feeling?
                    </T>
                    <T style={s.c}>Tap the color that is closest. The exact word comes next.</T>
                    <Dock>
                      <QuadBubbles d={Math.min(W - 96, 330) / 2} onPick={startEntry} />
                    </Dock>
                  </Stage>
                </SceneFrame>
              ) : step.k === 'grid' ? (
                <FeelGrid key="grid" start={step.start} from={step.from} onBack={back.current} onClose={back.current} onNext={named} />
              ) : snap.journal?.[step.id] ? (
                <WritePage
                  key={'write' + step.id}
                  id={step.id}
                  fresh={step.fresh}
                  onDone={(fresh) => setStep({ k: 'list', fresh: fresh || undefined })}
                  onFeel={(r, c) => setStep({ k: 'grid', start: { r, c }, id: step.id, fresh: step.fresh })}
                  onBack={(r, c, blank) => {
                    /* an entry read back goes back to the list; a new one goes back to the feelings, on its word. One
                       with nothing written yet is taken back too, so naming another feeling starts afresh */
                    const id = step.id;
                    if (!step.fresh) return setStep({ k: 'list' });
                    if (blank) {
                      update((s0) => ({ ...s0, journal: jnRemove(s0.journal || {}, id) }));
                      return setStep({ k: 'grid', start: { r, c }, id: null });
                    }
                    setStep({ k: 'grid', start: { r, c }, id, fresh: true });
                  }}
                  backRef={writeBack}
                />
              ) : null}
            </View>
          </Reanimated.View>
        </View>
      </InkContext.Provider>
    </NightContext.Provider>
  );
}

const NIGHT_INK = { ink: nightInk.ink, muted: nightInk.muted };

/* ---------- the list ---------- */
function ListPage({
  fresh,
  push,
  onClose,
  onNew,
  onOpen,
}: {
  fresh?: string;
  push: ReturnType<typeof Gesture.Pan>;
  onClose: () => void;
  onNew: () => void;
  onOpen: (id: string) => void;
}) {
  const inset = useSafeAreaInsets();
  const { snap, tk } = useStore();
  const groups = useMemo(() => jnGroups(snap.journal, tk), [snap.journal, tk]);
  const n = useMemo(() => jnList(snap.journal).length, [snap.journal]);
  const days = useMemo(() => jnDays(snap.journal), [snap.journal]);
  const [dockH, setDockH] = useState(140);
  return (
    <View style={{ flex: 1 }}>
      <View style={[s.head, { paddingTop: inset.top + 10 }]}>
        <View style={s.headRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.title} accessibilityRole="header" maxFontSizeMultiplier={1.25}>
              Journal
            </Text>
            <Text style={s.sub}>
              {n ? `${n} ${n === 1 ? 'entry' : 'entries'} · ${days} ${days === 1 ? 'day' : 'days'} written` : 'A few honest lines, just for you.'}
            </Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={s.round} hitSlop={6}>
            <Icon name="x" color={JN.ink} />
          </Pressable>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.list, { paddingBottom: dockH + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={s.col}>
          {groups.length ? (
            groups.map((g, gi) => (
              <View key={g.k}>
                <DayMark label={g.label} first={gi === 0} />
                {g.items.map((e) => {
                  const card = <EntryRow e={e} onPress={() => onOpen(e.id)} />;
                  /* the entry just written lands at the top, rising into place */
                  return e.id === fresh ? (
                    <Appear key={e.id} by={18} delay={140} duration={460}>
                      {card}
                    </Appear>
                  ) : (
                    <View key={e.id}>{card}</View>
                  );
                })}
              </View>
            ))
          ) : (
            <Empty />
          )}
        </View>
      </ScrollView>
      {/* the bottom fades into the sky behind the bar, so the entries slide under it softly */}
      <LinearGradient pointerEvents="none" colors={[JN.paper + '00', JN.paper, JN.paper]} locations={[0, 0.45, 1]} style={[s.fade, { height: dockH + 36 }]} />
      <GestureDetector gesture={push}>
        <View style={[s.dock, { paddingBottom: Math.max(inset.bottom, 12) }]} onLayout={(e) => setDockH(e.nativeEvent.layout.height)}>
          <View style={s.col}>
            <NewEntry onPress={onNew} />
          </View>
          {/* the edge of the shade: a push up here takes the journal back up */}
          <View style={s.grab} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        </View>
      </GestureDetector>
    </View>
  );
}

/** before the first entry: the four colors as four small dots, and what the journal is */
function Empty() {
  const account = useAccount();
  /* one gentle feeling from each corner, near the middle of the field */
  const picks: [number, number][] = [
    [4, 4],
    [3, 8],
    [7, 3],
    [8, 9],
  ];
  return (
    <View style={s.empty}>
      <View style={s.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {picks.map(([r, c], i) => (
          <Appear key={i} by={6} delay={160 + i * 90} duration={420}>
            <View style={[s.artDot, { backgroundColor: FEEL_COLORS[r][c] }]} />
          </Appear>
        ))}
      </View>
      <Text style={s.emptyH}>Start with how you feel</Text>
      <Text style={s.emptyT}>Name the feeling, then write as much or as little as you like. Two minutes is enough, and a feeling on its own counts too.</Text>
      <View style={s.priv}>
        <Icon name="lock" size={15} color={JN.muted} />
        <Text style={s.privT}>{account ? 'Private, like the rest of your log.' : 'Private. It stays on this phone.'}</Text>
      </View>
    </View>
  );
}

/* ---------- writing ---------- */
function WritePage({
  id,
  fresh,
  onDone,
  onFeel,
  onBack,
  backRef,
}: {
  id: string;
  fresh: boolean;
  onDone: (fresh: string | null) => void;
  onFeel: (r: number, c: number) => void;
  /** the back arrow: where it goes is up to the journal; `blank` when nothing is written */
  onBack: (r: number, c: number, blank: boolean) => void;
  backRef: { current: (() => void) | null };
}) {
  const inset = useSafeAreaInsets();
  const { snap, tk, update } = useStore();
  const e = snap.journal![id];
  const look = entryLook(e);
  const f = look.pos ? feelAt(look.pos.r, look.pos.c) : null;
  const [text, setText] = useState(e.t);
  /* a page opened with nothing on it has the small nudge under the feeling; one opened to read back does not */
  const [blank] = useState(!e.t.trim());
  const latest = useRef(text);
  /* it saves quietly as it is written, a moment after each pause, and when the page closes; nothing on the page says so,
     the way Notes and Journal do it */
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const t = latest.current;
    update((s0) => {
      const cur = s0.journal?.[id];
      if (!cur || cur.t === t) return s0;
      return { ...s0, journal: jnEdit(s0.journal || {}, id, { t }) };
    });
  }, [id, update]);
  /* whatever is on the page is saved when it closes, however it closes */
  useEffect(() => () => flush(), [flush]);
  const onChange = (t: string) => {
    latest.current = t;
    setText(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };

  /* a new entry opens ready to write; an old one waits for a tap, so reading it back does not raise the keyboard */
  const input = useRef<TextInputInstance | null>(null);
  const page = useRef<ScrollViewInstance | null>(null);
  const caret = useRef(e.t.length);
  useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(() => input.current?.focus(), 420);
    return () => clearTimeout(t);
  }, [fresh]);
  /* Done sits big at the bottom, where the thumb is; while the keyboard covers the bottom, it moves up into the top bar.
     iOS says the keyboard is coming before it moves, so the two swap as it rises; Android only says so after. */
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const a = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setTyping(true));
    const b = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setTyping(false));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  const done = () => {
    flush();
    Keyboard.dismiss();
    if (fresh) buzz('save');
    onDone(fresh ? id : null);
  };
  const goBack = () => {
    flush();
    Keyboard.dismiss();
    if (!look.pos) return onDone(null);
    onBack(look.pos.r, look.pos.c, !latest.current.trim());
  };
  backRef.current = goBack;
  useEffect(
    () => () => {
      backRef.current = null;
    },
    [backRef],
  );
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const t = setTimeout(() => setSure(false), 3500);
    return () => clearTimeout(t);
  }, [sure]);
  const remove = () => {
    if (!sure) {
      buzz('tap');
      setSure(true);
      return;
    }
    clearTimeout(timer.current);
    latest.current = e.t;
    update((s0) => ({ ...s0, journal: jnRemove(s0.journal || {}, id) }));
    Keyboard.dismiss();
    onDone(null);
  };

  const word = e.w.toLowerCase();
  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[s.wrap, { paddingTop: inset.top + 8 }]}>
          <View style={s.bar}>
            <View style={s.topBack}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={fresh ? 'Back to the feelings' : 'Back to the journal'}
                onPress={goBack}
                style={s.round}
                hitSlop={6}>
                <Icon name="back" color={JN.ink} />
              </Pressable>
            </View>
            <Text style={s.when} numberOfLines={1}>
              {jnDayLabel(e.d, tk) + '  ·  ' + entryTime(e.at)}
            </Text>
            <View style={s.topDone}>
              {typing ? (
                <Appear by={0} duration={180}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Done"
                    onPress={done}
                    hitSlop={6}
                    style={({ pressed }) => [s.round, s.check, { opacity: pressed ? 0.85 : 1 }]}>
                    <Icon name="check" size={22} color={JN.accentInk} />
                  </Pressable>
                </Appear>
              ) : null}
            </View>
          </View>
          {/* a tap anywhere off the words, or a swipe down, puts the keyboard away; a tap below them starts writing */}
          <ScrollView
            ref={page}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}>
            {/* the feeling's word, and the nudge with the word in its color; a tap on it names it again */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Feeling: ${e.w}.${f ? ' ' + f.how + '.' : ''}`}
              accessibilityHint="Opens the feelings to change it"
              onPress={() => look.pos && onFeel(look.pos.r, look.pos.c)}
              style={({ pressed }) => [s.feel, { opacity: pressed ? 0.75 : 1 }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.word} maxFontSizeMultiplier={1.25} numberOfLines={1}>
                  {e.w}
                </Text>
                {blank ? (
                  <Text style={s.nudge}>
                    Explore why you might be feeling <Text style={[s.nudge, s.nudgeW, { color: look.color }]}>{word}</Text>
                  </Text>
                ) : null}
              </View>
            </Pressable>
            <View style={s.rule} />
            <TextInput
              ref={input}
              value={text}
              onChangeText={onChange}
              multiline
              scrollEnabled={false}
              onSelectionChange={(ev) => (caret.current = ev.nativeEvent.selection.end)}
              onContentSizeChange={() => {
                /* writing at the end keeps the newest line in sight as the page grows */
                if (caret.current >= latest.current.length) page.current?.scrollToEnd({ animated: true });
              }}
              textAlignVertical="top"
              placeholder="Start anywhere…"
              placeholderTextColor="rgba(235, 235, 245, 0.3)"
              keyboardAppearance="dark"
              selectionColor={JN.accent}
              cursorColor={JN.accent}
              accessibilityLabel={`Your entry. Explore why you might be feeling ${word}.`}
              style={s.input}
            />
            <Pressable
              accessible={false}
              importantForAccessibility="no"
              style={{ flexGrow: 1, minHeight: 80 }}
              onPress={() => (typing ? Keyboard.dismiss() : input.current?.focus())}
            />
          </ScrollView>
          {typing ? (
            <View style={{ height: 8 }} />
          ) : (
            <View style={[s.foot, { paddingBottom: Math.max(inset.bottom, 12) }]}>
              <Appear by={12} duration={260}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  onPress={done}
                  style={({ pressed }) => [s.doneBig, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
                  <Text style={s.doneBigT}>Done</Text>
                </Pressable>
              </Appear>
              {/* a new entry does not offer to be thrown away; an entry read back again does, quietly, under Done */}
              {!fresh ? (
                <Pressable accessibilityRole="button" onPress={remove} hitSlop={8} style={s.delBtn}>
                  <Text style={[s.del, sure && s.delSure]}>{sure ? 'Tap again to delete' : 'Delete entry'}</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  dim: { backgroundColor: '#0B0920' },
  shade: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  col: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  head: { paddingHorizontal: 16, paddingBottom: 6 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  title: { fontFamily: font.display, fontSize: 32, lineHeight: 38, color: JN.ink },
  sub: { fontFamily: font.bodyMedium, fontSize: 14, lineHeight: 19, color: JN.muted },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  list: { paddingHorizontal: 16, paddingTop: 10 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, alignItems: 'center' },
  grab: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.26)', marginTop: 12 },
  empty: { alignItems: 'center', paddingTop: 34, paddingHorizontal: 12, gap: 10 },
  art: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  artDot: { width: 12, height: 12, borderRadius: 6 },
  emptyH: { fontFamily: font.display, fontSize: 24, lineHeight: 30, color: JN.ink, textAlign: 'center' },
  emptyT: { fontFamily: font.body, fontSize: 15.5, lineHeight: 22.5, color: JN.muted, textAlign: 'center', maxWidth: 330 },
  priv: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  privT: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18, color: JN.muted },
  nudge: { fontFamily: font.body, fontSize: 14.5, lineHeight: 20, color: 'rgba(235, 235, 245, 0.6)' },
  nudgeW: { fontFamily: font.bodySemi },
  check: { backgroundColor: JN.accent, borderColor: JN.accent },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255, 255, 255, 0.16)', marginTop: 18 },
  wrap: { flex: 1, paddingHorizontal: 24, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: -4 },
  feel: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  word: { fontFamily: font.display, fontSize: 26, lineHeight: 31, color: JN.ink },
  when: { flex: 1, textAlign: 'center', fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 17, color: 'rgba(235, 235, 245, 0.45)' },
  input: {
    marginTop: 14,
    paddingTop: 4,
    paddingBottom: 12,
    fontFamily: font.body,
    fontSize: 18,
    lineHeight: 27,
    color: '#F4F2F8',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  /* the same width on both sides, so the date stays in the middle */
  topBack: { width: 78, alignItems: 'flex-start' },
  topDone: { width: 78, alignItems: 'flex-end' },
  foot: { paddingTop: 10, gap: 4 },
  doneBig: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: JN.accent },
  doneBigT: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22, color: JN.accentInk },
  delBtn: { alignSelf: 'center', paddingVertical: 10 },
  del: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 19, color: JN.faint },
  delSure: { color: '#FF9A8D' },
});
