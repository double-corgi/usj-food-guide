# /goal — ユニコレ ホーム小修正 v1.2（codex-goal-home-v1.2）

作成日: 2026-06-12
発行者: Claude（プロダクト責任者 / UX / UIデザイナー）
実装者: Codex
前提: home-design-v1.1 は実装済みで「条件付き承認」。本書は **design-review-after-v1-1.md で残った P0 1件＋P1確認1件＋P2 2件だけ** を小さく修正する。
参照: design-review-after-v1-1.md（問題の根拠）/ visual-review-home-v1.md / docs/codex-goal-home-v1.1.md

**これは全面改修ではない。home-design-v1 の再設計もしない。v1.1 の見た目を大きく変えない。** スコープ外の改善・整形・リファクタは一切禁止。

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
git commit -m "backup-before-home-design-v1-2"
git push
```

未コミット変更がない場合:

```bash
git commit --allow-empty -m "backup-before-home-design-v1-2"
git push
```

作業完了後（検証成功後）:

```bash
git add .
git commit -m "fix-home-design-v1-2-safe-area"
git push
```

AGENTS.md 遵守: `localhost:3000` の dev server を kill / 再起動しない。終了時に 200 OK のまま残す。

## 1. 修正対象（この4件以外は触らない）

### 1-1. P0: モバイルでロゴが Dynamic Island / status bar と干渉する

**現在の問題（コードで確認済みの事実）**:

- `app/layout.tsx` は `viewportFit: "cover"` を指定している
- iOS standalone / Capacitor では、コンテンツが status bar / Dynamic Island の下まで描画される
- `safe-area-inset-top` を処理しているのは `components/app-header.tsx` のヘッダーだけで、それは `hidden md:block` のためモバイルでは効いていない
- ホーム先頭（hero）の上余白は `pt-4`（16px）のみ。iPhone 14 Pro系の上部セーフエリアは約59pxのため、ユニコレロゴが島・時計の裏に潜る

**修正方針**:

- ホームのファーストビュー最上部に mobile safe-area 対応を入れる
- iOS standalone / Capacitor / PWA でロゴが Dynamic Island や時計に被らないようにする
- PC表示（md以上）は壊さない（PCヘッダーが既に safe-area を処理しているため、二重に余白を足さないこと）
- 通常ブラウザ（env値が0の環境）で上余白が増えすぎないようにする

**実装候補**:

- hero wrapper（`components/home-progress-client.tsx` の `HomeCollectionHero` の section）のモバイル上paddingを `padding-top: max(env(safe-area-inset-top), 1rem)` 相当にする
- Tailwind arbitrary value（例: `pt-[max(env(safe-area-inset-top),1rem)]`）で書けるならそれで良い。ビルドや可読性に問題がある場合は `app/globals.css` に安全なユーティリティクラス（例: `.safe-top-pad { padding-top: max(env(safe-area-inset-top), 1rem); }`）を追加して適用する
- `env()` 未対応・値0のブラウザ／Androidでも `max()` のフォールバックで16pxが確保され破綻しないこと
- heroは `-mx-4` でフルブリードしているため、背景（#fffaf5）がセーフエリア分も含めて上端まで自然に伸びること（背景だけ途切れて白帯が出る状態にしない）

**検証（必須）**:

- **iPhone 14 Pro または iPhone 14 Pro Max の Simulator スクリーンショットで確認すること。通常ブラウザの390px/430pxだけで判断しない**
- Dynamic Island / status bar とロゴが干渉していないこと
- ブラウザ表示でホーム上部の余白が過剰になっていないこと

### 1-2. P1: safe-area問題の他ページ波及確認

対象: `/` `/foods` `/foods/[id]` `/eaten` `/areas` `/stores` `/stores/[id]`

方針:

- 今回の主対象はホームのP0。**全ページへの大規模修正は入れない**
- ただし iOS Simulator（standalone/Capacitor相当）で上記ページの上部が島に近すぎないかを確認する
- 明らかに危険な共通レイアウト問題がある場合のみ、最小限の共通safe-area処理（例: `app/layout.tsx` の main にモバイル限定の `padding-top: env(safe-area-inset-top)` 系の処理）を検討してよい
- **`app/layout.tsx` を触らずホームだけで解決できるなら、ホームだけでよい**
- `app/layout.tsx` を触る場合は全ページに影響するため、上記7ページ全部の余白崩れ（PC含む）を必ず確認し、最終報告に「触った/触らない」と確認結果を明記する

### 1-3. P2: 0品状態の「コレクション数」ラベルが不自然

現在: 0品時に数字を出さない設計にした結果、「コレクション数」ラベルだけが値なしで浮いている。

修正（推奨案を採用）:

- **0品時は「コレクション数」ラベルを表示しない**。誘い文言を1つだけ表示する
- 1品以上では現行どおり「コレクション数 {eaten} / 販売中 {total}品（登録分）・残り {remaining}」＋ゲージ＋%を維持
- 説明過多は禁止（文言は1〜2行まで）

### 1-4. P2: 「棚が色づく」文言の重複を解消

現在: 棚上キャプション「食べると、棚が色づく。」と0品銘板「最初の1品を記録すると、棚が色づきます。」が同一画面に並び、同じ比喩が2回出ている。

修正（推奨案を採用）:

- **棚上キャプション「食べると、棚が色づく。」は残す**（全状態で共通の棚の説明として機能しているため）
- **0品銘板側を変更**: 「最初の1品を記録すると、棚が色づきます。」を削り、「販売中 {total}品（登録分）」の小表示のみにする
- 実装後に0品状態の390pxを見て、銘板が寂しくなりすぎた場合のみ、銘板側に短い一言（例: 「最初の1品から。」）を足してよい。ただし「色づく」の重複は禁止
- 1-3と1-4を合わせた0品銘板の最終形イメージ: 誘いの短文（または無し）＋「販売中 {total}品（登録分）」のみ。「コレクション数」ラベルと%・ゲージは出さない

## 2. 絶対に維持するもの（壊したら不合格）

v1.1で良くなったものは一切壊さない:

- コレクション棚（2×4 / 2×8 / 3×6）と色とりどりの見た目
- 未取得の微抑制（`saturate-[0.88] brightness-[1.03]`）
- 取得済みのGoldスタンプ（24px）とGold細枠
- 今集められるフードの大判レール（見た目・選定ロジックとも変更禁止）
- 期間限定コレクション（選出ロジック変更禁止。「25周年」が選ばれる現状を維持）
- ロゴの text-shadow 単発Gold方式（`1px 1px 0 rgba(253,187,48,0.55)`）と左右Gold罫
- 「登録済みコレクション」「販売中◯品（登録分）」の非断定表現
- ウォーム紙背景（#fffdf9 / #fffaf5）
- PC版2カラム構成（左ブランド＋銘板 / 右棚）
- セクション順序・下部ナビ・エリアポスター・最近の記録
- コレクション数・達成率の値（改修前後で同一であること）

## 3. 禁止事項

- ホームの全面作り直し / ファーストビューの再設計 / 棚デザインの大変更 / 大判レールの変更 / 期間限定コレクションの再設計
- ロックアイコン / ?マーク / COLLECTIONタグ / AI生成バナー / 合成フード画像 / 巨大ヒーロー画像 / SaaSカード / 管理画面風UI
- 「全183品」「全フード」「完全収録」
- `is25thFood()` の復活
- `calculateCompletion` の変更
- localStorage schema の変更
- `lib/repositories/foods.ts` の公開判定変更
- 商品データ削除 / 価格推測
- 大規模リファクタ / 無関係な整形 / 新規DB / 外部API追加

## 4. 実装対象ファイル

主に:

- `components/home-progress-client.tsx`（hero上padding・0品銘板文言）
- `app/globals.css`（safe-areaユーティリティが必要な場合のみ）

必要に応じて（最小限）:

- `app/layout.tsx`（1-2で共通処理が必要と判断した場合のみ。**触ったら全7ページ×全5幅を確認**）
- `components/app-header.tsx`（同上の文脈でのみ）
- `components/home-dashboard.tsx`（文言調整が必要な場合のみ）

原則触らない:

- `lib/food-utils.ts` / `lib/use-food-logs.ts` / `lib/local-user-data.ts` / `lib/repositories/foods.ts`
- `scripts/` / `supabase/` / `app/admin/`
- 上記以外のコンポーネント全部

## 5. 検証要件（必ず実行）

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。`http://localhost:3000/` 200 OK（dev serverは残す）。

