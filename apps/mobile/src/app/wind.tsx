/* The wind-down is part of Bedtime now (app/bedtime.tsx, October 25, 2026): Goodnight on time is the wind-down. A reminder
   or a link left on it opens Bedtime. */
import { Redirect } from 'expo-router';

export default function Wind() {
  return <Redirect href="/bedtime" />;
}
