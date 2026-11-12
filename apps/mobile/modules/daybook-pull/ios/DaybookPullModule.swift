// The app that pulls you in (Screen Time), the main app's side (lib/pull.ts; the rules and words are core pull.ts). It asks for
// Screen Time access, shows Apple's own app list, keeps what was picked (opaque tokens: Daybook never learns which apps), writes
// core pullBridge's JSON for the extensions (targets/), and sets Apple's schedules to match. The extensions decide the rest.
//
// It is only switched on in a build made with DAYBOOK_PULL=1 (app.config.js), which adds Apple's Family Controls entitlement, the
// App Group and the three extensions, and sets DaybookPull in Info.plist; anywhere else `on` is false and lib/pull.ts leaves it alone.
// Everything stays on this phone (Apple's license, 3.3.3(P)).
//
// The keys are the same as targets/_shared/PullShared.swift.
import DeviceActivity
import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI
import UIKit

private let group = "group.com.jdsmith2004.daybook"
private let bridgeKey = "pull.bridge"
private let selectionKey = "pull.selection"
private let restKey = "pull.rest"
private let ignoredKey = "pull.ignored"
private let wantKey = "pull.want"
/// what each schedule was last set from, by its name, so one is set again only when it changes: restarting a schedule ends its
/// interval, and Apple counts use only from the restart
private let schedKey = "pull.sched"
/// ms when each schedule was last started, by its name (the monitor ignores a threshold that comes sooner than its minutes after)
private let startedKey = "pull.started"
/// ms when Open it for a few minutes started, and those minutes (the monitor reads them)
private let openAtKey = "pull.openAt"
private let openMinsKey = "pull.openMins"
/// the times the person put it down, and ms of the last one counted (the shield's Close counts too: Pull.countDown)
private let downsKey = "pull.downs"
private let downAtKey = "pull.downAt"
/// minutes after one put-down before another counts (core PULL_COUNT_GAP)
private let downGap: Double = 10
/// the minutes of use in the hard hours for the two notes and the pause (core PULL_HARD_AT)
private let hardAt = [10, 20, 30]
/// pull.open's length: more than Apple's shortest schedule (core PULL_MIN_SCHEDULE, 15 minutes), started now, never backdated
/// (the same as the monitor's Pull.openSpan)
private let openSchedule: TimeInterval = 20 * 60

public final class DaybookPullModule: Module {
  private var picking: Promise?
  /// every change to the schedules and the pause runs here, one at a time: two writes at once would both restart a schedule
  /// (ending its interval) and lose each other's marks
  private static let queue = DispatchQueue(label: "daybook.pull")

  private var defaults: UserDefaults? { UserDefaults(suiteName: group) }
  private var store: ManagedSettingsStore { ManagedSettingsStore(named: ManagedSettingsStore.Name("daybook.pull")) }
  private var nowMs: Double { Date().timeIntervalSince1970 * 1000 }

  public func definition() -> ModuleDefinition {
    Name("DaybookPull")

    /// whether this build has it (DAYBOOK_PULL=1, with the entitlement)
    Constant("on") { () -> Bool in
      (Bundle.main.object(forInfoDictionaryKey: "DaybookPull") as? Bool) == true
    }

    /// Apple's Screen Time ask (Face ID or the passcode); whether it was given
    AsyncFunction("authorize") { () async -> Bool in
      /* no throw is a yes: the status Apple publishes catches up later, so it is not read here */
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        return true
      } catch {
        return false
      }
    }

    /// whether access was taken back (Settings, Screen Time). Only a plain no counts: the status loads late after a launch and
    /// reads "not determined" until it does, which must never turn it off.
    AsyncFunction("allowed") { () async -> Bool in
      var st = AuthorizationCenter.shared.authorizationStatus
      var tries = 0
      while st == .notDetermined && tries < 15 {
        try? await Task.sleep(nanoseconds: 200_000_000)
        st = AuthorizationCenter.shared.authorizationStatus
        tries += 1
      }
      return st != .denied
    }

