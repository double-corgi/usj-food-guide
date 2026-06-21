# UNICOLE 商品画像品質 残り候補整理 v1

## 1. 調査概要

過去の `docs/food-image-quality-review-v1.md` と `docs/food-image-replacement-candidate-review-v1.md` をもとに、すでに修正済みの `food-uqw79q` と、duplicate override により hidden 済みになった食品を除外し、現在の表示対象を基準に残りの画像品質候補を再整理した。

今回の作業は調査と docs 保存のみ。`scripts/output/foods.generated.json`、`public` 配下画像、`data/translations`、DB、crawler、app/components は変更していない。画像取得、画像差し替え、外部画像取得も行っていない。

確認コマンド:

- `npm run audit:duplicates`
- `npm run coverage`

確認結果:

- `public_active_total`: 180
- Food Translation Coverage: total 294 / translated 77 / missing 217 / verified 6 / needs_review 69 / orphan 0
- Store Translation Coverage: generated_total 42 / translated 42 / missing 0 / display_total 99 / display_translated 52 / display_missing 47 / display_seed 14 / verified 23 / needs_review 33 / orphan 0

## 2. 修正済み

### food-uqw79q

- food.id: `food-uqw79q`
- name: デザート&ドリンクバーセット
- previous image: `usj-gds-food-minions-cup-dessert-offercard-h.jpg`
- current image: `/manual-images/food-uqw79q/usj-gds-minion-dessert-and-drink-bar-set-gallery-b.jpg`
- status: 修正済み
- 修正内容: 公式USJ由来の candidate B を `public/manual-images/food-uqw79q/` に保存し、`scripts/output/foods.generated.json` の food-uqw79q 画像URL系フィールドだけを差し替え済み。
- 現在の扱い: 残り候補から除外する。

## 3. 除外対象

以下は今回の残り候補から除外する。

- duplicate override により hidden 済みの3件:
  - `food-1xe3vuu`
  - `food-5ib5k3`
  - `food-1rsazo8`
- 既に hidden / canonical=false の管理対象:
  - `food-jc2lhj`
  - `food-h5dibv`
  - `food-14zoddb`
  - `food-1c6f0vw`
  - `food-tpy2hd`
  - `food-8xwq2b`
  - `food-1it40z4`
  - `food-1jtv1i9`
  - `food-av67nb`
- duplicate ID 管理ペア:
  - `food-1qt6g0q`
  - `food-o9svxw` の hidden 側
- ended / low / rejected など、現時点で一覧表示への影響が低いもの。

除外理由:

- 表示対象ではない、または canonical / hidden 管理済み。
- 画像差し替えより先にデータ整理対象として扱うべき。
- 今すぐの一覧カード改善には直結しない。

## 4. High Priority 残り候補

High Priority は、表示対象同士で同じ offer card 系画像を共有し、片方の商品名と画像の一致度が弱い可能性があるもの。`food-uqw79q` は修正済みのため除外し、残りは6件。

### food-116rf8q

- food.id: `food-116rf8q`
- name: T-REX・バーガーセット
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-t-rex-burger-meal-spring-2025-offercard-h.jpg`
- 問題点: `food-19tglum` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。商品単体として識別しやすい画像か確認が必要。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- candidate image有無: 現状データ上は同一 offer card 以外の確定候補なし。
- local candidate有無: NO
- can fix now: NO
- next action: 公式sourceUrl単位で、T-REX・バーガーセット単体画像またはギャラリー画像候補を調査する。

### food-e0few1

- food.id: `food-e0few1`
- name: ラプトル・バーガーセット
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-raptor-burger-meal-spring-2025-offercard-h.jpg`
- 問題点: `food-6d5z2w` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- candidate image有無: 現状データ上は同一 offer card 以外の確定候補なし。
- local candidate有無: NO
- can fix now: NO
- next action: 公式sourceUrl単位で画像候補を調査する。

### food-wn7ivo

- food.id: `food-wn7ivo`
- name: プテラノドン・バーガーセット
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-pteranodon-burger-meal-spring-2025-offercard-h.jpg`
- 問題点: `food-1x0ir52` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- candidate image有無: 現状データ上は同一 offer card 以外の確定候補なし。
- local candidate有無: NO
- can fix now: NO
- next action: 公式sourceUrl単位で画像候補を調査する。

### food-9un9k0

- food.id: `food-9un9k0`
- name: モササウルス・バーガーセット
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-mosasaurus-burger-meal-spring-2025-offercard-h.jpg`
- 問題点: `food-yhtmyt` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- candidate image有無: 現状データ上は同一 offer card 以外の確定候補なし。
- local candidate有無: NO
- can fix now: NO
- next action: 公式sourceUrl単位で画像候補を調査する。

### food-sfsu3d

- food.id: `food-sfsu3d`
- name: フィルのワッフルチキンプレート
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-phils-chicken-and-waffle-meal-spring-2025-offercard-h.jpg`
- 問題点: `food-1ojz6jw` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/happiness-cafe/index.html`
- candidate image有無: 現状データ上は同一 offer card 以外の確定候補なし。
- local candidate有無: NO
- can fix now: NO
- next action: 公式sourceUrl単位で画像候補を調査する。

### food-bcbp5u

- food.id: `food-bcbp5u`
- name: スチュアートのビッグベーコンチーズ・バーガープレート
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-stuarts-big-bacon-and-cheese-burger-meal-spring-2025-offercard-h.jpg`
- 問題点: `food-1435vjy` と同一画像。どちらも表示対象で、こちらは `displayQuality=medium`。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/happiness-cafe/index.html`
- candidate image有無: 現状データ上は同一 offer card 以外の確定候補なし。
- local candidate有無: NO
- can fix now: NO
- next action: 公式sourceUrl単位で画像候補を調査する。

