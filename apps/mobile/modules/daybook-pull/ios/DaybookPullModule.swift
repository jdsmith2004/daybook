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
/// a list missing from the bridge is forgotten (its apps let go) only once its pick is older than this: a new list is picked a
/// moment before the app writes it into the bridge
private let forgetAfter: Double = 10 * 60_000

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

    /// Apple's answer now: "approved", "denied" (taken back in Settings) or "notDetermined" (after a restore to a new phone, the
    /// ask was never made on this one). The status loads late after a launch and reads "not determined" until it does, so it is
    /// read for up to three seconds before that is believed.
    AsyncFunction("status") { () async -> String in
      var st = AuthorizationCenter.shared.authorizationStatus
      var tries = 0
      while st == .notDetermined && tries < 15 {
        try? await Task.sleep(nanoseconds: 200_000_000)
        st = AuthorizationCenter.shared.authorizationStatus
        tries += 1
      }
      return st == .approved ? "approved" : st == .denied ? "denied" : "notDetermined"
    }

    /// what is not working, for core pullTrouble: schedules Apple would not start, picked apps that cannot be read back, and how
    /// many single apps are picked (Apple holds at most 50)
    Function("health") { () -> [String: Any] in
      Pull.readFail()
      /* Apple's limit is per shield, and each list has its own: the fullest list */
      let apps = Pull.ids.map { Pull.selection($0)?.applicationTokens.count ?? 0 }.max() ?? 0
      return [
        "failed": (self.defaults?.stringArray(forKey: Pull.failedKey)) ?? [],
        "decodeFail": (self.defaults?.double(forKey: Pull.decodeFailKey) ?? 0) > 0,
        "apps": apps,
      ]
    }

    /// Try again: every schedule is set again from the last bridge
    AsyncFunction("retry") { () in
      self.defaults?.removeObject(forKey: schedKey)
      self.rewrite()
    }.runOnQueue(Self.queue)

    /// the app's own morning check, on its first open after 6 AM with access still given (the monitor's may not have come)
    Function("confirm") { () in
      Pull.confirmNight(allowed: true)
    }

    /// Apple's app list for one list, starting from what it has; how many apps, kinds and sites are chosen, or null when it was
    /// closed. `laterAt` (core pullLooseAt) is when a looser pick starts: a pick that leaves out an app keeps it in until then
    /// (loosen slowly), while one that only adds works now. Null: it all works now. `fresh`: a new list, starting empty (anything
    /// an old list left under this id is let go first, once something is picked).
    AsyncFunction("pick") { (list: String, laterAt: Double?, fresh: Bool, promise: Promise) in
      guard Pull.ids.contains(list), self.picking == nil, let top = self.topController() else {
        promise.resolve(nil)
        return
      }
      self.picking = promise
      let start =
        fresh ? FamilyActivitySelection() : (Pull.decode(Pull.selNextKey(list)) ?? Pull.selection(list) ?? FamilyActivitySelection())
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
          if fresh { self.forget(list) }
          self.choose(s, list: list, laterAt: fresh ? nil : laterAt)
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

    /// how many a list has chosen now (a smaller pick waiting for the morning counts as chosen)
    AsyncFunction("picked") { (list: String) -> Int in
      guard Pull.ids.contains(list) else { return 0 }
      return (Pull.decode(Pull.selNextKey(list)) ?? Pull.selection(list)).map(Pull.count) ?? 0
    }

    /// ms when a list's smaller pick starts, or null when none waits
    Function("pickWaits") { (list: String) -> Double? in
      guard Pull.ids.contains(list), Pull.decode(Pull.selNextKey(list)) != nil else { return nil }
      let at = self.defaults?.double(forKey: Pull.selAtKey(list)) ?? 0
      return at > 0 ? at : nil
    }

    /// hands the extensions core pullBridge's JSON (written on every open and change), sets what is held now, and sets Apple's
    /// schedules to match
    AsyncFunction("write") { (json: String) in
      self.apply(json)
    }.runOnQueue(Self.queue)

    /// Good night (core pullArmNow): the same write, with the night starting now; whether adult sites wait now, so the flame can
    /// say only what is true
    AsyncFunction("armNow") { (json: String) -> Bool in
      self.apply(json)
      return Pull.bridge().map { Pull.wanted($0).web } ?? false
    }.runOnQueue(Self.queue)

    /// Lift every wait now: nothing is held until `until` ms (core pullLiftUntil: tonight's start by day, 6 AM at night)
    AsyncFunction("lift") { (until: Double) in
      self.defaults?.set(until, forKey: Pull.liftKey)
      DeviceActivityCenter().stopMonitoring(
        ["pull.open", "pull.relock"].map { DeviceActivityName($0) } + Pull.ids.map { DeviceActivityName("pull.open." + $0) })
      Pull.guardNow()
      /* its own tick at the end, so the waits come back on time even if tonight's start was changed after it */
      Pull.tick("pull.unlift", at: Date(timeIntervalSince1970: until / 1000).addingTimeInterval(60))
    }.runOnQueue(Self.queue)

    /// After a list's wait: that list opens for this many minutes of use (5, 10 or 30, chosen by the person), then its wait is
    /// back; any list sharing an app with it opens too, or that app would stay behind the other's shield. `list` nil (a night note
    /// or a shield that could not tell): every list opens. In the night, `through`: tonight goes in the week as a night the person
    /// went through (the stake was said first).
    AsyncFunction("openFor") { (list: String?, minutes: Int, through: Bool) in
      let picked = Pull.ids.compactMap { id in Pull.selection(id).map { (id: id, s: $0) } }
      var open = picked
      if let l = list {
        guard let mine = picked.first(where: { $0.id == l }) else { return }
        open = picked.filter { $0.id == l || Pull.overlaps($0.s, mine.s) }
      }
      if open.isEmpty { return }
      if through { Pull.markNight(2) }
      let mins = Double(max(1, minutes))
      let span = Pull.openSpan(mins)
      /* stamped before the old one stops: its end then reads as a restart, not as time up (the monitor) */
      for o in open {
        self.defaults?.set(self.nowMs, forKey: Pull.openAtKey(o.id))
        self.defaults?.set(mins, forKey: Pull.openMinsKey(o.id))
        self.defaults?.set(self.nowMs + span, forKey: Pull.openUntilKey(o.id))
      }
      Pull.guardNow()
      let center = DeviceActivityCenter()
      let cal = Calendar.current
      let from = Date()
      let parts: Set<Calendar.Component> = [.year, .month, .day, .hour, .minute, .second]
      /* longer than the minutes of use and than Apple's shortest schedule (core PULL_MIN_SCHEDULE), started now, never backdated */
      let schedule = DeviceActivitySchedule(
        intervalStart: cal.dateComponents(parts, from: from),
        intervalEnd: cal.dateComponents(parts, from: from.addingTimeInterval(span / 1000)),
        repeats: false
      )
      var failed = false
      for o in open {
        let name = "pull.open." + o.id
        center.stopMonitoring([DeviceActivityName(name)])
        let event = DeviceActivityEvent(
          applications: o.s.applicationTokens, categories: o.s.categoryTokens, webDomains: o.s.webDomainTokens,
          threshold: DateComponents(minute: Int(mins)))
        do {
          try center.startMonitoring(DeviceActivityName(name), during: schedule, events: [DeviceActivityEvent.Name("open"): event])
          self.stamp(name)
        } catch {
          /* Apple would not watch the minutes: this list's wait comes back at once rather than never */
          self.defaults?.set(0.0, forKey: Pull.openUntilKey(o.id))
          failed = true
        }
      }
      if failed { Pull.guardNow() }
    }.runOnQueue(Self.queue)

    /// After the long wait: adult sites open for this many minutes, then pull.relock puts the filter back (and the app re-checks
    /// on every open). Tonight goes in the week as a night the person went through.
    AsyncFunction("openWeb") { (minutes: Int, count: Bool) in
      let m = max(1, minutes)
      let until = Date().addingTimeInterval(TimeInterval(m * 60))
      /* the relock, from the minute after the time is up (so its start never comes a few seconds too soon). Hour and minute only:
         one developer saw full dates make callbacks unreliable. One that would cross midnight is not needed: the night's
         23:59 end and midnight start put the filter back. One Apple will not take keeps the sites closed (fail closed). */
      let start = until.addingTimeInterval(60)
      let midnight = !Calendar.current.isDate(start, inSameDayAs: start.addingTimeInterval(16 * 60))
      if !midnight && !Pull.tick("pull.relock", at: start) { return }
      self.defaults?.set(until.timeIntervalSince1970 * 1000, forKey: Pull.webKey)
      if count { Pull.markNight(2) }
      Pull.guardNow()
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

    /// when a shield's button asked for Daybook in the last two minutes (its wait screen opens, the wait counted from that tap),
    /// whether it was over an adult site (the long wait), and which list asked ("" when it cannot be told); taken once. Null when
    /// none.
    Function("takeWant") { () -> [String: Any]? in
      let v = self.defaults?.double(forKey: Pull.wantKey) ?? 0
      let long = self.defaults?.bool(forKey: Pull.wantLongKey) ?? false
      let list = self.defaults?.string(forKey: Pull.wantListKey) ?? ""
      for k in [Pull.wantKey, Pull.wantLongKey, Pull.wantListKey] { self.defaults?.removeObject(forKey: k) }
      guard v > 0 && self.nowMs - v < 120_000 && v <= self.nowMs else { return nil }
      return ["at": v, "long": long, "list": list]
    }
  }

  // MARK: the pick

  /// keeps a list's pick. One that leaves an app out, outside the morning, keeps both picks in until `laterAt` (the new one waits).
  private func choose(_ s: FamilyActivitySelection, list: String, laterAt: Double?) {
    defaults?.set(nowMs, forKey: Pull.pickedAtKey(list))
    let old = Pull.selection(list)
    let keeps =
      old.map {
        s.applicationTokens.isSuperset(of: $0.applicationTokens) && s.categoryTokens.isSuperset(of: $0.categoryTokens)
          && s.webDomainTokens.isSuperset(of: $0.webDomainTokens)
      } ?? true
    guard let at = laterAt, !keeps, var both = old else {
      if let d = try? JSONEncoder().encode(s) { defaults?.set(d, forKey: Pull.selKey(list)) }
      defaults?.removeObject(forKey: Pull.selNextKey(list))
      defaults?.removeObject(forKey: Pull.selAtKey(list))
      return
    }
    both.applicationTokens.formUnion(s.applicationTokens)
    both.categoryTokens.formUnion(s.categoryTokens)
    both.webDomainTokens.formUnion(s.webDomainTokens)
    if let d = try? JSONEncoder().encode(both) { defaults?.set(d, forKey: Pull.selKey(list)) }
    if let d = try? JSONEncoder().encode(s) { defaults?.set(d, forKey: Pull.selNextKey(list)) }
    defaults?.set(at, forKey: Pull.selAtKey(list))
  }

  /// lets a list go: its apps, its minutes open, its shield and its open schedule
  private func forget(_ list: String) {
    for k in [Pull.selKey(list), Pull.selNextKey(list), Pull.selAtKey(list), Pull.pickedAtKey(list), Pull.openUntilKey(list), Pull.openAtKey(list), Pull.openMinsKey(list)] {
      defaults?.removeObject(forKey: k)
    }
    if let st = Pull.stores[list] { Pull.clearShield(st) }
    DeviceActivityCenter().stopMonitoring([DeviceActivityName("pull.open." + list)])
  }

  // MARK: Apple's schedules

  /// one schedule per piece, each set again only when what it is set from changes (restarting a schedule ends it, and Apple counts
  /// use only from then): pull.long, and the night's parts exactly as core pullParts made them (the bridge's `parts`: its evening
  /// part to 23:59, its part after midnight to 6 AM, the heartbeat a few minutes after its start, the morning check at 6:05). The
  /// night's starts and ends are where the extensions catch up with the clock (Pull.guardNow), so they run whenever Screen Time is
  /// on. A schedule Apple will not start is kept by name (More and Today say so) and tried again on the next write.
  private func schedule(_ b: [String: Any], prefs p: [String: Any]) {
    /* the picked apps, for the minutes of use. Without them (unreadable after an update) the night still runs: the adult filter
       needs no apps, only the night's starts and ends */
    let s = Pull.union()
    let apps = Pull.count(s) > 0
    let long = apps ? ((p["long"] as? Int) ?? 0) : 0
    let hard = (p["hard"] as? Bool) != false
    /* a hash of every list's pick that stays the same from launch to launch (String's own does not) */
    let sel = Pull.ids.reduce(5381) { h, id in (defaults?.data(forKey: Pull.selKey(id)) ?? Data()).reduce(h &* 31) { ($0 &* 33) &+ Int($1) } }
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
    var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
    if hard { for (i, m) in hardAt.enumerated() { events[DeviceActivityEvent.Name(String(i + 1))] = ev(DateComponents(minute: m)) } }
    for part in (b["parts"] as? [[String: Any]]) ?? [] {
      guard let n = part["n"] as? String, let a = part["a"] as? Int, let e = part["b"] as? Int, e > a else { continue }
      let watch = (part["ev"] as? Bool) == true && hard && apps
      want[n] = (
        "\(a)|\(e)|\(watch)|\(sel)",
        DeviceActivitySchedule(
          intervalStart: DateComponents(hour: a / 60, minute: a % 60), intervalEnd: DateComponents(hour: e / 60, minute: e % 60), repeats: true),
        watch ? events : [:]
      )
    }
    var keys = (defaults?.dictionary(forKey: schedKey) as? [String: String]) ?? [:]
    let center = DeviceActivityCenter()
    /* anything no longer wanted, the old hard-hours windows included, is stopped: what is held does not depend on a schedule
       running, since every start, end and write checks the clock */
    for name in Array(keys.keys) where want[name] == nil {
      center.stopMonitoring([DeviceActivityName(name)])
      keys[name] = nil
    }
    var failed: [String] = []
    for (name, w) in want where keys[name] != w.key {
      do {
        try center.startMonitoring(DeviceActivityName(name), during: w.during, events: w.events)
        keys[name] = w.key
        stamp(name)
      } catch {
        /* said in More and on Today (core pullTrouble), and tried again on the next write */
        keys[name] = nil
        failed.append(name)
      }
    }
    defaults?.set(keys, forKey: schedKey)
    Pull.setFailed(failed)
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

  /// the write: the bridge kept for the extensions, what is held now, and the schedules
  private func apply(_ json: String) {
    defaults?.set(json, forKey: Pull.bridgeKey)
    guard let b = Pull.parse(json) else { return }
    let p = Pull.prefs(b)
    if (p["on"] as? Bool) != true {
      stopAll(forget: false)
      return
    }
    let keep = Set(Pull.lists(p).map { $0.id })
    for id in Pull.ids {
      /* a smaller pick whose morning has come */
      if Pull.decode(Pull.selNextKey(id)) != nil, (defaults?.double(forKey: Pull.selAtKey(id)) ?? 0) <= nowMs {
        if let d = defaults?.data(forKey: Pull.selNextKey(id)) { defaults?.set(d, forKey: Pull.selKey(id)) }
        defaults?.removeObject(forKey: Pull.selNextKey(id))
        defaults?.removeObject(forKey: Pull.selAtKey(id))
        defaults?.removeObject(forKey: schedKey)
      }
      /* a list removed (and its morning come, if it had to wait for one): its apps are let go */
      if !keep.contains(id), defaults?.data(forKey: Pull.selKey(id)) != nil,
        nowMs - (defaults?.double(forKey: Pull.pickedAtKey(id)) ?? 0) > forgetAfter
      {
        forget(id)
        defaults?.removeObject(forKey: schedKey)
      }
    }
    Pull.guardNow(b)
    schedule(b, prefs: p)
  }

  private func stopAll(forget: Bool) {
    DeviceActivityCenter().stopMonitoring()
    Pull.store.clearAllSettings()
    for st in Pull.stores.values { st.clearAllSettings() }
    for k in [schedKey, Pull.startedKey, Pull.liftKey, Pull.openKey, Pull.webKey, Pull.failedKey, "pull.rest"] { defaults?.removeObject(forKey: k) }
    for id in Pull.ids { for k in [Pull.openUntilKey(id), Pull.openAtKey(id), Pull.openMinsKey(id)] { defaults?.removeObject(forKey: k) } }
    if forget {
      for k in [Pull.selectionKey, Pull.selectionNextKey, Pull.selectionAtKey, Pull.ignoredKey] { defaults?.removeObject(forKey: k) }
      for id in Pull.ids { for k in [Pull.selKey(id), Pull.selNextKey(id), Pull.selAtKey(id), Pull.pickedAtKey(id)] { defaults?.removeObject(forKey: k) } }
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
