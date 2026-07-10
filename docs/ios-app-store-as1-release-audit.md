# iOS App Store AS1 Release Audit

更新日: 2026-07-10

対象アプリ: ユニコレ  
Bundle ID: `com.doublecorgi.unicolle`  
本番URL: `https://unicolle.vercel.app`

## 結論

コード側のRelease監査、Capacitor同期、Productionリンク確認、AdMob/UMP/SKAdNetwork/Privacy Manifest確認を実施した。現在のXcode/iOS SDKはApp Store Connectの2026年要件を満たす。

ただし、現在確認できた署名状態はDevelopment provisioningであり、App Store Distribution用の署名証明書・Provisioning Profile・App Store Connectアプリレコード状態をCLIから確定できていない。そのため、TestFlightアップロードは未実施。App Review提出も未実施。

## 環境

| 項目 | 結果 |
| --- | --- |
| Xcode | 26.5 |
| Xcode build | 17F42 |
| iOS SDK | 26.5 |
| `xcode-select -p` | `/Applications/Xcode.app/Contents/Developer` |
| App Store SDK要件 | 2026-04-28以降のアップロード要件であるXcode 26 / iOS 26 SDKに適合 |
| Deployment Target | iOS 15.0 |
| Capacitor | 8.3.4 |
| SwiftPM | 使用中 |
| CocoaPods | `Podfile`なし |

## アプリ設定

| 項目 | 結果 |
| --- | --- |
| App Name | ユニコレ |
| Capacitor appId | `com.doublecorgi.unicolle` |
| PRODUCT_BUNDLE_IDENTIFIER | `com.doublecorgi.unicolle` |
| Marketing Version | 1.0 |
| Build | 1 |
| Display Name | ユニコレ |
| Launch Screen | `LaunchScreen.storyboard` |
| App Icon | `AppIcon` asset catalog |
| Apple Developer Team | `2N7QF6C585` |
| Code Sign Style | Automatic |

## Capacitor同期

実行:

- `npm run build`
- `npm run cap:sync:ios:release`

結果:

- Web build成功
- `CAPACITOR_SERVER_URL=https://unicolle.vercel.app` でiOS同期
- 生成されたCapacitor設定はProduction URLを参照
- 生成物は既存のignore対象であり、Gitへ追加していない

## Release広告設定

確認したファイル:

- `components/mobile-admob-banner.tsx`
- `components/admob-privacy-options-button.tsx`
- `ios/debug.xcconfig`
- `ios/release.xcconfig`
- `ios/App/App/Info.plist`
- `scripts/verify-ios-admob-build.ts`

結果:

- DebugはGoogle公式テストAdMob App IDを使用
- Releaseは本番AdMob App IDを使用
- 本番IDの値はこの資料に記載しない
- Release build settingsでは `CAPACITOR_DEBUG=false`
- UMP debug geography / test device IDsはProduction modeでは渡されない
- Web/PWAではnative AdMobを起動しない
- `/admin` ではnative AdMobを表示しない

## UMP確認

実装上の順序:

1. native Capacitor環境確認
2. `/admin` を除外
3. `AdMob.initialize`
4. `AdMob.requestConsentInfo`
5. 必要な場合のみ `AdMob.showConsentForm`
6. `canRequestAds` がtrueの場合のみ `AdMob.showBanner`

確認結果:

- 同意処理前に広告表示しない実装
- 同意フォーム取得失敗時は広告非表示でアプリ利用継続
- プライバシー設定再表示導線あり
- Debug geographyはReleaseに混入しない実装

## ATT判断

アプリコードでは以下を確認した。

- `requestTrackingAuthorization` 呼び出しなし
- `ATTrackingManager` 直接利用なし
- `NSUserTrackingUsageDescription` なし

このため、AS1時点ではATTダイアログを追加しない。  
ただしGoogle Mobile Ads SDKのPrivacy ManifestではDevice IDがtracking=trueとして宣言されているため、App Store ConnectのApp Privacy回答ではAdMob SDK由来のトラッキング可能性を人間が最終確認する必要がある。

## Info.plist確認

| 項目 | 結果 |
| --- | --- |
| `GADApplicationIdentifier` | `$(GAD_APPLICATION_IDENTIFIER)` |
| `SKAdNetworkItems` | 50件、重複なし |
| Display Name | ユニコレ |
| Launch Screen | 設定あり |
| URL scheme | Capacitor標準構成 |
| ATS | 任意緩和なし |
| Orientation | iPhone portrait/landscape、iPad全方向 |
| 不要権限説明 | camera/photo/location等なし |
| Debug専用設定 | Release build settingsでは `CAPACITOR_DEBUG=false` |

## Privacy Manifest確認

アプリ本体の `ios/App/App/PrivacyInfo.xcprivacy` は存在しない。  
確認したSDK manifest:

- Capacitor
- Cordova
- GoogleMobileAds
- UserMessagingPlatform

結果:

