/* SOS: help on the first tap, when an urge is happening right now. Nothing is asked first.
   The first screen is only for breathing and coming back to yourself: who you are becoming, one line to do now, your record and
   your own words, kept small, and a sun to take three slow breaths with. Below it: how strong it is (optional) and Next, which
   is big and solid, and works at any time.
   The second screen is the tools: every one of them, with how each went for you, and the one suggested for this moment as the
   main button, with Not for me (stop suggesting it), It passed and Talk it through under it. The suggestion learns from what
   you pick (core: urRank).
   A tool started here comes back to "How is it now?", which also asks whether you would use that tool again; the answer saves
   the entry and goes on to the check-in, and Still strong goes back to the tools. Late at night the screens go dark, and Go to
   bed only ever comes paired with a tool for the thoughts. */
import {
  addEvent,
  gameCompute,
  rateUrTool,
  rkStepFor,
  setUrOff,
  storyIfLine,
  sunPlanNow,
  UR_STR,
  UR_STR_ADJ,
  urAnswer,
  urDoLine,
  urEntry,
  urEvidence,
  urFromYou,
  urPlanNow,
  urKnow,
  urNight,
  urNote,
  urOffOf,
  urPickSug,
  urSuggestion,
  urTags,
  urTool,
  type Strength,
  type Tool,
} from '@daybook/core';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '@/components/text';

import { BigOption, Link } from '@/components/choices';
import { Flame } from '@/components/flame';
import { HorizonSun } from '@/components/orb';
import { SceneFrame } from '@/components/scene';
import { ToolGrid, toolTone } from '@/components/tool-grid';
import { Button, Chip, Icon, T } from '@/components/ui';
import { SosVoice } from '@/components/voice-note';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useSos } from '@/lib/sos';
import { useCareSettings, useStore } from '@/lib/store';
import { font, useTheme } from '@/lib/theme';
import { useVoice } from '@/lib/voice';

