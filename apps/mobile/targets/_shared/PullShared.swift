// The app that pulls you in (Screen Time): what the three extensions share. The main app writes core pullBridge's JSON and the
// picked apps into the App Group; the extensions only read them, decide, and keep a few small marks of their own. Apple's license
// keeps all of it on this phone: nothing here touches the network.
//
// The keys and their meaning are the same as in modules/daybook-pull/ios/DaybookPullModule.swift (the main app's side).
// Keep these extensions tiny: the monitor has about 6 MB of memory.
import FamilyControls
import Foundation
import ManagedSettings
import UserNotifications

enum Pull {
  static let group = "group.com.jdsmith2004.daybook"
  static let bridgeKey = "pull.bridge"
  static let selectionKey = "pull.selection"
  /// ms until the pause runs (the end of tonight's hard hours); 0 when nothing rests
  static let restKey = "pull.rest"
  /// ms when the hard hours' notes were ignored (core pullDrift)
  static let ignoredKey = "pull.ignored"
  /// ms when a shield's button asked for Daybook (the app opens its wait screen)
  static let wantKey = "pull.want"
  /// the notes already posted, kind to the log day or window they were for (one of each, no repeats)
  static let postedKey = "pull.posted"
  /// ms when the app last started each schedule, by its name. Apple counts use only from then, and a threshold can come early
  /// right after a start (iOS 17 to 26), so one that comes sooner than its minutes after this is ignored.
  static let startedKey = "pull.started"
  /// ms when Open it for a few minutes started pull.open, and those minutes
  static let openAtKey = "pull.openAt"
  static let openMinsKey = "pull.openMins"
  /// pull.open lasts this long (the app's openSchedule)
  static let openSpan: Double = 20 * 60_000
  static let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("daybook.pull"))

  static var defaults: UserDefaults? { UserDefaults(suiteName: group) }
  static var nowMs: Double { Date().timeIntervalSince1970 * 1000 }

  /// what the app last wrote, as plain JSON (small: words and numbers only)
  static func bridge() -> [String: Any]? {
    CFPreferencesAppSynchronize(group as CFString)
    guard let s = defaults?.string(forKey: bridgeKey), let d = s.data(using: .utf8) else { return nil }
    return (try? JSONSerialization.jsonObject(with: d)) as? [String: Any]
  }

  static func selection() -> FamilyActivitySelection? {
    guard let d = defaults?.data(forKey: selectionKey) else { return nil }
    return try? JSONDecoder().decode(FamilyActivitySelection.self, from: d)
  }

  /// the log day it is now, as core logicalKey: the calendar day of (now - rollover hours)
  static func logDay(_ b: [String: Any], at date: Date = Date()) -> String {
    let roll = (b["rollover"] as? Double) ?? 4
    let d = date.addingTimeInterval(-roll * 3600)
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: d)
  }

  static func prefs(_ b: [String: Any]) -> [String: Any] { (b["prefs"] as? [String: Any]) ?? [:] }

  static func quiet(_ b: [String: Any]) -> Bool {
    guard let q = b["quietUntil"] as? Double else { return false }
    return nowMs < q
  }

  /// core pullNoteFor, the same rule: which note goes for a threshold ("long", or the hard hours' 1 and 2), or nil
  static func noteFor(_ b: [String: Any], kind: String) -> String? {
    let p = prefs(b)
    let q = quiet(b)
    let opened = (b["day"] as? String) == logDay(b)
    if kind == "long" {
      if q || ((p["long"] as? Int) ?? 0) == 0 { return nil }
      return opened && ((b["lessonDone"] as? Bool) ?? false) ? "longDone" : "long"
    }
    if (p["hard"] as? Bool) == false { return nil }
    if q { return kind == "1" ? "quiet" : nil }
    if kind == "1" { return "hard1" }
    if kind == "2" { return (p["pause"] as? Bool) == true ? "hard2Pause" : "hard2" }
    return nil
  }

  /// posts one of the bridge's notes, once per `once` key (a log day or a window). Only the screen to open travels with it:
  /// no id, so nothing about it is ever counted.
  static func post(_ b: [String: Any], kind: String, once: String) {
    guard let notes = b["notes"] as? [String: Any], let n = notes[kind] as? [String: Any] else { return }
    var posted = (defaults?.dictionary(forKey: postedKey) as? [String: String]) ?? [:]
    if posted[kind] == once { return }
    posted[kind] = once
    defaults?.set(posted, forKey: postedKey)
    let c = UNMutableNotificationContent()
    c.title = (n["t"] as? String) ?? ""
    c.body = (n["b"] as? String) ?? ""
    c.sound = .default
    if let url = n["url"] as? String { c.userInfo = ["url": url] }
    let r = UNNotificationRequest(identifier: "daybook.pull." + kind + "." + once, content: c, trigger: nil)
    UNUserNotificationCenter.current().add(r)
  }

  /// rest the picked apps (the pause), until `until` ms
  static func rest(until: Double) {
    guard let s = selection() else { return }
    defaults?.set(until, forKey: restKey)
    shield(s)
  }

  static func shield(_ s: FamilyActivitySelection) {
    store.shield.applications = s.applicationTokens.isEmpty ? nil : s.applicationTokens
    store.shield.applicationCategories = s.categoryTokens.isEmpty ? nil : .specific(s.categoryTokens)
    store.shield.webDomains = s.webDomainTokens.isEmpty ? nil : s.webDomainTokens
  }

  static func lift() {
    defaults?.set(0.0, forKey: restKey)
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
  }

  static var resting: Bool { ((defaults?.double(forKey: restKey)) ?? 0) > nowMs }

  /// ms when the app last started this schedule, or 0
  static func started(_ name: String) -> Double {
    ((defaults?.dictionary(forKey: startedKey) as? [String: Double]) ?? [:])[name] ?? 0
  }

  /// whether a threshold of `minutes` of use is real: that many minutes have passed since `from` ms (less half a minute)
  static func enoughSince(_ from: Double, minutes: Double) -> Bool {
    nowMs - from >= (minutes - 0.5) * 60_000
  }

  /// "pull.hard.<weekday>.<hour>": the window's weekday (1 Sunday) and starting hour
  static func hardParts(_ name: String) -> (Int, Int)? {
    let p = name.split(separator: ".")
    guard p.count == 4, p[0] == "pull", p[1] == "hard", let wd = Int(p[2]), let h = Int(p[3]) else { return nil }
    return (wd, h)
  }

  /// the window starting at hour `h`: its latest start not in the future, and its end at the clock's h+2 (so a night the clocks
  /// change ends when Apple's schedule does)
  static func window(hour h: Int, at now: Date = Date()) -> (start: Date, end: Date)? {
    let cal = Calendar.current
    guard var start = cal.date(bySettingHour: h, minute: 0, second: 0, of: now) else { return nil }
    if start > now { start = cal.date(byAdding: .day, value: -1, to: start) ?? start }
    let endDay = h + 2 >= 24 ? (cal.date(byAdding: .day, value: 1, to: start) ?? start) : start
    guard let end = cal.date(bySettingHour: (h + 2) % 24, minute: 0, second: 0, of: endDay) else { return nil }
    return (start, end)
  }
}
