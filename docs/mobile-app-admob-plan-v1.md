# UNICOLE Mobile App / AdMob Plan v1

## 1. 現在の構成整理

UNICOLE は Next.js App Router / Vercel / Supabase を中心にした Web/PWA アプリです。公開 URL は `https://unicolle.vercel.app` です。

確認した主な構成:

- Next.js App Router: `app/page.tsx`, `app/foods/page.tsx`, `app/foods/[id]/page.tsx`, `app/eaten/page.tsx`
- PWA manifest: `public/manifest.webmanifest`
- Service Worker: `public/sw.js`
- PWA 登録: `components/pwa-register.tsx`
- 下部ナビ: `components/app-header.tsx`
- 広告枠土台: `components/ads/ad-slot.tsx`
- monetization 設定: `lib/monetization.ts`
- Capacitor 関連:
  - `capacitor.config.ts`
  - `package.json` に `@capacitor/core`, `@capacitor/ios`, `@capacitor/android`, `@capacitor/cli`
  - `build:capacitor`, `cap:sync`, `cap:ios`, `cap:android`, `mobile:build` scripts

現在の広告枠は Web/PWA 向けのプレースホルダーです。`NEXT_PUBLIC_ADS_ENABLED=true` のときだけ表示され、実広告 SDK、広告 ID、広告タグは入っていません。

配置済み placement:

- `home-after-recent`
- `foods-after-filters`
- `foods-inline`
- `food-detail-middle`
- `eaten-summary`

管理画面 `/admin` 配下には広告枠を置かない方針です。

## 2. アプリ化方式の比較

### PWA のまま使う

メリット:

- 追加実装が最小
- Vercel 反映だけで更新できる
- 既存の PWA manifest / Service Worker をそのまま活かせる

デメリット:

- App Store / Google Play の通常アプリとして出しづらい
- AdMob は基本的に使えない
- iOS ではホーム画面追加や通知などの制約が残る

評価: Web 版の継続にはよいが、AdMob 目的には弱い。

### Capacitor で WebView アプリ化

メリット:

- 既存の Next.js UI / Supabase / 管理画面資産を最も活かせる
- iOS / Android の両方へ展開しやすい
- AdMob plugin を導入できる
- 段階的にネイティブ機能を追加できる
- すでに Capacitor 依存と config が入っており、導入準備が進んでいる

デメリット:

- App Store 審査では WebView だけに見えない体験作りが必要
- ネイティブ広告 SDK、Info.plist、AndroidManifest の管理が必要
- Web と App で広告表示方法を分岐する設計が必要
- 静的 export / live server どちらで運用するかを決める必要がある

評価: UNICOLE の現状に最も合う。

### React Native / Expo で作り直す

メリット:

- モバイル UI とネイティブ広告の相性がよい
- App Store / Google Play 向けの自然なアプリ体験を作りやすい
- AdMob 実装の自由度が高い

デメリット:

- 既存 Next.js UI の大部分を作り直す必要がある
- 管理画面、商品詳細、食べた記録、i18n、画像表示などの再実装コストが大きい
- Web/PWA とコード共有が難しくなる

評価: 将来大規模化する場合の選択肢。現段階では過剰。

### Swift / Kotlin でネイティブ実装

メリット:

- 最もネイティブらしい体験にできる
- AdMob や StoreKit などの統合自由度が高い
- パフォーマンス面の制御がしやすい

デメリット:

- iOS / Android の二重実装になる
- 既存 Web 資産をほぼ再利用できない
- 開発・保守コストが最も大きい

評価: 今の UNICOLE には不要。

## 3. UNICOLE におすすめの方式

推奨は Capacitor です。

理由:

- 既存の Next.js / PWA / Supabase / 管理画面資産を活かせる
- すでに Capacitor 依存、config、scripts が存在する
- iOS / Android 両方へ進めやすい
- 将来 AdMob plugin を入れられる
- App Store / Google Play 対応を段階的に進められる

最初は Capacitor の最小起動確認を優先します。いきなり AdMob SDK を入れず、まず iOS / Android のアプリシェルとして安定して動くことを確認します。

## 4. AdMob 広告の配置案

### 優先 placement

