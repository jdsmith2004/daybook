// The app that pulls you in (Screen Time), the main app's side (lib/pull.ts; the rules and words are core pull.ts). It asks for
// Screen Time access, shows Apple's own app list, keeps what was picked (opaque tokens: Daybook never learns which apps), writes
// core pullBridge's JSON for the extensions (targets/), and sets Apple's schedules to match. What is held right now (the shield and
// the adult filter) is decided by Pull.guardNow, the same rule the extensions use: PullShared.swift here is a link to
// targets/_shared/PullShared.swift, so the two can never drift apart.
//
// It is only switched on in a build made with DAYBOOK_PULL=1 (app.config.js), which adds Apple's Family Controls entitlement, the
// App Group and the three extensions, and sets DaybookPull in Info.plist; anywhere else `on` is false and lib/pull.ts leaves it alone.
// Everything stays on this phone (Apple's license, 3.3.3(P)).
import DeviceActivity
import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI
import UIKit

/// what each schedule was last set from, by its name, so one is set again only when it changes: restarting a schedule ends its
/// interval, and Apple counts use only from the restart
private let schedKey = "pull.sched"
/// the minutes of use in the night for the two notes and the ignored mark (core PULL_HARD_AT)
private let hardAt = [10, 20, 30]
/// pull.open's length: more than Apple's shortest schedule (core PULL_MIN_SCHEDULE, 15 minutes), started now, never backdated
/// (the same as Pull.openSpan)
private let openSchedule: TimeInterval = 20 * 60

public final class DaybookPullModule: Module {
  private var picking: Promise?
  /// every change to the schedules and the holds runs here, one at a time: two writes at once would both restart a schedule
  /// (ending its interval) and lose each other's marks
  private static let queue = DispatchQueue(label: "daybook.pull")

  private var defaults: UserDefaults? { Pull.defaults }
  private var nowMs: Double { Pull.nowMs }

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

