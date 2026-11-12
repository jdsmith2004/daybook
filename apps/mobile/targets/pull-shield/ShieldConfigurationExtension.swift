// The wait's look: Apple draws it over a picked app as a still picture (it cannot count down; the wait is Daybook's own /pause).
// The words are core pullShield's, written by the app. By day, "A short wait first". In the night, what the person set up that
// morning, in their own words ("You set this up this morning", their reason quoted); in the quiet after a slip, the same with no
// stakes. Once they have put it down, how many times ("You have put it down 6 times. Close it, and that makes 7."), read live
// here. The night sky's colors and the flame, like the wait screen. Never the app's name or the habit.
import ManagedSettings
import ManagedSettingsUI
import UIKit

class ShieldConfigurationExtension: ShieldConfigurationDataSource {
  override func configuration(shielding application: Application) -> ShieldConfiguration { look() }
  override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration { look() }
  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration { look() }
  override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration { look() }

  private func look() -> ShieldConfiguration {
    let b = Pull.bridge()
    let night = b.map { Pull.inNight($0) } ?? false
    let quiet = b.map { Pull.quiet($0) } ?? false
    let w = (night ? (quiet ? b?["shieldQuiet"] : b?["shieldNight"]) : b?["shield"]) as? [String: Any]
    /* "this morning" only when the app wrote it today; an older bridge says it plainly */
    let fresh = b.map { ($0["day"] as? String) == Pull.logDay($0) } ?? false
    let title = night && !fresh ? "Tonight is set" : ((w?["title"] as? String) ?? "A short wait first")
    let ink = UIColor(red: 0.97, green: 0.95, blue: 1, alpha: 1)
    let soft = UIColor(red: 0.84, green: 0.80, blue: 0.96, alpha: 1)
    let sun = UIColor(red: 1, green: 0.82, blue: 0.36, alpha: 1)
    return ShieldConfiguration(
      backgroundBlurStyle: .systemUltraThinMaterialDark,
      backgroundColor: UIColor(red: 0.11, green: 0.09, blue: 0.29, alpha: 1),
      icon: UIImage(named: "flame"),
      title: .init(text: title, color: ink),
      subtitle: .init(text: sub(w), color: soft),
      primaryButtonLabel: .init(text: (w?["primary"] as? String) ?? "Open Daybook", color: UIColor(red: 0.2, green: 0.14, blue: 0.02, alpha: 1)),
      primaryButtonBackgroundColor: sun,
      secondaryButtonLabel: .init(text: (w?["secondary"] as? String) ?? "Close", color: ink)
    )
  }

  private func sub(_ w: [String: Any]?) -> String {
    let n = Pull.downs
    if n > 0, let t = w?["subDowns"] as? String { return Pull.fill(t, n) }
    return (w?["sub"] as? String) ?? "You asked me for a moment before this one."
  }
}
