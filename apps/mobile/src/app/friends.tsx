/* Friends (beta): the person, and the one or two people on their side, inside Daybook (the owner, November 15, 2026; docs/plan.md
   "Friends (beta)"). Opened from Settings for now; the journal and the tabs stay where they are.

   Made for the usual case, one friend (the owner, the same day: "most people are going to only have like one person"), and built
   like Today: the page opens on a sky from edge to edge, your flame and theirs standing on one land, your together streak low on
   the left (days in a row you were both in Daybook; the owner: "a together streak and it's just days they both log in"), the last
   seven days on the right. Under it, their day and week, and the one thing to do: send a spark. It flies from your flame to theirs,
   waits beside their flame for their next lesson, and that lesson tells them it was in it; you are told it was used (the owner: the
   spark "visits and comes back"). A spark they sent you glows beside your flame, with the way to your lesson right there. Calm on
   purpose: no "last seen", no badges, no red, and a quiet day never reads as missing. */
import { gameCompute, lessonToday, reportAt, sparkBack, sparkGot, friendToday, type DayKey, type ShareKey } from '@daybook/core';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunityScene, FriendsSky, FriendWeek, Spark } from '@/components/friends-art';
import { Screen } from '@/components/screen';
import { LinkText } from '@/components/today';
import { Button, Icon, T } from '@/components/ui';
import { skyInk } from '@/components/hero';
import { track } from '@/lib/events';
import { buzz } from '@/lib/feel';
import { joinCommunity, keepCode, keepNext, markSeen, takeNext, useFriends, useFriendsLocal, type FriendView } from '@/lib/friends';
import { startFriendsDemo } from '@/lib/friends-demo';
import { useBackLabel, useOverModal } from '@/lib/nav';
import { useStore } from '@/lib/store';
import { useSync } from '@/lib/sync';
import { MAX_WIDTH, useTheme } from '@/lib/theme';

/** how a person hears about a friend, said in a few words */
export const HEAR_WORDS = { live: 'As it happens, at most 2 a day', daily: 'Once a day', off: 'Off' } as const;

