/* Paying a tip: the one place the screens call. On iPhone a tip is Apple's in-app purchase first; the web tip page (Stripe,
   which takes Apple Pay) is the second way there and the only way on the web. A tip of SUPPORT_MIN dollars or more makes
   the person a supporter (core supporter.ts). The screens never talk to Apple, Stripe or the server themselves. */
import type { Supporter } from '@daybook/core';

/** the three tips, as on the tip sheet */
export type TipTier = 'kind' | 'generous' | 'amazing';
export const TIP_TIERS: { id: TipTier; name: string; usd: number }[] = [
  { id: 'kind', name: 'Kind tip', usd: 5 },
  { id: 'generous', name: 'Generous tip', usd: 10 },
  { id: 'amazing', name: 'Amazing tip', usd: 20 },
];

/** how a tip is paid: Apple's in-app purchase (iPhone only) or the web tip page */
export type TipVia = 'apple' | 'web';

/** the ways this device can pay, best first */
export function tipWays(): TipVia[] {
  return ['web'];
}

/** the price to show for a tier, as the store formats it (falls back to "$5.00") */
export function tipPrice(tier: TipTier): string {
  const t = TIP_TIERS.find((x) => x.id === tier)!;
  return `$${t.usd.toFixed(2)}`;
}

/** pays a tip. Resolves to the new supporter record once the payment is confirmed, or null when it was cancelled or failed. */
export async function buyTip(_tier: TipTier, _via: TipVia): Promise<Supporter | null> {
  return null;
}

/** looks for tips paid before (a new phone, a reinstall, a tip on the web) and resolves to the record, or null */
export async function restoreTips(): Promise<Supporter | null> {
  return null;
}
