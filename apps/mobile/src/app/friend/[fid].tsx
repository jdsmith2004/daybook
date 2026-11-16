/* Friends: one friend. Their flame and your together streak, their day and week in Daybook, how you hear about them (as it happens,
   at most two notes a day; once a day at the hour they picked; or not at all: the owner, November 15, 2026: "we can't overwhelm them
   with notifications"), the spark to send them (one a day; no chat), and at the bottom, quietly, Remove and Block and report (Apple
   Guideline 1.2). Removing is quiet both ways: the other person is not told. */
import { reportAt, REPORT_WHY, togetherNow, type Hear, type ReportWhy } from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BigFlame } from '@/components/big-flame';
import { Dock } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { LinkText } from '@/components/today';
import { Button, Card, Icon, T } from '@/components/ui';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { Spark } from '@/components/friends-art';
import { registerPush, useFriendsReady } from '@/lib/friends';
import { useStore } from '@/lib/store';
import { sendFeedback } from '@/lib/pulse';
import { useTheme } from '@/lib/theme';

export default function Friend() {
  const c = useTheme();
  const { fid } = useLocalSearchParams<{ fid: string }>();
  const fr = useFriendsReady();
  const { tk } = useStore();
  const { height } = useWindowDimensions();
  const f = fr.data?.friends.find((x) => x.fid === fid);
  const [hearing, setHearing] = useState<Hear | null>(null);
  const [pulse, setPulse] = useState(0);
  const [msg, setMsg] = useState('');
  const [end, setEnd] = useState<null | 'remove' | 'block'>(null);
  const [why, setWhy] = useState<ReportWhy | null>(null);
  const [busy, setBusy] = useState(false);

  if (!f && !fr.ready) return <SheetFrame title=" ">{null}</SheetFrame>;
  if (!f)
    return (
      <SheetFrame title="Friend">
        <T tone="muted">This friendship is not here any more.</T>
      </SheetFrame>
    );

  const sentToday = !!f.sent && Date.now() - f.sent < 20 * 3600_000;
  const tg = togetherNow(f.together, tk);
  const hear: Hear = hearing || f.hear || 'live';
  const send = async () => {
    setBusy(true);
    const r = await fr.call('cheer', { fid: f.fid, k: 'spark' });
    setBusy(false);
    if (!r.ok) return setMsg(r.msg);
    buzz('lit');
    setPulse((n) => n + 1);
    if (!fr.demo) track('friend_cheer', { what: 'spark' });
    setMsg('Your spark is with ' + f.name + '. It goes into their next lesson.');
  };
  const pickHear = async (h: Hear) => {
    if (h === hear) return;
    buzz('tick');
    setHearing(h);
    const r = await fr.call('hear', { fid: f.fid, hear: h });
    if (!r.ok) {
      setHearing(null);
      return setMsg(r.msg);
    }
    if (!fr.demo) track('friend_hear', { what: h });
    /* as it happens needs this phone's push token; asking for notes if they were never asked */
    if (h === 'live') registerPush(fr.api, true).catch(() => undefined);
  };
  const finish = async () => {
    setBusy(true);
    const r = end === 'remove' ? await fr.call('remove', { fid: f.fid }) : await fr.call('block', { fid: f.fid, why });
    setBusy(false);
    if (!r.ok) return setMsg(r.msg);
    /* the owner hears of a report at once, through the feedback inbox: only that one came in and why, never who or what they wrote
       (that stays in the #reports partition of the records table, for the owner to read there) */
    if (end === 'block' && why && !fr.demo)
      sendFeedback('A Friends report came in (' + why + '). It is in the #reports partition of daybook-records.', '').catch(() => false);
    closeSheet();
  };

  return (
    <SheetFrame title={f.name}>
      <View style={{ gap: 24, minHeight: Math.max(480, height - 150) }}>
        <View style={s.top}>
          <BigFlame level={f.vals.level || 1} size={150} noLand pulse={pulse} />
          <T v="small" tone="muted" style={{ textAlign: 'center' }}>
            {[
              f.vals.level ? 'Level ' + f.vals.level + (f.vals.lname ? ', ' + f.vals.lname : '') : '',
              tg.n ? tg.n + (tg.n === 1 ? ' day' : ' days') + ' together' : '',
              tg.best > tg.n ? 'longest ' + tg.best : '',
            ]
              .filter(Boolean)
              .join(' · ')}
          </T>
        </View>

        <View style={{ gap: 8 }}>
          <T v="label">Notes about {f.name}</T>
          <View style={{ gap: 8 }} accessibilityRole="radiogroup">
            {(
              [
                ['live', 'As it happens', 'When ' + f.name + ' does a lesson or checks in, and their sparks. At most 2 notes a day, none at night.'],
                ['daily', 'Once a day', f.rt ? 'One note at ' + reportAt(f.rt) + ', the hour ' + f.name + ' picked.' : 'One note a day.'],
                ['off', 'Off', 'No notes. You see it all here.'],
              ] as [Hear, string, string][]
            ).map(([k, label, sub]) => (
              <Pressable
                key={k}
                accessibilityRole="radio"
                accessibilityState={{ checked: hear === k }}
                onPress={() => pickHear(k)}
                style={({ pressed }) => [s.opt, { backgroundColor: hear === k ? c.sunSoft : c.surface }, pressed && { opacity: 0.85 }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="label" style={{ color: hear === k ? c.sunText : c.ink }}>
                    {label}
                  </T>
                  <T v="small" tone="muted">
                    {sub}
                  </T>
                </View>
                {hear === k ? <Icon name="check" size={20} color={c.sunText} /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        <Dock>
          {!end ? (
            <View style={{ gap: 8 }}>
              {msg || sentToday ? (
                <View style={s.sent} accessibilityLiveRegion="polite">
                  <Spark size={30} still />
                  <T tone="muted" style={{ flex: 1 }}>
                    {msg ||
                      (f.sentUsed ? 'Your spark was in ' + f.name + '\u2019s lesson.' : 'Your spark is with ' + f.name + '. It goes into their next lesson.')}
                  </T>
                </View>
              ) : (
                <Button label={busy ? 'One moment' : 'Send ' + f.name + ' a spark'} icon="sparkle" disabled={busy} onPress={send} />
              )}
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {end === 'remove' ? (
                <T>Remove {f.name}? They are not told, and you each stop seeing the other.</T>
              ) : (
                <>
                  <T>Block {f.name}? They are not told, and they cannot use your code again. If you report it, Daybook looks at it within a day.</T>
                  <T v="label">Report it too, if you want</T>
                  <View style={{ gap: 8 }} accessibilityRole="radiogroup">
                    {REPORT_WHY.map((r) => (
                      <Pressable
                        key={r.k}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: why === r.k }}
                        onPress={() => setWhy(why === r.k ? null : r.k)}
                        style={[s.cheer, { backgroundColor: why === r.k ? c.accentSoft : c.surface, borderColor: 'transparent' }]}>
                        <T v="label" style={{ color: why === r.k ? c.accentText : c.ink }}>
                          {r.label}
                        </T>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
              {msg ? <T tone="danger">{msg}</T> : null}
              <Button kind="danger" disabled={busy} label={end === 'remove' ? 'Remove' : why ? 'Block and report' : 'Block'} onPress={finish} />
              <View style={{ alignItems: 'center' }}>
                <LinkText label="Keep" onPress={() => setEnd(null)} />
              </View>
            </View>
          )}

          {!end ? (
            <View style={s.quiet}>
              <LinkText label={'Remove ' + f.name} onPress={() => setEnd('remove')} />
              <LinkText label="Block or report" onPress={() => setEnd('block')} />
            </View>
          ) : null}
        </Dock>
      </View>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  top: { alignItems: 'center', gap: 4 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 },
  sent: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  cheer: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1.5 },
  quiet: { alignItems: 'center', gap: 4, paddingTop: 8 },
});
