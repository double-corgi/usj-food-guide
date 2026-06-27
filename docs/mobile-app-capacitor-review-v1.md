# UNICOLE Mobile App Phase App-1/2 Capacitor Review v1

## 1. 現在の Capacitor 構成

確認ファイル:

- `package.json`
- `capacitor.config.ts`
- `next.config.mjs`

### 依存関係

`package.json` には Capacitor 関連がすでに入っている。

- `@capacitor/core`
- `@capacitor/cli`
- `@capacitor/ios`
- `@capacitor/android`

現時点では AdMob SDK / AdMob plugin は未導入。

### scripts

`package.json` にあるアプリ化関連 scripts:

- `build:capacitor`: `CAPACITOR_STATIC_EXPORT=1 next build --webpack`
- `cap:sync`: `cap sync`
- `cap:sync:ios`: `cap sync ios`
- `cap:ios`: `cap add ios`
- `cap:android`: `cap add android`
- `cap:open:ios`: `cap open ios`
- `cap:open:android`: `cap open android`
- `mobile:build`: `npm run build && npm run cap:sync`

注意点:

- `build:capacitor` は static export 用。
- `mobile:build` は通常 `next build` を呼んでおり、`out` を作る static export とは一致しない可能性がある。
- `capacitor.config.ts` の `webDir` は `out` なので、static export 方式なら `build:capacitor` を使う必要がある。

### capacitor.config.ts

現在の設定:

- `appId`: `com.usjfoodguide.app`
- `appName`: `ユニコレ`
- `webDir`: `out`
- `CAPACITOR_SERVER_URL` がある場合だけ `server.url` を設定
- `server.cleartext` は URL が `http://` で始まる場合のみ true

評価:

- live URL WebView 方式と static export 方式の両方を意識した設定になっている。
- `CAPACITOR_SERVER_URL=https://unicolle.vercel.app` を使えば live URL WebView 検証ができる。
- static export 方式では `webDir: "out"` と整合するが、admin/server action 機能は動かない。

### appId の確認

現在の `appId` は `com.usjfoodguide.app`。

懸念:

- `usj` を bundle identifier に含めると、公式アプリとの誤認や商標リスクを指摘される可能性がある。
- アプリ名は「ユニコレ」で非公式性を説明できるが、bundle id は審査やストア表示には直接出ない一方、提出前に慎重に決めるべき。

提案:

- 今回は変更しない。
- 提出前に `appId` をより非公式・独自ブランド寄りにする候補を検討する。
- 候補例:
  - `app.unicolle.mobile`
  - `jp.unicolle.app`
  - `com.unicolle.app`

## 2. 現在の PWA 構成

確認ファイル:

- `public/manifest.webmanifest`
- `public/sw.js`
- `components/pwa-register.tsx`
- `app/layout.tsx`

### manifest

主な設定:

- `name`: `ユニバフードコレクション`
- `short_name`: `ユニコレ`
- `display`: `standalone`
- `scope`: `/`
- `start_url`: `/`
- `theme_color`: `#071b3a`
- `orientation`: `portrait`
- icons: 192 / 512 / 1024 / svg
- screenshots: home / food detail / complete
- shortcuts: foods / eaten / areas / stores

評価:

- PWA としての最低限は整っている。
- アプリ提出用のスクリーンショットとは別に、App Store / Google Play 用の正式スクリーンショットを準備する必要がある。

### Service Worker

`public/sw.js` は `CACHE_NAME = "uniba-food-conquest-v5"` を使い、主要ページとアイコンをキャッシュしている。

注意点:

- Capacitor WebView で live URL を表示する場合、Service Worker が古いページを保持する可能性がある。
- 現在の `PwaRegister` は production かつ localhost でない場合に Service Worker を登録する。
- Capacitor WebView 内でも hostname が `unicolle.vercel.app` なら登録対象になる。
- アプリ版では、初回検証時に Service Worker を無効化するか、アプリWebView判定で登録しない分岐を検討するべき。

### PWA install UI

`components/pwa-register.tsx` は iOS Safari 向けの「ホーム画面に追加」案内を出す。

注意点:

- Capacitor アプリ内では「ホーム画面に追加」は不要。
- アプリ内 WebView でこの案内が出ると不自然。
- 次Phaseで Capacitor 環境判定を入れて非表示にするのが安全。

