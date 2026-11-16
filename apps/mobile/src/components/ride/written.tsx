/* It is written: the faith move in the SOS ride (core written.ts), Matthew 4:1-11 and then Matthew 5. It plays like a short lesson
   the person can come back to in every urge (the owner, November 15, 2026: "it's basically just a repeatable lesson ... use the
   elements and good things from it"), so it uses the lesson player's own pieces: the flip card, the flame's cream speech bubble, the
   sparkles, the settle motion. Each page has one living thing in the middle, and the color tells the chapter: sun for Matthew 4,
   mint for Matthew 5.
     0 the question: three paper cards lie face down, the three pulls still to come.
     1 the hold: press the sun down until the ring fills; it opens and sparkles, and the line that stands firm comes up.
     2-4 the pulls: each one a lesson flip card. The front is what the pull says and the old move it is; a tap turns it over to the
       sun side, the answer, as He answered it. The mark at the top fills as it lands.
     5 then it left: the three cards drift up and away, and the sun comes up where they were, with the sparkles for the angels.
     6 the heart: one mint heart, beating slowly.
     7 cast it: what is feeding it (one tap), then the one thing to do, shown as a shape; "I did it" throws the shape off the screen.
     8 you stood: the person's own flame, big, saying the verse in its bubble.
   Kept plain on purpose: the words sit on the sky with no boxes around them, there is one timer (the squiggle under the card, only
   where a page goes on by itself), and nothing on a page moves that does not mean something. A tap anywhere goes on; a page nobody
   taps waits for its words. */
import { faithVoice, scrWrittenLabel, SCR_WRITTEN, WRITTEN_CAST, WRITTEN_CAST_DO, writtenWords, type WrittenPull, type WrittenWords } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { BigFlame } from '@/components/big-flame';
import { BigOption, Link, Tiles } from '@/components/choices';
import { Bubble } from '@/components/lesson-flame';
import { Sparkles } from '@/components/reward-kit';
import { MorphShape, SQUIGGLE, useClock, WavyLine, WavyRing } from '@/components/shapes';
import { Text } from '@/components/text';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { PAPER, PAPER_INK, PAPER_LIP, SUN_CARD, SUN_INK } from '@/lib/lesson-look';
import { NATIVE, SETTLE, useReducedMotion } from '@/lib/motion';
import { useScripture } from '@/lib/scripture';
import { useCareSettings } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import type { MoveProps } from './moves';

/** say a line to a screen reader on iOS (which has no live regions); Android and the web read the live region */
function useSay(text: string, on: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'ios' || !on || !text) return;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((yes) => yes && AccessibilityInfo.announceForAccessibility(text))
      .catch(() => undefined);
  }, [text, on]);
}

const WR_HOLD = 1800;
/** the pages that go on by themselves (the three pulls, then it left, the heart, the light); a tap anywhere goes on at once */
const WR_TIMED = [2, 3, 4, 5, 6, 8];
/** how long a page stays when nobody taps, from how many words it has: a quick reader taps on, and the page never makes a
    slow one hurry (the owner, November 15, 2026: "I read much faster than that, and then I just have to wait") */
export const wrSec = (text: string) => Math.max(4, Math.min(10, 2.5 + text.split(/\s+/).filter(Boolean).length * 0.25));
/** the pull's own words, without the quote marks round them (the card draws one big mark of its own, as a lesson's card does) */
const bare = (p: string) => p.replace(/^“|”$/g, '');
/** the red of the card's big quote mark, the same as the lesson's turn card; the old move under the pull is in the same red */
const MARK = '#E8665A';
const TRICK = '#C2412F';
/** what each answer to "What is feeding it?" looks like in the middle, before it is thrown off */
const CAST_ICON: Record<string, string> = { screen: 'phone', room: 'compass', alone: 'chat', unsure: 'wind' };

