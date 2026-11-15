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
  /// the lists (core PULL_LIST_IDS): each its own apps, its own wait and its own ManagedSettingsStore, so opening one list after
  /// its wait leaves the others waiting (the owner, November 15, 2026)
  static let ids = ["a", "b", "c"]
  /// a list's apps (Apple's opaque tokens)
  static func selKey(_ id: String) -> String { "pull.selection." + id }
  /// a smaller pick (fewer apps) for a list, held until the morning: loosen slowly. Its apps until then are both picks together.
  static func selNextKey(_ id: String) -> String { "pull.selectionNext." + id }
  static func selAtKey(_ id: String) -> String { "pull.selectionAt." + id }
  /// ms when a list's apps were last picked: a list missing from the bridge is forgotten only once its pick is older than this
  /// (a new list is picked a moment before the app writes it into the bridge)
  static func pickedAtKey(_ id: String) -> String { "pull.pickedAt." + id }
  /// the minutes a list is open after its wait: ms until it waits again, when that started, and the minutes chosen
  static func openUntilKey(_ id: String) -> String { "pull.openUntil." + id }
  static func openAtKey(_ id: String) -> String { "pull.openAt." + id }
  static func openMinsKey(_ id: String) -> String { "pull.openMins." + id }
  /// the list whose shield button asked for Daybook ("" for adult sites or none)
  static let wantListKey = "pull.wantList"
  /// set once the one pick from before the lists has moved to list a
  static let migratedKey = "pull.lists"
  /// before the lists: the one pick, and its open minutes (moved to list a by migrate)
  static let selectionKey = "pull.selection"
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
  /// before the lists: the one list's open minutes
  static let openAtKey = "pull.openAt"
  static let openMinsKey = "pull.openMins"
  /// the holds (core PullHolds), ms until each ends: Lift every wait now (each list's minutes open are openUntilKey), the minutes
  /// adult sites are open after the long wait
  static let liftKey = "pull.liftUntil"
  static let openKey = "pull.openUntil"
  static let webKey = "pull.webUntil"
  /// the nights, on this phone only (core pullNightHeld): night to 1 (the waits were on at its start), 2 (went through) or 3
  /// (held to the morning)
  static let nightsKey = "pull.nights"
  /// a shield's button over an adult site (the long wait, not the short one)
  static let wantLongKey = "pull.wantLong"
  /// the picked apps were there but could not be read back (an iOS update): ms when that was seen, 0 when they read fine
  static let decodeFailKey = "pull.decodeFail"
  /// schedules Apple would not start, by name (More and Today say so: core pullTrouble)
  static let failedKey = "pull.failed"
  /// minutes the night's own callbacks read ahead by (core PULL_GRACE): one a few seconds early still finds its night
  static let grace: Double = 2
  /// pull.open.<list> lasts the minutes chosen plus this, and at least Apple's shortest schedule (the app's openSchedule)
  static func openSpan(_ mins: Double) -> Double { max(20, mins + 5) * 60_000 }
  /// the times the person put it down (the shield's Close, the wait screen's Put it down), and ms of the last one counted
  static let downsKey = "pull.downs"
  static let downAtKey = "pull.downAt"
  /// minutes after one put-down before another counts (core PULL_COUNT_GAP)
  static let downGap: Double = 10
  /// the night ends at 6 AM (core PULL_NIGHT_END)
  static let nightEnd = 6 * 60
  /// the adult filter (before the lists it held the apps' shield too: migrate clears that)
  static let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("daybook.pull"))
  /// each list's shield
  static let stores: [String: ManagedSettingsStore] = Dictionary(
    uniqueKeysWithValues: ids.map { ($0, ManagedSettingsStore(named: ManagedSettingsStore.Name("daybook.pull." + $0))) })

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

  /// the one pick from before the lists becomes list a, and the old store keeps only the adult filter. Once; safe to run twice.
  static func migrate() {
    guard let d = defaults, !d.bool(forKey: migratedKey) else { return }
    for (old, new) in [(selectionKey, selKey("a")), (selectionNextKey, selNextKey("a"))] {
      if let v = d.data(forKey: old), d.data(forKey: new) == nil { d.set(v, forKey: new) }
      d.removeObject(forKey: old)
    }
    let at = d.double(forKey: selectionAtKey)
    if at > 0 { d.set(at, forKey: selAtKey("a")) }
    for k in [selectionAtKey, openKey, openAtKey, openMinsKey] { d.removeObject(forKey: k) }
    clearShield(store)
    d.set(true, forKey: migratedKey)
  }

  /// a list's apps, or nil (none picked, or unreadable)
  static func selection(_ id: String) -> FamilyActivitySelection? {
    migrate()
    return decode(selKey(id))
  }

  /// every list's apps together: the minutes of use for the long-use note and the night's notes
  static func union() -> FamilyActivitySelection {
    var all = FamilyActivitySelection()
    for id in ids {
      guard let s = selection(id) else { continue }
      all.applicationTokens.formUnion(s.applicationTokens)
      all.categoryTokens.formUnion(s.categoryTokens)
      all.webDomainTokens.formUnion(s.webDomainTokens)
    }
    return all
  }

  /// picked apps there but unreadable (an iOS update): said in More and on Today, never "On" over nothing
  static func readFail() {
    let failed = ids.contains { defaults?.data(forKey: selKey($0)) != nil && selection($0) == nil }
    if failed != ((defaults?.double(forKey: decodeFailKey) ?? 0) > 0) { defaults?.set(failed ? nowMs : 0.0, forKey: decodeFailKey) }
  }

  static func decode(_ key: String) -> FamilyActivitySelection? {
    guard let d = defaults?.data(forKey: key) else { return nil }
    return try? JSONDecoder().decode(FamilyActivitySelection.self, from: d)
  }

  /// the list an app, a kind of app or a site was picked in (the first, when it is in more than one), or nil
  static func listOf(app t: ApplicationToken?) -> String? {
    guard let t = t else { return nil }
    return ids.first { selection($0)?.applicationTokens.contains(t) ?? false }
  }
  static func listOf(category t: ActivityCategoryToken?) -> String? {
    guard let t = t else { return nil }
    return ids.first { selection($0)?.categoryTokens.contains(t) ?? false }
  }
  static func listOf(web t: WebDomainToken?) -> String? {
    guard let t = t else { return nil }
    return ids.first { selection($0)?.webDomainTokens.contains(t) ?? false }
  }

  /// a site held by the adult filter, not one the person picked in a list (a picked one gets its list's wait like any app)
  static func filtered(_ t: WebDomainToken?) -> Bool { listOf(web: t) == nil }

  /// the lists in the choices as they stand: id and seconds of wait (0 is No wait)
  static func lists(_ p: [String: Any]) -> [(id: String, wait: Int)] {
    /* a bridge from before the lists (the app updated, not opened since): its one pick is list a, with its wait */
    guard let ls = p["lists"] as? [[String: Any]] else {
      return p["feeds"] == nil ? [] : [("a", (p["feeds"] as? Bool) == true ? ((p["wait"] as? Int) ?? 10) : 0)]
    }
    return ls.compactMap { l in
      guard let id = l["id"] as? String, ids.contains(id) else { return nil }
      return (id, (l["wait"] as? Int) ?? 0)
    }
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

  /// core pullGuard, the same rule: each list's apps behind its wait (unless opened after it), adult sites behind Apple's filter,
  /// all day
  static func wanted(_ b: [String: Any]) -> (apps: [String: Bool], web: Bool) {
    let p = prefs(b)
    guard (p["on"] as? Bool) == true else { return ([:], false) }
    let now = nowMs
    let d = defaults
    /* Lift every wait ends at a night's start or end, where Apple's callback can come a few seconds early: a minute's grace */
    let free = now >= (d?.double(forKey: liftKey) ?? 0) - 60_000
    var apps: [String: Bool] = [:]
    for l in lists(p) { apps[l.id] = l.wait > 0 && free && now >= (d?.double(forKey: openUntilKey(l.id)) ?? 0) }
    let web = (p["adult"] as? Bool) == true && (b["adult"] as? Bool) == true && free && now >= (d?.double(forKey: webKey) ?? 0)
    return (apps, web)
  }

  /// sets each list's shield and the adult filter to what is wanted now, and marks the night as one the waits were on. Every
  /// monitor callback and every write from the app runs this, so a missed callback is caught up by the next one, or by the next
  /// open. `boundary`: one of the night's own callbacks, read `grace` minutes ahead, so a start a few seconds early still marks
  /// the night it was set for.
  static func guardNow(_ b: [String: Any]? = Pull.bridge(), boundary: Bool = false) {
    guard let b = b else { return }
    let w = wanted(b)
    for id in ids {
      guard let st = stores[id] else { continue }
      if w.apps[id] == true, let s = selection(id) { shield(st, s) } else { clearShield(st) }
    }
    store.webContent.blockedByFilter = w.web ? .auto([], except: []) : nil
    readFail()
    let p = prefs(b)
    let on =
      (p["on"] as? Bool) == true
      && (lists(p).contains { $0.wait > 0 } || ((p["adult"] as? Bool) == true && (b["adult"] as? Bool) == true))
    let clock = boundary ? Date().addingTimeInterval(grace * 60) : Date()
    if on && inNight(b, at: clock) { markNight(1, night: nightOf(clock)) }
  }

  /// the night's mark (core pullMark, the same rule): 1 when the waits were on at its start, 2 when the person went through (it
  /// wins over everything), 3 when the morning came with them still on (only after a 1). Every night is kept (a few bytes each),
  /// since "Lock held N nights" must only ever go up.
  static func markNight(_ v: Int, night: String? = nil) {
    let k = night ?? nightOf()
    var n = (defaults?.dictionary(forKey: nightsKey) as? [String: Int]) ?? [:]
    let old = n[k]
    var next = old
    if v == 2 {
      next = 2
    } else if v == 3 {
      if old == 1 { next = 3 }
    } else if old == nil {
      next = 1
    }
    if next == old { return }
    n[k] = next
    defaults?.set(n, forKey: nightsKey)
  }

  /// the morning's check: the night just gone held, when its waits were on at its start, nothing was gone through, Screen Time is
  /// still on and access was not taken back. Only once the night is over (from 6 AM); a night switched off in Settings never gets
  /// here, since Apple stops the schedules with it.
  static func confirmNight(allowed: Bool) {
    let k = nightOf(Date().addingTimeInterval(-60 * 60))
    guard allowed, k != nightOf(), let b = bridge(), (prefs(b)["on"] as? Bool) == true else { return }
    markNight(3, night: k)
  }

  /// schedules Apple would not start (core pullTrouble), kept so More and Today can say so
  static func setFailed(_ names: [String]) {
    if names.isEmpty { defaults?.removeObject(forKey: failedKey) } else { defaults?.set(names.sorted(), forKey: failedKey) }
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
  static func post(_ b: [String: Any], kind: String, once: String, list: String? = nil) {
    guard let notes = b["notes"] as? [String: Any], let n = notes[kind] as? [String: Any] else { return }
    if !mark(kind, once: once) { return }
    let c = UNMutableNotificationContent()
    c.title = (n["t"] as? String) ?? ""
    /* once they have put it down, the count, as it stands now (the shield's Close adds to it while Daybook is shut) */
    let d = downs
    if d > 0, let w = n["bDowns"] as? String { c.body = fill(w, d) } else { c.body = (n["b"] as? String) ?? "" }
    c.sound = .default
    if var url = n["url"] as? String {
      /* the list that asked, so the wait screen runs its wait */
      if let l = list { url += (url.contains("?") ? "&" : "?") + "l=" + l }
      c.userInfo = ["url": url]
    }
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

  static func shield(_ st: ManagedSettingsStore, _ s: FamilyActivitySelection) {
    st.shield.applications = s.applicationTokens.isEmpty ? nil : s.applicationTokens
    st.shield.applicationCategories = s.categoryTokens.isEmpty ? nil : .specific(s.categoryTokens)
    st.shield.webDomains = s.webDomainTokens.isEmpty ? nil : s.webDomainTokens
  }

  static func clearShield(_ st: ManagedSettingsStore) {
    st.shield.applications = nil
    st.shield.applicationCategories = nil
    st.shield.webDomains = nil
  }

  /// whether two picks share an app, a kind or a site: opening one after its wait opens the other too, or the shared app would
  /// stay behind the other list's shield
  static func overlaps(_ a: FamilyActivitySelection, _ b: FamilyActivitySelection) -> Bool {
    !a.applicationTokens.isDisjoint(with: b.applicationTokens) || !a.categoryTokens.isDisjoint(with: b.categoryTokens)
      || !a.webDomainTokens.isDisjoint(with: b.webDomainTokens)
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

  /// the night's own callbacks (core pullParts): its two parts, the heartbeat a few minutes after its start, the morning check.
  /// They read the clock a little ahead (`grace`).
  static func isBoundary(_ name: String) -> Bool { isNight(name) || name == "pull.night.h" || name == "pull.morning" }

  /// when this part of the night started, for the thresholds (today at its start minute)
  static func partStart(_ name: String, _ b: [String: Any], at now: Date = Date()) -> Date? {
    guard let f = nightFrom(b) else { return nil }
    let m = name == "pull.night.a" ? f : (f < nightEnd ? f : 0)
    return Calendar.current.date(bySettingHour: m / 60, minute: m % 60, second: 0, of: now)
  }
}
