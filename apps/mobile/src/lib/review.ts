/* The phone's own rating sheet (expo-store-review): SKStoreReviewController on iPhone, the in-app review on Android. The web
   has none, and neither does a TestFlight build. Apple decides whether the sheet shows at all (at most three times a year),
   so nothing waits on it and nothing changes when it does not come. Asked only after a Yes to "Do you like Daybook so far?"
   at the end of setup (core like.ts). */
import * as StoreReview from 'expo-store-review';

/** asks for the rating sheet; true when the phone can show one (it may still choose not to) */
export async function askStoreReview(): Promise<boolean> {
  try {
    if (!(await StoreReview.isAvailableAsync())) return false;
    if (!(await StoreReview.hasAction())) return false;
    await StoreReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
