import Foundation
import Capacitor
import WidgetKit

@objc(WidgetSyncPlugin)
public class WidgetSyncPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetSyncPlugin"
    public let jsName = "WidgetSync"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    private let suiteName = "group.com.doublecorgi.unicolle"

    @objc func update(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: suiteName) else {
            call.reject("Widget data storage is unavailable")
            return
        }

        let eatenCount = call.getInt("eatenCount", 0)
        let progressRate = call.getInt("progressRate", 0)
        let recentFoodName = call.getString("recentFoodName")
        let updatedAt = call.getString("updatedAt", ISO8601DateFormatter().string(from: Date()))

        defaults.set(max(0, eatenCount), forKey: "widget.eatenCount")
        defaults.set(max(0, min(100, progressRate)), forKey: "widget.progressRate")
        defaults.set(recentFoodName, forKey: "widget.recentFoodName")
        defaults.set(updatedAt, forKey: "widget.updatedAt")
        defaults.synchronize()

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: "UnicolleWidget")
        }
        call.resolve()
    }
}
