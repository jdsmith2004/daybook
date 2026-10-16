import { router } from 'expo-router';

/** leave a full-screen moment (legacy closeScene): back to the tabs, with every screen above them closed.
    Opened directly (a web link), it goes to Today. */
export function close() {
  if (router.canDismiss()) router.dismissAll();
  else if (router.canGoBack()) router.back();
  else router.replace('/');
}
