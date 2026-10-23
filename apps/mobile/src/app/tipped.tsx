/* Back from the web tip page with a Checkout Session id (daybook://tipped?session_id=..., or /tipped on the web). On iPhone
   the auth session catches that address itself (tip.ts), so this route only opens when a link like it reaches the app
   another way. It hands the id to tip.ts, which claims it, and goes on to Today. */
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { tippedWith } from '@/lib/tip';

export default function Tipped() {
  const p = useLocalSearchParams<{ session_id?: string }>();
  useEffect(() => {
    if (typeof p.session_id === 'string') tippedWith(p.session_id).catch(() => undefined);
  }, [p.session_id]);
  return <Redirect href="/" />;
}
