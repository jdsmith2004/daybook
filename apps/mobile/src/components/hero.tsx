/* The Today card: your flame and how far it has grown, the one thing to do next, and the urge button.
   Tap the flame to say hi; tap the level for how points work. Ported from the legacy hxHtml and nextUpHtml. */
import { CHEERS, nextUp, type GameState, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Flame } from '@/components/flame';
import { LogLink } from '@/components/today-log';
import { Bar, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export function Hero({ g, snap, tk, now, onStop }: { g: GameState; snap: Snapshot; tk: string; now: number; onStop: (k: string) => void }) {
  const c = useTheme();
  const { say } = useStore();
  const lvl = g.level;
  const o = nextUp(snap.days, snap.settings!, tk, now);
  const label = `Level ${lvl.n}, ${lvl.name}. ${g.pts} points. Tap to see how points work.`;
  return (
    <Card style={{ gap: 14 }}>
      <View style={s.scene}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Your flame, level ${lvl.n}. Tap to say hi.`}
          onPress={() => {
            say(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
            buzz('tap');
          }}>
          <Flame level={lvl.n} size={132} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => router.push('/points')} style={{ alignSelf: 'stretch', gap: 6 }}>
          <View style={s.lv}>
            <Text style={[s.lvN, { color: c.ink }]}>Level {lvl.n}</Text>
            <T tone="muted">{lvl.name}</T>
          </View>
          <View style={s.barRow}>
            <View style={[s.end, { backgroundColor: c.sun }]}>
              <Text style={[s.endT, { color: c.onSun }]}>{lvl.n}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Bar frac={lvl.frac} from={c.sun} track={c.surface2} height={12} />
            </View>
            <View style={[s.end, { backgroundColor: c.surface2 }]}>
              {lvl.next == null ? <Icon name="star" size={14} color={c.muted} /> : <Text style={[s.endT, { color: c.muted }]}>{lvl.n + 1}</Text>}
            </View>
          </View>
          <T v="small" tone="muted" style={{ textAlign: 'center' }}>
            {g.pts.toLocaleString('en-US')} points · tap for how points work
          </T>
        </Pressable>
      </View>
      {o.n ? (
        !o.k ? (
          <View style={[s.act, { backgroundColor: c.mintSoft }]} accessibilityRole="text">
            <View style={[s.ic, { backgroundColor: c.surface }]}>
              <Icon name="check" size={26} color={c.mintText} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="small" tone="mintText">
                All done for today
              </T>
              <Text style={[s.actB, { color: c.mintText }]}>Great work. Rest well.</Text>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Next up: ${o.t}. ${[o.s, o.when].filter(Boolean).join(' · ')}. Worth ${o.pts} points.`}
            onPress={() => (o.act === 'lesson' ? router.push({ pathname: '/lesson/[id]', params: { id: o.v! } }) : onStop(o.v!))}
            style={({ pressed }) => [
              s.act,
              { backgroundColor: c.next, shadowColor: c.nextDeep, shadowOffset: { width: 0, height: pressed ? 1 : 5 }, transform: [{ translateY: pressed ? 4 : 0 }] },
            ]}>
            <View style={[s.ic, { backgroundColor: c.nextSoft }]}>
              <Icon name={o.ic!} size={26} color={c.nextInk} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={s.eye}>
                <Text style={[s.eyeT, { color: c.nextInk }]}>NEXT UP</Text>
                <View style={s.pips} accessibilityLabel={`${o.done} of ${o.n} parts of today done`}>
                  {o.pips!.map((p, i) => (
                    <View
                      key={i}
                      style={[s.pip, { backgroundColor: p === 'now' ? 'transparent' : c.nextInk, opacity: p ? 1 : 0.35, borderColor: c.nextInk, borderWidth: p === 'now' ? 2.5 : 0 }]}
                    />
                  ))}
                </View>
              </View>
              <Text style={[s.actB, { color: c.nextInk }]}>{o.t}</Text>
              <T v="small" style={{ color: c.nextInk }}>
                {[o.s, o.when].filter(Boolean).join(' · ')}
              </T>
            </View>
            <View style={[s.pt, { backgroundColor: c.nextSoft }]}>
              <Text style={[s.ptB, { color: c.nextInk }]}>+{o.pts}</Text>
              <Text style={[s.ptS, { color: c.nextInk }]}>points</Text>
            </View>
          </Pressable>
        )
      ) : null}
      <LogLink />
    </Card>
  );
}

const s = StyleSheet.create({
  scene: { alignItems: 'center', gap: 6 },
  lv: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 8 },
  lvN: { fontFamily: font.display, fontSize: 22 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  end: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  endT: { fontFamily: font.bodyBold, fontSize: 12 },
  act: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 74, paddingVertical: 11, paddingLeft: 12, paddingRight: 12, borderRadius: 22, shadowOpacity: 1, shadowRadius: 0 },
  ic: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  actB: { fontFamily: font.display, fontSize: 19, lineHeight: 23 },
  eye: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyeT: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1.2 },
  pips: { flexDirection: 'row', gap: 5 },
  pip: { width: 12, height: 12, borderRadius: 6 },
  pt: { alignItems: 'center', justifyContent: 'center', minWidth: 56, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 16 },
  ptB: { fontFamily: font.display, fontSize: 22, lineHeight: 24 },
  ptS: { fontFamily: font.bodyBold, fontSize: 11 },
});
