/* Go deeper: the fourth mission when a run of 14 days or more can keep going. Trace the slip back to where it started, or
   tell one person. Ported from the legacy SCENES.rktrace and SCENES.rktell. */
import { blankP, changeDay, rkDeep, rkOf, RT_Q, rkTellText, safeName, withDay } from '@daybook/core';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field, Link } from '@/components/choices';
import { Dock, SceneFrame } from '@/components/scene';
import { Button, Card, Chip, T } from '@/components/ui';
import { buzz } from '@/lib/feel';
import { close } from '@/lib/nav';
import { useStore } from '@/lib/store';

export default function Deeper() {
  const { snap, tk, update, say } = useStore();
  const { k, kind } = useLocalSearchParams<{ k: string; kind: 'trace' | 'tell' }>();
  const st = snap.settings;
  const r = st && k ? rkOf(snap.days, k, st) : null;
  const [vals, setVals] = useState<string[]>(() => (r?.ev.rk?.tr ? [...r.ev.rk.tr] : ['', '', '']));
  const [msg, setMsg] = useState('');

  if (!st || !r || !k)
    return (
      <SceneFrame title="Go deeper" onClose={close}>
        <T v="title" style={s.c}>
          That slip is not here anymore.
        </T>
        <T style={s.c}>It may have been removed. Nothing else changed.</T>
        <Dock>
          <Button label="Close" onPress={close} />
        </Dock>
      </SceneFrame>
    );

  if (kind === 'tell') {
    const nm = safeName(st);
    const text = rkTellText(st);
    return (
      <SceneFrame title="Go deeper" sky="violet" onClose={close}>
        <T v="eyebrow" tone="muted">
          Tell someone
        </T>
        <T v="title" style={s.c} accessibilityRole="header">
          {nm ? 'Tell ' + nm : 'Tell one person you trust'}
        </T>
        <T style={s.c}>One honest message. No details needed. A secret gets heavier when you carry it alone.</T>
        <Card style={{ alignSelf: 'stretch' }}>
          <T selectable>{text}</T>
          <View style={{ flexDirection: 'row' }}>
            <Chip
              label="Copy"
              on={false}
              onPress={() =>
                Clipboard.setStringAsync(text)
                  .then(() => say('Copied. Paste it in your messages.'))
                  .catch(() => say('Could not copy. Press and hold the text to copy it.'))
              }
            />
          </View>
        </Card>
        <Dock>
          <Button
            label="I told them"
            onPress={() => {
              update((s) => {
                const days = rkDeep(s.days, s.settings!, k, 'tell');
                if (!days) return s;
                /* telling someone is reaching out, too */
                const day = changeDay(days[tk], tk, (d) => {
                  const p = d.p || blankP();
                  p.r = true;
                  d.p = p;
                });
                return { ...s, days: withDay(days, tk, day) };
              });
              buzz('lit');
              close();
              say('You told someone. That takes real courage.');
            }}
          />
          <Button label="Not now" kind="ghost" onPress={close} />
          <T v="small" tone="muted" style={s.c}>
            Calling counts too, and so does telling them in person.
          </T>
        </Dock>
      </SceneFrame>
    );
  }

  return (
    <SceneFrame title="Go deeper" sky="violet" onClose={close}>
      <T v="eyebrow" tone="muted">
        Trace it back
      </T>
      <T v="title" style={s.c} accessibilityRole="header">
        Walk back from the slip.
      </T>
      <T style={s.c}>A slip is usually the last link in a chain of small choices. A few words for each is plenty.</T>
      {RT_Q.map(([label, ph], i) => (
        <Field
          key={label}
          label={label}
          multiline
          maxLength={200}
          placeholder={ph}
          value={vals[i]}
          onChangeText={(t) => {
            setMsg('');
            setVals((v) => v.map((x, j) => (j === i ? t : x)));
          }}
        />
      ))}
      <T v="small" tone="muted">
        The earliest link is the easiest place to change things next time.
      </T>
      {msg ? (
        <T v="label" tone="danger" accessibilityLiveRegion="polite">
          {msg}
        </T>
      ) : null}
      <Button
        label="Save"
        onPress={() => {
          const clean = vals.map((x) => String(x).replace(/\s+/g, ' ').trim().slice(0, 200));
          if (!clean.some(Boolean)) return setMsg('Write a few words in one of the boxes first.');
          update((s) => ({ ...s, days: rkDeep(s.days, s.settings!, k, 'trace', clean) || s.days }));
          buzz('lit');
          close();
          say('Traced it back. That is the deeper mission done.');
        }}
      />
      <Link label="Not now" onPress={close} />
    </SceneFrame>
  );
}

const s = StyleSheet.create({ c: { textAlign: 'center' } });
