import { router } from 'expo-router';

/** leave a full-screen moment: back to where it was opened, or to Today when it was opened directly (a web link) */
export function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
