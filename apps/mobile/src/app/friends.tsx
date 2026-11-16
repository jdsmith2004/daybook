/* Friends (beta): a few people on your side, inside Daybook (the owner, November 15, 2026; docs/plan.md "Friends (beta)"). Opened from
   Settings for now; the journal and the tabs stay where they are.

   One sky holds your flame with your friends' flames beside it: the circle you are building, never a ranking (every friend's flame is
   drawn the same size). Below it, encouragement that came in, your friends, what they see of you (each item off until you turn it
   on), and the community that is coming. Calm on purpose: no counts side by side, no "last seen", no badges, no red. */
import { FRIEND_CHEERS, friendLines, gameCompute, SHARE_KEYS, SHARE_WORDS, weekShare, type ShareKey } from '@daybook/core';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Flame } from '@/components/flame';
import { FlameSky } from '@/components/flame-sky';
import { skyInk } from '@/components/hero';
import { Screen } from '@/components/screen';
import { LinkText } from '@/components/today';
import { Button, Card, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { joinCommunity, markSeen, useFriends, useFriendsLocal, type FriendView } from '@/lib/friends';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { useTheme } from '@/lib/theme';

export default function Friends() {
  const c = useTheme();
  const p = useLocalSearchParams<{ code?: string }>();
  const { snap, tk } = useStore();
  const sync = useSync();
  const fr = useFriends();
  const lo = useFriendsLocal();
  const { width } = useWindowDimensions();
  const st = snap.settings;
  const level = st ? gameCompute(snap.days, st, snap.reviews, tk).level.n : 1;

  useFocusEffect(
    useCallback(() => {
      fr.load().catch(() => undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fr.signedIn]),
  );
  /* a link with a code (…/friends?code=K7QM2P) opens the code sheet with it filled in */
  useEffect(() => {
    if (p.code) router.push({ pathname: '/friend-code', params: { code: p.code } });
  }, [p.code]);

  const data = fr.signedIn ? fr.data : null;
  const friends = data?.friends || [];
  const me = data?.me || null;
  /* encouragement that came in since it was last seen, newest first */
  const fresh = friends.filter((f) => f.cheer && f.cheer.at > (lo.seen || 0)).sort((a, b) => b.cheer!.at - a.cheer!.at);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!fresh.length) return;
    const t = setTimeout(() => {
      setPulse((n) => n + 1);
      buzz('save');
    }, 600);
    const t2 = setTimeout(() => markSeen(fresh[0].cheer!.at), 4000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fresh.length && fresh[0].cheer!.at]);

  /* the first tap asks for the free account; the account sheet comes back here */
  const needAccount = !fr.signedIn && sync.status.k !== 'off';
  const add = () => {
    if (needAccount) return sync.signInNow({ why: 'friends' });
    router.push(me ? '/friend-add' : { pathname: '/friend-me', params: { next: 'add' } });
  };
  const haveCode = () => {
    if (needAccount) return sync.signInNow({ why: 'friends' });
    router.push(me ? '/friend-code' : { pathname: '/friend-me', params: { next: 'code' } });
  };

  const SKY = Math.min(300, Math.round(width * 0.72));
  return (
    <Screen title="Friends" back="Settings" sub={<T tone="muted">Beta</T>}>
      <Circle level={level} friends={friends} height={SKY} pulse={pulse} onAdd={add} />

      {fresh.length ? (
        <Card tone="note" style={s.cheer}>
          <Icon name="flame" size={20} color={c.sunText} />
          <T v="label" style={{ flex: 1, color: c.sunText }}>
            {fresh.map((f) => f.name + ' ' + (FRIEND_CHEERS.find((x) => x.k === f.cheer!.k)?.got || 'cheered you on')).join('. ')}
          </T>
        </Card>
      ) : null}

      {friends.length ? (
        <View style={s.section}>
          <T v="h2">Your friends</T>
          <Card style={{ paddingVertical: 4 }}>
            {friends.map((f, i) => (
              <FriendRow key={f.fid} f={f} last={i === friends.length - 1} />
            ))}
          </Card>
        </View>
      ) : (
        <View style={s.lead}>
          <T v="h2">Walk it with a friend</T>
          <T tone="muted">Add one or two people who are on your side. They see your goals and the effort you choose to share. Never a slip.</T>
        </View>
      )}

      {me ? <YourCard /> : null}

      <View style={s.actions}>
        <Button label="Add a friend" icon="plus" onPress={add} />
        <View style={{ alignItems: 'center' }}>
          <LinkText label="I have a code" onPress={haveCode} />
        </View>
        {fr.error && fr.signedIn ? (
          <T v="small" tone="muted" style={{ textAlign: 'center' }}>
            {fr.error}
          </T>
        ) : null}
      </View>

      <Community joined={!!lo.community} />

      {me ? (
        <View style={{ alignItems: 'center' }}>
          <LeaveFriends />
        </View>
      ) : null}
    </Screen>
  );
}

