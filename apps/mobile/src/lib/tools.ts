/* Finishing a tool (legacy finishTool): it counts as a calm move on today's log, and the tool is remembered as tried.
   Started from SOS, it goes on to "How is it now?" (or to Go to bed, the second half of a "then bed" pair). On its own,
   it closes with a short word and the points it earned. */
import { blankP, changeDay, gameCompute, withDay } from '@daybook/core';
import { router } from 'expo-router';

import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useSos } from '@/lib/sos';
import { useStore } from '@/lib/store';

export function useFinishTool() {
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
    const gain = after - before;
    if (sos.ur) {
      const ur = sos.ur;
      if (sos.combo === 'bed' && id !== 'bed') {
        sos.set({ ...ur, used: ur.used.concat(id), comboFrom: id });
        sos.setCombo(null);
        router.replace({ pathname: '/tool/[id]', params: { id: 'bed', combo: '1' } });
        return;
      }
      sos.set({ ...ur, step: 'after', used: ur.used.concat(id), roundDone: false });
      router.back();
      return;
    }
    close();
    say(gain > 0 ? '+' + gain + ' points. ' + (o.msg || 'Nice work.') : o.msg || 'Done.');
  };
}

/** the X on a tool: back to SOS when SOS started it, otherwise close */
export function useToolExit() {
  const sos = useSos();
  return () => {
    if (sos.ur) {
      sos.setCombo(null);
      sos.set({ ...sos.ur, step: 'now' });
      router.back();
    } else close();
  };
}