## 5. Medium Priority 残り候補

Medium Priority は、表示対象ではあるが、画像差し替えよりも手動確認またはデータ確認を先に行うべきもの。

### food-j4nvrm

- food.id: `food-j4nvrm`
- name: 超!! チョコバナナ・チュリトス
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-minion-choco-banana-churritos-gallery-a.jpg`
- 問題点: 別ID商品と画像が一致する可能性があり、商品として別物か、同一商品の別表記か確認が必要。
- sourceUrl: `https://www.usj.co.jp/company/news/2026/0422/`
- candidate image有無: 未確認
- local candidate有無: NO
- can fix now: NO
- next action: 7月フード追加watchの文脈で、価格・販売場所・期間・画像を公式sourceUrl単位で再確認する。

### food-tgucsr

- food.id: `food-tgucsr`
- name: 虚式「茈」 チュリトス ~ミックスベリー味~
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-jujutsukaisen-the-real-4d-2026-churritos-h.jpg`
- 問題点: 味違いチュリトスが同一画像で表示される可能性がある。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/events/universal-cool-japan-2026/jujutsukaisen/index.html`
- candidate image有無: 未確認
- local candidate有無: NO
- can fix now: NO
- next action: 共通画像として許容するか、味違い単体画像があるか確認する。

### food-o9svxw

- food.id: `food-o9svxw`
- name: ベビーフード
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-baby-food-infocard-h.jpg`
- 問題点: `infocard` 系で、商品写真ではなく案内カード・文字入り画像の可能性が高い。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/louies-ny-pizza-parlor/index.html`
- candidate image有無: 未確認
- local candidate有無: NO
- can fix now: NO
- next action: 商品として画像を持たせるべきか、案内情報として現在画像を許容するかを判断する。

### food-12eyica

- food.id: `food-12eyica`
- name: スペシャルドリンク&コースターセット
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-detective-conan-mystery-restaurant-2026-drink-cf6-a.jpg`
- 問題点: コラボ系画像で、一覧カード上の視認性を確認したい。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/events/universal-cool-japan-2026/conan/restaurant/index.html`
- candidate image有無: 未確認
- local candidate有無: NO
- can fix now: NO
- next action: 目視確認。必要なら公式sourceUrl単位で候補画像を探す。

### food-1gtoojv

- food.id: `food-1gtoojv`
- name: カレーライス・キッズセット
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-kids-curry-meal-spring-2026-offercard-h.jpg`
- 問題点: 同一画像の片方は hidden 済みで表示重複はないが、カード表示で商品が分かりやすいか確認したい。
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/kinopios-cafe/index.html`
- candidate image有無: 未確認
- local candidate有無: NO
- can fix now: NO
- next action: 目視確認し、問題がなければ維持する。

### 同一画像ペアの表示側確認

以下は High Priority 側と同じ画像を共有する表示対象。差し替え方針を決める際に、現画像を残す側として妥当かを確認する。

- `food-19tglum` T-REX・ガーリックトマト・ビーフバーガーセット
- `food-6d5z2w` ラプトル・ベーコン&ビーフバーガーセット
- `food-1x0ir52` プテラノドン・フライドチキンバーガーセット
- `food-yhtmyt` モササウルス・フィッシュバーガーセット
- `food-1ojz6jw` ボブのワッフルチキンプレート
- `food-1435vjy` スチュアートのベーコンチーズ・バーガープレート
- `food-12tnz7b` ミニオンズ・カップデザート

## 6. Low Priority / No Action

以下は今すぐの画像差し替え対象にしない。

- hidden 済み画像ペア
- duplicate override 適用済みペア
- duplicate ID 管理ペア
- ended / low / rejected の食品
- 既に表示側が決まっている canonical/hidden 管理済み食品
- `food-uqw79q` と同一名の hidden 側 `food-rbn0yu`

理由:

- 一覧表示への影響が低い。
- 画像差し替えではなく canonical/hidden 管理で解決済み。
- 追加の公式確認またはデータ整理フェーズで扱うべき。

## 7. 次に修正すべき1件

### 推奨: food-116rf8q

- 推奨food.id: `food-116rf8q`
- name: T-REX・バーガーセット
- 推奨理由:
  - High Priority 残り候補の先頭。
  - 表示対象同士で同一画像を共有している。
  - `displayQuality=medium` で、一覧カード上の商品識別性を改善できる可能性が高い。
  - sourceUrl が `discovery-restaurant` にまとまっており、同じ調査でラプトル、プテラノドン、モササウルス系の候補も確認しやすい。
- すぐ差し替え可能か: NO
- 先に画像取得が必要か: YES
- 先に公式確認が必要か: YES
- 次のタスク種別: 画像差し替え実装ではなく、公式sourceUrl単位の画像候補調査。

## 8. 次の実装方針

1. 画像品質修正は1件ずつ行う。
2. 既存public内に候補画像がないものは、先に公式URL単位で画像候補を確認する。
3. 画像取得が必要な場合は、公式USJ由来であることを確認したうえで、対象food.id専用ディレクトリへ保存する。
4. generated JSON変更は1件単位に限定する。
5. 画像差し替え後は `npm run lint`、`npm run typecheck`、`npm run build`、`npm run coverage`、`npm run audit:duplicates` を実行する。
6. Food/Store Coverage と orphan 0 を確認する。
7. レビュー証跡保存後に必要ならVercelへprebuilt deployする。
