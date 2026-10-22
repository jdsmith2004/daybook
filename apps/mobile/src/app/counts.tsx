/* Anonymous counts: what is sent and what never is, the last batch exactly as it went, and the switch (core pulse.ts).
   Named "counts", not "pulse": on the web, /pulse is the server's own address. */
import { pulseMeaning, SITE_PAGES } from '@daybook/core';
import { Linking, View } from 'react-native';

import { Link } from '@/components/choices';
import { Dock } from '@/components/scene';
import { SheetFrame, SheetH } from '@/components/sheet';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { answerPulse, usePulse } from '@/lib/pulse';
import { useStore } from '@/lib/store';

const EXAMPLES = ['act_7_13', 'back_1', 'setup_done', 'sos', 'tool_breathe', 'lesson_done', 'checkin', 'slip_logged'];
const NEVER = [
  'Anything you write: notes, plans, reasons, messages',
  'What led to an urge or a slip, or when it happened',
  'Your log, your check-ins or your plan',
  'Your name, your email, your account or anything that tells this phone apart',
];

export default function Counts() {
  const s = usePulse();
  const { say } = useStore();
  const on = s?.on === true;
  const set = (v: boolean) => {
    buzz('tap');
    answerPulse(v);
    say(v ? 'Counts are on. Thank you.' : 'Counts are off. Nothing is sent.');
  };
  return (
    <SheetFrame title="Anonymous counts" sub={on ? 'On. Thank you for helping the next person.' : 'Off. Nothing is sent.'}>
      <T>
        Daybook is built by one person. With counts on, your phone sends a few numbers once a day, for days that are over. The server adds them to totals for
        everyone and keeps nothing else, so no count can be traced back to you.
      </T>
      <SheetH title="What is sent" />
      <T v="small" tone="muted">
        Names and small numbers, like these:
      </T>
      <View style={{ gap: 4 }}>
        {EXAMPLES.map((k) => (
          <T key={k} v="small">
            {'• ' + pulseMeaning(k)}
          </T>
        ))}
      </View>
      <SheetH title="What is never sent" />
      <View style={{ gap: 4 }}>
        {NEVER.map((t) => (
          <T key={t} v="small">
            {'• ' + t}
          </T>
        ))}
      </View>
      {s?.last ? (
        <>
          <SheetH title="The last time, exactly" />
          {s.last.days.map((d) => (
            <View key={d.d} style={{ gap: 2 }}>
              <T v="label">{d.d}</T>
              {Object.entries(d.c).map(([k, n]) => (
                <T key={k} v="small">{`${pulseMeaning(k)}: ${n}`}</T>
              ))}
            </View>
          ))}
        </>
      ) : null}
      <View style={{ alignItems: 'flex-start', marginLeft: -6 }}>
        <Link label="Read the privacy policy" onPress={() => Linking.openURL(SITE_PAGES.privacy).catch(() => undefined)} />
      </View>
      <Dock>
        {on ? <Button kind="ghost" label="Turn counts off" onPress={() => set(false)} /> : <Button label="Send anonymous counts" onPress={() => set(true)} />}
        {s && s.on === null ? (
          <View style={{ alignItems: 'center' }}>
            <Link label="No thanks" onPress={() => set(false)} />
          </View>
        ) : null}
      </Dock>
    </SheetFrame>
  );
}
