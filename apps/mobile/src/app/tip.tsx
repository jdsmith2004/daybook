/* The tip sheet: the one place a tip is offered (Today's Support button and card, the row on More, a locked page). The why
   at the top, what a tip unlocks in the middle, the three tips low where the thumb is, each with its price as the store
   gives it (lib/tip.ts). On iPhone, Apple's in-app purchase is first, and a quiet link under the tips opens the choice of
   the same three on the web tip page, which takes Apple Pay too (allowed on the US storefront, Guidelines 3.1.1(a) and
   3.1.3); one pick opens it. Anything that goes wrong is said here, under the tips: on iPhone the toast sits under a
   sheet, where no one would see it. A supporter sees a thank-you instead, with a quiet way to tip again. A tip that goes
   through ends in a short celebration. The payments side saves the record (Settings.sup); this page only shows it. Once
   Daybook Pattern is on sale, this route is its sheet instead, which holds the tips too (components/pattern-sheet.tsx), and
   the sheet here goes in that same change. */
import { fmtDate, gameCompute, isSupporter, keyOfDate, patOpen, PATTERN_FROM, supPaid, supPerks, TIP_WORDS } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActionSheetIOS, ActivityIndicator, StyleSheet, View } from 'react-native';

import { Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { HelpLine } from '@/components/help-line';
import { PatternSheet } from '@/components/pattern-sheet';
import { Dock, Finish } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { PayRow, Perks } from '@/components/tip-parts';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { buyTip, refreshPrices, restoreTips, TIP_TIERS, tipError, tipPrice, tipWays, tipWords, type TipTier, type TipVia } from '@/lib/tip';

export default function Tip() {
  return PATTERN_FROM != null ? <PatternSheet /> : <TipSheet />;
}

function TipSheet() {
  const { snap, tk } = useStore();
  const st = snap.settings;
  const ways = tipWays();
  const [busy, setBusy] = useState<TipTier | 'restore' | null>(null);
  /* what went wrong, said under the tips */
  const [msg, setMsg] = useState('');
  const [won, setWon] = useState(false);
  const [again, setAgain] = useState(false);
  /* one purchase at a time, even for two taps in the same moment (state alone lets both through before it updates) */
  const lock = useRef(false);
  /* the store's own prices, asked for as the sheet opens; until it answers, the pills wait instead of showing a guess */
  const [priced, setPriced] = useState(false);
  useEffect(() => {
    let live = true;
    refreshPrices().then(() => live && setPriced(true));
    return () => {
      live = false;
    };
  }, []);
  const sup = isSupporter(st);
  const level = st ? gameCompute(snap.days, st, snap.reviews, tk).level.n : 1;
  const w = TIP_WORDS.sheet;

  const got = () => {
    buzz('lit');
    setAgain(false);
    setWon(true);
  };
  const tell = (m: string) => {
    setMsg(m);
    if (m) AccessibilityInfo.announceForAccessibility(m);
  };
  const pay = async (tier: TipTier, via: TipVia = ways[0] || 'web') => {
    if (busy || lock.current) return;
    lock.current = true;
    setBusy(tier);
    tell('');
    try {
      if (await buyTip(tier, via)) got();
      else tell(tipWords() || tipError());
    } catch {
      /* a failure after the payment is possible, so this does not promise nothing was charged */
      tell('The tip could not be finished. If it was charged, it is not lost: Restore a tip finds it.');
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  /* the web link (iPhone only): the three tips in the system's own choice sheet, and the pick opens the web tip page */
  const onWeb = () => {
    if (busy) return;
    const names = TIP_TIERS.map((t) => t.name + ' · $' + t.usd.toFixed(2));
    ActionSheetIOS.showActionSheetWithOptions(
      { title: w.webTitle, message: w.webLine, options: [...names, w.cancel], cancelButtonIndex: names.length },
      (i) => {
        if (i < names.length) pay(TIP_TIERS[i].id, 'web');
      },
    );
  };
  const restore = async () => {
    if (busy || lock.current) return;
    lock.current = true;
    setBusy('restore');
    tell('');
    try {
      if (supPaid(await restoreTips())) got();
      else {
        /* "none" only when the store answered; a store that did not answer is said as that */
        tell(tipError() && tipError() !== 'No tip was found.' ? tipError() : ways.includes('apple') ? w.restoreNone : w.restoreNoneWeb);
      }
    } catch {
      tell(w.storeDown);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };

  const tiers = (
    <View style={{ gap: 10 }}>
      {TIP_TIERS.map((t, i) => (
        <PayRow
          key={t.id}
          name={t.name}
          badge={i === 1 ? w.badge : undefined}
          price={priced ? tipPrice(t.id) : '…'}
          busy={busy === t.id}
          off={!!busy}
          onPress={() => pay(t.id)}
        />
      ))}
      {msg ? (
        <View style={{ gap: 4 }} accessibilityLiveRegion="polite">
          <T v="small" style={s.c}>
            {msg}
          </T>
          {/* a person to write to only when something went wrong, not after a cancel or a wait */}
          {[w.cancelled, w.webClosed, w.already, w.waiting].includes(msg) ? null : (
            <HelpLine lead={msg === w.restoreNone || msg === w.restoreNoneWeb ? w.restoreHelp : undefined} subject="Daybook: a tip" center />
          )}
        </View>
      ) : null}
      {ways.length > 1 ? (
        <View style={{ alignItems: 'center' }}>
          <Link label={w.web} onPress={onWeb} />
        </View>
      ) : null}
    </View>
  );

  /* a tip just went through */
  if (won)
    return (
      <SheetFrame title={w.thanksTitle}>
        <Finish level={level} title={w.doneTitle} text={w.doneLine} size={120} alive />
        <Perks list={supPerks(PATTERN_FROM == null || patOpen(st))} open />
        <Dock>
          <Button label={w.done} onPress={closeSheet} />
        </Dock>
      </SheetFrame>
    );

  /* a supporter: what is open, and a quiet way to tip again */
  if (sup)
    return (
      <SheetFrame title={w.thanksTitle} sub={w.thanksLine}>
        <View style={s.mid}>
          {again ? null : <Flame level={level} size={120} alive />}
          <Perks list={supPerks(PATTERN_FROM == null || patOpen(st))} open />
          {st?.sup?.since ? (
            <T v="small" tone="muted" style={s.c}>
              A supporter since {fmtDate(keyOfDate(new Date(st.sup.since)), { month: 'long', day: 'numeric', year: 'numeric' })}.
            </T>
          ) : null}
        </View>
        <Dock>
          {again ? tiers : null}
          <Button kind={again ? 'ghost' : 'primary'} label={w.done} onPress={closeSheet} />
          {again ? null : (
            <View style={{ alignItems: 'center' }}>
              <Link label={w.again} onPress={() => setAgain(true)} />
            </View>
          )}
        </Dock>
      </SheetFrame>
    );

  return (
    <SheetFrame title={w.title} sub={w.line}>
      <View style={s.mid}>
        <Flame level={level} size={150} alive />
        <Perks list={supPerks()} />
      </View>
      <Dock>
        {tiers}
        <View style={s.foot}>
          {busy === 'restore' ? <ActivityIndicator /> : <Link label={w.restore} onPress={restore} />}
          <T v="small" tone="muted" style={s.c}>
            {w.note}
          </T>
        </View>
      </Dock>
    </SheetFrame>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingVertical: 4 },
  foot: { alignItems: 'center', gap: 4 },
});
