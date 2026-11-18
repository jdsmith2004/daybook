/* Under Your day on Today: the person's own words and record, which lived only in Journal and My plan before. Redrawn November 18,
   2026 (the owner: "we need some visual design on this text ... it's kind of bad. we need to make it look good"), from a wall of big
   text into three shapes, each tied to the sky above:
   - Who you are becoming: the sentence from the end of setup, centered in the flame's gold under a pool of its light, the way the
     flame lights the sky above it, with the proof from the log under it (core rodeProof: the count big, when the last one was small;
     or the first line of who you are in numbers). The whole block is the button; a pencil in its corner says so, without a word.
   - Today so far: a short line of the day, a colored dot for each entry (mint for an urge ridden out, amber for a slip), its time at
     the right edge, the dots joined like the day's line above.
   - Tonight (components/tonight-card.tsx): one night card for the whole evening, which now opens with "Tonight I stay free for" (every
     reason the night is for, several at once, each by a small star: core tonightOf, toggleTonightReason), then the hard hours and the
     two lines of the urge plan. The becoming sentence, when it is one of tonight's reasons, is said there as "Who I am becoming", so the
     same sentence never shows twice.
   Nothing here is an ask, so it shows on every day and at night. What the person has not filled in yet is a blank to tap
   (components/blank.tsx), never a hidden part and never a nag (the owner, November 13, 2026: "maybe like blanks that they need to
   press to add"). */
import {
  eventRow,
  identityLines,
  morningReasons,
  ownChoices,
  toggleTonightReason,
  planBlank,
  planTonight,
  rodeProof,
  sortedEvents,
  timeBack,
  tonightOf,
  type DayKey,
  type Snapshot,
} from '@daybook/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { AnswerChip, ChipWrap } from '@/components/answer';
import { Blank } from '@/components/blank';
import { OwnChip, OwnField } from '@/components/own';
import { SVG_HIDE } from '@/components/shapes';
import { Text } from '@/components/text';
import { TimeBackRow } from '@/components/time-back';
import { N, Star, TonightCard } from '@/components/tonight-card';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { usePullDowns } from '@/lib/pull';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

/** the same words, whatever the case and the stop at the end */
const same = (a: string, b: string) =>
  a
    .trim()
    .replace(/[.!]+$/, '')
    .toLowerCase() ===
  b
    .trim()
    .replace(/[.!]+$/, '')
    .toLowerCase();

