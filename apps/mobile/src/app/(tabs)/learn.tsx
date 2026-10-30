/* Learn: the short lessons, and the tools to try when it is calm. The lessons are a map (components/lesson-map): stepping
   stones through a land for each section, in the order of the path, which opens one lesson at a time (core lessonWalk).
   The page opens with the next lesson in view, and a
   card floats at the top to say which section is on screen (a tap brings the next lesson back). Under the map: the lessons
   in the order they were finished, and what was learned. Ported from the legacy viewLearn, lessonsBody and toolsBody. */
import {
  blankP,
  changeSettings,
  gameCompute,
  lcheckDue,
  lcheckNo,
  lcheckPair,
  LCHECKS,
  type Lesson,
  LESSONS,
  lessonCount,
  faithOut,
  lessonMap,
  lmin,
  lessonNo,
  lessonOpen,
  lessonsDone,
  lessonsLocked,
  lessonPathFor,
  lessonTimeline,
  lessonWalk,
  LEARN_FREE,
  lfDate,
  LUNITS,
  type LessonMap,
  TOOL_IDS,
  TOOLS,
  urTags,
  urTried,
  weekGame,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appear } from '@/components/appear';
import { Collapse, Segments } from '@/components/form';
import { LessonMapView, MapChip } from '@/components/lesson-map';
import { Screen } from '@/components/screen';
import { TalkDoor } from '@/components/talk-card';
import { PracticeDoor } from '@/components/ride/practice-door';
import { ToolGrid } from '@/components/tool-grid';
import { LinkCard, Rows } from '@/components/link-card';
import { PauseBanner } from '@/components/today-log';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { SetupFirst } from '@/components/welcome';
import { NATIVE, useReducedMotion } from '@/lib/motion';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { useAccount, useSync } from '@/lib/sync';
import { font, toneOf, useTheme } from '@/lib/theme';

type Pane = 'lessons' | 'tools';
/** where the next lesson sits on the screen when the page opens: a little above the middle, so its card opens low */
const AIM = 0.45;
/** room kept under a stone's opened card: the SOS button rises about 30 points above the tab bar, and a little air */
const CLEAR = 44;

