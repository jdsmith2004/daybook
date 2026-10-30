/* Get help: if it is hard right now (SOS, the safe person, 988 and the Crisis Text Line), then where to start.
   Ported from the legacy helpHome and nowCard. */
import { HELP_PAGES, safeName, type HelpPage } from '@daybook/core';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Link } from '@/components/choices';
import { Fine, NumRow } from '@/components/help-bits';
import { LinkCard, Rows } from '@/components/link-card';
import { Screen } from '@/components/screen';
import { Button, Card, T } from '@/components/ui';
import { useStore } from '@/lib/store';

const msg = () => router.push({ pathname: '/tool/[id]', params: { id: 'message' } });

export default function HelpHome() {
  const { snap } = useStore();
  const nm = safeName(snap.settings);
  const pages = (Object.keys(HELP_PAGES) as HelpPage[]).filter((k) => k !== 'plan' && k !== 'playbook');
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
        <T>The two lines below are free, at any hour, and open to anyone who is struggling, not only to people thinking about suicide.</T>
        <View>
          <NumRow
            name="988 Suicide & Crisis Lifeline"
            num="988"
            note="Call or text, 24/7. Suicide and crisis support, and open to anyone who is struggling or needs to talk."
            copy="988"
          />
          <NumRow name="Crisis Text Line" num="741741" note="Text HOME, free, 24/7. For whatever you are going through." copy="741741" />
        </View>
        <T v="small">
          A 988 counselor starts by asking if you are safe. Answer honestly, then say what is going on. For example: “I am having a strong urge and I want to
          talk.”
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
