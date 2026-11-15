/* The night pack, walked one step a page (core night-pack.ts; the owner, November 15, 2026: "if they have to add it one by one,
   then don't make them like scroll on the page ... we should put this more as like a lesson and they go next").

   Apple lets only the person make an automation, so Daybook cannot set the four up in one tap. What it can do is make each
   one short: the four lights first (the person's own flame, grey until set), then for each one still grey, what it does,
   then one step a page in big words with a picture of the rows to tap, top to bottom, and Open Shortcuts right there. The last
   step's button is "It is set": back on the four lights, this one is lit, and the next is one tap away. Skip this one moves on without lighting it.

   ?k=grey (or wait, bed, wake) starts on that one; with none, the four lights. */
import { gameCompute, PACK_KINDS, packLit, packNext, packWords, tonightOf, fmtClock, type PackKind } from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Flame } from '@/components/flame';
import { Bubble } from '@/components/lesson-flame';
import { Dock, Middle, SceneFrame, Stage } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { packSay, usePack } from '@/lib/night-pack';
import { useStore } from '@/lib/store';
import { font, nightInk } from '@/lib/theme';

const SHORT: Record<PackKind, string> = { grey: 'Grey', wait: 'Wait', bed: 'Good night', wake: 'Morning' };
const GOLD = '#FFE27A';

/** where the walk is: the four lights (null), one automation's first page (i -1), or one of its steps */
type At = { k: PackKind; i: number } | null;

const openShortcuts = () => Linking.openURL('shortcuts://').catch(() => undefined);

