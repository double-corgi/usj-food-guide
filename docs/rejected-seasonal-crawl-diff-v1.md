# Rejected Seasonal Crawl Diff v1

## 1. 実行したコマンド

```bash
npm run crawl:seasonal
```

## 2. 結果

`npm run crawl:seasonal` 自体は成功した。

ただし、generated JSON の差分が大きすぎたため採用しなかった。

- 変更ファイル数: 5 files changed
- `scripts/output/foods.generated.json`: 約 46400 lines diff
- 新規追加候補: 35
- 削除推定: 133
- 更新推定: 161
- total: 294 -> 196
- active: 258 -> 194
- `public_active_total` も大幅減少方向

## 3. 目的候補の結果

- 夏祭りの金魚 レモンサイダー ネオンカップ付き: 取得確認できず
- 超！！チョコバナナ・チュリトス: 更新候補確認まで到達せず
- ONE PIECE 2026系候補: 出力なし

## 4. 採用しない理由

- Matsuri候補だけの限定差分ではなかった
- `foods.generated.json` が全体再構成に近い差分だった
- 既存商品が大量に消えるリスクがある
- 目的候補が取得できていない
- 今回の目的とズレる候補が出ている
- Stop条件「差分が大きすぎる」に該当した

## 5. 復元結果

以下5ファイルを restore した。

- `scripts/output/areas.generated.json`
- `scripts/output/foods.generated.json`
- `scripts/output/latest-crawl-report.json`
- `scripts/output/seasonal.crawl-report.json`
- `scripts/output/shops.generated.json`

## 6. 復元後確認

- `git status`: clean
- `public_active_total`: 180

Food Coverage:

- total: 294
- translated: 77
- missing: 217
- verified: 6
- needs_review: 69
- orphan: 0

Store Coverage:

- generated_total: 42
- translated: 42
- missing: 0
- display_total: 99
- display_translated: 52
- display_missing: 47
- display_seed: 14
- verified: 23
- needs_review: 33
- orphan: 0

## 7. 今後の方針

- `crawl:seasonal` の広範囲差分はそのまま採用しない
- 次は対象URL単位・sourceUrl単位で調査する
- まず公式Matsuriページ、ONE PIECEページ、該当candidateのHTML/JSON-LD/画像候補を個別確認する
- generated JSON更新はその後に行う
- 追加するとしても1〜数件単位で差分を限定する

## 8. 注意事項

- このドキュメント作成時点では generated JSON を変更していない
- `scripts/output` は変更していない
- crawlerは再実行していない
- `data/translations` は変更していない
- DBは実行していない
- `app` / `components` / `public` は変更していない
