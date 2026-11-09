// The pause's look: Apple draws it over a resting app as a still picture (it cannot count down; the wait is Daybook's own /pause).
// The words are core pullShield's, written by the app: "Resting until 1 AM", the person's own plan, Open Daybook and Close. The
// night sky's colors and the flame, like the wait screen. Never the app's name or the habit.
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
    let w = ((b.map { Pull.quiet($0) } ?? false) ? b?["shieldQuiet"] : b?["shield"]) as? [String: Any]
    let ink = UIColor(red: 0.97, green: 0.95, blue: 1, alpha: 1)
    let soft = UIColor(red: 0.84, green: 0.80, blue: 0.96, alpha: 1)
    let sun = UIColor(red: 1, green: 0.82, blue: 0.36, alpha: 1)
    return ShieldConfiguration(
      backgroundBlurStyle: .systemUltraThinMaterialDark,
      backgroundColor: UIColor(red: 0.11, green: 0.09, blue: 0.29, alpha: 1),
      icon: UIImage(named: "flame"),
      title: .init(text: (w?["title"] as? String) ?? "Resting for now", color: ink),
      subtitle: .init(text: (w?["sub"] as? String) ?? "You asked me to hold this in your hard hours.", color: soft),
      primaryButtonLabel: .init(text: (w?["primary"] as? String) ?? "Open Daybook", color: UIColor(red: 0.2, green: 0.14, blue: 0.02, alpha: 1)),
      primaryButtonBackgroundColor: sun,
      secondaryButtonLabel: .init(text: (w?["secondary"] as? String) ?? "Close", color: ink)
    )
  }
}