## 3. static export 方式と live URL WebView 方式の比較

### static export 方式

概要:

- `CAPACITOR_STATIC_EXPORT=1 next build --webpack`
- `next.config.mjs` で `output: "export"` と `trailingSlash: true`
- `capacitor.config.ts` の `webDir: "out"` に静的ファイルを入れる

メリット:

- アプリ本体に画面を同梱できる
- 初期表示が速い
- Vercel 障害時も一部画面を開ける
- Store審査上、単なる外部サイトラッパーに見えにくい

デメリット:

- server action が動かない
- admin機能、画像保存、Magic Link callback、Supabase server session などが制約を受ける
- 動的ページやサーバー依存機能の扱いが難しい
- 更新のたびにアプリ再ビルドが必要になる

UNICOLEでの評価:

- 公開閲覧専用アプリなら候補になる。
- 現在の管理画面や保存機能をそのまま入れるには不向き。

### live URL WebView 方式

概要:

- Capacitor の `server.url` に `https://unicolle.vercel.app` を指定してWebView表示する
- Vercel上のNext.jsサーバー機能をそのまま使う

メリット:

- 現在のWeb/PWA機能をほぼそのまま使える
- server action、Supabase auth、画像保存、管理画面が動く
- Vercel deployで即時更新できる
- アプリ化の初期検証が最も早い

デメリット:

- Store審査で「Webサイトを包んだだけ」に見えないようUX調整が必要
- ネットワーク必須
- Service WorkerやCookie周りのWebView固有問題を検証する必要がある
- アプリ内広告はWebページ内ではなくネイティブ側で扱う設計が必要

UNICOLEでの評価:

- 初回 iOS/Android 起動確認には最適。
- 管理画面を使う場合も live URL が現実的。

### PWA方式

概要:

- App Store / Google Play には出さず、ホーム画面追加で使う

メリット:

- 現在の構成そのまま
- 審査なし
- Vercel deployだけで更新できる

デメリット:

- AdMobが使えない
- App Store / Google Play に出せない
- iOS Safari 制約が残る

UNICOLEでの評価:

- Web版として継続する価値はあるが、アプリ収益化の本線ではない。

## 4. UNICOLEにおすすめの方式

Phase App-3/4 の初回検証は live URL WebView 方式を推奨する。

理由:

- 管理画面、server action、Supabase、画像保存をそのまま動かせる。
- 既存のWeb資産を最も壊しにくい。
- `CAPACITOR_SERVER_URL` で切り替え可能な構成がすでにある。
- AdMob検証前に、アプリシェルとしての起動・ログイン・食べた記録を確認しやすい。

提出前の再評価:

- 公開閲覧だけなら static export 方式も再検討する。
- 管理画面をアプリから使うなら live URL 方式を継続する。
- Store審査対策として、スプラッシュ、アイコン、下部ナビ、戻る挙動、オフライン時表示を整える。

## 5. 管理画面をアプリに入れるべきか

結論:

- 初期アプリでは、管理画面はWeb限定または管理者だけアクセス可能な隠し導線にするのが安全。
- 一般ユーザー向けアプリの主要導線には `/admin` を出さない。

理由:

- 管理画面は server action と service role 経由の保存処理に依存している。
- service role key はサーバー側だけで使われており、現状クライアントに出ていない。この設計は維持する。
- static export では管理画面保存処理が動かない。
- App Store審査時に管理機能が見えると説明が必要になる。

推奨運用:

- 一般向けアプリには管理導線を常時表示しない。
- 管理者はWeb版 `https://unicolle.vercel.app/admin` を使う。
- どうしてもアプリ内から管理したい場合は、ログイン済み管理者だけに `AdminSessionBar` 相当の導線を出す。
- viewer/editor/owner の role 制御は現在の server side 判定を維持する。

## 6. AdMob導入前に直すべき点

AdMob SDK導入前に確認・整理すべき点:

1. Capacitor環境判定
   - WebView内ではPWA install UIを出さない。
   - Service Worker登録をどうするか決める。

2. 下部ナビと広告領域
   - 現在のモバイル下部ナビは `bottom-[calc(env(safe-area-inset-bottom)+4.25rem)]`。
   - AdMob下部バナーを入れる場合、ナビと広告の専用領域を明確に分ける必要がある。

