# iOS App Privacy Audit v1

更新日: 2026-07-11

対象アプリ: ユニコレ  
Bundle ID: `com.doublecorgi.unicolle`  
Version / Build: `1.0 / 1`

## 結論

App Store Connect の App Privacy では、通常利用者の食べた記録・レビュー・検索履歴は端末内保存として扱い、サーバー収集データには含めない候補とする。

ただし、次は収集または第三者SDK処理として申告候補に含める。

- お問い合わせフォーム: 件名、本文、任意の名前、任意の連絡先
- Googleフォームによる情報提供: Googleフォーム側へユーザー入力が送信される
- 管理者/運営者ログイン: Supabase Auth と `admin_users` のメールアドレス、ユーザーID
- AdMob / Google Mobile Ads SDK: Device ID、Advertising Data、Product Interaction、Coarse Location、Diagnostics
- UMP: Coarse Location、Product Interaction、Performance Data

Production環境変数確認では、`NEXT_PUBLIC_SENTRY_DSN` と `NEXT_PUBLIC_ANALYTICS_ENDPOINT` は存在しない。したがって、現時点のProductionではアプリ独自のSentry送信および任意Analytics送信は無効。ただしコード上は環境変数設定で有効化可能なため、将来有効化する場合はApp Privacy更新が必要。

## 公式資料

- Apple App privacy: https://developer.apple.com/help/app-store-connect/reference/app-information/app-privacy
- Apple Age ratings values and definitions: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
- Google AdMob iOS App Store data disclosure: https://developers.google.com/admob/ios/privacy/data-disclosure

Google公式資料では、Google Mobile Ads SDK がIPアドレス、クラッシュログ、パフォーマンスデータ、Device ID、Advertising Data、ユーザー操作情報を収集し得ると説明されている。

## 実測した実装

| 項目 | 実測結果 | 根拠 |
| --- | --- | --- |
| Capacitor appId | `com.doublecorgi.unicolle` | `capacitor.config.ts`, `ios/App/App/capacitor.config.json` |
| iOS WebView | Production URL `https://unicolle.vercel.app` | `ios/App/App/capacitor.config.json` |
| AdMob plugin | `@capacitor-community/admob` `8.0.0` | `package.json`, `package-lock.json` |
| Google Mobile Ads SDK | `~> 12.14` / AS2実測 `12.14.0` | `node_modules/@capacitor-community/admob/CapacitorCommunityAdmob.podspec`, `docs/ios-app-store-as2-testflight-result.md` |
| User Messaging Platform | `~> 3.1` / AS2実測 `3.1.0` | 同上 |
| Native AdMob起動条件 | Capacitor native環境のみ。Web/PWAでは起動しない | `components/mobile-admob-banner.tsx` |
| UMP同意処理 | `requestConsentInfo` -> 必要時 `showConsentForm` -> `canRequestAds` 後に広告表示 | `components/mobile-admob-banner.tsx` |
| npa | `AdMob.showBanner(..., npa: true)` | `components/mobile-admob-banner.tsx` |
| ATT API | 未使用 | `rg requestTrackingAuthorization`, `scripts/verify-ios-admob-build.ts` |
| `NSUserTrackingUsageDescription` | なし | `ios/App/App/Info.plist`, `rg NSUserTrackingUsageDescription` |
| SKAdNetworkItems | 50件 | `ios/App/App/Info.plist` |
| アプリ本体Privacy Manifest | `ios/App/App/PrivacyInfo.xcprivacy` なし | `find ios -name PrivacyInfo.xcprivacy` |
| SDK Privacy Manifest | GoogleMobileAds / UMP / Capacitor / Cordova がArchive生成物に存在 | `ios/DerivedData/.../PrivacyInfo.xcprivacy`, AS2結果 |
| Sentry package | npm packageとしてのSentry SDKなし | `package.json`, `rg Sentry` |
| Sentry互換送信 | `NEXT_PUBLIC_SENTRY_DSN` 設定時のみ独自envelope送信 | `lib/observability.ts` |
| Production Sentry env | 未設定 | `npx vercel env ls` |
| 任意Analytics env | 未設定 | `npx vercel env ls` |
| 一般利用者ログイン | 未実装。`app/profile` は空、`app/auth/callback` は管理者ログイン用 | `find app/profile`, `app/auth/callback/route.ts` |
| 食べた記録 | 端末内 `localStorage` | `lib/use-food-logs.ts`, `lib/local-user-data.ts` |
| レビュー/メモ | 端末内 `localStorage` | `lib/use-food-reviews.ts`, `lib/local-user-data.ts` |
| 最近見た商品/検索 | 端末内 `localStorage` | `lib/local-user-data.ts`, `components/food-grid.tsx` |
| お問い合わせ | Server Actionでサーバーへ送信しローカルJSONへ保存 | `app/contact/actions.ts`, `lib/contact-submissions.ts` |
| 情報提供 | Googleフォームへの外部リンク | `app/request/page.tsx`, `lib/request-form-url.ts` |
| カメラ/写真/位置情報 | 通常利用者向け権限なし | `Info.plist`, `rg geolocation/camera/photo` |
| 管理画面画像アップロード | 運営者専用。Supabase Storageへ保存 | `components/admin/food-form.tsx`, `app/admin/foods/actions.ts` |

