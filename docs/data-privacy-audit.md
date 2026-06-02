# データ・プライバシー監査

最終更新日: 2026-06-02

このアプリは非公式のUSJフード攻略・記録アプリです。現在の設計では、食べた記録や最近見た商品は主にブラウザ内の `localStorage` に保存されます。発見報告と問い合わせのみ、管理者確認用JSONへ保存します。

| データ名 | 保存場所 | 個人情報該当有無 | 利用目的 | 削除方法 | App Store申告対象 | Google Play申告対象 |
|---|---|---|---|---|---|---|
| 食べた記録 | `localStorage: uniba-food-logs-v1` / Supabase optional | メモ内容次第 | 食べた履歴、制覇率、プロフィール表示 | ブラウザデータ削除、Supabase利用時は削除依頼 | 同期時はUser Content等 | 同期時はApp activity等 |
| 最近見た商品 | `localStorage: uniba-recent-foods-v1` | いいえ | 最近見た商品表示 | ブラウザデータ削除 | ローカルのみなら収集なし | ローカルのみなら収集なし |
| 検索履歴 | `localStorage: uniba-recent-searches-v1` | 検索内容次第 | 検索候補表示 | ブラウザデータ削除 | ローカルのみなら収集なし | ローカルのみなら収集なし |
| PWA案内状態 | `localStorage: uniba-pwa-ios-hint-dismissed` | いいえ | PWA案内制御 | ブラウザデータ削除 | 収集なし | 収集なし |
| 発見報告 | `scripts/output/product-submissions.generated.json` | 任意連絡先入力時に該当 | 投稿確認、データ修正 | `/contact` から削除依頼 | Contact Info / User Content / Customer Support | Personal info / User-provided content |
| 問い合わせ | `scripts/output/contact-submissions.generated.json` | 任意連絡先入力時に該当 | 問い合わせ対応 | `/contact` から削除依頼 | Contact Info / Customer Support | Personal info / App activity |
| 管理者アクセスキー | Cookie `admin_key` / query | いいえ | 管理画面保護 | Cookie削除 | 収集なし | 収集なし |
| エラー監視 | `NEXT_PUBLIC_SENTRY_DSN` 設定時にSentryへ送信 | 通常いいえ。入力値を含むエラーは運用で除外 | 障害調査、品質改善 | Sentry側保持期間設定、削除依頼 | Diagnostics | App info and performance |
| アクセス解析 | `NEXT_PUBLIC_ANALYTICS_ENDPOINT` 設定時に指定endpointへ送信 | 通常いいえ | ページ表示傾向、改善優先度判断 | endpoint側削除、設定解除 | Usage Data | App activity |
| ローカル解析カウント | `localStorage: uniba-local-analytics-v1` (`NEXT_PUBLIC_ENABLE_LOCAL_ANALYTICS=true`時のみ) | いいえ | 開発中の画面表示確認 | ブラウザデータ削除 | 収集なし | 収集なし |
| Cookie / sessionStorage / IndexedDB | 通常機能では未使用。Supabase認証利用時はCookieあり | 認証時は該当可能性あり | 認証状態管理 | ログアウト、Cookie削除、削除依頼 | User ID該当可能性 | Personal info該当可能性 |

JSONレポートは `npm run audit:privacy` で `scripts/output/privacy-data-audit.generated.json` に生成します。
