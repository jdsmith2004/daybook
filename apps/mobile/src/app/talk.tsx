/* Talk it through: for when a slip feels planned, owed, certain, or you have stopped caring (core: talk.ts, with the
   research). One question at a time:
   - who it is for, then "Which ones sound like you?"
   - what your mind is doing: a short card with a moving picture and its source for each one picked (a single line for
     cards already read), ending with curiosity over shame
   - what the part of you that wants it is after, how much you want tonight to go differently, said back without judging
   - three honest paths: change the plan, wait and decide later, or go ahead with eyes open (notice the body, say what
     you expect it to give, come back afterwards)
   Two more ways in: ?decide=<id> (a "decide later" time has come: the paths again) and ?look=<id> (looking back: did
   it hold, or how was it really, with your own numbers over time). Going ahead goes in the log as an honest slip. */
import {
  gameCompute,
  lookBack,
  newTalk,
  saveTalk,
  TALK_AFTER_FEEL,
  TALK_COST,
  TALK_FEEL,
  TALK_FOR,
  TALK_MOVES,
  TALK_NEEDS,
  TALK_OWN_LEN,
  TALK_PATHS,
  TALK_SIGNS,
  TALK_SRC,
  TALK_WAITS,
  TALK_WHERE,
  talkById,
  talkCard,
  talkCards,
  talkClock,
  talkEvidence,
  talkEvidenceLine,
  talkMomentsNow,
  talkMomentTime,
  talkMoveWords,
  talkMoves,
  talkNeedWord,
  talkPlanLine,
  talkReflect,
  talkTypedWhys,
  talkWaitTime,
  talkWhys,
  type Talk,
  type TalkArt,
  type TalkCard,
  type TalkMove,
  type TalkNeed,
  type TalkPath,
  type TalkSign,
} from '@daybook/core';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Answer, AnswerChip, ChipWrap } from '@/components/answer';
import { Appear } from '@/components/appear';
import { CountUp } from '@/components/count-up';
import { OwnChip, OwnField } from '@/components/own';
import { KnownLine, Sources } from '@/components/research';
import { Dock, Finish, SceneFrame } from '@/components/scene';
import { Slider, SliderValue } from '@/components/slider';
import { TalkArtView } from '@/components/talk-art';
import { Button, Chip, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { remindersOffered, scheduleTalk } from '@/lib/reminders';
import { useSos } from '@/lib/sos';
import { play } from '@/lib/sound';
import { useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';

type Step =
  | 'for'
  | 'signs'
  | 'known'
  | 'mind'
  | 'need'
  | 'want'
  | 'why'
  | 'path'
  | 'cMoves'
  | 'cWhen'
  | 'wWhen'
  | 'wUntil'
  | 'oLiking'
  | 'oBody'
  | 'oExpect'
  | 'oReady'
  | 'done'
  | 'lWent'
  | 'lFeel'
  | 'lGave'
  | 'lCost'
  | 'lEnd';

const NEED_TONE: Record<TalkNeed, string> = { relief: 'sky', reward: 'sun', escape: 'coral', rest: 'violet', close: 'mint', bored: 'accent' };
const PATH_TONE: Record<TalkPath, string> = { change: 'mint', wait: 'sun', open: 'violet' };
const MOVE_IC: Record<TalkMove, string> = {
  walk: 'bolt',
  shower: 'wind',
  breathe: 'wind',
  write: 'pencil',
  treat: 'star',
  laugh: 'chat',
  name: 'pencil',
  text: 'chat',
  people: 'heart',
  show: 'play',
  bed: 'moon',
  nap: 'moon',
  call: 'phone',
  fill: 'dice',
  out: 'compass',
  hands: 'sparkle',
  away: 'phone',
  block: 'shield',
};

export default function TalkIt() {
  const c = useTheme();
  const { snap, tk, update, say } = useStore();
  const sos = useSos();
  const st = snap.settings;
  const params = useLocalSearchParams<{ decide?: string; look?: string }>();
  const [now] = useState(() => Date.now());
  /* a talk-through already saved, when this opened to decide or to look back */
  const [found] = useState(() => {
    const id = params.look || params.decide;
    return id ? talkById(snap.days, id) : null;
  });
  const look = !!params.look && !!found && !found.talk.a;
  const decide = !!params.decide && !!found && !found.talk.a;
  /* deciding starts the paths fresh; looking back keeps what was chosen */
  const [talk, setTalk] = useState<Talk>(() => (found ? (params.decide ? { ...found.talk, p: null, m: [], mo: null, at: null } : found.talk) : newTalk(now)));
  const day = found ? found.k : tk;
  const [step, setStep] = useState<Step>(look ? 'lWent' : decide ? 'path' : 'for');
  const [hist, setHist] = useState<Step[]>([]);
  const [dir, setDir] = useState(1);
  const [ci, setCi] = useState(0);
  const [remind, setRemind] = useState(remindersOffered);
  const [reminded, setReminded] = useState(false);
  const [after, setAfter] = useState<{ went: boolean; f: string[]; g: number | null; c: string[]; fx: string[]; cx: string[] }>({
    went: false,
    f: [],
    g: null,
    c: [],
    fx: [],
    cx: [],
  });
  /* the step where an answer in the person's own words is being typed */
  const [own, setOwn] = useState<Step | null>(null);
  const [pts0] = useState(() => (st ? gameCompute(snap.days, st, snap.reviews, tk).pts : 0));
  const seen = Array.isArray(sos.mem.talkSeen) ? (sos.mem.talkSeen as string[]) : [];
  const [seen0] = useState(seen);
  /* a card is "read" once it has been shown */
  const markSeen = (k: TalkArt) => {
    if (seen.indexOf(k) < 0) sos.setMem((m) => ({ ...m, talkSeen: (Array.isArray(m.talkSeen) ? (m.talkSeen as string[]) : []).concat(k) }));
  };
  const cards = talkCards(talk.s);
  const fresh = cards.filter((x) => seen0.indexOf(x.k) < 0);
  const known = cards.filter((x) => seen0.indexOf(x.k) >= 0);
  const card: TalkCard | undefined = fresh[ci];
  useEffect(() => {
    if (step === 'mind' && card) markSeen(card.k);
    if (step === 'oLiking') markSeen('liking');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, ci]);

  if (!st) return null;
  const set = (p: Partial<Talk>) => setTalk((t) => ({ ...t, ...p }));
  const go = (next: Step) => {
    setOwn(null);
    setHist((h) => h.concat(step));
    setDir(1);
    setStep(next);
  };
  const back = () => {
    setOwn(null);
    if (step === 'mind' && ci > 0) {
      setDir(-1);
      setCi(ci - 1);
      return;
    }
    const h = hist.slice();
    const p = h.pop();
    if (!p) return;
    setHist(h);
    setDir(-1);
    setStep(p);
    if (p === 'mind') setCi(Math.max(0, fresh.length - 1));
  };
  const toggle = <K extends string>(list: K[], k: K) => (list.indexOf(k) >= 0 ? list.filter((x) => x !== k) : list.concat(k));
  const persist = (t: Talk) => update((s0) => ({ ...s0, days: saveTalk(s0.days, day, t) }));
  const needWord = talkNeedWord(talk.n, talk.nx);
  const mx = talk.mx || [];
  const ownField = (placeholder: string, onSave: (t: string) => void) => (
    <OwnField
      placeholder={placeholder}
      max={TALK_OWN_LEN}
      onSave={(t) => {
        onSave(t);
        setOwn(null);
      }}
      onCancel={() => setOwn(null)}
    />
  );
  const addOwn = (list: string[], t: string) => (list.some((x) => x.toLowerCase() === t.toLowerCase()) ? list : list.concat(t));
  const gain = () => Math.max(0, gameCompute(snap.days, st, snap.reviews, tk).pts - pts0);

  /* finishing a path: saved, a reminder if asked for, then the closing screen */
  const finishPath = (t: Talk) => {
    setTalk(t);
    persist(t);
    const at = t.p === 'open' ? now + 3600000 : t.at;
    if (remind && remindersOffered && at) {
      const body =
        t.p === 'wait' ? 'Time to decide. One minute.' : t.p === 'open' ? 'One minute to look back.' : 'Your plan: ' + talkMoveWords(t).join('. ') + '.';
      scheduleTalk(at, body, '/talk?' + (t.p === 'wait' ? 'decide=' : 'look=') + t.id).then(setReminded);
    }
    if (t.p === 'open') {
      buzz('save');
      close();
      say('Come back after. One minute.');
      return;
    }
    buzz('lit');
    play('chime');
    setHist([]);
    setDir(1);
    setStep('done');
  };
  const finishLook = (a: typeof after) => {
    update((s0) => ({ ...s0, days: lookBack(s0.days, talk.id, a, tk) }));
    buzz(a.went ? 'save' : 'lit');
    if (!a.went) play('chime');
    setHist([]);
    setDir(1);
    setStep('lEnd');
  };

  let body: React.ReactNode;
  let foot: React.ReactNode = null;
  const next = (to: Step, ok = true, label = 'Next') =>
    ok ? (
      <Appear by={10} duration={220}>
        <Button label={label} onPress={() => go(to)} />
      </Appear>
    ) : (
      <View style={s.btnSpace} />
    );

  if (step === 'for') {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          Planning a slip?
        </T>
        <View style={s.middle}>
          <T v="label" style={s.c}>
            This is for when…
          </T>
          {TALK_FOR.map((t, i) => (
            <Appear key={i} delay={120 + i * 90} by={10} style={[s.forRow, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <View style={[s.forIc, { backgroundColor: c.violetSoft }]}>
                <Icon name={['calendar', 'trophy', 'leaf', 'wave'][i]} size={20} color={c.violetText} />
              </View>
              <T style={{ flex: 1 }}>{t}</T>
            </Appear>
          ))}
          <Appear delay={560} by={8}>
            <T style={[s.c, s.warm]}>If that is you right now, you are not broken, and nothing you have built is lost. We can look at it together.</T>
          </Appear>
        </View>
        <Dock>
          <Button label="Talk it through" onPress={() => go('signs')} />
        </Dock>
      </>
    );
  } else if (step === 'signs') {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          Which ones sound like you?
        </T>
        <T style={s.c} tone="muted">
          Pick any. Each one changes what comes next.
        </T>
        <Dock>
          <View style={s.list}>
            {TALK_SIGNS.map(([k, words, ic]) => (
              <Answer
                key={k}
                multi
                icon={ic}
                tone="violet"
                title={words}
                on={talk.s.indexOf(k) >= 0}
                onPress={() => set({ s: toggle(talk.s, k as TalkSign) })}
              />
            ))}
          </View>
          {next(known.length ? 'known' : 'mind', talk.s.length > 0)}
        </Dock>
      </>
    );
  } else if (step === 'known') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          What your mind is doing
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          You know these already
        </T>
        <View style={[s.middle, { gap: 8 }]}>
          {known.map((x, i) => (
            <Appear key={x.k} delay={100 + i * 80} by={8} style={{ alignSelf: 'stretch' }}>
              <KnownLine short={x.short} body={x.body} src={x.src} map={TALK_SRC} art={<TalkArtView k={x.k} />} />
            </Appear>
          ))}
        </View>
        <Dock>{next(fresh.length ? 'mind' : 'need')}</Dock>
      </>
    );
  } else if (step === 'mind' && card) {
    const last = ci >= fresh.length - 1;
    body = (
      <Appear key={card.k} x={36 * dir} by={0} duration={260} style={s.stage}>
        <T v="eyebrow" tone="muted">
          What your mind is doing{fresh.length > 1 ? ' · ' + (ci + 1) + ' of ' + fresh.length : ''}
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {card.title}
        </T>
        <TalkArtView k={card.k} />
        <T style={s.body}>{card.body}</T>
        <Sources keys={card.src} map={TALK_SRC} />
        <Dock>
          <Button
            label="Next"
            onPress={() => {
              if (last) go('need');
              else {
                setDir(1);
                setCi(ci + 1);
              }
            }}
          />
        </Dock>
      </Appear>
    );
  } else if (step === 'need') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Talking it through
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          What is the part of you that wants it really after?
        </T>
        {own === 'need' ? (
          ownField('Like: comfort, or control', (t) => set({ n: null, nx: t }))
        ) : (
          <Dock>
            <View style={s.list}>
              {TALK_NEEDS.map(([k, name, sub, ic]) => (
                <Answer key={k} icon={ic} tone={NEED_TONE[k]} title={name} sub={sub} on={talk.n === k} onPress={() => set({ n: k, nx: undefined })} />
              ))}
              <Answer
                icon="pencil"
                tone="accent"
                title={talk.nx && !talk.n ? talk.nx : 'Something else'}
                sub={talk.nx && !talk.n ? 'In your own words. Tap to change it.' : 'Say it in your own words'}
                on={!!talk.nx && !talk.n}
                onPress={() => setOwn('need')}
              />
            </View>
            {next('want', !!talk.n || !!talk.nx)}
          </Dock>
        )}
      </>
    );
  } else if (step === 'want') {
    body = (
      <>
        <T v="title" style={s.c} accessibilityRole="header">
          How much do you want tonight to go differently?
        </T>
        <T style={s.c} tone="muted">
          No right answer. Honest is what helps.
        </T>
        <View style={s.middle}>
          <SliderValue big value={talk.w} caption="out of 10" hint="Slide below to answer" />
        </View>
        <Dock>
          <Slider
            label="How much you want tonight to go differently"
            value={talk.w}
            lo="not at all"
            hi="very much"
            readout={false}
            onChange={(n) => set({ w: n })}
          />
          {next('why', talk.w != null)}
        </Dock>
      </>
    );
  } else if (step === 'why') {
    const n = talk.w ?? 0;
    const base = talkWhys(st.reasons || [], talkTypedWhys(snap.days));
    const whys = base.concat(talk.why.filter((r) => base.indexOf(r) < 0));
    body = (
      <>
        <View style={[s.middle, { justifyContent: 'flex-start', paddingTop: 8 }]}>
          <View style={[s.echo, { backgroundColor: c.surface, borderColor: c.accent, shadowColor: c.lip }]}>
            <Text style={[s.echoN, { color: c.accentText }]}>{n}</Text>
          </View>
          <Appear delay={120} by={8}>
            <Text style={[s.reflect, { color: c.ink }]}>{talkReflect(n)}</Text>
          </Appear>
          {n > 0 ? (
            <Appear delay={300} by={8} style={{ alignSelf: 'stretch', gap: 10 }}>
              <T v="label" style={s.c}>
                What is in that {n}?
              </T>
              {own === 'why' ? (
                ownField('Like: being there for my kids', (t) => set({ why: addOwn(talk.why, t) }))
              ) : (
                <ChipWrap>
                  {whys.map((r) => (
                    <AnswerChip key={r} label={r} tone="mint" on={talk.why.indexOf(r) >= 0} onPress={() => set({ why: toggle(talk.why, r) })} />
                  ))}
                  <OwnChip onPress={() => setOwn('why')} />
                </ChipWrap>
              )}
            </Appear>
          ) : null}
        </View>
        {own === 'why' ? null : <Dock>{next('path')}</Dock>}
      </>
    );
  } else if (step === 'path') {
    body = (
      <>
        {decide ? (
          <T v="eyebrow" tone="muted">
            Time to decide
          </T>
        ) : null}
        <T v="title" style={s.c} accessibilityRole="header">
          Choose your path.
        </T>
        <T style={s.c} tone="muted">
          All three are honest. The point is to choose, not to drift.
        </T>
        <Dock>
          <View style={s.list}>
            {TALK_PATHS.map(([k, name, sub, ic]) => (
              <Answer key={k} icon={ic} tone={PATH_TONE[k]} title={name} sub={sub} on={talk.p === k} onPress={() => set({ p: k, m: [], mo: null, at: null })} />
            ))}
          </View>
          {next(talk.p === 'change' ? 'cMoves' : talk.p === 'wait' ? 'wWhen' : 'oLiking', !!talk.p)}
        </Dock>
      </>
    );
  } else if (step === 'cMoves') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Change the plan
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {talk.n ? 'Meet ' + needWord + ' another way.' : 'Meet that need another way.'}
        </T>
        <T style={s.c} tone="muted">
          What you need is real. Pick how you will give it to yourself.
        </T>
        {own === 'cMoves' ? (
          ownField('Like: play guitar for 20 minutes', (t) => set({ mx: addOwn(mx, t) }))
        ) : (
          <Dock>
            <View style={s.list}>
              {talkMoves(talk.n).map((k) => (
                <Answer
                  key={k}
                  multi
                  icon={MOVE_IC[k]}
                  tone={k === 'away' || k === 'block' ? 'accent' : 'mint'}
                  title={TALK_MOVES[k][0]}
                  on={talk.m.indexOf(k) >= 0}
                  onPress={() => set({ m: toggle(talk.m, k) })}
                />
              ))}
              {mx.map((t) => (
                <Answer key={'own' + t} multi icon="pencil" tone="mint" title={t} on onPress={() => set({ mx: mx.filter((x) => x !== t) })} />
              ))}
              {mx.length < 3 ? <Answer multi icon="plus" tone="accent" title="My own idea" sub="In your own words" onPress={() => setOwn('cMoves')} /> : null}
            </View>
            {next('cWhen', talk.m.length + mx.length > 0)}
          </Dock>
        )}
      </>
    );
  } else if (step === 'cWhen') {
    const ready = !!talk.mo;
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Change the plan
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          When is the hard part?
        </T>
        <View style={s.middle}>
          {ready ? (
            <Appear key={talk.mo} by={8} style={[s.plan, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <T v="eyebrow" tone="muted">
                Your plan
              </T>
              <Text style={[s.planT, { color: c.ink }]}>{talkPlanLine(talk)}</Text>
            </Appear>
          ) : (
            <T tone="muted" style={s.c}>
              Pick the moment below.
            </T>
          )}
        </View>
        <Dock>
          <View style={s.list}>
            {talkMomentsNow(now).map(([k, name]) => {
              const t = talkMomentTime(k, now);
              return (
                <Answer
                  key={k}
                  icon={k === 'now' ? 'bolt' : 'timer'}
                  tone="sun"
                  title={name}
                  sub={t ? talkClock(t) : undefined}
                  on={talk.mo === k}
                  onPress={() => set({ mo: k, at: t })}
                />
              );
            })}
          </View>
          {remindersOffered && talk.at ? (
            <View style={s.row}>
              <Chip label={'Remind me at ' + talkClock(talk.at)} on={remind} onPress={() => setRemind(!remind)} />
            </View>
          ) : null}
          {ready ? (
            <Appear by={10} duration={220}>
              <Button label="This is my plan" onPress={() => finishPath(talk)} />
            </Appear>
          ) : (
            <View style={s.btnSpace} />
          )}
        </Dock>
      </>
    );
  } else if (step === 'wWhen') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Wait, and decide later
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          When will you decide?
        </T>
        <T style={s.c} tone="muted">
          You do not have to decide now. A plan often looks different an hour from now.
        </T>
        <Dock>
          <View style={s.list}>
            {TALK_WAITS.map(([k, name]) => {
              const t = talkWaitTime(k, now);
              return (
                <Answer key={k} icon="timer" tone="sun" title={name} sub={'At ' + talkClock(t)} on={talk.mo === k} onPress={() => set({ mo: k, at: t })} />
              );
            })}
          </View>
          {next('wUntil', !!talk.mo)}
        </Dock>
      </>
    );
  } else if (step === 'wUntil') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Until {talk.at ? talkClock(talk.at) : 'then'}
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          One thing to do in the meantime
        </T>
        <T style={s.c} tone="muted">
          {talk.n ? 'Something that gives you a little ' + needWord + '.' : 'Something that meets that need a little.'}
        </T>
        {own === 'wUntil' ? (
          ownField('Like: play guitar for 20 minutes', (t) => set({ m: [], mx: [t] }))
        ) : (
          <Dock>
            <View style={s.list}>
              {talkMoves(talk.n).map((k) => (
                <Answer key={k} icon={MOVE_IC[k]} tone="mint" title={TALK_MOVES[k][0]} on={talk.m[0] === k} onPress={() => set({ m: [k], mx: undefined })} />
              ))}
              <Answer
                icon="pencil"
                tone="accent"
                title={mx[0] && !talk.m.length ? mx[0] : 'My own idea'}
                sub={mx[0] && !talk.m.length ? 'In your own words. Tap to change it.' : 'In your own words'}
                on={!!mx[0] && !talk.m.length}
                onPress={() => setOwn('wUntil')}
              />
            </View>
            {remindersOffered && talk.at ? (
              <View style={s.row}>
                <Chip label={'Remind me at ' + talkClock(talk.at)} on={remind} onPress={() => setRemind(!remind)} />
              </View>
            ) : null}
            {talk.m.length || mx.length ? (
              <Appear by={10} duration={220}>
                <Button label="Decide later" onPress={() => finishPath(talk)} />
              </Appear>
            ) : (
              <View style={s.btnSpace} />
            )}
          </Dock>
        )}
      </>
    );
  } else if (step === 'oLiking') {
    const lk = talkCard('liking');
    const read = seen0.indexOf('liking') >= 0;
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Eyes open
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {lk.title}
        </T>
        <TalkArtView k="liking" />
        <T style={s.body}>{read ? lk.short : lk.body}</T>
        <Sources keys={lk.src} map={TALK_SRC} />
        <T style={[s.c, s.warm]}>So if you go ahead, the goal is to notice. Here is how.</T>
        <Dock>{next('oBody')}</Dock>
      </>
    );
  } else if (step === 'oBody') {
    const any = talk.b.length + talk.f.length > 0;
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Before
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          What do you notice in your body right now?
        </T>
        <T style={s.c} tone="muted">
          Take one slow breath and check. There is no wrong answer.
        </T>
        <Dock>
          <T v="label" style={s.c}>
            Where
          </T>
          <ChipWrap>
            {TALK_WHERE.map(([k, w]) => (
              <AnswerChip key={k} label={w} tone="violet" on={talk.b.indexOf(k) >= 0} onPress={() => set({ b: toggle(talk.b, k) })} />
            ))}
          </ChipWrap>
          <T v="label" style={[s.c, { marginTop: 6 }]}>
            What it is like
          </T>
          <ChipWrap>
            {TALK_FEEL.map(([k, w]) => (
              <AnswerChip key={k} label={w} tone="coral" on={talk.f.indexOf(k) >= 0} onPress={() => set({ f: toggle(talk.f, k) })} />
            ))}
          </ChipWrap>
          {next('oExpect', any)}
        </Dock>
      </>
    );
  } else if (step === 'oExpect') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Before
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {talk.n ? 'How much ' + needWord + ' do you expect it to give you?' : 'How much of what you need do you expect it to give you?'}
        </T>
        <T style={s.c} tone="muted">
          Remember this number. You will check it afterwards.
        </T>
        <View style={s.middle}>
          <SliderValue big value={talk.e} caption="out of 10, expected" hint="Slide below to answer" />
        </View>
        <Dock>
          <Slider label="How much you expect it to give" value={talk.e} lo="nothing" hi="everything" readout={false} onChange={(n) => set({ e: n })} />
          {next('oReady', talk.e != null)}
        </Dock>
      </>
    );
  } else if (step === 'oReady') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Eyes open
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          If you go ahead, go slowly enough to notice.
        </T>
        <View style={[s.middle, { gap: 10 }]}>
          {[
            ['wind', 'Your breath, and what your body is doing.'],
            ['sparkle', 'The moment it stops giving you anything.'],
            ['stop', 'You can stop at any point. That is allowed too.'],
            ['check', 'Afterwards, come back here for one minute.'],
          ].map(([ic, t], i) => (
            <Appear key={i} delay={120 + i * 90} by={8} style={[s.forRow, { backgroundColor: c.surface, shadowColor: c.lip }]}>
              <View style={[s.forIc, { backgroundColor: c.violetSoft }]}>
                <Icon name={ic} size={20} color={c.violetText} />
              </View>
              <T style={{ flex: 1 }}>{t}</T>
            </Appear>
          ))}
          <T style={[s.c, s.warm]}>Whatever happens, nothing you have built is lost.</T>
        </View>
        <Dock>
          {remindersOffered ? (
            <View style={s.row}>
              <Chip label="Remind me in an hour to look back" on={remind} onPress={() => setRemind(!remind)} />
            </View>
          ) : null}
          <Button label="I will come back" onPress={() => finishPath({ ...talk, at: now + 3600000 })} />
        </Dock>
      </>
    );
  } else if (step === 'done') {
    const g = gain();
    const wait = talk.p === 'wait';
    body = (
      <>
        <Finish
          level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)}
          title={wait ? 'Decision moved to ' + (talk.at ? talkClock(talk.at) : 'later') + '.' : 'You changed the plan.'}
          text={
            wait
              ? 'If you still want it then, come back and choose with your eyes open. No pressure either way.'
              : 'You saw it coming and chose. That is the climb.'
          }
        />
        <Appear delay={420} style={[s.plan, { backgroundColor: c.surface, shadowColor: c.lip }]}>
          <T v="eyebrow" tone="muted">
            {wait ? 'Until then' : 'Your plan'}
          </T>
          <Text style={[s.planT, { color: c.ink }]}>{wait ? talkMoveWords(talk)[0] : talkPlanLine(talk)}</Text>
          <T v="small" tone="muted">
            {reminded ? 'Daybook will remind you. ' : ''}It waits on Today.
          </T>
        </Appear>
        {g ? <CountUp to={g} prefix="+" suffix={g === 1 ? ' point' : ' points'} delay={700} style={[s.pts, { color: c.mintText }]} /> : null}
        <Dock>
          <Button label="Done" onPress={close} />
        </Dock>
      </>
    );
  } else if (step === 'lWent') {
    const change = talk.p === 'change';
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Looking back
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {change ? 'Did your plan hold?' : 'Welcome back. Did you go ahead?'}
        </T>
        <T style={s.c} tone="muted">
          {change ? talkPlanLine(talk) : 'Either answer is useful. Honest is what counts.'}
        </T>
        <Dock>
          <Answer
            icon={change ? 'check' : 'sun'}
            tone={change ? 'mint' : 'violet'}
            title={change ? 'Yes, it held' : 'Yes, I went ahead'}
            onPress={() => {
              if (change) finishLook({ ...after, went: false });
              else {
                setAfter({ ...after, went: true });
                go('lFeel');
              }
            }}
          />
          <Answer
            icon={change ? 'leaf' : 'check'}
            tone={change ? 'violet' : 'mint'}
            title={change ? 'No, I went ahead' : 'No, I chose something else'}
            onPress={() => {
              if (change) {
                setAfter({ ...after, went: true });
                go('lFeel');
              } else finishLook({ ...after, went: false });
            }}
          />
        </Dock>
      </>
    );
  } else if (step === 'lFeel') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Looking back
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Right now, how do you feel?
        </T>
        <T style={s.c} tone="muted">
          Just notice. Pick any that fit.
        </T>
        {own === 'lFeel' ? (
          ownField('Like: numb', (t) => setAfter({ ...after, fx: addOwn(after.fx, t) }))
        ) : (
          <Dock>
            <ChipWrap>
              {TALK_AFTER_FEEL.map(([k, w]) => (
                <AnswerChip key={k} label={w} tone="violet" on={after.f.indexOf(k) >= 0} onPress={() => setAfter({ ...after, f: toggle(after.f, k) })} />
              ))}
              {after.fx.map((t) => (
                <AnswerChip key={'own' + t} label={t} tone="violet" on onPress={() => setAfter({ ...after, fx: after.fx.filter((x) => x !== t) })} />
              ))}
              {after.fx.length < 3 ? <OwnChip onPress={() => setOwn('lFeel')} /> : null}
            </ChipWrap>
            {next('lGave', after.f.length + after.fx.length > 0)}
          </Dock>
        )}
      </>
    );
  } else if (step === 'lGave') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Looking back
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {talk.n ? 'How much ' + needWord + ' did it actually give you?' : 'How much of what you needed did it actually give you?'}
        </T>
        {talk.e != null ? (
          <T style={s.c} tone="muted">
            Before, you expected {talk.e} out of 10.
          </T>
        ) : null}
        <View style={s.middle}>
          <SliderValue big value={after.g} caption="out of 10, really" hint="Slide below to answer" />
        </View>
        <Dock>
          <Slider label="How much it really gave" value={after.g} lo="nothing" hi="everything" readout={false} onChange={(n) => setAfter({ ...after, g: n })} />
          {next('lCost', after.g != null)}
        </Dock>
      </>
    );
  } else if (step === 'lCost') {
    body = (
      <>
        <T v="eyebrow" tone="muted">
          Looking back
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          What did it cost?
        </T>
        <T style={s.c} tone="muted">
          Not to judge it. Just to see it.
        </T>
        {own === 'lCost' ? (
          ownField('Like: a good morning', (t) => setAfter({ ...after, c: after.c.filter((x) => x !== 'none'), cx: addOwn(after.cx, t) }))
        ) : (
          <Dock>
            <ChipWrap>
              {TALK_COST.map(([k, w]) => (
                <AnswerChip
                  key={k}
                  label={w}
                  tone="sun"
                  on={after.c.indexOf(k) >= 0}
                  onPress={() =>
                    setAfter({
                      ...after,
                      c:
                        k === 'none'
                          ? ['none']
                          : toggle(
                              after.c.filter((x) => x !== 'none'),
                              k,
                            ),
                      cx: k === 'none' ? [] : after.cx,
                    })
                  }
                />
              ))}
              {after.cx.map((t) => (
                <AnswerChip key={'own' + t} label={t} tone="sun" on onPress={() => setAfter({ ...after, cx: after.cx.filter((x) => x !== t) })} />
              ))}
              {after.cx.length < 3 ? <OwnChip onPress={() => setOwn('lCost')} /> : null}
            </ChipWrap>
            {after.c.length + after.cx.length ? (
              <Appear by={10} duration={220}>
                <Button label="Next" onPress={() => finishLook(after)} />
              </Appear>
            ) : (
              <View style={s.btnSpace} />
            )}
          </Dock>
        )}
      </>
    );
  } else {
    /* lEnd */
    const went = after.went;
    const ev = talkEvidence(snap.days);
    const g = gain();
    body = went ? (
      <>
        <T v="eyebrow" tone="muted">
          Looked back
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          Thank you for looking at it honestly.
        </T>
        <View style={s.middle}>
          {ev.rows.length ? <Evidence rows={ev.rows} /> : null}
          <Appear delay={300} by={8}>
            <T style={s.c}>{talkEvidenceLine(ev)}</T>
          </Appear>
          <Appear delay={460} by={8} style={[s.plan, { backgroundColor: c.surface, shadowColor: c.lip }]}>
            <T>It is in your log as a slip: data, not a reset. Nothing you have built is gone, and tomorrow is a fresh day.</T>
          </Appear>
        </View>
        <Dock>
          <Button label="Done" onPress={close} />
        </Dock>
      </>
    ) : (
      <>
        <Finish
          level={Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n)}
          title="You chose a different night."
          text="That is the climb, one honest choice at a time."
        />
        {ev.chose > 1 ? (
          <Appear delay={420}>
            <T style={s.c} tone="muted">
              That makes {ev.chose} times you talked it through and chose something else.
            </T>
          </Appear>
        ) : null}
        {g ? <CountUp to={g} prefix="+" suffix={g === 1 ? ' point' : ' points'} delay={700} style={[s.pts, { color: c.mintText }]} /> : null}
        <Dock>
          <Button label="Done" onPress={close} />
        </Dock>
      </>
    );
  }

  /* the progress dots follow the part of the talk-through you are in */
  const flow: Step[] = look
    ? ['lWent', 'lFeel', 'lGave', 'lCost', 'lEnd']
    : [
        ...(decide ? [] : (['for', 'signs'] as Step[])),
        ...(decide ? [] : known.length ? (['known'] as Step[]) : []),
        ...(decide ? [] : fresh.map(() => 'mind' as Step)),
        ...(decide ? [] : (['need', 'want', 'why'] as Step[])),
        'path',
        ...((talk.p === 'wait' ? ['wWhen', 'wUntil'] : talk.p === 'open' ? ['oLiking', 'oBody', 'oExpect', 'oReady'] : ['cMoves', 'cWhen']) as Step[]),
        'done',
      ];
  const i = step === 'mind' ? flow.indexOf('mind') + ci : flow.indexOf(step);
  return (
    <SceneFrame
      title={look ? 'Looking back' : 'Talk it through'}
      sky="violet"
      dots={step === 'for' || step === 'done' || step === 'lEnd' ? null : { n: flow.length, i, label: 'Step ' + (i + 1) + ' of ' + flow.length }}
      onBack={step !== 'done' && step !== 'lEnd' && (hist.length || (step === 'mind' && ci > 0)) ? back : null}
      onClose={close}
      footer={foot}>
      {step === 'mind' ? (
        body
      ) : (
        <Appear key={step} x={hist.length ? 36 * dir : 0} by={hist.length ? 0 : 8} duration={280} style={s.stage}>
          {body}
        </Appear>
      )}
    </SceneFrame>
  );
}

