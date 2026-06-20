# Codex Goal: 7月フード候補の限定crawl差分確認 v1

## 目的

`docs/july-food-crawl-preparation-v1.md` に従い、USJ 7月以降フード候補のうち、Matsuri系候補だけを対象に限定crawlを実行し、generated JSON差分を確認する。

今回の主目的は以下。

1. `夏祭りの金魚 レモンサイダー ネオンカップ付き` が公式sourceUrlから取得できるか確認する
2. `food-j4nvrm` 超!! チョコバナナ・チュリトスの店舗/エリア/期間/画像/価格が補正されるか確認する
3. generated JSON差分が想定範囲に収まるか確認する
4. ONE PIECE 2026系は今回扱わない

## 変更してよい候補

限定crawl結果が想定範囲に収まる場合のみ、以下が変更される可能性がある。

- `scripts/output/foods.generated.json`
- `scripts/output/shops.generated.json`
- `scripts/output/areas.generated.json`
- `scripts/output/latest-crawl-report.json`
- `scripts/output/seasonal.crawl-report.json`

ただし、想定外差分が出た場合はrestoreして停止する。

## 禁止

- `git add .` 禁止
- DB実行禁止
- Supabase手動操作禁止
- `npm run crawl` 禁止
- `npm run crawl:quality` 禁止
- `npm run crawl:images` 禁止
- `npm run crawl:image-candidates` 禁止
- `npm run crawl:food-images` 禁止
- `npm run crawl:restaurants` 禁止
- `npm run crawl:events` 禁止
- `npm run crawl:news` 禁止
- `npm run crawl:pdfs` 禁止
- ONE PIECE 2026 seed追加禁止
- `data/translations` 変更禁止
- `app` / `components` 変更禁止
- `public` 変更禁止
- food.id / store.id / URL構造変更禁止
- 公式以外の情報を確定データとして使うこと禁止
- generated JSONの手編集禁止

## 作業前確認

```bash
git status --short
git status --short --branch
git log -3 --oneline
```

作業ツリーがcleanでない場合は停止して報告する。

## Step 1: 事前確認

以下を確認する。

```bash
sed -n '1,260p' docs/july-food-crawl-preparation-v1.md
rg -n "summer-2026|matsuri|0422|seasonal-food|food-cart|eventSeeds|sourceName: \"official-seasonal-food\"" scripts/crawlers/crawl-targeted-pages.ts scripts/crawl-category.ts package.json
rg -n "夏祭りの金魚|チョコバナナ|food-j4nvrm" scripts/output/foods.generated.json
```

確認ポイント:

- Matsuri公式sourceUrlが既存seedにあること
- `food-j4nvrm` が存在すること
- `夏祭りの金魚 レモンサイダー ネオンカップ付き` がまだ存在しないこと

## Step 2: バックアップ

generated JSON更新前に、git管理外へバックアップする。

```bash
mkdir -p /private/tmp/unicole-july-food-crawl-backup-v1
cp scripts/output/foods.generated.json /private/tmp/unicole-july-food-crawl-backup-v1/foods.generated.before.json
cp scripts/output/shops.generated.json /private/tmp/unicole-july-food-crawl-backup-v1/shops.generated.before.json
cp scripts/output/areas.generated.json /private/tmp/unicole-july-food-crawl-backup-v1/areas.generated.before.json
cp scripts/output/latest-crawl-report.json /private/tmp/unicole-july-food-crawl-backup-v1/latest-crawl-report.before.json
```

`seasonal.crawl-report.json` と `latest-foods.json` が存在する場合は、同じディレクトリへバックアップしてよい。

## Step 3: 限定crawl実行

今回実行してよいcrawlは以下1回のみ。

```bash
npm run crawl:seasonal
```

これ以外のcrawlを実行しない。

## Step 4: 差分確認

```bash
git status --short
git diff -- scripts/output/foods.generated.json
git diff -- scripts/output/shops.generated.json
git diff -- scripts/output/areas.generated.json
git diff -- scripts/output/latest-crawl-report.json
git diff -- scripts/output/seasonal.crawl-report.json
```

