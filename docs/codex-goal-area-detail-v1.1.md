# Codex実装指示書 — area-detail-v1.1（販売場所重複修正＋P3小修正）

対象: `/areas/[id]`（エリア詳細ページ）
種別: 小規模修正のみ。全面改修ではない。

---

## 0. Git運用（最初に必ず実行）

```bash
git status
```

未コミットの変更がある場合:

```bash
git add .
git commit -m "backup-before-area-detail-v1-1"
git push
```

未コミットの変更がない場合:

```bash
git commit --allow-empty -m "backup-before-area-detail-v1-1"
git push
```

作業完了後（最後に必ず実行）:

```bash
git add .
git commit -m "fix-area-detail-v1-1-shop-dedupe"
git push
```

---

## 1. 目的

area-detail-v1で実装された新デザイン（写真ヒーロー・ウォーム紙背景・Gold/Navy・カードレス構成）はレビューで条件付き承認された。今回はその見た目を一切壊さず、レビューで指摘された**1件のP2問題**を修正する。あわせて、安全に同梱できる**P3小修正2件**を行ってよい。

今回やらないこと:

- `/areas/[id]` の再設計・全面改修
- レイアウト構成の変更
- 配色・フォント・余白などビジュアル言語の変更
- スコープ外ページの改修

---

## 2. P2修正（必須）: 販売場所リストの同名店舗重複

### 現在の問題

本番URLで以下の重複が確認されている。

- メルズ・ドライブイン ×3
- スタジオ・スターズ・レストラン ×2
- ビバリーヒルズ・ブランジェリー ×2

### 原因

`app/areas/[id]/page.tsx` の `buildAreaShopRows` が、`shopId ?? \`${shopName}-${shopType}\`` をキーにdedupeしている。本番データには同名店舗が複数の異なる `shopId` を持つレコードが存在するため、shopIdキーでは同名店舗が複数行として残ってしまう。

```ts
function buildAreaShopRows(foods: FoodWithRelations[]) {
  const rows = new Map<string, AreaShopRow>();
  for (const food of foods) {
    const locations = food.locations?.length ? food.locations : [foodToLocation(food)];
    for (const location of locations) {
      if (!isDisplayableShopName(location.shopName)) continue;
      const key = location.shopId ?? `${location.shopName}-${location.shopType}`;
      const current = rows.get(key);
      const next = {
        key,
        name: location.shopName,
        type: location.shopType,
        href: location.shopId ? `/stores/${location.shopId}` : undefined
      };
      rows.set(key, current?.href ? current : next);
    }
  }
  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name, "ja"));
}
```

### 修正方針

販売場所リストの表示専用ロジックとして、**dedupeキーを正規化した店舗名に変更する**。

- キーを `shopId` ベースではなく、正規化した店舗名（例: 前後の空白除去・全角/半角統一など、既存の正規化ユーティリティがあれば再利用、なければ `name.trim()` 程度の軽い正規化で十分）にする。
- 同じキーに複数候補がある場合、**代表行**を以下の優先順位で選ぶ:
  1. `/stores/[id]` へのリンク（`shopId` あり）を持つ行を優先
  2. 店舗種別（`shopType`）が明確に判定できる行を優先
  3. 上記で決まらない場合は最初に見つかった行を採用
- 1つの正規化店舗名につき、**最終的に1行だけ**をリストに残す。
- ヘッダーの「◯か所」の件数も、この正規化後の件数に基づく（dedupe後の行数）。

### 範囲・禁止事項（P2）

- 修正は**販売場所リストの表示専用ロジック**（`buildAreaShopRows` 周辺、UI表示のみ）に限定する。
- 以下は禁止:
  - 店舗データそのものの削除・変更
  - `shopId` フィールドの削除・変更
  - `lib/repositories/` の変更
  - DB・Supabaseスキーマの変更
  - generated JSON（データソース）の変更
  - 店舗データ正規化の大改修・マスタデータ統合

あくまで「同じ画面に表示する行を1つにまとめる」という**UI表示の整理**であることを徹底すること。

---

## 3. P3小修正（同梱可、必須ではない）

以下2件は、安全かつ小規模に実装できる場合のみ同梱してよい。リスクが高い、または影響範囲が広がる場合は見送ってよい（その場合は最終報告に理由を記載）。

