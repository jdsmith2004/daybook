/* The Daybook Pattern sheet: once it is on sale, the one place to pay (core supporter.ts and pattern-offer.ts). The line from the
   person's own log at the top, the flame and what it opens in the middle, and low where the thumb is, one group of choices with
   lifetime already picked and one button, so paying stays one tap. The two lifetime choices are the tips of $10 and $30; a quiet
   link under the button takes the $5 tip instead, and on iPhone another pays the picked choice on the web page (United States
   storefront only). On the web, lifetime is all there is. Someone who has it sees a thank-you, with Apple's page to change or
   cancel the monthly plan and a quiet way to go lifetime or give more. Anything that goes wrong is said here. */
import {
  fmtDate,
  gameCompute,
  keyOfDate,
  PAT_PERKS,
  PAT_WORDS,
  patActive,
  patOpen,
  patPreview,
  SITE_PAGES,
  supPaid,
  supPerks,
  tipLifetime,
} from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActionSheetIOS, ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Flame } from '@/components/flame';
import { HelpLine } from '@/components/help-line';
import { Dock, Finish } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { PerkLines, Plans } from '@/components/tip-parts';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import {
  buyMonthly,
  buyTip,
  manageMonthly,
  monthlyPrice,
  refreshPrices,
  syncTips,
  tipError,
  tipPrice,
  tipWays,
  tipWords,
  type TipTier,
  type TipVia,
} from '@/lib/tip';
import { useTheme } from '@/lib/theme';

const longDate = (ms: number) => fmtDate(keyOfDate(new Date(ms)), { month: 'long', day: 'numeric', year: 'numeric' });
/** "$10", not "$10.00" */
const short = (price: string) => price.replace(/\.00$/, '');

type Plan = 'monthly' | 'lifetime' | 'more';
/** the tip each choice is */
const TIER: Record<Exclude<Plan, 'monthly'> | 'small', TipTier> = { lifetime: 'generous', more: 'amazing', small: 'kind' };

/** a quiet text link: the accent for something to do, muted for the small print */
function Quiet({ label, onPress, muted }: { label: string; onPress: () => void; muted?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <T v="small" style={{ color: muted ? c.muted : c.accentText }}>
        {label}
      </T>
    </Pressable>
  );
}

