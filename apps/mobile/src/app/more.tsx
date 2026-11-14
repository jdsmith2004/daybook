/* More was a tab until November 13, 2026; it is Settings now, behind the gear on every tab. An old link lands there. */
import { Redirect } from 'expo-router';

export default function More() {
  return <Redirect href="/settings" />;
}
