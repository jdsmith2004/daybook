/* Learn: the short lessons, and the tools to try when it is calm. Lessons read as one timeline: what you finished, in the
   order you finished it; the lesson up next; and what is still to come, a section at a time, each in its own color. The
   page opens with Up next in view. Ported from the legacy viewLearn, lessonsBody and toolsBody. */
import {
  blankP,
  changeSettings,
  gameCompute,
  lcheckDue,
  LCHECKS,
  type Lesson,
  LESSONS,
  lessonNo,
  lessonOpen,
  lessonsDone,
  lessonsLocked,
  lessonTimeline,
  LEARN_FREE,
  lessonPath,
  lfDate,
  lmin,
  LUNITS,
  TOOL_IDS,
  TOOLS,
  urTried,
  weekGame,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';

import { Appear } from '@/components/appear';
import { Collapse, Segments } from '@/components/form';
import { Screen } from '@/components/screen';
import { TalkDoor } from '@/components/talk-card';
import { ToolGrid } from '@/components/tool-grid';
import { LinkCard } from '@/components/link-card';
import { PauseBanner } from '@/components/today-log';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useAccount, useSync } from '@/lib/sync';
import { font, toneOf, useTheme } from '@/lib/theme';

type Pane = 'lessons' | 'tools';

export default function Learn() {
  const params = useLocalSearchParams<{ pane?: string }>();
  const [pane, setPane] = useState<Pane>(params.pane === 'tools' ? 'tools' : 'lessons');
  const { snap } = useStore();
  const scroll = useRef<ScrollViewInstance>(null);
  if (!snap.settings) return <Screen title="Learn">{null}</Screen>;
  return (
    <Screen
      eyebrow="My Daybook"
      scrollRef={scroll}
      title="Learn"
      sub={
        <T tone="muted">
          {pane === 'tools'
            ? 'Try the tools when it is calm, so you know what works when it is not.'
            : 'One short lesson a day is plenty, a section at a time.'}
        </T>
      }>
      <Segments
        label="Learn sections"
        list={[
          ['lessons', 'Lessons'],
          ['tools', 'Tools'],
        ]}
        cur={pane}
        onPick={setPane}
      />
      <Appear key={pane} style={{ gap: 14 }}>
        {pane === 'tools' ? <ToolsPane /> : <LessonsPane scroll={scroll} />}
      </Appear>
    </Screen>
  );
}

const openLesson = (id: string) => router.push({ pathname: '/lesson/[id]', params: { id } });