export function PatternSheet() {
  const { snap, tk } = useStore();
  const st = snap.settings;
  const w = PAT_WORDS.sheet;
  const ways = tipWays();
  const [busy, setBusy] = useState<Plan | 'small' | 'restore' | null>(null);
  const [msg, setMsg] = useState('');
  /* what just went through: everything, or the $5 tip's sync and safe copy */
  const [won, setWon] = useState<'all' | 'tip' | null>(null);
  /* someone who has it asked to go lifetime or give more */
  const [again, setAgain] = useState(false);
  const [pick, setPick] = useState<Plan>('lifetime');
  const lock = useRef(false);
  const [priced, setPriced] = useState(false);
  useEffect(() => {
    let live = true;
    refreshPrices().then(() => live && setPriced(true));
    return () => {
      live = false;
    };
  }, []);
  const level = st ? gameCompute(snap.days, st, snap.reviews, tk).level.n : 1;
  const tell = (m: string) => {
    setMsg(m);
    if (m) AccessibilityInfo.announceForAccessibility(m);
  };
  const pay = async (plan: Plan | 'small', via: TipVia = ways[0] || 'web') => {
    if (busy || lock.current) return;
    lock.current = true;
    setBusy(plan);
    tell('');
    try {
      const all = plan === 'monthly' ? !!(await buyMonthly()) : null;
      const tip = plan === 'monthly' ? null : await buyTip(TIER[plan], via, true);
      if (all || tip) {
        buzz('lit');
        setAgain(false);
        setWon(all || patOpen({ sup: tip }) ? 'all' : 'tip');
      } else tell(tipWords() || tipError());
    } catch {
      /* a failure after the payment is possible, so this does not promise nothing was charged */
      tell('The purchase could not be finished. If it was charged, it is not lost: Restore finds it.');
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  const restore = async () => {
    if (busy || lock.current) return;
    lock.current = true;
    setBusy('restore');
    tell('');
    try {
      const r = await syncTips(true);
      if (patActive(r.pat) || supPaid(r.sup)) {
        buzz('lit');
        setWon(patOpen(r) ? 'all' : 'tip');
      } else tell(ways.includes('apple') ? w.restoreNone : w.restoreNoneWeb);
    } catch {
      tell(w.appleFailed);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  /* the web link (iPhone only): one choice in the system's own sheet, and the pick opens the web page */
  const onWeb = () => {
    if (busy || pick === 'monthly') return;
    const name = w[pick].name + ' · ' + short(tipPrice(TIER[pick]));
    ActionSheetIOS.showActionSheetWithOptions({ title: w.webTitle, message: w.webLine, options: [name, 'Cancel'], cancelButtonIndex: 1 }, (i) => {
      if (i === 0) pay(pick, 'web');
    });
  };
  const priceOf = (plan: Plan) => (priced ? short(plan === 'monthly' ? monthlyPrice() : tipPrice(TIER[plan])) : '…');

  const monthlyOn = patActive(st?.pat);
  const manage = monthlyOn && st?.pat?.src === 'apple' ? <Quiet label={w.manage} onPress={() => manageMonthly()} /> : null;

  if (won)
    return (
      <SheetFrame title={w.haveTitle}>
        <Finish level={level} title={won === 'all' ? w.doneTitle : w.tipDoneTitle} text={won === 'all' ? w.doneLine : w.tipDoneLine} size={120} alive />
        <PerkLines list={won === 'all' ? PAT_PERKS : supPerks(false).map((p) => p.sub)} open />
        <Dock>
          <Button label={w.done} onPress={closeSheet} />
          {manage ? <View style={s.foot}>{manage}</View> : null}
        </Dock>
      </SheetFrame>
    );

  const has = !!st && patOpen(st);
  const lifetime = tipLifetime(st?.sup);
  if (has && !again)
    return (
      <SheetFrame title={w.haveTitle} sub={w.haveLine}>
        <View style={s.mid}>
          <Flame level={level} size={160} alive />
          <PerkLines list={PAT_PERKS} open />
          <T v="small" tone="muted" style={s.c}>
            {monthlyOn
              ? w.since + longDate(st!.pat!.since) + '. ' + w.renews + longDate(st!.pat!.until) + '.'
              : st?.sup?.since
                ? w.since + longDate(st.sup.since) + '.'
                : ''}
          </T>
        </View>
        <Dock>
          <Button label={w.done} onPress={closeSheet} />
          <View style={s.links}>
            {manage}
            <Quiet
              label={lifetime ? w.giveMore : w.goLifetime}
              onPress={() => {
                setPick(lifetime ? 'more' : 'lifetime');
                setAgain(true);
              }}
            />
          </View>
        </Dock>
      </SheetFrame>
    );

  /* someone who has it is not offered what would give them less */
  const plans: Plan[] = [...(!has && ways.includes('apple') ? (['monthly'] as const) : []), ...(lifetime ? [] : (['lifetime'] as const)), 'more'];
  const line = st ? patPreview(snap.days, st, tk) : null;
  const go = w[pick].go + (priced ? ' · ' + priceOf(pick) + (pick === 'monthly' ? ' ' + w.monthly.per : '') : '');
  return (
    <SheetFrame
      title={again ? (lifetime ? w.giveMore : w.goLifetime) : w.title}
      sub={again ? (monthlyOn && !lifetime ? w.goLifetimeLine : undefined) : line || w.line}>
      <View style={s.mid}>
        <Flame level={level} size={again ? 160 : 96} alive />
        {again ? null : <PerkLines list={PAT_PERKS} />}
      </View>
      <Dock>
        <Plans
          list={plans.map((p) => ({ id: p, name: w[p].name, sub: w[p].sub, price: priceOf(p), per: w[p].per, badge: p === 'lifetime' ? w.badge : undefined }))}
          on={pick}
          off={!!busy}
          onPick={(id) => {
            buzz('tick');
            setPick(id as Plan);
            tell('');
          }}
        />
        {msg ? (
          <View style={{ gap: 4 }} accessibilityLiveRegion="polite">
            <T v="small" style={s.c}>
              {msg}
            </T>
            {[w.cancelled, w.webClosed, w.already, w.waiting].includes(msg) ? null : <HelpLine subject="Daybook: Daybook Pattern" center />}
          </View>
        ) : null}
        <Button label={busy && busy !== 'restore' ? 'One moment…' : go} disabled={!!busy} onPress={() => pay(pick)} />
        <View style={s.foot}>
          <View style={s.links}>
            {!has && !supPaid(st?.sup) ? <Quiet label={w.small} onPress={() => pay('small')} /> : null}
            {ways.length > 1 && pick !== 'monthly' ? <Quiet label={w.web} onPress={onWeb} /> : null}
          </View>
          <T v="small" tone="muted" style={[s.c, s.legal]}>
            {plans.includes('monthly') ? w.terms : w.termsWeb}
          </T>
          <View style={s.links}>
            {busy === 'restore' ? <ActivityIndicator /> : <Quiet muted label={w.restore} onPress={restore} />}
            <Quiet muted label={w.termsLink} onPress={() => Linking.openURL(SITE_PAGES.terms).catch(() => undefined)} />
            <Quiet muted label={w.privacyLink} onPress={() => Linking.openURL(SITE_PAGES.privacy).catch(() => undefined)} />
          </View>
        </View>
      </Dock>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  legal: { fontSize: 12, lineHeight: 16 },
  mid: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingVertical: 4 },
  foot: { alignItems: 'center', gap: 10, marginTop: 2 },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 8, justifyContent: 'center', alignItems: 'center' },
});
