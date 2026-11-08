/* Anonymous counts: what is sent and what never is, the last batch exactly as it went, and the switch (core pulse.ts).
   The counts go without asking (the owner, October 28 and November 4, 2026); here the person sees them, or turns them off.
   Named "counts", not "pulse": on the web, /pulse is the server's own address. */
import { PULSE_WORDS, pulseMeaning, SITE_PAGES } from '@daybook/core';
import { Linking, View } from 'react-native';

import { Link } from '@/components/choices';
import { Dock } from '@/components/scene';
import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { answerPulse, usePulse } from '@/lib/pulse';
import { useStore } from '@/lib/store';
import { WORDS } from '@/lib/words';

const SENT = ['act_7_13', 'setup_done', 'sos', 'sos_rode', 'tool_breathe', 'lesson_done', 'nt_checkin_tap', 'back_1'];
const NEVER = [
  'Anything you write: notes, plans, reasons, messages',
  'What led to an urge or a slip, or when it happened',
  'Your log, your check-ins or your plan',
  'Your name, your email, your account or anything that tells this phone apart',
];

export default function Counts() {
  const s = usePulse();
  const { say } = useStore();
  const off = s?.on === false;
  const set = (v: boolean) => {
    buzz('tap');
    answerPulse(v);
    say(v ? WORDS.countsOn : WORDS.countsOff);
  };
  const list = (ks: string[]) => (
    <View style={{ gap: 4 }}>
      {ks.map((k) => (
        <T key={k} v="small">
          {'• ' + pulseMeaning(k)}
        </T>
      ))}
    </View>
  );
  return (
    <SheetFrame title="Anonymous counts" sub={off ? PULSE_WORDS.off : PULSE_WORDS.on}>
      <T>
        Daybook is built by one person. Your phone sends a few numbers once a day, for days that are over, and once for the day so far as you leave the app. The
        server adds them to totals for everyone and keeps nothing else, so no count can be traced back to you.
      </T>
      <SheetH title="What is sent" />
      <T v="small" tone="muted">
        {off ? 'Off.' : 'On.'} Which parts of Daybook were used, like these:
      </T>
      {list(SENT)}
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
        {off ? <Button label="Send anonymous counts" onPress={() => set(true)} /> : <Button label="Done" onPress={closeSheet} />}
        {!off ? (
          <View style={{ alignItems: 'center' }}>
            <Link label="Turn all counts off" tone="muted" onPress={() => set(false)} />
          </View>
        ) : null}
      </Dock>
    </SheetFrame>
  );
}
