# iOS App Store Connect Entry Checklist v1

更新日: 2026-07-11

対象アプリ: ユニコレ  
Bundle ID: `com.doublecorgi.unicolle`  
Version / Build: `1.0 / 1`

## 前提

- TestFlight内部テスト: Build `1.0 (1)` アップロード済み
- App Review提出: 未実施
- App Store Connectへの自動入力: 未実施
- スクリーンショット: 商品修正後に最終版をアップロードする
- 本チェックリストは入力候補であり、App Store Connect画面上の最新文言を人間が最終確認する

## URL

| 項目 | 入力候補 | Production確認 |
| --- | --- | --- |
| Privacy Policy URL | `https://unicolle.vercel.app/privacy` | HTTP 200 |
| Support URL | `https://unicolle.vercel.app/contact` | HTTP 200 |
| Marketing URL | `https://unicolle.vercel.app/about` | HTTP 200 |
| Terms URL | `https://unicolle.vercel.app/terms` | HTTP 200 |
| Disclaimer URL | `https://unicolle.vercel.app/disclaimer` | HTTP 200 |

## メタデータ

| 項目 | 入力候補 |
| --- | --- |
| App Name | ユニコレ |
| Subtitle | USJフードを記録する非公式図鑑 |
| Primary Category | Food & Drink |
| Secondary Category | Travel |
| Copyright | `© 2026 Double Corgi` 候補。人間が名義を最終確認 |
| Build | `1.0 (1)` |
| Review Notes | `docs/ios-app-store-metadata-draft-v1.md` の案を使用 |

## App Privacy入力順

1. App Store Connect > App Privacy を開く。
2. Privacy Policy URL を `https://unicolle.vercel.app/privacy` に設定。
3. `Data Collection` は「Yes」候補。
4. 次のカテゴリを追加する候補:
   - Contact Info
   - User Content / Customer Support
   - Identifiers
   - Location > Coarse Location
   - Usage Data > Product Interaction
   - Advertising Data
   - Diagnostics
5. Contact Info:
   - Name: `/contact` 任意入力。目的 App Functionality。Linked Yes。Tracking No。
   - Email Address: `/contact` 任意連絡先、管理者Supabase Auth。目的 App Functionality。Linked Yes。Tracking No。
6. User Content:
   - Customer Support または該当するUser Content項目: `/contact` 件名/本文。目的 App Functionality。Linked Yes。Tracking No。
7. Identifiers:
   - User ID: 管理者Supabase Auth/admin_users。目的 App Functionality。Linked Yes。Tracking No候補。
   - Device ID: GoogleMobileAds SDK。目的 Third-Party Advertising / Developer Advertising / Analytics。Linked Yes。Tracking Yes候補。
8. Location:
   - Coarse Location: GoogleMobileAds/UMP。目的 Advertising / Analytics / App Functionality。LinkedはGoogleMobileAds側true、UMP側false。App Store Connect画面上で最新Google資料に合わせる。
9. Usage Data:
   - Product Interaction: GoogleMobileAds/UMP。目的 Advertising / Analytics / App Functionality。LinkedはGoogleMobileAds側true候補。Tracking No候補。
10. Advertising Data:
   - Ads viewed / ad interaction相当。目的 Advertising / Analytics。Linked Yes候補。Tracking No候補。
11. Diagnostics:
   - Crash Data: GoogleMobileAds。目的 Analytics。Not Linked / Not Tracking。
   - Performance Data: GoogleMobileAds/UMP。目的 Analytics / Advertising / App Functionality。Not Linked / Not Tracking。
   - Other Diagnostic Data: GoogleMobileAds。目的 Analytics / Advertising。Not Linked / Not Tracking。
12. 収集しない候補:
   - Precise Location
   - Contacts
   - Photos or Videos
   - Audio Data
   - Purchase History
   - Financial Info
   - Health/Fitness
   - Sensitive Info
   - Search History（端末内のみ）
   - Local reviews/comments（端末内のみ）
13. 入力前に確認:
   - Google AdMob公式Data disclosure
   - Xcode Organizer Privacy Report
   - App Store Connect画面上のTracking説明

## App Privacyで人間確認が必要な項目

