/* Friends (beta): live notes to a friend's phone, through Expo's push service (free, no key: the app's own Expo project id is in
   the token). Only friends.ts sends, only about what a friend shared, and only within its caps. A phone that is gone tells us so
   (DeviceNotRegistered), and its token is dropped. Nothing about the log is ever in a note. */
export type PushMsg = { to: string; title: string; body: string; data?: Record<string, string> };
/** what came back for each message, in order: 'ok', 'gone' (the token is dead), or 'error' */
export type PushSend = (msgs: PushMsg[]) => Promise<('ok' | 'gone' | 'error')[]>;

export const isPushToken = (t: unknown): t is string => typeof t === 'string' && /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{8,64}\]$/.test(t);

const expoSend: PushSend = async (msgs) => {
  if (!msgs.length) return [];
  try {
    const r = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(msgs.map((m) => ({ ...m, sound: 'default', channelId: 'friends' }))),
      signal: AbortSignal.timeout(4000),
    });
    const j = (await r.json().catch(() => null)) as { data?: { status?: string; details?: { error?: string } }[] } | null;
    return msgs.map((_, i) => {
      const d = j?.data?.[i];
      if (d?.status === 'ok') return 'ok';
      return d?.details?.error === 'DeviceNotRegistered' ? 'gone' : 'error';
    });
  } catch {
    /* a note that does not go is let go: it is never worth failing what the person did */
    return msgs.map(() => 'error' as const);
  }
};

let send: PushSend = expoSend;
export const pushSend: PushSend = (m) => send(m);
/** tests put a stand-in here */
export function setPushSend(f: PushSend | null) {
  send = f || expoSend;
}
