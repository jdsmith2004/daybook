// The night pack's three actions for Shortcuts (core night-pack.ts; WP21, November 12, 2026). Apple lets only the person make an
// automation, so Daybook hands these over and the person puts each one in an automation of their own (app opened, charger,
// alarm stopped). Each decides by the clock whether to act: by day "Wait first at night" does nothing, so a feed opens as it
// always does. When it acts, it brings Daybook forward and leaves the page to open in UserDefaults; the app takes it on
// becoming active (lib/night-pack.ts). The rule is core `packActs`: keep the two together.
//
// This file is copied into the app target by plugins/night-pack (App Intents must be in the app itself), and it shares
// UserDefaults keys with modules/night-pack. Nothing here names the habit: these names can show on the lock screen.
import AppIntents
import Foundation

enum NightPackStore {
  static let at = "daybook.pack.at"
  static let open = "daybook.pack.open"
  static let route = "daybook.pack.route"
  static let seen = "daybook.pack.seen."
  static let bedNight = "daybook.pack.bedNight"
  static let end = 6 * 60
  static let bedEarly = 60
  static let bedEnd = 4 * 60
  static let wake = (4 * 60, 12 * 60)

  static var d: UserDefaults { .standard }
  /// tonight's start in minutes after midnight, as the app last wrote it; 10:30 PM before it ever has
  static var nightAt: Int { d.object(forKey: at) == nil ? 22 * 60 + 30 : d.integer(forKey: at) }
  static func minute(_ now: Date = Date()) -> Int {
    let c = Calendar.current.dateComponents([.hour, .minute], from: now)
    return (c.hour ?? 0) * 60 + (c.minute ?? 0)
  }
  static func inSpan(_ m: Int, _ from: Int, _ to: Int) -> Bool { from > to ? (m >= from || m < to) : (m >= from && m < to) }
  static func acts(_ kind: String, _ m: Int = minute()) -> Bool {
    let a = nightAt
    switch kind {
    case "wait": return inSpan(m, a, end)
    case "bed": return inSpan(m, (a - bedEarly + 1440) % 1440, bedEnd)
    default: return inSpan(m, wake.0, wake.1)
    }
  }
  /// the night a moment belongs to (the day it started), so Good night opens once a night
  static func nightKey(_ now: Date = Date()) -> String {
    let start = minute(now) < 12 * 60 ? Calendar.current.date(byAdding: .day, value: -1, to: now) ?? now : now
    let c = Calendar.current.dateComponents([.year, .month, .day], from: start)
    return "\(c.year ?? 0)-\(c.month ?? 0)-\(c.day ?? 0)"
  }
  static func mark(_ kind: String, _ path: String) {
    d.set(Date().timeIntervalSince1970 * 1000, forKey: seen + kind)
    d.set(path, forKey: route)
  }
}

@available(iOS 26.0, *)
struct NightPackWaitIntent: AppIntent {
  static let title: LocalizedStringResource = "Wait first at night"
  static let description = IntentDescription("At night, Daybook opens first, with a short wait. By day nothing happens.")
  static let supportedModes: IntentModes = [.background, .foreground(.dynamic)]
  static let isDiscoverable = true

  func perform() async throws -> some IntentResult {
    let open = NightPackStore.d.double(forKey: NightPackStore.open)
    guard NightPackStore.acts("wait"), Date().timeIntervalSince1970 * 1000 >= open else { return .result() }
    NightPackStore.mark("wait", "/pause?pk=1")
    try await continueInForeground(nil, alwaysConfirm: false)
    return .result()
  }
}

@available(iOS 26.0, *)
struct NightPackBedIntent: AppIntent {
  static let title: LocalizedStringResource = "Good night, if it is late"
  static let description = IntentDescription("Late in the evening, Daybook opens Good night. Once a night; at other times nothing happens.")
  static let supportedModes: IntentModes = [.background, .foreground(.dynamic)]
  static let isDiscoverable = true

  func perform() async throws -> some IntentResult {
    let night = NightPackStore.nightKey()
    guard NightPackStore.acts("bed"), NightPackStore.d.string(forKey: NightPackStore.bedNight) != night else { return .result() }
    NightPackStore.d.set(night, forKey: NightPackStore.bedNight)
    NightPackStore.mark("bed", "/night?pk=1")
    try await continueInForeground(nil, alwaysConfirm: false)
    return .result()
  }
}

@available(iOS 26.0, *)
struct NightPackWakeIntent: AppIntent {
  static let title: LocalizedStringResource = "Open the morning"
  static let description = IntentDescription("In the morning, Daybook opens the morning. At other times nothing happens.")
  static let supportedModes: IntentModes = [.background, .foreground(.dynamic)]
  static let isDiscoverable = true

  func perform() async throws -> some IntentResult {
    guard NightPackStore.acts("wake") else { return .result() }
    NightPackStore.mark("wake", "/morning?pk=1")
    try await continueInForeground(nil, alwaysConfirm: false)
    return .result()
  }
}

@available(iOS 26.0, *)
struct NightPackShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(intent: NightPackWaitIntent(), phrases: ["Wait first with \(.applicationName)"], shortTitle: "Wait first at night", systemImageName: "hourglass")
    AppShortcut(intent: NightPackBedIntent(), phrases: ["Good night with \(.applicationName)"], shortTitle: "Good night", systemImageName: "moon")
    AppShortcut(intent: NightPackWakeIntent(), phrases: ["Open the morning in \(.applicationName)"], shortTitle: "Open the morning", systemImageName: "sunrise")
  }
}