1. 下部バナー
   - アプリ版では最も標準的な AdMob 配置
   - ただし UNICOLE には下部ナビがあるため、ナビと重ならない専用領域が必要
   - Safe Area を考慮する

2. `foods-inline`
   - フード一覧の途中に自然に差し込める
   - 誤タップを避けるため、商品カードの操作ボタン直下には置かない
   - 12件ごとの差し込みは Web 側の構造と相性がよい

3. `food-detail-middle`
   - 商品情報の下、関連フードの上
   - 食べたボタンから距離があり、誤タップしにくい

4. `eaten-summary`
   - 食べた記録の集計下
   - ユーザー操作の邪魔になりにくい

5. `home-after-recent`
   - ホームのセクション間
   - アプリ起動直後の体験を邪魔しない高さにする

### 避ける場所

- `/admin` 配下全体
- 商品追加 / 編集 / 画像登録画面
- 食べたボタンの近く
- 下部ナビに被る位置
- Magic Link ログイン画面
- エラー画面や認証導線
- 保存・削除・復元など管理操作の近く

## 5. iOS で必要な設定

AdMob iOS 実装時に必要なもの:

- AdMob iOS App ID
- iOS banner ad unit ID
- テスト広告ユニット ID
- 本番広告ユニット ID
- `Info.plist` への `GADApplicationIdentifier`
- SKAdNetwork identifiers
- ATT 対応方針
- プライバシーポリシー更新
- App Store Privacy Nutrition Label の整理

ATT について:

- パーソナライズ広告を使うなら ATT 許諾が必要になる可能性が高い
- 初期は非パーソナライズ広告で始める方が安全
- ATT ダイアログを出す場合は、表示タイミングを慎重に設計する

iOS で注意すること:

- 下部ナビとバナー広告が重ならないこと
- `safe-area-inset-bottom` を考慮すること
- WebView 内の Web 広告タグと AdMob SDK を混在させないこと
- App Store 審査向けに「WebViewを包んだだけ」に見えない UX を整えること

## 6. Android で必要な設定

AdMob Android 実装時に必要なもの:

- AdMob Android App ID
- Android banner ad unit ID
- テスト広告ユニット ID
- 本番広告ユニット ID
- `AndroidManifest.xml` への `com.google.android.gms.ads.APPLICATION_ID`
- Google Play Data safety の整理
- 広告 ID 利用の申告

Android で注意すること:

- 端末のナビゲーションバーと広告が重ならないこと
- WebView の戻る操作と広告クリックの挙動を確認すること
- Google Play の Families / Ads ポリシーに触れない表示にすること

## 7. Web広告との違い

Web/PWA:

- 将来 AdSense / Google Ad Manager を想定
- `components/ads/ad-slot.tsx` の中身を Web 広告タグへ差し替える
- `NEXT_PUBLIC_ADS_ENABLED` で表示を切り替える
- Vercel / Web ブラウザ上で動く

アプリ:

- AdMob SDK / plugin を想定
- 同じ placement 名をアプリ側の広告表示判断に使う
- Web の `AdSlot` はアプリビルド時に非表示にし、ネイティブ AdMob view を別レイヤーで表示する方が安全
- Web広告タグをアプリ内 WebView に入れない

placement 名は共通化できます。

- `home-after-recent`
- `foods-after-filters`
- `foods-inline`
- `food-detail-middle`
- `eaten-summary`

ただし、アプリ版の下部バナーは Web の inline placement とは別枠として、例えば `app-bottom-banner` を追加するのがよいです。

## 8. 実装 Phase

### Phase App-1: アプリ化方式の決定

- Capacitor 方針を正式決定
- 静的 export 方式か live URL WebView 方式かを決める
- 管理画面をアプリ内に含めるか、Web 管理専用にするかを決める

推奨:

- 初期は Capacitor + live URL 方式で検証
- Store提出前に静的 export 方式と比較

### Phase App-2: Capacitor 導入準備

- `capacitor.config.ts` の appId / appName / webDir を確定
- iOS / Android の native project 生成前チェック
- PWA Service Worker がアプリ WebView で悪さしないか確認
- App向け環境変数方針を整理

### Phase App-3: iOS アプリとして起動確認

- `cap add ios`
- `cap sync ios`
- Xcode で起動
- ログイン、フード一覧、食べた記録、画像表示を確認
- 管理画面をアプリ内で使うか確認

