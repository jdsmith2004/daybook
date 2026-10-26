/* The journal (core journal-entries.ts; its pieces are components/journal.tsx). It comes down over Today like a shade when
   the page is pulled down past the line (components/pull-door.tsx), carrying on from where the thumb let go, and goes back
   up the same way: the X, a push up from its bottom edge, or Back. It is always the night sky, in either theme, like the
   field of feelings it opens into, so a private page feels like a quiet room.

   The list is every entry, newest first, by day, each card lit by its feeling's color. Low at the bottom, where the thumb
   is, sit the four colors of the Mood Meter in small: a tap on one starts an entry, and the field of feelings grows out of
   it (How We Feel's way in). The word named, the page to write on opens with the feeling at the top, breathing in its
   color, and one open question to start from (a tap shows another). It saves as it is written; Done goes back to the list,
   where the new entry lands at the top. The feeling alone is an entry too: naming it is the part that helps most. */
import { feelAt, jnDayLabel, jnDays, jnEdit, jnGroups, jnList, jnPrompt, jnRemove, jnStart, type FEEL_QUADS } from '@daybook/core';
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
  type TextInputInstance,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { EntryCard, entryLook, entryTime, FeelBadge, FeelMeter, JN, takeJournalStart, withAlpha } from '@/components/journal';
