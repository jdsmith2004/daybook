/* The way to a person, under anything that went wrong (the premium pass, October 26, 2026): one quiet line, the same on
   every screen, with the support email to tap. A failure that ends with a calm next step and a real address builds more
   trust than one that never happened. */
import { SUPPORT_EMAIL } from '@daybook/core';
import { ActivityIndicator, Linking } from 'react-native';

import { T } from '@/components/ui';
import { useTheme } from '@/lib/theme';

/** opens a new email to support, with a subject that says where it came from */
export function writeToUs(subject = 'Daybook help') {
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`).catch(() => undefined);
}

/** "Still stuck? Write to …", the email tappable. lead: other words before it ("Your log is safe on this phone.") */
export function HelpLine({ lead, subject, center }: { lead?: string; subject?: string; center?: boolean }) {
  return (
    <T v="small" tone="muted" style={center ? { textAlign: 'center' } : undefined}>
      {lead ? lead + ' ' : ''}Still stuck? Write to{' '}
      <T v="small" tone="accentText" accessibilityRole="link" onPress={() => writeToUs(subject)}>
        {SUPPORT_EMAIL}
      </T>
      .
    </T>
  );
}

/** the one small spinner, in the accent color */
export function Busy({ label }: { label?: string }) {
  const c = useTheme();
  return <ActivityIndicator size="small" color={c.accent} accessibilityLabel={label || 'Working'} />;
}
