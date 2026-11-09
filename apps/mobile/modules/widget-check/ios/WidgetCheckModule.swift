// Whether the flame widget is on a screen (core flame-widget.ts): WidgetKit's list of the widgets the person has placed. It only
// reads the sizes of Daybook's own widgets; nothing about other apps or the screen is ever seen.
import ExpoModulesCore
import WidgetKit

public final class WidgetCheckModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WidgetCheck")

    /// the sizes of Daybook's widgets on a screen now ("systemSmall", "accessoryCircular", ...); empty when there are none
    AsyncFunction("placed") { (promise: Promise) in
      WidgetCenter.shared.getCurrentConfigurations { result in
        switch result {
        case .success(let infos):
          promise.resolve(infos.map { String(describing: $0.family) })
        case .failure:
          promise.resolve([String]())
        }
      }
    }
  }
}