## SDK Privacy Manifest実測

### GoogleMobileAds.framework

| Data Type | Linked | Tracking | Purposes |
| --- | --- | --- | --- |
| Other Diagnostic Data | false | false | Third-Party Advertising, Developer Advertising, Analytics |
| Coarse Location | true | false | Third-Party Advertising, Analytics, Developer Advertising |
| Performance Data | false | false | Third-Party Advertising, Developer Advertising, Analytics |
| Crash Data | false | false | Analytics |
| Advertising Data | true | false | Third-Party Advertising, Developer Advertising, Analytics |
| Product Interaction | true | false | Analytics, Developer Advertising, Third-Party Advertising |
| Device ID | true | true | Third-Party Advertising, Analytics, Developer Advertising |

### UserMessagingPlatform.framework

| Data Type | Linked | Tracking | Purposes |
| --- | --- | --- | --- |
| Coarse Location | false | false | App Functionality |
| Performance Data | false | false | App Functionality |
| Product Interaction | false | false | App Functionality |

## 一般利用者データの保存先

| データ | 保存先 | 開発者サーバー送信 | 第三者SDK送信 | App Privacy扱い候補 |
| --- | --- | --- | --- | --- |
| 食べた記録 `foodId/status/eatenAt/eatenCount` | `localStorage: uniba-food-logs-v1` | なし | なし | 端末内のみ。収集しない候補 |
| 評価 `rating` | `localStorage: uniba-food-logs-v1` | なし | なし | 端末内のみ。収集しない候補 |
| メモ `memo` | `localStorage: uniba-food-logs-v1` | なし | なし | 端末内のみ。収集しない候補 |
| 金額 `spentAmount` | `localStorage: uniba-food-logs-v1` | なし | なし | 端末内のみ。収集しない候補 |
| ユーザー写真URL `userPhotoUrl` | `localStorage: uniba-food-logs-v1` | なし | なし | 端末内のみ。写真アップロード機能なし |
| 食品レビュー `ratings/comment` | `localStorage: uniba-food-reviews-v1` | なし | なし | 端末内のみ。収集しない候補 |
| レビュー通報/非表示 | `localStorage: uniba-food-reviews-v1` | なし | なし | 端末内のみ。収集しない候補 |
| 最近見た商品 | `localStorage: uniba-recent-foods-v1` | なし | なし | 端末内のみ。収集しない候補 |
| 最近の検索 | `localStorage: uniba-recent-searches-v1` | なし | なし | 端末内のみ。収集しない候補 |
| 次に食べたい | `localStorage: uniba-next-want-foods-v1` | なし | なし | 端末内のみ。収集しない候補 |
| 問い合わせ 件名/本文 | サーバー処理後 `scripts/output/contact-submissions.generated.json` | あり | なし | User Content / Other Data候補 |
| 問い合わせ 名前/連絡先 | 同上 | あり | なし | Contact Info候補。任意入力 |
| 情報提供フォーム | Googleフォーム | Googleへ送信 | Google | Googleフォーム利用として人間確認 |
| 管理者メール | Supabase Auth / `admin_users` | あり | Supabase | Contact Info / User ID候補。運営者専用 |

