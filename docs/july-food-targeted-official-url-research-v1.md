# July Food Targeted Official URL Research v1

## 1. 調査概要

7月以降のUSJフード追加に向けて、広範囲crawlerではなく公式URL単位で追加候補を確認した。

- `crawl:seasonal` は差分が大きすぎるため採用しない。
- 今回は公式URL単位で確認した。
- crawlerは実行していない。
- generated JSONは変更していない。
- `data/translations` は変更していない。
- DBは触っていない。
- `app` / `components` / `public` は変更していない。

参照した公式URL:

- https://www.usj.co.jp/company/news/2026/0422/
- https://www.usj.co.jp/company/news/2026/0424/

## 2. 新規追加候補

### 夏祭りの金魚 レモンサイダー ネオンカップ付き

- name: 夏祭りの金魚 レモンサイダー ネオンカップ付き
- price: 未確定
- area/shop: 未確定または確認中
- period: 2026-07-01〜2026-08-26
- sale start: 2026-06-29
- sourceUrl: https://www.usj.co.jp/company/news/2026/0422/
- image候補: 公式ページ上に掲載あり。ただし今回の調査では画像取得していない。
- existing food.id: なし
- 判定: A. 新規追加候補
- confidence: 中

注意:

- 単品価格が未確認。
- foodとして扱うべきか、ネオンカップ付き商品の扱いを要確認。
- 販売開始前なので、追加する場合は active ではなく upcoming 扱いが妥当。

## 3. 既存更新候補

### 超！！チョコバナナ・チュリトス

- existing food.id: `food-j4nvrm`
- price: unknown
- sale start: 2026-06-29
- period: 2026-07-01〜2026-08-26
- sourceUrl: https://www.usj.co.jp/company/news/2026/0422/
- 判定: B. 既存データ更新候補
- confidence: 中

注意:

- 販売場所は公式確認済み。
- 単品価格が未確認。
- 現在の generated JSON では `food-j4nvrm` が該当。
- 新規追加ではなく、既存データ補正候補。

## 4. Watch候補

### ごく甘ぶどうメロリンラブ・スウィーツ

- source: ONE PIECE 2026公式ニュース
- sourceUrl: https://www.usj.co.jp/company/news/2026/0424/
- area/shop: サンジの海賊レストラン関連の可能性
- period: 2026-07-01〜2026-10-05
- 判定: C. watch候補
- confidence: 中

注意:

- 通常販売フードではなく、購入者向け/事前販売スイーツの可能性。
- 価格・販売場所・画像詳細が不足。
- 公式詳細公開後に再確認する。

## 5. 追加しない候補

- ネオンカップ単体
  - food単体ではなく、容器/グッズ扱いの可能性が高い。
- スーパー・ハチャメチャ・ミニオン・セット
  - チュリトス、レモンサイダー、バスタオルを含むセットであり、単体foodとして扱うには注意が必要。
- キャラメルポップコーン！？チュリトス / ターキーレッグ！？まん
  - 既存データまたは既存docsで扱いあり。
  - 今回の公式URL単位調査では追加対象外。

## 6. 公式確認できなかったもの

- 夏祭りの金魚 レモンサイダー ネオンカップ付きの単品価格。
- 超！！チョコバナナ・チュリトスの単品価格。
- ONE PIECE 2026系スイーツの通常販売店舗・画像。
- ONE PIECE 2026系で通常の `/foods` 商品として追加すべき独立フード。

## 7. 次の実装方針

- 広範囲 `crawl:seasonal` は使わない。
- 公式URL単位で HTML / JSON-LD / Tridion data / og:image を読む。
- まず確認すべきもの:
  1. ミニオン夏イベント公式ページの画像URL。
  2. チュリトス / レモンサイダーの単品価格。
  3. レモンサイダーがfoodとして表現できるか。
- 新規追加するなら:
  - 夏祭りの金魚 レモンサイダー ネオンカップ付き を upcoming として1件追加候補。
- 既存更新するなら:
  - `food-j4nvrm` の area / shop / period / image 補正候補。
- ONE PIECE系はまだ watch 継続。

## 8. 次のタスク

1. 公式URL単位の画像/価格/販売場所抽出。
2. 夏祭りの金魚 レモンサイダーの追加可否判断。
3. `food-j4nvrm` の既存更新可否判断。
4. 必要なら1件ずつ generated JSON に限定反映。
5. coverage / audit:duplicates確認。
6. food-names翻訳seed追加。
7. Vercel反映。
