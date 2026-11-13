/* Good night: the phone goes to bed (docs/review-plan.md C3 and WP5, mockup docs/review/m2-good-night.png; core two-moments.ts). The day's
   second moment, one page: "Phone to bed.", the person's own flame big and sleepy in the night sky, by choice one row to text their
   one person good night (lib/person.ts), and one button low by the thumb. Good night, in one tap:

   - puts the phone to bed (core phoneAway, through useGoodnight): the time is kept, and it is the wind-down and screens off on time;
   - arms the night at once when Screen Time is set up (lib/pull.ts pullArmNight, WP2): the adult-site filter, from now until 6 AM,
     whatever time was set. "Adult sites wait until 6:00 AM" shows only once Screen Time says it is on;
   - and the flame falls asleep, with "9 nights put to bed. This is the part that lasts."

   Reached from Today's night card, the day line's Good night, SOS's "Go to bed" (with the plan it picked), the Bed tool and /wind,
   which leads here. Opened again the same night, the flame is already asleep. Too early in the day it says when it opens. */
import {
  bedNights,
  bedRow,
  clockOf,
  gameCompute,
  rhythm,
  goodNightFaith,
  goodNightRow,
  goodNightWords,
  goodnightOpens,
  nightWaitLine,
  PULL_NIGHT_END,
} from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { NightPage, NightRow, useGoodnight, type Bed } from '@/components/goodnight';
import * as pull from '@/lib/pull';
import { textGoodNight, useGoodNightPerson } from '@/lib/person';
import { useStore } from '@/lib/store';
import { useAccount } from '@/lib/sync';

/* Screen Time's "the night starts now" (WP2, claude/night-wait-iphone-3d3d23, lib/pull.ts pullArmNight). Read off the module by name, so
   this builds on main before WP2 lands and calls it once it is there; whoever merges second may swap this for a plain import.
   true means adult sites wait now (the filter is on); the feeds' short wait already runs all day. */
type ArmNight = (days: unknown, st: unknown, account?: boolean) => Promise<boolean>;
const armNight = (pull as unknown as { pullArmNight?: ArmNight }).pullArmNight;

/* The moment the flame settles down to sleep belongs to WP8's celebrations (components/bed-moment.tsx, BedMoment, not built yet): the
   phone goes down, the flame dims into its asleep face, tonight's mark pops. Until it lands, this stand-in with the same props shows
   the page's own falling asleep (its children); on the rebase onto WP8 it is swapped for the import. */
type BedMomentProps = { level: number; nights: number; row: ReturnType<typeof bedRow>; line: string; onDone: () => void };
function BedMoment({ children }: BedMomentProps & { children: ReactNode }) {
  return <>{children}</>;
}

export default function Night() {
  /* from SOS "Go to bed" (components/tools/scene.tsx), which has already put the phone to bed: at and gain say what it did */
  const { plan, at, gain } = useLocalSearchParams<{ plan?: string; at?: string; gain?: string }>();
  const { snap, tk, now } = useStore();
  const account = useAccount();
  const goodnight = useGoodnight();
  const gp = useGoodNightPerson();
  const person = gp && gp.on ? gp : null;
  const [bed, setBed] = useState<Bed | null>(null);
  const [armed, setArmed] = useState(false);
  const st = snap.settings;
  const arm = () => {
    if (st && pull.pullOffered && armNight)
      armNight(snap.days, st, !!account)
        .then((on) => setArmed(on))
        .catch(() => undefined);
  };
  /* SOS's Go to bed put the phone to bed already: the night is armed as it opens, once */
  const fromBed = useRef(!!at);
  useEffect(() => {
    if (!fromBed.current) return;
    fromBed.current = false;
    arm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!st) return <Redirect href="/" />;
  const p = snap.days[tk]?.p;
  const checkin = rhythm(snap.days, st, tk, now).stops.some((x) => x.k === 'evening' && !x.done);
  /* opened again later the same night: the phone is already in bed, so the flame is asleep */
  const held: Bed | null = bed || (p && p.po ? { at: p.po, gain: at ? Number(gain) || 0 : 0, hush: false, msg: '' } : null);
  const say = goodNightWords({ days: snap.days, st, tk, faith: goodNightFaith(st) });
  const go = () => {
    setBed(goodnight(null));
    arm();
  };
  const page = (
    <NightPage
      bed={held}
      say={say}
      after={armed ? nightWaitLine(PULL_NIGHT_END) : null}
      plan={plan || undefined}
      opens={goodnightOpens(st, clockOf(now))}
      onGoodnight={go}
      rowAbove={
        <>
          {/* for people who keep the evening check-in (a switch in Daily routine): one tap to it first */}
          {checkin ? (
            <NightRow icon="pencil" title="Check in first?" sub="Three quick numbers, then Good night" onPress={() => router.replace('/checkin')} />
          ) : null}
          {person ? <NightRow icon="chat" title={goodNightRow(person.name)} onPress={() => textGoodNight(person)} /> : null}
        </>
      }
    />
  );
  /* just put to bed here: the bed moment (WP8) */
  if (!bed) return page;
  return (
    <BedMoment
      level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)}
      nights={bedNights(snap.days)}
      row={bedRow(snap.days, tk)}
      line={say.doneSub}
      onDone={() => router.back()}>
      {page}
    </BedMoment>
  );
}
