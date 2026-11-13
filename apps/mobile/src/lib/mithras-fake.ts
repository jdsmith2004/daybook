/* A made-up Mithras for QA builds only (EXPO_PUBLIC_MITHRAS_FAKE=1, lib/mithras.ts): it answers the way Mithras's Supabase answers, from
   rows made here, so the import can be walked on the web and the simulator without touching a real Mithras account. Any email with the
   password "test" signs in, and so does Apple. A store build never sets the switch. */
import { MITHRAS_FEEL } from '@daybook/core';

const ME = '11111111-2222-4333-8444-555555555555';
const day = (k: string, n: number) => {
  const d = new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)) + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const LINES = [
  'Hard night. I put the phone in the kitchen and read instead.',
  'Felt the pull after work. Went for a walk and it passed.',
  'Talked to my brother today. Lighter than I have felt in weeks.',
  'Slipped. I am not starting over, I am starting from here.',
  'Day went well. Gym in the morning, bed on time.',
  'Bored and scrolling again. Noticed it, and stopped.',
];
function rows() {
  const ids = Object.keys(MITHRAS_FEEL);
  const journals = Array.from({ length: 240 }, (_, i) => {
    const k = day('2026-03-01', Math.floor(i * 0.95));
    return {
      id: 'f00d' + String(i).padStart(4, '0') + '-0000-4000-8000-' + String(i * 7919).padStart(12, '0'),
      user_id: ME,
      created_at: new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)), 21, i % 60).toISOString(),
      title: i % 3 ? null : 'Night ' + (i + 1),
      content: LINES[i % LINES.length],
      emotions: [{ id: ids[(i * 37) % ids.length] }, { id: ids[(i * 11) % ids.length] }],
      reflection_data: i % 4 ? {} : { location: 'Home', activity: 'Scrolling', people: 'Alone' },
      is_deleted: i === 5,
    };
  });
  const wins: string[] = [];
  for (let i = 0; i < 230; i++) wins.push(day('2026-03-01', i));
  const set = new Set(['2026-03-10', '2026-03-25', '2026-05-02', '2026-07-19']);
  const streak = {
    user_id: ME,
    streak_days: [...wins.filter((k) => !set.has(k)), ...[...set].map((k) => String(Number(k.slice(0, 4)) - 100) + k.slice(4))],
    longest_streak: 78,
    current_streak: 4,
  };
  return { journals, streaks: [streak], user_profiles: [{ user_id: ME, usage_pattern: 'weekly', addiction_type: 'porn' }] };
}

export async function fakeMithrasFetch(url: string, init: { method: string; headers: Record<string, string>; body?: string }) {
  await new Promise((r) => setTimeout(r, 700));
  const res = (j: unknown, status = 200) => ({ ok: status < 300, status, text: async () => JSON.stringify(j) });
  const u = new URL(url);
  if (u.pathname === '/auth/v1/token') {
    const b = JSON.parse(init.body || '{}');
    if (u.searchParams.get('grant_type') === 'password' && b.password !== 'test') return res({ error: 'invalid_grant' }, 400);
    return res({ access_token: 'fake', user: { id: ME } });
  }
  if (u.pathname === '/auth/v1/logout') return res({}, 204);
  const all = rows() as Record<string, { user_id: string; is_deleted?: boolean }[]>;
  let out = all[u.pathname.replace('/rest/v1/', '')] || [];
  if (u.searchParams.get('is_deleted') === 'eq.false') out = out.filter((r) => !r.is_deleted);
  const off = Number(u.searchParams.get('offset') || 0);
  return res(out.slice(off, off + Number(u.searchParams.get('limit') || 1000)));
}
