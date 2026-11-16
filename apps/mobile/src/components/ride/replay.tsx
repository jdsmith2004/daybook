/* Replay (core replay.ts): one card from a lesson the person has already finished, in the middle of SOS. It is drawn as a page torn
   from the lesson itself: the lesson's sky, its own picture big, its own words (read aloud on a tap, never by itself), and the flame
   saying the lesson's one line that sticks in its cream bubble. Nothing on it is new words: the lesson lock holds (docs/lessons.md).
   One quiet "Keep this" says the card helped, so it comes up more; the whole lesson is one link away, for a calm moment. It runs about
   half a minute, or until the reading ends, and then the ride goes on. */
import { cardBeat, cardArt, REPLAY, replayCan, replayCard, replayKeep, replayPassed, replayPick, replayScore, replaySeen, type Days } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BigFlame } from '@/components/big-flame';
import { Link } from '@/components/choices';
import { FitArt, FitProvider, useFitRoom } from '@/components/fit';
import { LessonArt } from '@/components/lesson-art';
import { Bubble } from '@/components/lesson-flame';
import { LessonBackdrop } from '@/components/lesson-sky';
import { ListenButton, SpokenCard } from '@/components/listen';
import { useClock } from '@/components/shapes';
import { Text } from '@/components/text';
import { Icon } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { lessonLook } from '@/lib/lesson-look';
import { useListen } from '@/lib/listen-prefs';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, PaletteOverride, useTheme, type Tone } from '@/lib/theme';
import type { MoveProps } from './moves';

/** how long the card stays when it is read, not heard: about fifty words, slowly */
const READ_SEC = 30;
/** the page's padding and the room between its parts */
const PAD = 20 + 16 + 12;
/** a pass quicker than this, on sight, makes the lesson come a little less */
const QUICK_MS = 5000;
/** every lesson Replay can show, finished, for a preview */
export const REPLAY_DEMO = { '2026-11-01': { d: '2026-11-01', events: [], checkin: null, p: { ls: REPLAY.map((R) => R.id) }, u: 0 } } as unknown as Days;
/** the lessons replayed in each SOS, by when it started, so one ride does not show the same card twice */
const inRide = new Map<number, string[]>();

