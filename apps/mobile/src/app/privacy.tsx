/* What an account keeps, who can read it, and how to delete it, in plain words. */
import { router } from 'expo-router';

import { closeSheet, SheetFrame, SheetH } from '@/components/sheet';
import { Button, T } from '@/components/ui';

export default function Privacy() {
  return (
    <SheetFrame title="Your account and your privacy" sub="What is kept, who can see it, and how to remove it">
      <SheetH title="Without an account" />
      <T>Everything stays on this device. Nothing about your log leaves it.</T>
      <SheetH title="With an account" />
      <T>
        Your log, your check-ins, your plan and your settings are copied to Daybook's server, so they are safe if you lose your phone and the same on every device you
        sign in on. Your voice note never leaves the phone.
      </T>
      <T>
        Your records are stored under your own account and can only be read with your sign-in. Daybook does not sell, share or show them to anyone, and there are no ads
        or trackers.
      </T>
      <T>Your email is used to sign you in and to reset your password, and for nothing else.</T>
      <SheetH title="Removing it" />
      <T>
        Delete everything (in Settings) clears your log, and your account keeps a copy for a week in case it was a mistake. Delete my account (in Settings › Sync)
        removes your account, that copy and your sign-in for good.
      </T>
      <Button kind="ghost" label="Open Settings" onPress={() => router.push({ pathname: '/settings', params: { open: 's-sync' } })} />
      <Button label="Done" onPress={closeSheet} />
    </SheetFrame>
  );
}
