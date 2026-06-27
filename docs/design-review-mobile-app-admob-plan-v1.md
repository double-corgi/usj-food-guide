# 設計レビュー証跡: mobile-app-admob-plan-v1（アプリ化・AdMob 設計）

- **対象**: `docs/mobile-app-admob-plan-v1.md`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-23
- **判定**: ⚠️ **条件付きで可** — 最初の goal（Capacitor 起動確認のみ）はそのまま投げてよい。AdMob 以降に進む前に下記「直すべき点」の反映が必要。

> 本書はレビューのみ。コード変更・git・依存追加・Supabase・Vercel 変更なし。実コードと doc を照合済み。

---

## 1. 設計の総評

- **方向性は妥当**。Capacitor 採用は UNICOLE に最適（既に `@capacitor/*` 依存・`capacitor.config.ts`・`build:capacitor`/`cap:*`/`mobile:build` scripts・`ios/` が存在）。比較（PWA/Capacitor/RN/Expo/Swift-Kotlin）も的確。
- **順序が安全**: 「まず Capacitor 起動確認 → 後で AdMob」「初手で SDK を入れない」は正しい（Q3/Q12 ◎）。
- **広告方針が概ね健全**: 管理画面に広告を出さない／下部ナビ・食べた/保存ボタンと干渉回避／safe-area／**Web 広告タグと AdMob を同一枠に混在させない**／アプリは別枠 `app-bottom-banner`／Web の AdSlot はアプリビルドで非表示にし native AdMob を別レイヤー、は good（Q5/Q6）。
- **iOS/Android 設定の網羅**: GADApplicationIdentifier・SKAdNetwork・ATT・Privacy Nutrition Label／APPLICATION_ID・Data safety・広告ID申告 と概ね漏れなし（Q7/Q8）。
- **ATT 方針**: 「初期は非パーソナライズ＝ATT 不要寄り」で安全（妥当）。
- 実コード照合: `components/ads/ad-slot.tsx`・`lib/monetization.ts`・placements(home-after-recent/foods-after-filters/foods-inline/food-detail-middle/eaten-summary)・`mobile:build` はすべて**実在・正確**。

→ 総じて**質は高い**。ただし重要な抜け（IP リスク）と技術的な現実性（WebView 内 inline AdMob）に補正が要る。

## 2. 危ない点

1. **🔴 知財/商標/著作のリスクが未記載（最重要・抜け）**: UNICOLE は**非公式**で「USJ/ユニバ」を参照し**公式商品画像**も扱う。**広告で収益化**すると「他社商標・著作物に乗じた商用利用」と見なされ、**App Store/Google Play からの削除、AdMob/AdSense アカウント停止**のリスクが上がる。本 doc の Store 注意点にこの観点が無い。
2. **🟠 WebView 内 inline AdMob は技術的に困難**: AdMob のバナーは**ネイティブのアンカー型（上/下）overlay** が基本。`foods-inline`/`food-detail-middle` のような **WebView の DOM 途中にネイティブ AdMob を差し込むのは現実的でない**（Phase Ads-3 は過大）。アプリ版は**下部アンカーバナー中心**にし、inline/詳細枠は **Web(AdSense) 専用**に寄せるのが現実的。
3. **🟠 live URL 方式の審査リスク**: 「初期は live URL WebView で検証」は開発は楽だが、**App Store 4.2（最低限の機能/“ただのWebサイトのWebView”）でリジェクトされやすい**。提出は static export 寄りが安全（doc も比較を後回しにしているが、リスクの明記が薄い）。
4. **🟠 static export と管理画面/認証の非互換**: 管理画面は **server action（createAdminFood 等＋service role）**で動く。**static export では server action/API が動かない**ため、static アプリに管理機能は載らない。→ **管理画面は Web 限定**にすべき（doc の「アプリ内に含めるか決める」は、実質 Web 限定が正解）。
5. **🟡 Magic Link / PKCE / Service Worker の WebView 挙動未検証**: Capacitor WebView では Cookie/ディープリンク/SW キャッシュの挙動が Web と異なる。Magic Link 認証と SW（古い shell 配信）の確認が必須。
6. **🟡 事実誤り（軽微）**: 公開 URL は `https://unicolle.vercel.app` ではなく **`https://new-app-chi-rosy.vercel.app`**。`appId = com.usjfoodguide.app`（"usjfoodguide"）で、`android/` native project は**未生成**（dep はあり）。

## 3. 直すべき点

- **IP/商標/著作リスクを Store 注意点に追加**（最優先）。非公式明記・公式画像の権利確認・自前/許諾画像への移行・収益化前の規約/法務確認を計画に入れる。
- **AdMob 配置の現実化**: アプリ＝**下部アンカーバナー**（必要なら interstitial）に限定。`foods-inline`/`food-detail-middle`/`eaten-summary` は **Web/AdSense 専用**と明記し、Phase Ads-3 を「アプリは inline AdMob を入れない／Web のみ」に修正。
- **配信方式の明確化**: 提出は **static export 前提**＋**管理画面は Web 限定**（server action は static で動かない）。live URL は開発検証のみ・4.2 リスクを明記。
- **認証/SW の WebView 検証を Phase App-3 に明記**（Magic Link 成功・SW がアプリで悪さしない）。
- **事実修正**: 公開 URL を `new-app-chi-rosy.vercel.app` に。`appId` の "usjfoodguide" は**初回提出前に `com.unicole.app` 等へ変更を検討**（後変更は高コスト）。`android/` 未生成を明記。

## 4. このまま Codex に投げてよいか

