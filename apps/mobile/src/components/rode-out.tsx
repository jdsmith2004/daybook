/* One urge ridden out, one ending (the UX audit of October 27, 2026). The ride's "It passed", the 10-minute pause's "It
   passed" and Already happened's "I rode it out" all end on this page, so riding out an urge feels the same wherever it
   is logged. The flame pops in with its burst, confetti bursts out with a run of buzzes and then a shower falls; how long
   it took, how many you have ridden out and the points; what helped (the moves of an SOS, with one line on why that one
   works and its lesson for later, or what you did, for one logged afterwards); and what set it off. Each answer is one tap
   or none, and saved as it is tapped. Done is pinned at the bottom, in reach on every phone while the card scrolls, with
   Undo under it for an entry logged by hand. With celebrations off it is the same page, quietly. */
import {
  didIds,
  didToggle,
  LESSONS,
  optList,
  patchEvent,
  rateUrTool,
  rideRecord,
  ridePracticeAsk,
  rideWeek,
  rideWhy,
  urTool,
  type DayKey,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Link } from '@/components/choices';
import { Appear } from '@/components/appear';
import { Confetti } from '@/components/celebrate';
import { MOVE_ICON, MOVE_NAME } from '@/components/ride/moves';
import { Finish, SceneFrame } from '@/components/scene';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close, closeAll } from '@/lib/nav';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, useSkyTheme } from '@/lib/theme';

/** an urge ridden out, as saved: the entry, how long it took (when SOS or the pause measured it), the moves done in SOS, and
    the points it earned */
export interface Rode {
  key: DayKey;
  id: string;
  mins: number | null;
  /** the moves and tools of an SOS (What helped most?); none asks what you did instead */
  moves: string[];
  gain: number;
  /** ridden out in SOS: the practice ride can be suggested once */
  sos?: boolean;
}

const moveName = (x: string) => MOVE_NAME[x] || urTool(x)?.name || x;

