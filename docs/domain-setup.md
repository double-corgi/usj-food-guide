# 独自ドメイン公開メモ

最終更新日: 2026-06-02

## 目的

App Store / Google Play / PWA / 外出先スマホ閲覧で同じ公開URLを使えるようにする。`NEXT_PUBLIC_SITE_URL` を正式な独自ドメインへ設定し、法務ページ、サポートURL、プライバシーポリシーURLを統一する。

## 必須設定

- `NEXT_PUBLIC_SITE_URL=https://your-domain.example`
- `ADMIN_ACCESS_KEY=十分に長いランダム文字列`
- 任意: `NEXT_PUBLIC_SENTRY_DSN`
- 任意: `NEXT_PUBLIC_ANALYTICS_ENDPOINT`
- 任意: `NEXT_PUBLIC_ENABLE_LOCAL_ANALYTICS=false`

## DNS / ホスティング

1. ホスティング先に独自ドメインを追加する。
2. DNSでCNAMEまたはA/AAAAを設定する。
3. HTTPS証明書が発行済みであることを確認する。
4. `https://your-domain.example/privacy` と `https://your-domain.example/contact` が外部から200 OKになることを確認する。
5. `/admin` と `/admin/prices` は外部本番で `ADMIN_ACCESS_KEY` なしの場合に `/admin-locked` へ保護されることを確認する。

## ストア提出URL

- サポートURL: `https://your-domain.example/contact`
- プライバシーポリシーURL: `https://your-domain.example/privacy`
- マーケティングURL: `https://your-domain.example/about`
- 免責事項URL: `https://your-domain.example/disclaimer`

## 公開前確認

- `curl -I https://your-domain.example`
- `curl -I https://your-domain.example/privacy`
- `curl -I https://your-domain.example/terms`
- `curl -I https://your-domain.example/contact`
- `curl -I https://your-domain.example/admin`
- `curl -I https://your-domain.example/admin/prices`

`/admin` と `/admin/prices` は、管理キーなしでは管理情報を直接返さないこと。
