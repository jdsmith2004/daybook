/* The cards on Today. Every number and sentence comes from @daybook/core, which is checked against the legacy app. */
import {
  GRAD_DAYS,
  gradInfo,
  gradLine,
  cleanKeep,
  cleanOk,
  cleanView,
  daysCardText,
  fmtDate,
  setCountMode,
  runChips,
  stepCard,
  stepGrad,
  stepRuler,
  stepWeek,
  stepNo,
  stepOffer,
  stepOn,
  type CleanView,
  type Snapshot,
  habitOf,
} from '@daybook/core';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { StretchRuler, WeekDots } from '@/components/step-art';
import { Bar, Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/* ---------- the count on Days: the mode's one count, as Today shows it, and what stays on the record ----------
   It sits on the page under the month, with no card: the number big, then what stays earned side by side. */
function Figure({ big, small, first }: { big: string | number; small: string; first?: boolean }) {
  const c = useTheme();
  return (
    <View style={[s.figure, { borderLeftColor: c.line }, first && s.figFirst]}>
      <Text style={[s.figBig, { color: c.ink }]}>{big}</Text>
      <T v="small" tone="muted">
        {small}
      </T>
    </View>
  );
}

function Chips({ v }: { v: CleanView }) {
  const ch = runChips(v);
  const all = [
    /* a slip told with no time has no true hours: when it was instead (core view.ts slipWhen) */
    ch.hours ? ([v.slipWhen ? 'Last slip' : 'Since your last slip', ch.hours] as const) : null,
    ch.longest ? (['Longest run', ch.longest] as const) : null,
    ch.noSlip ? (['No-slip days', ch.noSlip] as const) : null,
    ch.next ? (['Next goal', ch.next] as const) : null,
  ].filter((x) => x != null);
  if (!all.length) return null;
  return (
    <View style={s.figures}>
      {all.map(([small, big], i) => (
        <Figure key={small} big={big} small={small} first={i % 3 === 0} />
      ))}
    </View>
  );
}

/** on Days, under the month calendar (size 'lg'); step down's count takes the size too */
export function DaysCard({ snap, tk, now, size = 'lg' }: { snap: Snapshot; tk: string; now: number; size?: 'sm' | 'lg' }) {
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
    return (
      <View style={s.count}>
        <T v="small" tone="muted">
          {t.eyebrow}
        </T>
        {/* day 0: one warm line, not three zeros */}
        {f.dl || f.rode || f.slips ? (
          <View style={s.figures}>
            <Figure first big={f.dl} small={f.dl === 1 ? 'day logged' : 'days logged'} />
            <Figure big={f.rode} small={f.rode === 1 ? 'urge ridden out' : 'urges ridden out'} />
            <Figure big={f.slips} small={f.slips === 1 ? 'slip logged' : 'slips logged'} />
          </View>
        ) : (
          <T style={{ fontSize: 17, lineHeight: 24 }}>Nothing logged yet. Your first entry starts the log.</T>
        )}
        <T v="small" tone="muted">
          {sub} <LinkText label="How this works" onPress={() => router.push('/mode')} />
        </T>
      </View>
    );
  }
  if (t.step) return <StepCard snap={snap} tk={tk} now={now} size={size} v={v} />;
  return (
    <View style={s.count}>
      <View>
        <T v="small" tone="muted">
          {t.eyebrow}
        </T>
        <View style={s.baseline}>
          <T v="big">{t.big}</T>
          <T v="h2">{t.of}</T>
        </View>
        <T tone="muted">{t.sub}</T>
      </View>
      <Chips v={v} />
      <GradRow snap={snap} tk={tk} />
      <LinkText label="How I count days" onPress={() => router.push({ pathname: '/settings', params: { open: 's-count' } })} />
    </View>
  );
}

