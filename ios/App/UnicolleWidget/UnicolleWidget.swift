import SwiftUI
import WidgetKit

private enum UnicolleWidgetColors {
    static let cream = Color(red: 1.0, green: 0.98, blue: 0.95)
    static let navy = Color(red: 0.063, green: 0.137, blue: 0.247)
    static let blue = Color(red: 0.0, green: 0.38, blue: 0.78)
    static let gold = Color(red: 0.89, green: 0.62, blue: 0.18)
}

struct UnicolleWidgetEntry: TimelineEntry {
    let date: Date
    let eatenCount: Int
    let progressRate: Int
    let recentFoodName: String
    let updatedAt: Date?
}

struct UnicolleWidgetProvider: TimelineProvider {
    private let suiteName = "group.com.doublecorgi.unicolle"

    func placeholder(in context: Context) -> UnicolleWidgetEntry {
        UnicolleWidgetEntry(date: Date(), eatenCount: 0, progressRate: 0, recentFoodName: "まだ記録がありません", updatedAt: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (UnicolleWidgetEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<UnicolleWidgetEntry>) -> Void) {
        let entry = loadEntry()
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func loadEntry() -> UnicolleWidgetEntry {
        let defaults = UserDefaults(suiteName: suiteName)
        let eatenCount = defaults?.integer(forKey: "widget.eatenCount") ?? 0
        let progressRate = defaults?.integer(forKey: "widget.progressRate") ?? 0
        let recentFoodName = defaults?.string(forKey: "widget.recentFoodName") ?? "まだ記録がありません"
        let updatedAt = defaults?.object(forKey: "widget.updatedAt") as? Date
        return UnicolleWidgetEntry(date: Date(), eatenCount: eatenCount, progressRate: progressRate, recentFoodName: recentFoodName, updatedAt: updatedAt)
    }
}

struct UnicolleWidgetView: View {
    let entry: UnicolleWidgetEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        ZStack {
            UnicolleWidgetColors.cream
            if family == .systemMedium {
                mediumContent
            } else {
                smallContent
            }
        }
        .widgetURL(URL(string: "unicolle://eaten"))
    }

    private var smallContent: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("ユニコレ")
                .font(.headline.weight(.bold))
                .foregroundStyle(UnicolleWidgetColors.navy)
            Spacer(minLength: 2)
            Text("食べた数")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
            Text("\(entry.eatenCount)品")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(UnicolleWidgetColors.blue)
            ProgressView(value: Double(entry.progressRate), total: 100)
                .tint(UnicolleWidgetColors.gold)
            Text("達成率 \(entry.progressRate)%")
                .font(.caption.weight(.semibold))
                .foregroundStyle(UnicolleWidgetColors.navy)
        }
        .padding(14)
    }

    private var mediumContent: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 8) {
                Text("ユニコレ")
                    .font(.title3.weight(.bold))
                    .foregroundStyle(UnicolleWidgetColors.navy)
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text("\(entry.eatenCount)")
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(UnicolleWidgetColors.blue)
                    Text("品")
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(UnicolleWidgetColors.navy)
                }
                ProgressView(value: Double(entry.progressRate), total: 100)
                    .tint(UnicolleWidgetColors.gold)
                Text("達成率 \(entry.progressRate)%")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            VStack(alignment: .leading, spacing: 8) {
                Text("最近食べた")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(entry.recentFoodName)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(UnicolleWidgetColors.navy)
                    .lineLimit(2)
                Spacer(minLength: 2)
                Link(destination: URL(string: "unicolle://record")!) {
                    Label("記録する", systemImage: "plus.circle.fill")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 7)
                        .background(UnicolleWidgetColors.blue, in: Capsule())
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(16)
    }
}

struct UnicolleWidget: Widget {
    let kind = "UnicolleWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: UnicolleWidgetProvider()) { entry in
            UnicolleWidgetView(entry: entry)
        }
        .configurationDisplayName("ユニコレ")
        .description("食べた数と達成率を表示します。")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct UnicolleWidgetBundle: WidgetBundle {
    var body: some Widget {
        UnicolleWidget()
    }
}
