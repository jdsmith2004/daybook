/* Under Your day on Today: the person's own words and record, which lived only in Journal and My plan before. First who you are
   becoming (the sentence from the end of setup, big in the flame's gold, with the newest proof from the log under it: core rodeProof,
   or the first line of who you are in numbers; moved up to sit right under the flame and the next step, "Becoming free", the owner,
   November 11, 2026), then Today so far (each entry logged today, with a shape like a badge: mint for an urge ridden out), and
   Tonight I stay free for (every reason the night is for, several at once, with Write my own: core tonightOf, toggleTonightReason) and Tonight (the hard hours and the
   two lines of the urge plan that fit them, components/tonight-card.tsx). Nothing here is an ask, so it shows on every day and at
   night. What the person has not filled in yet is a blank to tap (components/blank.tsx), never a hidden part and never a nag (the
   owner, November 13, 2026: "maybe like blanks that they need to press to add"). */
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

import { AnswerChip, ChipWrap } from '@/components/answer';
import { Blank } from '@/components/blank';
import { OwnChip, OwnField } from '@/components/own';
import { Shape } from '@/components/shapes';
import { Text } from '@/components/text';
import { TimeBackRow } from '@/components/time-back';
import { TonightCard } from '@/components/tonight-card';
import { Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { usePullDowns } from '@/lib/pull';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

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
  const openBe = () => {
    buzz('tap');
    router.push('/becoming');
  };
  return (
    <View style={s.all}>
      {/* who you are becoming: plainly a thing to tap (the owner, November 13, 2026: "is it a button? it's hard to tell what it
          wants"). Unwritten, it asks the question and has one button; written, the sentence with Change beside its name. Both open
          app/becoming.tsx, the page the setup had. */}
      {be ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Who you are becoming: ' + be.replace(/[.!]+$/, '') + '. Change it.'}
          onPress={openBe}
          style={({ pressed }) => [s.be, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={s.beTop}>
            <T v="small" tone="muted">
              Who you are becoming
            </T>
            <View style={s.change}>
              <Icon name="pencil" size={16} color={c.accentText} />
              <Text style={[s.changeT, { color: c.accentText }]}>Change</Text>
            </View>
          </View>
          <Text style={[s.beT, { color: c.sunText }]}>{be}</Text>
          {proof ? (
            <Text style={[s.proof, { color: c.muted }]}>
              {proof.t} <Text style={{ color: c.mintText, fontFamily: font.bodySemi }}>{proof.n.replace(/ /g, '\u00a0')}</Text>
            </Text>
          ) : null}
        </Pressable>
      ) : (
        /* unwritten: the sentence's start and a blank where the rest goes, with Write it beside the name */
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Who you are becoming. Not written yet. Write it."
          onPress={openBe}
          style={({ pressed }) => [s.be, { opacity: pressed ? 0.85 : 1 }]}>
          <View style={s.beTop}>
            <T v="small" tone="muted">
              Who you are becoming
            </T>
            <View style={s.change}>
              <Icon name="pencil" size={16} color={c.accentText} />
              <Text style={[s.changeT, { color: c.accentText }]}>Write it</Text>
            </View>
          </View>
          <View style={s.blankLine}>
            <Text style={[s.beT, { color: c.sunText }]}>I am becoming</Text>
            <Blank color={c.sunText} h={34} />
          </View>
        </Pressable>
      )}

      {back ? <TimeBackRow t={back} tk={tk} /> : null}

      {evs.length ? (
        <View style={s.sec}>
          <T v="h2">Today so far</T>
          {evs.map((e) => {
            const r = eventRow(e, st);
            const rode = e.outcome === 'rode';
            const meta = [r.time, e.m ? e.m + (e.m === 1 ? ' minute' : ' minutes') : '', r.meta].filter(Boolean).join(' · ');
            const what = rode ? 'Rode out an urge' : r.what;
            return (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityLabel={what + '. ' + meta + '. Opens it.'}
                onPress={() => {
                  buzz('tap');
                  router.push({ pathname: '/entry', params: { date: tk, id: e.id } });
                }}
                style={({ pressed }) => [s.moment, { opacity: pressed ? 0.8 : 1 }]}>
                <Shape kind={rode ? 'cookie12' : 'clover4'} size={52} color={rode ? c.mint : c.slip}>
                  <Icon name={rode ? 'wave' : 'leaf'} size={24} color={c.bg} />
                </Shape>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="label">{what}</T>
                  <T v="small" tone="muted">
                    {meta}
                  </T>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <TonightFor snap={snap} tk={tk} />

      <TonightCard snap={snap} tk={tk} now={now} lines={lines} more={all > lines.length} />
    </View>
  );
}

/* "Tonight I stay free for": the reason tonight is for, in the person's own words, as the morning set it (or chosen here). A tap opens the
   person's reasons in place, one tap each, and My reasons to write a new one. With none chosen yet, a blank. */
function TonightFor({ snap, tk }: { snap: Snapshot; tk: DayKey }) {
  const c = useTheme();
  const { update } = useStore();
  const [open, setOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const st = snap.settings!;
  /* every reason tonight is for (several since November 15, 2026), and every reason the person has or wrote, to pick or put down */
  const rs = tonightOf(snap.days, st, tk).rs;
  const base = morningReasons(snap.days, st, tk);
  const choices = ownChoices(st, 'reason', base, rs);
  const flip = (t: string) => {
    buzz('tap');
    update((s0) => (s0.settings ? { ...s0, days: toggleTonightReason(s0.days, s0.settings, tk, t) } : s0));
  };
  const said = rs.join(' · ');
  return (
    <View style={s.sec}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={
          rs.length ? 'Tonight I stay free for ' + rs.join(', ') + '. Change' : 'Tonight I stay free for. Nothing chosen yet. Choose who or what'
        }
        onPress={() => {
          buzz('tap');
          setOpen((x) => !x);
          setWriting(false);
        }}
        style={({ pressed }) => [s.for, { opacity: pressed ? 0.85 : 1 }]}>
        <View style={s.beTop}>
          <T v="small" tone="muted">
            Tonight I stay free for
          </T>
          <View style={s.change}>
            <Text style={[s.changeT, { color: c.accentText }]}>{open ? 'Done' : rs.length ? 'Change' : 'Choose'}</Text>
            <Icon name={open ? 'up' : 'down'} size={16} color={c.accentText} />
          </View>
        </View>
        {rs.length ? (
          <View style={{ gap: 2 }}>
            {rs.map((t) => (
              <Text key={t} style={[s.forT, { color: c.ink }]}>
                {t}
              </Text>
            ))}
          </View>
        ) : (
          <Blank color={c.muted} h={28} />
        )}
      </Pressable>
      {open ? (
        writing ? (
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
          <View accessibilityRole="list" accessibilityLabel={'What is tonight for? ' + (said ? 'Picked: ' + said : '')} style={{ paddingTop: 10 }}>
            <ChipWrap last={1}>
              {choices.map((t) => (
                <AnswerChip key={t} label={t} on={rs.some((x) => x.toLowerCase() === t.toLowerCase())} onPress={() => flip(t)} />
              ))}
              <OwnChip onPress={() => setWriting(true)} />
            </ChipWrap>
          </View>
        )
      ) : null}
    </View>
  );
}

/** with no urge ridden out in two weeks, the first thing the record says about who the person is. Never the slips line: no slip
    count sits on Today */
function newest(snap: Snapshot, tk: DayKey, downs: number): { t: string; n: string } | null {
  const l = identityLines(snap.days, snap.settings!, snap.reviews, tk, downs).filter((x) => x.ic !== 'leaf')[0];
  return l ? { t: l.who, n: l.n + '.' } : null;
}

const s = StyleSheet.create({
  all: { gap: 32 },
  sec: { gap: 12 },
  moment: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 56 },
  be: { gap: 8, paddingBottom: 16 },
  beT: { fontFamily: font.display, fontSize: 34, lineHeight: 41 },
  beTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  change: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  changeT: { fontFamily: font.bodySemi, fontSize: 15 },
  blankLine: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  for: { gap: 4 },
  forT: { fontFamily: font.display, fontSize: 22, lineHeight: 27 },
  proof: { fontFamily: font.body, fontSize: 15, lineHeight: 21, marginTop: 4 },
});
