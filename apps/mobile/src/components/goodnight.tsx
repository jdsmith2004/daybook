/* Goodnight: the end of the evening, under the night sky, with the person's own flame big in the middle (components/night-flame.tsx). One big button low
   on the screen saves tonight's check-in when there is one and puts the phone away in one tap (core sayGoodnight), and it is the wind-down too (core
   windCounts). Then the flame falls asleep where it stands, the words say what counted and who the person is becoming, and the screen dims and stays
   there, so a person who picks the phone up at 2 AM finds a sleeping flame and the plan for a loud night. There is no Done: the X closes it, and a new
   day wakes the flame. Used by the wind-down (app/wind.tsx), the end of the check-in (app/checkin.tsx) and Good night after SOS "Go to bed" (app/night.tsx). */
import {
  bedPlans,
  bedWords,
  checkinAnswered,
  checkinSaveText,
  clockOf,
  gameCompute,
  phoneNights,
  sayGoodnight,
  fmtClock,
  windToggle,
  type CheckinForm,
} from '@daybook/core';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { NightMiddle } from '@/components/night-flame';
import { Dock, SceneFrame } from '@/components/scene';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { font, nightInk, useTheme } from '@/lib/theme';

/** what Goodnight did: the phone-away time, the points it earned, and the words after saving the check-in (none when there
    was nothing to save) */
export interface Bed {
  at: string;
  gain: number;
  msg: string;
}

/** Goodnight in one tap: saves the check-in when anything in it is answered, puts the phone away now, and says what it earned */
export function useGoodnight() {
  const { tk, update } = useStore();
  return (form: CheckinForm | null): Bed => {
    const at = clockOf(Date.now());
    let gain = 0;
    let msg = '';
    update((s0) => {
      if (!s0.settings) return s0;
      const b0 = gameCompute(s0.days, s0.settings, s0.reviews, tk).pts;
      const days = sayGoodnight(s0.days, tk, form, at, Date.now(), s0.settings);
      if (form && checkinAnswered(form)) msg = checkinSaveText(days, s0.settings, tk, tk);
      gain = Math.max(0, gameCompute(days, s0.settings, s0.reviews, tk).pts - b0);
      return { ...s0, days };
    });
    buzz('save');
    return { at, gain, msg };
  };
}

/** the big button: full width, at the very bottom, in the moon's color */
export function GoodnightButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Goodnight"
      accessibilityHint="Saves tonight and puts the phone away"
      onPress={onPress}
      style={({ pressed }) => [s.gn, { transform: [{ translateY: pressed ? 3 : 0 }], shadowOpacity: pressed ? 0 : 1 }]}>
      <Icon name="moon" size={24} color={MOON_INK} />
      <Text style={s.gnT}>Goodnight</Text>
    </Pressable>
  );
}

/** a row that opens in place: a title and one line, and what it holds under it once opened */
export function Fold({
  icon,
  title,
  sub,
  open,
  onToggle,
  children,
}: {
  icon: string;
  title: string;
  sub?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <View style={s.fold}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title + (sub ? '. ' + sub : '')}
        onPress={() => {
          buzz('tap');
          onToggle();
        }}
        style={({ pressed }) => [s.foldHead, pressed && { opacity: 0.75 }]}>
        <Icon name={icon} size={20} color={nightInk.ink} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="label">{title}</T>
          {sub ? (
            <T v="small" tone="muted">
              {sub}
            </T>
          ) : null}
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name="down" size={18} color={nightInk.muted} />
        </View>
      </Pressable>
      {open ? (
        <Appear by={6} duration={220} style={s.foldBody}>
          {children}
        </Appear>
      ) : null}
    </View>
  );
}

/** a row like a fold that opens another screen instead (today's check-in, from the wind-down) */
export function NightRow({ icon, title, sub, onPress }: { icon: string; title: string; sub?: string; onPress: () => void }) {
  return (
    <View style={s.fold}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title + (sub ? '. ' + sub : '')}
        onPress={() => {
          buzz('tap');
          onPress();
        }}
        style={({ pressed }) => [s.foldHead, pressed && { opacity: 0.75 }]}>
        <Icon name={icon} size={20} color={nightInk.ink} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="label">{title}</T>
          {sub ? (
            <T v="small" tone="muted">
              {sub}
            </T>
          ) : null}
        </View>
        <Icon name="next" size={18} color={nightInk.muted} />
      </Pressable>
    </View>
  );
}

