# Google Play入力案

最終更新日: 2026-06-02

## 基本情報

- Android app name: ユニバフードコレクション
- Package name案: `jp.unibafood.conquest`
- Short description: USJフードを写真で探して食べた記録を残す非公式図鑑
- Privacy policy URL: `https://example.com/privacy` TODO 独自ドメイン公開URLへ差し替え
- Support contact: `https://example.com/contact` TODO 独自ドメイン公開URLへ差し替え
- Target SDK確認メモ: 公開・更新時点のGoogle Play target API level要件を公式ドキュメントで確認する

参考: https://developer.android.com/google/play/requirements/target-sdk

## Full description

ユニバフードコレクション（ユニコレ）は、ユニバ（USJ）フードを集めて楽しむための非公式コレクションアプリです。

画像、価格、エリア、販売場所を見ながら、販売中の商品検索、食べた記録、店舗・エリア別のコレクション管理まで使えます。

本アプリはユニバーサル・スタジオ・ジャパン公式アプリではありません。掲載情報は変更される場合があるため、来園前と現地では公式情報を確認してください。

## Data safety申告メモ

- 任意連絡先: 問い合わせ・発見報告でユーザーが入力した場合のみ
- User-provided content: 発見報告、問い合わせ、メモ
- App activity: 食べた記録、レビュー、星評価、総消費金額用の支払金額、検索履歴は端末内localStorageのみ。ログインやクラウド同期は行わないため、通常利用では収集なし
- Search history: 検索履歴はlocalStorageのみ。サーバー送信する運用に変更した場合はData safetyを更新する
- Location / Contacts / Camera / Microphone / Payment: 現時点では取得なし
- 広告SDK: 未導入。導入時はData safetyとPrivacy policyを更新
- Diagnostics / App info and performance: `NEXT_PUBLIC_SENTRY_DSN` を設定してSentry監視を有効にする場合
- App activity / Usage analytics: `NEXT_PUBLIC_ANALYTICS_ENDPOINT` を設定して外部解析送信を有効にする場合

## 審査メモ

- 非公式アプリであることをアプリ内で明記
- 管理画面は本番外部アクセス時に保護
- 投稿内容は管理者確認後のみ反映
- 外部リンクは公式サイトや公開情報への遷移

## adaptive icon素材

- Foreground候補: `public/icons/app-icon-1024.png`
- Background候補: `#18212f`
- 512 PNG: `public/icons/app-icon-512.png`
- 192 PNG: `public/icons/app-icon-192.png`
