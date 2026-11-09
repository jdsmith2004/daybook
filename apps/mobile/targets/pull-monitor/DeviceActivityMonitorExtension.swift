// The monitor (Apple's DeviceActivity): Apple wakes it when a schedule starts or ends, or when the picked apps pass a threshold.
// It is told only that, never the numbers or the app. The schedules are set by the main app (DaybookPullModule):
//   pull.long             every day, one event "long" at the person's hours of use (1, 2 or 3)
//   pull.hard.<wd>.<h>    a hard-hours window: weekday (1 Sunday), starting hour; events "1", "2" at 10 and 20 minutes of use, "3" at 30
//   pull.open             the few minutes open after the wait, event "open" at those minutes of use
// Thresholds are known to fire early, right after a schedule starts (iOS 17 to 26), so one that comes sooner than its minutes after
// both the window's start and the app's start of that schedule is ignored. Stopping a schedule also ends its interval here, so an
// end that comes before its time is ignored too. Nothing here is irreversible: a pause ends with its window, the app lifts a stale
// one when it opens, and the person can lift it in Daybook or in Settings at any time.
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
    let since = Pull.started(name)
    if name == "pull.long" {
      let hours = Double((Pull.prefs(b)["long"] as? Int) ?? 0)
      guard hours > 0, let midnight = Calendar.current.date(bySettingHour: 0, minute: 0, second: 0, of: Date()) else { return }
      let from = max(since, midnight.timeIntervalSince1970 * 1000)
      if !Pull.enoughSince(from, minutes: hours * 60) { return }
      if let k = Pull.noteFor(b, kind: "long") { Pull.post(b, kind: k, once: Pull.logDay(b)) }
      return
    }
    if name == "pull.open" {
      /* the minutes open are used up: the pause comes back while tonight's hard hours last */
      let at = Pull.defaults?.double(forKey: Pull.openAtKey) ?? 0
      let mins = Pull.defaults?.double(forKey: Pull.openMinsKey) ?? 3
      if !Pull.enoughSince(max(at, since), minutes: mins) { return }
      if Pull.resting, let s = Pull.selection() { Pull.shield(s) }
      return
    }
    guard let (_, h) = Pull.hardParts(name), let w = Pull.window(hour: h) else { return }
    let mins = e == "1" ? 10.0 : e == "2" ? 20.0 : 30.0
    if !Pull.enoughSince(max(since, w.start.timeIntervalSince1970 * 1000), minutes: mins) { return }
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
    if Pull.hardParts(name) != nil {
      /* the hard hours are over: the pause ends with them. Stopping a schedule also ends it, so only when the pause's end is here. */
      let rest = Pull.defaults?.double(forKey: Pull.restKey) ?? 0
      if rest > 0 && Pull.nowMs >= rest - 60_000 { Pull.lift() }
    } else if name == "pull.open" {
      /* its time is up even if the minutes of use were not: the pause comes back while the hard hours last. An end sooner than that
         is the app starting a new one (a second Open), not the end. */
      let at = Pull.defaults?.double(forKey: Pull.openAtKey) ?? 0
      if Pull.nowMs < at + Pull.openSpan - 60_000 { return }
      if Pull.resting, let s = Pull.selection() { Pull.shield(s) }
    }
  }
}