import { Shape } from '@/components/shapes';
import { Text, TextInput } from '@/components/text';
import { FEEL_COLORS, FeelGrid, feelKind, type FeelFrom } from '@/components/tools/feel';
import { Icon } from '@/components/ui';
import { webDeps } from '@/lib/breath';
import { buzz } from '@/lib/feel';
import { useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { useAccount } from '@/lib/sync';
import { useStore } from '@/lib/store';
import { font, MAX_WIDTH } from '@/lib/theme';

/** room above the shade, so its spring can overshoot a little without showing a gap at the top */
const EXTRA = 80;
/** the shade comes down with a little life in it, and goes back with none */
const OPEN = { damping: 24, stiffness: 210, mass: 1 };
const BACK = { damping: 30, stiffness: 320, mass: 1 };
/** how far up a push from the bottom closes it */
const PUSH = 90;

type Step =
  | { k: 'list'; fresh?: string }
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
  const { height: H } = useWindowDimensions();
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
  back.current =
    step.k === 'list'
      ? close
      : step.k === 'grid'
        ? () => setStep(step.id ? { k: 'write', id: step.id, fresh: !!step.fresh } : { k: 'list' })
        : () => setStep({ k: 'list' });
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar style="light" />
      <Reanimated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.dim, dim]} />
      <Reanimated.View style={[s.shade, { top: -EXTRA, height: H + EXTRA }, shade]}>
        <LinearGradient colors={[JN.top, JN.top, JN.bottom]} locations={[0, 0.12, 1]} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { top: EXTRA }]}>
          {step.k === 'list' ? (
            <ListPage key="list" fresh={step.fresh} push={push} onClose={close} onNew={startEntry} onOpen={(id) => setStep({ k: 'write', id, fresh: false })} />
          ) : step.k === 'grid' ? (
            <FeelGrid key="grid" title="How are you feeling?" start={step.start} from={step.from} onBack={back.current} onClose={back.current} onNext={named} />
          ) : snap.journal?.[step.id] ? (
            <WritePage
              key={'write' + step.id}
              id={step.id}
              fresh={step.fresh}
              onDone={(fresh) => setStep({ k: 'list', fresh: fresh || undefined })}
              onFeel={(r, c) => setStep({ k: 'grid', start: { r, c }, id: step.id, fresh: step.fresh })}
            />
          ) : null}
        </View>
      </Reanimated.View>
    </View>
  );
}

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
  onNew: (q: (typeof FEEL_QUADS)[number], at?: FeelFrom) => void;
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
            groups.map((g) => (
              <View key={g.k} style={s.group}>
                <Text style={s.day} accessibilityRole="header">
                  {g.label}
                </Text>
                {g.items.map((e) => {
                  const p = entryLook(e).pos;
                  const how = (p && feelAt(p.r, p.c)?.how) || 'A feeling, named';
                  const card = <EntryCard e={e} how={how} onPress={() => onOpen(e.id)} />;
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
      {/* the bottom fades into the sky behind the colors, so cards slide under them softly */}
      <LinearGradient
        pointerEvents="none"
        colors={[JN.bottom + '00', JN.bottom, JN.bottom]}
        locations={[0, 0.34, 1]}
        style={[s.fade, { height: dockH + 36 }]}
      />
      <GestureDetector gesture={push}>
        <View style={[s.dock, { paddingBottom: Math.max(inset.bottom, 12) }]} onLayout={(e) => setDockH(e.nativeEvent.layout.height)}>
          <View style={[s.col, s.ask]}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.askH}>How are you feeling?</Text>
              <Text style={s.askT}>Tap the closest color to start.</Text>
            </View>
            <FeelMeter d={42} gap={7} onPick={onNew} />
          </View>
          {/* the edge of the shade: a push up here takes the journal back up */}
          <View style={s.grab} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
        </View>
      </GestureDetector>
    </View>
  );
}

/** before the first entry: the four colors' shapes, loose like scattered pages, and what the journal is */
function Empty() {
  const account = useAccount();
  /* one gentle feeling from each corner, near the middle of the field */
  const picks: [number, number, number, number, number][] = [
    [4, 4, -40, -24, -10],
    [3, 8, 38, -32, 12],
    [7, 3, -32, 34, 8],
    [8, 9, 40, 26, -14],
  ];
  return (
    <View style={s.empty}>
      <View style={s.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {picks.map(([r, c, x, yy, turn], i) => (
          <View key={i} style={[s.artBit, { transform: [{ translateX: x }, { translateY: yy }] }]}>
            <Appear by={10} delay={160 + i * 90} duration={520}>
              <Shape kind={feelKind(r, c)} size={54} color={FEEL_COLORS[r][c]} turn={turn} />
            </Appear>
          </View>
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
}: {
  id: string;
  fresh: boolean;
  onDone: (fresh: string | null) => void;
  onFeel: (r: number, c: number) => void;
}) {
  const inset = useSafeAreaInsets();
  const { snap, tk, update } = useStore();
  const e = snap.journal![id];
  const look = entryLook(e);
  const f = look.pos ? feelAt(look.pos.r, look.pos.c) : null;
  const [text, setText] = useState(e.t);
  /* the question: the one this entry answered, or one for its time of day; a tap shows the next */
  const [n, setN] = useState(0);
  const hour = new Date(e.at).getHours();
  /* a page opened with nothing on it offers a question, and a tap shows another; one opened with writing on it shows the
     question that writing answered, if it had one, and nothing to change it */
  const [blank] = useState(!e.t.trim());
  const prompt = !blank ? e.q || null : n === 0 && e.q ? e.q : jnPrompt(id, hour, n);
  /* the question kept with the entry is the one showing when the writing started */
  const asked = useRef<string | null>(e.q ?? null);
  const latest = useRef(text);
  /* "Saved" shows once the first words are kept, and stays: it is never more than a moment behind, so it does not flicker */
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const t = latest.current;
    const q = t.trim() ? asked.current : null;
    update((s0) => {
      const cur = s0.journal?.[id];
      if (!cur || (cur.t === t && (cur.q ?? null) === q)) return s0;
      return { ...s0, journal: jnEdit(s0.journal || {}, id, { t, q }) };
    });
  }, [id, update]);
  /* whatever is on the page is saved when it closes, however it closes */
  useEffect(() => () => flush(), [flush]);
  const onChange = (t: string) => {
    if (!latest.current.trim() && t.trim() && blank) asked.current = prompt;
    latest.current = t;
    setText(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      flush();
      setSaved(true);
    }, 600);
  };

  /* a new entry opens ready to write; an old one waits for a tap, so reading it back does not raise the keyboard */
  const input = useRef<TextInputInstance | null>(null);
  useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(() => input.current?.focus(), 420);
    return () => clearTimeout(t);
  }, [fresh]);
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', () => setTyping(true));
    const b = Keyboard.addListener('keyboardDidHide', () => setTyping(false));
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

  return (
    <View style={{ flex: 1 }}>
      {/* the feeling's color glows down from the top of the page */}
      <LinearGradient
        pointerEvents="none"
        colors={[withAlpha(look.color, 0.16), withAlpha(look.color, 0.05), withAlpha(look.color, 0)]}
        locations={[0, 0.5, 1]}
        style={[s.glow, { height: inset.top + 380 }]}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[s.wrap, { paddingTop: inset.top + 10 }]}>
          <View style={s.bar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to the journal" onPress={done} style={s.round} hitSlop={6}>
              <Icon name="back" color={JN.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done"
              onPress={done}
              style={({ pressed }) => [s.doneBtn, { backgroundColor: look.color, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={s.doneT}>Done</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Feeling: ${e.w}. ${f ? f.how + '.' : ''}`}
            accessibilityHint="Opens the feelings to change it"
            onPress={() => look.pos && onFeel(look.pos.r, look.pos.c)}
            style={({ pressed }) => [s.feel, { opacity: pressed ? 0.8 : 1 }]}>
            <FeelBadge e={e} size={62} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={s.wordRow}>
                <Text style={s.word} maxFontSizeMultiplier={1.25} numberOfLines={1}>
                  {e.w}
                </Text>
                <Icon name="pencil" size={15} color={JN.faint} />
              </View>
              {f ? (
                <Text style={s.how} numberOfLines={2}>
                  {f.how}
                </Text>
              ) : null}
              <Text style={s.when}>{jnDayLabel(e.d, tk) + ', ' + entryTime(e.at)}</Text>
            </View>
          </Pressable>
          {blank && prompt ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={prompt}
              accessibilityHint="Shows another question"
              onPress={() => {
                buzz('tick');
                setN((x) => x + 1);
              }}
              style={({ pressed }) => [s.prompt, { opacity: pressed ? 0.7 : 1 }]}>
              <Appear key={prompt} by={0} x={8} duration={240} style={{ flex: 1 }}>
                <Text style={s.promptT}>{prompt}</Text>
              </Appear>
              <View style={s.shuffle}>
                <Icon name="swap" size={16} color={JN.muted} />
              </View>
            </Pressable>
          ) : prompt ? (
            <View style={s.prompt}>
              <Text style={[s.promptT, { color: JN.muted }]}>{prompt}</Text>
            </View>
          ) : (
            <View style={{ height: 10 }} />
          )}
          <TextInput
            ref={input}
            value={text}
            onChangeText={onChange}
            multiline
            scrollEnabled
            textAlignVertical="top"
            placeholder="Write anything. Two minutes is enough."
            placeholderTextColor={JN.faint}
            selectionColor={look.color}
            cursorColor={look.color}
            accessibilityLabel={prompt ? 'Your entry. ' + prompt : 'Your entry'}
            style={s.input}
          />
          <View style={[s.foot, { paddingBottom: typing ? 10 : Math.max(inset.bottom, 14) }]}>
            {/* a new entry does not offer to be thrown away; an entry read back again does */}
            {!typing && !fresh ? (
              <Pressable accessibilityRole="button" onPress={remove} hitSlop={8}>
                <Text style={[s.del, sure && s.delSure]}>{sure ? 'Tap again to delete' : 'Delete entry'}</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <View style={s.saved} accessibilityLiveRegion="polite">
              {saved ? (
                <Appear by={0} duration={300} style={s.saved}>
                  <Icon name="check" size={14} color={JN.muted} />
                  <Text style={s.savedT}>Saved</Text>
                </Appear>
              ) : null}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
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
  round: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: JN.btn },
  list: { paddingHorizontal: 16, paddingTop: 10 },
  group: { gap: 10, marginBottom: 22 },
  day: { fontFamily: font.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase', color: JN.muted, marginLeft: 4 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10, alignItems: 'center' },
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    paddingLeft: 20,
    borderRadius: 30,
    backgroundColor: JN.dock,
    borderWidth: 1,
    borderColor: JN.edge,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -2 },
  },
  askH: { fontFamily: font.display, fontSize: 19, lineHeight: 24, color: JN.ink },
  askT: { fontFamily: font.body, fontSize: 14, lineHeight: 19, color: JN.muted },
  grab: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.26)', marginTop: 12 },
  empty: { alignItems: 'center', paddingTop: 34, paddingHorizontal: 12, gap: 10 },
  art: { width: 160, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  artBit: { position: 'absolute' },
  emptyH: { fontFamily: font.display, fontSize: 24, lineHeight: 30, color: JN.ink, textAlign: 'center' },
  emptyT: { fontFamily: font.body, fontSize: 15.5, lineHeight: 22.5, color: JN.muted, textAlign: 'center', maxWidth: 330 },
  priv: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  privT: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18, color: JN.muted },
  glow: { position: 'absolute', top: 0, left: 0, right: 0 },
  wrap: { flex: 1, paddingHorizontal: 20, width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: -4 },
  doneBtn: { height: 40, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  doneT: { fontFamily: font.bodySemi, fontSize: 16, lineHeight: 20, color: '#1C2030' },
  feel: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { fontFamily: font.display, fontSize: 30, lineHeight: 36, color: JN.ink, flexShrink: 1 },
  how: { fontFamily: font.body, fontSize: 14, lineHeight: 19, color: JN.muted },
  when: { fontFamily: font.bodyMedium, fontSize: 12.5, lineHeight: 17, color: JN.faint, marginTop: 2 },
  prompt: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 24, paddingVertical: 4 },
  promptT: { fontFamily: font.display, fontSize: 21, lineHeight: 27, color: JN.ink },
  shuffle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: JN.btn, marginTop: -1 },
  input: {
    flex: 1,
    marginTop: 10,
    paddingTop: 6,
    paddingBottom: 12,
    fontFamily: font.body,
    fontSize: 18,
    lineHeight: 28,
    color: JN.ink,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, minHeight: 36 },
  del: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 19, color: JN.faint },
  delSure: { color: '#FF9A8D' },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 60, justifyContent: 'flex-end' },
  savedT: { fontFamily: font.bodyMedium, fontSize: 13, lineHeight: 18, color: JN.muted },
});