- Capacitor/Cordovaは収集データなし、tracking=false
- GoogleMobileAdsはRequired Reason APIと広告/診断/識別子系データを宣言
- UserMessagingPlatformはUserDefaultsと同意処理関連データを宣言
- SDK側manifestはビルド成果物内に含まれている
- アプリ本体で追加宣言が必要なRequired Reason APIはAS1時点で未確認

## プライバシー・サポートURL

ProductionでHTTP 200を確認:

- `https://unicolle.vercel.app/privacy`
- `https://unicolle.vercel.app/contact`
- `https://unicolle.vercel.app/terms`
- `https://unicolle.vercel.app/about`
- `https://unicolle.vercel.app/disclaimer`

## 非公式表記

確認:

- ホームに「非公式フード図鑑」表記あり
- disclaimerにUSJ公式アプリではない旨の表記あり
- USJ公式ロゴをアプリアイコンやLaunch Screenに使用していない
- App Nameは「ユニコレ」で、公式アプリを名乗っていない

## Release Build

実行コマンド:

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' build
```

結果:

- `** BUILD SUCCEEDED **`
- Generic iOS device向けReleaseビルドは成功
- Release build settingsで `CAPACITOR_DEBUG=false`
- Bundle IDは `com.doublecorgi.unicolle`
- Marketing Versionは `1.0`
- Buildは `1`

## Archive / TestFlight

Archive作成コマンド:

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' -archivePath /private/tmp/unicolle-as1-archive/Unicolle.xcarchive archive
```

Archive結果:

- `** ARCHIVE SUCCEEDED **`
- Archive保存先: `/private/tmp/unicolle-as1-archive/Unicolle.xcarchive`
- `.xcarchive` はGit管理外
- `App.app.dSYM` あり
- `Cordova.framework.dSYM` あり
- `Capacitor.framework.dSYM` あり
- Archive内にCapacitor / Cordova / GoogleMobileAds / UserMessagingPlatformのPrivacy Manifestを含む
- Archive内Info.plistの `DTSDKName` は `iphoneos26.5`
- Archive内Info.plistの `CAPACITOR_DEBUG` は `false`
- Archive内Info.plistの `CFBundleIdentifier` は `com.doublecorgi.unicolle`

署名判定:

- Archive作成時のSigning IdentityはApple Development
- Provisioning ProfileはTeam Provisioning Profile
- Entitlementsに `get-task-allow=1` が含まれる
- App Store Distribution用署名ではない

TestFlight判定:

- App Store Distribution署名証明書: 未確認
- App Store用Provisioning Profile: 未確認
- App Store Connectアプリレコード: CLIから未確認
- Apple Developer Program契約/Agreements: CLIから未確認

上記が未確定で、ArchiveもDevelopment署名のため、TestFlightアップロードは実施しない。  
App Review提出も実施しない。

## Simulator実行確認

実施:

- iPhone 14 Pro Max Simulator向けDebug build
- `xcrun simctl install`
- `xcrun simctl launch`

結果:

- Debug buildは成功
- 起動済みSimulatorへのinstallが `IXErrorDomain code=2` / `Failed to create IXPlaceholder for app bundle ID com.doublecorgi.unicolle` で失敗
- 別のBooted Simulatorでも同じinstallエラー
- 一部SimulatorはCoreSimulator上のdevice dataが欠落しておりboot不可
- `simctl launch com.doublecorgi.unicolle` も失敗
- そのためAS1では実機/Simulatorでの画面遷移確認、UMP Debug画面確認、通常地域広告表示確認は未完了

補足:

- 取得できたSimulatorスクリーンショットは既存で前面にいた別アプリであり、ユニコレ確認資料として採用しない
- iOSアプリ自体のDebug/Release buildとArchiveは成功しているため、未完了項目はSimulator環境のinstall/launch確認に限定される

## summer-2026 / 公開データ確認

前提:

- summer-2026公開商品: 15件
- pending公開: 0件
- 保留公開: 0件
- 既存food.id変更: 0件
- UserFoodLog変更: 0件

AS1では夏フードDBデータへ変更を加えていない。

## 未完了項目

- App Store Distribution証明書の確認
- App Store用Provisioning Profileの確認
- App Store Connectアプリレコード存在確認
- Agreements未同意なしの確認
- Archive validation
- TestFlightアップロード
- Simulatorでのユニコレ画面確認
- UMP Debug画面確認
- 通常地域広告表示確認
- App Store Connect App Privacy回答の人間最終確認
- App Storeメタデータとスクリーンショット作成

## 次に人間が行う操作

1. Apple Developer Programの正式Teamでログイン済みか確認する
2. App Store Distribution証明書とProvisioning Profileを用意する
3. App Store ConnectにBundle ID `com.doublecorgi.unicolle` のアプリレコードを作成または確認する
4. Agreements/Tax/Bankingの未同意がないか確認する
5. Xcode OrganizerでArchiveを作成し、Validate Appを実行する
6. TestFlightへアップロードする
7. `docs/ios-app-privacy-declaration-v1.md` をもとにApp Privacy回答を確定する
8. App Store用メタデータ、スクリーンショット、審査メモを作成する