追加で、対象候補を確認する。

```bash
rg -n "夏祭りの金魚|チョコバナナ|food-j4nvrm|レモンサイダー|ネオンカップ" scripts/output/foods.generated.json scripts/output/latest-crawl-report.json scripts/output/seasonal.crawl-report.json
```

確認ポイント:

- 新規追加が `夏祭りの金魚 レモンサイダー ネオンカップ付き` だけ、または少数の公式Matsuri候補に収まっていること
- `food-j4nvrm` の差分が想定範囲に収まっていること
- food.id / URL構造が変わっていないこと
- price / area / shop / image / saleStatus の変更が公式sourceUrl由来で説明できること
- 2026年6月20日時点で6月29日販売開始商品がactiveになっていないこと

## Step 5: 検証

差分が想定範囲の場合のみ実行する。

```bash
npm run coverage
npm run audit:duplicates
npm run lint
npm run typecheck
npm run build
```

coverage期待値は、フード追加が発生した場合に変化する可能性がある。変化した場合は、以下を報告する。

- Food total
- Food translated
- Food missing
- Food orphan
- Store coverage

翻訳seedがない新規foodが出た場合、Food missingが増える可能性がある。これはStop条件ではなく、次フェーズでfood-names seed追加対象として報告する。

## Step 6: 想定外差分の戻し方

想定外差分が出た場合は、commitせずに以下で戻す。

```bash
git restore scripts/output/foods.generated.json
git restore scripts/output/shops.generated.json
git restore scripts/output/areas.generated.json
git restore scripts/output/latest-crawl-report.json
git restore scripts/output/seasonal.crawl-report.json
git restore scripts/output/latest-foods.json
```

未追跡ファイルが出た場合は、内容を確認してから報告する。

## Step 7: stage / commit / push

差分が想定範囲で、検証が通った場合のみ、変更された対象ファイルだけを個別にstageする。

例:

```bash
git add scripts/output/foods.generated.json
git add scripts/output/shops.generated.json
git add scripts/output/areas.generated.json
git add scripts/output/latest-crawl-report.json
git add scripts/output/seasonal.crawl-report.json
```

`git add .` は使わない。

確認:

```bash
git diff --cached --name-only
git diff --cached --stat
```

commit message:

```bash
git commit -m "chore: update July seasonal food crawl data"
```

push:

```bash
git push
```

## Stop条件

以下に該当した場合は停止して報告する。

- 作業開始時点でgit statusがcleanでない
- Matsuri公式sourceUrlが既存seedに確認できない
- `food-j4nvrm` が見つからない
- `夏祭りの金魚 レモンサイダー ネオンカップ付き` を公式sourceUrlで説明できない
- `npm run crawl:seasonal` 以外のcrawlが必要に見える
- DB / Supabase実行が必要に見える
- generated JSON差分が大きすぎる
- `food-j4nvrm` 以外の既存foodに大量差分が出る
- food.id / store.id / URL構造が変わる
- 画像候補が不明
- 店舗/価格/期間が不明なまま確定データ化される
- ONE PIECE 2026系の追加が混ざる
- `data/translations` の変更が必要になる
- `app` / `components` / `public` の変更が必要になる
- lint / typecheck / build が失敗する
- `git add .` を使いそうになる

## 完了報告に含めること

- 実行したcrawl command
- 変更ファイル一覧
- `夏祭りの金魚 レモンサイダー ネオンカップ付き` が追加されたか
- `food-j4nvrm` がどう変わったか
- food.id / URL構造を維持した確認
- generated JSON差分が想定範囲だった確認
- coverage結果
- audit:duplicates結果
- lint / typecheck / build結果
- `data/translations` を変更していない確認
- DB / crawler全実行をしていない確認
- app / components / public を変更していない確認
- commit hash
- push成功確認
- git status clean
- main / origin/main 同期済み
