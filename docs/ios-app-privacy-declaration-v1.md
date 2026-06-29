# iOS App Privacy Declaration v1

作成日: 2026-06-30

対象アプリ: ユニコレ  
Bundle ID: `com.doublecorgi.unicolle`

## 確認した実装

- iOS広告: `@capacitor-community/admob` 8系
- 広告表示: `components/mobile-admob-banner.tsx`
- 広告方針: `npa: true` による非パーソナライズ広告を基本方針
- UMP同意管理: `AdMob.requestConsentInfo` / `AdMob.showConsentForm` / `AdMob.showPrivacyOptionsForm`
- ATT: `requestTrackingAuthorization` は呼ばない
- Web/PWA: native AdMobは表示しない
- `/admin`: native AdMobとUMP導線は表示しない
- 食べた記録・評価・メモ・金額: 端末内 `localStorage`
- 管理者向けデータ: Supabaseをサーバー側処理で利用

## 参照した公式資料

- Google AdMob iOS privacy strategies / SKAdNetwork identifiers
  - URL: https://developers.google.com/admob/ios/privacy/strategies
  - 確認日: 2026-06-30
  - ページ最終更新: 2026-05-21 UTC
- Google AdMob iOS privacy
  - URL: https://developers.google.com/admob/ios/privacy
  - 確認日: 2026-06-30
- Google AdMob GDPR / UMP
  - URL: https://developers.google.com/admob/ios/privacy/gdpr
  - 確認日: 2026-06-30
- Google AdMob data disclosure
  - URL: https://developers.google.com/admob/ios/privacy/data-disclosure
  - 確認日: 2026-06-30
- Apple App Privacy Details
  - URL: https://developer.apple.com/app-store/app-privacy-details/
  - 確認日: 2026-06-30
- Apple App Store Connect App Privacy
  - URL: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
  - 確認日: 2026-06-30

## SKAdNetwork

`ios/App/App/Info.plist` に、Google公式資料の `SKAdNetworkItems` 一覧を追加した。

- `GADApplicationIdentifier` は既存の `$(GAD_APPLICATION_IDENTIFIER)` を維持
- Debug: `ios/debug.xcconfig` のGoogle公式テストApp IDを維持
- Release: `ios/release.xcconfig` の本番AdMob App IDを維持
- 重複IDなし
- `plutil -lint ios/App/App/Info.plist` でXML妥当性を確認する

## UMP同意管理

アプリ起動時の広告表示は次の順序にする。

1. native Capacitor環境か確認
2. `/admin` では広告・同意処理を実行しない
3. `AdMob.initialize`
4. `AdMob.requestConsentInfo`
5. 同意フォームが必要で利用可能な場合のみ `AdMob.showConsentForm`
6. `canRequestAds === true` の場合だけ `AdMob.showBanner`

同意情報の取得やフォーム表示に失敗した場合、アプリ本体は利用可能なままとし、広告表示は行わない。

Debug検証用に以下の環境変数を利用できる。ただしReleaseでは利用しない。

- `NEXT_PUBLIC_IOS_ADMOB_CONSENT_DEBUG_GEOGRAPHY=eea|us|other`
- `NEXT_PUBLIC_IOS_ADMOB_CONSENT_TEST_DEVICE_IDS=<comma-separated ids>`

注意:

- テスト端末IDをReleaseに入れない
- debug geographyをReleaseに入れない
- 本番広告を自分でクリックしない
- AdMob管理画面側でGDPRプライバシーメッセージ作成が必要な場合は、人間がAdMob画面で設定する

## ATTの扱い

今回の実装では次を行わない。

- `AdMob.requestTrackingAuthorization()` を呼ばない
- `NSUserTrackingUsageDescription` を追加しない
- パーソナライズ広告へ変更しない
- IDFA利用を明示的に開始しない

理由:

- 現在の方針は非パーソナライズ広告
- ATTが必要と確認できる追跡実装を追加していない
- ATTが必要と判明した場合は、実装前に利用目的、説明文、App Privacy申告への影響を再整理する

## App Privacy申告候補

