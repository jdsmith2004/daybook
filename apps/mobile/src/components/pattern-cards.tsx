/* The Pattern cards, built in one place so the Pattern page and the Sunday review show the very same graphs (the owner,
   November 15, 2026: "we should just pull it straight from the graphs page and walk them through their graphs"). Each card has
   its title, its answer in a few big words, a plain line, its chart, and the numbers behind it. A range of '7' with an end day
   reads the seven days that end on it (the Sunday review's week); without one, the days up to today. */
import {
  computeMetrics,
  FEELS_MIN,
  fmtDate,
  fmtHour,
  myNumbers,
  DOING_MIN,
  patDoing,
  patFeels,
  patFeelSlip,
  patFelt,
  patGaps,
  patInsights,
  patLeads,
  patNeeds,
  patNowLine,
  patPeriod,
  patRideCols,
  patRidge,
  gameCompute,
  patRideSay,
  patRideOut,
  patSlipTrig,
  patTriggerLines,
  patTriggers,
  patWeeks,
  patWhen,
  plural,
  talkEvidence,
  talkNeedWord,
  urWorks,
  type DayFeelStep,
  type DayKey,
  type PatRange,
} from '@daybook/core';
import { useMemo } from 'react';
import { View } from 'react-native';

import { NumbersTable } from '@/components/charts';
import { Link } from '@/components/choices';
import { DAY_FEEL_LOOK } from '@/components/day-feel-pop';
import {
  CARD_SKY,
  DayFlow,
  DaySky,
  FeelField,
  FlameCounts,
  Ghost,
  Hillside,
  HoursKey,
  Mosaic,
  Moons,
  Pairs,
  Room,
  WeekRow,
  type Rank,
} from '@/components/pattern-charts';
import { Say, type DeckCard } from '@/components/pattern-deck';
import { T } from '@/components/ui';
import { connectHealth, healthOffered, useNights } from '@/lib/health';
import { useStore } from '@/lib/store';
import { palettes } from '@/lib/theme';

const fmtD = (k: string) => fmtDate(k, { weekday: 'short', month: 'short', day: 'numeric' });
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
/* how tall the days of the week stand under the hours */
const WEEK_ROW = 64;