| 項目 | 理由 | 推奨判断 |
| --- | --- | --- |
| Device ID Tracking | GoogleMobileAds manifestでTracking=true。アプリコードはATT未使用、npa=true | Trackingとして扱う候補。人間が最終確認 |
| 管理者メール/User ID | 一般利用者ではなく運営者専用だがアプリ機能に含まれる | Contact Info/User IDへ含める候補 |
| 問い合わせ任意連絡先 | 任意欄でメール以外も入力可能 | Contact Infoとして保守的に申告候補 |
| Googleフォーム情報提供 | 外部Googleフォームで送信 | アプリ収集データとして記載する範囲を確認 |
| Sentry/Analytics | Production env未設定だがコードは存在 | 現時点では未収集。将来設定時は更新 |

## 年齢レーティング入力順

1. App Store Connect > Age Rating を開く。
2. Violence系はNone。
3. Profanity or Crude HumorはNone。
4. Mature or Suggestive ThemesはNone。
5. Horror or Fear ThemesはNone。
6. Medical or Treatment InformationはNone。
7. Alcohol, Tobacco, or Drug Use or Referencesは **Infrequent / Mild**。
8. Sexual Content/Nudity系はNone。
9. Simulated Gambling / GamblingはNone。
10. Contests / Loot Boxes / Random ItemsはNone。
11. User-generated contentはNo候補。
12. Messaging and ChatはNo。
13. Social MediaはNo。
14. AdvertisingはYes。
15. Unrestricted Web AccessはNo候補。
16. In-App PurchaseはNo。
17. LocationはNo。
18. Parental Controls / Age AssuranceはNo。
19. App Store Connectが算出した最終レーティングを記録する。

## 年齢レーティングで人間確認が必要な項目

| 項目 | 推奨候補 | 確認内容 |
| --- | --- | --- |
| アルコール言及 | Infrequent / Mild | `ジントニック`, `カクテル`など酒類商品名があるため「なし」にしない |
| 広告 | Yes | AdMobバナーあり |
| Unrestricted Web Access | No | 任意URLブラウザなし。固定外部リンクのみ |
| User-generated Content | No | 端末内レビュー/メモのみで公開投稿なし |

想定:

- 12+ / A12相当候補
- App Store Connectの自動算出結果を最終とする

## 輸出コンプライアンス

未完了。人間がApp Store Connectで回答する。

確認候補:

- アプリは標準HTTPS通信を使用する。
- 独自暗号アルゴリズムの実装は確認していない。
- Supabase、Vercel、Google SDK等の標準通信を利用。

注意:

- Codexは輸出コンプライアンス質問へ推測回答しない。
- Build `1.0 (1)` を選択する前に人間が回答を確定する。

## Build選択

1. App Store Connect > App Store > iOS App Version へ移動。
2. Build欄で `1.0 (1)` を選択。
3. TestFlight Processing完了状態を確認。
4. GoogleMobileAds / UMP dSYM警告が審査提出上のブロッカーでないか確認。

## スクリーンショット

AS2で取得済み:

- `screenshots/ios-app-store-as2/`

ただし、提出用スクリーンショットは商品表示の最終修正後にアップロードすること。

アップロード前確認:

- 管理画面が写っていない
- テスト広告表示が写っていない
- 読み込み途中ではない
- 壊れ画像なし
- 非公式表記が確認できる
- 個人情報なし

## 審査用に追加を押す前の最終確認

1. Build `1.0 (1)` を選択済み。
2. App Privacyを入力済み。
3. Age Ratingを入力済み。
4. Export Complianceを人間が回答済み。
5. Support / Marketing / Privacy URLがHTTP 200。
6. App Review Notesに非公式アプリ、ログイン不要、端末内保存、AdMob/UMPを明記。
7. `summer-2026` 公開15件、pending公開0件、保留公開0件を確認。
8. ATTを追加していない。
9. `NSUserTrackingUsageDescription` を追加していない。
10. App Store ConnectでApp Reviewへ提出する直前に、最新のGoogle AdMob Data disclosureを再確認。

## 提出しない項目

今回の範囲では次を行わない。

- App Store Connectへの自動入力
- App Review提出
- Build 2作成
- TestFlight再アップロード
- App Privacyの確定送信
- 年齢レーティングの確定送信
- スクリーンショットアップロード
