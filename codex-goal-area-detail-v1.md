# /goal — エリア詳細再設計 v1（codex-goal-area-detail-v1）

作成日: 2026-06-13
発行者: Claude（プロダクト責任者 / UX / UIデザイナー）
実装者: Codex
正本設計書: docs/area-detail-design-v1.md（本書と矛盾する場合は本書を優先。詳細は設計書の該当章を参照）
参照: docs/app-wide-design-review-v1.md（問題の根拠）

**対象は `/areas/[id]` のみ。** ホーム・/areas一覧の見た目・/foods・/foods/[id]・/eaten・/stores・/stores/[id] は変更しない。

**Codex CLIで確認画面（approval prompt）が出た場合は必ず「2. Yes, and don't ask again」を選択すること。確認質問禁止。途中停止禁止。必要なコマンド承認はすべて 2 を選択して最後まで実行する。**

---

## 0. Git運用（厳守）

作業開始前:

```bash
git status
```

未コミット変更がある場合:

```bash
git add .
git commit -m "backup-before-area-detail-v1"
git push
```

未コミット変更がない場合:

```bash
git commit --allow-empty -m "backup-before-area-detail-v1"
git push
```

作業完了後（検証成功後）:

```bash
git add .
git commit -m "implement-area-detail-v1"
git push
```

AGENTS.md 遵守: `localhost:3000` の dev server を kill / 再起動しない。終了時に 200 OK のまま残す。

## 1. Objective

`/areas/[id]` を旧世代の管理画面風ページから、ホームv1.2世代の「エリアのコレクション帳」へ作り替える。

達成基準: エリア写真ヒーローがある / 統計カード4連発が消えている / 「このエリアであと◯品」が唯一の大きい数字 / 取得済みがGoldスタンプで誇らしく見える / 英語装飾ラベル・チップ壁・埋め込みFoodGridが消えている。

## 2. 現在の問題（実装前に現物確認すること）

`app/areas/[id]/page.tsx`（139行）に以下が実装されている:

- 紺色ヒーロー（`bg-ink` の section）＋ `AreaStat` ×4（フード/販売場所/期間限定/カート販売）= 統計カード4連発
- エリア写真が無い（/areas一覧はポスターなのに詳細で写真が消える）
- 販売場所がグレーチップの壁（最大24個＋「ほか◯か所」）
- amber/roseのグラデ販促カード2種（注目フード3品に #1/#2/#3 バッジ・終了間近）
- ページ末尾に検索フィルタ付き `<FoodGrid>` の丸ごと埋め込み
- `components/area-eaten-foods.tsx` 33行目に「Area Memory」、`components/area-food-status-lists.tsx` 35行目に「Missing Foods」・51行目に「Archive Foods」のuppercase英語装飾ラベル

## 3. 実装内容（オーナー確定仕様）

### 3.1 ヒーロー（エリア写真）

- `components/area-overview.tsx`（9〜52行）にハードコードされている公式エリア画像10枚の `allowedAreas` マップを、**共有モジュールへ移動**する（`lib/area-images.ts` 新規作成、または `lib/constants.ts` へ追加。どちらでも可）。`area-overview.tsx` はそこを参照する形に変え、**/areas一覧の見た目は1pxも変えない**
- エリア詳細のヒーロー: モバイルはフルブリード（-mx-4）高さ約240px、写真上に/areas一覧カードと同じ下方向黒グラデ、左下にエリア名（白・font-black・2xl〜3xl）。lg以上は角丸（rounded-[2rem]）・高さ最大320px・コンテンツ幅1080px内
- **フォールバック**: 画像マップに無いエリアは、ウォーム紙背景＋Navyエリア名＋Gold罫の文字ヒーロー（紺パネル禁止・プレースホルダSVG禁止・灰色パネル禁止）
- **新規画像生成禁止・合成画像禁止・公式風加工画像禁止**
- ページ先頭のためsafe-area対応: ヒーロー（または戻るリンク行）に `padding-top: max(env(safe-area-inset-top), …)` 系の処理（ホームv1.2の `.home-collection-hero` と同方式。globals.cssに共通化してよい）
- 戻る導線「← エリア一覧へ戻る」は白カードボタンをやめ、軽いテキストリンクに

