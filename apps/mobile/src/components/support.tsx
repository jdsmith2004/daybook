/* The tip jar in the app (core support.ts decides when, and holds the words): the small Support button at the top of Today,
   the card on Today, the row on More, and the card on a locked page. Every one opens the tip sheet (app/tip.tsx), where a
   tip of $5 or more makes the person a supporter (core supporter.ts). Once they are, the asks stop and the row on More
   says thank you. On iPhone the tip is Apple's in-app purchase first, with the web tip page as a second way (allowed on
   the US storefront, Guidelines 3.1.1(a) and 3.1.3; Daybook is offered in the United States only, docs/launch.md). On
   Android nothing about tips shows and nothing is locked, until Google Play's rules for it are checked (docs/plan.md). */
import {
  extraLocked,
  isSupporter,
  PAT_WORDS,
  patActive,
  monthEnd,
  monthList,
  monthNext,
  monthRead,
  patMonthOpen,
  patOffer,
  patPreview,
  SUPPORT_URL,
  SUP_SYNC_WORDS,
  tipAnswered,
  tipMoment,
  tipMomentShown,
  TIP_WORDS,
  urLastAt,
  type Extra,
  type TipMoment,
} from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { LinkCard } from '@/components/link-card';
import { SHOTS_ANDROID } from '@/shots/boot';
import { Button, Card, Icon, T } from '@/components/ui';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';
import { tipWays } from '@/lib/tip';
import { font, useTheme } from '@/lib/theme';

/** whether a tip can be paid on this device. Off on Android (see above). */
export const TIP_ON = Platform.OS !== 'android' && !SHOTS_ANDROID && !!SUPPORT_URL && tipWays().length > 0;
/** the tip link's switch for the rules in core (tipAsk, tipButton): '' where no tip is offered */
export const TIP_URL = TIP_ON ? SUPPORT_URL : '';
/** what the sync screens say while an account waits for a tip: where no tip can be paid, nothing about tips */
export const SYNC_NEED = TIP_ON ? SUP_SYNC_WORDS.need : SUP_SYNC_WORDS.needNoTip;
export const SYNC_NEED_SHORT = TIP_ON ? SUP_SYNC_WORDS.short : SUP_SYNC_WORDS.shortNoTip;
/** opens the tip sheet */
export const openTip = () => (TIP_ON ? router.push('/tip') : undefined);

/** opens the Daybook Pattern sheet, the same route as the tips once it is on sale */
export const openPattern = openTip;

/** the line from the person's own log that leads the ask for Daybook Pattern, or null when it cannot be asked for now (core patOffer) */
export function usePatOffer(): string | null {
  const { snap, tk, now } = useStore();
  const sos = useSos();
  if (!TIP_ON || !snap.settings) return null;
  return patOffer(snap.days, snap.settings, tk, { now, sos: urLastAt(sos.mem) });
}

/** whether an extra shows as locked here (core extraLocked) */
export function useLocked(extra: Extra, signedIn?: boolean): boolean {
  const { snap } = useStore();
  return extraLocked(snap.settings, extra, { canTip: TIP_ON, signedIn });
}

