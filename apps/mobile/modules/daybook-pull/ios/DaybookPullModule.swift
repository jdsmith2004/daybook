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
/// what the schedules were last set from, so they are set again only when it changes: restarting a schedule ends it, and ending the
/// hard hours' schedule would lift a pause that is running
private let schedKey = "pull.sched"
/// the minutes of use in the hard hours for the two notes and the pause (core PULL_HARD_AT)
private let hardAt = [10, 20, 30]
/// Apple's shortest schedule (core PULL_MIN_SCHEDULE), plus a minute so it is never too short
private let openSchedule: TimeInterval = 16 * 60

public final class DaybookPullModule: Module {
  private var picking: Promise?

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
      if #available(iOS 16.0, *) {
        do {
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        } catch {
          return false
        }
        return AuthorizationCenter.shared.authorizationStatus == .approved
      }
      return false
    }

    /// whether access is still given (it can be taken back in Settings at any time, and the status can lag: read it fresh)
    AsyncFunction("allowed") { () -> Bool in
      AuthorizationCenter.shared.authorizationStatus == .approved
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
        if let d = try? JSONEncoder().encode(s) { self.defaults?.set(d, forKey: selectionKey) }
        /* what is watched changed: the schedules are set again on the next write */
        self.defaults?.removeObject(forKey: schedKey)
        p?.resolve(Self.count(s))
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
      /* the pause turned off while it runs: lifted now */
      if (p["pause"] as? Bool) != true { self.liftAll() }
      self.schedule(b, prefs: p)
    }

    /// lifts every pause at once
    AsyncFunction("lift") { () in
      self.liftAll()
    }

    /// the apps open for this many minutes of use (inside Apple's shortest schedule); then, while the hard hours last, the pause is back
    AsyncFunction("openFor") { (minutes: Int) in
      guard let s = self.selection() else { return }
      let resting = (self.defaults?.double(forKey: restKey) ?? 0) > self.nowMs
      self.clearShield()
      guard resting else { return }
      let center = DeviceActivityCenter()
      center.stopMonitoring([DeviceActivityName("pull.open")])
      let cal = Calendar.current
      let from = Date().addingTimeInterval(-60)
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
        try center.startMonitoring(DeviceActivityName("pull.open"), during: schedule, events: [DeviceActivityEventName("open"): event])
      } catch {
        /* Apple would not watch the minutes: the pause comes back at once rather than never */
        self.shield(s)
      }
    }

    /// stops everything: nothing watched, nothing paused, nothing picked
    AsyncFunction("stop") { () in
      self.stopAll(forget: true)
    }

    /// when the hard hours' notes were ignored (core pullDrift), or null
    Function("ignoredAt") { () -> Double? in
      let v = self.defaults?.double(forKey: ignoredKey) ?? 0
      return v > 0 ? v : nil
    }

    /// whether a pause's button asked for Daybook in the last two minutes (its wait screen opens), taken once
    Function("takeWant") { () -> Bool in
      let v = self.defaults?.double(forKey: wantKey) ?? 0
      self.defaults?.removeObject(forKey: wantKey)
      return v > 0 && self.nowMs - v < 120_000
    }
  }

  // MARK: Apple's schedules

  private func schedule(_ b: [String: Any], prefs p: [String: Any]) {
    guard let s = selection() else { return }
    let long = (p["long"] as? Int) ?? 0
    let hard = (p["hard"] as? Bool) != false
    let pause = (p["pause"] as? Bool) == true
    let windows = ((b["windows"] as? [[String: Any]]) ?? []).compactMap { w -> (Int, Int)? in
      guard let wd = w["weekday"] as? Int, let h = w["start"] as? Int, (1...7).contains(wd), (0...23).contains(h) else { return nil }
      return (wd, h)
    }
    /* a hash that stays the same from launch to launch (String's own does not) */
    let sel = defaults?.data(forKey: selectionKey).map { $0.reduce(5381) { ($0 &* 33) &+ Int($1) } } ?? 0
    let key = "\(long)|\(hard)|\(pause)|\(windows.map { "\($0.0)@\($0.1)" }.joined(separator: ","))|\(sel)"
    if defaults?.string(forKey: schedKey) == key { return }
    let center = DeviceActivityCenter()
    center.stopMonitoring([DeviceActivityName("pull.long")] + (1...7).map { DeviceActivityName("pull.hard.\($0)") })
    let ev = { (m: DateComponents) in
      DeviceActivityEvent(applications: s.applicationTokens, categories: s.categoryTokens, webDomains: s.webDomainTokens, threshold: m)
    }
    var ok = true
    if long > 0 {
      let day = DeviceActivitySchedule(
        intervalStart: DateComponents(hour: 0, minute: 0), intervalEnd: DateComponents(hour: 23, minute: 59), repeats: true)
      do {
        try center.startMonitoring(
          DeviceActivityName("pull.long"), during: day, events: [DeviceActivityEventName("long"): ev(DateComponents(hour: long))])
      } catch { ok = false }
    }
    if hard {
      for (wd, h) in windows {
        let endH = (h + 2) % 24
        let endWd = h + 2 >= 24 ? wd % 7 + 1 : wd
        let w = DeviceActivitySchedule(
          intervalStart: DateComponents(hour: h, minute: 0, weekday: wd),
          intervalEnd: DateComponents(hour: endH, minute: 0, weekday: endWd),
          repeats: true)
        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
        for (i, m) in hardAt.enumerated() { events[DeviceActivityEventName(String(i + 1))] = ev(DateComponents(minute: m)) }
        do {
          try center.startMonitoring(DeviceActivityName("pull.hard.\(wd)"), during: w, events: events)
        } catch { ok = false }
      }
    }
    /* kept only once Apple took every schedule, so a failure is tried again on the next open */
    if ok { defaults?.set(key, forKey: schedKey) } else { defaults?.removeObject(forKey: schedKey) }
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