### 3.2 エリア銘板（統計4連発の置き換え）

- `AreaStat`×4 と紺ヒーロー内の `AreaCollectionSummary` 表示を**全廃**
- 代わりにヒーロー直下の紙背景上に銘板1つ:
  - 主役「**このエリアであと {uneaten}品**」（数字のみ28〜32px・Navy。ページ内で大きい数字はこれ1つ）
  - 従属「食べた {eaten} / 販売中 {total}品（登録分）」（12〜13px・slate）
  - 高さ4pxの細ゲージ（Blue→Goldグラデ。ホームと同一トークン）
- 計算は `components/area-collection-summary.tsx` の既存ロジック（canonical・isCompletable基準）をそのまま使う。**計算式は変えない**。同コンポーネントを紙上銘板スタイルに書き換えるか、page側に移すかは実装判断
- 全取得時（uneaten=0 かつ total>0）: 「このエリアはコンプリート」＋Goldスタンプ意匠（ホームの期間限定コンプ表示と同系）
- 残り0品かつtotal=0のエリア（例: ウォーターワールド）: 「このエリアの販売中フードは現在確認中です」とし、ゼロの銘板を出さない
- 「限定◯品」の独立表示は廃止

### 3.3 まず食べたい3品（非順位化）

- 選定は既存 `rankFoodsByStrategy(canonicalAreaFoods, "first-visit", [], 3)` を維持（`lib/food-value-score.ts` は変更禁止）
- **#1/#2/#3 バッジを削除**。順位を示す数字・メダル・色分けは一切付けない
- 見出し「まず食べたい3品」＋サブテキスト「このエリアで見つけるならここから。」
- amber グラデカードを廃止し、紙背景に直置き。写真4:3・商品名2行・価格。モバイルは横スワイプ可・lgは3カラム
- 候補0品ならセクション非表示

### 3.4 期間限定・終了間近

- 既存の「終了間近」セクションを簡素化: roseグラデカード廃止、紙上セクションに。見出し横に「あと◯日」chipは写真下テキストへ（写真上にバッジを載せない）
- 該当0品ならセクション非表示

### 3.5 このエリアで食べたフード

- `area-eaten-foods.tsx`: 「Area Memory」ラベル削除。白カード＋行リスト型から、**正方形タイルグリッド（モバイル3列・lg6列・最大8枚）**へ
- 取得済みタイル: フルカラー＋Gold細枠（ring）＋Goldスタンプ✓（24px）。**ホームv1.2の取得言語とCSS値を一致させる**（可能なら共通クラス化。ただしホーム側ファイルの変更は参照共有の最小限のみ）
- 9枚以上ある場合は「すべて見る → /eaten」テキスト導線
- 記録0品: 空ボックスを出さず、見出し＋1行「このエリアの1品目を見つけよう。」のみ

### 3.6 残りのフード

- `area-food-status-lists.tsx`: 「Missing Foods」ラベル削除。見出し「残りのフード」＋「あと◯品」チップ（Gold系）
- 正方形タイルグリッド（モバイル3列・lg6列・最大12枚）。未食は微抑制（`saturate-[0.88] brightness-[1.03]` — ホームと同値）。タイル下に商品名2行＋価格
- 13品以上は「残りをすべて見る → /foods?area={id}&sale=active&sort=uneaten」のテキスト行導線

### 3.7 販売終了フード

- 「Archive Foods」ラベル削除。「販売終了フード（◯品）」の `details` 折りたたみ構造は維持
- 白カード枠を外し罫線区切りに。**grayscale禁止** — 未食と同じ微抑制＋「販売終了」テキストで区別

### 3.8 販売場所（チップ壁の置き換え）