    /// Apple's app list, starting from what was picked; how many apps, kinds and sites are picked, or null when it was closed
    AsyncFunction("pick") { (promise: Promise) in
      guard self.picking == nil, let top = self.topController() else {
        promise.resolve(nil)
        return
      }
      self.picking = promise
      let start = self.selection() ?? FamilyActivitySelection()
      var host: UIViewController?
      let view = PickerSheet(start: start) { picked in
        host?.dismiss(animated: true)
        let p = self.picking
        self.picking = nil
        guard let s = picked else {
          p?.resolve(nil)
          return
        }
        let n = Self.count(s)
        Self.queue.async {
          if let d = try? JSONEncoder().encode(s) { self.defaults?.set(d, forKey: selectionKey) }
          /* what is watched changed: the schedules are set again now from the last bridge, and a pause running covers the new apps */
          self.defaults?.removeObject(forKey: schedKey)
          self.rewrite()
          DispatchQueue.main.async { p?.resolve(n) }
        }
      }
      let h = UIHostingController(rootView: view)
      h.isModalInPresentation = true
      host = h
      top.present(h, animated: true)
    }.runOnQueue(.main)

    /// how many are picked now
    AsyncFunction("picked") { () -> Int in
      self.selection().map(Self.count) ?? 0
    }

