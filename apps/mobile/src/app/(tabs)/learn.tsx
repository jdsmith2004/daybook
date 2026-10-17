/* Learn: the short lessons, and the tools to try when it is calm. Ported from the legacy viewLearn, lessonsBody and toolsBody. */
import {
  blankP,
  faithOf,
  firstUndone,
  gameCompute,
  lastRead,
  lcheckDue,
  LCHECKS,
  LESSONS,
  lessonFilter,
  lessonIndex,
  lessonOpen,
  lessonsLocked,
  lessonRow,
  lessonsDone,
  lessonStats,
  lfDate,
  LF_FILTERS,
  LF_ORDER,
  LUNITS,
  setFaithOrder,
  TOOL_IDS,
  TOOLS,
  urTried,
  weekGame,
  changeSettings,
  type Lesson,
} from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Appear } from '@/components/appear';
import { Collapse, Segments } from '@/components/form';
import { Screen } from '@/components/screen';
import { ToolGrid, toolTone } from '@/components/tool-grid';
import { LinkCard } from '@/components/link-card';
import { PauseBanner } from '@/components/today-log';
import { Button, Card, Chip, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useAccount, useSync } from '@/lib/sync';
import { font, useTheme } from '@/lib/theme';

type Pane = 'lessons' | 'tools';

