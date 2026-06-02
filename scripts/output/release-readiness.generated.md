# 公開前リリース判定

生成日時: 2026-06-02T07:13:02.102Z

## 判定

- App Store: コード側は提出準備完了。App Store Connectの人間入力後に提出可能。
- Google Play: コード側は提出準備完了。Google Play Consoleの人間入力後に提出可能。
- 運営開始: 運営基盤のコードは開始可能。本番環境変数と管理フロー確認後に運営開始可能。

## データ維持

- food: 200
- image: 200
- placeholder: 0
- price known: 192
- price unknown: 8

## 人間が本番前に入力・確認する項目

- 独自ドメインを確定しNEXT_PUBLIC_SITE_URLへ設定する
- 本番環境にADMIN_ACCESS_KEYを設定する
- App Store Connect / Google Play Consoleへ事業者・サポートURL・審査情報を入力する
- Sentry / Analyticsを有効化する場合はDSN/endpointとストア申告を最終反映する

## 監査結果

- checks: 41
- failed: 0

失敗チェックなし
