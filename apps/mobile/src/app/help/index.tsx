/* Get help: if it is hard right now (SOS, the safe person, 988 and the Crisis Text Line), then where to start.
   Ported from the legacy helpHome and nowCard. */
import { HELP_PAGES, safeName, type HelpPage } from '@daybook/core';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Fine, NumRow } from '@/components/help-bits';
import { LinkCard } from '@/components/link-card';
import { Screen } from '@/components/screen';
import { Button, Card, Icon, T } from '@/components/ui';
import { useStore } from '@/lib/store';
import { font, toneOf, useTheme } from '@/lib/theme';

const msg = () => router.push({ pathname: '/tool/[id]', params: { id: 'message' } });

export default function HelpHome() {
  const c = useTheme();
  const { snap } = useStore();
  const nm = safeName(snap.settings);
  const pages = (Object.keys(HELP_PAGES) as HelpPage[]).filter((k) => k !== 'plan' && k !== 'playbook');
  return (
    <Screen title="Get help" sub={<T tone="muted">People, therapy, groups, and phone setup. Pick one.</T>} back="More">
      <Card style={{ backgroundColor: c.sosSoft, borderColor: c.sosSoft }}>
        <T v="h2">If it is hard right now</T>
        <T>
          Tap SOS for one thing to try. Or reach a person, {nm ? 'starting with your safe person, ' : ''}free, at any hour. The two lines below are open to anyone who is struggling, not only to people
          thinking about suicide.
        </T>
        {nm ? <LinkCard icon="chat" title={'Text ' + nm} sub="Your safe person · texts ready to copy" onPress={msg} /> : null}
        <View>
          <NumRow name="988 Suicide & Crisis Lifeline" num="988" note="Call or text, 24/7. Suicide and crisis support, and open to anyone who is struggling or needs to talk." copy="988" />
          <NumRow name="Crisis Text Line" num="741741" note="Text HOME, free, 24/7. For whatever you are going through." copy="741741" />
        </View>
        <T v="small">
          A 988 counselor starts by asking if you are safe. Answer honestly, then say what is going on. For example: “I am having a strong urge and I want to talk.”
        </T>
        <View style={{ gap: 8 }}>
          <Button
            icon="life"
            label="SOS: I'm having an urge"
            onPress={() => router.push('/sos')}
          />
          <Button kind="ghost" icon="chat" label="Reach a person" onPress={msg} />
        </View>
      </Card>
      <View style={s.between}>
        <T v="h2">Where to start</T>
        <T v="small" tone="muted">
          tap one
        </T>
      </View>
      <View style={s.grid}>
        {pages.map((k) => {
          const p = HELP_PAGES[k];
          const t = toneOf(c, p.tone);
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/help/[id]', params: { id: k } })}
              style={({ pressed }) => [s.tile, { backgroundColor: c.surface, borderColor: c.cardEdge, opacity: pressed ? 0.85 : 1 }]}>
              <View style={[s.ic, { backgroundColor: t.soft }]}>
                <Icon name={p.ic} size={22} color={t.text} />
              </View>
              <T v="label" style={{ fontFamily: font.bodyBold }}>
                {p.t}
              </T>
              <T v="small" tone="muted">
                {p.tile}
              </T>
            </Pressable>
          );
        })}
      </View>
      <Fine>
        Daybook is a self-tracking tool, not medical care or a replacement for it.{' '}
        <T v="small" tone="accentText" style={{ textDecorationLine: 'underline' }} onPress={() => router.push({ pathname: '/help/[id]', params: { id: 'sources' } })}>
          Sources and when I checked
        </T>
      </Fine>
    </Screen>
  );
}

const s = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexGrow: 1, flexBasis: '45%', gap: 6, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  ic: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