export default function Learn() {
  const params = useLocalSearchParams<{ pane?: string }>();
  const [pane, setPane] = useState<Pane>(params.pane === 'tools' ? 'tools' : 'lessons');
  const { snap } = useStore();
  if (!snap.settings) return <Screen title="Learn">{null}</Screen>;
  return (
    <Screen
      eyebrow="My Daybook"
      title="Learn"
      sub={
        <T tone="muted">
          {pane === 'tools' ? 'Try the tools when it is calm, so you know what works when it is not.' : 'One short lesson a day is plenty. Any order is fine.'}
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
        {pane === 'tools' ? <ToolsPane /> : <LessonsPane />}
      </Appear>
    </Screen>
  );
}

const openLesson = (id: string) => router.push({ pathname: '/lesson/[id]', params: { id } });

/* ---------- lessons ---------- */
function LessonsPane() {
  const c = useTheme();
  const { snap, tk, apply, say } = useStore();
  const st = snap.settings!;
  const [f, setF] = useState<'all' | 'todo' | 'done' | 'notes'>('all');
  const [orderOpen, setOrderOpen] = useState(false);
  const done = lessonsDone(snap.days);
  const n = done.size;
  const total = LESSONS.length;
  const mode = faithOf(st);
  const nxt = firstUndone(done, mode);
  const stats = lessonStats(snap.days);
  const lastL = lastRead(snap.days);
  const notes = st.learn.notes || {};
  const nf = LESSONS.filter((L) => L.f).length;
  const due = lcheckDue(snap.days, st);
  const account = useAccount();
  const sync = useSync();
  const open = (L: Lesson) => lessonOpen(L, done, mode, account);
  const waiting = lessonsLocked(LESSONS, done, mode, account);
  const counts = { all: total, todo: total - n, done: n, notes: LESSONS.filter((L) => notes[L.id] && String(notes[L.id]).trim()).length };
  const rows = (arr: Lesson[], full: boolean) => (
    <View style={{ gap: 8 }}>
      {arr.map((L) => (
        <LessonRow key={L.id} L={L} r={lessonRow(L, done, nxt && nxt.id, st, stats, tk, full)} locked={!open(L)} />
      ))}
    </View>
  );
  return (
    <>
      <Card style={{ backgroundColor: c.skySoft, borderColor: c.skySoft }}>
        <View style={s.hhTop}>
          <View style={[s.hhIc, { backgroundColor: c.surface }]}>
            <Icon name="book" size={24} color={c.skyText} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <T v="h2">{n === total ? 'All done' : n ? 'Keep going' : 'Start anywhere'}</T>
            <T v="small">Pick Quick (1 to 2 minutes) or Full (3 to 5) for each lesson. Finishing one earns 10 points, once.</T>
          </View>
          <T v="label" tone="skyText">
            {n} of {total}
          </T>
        </View>
        <View style={s.segs} accessible accessibilityLabel={`${n} of ${total} lessons done`}>
          {LESSONS.map((L) => (
            <View key={L.id} style={[s.segI, { backgroundColor: done.has(L.id) ? c.sky : c.surface }]} />
          ))}
        </View>
        {nxt ? (
          <View style={{ gap: 2 }}>
            <T v="small" tone="skyText">
              {n ? 'Up next' : 'Start here'}
            </T>
            <T v="label">
              Lesson {lessonIndex(nxt) + 1}: {nxt.title}
            </T>
          </View>
        ) : null}
        <View style={{ gap: 8 }}>
          {nxt && open(nxt) ? <Button label={n ? 'Continue' : 'Start lesson ' + (lessonIndex(nxt) + 1)} onPress={() => openLesson(nxt.id)} /> : null}
          {nxt && !open(nxt) ? (
            <>
              <T v="small">You have read the open lessons. A free account opens the other {waiting}, and keeps your progress safe.</T>
              <Button label="Create an account or sign in" onPress={() => sync.signInNow()} />
            </>
          ) : null}
          {lastL ? <Button kind="ghost" label="Read last again" onPress={() => openLesson(lastL.id)} /> : null}
        </View>
        {lastL ? (
          <T v="small" tone="muted">
            Last read: lesson {lessonIndex(lastL) + 1}, {lastL.title}
            {stats.last[lastL.id] ? ' (' + lfDate(stats.last[lastL.id], tk) + ')' : ''}.
          </T>
        ) : null}
      </Card>
      {due ? (
        <Card style={{ backgroundColor: c.violetSoft, borderColor: c.violetSoft }}>
          <View style={s.hhTop}>
            <View style={[s.hhIc, { backgroundColor: c.surface }]}>
              <Icon name="pencil" size={22} color={c.violetText} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="h2">Write it out</T>
              <T v="small">
                Checkpoint {due}: {LCHECKS[due - 1].t}. A short piece of writing about lessons {2 * due - 1} and {2 * due}. 3 to 5 minutes, no points, only you see it.
              </T>
            </View>
          </View>
          <Button label="Start writing" onPress={() => router.push({ pathname: '/lwrite/[n]', params: { n: String(due) } })} />
        </Card>
      ) : null}
      <View style={s.chips} accessibilityLabel="Show these lessons">
        {LF_FILTERS.map(([k, name]) => (
          <Chip key={k} label={`${name} ${counts[k]}`} on={f === k} onPress={() => setF(k)} />
        ))}
      </View>
      {nf ? (
        <Collapse title="Daily order" sub={'Faith lessons: ' + LF_ORDER.find((o) => o[0] === mode)![1].toLowerCase()} open={orderOpen} onToggle={() => setOrderOpen(!orderOpen)}>
          <T v="small" tone="muted">
            This only changes which lesson Daybook offers next. The {nf} faith lessons are in the last unit, and you can open any lesson at any time.
          </T>
          <View style={s.chips}>
            {LF_ORDER.map(([k, name]) => (
              <Chip
                key={k}
                label={name}
                on={mode === k}
                onPress={() => {
                  apply({ st: setFaithOrder(st, k) });
                  say('Saved. Up next follows this order.');
                }}
              />
            ))}
          </View>
          <T v="small" tone="muted">
            {mode === 'mix'
              ? 'Mixed in: one faith lesson after every two others.'
              : mode === 'first'
                ? 'First: the faith lessons come before the others.'
                : 'Last: the faith lessons come after the others. This is the usual order.'}
          </T>
        </Collapse>
      ) : null}
      {f === 'all' ? (
        /* the faith unit is listed last, after the units added later */
        LUNITS.map((u, k) => ({ u, k }))
          .sort((a, b) => Number(!!a.u.faith) - Number(!!b.u.faith))
          .map(({ u, k }, j) => {
            const ls = LESSONS.filter((L) => L.u === k);
            const dn = ls.filter((L) => done.has(L.id)).length;
            return (
              <Card key={k}>
                <T v="eyebrow" tone="muted">
                  Unit {j + 1} · {dn} of {ls.length} done
                </T>
                <T v="h2" accessibilityRole="header">
                  {u.name}
                </T>
                <T v="small" tone="muted">
                  {u.sub}
                </T>
                {u.faith ? (
                  <T v="small" tone="muted">
                    {mode === 'mix' ? 'In your daily order, one comes after every two other lessons.' : mode === 'first' ? 'In your daily order, these come first.' : 'In your daily order, these come last.'}
                  </T>
                ) : null}
                {rows(ls, false)}
              </Card>
            );
          })
      ) : (
        <FilterList f={f} rows={rows} />
      )}
      <LinkCard icon="compass" title="What I have learned" sub={n ? 'Your takeaways and notes, in My plan' : 'Fills in as you finish lessons'} onPress={() => router.push({ pathname: '/plan', params: { pane: 'learned' } })} />
      <T v="small" tone="muted">
        The lessons put research into plain words and stay within what each study found. They are not medical advice. Each one lists its sources. The faith lessons rest on the 12 steps and on research, not on any one church’s teaching.
      </T>
    </>
  );
}

function FilterList({ f, rows }: { f: 'todo' | 'done' | 'notes'; rows: (arr: Lesson[], full: boolean) => React.ReactNode }) {
  const { snap } = useStore();
  const r = lessonFilter(snap.days, snap.settings!, f);
  return (
    <Card>
      <View style={s.between}>
        <T v="h2">{r.title}</T>
        <T v="small" tone="muted">
          {r.list.length} · {r.sub}
        </T>
      </View>
      {r.list.length ? rows(r.list, f !== 'todo') : <T tone="muted">{r.empty}</T>}
    </Card>
  );
}

function LessonRow({ L, r, locked }: { L: Lesson; r: ReturnType<typeof lessonRow>; locked?: boolean }) {
  const c = useTheme();
  const [soft, ink] = toolTone(c, LUNITS[L.u].tone);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={r.label}
      onPress={() => openLesson(L.id)}
      style={({ pressed }) => [s.row, { backgroundColor: r.d ? c.surface2 : c.surface, borderColor: c.cardEdge, opacity: pressed ? 0.85 : 1 }]}>
      <View style={s.rowTop}>
        <View style={[s.lrIc, { backgroundColor: r.d ? c.mintSoft : soft }]}>
          <Icon name={r.d ? 'check' : locked ? 'lock' : L.ic} size={20} color={r.d ? c.mintText : ink} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.lrT, { color: c.ink }]}>
            <Text style={{ color: c.muted }}>{r.n} </Text>
            {L.title}
          </Text>
          <T v="small" tone="muted">
            {r.faith ? <T v="small" tone="sunText">{'Faith · '}</T> : null}
            {r.sub}
          </T>
        </View>
        <T v="small" tone={locked ? 'muted' : r.status.kind === 'done' ? 'mintText' : r.status.kind === 'next' ? 'accentText' : 'muted'} style={{ fontFamily: font.bodySemi }}>
          {locked ? 'With an account' : r.status.text}
        </T>
      </View>
      {r.more ? (
        <View style={{ gap: 6, paddingTop: 4 }}>
          <T v="small">
            <T v="small" tone="muted" style={{ fontStyle: 'italic' }}>
              {'The one thing to keep: '}
            </T>
            {r.more.key}
          </T>
          {r.more.note ? (
            <T v="small">
              <T v="small" tone="muted" style={{ fontStyle: 'italic' }}>
                {r.more.np + ': '}
              </T>
              {r.more.note}
            </T>
          ) : null}
        </View>
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
        <ToolGrid days={snap.days} onPick={(id) => router.push({ pathname: '/tool/[id]', params: { id } })} />
        <T v="small">
          Today: <Text style={{ fontFamily: font.bodyBold }}>{p.c}</Text> calm move{p.c === 1 ? '' : 's'} · This week: <Text style={{ fontFamily: font.bodyBold }}>{wg.tools}</Text> of {TOOL_IDS.length} tools tried
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
          {pinT ? 'SOS puts ' + pinT.name + ' first every time. It still keeps track of what helps.' : 'SOS learns which tools help you, and picks the best fit for the moment.'}
        </T>
      </Card>
      <View style={{ gap: 8 }}>
        <LinkCard icon="pencil" title="Write or edit my reasons" sub={`${st.reasons.length} saved · add, reorder, reword`} onPress={() => router.push('/reasons')} />
        <LinkCard icon="moon" title="Tonight's wind-down" sub="A short checklist for the last hour" onPress={() => router.navigate('/')} />
        <LinkCard icon="life" title="Need a person or a plan?" sub="Free help, scripts, phone setup" onPress={() => router.push('/help')} />
      </View>
      <View style={{ height: 1, backgroundColor: c.line, opacity: 0 }} />
    </>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  hhTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  hhIc: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  segs: { flexDirection: 'row', gap: 2 },
  segI: { flex: 1, height: 8, borderRadius: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { padding: 12, borderRadius: 16, borderWidth: 1.5, gap: 4 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lrIc: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  lrT: { fontFamily: font.bodyBold, fontSize: 15.5, lineHeight: 20 },
});