### P3-1: 銘板の数字三重表示を軽くする

対象: `components/area-collection-summary.tsx`

現在、未食が1品以上のとき以下の3つが同時に表示され、情報が重複している。

- 「このエリアであと◯品」（大）
- 右側「{eaten} / {total}」＋「コンプ率◯%」
- 下部「食べた {eaten} / 販売中 {total}品（登録分）」

修正方針:

- `completion.eaten === 0` のときのみ、右側の「{eaten} / {total}」＋「コンプ率◯%」ブロックを**非表示にする、またはごく弱いスタイル（より小さく・薄いグレーなど）に変更する**。
- `completion.eaten >= 1` の通常表示（現状の見た目）は**変更しない**。
- 下部の「食べた {eaten} / 販売中 {total}品（登録分）」と「このエリアであと◯品」は両方の場合とも維持する。
- `uneaten === 0`（コンプリート分岐）および `completion.total === 0`（確認中分岐）のレイアウトは変更しない。

### P3-2: 販売終了0品セクションの非表示

対象: `components/area-food-status-lists.tsx`

現在、「販売終了フード0品 / このエリアに販売終了フードはありません。」というセクションが、該当フードが0件でも表示される。

修正方針:

- 該当フードの件数が0件（`endedFoods.length === 0` など、実装に応じた変数名）の場合、**そのセクション全体を非表示にする**（`<details>` ごとレンダリングしない）。
- 1件以上ある場合の表示・挙動は変更しない。

### P3-3（対応不要・データ監査トラックへ）: 価格疑義

「スタジオ・スターズ 25周年スペシャルプレート ￥25,000」は価格データの誤り疑いがあるが、今回のスコープでは**一切触らない**。価格の推測・修正・書き換えは禁止。

---

## 4. 絶対に維持するもの（area-detail-v1の成果）

以下はarea-detail-v1で実現された良い状態であり、今回の修正で**壊してはならない**。

- エリア写真ヒーロー（フルブリード240px / lg角丸320px、黒グラデ＋エリア名）
- ウォーム紙背景（`#fffaf5`）
- Gold（`#fdbb30`）/ Navy（`#071b3a`）配色
- カードレス構成（罫線＋余白区切り、白カード・shadowなし）
- 「このエリアであと◯品」の大表示
- 「まず食べたい3品」（非順位表現）
- 取得済みフードのGoldリング＋Goldスタンプ（`ring-2 ring-[#fdbb30]/85` ＋ ✓スタンプ）
- 未食フードの微抑制（`saturate-[0.88] brightness-[1.03]`、lock/?/grayscaleなし）
- 販売場所リストの行形式（店舗名＋種別、初期6件＋「すべての販売場所を見る」展開）
- 「残りをすべて見る → /foods?area=…」への導線
- safe-area対応（`.area-detail-page` の `padding-top: max(env(safe-area-inset-top), 1rem)`）
- `/areas` 一覧の見た目
- ホームv1.2の見た目・挙動

---

## 5. 禁止事項

- `/areas/[id]` の全面再設計・大規模リファクタ
- ホーム（`/`）の改修
- `/areas` 一覧の見た目変更
- `/foods`・`/eaten`・`/stores` の改修
- データ削除、`shopId` 削除、`repositories/` 変更、DB変更、generated JSON変更
- `lib/food-utils.ts`・`lib/use-food-logs.ts`・`lib/local-user-data.ts` の変更（localStorage schema変更含む）
- 価格データの推測・修正
- 以下の復活:
  - 統計カード4連発
  - 「Area Memory」「Missing Foods」「Archive Foods」などの英語ラベル
  - `#1` / `#2` / `#3` のランキングバッジ
  - 販売場所チップの壁（壁状のチップ表示）
  - 埋め込みFoodGrid
- スコープに無関係なコード整形・リファクタ

---

## 6. 実装対象ファイル

### 主対象

- `app/areas/[id]/page.tsx`（`buildAreaShopRows` のdedupeロジック修正）

### 必要に応じて（P3を同梱する場合）

- `components/area-collection-summary.tsx`（P3-1）
- `components/area-food-status-lists.tsx`（P3-2）

### 変更してはならないファイル

