/* On the web, the log lives in the browser. On an iPhone or iPad every browser uses Safari's engine, which clears a
   site's storage after about a week of browsing with no visit to it; a web app added to the Home Screen is spared. So,
   while Daybook is open in a phone's browser tab: one plain line where the account is offered (STORAGE_LINE), and once,
   a card with the two taps to add it to the Home Screen. Nothing is locked; the person is told. */
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Icon, T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

const KEY = 'daybook.homeScreen';
const ua = () => (typeof navigator === 'undefined' ? '' : navigator.userAgent || '');
const ios = () => /iPhone|iPad|iPod/.test(ua()) || (/Macintosh/.test(ua()) && typeof document !== 'undefined' && 'ontouchend' in document);
const phone = () => ios() || /Android/.test(ua());
/** opened from the Home Screen, not in a browser tab */
function standalone(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}
const atRisk = ios() && !standalone();

/** the line, where it applies ('' elsewhere) */
export const STORAGE_LINE = atRisk
  ? 'On an iPhone, a browser can clear a site’s storage after a week away. Add Daybook to your Home Screen, or make a free account, to keep your log safe.'
  : '';

function seen(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function HomeScreenCard() {
  const c = useTheme();
  const [done, setDone] = useState(seen);
  if (done || !phone() || standalone()) return null;
  const steps = ios()
    ? ['Tap the Share button in the browser’s bar.', 'Tap Add to Home Screen, then Add.']
    : ['Tap the browser’s menu (the three dots).', 'Tap Add to Home screen, or Install app.'];
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="phone" size={22} color={c.accentText} />
        <T v="label" style={{ flex: 1 }}>
          Put Daybook on your Home Screen
        </T>
      </View>
      <T v="small">It opens like an app, one tap away when an urge hits{ios() ? ', and your log is kept safe from the browser clearing it' : ''}.</T>
      {steps.map((x, i) => (
        <T key={i} v="small">{`${i + 1}. ${x}`}</T>
      ))}
      <Button
        kind="ghost"
        label="Got it"
        onPress={() => {
          try {
            window.localStorage.setItem(KEY, '1');
          } catch {
            /* the card simply shows again */
          }
          setDone(true);
        }}
      />
    </Card>
  );
}
