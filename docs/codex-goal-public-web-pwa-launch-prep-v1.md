# Codex /goal: Web/PWA 一般公開前 最小修正

> 前提: `docs/public-web-pwa-launch-checklist-v1.md`。
> **必要最小限の修正のみ。大規模リファクタ禁止。** generated JSON / data/translations / DB / crawler は触らない。
> 進行側の判断が要る項目（noindex・広告文言）は末尾の「任意ブロック」で、採用するもののみ実行する。

以下、Codex にそのまま貼れる本文。

```
/goal UNICOLE を Web/PWA 一般公開するための最小修正を行う。アイコン空白の解消・manifest 色統一・robots/sitemap の URL fallback 修正が必須。大規模変更はしない。

## 必須対応

### A. 空白の PWA / favicon アイコンを実アイコンへ差し替え（最重要）
現状 `public/icons/app-icon-192.png`・`app-icon-1024.png`・`apple-touch-icon.png` がほぼ真っ白（空アイコン）。`app-icon-512.png` のみ実アイコン。
- 実ソース（`public/icons/app-icon.svg`＝実ベクター、または `public/icons/app-icon-unicole-512.png`／`app-icon-512.png`＝実ラスタ）から、以下を**リサイズ/ラスタライズのみ**で再生成して差し替える（新規デザインの生成・外部取得はしない）:
  - `public/icons/app-icon-192.png`（192×192）
  - `public/icons/app-icon-1024.png`（1024×1024）← 画質確保のため svg からのラスタライズを推奨
  - `public/icons/apple-touch-icon.png`（180×180）
  - 必要なら favicon 用 PNG（layout の icons が参照する 192 が実体化されれば足りる。`favicon.ico` を足す場合も同一デザインで）
- 差し替え後、各ファイルが非空（実コンテンツ）であることを目視/簡易解析で確認。
- manifest（`public/manifest.webmanifest`）と layout のアイコン参照パスは**変更しない**（中身だけ実体化）。

### B. manifest の theme_color を統一
- `public/manifest.webmanifest` の `"theme_color": "#18212f"` を **`"#071b3a"`** に変更（viewport / デザインシステムの ink と一致させる）。他キーは変更しない。

### C. robots / sitemap の URL fallback 事故防止
- `app/robots.ts` と `app/sitemap.ts` の `NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"` の **既定値を本番URL `https://new-app-chi-rosy.vercel.app`** に変更（env 未設定時に localhost URL を出力しないように）。
- ※ 本番では Vercel 環境変数 `NEXT_PUBLIC_SITE_URL` を設定するのが本筋（これは進行側の設定作業。コード側は安全網のみ）。

## やってはいけないこと（厳守）
- git add . 禁止。変更ファイルを個別に限定して add する。
- 大規模リファクタ禁止。上記 A/B/C（＋任意ブロック）以外を変更しない。
- generated JSON（scripts/output/*）・data/translations・DB・crawler を変更/実行しない。
- 本番広告コード / AdSense / 広告SDK / 外部script / iframe を追加しない。
- 商品データ（food.id/name/price/area/shop/画像URL）を変更しない。
- 下部ナビ構造・広告レイアウトの座標調整はしない（本goalの対象外）。
- package.json の依存追加はしない（画像リサイズは既存ツール/Node 標準やリポジトリ既存の依存で行い、追加が必要なら Stop して報告）。

## 検証（実施し結果を報告）
- npm run lint / typecheck / build / coverage が成功すること。
- coverage が下記から変化していないこと:
    Food: total 294 / translated 77 / missing 217 / verified 6 / needs_review 69 / orphan 0
    Store: generated_total 42 / translated 42 / missing 0 / display_total 99 / display_translated 52 /
           display_missing 47 / display_seed 14 / verified 23 / needs_review 33 / orphan 0
- 再生成した各アイコンが 192/512/1024/180 の正方PNGで非空であること（簡易解析でnear-white率が低いこと）。
- manifest theme_color が #071b3a であること。
- robots.txt / sitemap.xml がローカルビルドで localhost を含まないこと（env 設定時は当該ドメイン）。
- git status --short が想定変更ファイルのみであること。

## 完了条件
- 空白アイコンが実アイコンに差し替わり、PWA インストール/ホーム追加/favicon が自然に表示される。
- manifest theme_color 統一、robots/sitemap の fallback が本番URL。
- lint/typecheck/build/coverage 成功・Coverage 不変。
- 変更ファイルを限定報告し、レビュー（Claude）へ回す。

## Stop条件（該当したら停止して報告）
- アイコン再生成に新規パッケージ追加が必要なとき。
- 想定外ファイルに差分が出そうなとき / Coverage が変化したとき。
- 画像の元デザインが不明で、リサイズ元アセットを特定できないとき。

---

## 任意ブロック（進行側が採用を決めたものだけ実行）

### D-1. 当面 noindex（独自ドメイン公開まで・推奨）
- `app/robots.ts` を `disallow: ["/"]`（全面 noindex）に変更、または `app/layout.tsx` の metadata に `robots: { index: false, follow: false }` を追加。
- ドメイン公開時に元へ戻す前提。どちらの方式にするかは進行側指定。

### D-2. 広告プレースホルダーの可視文言を公開向けに抑制
- `components/ad-slot.tsx` の fixed variant のラベル/プレースホルダー文言（「広告」「広告スペース」）を、公開時は空 or 非表示にする（枠・pointer-events-none はそのまま）。
- 本番広告導入(Phase 3)時に文言/中身を戻す前提。
```

---

## 進行側メモ（goal を渡す前に決めること）
1. **index 方針**: 当面 noindex（D-1 採用）か、最初から index 可か。推奨は noindex→ドメイン公開時に解除。
2. **広告プレースホルダー**: 公開時に隠す（D-2 採用）か、現状のまま出すか。
3. **Vercel 環境変数** `NEXT_PUBLIC_SITE_URL` の本番設定（コードではなく設定作業）。
4. 実装完了後、Claude が `design-review-public-web-pwa-launch-prep-v1.md` でレビュー証跡を作成する（本タスクではまだ作らない）。
