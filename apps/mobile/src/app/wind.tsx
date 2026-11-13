/* The wind-down is Good night now (docs/review-plan.md C3, WP5): every way in leads to one page, app/night.tsx. */
import { Redirect } from 'expo-router';

export default function Wind() {
  return <Redirect href="/night" />;
}