/* ---------- lessons ---------- */
/** how many finished lessons show before "Show all" */
const PAST_SHOWN = 4;
function LessonsPane({ scroll }: { scroll: React.RefObject<ScrollViewInstance | null> }) {
  const c = useTheme();
  const { snap, tk } = useStore();
  const st = snap.settings!;
  const [all, setAll] = useState(false);
  const done = lessonsDone(snap.days);
  const n = done.size;
  const total = LESSONS.length;
  const tl = lessonTimeline(snap.days);
  const nxt = tl.next;
  const due = lcheckDue(snap.days, st);
  const account = useAccount();
  const sync = useSync();
  const open = (L: Lesson) => lessonOpen(L, done, account);
  const waiting = lessonsLocked(LESSONS, done, account);
  const past = all ? tl.past : tl.past.slice(-PAST_SHOWN);
  const hidden = tl.past.length - past.length;
  /* the page opens with Up next in view, once there is a list of finished lessons above it */
  const aimed = useRef(false);
  const aim = (y: number) => {
    if (aimed.current || tl.past.length < 2) return;
    aimed.current = true;
    setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y - 12), animated: false }), 60);
  };
  const paneY = useRef(0);
  const nt = nxt ? toneOf(c, LUNITS[nxt.u].tone) : null;
  return (
    <View style={{ gap: 14 }} onLayout={(e) => (paneY.current = e.nativeEvent.layout.y)}>
      <Card style={{ gap: 10 }}>
        <View style={s.between}>
          <T v="h2">{n === total ? 'All done' : n ? 'Your path' : 'Start here'}</T>
          <T v="label" tone="muted">
            {n} of {total} done
          </T>
        </View>
        <View style={s.segs} accessible accessibilityLabel={`${n} of ${total} lessons done`}>
          {lessonPath().map((L) => (
            <View key={L.id} style={[s.segI, { backgroundColor: done.has(L.id) ? toneOf(c, LUNITS[L.u].tone).ic : c.surface2 }]} />
          ))}
        </View>
        <T v="small" tone="muted">
          One section at a time, each in its own color. Finishing a lesson earns 10 points, once.
        </T>
      </Card>

      {tl.past.length ? (
        <Card>
          <View style={s.between}>
            <T v="h2" accessibilityRole="header">
              Finished
            </T>
            <T v="small" tone="muted">
              in the order you did them
            </T>
          </View>
          {hidden ? (
            <Pressable accessibilityRole="button" onPress={() => setAll(true)} style={s.more}>
              <Icon name="up" size={16} color={c.accentText} />
              <Text style={[s.moreT, { color: c.accentText }]}>Show the {hidden} before these</Text>
            </Pressable>
          ) : null}
          <View style={{ gap: 8 }}>
            {past.map((x, i) => (
              <LessonRow
                key={x.L.id}
                L={x.L}
                done
                side={i === past.length - 1 ? 'Last · ' + lfDate(x.k, tk) : lfDate(x.k, tk)}
                sub={(st.learn.prac && st.learn.prac[x.L.id] ? 'Practiced · ' : '') + LUNITS[x.L.u].name}
              />
            ))}
          </View>
        </Card>
      ) : null}

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

      {nxt && nt ? (
        <View onLayout={(e) => aim(paneY.current + e.nativeEvent.layout.y)} style={[s.next, { backgroundColor: nt.soft }]}>
          <View style={s.eye}>
            <View style={[s.dot, { backgroundColor: nt.ic }]} />
            <Text style={[s.eyeT, { color: nt.text }]}>{(n ? 'Up next · ' : 'Start here · ') + LUNITS[nxt.u].name.toUpperCase()}</Text>
          </View>
          <View style={s.hhTop}>
            <View style={[s.hhIc, { backgroundColor: c.surface }]}>
              <Icon name={open(nxt) ? nxt.ic : 'lock'} size={24} color={nt.text} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.nextT, { color: c.ink }]}>
                {lessonNo(nxt)}. {nxt.title}
              </Text>
              <T v="small">{nxt.tag}</T>
            </View>
          </View>
          {open(nxt) ? (
            <Button label={'Start lesson ' + lessonNo(nxt) + ' · ' + lmin(nxt)} onPress={() => openLesson(nxt.id)} />
          ) : (
            <>
              <T v="small">You have read the open lessons. A free account opens the other {waiting}, and keeps your progress safe.</T>
              <Button label="Create an account or sign in" onPress={() => sync.signInNow()} />
            </>
          )}
        </View>
      ) : n === total ? (
        <Card style={{ backgroundColor: c.mintSoft, borderColor: c.mintSoft }}>
          <T v="h2">You have finished every lesson</T>
          <T v="small">They stay here whenever you want to read one again. Tap any lesson above to open it.</T>
        </Card>
      ) : null}

      {!account && waiting && nxt && open(nxt) ? (
        <Pressable accessibilityRole="button" onPress={() => sync.signInNow()} style={[s.lockLine, { backgroundColor: c.accentSoft }]}>
          <Icon name="lock" size={18} color={c.accentText} />
          <T v="small" style={{ flex: 1, color: c.accentText, fontFamily: font.bodySemi }}>
            {LEARN_FREE} lessons are free. A free account opens the other {waiting}.
          </T>
          <Icon name="next" size={16} color={c.accentText} />
        </Pressable>
      ) : null}

      {tl.coming.length ? (
        <View style={{ gap: 4, marginTop: 4 }}>
          <T v="h2" accessibilityRole="header">
            Still to come
          </T>
          <T v="small" tone="muted">
            In order, a section at a time. You can open any lesson whenever you like.
          </T>
        </View>
      ) : null}
      {tl.coming.map((x) => {
        const u = LUNITS[x.u];
        const t = toneOf(c, u.tone);
        return (
          <View key={x.u} style={[s.sec, { backgroundColor: t.soft }]}>
            <View style={s.secTop}>
              <View style={[s.dot, { backgroundColor: t.ic }]} />
              <Text style={[s.secT, { color: t.text }]}>{u.name}</Text>
              <T v="small" style={{ color: t.text, fontFamily: font.bodySemi }}>
                {x.done ? x.done + ' of ' + x.n + ' done' : x.n + ' lessons'}
              </T>
            </View>
            <T v="small" tone="muted">
              {u.sub}
            </T>
            <View style={{ gap: 8 }}>
              {x.left.map((L) => (
                <LessonRow key={L.id} L={L} locked={!open(L)} side={open(L) ? lmin(L) : ''} sub={L.tag} />
              ))}
            </View>
          </View>
        );
      })}

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