/** the wind-down list as a folded row: how many are done, and the list itself once opened */
export function WindFold({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { snap, tk, update } = useStore();
  const st = snap.settings;
  if (!st || !st.wind.length) return null;
  const p = snap.days[tk]?.p;
  return (
    <Fold icon="check" title="Before bed" open={open} onToggle={onToggle}>
      {st.wind.map((t, i) => (
        <WindItem
          key={i}
          label={t}
          on={!!p && p.w.indexOf(i) >= 0}
          onPress={() => {
            update((s0) => ({ ...s0, days: windToggle(s0.days, s0.settings!, tk, i) }));
            buzz('tap');
          }}
        />
      ))}
    </Fold>
  );
}

/** the plan for a loud night as a folded row: the picked one first (`plan`, from SOS "Go to bed"), then the others, and SOS */
export function LoudFold({ open, onToggle, plan }: { open: boolean; onToggle: () => void; plan?: string }) {
  const { snap } = useStore();
  const plans = bedPlans(snap.settings);
  return (
    <Fold icon="shield" title="If the thoughts get loud" sub={plan ? plan.split('. ')[0] : 'A plan for tonight, ready'} open={open} onToggle={onToggle}>
      {plan ? <T v="label">{plan}</T> : null}
      {plans
        .filter((p) => !plan || !plan.startsWith(p[1]))
        .map((p) => (
          <View key={p[0]} style={{ gap: 1 }}>
            <T v="label">{p[1]}</T>
            <T v="small" tone="muted">
              {p[2]}
            </T>
          </View>
        ))}
      <Button kind="ghost" icon="life" label="Urge right now? Open SOS" onPress={() => router.push('/sos')} />
    </Fold>
  );
}

/** one thing on the wind-down list: a round check and its words, in the row that holds them */
function WindItem({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={({ pressed }) => [s.item, pressed && { opacity: 0.75 }]}>
      <View style={[s.box, { backgroundColor: on ? c.mint : 'transparent', borderColor: on ? c.mint : nightInk.muted }]}>
        {on ? <Icon name="check" size={16} color="#06352A" /> : null}
      </View>
      <Text style={[s.itemT, { color: nightInk.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** the wind-down list in the sheet: the phone line is left out, since the page already says it */
function BeforeBed() {
  const { snap, tk, update } = useStore();
  const st = snap.settings;
  if (!st) return null;
  const p = snap.days[tk]?.p;
  return (
    <>
      {st.wind.map((t, i) =>
        PHONE_LINE.test(t) ? null : (
          <WindItem
            key={i}
            label={t}
            on={!!p && p.w.indexOf(i) >= 0}
            onPress={() => {
              update((s0) => ({ ...s0, days: windToggle(s0.days, s0.settings!, tk, i) }));
              buzz('tap');
            }}
          />
        ),
      )}
    </>
  );
}
const PHONE_LINE = /^phone goes on its charger/i;

/** the plan for a loud night in the sheet: the picked one first (`plan`, from SOS "Go to bed"), then the others, and SOS */
function LoudPlan({ plan, onSos }: { plan?: string; onSos: () => void }) {
  const { snap } = useStore();
  return (
    <>
      {plan ? <T v="label">{plan}</T> : null}
      {bedPlans(snap.settings)
        .filter((p) => !plan || !plan.startsWith(p[1]))
        .map((p) => (
          <View key={p[0]} style={{ gap: 1 }}>
            <T v="label">{p[1]}</T>
            <T v="small" tone="muted">
              {p[2]}
            </T>
          </View>
        ))}
      <Button kind="ghost" icon="life" label="Urge right now? Open SOS" onPress={onSos} />
    </>
  );
}

/** a sheet over the night, so opening a list never pushes the flame or the button */
function NightSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const c = useTheme();
  const inset = useSafeAreaInsets();
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.sheetWrap}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" style={[StyleSheet.absoluteFill, s.sheetDim]} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: c.surface, paddingBottom: inset.bottom + 16 }]}>
          <View style={s.handle} />
          <T v="h2" accessibilityRole="header">
            {title}
          </T>
          {children}
          <Button label="Done" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

/** a quiet way in, low on the page: an icon beside its words, one tap */
function NightChip({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.chip, pressed && { opacity: 0.75 }]}>
      <Icon name={icon} size={18} color={nightInk.ink} />
      <T v="label">{label}</T>
    </Pressable>
  );
}

/* the going-to-bed beats: the words come in as the moon settles, and a while after that the screen goes dim, like a phone left on a nightstand */
const WORDS = 1700;
const DIM_AFTER = 9000;
const DIM_FOR = 7000;
const DIM_TO = 0.62;

/** the one night page, before and after Goodnight, so the flame falls asleep where it stands. With `bed` it is asleep (it plays the moment when it opens).
    `onGoodnight` is what the button does while it is awake. */
export function NightPage({
  bed,
  when,
  opens,
  onGoodnight,
  plan,
  rowAbove,
  extra,
}: {
  bed: Bed | null;
  /** the few words in the top bar while it is awake (core windWhen) */
  when?: string;
  /** too early for Goodnight: the time it opens (core goodnightOpens). The flame stays up, and the plan for a loud night and SOS stay in reach. */
  opens?: string | null;
  onGoodnight?: () => void;
  /** the plan picked in SOS "Go to bed" */
  plan?: string;
  /** a row above the quiet ways in, while it is awake (the check-in, when it is still open) */
  rowAbove?: ReactNode;
  /** a row low on the page once it is asleep */
  extra?: ReactNode;
}) {
  const { snap, tk } = useStore();
  const st = snap.settings;
  const reduce = useReducedMotion();
  const [sheet, setSheet] = useState<'list' | 'loud' | null>(null);
  const asleep = !!bed;
  /* a day that turned over while this page was open: the flame wakes up */
  const [night] = useState(tk);
  const morning = asleep && tk !== night;
  const level = st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1;
  /* what Goodnight earned can take it to a new level: it falls asleep as the flame it was, and wakes as the new one */
  const [held] = useState(level);
  /* the dark part of the moment: any touch brings the screen back up, and it goes dim again */
  const dim = useRef(new Animated.Value(0)).current;
  const dimTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settle = useCallback(() => {
    if (dimTimer.current) clearTimeout(dimTimer.current);
    if (!asleep || morning) {
      dim.stopAnimation();
      dim.setValue(0);
      return;
    }
    dimTimer.current = setTimeout(
      () =>
        reduce
          ? dim.setValue(DIM_TO)
          : Animated.timing(dim, { toValue: DIM_TO, duration: DIM_FOR, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }).start(),
      DIM_AFTER,
    );
  }, [asleep, morning, reduce, dim]);
  useEffect(() => {
    settle();
    return () => {
      if (dimTimer.current) clearTimeout(dimTimer.current);
    };
  }, [settle]);
  const wake = () => {
    dim.stopAnimation();
    dim.setValue(0);
    settle();
    return false;
  };
  /* the low part of the page keeps its height when it empties, so the flame stays exactly where it was */
  const [low, setLow] = useState(0);
  const words = bed && st ? bedWords(snap.days, st, night, bed.at) : null;
  const hasList = !!st && st.wind.some((t) => !PHONE_LINE.test(t));
  const closeThen = (go: () => void) => {
    setSheet(null);
    go();
  };
  return (
    <View style={s.root} onStartShouldSetResponderCapture={wake}>
      <SceneFrame title={morning ? 'A new day' : asleep ? 'Good night' : when || 'Wind-down'} sky={morning ? 'violet' : 'night'} onClose={close}>
        {morning && bed ? (
          <Appear duration={600} by={6} style={[s.words, s.top]}>
            <T v="title" style={s.c} accessibilityRole="header">
              Good morning.
            </T>
            <T style={s.c}>{words ? words.line : ''}</T>
            <T v="label" style={s.c}>
              {words ? words.own : ''}
            </T>
          </Appear>
        ) : words && bed ? (
          <Appear delay={reduce ? 0 : WORDS} duration={600} by={6} style={[s.words, s.top]}>
            <T v="title" style={s.c} accessibilityRole="header">
              Phone down. Good night.
            </T>
            <T style={s.c}>{words.line}</T>
            <T v="label" style={[s.c, { color: '#FFE27A' }]}>
              {words.own}
            </T>
            {bed.msg ? (
              <T v="small" tone="muted" style={s.c}>
                {bed.msg}
              </T>
            ) : null}
            {bed.gain ? (
              <T v="label" style={[s.c, { color: '#8CF0CE' }]}>
                {'+' + bed.gain + ' points'}
              </T>
            ) : null}
          </Appear>
        ) : opens ? (
          <View style={[s.words, s.top]}>
            <T v="title" style={s.c} accessibilityRole="header">
              Your flame is up with you
            </T>
            <T style={s.c}>{'Goodnight opens at ' + opens + '.'}</T>
          </View>
        ) : (
          <View style={[s.words, s.top]}>
            <T v="title" style={s.c} accessibilityRole="header">
              Put your flame to bed
            </T>
            <T style={s.c}>Phone on its charger, away from your bed.</T>
          </View>
        )}
        <NightMiddle level={morning ? level : held} asleep={asleep} grew={!!bed?.gain} awakeNow={morning} />
        <View style={[s.low, low ? { minHeight: low } : null]} onLayout={asleep ? undefined : (e) => setLow(e.nativeEvent.layout.height)}>
          <Dock>
            {morning ? (
              <Button label="Start the day" onPress={close} />
            ) : asleep ? (
              <>
                {extra}
                <View style={s.chips}>
                  <NightChip icon="shield" label="Thoughts loud?" onPress={() => setSheet('loud')} />
                </View>
              </>
            ) : opens ? (
              <View style={s.chips}>
                <NightChip icon="shield" label="Thoughts loud?" onPress={() => setSheet('loud')} />
              </View>
            ) : (
              <>
                {rowAbove}
                <View style={s.chips}>
                  {hasList ? <NightChip icon="check" label="Before bed" onPress={() => setSheet('list')} /> : null}
                  <NightChip icon="shield" label="Thoughts loud?" onPress={() => setSheet('loud')} />
                </View>
                <GoodnightButton onPress={onGoodnight || close} />
              </>
            )}
          </Dock>
        </View>
        <NightSheet open={sheet === 'list'} title="Before bed" onClose={() => setSheet(null)}>
          <BeforeBed />
        </NightSheet>
        <NightSheet open={sheet === 'loud'} title="If the thoughts get loud" onClose={() => setSheet(null)}>
          <LoudPlan plan={plan} onSos={() => closeThen(() => router.push('/sos'))} />
        </NightSheet>
      </SceneFrame>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.dim, { opacity: dim }]} />
    </View>
  );
}

/** after Goodnight in the check-in and after SOS "Go to bed": the same page, asleep */
export function GoingToBed({ bed, plan, extra }: { bed: Bed; plan?: string; extra?: ReactNode }) {
  return <NightPage bed={bed} plan={plan} extra={extra} />;
}

const MOON_INK = '#1A1250';
const s = StyleSheet.create({
  root: { flex: 1 },
  c: { textAlign: 'center' },
  words: { alignSelf: 'stretch', alignItems: 'center', gap: 6 },
  /* room for the words once it is asleep, kept before too, so the flame falls asleep exactly where it stands */
  top: { minHeight: 112 },
  low: { alignSelf: 'stretch', marginTop: 'auto', justifyContent: 'flex-end' },
  dim: { backgroundColor: '#05030F' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexGrow: 1,
    flexBasis: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheetDim: { backgroundColor: 'rgba(8,5,30,0.5)' },
  sheet: {
    alignSelf: 'stretch',
    maxWidth: 560,
    width: '100%',
    marginHorizontal: 'auto',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 4, backgroundColor: 'rgba(255,255,255,0.22)' },
  gn: {
    alignSelf: 'stretch',
    minHeight: 68,
    borderRadius: 24,
    backgroundColor: '#FFE27A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0B0828',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 0,
    elevation: 3,
  },
  gnT: { fontFamily: font.display, fontSize: 22, color: MOON_INK },
  fold: { alignSelf: 'stretch', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  foldHead: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingHorizontal: 16, paddingVertical: 8 },
  foldBody: { gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, paddingVertical: 4 },
  box: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  itemT: { flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20 },
});
