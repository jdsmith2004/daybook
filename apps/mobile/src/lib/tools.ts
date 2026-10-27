/* Finishing a tool (legacy finishTool): it counts as a calm move on today's log, and the tool is remembered as tried.
   Started from SOS, it goes back to SOS, which asks "How is it now?" (step 'after', app/sos.tsx), or on to Go to bed, the
   second half of a "then bed" pair. On its own, it closes with a short word and the points it earned. */
import { blankP, changeDay, gameCompute, withDay } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';

import { buzz } from '@/lib/feel';
import { count } from '@/lib/pulse';
import { close } from '@/lib/nav';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

/** lr: the tool was opened from a lesson's practice step, so finishing goes back to the lesson */
export function useFinishTool(lr = false) {
  const { tk, update, say } = useStore();
  const sos = useSos();
  return (id: string, o: { msg?: string; reach?: boolean; noCalm?: boolean } = {}) => {
    let before = 0;
    let after = 0;
    update((s) => {
      if (!s.settings) return s;
      before = gameCompute(s.days, s.settings, s.reviews, tk).pts;
      const day = changeDay(s.days[tk], tk, (d) => {
        const p = d.p || blankP();
        if (!o.noCalm) p.c = Math.min(50, p.c + 1);
        if (p.tl.indexOf(id) < 0) p.tl.push(id);
        if (o.reach) p.r = true;
        d.p = p;
      });
      const next = { ...s, days: withDay(s.days, tk, day) };
      after = gameCompute(next.days, next.settings!, next.reviews, tk).pts;
      return next;
    });
    buzz('save');
    count('tool_' + id);
    const gain = after - before;
    if (sos.ur) {
      const ur = sos.ur;
      if (sos.combo === 'bed' && id !== 'bed') {
        sos.set({ ...ur, used: ur.used.concat(id), comboFrom: id });
        sos.setCombo(null);
        router.replace({ pathname: '/tool/[id]', params: { id: 'bed', combo: '1' } });
        return;
      }
      sos.set({ ...ur, step: 'after', used: ur.used.concat(id) });
      router.back();
      return;
    }
    if (lr) {
      router.back();
      say(gain > 0 ? o.msg || 'Nice work.' : o.msg || 'Done.');
      return;
    }
    close();
    say(gain > 0 ? o.msg || 'Nice work.' : o.msg || 'Done.');
  };
}

/** a tool handing on to another: the new one keeps the way back, so one opened from a lesson still returns to the lesson */
export function useNextTool() {
  const { lr } = useLocalSearchParams<{ lr?: string }>();
  return (id: string) => router.replace({ pathname: '/tool/[id]', params: lr === '1' ? { id, lr: '1' } : { id } });
}

/** the X on a tool: back to SOS's tool list when SOS started it (step 'tools': SOS opens the list, to pick another),
    otherwise close */
export function useToolExit(lr = false) {
  const sos = useSos();
  return () => {
    if (lr) router.back();
    else if (sos.ur) {
      sos.setCombo(null);
      sos.set({ ...sos.ur, step: 'tools' });
      router.back();
    } else close();
  };
}