    /// hands the extensions core pullBridge's JSON (written on every open and change) and sets Apple's schedules to match
    AsyncFunction("write") { (json: String) in
      self.defaults?.set(json, forKey: bridgeKey)
      guard let d = json.data(using: .utf8), let b = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any] else { return }
      let p = (b["prefs"] as? [String: Any]) ?? [:]
      if (p["on"] as? Bool) != true {
        self.stopAll(forget: false)
        return
      }
      /* the pause turned off while it runs, or one whose end has passed (the monitor's end was missed: the phone was off, or the
         extension did not run): lifted now */
      let rest = self.defaults?.double(forKey: restKey) ?? 0
      if (p["pause"] as? Bool) != true || (p["hard"] as? Bool) == false || (rest > 0 && rest <= self.nowMs) { self.liftAll() }
      self.schedule(b, prefs: p)
    }.runOnQueue(Self.queue)

    /// lifts every pause at once
    AsyncFunction("lift") { () in
      self.liftAll()
    }.runOnQueue(Self.queue)

    /// the apps open for this many minutes of use (inside Apple's shortest schedule); then, while the hard hours last, the pause is back
    AsyncFunction("openFor") { (minutes: Int) in
      guard let s = self.selection() else { return }
      let resting = (self.defaults?.double(forKey: restKey) ?? 0) > self.nowMs
      self.clearShield()
      guard resting else { return }
      /* stamped before the old one stops: its end then reads as a restart, not as time up (the monitor) */
      self.defaults?.set(self.nowMs, forKey: openAtKey)
      self.defaults?.set(Double(max(1, minutes)), forKey: openMinsKey)
      let center = DeviceActivityCenter()
      center.stopMonitoring([DeviceActivityName("pull.open")])
      let cal = Calendar.current
      let from = Date()
      let parts: Set<Calendar.Component> = [.year, .month, .day, .hour, .minute, .second]
      let schedule = DeviceActivitySchedule(
        intervalStart: cal.dateComponents(parts, from: from),
        intervalEnd: cal.dateComponents(parts, from: from.addingTimeInterval(openSchedule)),
        repeats: false
      )
      let event = DeviceActivityEvent(
        applications: s.applicationTokens, categories: s.categoryTokens, webDomains: s.webDomainTokens,
        threshold: DateComponents(minute: max(1, minutes)))
      do {
        try center.startMonitoring(DeviceActivityName("pull.open"), during: schedule, events: [DeviceActivityEvent.Name("open"): event])
        self.stamp("pull.open")
      } catch {
        /* Apple would not watch the minutes: the pause comes back at once rather than never */
        self.shield(s)
      }
    }.runOnQueue(Self.queue)

    /// stops everything: nothing watched, nothing paused, nothing picked
    AsyncFunction("stop") { () in
      self.stopAll(forget: true)
    }.runOnQueue(Self.queue)

    /// when the hard hours' notes were ignored (core pullDrift), or null
    Function("ignoredAt") { () -> Double? in
      let v = self.defaults?.double(forKey: ignoredKey) ?? 0
      return v > 0 ? v : nil
    }

    /// the times the person put it down, on this phone only
    Function("downs") { () -> Int in
      self.defaults?.integer(forKey: downsKey) ?? 0
    }

    /// Put it down on the wait screen: one more, unless one was counted in the last downGap minutes; the count after it
    Function("countDown") { () -> Int in
      let n = self.defaults?.integer(forKey: downsKey) ?? 0
      let last = self.defaults?.double(forKey: downAtKey) ?? 0
      if last > 0 && self.nowMs >= last && self.nowMs - last < downGap * 60_000 { return n }
      self.defaults?.set(n + 1, forKey: downsKey)
      self.defaults?.set(self.nowMs, forKey: downAtKey)
      return n + 1
    }

    /// whether a pause's button asked for Daybook in the last two minutes (its wait screen opens), taken once
    Function("takeWant") { () -> Bool in
      let v = self.defaults?.double(forKey: wantKey) ?? 0
      self.defaults?.removeObject(forKey: wantKey)
      return v > 0 && self.nowMs - v < 120_000
    }
  }

  // MARK: Apple's schedules

  /// one schedule per piece, each set again only when what it is set from changes (restarting a schedule ends it, and Apple counts
  /// use only from then): pull.long, and pull.hard.<weekday>.<hour> for each window (two hours, across midnight when it must).
  /// A window no longer wanted is stopped, except while it runs: its end lifts the pause, and the next write stops it.
  private func schedule(_ b: [String: Any], prefs p: [String: Any]) {
    guard let s = selection() else { return }
    let long = (p["long"] as? Int) ?? 0
    let hard = (p["hard"] as? Bool) != false
    var windows: [(Int, Int)] = []
    for w in (b["windows"] as? [[String: Any]]) ?? [] {
      guard let wd = w["weekday"] as? Int, let h = w["start"] as? Int, (1...7).contains(wd), (0...23).contains(h) else { continue }
      if !windows.contains(where: { $0 == (wd, h) }) { windows.append((wd, h)) }
    }
    /* a hash that stays the same from launch to launch (String's own does not) */
    let sel = defaults?.data(forKey: selectionKey).map { $0.reduce(5381) { ($0 &* 33) &+ Int($1) } } ?? 0
    let ev = { (m: DateComponents) in
      DeviceActivityEvent(applications: s.applicationTokens, categories: s.categoryTokens, webDomains: s.webDomainTokens, threshold: m)
    }
    var want: [String: (key: String, during: DeviceActivitySchedule, events: [DeviceActivityEvent.Name: DeviceActivityEvent])] = [:]
    if long > 0 {
      want["pull.long"] = (
        "\(long)|\(sel)",
        DeviceActivitySchedule(intervalStart: DateComponents(hour: 0, minute: 0), intervalEnd: DateComponents(hour: 23, minute: 59), repeats: true),
        [DeviceActivityEvent.Name("long"): ev(DateComponents(hour: long))]
      )
    }
    if hard {
      for (wd, h) in windows {
        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
        for (i, m) in hardAt.enumerated() { events[DeviceActivityEvent.Name(String(i + 1))] = ev(DateComponents(minute: m)) }
        want["pull.hard.\(wd).\(h)"] = (
          "\(sel)",
          DeviceActivitySchedule(
            intervalStart: DateComponents(hour: h, minute: 0, weekday: wd),
            intervalEnd: DateComponents(hour: (h + 2) % 24, minute: 0, weekday: h + 2 >= 24 ? wd % 7 + 1 : wd),
            repeats: true),
          events
        )
      }
    }
    var keys = (defaults?.dictionary(forKey: schedKey) as? [String: String]) ?? [:]
    let center = DeviceActivityCenter()
    for name in Array(keys.keys) where want[name] == nil {
      if let (wd, h) = Self.hardParts(name), Self.inWindow(weekday: wd, hour: h) { continue }
      center.stopMonitoring([DeviceActivityName(name)])
      keys[name] = nil
    }
    for (name, w) in want where keys[name] != w.key {
      do {
        try center.startMonitoring(DeviceActivityName(name), during: w.during, events: w.events)
        keys[name] = w.key
        stamp(name)
      } catch {
        /* tried again on the next write */
        keys[name] = nil
      }
    }
    defaults?.set(keys, forKey: schedKey)
  }

  /// sets the schedules again from the last bridge written, and covers the picked apps again while a pause runs (after a new pick)
  private func rewrite() {
    guard let json = defaults?.string(forKey: bridgeKey), let d = json.data(using: .utf8),
      let b = (try? JSONSerialization.jsonObject(with: d)) as? [String: Any]
    else { return }
    let p = (b["prefs"] as? [String: Any]) ?? [:]
    guard (p["on"] as? Bool) == true else { return }
    if (defaults?.double(forKey: restKey) ?? 0) > nowMs, let s = selection() { shield(s) }
    schedule(b, prefs: p)
  }

  /// when the app started a schedule, for the monitor
  private func stamp(_ name: String) {
    var started = (defaults?.dictionary(forKey: startedKey) as? [String: Double]) ?? [:]
    started[name] = nowMs
    defaults?.set(started, forKey: startedKey)
  }

  /// "pull.hard.<weekday>.<hour>" (the monitor's Pull.hardParts)
  private static func hardParts(_ name: String) -> (Int, Int)? {
    let p = name.split(separator: ".")
    guard p.count == 4, p[0] == "pull", p[1] == "hard", let wd = Int(p[2]), let h = Int(p[3]) else { return nil }
    return (wd, h)
  }

  /// whether that weekday's window is running now (the monitor's Pull.window)
  private static func inWindow(weekday wd: Int, hour h: Int) -> Bool {
    let cal = Calendar.current
    let now = Date()
    guard var start = cal.date(bySettingHour: h, minute: 0, second: 0, of: now) else { return false }
    if start > now { start = cal.date(byAdding: .day, value: -1, to: start) ?? start }
    let endDay = h + 2 >= 24 ? (cal.date(byAdding: .day, value: 1, to: start) ?? start) : start
    guard let end = cal.date(bySettingHour: (h + 2) % 24, minute: 0, second: 0, of: endDay) else { return false }
    return cal.component(.weekday, from: start) == wd && now < end
  }

  // MARK: the pause

  private func shield(_ s: FamilyActivitySelection) {
    let st = store
    st.shield.applications = s.applicationTokens.isEmpty ? nil : s.applicationTokens
    st.shield.applicationCategories = s.categoryTokens.isEmpty ? nil : .specific(s.categoryTokens)
    st.shield.webDomains = s.webDomainTokens.isEmpty ? nil : s.webDomainTokens
  }

  private func clearShield() {
    let st = store
    st.shield.applications = nil
    st.shield.applicationCategories = nil
    st.shield.webDomains = nil
  }

  private func liftAll() {
    defaults?.set(0.0, forKey: restKey)
    DeviceActivityCenter().stopMonitoring([DeviceActivityName("pull.open")])
    clearShield()
  }

  private func stopAll(forget: Bool) {
    defaults?.set(0.0, forKey: restKey)
    DeviceActivityCenter().stopMonitoring()
    store.clearAllSettings()
    defaults?.removeObject(forKey: schedKey)
    defaults?.removeObject(forKey: startedKey)
    if forget {
      defaults?.removeObject(forKey: selectionKey)
      defaults?.removeObject(forKey: ignoredKey)
    }
  }

  // MARK: helpers

  private func selection() -> FamilyActivitySelection? {
    guard let d = defaults?.data(forKey: selectionKey) else { return nil }
    return try? JSONDecoder().decode(FamilyActivitySelection.self, from: d)
  }

  private static func count(_ s: FamilyActivitySelection) -> Int {
    s.applicationTokens.count + s.categoryTokens.count + s.webDomainTokens.count
  }

  private func topController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
    var top = scene?.windows.first { $0.isKeyWindow }?.rootViewController ?? scene?.windows.first?.rootViewController
    while let next = top?.presentedViewController { top = next }
    return top
  }
}

/// Apple's app list in a sheet, with Done and Cancel. Done with nothing picked counts as closed.
private struct PickerSheet: View {
  @State var selection: FamilyActivitySelection
  let done: (FamilyActivitySelection?) -> Void

  init(start: FamilyActivitySelection, done: @escaping (FamilyActivitySelection?) -> Void) {
    _selection = State(initialValue: start)
    self.done = done
  }

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("The apps that pull you in")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .cancellationAction) { Button("Cancel") { done(nil) } }
          ToolbarItem(placement: .confirmationAction) {
            Button("Done") {
              let n = selection.applicationTokens.count + selection.categoryTokens.count + selection.webDomainTokens.count
              done(n > 0 ? selection : nil)
            }
          }
        }
    }
  }
}
