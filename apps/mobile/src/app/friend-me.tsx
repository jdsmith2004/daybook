/* Friends: the name and goals a person writes for friends (core friends.ts normCard). Goals are about living well and using
   Daybook, never the habit; the examples say so without a word about it. The boxes and their button sit together near the top,
   because the keyboard covers the bottom. next: the sheet to open after saving (add: your code; code: entering one). */
import { GOAL_MAX, GOALS_MAX, NAME_MAX, wordsTrouble } from '@daybook/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Field } from '@/components/choices';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useFriends } from '@/lib/friends';

const EXAMPLES = ['A lesson every morning', 'Phone out of the bedroom at night', 'More time outside with people I love'];

export default function FriendMe() {
  const p = useLocalSearchParams<{ next?: string; code?: string }>();
  const fr = useFriends();
  const me = fr.data?.me;
  const [name, setName] = useState(me?.name || '');
  const [goals, setGoals] = useState<string[]>(() => [...(me?.goals || []), '', '', ''].slice(0, GOALS_MAX));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const trouble = wordsTrouble(name) || goals.map(wordsTrouble).find(Boolean) || null;

  const save = async () => {
    if (!name.trim()) return setErr('Add the name your friends will see.');
    if (trouble) return setErr(trouble);
    setBusy(true);
    const e = await fr.saveCard({ name: name.trim(), goals: goals.map((g) => g.trim()).filter(Boolean), on: me?.on || {} });
    setBusy(false);
    if (e) return setErr(e);
    buzz('save');
    if (p.next === 'add') router.replace('/friend-add');
    else if (p.next === 'code') router.replace({ pathname: '/friend-code', params: p.code ? { code: p.code } : {} });
    else closeSheet();
  };

  return (
    <SheetFrame title={me ? 'For your friends' : 'First, for your friends'}>
      <View style={{ gap: 16 }}>
        <Field label="Your name" placeholder="A first name or a nickname" value={name} onChangeText={setName} maxLength={NAME_MAX} autoComplete="given-name" />
        <View style={{ gap: 8 }}>
          <T v="label">What you are working on</T>
          {goals.map((g, i) => (
            <Field
              key={i}
              label={'Goal ' + (i + 1)}
              hideLabel
              placeholder={EXAMPLES[i]}
              value={g}
              maxLength={GOAL_MAX}
              onChangeText={(v) => setGoals((x) => x.map((y, j) => (j === i ? v : y)))}
            />
          ))}
        </View>
        {err ? <T tone="danger">{err}</T> : null}
        <Button label={busy ? 'Saving' : p.next ? 'Next' : 'Save'} disabled={busy} onPress={save} />
      </View>
    </SheetFrame>
  );
}
