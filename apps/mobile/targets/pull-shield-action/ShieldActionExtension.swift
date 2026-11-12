// The pause's two buttons. Open Daybook: Daybook's wait screen is where the apps can open again after the wait. From iOS 26.5 Apple
// can open the app that set the pause (openParentalControlsApp); before that a shield cannot open an app, so a note comes that opens
// the wait screen with one tap. Either way the app is told (pull.want) and opens on the wait screen. Close: back to the Home Screen,
// and one more time the person put it down (Pull.countDown: the shield and the notes say the count).
import Foundation
import ManagedSettings

class ShieldActionExtension: ShieldActionDelegate {
  override func handle(action: ShieldAction, for application: ApplicationToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    answer(action, completionHandler)
  }
  override func handle(action: ShieldAction, for webDomain: WebDomainToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    answer(action, completionHandler)
  }
  override func handle(action: ShieldAction, for category: ActivityCategoryToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    answer(action, completionHandler)
  }

  private func answer(_ action: ShieldAction, _ done: @escaping (ShieldActionResponse) -> Void) {
    guard action == .primaryButtonPressed else {
      if action == .secondaryButtonPressed { Pull.countDown() }
      return done(.close)
    }
    Pull.defaults?.set(Pull.nowMs, forKey: Pull.wantKey)
    if #available(iOS 26.5, *) { return done(.openParentalControlsApp) }
    /* a note a minute apart at most, so tapping the button again does not stack them */
    if let b = Pull.bridge() { Pull.post(b, kind: "open", once: String(Int(Pull.nowMs / 60_000))) }
    done(.close)
  }
}
