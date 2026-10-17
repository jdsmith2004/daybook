/* Today's sky, on Today under the flame: the day's map (Map your day). Before a map: an invitation, with the day's sky.
   With a storm: the hour, the plan in one line, and at the hour "This is the hour". An hour after it: "Did it hold?",
   answered right here, and the storm breaks into a star. Clear skies: the sun. Yesterday's storm, if it was never
   answered, is asked here too. */
import { holdMap, mapAsk, mapClock, mapIfThen, mapOf, mapPhase, mapStars, mapTime, type MapHeld, type Snapshot } from '@daybook/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DaySky } from '@/components/day-sky';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export function MapCard({ snap, tk, now }: { snap: Snapshot; tk: string; now: number }) {
  const c = useTheme();
  const { update, say } = useStore();
  /* the storm just answered here, so its star can appear in place */
  const [just, setJust] = useState<{ k: string; r: MapHeld } | null>(null);
  const nowMin = Math.round((now - mapTime(tk, 0)) / 60000);
  const ask = mapAsk(snap.days, tk, now);
  const mp = mapOf(snap.days, tk);
  const stars = mapStars(snap.days);
  const open = () => router.push('/map');

  /* "Did it hold?" (today's storm an hour after its hour, or yesterday's never answered) */
  if (ask || just) {
    const k = just ? just.k : ask!.k;
    const m = mapOf(snap.days, k)!;
    const r = just ? just.r : null;
    const pick = (v: MapHeld) => {
      update((s0) => ({ ...s0, days: holdMap(s0.days, k, v) }));
      setJust({ k, r: v });
      buzz(v === 'n' ? 'tap' : 'lit');
      say(v === 'n' ? 'Thanks for being honest. A slip is data, not a reset.' : 'It held. A star for your sky.');
    };
    return (
      <Card>
        <DaySky height={128} labels={false} now={k === tk ? nowMin : null} storm={m.h} planned held={r === 'y' || r === 'm'} />
        <T v="label">
          {r == null
            ? (k === tk ? 'Your ' : 'Yesterday’s ') + mapClock(m.h!) + ' storm. Did your plan hold?'
            : r === 'n'
              ? 'Thanks for being honest. Tomorrow’s map can use it.'
              : 'It held. That is a star in your sky.'}
        </T>
        {r == null ? (
          <>
            <T v="small" tone="muted">
              {mapIfThen(m)}
            </T>
            <View style={s.row}>
              <Small label="It held" tone={c.mintSoft} ink={c.mintText} onPress={() => pick('y')} />
              <Small label="Mostly" tone={c.sunSoft} ink={c.sunText} onPress={() => pick('m')} />
              <Small label="It slipped" tone={c.surface2} ink={c.muted} onPress={() => pick('n')} />
            </View>
          </>
        ) : r === 'n' ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/log')} style={s.link}>
            <Text style={[s.linkT, { color: c.accentText }]}>Log what happened</Text>
          </Pressable>
        ) : null}
      </Card>
    );
  }

  /* no map yet today: the invitation (not late at night, when there is little day left to map) */
  if (!mp) {
    if (nowMin >= 21 * 60) return null;
    return (
      <Card>
        <DaySky height={118} labels={false} now={nowMin} storm={null} />
        <View style={{ gap: 2 }}>
          <T v="h2">Map your day</T>
          <T v="small" tone="muted">
            Find today’s hard hour before it finds you. About 30 seconds.
          </T>
        </View>
        <Button label="Map my day" icon="sun" onPress={open} />
      </Card>
    );
  }

  const ph = mapPhase(tk, mp, now);
  return (
    <Card>
      <Pressable accessibilityRole="button" accessibilityLabel="Change today's map" onPress={open}>
        <DaySky height={118} labels={false} now={nowMin} storm={mp.h} planned held={mp.r === 'y' || mp.r === 'm'} clear={ph === 'clear'} />
      </Pressable>
      <View style={s.head}>
        <T v="label" style={{ flex: 1 }}>
          {ph === 'clear'
            ? 'Clear skies today.'
            : ph === 'now'
              ? 'This is the hour. You planned for it.'
              : ph === 'done'
                ? mp.r === 'n'
                  ? 'Thanks for being honest about today.'
                  : 'It held today.'
                : 'Storm at ' + mapClock(mp.h!) + '. You have a plan.'}
        </T>
        <View style={[s.star, { backgroundColor: c.scheme === 'dark' ? '#1B1650' : '#2D2A70' }]}>
          <Icon name="star" size={13} color="#FFD45E" />
          <Text style={s.starT}>{stars.all}</Text>
        </View>
      </View>
      {ph === 'before' || ph === 'now' || ph === 'past' ? (
        <T v="small" tone={ph === 'now' ? undefined : 'muted'}>
          {mapIfThen(mp)}
          {ph === 'now' ? ' If an urge shows up, SOS is just above.' : ''}
        </T>
      ) : null}
    </Card>
  );
}

function Small({ label, tone, ink, onPress }: { label: string; tone: string; ink: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.small, { backgroundColor: tone, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
      <Text style={[s.smallT, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  small: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  smallT: { fontFamily: font.bodyBold, fontSize: 15 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  star: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  starT: { fontFamily: font.bodyBold, fontSize: 13, color: '#FFFFFF' },
  link: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' },
  linkT: { fontFamily: font.bodySemi, fontSize: 15, textDecorationLine: 'underline' },
});
