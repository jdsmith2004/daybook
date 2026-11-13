// The app's side of the night pack (core night-pack.ts, lib/night-pack.ts). The actions themselves are in the app target
// (plugins/night-pack/NightPackIntents.swift); this writes what they read and reads what they leave, through the same
// UserDefaults keys. Everything stays on this phone.
import ExpoModulesCore
import Foundation

private let pre = "daybook.pack."

public final class NightPackModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NightPack")

    /// the actions need iOS 26 (an action that opens the app only when it should)
    Constant("ok") { () -> Bool in
      if #available(iOS 26.0, *) { return true }
      return false
    }

    /// tonight's start, in minutes after midnight
    Function("setNight") { (at: Int) in
      UserDefaults.standard.set(at, forKey: pre + "at")
    }

    /// after the wait: the apps open without it until this moment (ms)
    Function("openUntil") { (until: Double) in
      UserDefaults.standard.set(until, forKey: pre + "open")
    }

    /// when each action last ran (ms), by kind
    Function("seen") { () -> [String: Double] in
      var out: [String: Double] = [:]
      for k in ["wait", "bed", "wake"] {
        let v = UserDefaults.standard.double(forKey: pre + "seen." + k)
        if v > 0 { out[k] = v }
      }
      return out
    }

    /// the page an action left to open, taken once
    Function("take") { () -> String? in
      let r = UserDefaults.standard.string(forKey: pre + "route")
      UserDefaults.standard.removeObject(forKey: pre + "route")
      return r
    }
  }
}
