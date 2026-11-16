/* Friends (beta): the person, and the one or two people on their side, inside Daybook (the owner, November 15, 2026; docs/plan.md
   "Friends (beta)"). Opened from Settings for now; the journal and the tabs stay where they are.

   Made for the usual case, one friend (the owner, the same day: "most people are going to only have like one person ... Having five
   like this is insane"): your flame and theirs in one sky, then their day and week at a glance with one tap to warm their flame, then
   what they see of you in one line (its own sheet, friend-share.tsx), then the community that is coming. Calm on purpose: no counts
   side by side, no "last seen", no badges, no red. */
import { gameCompute, reportAt, type ShareKey } from '@daybook/core';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { BigFlame } from '@/components/big-flame';
import { CommunityScene, FriendReport, Hearth } from '@/components/friends-art';
import { MAX_WIDTH } from '@/lib/theme';
import { Screen } from '@/components/screen';
import { LinkText } from '@/components/today';
import { Button, Card, Icon, T } from '@/components/ui';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { joinCommunity, keepCode, keepNext, markSeen, takeNext, useFriends, useFriendsLocal } from '@/lib/friends';
import { startFriendsDemo } from '@/lib/friends-demo';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { useTheme } from '@/lib/theme';

export default function Friends() {
  const c = useTheme();
  const p = useLocalSearchParams<{ code?: string; demo?: string }>();
  if (p.demo === '1') startFriendsDemo();
  const { snap, tk } = useStore();
  const sync = useSync();
  const fr = useFriends();
  const lo = useFriendsLocal();
  const { width: win } = useWindowDimensions();
  /* the page's column: the screen less its 16 edges, never wider than the app's column */
  const width = Math.min(win, MAX_WIDTH) - 32;
  const st = snap.settings;
  const level = st ? gameCompute(snap.days, st, snap.reviews, tk).level.n : 1;

  useFocusEffect(
    useCallback(() => {
      fr.load().catch(() => undefined);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fr.signedIn]),
  );
  /* a link with a code (…/friends?code=K7QM2P) is kept, so it survives setup and the account sheet */
  useEffect(() => {
    if (p.code) keepCode(p.code);
  }, [p.code]);
  /* once signed in and the card is known, carry on with what the person set out to do: the code they were sent, or adding a friend */
  const ready = fr.signedIn && !fr.loading && !!fr.data;
  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      const t = takeNext();
      if (t.code) router.push({ pathname: '/friend-code', params: { code: t.code } });
      else if (t.next === 'add') router.push('/friend-add');
      else if (t.next === 'code') router.push('/friend-code');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready]),
  );

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
    if (needAccount) {
      keepNext('add');
      return sync.signInNow({ why: 'friends' });
    }
    router.push('/friend-add');
  };
  const haveCode = () => {
    if (needAccount) {
      if (!lo.pending) keepNext('code');
      return sync.signInNow({ why: 'friends' });
    }
    router.push('/friend-code');
  };

  /* one tap warms a friend's flame (the other two encouragements are on their sheet) */
  const [warming, setWarming] = useState<string | null>(null);
  const warm = async (fid: string) => {
    setWarming(fid);
    const r = await fr.call('cheer', { fid, k: 'warm' });
    setWarming(null);
    if (r.ok) {
      buzz('lit');
      if (!fr.demo) track('friend_cheer', { what: 'warm' });
    }
  };
  const open = (fid: string) => router.push({ pathname: '/friend/[fid]', params: { fid } });

  return (
    <Screen title="Friends" back="Settings" sub={<T tone="muted">Beta</T>}>
      {fr.demo ? (
        <Card tone="note">
          <T v="label" style={{ color: c.sunText }}>
            A demo with a made-up friend. Tap anything: nothing is real, and nothing is sent.
          </T>
        </Card>
      ) : null}
      {lo.pending && needAccount ? (
        <Card tone="note">
          <T v="label" style={{ color: c.sunText }}>
            A friend sent you a code. Make a free account, and it is waiting for you.
          </T>
        </Card>
      ) : null}

      <Hearth level={level} friends={friends} width={width} pulse={pulse} onAdd={add} onFriend={open} />

      {friends.length ? (
        <>
          {friends.map((f) => (
            <FriendReport
              key={f.fid}
              f={f}
              tk={tk}
              fresh={fresh.some((x) => x.fid === f.fid)}
              busy={warming === f.fid}
              onOpen={() => open(f.fid)}
              onWarm={() => warm(f.fid)}
            />
          ))}
          {fr.demo ? <DemoNote /> : null}
          {me ? <TheySee on={me.on} rt={me.rt} one={friends.length === 1 ? friends[0].name : null} /> : null}
          <View style={s.links}>
            <LinkText label="Add another friend" onPress={add} />
          </View>
        </>
      ) : (
        <>
          <View style={s.lead}>
            <T v="h2">Walk it with a friend</T>
            <T tone="muted">One person on your side is enough. They see how often you do a lesson and check in, and your flame. Never a slip.</T>
          </View>
          <View style={s.actions}>
            {lo.pending && needAccount ? <Button label="Make a free account" onPress={haveCode} /> : <Button label="Add a friend" icon="plus" onPress={add} />}
            <View style={{ alignItems: 'center' }}>{lo.pending && needAccount ? null : <LinkText label="I have a code" onPress={haveCode} />}</View>
          </View>
        </>
      )}
      {fr.error && fr.signedIn ? (
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          {fr.error}
        </T>
      ) : null}

      <Community joined={!!lo.community} width={width} />
    </Screen>
  );
}

