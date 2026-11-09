/* Settings on a page of its own, for a link that opens it from somewhere else (a lesson, a help page, Today), so Back returns
   there. A link that names a part ("s-count") opens that part's page instead, in place of this one. */
import { Redirect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/screen';
import { partOf, SettingsSections } from '@/components/settings-sections';

export default function Settings() {
  const params = useLocalSearchParams<{ open?: string }>();
  const part = partOf(params.open);
  if (part) return <Redirect href={{ pathname: '/settings/[part]', params: { part } }} />;
  return (
    <Screen title="Settings" back="More">
      <SettingsSections />
    </Screen>
  );
}
