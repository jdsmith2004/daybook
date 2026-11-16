/* Friends: one friend. Their flame, their goals and the effort they share, then a ready-made encouragement (one a day; no chat), and at
   the bottom, quietly, Remove and Block and report (Apple Guideline 1.2). Removing is quiet both ways: the other person is not told. */
import { FRIEND_CHEERS, friendLines, friendToday, reportAt, REPORT_WHY, type CheerKind, type ReportWhy } from '@daybook/core';
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
import { muteReport, useFriendsLocal, useFriendsReady } from '@/lib/friends';
import { useStore } from '@/lib/store';
import { Toggle } from '@/components/settings-ui';
import { sendFeedback } from '@/lib/pulse';
import { useTheme } from '@/lib/theme';

export default function Friend() {
  const c = useTheme();
  const { fid } = useLocalSearchParams<{ fid: string }>();
  const fr = useFriendsReady();
  const lo = useFriendsLocal();
  const { tk } = useStore();
  const { height } = useWindowDimensions();
  const f = fr.data?.friends.find((x) => x.fid === fid);
  const [pick, setPick] = useState<CheerKind | null>(null);
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
  const lines = friendLines(f.vals);
  const today = friendToday(f.vals, tk);
  const muted = (lo.mute || []).includes(f.fid);
  const send = async () => {
    if (!pick) return;
    setBusy(true);
    const r = await fr.call('cheer', { fid: f.fid, k: pick });
    setBusy(false);
    if (!r.ok) return setMsg(r.msg);
    buzz('lit');
    setPulse((n) => n + 1);
    track('friend_cheer', { what: pick });
    setMsg('Sent. ' + f.name + ' sees it next time they open Friends.');
  };
  const finish = async () => {
    setBusy(true);
    const r = end === 'remove' ? await fr.call('remove', { fid: f.fid }) : await fr.call('block', { fid: f.fid, why });
    setBusy(false);
    if (!r.ok) return setMsg(r.msg);
    /* the owner hears of a report at once, through the feedback inbox: only that one came in and why, never who or what they wrote
       (that stays in the #reports partition of the records table, for the owner to read there) */
    if (end === 'block' && why)
      sendFeedback('A Friends report came in (' + why + '). It is in the #reports partition of daybook-records.', '').catch(() => false);
    closeSheet();
  };

  return (
    <SheetFrame title={f.name}>
      <View style={{ gap: 24, minHeight: Math.max(480, height - 150) }}>
        <View style={s.top}>
          <BigFlame level={f.vals.level || 1} size={170} noLand pulse={pulse} />
          {f.vals.level ? (
            <T v="small" tone="muted">
              Level {f.vals.level}
              {f.vals.lname ? ' · ' + f.vals.lname : ''}
            </T>
          ) : null}
        </View>

        <Card style={{ gap: 8 }}>
          {today ? <T v="label">Today: {today}</T> : null}
          {lines.length ? (
            <T v="small" tone="muted">
              This week: {lines.join(' · ')}
            </T>
          ) : null}
          {!today && !lines.length ? (
            <T v="small" tone="muted">
              Nothing to show yet this week.
            </T>
          ) : null}
          {f.rt ? (
            <View style={s.report}>
              <T v="small" style={{ flex: 1 }}>
                Daily report at {reportAt(f.rt)}
              </T>
              <Toggle on={!muted} label={'Daily report from ' + f.name} onChange={(v) => muteReport(f.fid, !v)} />
            </View>
          ) : null}
        </Card>

        <Dock>
          {!end ? (
            <View style={{ gap: 8 }}>
              {sentToday && !msg ? (
                <T tone="muted" style={{ textAlign: 'center' }}>
                  You cheered {f.name} on today.
                </T>
              ) : (
                <>
                  <View style={s.cheers} accessibilityRole="radiogroup">
                    {FRIEND_CHEERS.map((x) => (
                      <Pressable
                        key={x.k}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: pick === x.k }}
                        disabled={!!msg}
                        onPress={() => {
                          buzz('tick');
                          setPick(x.k);
                        }}
                        style={({ pressed }) => [
                          s.cheer,
                          { backgroundColor: pick === x.k ? c.sunSoft : c.surface, borderColor: pick === x.k ? c.sun2 : 'transparent' },
                          pressed && { opacity: 0.8 },
                        ]}>
                        <Icon name={x.k === 'warm' ? 'flame' : x.k === 'proud' ? 'star' : 'heart'} size={20} color={pick === x.k ? c.sunText : c.muted} />
                        <T v="label" style={{ color: pick === x.k ? c.sunText : c.ink }}>
                          {x.send}
                        </T>
                      </Pressable>
                    ))}
                  </View>
                  {msg ? (
                    <T tone="muted" style={{ textAlign: 'center' }} accessibilityLiveRegion="polite">
                      {msg}
                    </T>
                  ) : (
                    <Button label={busy ? 'Sending' : 'Send'} disabled={!pick || busy} onPress={send} />
                  )}
                </>
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
  cheers: { gap: 8 },
  cheer: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1.5 },
  quiet: { alignItems: 'center', gap: 4, paddingTop: 8 },
  report: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
});