/* how each item reads in that one line */
const SEE: Record<ShareKey, string> = { lessons: 'lessons', checkins: 'check-ins', days: 'days in Daybook', rode: 'urges ridden out', level: 'flame' };

/** what your friend sees of you, in one line; the sheet has the switches */
function TheySee({ on, rt, one }: { on: Partial<Record<ShareKey, boolean>>; rt: string | null; one: string | null }) {
  const c = useTheme();
  const items = (Object.keys(SEE) as ShareKey[]).filter((k) => on[k]).map((k) => SEE[k]);
  const list = items.length ? 'Your ' + items.join(', ').replace(/, ([^,]*)$/, ' and $1') : 'Nothing yet';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        buzz('tap');
        router.push('/friend-share');
      }}
      style={({ pressed }) => [s.see, { backgroundColor: c.surface }, pressed && { opacity: 0.8 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{one ? 'What ' + one + ' sees of you' : 'What your friends see'}</T>
        <T v="small" tone="muted">
          {list}
          {rt ? ' · a daily report at ' + reportAt(rt) : ''}
        </T>
      </View>
      <Icon name="next" size={16} color={c.muted} />
    </Pressable>
  );
}

/** the community that is coming: its night of far fires, and a way to pre-join */
function Community({ joined, width }: { joined: boolean; width: number }) {
  const c = useTheme();
  return (
    <View style={[s.community, { backgroundColor: c.surface }]}>
      <CommunityScene joined={joined} width={width} />
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ gap: 4 }}>
          <View style={s.cardHead}>
            <T v="h2" style={{ flex: 1 }}>
              Community
            </T>
            <T v="small" style={{ color: c.sunText }}>
              Coming soon
            </T>
          </View>
          <T tone="muted">A calm place to walk this with others. It is being built now, and it opens once enough people have joined.</T>
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
      </View>
    </View>
  );
}

/** the demo shows the daily report as it arrives on a friend's phone (a picture: the web has no notes) */
function DemoNote() {
  const c = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <T v="small" tone="muted">
          Sam&apos;s daily report, as it arrives on your phone at 9 PM:
        </T>
        <View
          style={[s.note, { backgroundColor: c.surface2 }]}
          accessibilityLabel="A notification from Daybook: Sam. How Sam’s day went. Warm their flame if you like.">
          <View style={[s.noteIcon, { backgroundColor: c.bg }]}>
            <BigFlame level={4} size={30} noLand />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={s.cardHead}>
              <T v="label" style={{ flex: 1 }}>
                Sam
              </T>
              <T v="small" tone="muted">
                9:00 PM
              </T>
            </View>
            <T v="small">How Sam’s day went. Warm their flame if you like.</T>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  lead: { gap: 4 },
  actions: { gap: 4 },
  links: { alignItems: 'center' },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  see: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16 },
  community: { borderRadius: 20, overflow: 'hidden' },
  joined: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 12 },
  noteIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
