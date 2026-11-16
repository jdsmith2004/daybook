/* Friends: the one thing a person writes for friends, their name (core friends.ts normCard). Everything else is automatic
   (the owner, November 15, 2026: "having them write out a bunch of goals is too much"). The box and its button sit together near
   the top, because the keyboard covers the bottom. */
import { NAME_MAX, REPORT_DEFAULT, SHARE_DEFAULT, wordsTrouble } from '@daybook/core';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { Field } from '@/components/choices';
import { closeSheet, SheetFrame } from '@/components/sheet';
import { Button, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { useFriendsReady } from '@/lib/friends';

export default function FriendMe() {
  const fr = useFriendsReady();
  const me = fr.data?.me;
  const [name, setName] = useState(me?.name || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  /* opened on its own, the card comes in a moment later: fill the box with it once */
  const filled = useRef(!!me);
  useEffect(() => {
    if (filled.current || !me) return;
    filled.current = true;
    setName(me.name);
  }, [me]);

  const save = async () => {
    if (!name.trim()) return setErr('Add the name your friends will see.');
    const t = wordsTrouble(name);
    if (t) return setErr(t);
    setBusy(true);
    const e = await fr.saveCard({ name: name.trim(), on: me?.on || SHARE_DEFAULT, rt: me ? me.rt : REPORT_DEFAULT });
    setBusy(false);
    if (e) return setErr(e);
    buzz('save');
    closeSheet();
  };

  return (
    <SheetFrame title="Your name">
      <View style={{ gap: 16 }}>
        <Field
          label="What your friends call you"
          placeholder="A first name or a nickname"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setErr('');
          }}
          maxLength={NAME_MAX}
          autoComplete="given-name"
          autoFocus
          onSubmitEditing={save}
          returnKeyType="done"
        />
        {err ? <T tone="danger">{err}</T> : null}
        <Button label={busy ? 'Saving' : 'Save'} disabled={busy} onPress={save} />
      </View>
    </SheetFrame>
  );
}
