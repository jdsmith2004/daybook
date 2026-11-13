/* Get help: if it is hard right now (SOS, the safe person, and the free lines for where the phone is: core crisis.ts), then where to start.
   Ported from the legacy helpHome and nowCard. */
import { HELP_PAGES, faithOut, safeName, type HelpPage } from '@daybook/core';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Link } from '@/components/choices';
import { Fine, NumRow } from '@/components/help-bits';
import { LinkCard, Rows } from '@/components/link-card';
import { Screen } from '@/components/screen';
import { Button, Card, T } from '@/components/ui';
import { useCrisis } from '@/lib/crisis';
import { useStore } from '@/lib/store';

const msg = () => router.push({ pathname: '/tool/[id]', params: { id: 'message' } });

export default function HelpHome() {
  const { snap } = useStore();
  const nm = safeName(snap.settings);
  const { line, text } = useCrisis();
  const pages = (Object.keys(HELP_PAGES) as HelpPage[]).filter((k) => k !== 'plan' && k !== 'playbook' && !(k === 'faith' && faithOut(snap.settings)));
  return (
    <Screen title="Get help" back="More">
      <Card>
        <T v="h2">If it is hard right now</T>
        <T>Tap SOS to breathe, then pick one thing to try. Or reach a person{nm ? ', starting with ' + nm : ''}.</T>
        <View style={{ gap: 4 }}>
          <Button kind="danger" icon="life" label="SOS: I am having an urge" onPress={() => router.push('/sos')} />
          <View style={{ alignItems: 'center' }}>
            <Link label={nm ? 'Text ' + nm : 'Reach a person'} onPress={msg} />
          </View>
        </View>
        <T>
          {text ? 'The two lines below are free' : 'The line below is free'}, at any hour, and open to anyone who is struggling, not only to people thinking
          about suicide.
        </T>
        <View>
          <NumRow name={line.name} num={line.num} note={line.how + '. ' + line.sub} copy={line.dial} />
          {text ? <NumRow name={text.name} num={text.num} note={text.how + '. ' + text.sub} copy={text.num} /> : null}
        </View>
        <T v="small">
          {line.region === 'us' || line.region === 'ca'
            ? 'A 988 counselor starts by asking if you are safe. Answer honestly, then say what is going on.'
            : 'Say what is going on, in your own words.'}{' '}
          For example: “I am having a strong urge and I want to talk.”
        </T>
      </Card>
      <T v="h2" accessibilityRole="header" style={{ marginTop: 8, marginBottom: -8 }}>
        Where to start
      </T>
      <Rows>
        {pages.map((k) => {
          const p = HELP_PAGES[k];
          return <LinkCard key={k} icon={p.ic} title={p.t} sub={p.tile} onPress={() => router.push({ pathname: '/help/[id]', params: { id: k } })} />;
        })}
      </Rows>
      <Fine>
        Daybook is a self-tracking tool, not medical care or a replacement for it.{' '}
        <T
          v="small"
          tone="accentText"
          style={{ textDecorationLine: 'underline' }}
          onPress={() => router.push({ pathname: '/help/[id]', params: { id: 'sources' } })}>
          Sources and when I checked
        </T>
      </Fine>
    </Screen>
  );
}
