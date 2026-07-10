# iOS App Privacy Declaration v1

更新日: 2026-07-11

対象アプリ: ユニコレ  
Bundle ID: `com.doublecorgi.unicolle`

## 結論

ユニコレ本体は、通常利用者の食べた記録・評価・メモを端末内 `localStorage` に保存し、ユーザーアカウントを要求しない。
iOS版ではGoogle AdMobとGoogle User Messaging Platformを利用するため、App Store ConnectのApp Privacy回答では、SDK由来の広告データ、識別子、診断データ、使用状況データを申告候補として扱う必要がある。

不明な項目は推測で「収集しない」としない。App Store Connect入力前に、Googleの最新Data disclosureとXcode OrganizerのPrivacy Reportで最終確認する。

## 確認した実装

- iOS広告: `@capacitor-community/admob` 8.0.0
- Google Mobile Ads SDK: 12.14.0
- Google User Messaging Platform: 3.1.0
- 広告表示: `components/mobile-admob-banner.tsx`
- プライバシー設定導線: `components/admob-privacy-options-button.tsx`
- UMP同意管理: `AdMob.requestConsentInfo` / `AdMob.showConsentForm` / `AdMob.showPrivacyOptionsForm`
- ATT: アプリコードから `requestTrackingAuthorization` は呼ばない
- Web/PWA: native AdMobを起動しない
- `/admin`: native AdMobとUMP導線を表示しない
- 食べた記録・評価・メモ・金額: 端末内 `localStorage`
- 管理者向けデータ: Supabaseをサーバー側処理で利用
- 問い合わせ: `/contact` からユーザー入力を受け付ける

## Privacy Manifest実測

確認対象:

- `node_modules/@capacitor/ios/Capacitor/Capacitor/PrivacyInfo.xcprivacy`
- `node_modules/@capacitor/ios/CapacitorCordova/CapacitorCordova/PrivacyInfo.xcprivacy`
- `GoogleMobileAds.framework/PrivacyInfo.xcprivacy`
- `UserMessagingPlatform.framework/PrivacyInfo.xcprivacy`

結果:

| SDK | Required Reason API | 収集データ | Tracking |
| --- | --- | --- | --- |
| Capacitor | なし | なし | false |
| Cordova | なし | なし | false |
| GoogleMobileAds | System boot time, UserDefaults, Disk space | Other Diagnostic Data, Coarse Location, Performance Data, Crash Data, Advertising Data, Product Interaction, Device ID | Device IDがtrue |
| UserMessagingPlatform | UserDefaults | Coarse Location, Performance Data, Product Interaction | false |

アプリ本体の `ios/App/App/PrivacyInfo.xcprivacy` は存在しない。AS1監査では、アプリ本体で追加宣言が必要なRequired Reason APIは確認していない。

## App Privacy回答候補

| データ種別 | 収集/処理の可能性 | 利用目的 | ユーザーに紐づくか | トラッキングに使うか | 根拠 | App Store Connect入力方針 |
| --- | --- | --- | --- | --- | --- | --- |
| メールアドレス | 管理者ログインや問い合わせで扱う可能性 | 管理者認証、問い合わせ対応 | 入力者には紐づく | 使わない | Supabase Auth / `/contact` | Contact Infoとして要確認。通常利用者はアカウント不要である旨を審査メモに記載候補 |
| 問い合わせ内容 | 送信時のみ | 問い合わせ対応 | 入力内容次第 | 使わない | `/contact` | User Contentとして要確認 |
| 食べた記録 | 端末内のみ | コレクション進捗表示 | 端末内のみ | 使わない | `localStorage` | 端末外へ送信しないため収集データとしては申告不要候補 |
| 評価 | 端末内のみ | 食べた記録表示 | 端末内のみ | 使わない | `localStorage` | 端末外へ送信しないため申告不要候補 |
| メモ | 端末内のみ | 食べた記録表示 | 端末内のみ | 使わない | `localStorage` | 端末外へ送信しないため申告不要候補 |
| 金額メモ | 端末内のみ | 食べた記録表示 | 端末内のみ | 使わない | `localStorage` | 端末外へ送信しないため申告不要候補 |
| 広告データ | AdMob SDKが処理する可能性 | 広告表示、測定、不正防止 | GoogleMobileAds manifestではlinked=true | Google資料と設定に依存 | GoogleMobileAds PrivacyInfo | Advertising Dataとして申告候補 |
| Device ID | AdMob SDKが処理する可能性 | 広告表示、測定、不正防止 | linked=true | GoogleMobileAds manifestではtracking=true | GoogleMobileAds PrivacyInfo | Identifiersとして申告候補。Trackingの扱いは人間が最終確認 |
| Coarse Location | AdMob/UMP SDKが処理する可能性 | 広告/同意処理/分析 | GoogleMobileAdsではlinked=true、UMPではlinked=false | false | SDK PrivacyInfo | Locationとして申告候補 |
| Product Interaction | AdMob/UMP SDKが処理する可能性 | 広告、分析、同意処理 | GoogleMobileAdsではlinked=true、UMPではlinked=false | false | SDK PrivacyInfo | Usage Dataとして申告候補 |
| Advertising Data | AdMob SDKが処理する可能性 | 広告配信、測定、不正防止 | linked=true | false | SDK PrivacyInfo | Advertising Dataとして申告候補 |
| Crash Data | AdMob SDKが処理する可能性 | 診断、品質改善 | linked=false | false | SDK PrivacyInfo | Diagnosticsとして申告候補 |
| Performance Data | AdMob/UMP SDKが処理する可能性 | 診断、品質改善、広告関連 | linked=false | false | SDK PrivacyInfo | Diagnosticsとして申告候補 |
| Other Diagnostic Data | AdMob SDKが処理する可能性 | 診断、広告関連 | linked=false | false | SDK PrivacyInfo | Diagnosticsとして申告候補 |
| 位置情報の正確な取得 | アプリ本体では取得しない | なし | なし | なし | Info.plistに位置情報権限なし | Precise Locationは申告しない候補 |
| 写真/カメラ | 通常利用者向けには取得しない | なし | なし | なし | Info.plistに権限説明なし | Photos/Cameraは申告しない候補 |
| 連絡先 | 取得しない | なし | なし | なし | 権限説明なし | Contactsは申告しない候補 |

