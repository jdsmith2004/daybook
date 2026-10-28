/* Anonymous counts: what is sent and what never is, the last batch exactly as it went, and the switch (core pulse.ts).
   The basic counts go without asking (the owner, October 28, 2026); here the person adds the rest, or turns all of it off.
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

const BASIC = ['act_0', 'act_7_13', 'setup_done'];
const MORE = ['back_1', 'sos', 'tool_breathe', 'lesson_done', 'checkin', 'slip_logged'];
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
    <SheetFrame title="Anonymous counts" sub={on ? PULSE_WORDS.all : off ? PULSE_WORDS.off : PULSE_WORDS.basic}>
      <T>
        Daybook is built by one person. Your phone sends a few numbers once a day, for days that are over. The server adds them to totals for everyone and keeps
        nothing else, so no count can be traced back to you.
      </T>
      <SheetH title="Basic counts" />
      <T v="small" tone="muted">
        {off ? 'Off.' : 'On.'} Only whether Daybook was opened that day, and how far setup got:
      </T>
      {list(BASIC)}
      <SheetH title="More counts" />
      <T v="small" tone="muted">
        {on ? 'On.' : 'Off until you turn them on.'} Which parts of Daybook were used, like these:
      </T>
      {list(MORE)}
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
        {on ? <Button label="Done" onPress={closeSheet} /> : <Button label={off ? 'Send anonymous counts' : 'Send more counts'} onPress={() => set(true)} />}
        {!off ? (
          <View style={{ alignItems: 'center' }}>
            <Link label="Turn all counts off" tone="muted" onPress={() => set(false)} />
          </View>
        ) : null}
      </Dock>
    </SheetFrame>
  );
}