/** the card on Today, at a good moment (core tipAsk) */
export function TipCard() {
  const c = useTheme();
  const { snap, tk, apply } = useStore();
  const done = () => apply(tipAnswered(snap.settings!, tk));
  return (
    <Card style={{ backgroundColor: c.sunSoft, borderColor: c.sunSoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="heart" size={22} color={c.sunText} />
        <T v="label" style={{ flex: 1 }}>
          {TIP_WORDS.h}
        </T>
      </View>
      <T v="small">{TIP_WORDS.p}</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button
          label={TIP_WORDS.go}
          onPress={() => {
            done();
            openTip();
          }}
        />
        <Button kind="ghost" label={TIP_WORDS.no} onPress={done} />
      </View>
    </Card>
  );
}

/** the row on More: an ask, or a thank-you for a supporter; nothing where no tip is offered. Daybook Pattern gets its own row,
    led by the line from the person's log, while it can be asked for. */
export function TipRow() {
  const { snap } = useStore();
  const offer = usePatOffer();
  if (!TIP_ON) return null;
  if (patActive(snap.settings?.pat))
    return <LinkCard icon="heart" tone="sun" title={PAT_WORDS.rowHave.title} sub={PAT_WORDS.rowHave.sub} onPress={openPattern} />;
  const w = isSupporter(snap.settings) ? TIP_WORDS.rowThanks : TIP_WORDS.row;
  return (
    <>
      {offer ? <LinkCard icon="chart" tone="accent" title={PAT_WORDS.row.title} sub={offer} onPress={openPattern} /> : null}
      <LinkCard icon="heart" tone="sun" title={w.title} sub={w.sub} onPress={openTip} />
    </>
  );
}

/** the small Support button beside Today's title */
export function TipTop({ on }: { on?: { glass: string; ink: string } }) {
  const c = useTheme();
  const bg = on ? on.glass : c.sun;
  const ink = on ? on.ink : c.onSun;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Support Daybook. Opens the tips, and what a tip unlocks."
      onPress={openTip}
      hitSlop={6}
      style={({ pressed }) => [s.top, { backgroundColor: bg, opacity: pressed ? 0.85 : 1 }]}>
      <Icon name="heart" size={15} color={ink} />
      <Text style={[s.topT, { color: ink }]}>{TIP_WORDS.top}</Text>
    </Pressable>
  );
}

/** whether a moment of earned value carries a tip ask (core tipMoment). Decided once, when the moment opens; an ask shown
    is kept (tipMomentShown), so no other ask comes for a week. */
export function useTipMoment(why: TipMoment, quiet = false): boolean {
  const { snap, tk, now, apply } = useStore();
  const sos = useSos();
  const [ask] = useState(
    () => TIP_ON && !!snap.settings && tipMoment(snap.days, snap.settings, tk, new Date(now).getHours(), TIP_URL, { now, sos: urLastAt(sos.mem) }, quiet),
  );
  useEffect(() => {
    if (ask && snap.settings) apply(tipMomentShown(snap.settings, tk));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask]);
  return ask;
}

/** the short ask under a moment of earned value: one line, and a button to the tips. onGo closes the moment first. */
export function MomentAsk({ why, onGo, center }: { why: TipMoment; onGo: () => void; center?: boolean }) {
  const c = useTheme();
  return (
    <View style={[s.moment, { backgroundColor: c.sunSoft }]}>
      <T v="small" style={center ? { textAlign: 'center' } : undefined}>
        {TIP_WORDS.moment[why]}
      </T>
      <Button
        kind="ghost"
        icon="heart"
        label={TIP_WORDS.moment.go}
        onPress={() => {
          onGo();
          setTimeout(openTip, 350);
        }}
      />
    </View>
  );
}

/** the card on a locked page: what the extra is, and the way to open it */
export function UnlockCard({ extra }: { extra: 'stats' | 'sync' }) {
  const c = useTheme();
  const w = TIP_WORDS.lock[extra];
  return (
    <Card style={{ backgroundColor: c.sunSoft, borderColor: c.sunSoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <View style={[s.lock, { backgroundColor: c.sun }]}>
          <Icon name="lock" size={18} color={c.onSun} />
        </View>
        <T v="h2" style={{ flex: 1 }}>
          {w.h}
        </T>
      </View>
      <T v="small">{w.p}</T>
      <Button label={TIP_WORDS.lock.btn} onPress={openTip} />
    </Card>
  );
}

/** the card on the locked part of Pattern, once Daybook Pattern is on sale: the line from the person's own log and the way in.
    With nothing true to say yet, or at a moment when nothing is asked, only a kind word: no price and no button. */
export function PatternCard() {
  const c = useTheme();
  const { snap, tk } = useStore();
  const offer = usePatOffer();
  const w = PAT_WORDS.card;
  const quiet = !offer && !!snap.settings && patPreview(snap.days, snap.settings, tk);
  return (
    <Card style={{ backgroundColor: c.sunSoft, borderColor: c.sunSoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <View style={[s.lock, { backgroundColor: c.sun }]}>
          <Icon name="lock" size={18} color={c.onSun} />
        </View>
        <T v="h2" style={{ flex: 1 }}>
          {w.h}
        </T>
      </View>
      <T v="small">{offer || (quiet ? w.rest : w.soon)}</T>
      {offer ? <Button label={w.go} onPress={openPattern} /> : null}
    </Card>
  );
}

/** the finished months this person can read (core patMonthOpen); where nothing is locked (Android), all of them */
export function useOpenMonths(): string[] {
  const { snap, tk, now } = useStore();
  const st = snap.settings;
  if (!st) return [];
  const all = monthList(snap.days, st, tk);
  return TIP_ON ? all.filter((ym) => patMonthOpen(st, monthEnd(ym), now)) : all;
}

/** the way into the month read on Pattern: the latest month's first line, or when the first read comes */
export function MonthCard() {
  const { snap, tk } = useStore();
  const open = useOpenMonths();
  const st = snap.settings;
  if (!st) return null;
  const w = PAT_WORDS.month;
  const r = open[0] ? monthRead(snap.days, st, open[0]) : null;
  return (
    <LinkCard icon="sunrise" tone="accent" title={w.title} sub={r ? r.head : w.waiting + monthNext(tk) + w.waitingEnd} onPress={() => router.push('/month')} />
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 12, borderRadius: 999, marginTop: 2 },
  topT: { fontFamily: font.bodySemi, fontSize: 13 },
  moment: { alignSelf: 'stretch', gap: 8, padding: 12, borderRadius: 18 },
  lock: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
