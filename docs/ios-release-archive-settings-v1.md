# iOS Release Archive Settings v1

## 1. Scope

This document records the Phase Store-2 pre-TestFlight archive check for the UNICOLE iOS app.

No App Store Connect upload, TestFlight submission, App Store submission, Supabase change, Vercel change, generated JSON change, crawler change, translations change, proxy change, or Android work was performed.

## 2. Xcode Project Settings

| Item | Observed value | Status |
| --- | --- | --- |
| Bundle Identifier | `com.doublecorgi.unicolle` | OK |
| App Display Name | `ユニコレ` | OK |
| Marketing Version | `1.0` | OK |
| Build Number | `1` | OK for first build; increment for every TestFlight upload |
| iOS Deployment Target | `15.0` | OK |
| Code Signing Style | `Automatic` | OK |
| Development Team | Not resolved in CLI build settings | Needs fix before Archive |
| App Icon | `AppIcon` asset catalog present | Present |
| Launch Screen | `LaunchScreen.storyboard` present | Present |

## 3. AdMob Configuration

Debug build settings resolve:

```text
GAD_APPLICATION_IDENTIFIER = ca-app-pub-3940256099942544~1458002511
```

Release build settings resolve:

```text
GAD_APPLICATION_IDENTIFIER = ca-app-pub-4180695956777361~2101761177
```

Release app bundle `Info.plist` contains:

```text
CFBundleDisplayName = ユニコレ
CFBundleIdentifier = com.doublecorgi.unicolle
CFBundleShortVersionString = 1.0
CFBundleVersion = 1
GADApplicationIdentifier = ca-app-pub-4180695956777361~2101761177
```

Notes:

- Debug remains configured for Google test ads.
- Release is configured to use the production AdMob App ID.
- Production ads must not be clicked by the developer or testers.
- TestFlight/App Store review should use intentional ad behavior only after confirming policy and privacy disclosures.

## 4. Release Build / Archive Check

### 4.1 Release build without signing

Command:

```bash
xcodebuild -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -derivedDataPath /private/tmp/unicolle-store2-release-build \
  CODE_SIGNING_ALLOWED=NO \
  build
```

Result: `BUILD SUCCEEDED`.

This means the Release iOS app compiles and the unsigned store-oriented build path is healthy.

### 4.2 Signed archive attempt

Command:

```bash
xcodebuild -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath /private/tmp/unicolle-store2/App.xcarchive \
  archive
```

Result: `ARCHIVE FAILED`.

Failure:

```text
Signing for "App" requires a development team.
Select a development team in the Signing & Capabilities editor.
```

Verdict: Archive is not yet ready. The project can build, but signed Archive requires Apple Developer Team/provisioning to be visible to the build system.

## 5. Capacitor Runtime Check

The Release app bundle currently includes:

```json
{
  "server": {
    "url": "http://localhost:3000",
    "cleartext": true
  }
}
```

This is still a TestFlight blocker. Localhost is acceptable for local Simulator development only. TestFlight users will not have a local Next.js server.

Before TestFlight, choose one of these:

- Release live URL mode: configure Release to use `https://unicolle.vercel.app`.
- Static bundle mode: remove `server.url` and ship a static Capacitor bundle if all required routes are supported.

For the current app, Release live URL mode is the lower-risk path because admin/data routes depend on server behavior.

## 6. Secret Exposure Check

The Release `.app` bundle was searched for:

```text
SERVICE_ROLE
service_role
SUPABASE_SERVICE
SUPABASE_SERVICE_ROLE
NEXT_PUBLIC_SUPABASE_SERVICE
sb_secret
```

Result: no matches.

Interpretation:

- No service role key marker was found in the app bundle.
- Supabase public anon configuration is not the same as a service role secret.
- Admin server actions remain server-side and were not copied into the native app as callable secrets.

## 7. Validation Results

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |
| Release build with signing disabled | Passed |
| Signed Archive | Failed: missing Development Team |
| Bundle ID | `com.doublecorgi.unicolle` |
| App name | `ユニコレ` |
| Service role key in app bundle | Not found |

## 8. Missing Items Before TestFlight

Must fix before Archive/TestFlight:

- Apple Developer Team must be set in the Xcode target and visible to CLI/archive.
- Signing certificate/provisioning must be valid for `com.doublecorgi.unicolle`.
- Release Capacitor runtime must stop pointing to `http://localhost:3000`.
- Build number should be incremented for each TestFlight upload.

Still needed before App Store review:

- Privacy Policy URL.
- Support URL.
- App Store screenshots.
- App description.
- Subtitle.
- Keywords.
- Non-official app wording to avoid USJ official-app confusion.
- ATT/privacy decision for ads and any tracking.

## 9. Human Steps

1. Open `ios/App/App.xcodeproj` in Xcode.
2. Select the `App` target.
3. In Signing & Capabilities, choose the Apple Developer Team.
4. Confirm Bundle Identifier is `com.doublecorgi.unicolle`.
5. Confirm automatic signing resolves a provisioning profile.
6. Configure Release Capacitor runtime so TestFlight does not use localhost.
7. Run Product > Archive.
8. Do not upload until the archive contents and privacy/ad settings are reviewed.

## 10. Next Codex Goal

```text
/goal UNICOLE Phase Store-2b: iOS Release runtime と署名設定をTestFlight向けに整えてください。

目的:
Release Archiveが通るように、Xcode Team設定の反映確認と、Releaseビルドで localhost を使わないCapacitor runtime設定を整理する。

やること:
1. Xcode projectに DEVELOPMENT_TEAM が反映されているか確認する
2. Releaseで https://unicolle.vercel.app を使うか、static bundleにするか確定する
3. Debugは localhost、Releaseは本番URLに分ける
4. Archiveを再実行し、.xcarchive作成まで確認する
5. App Store Connectへのアップロードはまだ行わない
```