- グレーチップの壁を廃止。**罫線区切りの行リスト**に変更: 店舗名（`/stores/[id]` にひもづく場合はリンク）＋種別（レストラン/カート等）を1行ずつ
- 初期表示は主要6件。7件目以降は `details` 折りたたみ「すべての販売場所を見る（あと◯か所）」
- 「店舗未確認」「エリア確認中」系の名称は表示しない（既存フィルタ慣行を踏襲）

### 3.9 埋め込みFoodGridの削除

- page末尾の `<FoodGrid foods={areaFoods} … />` を**削除**。`food-grid.tsx` 本体は変更しない（/foodsで使用中）。importも除去
- 探す体験は 3.6 の「残りをすべて見る → /foods?area={id}…」導線に一本化

### 3.10 全体トーン

- ページ背景はウォーム紙（ホームと同系 #fffdf9 / #fffaf5 の使い分け）。クールグレー・紺パネル・白カード量産・shadow-soft の多用をやめ、セクションは見出し＋余白＋罫線で区切る
- 見出し・ラベルはすべて日本語。絵文字は使わない

## 4. 禁止事項（厳守）

- 統計カード4連発（フード/販売場所/期間限定/カート販売）
- 管理画面風UI・紺色ダッシュボード・白カード量産
- 「Area Memory」「Missing Foods」「Archive Foods」等の英語装飾ラベル（uppercase tracking含む）
- #1 / #2 / #3 のランキングバッジ・順位表現
- 販売場所チップの壁
- 検索フィルタ付きFoodGridのエリア詳細への埋め込み
- 新規画像生成・合成画像・公式風加工画像・プレースホルダSVGヒーロー
- ロック / ?マーク / 黒塗り / grayscale（未食・終了商品の表現として）
- 「全商品」「全フード」「完全収録」（使用可能語彙: 「販売中◯品（登録分）」「登録済みコレクション」「このエリアであと◯品」）
- ホーム改修・/areas一覧の見た目変更・他ページ改修
- データ削除・価格推測
- 集計ロジック（calculateCompletion等）の変更
- localStorage schema の変更
- `lib/repositories/foods.ts` の公開判定変更
- 大規模リファクタ・無関係な整形

## 5. 実装対象ファイル

主対象:

- `app/areas/[id]/page.tsx`（構成の主改修）
- `components/area-collection-summary.tsx`（銘板スタイル化。計算式不変）
- `components/area-eaten-foods.tsx`（英語ラベル削除・タイル化）
- `components/area-food-status-lists.tsx`（英語ラベル削除・タイル化・終了表現修正）

必要に応じて:

- `components/area-overview.tsx`（画像マップの参照化のみ。**見た目不変**）
- `lib/area-images.ts`（新規）または `lib/constants.ts`（画像マップ移動先）
- `app/globals.css`（safe-area・取得言語クラスの共有が必要な場合のみ）

原則触らない / 変更禁止:

- `lib/food-utils.ts` / `lib/use-food-logs.ts` / `lib/local-user-data.ts` / `lib/repositories/foods.ts`
- `lib/food-value-score.ts`（first-visit選定ロジック。表示だけ変える）
- `components/food-grid.tsx`（本体不変。エリアページからのimport除去のみ）
- `app/page.tsx` / `components/home-progress-client.tsx` / `components/home-dashboard.tsx`（ホーム）
- `scripts/` / `supabase/` / `app/admin/`

## 6. レイアウト要点

モバイル（390/430）上から: 戻るリンク行（約40px）→ ヒーロー写真（約240px・フルブリード）→ 銘板（約88px）→ まず食べたい3品（横スワイプ・約280px）→ 期間限定・終了間近（該当時）→ このエリアで食べたフード（3列タイル）→ 残りのフード（3列タイル・最大12）→ 販売終了（折りたたみ）→ 販売場所（リスト6件＋折りたたみ）。1画面目で「写真＋エリア名＋あと◯品＋まず食べたいの先頭」が見えること。横スクロールレールは「まず食べたい」「期間限定」の2つのみ。

