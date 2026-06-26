# iOS Release URL And Signing Settings v1

## 1. Scope

This document records the Phase Store-2b check for iOS Release/TestFlight signing and Release URL settings.

No Apple Developer Team ID was guessed or written. No App Store Connect upload, TestFlight submission, App Store submission, Android work, Supabase change, Vercel change, generated JSON change, crawler change, translations change, proxy change, authentication change, or AdMob SDK/ad ID change was performed.

## 2. Changed Files

Tracked change:

- `package.json`

Added scripts:

```json
"cap:sync:ios:debug": "CAPACITOR_SERVER_URL=http://localhost:3000 cap sync ios",
"cap:sync:ios:release": "CAPACITOR_SERVER_URL=https://unicolle.vercel.app cap sync ios"
```

Purpose:

- Debug/development sync can keep using `http://localhost:3000`.
- Release/TestFlight sync has an explicit command that writes `https://unicolle.vercel.app` into the generated iOS Capacitor config.

## 3. Signing Settings Check

Project files checked:

- `ios/App/App.xcodeproj/project.pbxproj`
- `ios/debug.xcconfig`
- `ios/release.xcconfig`
- `ios/App/App/Info.plist`

Observed Release build settings:

```text
CODE_SIGN_STYLE = Automatic
CURRENT_PROJECT_VERSION = 1
GAD_APPLICATION_IDENTIFIER = ca-app-pub-4180695956777361~2101761177
IPHONEOS_DEPLOYMENT_TARGET = 15.0
MARKETING_VERSION = 1.0
PRODUCT_BUNDLE_IDENTIFIER = com.doublecorgi.unicolle
```

`DEVELOPMENT_TEAM` was not present in the resolved Release build settings.

Verdict:

- `DEVELOPMENT_TEAM` is still unset or not visible to the CLI/archive build.
- No placeholder Team ID such as `XXXXXXXXXX` was written.
- No Team ID was guessed.

## 4. Human Xcode Steps For Team ID

Because the Apple Developer Team ID is not known, a human must complete this in Xcode:

1. Open `ios/App/App.xcodeproj`.
2. Select the `App` project, then the `App` target.
3. Open `Signing & Capabilities`.
4. Select the correct Apple Developer Team.
5. Confirm `Automatically manage signing` is enabled, unless a manual provisioning profile is intentionally used.
6. Confirm Bundle Identifier remains `com.doublecorgi.unicolle`.
7. Confirm the selected team resolves a valid iOS App Store provisioning profile.
8. Run `Product > Archive`.

After this is done, rerun:

```bash
xcodebuild -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath /private/tmp/unicolle-store2b/App.xcarchive \
  archive
```

Do not upload from Organizer until the archive contents, privacy settings, and ad behavior are reviewed.

## 5. Release URL Settings

Command run:

```bash
npm run cap:sync:ios:release
```

Generated iOS Capacitor config:

```json
{
  "appId": "com.doublecorgi.unicolle",
  "appName": "ユニコレ",
  "webDir": "out",
  "server": {
    "url": "https://unicolle.vercel.app",
    "cleartext": false
  },
  "packageClassList": ["AdMobPlugin"]
}
```

Release build artifact check:

```json
{
  "server": {
    "url": "https://unicolle.vercel.app",
    "cleartext": false
  }
}
```

Verdict:

- Release/TestFlight sync now has a clear command that avoids `localhost:3000`.
- The checked Release artifact used `https://unicolle.vercel.app`.
- Debug/local development can still use `npm run cap:sync:ios:debug`.

Important:

- `ios/App/App/capacitor.config.json` is generated and ignored by git.
- Before every Release Archive, run `npm run cap:sync:ios:release` and verify the generated config does not contain `localhost`.

## 6. AdMob Settings

Debug build settings:

```text
GAD_APPLICATION_IDENTIFIER = ca-app-pub-3940256099942544~1458002511
```

Release build settings:

```text
GAD_APPLICATION_IDENTIFIER = ca-app-pub-4180695956777361~2101761177
```

Release app bundle `Info.plist`:

```text
CFBundleDisplayName = ユニコレ
CFBundleIdentifier = com.doublecorgi.unicolle
CFBundleShortVersionString = 1.0
CFBundleVersion = 1
GADApplicationIdentifier = ca-app-pub-4180695956777361~2101761177
```

Notes:

- Debug remains on Google test AdMob App ID.
- Release remains capable of using the production AdMob App ID.
- Do not click production ads yourself.
- No AdMob SDK or ad ID changes were made in this phase.

## 7. Secret Exposure Check

Release `.app` bundle was searched for:

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

- Service role key markers were not found in the iOS app bundle.
- Supabase anon/public configuration must not be confused with service role secrets.
- Admin server-side secrets were not exposed by this Release build.

## 8. Validation Results

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed after rerun; initial parallel run raced with `next build` and `.next/types` |
| `npm run build` | Passed |
| `npm run cap:sync:ios:release` | Passed |
| iOS Release build, signing disabled | Passed |
| Release artifact URL | `https://unicolle.vercel.app` |
| Bundle ID | `com.doublecorgi.unicolle` |
| App name | `ユニコレ` |
| Debug AdMob | Google test App ID |
| Release AdMob | Production App ID |
| Service role key in app bundle | Not found |

## 9. Archive Status

Current Archive readiness: not ready for signed Archive.

Reason:

- `DEVELOPMENT_TEAM` is not set/resolved.

Expected result if signed Archive is attempted now:

- Archive will fail with a signing error requiring a development team.

This is intentionally not fixed by Codex because the Apple Developer Team ID is unknown and must not be guessed.

## 10. Next Codex Goal

```text
/goal UNICOLE Phase Store-2c: iOS signed Archiveを再確認してください。

前提:
Xcodeで正しいApple Developer Teamを設定済み。

やること:
1. DEVELOPMENT_TEAM がRelease build settingsに出ることを確認する
2. npm run cap:sync:ios:release を実行する
3. Release artifact が https://unicolle.vercel.app を使うことを確認する
4. xcodebuild archive を実行し .xcarchive 作成まで確認する
5. App Store Connectへのアップロードはまだ行わない
```
