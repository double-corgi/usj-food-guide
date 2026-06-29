# iOS AdMob / Vercel Build Regression Checks

## 背景

`vercel deploy --prebuilt` は、その時点の `.vercel/output` を本番へ送ります。最新commit後に `npx vercel build --prod` を実行していない場合、古い `.vercel/output` を再利用してしまい、`components/mobile-admob-banner.tsx` を含まない古い成果物が配信される可能性があります。

`npm run build` は `.next` を作りますが、prebuilt deploy が使う成果物は `.vercel/output` です。Production反映前は、最新HEADで `npx vercel build --prod` を実行し、その成果物を検査してから deploy します。

## 推奨手順

1. `git status --short` で未意図の差分がないことを確認する。
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run verify:ios-admob-build`
6. `rm -rf .vercel/output`
7. `npx vercel build --prod`
8. `npm run verify:ios-admob-build`
9. `npx vercel deploy --prebuilt --prod --archive=tgz`
10. iOS Debugアプリで `com.doublecorgi.unicolle` を起動し、AdMob Test modeバナーを確認する。

## 注意

- `.next` 全体を毎回削除する必要はありません。
- prebuilt deploy前に削除するなら `.vercel/output` のみに限定します。
- DebugではGoogle公式テスト広告IDを使います。
- Release用の本番広告ID切り替え構成は維持します。
- Web/PWAと `/admin` ではネイティブAdMobを表示しません。