## ATTの扱い

AS1時点では次を行わない。

- ATTダイアログを追加しない
- `NSUserTrackingUsageDescription` を追加しない
- `AdMob.requestTrackingAuthorization()` を呼ばない

理由:

- アプリコードでATT APIを呼んでいない
- Info.plistにATT説明文はない
- 現在の広告リクエストはUMP consent確認後に行う

注意:

- GoogleMobileAds SDKのPrivacy ManifestではDevice IDがtracking=trueとして宣言されている
- App Store Connectの「Tracking」回答は、Google資料、AdMob設定、Apple定義に照らして人間が最終判断する

## UMP同意管理

実装順序:

1. native Capacitor環境か確認
2. `/admin` では広告・同意処理を実行しない
3. `AdMob.initialize`
4. `AdMob.requestConsentInfo`
5. 同意フォームが必要で利用可能な場合のみ `AdMob.showConsentForm`
6. `canRequestAds === true` の場合だけ `AdMob.showBanner`

Debug検証用環境変数:

- `NEXT_PUBLIC_IOS_ADMOB_CONSENT_DEBUG_GEOGRAPHY`
- `NEXT_PUBLIC_IOS_ADMOB_CONSENT_TEST_DEVICE_IDS`

Release modeでは、これらを渡さない実装になっている。

AS2実測:

- `components/mobile-admob-banner.tsx` は `NEXT_PUBLIC_IOS_ADMOB_MODE === "production"` かつ本番バナーIDがある場合だけ本番広告IDを使う。
- Production modeでは `debugGeography` と `testDeviceIdentifiers` を渡さない。
- `AdMob.showBanner` には `npa: true` を渡している。
- Publisher first-party IDを明示設定するコードは確認していない。
- `AdMob.requestTrackingAuthorization` / `ATTrackingManager` / `requestTrackingAuthorization` の呼び出しは確認していない。

## AS2 TestFlight実測

AS2で作成したApp Store Connect向けIPAには、次のSDK Privacy Manifestが含まれることを確認した。

- `Capacitor.framework/PrivacyInfo.xcprivacy`
- `Cordova.framework/PrivacyInfo.xcprivacy`
- `GoogleMobileAds.framework/PrivacyInfo.xcprivacy`
- `UserMessagingPlatform.framework/PrivacyInfo.xcprivacy`

アプリ本体の `ios/App/App/PrivacyInfo.xcprivacy` は引き続き存在しない。Xcodeのarchive/export時にはSDK manifestがスキャンされ、IPAへのUploadは成功した。

TestFlight Upload結果:

- Version: `1.0`
- Build: `1`
- Bundle ID: `com.doublecorgi.unicolle`
- Apple Distribution: Cloud Managed Apple Distribution
- Provisioning Profile: App Store Connect用の自動署名profile
- Upload: 成功、App Store ConnectでProcessing開始

注意:

- GoogleMobileAds.framework と UserMessagingPlatform.framework のdSYMアップロード警告が出た。IPA本体のアップロードは成功しているが、必要に応じてApp Store Connect上のシンボル状態を人間が確認する。

## SKAdNetwork

`ios/App/App/Info.plist` に `SKAdNetworkItems` 50件を設定済み。重複なし。

## プライバシー・サポートURL

ProductionでHTTP 200を確認:

- `https://unicolle.vercel.app/privacy`
- `https://unicolle.vercel.app/contact`
- `https://unicolle.vercel.app/terms`
- `https://unicolle.vercel.app/about`
- `https://unicolle.vercel.app/disclaimer`

## 人間がApp Store Connectで最終確認すること

1. Google AdMob SDKの最新Data Disclosureを確認する
2. Xcode OrganizerのPrivacy ReportでSDK manifestを確認する
3. AdMobの広告設定が「トラッキング」に該当するかApple定義で最終判断する
4. 問い合わせフォームで収集する入力項目をApp Privacy回答へ反映する
5. 管理者ログイン用途のメールアドレスを通常ユーザー向け収集データとして扱うか審査メモで整理する
6. GDPRプライバシーメッセージをAdMob管理画面で作成・公開する

## 提出前チェック

- DebugではGoogle公式テスト広告のみ表示
- Releaseでは本番AdMob App ID / 広告ユニットIDを使用
- Releaseにdebug geographyやテスト端末IDを入れない
- `requestTrackingAuthorization` を呼ばない
- `NSUserTrackingUsageDescription` を理由なく追加しない
- `/admin` に広告・同意画面を出さない
- Web/PWAにnative AdMobやUMP画面を出さない
- service role keyがクライアント成果物に含まれないことを確認する
