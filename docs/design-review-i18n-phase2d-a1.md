# design-review-i18n-phase2d-a1.md

## 0. 対象

- 実装: i18n Phase 2D-A.1（Phase2D-Aレビューの条件1への対応）
- commit: `349ce98`（`fix-i18n-phase2d-a-limited-badge`、backup: `61d11ab`）
- 前提: `design-review-i18n-phase2d-a.md`（条件付き承認、条件: `NextWantCard`の「限定」表記を維持するか「期間限定」を正式採用するか）

## 1. 変更内容の確認

`git diff 61d11ab 349ce98 --stat` で確認した変更は以下のみ。

- `components/eaten-experience.tsx`（1行のみ変更）
- `design-review-i18n-phase2d-a.md`（前回レビュー結果の追加、ドキュメントのみ）

`lib/i18n/dictionaries.ts`・`components/food-card.tsx`・その他ファイルへの変更はなし（新規キー追加なし）。

### 1.1 差分

```diff
- <p ...>{food.isLimited ? `${t("common.limited")} / ` : ""}{getSaleStatusLabel(food)}</p>
+ <p ...>{food.isLimited ? `${t("foods.badgeLimited")} / ` : ""}{getSaleStatusLabel(food)}</p>
```

`foods.badgeLimited`は新規キーではなく、`components/food-card.tsx`の商品カードのバッジ（`food.isLimited`時のラベル）で既に使われている既存キー。

## 2. レビュー項目ごとの確認

### NextWantCardの「限定」表示が短いバッジ表現になっているか

`foods.badgeLimited`のja値は「限定」（`lib/i18n/dictionaries.ts` 122行目）。`common.limited`の「期間限定」より短く、Phase2D-A以前の元表記「限定」と一致する。

判定: **対応済み。**

### common.limitedとバッジ用キーの意味が分かれているか

- `common.limited`（ja="期間限定"／en="Limited Time"／ko="기간 한정"／zh-TW="期間限定"）: `/eaten`本体や`/foods`等の説明的な文脈で使われる既存キー。
- `foods.badgeLimited`（ja="限定"／en="Limited"／ko="한정"／zh-TW="限定"）: `components/food-card.tsx`のカードバッジ、および今回`NextWantCard`で使われる短いバッジ用キー。

両キーは`lib/i18n/dictionaries.ts`内で別エントリとして定義されており、用途（説明文 vs. バッジ）に応じて意味が分かれている。`NextWantCard`は`food-card.tsx`と同じ`foods.badgeLimited`を使うことで、商品カードとNextWantCardのバッジ表記が統一された。

判定: **意味が分かれている。問題なし。**

### ja / en / ko / zh-TWで表示が自然か

`foods.badgeLimited`の4言語値を確認した。

| locale | 値 |
|---|---|
| ja | 限定 |
| en | Limited |
| ko | 한정 |
| zh-TW | 限定 |

いずれも短く、`/`との連結（`"限定 / "`等）で`getSaleStatusLabel(food)`（"販売中"/"On Sale"等）と並べても不自然な長さにならない。`components/food-card.tsx`の商品カードバッジで既に同じキー・同じ値が使われており、実績のある表記であるため、4言語とも自然と判断する。

判定: **問題なし。**

### /eatenの見た目が壊れていないか

本番`/eaten`（ja）をフェッチし、ヘッダー「記録アルバム」「食べた記録」、統計行、最近の記録、アルバム一覧、フィルター（全エリア/全ジャンル/カテゴリ各種）、エリア別進捗（10エリア）、ジャンル別進捗（12ジャンル）、集計の考え方、フッターまで一通り正常表示されることを確認した。Phase2D-Aレビュー時点との表示差はなく、変更箇所（`NextWantCard`）は「次回食べたい」タブ内に限定される1行のみの修正であり、レイアウト構造（クラス）は変更されていない。

判定: **問題なし。**

### 商品名 / 店舗名 / エリア名 / ユーザー記録メモが翻訳されていないか

今回の変更は`t("common.limited")`→`t("foods.badgeLimited")`というキー差し替えのみで、商品名・店舗名・エリア名・ユーザー記録メモを扱う箇所には触れていない。Phase2D-Aレビューで確認済みの「翻訳対象外の維持」状態に変更はない。

判定: **翻訳されていない。問題なし。**

### URL構造が変わっていないか

変更はJSX内のラベルテキストのみで、ルーティング・リンク先URLに変更はない。`git diff --stat`でも`app/**`配下のファイルは変更されていない。

判定: **変更なし。問題なし。**

### ホームv1.2が壊れていないか

`git diff --stat`の通り、ホーム関連ファイル（`app/page.tsx`等）は無変更。本番`/`は本レビューでは再フェッチしていないが、Phase2D-Aレビューで確認済みであり、今回の変更がホームに影響する経路は存在しない（`eaten-experience.tsx`内のローカルなラベル変更のみ）。

判定: **影響なし。問題なし。**

### area-detail-v1.1が壊れていないか

`app/areas/[id]/**`関連ファイルは無変更。`/eaten`からのエリアリンク（`/areas/area-olb56e`等）もURL・構造ともに変更なし（本番`/eaten`フェッチで確認）。

判定: **影響なし。問題なし。**

## 3. 総合判定

**承認**

Phase2D-Aレビューの条件1「`NextWantCard`の「限定」表記」について、新規キーを追加せず既存キー`foods.badgeLimited`（`food-card.tsx`の商品カードバッジと同じキー）に差し替えることで、ja表示を元の「限定」に復元し、かつ`common.limited`（"期間限定"、説明文用）とバッジ用キーの意味を明確に分離した。差分は1行のみで、他の確認項目（翻訳対象外維持・既存データ・表示品質・URL構造・ホーム/エリア詳細の非破壊）にも影響はない。

Phase2D-Aの条件はこれで解消されたものと判断する。Phase 2D-B（`/areas`/`/stores`等）の`/goal`は本レビューでは作成しない。