export default function Sos() {
  const c = useTheme();
  const { snap, tk, now, update, apply } = useStore();
  const sos = useSos();
  const win = useWindowDimensions();
  const st = useCareSettings();
  const g = useMemo(() => (st ? gameCompute(snap.days, st, snap.reviews, tk) : null), [snap, st, tk]);
  const ur = sos.ur;
  /* the small tag on each tool: how it went for you */
  const tags = useMemo(() => (st ? urTags(snap.days, st, tk, sos.mem) : {}), [snap.days, st, tk, sos.mem]);
  const voice = useVoice();
  /* which reason "From you" shows, when there is no note: picked once, so it stays put while you read it */
  const [pick] = useState(() => Math.random());

  /* the breathing sun only runs while SOS is in front (not under a tool) */
  const [front, setFront] = useState(true);
  /* the tool just set to Not for me (for Undo) */
  const [offed, setOffed] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      setFront(true);
      return () => setFront(false);
    }, []),
  );

  /* a new SOS each time the screen opens. Leaving it (Close, the system Back, or on to the check-in) ends it: the screen
     unmounts only when it is dismissed, not when a tool is pushed on top of it, so the cleanup is the right place. */
  useEffect(() => {
    if (!sos.ur) sos.begin(g ? g.pts : 0);
    return () => sos.end();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* picked once per screen, like the legacy urCx: the line to do now (and whether to try something new), then, after a tool,
     one thing worth knowing. Each is kept with the SOS so it does not change while you read it. */
  const key = ur ? (ur.again ? 'a' + ur.again : 'first') + '|' + (ur.strength || '') : '';
  useLayoutEffect(() => {
    if (!ur || !st) return;
    if ((ur.step === 'now' || ur.step === 'tools') && (ur.cx?.k !== key || ur.explore == null)) {
      let mem = sos.mem;
      let cx = ur.cx;
      if (cx?.k !== key) {
        const r = urDoLine(ur, Date.now(), mem, Math.random);
        mem = r.mem;
        cx = { ...(cx || {}), k: key, do: r.text, seen: true };
      }
      const probe = { ...ur, cx };
      urPickSug(probe, snap.days, st, tk, Date.now(), mem, Math.random);
      sos.set({ ...ur, cx, explore: probe.explore });
      if (mem !== sos.mem) sos.setMem(mem);
    } else if (ur.step === 'after' && (ur.cx?.kk !== String(ur.used.length) || !ur.cx?.kn)) {
      const r = urKnow(ur, snap.days, tk, Date.now(), sos.mem, Math.random);
      sos.set({ ...ur, cx: { ...(ur.cx || {}), kk: String(ur.used.length), kn: r.know } });
      sos.setMem(r.mem);
    }
  }, [ur, key, st, snap.days, tk, sos]);

  if (!st || !g) return <Redirect href="/" />;
  const night = urNight(new Date(now).getHours());
  const level = Math.max(1, g.level.n);
  /* the one suggestion. explore is settled above, so rand is not used here */
  const pk = ur && ur.step === 'tools' ? urPickSug({ ...ur }, snap.days, st, tk, now, sos.mem, () => 1) : null;

  const pickTool = (id: string, combo = false) => {
    if (!ur || !urTool(id)) return;
    const sug = ur.step === 'tools' && pk ? pk.top.id : ur.sug;
    sos.setMem((m) => urNote(m, sug, id));
    sos.set({ ...ur, sug });
    sos.setCombo(combo && id !== 'bed' ? 'bed' : null);
    buzz('tap');
    router.push({ pathname: '/tool/[id]', params: { id } });
  };

  /* the answer to "How is it now?" (and "It passed"): Still strong goes on to the next tool; the others save the entry */
  const save = (v: 'rode' | 'slipped' | 'again') => {
    if (!ur) return;
    const a = urAnswer(ur, v);
    if (v === 'again') {
      sos.set({ ...a, step: 'tools' });
      setOffed(null);
      buzz('tap');
      return;
    }
    const e = urEntry(a, v, st, Date.now());
    let id = '';
    const days = update((s) => {
      const r = addEvent(s.days, e.key, v, e.time, e.fields);
      id = r.id;
      return { ...s, days: r.days };
    }).days;
    sos.setMem((m) => ({ ...m, last: e.last }));
    const step = v === 'slipped' ? rkStepFor(days, e.key) : !e.trig ? 'trigger' : v === 'rode' && !e.did.length ? 'did' : 'done';
    const kl = ur.cx?.kn?.l || '';
    sos.end();
    buzz('save');
    router.replace({
      pathname: '/log',
      params: {
        date: e.key,
        evId: id,
        outcome: v,
        step,
        from: 'urge',
        pts0: String(a.p0),
        st: a.strength || '',
        m: String(e.mins),
        night: night ? '1' : '',
        kl,
      },
    });
  };

  const sky = night ? 'night' : 'violet';
  if (!ur)
    return (
      <SceneFrame title="SOS" sky={sky} onClose={close}>
        {null}
      </SceneFrame>
    );

  /* "Would you use this again?": tapping the answer that is on takes it back */
  const rate = (id: string, v: 1 | -1) => {
    if (!ur) return;
    const prev = ur.rate?.[id] || 0;
    const next = prev === v ? 0 : v;
    const r = { ...(ur.rate || {}) };
    if (next) r[id] = next;
    else delete r[id];
    apply({ st: rateUrTool(st, id, next - prev) });
    sos.set({ ...ur, rate: r });
    buzz('tap');
  };
  const notForMe = (id: string, on: boolean) => {
    apply({ st: setUrOff(st, id, on) });
    setOffed(on ? id : null);
    buzz('tap');
  };

  /* the second screen: every tool, and the one suggested for this moment */
  if (ur.step === 'tools') {
    const sug = pk ? urSuggestion(pk, ur.strength, snap.days, now, st, sos.mem) : null;
    const was = offed ? urTool(offed) : null;
    /* the if-then plan made on Sunday, when there is one, comes first: it was decided while calm. Else, late at night, the
       line of the urge plan for bed or late at night (core urPlanNow). Before setup there is no plan of the person's own. */
    const plan = sunPlanNow(snap.reviews, tk);
    const own = !plan?.it && snap.settings ? urPlanNow(st, new Date(now).getHours()) : null;
    const lead = ur.again
      ? String(ur.cx?.do || '')
      : plan?.it
        ? 'Your plan: ' + storyIfLine(plan.it)
        : own
          ? 'Your plan: ' + own
          : 'Pick what will help you most in this moment, or start the one below.';
    return (
      <SceneFrame
        title="SOS"
        sky={sky}
        onBack={() => {
          sos.set({ ...ur, step: 'now' });
          setOffed(null);
        }}
        onClose={close}
        pinSheet
        sheet={
          <>
            {sug ? (
              <View style={{ gap: 8 }}>
                <View style={s.lab}>
                  <Text style={[s.labT, { color: c.muted }]}>SUGGESTED FOR YOU</Text>
                  {pk && pk.mode !== 'pin' ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={'Not for me. Stop suggesting ' + sug.tool.name}
                      hitSlop={10}
                      onPress={() => notForMe(sug.tool.id, true)}>
                      <Text style={[s.labL, { color: c.accentText }]}>Not for me</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Go
                  tool={sug.tool}
                  title={sug.title}
                  sub={sug.sub}
                  label={sug.combo ? sug.label : undefined}
                  onPress={() => pickTool(sug.tool.id, !!sug.combo)}
                />
                {was ? (
                  <View style={s.undo} accessibilityLiveRegion="polite">
                    <T v="small" tone="muted" style={{ flex: 1 }}>
                      {was.name} will not be suggested again. It stays in the list.
                    </T>
                    <Pressable accessibilityRole="button" hitSlop={10} onPress={() => notForMe(was.id, false)}>
                      <Text style={[s.labL, { color: c.accentText }]}>Undo</Text>
                    </Pressable>
                  </View>
                ) : sug.cap && win.height > 680 ? (
                  <T v="small" tone="muted" style={{ paddingHorizontal: 4 }}>
                    {sug.cap}
                  </T>
                ) : null}
              </View>
            ) : null}
            <View style={s.alt}>
              <Alt icon="check" label="It passed" onPress={() => save('rode')} />
              <Alt
                icon="chat"
                label="Talk it through"
                onPress={() => {
                  buzz('tap');
                  router.replace('/talk');
                }}
              />
            </View>
          </>
        }>
        <T v="title" style={s.c} accessibilityRole="header">
          {ur.again ? 'Try something different' : 'What will help right now?'}
        </T>
        {lead ? (
          <T tone="muted" style={[s.c, { maxWidth: 360 }]}>
            {lead}
          </T>
        ) : null}
        <ToolGrid days={snap.days} tags={tags} onPick={(id) => pickTool(id)} />
      </SceneFrame>
    );
  }

  if (ur.step === 'after') {
    const t = urTool(ur.used[ur.used.length - 1] || '');
    const r = t ? ur.rate?.[t.id] || 0 : 0;
    const off = !!t && urOffOf(st).indexOf(t.id) >= 0;
    return (
      <SceneFrame title="SOS" sky={sky} onClose={close} footer={<Link label="Not now" onPress={close} />}>
        <Flame level={level} size={80} />
        <T v="title" style={s.c} accessibilityRole="header">
          How is it now?
        </T>
        <T style={s.c}>
          {t ? (
            <>
              You tried <Text style={{ fontFamily: font.bodyBold }}>{t.name}</Text>
              {/[?!]$/.test(t.name) ? ' ' : '. '}
            </>
          ) : null}
          {ur.strength ? 'It started out ' + UR_STR_ADJ[ur.strength] + '. ' : ''}Tap what is true now.
        </T>
        <View style={s.opts}>
          <BigOption tone="mint" icon="wave" title="It passed" sub="I rode it out." onPress={() => save('rode')} />
          <BigOption tone="sun" icon="timer" title="Still strong" sub="Try something different." onPress={() => save('again')} />
          <BigOption tone="slip" icon="leaf" title="I slipped" sub="A slip is data, not a reset." onPress={() => save('slipped')} />
        </View>
        {t ? (
          <View style={[s.rate, { backgroundColor: c.scBtn }]} accessibilityRole="radiogroup" accessibilityLabel={'Would you use ' + t.name + ' again?'}>
            <T v="small" style={[s.c, { fontFamily: font.bodySemi }]}>
              Would you use {t.name} again?
            </T>
            <View style={s.rateRow}>
              <Chip label="Yes" on={r === 1} onPress={() => rate(t.id, 1)} />
              <Chip label="Not really" on={r === -1} onPress={() => rate(t.id, -1)} />
            </View>
            {r === 1 ? (
              <T v="small" tone="muted" style={s.c}>
                Good to know. SOS will offer it more.
              </T>
            ) : r === -1 ? (
              off ? (
                <T v="small" tone="muted" style={s.c}>
                  It will not be suggested again. It stays in the list.
                </T>
              ) : st.urPin === t.id ? (
                <T v="small" tone="muted" style={s.c}>
                  Good to know. It is still your go-to in Settings.
                </T>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => notForMe(t.id, true)} style={s.plan}>
                  <Text style={[s.planT, { color: c.accentText }]}>Stop suggesting {t.name}</Text>
                </Pressable>
              )
            ) : null}
          </View>
        ) : null}
        {ur.cx?.kn ? <Know text={ur.cx.kn.t} /> : null}
      </SceneFrame>
    );
  }

  /* the first screen */
  /* before setup the person has no words of their own yet: none are shown, not the starting ones */
  const fy = snap.settings ? urFromYou(st, pick) : null;
  /* before setup there is no "who I am becoming" yet: one line says the setup can wait */
  const be = snap.settings ? String(st.becoming || '').trim() : 'You can set up Daybook later.';
  const mine = !!fy || !!voice.uri;
  const rec = urEvidence(snap.days);
  const lines = String(ur.cx?.do || '')
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n');
  /* on a short screen, or when your own words need the room, the extra lines step aside so the sun keeps its place */
  const H = win.height;
  const small = H <= 680;
  const tight = (mine || !!be) && H <= 900;
  const quiet = small || tight;

  const sheet = (
    <>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel="How strong is it? Optional">
        <Lab text="How strong is it?" aside="Optional" />
        <Seg
          value={ur.strength}
          onPick={(v) => {
            sos.set({ ...ur, strength: ur.strength === v ? null : v, explore: null });
            buzz('tap');
          }}
        />
      </View>
      {/* Next: big, solid and easy to hit at any time, even before the three breaths are done */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next. Pick what will help."
        onPress={() => {
          sos.set({ ...ur, step: 'tools', sug: null });
          buzz('tap');
        }}
        hitSlop={8}
        style={({ pressed }) => [
          s.next,
          {
            backgroundColor: c.accent,
            shadowColor: c.accentDeep,
            shadowOffset: { width: 0, height: pressed ? 1 : 5 },
            transform: [{ translateY: pressed ? 4 : 0 }],
          },
        ]}>
        <Text style={[s.nextT, { color: c.accentInk }]}>Next</Text>
        <Icon name="next" size={24} color={c.accentInk} />
      </Pressable>
    </>
  );

  return (
    <SceneFrame title="SOS" sky={sky} onClose={close} sheet={sheet}>
      <View style={s.sky}>
        <View style={[s.words, { gap: small ? 10 : 16 }]}>
          {be ? (
            <T v="small" style={s.be} accessibilityLabel={snap.settings ? `Who I am becoming: ${be}` : be}>
              {be}
            </T>
          ) : null}
          <T v="title" style={[s.c, s.h, small && { fontSize: 23 }]} accessibilityRole="header">
            {lines.join('\n')}
          </T>
          {rec.n ? (
            <View
              style={s.rec}
              accessible
              accessibilityLabel={`Your record: ${rec.n} ${rec.n === 1 ? 'urge' : 'urges'} ridden out${rec.med ? `. Most pass in ${rec.med} minutes` : ''}.`}>
              <RecChip icon="wave" b={String(rec.n)} rest={' ' + (rec.n === 1 ? 'urge' : 'urges') + ' ridden out'} />
              {rec.med ? <RecChip icon="timer" pre="Most pass in " b={rec.med + ' min'} /> : null}
            </View>
          ) : quiet ? null : (
            <View style={s.rec}>
              <RecChip icon="wave" rest="Urges rise, peak, and pass" />
            </View>
          )}
          {mine ? <FromYou cap={fy?.cap || 'From you'} text={fy?.t || ''} /> : null}
        </View>
        <HorizonSun on={front} breaths={3} />
      </View>
    </SceneFrame>
  );
}

/* ---------- the parts ---------- */
function Lab({ text, aside }: { text: string; aside?: string }) {
  const c = useTheme();
  return (
    <View style={s.lab}>
      <Text style={[s.labT, { color: c.muted }]}>{text.toUpperCase()}</Text>
      {aside ? <Text style={[s.labA, { color: c.muted }]}>{aside}</Text> : null}
    </View>
  );
}

/* A little / Strong / Very strong. Tapping the one that is on turns it off. */
function Seg({ value, onPick }: { value: Strength | null; onPick: (v: Strength) => void }) {
  const c = useTheme();
  return (
    <View style={[s.seg, { backgroundColor: c.accentSoft }]}>
      {UR_STR.map(([v, label]) => {
        const on = value === v;
        return (
          <Pressable
            key={v}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onPick(v)}
            style={[
              s.segB,
              on && {
                backgroundColor: c.surface,
                borderColor: c.accent,
                shadowColor: c.lip,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 0,
              },
            ]}>
            <Text style={[s.segT, { color: on ? c.ink : c.accentText }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* the one next step: a big button with the tool, how long it takes and what it does */
function Go({ tool, title, sub, label, onPress }: { tool: Tool; title: string; sub: string; label?: string; onPress: () => void }) {
  const c = useTheme();
  const ink = toolTone(c, tool.tone)[1];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        s.go,
        {
          backgroundColor: c.accent,
          shadowColor: c.accentDeep,
          shadowOffset: { width: 0, height: pressed ? 1 : 5 },
          transform: [{ translateY: pressed ? 4 : 0 }],
        },
      ]}>
      <View style={[s.gi, { backgroundColor: c.surface }]}>
        <Icon name={tool.ic} size={26} color={ink} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.gt, { color: c.accentInk }]}>{title}</Text>
        {sub ? <Text style={[s.gs, { color: c.accentInk }]}>{sub}</Text> : null}
      </View>
      <Icon name="next" size={22} color={c.accentInk} />
    </Pressable>
  );
}

function Alt({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.altB, { backgroundColor: c.accentSoft, opacity: pressed ? 0.8 : 1 }]}>
      <Icon name={icon} size={18} color={c.accentText} />
      <Text style={[s.altT, { color: c.accentText }]}>{label}</Text>
    </Pressable>
  );
}

function RecChip({ icon, pre, b, rest }: { icon: string; pre?: string; b?: string; rest?: string }) {
  const c = useTheme();
  return (
    <View style={[s.chip, { backgroundColor: c.scBtn }]}>
      <Icon name={icon} size={16} color={c.ink} />
      <T v="small" style={{ fontFamily: font.bodyMedium }}>
        {pre}
        {b ? <Text style={{ fontFamily: font.bodyBold }}>{b}</Text> : null}
        {rest}
      </T>
    </View>
  );
}

/* your own words: the note written on a calm day, or one of your reasons, and your voice note if you recorded one */
function FromYou({ cap, text }: { cap: string; text: string }) {
  const c = useTheme();
  return (
    <View style={[s.note, { backgroundColor: c.scBtn }]}>
      <T v="small" style={s.noteCap}>
        {cap.toUpperCase()}
      </T>
      {text ? <T style={s.noteQ}>{text}</T> : null}
      <SosVoice />
    </View>
  );
}

function Know({ text }: { text: string }) {
  const c = useTheme();
  return (
    <View style={[s.know, { backgroundColor: c.scBtn }]}>
      <T style={{ fontSize: 14.5, lineHeight: 20, textAlign: 'center' }}>{text}</T>
    </View>
  );
}

const s = StyleSheet.create({
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 66,
    borderRadius: 20,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  nextT: { fontFamily: font.bodyBold, fontSize: 21 },
  c: { textAlign: 'center' },
  h: { fontSize: 28, lineHeight: 33, maxWidth: 420 },
  opts: { alignSelf: 'stretch', gap: 10 },
  sky: { flexGrow: 1, alignSelf: 'stretch', alignItems: 'center', gap: 8 },
  words: { alignItems: 'center', paddingTop: 8 },
  rec: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32, paddingLeft: 9, paddingRight: 12, borderRadius: 999 },
  be: { fontFamily: font.display, fontSize: 15, lineHeight: 20, textAlign: 'center', maxWidth: 360, opacity: 0.82 },
  note: { gap: 3, maxWidth: 340, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 11, borderRadius: 18 },
  noteCap: { fontFamily: font.bodyBold, fontSize: 11.5, letterSpacing: 1, opacity: 0.78 },
  noteQ: { fontFamily: font.display, fontSize: 17, lineHeight: 23 },
  lab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingHorizontal: 4 },
  labT: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 1 },
  labA: { fontFamily: font.bodyMedium, fontSize: 13 },
  labL: { fontFamily: font.bodySemi, fontSize: 14, textDecorationLine: 'underline' },
  undo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  rate: { alignSelf: 'stretch', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18 },
  rateRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  seg: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 17 },
  segB: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  segT: { fontFamily: font.bodySemi, fontSize: 15 },
  go: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 74,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 14,
    borderRadius: 22,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  gi: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  gt: { fontFamily: font.display, fontSize: 21, lineHeight: 25 },
  gs: { fontFamily: font.body, fontSize: 14, lineHeight: 18, marginTop: 3, opacity: 0.88 },
  alt: { flexDirection: 'row', gap: 8, marginTop: 2 },
  plan: { alignSelf: 'center', minHeight: 36, justifyContent: 'center', paddingHorizontal: 8 },
  planT: { fontFamily: font.bodySemi, fontSize: 14.5, textDecorationLine: 'underline', textAlign: 'center' },
  altB: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, paddingHorizontal: 10, borderRadius: 14 },
  altT: { fontFamily: font.bodySemi, fontSize: 15 },
  know: { alignSelf: 'center', maxWidth: 400, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16 },
});
