/* The cards on Today. Every number and sentence comes from @daybook/core, which is checked against the legacy app. */
import {
  cleanKeep,
  cleanOk,
  cleanView,
  daysCardText,
  fmtDate,
  nextLine,
  plural,
  runChips,
  stepCard,
  stepGrad,
  stepNo,
  stepOffer,
  stepOn,
  WINS,
  type CellKind,
  type CleanView,
  type GameState,
  type Snapshot,
} from '@daybook/core';
import { StyleSheet, View } from 'react-native';

import { Bar, Button, Card, Icon, T } from '@/components/ui';
import { Flame } from '@/components/flame';
import { useStore } from '@/lib/store';
import { font, useTheme, type Palette } from '@/lib/theme';

/* ---------- the flame: level, points, today's wins ---------- */
export function FlameCard({ g }: { g: GameState }) {
  const c = useTheme();
  const lvl = g.level;
  const wins = WINS.filter((w) => !g.wins.na[w.k]);
  return (
    <Card>
      <View style={s.row}>
        <Flame level={lvl.n} size={92} />
        <View style={{ flex: 1, gap: 6 }}>
          <T v="label" tone="muted">
            Level {lvl.n} · {lvl.name}
          </T>
          <View style={s.baseline}>
            <T style={s.pts}>{g.pts.toLocaleString('en-US')}</T>
            <T tone="muted">points</T>
            {g.todayPts.total > 0 ? (
              <T v="label" tone="mintText">
                +{g.todayPts.total} today
              </T>
            ) : null}
          </View>
          <Bar frac={lvl.frac} from={c.sun} track={c.surface2} height={10} />
          <T v="small" tone="muted">
            {nextLine(lvl)}
          </T>
        </View>
      </View>
      {wins.length ? (
        <View style={{ gap: 8 }}>
          <T v="label">
            Daily wins · {g.tally.n} of {g.tally.t}
          </T>
          <View style={s.wrap}>
            {wins.map((w) => {
              const done = g.wins[w.k];
              return (
                <View
                  key={w.k}
                  accessibilityLabel={`${w.name}: ${done ? 'done' : w.tip}`}
                  style={[s.win, { backgroundColor: done ? c.mintSoft : c.surface2 }]}>
                  <Icon name={done ? 'check' : w.ic} size={16} color={done ? c.mintText : c.muted} />
                  <T v="small" tone={done ? 'mintText' : 'muted'} style={{ fontFamily: font.bodySemi }}>
                    {w.name}
                  </T>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

/* ---------- the Days card: the month, the run, the next goal ---------- */
const cellStyle = (kind: CellKind, c: Palette) => {
  switch (kind) {
    case 'ok':
    case 'one':
      return { backgroundColor: c.mint };
    case 'saved':
      return { backgroundColor: c.mint, borderWidth: 3, borderColor: c.saved };
    case 'slip':
      return { backgroundColor: c.slip, borderRadius: 7 };
    case 'open':
      return { backgroundColor: c.slip, borderRadius: 7, borderWidth: 3, borderColor: c.slipSoft };
    case 'ahead':
      return { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.line };
    default:
      return { backgroundColor: c.surface2 };
  }
};
const KIND_WORD: Record<string, string> = {
  ok: 'no slip',
  one: 'one slip, still counts',
  slip: 'slip',
  saved: 'slip, run saved',
  open: 'slip, run on the line',
  before: 'before Day 1',
  ahead: 'ahead',
};
const dowOf = (k: string) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10), 12).getDay();

function MonthGrid({ v, legend }: { v: CleanView; legend: [CellKind, string][] }) {
  const c = useTheme();
  const blanks = dowOf(v.first);
  const kinds = new Set(v.cells.map((x) => x.kind));
  return (
    <View style={{ gap: 8 }}>
      <View style={s.grid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <View key={'h' + i} style={s.cellBox}>
            <T v="small" tone="muted" style={{ textAlign: 'center', fontFamily: font.bodySemi }}>
              {d}
            </T>
          </View>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <View key={'b' + i} style={s.cellBox} />
        ))}
        {v.cells.map((x) => (
          <View key={x.k} style={s.cellBox}>
            <View
              accessible
              accessibilityLabel={`${fmtDate(x.k, { weekday: 'short', month: 'short', day: 'numeric' })}: ${KIND_WORD[x.kind]}${x.today ? ' (today, so far)' : ''}`}
              style={[s.cell, cellStyle(x.kind, c), x.today && { outlineColor: c.accent, outlineWidth: 2, outlineOffset: 2, outlineStyle: 'solid' }]}
            />
          </View>
        ))}
      </View>
      <View style={s.wrap}>
        {legend
          .filter(([k]) => k === 'ok' || kinds.has(k))
          .map(([k, label]) => (
            <View key={k} style={s.legend}>
              <View style={[s.cellSm, cellStyle(k, c)]} />
              <T v="small" tone="muted">
                {label}
              </T>
            </View>
          ))}
      </View>
    </View>
  );
}

function Chips({ v }: { v: CleanView }) {
  const c = useTheme();
  const ch = runChips(v);
  const tones = {
    line: { bg: c.slipSoft, fg: 'slipText' as const },
    soft: { bg: c.mintSoft, fg: 'mintText' as const },
    run: { bg: c.surface2, fg: 'ink' as const },
  }[ch.main.kind];
  return (
    <View style={{ gap: 10 }}>
      <View style={s.wrap}>
        <View style={[s.chip, { backgroundColor: tones.bg }]}>
          {ch.main.small ? (
            <T v="small" tone={tones.fg === 'ink' ? 'muted' : tones.fg} style={{ fontFamily: font.bodySemi }}>
              {ch.main.small}
            </T>
          ) : null}
          <T v="label" tone={tones.fg}>
            {ch.main.text}
            {ch.main.saved ? <T v="label" tone="muted">{` · ${ch.main.saved} saved`}</T> : null}
          </T>
        </View>
        {ch.longest ? (
          <View style={[s.chip, { backgroundColor: c.surface2 }]}>
            <T v="small" tone="muted" style={{ fontFamily: font.bodySemi }}>
              Longest run
            </T>
            <T v="label">{ch.longest}</T>
          </View>
        ) : null}
        {ch.next ? (
          <View style={[s.chip, { backgroundColor: c.violetSoft }]}>
            <T v="small" tone="violetText" style={{ fontFamily: font.bodySemi }}>
              Next goal
            </T>
            <T v="label" tone="violetText">
              {ch.next}
            </T>
          </View>
        ) : null}
      </View>
      {ch.line ? (
        <View style={s.row}>
          <Icon name="flame" color={c.slip} />
          <T v="small" style={{ flex: 1 }}>
            {ch.line}
          </T>
        </View>
      ) : null}
    </View>
  );
}

export function DaysCard({ snap, tk, now }: { snap: Snapshot; tk: string; now: number }) {
  const st = snap.settings!;
  const v = cleanView(snap.days, st, tk, now);
  const t = daysCardText(snap.days, st, v, tk);
  if (t.tracking) {
    const f = t.facts;
    const sub =
      v.phase === 'before'
        ? `Tracking starts ${fmtDate(st.start, { weekday: 'long', month: 'short', day: 'numeric' })}.`
        : st.day1
          ? `Counting starts ${fmtDate(st.day1, { weekday: 'long', month: 'short', day: 'numeric' })}. Until then you only log, so nothing can be failed.`
          : 'No days are being counted. Log, check in, learn and use the tools. Start a Day 1 whenever you want.';
    const fact = (n: number, one: string, many: string) => (
      <View style={s.fact}>
        <T style={s.factBig}>{n}</T>
        <T v="small" tone="muted">
          {n === 1 ? one : many}
        </T>
      </View>
    );
    return (
      <Card>
        <T v="eyebrow" tone="muted">
          {t.eyebrow}
        </T>
        <View style={s.facts}>
          {fact(f.dl, 'day logged', 'days logged')}
          {fact(f.rode, 'urge ridden out', 'urges ridden out')}
          {fact(f.slips, 'slip logged', 'slips logged')}
        </View>
        <T v="small" tone="muted">
          {sub}
        </T>
      </Card>
    );
  }
  if (t.step) return <StepCard snap={snap} tk={tk} now={now} />;
  const gentle = v.mode === 'gentle';
  const legend: [CellKind, string][] = [['ok', 'No slip']];
  if (gentle) legend.push(['one', 'One slip, still counts'], ['slip', 'Two or more']);
  else legend.push(['slip', 'Slip']);
  legend.push(['saved', 'Slip, run saved'], ['open', 'Slip, run on the line']);
  return (
    <Card>
      <View style={s.between}>
        <T v="eyebrow" tone="muted">
          {t.eyebrow}
        </T>
        <T v="small" tone="muted">
          {fmtDate(v.first, { month: 'short', day: 'numeric' })} to today
        </T>
      </View>
      <View style={s.baseline}>
        <T v="big">{t.good}</T>
        <T tone="muted" style={{ fontSize: 16 }}>
          {t.of}
        </T>
      </View>
      <T v="small" tone="muted">
        {t.sub}
      </T>
      <MonthGrid v={v} legend={legend} />
      <Chips v={v} />
    </Card>
  );
}

/* ---------- step down ---------- */
function StepCard({ snap, tk, now }: { snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const { apply } = useStore();
  const st = snap.settings!;
  const k = stepCard(snap.days, st, now);
  const fact = (f: { big: string; text: string }, key: string) => (
    <View style={s.fact} key={key}>
      <T style={s.factBig}>{f.big}</T>
      <T v="small" tone="muted">
        {f.text}
      </T>
    </View>
  );
  return (
    <Card>
      <T v="eyebrow" tone="muted">
        Step down
      </T>
      <View style={s.baseline} accessibilityLabel={`${k.hero} ${k.heroSub}`}>
        <T v="big">{k.hero}</T>
        <T tone="muted" style={{ fontSize: 16 }}>
          {k.heroSub}
        </T>
      </View>
      <Bar frac={k.pct / 100} from={c.sun} />
      <T v="label" tone="sunText">
        {k.goalLine}
      </T>
      <View style={s.facts}>{[fact(k.week, 'w'), fact(k.wait, 'x'), fact(k.best, 'b')]}</View>
      {k.hh ? (
        <View style={[s.note, { backgroundColor: k.hh.state === 'won' ? c.mintSoft : c.violetSoft }]}>
          <Icon name={k.hh.state === 'won' ? 'check' : 'moon'} color={k.hh.state === 'won' ? c.mintText : c.violetText} />
          <T v="small" tone={k.hh.state === 'won' ? 'mintText' : 'violetText'} style={{ flex: 1 }}>
            {k.hh.text}
            {k.hh.won ? ` ${k.hh.won}` : ''}
          </T>
        </View>
      ) : null}
      {k.ready ? (
        <View style={[s.box, { backgroundColor: c.sunSoft }]}>
          <T>
            <T v="label">You are ready to count days.</T> {k.ready} Counting days is the next step, and your points and badges come
            with you.
          </T>
          <Button label="Start counting days" onPress={() => apply(stepGrad(st, tk))} />
        </View>
      ) : null}
      {k.help ? (
        <View style={[s.box, { backgroundColor: c.coralSoft }]}>
          <T tone="coralText">
            <T v="label" tone="coralText">
              This is a strong pull.
            </T>{' '}
            That is what therapy and groups are for. Bringing in more help is not failing. It is adding tools.
          </T>
        </View>
      ) : null}
    </Card>
  );
}

/* ---------- the notes and the offer ---------- */
export function CountNotes({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const { apply } = useStore();
  const st = snap.settings!;
  if (st.cleanNote?.m === 'step') {
    return (
      <Card tone="note">
        <T v="h2">A plan for where you are</T>
        <T>Slips have landed on most days this week. That is a hard loop, and it is common, especially after years of trying.</T>
        <T>
          So Daybook switched to the step-down plan: longer stretches between slips, and fewer slips each week. The goal is still to
          quit. This is how you get there.
        </T>
        <View style={[s.box, { backgroundColor: c.surface }]}>
          <T v="label">Years of trying is not proof you cannot. It is practice.</T>
          <T v="small" tone="muted">
            Many people who quit smoking needed 30 or more tries. And in a small trial, a skills-based therapy cut porn viewing by
            about 93%. This habit can change.
          </T>
        </View>
        <View style={s.actions}>
          <Button label="Okay" onPress={() => apply(cleanOk(st))} />
          <Button label="Keep counting days" kind="ghost" onPress={() => apply(cleanKeep(st, tk))} />
        </View>
        <T v="small" tone="muted">
          You can switch any time in Settings.
        </T>
      </Card>
    );
  }
  if (st.cleanNote) {
    return (
      <Card tone="note">
        <T v="h2">A gentler way to count, for now</T>
        <T>
          The last few days have been hard. That is common when you are changing a habit, and you are still here and still logging
          honestly. That matters more than any count.
        </T>
        <T>Until things settle, a day counts as a good day with one slip or fewer. Every slip is still logged and nothing is taken away.</T>
        <View style={s.actions}>
          <Button label="Okay" onPress={() => apply(cleanOk(st))} />
          <Button label="Keep strict counting" kind="ghost" onPress={() => apply(cleanKeep(st, tk))} />
        </View>
      </Card>
    );
  }
  if (stepOffer(snap.days, st, tk)) {
    return (
      <Card tone="note">
        <T v="h2">Slips on most days lately?</T>
        <T>
          That is a hard loop to break, and it is common. The step-down plan aims for longer stretches between slips and fewer slips
          each week, instead of a run you lose every day or two. The goal is still to quit. This is a way to get there.
        </T>
        <View style={s.actions}>
          <Button label="Try step down" onPress={() => apply(stepOn(st, tk))} />
          <Button label="Not now" kind="ghost" onPress={() => apply(stepNo(st, tk))} />
        </View>
      </Card>
    );
  }
  return null;
}

/* ---------- this week's quests ---------- */
export function QuestsCard({ g }: { g: GameState }) {
  const c = useTheme();
  if (!g.quests.length) return null;
  return (
    <Card>
      <View style={s.between}>
        <T v="eyebrow" tone="muted">
          This week’s quests
        </T>
        <T v="small" tone="muted">
          +15 points each
        </T>
      </View>
      {g.quests.map((q) => (
        <View key={q.id} style={{ gap: 6 }}>
          <View style={s.between}>
            <T v="label" style={{ flex: 1 }}>
              {q.done ? '✓ ' : ''}
              {q.name}
            </T>
            <T v="small" tone={q.done ? 'mintText' : 'muted'}>
              {q.now} of {plural(q.goal, q.unit.replace(/s$/, ''))}
            </T>
          </View>
          <Bar frac={q.now / q.goal} from={q.done ? c.mint : c.accent} height={8} />
          {!q.done ? (
            <T v="small" tone="muted">
              {q.hint}
            </T>
          ) : null}
        </View>
      ))}
    </Card>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  baseline: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 10, rowGap: 2 },
  pts: { fontFamily: font.display, fontSize: 32, lineHeight: 36 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  win: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  cellBox: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center' },
  cell: { width: 26, height: 26, borderRadius: 13 },
  cellSm: { width: 12, height: 12, borderRadius: 6 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  facts: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, gap: 2 },
  factBig: { fontFamily: font.display, fontSize: 24, lineHeight: 28 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16 },
  box: { gap: 10, padding: 14, borderRadius: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
