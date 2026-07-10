# iOS App Store AS2 TestFlight Result

更新日: 2026-07-11

対象アプリ: ユニコレ  
Bundle ID: `com.doublecorgi.unicolle`  
Version: `1.0`  
Build: `1`

## 結論

AS2では、専用Simulatorの作成、ユニコレ本体のBundle ID起動、App Store用スクリーンショット10枚の取得、Release build、Archive、App Store Connect向けexport、TestFlight uploadを完了した。

App Review提出、外部テスター追加、App Privacy回答確定、暗号化質問回答、年齢レーティング確定は行っていない。

## Simulator

- 専用端末: `Unicolle-AS2-iPhone-17-Pro-Max`
- UDID: `8D07F2E1-0D24-4FEC-92C3-C85C29335939`
- Runtime: iOS 26.5
- 起動Bundle ID: `com.doublecorgi.unicolle`
- Display Name: ユニコレ
- Version: `1.0`
- Build: `1`

実施:

- boot不能/不正端末の確認
- 専用Simulator作成
- Release Simulator build
- install
- Bundle ID指定launch
- Production route別のスクリーンショット取得

## Screenshots

保存先: `screenshots/ios-app-store-as2/`

取得ファイル:

- `01-home.png`
- `02-summer-collection.png`
- `03-foods.png`
- `04-food-detail.png`
- `05-eaten.png`
- `06-search.png`
- `07-areas.png`
- `08-stores.png`
- `09-privacy.png`
- `10-unofficial-notice.png`

全ファイルは1320 x 2868 px。

## Build / Sync

実行:

- `npm run build`
- `npm run cap:sync:ios:release`
- `CAPACITOR_SERVER_URL=https://unicolle.vercel.app npx cap sync ios`
- `xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' build`

結果:

- Web build成功
- iOS sync成功
- generic iOS Release build成功
- Bundle ID: `com.doublecorgi.unicolle`
- Marketing Version: `1.0`
- Build: `1`
- Deployment Target: iOS 15.0
- iOS SDK: 26.5

## Archive / Export / Upload

Archive:

- 保存先: `/private/tmp/unicolle-as2-archive/Unicolle.xcarchive`
- `** ARCHIVE SUCCEEDED **`
- Archive時点のInfo.plist上のSigningIdentityはApple Development
- dSYM: `App.app.dSYM`, `Capacitor.framework.dSYM`, `Cordova.framework.dSYM`

Export:

- 保存先: `/private/tmp/unicolle-as2-export/App.ipa`
- `** EXPORT SUCCEEDED **`
- Export後IPAはCloud Managed Apple Distributionで署名
- Provisioning Profile: App Store Connect用の自動署名profile
- Entitlements: `get-task-allow=false`, `beta-reports-active=true`
- Team ID: `2N7QF6C585`

Upload:

- `xcodebuild -exportArchive` の `destination=upload` で実行
- App Store Connect解析通過
- Upload succeeded
- App Store ConnectでProcessing開始を確認

警告:

- GoogleMobileAds.framework dSYMがArchiveに含まれない警告
- UserMessagingPlatform.framework dSYMがArchiveに含まれない警告

IPA本体のアップロードは成功している。シンボル状態はApp Store Connect上で人間が確認する。

## Privacy / Ads

- GoogleMobileAds SDK: 12.14.0
- UserMessagingPlatform SDK: 3.1.0
- SDK Privacy ManifestはIPA内に含まれる
- アプリ本体の `ios/App/App/PrivacyInfo.xcprivacy` は存在しない
- ATT API呼び出しなし
- `NSUserTrackingUsageDescription` なし
- Release modeではdebug geography/test device IDを渡さない
- `AdMob.showBanner` は `npa: true`
- Publisher first-party IDの明示設定コードは未確認

## Public Data Invariants

- summer-2026公開商品: 15件維持
- pending公開: 0件
- 保留公開: 0件
- 既存food.id変更: 0件
- UserFoodLog変更: 0件

## 未完了項目

- App Store Connect上のProcessing完了確認
- SDK dSYM警告の確認
- App Privacy回答
- 年齢レーティング回答
- 暗号化/輸出コンプライアンス回答
- App Store用メタデータ入力
- App Review提出

## 次に人間が行う操作

1. App Store ConnectでBuild `1.0 (1)` のProcessing完了を確認する。
2. SDK dSYM警告が審査上問題ないか確認する。
3. `docs/ios-app-privacy-declaration-v1.md` をもとにApp Privacyを入力する。
4. `docs/ios-app-store-metadata-draft-v1.md` をもとにメタデータを入力する。
5. App Store用スクリーンショットをアップロードする。
6. 暗号化、年齢レーティング、審査メモを人間が確定する。
7. 最終確認後にApp Reviewへ提出する。