| データ種別 | 収集するか | 利用目的 | ユーザーに紐づくか | トラッキングに使うか | 根拠 | App Store Connect候補 |
| --- | --- | --- | --- | --- | --- | --- |
| メールアドレス | 管理者のみ / 通常利用者は収集しない | 管理画面ログイン・権限確認 | 管理者には紐づく | 使わない | `admin_users`, Supabase Auth, `requireAdmin` | 通常利用者向け申告では要確認。管理者限定利用として審査メモに説明 |
| ユーザーID | 要確認 | AdMob/Supabase SDK側で生成される可能性 | 要確認 | 要確認 | Google data disclosure / Supabase Auth | 要確認 |
| 広告識別子 | 要確認 | 広告配信・不正防止・測定 | 要確認 | 現方針ではトラッキング目的に使わない | Google AdMob SDK | 要確認。Google資料とPrivacy Manifestで最終確認 |
| デバイスID | 処理される場合あり | 広告配信・不正防止・診断 | 要確認 | 要確認 | Google AdMob SDK | 識別子または診断情報として要確認 |
| 製品操作 | 処理される場合あり | 広告配信・品質改善・不正防止 | 要確認 | 現方針ではトラッキング目的に使わない | Google AdMob SDK / 任意 analytics env | Product Interaction候補として要確認 |
| 広告データ | 処理される場合あり | 広告表示・測定・不正防止 | 要確認 | 現方針ではトラッキング目的に使わない | Google AdMob SDK | Advertising Data候補 |
| クラッシュ情報 | 条件付き | エラー調査 | 要確認 | 使わない | `NEXT_PUBLIC_SENTRY_DSN` 設定時のみ | Crash Data候補。ただしSentry未設定なら収集なし |
| パフォーマンス情報 | 条件付き | 品質改善 | 要確認 | 使わない | AdMob/Vercel/Sentry設定に依存 | Performance Data候補として要確認 |
| その他診断情報 | 条件付き | 広告SDK・配信基盤の診断 | 要確認 | 要確認 | Google AdMob / Vercel | Diagnostics候補として要確認 |
| 位置情報 | 収集しない | なし | なし | なし | アプリコードに位置情報取得なし | 申告しない候補 |
| 写真 | 収集しない | なし | なし | なし | 通常利用者向け画像アップロードなし。管理画面はWeb限定運用 | 申告しない候補 |
| 食べた記録 | 端末内保存 | コレクション表示 | 端末内のみ | 使わない | `localStorage` | 端末内のみ。収集データとしては申告不要候補 |
| 評価 | 端末内保存 | 食べた記録表示 | 端末内のみ | 使わない | `localStorage` | 端末内のみ。収集データとしては申告不要候補 |
| メモ | 端末内保存 | 食べた記録表示 | 端末内のみ | 使わない | `localStorage` | 端末内のみ。収集データとしては申告不要候補 |
| 問い合わせ内容 | 送信時のみ | 問い合わせ対応・報告確認 | 入力内容次第 | 使わない | `/contact` / Googleフォーム運用 | User Content / Contact Infoは入力項目次第で要確認 |

## 人間がApp Store Connectで最終確認すること

1. Google AdMob SDKの最新Data Disclosureを確認する
2. Xcode Privacy ReportでAdMob/Capacitor関連のPrivacy Manifestを確認する
3. `NEXT_PUBLIC_SENTRY_DSN` と analytics endpoint をReleaseで使うか確認する
4. 問い合わせフォームで任意連絡先を収集するか確認する
5. App Privacyで「トラッキング」扱いになるかを、Google資料・Apple定義・実際の広告設定で最終判断する
6. AdMobのGDPRプライバシーメッセージをAdMob管理画面で作成・公開する

## 提出前チェック

- DebugではGoogle公式テスト広告のみ表示
- Releaseでは本番AdMob App ID / 広告ユニットIDに切り替え可能
- Releaseにdebug geographyやテスト端末IDを入れない
- `requestTrackingAuthorization` を呼ばない
- `NSUserTrackingUsageDescription` を理由なく追加しない
- `/admin` に広告・同意画面を出さない
- Web/PWAにnative AdMobやUMP画面を出さない
- `service role` keyがクライアント成果物に含まれないことを確認する