/* expected against what it really gave, each time looked back on, with the numbers on the bars */
function Evidence({ rows }: { rows: { e: number; g: number }[] }) {
  const c = useTheme();
  const H = 96;
  const bar = (v: number, color: string, delay: number, faint?: boolean) => (
    <View style={s.evCol}>
      <Text style={[s.evN, { color: c.muted }]}>{v}</Text>
      <Appear delay={delay} by={0} style={[s.evBar, { height: Math.max(4, (v / 10) * H), backgroundColor: color, opacity: faint ? 0.55 : 1 }]}>
        <View />
      </Appear>
    </View>
  );
  return (
    <View style={[s.ev, { backgroundColor: c.surface, shadowColor: c.lip }]}>
      <View style={s.evBars}>
        {rows.map((r, i) => (
          <View key={i} style={s.evPair}>
            {bar(r.e, c.coral, 150 + i * 90, true)}
            {bar(r.g, c.sun, 230 + i * 90)}
          </View>
        ))}
      </View>
      <View style={s.evKey}>
        <View style={[s.evSw, { backgroundColor: c.coral, opacity: 0.55 }]} />
        <T v="small" tone="muted">
          expected
        </T>
        <View style={[s.evSw, { backgroundColor: c.sun, marginLeft: 12 }]} />
        <T v="small" tone="muted">
          what it gave
        </T>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  c: { textAlign: 'center' },
  stage: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 14 },
  middle: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 140 },
  list: { alignSelf: 'stretch', gap: 9 },
  row: { flexDirection: 'row', justifyContent: 'center' },
  btnSpace: { height: 52 },
  warm: { fontFamily: font.bodyMedium, marginTop: 4 },
  body: { alignSelf: 'stretch', fontSize: 16.5, lineHeight: 24 },
  forRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  forIc: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  echo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  echoN: { fontFamily: font.displayBold, fontSize: 48, lineHeight: 56 },
  reflect: { fontFamily: font.display, fontSize: 22, lineHeight: 30, textAlign: 'center' },
  plan: {
    alignSelf: 'stretch',
    gap: 6,
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  planT: { fontFamily: font.display, fontSize: 20, lineHeight: 27 },
  pts: { fontFamily: font.display, fontSize: 18, textAlign: 'center' },
  ev: { alignSelf: 'stretch', padding: 16, borderRadius: 20, gap: 10, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0 },
  evBars: { height: 122, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 18 },
  evCol: { alignItems: 'center', gap: 4 },
  evN: { fontFamily: font.bodyBold, fontSize: 13, fontVariant: ['tabular-nums'] },
  evPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  evBar: { width: 22, borderRadius: 7 },
  evKey: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  evSw: { width: 12, height: 12, borderRadius: 4 },
});
