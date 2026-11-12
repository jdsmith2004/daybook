// The app that pulls you in (Screen Time): what the three extensions and the main app's module share. The main app writes core
// pullBridge's JSON and the picked apps into the App Group; everyone reads them and decides with the same rule here (guardNow,
// core pullGuard), so the app and the extensions can never disagree about what is held. Apple's license keeps all of it on this
// phone: nothing here touches the network.
//
// This file is compiled into each extension (targets/_shared) and into the main app's module (modules/daybook-pull/ios links to it).
// Keep it tiny: the monitor has about 6 MB of memory.
import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings
import UserNotifications

enum Pull {
  static let group = "group.com.jdsmith2004.daybook"
  static let bridgeKey = "pull.bridge"
  static let selectionKey = "pull.selection"
  /// a smaller pick (fewer apps), held until the morning: loosen slowly. The apps in use until then are both lists together.
  static let selectionNextKey = "pull.selectionNext"
  static let selectionAtKey = "pull.selectionAt"
  /// ms when the night's notes were ignored (core pullDrift)
  static let ignoredKey = "pull.ignored"
  /// ms when a shield's button asked for Daybook (the app opens its wait screen)
  static let wantKey = "pull.want"
  /// the notes already posted, kind to the night or day they were for (one of each, no repeats)
  static let postedKey = "pull.posted"
  /// ms when the app last started each schedule, by its name. Apple counts use only from then, and a threshold can come early
  /// right after a start (iOS 17 to 26), so one that comes sooner than its minutes after this is ignored.
  static let startedKey = "pull.started"
  /// ms when Open it for a few minutes started pull.open, and those minutes
  static let openAtKey = "pull.openAt"
  static let openMinsKey = "pull.openMins"
  /// the holds (core PullHolds), ms until each ends: Lift every wait now, the minutes open after the short wait, the minutes adult
  /// sites are open after the long wait
  static let liftKey = "pull.liftUntil"
  static let openKey = "pull.openUntil"
  static let webKey = "pull.webUntil"
  /// the nights, on this phone only (core pullNightHeld): night to 1 (the waits were on) or 2 (went through)
  static let nightsKey = "pull.nights"
  /// pull.open lasts this long (the app's openSchedule)
  static let openSpan: Double = 20 * 60_000
  /// the times the person put it down (the shield's Close, the wait screen's Put it down), and ms of the last one counted
  static let downsKey = "pull.downs"
  static let downAtKey = "pull.downAt"
  /// minutes after one put-down before another counts (core PULL_COUNT_GAP)
  static let downGap: Double = 10
  /// the night ends at 6 AM (core PULL_NIGHT_END)
  static let nightEnd = 6 * 60
  static let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("daybook.pull"))

  static var defaults: UserDefaults? { UserDefaults(suiteName: group) }
  static var nowMs: Double { Date().timeIntervalSince1970 * 1000 }

  /// what the app last wrote, as plain JSON (small: words and numbers only)
  static func bridge() -> [String: Any]? {
    CFPreferencesAppSynchronize(group as CFString)
    guard let s = defaults?.string(forKey: bridgeKey) else { return nil }
    return parse(s)
  }

  static func parse(_ s: String) -> [String: Any]? {
    guard let d = s.data(using: .utf8) else { return nil }
    return (try? JSONSerialization.jsonObject(with: d)) as? [String: Any]
  }

  static func selection() -> FamilyActivitySelection? { decode(selectionKey) }

  static func decode(_ key: String) -> FamilyActivitySelection? {
    guard let d = defaults?.data(forKey: key) else { return nil }
    return try? JSONDecoder().decode(FamilyActivitySelection.self, from: d)
  }

  static func count(_ s: FamilyActivitySelection) -> Int {
    s.applicationTokens.count + s.categoryTokens.count + s.webDomainTokens.count
  }

  /// "yyyy-MM-dd" of a date, by the phone's calendar
  static func dayKey(_ d: Date) -> String {
    let f = DateFormatter()
    f.calendar = Calendar(identifier: .gregorian)
    f.locale = Locale(identifier: "en_US_POSIX")
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: d)
  }

  /// the log day it is now, as core logicalKey: the calendar day of (now - rollover hours)
  static func logDay(_ b: [String: Any], at date: Date = Date()) -> String {
    let roll = (b["rollover"] as? Double) ?? 4
    return dayKey(date.addingTimeInterval(-roll * 3600))
  }

  /// the night a moment belongs to (core pullNightOf): the day it started, since it ends at 6 AM
  static func nightOf(_ date: Date = Date()) -> String { dayKey(date.addingTimeInterval(-6 * 3600)) }

  /// the choices as they stand now (core pullSettle): looser ones whose morning has come are applied
  static func prefs(_ b: [String: Any]) -> [String: Any] {
    var p = (b["prefs"] as? [String: Any]) ?? [:]
    if let l = p["later"] as? [String: Any], let at = l["at"] as? Double, nowMs >= at - 60_000, let lp = l["p"] as? [String: Any] {
      for (k, v) in lp { p[k] = v }
      p["later"] = nil
    }
    return p
  }

  static func quiet(_ b: [String: Any]) -> Bool {
    guard let q = b["quietUntil"] as? Double else { return false }
    return nowMs < q
  }

  /// minutes into the day of "HH:MM"
  static func clockMin(_ t: String?) -> Int? {
    guard let t = t else { return nil }
    let p = t.split(separator: ":")
    guard p.count == 2, let h = Int(p[0]), let m = Int(p[1]), (0...23).contains(h), (0...59).contains(m) else { return nil }
    return h * 60 + m
  }

  /// when the night running or coming starts, minutes into the day (core pullNightStart, written by the app), or nil
  static func nightFrom(_ b: [String: Any]) -> Int? { clockMin((b["night"] as? [String: Any])?["from"] as? String) }

  /// when this evening's night starts, for Apple's schedules (core pullNextStart), or nil
  static func nightNext(_ b: [String: Any]) -> Int? { clockMin((b["night"] as? [String: Any])?["next"] as? String) ?? nightFrom(b) }

  /// a one-time tick at `at` (hour and minute only, never across midnight, longer than Apple's shortest schedule) whose start and
  /// end run guardNow. False when it could not be set; the night's own starts and ends, and the next open, still catch up.
  @discardableResult
  static func tick(_ name: String, at: Date) -> Bool {
    let cal = Calendar.current
    let end = at.addingTimeInterval(16 * 60)
    let center = DeviceActivityCenter()
    center.stopMonitoring([DeviceActivityName(name)])
    guard cal.isDate(at, inSameDayAs: end) else { return false }
    let s = DeviceActivitySchedule(
      intervalStart: cal.dateComponents([.hour, .minute], from: at), intervalEnd: cal.dateComponents([.hour, .minute], from: end), repeats: false)
    do {
      try center.startMonitoring(DeviceActivityName(name), during: s)
      return true
    } catch {
      return false
    }
  }

  /// whether it is the night now (core pullInNight): from tonight's start to 6 AM, by the phone's clock
  static func inNight(_ b: [String: Any], at date: Date = Date()) -> Bool {
    guard let f = nightFrom(b) else { return false }
    let c = Calendar.current.dateComponents([.hour, .minute], from: date)
    let m = (c.hour ?? 0) * 60 + (c.minute ?? 0)
    return f > nightEnd ? (m >= f || m < nightEnd) : (m >= f && m < nightEnd)
  }

  /// core pullGuard, the same rule: the picked apps behind the short wait, adult sites behind Apple's filter in the night
  static func wanted(_ b: [String: Any]) -> (apps: Bool, web: Bool) {
    let p = prefs(b)
    guard (p["on"] as? Bool) == true else { return (false, false) }
    let now = nowMs
    let d = defaults
    /* Lift every wait ends at a night's start or end, where Apple's callback can come a few seconds early: a minute's grace */
    let free = now >= (d?.double(forKey: liftKey) ?? 0) - 60_000
    let apps = (p["feeds"] as? Bool) == true && free && now >= (d?.double(forKey: openKey) ?? 0)
    let web = (p["adult"] as? Bool) == true && (b["adult"] as? Bool) == true && free && now >= (d?.double(forKey: webKey) ?? 0) && inNight(b)
    return (apps, web)
  }

  /// sets Apple's shield and adult filter to what is wanted now, and marks the night as one the waits were on. Every monitor
  /// callback and every write from the app runs this, so a missed callback is caught up by the next one, or by the next open.
  static func guardNow(_ b: [String: Any]? = Pull.bridge()) {
    guard let b = b else { return }
    let w = wanted(b)
    if w.apps, let s = selection() { shield(s) } else { clearShield() }
    store.webContent.blockedByFilter = w.web ? .auto([], except: []) : nil
    let p = prefs(b)
    let on = (p["on"] as? Bool) == true && ((p["feeds"] as? Bool) == true || ((p["adult"] as? Bool) == true && (b["adult"] as? Bool) == true))
    if on && inNight(b) { markNight(1) }
  }

  /// the night's mark: 1 when the waits were on, 2 when the person went through; it only goes up. The last 60 nights are kept.
  static func markNight(_ v: Int) {
    let k = nightOf()
    var n = (defaults?.dictionary(forKey: nightsKey) as? [String: Int]) ?? [:]
    if (n[k] ?? 0) >= v { return }
    n[k] = v
    if n.count > 60 { for old in n.keys.sorted().prefix(n.count - 60) { n[old] = nil } }
    defaults?.set(n, forKey: nightsKey)
  }

  /// core pullNoteFor, the same rule: which note goes for a threshold ("long", or the night's 1 and 2), or nil
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
    if kind == "2" { return "hard2" }
    return nil
  }

  /// marks `kind` as done for `once` (a night or a day); false when it was done already. Thresholds can fire twice.
  static func mark(_ kind: String, once: String) -> Bool {
    var posted = (defaults?.dictionary(forKey: postedKey) as? [String: String]) ?? [:]
    if posted[kind] == once { return false }
    posted[kind] = once
    defaults?.set(posted, forKey: postedKey)
    return true
  }

  static func unmark(_ kind: String) {
    var posted = (defaults?.dictionary(forKey: postedKey) as? [String: String]) ?? [:]
    posted[kind] = nil
    defaults?.set(posted, forKey: postedKey)
  }

  /// posts one of the bridge's notes, once per `once` key (a night or a day). Only the screen to open travels with it: no id, so
  /// nothing about it is ever counted. It waits (up to 2 seconds) for Apple to take the note, since the extension can be put away
  /// the moment it returns; a note Apple refused is not marked, so the next threshold can try again.
  static func post(_ b: [String: Any], kind: String, once: String) {
    guard let notes = b["notes"] as? [String: Any], let n = notes[kind] as? [String: Any] else { return }
    if !mark(kind, once: once) { return }
    let c = UNMutableNotificationContent()
    c.title = (n["t"] as? String) ?? ""
    /* once they have put it down, the count, as it stands now (the shield's Close adds to it while Daybook is shut) */
    let d = downs
    if d > 0, let w = n["bDowns"] as? String { c.body = fill(w, d) } else { c.body = (n["b"] as? String) ?? "" }
    c.sound = .default
    if let url = n["url"] as? String { c.userInfo = ["url": url] }
    let r = UNNotificationRequest(identifier: "daybook.pull." + kind + "." + once, content: c, trigger: nil)
    let done = DispatchSemaphore(value: 0)
    UNUserNotificationCenter.current().add(r) { err in
      if err != nil { unmark(kind) }
      done.signal()
    }
    _ = done.wait(timeout: .now() + 2)
  }

  /// the times the person put it down, on this phone only
  static var downs: Int { defaults?.integer(forKey: downsKey) ?? 0 }

  /// one more put-down, unless one was counted in the last downGap minutes (core pullCounts); the count after it
  @discardableResult
  static func countDown() -> Int {
    let last = defaults?.double(forKey: downAtKey) ?? 0
    let now = nowMs
    if last > 0 && now >= last && now - last < downGap * 60_000 { return downs }
    let n = downs + 1
    defaults?.set(n, forKey: downsKey)
    defaults?.set(now, forKey: downAtKey)
    return n
  }

  /// core pullDownsFill: {n} as "once" or "6 times", {next} as the count plus one
  static func fill(_ s: String, _ n: Int) -> String {
    s.replacingOccurrences(of: "{n}", with: n == 1 ? "once" : "\(n) times").replacingOccurrences(of: "{next}", with: String(n + 1))
  }

  static func shield(_ s: FamilyActivitySelection) {
    store.shield.applications = s.applicationTokens.isEmpty ? nil : s.applicationTokens
    store.shield.applicationCategories = s.categoryTokens.isEmpty ? nil : .specific(s.categoryTokens)
    store.shield.webDomains = s.webDomainTokens.isEmpty ? nil : s.webDomainTokens
  }

  static func clearShield() {
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
  }

  /// ms when the app last started this schedule, or 0
  static func started(_ name: String) -> Double {
    ((defaults?.dictionary(forKey: startedKey) as? [String: Double]) ?? [:])[name] ?? 0
  }

  /// whether a threshold of `minutes` of use is real: that many minutes have passed since `from` ms (less half a minute)
  static func enoughSince(_ from: Double, minutes: Double) -> Bool {
    nowMs - from >= (minutes - 0.5) * 60_000
  }

  /// the night's two schedules: pull.night.a from its start to 23:59, pull.night.b from midnight (or its start, when that is
  /// after midnight) to 6 AM, so nothing rests on an interval that crosses midnight
  static func isNight(_ name: String) -> Bool { name == "pull.night.a" || name == "pull.night.b" }

  /// when this part of the night started, for the thresholds (today at its start minute)
  static func partStart(_ name: String, _ b: [String: Any], at now: Date = Date()) -> Date? {
    guard let f = nightFrom(b) else { return nil }
    let m = name == "pull.night.a" ? f : (f < nightEnd ? f : 0)
    return Calendar.current.date(bySettingHour: m / 60, minute: m % 60, second: 0, of: now)
  }
}
