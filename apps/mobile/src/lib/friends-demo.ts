/* Friends (beta), the demo: /friends?demo=1 opens the Friends page with made-up friends already added, with no setup and no
   account, so anyone can see and play it, on the live site too (the owner, November 15, 2026: "so it can actually load me something
   that I can view"). It answers the way services/api friends.ts does, in memory on this page only: nothing is sent or kept, and a
   reload without ?demo=1 is the real Friends page again. */
import { normCode, REPORT_DEFAULT, SHARE_DEFAULT, type ShareVals } from '@daybook/core';
import { Platform } from 'react-native';

let on = false;
/** whether this page is the demo: opened with ?demo=1, kept until the page reloads */
export function friendsDemo(): boolean {
  return on;
}
export function startFriendsDemo() {
  on = true;
}
/* the web: a link straight to a Friends page with ?demo=1 starts it before anything draws, so setup never shows */
if (Platform.OS === 'web' && typeof window !== 'undefined' && /^\/friend/.test(window.location.pathname) && /[?&]demo=1\b/.test(window.location.search))
  on = true;

const H = 3600_000;
const dayKey = (ms: number) => {
  const d = new Date(ms);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
type Friend = { fid: string; since: number; name: string; vals: ShareVals; rt: string | null; cheer?: { k: string; at: number }; sent?: number };
type World = { me: { name: string; on: typeof SHARE_DEFAULT; rt: string | null } | null; invite: { code: string; exp: number } | null; friends: Friend[] };
let world: World | null = null;

function fresh(): World {
  const now = Date.now();
  const dk = dayKey(now);
  return {
    me: { name: 'You', on: { ...SHARE_DEFAULT }, rt: REPORT_DEFAULT },
    invite: null,
    friends: [
      {
        fid: 'demo-sam',
        since: now - 20 * 24 * H,
        name: 'Sam',
        vals: { lessons: 5, checkins: 4, days: 6, level: 6, lname: 'Steady', dk, dl: 1, dc: 1 },
        rt: '21:00',
        cheer: { k: 'warm', at: now - H },
      },
      {
        fid: 'demo-maya',
        since: now - 9 * 24 * H,
        name: 'Maya',
        vals: { lessons: 3, checkins: 6, days: 7, rode: 2, level: 9, lname: 'Bright', dk, dl: 0, dc: 1 },
        rt: '18:00',
        sent: now - 2 * H,
      },
      { fid: 'demo-chris', since: now - 3 * 24 * H, name: 'Chris', vals: { lessons: 1, days: 2, level: 3, lname: 'Spark' }, rt: null },
    ],
  };
}
const view = () => {
  const w = world || (world = fresh());
  return JSON.parse(JSON.stringify(w)) as Record<string, unknown>;
};

/** the demo's answer to a Friends call, shaped like the server's */
export async function demoApi(method: 'GET' | 'POST', query: string, body?: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
  const w = world || (world = fresh());
  const q = new URLSearchParams(query.replace(/^\?/, ''));
  const b = (body || {}) as Record<string, unknown>;
  const what = q.get('friends');
  const ok = (x: Record<string, unknown>) => ({ status: 200, body: x });
  if (method === 'GET' && what === '1') return ok(view());
  if (method === 'GET' && what === 'look')
    return normCode(q.get('code')) ? ok({ name: 'Riley' }) : { status: 404, body: { error: 'That code does not work.' } };
  const fid = String(b.fid || '');
  switch (what) {
    case 'card': {
      const c = (b.card || {}) as { name?: string; on?: typeof SHARE_DEFAULT; rt?: string | null };
      w.me = { name: String(c.name || 'You'), on: { ...(c.on || {}) }, rt: c.rt ?? null };
      return ok(view());
    }
    case 'invite':
      w.invite = { code: 'K7QM2P', exp: Date.now() + 7 * 24 * H };
      return ok({ ...w.invite });
    case 'accept':
      if (!w.friends.some((f) => f.fid === 'demo-riley'))
        w.friends.push({
          fid: 'demo-riley',
          since: Date.now(),
          name: 'Riley',
          vals: { lessons: 2, checkins: 2, days: 3, level: 4, lname: 'Ember' },
          rt: '21:00',
        });
      return ok({ fid: 'demo-riley', name: 'Riley' });
    case 'cheer': {
      const f = w.friends.find((x) => x.fid === fid);
      if (!f) return { status: 404, body: { error: 'That friend is not here any more.' } };
      f.sent = Date.now();
      return ok({ at: f.sent });
    }
    case 'remove':
    case 'block':
      w.friends = w.friends.filter((x) => x.fid !== fid);
      return ok({ ok: true });
    case 'leave':
      w.me = null;
      w.invite = null;
      w.friends = [];
      return ok({ ok: true });
  }
  return { status: 400, body: { error: 'Not a Friends action.' } };
}
