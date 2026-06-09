# データ・プライバシー監査

最終更新日: 2026-06-06

このアプリは非公式のUSJフード攻略・記録アプリです。通常利用では個人情報を収集しません。ログイン不要で利用でき、Googleログイン、Appleログイン、メール登録、Supabase認証は使いません。

食べた記録、レビュー、星評価、総消費金額用の支払金額、最近見た商品、検索履歴は端末内の `localStorage` に保存します。別端末へ移す場合は、設定画面または食べたページのバックアップJSON出力・復元機能を使います。広告や外部アクセス解析を導入する場合は、プライバシーポリシーとストア申告を更新します。

| データ名 | 保存場所 | 個人情報該当有無 | 利用目的 | 削除方法 | App Store申告対象 | Google Play申告対象 |
|---|---|---|---|---|---|---|
| 食べた記録 | `localStorage: uniba-food-logs-v1` | メモ、写真URL、支払金額の入力内容次第。ただし運営者へ自動送信しない | 食べた履歴、現在販売中コンプ率、図鑑コンプ率、総消費金額 | 設定画面または食べたページの全データ削除、バックアップ復元、ブラウザデータ削除 | 端末内のみなら収集なし | 端末内のみなら収集なし |
| レビュー・星評価 | `localStorage: uniba-food-reviews-v1` | コメント内容次第。ただし運営者へ自動送信しない | 商品レビュー、平均評価、本人レビュー管理 | 設定画面または食べたページの全データ削除、ブラウザデータ削除 | 端末内のみなら収集なし | 端末内のみなら収集なし |
| レビュー連投制限 | `localStorage: uniba-food-review-last-submit-v1` | いいえ | 同一端末の短時間連投防止 | 設定画面またはブラウザデータ削除 | 収集なし | 収集なし |
| 最近見た商品 | `localStorage: uniba-recent-foods-v1` | いいえ | 最近見た商品表示 | 設定画面またはブラウザデータ削除 | 収集なし | 収集なし |
| 検索履歴 | `localStorage: uniba-recent-searches-v1` | 検索内容次第。ただし端末内のみ | 検索候補表示 | 設定画面またはブラウザデータ削除 | 収集なし | 収集なし |
| PWA案内状態 | `localStorage: uniba-pwa-ios-hint-dismissed` | いいえ | PWA案内制御 | ブラウザデータ削除 | 収集なし | 収集なし |
| 発見報告 | Googleフォーム（`NEXT_PUBLIC_REQUEST_FORM_URL`） | 任意連絡先入力時に該当 | 投稿確認、データ修正 | `/contact` から削除依頼。管理者がGoogleフォーム回答を確認して対応 | Contact Info / User Content / Customer Support | Personal info / User-provided content |
| 問い合わせ | `scripts/output/contact-submissions.generated.json` | 任意連絡先入力時に該当 | 問い合わせ対応 | `/contact` から削除依頼 | Contact Info / Customer Support | Personal info / App activity |
| 管理者アクセスキー | Cookie `admin_key` / query | いいえ | 管理画面保護 | Cookie削除 | 収集なし | 収集なし |
| エラー監視 | `NEXT_PUBLIC_SENTRY_DSN` 設定時にSentryへ送信 | 通常いいえ。入力値を含むエラーは運用で除外 | 障害調査、品質改善 | Sentry側保持期間設定、削除依頼 | Diagnostics | App info and performance |
| アクセス解析 | `NEXT_PUBLIC_ANALYTICS_ENDPOINT` 設定時に指定endpointへ送信 | 通常いいえ | ページ表示傾向、改善優先度判断 | endpoint側削除、設定解除 | Usage Data | App activity |
| ローカル解析カウント | `localStorage: uniba-local-analytics-v1` (`NEXT_PUBLIC_ENABLE_LOCAL_ANALYTICS=true`時のみ) | いいえ | 開発中の画面表示確認 | ブラウザデータ削除 | 収集なし | 収集なし |
| Cookie / sessionStorage / IndexedDB | 標準機能では未使用。ログインCookieや認証用sessionStorageは使用しない | いいえ | 通常機能では使用しない | ブラウザデータ削除 | 収集なし | 収集なし |

JSONレポートは `npm run audit:privacy` で `scripts/output/privacy-data-audit.generated.json` に生成します。
