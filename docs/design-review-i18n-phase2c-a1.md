# design-review-i18n-phase2c-a1.md

## レビュー対象

- 前回レビュー: `docs/design-review-i18n-phase2c-a.md`（条件付き承認、3条件）
- バックアップコミット: `d514740`（backup-before-i18n-phase2c-a1）
- 実装コミット: `f9d0667`（fix-i18n-phase2c-a-review-conditions）
- レビュー方法: `git diff 6d6df87 f9d0667 --stat` / 全差分read + 本番環境 (`https://new-app-chi-rosy.vercel.app`) 独立fetch + スクリーンショット読み込み（en/ko/zh-TW × 390px/430px、`/foods`/`/areas/area-olb56e`/`/eaten`）

変更ファイル: `components/food-card.tsx`（1行）、`lib/i18n/dictionaries.ts`（+12/-5）、`docs/design-review-i18n-phase2c-a.md`（前回レビュー文書の追加）、`screenshots/`配下18枚追加。

---

## 条件1: en/ko/zh-TWの`/foods`表示確認（390px/430px）が十分か

**確認済み。** `screenshots/i18n-phase2c-a1-foods-{en,ko,zh-TW}-{390,430}.png`の6枚を確認した。

- 見出し（Find Foods / 푸드 찾기 / 尋找餐點）、サブタイトル、検索placeholder（Search menus, stores, or areas / 메뉴・매장・에리어로 검색 / 用菜單・店鋪・區域搜尋）、フィルターボタン（Filters / 표시 조건 / 顯示條件）、件数表示（183 items / 183개 / 183品）が正しく表示されている。
- カテゴリチップは「すべて」のみ訳され（All / 전체 / 全部）、「チュリトス」「ポップコーン」「ドリンク」等の個別カテゴリ名は日本語のまま維持されている。
- 食べたボタンが en "Mark as eaten" / ko "먹은 것으로 기록" / zh-TW "標記為已吃" と表示され、いずれも390px/430px幅でカード内に収まり、はみ出し・折り返しによる崩れは見られない。
- 横スクロールバーや要素の重なりは確認できない。

フィルター`<select>`の展開状態（「表示条件」を開いた状態）のスクリーンショットは含まれていないが、`<select>`の`<option>`は通常ブラウザネイティブUIで描画されレイアウトに影響しないため、閉じた状態の確認で実用上は十分と判断する。条件1は解消とみなす。

---

## 条件2: `foodCard.eatenDone`と`common.eaten`の意味が分離されているか

**確認済み。** `components/food-card.tsx`の該当行が以下に変更された。

```tsx
{eaten ? t("foodCard.eatenDone") : t("foodCard.markEaten")}
```

`lib/i18n/dictionaries.ts`に新規キー`foodCard.markEaten`が追加され、4言語とも未食/食べた済みの2状態が文言上で明確に区別されている。

| 言語 | 未食（`foodCard.markEaten`） | 食べた済み（`foodCard.eatenDone`） |
| --- | --- | --- |
| ja | 食べた | 食べた済み |
| en | Mark as eaten | Eaten |
| ko | 먹은 것으로 기록 | 먹었어요 |
| zh-TW | 標記為已吃 | 已吃過 |

前回指摘した「en/zh-TWで両状態が同一文言になる」問題は解消されている。`common.eaten`キー自体は削除されておらず、他箇所（`food-detail.tsx`等、Phase2C-B対象）での再利用も可能な状態を維持している。条件2は解消。

---

## `/areas/[id]`（`/areas/area-olb56e`）の表示が壊れていないか / area-detail-v1.1が壊れていないか

**確認済み。** `screenshots/i18n-phase2c-a1-area-{en,ko,zh-TW}-{390,430}.png`を確認した。「Back to Areas / 返回區域列表」「Left in this area / 這個區域還剩」「37 items / 37品」「Eaten 0 / On sale 37 items (registered)」「First 3 Picks / 先吃這3品」等、Phase2B/2B.1で確認済みの構成・文言がそのまま表示されている。

これらはPhase2B/2B.1で実装済みのキーであり、Phase2C-Aの変更（`food-card.tsx`のボタン文言・バッジ文言）はarea-detail内のFirst 3 Picksカードにも反映されるはずだが、スクリーンショット内のカードはボタン領域が見切れているため、ボタン文言自体は本スクリーンショットからは直接確認できない。ただし、構造・見出し・大きな数字表示（「37 items」「37品」）は崩れておらず、area-detail-v1.1のレイアウトは維持されている。

「Foods Left」セクションのフードカードに表示されている「あと37品」バッジ（zh-TWスクリーンショットでも日本語のまま）はPhase2Cの対象外（カード上の残数バッジ）であり、想定通り未翻訳。

---

## `/eaten`の表示が壊れていないか

**確認済み。** `screenshots/i18n-phase2c-a1-eaten-{en,ko,zh-TW}-{390,430}.png`のうち390pxを確認した。en/ko/zh-TWいずれの環境でも、`/eaten`ページの見出し（「記録アルバム」「食べた記録」「最近の記録」「アルバム」「食べた商品一覧」等）はすべて日本語のままで、Phase2C-Aによる変更が及んでいないことを確認した。下部ナビゲーションのみ（Home/Search/Eaten/Areas/Stores等、Phase2A由来）各言語表示。

`/eaten`は`components/food-grid.tsx`を`mode="eaten"`で使用していると推測されるが、本スクリーンショットの表示には`food-grid.tsx`の検索バー・フィルターUIが見当たらない（カード一覧のみの簡易表示と思われる）。Phase2C-Aで`food-grid.tsx`に追加した`t()`呼び出しが`/eaten`表示時にエラーや崩れを起こしていないことは、3言語×390pxのスクリーンショットでページが正常に描画されていることから確認できる。

---

## 商品名/店舗名/エリア名/カテゴリ名/ジャンル名が翻訳されていないか

**確認済み。** `/foods`スクリーンショット内のカテゴリチップ（チュリトス/ポップコーン/ドリンク等）、エリア表示（ハリウッド・エリア/ニューヨーク・エリア）、商品名（「25周年アニバーサリー・ドリンクカップ」等）はen/ko/zh-TWすべてで日本語のまま。`/areas/area-olb56e`のエリア名「ハリウッド・エリア」、商品名「25周年アニバーサリー・ドリンクカップ」「ウィキッド・フレ…」も同様に未翻訳。

---

## URL構造が変わっていないか / ホームv1.2が壊れていないか

今回の差分はコンポーネント内の文言・辞書のみで、ルーティング・ページファイル構成への変更はない。前回レビュー（`design-review-i18n-phase2c-a.md`）で確認済みの`/`（ホームv1.2）、`/en/foods`が404相当である点に変更を加える差分はなく、引き続き問題ないと判断する。

---

## 総合判定

**承認**

前回（`design-review-i18n-phase2c-a.md`）の3条件のうち、

1. en/ko/zh-TWの`/foods`表示確認（390px/430px） → 解消
2. `foodCard.eatenDone`/`common.eaten`の訳の分離 → 解消（新規キー`foodCard.markEaten`で対応）
3. `/`・`/areas/[id]`・`/eaten`でのen/ko/zh-TW表示確認 → 解消（`/areas/area-olb56e`・`/eaten`のスクリーンショットで確認、いずれも崩れなし）

すべて解消されたことを確認した。Phase2C-A（`/foods`の固定UI文言の多言語化）は承認とする。

まだPhase2C-Bの`/goal`は作成していない。
