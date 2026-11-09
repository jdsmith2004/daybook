/* Unlocked (core unlock.ts; the owner, November 9, 2026): a part that waited out of the setup, opened on its own page once the
   person has used the app a while. The flame pops in on its burst, says what the part is for, and the one thing to do sits
   low. Opening the page is enough to put Today's card away; the part then lives where it always lives.

   - the journal: on the night sky, like the journal itself. Write the first one opens a new entry; a quiet link puts it on the
     day as an any-time stop.
   - the apps that pull you in (Screen Time, iPhone only, core pull.ts): the two ways low (nudges by default, the pause only
     by choice), and Choose the apps opens Apple's ask, then Apple's own list. It is all in More, too. */
import { gameCompute, setField, setRoutine, UNLOCK_ORDER, UNLOCK_WORDS, type UnlockId } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Field, Link } from '@/components/choices';
import { Answer, AnswerText } from '@/components/lesson-parts';
import { Bubble } from '@/components/lesson-flame';
import { Dock, Finish, SceneFrame } from '@/components/scene';
import { Button, Icon, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { PULL_DENIED, pullStart, setPullPrefs } from '@/lib/pull';
import { useStore } from '@/lib/store';
import { PAPER_INK } from '@/lib/lesson-look';
import { font, nightInk, useTheme, type Sky } from '@/lib/theme';
import { useUnlockMark } from '@/lib/unlock';

/* each part on its own sky: the journal on the night, like the journal itself; Planning a slip? in its violet */
const SKY: Record<UnlockId, Sky> = { journal: 'night', plan: 'violet', person: 'coral', pull: 'sky', reach: 'mint', sunday: 'sun' };

const WAYS: [boolean, string, string][] = [
  [false, 'Nudge me', 'A note after two hours, and in your hard hours'],
  [true, 'Nudge me, then pause it', 'If I nudge twice in your hard hours, the app rests until they end'],
];

export default function Unlocked() {
  const { id: raw } = useLocalSearchParams<{ id?: string }>();
  const { s: sun } = useLocalSearchParams<{ s?: string }>();
  const id: UnlockId = UNLOCK_ORDER.includes(raw as UnlockId) ? (raw as UnlockId) : 'journal';
  const w = UNLOCK_WORDS[id];
  const { snap, tk, apply, say } = useStore();
  const mark = useUnlockMark();
  const c = useTheme();
  const st = snap.settings;
  const level = st ? Math.max(1, gameCompute(snap.days, st, snap.reviews, tk).level.n) : 1;
  const night = id === 'journal';
  const sky = SKY[id];
  const [name, setName] = useState('');
  const ink = night ? nightInk.ink : undefined;
  const soft = night ? nightInk.muted : undefined;
  const [pause, setPause] = useState(false);
  const asking = useRef(false);

  useEffect(() => {
    buzz('lit');
    mark.opened(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const write = () => router.replace({ pathname: '/journal', params: { new: '1' } });
  const onDay = () => {
    if (st) apply({ st: setRoutine(st, 'journal', true) });
    say('It is on your day now.');
    close();
  };
  const onReach = () => {
    if (st) apply({ st: setRoutine(st, 'reach', true) });
    buzz('lit');
    say('It is on your day now.');
    close();
  };
  const saveName = () => {
    const v = name.trim().slice(0, 80);
    if (!v || !st) return;
    apply({ st: setField(st, 'safePerson', v) });
    buzz('lit');
    say('Kept in My plan.');
    close();
  };
  const main: Record<UnlockId, () => void> = {
    journal: write,
    plan: () => router.replace('/talk'),
    person: saveName,
    pull: () => void choose(),
    reach: onReach,
    sunday: () => (sun ? router.replace({ pathname: '/review', params: { s: sun } }) : close()),
  };
  const choose = async () => {
    if (asking.current) return;
    asking.current = true;
    const r = await pullStart().catch(() => 'closed' as const);
    asking.current = false;
    if (r === 'denied') say(PULL_DENIED);
    if (r !== 'on') return;
    setPullPrefs({ pause });
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
        {w.title}
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
          {id === 'pull' ? (
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
          <Button label={w.btn} onPress={main[id]} kind={night ? 'warm' : 'primary'} />
          {id === 'journal' ? (
            <View style={s.c}>
              <Link label="Put it on my day" onPress={onDay} color={nightInk.ink} />
            </View>
          ) : null}
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