export default function Friends() {
  const c = useTheme();
  const p = useLocalSearchParams<{ code?: string; demo?: string }>();
  if (p.demo === '1') startFriendsDemo();
  const { snap, tk } = useStore();
  const sync = useSync();
  const fr = useFriends();
  const lo = useFriendsLocal();
  const { width: win, height: winH } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const over = useOverModal();
  const top = Platform.OS === 'ios' && over ? 0 : inset.top;
  const backLabel = useBackLabel('Settings');
  /* the page's column (for the community picture), and the sky's size */
  const col = Math.min(win, MAX_WIDTH) - 32;
  /* the sky is as tall as the two flames need: the frame at the top, the flames as big as the width lets them be, the foot */
  const big = Math.round(Math.min(win * 0.47, 230, winH * 0.3));
  const sky = top + 92 + big + 104;
  const st = snap.settings;
  const level = st ? gameCompute(snap.days, st, snap.reviews, tk).level.n : 1;
  const ink = skyInk(level);
  const [past, setPast] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const scrolled = useRef(0);

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
  /* a spark from a friend that came since it was last seen: your flame blooms once as the page opens */
  const fresh = friends.filter((f) => f.cheer && f.cheer.at > (lo.seen || 0)).sort((a, b) => b.cheer!.at - a.cheer!.at);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!fresh.length) return;
    const t = setTimeout(() => {
      setPulse((n) => n + 1);
      buzz('save');
    }, 700);
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

  /* a spark: it flies across the sky, then waits beside their flame */
  const [sparking, setSparking] = useState<string | null>(null);
  const [flying, setFlying] = useState(0);
  const [err, setErr] = useState('');
  const spark = async (fid: string) => {
    setSparking(fid);
    setErr('');
    const r = await fr.call('cheer', { fid, k: 'spark' });
    setSparking(null);
    if (!r.ok) return setErr(r.msg);
    buzz('tap');
    /* the page glides back up to the sky first, so the spark is seen flying across */
    const up = scrolled.current > 40;
    if (up) scroll.current?.scrollTo({ y: 0, animated: true });
    setTimeout(() => setFlying((n) => n + 1), up ? 450 : 0);
    if (!fr.demo) track('friend_cheer', { what: 'spark' });
  };
  const open = (fid: string) => router.push({ pathname: '/friend/[fid]', params: { fid } });

  /* today's lesson, for the spark that waits for it */
  const lesson = st ? lessonToday(snap.days, st, tk, true) : null;
  const lessonDone = (snap.days[tk]?.p?.ls || []).length > 0;
  const toLesson = lesson && !lessonDone ? () => router.push({ pathname: '/lesson/[id]', params: { id: lesson.L.id } }) : null;
  const mineWaits = friends.some((f) => f.cheer?.k === 'spark' && !f.cheer.used);

  return (
    <Screen
      title="Friends"
      scrollRef={scroll}
      bare={!past}
      onScroll={(y) => {
        scrolled.current = y;
        if (y > sky - 60 !== past) setPast(y > sky - 60);
      }}
      top={
        <FriendsSky
          level={level}
          friends={friends}
          width={win}
          height={sky}
          big={big}
          top={top}
          tk={tk}
          back={backLabel}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          onAdd={add}
          onFriend={open}
          pulse={pulse}
          flying={flying}
          mineWaits={mineWaits}
        />
      }>
      <StatusBar style={past ? (c.scheme === 'dark' ? 'light' : 'dark') : ink.light ? 'light' : 'dark'} />
      {lo.pending && needAccount ? (
        <T v="label" style={{ color: c.sunText }}>
          A friend sent you a code. Make a free account, and it is waiting for you.
        </T>
      ) : null}

      {friends.length ? (
        <>
          {friends.map((f) => (
            <FriendBlock
              key={f.fid}
              f={f}
              tk={tk}
              many={friends.length > 1}
              busy={sparking === f.fid}
              onOpen={() => open(f.fid)}
              onSpark={() => spark(f.fid)}
              toLesson={toLesson}
            />
          ))}
          {err ? (
            <T v="small" tone="muted" style={{ textAlign: 'center' }}>
              {err}
            </T>
          ) : null}
          <Rows>
            {me ? (
              <Row
                icon="shield"
                label={friends.length === 1 ? 'What ' + friends[0].name + ' sees of you' : 'What your friends see'}
                sub={seeLine(me.on, me.rt)}
                onPress={() => router.push('/friend-share')}
              />
            ) : null}
            {friends.length === 1 ? (
              <Row icon="phone" label={'Notes about ' + friends[0].name} sub={HEAR_WORDS[friends[0].hear || 'live']} onPress={() => open(friends[0].fid)} />
            ) : null}
            <Row icon="plus" label={friends.length === 1 ? 'Add another friend' : 'Add a friend'} onPress={add} />
          </Rows>
        </>
      ) : (
        <View style={{ gap: 20 }}>
          <View style={{ gap: 6 }}>
            <T v="h2">Walk it with a friend</T>
            <T tone="muted">
              They see how often you do a lesson and check in, and your flame. Never a slip. You send each other sparks that go into the next lesson.
            </T>
          </View>
          <View style={{ gap: 4 }}>
            {lo.pending && needAccount ? <Button label="Make a free account" onPress={haveCode} /> : <Button label="Add a friend" icon="plus" onPress={add} />}
            {lo.pending && needAccount ? null : (
              <View style={{ alignItems: 'center' }}>
                <LinkText label="I have a code" onPress={haveCode} />
              </View>
            )}
          </View>
        </View>
      )}
      {fr.error && fr.signedIn ? (
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          {fr.error}
        </T>
      ) : null}

      <Community joined={!!lo.community} width={col} />
      {fr.demo ? (
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          A demo with a made-up friend. Tap anything: nothing is real, and nothing is sent.
        </T>
      ) : null}
    </Screen>
  );
}

/* how each item reads in the one line under "What Sam sees of you" */
const SEE: Record<ShareKey, string> = { lessons: 'lessons', checkins: 'check-ins', days: 'days in Daybook', rode: 'urges ridden out', level: 'flame' };
function seeLine(on: Partial<Record<ShareKey, boolean>>, rt: string | null): string {
  const items = (Object.keys(SEE) as ShareKey[]).filter((k) => on[k]).map((k) => SEE[k]);
  const list = items.length ? 'Your ' + items.join(', ').replace(/, ([^,]*)$/, ' and $1') : 'Only your name';
  return list + (rt ? ', and a daily report at ' + reportAt(rt) : '');
}