/** the pages: 0 the question, 1 the hold, 2 to 4 the three pulls, 5 then it left, 6 the heart, 7 cast it away, 8 the light */
export function WrittenMove({ on, onDone, level }: MoveProps) {
  const c = useTheme();
  const st = useCareSettings();
  const still = useReducedMotion();
  const w = writtenWords(faithVoice(st) || 'plain');
  const lib = useScripture();
  const [pg, setPg] = useState(0);
  const [cast, setCast] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [pulse, setPulse] = useState(0);
  const go = (n: number) => {
    buzz('tap');
    setPg(n);
  };
  const timed = WR_TIMED.indexOf(pg) >= 0;
  const pull = pg >= 2 && pg <= 4 ? w.pulls[pg - 2] : null;
  const page = pg === 5 ? w.end : pg === 6 ? w.heart : pg === 7 ? w.cast : pg === 8 ? w.light : null;
  /* a pull is a card turned like a lesson's: first what the pull says and the old move it is, then a tap answers it */
  const [turned, setTurned] = useState(false);
  const front = !!pull && !turned;
  const stage = pg + (front ? 'f' : 'b');
  const stageSec = pull
    ? front
      ? Math.max(3, Math.min(6, 1.5 + (pull.pull + ' ' + pull.trick).split(/\s+/).length * 0.25))
      : wrSec([pull.faced, pull.lead, pull.rest].join(' '))
    : page
      ? wrSec([page.head, page.sub, page.lead, page.rest].join(' '))
      : 0;
  /* each stage times itself from when it came into view (and again when the ride comes back to it). The start is set in the
     render that first shows the stage: set later, in an effect, that first render would count from the stage before and skip a
     short page that follows a long one */
  const tick = useClock(on && timed);
  const startAt = useRef({ key: '', at: 0 });
  const key = stage + (on ? '+' : '-');
  if (startAt.current.key !== key) startAt.current = { key, at: Date.now() };
  const read = timed && stageSec && on ? Math.min(1, (Date.now() - startAt.current.at) / 1000 / stageSec) : 0;
  void tick;
  const onward = () => {
    if (front) {
      buzz('save');
      return setTurned(true);
    }
    setTurned(false);
    if (pg < 8) go(pg + 1);
    else onDone();
  };
  useEffect(() => {
    if (read < 1) return;
    onward();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [read >= 1]);
  /* the flame lights up as the last page comes in */
  useEffect(() => {
    if (pg === 8) buzz('lit');
  }, [pg]);
  const head = pg === 0 ? w.ask.head : pg === 1 ? w.stand.head : pull ? bare(pull.pull).replace('\n', ' ') : page ? page.head : '';
  useSay(head, on);

  if (pg === 0)
    return (
      <View style={s.move}>
        <Words head={w.ask.head} sub={w.ask.sub} />
        <View style={s.mid} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Waiting still={still} />
        </View>
        <BigOption tone="sun" icon="shield" title={w.ask.yes} sub={w.ask.yesSub} onPress={() => go(1)} />
      </View>
    );
  if (pg === 1) return <WrittenStand w={w} on={on} still={still} onFull={() => setTimeout(() => setPg(2), 2200)} />;

  const card = pull || page!;
  const link = pg === 5 ? w.link : pg === 8 ? w.link5 : null;
  /* with the scripture library on, the chapter opens in Daybook on the verses the page quoted */
  const inLib = lib.on ? (pg === 5 ? SCR_WRITTEN.link : pg === 8 ? SCR_WRITTEN.link5 : null) : null;
  /* Matthew 4 is the first three marks, Matthew 5 the next three */
  const four = pg <= 5;
  const tone = four ? c.sun2 : c.mint;
  const toneText = four ? c.sunText : c.mintText;
  const castDo = cast ? WRITTEN_CAST_DO[cast] : null;
  /* the marks: the one now is wide, and a pull's mark fills once its card has turned */
  const now = pull ? pg - 2 : four ? 2 : pg - 6;
  const done = pull ? (turned ? pg - 1 : pg - 2) : four ? 3 : pg - 5;
  const verse = (
    <View style={s.verse} accessible accessibilityLabel={[card.lead, card.rest, card.ref].filter(Boolean).join(' ')}>
      <Text style={[s.verseT, { color: c.ink }]}>
        <Text style={[s.verseLead, { color: toneText }]}>{card.lead}</Text> {card.rest}
      </Text>
      {card.ref ? (
        <T v="small" tone={four ? 'sunText' : 'mintText'} style={s.c}>
          {card.ref}
        </T>
      ) : null}
    </View>
  );
  return (
    /* a tap anywhere on a page that goes on by itself answers the pull or goes on. Not a button itself, since the page holds
       buttons of its own (a screen reader has the page read out, and it goes on by itself or with Next) */
    <Pressable style={s.move} accessible={false} onPress={timed ? onward : undefined}>
      <Steps n={3} now={now} done={done} color={tone} track={tone + '33'} />
      {pull ? (
        <View style={s.mid}>
          <PullCard key={pg} p={pull} turned={turned} first={pg === 2} still={still} onPress={onward} />
        </View>
      ) : (
        <>
          <Words key={pg} head={page!.head} sub={page!.sub} />
          <View style={s.mid}>
            {pg === 5 ? (
              <Left still={still} />
            ) : pg === 6 ? (
              <Heart still={still} />
            ) : pg === 7 ? (
              cast ? (
                <Thrown key={cast} icon={CAST_ICON[cast] || 'wind'} away={gone} still={still} onGone={() => go(8)} />
              ) : null
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Your flame"
                style={s.light}
                onPress={() => {
                  buzz('lit');
                  setPulse((x) => x + 1);
                }}>
                <Appear by={10} duration={420}>
                  <Bubble text={card.lead} style={s.lightBubble} />
                </Appear>
                <View style={s.flameRoom}>
                  <BigFlame level={level || 1} size={200} pulse={pulse} noLand />
                  <Sparkles size={200} at={400} still={still} />
                </View>
              </Pressable>
            )}
            {pg === 8 ? (
              <Appear by={8} delay={500} duration={420}>
                <Text style={[s.restT, { color: c.ink }]}>{card.rest}</Text>
                {card.ref ? (
                  <T v="small" tone="mintText" style={s.c}>
                    {card.ref}
                  </T>
                ) : null}
              </Appear>
            ) : pg === 7 && castDo ? (
              <Appear key={cast} by={8} duration={420}>
                <Text style={[s.doT, { color: c.ink }]}>{castDo}</Text>
              </Appear>
            ) : (
              <Appear by={8} delay={pg === 7 ? 0 : 450} duration={420}>
                {verse}
              </Appear>
            )}
          </View>
        </>
      )}
      {pg === 7 ? (
        castDo ? (
          <Button
            label={w.cast.did}
            onPress={() => {
              if (gone) return;
              buzz('lit');
              setGone(true);
            }}
          />
        ) : (
          <View style={{ gap: 10 }}>
            <T v="label" style={s.c}>
              {w.cast.ask}
            </T>
            <Tiles
              list={WRITTEN_CAST}
              cur={cast}
              onPick={(v) => {
                buzz('save');
                setCast(v);
              }}
            />
          </View>
        )
      ) : link ? (
        <View style={s.quiet}>
          <Link
            label={inLib ? scrWrittenLabel(link.label) : link.label}
            tone="muted"
            onPress={() => (inLib ? router.push({ pathname: '/scripture/read', params: inLib }) : Linking.openURL(link.url).catch(() => undefined))}
          />
        </View>
      ) : pg === 5 || pg === 8 ? null : (
        <View style={s.line}>
          <WavyLine width={220} p={read} color={tone} track={tone + '33'} />
        </View>
      )}
    </Pressable>
  );
}

/** a pull, as the lesson's flip card: warm paper and a little crooked with what the pull says, then turned over and landed straight,
    sun yellow, with the answer. The card turns when the page tells it to (a tap anywhere, or its own time), so it has no state. */
function PullCard({ p, turned, first, still, onPress }: { p: WrittenPull; turned: boolean; first: boolean; still: boolean; onPress: () => void }) {
  const a = useRef(new Animated.Value(turned ? 1 : 0)).current;
  const come = useRef(new Animated.Value(still ? 1 : 0)).current;
  useEffect(() => {
    if (still) return;
    Animated.spring(come, { toValue: 1, ...SETTLE, useNativeDriver: NATIVE }).start();
  }, [come, still]);
  useEffect(() => {
    if (still) return a.setValue(turned ? 1 : 0);
    Animated.timing(a, { toValue: turned ? 1 : 0, duration: 560, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [turned, a, still]);
  const frontY = a.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backY = a.interpolate({ inputRange: [0, 1], outputRange: ['-180deg', '0deg'] });
  /* the faces trade places at the edge, for Android, which does not hide a card's back side */
  const frontOn = a.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [1, 1, 0, 0] });
  const backOn = a.interpolate({ inputRange: [0, 0.5, 0.501, 1], outputRange: [0, 0, 1, 1] });
  /* it dips as it turns and lands straight, the lesson card's own move */
  const lift = a.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.94, 1] });
  const tilt = a.interpolate({ inputRange: [0, 1], outputRange: ['-2.5deg', '0deg'] });
  /* a new pull comes in from the right and settles, as the next lesson card does */
  const inX = come.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
  const said = !p.ref ? 'Say it out loud.' : 'Read it out loud.';
  return (
    <Animated.View style={[s.cardRoom, { opacity: come, transform: [{ translateX: inX }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={turned ? [p.faced, p.lead, p.rest, p.ref].filter(Boolean).join(' ') : 'The pull says: ' + bare(p.pull) + ' ' + p.trick}
        accessibilityHint={turned ? 'Goes on' : 'Answers it'}
        accessibilityLiveRegion="polite"
        onPress={onPress}>
        <Animated.View style={{ transform: [{ scale: lift }, { rotate: tilt }] }}>
          <Animated.View style={[s.card, s.front, { opacity: frontOn, transform: [{ perspective: 1000 }, { rotateY: frontY }] }]}>
            <Text style={s.mark}>“</Text>
            <Text style={s.pullT}>{bare(p.pull)}</Text>
            <Text style={s.trickT}>{p.trick}</Text>
            <Text style={s.hint}>Tap to answer it</Text>
          </Animated.View>
          <Animated.View style={[s.card, s.back, { opacity: backOn, transform: [{ perspective: 1000 }, { rotateY: backY }] }]}>
            <Text style={s.facedT}>{p.faced}</Text>
            <Text style={s.answerLead}>{p.lead}</Text>
            <Text style={s.answerT}>{p.rest}</Text>
            {p.ref ? <Text style={s.refT}>{p.ref}</Text> : null}
            {first ? <Text style={[s.hint, { color: SUN_INK }]}>{said}</Text> : null}
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** page 0: the three pulls still to come, three paper cards face down, breathing a little as they wait */
function Waiting({ still }: { still: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, still]);
  return (
    <View style={s.fan}>
      {[-1, 0, 1].map((j) => {
        const y = v.interpolate({ inputRange: [0, 1], outputRange: [0, j === 0 ? -8 : -4] });
        return (
          <Animated.View
            key={j}
            style={[
              s.mini,
              { left: 75 + j * 62, top: j === 0 ? 10 : 26, zIndex: j === 0 ? 2 : 1 },
              { transform: [{ translateY: y }, { rotate: j * 9 + 'deg' }] },
            ]}>
            <Text style={s.miniMark}>“</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

/** page 5, then it left: the three cards, answered now, drift up and fade, and the sun comes up where they were */
function Left({ still }: { still: boolean }) {
  const c = useTheme();
  const v = useRef(new Animated.Value(still ? 1 : 0)).current;
  useEffect(() => {
    if (still) return;
    Animated.timing(v, { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }).start();
  }, [v, still]);
  const sunOn = v.interpolate({ inputRange: [0, 0.35, 0.8, 1], outputRange: [0, 0, 1, 1] });
  const sunK = v.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0.6, 0.6, 1] });
  return (
    <View style={s.left}>
      <Animated.View style={[s.center, { opacity: sunOn, transform: [{ scale: sunK }] }]}>
        <WavyRing size={190} p={1} color={c.sun2} track={c.sun2 + '2E'} speed={still ? 0 : SQUIGGLE.speed}>
          <MorphShape kind="sunny" size={140} color={c.sun}>
            <View />
          </MorphShape>
        </WavyRing>
      </Animated.View>
      {[-1, 0, 1].map((j) => {
        const k = Math.min(1, 0.55 + (j + 1) * 0.1);
        const out = v.interpolate({ inputRange: [0, k], outputRange: [1, 0], extrapolate: 'clamp' });
        const up = v.interpolate({ inputRange: [0, k], outputRange: [0, -110], extrapolate: 'clamp' });
        return (
          <Animated.View
            key={j}
            style={[s.mini, s.miniSun, { left: 75 + j * 62, top: j === 0 ? 50 : 66, opacity: out, transform: [{ translateY: up }, { rotate: j * 9 + 'deg' }] }]}
          />
        );
      })}
      <Sparkles size={220} at={900} still={still} />
    </View>
  );
}

/** page 6: one heart in the middle, beating slowly, where it starts */
function Heart({ still }: { still: boolean }) {
  const c = useTheme();
  const [kind, setKind] = useState<'circle' | 'heart'>(still ? 'heart' : 'circle');
  const beat = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const t = setTimeout(() => setKind('heart'), 120);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
        Animated.timing(beat, { toValue: 0, duration: 420, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }),
        Animated.delay(900),
      ]),
    );
    loop.start();
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [beat, still]);
  const k = beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  return (
    <Animated.View style={{ transform: [{ scale: k }] }}>
      <MorphShape kind={kind} size={150} color={c.mint}>
        <View />
      </MorphShape>
    </Animated.View>
  );
}

/** page 7: what is feeding it, as a shape in the middle; "I did it" throws it up and off the screen (cast it from thee) */
function Thrown({ icon, away, still, onGone }: { icon: string; away: boolean; still: boolean; onGone: () => void }) {
  const c = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  const come = useRef(new Animated.Value(still ? 1 : 0)).current;
  useEffect(() => {
    if (still) return;
    Animated.spring(come, { toValue: 1, ...SETTLE, useNativeDriver: NATIVE }).start();
  }, [come, still]);
  useEffect(() => {
    if (!away) return;
    if (still) return void setTimeout(onGone, 200);
    Animated.timing(v, { toValue: 1, duration: 520, easing: Easing.in(Easing.cubic), useNativeDriver: NATIVE }).start(() => onGone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [away]);
  const y = v.interpolate({ inputRange: [0, 1], outputRange: [0, -520] });
  const r = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-28deg'] });
  const o = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  const k = come.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ opacity: Animated.multiply(come, o), transform: [{ translateY: y }, { rotate: r }, { scale: k }] }}>
      <MorphShape kind="cookie12" size={140} color={c.mintSoft}>
        <View>
          <Icon name={icon} size={56} color={c.mintText} />
        </View>
      </MorphShape>
    </Animated.View>
  );
}

/** Say no to it: hold the sun down until the ring fills, then the line that stands firm */
function WrittenStand({ w, on, still, onFull }: { w: WrittenWords; on: boolean; still: boolean; onFull: () => void }) {
  const c = useTheme();
  const [t0, setT0] = useState<number | null>(null);
  const [full, setFull] = useState(false);
  useClock(on && t0 !== null && !full);
  const p = full ? 1 : t0 !== null ? Math.min(1, (Date.now() - t0) / WR_HOLD) : 0;
  const fill = () => {
    if (full) return;
    setFull(true);
    buzz('lit');
    onFull();
  };
  const step = Math.floor(p * 6);
  useEffect(() => {
    if (step > 0 && step < 6 && !full) buzz('tick');
    if (step >= 6) fill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  /* a press with no start is a screen reader's click (or a keyboard): it says no at once */
  const pressed = useRef(false);
  return (
    <View style={s.move}>
      <Words head={w.stand.head} sub={full ? undefined : w.stand.sub} />
      <View style={s.mid}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Say no. Press and hold."
          accessibilityState={{ checked: full }}
          onPressIn={() => {
            if (full) return;
            pressed.current = true;
            setT0(Date.now());
            buzz('tap');
          }}
          onPressOut={() => {
            if (!full) setT0(null);
          }}
          onPress={() => {
            if (!pressed.current) fill();
            pressed.current = false;
          }}>
          <View style={s.ring}>
            <WavyRing size={250} p={p} color={c.sun2} track={c.sun2 + '2E'} stroke={6} speed={full ? SQUIGGLE.speed : 0}>
              <MorphShape kind={full ? 'sunny' : 'circle'} size={180} color={c.sun}>
                <Text style={[s.big, { color: c.onSun }]}>No</Text>
              </MorphShape>
            </WavyRing>
            {full ? <Sparkles size={250} still={still} /> : null}
          </View>
        </Pressable>
        {full ? (
          <Appear by={8} duration={500}>
            <Text style={[s.standT, { color: c.ink }]}>{w.stand.line}</Text>
          </Appear>
        ) : null}
      </View>
      {w.stand.verse ? (
        <T v="small" tone="muted" style={s.c}>
          {w.stand.verse + ' ' + w.stand.ref}
        </T>
      ) : null}
    </View>
  );
}

/** the words above a page: what it is, big, and one line under it. A live region, so a screen reader hears each change. */
function Words({ head, sub }: { head: string; sub?: string }) {
  const c = useTheme();
  return (
    <View style={s.words} accessibilityLiveRegion="polite" aria-live="polite">
      <Appear key={head} by={6} duration={260}>
        <Text style={[s.head, { color: c.ink }]} accessibilityRole="header">
          {head}
        </Text>
      </Appear>
      {sub ? (
        <T tone="muted" style={s.c}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

/** three marks at the top: done, now, to come (the same marks as the other moves) */
function Steps({ n, now, done, color, track }: { n: number; now: number; done: number; color: string; track: string }) {
  return (
    <View style={s.steps} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: n }, (_, j) => (
        <View key={j} style={[s.step, { backgroundColor: j < done ? color : track, flexGrow: j === now ? 2 : 1 }]} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  move: { flexGrow: 1, alignSelf: 'stretch', gap: 12 },
  words: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },
  head: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 36, textAlign: 'center' },
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  big: { fontFamily: font.displayBold, fontSize: 84, lineHeight: 92, fontVariant: ['tabular-nums'] },
  steps: { flexDirection: 'row', gap: 6, alignSelf: 'center', width: 160 },
  step: { flex: 1, height: 6, borderRadius: 3 },
  line: { alignItems: 'center', minHeight: 36, justifyContent: 'center' },
  quiet: { alignSelf: 'center', minHeight: 36, justifyContent: 'center' },
  center: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  /* the flip card, the lesson's own (lesson-flash.tsx) */
  cardRoom: { alignSelf: 'stretch', paddingHorizontal: 4 },
  card: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    minHeight: 300,
    justifyContent: 'center',
    gap: 12,
    backfaceVisibility: 'hidden',
  },
  front: { backgroundColor: PAPER, shadowColor: PAPER_LIP, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 6 } },
  back: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: SUN_CARD },
  mark: { fontFamily: font.display, fontSize: 64, lineHeight: 72, marginTop: -8, marginBottom: -36, color: MARK },
  pullT: { fontFamily: font.display, fontSize: 28, lineHeight: 34, color: PAPER_INK },
  trickT: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 23, color: TRICK },
  hint: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: '#8A7FB0', textAlign: 'center', marginTop: 6 },
  facedT: { fontFamily: font.bodySemi, fontSize: 15, lineHeight: 20, color: SUN_INK, opacity: 0.75 },
  answerT: { fontFamily: font.display, fontSize: 22, lineHeight: 30, color: SUN_INK, marginTop: -6 },
  answerLead: { fontFamily: font.displayBold, fontSize: 28, lineHeight: 34, color: SUN_INK },
  refT: { fontFamily: font.bodyBold, fontSize: 13, lineHeight: 18, color: SUN_INK, opacity: 0.75 },
  /* the three face-down cards, and the answered ones leaving */
  fan: { width: 250, height: 190 },
  mini: {
    position: 'absolute',
    width: 100,
    height: 136,
    borderRadius: 14,
    backgroundColor: PAPER,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PAPER_LIP,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 4 },
  },
  miniSun: { backgroundColor: SUN_CARD },
  miniMark: { fontFamily: font.display, fontSize: 64, lineHeight: 72, marginTop: 18, color: MARK },
  left: { width: 250, height: 236 },
  /* the words of a verse, on the sky with no box round them */
  verse: { alignSelf: 'stretch', gap: 6, paddingHorizontal: 12 },
  verseT: { fontFamily: font.display, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  verseLead: { fontFamily: font.displayBold },
  restT: { fontFamily: font.display, fontSize: 17, lineHeight: 24, textAlign: 'center', paddingHorizontal: 12 },
  doT: { fontFamily: font.display, fontSize: 22, lineHeight: 30, textAlign: 'center', paddingHorizontal: 12 },
  ring: { width: 250, height: 250 },
  standT: { fontFamily: font.display, fontSize: 22, lineHeight: 28, textAlign: 'center' },
  light: { alignItems: 'center' },
  lightBubble: { maxWidth: 320, marginBottom: 10 },
  flameRoom: { width: 200, height: 200 },
});
