// The monitor (Apple's DeviceActivity): Apple wakes it when a schedule starts or ends, or when the picked apps pass a threshold.
// It is told only that, never the numbers or the app. The schedules are set by the main app (DaybookPullModule):
//   pull.long        every day, one event "long" at the person's hours of use (1, 2 or 3)
//   pull.hard.<1-7>  the hard hours on that weekday (1 Sunday), events "1", "2" at 10 and 20 minutes of use, "3" at 30
//   pull.open        the few minutes open after the wait, event "open" at those minutes of use
// Thresholds are known to fire early, so one that comes before it could have is ignored. Nothing here is irreversible: a pause
// ends with its window, and the person can lift it in Daybook or in Settings at any time.
import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
    super.eventDidReachThreshold(event, activity: activity)
    guard let b = Pull.bridge() else { return }
    let name = activity.rawValue
    let e = event.rawValue
    if name == "pull.long" {
      if let k = Pull.noteFor(b, kind: "long") { Pull.post(b, kind: k, once: Pull.logDay(b)) }
      return
    }
    if name == "pull.open" {
      /* the minutes open are used up: the pause comes back while tonight's hard hours last */
      if Pull.resting, let s = Pull.selection() { Pull.shield(s) }
      return
    }
    guard name.hasPrefix("pull.hard."), let wd = Int(name.dropFirst("pull.hard.".count)), let w = window(b, weekday: wd) else { return }
    let mins = e == "1" ? 10.0 : e == "2" ? 20.0 : 30.0
    /* a threshold cannot come before that much time has passed in the window */
    if Date().timeIntervalSince(w.start) < (mins - 1) * 60 { return }
    let once = String(Int(w.start.timeIntervalSince1970))
    if e == "1" || e == "2" {
      if let k = Pull.noteFor(b, kind: e) { Pull.post(b, kind: k, once: once) }
      return
    }
    /* 30 minutes of use inside the hard hours, after both notes */
    let p = Pull.prefs(b)
    if (p["hard"] as? Bool) == false { return }
    if !Pull.quiet(b) { Pull.defaults?.set(Pull.nowMs, forKey: Pull.ignoredKey) }
    if (p["pause"] as? Bool) == true { Pull.rest(until: w.end.timeIntervalSince1970 * 1000) }
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    let name = activity.rawValue
    if name.hasPrefix("pull.hard.") {
      /* the hard hours are over: the pause ends with them. Restarting a schedule also ends it, so only when the window is truly over. */
      let rest = Pull.defaults?.double(forKey: Pull.restKey) ?? 0
      if rest > 0 && Pull.nowMs >= rest - 60_000 { Pull.lift() }
    } else if name == "pull.open" {
      /* fifteen minutes are up even if the minutes of use were not: the pause comes back while the hard hours last */
      if Pull.resting, let s = Pull.selection() { Pull.shield(s) }
    }
  }

  /// tonight's window for a weekday's schedule: its start (the latest one not in the future) and its end, two hours later
  private func window(_ b: [String: Any], weekday: Int) -> (start: Date, end: Date)? {
    guard let ws = b["windows"] as? [[String: Any]], let w = ws.first(where: { ($0["weekday"] as? Int) == weekday }),
      let h = w["start"] as? Int
    else { return nil }
    let cal = Calendar.current
    let now = Date()
    var c = cal.dateComponents([.year, .month, .day], from: now)
    c.hour = h
    c.minute = 0
    guard var start = cal.date(from: c) else { return nil }
    if start > now { start = cal.date(byAdding: .day, value: -1, to: start) ?? start }
    return (start, start.addingTimeInterval(2 * 3600))
  }
}
