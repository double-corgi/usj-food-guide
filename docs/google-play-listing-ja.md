# Google Play入力案

最終更新日: 2026-06-02

## 基本情報

- Android app name: ユニバフード制覇
- Package name案: `jp.unibafood.conquest`
- Short description: USJで今日食べるフードを探して記録する非公式攻略アプリ
- Privacy policy URL: `https://example.com/privacy` TODO 独自ドメイン公開URLへ差し替え
- Support contact: `https://example.com/contact` TODO 独自ドメイン公開URLへ差し替え
- Target SDK確認メモ: 公開・更新時点のGoogle Play target API level要件を公式ドキュメントで確認する

参考: https://developer.android.com/google/play/requirements/target-sdk

## Full description

ユニバフード制覇は、USJで食べたいフードを探し、食べた記録を残し、制覇率を上げていく非公式フード攻略アプリです。

画像、価格、エリア、販売場所、攻略スコアを見ながら、来園前の計画、現地でのフード選び、帰宅後の記録まで使えます。

本アプリはユニバーサル・スタジオ・ジャパン公式アプリではありません。掲載情報は変更される場合があるため、来園前と現地では公式情報を確認してください。

## Data safety申告メモ

- 任意連絡先: 問い合わせ・発見報告でユーザーが入力した場合のみ
- User-provided content: 発見報告、問い合わせ、メモ
- App activity: 食べた記録や検索履歴をサーバー同期する場合。現状は主にlocalStorage
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