    /// Apple's app list, starting from what was chosen; how many apps, kinds and sites are chosen, or null when it was closed.
    /// `laterAt` (core pullLooseAt) is when a looser pick starts: a pick that leaves out an app keeps it in until then (loosen
    /// slowly), while one that only adds works now. Null: it all works now.
    AsyncFunction("pick") { (laterAt: Double?, promise: Promise) in
      guard self.picking == nil, let top = self.topController() else {
        promise.resolve(nil)
        return
      }
      self.picking = promise
      let start = Pull.decode(Pull.selectionNextKey) ?? Pull.selection() ?? FamilyActivitySelection()
      var host: UIViewController?
      let view = PickerSheet(start: start) { picked in
        host?.dismiss(animated: true)
        let p = self.picking
        self.picking = nil
        guard let s = picked else {
          p?.resolve(nil)
          return
        }
        let n = Pull.count(s)
        Self.queue.async {
          self.choose(s, laterAt: laterAt)
          /* what is watched changed: the schedules are set again now from the last bridge, and the wait covers the new apps */
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

    /// how many are chosen now (a smaller pick waiting for the morning counts as chosen)
    AsyncFunction("picked") { () -> Int in
      (Pull.decode(Pull.selectionNextKey) ?? Pull.selection()).map(Pull.count) ?? 0
    }

    /// ms when a smaller pick starts, or null when none waits
    Function("pickWaits") { () -> Double? in
      guard Pull.decode(Pull.selectionNextKey) != nil else { return nil }
      let at = self.defaults?.double(forKey: Pull.selectionAtKey) ?? 0
      return at > 0 ? at : nil
    }

    /// hands the extensions core pullBridge's JSON (written on every open and change), sets what is held now, and sets Apple's
    /// schedules to match
    AsyncFunction("write") { (json: String) in
      self.defaults?.set(json, forKey: Pull.bridgeKey)
      guard let b = Pull.parse(json) else { return }
      let p = Pull.prefs(b)
      if (p["on"] as? Bool) != true {
        self.stopAll(forget: false)
        return
      }
      /* a smaller pick whose morning has come */
      if Pull.decode(Pull.selectionNextKey) != nil, (self.defaults?.double(forKey: Pull.selectionAtKey) ?? 0) <= self.nowMs {
        if let d = self.defaults?.data(forKey: Pull.selectionNextKey) { self.defaults?.set(d, forKey: Pull.selectionKey) }
        self.defaults?.removeObject(forKey: Pull.selectionNextKey)
        self.defaults?.removeObject(forKey: Pull.selectionAtKey)
        self.defaults?.removeObject(forKey: schedKey)
      }
      Pull.guardNow(b)
      self.schedule(b, prefs: p)
    }.runOnQueue(Self.queue)

    /// Lift every wait now: nothing is held until `until` ms (core pullLiftUntil: tonight's start by day, 6 AM at night)
    AsyncFunction("lift") { (until: Double) in
      self.defaults?.set(until, forKey: Pull.liftKey)
      DeviceActivityCenter().stopMonitoring([DeviceActivityName("pull.open"), DeviceActivityName("pull.relock")])
      Pull.guardNow()
    }.runOnQueue(Self.queue)

    /// After the short wait: the apps open for this many minutes of use (inside Apple's shortest schedule), then the wait is back
    AsyncFunction("openFor") { (minutes: Int) in
      guard let s = Pull.selection() else { return }
      /* stamped before the old one stops: its end then reads as a restart, not as time up (the monitor) */
      self.defaults?.set(self.nowMs, forKey: Pull.openAtKey)
      self.defaults?.set(Double(max(1, minutes)), forKey: Pull.openMinsKey)
      self.defaults?.set(self.nowMs + Pull.openSpan, forKey: Pull.openKey)
      Pull.guardNow()
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
        /* Apple would not watch the minutes: the wait comes back at once rather than never */
        self.defaults?.set(0.0, forKey: Pull.openKey)
        Pull.guardNow()
      }
    }.runOnQueue(Self.queue)

    /// After the long wait: adult sites open for this many minutes, then pull.relock puts the filter back (and the app re-checks
    /// on every open). Tonight goes in the week as a night the person went through.
    AsyncFunction("openWeb") { (minutes: Int) in
      let m = max(1, minutes)
      let until = Date().addingTimeInterval(TimeInterval(m * 60))
      self.defaults?.set(until.timeIntervalSince1970 * 1000, forKey: Pull.webKey)
      Pull.markNight(2)
      Pull.guardNow()
      /* hour and minute only, not repeating: the next time the clock reads it (one developer saw full dates make callbacks
         unreliable), and longer than Apple's shortest schedule */
      let cal = Calendar.current
      let center = DeviceActivityCenter()
      center.stopMonitoring([DeviceActivityName("pull.relock")])
      /* from the minute after the time is up, so its start never comes a few seconds too soon */
      let start = until.addingTimeInterval(60)
      let schedule = DeviceActivitySchedule(
        intervalStart: cal.dateComponents([.hour, .minute], from: start),
        intervalEnd: cal.dateComponents([.hour, .minute], from: start.addingTimeInterval(16 * 60)),
        repeats: false
      )
      try? center.startMonitoring(DeviceActivityName("pull.relock"), during: schedule)
    }.runOnQueue(Self.queue)

    /// tonight goes in the week as a night the person went through (Lift every wait now, or Screen Time turned off, at night)
    Function("through") { () in
      Pull.markNight(2)
    }

    /// the nights, on this phone only: night to 1 (the waits were on) or 2 (went through), core pullNightHeld
    Function("nights") { () -> [String: Int] in
      (self.defaults?.dictionary(forKey: Pull.nightsKey) as? [String: Int]) ?? [:]
    }

    /// stops everything: nothing watched, nothing held, nothing picked
    AsyncFunction("stop") { () in
      self.stopAll(forget: true)
    }.runOnQueue(Self.queue)

    /// when the night's notes were ignored (core pullDrift), or null
    Function("ignoredAt") { () -> Double? in
      let v = self.defaults?.double(forKey: Pull.ignoredKey) ?? 0
      return v > 0 ? v : nil
    }

    /// the times the person put it down, on this phone only
    Function("downs") { () -> Int in
      Pull.downs
    }

    /// Put it down on the wait screen: one more, unless one was counted in the last downGap minutes; the count after it
    Function("countDown") { () -> Int in
      Pull.countDown()
    }

    /// whether a shield's button asked for Daybook in the last two minutes (its wait screen opens), taken once
    Function("takeWant") { () -> Bool in
      let v = self.defaults?.double(forKey: Pull.wantKey) ?? 0
      self.defaults?.removeObject(forKey: Pull.wantKey)
      return v > 0 && self.nowMs - v < 120_000
    }
  }

  // MARK: the pick

  /// keeps a pick. One that leaves an app out, outside the morning, keeps both lists in until `laterAt` (the new one waits).
  private func choose(_ s: FamilyActivitySelection, laterAt: Double?) {
    let old = Pull.selection()
    let keeps =
      old.map {
        s.applicationTokens.isSuperset(of: $0.applicationTokens) && s.categoryTokens.isSuperset(of: $0.categoryTokens)
          && s.webDomainTokens.isSuperset(of: $0.webDomainTokens)
      } ?? true
    guard let at = laterAt, !keeps, var both = old else {
      if let d = try? JSONEncoder().encode(s) { defaults?.set(d, forKey: Pull.selectionKey) }
      defaults?.removeObject(forKey: Pull.selectionNextKey)
      defaults?.removeObject(forKey: Pull.selectionAtKey)
      return
    }
    both.applicationTokens.formUnion(s.applicationTokens)
    both.categoryTokens.formUnion(s.categoryTokens)
    both.webDomainTokens.formUnion(s.webDomainTokens)
    if let d = try? JSONEncoder().encode(both) { defaults?.set(d, forKey: Pull.selectionKey) }
    if let d = try? JSONEncoder().encode(s) { defaults?.set(d, forKey: Pull.selectionNextKey) }
    defaults?.set(at, forKey: Pull.selectionAtKey)
  }

  // MARK: Apple's schedules

  /// one schedule per piece, each set again only when what it is set from changes (restarting a schedule ends it, and Apple counts
  /// use only from then): pull.long, and the night's two parts (pull.night.a from its start to 23:59, pull.night.b from midnight,
  /// or its start when that is after midnight, to 6 AM). The night's starts and ends are where the extensions catch up with the
  /// clock (Pull.guardNow), so they run whenever Screen Time is on.
  private func schedule(_ b: [String: Any], prefs p: [String: Any]) {
    guard let s = Pull.selection() else { return }
    let long = (p["long"] as? Int) ?? 0
    let hard = (p["hard"] as? Bool) != false
    /* a hash that stays the same from launch to launch (String's own does not) */
    let sel = defaults?.data(forKey: Pull.selectionKey).map { $0.reduce(5381) { ($0 &* 33) &+ Int($1) } } ?? 0
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
    if let f = Pull.nightFrom(b) {
      var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
      if hard { for (i, m) in hardAt.enumerated() { events[DeviceActivityEvent.Name(String(i + 1))] = ev(DateComponents(minute: m)) } }
      let key = "\(f)|\(hard)|\(sel)"
      let end = Pull.nightEnd
      /* the evening part, when the night starts before midnight and leaves Apple's shortest schedule before 23:59 */
      if f > end && 23 * 60 + 59 - f >= 15 {
        want["pull.night.a"] = (
          key,
          DeviceActivitySchedule(
            intervalStart: DateComponents(hour: f / 60, minute: f % 60), intervalEnd: DateComponents(hour: 23, minute: 59), repeats: true),
          events
        )
      }
      let b0 = f < end ? f : 0
      if end - b0 >= 15 {
        want["pull.night.b"] = (
          key,
          DeviceActivitySchedule(
            intervalStart: DateComponents(hour: b0 / 60, minute: b0 % 60), intervalEnd: DateComponents(hour: end / 60, minute: end % 60),
            repeats: true),
          events
        )
      }
    }
    var keys = (defaults?.dictionary(forKey: schedKey) as? [String: String]) ?? [:]
    let center = DeviceActivityCenter()
    /* anything no longer wanted, the old hard-hours windows included, is stopped: what is held does not depend on a schedule
       running, since every start, end and write checks the clock */
    for name in Array(keys.keys) where want[name] == nil {
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

  /// sets the schedules again from the last bridge written, and what is held now (after a new pick)
  private func rewrite() {
    guard let b = Pull.bridge() else { return }
    let p = Pull.prefs(b)
    guard (p["on"] as? Bool) == true else { return }
    Pull.guardNow(b)
    schedule(b, prefs: p)
  }

  /// when the app started a schedule, for the monitor
  private func stamp(_ name: String) {
    var started = (defaults?.dictionary(forKey: Pull.startedKey) as? [String: Double]) ?? [:]
    started[name] = nowMs
    defaults?.set(started, forKey: Pull.startedKey)
  }

  private func stopAll(forget: Bool) {
    DeviceActivityCenter().stopMonitoring()
    Pull.store.clearAllSettings()
    for k in [schedKey, Pull.startedKey, Pull.liftKey, Pull.openKey, Pull.webKey, "pull.rest"] { defaults?.removeObject(forKey: k) }
    if forget {
      for k in [Pull.selectionKey, Pull.selectionNextKey, Pull.selectionAtKey, Pull.ignoredKey] { defaults?.removeObject(forKey: k) }
    }
  }

  // MARK: helpers

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
            Button("Done") { done(Pull.count(selection) > 0 ? selection : nil) }
          }
        }
    }
  }
}