/** the way to graduation, once the first week is behind the person (graduate.ts): the line and how far along it is; quiet before that */
function GradRow({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const g = gradInfo(snap.days, snap.settings!, tk);
  const line = gradLine(g);
  if (!line) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens Milestones"
      onPress={() => {
        buzz('tap');
        router.push('/miles');
      }}
      style={({ pressed }) => [s.grad, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={s.gradTop}>
        {g.at ? <Icon name="crown" size={20} color={c.sunText} /> : null}
        <T v="small" style={{ flex: 1 }}>
          {g.at ? 'Graduated. ' : ''}
          {line}
        </T>
        <Icon name="next" size={16} color={c.muted} />
      </View>
      {g.at ? null : (
        <View style={[s.gradBar, { backgroundColor: c.surface2 }]}>
          <LinearGradient
            colors={['#FFC43D', '#F27A1C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[s.gradFill, { width: `${Math.min(100, (g.count / GRAD_DAYS) * 100)}%` }]}
          />
        </View>
      )}
    </Pressable>
  );
}

/** a quiet underlined link inside a card */
export function LinkText({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Text accessibilityRole="link" onPress={onPress} style={{ fontFamily: font.bodySemi, fontSize: 15, color: c.accentText, textDecorationLine: 'underline' }}>
      {label}
    </Text>
  );
}

/* ---------- step down ----------
   Built to be read at a glance: the stretch so far, big; a ruler with your usual and your best on it; and the plan's week
   as dots under one line of its slips and aim. The hard hours are on Tonight and on Pattern, and the waits on the Sunday
   review, so they are not repeated here. Anything else (ready to count days, more help) shows only when it applies. */
function StepCard({ snap, tk, now, size, v }: { snap: Snapshot; tk: string; now: number; size: 'sm' | 'lg'; v: CleanView }) {
  const c = useTheme();
  const { apply } = useStore();
  const st = snap.settings!;
  const k = stepCard(snap.days, st, now);
  const r = stepRuler(k.v);
  const week = stepWeek(snap.days, st, k.v);
  const kv = k.v;
  const onAim = kv.target != null && kv.thisW <= kv.target;
  const how = () => router.push({ pathname: '/settings', params: { open: 's-count' } });
  return (
    <View style={s.count}>
      <View style={s.between}>
        <Pressable accessibilityRole="button" accessibilityLabel="Step down. How it works" onPress={how} hitSlop={8} style={s.stepHead}>
          <T v="eyebrow" tone="muted">
            Step down
          </T>
          <View style={[s.info, { borderColor: c.line }]}>
            <Text style={[s.infoT, { color: c.muted }]}>?</Text>
          </View>
        </Pressable>
        {size === 'sm' ? <LinkText label="Month ›" onPress={() => router.navigate({ pathname: '/pattern', params: { pane: 'days' } })} /> : null}
      </View>

      {/* the stretch so far (on Today it is already on the flame's picture, at the top) */}
      {size === 'lg' ? (
        <View style={s.stepHero} accessibilityLabel={k.hero + ' ' + (kv.slips ? 'this stretch' : 'and counting')}>
          <Text style={[s.stepBig, { color: c.ink }]}>{k.hero}</Text>
          <View style={{ gap: 4, flexShrink: 1 }}>
            {r.newBest ? (
              <View style={[s.newBest, { backgroundColor: c.sun }]}>
                <Icon name="star" size={13} color={c.onSun} />
                <Text style={[s.newBestT, { color: c.onSun }]}>New best</Text>
              </View>
            ) : null}
            <T tone="muted" style={{ fontSize: 15 }}>
              {kv.slips ? 'this stretch' : 'and counting'}
            </T>
          </View>
        </View>
      ) : null}
      <StretchRuler r={r} />

      {/* the plan's week: how many slips so far against its aim, over a dot for each day */}
      <View style={{ gap: 10 }}>
        <View style={s.between}>
          <T v="label">This week</T>
          <Text style={[s.stepChipT, { color: onAim ? c.mintText : c.muted }]}>
            {(kv.thisW === 1 ? '1 slip' : kv.thisW + ' slips') +
              (kv.target == null ? ' · no aim yet' : kv.target === 0 ? ' · aim 0' : ' · aim ' + kv.target + ' or fewer')}
          </Text>
        </View>
        <WeekDots week={week} />
      </View>

      {k.ready ? (
        <View style={s.flat}>
          <View style={s.slimRow}>
            <Icon name="trophy" size={18} color={c.sunText} />
            <T v="label" style={{ flex: 1 }}>
              Ready to count days
            </T>
          </View>
          <T v="small" tone="muted">
            {k.ready} Points and badges come with you.
          </T>
          <Button label="Start counting days" onPress={() => apply(stepGrad(st, tk))} />
        </View>
      ) : null}
      {k.help ? (
        <View style={s.slim}>
          <Icon name="heart" size={17} color={c.coralText} />
          <Text style={[s.slimT, { color: c.coralText }]}>Extra support helps</Text>
          <Pressable
            accessibilityRole="link"
            hitSlop={6}
            onPress={() => {
              buzz('tap');
              router.push({ pathname: '/help/[id]', params: { id: 'therapy' } });
            }}>
            <Text style={[s.slimLink, { color: c.coralText }]}>Therapy</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            hitSlop={6}
            onPress={() => {
              buzz('tap');
              router.push({ pathname: '/help/[id]', params: { id: 'groups' } });
            }}>
            <Text style={[s.slimLink, { color: c.coralText }]}>Groups</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/* ---------- the notes and the offer ---------- */
export function CountNotes({ snap, tk }: { snap: Snapshot; tk: string }) {
  const { apply } = useStore();
  const st = snap.settings!;
  if (st.cleanNote?.m === 'step') {
    return (
      <Card tone="note">
        <T v="h2">A plan for where you are</T>
        <T>Slips have landed on most days this week. That is a hard loop, and it is common, especially after years of trying.</T>
        <T>
          So Daybook switched to the step-down plan: longer stretches between slips, and fewer slips each week. The goal is still to quit. This is how you get
          there.
        </T>
        <View style={{ gap: 4 }}>
          <T v="label">Years of trying is not proof you cannot. It is practice.</T>
          <T v="small" tone="muted">
            Many people who quit smoking needed 30 or more tries.
            {habitOf(snap.settings) === 'porn' ? ' And in a small trial, a skills-based therapy cut porn viewing by about 93%.' : ''} This habit can change.
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
  if (st.cleanNote?.m === 'count') {
    return (
      <Card tone="note">
        <T v="h2">Counting days now</T>
        <T>Your stretches got long, so Daybook counts days now.</T>
        <T>The Stepped up badge is yours, and your points and badges come with you. If a week gets hard later, Daybook steps down with you again.</T>
        <View style={s.actions}>
          <Button label="Okay" onPress={() => apply(cleanOk(st))} />
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
        <T v="h2">A gentler way to count</T>
        <T>
          The last few days have been hard. That is common when you are changing a habit, and you are still here and still logging honestly. That matters more
          than any count.
        </T>
        <T>Until things settle, a slip takes one day off, never all of them. Every slip is still logged and nothing is taken away.</T>
        <View style={s.actions}>
          <Button label="Okay" onPress={() => apply(cleanOk(st))} />
          <Button label="Keep strict counting" kind="ghost" onPress={() => apply(setCountMode(st, 'strict', tk))} />
        </View>
      </Card>
    );
  }
  if (stepOffer(snap.days, st, tk)) {
    return (
      <Card tone="note">
        <T v="h2">Slips on most days lately?</T>
        <T>
          That is a hard loop to break, and it is common. The step-down plan aims for longer stretches between slips and fewer slips each week, instead of a run
          you lose every day or two. The goal is still to quit. This is a way to get there.
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

const s = StyleSheet.create({
  count: { gap: 16 },
  figures: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  figure: { flexGrow: 1, flexBasis: '30%', gap: 2, paddingHorizontal: 12, borderLeftWidth: 1 },
  figFirst: { paddingLeft: 0, borderLeftWidth: 0 },
  figBig: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  grad: { gap: 8, minHeight: 44, justifyContent: 'center' },
  gradTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  gradFill: { height: 6, borderRadius: 3 },
  flat: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  baseline: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 10, rowGap: 2 },
  pts: { fontFamily: font.display, fontSize: 34, lineHeight: 36 },
  win: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  cell: { width: 26, height: 26, borderRadius: 13 },
  cellSm: { width: 12, height: 12, borderRadius: 6 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16 },
  box: { gap: 10, padding: 14, borderRadius: 18 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  info: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  infoT: { fontFamily: font.bodyBold, fontSize: 11, lineHeight: 13 },
  stepHero: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  stepBig: { fontFamily: font.displayBold, fontSize: 46, lineHeight: 50 },
  newBest: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  newBestT: { fontFamily: font.bodyBold, fontSize: 13 },
  stepChipT: { fontFamily: font.bodySemi, fontSize: 13 },
  slim: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slimRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slimT: { flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 19 },
  slimLink: { fontFamily: font.bodyBold, fontSize: 15, textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
