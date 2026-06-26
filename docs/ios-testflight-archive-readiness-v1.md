# iOS TestFlight Archive Readiness v1

## 1. Scope

This is a pre-TestFlight archive readiness review for the UNICOLE iOS Capacitor app.

No App Store Connect upload, TestFlight submission, Supabase change, Vercel change, generated data change, crawler change, translation change, or proxy change was performed.

## 2. Current Native Settings

| Item | Current value | Status |
| --- | --- | --- |
| Bundle Identifier | `com.doublecorgi.unicolle` | OK |
| Capacitor appId | `com.doublecorgi.unicolle` | OK |
| App Display Name | `ユニコレ` | OK |
| Marketing Version | `1.0` | OK for first TestFlight, can be adjusted later |
| Build Number | `1` | OK for first archive; increment for each TestFlight upload |
| iOS Deployment Target | `15.0` | OK |
| Signing Style | Automatic | OK |
| Development Team | Not set in project build settings | Needs human setup before signed Archive |
| App Icon | `AppIcon` asset catalog configured | Present; final visual review still needed in Xcode |
| Launch Screen | `LaunchScreen.storyboard` with splash image | Present |

## 3. Release Build Result

Command:

```bash
xcodebuild -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -derivedDataPath /private/tmp/unicolle-ios-store1-release-build \
  CODE_SIGNING_ALLOWED=NO \
  build
```

Result: `BUILD SUCCEEDED`.

This confirms that the Release iOS app compiles and passes Xcode's shallow store validation step when signing is disabled. A real Archive for TestFlight still requires Apple Developer Team and signing/provisioning configuration.

## 4. Release App Bundle Checks

The generated Release app bundle contains:

| Item | Observed value |
| --- | --- |
| `CFBundleDisplayName` | `ユニコレ` |
| `CFBundleIdentifier` | `com.doublecorgi.unicolle` |
| `CFBundleShortVersionString` | `1.0` |
| `CFBundleVersion` | `1` |
| `GADApplicationIdentifier` | `ca-app-pub-4180695956777361~2101761177` |

Secret check:

No `SERVICE_ROLE`, `service_role`, `SUPABASE_SERVICE`, `SUPABASE_SERVICE_ROLE`, `NEXT_PUBLIC_SUPABASE_SERVICE`, or `sb_secret` strings were found in the Release `.app` bundle.

## 5. Important Archive Blockers

### 5.1 Signing team is not configured

`DEVELOPMENT_TEAM` was not present in the Xcode build settings output.

Before a signed Archive/TestFlight upload, a human needs to open Xcode and set:

- Team
- Signing certificate
- App Store provisioning profile or automatic signing
- App Store Connect app record for `com.doublecorgi.unicolle`

### 5.2 Capacitor server URL still points to localhost

The built app bundle contains:

```json
{
  "server": {
    "url": "http://localhost:3000",
    "cleartext": true
  }
}
```

This is acceptable for local Simulator development only. It is not TestFlight-ready, because TestFlight users will not have a local Next.js server running.

Before TestFlight, choose and apply one release strategy:

- Live URL WebView: use `https://unicolle.vercel.app` for Release builds.
- Static bundle: remove `server.url` and ship a generated static `webDir`, if the app can support the required routes statically.

Given the current server-backed/admin/data behavior, the lower-risk next step is a Release-specific live URL configuration for the public app shell.

## 6. AdMob Readiness

Current state:

- Debug uses Google test AdMob App ID.
- Release can use production AdMob App ID: `ca-app-pub-4180695956777361~2101761177`.
- The iOS banner unit is configured for Release-capable switching from the app code path.
- Simulator/Debug should continue using test ads.

Rules before TestFlight/App Store:

- Do not click production ads yourself.
- Keep Debug and Simulator on test ads.
- Confirm Release/TestFlight behavior intentionally before external testing.
- Keep ads out of `/admin`.
- Confirm ATT and privacy disclosures before enabling production ads broadly.

## 7. Privacy And Review Preparation

Required before App Store submission:

- Privacy Policy URL.
- Support URL.
- App Store privacy nutrition labels.
- Clear explanation that UNICOLE is not an official USJ app.
- Review of screenshots and copy to avoid official-app confusion.
- Data collection review for Supabase/Auth/localStorage/analytics/ads.
- ATT decision. If tracking across apps/sites is introduced through ads or analytics, ATT prompt and copy may be required.

## 8. Missing Store Assets

Still needed:

- Final App Store screenshots.
- App description.
- Subtitle.
- Keywords.
- Support URL.
- Privacy Policy URL.
- App Store category choices.
- Reviewer notes, especially non-official app positioning.
- Final visual check of icon and launch screen on real devices.

## 9. TestFlight Before-Human Checklist

Human steps before first TestFlight upload:

1. Create or confirm App Store Connect app with Bundle ID `com.doublecorgi.unicolle`.
2. Set Apple Developer Team in Xcode.
3. Decide Release WebView strategy and remove local `http://localhost:3000` from Release builds.
4. Increment build number if needed.
5. Confirm Release archive signs successfully in Xcode.
6. Confirm Debug still uses test ads.
7. Confirm Release/TestFlight ad behavior is intentional.
8. Add privacy policy and support URLs.
9. Prepare screenshots and non-official app wording.

## 10. Archive Readiness Verdict

Current status: partially ready.

The iOS project builds successfully in Release with signing disabled, and Bundle ID / display name / AdMob Release App ID are aligned. It is not ready for actual TestFlight upload until signing/team and Release `server.url` strategy are fixed.

## 11. Suggested Next Codex Goal

```text
/goal UNICOLE Phase Store-2: iOS Release/TestFlight build settings を整えてください。

目的:
TestFlight提出前に、Releaseビルドで localhost を使わない構成へ切り替え、Xcode Archive準備を完了する。

やること:
1. Debugでは http://localhost:3000 を維持する
2. Releaseでは https://unicolle.vercel.app を使う、または server.url を外す方針を確定する
3. capacitor.config / iOS同期ファイルをDebug/Releaseで安全に分ける
4. Apple Developer Team設定が必要な箇所を明確化する
5. Release build / Archive前ビルドを再確認する
6. Debug広告はテスト、本番広告IDはRelease専用で維持する

禁止:
App Store Connect upload、TestFlight提出、Supabase変更、Vercel変更、generated JSON変更、crawler変更、translations変更、proxy.ts変更。
```
