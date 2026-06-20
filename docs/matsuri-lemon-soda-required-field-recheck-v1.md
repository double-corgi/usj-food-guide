# Matsuri Lemon Soda Required Field Recheck v1

## 1. 調査概要

「夏祭りの金魚 レモンサイダー ネオンカップ付き」の追加可否判断に必要な、価格・販売場所・商品単体画像を公式USJページ単位で再確認した。

- 公式USJページ単位で再確認した。
- crawlerは実行していない。
- generated JSONは変更していない。
- `scripts/output` は変更していない。
- `data/translations` は変更していない。
- DBは触っていない。
- `app` / `components` / `public` は変更していない。
- 画像ダウンロードはしていない。

## 2. 対象商品

- name: 夏祭りの金魚 レモンサイダー ネオンカップ付き
- status: watch継続
- can add now: NO

## 3. Price

- confirmed: NO
- price: 未確認

note:

- 公式ページ上で単品価格を確認できない。
- ネオンカップ付き商品としての価格か、ドリンク単体価格か未確定。
- Stop条件「価格が確認できない」に該当するため、現時点で追加は保留。

## 4. Shop / Area

- confirmed: PARTIAL
- official shop text: ユニバーサル・マーケット内ハピネス・ワゴン
- existing shop match: 完全一致なし
- existing shop id: なし
- area: ニューヨーク・エリア候補

note:

- 既存 `shops.generated.json` には「ハピネス・カフェ」は存在する。
- 「ユニバーサル・マーケット内ハピネス・ワゴン」の店舗IDは未登録。
- ハピネス・カフェに紐付けるのは不適切。
- 新規店舗扱い、または food側の販売場所文字列として扱う設計判断が必要。

## 5. Image

- confirmed: PARTIAL
- candidate image URLs:
  - `https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-summer-2026-matsuri-nights-food-and-game-cf5-v2-sp-siro-c.png`
  - `https://www.usj.co.jp/contentdata/usj/ja/jp/files/images/gds-images/usj-gds-summer-2026-matsuri-nights-neon-cup-and-bottle-strap-expanded-offer-detail-c.jpg`
- image type:
  - 公式USJ画像
  - イベント全体画像 / フード＆ゲーム系画像
  - ネオンカップ/ボトルストラップ寄り画像
- suitability: 中〜低

note:

- 商品単体のレモンサイダー画像として十分かは未確定。
- 画像ダウンロードはしていない。
- 採用前に目視比較が必要。

## 6. Existing Data Match

- same name: なし
- similar food: なし
- shop exists: 完全一致なし
- duplicate risk: 低
- translation seed needed: YES

## 7. Add Decision

- can add now: NO

missing fields:

- 単品価格
- 確定shop ID、または販売場所の扱い方
- 商品単体として使える画像

next action:

- 公式情報待ちとしてwatch継続。
- 価格が確認できるまでgenerated JSON追加はしない。
- 画像候補は別タスクで目視確認する。
- 販売場所が既存shopにないため、新規shop扱いにするか、sales location文字列で扱うか設計判断が必要。

## 8. Next Task Proposal

- 追加不可。
- 公式情報待ちとしてwatch継続。
- 価格 / 店舗ID / 商品単体画像が揃うまで保留。
- 次にやるなら、公式画像候補2件の目視比較と販売場所の設計判断。
- ただし、現時点でgenerated JSONへ追加しない。