PC（1280/1920）: コンテンツ最大幅1080px・1920は中央寄せで拡大しない。ヒーローは角丸・高さ最大320px。まず食べたい3カラム、タイルグリッド6カラム、販売場所2カラムリスト。タイル最大96px角。

## 7. 検証要件（必ず実行）

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功。`http://localhost:3000/` 200 OK（dev serverは残す）。

確認ページ: `/areas` `/areas/[id]`（最低3パターン: 残り多数エリア・販売中0品エリア・画像マップ外エリア）`/` `/foods` `/eaten` `/stores`

確認幅: 390px / 430px / 768px / 1280px / 1920px

確認項目:

- overflow 0 / clipped 0 / 横スクロールなし（全幅）
- `/areas` 一覧が壊れていない（画像マップ共有化後も見た目不変）
- `/areas/[id]` にエリア写真ヒーローがある（マップ外エリアは文字ヒーローにフォールバック）
- 統計カード4連発が消えている
- 「Area Memory」「Missing Foods」「Archive Foods」が grep で0件
- #1 / #2 / #3 が消えている
- 販売場所チップの壁が消え、罫線リスト＋折りたたみになっている
- 埋め込みFoodGridが消えている（/foodsへの導線に置換）
- 取得済みタイルが Gold細枠＋Goldスタンプ で表示される
- 未食がロック/?/黒塗り/grayscaleではなく微抑制写真になっている
- 「全商品」「全フード」「完全収録」が無い
- 「このエリアであと◯品」が唯一の大きい数字
- エリアの食べた数・残り数がホーム/eatenの集計と矛盾しない（集計不変）
- iOS Simulator（iPhone 14 Pro系）で上部safe-area干渉なし
- ホームv1.2が壊れていない（棚・銘板・レール・期間限定を目視確認）

スクリーンショット（screenshots/ に保存）:

- `area-detail-v1-after-390.png`
- `area-detail-v1-after-430.png`
- `area-detail-v1-after-768.png`
- `area-detail-v1-after-1280.png`
- `area-detail-v1-after-1920.png`
- `area-detail-v1-ios-simulator-390.png`（iPhone 14 Pro系・Dynamic Islandが写った状態）
- `area-detail-v1-empty-state-390.png`（記録0品 or 販売中0品エリアの空状態）

## 8. 最終報告形式

実装完了後、以下の形式で報告すること:

```
## 実装報告: area-detail-v1

### 実装した変更
（セクションごとに1行ずつ）

### 削除した旧UI
（統計カード4連発・英語ラベル3種・チップ壁・グラデカード・埋め込みFoodGrid・#1〜#3 の削除確認）

### エリア画像の再利用方法
（画像マップの移動先モジュールと参照方法。/areas一覧が見た目不変であることの確認）

### 統計カード4連発の置き換え内容
（銘板の表示内容と数値が改修前と一致することの確認）

### 取得済み/未食の表示仕様
（Gold枠/スタンプ/微抑制の採用値。ホームとの一致確認）

### 販売場所リストの整理内容
（初期表示件数・折りたたみ・店舗詳細リンクの有無）

### FoodGrid削除後の導線
（置換したリンク先URL）

### 変更ファイル
（一覧）

### lint / typecheck / build 結果
### 390 / 430 / 768 / 1280 / 1920 確認結果
### iOS Simulator確認結果
### /areas 一覧が壊れていない確認
### ホームv1.2が壊れていない確認
### localhost確認結果（200 OK）
### Vercel確認結果（反映確認 or 反映待ち）
### commit hash（backup と implement の両方）
### push成功確認
```

---

リマインド: スコープは `/areas/[id]` のみ。ホームと/areas一覧の見た目を守ることが最優先。迷ったら docs/area-detail-design-v1.md の該当章に従う。確認画面はすべて「2. Yes, and don't ask again」。