/** where friends' flames stand around yours, as [left %, bottom px] of the sky; the rest are counted */
const SEATS: [number, number][] = [
  [8, 18],
  [74, 18],
  [26, 6],
  [56, 6],
];

/** your flame with your friends' flames beside it, all the same size; empty seats wait for the first two */
function Circle({ level, friends, height, pulse, onAdd }: { level: number; friends: FriendView[]; height: number; pulse: number; onAdd: () => void }) {
  const ink = skyInk(level);
  const shown = friends.slice(0, SEATS.length);
  const more = friends.length - shown.length;
  const empty = Math.max(0, 2 - friends.length);
  const SMALL = Math.round(height * 0.26);
  return (
    <View style={s.circle}>
      <FlameSky level={level} height={height} flame={Math.round(height * 0.6)} foot={Math.round(height * 0.12)} key={pulse}>
        {shown.map((f, i) => (
          <View key={f.fid} style={[s.seat, { left: `${SEATS[i][0]}%`, bottom: SEATS[i][1] }]} pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={f.name + (f.vals.level ? ', level ' + f.vals.level : '')}
              onPress={() => {
                buzz('tap');
                router.push({ pathname: '/friend/[fid]', params: { fid: f.fid } });
              }}
              style={{ alignItems: 'center' }}>
              <Flame level={f.vals.level || 1} size={SMALL} alive />
              <T v="small" numberOfLines={1} style={{ color: ink.ink, maxWidth: SMALL + 24, textAlign: 'center' }}>
                {f.name}
              </T>
            </Pressable>
          </View>
        ))}
        {Array.from({ length: empty }).map((_, i) => {
          const at = SEATS[friends.length + i];
          return (
            <Pressable
              key={'e' + i}
              accessibilityRole="button"
              accessibilityLabel="Add a friend"
              onPress={onAdd}
              style={[s.seat, { left: `${at[0]}%`, bottom: at[1] + SMALL * 0.2 }]}>
              <View style={[s.empty, { width: SMALL * 0.8, height: SMALL * 0.8, borderRadius: SMALL, borderColor: ink.soft }]}>
                <Icon name="plus" size={20} color={ink.soft} />
              </View>
            </Pressable>
          );
        })}
        {more > 0 ? (
          <View style={[s.more, { backgroundColor: ink.glass }]}>
            <T v="small" style={{ color: ink.ink }}>
              +{more}
            </T>
          </View>
        ) : null}
      </FlameSky>
    </View>
  );
}

function FriendRow({ f, last }: { f: FriendView; last: boolean }) {
  const c = useTheme();
  const lines = friendLines(f.vals);
  const line = lines.length ? lines.join(' · ') : f.goals[0] || '';
  const sentToday = !!f.sent && Date.now() - f.sent < 20 * 3600_000;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        buzz('tap');
        router.push({ pathname: '/friend/[fid]', params: { fid: f.fid } });
      }}
      style={({ pressed }) => [s.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }, pressed && { opacity: 0.7 }]}>
      <Flame level={f.vals.level || 1} size={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{f.name}</T>
        {line ? (
          <T v="small" tone="muted" numberOfLines={2}>
            {line}
          </T>
        ) : null}
      </View>
      {sentToday ? <Icon name="flame" size={16} color={c.sun2} /> : null}
      <Icon name="next" size={16} color={c.muted} />
    </Pressable>
  );
}

