/* Your lessons this week: what the small ring on the flame's sky counts, and how it fills (core lessonWeek). Opened from the
   ring on Today. Monday to Sunday, one part for each day a lesson is finished; a slip never takes one away. */
import { fmtDate, lessonWeek, type LessonWeek } from '@daybook/core';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Dock } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

export default function LessonsWeek() {
  const { snap, tk } = useStore();
  const c = useTheme();
  const week = lessonWeek(snap.days, tk);
  return (
    <SheetFrame title="Your lessons this week">
      <T>Each day you finish a lesson lights one part of this ring, Monday to Sunday. A slip never takes one away. It starts fresh on Monday.</T>
      {/* the open middle is the ring itself, big: the small one on Today's sky is what this page explains */}
      <View style={s.mid}>
        <BigRing week={week} />
      </View>
      <View style={{ gap: 8 }}>
        {week.days.map((d) => (
          <View key={d.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {d.on ? (
              <Icon name="check" size={18} color={c.sunText} />
            ) : (
              <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: c.muted }} />
              </View>
            )}
            <T style={{ flex: 1 }} tone={d.on || d.today ? undefined : 'muted'}>
              {fmtDate(d.k, { weekday: 'long' }) + (d.today ? ' (today)' : '')}
            </T>
            <T v="small" tone={d.on ? 'sunText' : 'muted'}>
              {d.on ? 'A lesson done' : d.today ? 'Not yet' : ''}
            </T>
          </View>
        ))}
      </View>
      <Dock>
        <Button
          label="Go to Learn"
          onPress={() => {
            closeSheet();
            router.navigate('/learn');
          }}
        />
      </Dock>
    </SheetFrame>
  );
}

const D = 148;
const W = 14;
const pt = (a: number) => {
  const r = (D - W) / 2;
  const t = ((a - 90) * Math.PI) / 180;
  return `${(D / 2 + r * Math.cos(t)).toFixed(2)} ${(D / 2 + r * Math.sin(t)).toFixed(2)}`;
};
/** seven parts, Monday first at the top, the days done lit in the sun's color, and how many in the middle */
function BigRing({ week }: { week: LessonWeek }) {
  const c = useTheme();
  const step = 360 / 7;
  const r = (D - W) / 2;
  let left = week.n;
  return (
    <View style={s.ring} accessible accessibilityRole="image" accessibilityLabel={week.n + ' of 7 days so far'}>
      <Svg width={D} height={D} style={StyleSheet.absoluteFill}>
        {week.days.map((d, i) => {
          const on = d.on && left-- > 0;
          return (
            <Path
              key={d.k}
              d={`M${pt(i * step + 7)}A${r} ${r} 0 0 1 ${pt((i + 1) * step - 7)}`}
              stroke={on || d.today ? c.sun : c.line}
              strokeOpacity={on || !d.today ? 1 : 0.4}
              strokeWidth={W}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </Svg>
      <Text style={[s.n, { color: c.ink }]}>{week.n}</Text>
      <T v="small" tone="muted">
        of 7 days
      </T>
    </View>
  );
}

const s = StyleSheet.create({
  mid: { alignItems: 'center', paddingVertical: 8 },
  ring: { width: D, height: D, alignItems: 'center', justifyContent: 'center' },
  n: { fontFamily: font.display, fontSize: 38, lineHeight: 44 },
});