3. Web広告枠との分離
   - `components/ads/ad-slot.tsx` はWeb/PWA用。
   - アプリのAdMobはネイティブ側で出す。
   - Webページ内にAdMobを直接差し込まない。

4. appIdの見直し
   - `com.usjfoodguide.app` は公式誤認・商標リスクを再確認。

5. プライバシー文言
   - AdMob追加前にプライバシーポリシー、ATT、Data Safety、App Privacyを整理。

6. Magic Link検証
   - WebViewからメールアプリへ移動し、戻った時にセッションが維持されるか確認。
   - PKCE bridge は実装済みだが、iOS/Android WebViewでは追加検証が必要。

## 7. iOS起動確認前のチェックリスト

- `CAPACITOR_SERVER_URL=https://unicolle.vercel.app` で live URL 起動する方針を確認
- `appId` を提出前に変更するか判断
- `appName` は `ユニコレ` でよいか確認
- iOS project 生成前に Git作業ツリーを整理
- Service Worker / PWA install UI をアプリ内でどう扱うか確認
- `/`, `/foods`, `/foods/[id]`, `/eaten` の表示確認計画
- Magic Link ログイン確認計画
- 管理画面をiOSアプリ内で使うか確認
- 下部ナビとSafe Areaの見え方を確認
- AdMob SDKはまだ入れない
- 広告IDはまだ入れない

## 8. Android起動確認前のチェックリスト

- `CAPACITOR_SERVER_URL=https://unicolle.vercel.app` で live URL 起動する方針を確認
- Android package name を提出前に見直す
- Android project 生成前に Git作業ツリーを整理
- 戻るボタンの挙動を確認する計画
- `/`, `/foods`, `/foods/[id]`, `/eaten` の表示確認計画
- Magic Link ログイン確認計画
- 管理画面をAndroidアプリ内で使うか確認
- 下部ナビとAndroid system navigation barの重なりを確認
- Google Play Data Safety の下準備
- AdMob SDKはまだ入れない
- 広告IDはまだ入れない

## 9. 次にCodexへ投げる /goal

```text
/goal UNICOLE Phase App-3: Capacitor live URL方式でiOS Simulator起動確認を行う最小準備をしてください。

目的:
AdMob SDKや広告IDを入れる前に、既存Web/PWAをCapacitor iOSアプリとして起動し、主要公開ページとログイン導線が動くか確認する。

方針:
- 初回は live URL WebView 方式
- CAPACITOR_SERVER_URL=https://unicolle.vercel.app を使う
- AdMob SDKは入れない
- 広告IDは入れない
- Androidはまだ触らない

やること:
1. 現在のcapacitor.config.tsとpackage scriptsを再確認
2. iOS project生成前の差分/作業ツリーを確認
3. 必要ならアプリ内でPWA install UIを出さない最小修正を提案
4. cap add ios / cap sync ios の実行手順を提示
5. Xcode/iOS Simulatorで確認する項目を整理

禁止:
- AdMob SDK追加
- 広告ID追加
- Android project生成
- Supabase変更
- generated JSON変更
- crawler変更
- translations変更
- proxy.ts変更
- 認証変更

出力:
- 実行した確認
- iOS起動確認手順
- 追加修正が必要な場合の最小差分案
```

## 10. 注意点

- 今回は実装しない。
- native projectはまだ生成しない。
- AdMob SDKはまだ入れない。
- 広告IDはまだ入れない。
- service role keyをクライアント・アプリ側へ出さない。
- static export方式では管理画面やserver actionが動かない前提で判断する。
- live URL方式ではネットワーク必須であることを許容する。
- App Store / Google Play提出前に、非公式アプリであることを明確にする。
- `USJ`, `ユニバ`, 公式画像、商品名の扱いは審査リスクとして整理する。
- 広告収益化を始める前に、プライバシーポリシー、ATT、Data Safety、App Privacyを更新する。
- 管理画面には広告を出さない。
- Web広告枠とAdMob広告枠を混同しない。
- AdMobはまずアプリ下部アンカーバナー中心で検証する。

## 結論

UNICOLEのPhase App-1/2としては、Capacitor live URL WebView方式を最初の検証方針にするのが安全です。

既存のCapacitor依存・scripts・configはすでにあるため、次はAdMobではなくiOS Simulator起動確認に進むべきです。管理画面やserver actionを壊さないため、static export方式は公開閲覧専用アプリとして後で再評価します。