export function RodeOut({ won, night, level, title = 'SOS', onUndo }: { won: Rode; night: boolean; level: number; title?: string; onUndo?: () => void }) {
  const c = useSkyTheme(night ? 'night' : 'mint');
  const { snap, tk, update, apply } = useStore();
  const st = useCareSettings();
  const sos = useSos();
  const ev = snap.days[won.key]?.events.find((e) => e.id === won.id) || null;
  /* the record as it was when it passed: this ride is already in it */
  const [rec] = useState(() => rideRecord(snap.days, won.mins ?? 0));
  const [week] = useState(() => rideWeek(snap.days, tk));
  const [helped, setHelped] = useState<string | null>(null);
  const [trig, setTrig] = useState<string | null>(() => ev?.trigger || null);
  /* practice is offered once, after the first few rides in SOS */
  const [askPrac] = useState(() => !!won.sos && ridePracticeAsk(snap.days, sos.mem));
  useEffect(() => {
    if (askPrac) sos.setMem((m) => ({ ...m, pracAsk: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cel = st.celebrate !== false;
  const [rain, setRain] = useState(false);
  useEffect(() => {
    if (!cel) return void buzz('save');
    buzz('lit');
    const t = [
      setTimeout(() => buzz('land'), 170),
      setTimeout(() => buzz('land'), 340),
      setTimeout(() => {
        buzz('lit');
        setRain(true);
      }, 760),
    ];
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const why = won.moves.length ? rideWhy(helped, won.moves) : null;
  const lesson = why?.l ? (LESSONS as { id: string; title: string }[]).find((l) => l.id === why.l) : null;
  const trigs = (optList('trig', st.opts, { time: ev?.time || null, sel: trig, all: false }).list as [string, string][]).slice(0, 7);
  const did = didIds(ev?.did);
  /* what you did, for one logged afterwards ("Something else" says nothing, so it is left out here) */
  const dids = won.moves.length
    ? []
    : (optList('did', st.opts, { sel: did, all: false }).list as [string, string][]).filter(([v]) => v !== 'else' || did.indexOf(v) >= 0);
  const pickHelped = (x: string) => {
    const nx = helped === x ? null : x;
    let s0 = st;
    if (helped) s0 = rateUrTool(s0, helped, -1);
    if (nx) s0 = rateUrTool(s0, nx, 1);
    apply({ st: s0 });
    setHelped(nx);
    buzz('tap');
  };
  const pickDid = (v: string) => {
    const nx = didToggle(ev?.did, v);
    update((s) => ({ ...s, days: patchEvent(s.days, won.key, won.id, { did: nx.length ? nx : null }) }));
    buzz('tap');
  };
  const pickTrig = (v: string) => {
    const nx = trig === v ? null : v;
    setTrig(nx);
    update((s) => ({ ...s, days: patchEvent(s.days, won.key, won.id, { trigger: nx && nx !== 'none' ? nx : null }) }));
    buzz('tap');
  };

  const mins = won.mins == null ? '' : won.mins < 1 ? 'under a minute' : won.mins === 1 ? '1 minute' : won.mins + ' minutes';
  const chips: string[] = [rec.n === 1 ? 'Your first one' : rec.n + ' ridden out'];
  if (won.mins != null && rec.faster && rec.med) chips.push('Faster than your usual ' + rec.med + ' min');
  if (week > 1) chips.push(week + ' this week');
  if (won.gain > 0) chips.push('+' + won.gain + ' points');
  return (
    <View style={s.full}>
      <SceneFrame
        title={title}
        sky={night ? 'night' : 'mint'}
        onClose={close}
        pin={
          <>
            <Button label="Done" onPress={closeAll} />
            {onUndo ? (
              <View style={s.c}>
                <Link label="Undo this entry" tone="muted" onPress={onUndo} />
              </View>
            ) : null}
          </>
        }>
        <Finish
          level={level}
          size={170}
          least={0.8}
          tone="mint"
          alive
          always
          title="You rode it out."
          text={(mins ? 'It passed in ' + mins + '. ' : 'The urge came, and you did not act on it. ') + 'Every one you ride out makes the next one easier.'}
        />
        <Appear delay={650} style={s.chips}>
          {chips.map((t) => (
            <View key={t} style={[s.chip, { backgroundColor: c.scBtn }]}>
              <Text style={[s.chipT, { color: c.ink }]}>{t}</Text>
            </View>
          ))}
        </Appear>
        <Appear delay={950} by={22} duration={420} style={[s.card, { backgroundColor: c.surface }]}>
          {won.moves.length ? (
            <>
              <Text style={[s.q, { color: c.ink }]}>What helped most?</Text>
              <View style={s.wrap} accessibilityRole="radiogroup">
                {won.moves.map((x) => {
                  const on = helped === x;
                  return (
                    <Pressable
                      key={x}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      onPress={() => pickHelped(x)}
                      style={[s.pick, { backgroundColor: on ? c.accent : c.accentSoft }]}>
                      <Icon name={MOVE_ICON[x] || urTool(x)?.ic || 'check'} size={16} color={on ? c.accentInk : c.accentText} />
                      <Text style={[s.pickT, { color: on ? c.accentInk : c.accentText }]}>{moveName(x)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={[s.q, { color: c.ink }]}>
                What helped? <Text style={[s.opt, { color: c.muted }]}>Optional</Text>
              </Text>
              <View style={s.wrap}>
                {dids.map(([v, label]) => {
                  const on = did.indexOf(v) >= 0;
                  return (
                    <Pressable
                      key={v}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      onPress={() => pickDid(v)}
                      style={[s.pick, { backgroundColor: on ? c.accent : c.accentSoft }]}>
                      {on ? <Icon name="check" size={15} color={c.accentInk} /> : null}
                      <Text style={[s.pickT, { color: on ? c.accentInk : c.accentText }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
          {why ? (
            <Appear key={why.id} by={4} duration={220} style={{ gap: 4 }}>
              <T v="small" style={{ lineHeight: 20 }}>
                {why.t}
              </T>
              {lesson ? (
                <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })} hitSlop={8}>
                  <Text style={[s.lesson, { color: c.accentText }]}>Later, when it is calm: {lesson.title} ›</Text>
                </Pressable>
              ) : null}
            </Appear>
          ) : null}
          <View style={[s.rule, { backgroundColor: c.line }]} />
          <Text style={[s.q, { color: c.ink }]}>
            What set it off? <Text style={[s.opt, { color: c.muted }]}>Optional</Text>
          </Text>
          <View style={s.wrap}>
            {trigs.map(([v, label]) => {
              const on = trig === v;
              return (
                <Pressable
                  key={v}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => pickTrig(v)}
                  style={[s.pick, { backgroundColor: on ? c.ink : c.bg }]}>
                  <Text style={[s.pickT, { color: on ? c.surface : c.ink }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Appear>
        {askPrac ? (
          <T v="small" tone="muted" style={s.center}>
            Run a practice ride on a calm day (Learn, then Tools). Practiced calm, it comes easier when it counts.
          </T>
        ) : null}
      </SceneFrame>
      {/* the confetti is wider than the screen: it is clipped here, so the page never scrolls sideways */}
      {cel ? (
        <View pointerEvents="none" style={s.clip}>
          <Confetti big />
          {rain ? <Confetti big rain /> : null}
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  full: { flex: 1, overflow: 'hidden' },
  clip: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' },
  c: { alignItems: 'center' },
  center: { textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  chip: { paddingHorizontal: 12, minHeight: 30, justifyContent: 'center', borderRadius: 15 },
  chipT: { fontFamily: font.bodyBold, fontSize: 13 },
  card: { alignSelf: 'stretch', gap: 12, padding: 16, borderRadius: 20 },
  q: { fontFamily: font.display, fontSize: 17, lineHeight: 22 },
  opt: { fontFamily: font.body, fontSize: 13 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 22 },
  pickT: { fontFamily: font.bodySemi, fontSize: 15 },
  lesson: { fontFamily: font.bodySemi, fontSize: 13 },
  rule: { height: 1, marginVertical: 2 },
});
