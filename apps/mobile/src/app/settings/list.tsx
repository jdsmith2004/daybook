/* One Screen Time list on its own page (Settings, Screen Time, Your lists; core pull.ts): its apps from Apple's own list, its
   wait, its name, and Remove. A shorter wait, No wait or removing it waits for 6 AM unless it is the morning (loosen slowly,
   tighten at once); the page says when. Daybook never learns which apps are in it: only how many. */
import { fmtClock, PULL_LIST_NAMES, PULL_NIGHT_END, PULL_WAIT, pullShown, pullWaitLabel, type PullListId } from '@daybook/core';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/screen';
import { SetGroup, SetPick, SetRow } from '@/components/settings-ui';
import { Icon } from '@/components/ui';
import { pullListSet, pullPick, usePullPicked, usePullPrefs } from '@/lib/pull';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function PullListPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { say } = useStore();
  const c = useTheme();
  const p = usePullPrefs();
  const shown = pullShown(p).lists;
  const l = shown.find((x) => x.id === id);
  const picked = usePullPicked(l ? [l.id] : []);
  if (!p.on || !l) return <Redirect href="/settings/pull" />;
  const lid = l.id as PullListId;
  const morning = 'Looser settings start in the morning. This one starts at ' + fmtClock(PULL_NIGHT_END) + '.';
  /* the wait it has now, when a looser one is waiting for the morning */
  const now = p.lists.find((x) => x.id === lid);
  const waiting = now && now.wait !== l.wait ? 'It waits ' + pullWaitLabel(now.wait) + ' until ' + fmtClock(PULL_NIGHT_END) + '.' : undefined;
  const n = picked[lid];
  return (
    <Screen title={l.name} back="Screen Time" icon={<Icon name="phone" size={30} color={c.accentText} />}>
      <View style={{ gap: 28 }}>
        <SetGroup foot="Apple keeps the list, and nothing about your apps leaves this phone.">
          <SetRow
            label="Change the apps"
            value={n != null ? n + ' picked' : undefined}
            onPress={async () => {
              const at = await pullPick(lid);
              if (at) say('The apps you took out still wait until ' + fmtClock(PULL_NIGHT_END) + '. Looser settings start in the morning.');
            }}
          />
        </SetGroup>
        <SetGroup head="The wait" foot={waiting ?? 'Before each app in this list opens. After it, you choose how long it opens.'}>
          <SetPick
            options={PULL_WAIT.map((w) => [w, pullWaitLabel(w)] as const)}
            value={l.wait}
            onPick={(w) => {
              if (pullListSet(lid, { wait: w })) say(morning);
            }}
          />
        </SetGroup>
        <SetGroup head="Call it">
          <SetPick options={PULL_LIST_NAMES.map((x) => [x, x] as const)} value={l.name} onPick={(name) => pullListSet(lid, { name })} />
        </SetGroup>
        {shown.length > 1 ? (
          <SetGroup>
            <SetRow
              label="Remove this list"
              act="danger"
              onPress={() => {
                const at = pullListSet(lid, null);
                say(at ? 'Its apps still wait until ' + fmtClock(PULL_NIGHT_END) + ', then the list is gone.' : 'The list is gone.');
                router.back();
              }}
            />
          </SetGroup>
        ) : null}
      </View>
    </Screen>
  );
}