確認ページ: `/` `/foods` `/foods/[id]` `/eaten` `/areas` `/stores` `/stores/[id]`

確認幅: 390px / 430px / 768px / 1280px / 1920px

**必須確認項目**:

- **iPhone 14 Pro または iPhone 14 Pro Max の Simulator で、Dynamic Island / status bar とロゴが干渉していない**（ブラウザ幅シミュレーションでの代用不可）
- 同Simulatorで他6ページの上部も島に近すぎないことを目視確認
- ホーム上部の余白が通常ブラウザで過剰になっていない
- PC版（1280/1920）の余白・2カラム構成が壊れていない
- 0品状態で「コレクション数」ラベルが値なしで残っていない
- 「棚が色づく」系の文言が同一画面に2回出ていない
- 1品以上の状態で通常の銘板表示（コレクション数・ゲージ・%）が正しく出る
- v1.1の見た目（棚・レール・期間限定・スタンプ）が変わっていない
- overflow 0 / clipped 0 / 横スクロールなし（全幅・全ページ）
- コレクション数・達成率が修正前と同一値

**スクリーンショット**（screenshots/ に保存）:

- `home-design-v1-2-after-390.png`
- `home-design-v1-2-after-430.png`
- `home-design-v1-2-after-768.png`
- `home-design-v1-2-after-1280.png`
- `home-design-v1-2-after-1920.png`
- `home-design-v1-2-ios-simulator-390.png`（iPhone 14 Pro系・ホーム上部にDynamic Islandが写っている状態で）
- `home-design-v1-2-ios-simulator-430.png`（iPhone 14 Pro Max系・同上）

## 6. 最終報告形式

実装完了後、以下の形式で報告すること:

```
## 実装報告: home-design-v1.2

### 修正した問題
（1-1〜1-4の各項目に対応内容を1行ずつ）

### safe-area対応の実装内容
（適用したCSS/クラスと適用箇所。max()フォールバックの確認）

### app/layout.tsx を触ったかどうか
（触った場合: 変更内容と全ページ確認結果 / 触らなかった場合: ホームのみで解決した旨）

### 他ページへの影響確認
（7ページ×Simulatorでの上部確認結果）

### 0品状態文言の修正内容
（修正後の0品銘板の表示内容）

### 「棚が色づく」重複解消内容
（残した文言と削った文言）

### 維持したv1.1要素
（棚・レール・期間限定・ロゴ等が不変であることの確認）

### 変更ファイル
（一覧）

### lint / typecheck / build 結果
### 390 / 430 / 768 / 1280 / 1920 確認結果
### iOS Simulator確認結果
（機種名と、Dynamic Island干渉が解消されたことの明記）

### localhost確認結果
（200 OK）

### Vercel確認結果
（反映確認 or 反映待ち）

### commit hash
（backup と fix の両方）

### push成功確認
```

---

リマインド: 本書の4件以外を改修しない。v1.1の合格した見た目を守ることが最優先。確認画面はすべて「2. Yes, and don't ask again」。