export default function Learn() {
  const params = useLocalSearchParams<{ pane?: string }>();
  const [pane, setPane] = useState<Pane>(params.pane === 'tools' ? 'tools' : 'lessons');
  const { snap } = useStore();
  const inset = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const walk = useMemo(() => lessonWalk(snap.days, snap.settings), [snap.days, snap.settings]);
  const walkKey = [...walk.walked].join(' ') + '|' + (walk.next ? walk.next.id : '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const m = useMemo(() => lessonMap(walk), [walkKey]);
  /* where the map is on the page (its top, and its scale), how far the page has scrolled, and how tall the screen is */
  const geo = useRef({ pane: -1, map: -1, k: 1, y: 0, h: 700 });
  const [view, setView] = useState<{ focus: number; win: [number, number]; hide: number }>({ focus: -1, win: [0, 2], hide: -1 });
  const due = snap.settings ? lcheckDue(snap.days, snap.settings, walk) : 0;
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
    /* a signpost under the floating card fades out: the card already names the section */
    const under = inset.top + 8 + 66 + (due ? 52 : 0) + 6;
    const hide =
      focus < 0
        ? -1
        : m.lands.findIndex((l) => {
            const y = t + (l.top + 22) * g.k - g.y;
            return y < under && y + 80 * g.k > 0;
          });
    setView((v) => (v.focus === focus && v.win[0] === win[0] && v.win[1] === win[1] && v.hide === hide ? v : { focus, win, hide }));
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
  /* the page opens with the next lesson in view, and moves to the new one after a lesson is finished. Until it has moved
     there and drawn the lands around it, the page stays out of sight, so it never shows the top of the map and then jumps. */
  const aimed = useRef(false);
  const [placed, setPlaced] = useState(pane !== 'lessons');
  const show = () => requestAnimationFrame(() => requestAnimationFrame(() => setPlaced(true)));
  const ready = () => {
    if (aimed.current || geo.current.map < 0 || geo.current.pane < 0) return;
    aimed.current = true;
    setTimeout(() => {
      aim(false);
      show();
    }, 60);
  };
  /* in case the map never measures (a very slow phone), show the page anyway */
  useEffect(() => {
    if (placed) return;
    const t = setTimeout(() => setPlaced(true), 900);
    return () => clearTimeout(t);
  }, [placed]);
  /* a stone's card opened low on the map: scroll it up until its bottom edge clears the tab bar (and the SOS button that rises
     above it) */
  const reveal = (bottom: number) => {
    const g = geo.current;
    if (g.map < 0 || g.pane < 0) return;
    const need = top() + bottom + CLEAR - (g.y + g.h);
    if (need > 2) {
      scroll.current?.scrollTo({ y: g.y + need, animated: true });
      g.y += need;
    }
  };
  const walked = useRef(m.walked);
  useEffect(() => {
    if (walked.current === m.walked) return;
    walked.current = m.walked;
    if (aimed.current) setTimeout(() => aim(true), 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.walked]);
  if (!snap.settings)
    return (
      <SetupFirst
        title="Learn"
        line="Short lessons wait here, one a day. Setup asks a few things that decide which ones come up first, then lesson 1 is ready."
      />
    );
  const land = view.focus >= 0 ? m.lands[view.focus] : null;
  return (
    <Screen
      scrollRef={scroll}
      hidden={!placed}
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
            : `${lessonCount(walk).done} of ${lessonCount(walk).of} done. One short lesson a day is plenty.`}
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
          setPlaced(p !== 'lessons');
          if (p === 'tools') setView({ focus: -1, win: [0, 2], hide: -1 });
        }}
      />
      <Appear
        key={pane}
        style={{ gap: 16 }}
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
            onCard={reveal}
            win={view.win}
            hide={view.hide}
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
  const { snap } = useStore();
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
          <Text style={[s.dueT, { color: c.violetText }]}>Checkpoint {lcheckNo(due, snap.settings)} is ready: write it out</Text>
          <Icon name="next" size={16} color={c.violetText} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const openLesson = (id: string) => router.push({ pathname: '/lesson/[id]', params: { id } });

/* ---------- lessons ---------- */
function LessonsPane({
  m,
  win,
  hide,
  onGeom,
  onCard,
}: {
  m: LessonMap;
  win: [number, number];
  hide: number;
  onGeom: (g: { y: number; k: number }) => void;
  onCard: (bottom: number) => void;
}) {
  const c = useTheme();
  const { snap, tk } = useStore();
  const st = snap.settings!;
  const [sel, setSel] = useState<string | null>(null);
  const [past, setPast] = useState(false);
  const done = lessonsDone(snap.days);
  const n = done.size;
  const tl = lessonTimeline(snap.days, st);
  const dates = useMemo(() => Object.fromEntries(tl.past.map((x) => [x.L.id, lfDate(x.k, tk)])), [tl.past, tk]);
  const todays = snap.days[tk]?.p?.ls;
  const today = useMemo(() => new Set(todays || []), [todays]);
  const due = lcheckDue(snap.days, st);
  const pair = due ? lcheckPair(due) : null;
  const account = useAccount();
  const sync = useSync();
  const open = (L: Lesson) => lessonOpen(L, done, account);
  const waiting = lessonsLocked(lessonPathFor(st), done, account);
  const [faith, setFaith] = useState(false);
  /* the map's place in the pane and its scale arrive in either order; pass them on once both are known */
  const at = useRef({ y: -1, k: 0 });
  const tell = () => at.current.y >= 0 && at.current.k > 0 && onGeom({ y: at.current.y, k: at.current.k });
  return (
    <View style={{ gap: 16 }}>
      {due ? (
        <Card style={{ backgroundColor: c.violetSoft }}>
          <View style={{ gap: 2 }}>
            <T v="h2">Write it out</T>
            <T v="small">
              Checkpoint {lcheckNo(due, st)}: {LCHECKS[due - 1].t}. About lessons {pair ? lessonNo(pair.a, st) : ''} and {pair ? lessonNo(pair.b, st) : ''}. 3
              to 5 minutes, and only you see it.
            </T>
          </View>
          <Button label="Start writing" onPress={() => router.push({ pathname: '/lwrite/[n]', params: { n: String(due) } })} />
        </Card>
      ) : null}

      {!account && waiting ? (
        <Pressable accessibilityRole="button" onPress={() => sync.signInNow()} style={[s.lockLine, { backgroundColor: c.accentSoft }]}>
          <Icon name="shield" size={22} color={c.accentText} />
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
          today={today}
          waiting={waiting}
          win={win}
          hide={hide}
          sel={sel}
          onSel={setSel}
          onCard={onCard}
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

      {/* said No to faith in the setup: these lessons are off the path, and still here to find */}
      {faithOut(st) ? (
        <Collapse
          title="Faith and recovery"
          sub="Off your path, by your answer in the setup. Here if you ever want them."
          icon="star"
          open={faith}
          onToggle={() => setFaith(!faith)}>
          <View>
            {LESSONS.filter((L) => L.f).map((L) => (
              <LessonRow key={L.id} L={L} done={done.has(L.id)} locked={!open(L)} side={done.has(L.id) ? 'Done' : lmin(L)} sub={L.tag} />
            ))}
          </View>
        </Collapse>
      ) : null}

      {tl.past.length ? (
        <Collapse
          title="In the order you finished them"
          sub={`${n} lesson${n === 1 ? '' : 's'} · last: ${tl.past[tl.past.length - 1].L.title}`}
          icon="calendar"
          open={past}
          onToggle={() => setPast(!past)}>
          <View>
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
  const { snap } = useStore();
  const no = lessonNo(L, snap.settings);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${no ? 'Lesson ' + no : 'Faith lesson'}: ${L.title}. ${done ? 'Done, ' + side + '.' : locked ? 'Opens with a free account.' : side + '.'}`}
      onPress={() => openLesson(L.id)}
      style={({ pressed }) => [s.row, { borderTopColor: c.line, opacity: pressed ? 0.7 : 1 }]}>
      <View style={s.lrIc}>
        {done ? (
          <Icon name="check" size={18} color={c.mintText} />
        ) : locked ? (
          <Icon name="lock" size={18} color={c.muted} />
        ) : /* a lesson off the path has no number */
        no ? (
          <T v="label" style={{ color: t.text }}>
            {no}
          </T>
        ) : (
          <Icon name="star" size={18} color={t.text} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <T v="label">
          {done && no ? <Text style={{ color: c.muted }}>{no} </Text> : null}
          {L.title}
        </T>
        <T v="small" tone="muted" numberOfLines={1}>
          {sub}
        </T>
      </View>
      {side ? (
        <T v="small" tone="muted">
          {side}
        </T>
      ) : null}
    </Pressable>
  );
}

/* ---------- tools ---------- */
function ToolsPane() {
  const { snap, tk, apply } = useStore();
  const st = snap.settings!;
  const p = snap.days[tk]?.p || blankP();
  const g = gameCompute(snap.days, st, snap.reviews, tk);
  const wg = weekGame(snap.days, st, Math.max(0, g.week));
  const tried = urTried(snap.days);
  const sos = useSos();
  /* the same small tags as SOS: how a tool went for you, or, with no record yet, the two that help most */
  const tags = urTags(snap.days, st, tk, sos.mem);
  const any = TOOLS.some((t) => tried[t.id]);
  const fresh = any && TOOLS.some((t) => !tried[t.id]);
  const pin = st.urPin || '';
  const pinT = pin ? TOOLS.find((t) => t.id === pin) : null;
  const [pinOpen, setPinOpen] = useState(false);
  return (
    <>
      <PauseBanner />
      <PracticeDoor />
      <TalkDoor />
      <Card>
        <T v="h2">Pick a tool</T>
        <ToolGrid days={snap.days} tags={tags} onPick={(id) => router.push({ pathname: '/tool/[id]', params: { id } })} />
        <T v="small" tone="muted">
          Today: <Text style={{ fontFamily: font.bodyBold }}>{p.c}</Text> calm move{p.c === 1 ? '' : 's'} · This week:{' '}
          <Text style={{ fontFamily: font.bodyBold }}>{wg.tools}</Text> of {TOOL_IDS.length} tools tried
        </T>
        {fresh ? (
          <T v="small" tone="muted">
            “New” marks a tool you have not used yet. SOS offers those now and then, when an urge is small.
          </T>
        ) : null}
      </Card>
      <Collapse title="My go-to in SOS" sub={pinT ? pinT.name : 'The best fit for the moment'} open={pinOpen} onToggle={() => setPinOpen(!pinOpen)}>
        <T v="small" tone="muted">
          {pinT
            ? 'SOS puts ' + pinT.name + ' first every time. It still keeps track of what helps.'
            : 'SOS learns which tools help you, and picks the best fit for the moment.'}
        </T>
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
      <Rows>
        <LinkCard
          icon="pencil"
          title="Write or edit my reasons"
          sub={`${st.reasons.length} saved · add, reorder, reword`}
          onPress={() => router.push('/reasons')}
        />
        <LinkCard icon="moon" title="Tonight's wind-down" sub="A short checklist for the last hour" onPress={() => router.navigate('/')} />
        <LinkCard icon="life" title="Need a person or a plan?" sub="Free help, scripts, phone setup" onPress={() => router.push('/help')} />
      </Rows>
    </>
  );
}

const s = StyleSheet.create({
  due: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', minHeight: 44, paddingHorizontal: 16, borderRadius: 22 },
  dueT: { fontFamily: font.bodySemi, fontSize: 15 },
  lockLine: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, borderTopWidth: 1 },
  lrIc: { width: 24, alignItems: 'center' },
});