export default function NightPackWalk() {
  const { k: asked } = useLocalSearchParams<{ k?: string }>();
  const { snap, tk, say } = useStore();
  const pack = usePack();
  const st = snap.settings;
  const [at, setAt] = useState<At>(() => (PACK_KINDS.includes(asked as PackKind) ? { k: asked as PackKind, i: -1 } : null));
  const [dir, setDir] = useState<-1 | 1>(1);
  if (!st) return null;
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);
  const night = fmtClock(tonightOf(snap.days, st, tk).at);
  const go = (next: At, d: -1 | 1 = 1) => {
    setDir(d);
    setAt(next);
  };
  /* the next grey one after k, or the four lights when every one after it is lit */
  const after = (k: PackKind) => {
    const n = packNext(pack, k);
    go(n ? { k: n, i: -1 } : null);
  };
  const lit = PACK_KINDS.filter((k) => packLit(pack, k)).length;

  if (!at) {
    const first = packNext(pack);
    return (
      <SceneFrame title="The night pack" sky="night" onClose={() => close()}>
        <Stage key="lights" dir={0}>
          <T v="title" style={[s.center, { color: nightInk.ink }]} accessibilityRole="header">
            {lit === 4 ? 'Your nights are set' : 'Four small switches for the night'}
          </T>
          <T style={[s.center, s.gap8, { color: nightInk.muted }]}>
            {lit === 4 ? 'The phone goes quiet at ' + night + ' on its own now.' : 'Made once in Shortcuts, about two minutes each. One step at a time.'}
          </T>
          <Middle>
            <View style={s.grid} accessibilityRole="summary">
              {PACK_KINDS.map((k) => {
                const on = packLit(pack, k);
                return (
                  <Pressable
                    key={k}
                    style={s.light}
                    accessibilityRole="button"
                    accessibilityLabel={SHORT[k] + (on ? ', on' : ', not set yet')}
                    onPress={() => go({ k, i: -1 })}>
                    {on ? (
                      <Flame level={level} size={84} alive label="" />
                    ) : (
                      <View style={s.unlit}>
                        <Icon name="flame" size={56} color="rgba(255,255,255,0.32)" />
                      </View>
                    )}
                    <Text style={[s.lightT, { color: on ? nightInk.ink : nightInk.muted }]}>{SHORT[k]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Middle>
          <Dock>
            {first ? (
              <Button label={lit ? 'Set up the next one' : 'Start with the first one'} kind="warm" onPress={() => go({ k: first, i: -1 })} />
            ) : (
              <Button label="Done" kind="warm" onPress={() => close()} />
            )}
          </Dock>
        </Stage>
      </SceneFrame>
    );
  }

  const w = packWords(at.k, night);
  const n = PACK_KINDS.indexOf(at.k) + 1;
  const on = packLit(pack, at.k);

  if (at.i < 0)
    return (
      <SceneFrame title={n + ' of 4'} sky="night" onBack={() => go(null, -1)} onClose={() => close()}>
        <Stage key={at.k} dir={dir}>
          <T v="title" style={[s.center, { color: nightInk.ink }]} accessibilityRole="header">
            {w.title}
          </T>
          <Middle>
            <Bubble text={w.line} style={{ alignSelf: 'center', maxWidth: 320 }} />
            <View style={s.one}>
              {on ? (
                <Flame level={level} size={150} alive label="" />
              ) : (
                <View style={[s.unlit, { width: 150, height: 150 }]}>
                  <Icon name="flame" size={110} color="rgba(255,255,255,0.32)" />
                </View>
              )}
            </View>
          </Middle>
          <Dock>
            <Button label={on ? 'Show me the steps again' : 'Show me how'} kind="warm" onPress={() => go({ k: at.k, i: 0 })} />
            <Quiet label={on ? 'Next one' : 'Skip this one'} onPress={() => after(at.k)} />
          </Dock>
        </Stage>
      </SceneFrame>
    );

  const step = w.walk[at.i];
  const last = at.i === w.walk.length - 1;
  const done = () => {
    packSay(at.k, true);
    buzz('lit');
    say(SHORT[at.k] + ' is on.');
    /* back to the four lights, to see this one lit; the next one is one tap from there */
    go(null);
  };
  return (
    <SceneFrame
      title={w.title}
      sky="night"
      dots={{ n: w.walk.length, i: at.i, label: 'Step ' + (at.i + 1) + ' of ' + w.walk.length }}
      onBack={() => go({ k: at.k, i: at.i - 1 }, -1)}
      onClose={() => close()}>
      <Stage key={at.k + at.i} dir={dir}>
        <T v="title" style={{ color: nightInk.ink }} accessibilityRole="header">
          {step.say}
        </T>
        <Middle>
          <Taps taps={step.taps} app={step.app} />
        </Middle>
        <Dock>
          <Button label={last ? 'It is set' : 'Next'} kind="warm" onPress={last ? done : () => go({ k: at.k, i: at.i + 1 })} />
          {step.app === 'Shortcuts' ? <Quiet label="Open Shortcuts" onPress={openShortcuts} /> : null}
        </Dock>
      </Stage>
    </SceneFrame>
  );
}

/** the picture: the rows the person will tap, in order, as the phone shows them (a gear for Settings, the Shortcuts mark) */
function Taps({ taps, app }: { taps: string[]; app: string }) {
  return (
    <View style={s.phone} accessible accessibilityLabel={'In ' + app + ': ' + taps.join(', then ')}>
      <View style={s.phoneTop}>
        <Icon name={app === 'Settings' ? 'gear' : 'bolt'} size={22} color={GOLD} />
        <Text style={s.phoneApp}>{app}</Text>
      </View>
      {taps.map((t, j) => (
        <View key={j} style={[s.row, j ? s.rowLine : null]}>
          <Text style={s.rowN}>{j + 1}</Text>
          <Text style={s.rowT}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/** a quiet link under or over the main button, for something the X does not do */
function Quiet({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        buzz('tap');
        onPress();
      }}
      style={({ pressed }) => [s.quiet, { opacity: pressed ? 0.6 : 1 }]}>
      <Text style={s.quietT}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  center: { textAlign: 'center' },
  gap8: { marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', rowGap: 24, alignSelf: 'stretch' },
  light: { width: '50%', alignItems: 'center', gap: 8 },
  unlit: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  lightT: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22 },
  one: { alignItems: 'center', marginTop: 16 },
  phone: { alignSelf: 'stretch', borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.09)', paddingHorizontal: 18, paddingVertical: 10 },
  phoneTop: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  phoneApp: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22, color: nightInk.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.18)' },
  rowN: { fontFamily: font.displayBold, fontSize: 20, lineHeight: 24, color: GOLD, minWidth: 18 },
  rowT: { flex: 1, fontFamily: font.bodyBold, fontSize: 20, lineHeight: 26, color: nightInk.ink },
  quiet: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  quietT: { fontFamily: font.bodyBold, fontSize: 17, lineHeight: 22, color: nightInk.ink },
});
