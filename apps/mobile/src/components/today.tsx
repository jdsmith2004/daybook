/* The cards on Today. Every number and sentence comes from @daybook/core, which is checked against the legacy app. */
import {
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
} from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { StretchRuler, WeekDots } from '@/components/step-art';
import { Bar, Button, Card, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/* ---------- the Days card: the mode's one count, as Today shows it, and what stays on the record ---------- */
function Chips({ v }: { v: CleanView }) {
  const ch = runChips(v);
  const row = (small: string, text: string) => (
    <View key={small} style={s.kept}>
      <T tone="muted" style={{ flex: 1 }}>
        {small}
      </T>
      <T v="label">{text}</T>
    </View>
  );
  return (
    <View style={{ gap: 4 }}>
      {ch.hours ? row('Since your last slip', ch.hours) : null}
      {ch.longest ? row('Longest run', ch.longest) : null}
      {ch.noSlip ? row('No-slip days in all', ch.noSlip) : null}
      {ch.next ? row('Next goal', ch.next) : null}
    </View>
  );
}

/** in the Journal, under the month calendar (size 'lg'); step down's card takes the size too */
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
        {/* day 0: one warm line, not three zeros */}
        {f.dl || f.rode || f.slips ? (
          <View style={s.facts}>
            {fact(f.dl, 'day logged', 'days logged')}
            {fact(f.rode, 'urge ridden out', 'urges ridden out')}
            {fact(f.slips, 'slip logged', 'slips logged')}
          </View>
        ) : (
          <T style={{ fontSize: 17, lineHeight: 24 }}>Nothing logged yet. Your first entry starts the log.</T>
        )}
        <T v="small" tone="muted">
          {sub} <LinkText label="How this works" onPress={() => router.push('/mode')} />
        </T>
      </Card>
    );
  }
  if (t.step) return <StepCard snap={snap} tk={tk} now={now} size={size} v={v} />;
  return (
    <Card>
      <T v="eyebrow" tone="muted">
        {t.eyebrow}
      </T>
      <View style={s.baseline}>
        <T v="big">{t.big}</T>
        <T tone="muted">{t.of}</T>
      </View>
      <T v="small" tone="muted">
        {t.sub}
      </T>
      <Chips v={v} />
      <GradRow snap={snap} tk={tk} />
      <LinkText label="How I count days" onPress={() => router.push({ pathname: '/settings', params: { open: 's-count' } })} />
    </Card>
  );
}

/** the way to graduation, once the first week is behind the person (graduate.ts); quiet before that */
function GradRow({ snap, tk }: { snap: Snapshot; tk: string }) {
  const c = useTheme();
  const g = gradInfo(snap.days, snap.settings!, tk);
  const line = gradLine(g);
  if (!line) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Opens Milestones"
      onPress={() => router.push('/miles')}
      style={({ pressed }) => [s.grad, { borderTopColor: c.line, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={g.at ? 'crown' : 'trophy'} size={22} color={g.at ? c.sunText : c.accentText} />
      <T v="small" style={{ flex: 1 }}>
        {g.at ? 'Graduated. ' : ''}
        {line}
      </T>
      <Icon name="next" size={16} color={c.muted} />
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
   Built to be read at a glance: the stretch so far, big; a ruler with your usual and your best on it; the plan's week as
   dots, with the aim and how often you waited first as two short chips; and one line for the hard hours. Anything else
   (ready to count days, more help) is one slim row, only when it applies. */
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
  const hh = k.hh;
  const hhLook = !hh
    ? null
    : hh.state === 'won'
      ? { ink: c.mintText, ic: 'check' }
      : hh.state === 'during'
        ? { ink: c.coralText, ic: 'life' }
        : hh.state === 'lost'
          ? { ink: c.muted, ic: 'leaf' }
          : { ink: c.violetText, ic: hh.day ? 'sun' : 'moon' };
  return (
    <Card>
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

      {/* the plan's week */}
      <WeekDots week={week} />
      <View style={s.wrap}>
        <View style={s.stepChip}>
          <Icon name="flag" size={14} color={onAim ? c.mintText : c.muted} />
          <Text style={[s.stepChipT, { color: onAim ? c.mintText : c.ink }]}>
            {kv.target == null ? 'First week: no aim yet' : kv.target === 0 ? 'Aim: no slips' : 'Aim: ' + kv.target + ' or fewer'}
          </Text>
        </View>
        {kv.wSl ? (
          <View style={s.stepChip}>
            <Icon name="timer" size={14} color={kv.wWait ? c.skyText : c.muted} />
            <Text style={[s.stepChipT, { color: kv.wWait ? c.skyText : c.ink }]}>
              Waited first {kv.wWait} of {kv.wSl}
            </Text>
          </View>
        ) : null}
      </View>

      {hh && hhLook ? (
        <View style={s.slim}>
          <Icon name={hhLook.ic} size={17} color={hhLook.ink} />
          <View style={{ flex: 1 }}>
            <Text style={[s.slimT, { color: hhLook.ink }]}>{hh.short}</Text>
            <Text style={[s.slimSub, { color: hhLook.ink }]}>{hh.sub}</Text>
          </View>
        </View>
      ) : null}

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
          <Pressable accessibilityRole="link" hitSlop={6} onPress={() => router.push({ pathname: '/help/[id]', params: { id: 'therapy' } })}>
            <Text style={[s.slimLink, { color: c.coralText }]}>Therapy</Text>
          </Pressable>
          <Pressable accessibilityRole="link" hitSlop={6} onPress={() => router.push({ pathname: '/help/[id]', params: { id: 'groups' } })}>
            <Text style={[s.slimLink, { color: c.coralText }]}>Groups</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
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
            Many people who quit smoking needed 30 or more tries. And in a small trial, a skills-based therapy cut porn viewing by about 93%. This habit can
            change.
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
  grad: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12, minHeight: 44, borderTopWidth: 1 },
  kept: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  flat: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  baseline: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 10, rowGap: 2 },
  pts: { fontFamily: font.display, fontSize: 34, lineHeight: 36 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  win: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  cell: { width: 26, height: 26, borderRadius: 13 },
  cellSm: { width: 12, height: 12, borderRadius: 6 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  facts: { flexDirection: 'row', gap: 10 },
  fact: { flex: 1, gap: 2 },
  factBig: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16 },
  box: { gap: 10, padding: 14, borderRadius: 18 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  info: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  infoT: { fontFamily: font.bodyBold, fontSize: 11, lineHeight: 13 },
  stepHero: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  stepBig: { fontFamily: font.displayBold, fontSize: 46, lineHeight: 50 },
  newBest: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  newBestT: { fontFamily: font.bodyBold, fontSize: 13 },
  stepChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepChipT: { fontFamily: font.bodySemi, fontSize: 13 },
  slim: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slimRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slimT: { flex: 1, fontFamily: font.bodySemi, fontSize: 15, lineHeight: 19 },
  slimSub: { fontFamily: font.body, fontSize: 13, lineHeight: 17, opacity: 0.9 },
  slimLink: { fontFamily: font.bodyBold, fontSize: 15, textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
