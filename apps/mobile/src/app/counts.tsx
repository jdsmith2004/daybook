/* Anonymous data: what Daybook learns (core events.ts) and the counts (core pulse.ts), what never leaves the phone, the last
   batch of counts exactly as it went, and the one switch for both. Both go without asking (the owner, October 28, November 4
   and November 9, 2026); here the person sees them, or turns them off.
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
  'Your journal, your notes, your voice notes, or anything else you write',
  'Your name, your email, your account or your Apple ID',
  'What Apple Health holds',
  'The time or date of anything, or where you are',
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
    <SheetFrame title="Anonymous data" sub={off ? PULSE_WORDS.off : PULSE_WORDS.on}>
      <T>
        Daybook is built by one person, who uses this to learn which parts help people quit, and to make them better. It is never tied to who you are, never
        sold and never shared.
      </T>
      <SheetH title="What is sent" />
      <T v="small" tone="muted">
        {off ? 'Off.' : 'On.'} What you open, finish and choose, and how many urges and slips you log, as fixed names and numbers. Once a day, counts like
        these:
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
        {off ? <Button label="Turn anonymous data on" onPress={() => set(true)} /> : <Button label="Done" onPress={closeSheet} />}
        {!off ? (
          <View style={{ alignItems: 'center' }}>
            <Link label="Turn it all off" tone="muted" onPress={() => set(false)} />
          </View>
        ) : null}
      </Dock>
    </SheetFrame>
  );
}