## App Privacy入力表

| Appleのデータカテゴリ | 収集する/しない | 送信元 | 保存先 | 目的 | Linked to User | Used for Tracking | 根拠ファイル | 第三者SDK | App Store Connect回答候補 | 人間確認が必要な点 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Contact Info - Email Address | 条件付きで収集 | `/contact` 任意連絡先、管理者ログイン | サーバー保存領域、Supabase Auth/admin_users | 問い合わせ対応、運営者認証 | Yes | No | `app/contact/actions.ts`, `lib/admin-auth.ts` | Supabase | 収集する / App Functionality / Linked / Not Tracking | 任意連絡先欄にメール以外も入る。管理者専用メールをApp Privacyに含めるか最終確認 |
| Contact Info - Name | 条件付きで収集 | `/contact` 任意名前 | サーバー保存領域 | 問い合わせ対応 | Yes | No | `app/contact/contact-form.tsx`, `app/contact/actions.ts` | なし | 収集する / App Functionality / Linked / Not Tracking | 任意入力だが収集対象に含めるか最終確認 |
| User ID | 条件付きで収集 | 管理者ログイン | Supabase Auth/admin_users | 運営者認証、権限管理 | Yes | No | `app/auth/callback/route.ts`, `lib/admin-auth.ts` | Supabase | 収集する / App Functionality / Linked / Not Tracking | 一般利用者ログインはない。運営者専用IDの扱いを人間確認 |
| Device ID | 収集する | Google Mobile Ads SDK | Google | Third-Party Advertising, Analytics, Developer Advertising | Yes | Yes | GoogleMobileAds PrivacyInfo, Google公式Data disclosure | Google Mobile Ads | 収集する / Third-Party Advertising + Analytics + Developer Advertising / Linked / Tracking | ATT未使用でもSDK manifestでTracking=true。App Store ConnectのTracking回答を人間が最終確認 |
| Advertising Data | 収集する | Google Mobile Ads SDK | Google | 広告表示、広告測定、分析 | Yes | No | GoogleMobileAds PrivacyInfo, `mobile-admob-banner.tsx` | Google Mobile Ads | 収集する / Third-Party Advertising + Analytics + Developer Advertising / Linked / Not Tracking | Google側の最新DisclosureとAdMob管理画面設定を最終確認 |
| Location - Coarse Location | 収集する | Google Mobile Ads SDK / UMP | Google | 広告、同意管理、分析 | GMA: Yes / UMP: No | No | SDK PrivacyInfo | Google Mobile Ads, UMP | 収集する / Third-Party Advertising + Analytics + App Functionality / LinkedはSDK差分あり | App Store Connectではカテゴリ単位でLinked設定が必要なためGoogle最新資料で確認 |
| Location - Precise Location | 収集しない | なし | なし | なし | No | No | Info.plist権限なし、コード検索 | なし | 収集しない | なし |
| User Content - Customer Support | 収集する | `/contact` 件名/本文 | サーバー保存領域 | 問い合わせ対応 | Yes | No | `app/contact/actions.ts`, `lib/contact-submissions.ts` | なし | 収集する / App Functionality / Linked / Not Tracking | Apple UI上でUser ContentかOther Dataか最終確認 |
| User Content - Reviews/Comments | 端末内のみ | 食品レビュー | localStorage | ユーザー自身の記録 | No | No | `lib/use-food-reviews.ts` | なし | 収集しない候補 | 端末内のみ。公開投稿ではない |
| Search History | 端末内のみ | 検索UI | localStorage | 利便性 | No | No | `localRecentSearchesStorageKey` | なし | 収集しない候補 | 外部送信なし |
| Browsing History | 条件付きで収集 | `AnalyticsTracker` | Productionでは未設定。設定時は任意endpoint | ページ表示傾向把握 | 未設定時No | No | `components/analytics-tracker.tsx`, `lib/observability.ts`, Vercel env | なし | 現Productionでは収集しない候補 | `NEXT_PUBLIC_ANALYTICS_ENDPOINT` を将来設定する場合はUsage Data申告へ変更 |
| Product Interaction | 収集する | Google Mobile Ads SDK / UMP | Google | 広告、分析、同意管理 | GMA: Yes / UMP: No | No | SDK PrivacyInfo, Google公式Data disclosure | Google Mobile Ads, UMP | 収集する / Third-Party Advertising + Analytics + Developer Advertising + App Functionality / Linked / Not Tracking | Google最新資料でLinked扱い最終確認 |
| Advertising Data - Ad interactions | 収集する | Google Mobile Ads SDK | Google | 広告表示、測定 | Yes | No | SDK PrivacyInfo | Google Mobile Ads | 収集する / Third-Party Advertising + Analytics + Developer Advertising / Linked / Not Tracking | Device IDとの組み合わせがTracking扱いになるか人間確認 |
| Crash Data | 収集する | Google Mobile Ads SDK | Google | SDK品質改善、診断 | No | No | SDK PrivacyInfo | Google Mobile Ads | 収集する / Analytics / Not Linked / Not Tracking | SentryはProduction未設定。Google SDK分のみ |
| Performance Data | 収集する | Google Mobile Ads SDK / UMP | Google | SDK品質改善、広告、同意管理 | No | No | SDK PrivacyInfo | Google Mobile Ads, UMP | 収集する / Analytics + Advertising + App Functionality / Not Linked / Not Tracking | なし |
| Other Diagnostic Data | 収集する | Google Mobile Ads SDK | Google | 診断、広告、分析 | No | No | SDK PrivacyInfo | Google Mobile Ads | 収集する / Analytics + Advertising / Not Linked / Not Tracking | なし |
| Purchase History | 収集しない | なし | なし | なし | No | No | StoreKit/IAPコードなし | なし | 収集しない | `spentAmount` は端末内メモであり購入履歴送信ではない |
| Financial Info | 収集しない | なし | なし | なし | No | No | 決済コードなし | なし | 収集しない | なし |
| Health/Fitness | 収集しない | なし | なし | なし | No | No | 該当機能なし | なし | 収集しない | なし |
| Sensitive Info | 収集しない | なし | なし | なし | No | No | 該当機能なし | なし | 収集しない | なし |
| Contacts | 収集しない | なし | なし | なし | No | No | 権限なし | なし | 収集しない | 問い合わせの連絡先はContacts権限ではない |
| Photos or Videos | 通常利用者は収集しない | なし | なし | なし | No | No | 権限なし | なし | 収集しない候補 | 運営者画像アップロードは管理画面専用。通常利用者向けではない |
| Audio Data | 収集しない | なし | なし | なし | No | No | マイク権限なし | なし | 収集しない | なし |
| Gameplay Content | 収集しない | なし | なし | なし | No | No | ゲーム機能なし | なし | 収集しない | なし |
| Other Data | 条件付き | 問い合わせ内容、フォーム投稿 | サーバー保存領域 / Googleフォーム | 問い合わせ対応、情報提供 | Yes | No | `app/contact`, `app/request` | Google Forms | User Contentで表現できない場合のみOther Data | App Store Connect画面の選択肢に合わせて調整 |

