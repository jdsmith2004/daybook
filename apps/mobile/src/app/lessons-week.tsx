/* Your lessons this week: what the small ring on the flame's sky counts, and how it fills (core lessonWeek). Opened from the
   ring on Today. Monday to Sunday, one part for each day a lesson is finished; a slip never takes one away. */
import { fmtDate, lessonWeek } from '@daybook/core';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Dock } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Button, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function LessonsWeek() {
  const { snap, tk } = useStore();
  const c = useTheme();
  const week = lessonWeek(snap.days, tk);
  return (
    <SheetFrame title="Your lessons this week" sub={week.n + ' of 7 days so far'}>
      <T>Each day you finish a lesson lights one part of this ring, Monday to Sunday. A slip never takes one away. It starts fresh on Monday.</T>
      <View style={{ gap: 8 }}>
        {week.days.map((d) => (
          <View key={d.k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
              {d.on ? 'A lesson done' : d.k > tk ? '' : d.today ? 'Not yet' : 'No lesson'}
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
