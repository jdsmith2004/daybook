/* The time line across the top of the ride: how long this urge has been going, as a squiggle that grows while the
   minutes pass, with a small mark where yours usually pass (your own record, core rideMark). Time is the measure of an
   urge: it rises, peaks and passes, and the job is to outlast it. */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { WavyLine } from '@/components/shapes';
import { Text } from '@/components/text';
import { font, useTheme } from '@/lib/theme';

export function RideBar({ t0, mark, on, color }: { t0: number; mark: number | null; on: boolean; color: string }) {
  const c = useTheme();
  /* once a second is enough for a clock of minutes, and keeps the ride's moves smooth */
  const [nowMs, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [on]);
  const sec = Math.max(0, (nowMs - t0) / 1000);
  const [w, setW] = useState(0);
  /* the line spans a little past your usual time (or ten minutes), and keeps growing slowly once past it */
  const span = (mark ?? 10) * 60 * 1.35;
  const p = Math.min(1, sec / span);
  const at = mark != null ? (mark * 60) / span : null;
  const mm = Math.floor(sec / 60);
  const time = mm + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
  const past = mark != null && sec >= mark * 60;
  return (
    <View
      style={s.row}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={
        (mm ? mm + (mm === 1 ? ' minute' : ' minutes') : Math.floor(sec) + ' seconds') +
        ' so far.' +
        (mark != null ? ' Yours usually pass in about ' + mark + ' minutes.' : '')
      }>
      <Text style={[s.time, { color: c.ink }]}>{time}</Text>
      <View style={{ flex: 1 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w ? <WavyLine width={w} p={p} color={color} track={c.ink + '1F'} stroke={4} speed={0} /> : null}
        {w && at != null ? <View style={[s.mark, { left: Math.max(0, Math.min(w - 2, w * at)) - 1, backgroundColor: past ? color : c.ink + '55' }]} /> : null}
      </View>
      {mark != null ? (
        <Text style={[s.usual, { color: c.muted }]} numberOfLines={1}>
          {past ? 'past your usual' : 'yours: ~' + mark + ' min'}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', minHeight: 28 },
  time: { fontFamily: font.bodyBold, fontSize: 15, fontVariant: ['tabular-nums'], minWidth: 38 },
  mark: { position: 'absolute', top: -3, width: 3, height: 18, borderRadius: 2 },
  usual: { fontFamily: font.bodySemi, fontSize: 13 },
});
