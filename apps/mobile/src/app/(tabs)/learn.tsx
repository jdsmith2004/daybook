/* Learn: the short lessons, and the tools to try when it is calm. The lessons are a map (components/lesson-map): stepping
   stones through a land for each section, in the order of the path. The page opens with the next lesson in view, and a
   card floats at the top to say which section is on screen (a tap brings the next lesson back). Under the map: the lessons
   in the order they were finished, and what was learned. Ported from the legacy viewLearn, lessonsBody and toolsBody. */
import {
  blankP,
  changeSettings,
  gameCompute,
  lcheckDue,
  LCHECKS,
  type Lesson,
  LESSONS,
  lessonMap,
  lessonNo,
  lessonOpen,
  lessonsDone,
  lessonsLocked,
  lessonTimeline,
  LEARN_FREE,
  lfDate,
  LUNITS,
  type LessonMap,
  TOOL_IDS,
  TOOLS,
  urTried,
  weekGame,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { Collapse, Segments } from '@/components/form';
import { LessonMapView, MapChip } from '@/components/lesson-map';
import { Screen } from '@/components/screen';
import { TalkDoor } from '@/components/talk-card';
import { ToolGrid } from '@/components/tool-grid';
import { LinkCard } from '@/components/link-card';
import { PauseBanner } from '@/components/today-log';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useStore } from '@/lib/store';
import { useAccount, useSync } from '@/lib/sync';
import { font, toneOf, useTheme } from '@/lib/theme';

type Pane = 'lessons' | 'tools';
/** where the next lesson sits on the screen when the page opens: a little above the middle, so its card opens low */
const AIM = 0.45;

