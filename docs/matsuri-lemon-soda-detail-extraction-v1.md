# Matsuri Lemon Soda Detail Extraction v1

## 1. 調査概要

「夏祭りの金魚 レモンサイダー ネオンカップ付き」をUNICOLEに追加できるか、公式USJページ単位で確認した。

- 公式USJページ単位で確認した。
- crawlerは実行していない。
- generated JSONは変更していない。
- `scripts/output` は変更していない。
- `data/translations` は変更していない。
- DBは触っていない。
- `app` / `components` / `public` は変更していない。

## 2. 商品候補

### 夏祭りの金魚 レモンサイダー ネオンカップ付き

- name: 夏祭りの金魚 レモンサイダー ネオンカップ付き
- price: 未確認
- area: ニューヨーク・エリア候補
- shop: ユニバーサル・マーケット内ハピネス・ワゴン候補
- sales start: 2026-06-29
- period: 2026-07-01〜2026-08-26
- status recommendation: upcoming
- category recommendation: drink / limited / seasonal
- food扱い可否: YES。ただし価格・販売場所・単体画像の確認が必要。

## 3. 公式sourceUrl

- sourceUrl: https://www.usj.co.jp/web/ja/jp/events/summer-2026/universal-summer/matsuri-nights
- source type: USJ公式イベントページ
- official confirmation status: 商品名・説明・販売場所・イベント期間は公式確認済み。単品価格は未確認。

公式ページ上で確認できたこと:

- 「夏祭りの金魚 レモンサイダー ネオンカップ付き」がドリンク商品として掲載されている。
- ネオンカップ単体ではなく、レモンサイダーを含む商品として扱える根拠がある。
- 販売場所候補はユニバーサル・マーケット内ハピネス・ワゴン。
- 販売開始候補は2026-06-29。
- 期間は2026-07-01〜2026-08-26。

公式ページ上で確認できなかったこと:

- 単品価格。
- 既存店舗IDに直接対応する販売場所。
- 商品単体として使いやすい画像。

## 4. 画像候補

公式ページ内画像候補:

- `https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-summer-2026-matsuri-nights-food-and-game-cf5-v2-sp-siro-c.png`
- `https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-summer-2026-matsuri-nights-neon-cup-and-bottle-strap-expanded-offer-detail-c.jpg`

og:image / event image / Tridion data 等の候補:

- 公式イベントページ内のイベント画像候補として確認。
- ただし、現時点では商品単体の採用画像としては未確定。

画像 suitability:

- イベント全体画像であり、商品単体画像としては弱い。
- ネオンカップ/ボトルストラップの比重が強く、レモンサイダー単体の商品画像としては要確認。
- needs download later: YES
- 採用前に目視確認が必要。

## 5. 既存データ比較

- existing same name: なし
- existing similar name: なし
- existing shop:
  - ハピネス・カフェは存在。
  - ユニバーサル・マーケット内ハピネス・ワゴンの店舗IDは未確認。
- duplicate risk: 低
- translation seed needed: YES。追加するなら food-names 翻訳seedが必要。

## 6. Add readiness

- can add now: NO

reason:

- 単品価格が公式ページ上で確認できない。
- 販売場所/shop ID が未確定。
- 商品単体に使える画像が未確認。

missing required fields:

- price
- shop / sales location
- usable product image

confidence: 中

period / sales start は公式確認済みだが、追加に必要な価格と画像が不足している。

## 7. Recommended next step

- add as new upcoming food: まだ不可
- hold until price/shop confirmed: YES
- collect image first: YES
- update source seed first: YES
- do nothing: NO。候補としては有効。

## 8. 次のタスク

1. 公式ページから画像候補2件を確認し、商品単体画像として使えるか見る。
2. 販売場所が「ユニバーサル・マーケット内ハピネス・ワゴン」でよいか既存店舗データと照合する。
3. 単品価格が公式で確認できるか再調査する。
4. 価格・店舗・画像が揃った場合のみ upcoming food として1件追加する。
5. 追加時は food-names 翻訳seedも必要。