- `lib/repositories/foods.ts`
- `lib/food-utils.ts`
- `lib/use-food-logs.ts`
- `lib/local-user-data.ts`
- `lib/area-images.ts`
- `scripts/`
- `supabase/`
- `app/page.tsx`
- `components/home-progress-client.tsx`
- `components/home-dashboard.tsx`
- `app/globals.css`（safe-area等は既に対応済みのため変更不要）

---

## 7. 検証要件

### 必須コマンド

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。エラー・新規warningが出た場合は修正すること。

### 確認ページ

- `/areas`
- `/areas/[id]`（特にHollywood area = `area-olb56e` を含む）
- `/`
- `/foods`
- `/eaten`
- `/stores`

### 確認幅

- 390px
- 430px
- 768px
- 1280px
- 1920px

各幅でスクリーンショットを取得し、以下を確認すること。

### 確認項目

- 販売場所リストで以下の店舗名がそれぞれ**1回だけ**表示されている:
  - メルズ・ドライブイン
  - スタジオ・スターズ・レストラン
  - ビバリーヒルズ・ブランジェリー
- dedupe後も、可能な範囲で `/stores/[id]` への店舗詳細リンクが残っている
- 販売場所リストの行形式（店舗名＋種別、初期6件＋展開）が壊れていない
- 「◯か所」の件数表示がdedupe後の件数と一致している
- `/areas/[id]` の新デザイン（ヒーロー写真・ウォーム背景・カードレス構成・Gold/Navy・「このエリアであと◯品」・「まず食べたい3品」）が壊れていない
- `/areas` 一覧の見た目が壊れていない
- ホームv1.2（ロゴ・コレクション数・棚・safe-area対応）が壊れていない
- 5幅すべてで overflow が発生していない
- 5幅すべてで要素のclippingが発生していない
- 横スクロールが発生していない
- （P3-1を実装した場合）`completion.eaten === 0` のエリアで右側の「{eaten}/{total} コンプ率{rate}%」が非表示またはごく弱い表示になっている。`completion.eaten >= 1` のエリアでは従来表示が維持されている
- （P3-2を実装した場合）販売終了フードが0件のエリアで「販売終了フード」セクションが表示されていない。1件以上のエリアでは従来通り表示されている

### iOS Simulator

iPhone 14 Pro（1179x2556）で `/areas/[id]` を表示し、safe-area対応（ロゴ・戻るリンク・ヒーローがDynamic Island/ノッチと干渉していない）が維持されていることを確認する。

---

## 8. 最終報告形式

作業完了後、以下の項目を含む報告を行うこと。

1. **修正した問題**: 今回対応したP2・P3の内容
2. **販売場所dedupeの方式**: dedupeキーをどう正規化したか（実装の詳細）
3. **代表行の選び方**: 重複時にどの行を代表として残したか、その優先順位の実装内容
4. **重複が消えた店舗名**: メルズ・ドライブイン／スタジオ・スターズ・レストラン／ビバリーヒルズ・ブランジェリーがそれぞれ1回になったことの確認結果
5. **同梱したP3小修正**: P3-1・P3-2をそれぞれ実施したか否か、実施した場合の実装内容、見送った場合はその理由
6. **変更ファイル**: 変更したファイルの一覧（差分概要含む）
7. **lint / typecheck / build結果**: 各コマンドの結果（成功/失敗、warning有無）
8. **390 / 430 / 768 / 1280 / 1920確認結果**: 各幅でのoverflow・clipping・横スクロールの有無、販売場所リストの表示確認結果
9. **/areas一覧が壊れていない確認**: 確認結果
10. **ホームv1.2が壊れていない確認**: 確認結果
11. **localhost確認結果**: ローカル環境での動作確認結果
12. **Vercel確認結果**: デプロイ後の本番URLでの確認結果（`/areas/area-olb56e` の販売場所リストで重複が解消されていることを含む）
13. **commit hash**: 今回の修正のコミットハッシュ
14. **push成功確認**: `git push` が成功したことの確認

---

## 9. Codex CLI確認対応

作業中にCodex CLIから確認プロンプトが表示された場合は、必ず

```
2. Yes, and don't ask again
```

を選択し、最後まで自動で実行を継続すること。確認のための質問・作業の中断は行わないこと。