export default function Learn() {
  const params = useLocalSearchParams<{ pane?: string }>();
  const [pane, setPane] = useState<Pane>(params.pane === 'tools' ? 'tools' : 'lessons');
  const { snap } = useStore();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const done = useMemo(() => lessonsDone(snap.days), [snap.days]);
  const doneKey = [...done].sort().join(' ');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(() => lessonMap(done), [doneKey]);
  /* where the map is on the page (its top, and its scale), how far the page has scrolled, and how tall the screen is */
  const geo = useRef({ pane: -1, map: -1, k: 1, y: 0, h: 700 });
  const [view, setView] = useState<{ focus: number; win: [number, number] }>({ focus: -1, win: [0, 2] });
  const top = () => inset.top + 16 + geo.current.pane + geo.current.map;
  const look = () => {
    const g = geo.current;
    if (g.map < 0 || g.pane < 0) return;
    const t = top();
    const at = (g.y - t) / g.k;
    const h = g.h / g.k;
    const fy = at + h * AIM;
    const focus = pane === 'lessons' && g.y > t - 20 ? m.lands.findIndex((l) => fy >= l.top - 70 && fy < l.bottom - 70) : -1;
    const near = m.lands.map((l, i) => (l.bottom + 60 > at - h && l.top - 70 < at + 2 * h ? i : -1)).filter((i) => i >= 0);
    const win: [number, number] = near.length ? [near[0], near[near.length - 1]] : [0, 1];
    setView((v) => (v.focus === focus && v.win[0] === win[0] && v.win[1] === win[1] ? v : { focus, win }));
  };
  const aim = (animated: boolean) => {
    const g = geo.current;
    if (g.map < 0 || g.pane < 0) return;
    const at = (m.next ? m.next.y : m.end.y) * g.k;
    const y = Math.max(0, top() + at - g.h * AIM);
    scroll.current?.scrollTo({ y, animated });
    g.y = y;
    look();
  };
  /* the page opens with the next lesson in view, and moves to the new one after a lesson is finished */
  const aimed = useRef(false);
  const ready = () => {
    if (aimed.current || geo.current.map < 0 || geo.current.pane < 0) return;
    aimed.current = true;
    setTimeout(() => aim(false), 60);
  };
  const walked = useRef(m.walked);
  useEffect(() => {
    if (walked.current === m.walked) return;
    walked.current = m.walked;
    if (aimed.current) setTimeout(() => aim(true), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.walked]);
  const due = snap.settings ? lcheckDue(snap.days, snap.settings) : 0;
  if (!snap.settings) return <Screen title="Learn">{null}</Screen>;
  const land = view.focus >= 0 ? m.lands[view.focus] : null;
  return (
    <Screen
      eyebrow="My Daybook"
      scrollRef={scroll}
      title="Learn"
      onScroll={(y, h) => {
        geo.current.y = y;
        geo.current.h = h;
        look();
      }}
      overlay={
        <Floating show={!!land} due={due}>
          {land ? <MapChip l={land} of={m.lands.length} here={!!m.next && land.stones.includes(m.next)} onPress={() => aim(true)} /> : null}
        </Floating>
      }
      sub={
        <T tone="muted">
          {pane === 'tools'
            ? 'Try the tools when it is calm, so you know what works when it is not.'
            : `${done.size} of ${LESSONS.length} done. One short lesson a day is plenty.`}
        </T>
      }>
      <Segments
        label="Learn sections"
        list={[
          ['lessons', 'Lessons'],
          ['tools', 'Tools'],
        ]}
        cur={pane}
        onPick={(p) => {
          setPane(p);
          aimed.current = false;
          geo.current.map = -1;
          geo.current.pane = -1;
          if (p === 'tools') setView({ focus: -1, win: [0, 2] });
        }}
      />
      <Appear
        key={pane}
        style={{ gap: 14 }}
        onLayout={(e) => {
          geo.current.pane = e.nativeEvent.layout.y;
          look();
          ready();
        }}>
        {pane === 'tools' ? (
          <ToolsPane />
        ) : (
          <LessonsPane
            m={m}
            win={view.win}
            onGeom={(g) => {
              geo.current.map = g.y;
              geo.current.k = g.k;
              look();
              ready();
            }}
          />
        )}
      </Appear>
    </Screen>
  );
}

/** what floats over the top of the map: the section on screen, and a checkpoint to write when one is ready. It fades in
    once the map reaches the top of the screen. */
function Floating({ show, due, children }: { show: boolean; due: number; children: React.ReactNode }) {
  const c = useTheme();
  const still = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) v.setValue(show ? 1 : 0);
    else Animated.timing(v, { toValue: show ? 1 : 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [show, still, v]);
  return (
    <Animated.View
      pointerEvents={show ? 'box-none' : 'none'}
      style={{ width: '100%', gap: 8, opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }}>
      {children}
      {show && due ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/lwrite/[n]', params: { n: String(due) } })}
          style={({ pressed }) => [s.due, { backgroundColor: c.violetSoft, opacity: pressed ? 0.9 : 1 }]}>
          <Icon name="pencil" size={16} color={c.violetText} />
          <Text style={[s.dueT, { color: c.violetText }]}>Checkpoint {due} is ready: write it out</Text>
          <Icon name="next" size={16} color={c.violetText} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const openLesson = (id: string) => router.push({ pathname: '/lesson/[id]', params: { id } });

/* ---------- lessons ---------- */
function LessonsPane({ m, win, onGeom }: { m: LessonMap; win: [number, number]; onGeom: (g: { y: number; k: number }) => void }) {
  const c = useTheme();
  const { snap, tk } = useStore();
  const st = snap.settings!;
  const [sel, setSel] = useState<string | null>(null);
  const [past, setPast] = useState(false);
  const done = lessonsDone(snap.days);
  const n = done.size;
  const tl = lessonTimeline(snap.days);
  const dates = useMemo(() => Object.fromEntries(tl.past.map((x) => [x.L.id, lfDate(x.k, tk)])), [tl.past, tk]);
  const due = lcheckDue(snap.days, st);
  const account = useAccount();
  const sync = useSync();
  const open = (L: Lesson) => lessonOpen(L, done, account);
  const waiting = lessonsLocked(LESSONS, done, account);
  /* the map's place in the pane and its scale arrive in either order; pass them on once both are known */
  const at = useRef({ y: -1, k: 0 });
  const tell = () => at.current.y >= 0 && at.current.k > 0 && onGeom({ y: at.current.y, k: at.current.k });
  return (
    <View style={{ gap: 14 }}>
      {due ? (
        <Card style={{ backgroundColor: c.violetSoft, borderColor: c.violetSoft }}>
          <View style={s.hhTop}>
            <View style={[s.hhIc, { backgroundColor: c.surface }]}>
              <Icon name="pencil" size={22} color={c.violetText} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="h2">Write it out</T>
              <T v="small">
                Checkpoint {due}: {LCHECKS[due - 1].t}. A short piece of writing about lessons {lessonNo(LESSONS[2 * due - 2])} and{' '}
                {lessonNo(LESSONS[2 * due - 1])}. 3 to 5 minutes, no points, only you see it.
              </T>
            </View>
          </View>
          <Button label="Start writing" onPress={() => router.push({ pathname: '/lwrite/[n]', params: { n: String(due) } })} />
        </Card>
      ) : null}

      {!account && waiting ? (
        <Pressable accessibilityRole="button" onPress={() => sync.signInNow()} style={[s.lockLine, { backgroundColor: c.accentSoft }]}>
          <Icon name="lock" size={18} color={c.accentText} />
          <T v="small" style={{ flex: 1, color: c.accentText, fontFamily: font.bodySemi }}>
            {LEARN_FREE} lessons are free. A free account opens the other {waiting}.
          </T>
          <Icon name="next" size={16} color={c.accentText} />
        </Pressable>
      ) : null}

      <View
        onLayout={(e) => {
          at.current.y = e.nativeEvent.layout.y;
          tell();
        }}>
        <LessonMapView
          m={m}
          open={open}
          dates={dates}
          waiting={waiting}
          win={win}
          sel={sel}
          onSel={setSel}
          onGeom={(g) => {
            at.current.k = g.k;
            tell();
          }}
          onStart={(id) => {
            setSel(null);
            openLesson(id);
          }}
          onSignIn={() => sync.signInNow()}
        />
      </View>

      {tl.past.length ? (
        <Collapse
          title="In the order you finished them"
          sub={`${n} lesson${n === 1 ? '' : 's'} · last: ${tl.past[tl.past.length - 1].L.title}`}
          icon="calendar"
          open={past}
          onToggle={() => setPast(!past)}>
          <View style={{ gap: 8 }}>
            {tl.past.map((x, i) => (
              <LessonRow
                key={x.L.id}
                L={x.L}
                done
                side={i === tl.past.length - 1 ? 'Last · ' + lfDate(x.k, tk) : lfDate(x.k, tk)}
                sub={(st.learn.prac && st.learn.prac[x.L.id] ? 'Practiced · ' : '') + LUNITS[x.L.u].name}
              />
            ))}
          </View>
        </Collapse>
      ) : null}

      <LinkCard
        icon="compass"
        title="What I have learned"
        sub={n ? 'Your takeaways and notes, in My plan' : 'Fills in as you finish lessons'}
        onPress={() => router.push({ pathname: '/plan', params: { pane: 'learned' } })}
      />
      <T v="small" tone="muted">
        The lessons put research into plain words and stay within what each study found. They are not medical advice. Each one lists its sources. The faith
        lessons rest on the 12 steps and on research, not on any one church’s teaching.
      </T>
    </View>
  );
}

/** one lesson in the timeline: its number and title, a line under it, and the date or length at the side */
function LessonRow({ L, done, locked, side, sub }: { L: Lesson; done?: boolean; locked?: boolean; side: string; sub: string }) {
  const c = useTheme();
  const t = toneOf(c, LUNITS[L.u].tone);
  const no = lessonNo(L);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Lesson ${no}: ${L.title}. ${done ? 'Done, ' + side + '.' : locked ? 'Opens with a free account.' : side + '.'}`}
      onPress={() => openLesson(L.id)}
      style={({ pressed }) => [s.row, { backgroundColor: c.surface, borderColor: done ? c.cardEdge : 'transparent', opacity: pressed ? 0.85 : 1 }]}>
      <View style={[s.lrIc, { backgroundColor: done ? c.mintSoft : t.soft }]}>
        {done ? (
          <Icon name="check" size={18} color={c.mintText} />
        ) : locked ? (
          <Icon name="lock" size={16} color={t.text} />
        ) : (
          <Text style={[s.no, { color: t.text }]}>{no}</Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[s.lrT, { color: c.ink }]}>
          {done ? <Text style={{ color: c.muted }}>{no} </Text> : null}
          {L.title}
        </Text>
        <T v="small" tone="muted" numberOfLines={1}>
          {done ? <Text style={{ color: t.text, fontFamily: font.bodySemi }}>{sub}</Text> : sub}
        </T>
      </View>
      {side ? (
        <T v="small" tone={done ? 'mintText' : 'muted'} style={{ fontFamily: font.bodySemi }}>
          {side}
        </T>
      ) : null}
    </Pressable>
  );
}

/* ---------- tools ---------- */
function ToolsPane() {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const st = snap.settings!;
  const p = snap.days[tk]?.p || blankP();
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const wg = weekGame(snap.days, st, Math.max(0, g.week));
  const tried = urTried(snap.days);
  const any = TOOLS.some((t) => tried[t.id]);
  const fresh = any && TOOLS.some((t) => !tried[t.id]);
  const pin = st.urPin || '';
  const pinT = pin ? TOOLS.find((t) => t.id === pin) : null;
  const [pinOpen, setPinOpen] = useState(false);
  return (
    <>
      <PauseBanner />
      <Card>
        <View style={s.between}>
          <T v="h2">Pick a tool</T>
          <T v="small" tone="muted">
            tap one
          </T>
        </View>
        <TalkDoor />
        <ToolGrid days={snap.days} onPick={(id) => router.push({ pathname: '/tool/[id]', params: { id } })} />
        <T v="small">
          Today: <Text style={{ fontFamily: font.bodyBold }}>{p.c}</Text> calm move{p.c === 1 ? '' : 's'} · This week:{' '}
          <Text style={{ fontFamily: font.bodyBold }}>{wg.tools}</Text> of {TOOL_IDS.length} tools tried
        </T>
        {fresh ? (
          <T v="small" tone="muted">
            “New” marks a tool you have not used yet. SOS offers those now and then, when an urge is small.
          </T>
        ) : null}
      </Card>
      <Card>
        <T v="h2">My go-to in SOS</T>
        <Collapse title="SOS suggests first" sub={pinT ? pinT.name : 'The best fit for the moment'} open={pinOpen} onToggle={() => setPinOpen(!pinOpen)}>
          <View style={s.chips}>
            {[['', 'The best fit for the moment'] as [string, string]].concat(TOOLS.map((x) => [x.id, x.name] as [string, string])).map(([id, name]) => (
              <Chip
                key={id || 'best'}
                label={name}
                on={pin === id}
                onPress={() => {
                  apply({ st: changeSettings(st, (s0) => void (s0.urPin = TOOL_IDS.indexOf(id) >= 0 ? id : null)) });
                  setPinOpen(false);
                }}
              />
            ))}
          </View>
        </Collapse>
        <T v="small" tone="muted">
          {pinT
            ? 'SOS puts ' + pinT.name + ' first every time. It still keeps track of what helps.'
            : 'SOS learns which tools help you, and picks the best fit for the moment.'}
        </T>
      </Card>
      <View style={{ gap: 8 }}>
        <LinkCard
          icon="pencil"
          title="Write or edit my reasons"
          sub={`${st.reasons.length} saved · add, reorder, reword`}
          onPress={() => router.push('/reasons')}
        />
        <LinkCard icon="moon" title="Tonight's wind-down" sub="A short checklist for the last hour" onPress={() => router.navigate('/')} />
        <LinkCard icon="life" title="Need a person or a plan?" sub="Free help, scripts, phone setup" onPress={() => router.push('/help')} />
      </View>
      <View style={{ height: 1, backgroundColor: c.line, opacity: 0 }} />
    </>
  );
}

const s = StyleSheet.create({
  due: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', minHeight: 44, paddingHorizontal: 14, borderRadius: 22 },
  dueT: { fontFamily: font.bodyBold, fontSize: 14.5 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  hhTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  hhIc: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  segs: { flexDirection: 'row', gap: 2 },
  lockLine: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16 },
  segI: { flex: 1, height: 8, borderRadius: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  moreT: { fontFamily: font.bodySemi, fontSize: 15 },
  next: { gap: 12, padding: 16, borderRadius: 24 },
  nextT: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
  eye: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeT: { flexShrink: 1, fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sec: { gap: 10, padding: 14, borderRadius: 22 },
  secTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secT: { flex: 1, fontFamily: font.bodyBold, fontSize: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, borderWidth: 1.5 },
  lrIc: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  no: { fontFamily: font.bodyBold, fontSize: 14.5 },
  lrT: { fontFamily: font.bodyBold, fontSize: 15.5, lineHeight: 20 },
});
