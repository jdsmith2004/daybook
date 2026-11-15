/* The phone's own rating sheet (expo-store-review): SKStoreReviewController on iPhone, the in-app review on Android. The web
   has none, and neither does a TestFlight build. Apple decides whether the sheet shows at all (at most three times a year),
   so nothing waits on it and nothing changes when it does not come. Asked only after a Yes to "Do you like Daybook so far?",
   which rides on the moments of earned value until the person says Yes (core like.ts, components/like-ask.tsx). On the web it
   only notes in the console that the sheet would open, so the Yes path can be checked there. */
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

/** asks for the rating sheet; true when the phone can show one (it may still choose not to) */
export async function askStoreReview(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.info('[review] Yes to "Do you like Daybook so far?": the phone would open its rating sheet here');
    return false;
  }
  try {
    if (!(await StoreReview.isAvailableAsync())) return false;
    if (!(await StoreReview.hasAction())) return false;
    await StoreReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
