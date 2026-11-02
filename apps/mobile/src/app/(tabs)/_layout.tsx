import AppTabs from '@/components/app-tabs';
import { Welcome } from '@/components/welcome';
import { useStore } from '@/lib/store';

/* Before setup there are no tabs: Today, Pattern, Learn and More all wait behind the page that leads back into the setup, with SOS on it
   (components/welcome.tsx). A link straight to a tab lands there too. */
export default function TabsLayout() {
  const { snap } = useStore();
  if (!snap.settings) return <Welcome />;
  return <AppTabs />;
}
