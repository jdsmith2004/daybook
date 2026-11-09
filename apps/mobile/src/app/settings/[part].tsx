/* One part of Settings on its own page: the row on the list says how it stands, this page changes it. */
import { Redirect, useLocalSearchParams } from 'expo-router';

import { partOf, SettingsPart } from '@/components/settings-sections';

export default function SettingsPartPage() {
  const { part } = useLocalSearchParams<{ part?: string }>();
  const id = partOf(part);
  if (!id) return <Redirect href="/settings" />;
  return <SettingsPart id={id} />;
}
