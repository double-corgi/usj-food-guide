# 監視・解析運用メモ

最終更新日: 2026-06-02

## 方針

外部SDKを増やさず、環境変数が設定された場合だけ監視・解析を有効にする。未設定時は完全にno-opで、通常画面、PWA、Capacitor、localhost開発を壊さない。

## Sentry

- 実装: `lib/observability.ts`
- Error Boundary: `app/error.tsx`, `app/global-error.tsx`
- 有効化: `NEXT_PUBLIC_SENTRY_DSN` を設定
- 未設定時: 外部送信なし

送信する情報:

- エラー名
- エラーメッセージ
- スタックトレース
- 発生ルート
- 発生時刻

送信しない方針:

- 問い合わせ本文
- 発見報告本文
- 任意連絡先
- 食べたメモ

## Analytics

- 実装: `components/analytics-tracker.tsx`
- 有効化: `NEXT_PUBLIC_ANALYTICS_ENDPOINT` を設定
- ローカル検証のみ: `NEXT_PUBLIC_ENABLE_LOCAL_ANALYTICS=true`
- 未設定時: 外部送信なし

送信候補:

- `page_view`
- `app_error`
- path
- search
- title
- occurredAt

## ストア申告

Sentryや外部Analyticsを有効化する場合は、Apple App Privacy / Google Play Data safetyでDiagnosticsやUsage Dataに該当する可能性を再確認する。未設定運用の場合は外部解析SDKなしとして申告できるかを公開前に最終確認する。
