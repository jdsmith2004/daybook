/* The first week (core unlock.ts; WP10, November 12, 2026): one new part a day, each set up by using it once. The flame pops
   in on its burst, says what the part is for, and the one thing to do sits low.

   - the phone's bed (day 2): the note an hour before phone-down (on a phone), then the wind-down itself, to put the flame to bed;
   - one person (day 3): a first name, kept in My plan;
   - the plan's first line (day 4): for the hardest moment setup heard, three "then"s low, one tap, and it is the plan;
   - the other doors (day 5, an iPhone with Screen Time): the two ways low, and Choose the apps opens Apple's ask;
   - your own voice (day 6): Future you, where the note is left;
   - the first Sunday review keeps its own card (moment.ts), which opens here first. */
import { gameCompute, obPlanLine, setField, setPlanLine, UNLOCK_ORDER, UNLOCK_WORDS, type UnlockId } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Field } from '@/components/choices';
import { Answer, AnswerText } from '@/components/lesson-parts';
import { Bubble } from '@/components/lesson-flame';
import { Dock, Finish, SceneFrame } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { setReminderPrefs, useReminderPrefs } from '@/lib/prefs';
import { PULL_DENIED, pullStart, setPullPrefs } from '@/lib/pull';
import { allowReminders, remindersOffered } from '@/lib/reminders';
import { useStore } from '@/lib/store';
import { PAPER_INK } from '@/lib/lesson-look';
import { font, nightInk, useTheme, type Sky } from '@/lib/theme';
import { useUnlockMark } from '@/lib/unlock';

/* each part on its own sky: the phone's bed on the night, like the night itself */
const SKY: Record<UnlockId, Sky> = { bed: 'night', person: 'coral', plan: 'violet', doors: 'sky', voice: 'mint', sunday: 'sun' };

/* the short wait all day is the one with the evidence (one sec), so it comes first; notes only stays a choice */
const WAYS: [boolean, string, string][] = [
  [true, 'A short wait first', 'Ten seconds before each one opens, all day'],
  [false, 'Notes only', 'A note after two hours, and at night'],
];

export default function Unlocked() {
  const { id: raw } = useLocalSearchParams<{ id?: string }>();
  const { s: sun } = useLocalSearchParams<{ s?: string }>();
  const id: UnlockId = UNLOCK_ORDER.includes(raw as UnlockId) ? (raw as UnlockId) : 'bed';
  const w = UNLOCK_WORDS[id];
  const { snap, tk, apply, say } = useStore();
  const mark = useUnlockMark();
  const c = useTheme();
  const st = snap.settings;
  const level = st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1;
  const night = id === 'bed';
  const rem = useReminderPrefs();
  const line = st ? obPlanLine(st) : null;
  const [then, setThen] = useState<string | null>(null);
  const sky = SKY[id];
  const [name, setName] = useState('');
  const ink = night ? nightInk.ink : undefined;
  const soft = night ? nightInk.muted : undefined;
  const [pause, setPause] = useState(true);
  const asking = useRef(false);

  useEffect(() => {
    buzz('lit');
    mark.opened(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* the phone's bed: the note an hour before phone-down (asked once, on a phone), then the wind-down itself */
  const bed = async () => {
    if (asking.current) return;
    if (remindersOffered && !rem.wind) {
      asking.current = true;
      const ok = await allowReminders().catch(() => false);
      asking.current = false;
      if (ok) setReminderPrefs({ ...rem, wind: true });
    }
    buzz('lit');
    router.replace('/wind');
  };
  const saveName = () => {
    const v = name.trim().slice(0, 80);
    if (!v || !st) return;
    apply({ st: setField(st, 'safePerson', v) });
    buzz('lit');
    say('Kept in My plan.');
    close();
  };
  const savePlan = () => {
    if (!then || !st) return;
    apply({ st: setPlanLine(st, then) });
    buzz('lit');
    say('It is the first line of your plan.');
    close();
  };
  const main: Record<UnlockId, () => void> = {
    bed: () => void bed(),
    person: saveName,
    plan: savePlan,
    doors: () => void choose(),
    voice: () => router.replace('/future'),
    sunday: () => (sun ? router.replace({ pathname: '/review', params: { s: sun } }) : close()),
  };
  const choose = async () => {
    if (asking.current) return;
    asking.current = true;
    const r = await pullStart().catch(() => 'closed' as const);
    asking.current = false;
    if (r === 'denied') say(PULL_DENIED);
    if (r !== 'on') return;
    setPullPrefs({ feeds: pause });
    buzz('lit');
    say('I am watching for it now.');
    close();
  };

  return (
    <SceneFrame title="" sky={sky} onClose={() => close()}>
      <View style={s.eb}>
        <Icon name="sparkle" size={16} color={night ? '#FFE27A' : c.accent} />
        <Text style={[s.ebT, { color: night ? '#FFE27A' : c.accent }]}>{w.eb}</Text>
      </View>
      <T v="title" style={[s.mid0, ink ? { color: ink } : null]} accessibilityRole="header">
        {id === 'plan' && line ? 'When ' + line.ask + ', what will you do?' : w.title}
      </T>
      {w.line ? (
        <T tone={night ? undefined : 'muted'} style={[s.mid0, { marginTop: 8 }, soft ? { color: soft } : null]}>
          {w.line}
        </T>
      ) : null}
      {id === 'person' ? (
        <View style={s.name}>
          <Field
            label="Their name"
            maxLength={80}
            placeholder="A first name"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            onSubmitEditing={saveName}
          />
          <Button label={w.btn} onPress={saveName} disabled={!name.trim()} />
        </View>
      ) : null}
      <View style={s.mid}>
        <Bubble text={w.say} style={{ alignSelf: 'center', maxWidth: 320 }} />
        <Finish level={level} alive always least={0.6} size={190} zoom={1.25} />
      </View>
      {id === 'person' ? null : (
        <Dock>
          {id === 'plan' && line ? (
            <View style={{ gap: 8 }}>
              {line.opts.map((t) => (
                <Answer key={t} sel={then === t} right={then === t} onPress={() => setThen(t)} style={s.opt}>
                  <AnswerText right={then === t}>{t}</AnswerText>
                </Answer>
              ))}
            </View>
          ) : null}
          {id === 'doors' ? (
            <View style={{ gap: 8 }}>
              {WAYS.map(([v, t, sub]) => (
                <Answer key={t} sel={pause === v} right={pause === v} onPress={() => setPause(v)} style={s.opt}>
                  <View style={{ gap: 2 }}>
                    <AnswerText right={pause === v}>{t}</AnswerText>
                    <Text style={[s.sub, { color: pause === v ? '#FFFFFF' : PAPER_INK }]}>{sub}</Text>
                  </View>
                </Answer>
              ))}
            </View>
          ) : null}
          <Button label={w.btn} onPress={main[id]} kind={night ? 'warm' : 'primary'} disabled={id === 'plan' && !then} />
        </Dock>
      )}
    </SceneFrame>
  );
}

const s = StyleSheet.create({
  eb: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 6 },
  ebT: { fontFamily: font.bodyBold, fontSize: 15, lineHeight: 20 },
  mid0: { textAlign: 'center' },
  name: { gap: 10, marginTop: 14, alignSelf: 'stretch', width: '100%' },
  mid: { flex: 1, justifyContent: 'center', gap: 4 },
  c: { alignItems: 'center' },
  opt: { paddingVertical: 12 },
  sub: { fontFamily: font.body, fontSize: 13, lineHeight: 18 },
});