- **最初の goal（Phase App-1/2: Capacitor 確認・準備のみ、AdMob なし・native project 未生成）は、ほぼそのまま投げてよい**（read/advisory 中心で安全）。下記§5の補強版を推奨。
- **doc 全体（特に AdMob/Store フェーズ）は、§3 の補正を反映してから先へ進める**こと。AdMob を入れる段は IP リスク・inline 現実性・static/auth を確定してから。

## 5. 最初に Codex へ投げるべき /goal（補強版・コピペ用）

```
/goal UNICOLE アプリ化 Phase App-1/2: 既存 Capacitor 構成を「確認・整理・提案」する。AdMob SDK・広告ID・native project 生成は行わない。コードはほぼ変更せず、必要な最小設定確定の提案に留める。

## 確認・整理（read/advisory 中心）
1. package.json の Capacitor 依存と scripts（build:capacitor, cap:sync, cap:ios, cap:android, cap:open:*, mobile:build）を確認・整理。
2. capacitor.config.ts を確認（appId=com.usjfoodguide.app / appName=ユニコレ / webDir）。appId の "usjfoodguide" を初回提出前に com.unicole.app 等へ変更すべきか所見を出す（変更は提案のみ、本goalでは変えない）。
3. 配信方式の比較と推奨:
   - static export（CAPACITOR_STATIC_EXPORT=1, webDir=out）方式と live URL(WebView) 方式を比較。
   - 重要: 管理画面は server action(createAdminFood 等＋service role)で動くため static export では動かない。→ 管理画面は Web 限定、消費者アプリは static export 寄りが審査に安全、という前提で所見を出す。
   - live URL は開発検証のみ、App Store 4.2(最低限の機能) リジェクトリスクを明記。
4. PWA Service Worker(public/sw.js) と pwa-register が Capacitor WebView で問題ないか（古い shell 配信・キャッシュ）を確認し、アプリビルドで SW を無効化すべきか提案。
5. Magic Link / PKCE / Supabase 認証が WebView で成立するか（Cookie/ディープリンク）を確認方法とともに提案。
6. 公開URLの事実確認（https://new-app-chi-rosy.vercel.app）。
7. native project 生成(cap add ios/android)前に必要な最小準備の一覧化（生成自体はやらない）。

## やってはいけないこと
- AdMob SDK / プラグイン追加、広告ID追加、native project 生成(cap add)、依存追加。
- Supabase / generated JSON / crawler / translations / proxy.ts / 認証 / Vercel の変更。
- service role key をクライアントに出す変更。
- 既存 Web/PWA・管理画面・食べた記録・公開ページを壊す変更。
- git add .。

## 出力
- 推奨配信方式（static export＋管理画面Web限定 を軸に）と理由。
- 変更予定ファイル（あれば最小）と、しない範囲。
- 認証/SW の WebView 検証手順。
- 次フェーズ(App-3 iOS起動確認)の前提条件。
- App Store / Google Play 提出前の確認点（IP/商標リスク含む）。
```

## 6. その次の /goal（Phase App-3: iOS 起動確認）

```
/goal UNICOLE Phase App-3: iOS アプリとして起動確認する（AdMob なし）。cap add ios / cap sync ios（または既存 ios/ を利用）→ Xcode/Simulator で起動し、ログイン・フード一覧・商品詳細・食べた記録・画像表示が動くか確認する。管理画面はアプリでは使わない前提（Web限定）で検証。
- AdMob SDK・広告ID は入れない。Supabase/generated/crawler/translations/proxy/認証 を変更しない。
- Magic Link 認証・Service Worker の WebView 挙動を確認し、問題があれば SW 無効化等の最小対応のみ提案。
- 検証: iOS Simulator で主要導線が動く／既存 Web/PWA に影響なし／lint/typecheck/build 成功。
- Android(App-4) は iOS 確認後。AdMob(Ads-1) はさらにその後、IP/inline/static 方針確定後。
```

## 7. App Store / Google Play 向けの注意点（補強）

- **IP/商標/著作（最重要）**: 非公式を説明文・アプリ内・スクショで明記。公式商品画像の権利を確認し、可能な限り自前/許諾画像へ移行。収益化前に規約・引用範囲を精査（必要なら法務）。`appId`/表示名から公式誤認を避ける。
- **4.2 最低限の機能**: 「WebView を包んだだけ」に見えない体験（ネイティブ感・下部ナビ・オフライン挙動）。live URL のみは避け、static export＋ネイティブ要素。
- **AdMob 現実**: アプリは下部アンカーバナー中心（inline は Web/AdSense）。テスト広告で開発、製品ビルドは本番ユニットID（テスト広告を製品に出さない）。空配信でも崩れない。
- **プライバシー**: ATT（初期は非パーソナライズで不要寄り）、App Privacy / Data safety に広告・計測・Supabase を反映。プライバシーポリシー更新。
- **管理画面非同梱**: 消費者アプリに /admin を含めない（Web 限定）。service role キーは絶対バンドルしない。
- **年齢/カテゴリ**: 子ども向け扱いを避ける設定。

---

## 結論
Capacitor 方針・順序・広告の干渉回避・iOS/Android 設定網羅は妥当で、**最初の Capacitor 確認 goal は安全に投げてよい**（§5 補強版推奨）。ただし AdMob/Store へ進む前に、**①知財/商標リスクの明記、②WebView 内 inline AdMob の非現実性（アプリ＝下部アンカーバナー、inline は Web）、③static export＋管理画面 Web 限定＋認証/SW の WebView 検証、④事実修正（URL/appId/android 未生成）** を反映すること。

**判定: 条件付きで可（最初の確認 goal は可、AdMob 段は補正後）**