## App Store Connect入力候補

### Data Used to Track You

候補:

- Device ID

根拠:

- GoogleMobileAds.framework Privacy Manifestで `DeviceID` が `Tracking=true`
- Google公式Data disclosureでDevice IDがthird-party advertising and analytics目的に使われ得る

注意:

- アプリコードはATT APIを呼ばず、`NSUserTrackingUsageDescription` もない
- `npa: true` を指定している
- それでもSDK manifest上のTracking=trueを無視して「Trackingなし」と断定しない
- App Store Connectでの最終判断は人間確認

### Data Linked to You

候補:

- Contact Info: Email Address, Name
- Identifiers: User ID, Device ID
- Location: Coarse Location
- Usage Data: Product Interaction
- Advertising Data
- User Content: Customer Support

根拠:

- GoogleMobileAds SDK Privacy Manifestのlinked=true項目
- 管理者Supabase Authと問い合わせフォーム

### Data Not Linked to You

候補:

- Diagnostics: Crash Data, Performance Data, Other Diagnostic Data
- UMP由来のCoarse Location / Product Interaction / Performance Data

注意:

- App Store Connectが同一カテゴリ単位でLinked設定を求める場合、GoogleMobileAds側のlinked=trueに合わせる必要がある可能性がある。

### Data Not Collected