export function usePatternCards(range: PatRange, end?: DayKey) {
  const { snap, tk: today, now, say } = useStore();
  const tk = end && end < today ? end : today;
  const st = snap.settings!;
  /* nights from Apple Health, once connected: sleep on the hard-days card then reads every known day, not only check-ins */
  const health = useNights();
  const per = useMemo(() => patPeriod(range, snap.days, st, tk), [range, snap.days, st, tk]);
  const allPer = useMemo(() => patPeriod('all', snap.days, st, tk), [snap.days, st, tk]);
  const keys = per.keys;
  const felt = useMemo(() => patFelt(snap.days, per, tk), [snap.days, per, tk]);
  const feels = useMemo(() => patFeels(snap.journal, snap.days, per, tk), [snap.journal, snap.days, per, tk]);
  /* whether a card is there at all goes by the whole log, so a quiet week does not make the cards jump */
  /* one color is not a picture of how days felt: the bands wait for two different answers (the owner, November 3, 2026) */
  const kinds = (by: number[]) => by.filter(Boolean).length;
  const feltAll = useMemo(() => kinds(patFelt(snap.days, allPer, tk).by) >= 2, [snap.days, allPer, tk]);
  const namedAll = useMemo(() => patFeels(snap.journal, snap.days, allPer, tk).n, [snap.journal, snap.days, allPer, tk]);
  /* the feelings before a slip against days it held: slips are few, so the whole log, whatever the range */
  const feelSlip = useMemo(() => patFeelSlip(snap.journal, snap.days, tk), [snap.journal, snap.days, tk]);
  const g = patGaps(snap.days, st, tk);
  const lastSlip = Object.keys(snap.days)
    .filter((k) => k <= tk && (snap.days[k]?.events || []).some((e) => e.outcome === 'slipped'))
    .sort()
    .pop();
  const weeks = patWeeks(snap.days, keys, range === 'all' ? 26 : 13);
  const ride = patRideOut(weeks);
  const rideCols = patRideCols(snap.days, keys, tk);
  const when = patWhen(snap.days, st, keys, tk);
  const trig = patTriggers(snap.days, st, keys, tk);
  /* what came before the last slips, once it is a real pattern (the last six slips, whatever the range) */
  const slipTrig = patSlipTrig(snap.days, st, tk);
  const needs = patNeeds(snap.days, keys);
  /* slip days are few, so this one reads the whole log whatever the range */
  const leads = patLeads(snap.days, allPer.keys, health.on ? { nights: health.nights, st, tk } : null);
  const ins = patInsights(g, ride, when, trig.list);
  /* someone who has logged but not enough yet is told it is coming, not asked to start */
  const logged = keys.some((k) => (snap.days[k]?.events || []).length > 0);
  const works = urWorks(snap.days, tk);
  const ev = talkEvidence(snap.days);
  const nums = myNumbers(snap.days, st, tk, now);
  const whenAll = patWhen(snap.days, st, allPer.keys, tk);
  const anyEntry = whenAll.week.some((d) => d.rode + d.slipped);
  const trigAll = patTriggers(snap.days, st, allPer.keys, tk).list.length > 0;
  const needsAll = patNeeds(snap.days, allPer.keys).length > 0;
  const hard = when.hard.weekdays || when.hard.weekends;
  const doing = patDoing(snap.days, per, st);
  /* the same longest run as My numbers, lower on this page */
  const longest = computeMetrics(snap.days, st, tk).longest;
  const rideSay = patRideSay(ride, rideCols);
  /* the cards are night in either theme, so the shapes take their night colors */
  const look = (n: DayFeelStep) => ({ kind: DAY_FEEL_LOOK[n].kind, color: DAY_FEEL_LOOK[n].tone(palettes.dark)[0] });
  const needLine =
    needs[0] && needs[0].count >= 3
      ? 'When you talked it through, the pull was mostly after ' + talkNeedWord(needs[0].n) + ': ' + plural(needs[0].count, 'time') + '.'
      : '';
  const topTrig = trig.list.slice(0, 6);
  const trigLine = slipTrig ? slipTrig.line : patTriggerLines(trig.list, null)[0] || '';
  const trigItems: Rank[] = trig.list.length
    ? topTrig.map((r) => ({
        label: r.t,
        n: r.rode + r.slipped,
        note: r.rode + ' of ' + (r.rode + r.slipped) + ' ridden out',
        short: r.rode + ' of ' + (r.rode + r.slipped),
      }))
    : needs.map((x) => ({ label: x.name, n: x.count, note: plural(x.count, 'time'), short: plural(x.count, 'time') }));
  /* the answer that differs most leads the card on hard days */
  const widest = leads.list
    .slice()
    .sort((a, b) => Math.abs(b.clean - b.slip) / (Math.max(b.clean, b.slip) || 1) - Math.abs(a.clean - a.slip) / (Math.max(a.clean, a.slip) || 1))[0];
  const ridge = patRidge(snap.days, per, st);
  const level = Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n);

  const cards: DeckCard[] = [];
  /* a card the whole log has nothing for yet: its own shape, empty */
  const empty = (id: string) => <Room>{(w, h) => <Ghost id={id} w={w} h={h} />}</Room>;
  const ghost = (id: string, title: string) => cards.push({ id, title, ghost: true, chart: empty(id) });
  /* the first card, for the question this page is here to answer. It stays after a slip: one slip is a flat step, which is worth seeing then */
  if (allPer.keys.length >= DOING_MIN)
    cards.push({
      id: 'apart',
      title: 'How you are doing',
      head: doing.head,
      say: <Say>{doing.line}</Say>,
      chart: (
        <Room>
          {(w, h) => (
            <Hillside
              note={g.slips ? patNowLine(g, tk, lastSlip || null) + (longest >= 2 ? ' Longest run: ' + longest + ' days.' : '') : undefined}
              ridge={ridge}
              than={doing.than}
              first={doing.first}
              level={level}
              sky={CARD_SKY.apart[1]}
              w={w}
              h={h}
              label={doing.head + '. ' + doing.line}
            />
          )}
        </Room>
      ),
      numbers: g.slips ? (
        <NumbersTable
          cap="No-slip days before each slip"
          head={['Slip', 'No-slip days before']}
          rows={g.runs.map((r, i) => [String(i + 1), String(r)]).reverse()}
        />
      ) : null,
    });
  else ghost('apart', 'How you are doing');
  if (feltAll)
    cards.push({
      id: 'felt',
      title: 'How your days felt',
      head: felt.head,
      say: felt.line ? <Say>{felt.line}</Say> : null,
      chart:
        kinds(felt.by) >= 2 ? (
          <Room>
            {(w, h) => (
              <DayFlow
                flow={felt.flow}
                by={felt.by}
                first={felt.flowFrom || doing.first}
                sky={CARD_SKY.felt[1]}
                w={w}
                h={h}
                look={look}
                label={felt.head + '. ' + felt.line}
              />
            )}
          </Room>
        ) : (
          empty('felt')
        ),
      numbers: (
        <NumbersTable
          cap="How the days felt"
          head={['From', 'Good or great', 'Okay', 'Low or rough']}
          rows={felt.cols.map((x) => [fmtD(x.from), String(x.steps[3] + x.steps[4]), String(x.steps[2]), String(x.steps[0] + x.steps[1])]).reverse()}
        />
      ),
    });
  else ghost('felt', 'How your days felt');
  if (anyEntry)
    cards.push({
      id: 'ride',
      title: 'Riding it out',
      head: rideSay.head,
      say: rideSay.line ? <Say>{rideSay.line}</Say> : null,
      chart: <Room>{(w, h) => <FlameCounts cols={rideCols} level={level} w={w} h={h} label={rideSay.head + '. ' + rideSay.line} />}</Room>,
      numbers: (
        <NumbersTable
          cap="Entries"
          head={['From', 'Rode it out', 'Slipped']}
          rows={rideCols.map((w) => [fmtD(w.from), String(w.rode), String(w.slipped)]).reverse()}
        />
      ),
    });
  else ghost('ride', 'Riding it out');
  if (namedAll >= FEELS_MIN)
    cards.push({
      id: 'named',
      title: 'What you have felt',
      head: feels.n ? feels.head : 'Nothing named',
      say:
        feels.line || feels.fresh || feelSlip ? (
          <>
            {feels.line || feels.fresh ? (
              <Say>
                {feels.line}
                {feels.line && feels.fresh ? ' ' : ''}
                {feels.fresh}
              </Say>
            ) : null}
            {feelSlip ? <Say>{feelSlip.line}</Say> : null}
          </>
        ) : null,
      chart: <Room>{(w, h) => <FeelField words={feels.words} w={w} h={h} label={feels.head + '. ' + feels.line} />}</Room>,
      foot:
        feels.kinds >= 3 ? (
          <T v="small" tone="muted">
            {feels.kinds} different words named so far.
          </T>
        ) : null,
      numbers:
        feels.n || feelSlip ? (
          <>
            {feels.n ? <NumbersTable cap="What you named" head={['Feeling', 'Times']} rows={feels.words.map((x) => [x.w, String(x.n)])} /> : null}
            {feelSlip ? (
              <NumbersTable
                cap={'Before a slip, from ' + plural(feelSlip.slipN, 'feeling') + ', and on days it held, from ' + feelSlip.heldN}
                head={['Feeling', 'Before a slip', 'Days it held']}
                rows={feelSlip.before.map((x) => [x.w, String(x.slip), String(x.held)])}
              />
            ) : null}
          </>
        ) : null,
    });
  else ghost('named', 'What you have felt');
  if (whenAll.timed)
    cards.push({
      id: 'when',
      title: 'When does it happen?',
      head: hard
        ? (when.hard.same || !when.hard.weekends ? '' : when.hard.weekdays ? 'Weekdays ' : 'Weekends ') + hard.label
        : when.timed
          ? 'No hard hours yet'
          : 'No times logged',
      say: (
        <>
          {hard ? <Say>{hard.line}</Say> : null}
          {when.hard.weekdays && when.hard.weekends ? (
            <Say>
              Weekends: {when.hard.weekends.label}. {when.hard.weekends.line}
            </Say>
          ) : null}
          {when.day ? (
            <Say>
              {when.day.name}s are the hardest: {when.day.n} of {when.day.slips ? plural(when.day.of, 'slip') : when.day.of + ' entries'}.
            </Say>
          ) : null}
        </>
      ),
      chart: when.timed ? (
        <Room min={when.day ? 240 : 180}>
          {(w, h) => (
            <View style={{ gap: 12 }}>
              <DaySky hours={when.hours} hard={when.hard} w={w} h={h - (when.day ? WEEK_ROW + 12 : 0)} sky={CARD_SKY.when[0]} />
              {when.day ? (
                <View style={{ paddingHorizontal: 16 }}>
                  <WeekRow week={WEEK_ORDER.map((d) => when.week[d])} on={when.day.d} H={WEEK_ROW - 20} />
                </View>
              ) : null}
            </View>
          )}
        </Room>
      ) : (
        empty('when')
      ),
      foot: when.timed ? <HoursKey /> : null,
      numbers: (
        <NumbersTable
          cap="Entries by hour"
          head={['Hour', 'Rode it out', 'Slipped']}
          rows={when.hours.filter((b) => b.rode + b.slipped).map((b) => [fmtHour(b.h) + ' to ' + fmtHour((b.h + 1) % 24), String(b.rode), String(b.slipped)])}
        />
      ),
    });
  else ghost('when', 'When does it happen?');
  if (trigAll || needsAll)
    cards.push({
      id: 'what',
      title: 'What sets it off?',
      head: topTrig[0]?.t || needs[0]?.name || (trig.none ? 'No reason picked' : 'A quiet stretch'),
      say:
        trigLine || needLine || !trig.none ? (
          <>
            {(trigLine || needLine ? [trigLine, needLine] : ['No hard moments logged in these days.']).filter(Boolean).map((l) => (
              <Say key={l}>{l}</Say>
            ))}
          </>
        ) : null,
      chart: trigItems.length ? <Room>{(w, h) => <Mosaic items={trigItems} tone="warm" w={w} h={h} />}</Room> : empty('what'),
      foot: trig.none ? (
        <T v="small" tone="muted">
          {trig.none === 1 ? '1 entry' : trig.none + ' entries'} had no reason picked.
        </T>
      ) : null,
      numbers: (
        <NumbersTable
          cap="Entries by what set them off"
          head={['Reason', 'Rode it out', 'Slipped']}
          rows={trig.list.map((r) => [r.t, String(r.rode), String(r.slipped)])}
        />
      ),
    });
  else ghost('what', 'What sets it off?');
  /* sleep is drawn as two moons; what else differs stands beside it as pairs */
  const sleepLead = leads.list.find((d) => d.k === 'h');
  const otherLeads = leads.list.filter((d) => d.k !== 'h');
  /* the one ask for Apple Health: on this card, where sleep is read, on an iPhone, until it is connected */
  const healthAsk =
    healthOffered() && health.ready && !health.on ? (
      <Link
        label="Add your nights from Apple Health"
        onPress={async () => {
          if (!(await connectHealth(st.rollover))) say('Apple Health did not open. Try again in a moment.');
        }}
      />
    ) : null;
  if (leads.list.length)
    cards.push({
      id: 'days',
      title: 'What is different on hard days?',
      head: widest?.label,
      say: widest ? <Say>{widest.line}</Say> : null,
      chart: (
        <Room>
          {(w, h) =>
            sleepLead && otherLeads.length ? (
              <View>
                <Moons d={sleepLead} w={w} h={Math.round(h * 0.55)} />
                <Pairs list={otherLeads} w={w} h={h - Math.round(h * 0.55)} />
              </View>
            ) : sleepLead ? (
              <Moons d={sleepLead} w={w} h={h} />
            ) : (
              <Pairs list={leads.list} w={w} h={h} />
            )
          }
        </Room>
      ),
      foot: healthAsk || (
        <T v="small" tone="muted">
          {leads.sleep && sleepLead
            ? 'Your whole log: ' + plural(leads.sleep.cleanN, 'night') + ' before days with no slip, ' + leads.sleep.slipN + ' before slip days.'
            : 'Your whole log: ' + plural(leads.cleanN, 'check-in day') + ' with no slip and ' + leads.slipN + ' with one.'}
        </T>
      ),
    });
  else if (healthAsk) cards.push({ id: 'days', title: 'What is different on hard days?', ghost: true, chart: empty('days'), foot: healthAsk });
  else ghost('days', 'What is different on hard days?');
  if (works.length || ev.chose + ev.went)
    cards.push({
      id: 'helps',
      title: 'What helps you',
      head: works[0]?.name,
      say: ev.chose ? (
        <Say>
          You talked it through and chose something else {plural(ev.chose, 'time')} out of {ev.chose + ev.went}.
        </Say>
      ) : null,
      chart: works.length ? (
        <Room>
          {(w, h) => (
            <Mosaic
              items={works.slice(0, 6).map((x) => ({
                label: x.name,
                n: x.passed + x.not,
                note: x.passed + ' of ' + (x.passed + x.not) + ' it passed',
                short: x.passed + ' of ' + (x.passed + x.not),
              }))}
              tone="cool"
              w={w}
              h={h}
            />
          )}
        </Room>
      ) : (
        empty('helps')
      ),
      foot: works.length ? (
        <T v="small" tone="muted">
          SOS tools over the last four months. SOS uses this to choose what to suggest.
        </T>
      ) : null,
    });
  else ghost('helps', 'What helps you');
  return { cards, keys, ins, logged, nums, when, trig: trig.list, works, rideCols };
}
