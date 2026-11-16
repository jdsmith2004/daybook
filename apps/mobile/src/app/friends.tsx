/* Friends (beta): the person, and the one or two people on their side, inside Daybook (the owner, November 15, 2026; docs/plan.md
   "Friends (beta)"). Opened from Settings for now; the journal and the tabs stay where they are.

   Made for the usual case, one friend (the owner, the same day: "most people are going to only have like one person"), and built
   like Today (the owner, later: "Feel free to use the rest of the app as inspiration ... try again and do better"): three masses
   only. The sky (friends-art.tsx): your flame and theirs big on their hills, the together streak between you (the owner: "a
   together streak and it's just days they both log in"). Then Today's own bright card for the one thing to do: start the lesson
   their spark is waiting in, or send them a spark (it flies to their flame, waits for their next lesson, and you are told when it
   was in it; the owner: the spark "visits and comes back"). Then their week as marks, and one quiet list (what they see of you,
   notes about them, another friend, the community that is coming). Calm on purpose: no "last seen", no badges, no red, and a
   quiet day never reads as missing. */
import { gameCompute, lessonToday, reportAt, sparkBack, sparkGot, friendToday, type DayKey, type ShareKey } from '@daybook/core';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FriendsSky, FriendWeek, skyFor, Spark } from '@/components/friends-art';
import { NextCard } from '@/components/your-day';
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
  /* the flames as big as the width lets two of them be, and the sky as tall as they need */
  const big = Math.round(Math.min(Math.min(win, MAX_WIDTH + 80) * 0.5, 240, winH * 0.32));
  const sky = skyFor(top, big);
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
            <FriendBlock key={f.fid} f={f} tk={tk} busy={sparking === f.fid} onSpark={() => spark(f.fid)} toLesson={toLesson} />
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
            <CommunityRow joined={!!lo.community} />
          </Rows>
        </>
      ) : (
        <>
          <View style={{ gap: 6 }}>
            <T v="h2">Walk it with a friend</T>
            <T tone="muted">
              They see how often you do a lesson and check in, and your flame. Never a slip. You keep a streak together, and send each other sparks that go into
              the next lesson.
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
          <Rows>
            <CommunityRow joined={!!lo.community} />
          </Rows>
        </>
      )}
      {fr.error && fr.signedIn ? (
        <T v="small" tone="muted" style={{ textAlign: 'center' }}>
          {fr.error}
        </T>
      ) : null}
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

/** one friend: the one thing to do (Today's bright card), what passed between you, and their week */
function FriendBlock({ f, tk, busy, onSpark, toLesson }: { f: FriendView; tk: DayKey; busy: boolean; onSpark: () => void; toLesson: (() => void) | null }) {
  const c = useTheme();
  const now = Date.now();
  const today = friendToday(f.vals, tk);
  const got = f.cheer?.k === 'spark' ? f.cheer : null;
  const gotWaits = !!got && !got.used;
  const gotUsedToday = !!got?.used && now - got.used < 20 * 3600_000;
  /* what you sent: still waiting for their lesson, or used there (said for a day and a half) */
  const sentRecent = !!f.sent && now - f.sent < 20 * 3600_000;
  const sentWaits = !!f.sent && !f.sentUsed && now - f.sent < 7 * 86400_000;
  const sentUsed = !!f.sentUsed && now - f.sentUsed < 36 * 3600_000;
  const canSend = !sentRecent;
  const lead = gotWaits && toLesson ? 'lesson' : canSend ? 'send' : null;
  const send = () => !busy && onSpark();
  /* the quiet lines: what passed between you, newest news first */
  const lines: { t: string; warm?: boolean }[] = [];
  if (sentUsed) lines.push({ t: sparkBack(f.name) + '.', warm: true });
  else if (sentWaits && sentRecent) lines.push({ t: 'Your spark is with ' + f.name + '. You will hear when it goes into their lesson.' });
  if (gotWaits && !toLesson) lines.push({ t: sparkGot(f.name) + '. It waits for your next lesson.' });
  else if (gotUsedToday) lines.push({ t: f.name + '\u2019s spark was in your lesson today.' });
  return (
    <View style={{ gap: 12 }}>
      {lead === 'lesson' ? (
        <NextCard m={{ eb: sparkGot(f.name), h: 'It goes into today\u2019s lesson', btn: 'Start' } as never} onPress={toLesson!} />
      ) : lead === 'send' ? (
        <NextCard
          m={{ eb: 'One a day · it goes into their next lesson', h: 'Send ' + f.name + ' a spark', btn: busy ? '...' : 'Send' } as never}
          onPress={send}
        />
      ) : null}
      {lead === 'lesson' && canSend ? (
        <Rows>
          <Row icon="sparkle" label={'Send ' + f.name + ' a spark'} sub="One a day. It goes into their next lesson." onPress={send} />
        </Rows>
      ) : null}
      {lines.map((l) => (
        <View key={l.t} style={s.line} accessibilityLiveRegion="polite">
          <Spark size={30} still />
          <T v={l.warm ? 'label' : 'body'} tone={l.warm ? undefined : 'muted'} style={[{ flex: 1 }, l.warm ? { color: c.sunText } : null]}>
            {l.t}
          </T>
        </View>
      ))}

      <View style={s.section}>
        <T v="h2">{f.name}&apos;s week</T>
        <FriendWeek vals={f.vals} today={today} />
      </View>
    </View>
  );
}

/** a few quiet rows in one panel, iOS style */
function Rows({ children }: { children: React.ReactNode }) {
  const c = useTheme();
  return <View style={[s.rows, { backgroundColor: c.surface }]}>{children}</View>;
}
function Row({ icon, label, sub, right, onPress }: { icon: string; label: string; sub?: string; right?: React.ReactNode; onPress: () => void }) {
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
      {right ?? <Icon name="next" size={16} color={c.muted} />}
    </Pressable>
  );
}

/** the community that is coming, as one row: Pre-join on the right, then a quiet mark that you are on the list */
function CommunityRow({ joined }: { joined: boolean }) {
  const c = useTheme();
  return (
    <Row
      icon="flame"
      label="Community"
      sub="Coming soon. A calm place to walk this with others."
      right={
        joined ? (
          <View style={s.joined} accessibilityLiveRegion="polite">
            <Icon name="check" size={16} color={c.mintText} />
            <T v="small" style={{ color: c.mintText }}>
              On the list
            </T>
          </View>
        ) : (
          <T v="label" style={{ color: c.accentText }}>
            Pre-join
          </T>
        )
      }
      onPress={() => {
        if (joined) return;
        joinCommunity();
        buzz('save');
      }}
    />
  );
}

const s = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  section: { gap: 12, marginTop: 20 },
  rows: { borderRadius: 20, overflow: 'hidden', marginTop: 20 },
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
  joined: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