候補:

- Precise Location
- Contacts
- Photos or Videos
- Audio Data
- Purchase History
- Financial Info
- Health/Fitness
- Sensitive Info
- Gameplay Content
- Search History（端末内のみ）
- User Reviews/Comments（端末内のみ）
- Recently Viewed Foods（端末内のみ）

## ATT判断

コード上の事実:

- `requestTrackingAuthorization` 呼び出しなし
- `ATTrackingManager` 直接利用なし
- `NSUserTrackingUsageDescription` なし
- `AdMob.showBanner` は `npa: true`
- Releaseではdebug geography/test device IDを渡さない

回答候補:

- ATTプロンプトは追加しない
- IDFAをアプリコードから要求しない
- App Privacy上のTrackingは、GoogleMobileAds SDK manifestのDevice ID `Tracking=true` を根拠に「要人間確認」。推測でTrackingなしにしない

## Sentry / Analytics状態

| 項目 | 状態 | 回答候補 |
| --- | --- | --- |
| Sentry SDK package | 未導入 | Sentry SDK由来データなし |
| 独自Sentry envelope | コードあり | `NEXT_PUBLIC_SENTRY_DSN` がProduction未設定のため現時点では送信なし |
| Analytics endpoint | コードあり | `NEXT_PUBLIC_ANALYTICS_ENDPOINT` がProduction未設定のため現時点では送信なし |
| Local analytics | 環境変数で有効化可能 | Production未設定のため現時点ではなし |

将来 `NEXT_PUBLIC_SENTRY_DSN` または `NEXT_PUBLIC_ANALYTICS_ENDPOINT` をProductionへ設定する場合、Diagnostics / Usage Data の回答を更新する。

## App Store Connect入力手順

1. App Store Connect > App Privacy を開く。
2. Privacy Policy URL に `https://unicolle.vercel.app/privacy` を入力。
3. Data Collection で「Yes」を選択する候補:
   - Contact Info
   - User Content / Customer Support
   - Identifiers
   - Usage Data
   - Diagnostics
   - Location > Coarse Location
   - Advertising Data
4. 各カテゴリの目的を次で入力:
   - Third-Party Advertising
   - Developer Advertising or Marketing
   - Analytics
   - App Functionality
5. Linked to User:
   - GoogleMobileAds manifestのlinked=true項目はLinked候補
   - 問い合わせ/管理者認証はLinked候補
6. Tracking:
   - Device IDはTracking候補として人間確認
   - 他カテゴリはTrackingなし候補
7. 端末内のみの食べた記録、レビュー、検索履歴は「収集しない」扱いで入力候補。
8. 入力前にGoogle AdMob公式Data disclosureとXcode Organizer Privacy Reportを最終照合する。

## 人間確認が必要な項目

1. GoogleMobileAdsのDevice ID `Tracking=true` をApp Store Connect上でTrackingとして申告するか。
2. AdMob管理画面でPublisher first-party ID、パーソナライズ広告、同意メッセージ設定がどの状態か。
3. 問い合わせフォームの任意連絡先をContact Infoとして入力する最終範囲。
4. 管理者/運営者専用のSupabase Authメール/IDをApp Privacyの一般回答へ含めるか。
5. Googleフォームで受け付ける情報提供をアプリの収集データとしてどこまで明記するか。