/** one friend: their name and flame's level, a spark of theirs waiting for your lesson, their day and week, and the spark to send */
function FriendBlock({
  f,
  tk,
  many,
  busy,
  onOpen,
  onSpark,
  toLesson,
}: {
  f: FriendView;
  tk: DayKey;
  many: boolean;
  busy: boolean;
  onOpen: () => void;
  onSpark: () => void;
  toLesson: (() => void) | null;
}) {
  const c = useTheme();
  const now = Date.now();
  const today = friendToday(f.vals, tk);
  const got = f.cheer?.k === 'spark' ? f.cheer : null;
  const gotWaits = !!got && !got.used;
  const gotUsedToday = !!got?.used && now - got.used < 20 * 3600_000;
  /* what you sent: still waiting for their lesson, or used there (said for a day) */
  const sentRecent = !!f.sent && now - f.sent < 20 * 3600_000;
  const sentWaits = !!f.sent && !f.sentUsed && now - f.sent < 7 * 86400_000;
  const sentUsed = !!f.sentUsed && now - f.sentUsed < 36 * 3600_000;
  const tg = f.together;
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Open ' + f.name}
        onPress={() => {
          buzz('tap');
          onOpen();
        }}
        style={({ pressed }) => [s.head, pressed && { opacity: 0.7 }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <T v="h2">{f.name}</T>
          <T v="small" tone="muted">
            {[f.vals.level ? 'Level ' + f.vals.level + (f.vals.lname ? ', ' + f.vals.lname : '') : '', many && tg?.n ? tg.n + ' days together' : '']
              .filter(Boolean)
              .join(' · ') || 'Friends since ' + new Date(f.since).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </T>
        </View>
        <Icon name="next" size={18} color={c.muted} />
      </Pressable>

      {gotWaits ? (
        <View style={[s.spark, { backgroundColor: c.surface2 }]} accessibilityLiveRegion="polite">
          <View style={s.line}>
            <Spark size={44} />
            <View style={{ flex: 1, gap: 2 }}>
              <T v="label">{sparkGot(f.name)}</T>
              <T v="small" tone="muted">
                It goes into your next lesson.
              </T>
            </View>
          </View>
          {toLesson ? <Button label="Do today's lesson" kind="warm" onPress={toLesson} /> : null}
        </View>
      ) : gotUsedToday ? (
        <View style={s.line}>
          <Spark size={28} still />
          <T tone="muted" style={{ flex: 1 }}>
            {f.name}&apos;s spark was in your lesson today.
          </T>
        </View>
      ) : null}

      <FriendWeek vals={f.vals} today={today} />

      {sentUsed ? (
        <View style={s.line} accessibilityLiveRegion="polite">
          <Spark size={28} still />
          <T v="label" style={{ flex: 1, color: c.sunText }}>
            {sparkBack(f.name)}.
          </T>
        </View>
      ) : sentWaits && sentRecent ? (
        <View style={s.line} accessibilityLiveRegion="polite">
          <Spark size={28} still />
          <T tone="muted" style={{ flex: 1 }}>
            Your spark is with {f.name}. It goes into their next lesson, and you will hear when it does.
          </T>
        </View>
      ) : null}
      {sentRecent ? null : <Button label={busy ? 'One moment' : 'Send ' + f.name + ' a spark'} icon="sparkle" disabled={busy} onPress={onSpark} />}
    </View>
  );
}

/** a few quiet rows in one panel, iOS style */
function Rows({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return <View style={[s.rows, { backgroundColor: c.surface }]}>{children}</View>;
}
function Row({ icon, label, sub, onPress }: { icon: string; label: string; sub?: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.row, { borderTopColor: c.line }, pressed && { backgroundColor: c.surface2 }]}>
      <Icon name={icon} size={20} color={c.accentText} />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="label">{label}</T>
        {sub ? (
          <T v="small" tone="muted">
            {sub}
          </T>
        ) : null}
      </View>
      <Icon name="next" size={16} color={c.muted} />
    </Pressable>
  );
}

/** the community that is coming: its night of far fires with the words on it, and a way to pre-join */
function Community({ joined, width }: { joined: boolean; width: number }) {
  const c = useTheme();
  return (
    <View style={[s.community, { backgroundColor: c.surface }]}>
      <View>
        <CommunityScene joined={joined} width={width} />
        <View style={s.commHead} pointerEvents="none">
          <T v="h2" style={{ color: '#FFFFFF' }}>
            Community
          </T>
          <View style={s.soon}>
            <T v="small" style={{ color: '#FFE7A8' }}>
              Coming soon
            </T>
          </View>
        </View>
      </View>
      <View style={{ padding: 16, gap: 12 }}>
        <T tone="muted">A calm place to walk this with others. It is being built now, and it opens once enough people have joined.</T>
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

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  spark: { gap: 12, borderRadius: 20, padding: 14 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rows: { borderRadius: 20, overflow: 'hidden', marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: -StyleSheet.hairlineWidth,
  },
  community: { borderRadius: 20, overflow: 'hidden', marginTop: 8 },
  commHead: { position: 'absolute', left: 16, top: 14, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  soon: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.14)' },
  joined: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 },
});
