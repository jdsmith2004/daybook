/* The Daybook Pattern sheet (opened with /tip?for=pattern; core supporter.ts and pattern-offer.ts). The line from the person's
   own log at the top, what it opens in the middle, the two forms low where the thumb is, lifetime marked as the pick, and what
   Apple asks to be said beside a subscription at the foot. On iPhone, a quiet link under them opens lifetime on the web page
   (United States storefront only); on the web, lifetime is the only form. Someone who has it sees a thank-you, with Apple's
   page to change or cancel the monthly plan. Anything that goes wrong is said here, as on the tip sheet. */
import { fmtDate, gameCompute, keyOfDate, PAT_PERKS, PAT_WORDS, patActive, patOpen, patPreview, SITE_PAGES, type PatKind } from '@daybook/core';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActionSheetIOS, ActivityIndicator, Linking, StyleSheet, View } from 'react-native';

import { Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { HelpLine } from '@/components/help-line';
import { Dock, Finish } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { PayRow, Perks } from '@/components/tip-parts';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { buyPattern, manageMonthly, patPrice, patWays, refreshPrices, syncTips, tipError, tipWords, type TipVia } from '@/lib/tip';

const longDate = (ms: number) => fmtDate(keyOfDate(new Date(ms)), { month: 'long', day: 'numeric', year: 'numeric' });

export function PatternSheet() {
  const { snap, tk } = useStore();
  const st = snap.settings;
  const w = PAT_WORDS.sheet;
  const [busy, setBusy] = useState<PatKind | 'restore' | null>(null);
  const [msg, setMsg] = useState('');
  const [won, setWon] = useState(false);
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
  const pay = async (kind: PatKind, via: TipVia) => {
    if (busy || lock.current) return;
    lock.current = true;
    setBusy(kind);
    tell('');
    try {
      if (await buyPattern(kind, via)) {
        buzz('lit');
        setWon(true);
      } else tell(tipWords() || tipError());
    } catch {
      /* a failure after the payment is possible, so this does not promise nothing was charged */
      tell('The purchase could not be finished. If it was charged, it is not lost: Restore a purchase finds it.');
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
      if (patActive(r.pat)) {
        buzz('lit');
        setWon(true);
      } else tell(life.includes('apple') ? w.restoreNone : w.restoreNoneWeb);
    } catch {
      tell(w.appleFailed);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  const life = patWays('lifetime');
  const month = patWays('monthly');
  /* the web link (iPhone only): one choice in the system's own sheet, and the pick opens the web page */
  const onWeb = () => {
    if (busy) return;
    const name = w.lifetime + ' · ' + patPrice('lifetime');
    ActionSheetIOS.showActionSheetWithOptions({ title: w.webTitle, message: w.webLine, options: [name, 'Cancel'], cancelButtonIndex: 1 }, (i) => {
      if (i === 0) pay('lifetime', 'web');
    });
  };

  if (won)
    return (
      <SheetFrame title={w.haveTitle}>
        <Finish level={level} title={w.doneTitle} text={w.doneLine} size={120} alive />
        <Perks list={PAT_PERKS} open />
        <Dock>
          <Button label={w.done} onPress={closeSheet} />
        </Dock>
      </SheetFrame>
    );

  if (st && patOpen(st))
    return (
      <SheetFrame title={w.haveTitle} sub={w.haveLine}>
        <View style={s.mid}>
          <Flame level={level} size={120} alive />
          <Perks list={PAT_PERKS} open />
          {st.pat?.since ? (
            <T v="small" tone="muted" style={s.c}>
              {w.since + longDate(st.pat.since)}.{st.pat.until != null ? ' ' + w.renews + longDate(st.pat.until) + '.' : ''}
            </T>
          ) : null}
        </View>
        <Dock>
          <Button label={w.done} onPress={closeSheet} />
          {st.pat?.kind === 'monthly' && st.pat.src === 'apple' ? (
            <View style={{ alignItems: 'center' }}>
              <Link label={w.manage} onPress={() => manageMonthly()} />
            </View>
          ) : null}
        </Dock>
      </SheetFrame>
    );

  const line = st ? patPreview(snap.days, st, tk) : null;
  return (
    <SheetFrame title={w.title} sub={line || w.line}>
      <View style={s.mid}>
        <Perks list={PAT_PERKS} />
      </View>
      <Dock>
        <View style={{ gap: 10 }}>
          {month.length ? (
            <PayRow
              n={0}
              icon="sunrise"
              name={w.monthly}
              sub={w.monthlySub}
              price={priced ? patPrice('monthly') : '…'}
              busy={busy === 'monthly'}
              off={!!busy}
              onPress={() => pay('monthly', 'apple')}
            />
          ) : null}
          {life.length ? (
            <PayRow
              n={2}
              icon="sparkle"
              name={w.lifetime}
              sub={w.lifetimeSub}
              badge={w.badge}
              price={priced ? patPrice('lifetime') : '…'}
              busy={busy === 'lifetime'}
              off={!!busy}
              onPress={() => pay('lifetime', life[0])}
            />
          ) : null}
          {msg ? (
            <View style={{ gap: 4 }} accessibilityLiveRegion="polite">
              <T v="small" style={s.c}>
                {msg}
              </T>
              {[w.cancelled, w.webClosed, w.already, w.waiting].includes(msg) ? null : <HelpLine subject="Daybook: Daybook Pattern" center />}
            </View>
          ) : null}
          {life.length > 1 ? (
            <View style={{ alignItems: 'center' }}>
              <Link label={w.web} onPress={onWeb} />
            </View>
          ) : null}
        </View>
        <View style={s.foot}>
          <Link label={w.tip} onPress={() => router.replace('/tip')} />
          {busy === 'restore' ? <ActivityIndicator /> : <Link label={w.restore} onPress={restore} />}
          <T v="small" tone="muted" style={s.c}>
            {month.length ? w.terms : w.termsWeb}
          </T>
          <View style={s.legal}>
            <Link label={w.termsLink} onPress={() => Linking.openURL(SITE_PAGES.terms).catch(() => undefined)} />
            <Link label={w.privacyLink} onPress={() => Linking.openURL(SITE_PAGES.privacy).catch(() => undefined)} />
          </View>
        </View>
      </Dock>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingVertical: 4 },
  foot: { alignItems: 'center', gap: 4 },
  legal: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
});