export function ReplayMove({ on, onDone, level, demo, days: daysIn, lesson }: MoveProps & { days?: Days; lesson?: string }) {
  const base = useTheme();
  const st = useCareSettings();
  const store = useStore();
  const sos = useSos();
  const own = daysIn || store.snap.days;
  /* a preview with no lessons finished yet shows sample ones */
  const days = demo && !replayCan(own, st) ? REPLAY_DEMO : own;
  const t0 = sos.ur ? sos.ur.t0 : 0;
  /* the lesson for this page, picked once, so it holds still while the ride moves */
  const [pk] = useState(() => {
    /* a preview can name the lesson */
    const R = lesson ? REPLAY.find((x) => x.id === lesson) : null;
    const at = R ? replayCard(R, st) : null;
    if (R && at) return { id: R.id, ...at };
    return replayPick(days, st, sos.mem, Math.random, inRide.get(t0) || []);
  });
  const L = pk ? pk.L : null;
  const card = L && pk ? L.cards[pk.ci] : null;
  const beat = L && pk ? cardBeat(L, pk.ci) : {};
  const art = card ? cardArt(card) : null;
  const look = lessonLook('sky', 0.55, base.scheme);
  const tone = look.art as Tone;
  const room = useFitRoom();
  /* the page's words and picture, and its foot, measured apart: the picture gives up height when the two do not fit */
  const sizes = useRef({ top: 0, foot: 0 });
  const fitAll = () => sizes.current.top && sizes.current.foot && room.onContentSizeChange(0, sizes.current.top + sizes.current.foot + PAD);
  const fitTop = (hh: number) => {
    sizes.current.top = hh;
    fitAll();
  };
  const fitFoot = (hh: number) => {
    sizes.current.foot = hh;
    fitAll();
  };

  const [listen, setListen] = useState(false);
  const lp = useListen();
  const [kept, setKept] = useState(() => (pk ? replayScore(sos.mem, pk.id) > 0 : false));
  const [pulse, setPulse] = useState(0);

  /* seen: remembered as the last one, so the next replay is another lesson */
  const seenAt = useRef<number | null>(null);
  const finished = useRef(false);
  useEffect(() => {
    if (!pk) return;
    if (on && seenAt.current === null) {
      seenAt.current = Date.now();
      inRide.set(t0, (inRide.get(t0) || []).concat(pk.id));
      if (!demo) sos.setMem((m) => replaySeen(m, pk.id));
    }
    /* passed over on sight: this lesson comes a little less */
    if (!on && seenAt.current !== null && !finished.current && Date.now() - seenAt.current < QUICK_MS) {
      finished.current = true;
      if (!demo) sos.setMem((m) => replayPassed(m, pk.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  /* done: after the reading time, or once the voice has read it all */
  const sec = useClock(on && !listen && !!pk);
  const heard = listen && lp.done;
  const end = useRef(onDone);
  end.current = onDone;
  const doneNow = !pk || (!listen && sec >= READ_SEC) || heard;
  useEffect(() => {
    if (!on || !doneNow) return;
    const t = setTimeout(
      () => {
        finished.current = true;
        if (pk) {
          setPulse((x) => x + 1);
          buzz('lit');
        }
        setTimeout(() => end.current(), pk ? 900 : 0);
      },
      heard ? 1400 : 0,
    );
    return () => clearTimeout(t);
  }, [on, doneNow, heard, pk]);

  if (!pk || !L || !card) return <View style={s.move} />;
  const h = beat.h || card.h;
  const keep = () => {
    const now = !kept;
    setKept(now);
    sos.setMem((m) => replayKeep(m, pk.id, now));
    if (now) setPulse((x) => x + 1);
    buzz(now ? 'save' : 'tap');
  };
  return (
    <View style={s.move}>
      {/* the lesson's own page, on its own sky */}
      <View style={s.page} onLayout={room.onLayout}>
        <LessonBackdrop look={look} />
        <PaletteOverride.Provider value={look.c}>
          <FitProvider value={room.ctx}>
            <View style={s.in}>
              <View onLayout={(e) => fitTop(e.nativeEvent.layout.height)}>
                {art ? (
                  <FitArt style={s.art} min={0.5} drop={0.3} stretch={art[0] === 'research' || art[0] === 'wave'}>
                    <LessonArt key={L.id + pk.ci} art={art} ic={L.ic} t={tone} st={st} />
                  </FitArt>
                ) : null}
                {/* the card's big line; Listen opens the rest of its words and reads them aloud, each word lit as it is said */}
                <SpokenCard
                  key={L.id + pk.ci}
                  h={h}
                  body={listen ? beat.p : undefined}
                  st={st}
                  on={listen && on}
                  hStyle={[s.h, h.length > 56 && s.hsm]}
                  pStyle={s.p}
                />
              </View>
              <View style={s.foot} onLayout={(e) => fitFoot(e.nativeEvent.layout.height)}>
                {/* the flame says the lesson's one line that sticks */}
                <Bubble text={L.key} tail="right" style={s.bubble} />
                <View style={s.row}>
                  <ListenButton on={listen} onPress={() => setListen(!listen)} ink={look.dashOn} />
                  <View style={s.flame}>
                    <BigFlame level={level || 1} size={92} pulse={pulse} noLand label="Your flame" />
                  </View>
                </View>
              </View>
            </View>
          </FitProvider>
        </PaletteOverride.Provider>
      </View>
      {/* under the page, on the ride's own sky: Keep this, and the whole lesson for a calm moment */}
      <View style={s.under}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={kept ? 'Kept. Tap to undo.' : 'Keep this. It helped.'}
          accessibilityState={{ checked: kept }}
          onPress={keep}
          hitSlop={6}
          style={({ pressed }) => [s.keep, { backgroundColor: kept ? base.sunSoft : base.scBtn, opacity: pressed ? 0.7 : 1 }]}>
          <Icon name={kept ? 'check' : 'star'} size={16} color={kept ? base.sunText : base.ink} />
          <Text style={[s.keepT, { color: kept ? base.sunText : base.ink }]}>{kept ? 'Kept' : 'Keep this'}</Text>
        </Pressable>
        <Link label="The whole lesson" tone="muted" onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: L.id } })} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  move: { flexGrow: 1, alignSelf: 'stretch', gap: 8 },
  page: { flex: 1, borderRadius: 28, overflow: 'hidden' },
  in: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, gap: 12, justifyContent: 'space-between' },
  art: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  h: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  hsm: { fontSize: 20, lineHeight: 26 },
  p: { fontSize: 17, lineHeight: 24, opacity: 0.92 },
  foot: { gap: 4 },
  bubble: { marginRight: 28 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  flame: { flex: 1, alignItems: 'flex-end' },
  keep: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 14, borderRadius: 999 },
  keepT: { fontFamily: font.bodySemi, fontSize: 15 },
  under: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
});
