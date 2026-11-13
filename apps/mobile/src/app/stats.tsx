/* Stats is the owner's page, so it is not in the store bundle: it is here in development builds only (the production build drops the
   require below with the dead branch). The owner reads the totals with the stats workflow instead (docs/launch.md). */
import { Redirect } from 'expo-router';
import type React from 'react';

export default function StatsRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stats = require('@/components/stats-page').default as () => React.ReactElement;
  return <Stats />;
}