/** what your friends see of you, drawn as they see it; each item is a chip you turn on or off */
function YourCard() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const fr = useFriends();
  const me = fr.data!.me!;
  const [busy, setBusy] = useState<ShareKey | null>(null);
  const [err, setErr] = useState('');
  const vals = useMemo(() => (snap.settings ? weekShare(snap.days, snap.settings, snap.reviews, tk) : {}), [snap, tk]);
  const flip = async (k: ShareKey) => {
    buzz('tap');
    setBusy(k);
    const e = await fr.saveCard({ name: me.name, goals: me.goals, on: { ...me.on, [k]: !me.on[k] } });
    setBusy(null);
    setErr(e || '');
  };
  return (
    <View style={s.section}>
      <T v="h2">What your friends see</T>
      <Card style={{ gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Change your name and goals. ' + me.name}
          onPress={() => router.push('/friend-me')}
          style={({ pressed }) => [{ gap: 4 }, pressed && { opacity: 0.7 }]}>
          <View style={s.cardHead}>
            <T v="label" style={{ flex: 1 }}>
              {me.name}
            </T>
            <Icon name="pencil" size={16} color={c.muted} />
          </View>
          {me.goals.length ? (
            me.goals.map((g, i) => (
              <T key={i} tone="muted">
                {g}
              </T>
            ))
          ) : (
            <T tone="muted">Add a goal or two</T>
          )}
        </Pressable>
        <View style={s.chips}>
          {SHARE_KEYS.map((k) => {
            const on = !!me.on[k];
            const n = k === 'level' ? vals.level || 1 : (vals[k] ?? 0);
            return (
              <Pressable
                key={k}
                accessibilityRole="switch"
                accessibilityState={{ checked: on, busy: busy === k }}
                accessibilityLabel={SHARE_WORDS[k].label + '. ' + SHARE_WORDS[k].hint}
                disabled={!!busy}
                onPress={() => flip(k)}
                style={({ pressed }) => [
                  s.chip,
                  on ? { backgroundColor: c.accentSoft } : { backgroundColor: c.bg, borderColor: c.line, borderWidth: 1, borderStyle: 'dashed' },
                  pressed && { opacity: 0.7 },
                ]}>
                {on ? <Icon name="check" size={14} color={c.accentText} /> : null}
                <T v="small" style={{ color: on ? c.accentText : c.muted }}>
                  {on ? (k === 'level' ? 'Level ' + n + (vals.lname ? ' · ' + vals.lname : '') : SHARE_WORDS[k].friend(n)) : SHARE_WORDS[k].label}
                </T>
              </Pressable>
            );
          })}
        </View>
        <T v="small" tone="muted">
          Tap one to share it. A slip, your journal and your notes are never shared.
        </T>
        {err ? (
          <T v="small" tone="danger">
            {err}
          </T>
        ) : null}
      </Card>
    </View>
  );
}

/** the community that is coming: its shape (many flames, still dim), and a way to pre-join */
function Community({ joined }: { joined: boolean }) {
  const c = useTheme();
  return (
    <View style={s.section}>
      <Card style={{ gap: 12, overflow: 'hidden' }}>
        <View style={s.crowd} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {[1, 3, 2, 5, 4, 2, 6, 3, 1].map((l, i) => (
            <View key={i} style={{ opacity: joined && i === 4 ? 1 : 0.35, marginTop: i % 2 ? 10 : 0 }}>
              <Flame level={l} size={i === 4 ? 40 : 30} />
            </View>
          ))}
        </View>
        <View style={{ gap: 4 }}>
          <View style={s.cardHead}>
            <T v="h2" style={{ flex: 1 }}>
              Community
            </T>
            <T v="small" style={{ color: c.sunText }}>
              Coming soon
            </T>
          </View>
          <T tone="muted">
            A calm place to walk this with others. It is being built now, and it opens once enough people have joined. Pre-join, and you are in.
          </T>
        </View>
        {joined ? (
          <View style={s.joined} accessibilityLiveRegion="polite">
            <Icon name="check" size={18} color={c.mintText} />
            <T v="label" style={{ color: c.mintText }}>
              You are on the list
            </T>
          </View>
        ) : (
          <Button
            label="Pre-join"
            kind="ghost"
            onPress={() => {
              joinCommunity();
              buzz('save');
            }}
          />
        )}
      </Card>
    </View>
  );
}

/** leaving Friends: two steps, and it says what happens */
function LeaveFriends() {
  const fr = useFriends();
  const [ask, setAsk] = useState(false);
  const [msg, setMsg] = useState('');
  if (!ask) return <LinkText label="Leave Friends" onPress={() => setAsk(true)} />;
  return (
    <View style={{ gap: 8, alignItems: 'center', width: '100%' }}>
      <T tone="muted" style={{ textAlign: 'center' }}>
        Your card, your code and every friendship here are removed. Your friends are not told.
      </T>
      <Button
        label="Leave Friends"
        kind="danger"
        onPress={async () => {
          const r = await fr.call('leave');
          if (!r.ok) setMsg(r.msg);
          else setAsk(false);
        }}
      />
      <LinkText label="Stay" onPress={() => setAsk(false)} />
      {msg ? <T v="small">{msg}</T> : null}
    </View>
  );
}

const s = StyleSheet.create({
  circle: { borderRadius: 20, overflow: 'hidden' },
  seat: { position: 'absolute', alignItems: 'center' },
  empty: { borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  more: { position: 'absolute', right: 12, top: 12, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  cheer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lead: { gap: 4 },
  section: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, minHeight: 36 },
  actions: { gap: 4 },
  crowd: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 2, paddingTop: 4 },
  joined: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 },
});
