# App Store / Google Play 審査対策メモ

最終更新日: 2026-06-02

## 提出前に揃っているもの

- Privacy Policy: `/privacy`
- Terms of Service: `/terms`
- Contact: `/contact`
- Disclaimer: `/disclaimer`
- About: `/about`
- Security: `/security`
- Commercial Disclosure: `/commercial-disclosure`
- 管理画面保護: `proxy.ts` の `ADMIN_ACCESS_KEY`
- PWA manifest: `/manifest.webmanifest`
- Capacitor設定: `capacitor.config.ts`
- Sentry互換の軽量エラー送信: `NEXT_PUBLIC_SENTRY_DSN` 設定時
- Analytics endpoint送信: `NEXT_PUBLIC_ANALYTICS_ENDPOINT` 設定時

## 審査メモに明記すること

本アプリはユニバーサル・スタジオ・ジャパン公式アプリではありません。公開情報をもとにした非公式ファン向けのUSJフード攻略・記録アプリです。価格、販売場所、販売期間、在庫、メニュー内容は変わる可能性があるため、公式サイト、公式アプリ、現地表示の確認を推奨します。

## App Store提出可能判定の残条件

- 独自ドメインを確定し、`NEXT_PUBLIC_SITE_URL` を本番URLへ設定する。
- サポートURL、プライバシーポリシーURL、マーケティングURLを本番URLに差し替える。
- Apple Developer ProgramでBundle ID、署名、年齢区分、App Privacyを入力する。
- 実際にSentry/Analyticsを有効化する場合は、プライバシーポリシーとApp Privacy申告を最終更新する。

## Google Play提出可能判定の残条件

- Google Play ConsoleでPackage name、target SDK、Data safety、サポート連絡先を入力する。
- Privacy policy URLを本番URLにする。
- Sentry/Analyticsを有効化する場合はData safetyへDiagnostics / Usage Dataを反映する。

## 運営開始可能判定の残条件

- `ADMIN_ACCESS_KEY` を本番環境へ設定する。
- `/admin` と `/admin/prices` が外部から保護されることを確認する。
- 問い合わせと発見報告の確認フローを管理者が実運用で確認する。
- データ削除依頼を受けた場合の対応手順を運営者が決める。
