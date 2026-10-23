/* Checking a web tip. The Payment Link sends the person back to the site with the Checkout Session id; the device sends
   that id here, and this asks Stripe for the session with a restricted key that can only read Checkout Sessions. Nothing
   about the card ever reaches Daybook. The key is never in the code or the repository: it lives in AWS (an SSM
   SecureString, see secrets.ts) and is read when the first tip is checked. */
import { STRIPE_SESSION_RE } from '@daybook/core';

/** the parts of a Checkout Session this reads */
export interface StripeSession {
  id: string;
  mode: string;
  status: string | null;
  payment_status: string;
  amount_total: number | null;
  currency: string | null;
  client_reference_id: string | null;
  /** seconds */
  created: number;
}

/** null: Stripe has no such session (or it is in the other mode, test or live, than the key) */
export type FetchSession = (id: string) => Promise<StripeSession | null>;

/** the web tip is not set up yet (no key in AWS) */
export class NotSetUp extends Error {}

const API = 'https://api.stripe.com/v1/checkout/sessions/';

export function stripeFetcher(key: () => Promise<string | null>, fetchFn: typeof fetch = fetch): FetchSession {
  return async (id) => {
    if (!STRIPE_SESSION_RE.test(id)) return null;
    const k = await key();
    if (!k) throw new NotSetUp('The web tip is not set up yet.');
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetchFn(API + encodeURIComponent(id), { headers: { authorization: 'Bearer ' + k }, signal: ctl.signal });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error('Stripe answered ' + r.status);
      const s = (await r.json()) as Record<string, unknown>;
      return {
        id: String(s.id),
        mode: String(s.mode),
        status: typeof s.status === 'string' ? s.status : null,
        payment_status: String(s.payment_status),
        amount_total: typeof s.amount_total === 'number' ? s.amount_total : null,
        currency: typeof s.currency === 'string' ? s.currency : null,
        client_reference_id: typeof s.client_reference_id === 'string' ? s.client_reference_id : null,
        created: Number(s.created) || 0,
      };
    } finally {
      clearTimeout(timer);
    }
  };
}
