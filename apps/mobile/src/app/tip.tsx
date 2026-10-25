/* The tip sheet: the one place a tip is offered (Today's Support button and card, the row on More, a locked page). The why
   at the top, what a tip unlocks in the middle, the three tips low where the thumb is, each with its price as the store
   gives it (lib/tip.ts). On iPhone, Apple's in-app purchase is first, and a quiet link under the tips opens the choice of
   the same three on the web tip page, which takes Apple Pay too (allowed on the US storefront, Guidelines 3.1.1(a) and
   3.1.3); one pick opens it. Anything that goes wrong is said here, under the tips: on iPhone the toast sits under a
   sheet, where no one would see it. A supporter sees a thank-you instead, with a quiet way to tip again. A tip that goes
   through ends in a short celebration. The payments side saves the record (Settings.sup); this page only shows it. */
import { fmtDate, gameCompute, isSupporter, keyOfDate, supPaid, supPerks, TIP_WORDS, type Perk } from '@daybook/core';
import { useState } from 'react';
import { AccessibilityInfo, ActionSheetIOS, ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';

import { Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { Dock, Finish } from '@/components/scene';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useStore } from '@/lib/store';
import { buyTip, restoreTips, TIP_TIERS, tipError, tipPrice, tipWays, type TipTier, type TipVia } from '@/lib/tip';
import { font, useTheme } from '@/lib/theme';

export default function Tip() {
  const { snap, tk } = useStore();
  const st = snap.settings;
  const ways = tipWays();
  const [busy, setBusy] = useState<TipTier | 'restore' | null>(null);
  /* what went wrong, said under the tips */
  const [msg, setMsg] = useState('');
  const [won, setWon] = useState(false);
  const [again, setAgain] = useState(false);
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
    if (busy) return;
    setBusy(tier);
    tell('');
    try {
      if (await buyTip(tier, via)) got();
      else tell(tipError());
    } catch {
      tell('The tip did not go through, and nothing was charged. Try again in a moment.');
    } finally {
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
    if (busy) return;
    setBusy('restore');
    tell('');
    try {
      if (supPaid(await restoreTips())) got();
      else tell(w.restoreNone);
    } catch {
      tell('Could not check right now. Try again in a moment.');
    } finally {
      setBusy(null);
    }
  };

  const tiers = (
    <View style={{ gap: 10 }}>
      {TIP_TIERS.map((t, i) => (
        <TierRow key={t.id} n={i} name={t.name} price={tipPrice(t.id)} busy={busy === t.id} off={!!busy} onPress={() => pay(t.id)} />
      ))}
      {msg ? (
        <T v="small" style={s.c}>
          {msg}
        </T>
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
        <Perks list={supPerks()} open />
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
          <Perks list={supPerks()} open />
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

/** what a tip unlocks: an icon, the name and a line, with a check once it is open */
function Perks({ list, open }: { list: Perk[]; open?: boolean }) {
  const c = useTheme();
  return (
    <View style={{ gap: 10, alignSelf: 'stretch' }}>
      {list.map((p) => (
        <View key={p.id} style={[s.perk, { backgroundColor: open ? c.mintSoft : c.surface2 }]}>
          <View style={[s.perkIc, { backgroundColor: open ? c.mint : c.sunSoft }]}>
            <Icon name={open ? 'check' : p.icon} size={20} color={open ? '#FFFFFF' : c.sunText} />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <T v="label">{p.name}</T>
            <T v="small" tone="muted">
              {p.sub}
            </T>
          </View>
        </View>
      ))}
    </View>
  );
}

/** one tip: a heart that grows with the tip, its name, and its price in a pill */
function TierRow({ n, name, price, busy, off, onPress }: { n: number; name: string; price: string; busy: boolean; off: boolean; onPress: () => void }) {
  const c = useTheme();
  const tone = [
    { bg: c.sunSoft, fg: c.sunText },
    { bg: c.coralSoft, fg: c.coralText },
    { bg: c.accentSoft, fg: c.accentText },
  ][n];
  /* the middle tip is the one suggested: drawn bigger, with a border, a filled price and a badge */
  const pick = n === 1;
  const pillBg = pick ? c.accent : c.accentSoft;
  const pillFg = pick ? c.accentInk : c.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${price}${pick ? ', ' + TIP_WORDS.sheet.badge : ''}`}
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        s.row,
        pick && s.pick,
        {
          backgroundColor: c.surface,
          borderColor: pick ? c.accent : 'transparent',
          shadowColor: c.lip,
          opacity: off && !busy ? 0.6 : 1,
          transform: [{ translateY: pressed ? 3 : 0 }],
        },
      ]}>
      <View style={[s.rowIc, { backgroundColor: tone.bg }]}>
        <Icon name="heart" size={16 + n * 4} color={tone.fg} />
      </View>
      <View style={{ flex: 1, gap: 4, alignItems: 'flex-start' }}>
        <Text style={[s.rowT, { color: c.ink }]}>{name}</Text>
        {pick ? (
          <View style={[s.badge, { backgroundColor: c.sun }]}>
            <Text style={[s.badgeT, { color: c.onSun }]}>{TIP_WORDS.sheet.badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={[s.pill, { backgroundColor: pillBg }]}>
        {busy ? <ActivityIndicator color={pillFg} size="small" /> : <Text style={[s.pillT, { color: pillFg }]}>{price}</Text>}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  mid: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingVertical: 4 },
  foot: { alignItems: 'center', gap: 4 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
  perkIc: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 20,
    borderWidth: 2.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  rowIc: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pick: { minHeight: 78 },
  rowT: { fontFamily: font.bodyBold, fontSize: 17 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeT: { fontFamily: font.bodyBold, fontSize: 11.5, letterSpacing: 0.3 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 84, minHeight: 40, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center' },
  pillT: { fontFamily: font.bodyBold, fontSize: 15 },
});
