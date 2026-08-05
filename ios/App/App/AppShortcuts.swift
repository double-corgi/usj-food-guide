import AppIntents
import Foundation
import UIKit

@available(iOS 16.0, *)
struct UnicolleRecordFoodIntent: AppIntent {
    static var title: LocalizedStringResource = "ユニコレで食べたものを記録"
    static var description = IntentDescription("ユニコレを開いて、食べたものを記録します。")
    static var openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        openUnicolleURL("unicolle://record")
        return .result()
    }
}

@available(iOS 16.0, *)
struct UnicolleOpenEatenIntent: AppIntent {
    static var title: LocalizedStringResource = "食べた記録を開く"
    static var description = IntentDescription("ユニコレの食べた記録を開きます。")
    static var openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        openUnicolleURL("unicolle://eaten")
        return .result()
    }
}

@available(iOS 16.0, *)
struct UnicolleOpenWishlistIntent: AppIntent {
    static var title: LocalizedStringResource = "次回食べたい商品を見る"
    static var description = IntentDescription("ユニコレの次回食べたい商品を開きます。")
    static var openAppWhenRun = true

    @MainActor
    func perform() async throws -> some IntentResult {
        openUnicolleURL("unicolle://wishlist")
        return .result()
    }
}

@available(iOS 16.0, *)
@MainActor
private func openUnicolleURL(_ value: String) {
    guard let url = URL(string: value) else { return }
    UIApplication.shared.open(url)
}

@available(iOS 16.0, *)
struct UnicolleAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: UnicolleRecordFoodIntent(),
            phrases: [
                "\(.applicationName)で食べたものを記録",
                "\(.applicationName)で記録する"
            ],
            shortTitle: "記録する",
            systemImageName: "plus.circle.fill"
        )
        AppShortcut(
            intent: UnicolleOpenEatenIntent(),
            phrases: [
                "\(.applicationName)で食べた記録を開く",
                "\(.applicationName)で食べたものを見る"
            ],
            shortTitle: "食べた記録",
            systemImageName: "photo.on.rectangle"
        )
        AppShortcut(
            intent: UnicolleOpenWishlistIntent(),
            phrases: [
                "\(.applicationName)で次回食べたい商品を見る",
                "\(.applicationName)で食べたいものを見る"
            ],
            shortTitle: "次回食べたい",
            systemImageName: "flag"
        )
    }
}
