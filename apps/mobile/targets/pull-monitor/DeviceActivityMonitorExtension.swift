// The monitor (Apple's DeviceActivity): Apple wakes it when a schedule starts or ends, or when the picked apps pass a threshold.
// It is told only that, never the numbers or the app. The schedules are set by the main app (DaybookPullModule):
//   pull.long             every day, one event "long" at the person's hours of use (1, 2 or 3)
//   pull.night.a / .b     the night, from the morning's time to 23:59 and from midnight to 6 AM (two, so nothing rests on an
//                         interval across midnight); events "1", "2" at 10 and 20 minutes of use, "3" at 30 (the notes ignored)
//   pull.open             the few minutes open after the short wait, event "open" at those minutes of use
//   pull.relock           10 minutes after adult sites opened from the long wait: the filter is back
//   pull.unlift           when Lift every wait now ends: the waits are back
// Every start and end runs Pull.guardNow, which sets the shield and the adult filter from the clock and the App Group, so a
// callback that comes late, twice or not at all is caught up by the next one (or by the app on its next open). Thresholds are
// known to fire early right after a schedule starts (iOS 17 to 26), so one that comes sooner than its minutes after both the
// part's start and the app's start of that schedule is ignored. Nothing here is irreversible: the person can lift every wait in
// Daybook or in Settings at any time.
import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  override func intervalDidStart(for activity: DeviceActivityName) {
    super.intervalDidStart(for: activity)
    Pull.guardNow()
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    super.intervalDidEnd(for: activity)
    if activity.rawValue == "pull.open" {
      /* its time is up even if the minutes of use were not: the wait is back. An end sooner than that is the app starting a new
         one (a second Open), not the end. */
      let at = Pull.defaults?.double(forKey: Pull.openAtKey) ?? 0
      if Pull.nowMs < at + Pull.openSpan - 60_000 { return }
      Pull.defaults?.set(0.0, forKey: Pull.openKey)
    }
    Pull.guardNow()
  }

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
      /* the minutes open are used up: the wait is back */
      let at = Pull.defaults?.double(forKey: Pull.openAtKey) ?? 0
      let mins = Pull.defaults?.double(forKey: Pull.openMinsKey) ?? 3
      if !Pull.enoughSince(max(at, since), minutes: mins) { return }
      Pull.defaults?.set(0.0, forKey: Pull.openKey)
      Pull.guardNow(b)
      return
    }
    guard Pull.isNight(name), Pull.inNight(b), let start = Pull.partStart(name, b) else { return }
    let mins = e == "1" ? 10.0 : e == "2" ? 20.0 : 30.0
    if !Pull.enoughSince(max(since, start.timeIntervalSince1970 * 1000), minutes: mins) { return }
    /* each note at most once a night, across both parts of it */
    let once = Pull.nightOf()
    if e == "1" || e == "2" {
      if let k = Pull.noteFor(b, kind: e) { Pull.post(b, kind: k, once: once) }
      return
    }
    /* 30 minutes of use in the night, after both notes: the fire burns lower (core pullDrift), never in the quiet after a slip */
    if (Pull.prefs(b)["hard"] as? Bool) == false || Pull.quiet(b) { return }
    if !Pull.mark("ignored", once: once) { return }
    Pull.defaults?.set(Pull.nowMs, forKey: Pull.ignoredKey)
  }
}