### Phase App-4: Android アプリとして起動確認

- `cap add android`
- `cap sync android`
- Android Studio / Emulator で起動
- iOS と同じ基本導線を確認

### Phase Ads-1: AdMob テスト広告の表示

- AdMob plugin を選定
- テスト広告 ID のみ使用
- iOS / Android それぞれでテストバナー表示
- Web/PWA には影響させない

### Phase Ads-2: 下部バナー広告

- アプリ下部に AdMob banner を表示
- 下部ナビと重ならないレイアウトを作る
- 管理画面では非表示

### Phase Ads-3: 詳細ページ / 一覧内広告

- `foods-inline`
- `food-detail-middle`
- `eaten-summary`
- placement ごとに表示頻度を調整
- 誤タップしやすい位置は避ける

### Phase Ads-4: 本番広告 ID への切り替え

- iOS / Android の本番広告ユニット ID を環境ごとに管理
- 本番 ID をコードへ直書きしない
- 審査前はテスト広告、承認後に本番広告へ切り替える

### Phase Store-1: App Store / Google Play 提出準備

- アイコン / スクリーンショット
- プライバシーポリシー
- 広告利用の申告
- ATT 方針
- Google Play Data safety
- App Store Review Notes

## 9. 最初に Codex へ投げる実装 goal

最初は AdMob SDK を入れず、Capacitor の起動確認から始めるべきです。

```text
/goal UNICOLE の iOS/Android アプリ化 Phase App-1/2 として、既存 Capacitor 構成を確認し、アプリ起動確認に必要な最小準備だけを行ってください。

目的:
Next.js/PWA の既存資産を活かして Capacitor アプリ化を進める前に、現在の capacitor.config.ts、package scripts、PWA/Service Worker、公開URL利用方針を整理し、iOS/Android native project 生成前の安全な準備を行う。

やること:
1. package.json の Capacitor 依存と scripts を確認
2. capacitor.config.ts を確認
3. live URL 方式と static export 方式のどちらで初回検証するか提案
4. Service Worker / PWA 登録が WebView で問題にならないか確認
5. iOS/Android project 生成に必要な最小変更だけ提案
6. まだ AdMob SDK は入れない
7. まだ広告IDは入れない

禁止:
- AdMob SDK追加
- 広告ID追加
- iOS/Android project生成
- Supabase変更
- generated JSON変更
- crawler変更
- translations変更
- proxy.ts変更
- 認証変更

出力:
- 推奨方式
- 変更予定ファイル
- 次の実装手順
- App Store / Google Play 前に確認すべき点
```

## 10. 注意点・壊してはいけないもの

壊してはいけないもの:

- 管理画面ログイン
- Magic Link / PKCE bridge
- admin_users role 判定
- 商品追加 / 編集 / 画像保存
- 非表示 / 削除 / 復元
- 自動取得商品の修正 / 画像差し替え / 元データに戻す
- 食べた記録 localStorage
- `/foods`, `/foods/[id]`, `/eaten`
- Supabase service role key のサーバー限定利用
- `admin_notes` 非公開

広告関連の注意:

- 管理画面には広告を出さない
- Web 広告タグと AdMob SDK を同時に同じ枠へ入れない
- 食べたボタンや保存ボタンの近くに広告を置かない
- 下部ナビとバナー広告を重ねない
- 本番広告 ID はコードへ直書きしない
- まずテスト広告 ID のみで検証する

Store 審査向けの注意:

- WebView だけの低品質アプリに見えないよう、起動体験と下部ナビの自然さを確認する
- プライバシーポリシーに広告・計測・Supabase利用を反映する
- ATT を出す場合は理由文言を準備する
- 子ども向けアプリ扱いにならないよう、ストアカテゴリと対象年齢を慎重に設定する

## 結論

UNICOLE は Capacitor でのアプリ化が最も現実的です。すでに Capacitor 依存と設定ファイルが存在し、Next.js/PWA の資産を活かせます。

AdMob は初手で入れず、まず Capacitor アプリとして iOS / Android で起動確認するのが安全です。その後、アプリ下部バナーから AdMob テスト広告を入れ、問題がなければ一覧内・詳細ページへ段階的に広げます。
