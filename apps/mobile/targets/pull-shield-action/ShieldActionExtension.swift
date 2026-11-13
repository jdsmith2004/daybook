// The wait's two buttons. The first ("Wait 10 seconds"): Daybook's wait screen is where the apps can open again after the wait. From iOS 26.5 Apple
// can open the app that set the pause (openParentalControlsApp); before that a shield cannot open an app, so a note comes that opens
// the wait screen with one tap. Either way the app is told (pull.want) and opens on the wait screen. Close: back to the Home Screen,
// and one more time the person put it down (Pull.countDown: the shield and the notes say the count).
// Over a site in the night (if Apple shows Daybook's shield there rather than its own page: the device script finds out), the
// first button is the long wait: the app opens /pause?w=long.
import Foundation
import ManagedSettings

class ShieldActionExtension: ShieldActionDelegate {
  override func handle(action: ShieldAction, for application: ApplicationToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    answer(action, web: false, completionHandler)
  }
  override func handle(action: ShieldAction, for webDomain: WebDomainToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    answer(action, web: Pull.filtered(webDomain), completionHandler)
  }
  override func handle(action: ShieldAction, for category: ActivityCategoryToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    answer(action, web: false, completionHandler)
  }

  private func answer(_ action: ShieldAction, web: Bool, _ done: @escaping (ShieldActionResponse) -> Void) {
    guard action == .primaryButtonPressed else {
      if action == .secondaryButtonPressed { Pull.countDown() }
      return done(.close)
    }
    let b = Pull.bridge()
    let long = web && (b.map { Pull.inNight($0) && Pull.wanted($0).web } ?? false)
    Pull.defaults?.set(Pull.nowMs, forKey: Pull.wantKey)
    Pull.defaults?.set(long, forKey: Pull.wantLongKey)
    if #available(iOS 26.5, *) { return done(.openParentalControlsApp) }
    /* a note a minute apart at most, so tapping the button again does not stack them */
    if let b = b { Pull.post(b, kind: long ? "openLong" : "open", once: String(Int(Pull.nowMs / 60_000))) }
    done(.close)
  }
}
