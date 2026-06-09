# モバイル公開準備メモ

最終更新日: 2026-06-02

## 公開方式

このリポジトリはNext.jsアプリを維持したまま、CapacitorでiOS / AndroidのWebViewアプリ化を準備します。通常の `npm run dev` / `npm run build` は壊さず、ネイティブ化は別手順に分離します。

## Capacitor構成

- 設定ファイル: `capacitor.config.ts`
- App ID案: `jp.unibafood.conquest`
- App Name: `ユニコレ`
- WebDir: `public/capacitor-web`
- 通常検証: `npm run dev`
- ネイティブ同期: `npm run cap:sync`
- iOS初期化: `npm run cap:ios`
- Android初期化: `npm run cap:android`

## ビルド方針

1. PWA / 外出先スマホ閲覧: Next.jsをホスティングして配信する。
2. Capacitor開発検証: `CAPACITOR_SERVER_URL=https://公開済みURL npm run cap:sync` でホストURLをWebView表示する。
3. `public/capacitor-web` は同期失敗を防ぐための最小フォールバック画面。実運用のiOS / Android表示は `CAPACITOR_SERVER_URL` の本番URLを使う。
4. 完全バンドル型: Next.jsの静的出力対応を別途監査してから専用WebDirへ成果物を置く。現状は通常Next.js構成を優先する。

## iOS App Store提出前

- Apple Developer Program加入
- XcodeでBundle Identifierを `jp.unibafood.conquest` に設定
- 署名、Capability、App Transport Securityを確認
- App Store Connectにアプリ情報、プライバシーポリシーURL、サポートURL、スクリーンショットを登録
- App PrivacyはApple公式のApp Privacy Detailsに従い、発見報告・問い合わせの送信情報を申告する

参考: https://developer.apple.com/app-store/app-privacy-details/

## Google Play提出前

- Play Console登録
- Package name案: `jp.unibafood.conquest`
- target SDKは公開時点のGoogle Play要件を公式ドキュメントで確認する
- Data safetyは発見報告・問い合わせ・任意連絡先を申告対象として確認する
- Privacy policy URL、support contact、スクリーンショット、説明文を登録

参考: https://developer.android.com/google/play/requirements/target-sdk

## 本番前チェック

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run cap:sync`
- `/privacy`, `/terms`, `/contact`, `/disclaimer`, `/about`, `/security`, `/commercial-disclosure` が公開URLで表示できること
- `/admin` と `/admin/prices` は外部本番では `ADMIN_ACCESS_KEY` がない場合に閉じること
- PWA service workerがCloudflare Tunnelやlocalhostで誤ってオフライン画面を出さないこと
- `NEXT_PUBLIC_SITE_URL` を本番独自ドメインに設定し、OGP、canonical相当のmetadataBase、ストア提出URLを同一ドメインへ揃えること
- `NEXT_PUBLIC_SENTRY_DSN` と `NEXT_PUBLIC_ANALYTICS_ENDPOINT` は審査前に利用有無を決め、使う場合はプライバシーポリシーとストア申告へ反映すること