export function TodayBelow({ snap, tk, now }: { snap: Snapshot; tk: DayKey; now: number }) {
  const c = useTheme();
  const downs = usePullDowns();
  const st = snap.settings!;
  const evs = sortedEvents(snap.days[tk], st.rollover);
  const lines = planTonight(snap.days, st, tk);
  const all = (st.plan || []).filter((p) => !planBlank(p) && String(p.then || '').trim()).length;
  const be = String(st.becoming || '').trim();
  /* the time given back, under the sentence: what becoming free has already bought (core time-back.ts) */
  const back = timeBack(snap.days, st, tk);
  const proof = rodeProof(snap.days, st, tk) || newest(snap, tk, downs);
  return (
    <View style={s.all}>
      <Becoming be={be} proof={proof} />

      {back ? <TimeBackRow t={back} tk={tk} /> : null}

      {evs.length ? (
        <View>
          <Head icon="sun" t="Today so far" />
          {evs.map((e, i) => {
            const r = eventRow(e, st);
            const rode = e.outcome === 'rode';
            const meta = [e.m ? e.m + (e.m === 1 ? ' minute' : ' minutes') : '', r.meta].filter(Boolean).join(' · ');
            const what = rode ? 'Rode out an urge' : r.what;
            const dot = rode ? c.mint : e.outcome === 'slipped' ? c.slip : c.accent;
            return (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityLabel={what + '. ' + [r.time, meta].filter(Boolean).join(', ') + '. Opens it.'}
                onPress={() => {
                  buzz('tap');
                  router.push({ pathname: '/entry', params: { date: tk, id: e.id } });
                }}
                style={({ pressed }) => [s.moment, { opacity: pressed ? 0.7 : 1 }]}>
                {/* the day's line: a dot for the entry, joined to the ones before and after it */}
                <View style={s.rail}>
                  <View style={[s.seg, { backgroundColor: i ? c.line : 'transparent' }]} />
                  <View style={[s.dot, { backgroundColor: dot }]} />
                  <View style={[s.seg, { backgroundColor: i < evs.length - 1 ? c.line : 'transparent' }]} />
                </View>
                <View style={s.momentT}>
                  <View style={s.whatRow}>
                    <Text style={[s.what, { color: c.ink }]}>{what}</Text>
                    <Text style={[s.small, s.time, { color: c.muted }]}>{r.time}</Text>
                  </View>
                  {meta ? <Text style={[s.small, { color: c.muted }]}>{meta}</Text> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <TonightCard snap={snap} tk={tk} now={now} lines={lines} more={all > lines.length} top={<TonightFor snap={snap} tk={tk} />} />
    </View>
  );
}

/* a section's name: a line icon at its own size and a few words, the same for each part, so the page reads as a few named places */
function Head({ icon, t, color }: { icon: string; t: string; color?: string }) {
  const c = useTheme();
  return (
    <View style={s.head}>
      <Icon name={icon} size={16} color={color || c.muted} />
      <Text style={[s.headT, { color: color || c.muted }]}>{t}</Text>
    </View>
  );
}

/* who you are becoming: plainly a thing to tap (the owner, November 13, 2026: "is it a button? it's hard to tell what it wants"). The
   pencil in the corner says it changes; written or not, a tap opens app/becoming.tsx, the page the setup had. The light behind it is the
   flame's: a pool of its gold, brightest at the sentence. */
function Becoming({ be, proof }: { be: string; proof: { t: string; n: string } | null }) {
  const c = useTheme();
  const glow = c.scheme === 'dark' ? 0.24 : 0.36;
  /* the number in a proof line ("15 urges ridden out") is said big in mint, the rest in ink */
  const m = proof ? /^(\d[\d,]*)(\s.*)$/.exec(proof.n) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={be ? 'Who you are becoming: ' + be.replace(/[.!]+$/, '') + '. Change it.' : 'Who you are becoming. Not written yet. Write it.'}
      onPress={() => {
        buzz('tap');
        router.push('/becoming');
      }}
      style={({ pressed }) => [s.be, { opacity: pressed ? 0.85 : 1 }]}>
      <Svg style={s.glow} width="100%" height="100%" {...SVG_HIDE}>
        <Defs>
          <RadialGradient id="beGlow" cx="50%" cy="46%" r="50%">
            <Stop offset="0" stopColor={c.sun} stopOpacity={glow} />
            <Stop offset="0.6" stopColor={c.sun} stopOpacity={glow * 0.35} />
            <Stop offset="1" stopColor={c.sun} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#beGlow)" />
      </Svg>
      <View style={s.pen}>
        <Icon name="pencil" size={18} color={c.accentText} />
      </View>
      <Icon name="flame" size={22} color={c.scheme === 'dark' ? c.sun : c.slip} />
      <Text style={[s.headT, { color: c.muted }]}>Who you are becoming</Text>
      {be ? (
        <Text style={[s.beT, { color: c.sunText }]}>{be}</Text>
      ) : (
        <View style={s.blankLine}>
          <Text style={[s.beT, { color: c.sunText }]}>I am becoming</Text>
          <Blank color={c.sunText} h={30} />
        </View>
      )}
      {be && proof ? (
        <View style={s.proof}>
          <Text style={[s.proofN, { color: c.ink }]}>
            {m ? <Text style={[s.proofBig, { color: c.mintText }]}>{m[1]}</Text> : null}
            {m ? m[2] : proof.n}
          </Text>
          <Text style={[s.small, s.center, { color: c.muted }]}>{proof.t}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* "Tonight I stay free for", at the top of the night card: the reasons tonight is for, in the person's own words, as the morning set
   them (or chosen here), each by a small star. A tap opens the person's reasons in place, one tap each, and Write my own. With none
   chosen yet, a blank. The becoming sentence is said as "Who I am becoming": it is already big above. */
function TonightFor({ snap, tk }: { snap: Snapshot; tk: DayKey }) {
  const { update } = useStore();
  const [open, setOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const st = snap.settings!;
  const be = String(st.becoming || '').trim();
  const say = (t: string) => (be && same(t, be) ? 'Who I am becoming' : t);
  /* every reason tonight is for (several since November 15, 2026), and every reason the person has or wrote, to pick or put down */
  const rs = tonightOf(snap.days, st, tk).rs;
  const base = morningReasons(snap.days, st, tk);
  const choices = ownChoices(st, 'reason', base, rs);
  const flip = (t: string) => {
    buzz('tap');
    update((s0) => (s0.settings ? { ...s0, days: toggleTonightReason(s0.days, s0.settings, tk, t) } : s0));
  };
  const said = rs.map(say).join(' · ');
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={
          rs.length ? 'Tonight I stay free for ' + rs.map(say).join(', ') + '. Change' : 'Tonight I stay free for. Nothing chosen yet. Choose who or what'
        }
        onPress={() => {
          buzz('tap');
          setOpen((x) => !x);
          setWriting(false);
        }}
        style={({ pressed }) => [s.for, { opacity: pressed ? 0.85 : 1 }]}>
        <View style={s.forTop}>
          <Icon name="moon" size={16} color={N.lav} />
          <Text style={[s.headT, { color: N.lav, flex: 1 }]}>Tonight I stay free for</Text>
          {open ? <Text style={[s.done, { color: N.ink }]}>Done</Text> : <Icon name="pencil" size={18} color={N.lav} />}
        </View>
        {rs.length ? (
          rs.map((t) => (
            <View key={t} style={s.reason}>
              <View style={s.star}>
                <Star size={12} />
              </View>
              <Text style={[s.forT, { color: N.ink }]}>{say(t)}</Text>
            </View>
          ))
        ) : (
          <View style={s.reason}>
            <View style={s.star}>
              <Star size={12} />
            </View>
            <Blank color={N.lav} h={26} />
          </View>
        )}
      </Pressable>
      {open ? (
        <View style={s.pick}>
          {writing ? (
            <OwnField
              kind="reason"
              builtIn={base}
              placeholder="Like: my daughter"
              max={120}
              onSave={(t) => {
                if (!rs.some((x) => x.toLowerCase() === t.toLowerCase())) flip(t);
                setWriting(false);
              }}
              onCancel={() => setWriting(false)}
            />
          ) : (
            <View accessibilityRole="list" accessibilityLabel={'What is tonight for? ' + (said ? 'Picked: ' + said : '')}>
              <ChipWrap last={1}>
                {choices.map((t) => (
                  <AnswerChip key={t} label={say(t)} on={rs.some((x) => x.toLowerCase() === t.toLowerCase())} onPress={() => flip(t)} />
                ))}
                <OwnChip onPress={() => setWriting(true)} />
              </ChipWrap>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

/** with no urge ridden out in two weeks, the first thing the record says about who the person is: its number big, who that makes
    them small. Never the slips line: no slip count sits on Today */
function newest(snap: Snapshot, tk: DayKey, downs: number): { t: string; n: string } | null {
  const l = identityLines(snap.days, snap.settings!, snap.reviews, tk, downs).filter((x) => x.ic !== 'leaf')[0];
  return l ? { t: l.who, n: l.n } : null;
}

const s = StyleSheet.create({
  all: { gap: 32 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  headT: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 },
  be: { alignItems: 'center', gap: 6, paddingTop: 24, paddingBottom: 8, paddingHorizontal: 8 },
  glow: { position: 'absolute', top: -24, bottom: -24, left: -16, right: -16 },
  pen: { position: 'absolute', top: 8, right: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  beT: { fontFamily: font.display, fontSize: 28, lineHeight: 34, textAlign: 'center', marginTop: 4 },
  blankLine: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, alignSelf: 'stretch', marginTop: 4 },
  proof: { alignItems: 'center', gap: 2, marginTop: 10 },
  proofN: { fontFamily: font.bodyMedium, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  proofBig: { fontFamily: font.display, fontSize: 20 },
  small: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
  center: { textAlign: 'center' },
  moment: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  rail: { width: 12, alignSelf: 'stretch', alignItems: 'center' },
  seg: { width: 2, flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  momentT: { flex: 1, gap: 2, paddingVertical: 8 },
  whatRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  what: { flex: 1, fontFamily: font.bodySemi, fontSize: 17, lineHeight: 22 },
  time: { fontVariant: ['tabular-nums'] },
  for: { paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  forTop: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 24 },
  done: { fontFamily: font.bodySemi, fontSize: 15 },
  reason: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  star: { height: 26, justifyContent: 'center' },
  forT: { flex: 1, fontFamily: font.display, fontSize: 20, lineHeight: 26 },
  pick: { paddingHorizontal: 16, paddingTop: 16 },
});
