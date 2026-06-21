# Codex Goal: 次の食品画像差し替え候補調査 v1

## 目的

`docs/food-image-quality-remaining-candidates-v1.md` に基づき、次に修正すべき画像候補として `food-116rf8q`「T-REX・バーガーセット」の公式画像候補を調査する。

今回は画像差し替え実装ではなく、公式sourceUrl単位の画像候補調査を行う。既存public内に差し替え候補がないため、まず公式USJ由来の候補画像URLを特定し、取得・保存できるかを判断する。

## 対象

- food.id: `food-116rf8q`
- name: T-REX・バーガーセット
- current image: `https://www.usj.co.jp/tridiondata/usj/ja/jp/files/images/gds-images/usj-gds-food-t-rex-burger-meal-spring-2025-offercard-h.jpg`
- sourceUrl: `https://www.usj.co.jp/tridiondata/usj/ja/jp/restaurants/discovery-restaurant/index.html`
- related visible food: `food-19tglum` T-REX・ガーリックトマト・ビーフバーガーセット

## 背景

`food-116rf8q` は `food-19tglum` と同じ offer card 系画像を共有している。どちらも表示対象であり、`food-116rf8q` は `displayQuality=medium` のため、T-REX・バーガーセット単体としてより分かりやすい画像候補があるか確認したい。

## 禁止

- git add 禁止
- git commit 禁止
- generated JSON変更禁止
- scripts/output変更禁止
- data/translations変更禁止
- DB / crawler実行禁止
- npm run crawl:* 実行禁止
- app / components変更禁止
- public画像変更禁止
- 画像ダウンロード禁止
- 外部画像取得禁止
- 公式USJ以外の情報を確定データとして使うこと禁止
- food.id / store.id変更禁止

## 許可

- 公式USJページを読む
- `curl` 等で公式ページHTMLを確認する
- JSON-LD / og:image / Tridion data / HTML本文を読む
- `scripts/output/foods.generated.json` と既存候補データを読み取り専用で照合する
- `public` 配下の既存画像を読み取り専用で確認する
- 調査結果をチャットにまとめる

## 作業

1. `git status --short`
2. `git status --short --branch`
3. `docs/food-image-quality-remaining-candidates-v1.md` を読む
4. `scripts/output/foods.generated.json` から `food-116rf8q` と `food-19tglum` を確認する
5. `sourceUrl` の公式ページを確認する
6. 公式ページ内の画像候補を確認する
   - HTML本文画像
   - JSON-LD
   - og:image
   - Tridion data
   - image candidates
7. 既存public内にT-REX・バーガーセットらしい画像があるか確認する
8. 候補画像があれば、URLだけ記録する
9. 画像取得・保存・差し替えは行わない

## 出力形式

```
=== T-REX Burger Image Candidate Research ===

1. Current record
- food.id:
- name:
- current image:
- sourceUrl:
- related visible food:

2. Official source
- sourceUrl:
- readable: YES / NO
- confirmed product: YES / NO
- product facts:

3. Image candidates
- candidate image URLs:
- image source:
- suitability:
- official USJ origin: YES / NO
- needs download later: YES / NO

4. Existing local candidates
- public candidate found: YES / NO
- path:
- suitability:

5. Decision
- can replace now: YES / NO
- reason:
- next action:

6. Next Codex /goal案
- 画像取得が可能な場合: 公式USJ由来候補を1枚だけ保存して比較するgoal
- 画像候補がない場合: watch継続、または次のHigh候補へ進むgoal
```

## Stop条件

以下に該当した場合は停止して報告する。

- 公式sourceUrlが読めない
- 公式USJ由来の候補画像URLが確認できない
- 画像候補の出所が不明
- generated JSON変更が必要になる
- public画像変更が必要になる
- crawler実行が必要になる
- data/translations変更が必要になる
- app / components変更が必要になる

## 次フェーズ

この調査で公式USJ由来の候補画像が見つかった場合のみ、別タスクで次を行う。

1. 候補画像を1件だけ取得して `/tmp` で比較する
2. 採用判断後、`public/manual-images/food-116rf8q/` に保存する
3. `scripts/output/foods.generated.json` の `food-116rf8q` 画像URL系フィールドだけを差し替える
4. lint / typecheck / build / coverage / audit を確認する
5. レビュー証跡を保存する
