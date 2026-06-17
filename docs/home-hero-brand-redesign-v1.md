# Home Hero Brand Redesign v1

**設計書バージョン:** v1
**設計日:** 2026-06-17
**ステータス:** 設計中（Codex /goal 未作成）

---

## 1. Objective

ホームファーストビューの `HomeCollectionHero` 内タイトルブロックを再設計する。

- 現在: `ユニコレ`（shortName）
- 変更後: `ユニバフードコレクション`（name）をメインに、`USJ FOOD COLLECTION` を上品なサブラインとして添える

**目的:**

1. 何のアプリか初見ユーザー（特に海外ユーザー）に伝わる
2. ブランドとしての「格」が出る
3. 毎回ホームを開きたくなる「コレクション感」を強化する
4. ソシャゲ感・SaaS感を出さない

---

## 2. Current State

### 現在のタイトルブロック（`HomeCollectionHero`）

```tsx
<div className="order-1 space-y-1.5 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
  <div className="flex items-center justify-center gap-3 lg:justify-start">
    <span className="h-px w-5 bg-[#fdbb30]" aria-hidden />
    <h1 className="home-unicole-logo select-none text-[1.85rem] font-black leading-none tracking-[0.04em] text-[#071b3a] sm:text-[2rem] lg:text-[2.15rem]">
      {appBrand.shortName}   {/* = "ユニコレ" */}
    </h1>
    <span className="h-px w-5 bg-[#fdbb30]" aria-hidden />
  </div>
  <p className="text-[13px] font-bold leading-6 text-slate-500">{t("footer.tagline")}</p>
</div>
```

**問題点:**

| 問題 | 内容 |
|---|---|
| 情報量不足 | "ユニコレ"だけでは初見ユーザーに何のアプリか伝わらない |
| 海外対応不足 | EN/KO/TW ユーザーが日本語略称を読めない |
| ブランド弱さ | 正式名「ユニバフードコレクション」が使われていない |
| タイトル未活用 | `appBrand.name = "ユニバフードコレクション"` が `lib/constants.ts` に既存なのに使われていない |

### 現在の `lib/constants.ts` `appBrand`

```ts
export const appBrand = {
  name: "ユニバフードコレクション",  // ← 使っていない
  shortName: "ユニコレ",             // ← h1 で使用中
  tagline: "食べた記録が、そのままコレクションになる。",
  ...
}
```

---

## 3. Proposed Hero Copy

### タイトルブロック構成

```
───  USJ FOOD COLLECTION  ───      ← kicker行（全ロケール共通の英字固定ブランド識別子）
ユニバフードコレクション              ← h1（appBrand.name、全ロケール共通の日本語ブランド名）
食べた記録が、そのままコレクションになる。  ← tagline（t("footer.tagline") で i18n済み）
```

### 各要素の役割

| 要素 | 内容 | 変更可否 |
|---|---|---|
| kicker | `USJ FOOD COLLECTION` | 全ロケール固定（英字ブランド識別子） |
| h1 | `appBrand.name` = "ユニバフードコレクション" | 全ロケール固定（日本語ブランド名） |
| tagline | `t("footer.tagline")` | ロケール別翻訳済み（既存キー） |

---

## 4. Title / Subtitle Layout

### モバイル（390px〜 中央揃え）

```
         ─── USJ FOOD COLLECTION ───
         ユニバフードコレクション
         食べた記録が、そのままコレクションになる。
```

### デスクトップ（1080px〜 左揃え・左カラム内）

```
 ─── USJ FOOD COLLECTION ───
 ユニバフードコレクション
 食べた記録が、そのままコレクションになる。
```

### タイポグラフィ仕様

| 要素 | モバイル | sm (640px+) | lg (1024px+) | カラー | フォント |
|---|---|---|---|---|---|
| kicker "USJ FOOD COLLECTION" | `text-[10.5px]` | `text-[11px]` | `text-[11.5px]` | `#8a5b16`（amber） | `font-black tracking-[0.14em]` |
| h1 "ユニバフードコレクション" | `text-[1.4rem]` | `text-[1.6rem]` | `text-[1.75rem]` | `#071b3a`（navy） | `font-black tracking-[0.02em]` |
| tagline | `text-[12px]` | `text-[13px]` | `text-[13px]` | `text-slate-500` | `font-bold` |

**フォントサイズ根拠（モバイル）:**

"ユニバフードコレクション" = 12文字 × 約21px（`1.4rem`）= 約252px
390px viewport − padding 32px = 使用可能幅 358px → 252px ≤ 358px ✅（1行に収まる）

**デスクトップ左カラム幅の根拠:**

`lg:grid-cols-[0.36fr_0.64fr]` + `max-w-[1080px]` + `gap-x-8` → 左カラム ≈ 357px
"ユニバフードコレクション" × `1.75rem`（28px）= 336px ≤ 357px ✅

### gold ラインの配置

現在の `h-px w-5 bg-[#fdbb30]` の gold ラインを **kicker の両端** に移動する。

```tsx
{/* Before: h1 の両端に gold line */}
── ユニコレ ──

{/* After: kicker "USJ FOOD COLLECTION" の両端に gold line */}
── USJ FOOD COLLECTION ──
ユニバフードコレクション
```

これにより:
- kicker が「銘板」のような役割を持ち、上品さが出る
- h1 がより自由に大きく見える
- ブランドのヒエラルキーが視覚的に明確になる

---

## 5. Multilingual Display Policy

### タイトルの言語別挙動

| 要素 | ja | en | ko | zh-TW | 理由 |
|---|---|---|---|---|---|
| kicker "USJ FOOD COLLECTION" | 固定表示 | 固定表示 | 固定表示 | 固定表示 | ブランド識別子（翻訳不要）|
| h1 "ユニバフードコレクション" | 固定表示 | 固定表示 | 固定表示 | 固定表示 | アプリ正式名（翻訳不要）|
| tagline | 食べた記録が... | Your food log... | 먹은 기록이... | （既存翻訳値）| `t("footer.tagline")` 既存対応済み |

**設計方針:**

- アプリ名（ブランド名）は翻訳しない。"Nintendo Switch" が各国語に翻訳されないのと同じ扱い。
- 英字 "USJ FOOD COLLECTION" は全ロケールでそのまま表示することで、非日本語ユーザーでも「USJ のフードアプリ」と即座に理解できる。
- 新規辞書キー追加なし。`appBrand.name`（定数）+ 固定英字文字列 + 既存 `footer.tagline` キーで完結する。

### 各ロケールでのファーストビュー確認観点

| ロケール | kicker | h1 | tagline 幅崩れリスク |
|---|---|---|---|
| ja | USJ FOOD COLLECTION | ユニバフードコレクション | 基準（約340px） |
| en | USJ FOOD COLLECTION | ユニバフードコレクション | "Your food log becomes a collection." ← 英文は長めだが既存挙動と同じ（wrap許容） |
| ko | USJ FOOD COLLECTION | ユニバフードコレクション | "먹은 기록이 그대로 컬렉션이 됩니다." ← 同様 |
| zh-TW | USJ FOOD COLLECTION | ユニバフードコレクション | 繁体字 ← 同様 |

h1 は全ロケールで同一文字列（日本語）のため、ロケール切替による幅変化なし ✅

---

## 6. Visual Direction

### カラー・質感

| 要素 | カラー値 | 理由 |
|---|---|---|
| 背景 | `#fffaf5`（warm paper white） | 既存維持 |
| h1 テキスト | `#071b3a`（Navy） | 既存の `text-ink` と同値、高格感 |
| kicker テキスト | `#8a5b16`（amber） | 既存の `collection.tagline` 行と同色、統一感 |
| gold ライン | `#fdbb30` | 既存維持 |
| tagline テキスト | `text-slate-500` | 既存維持 |

### フィーリングの方向

- **「博物館の銘板」スタイル**: kicker（英字 + gold line）が銘板のような役割を担い、格調を出す
- **ウォーム紙質感**: `#fffaf5` 背景はそのまま維持。アプリ全体のブランドカラーを踏襲
- **タイポグラフィ主役**: 装飾画像や追加イラストは加えない。既存の棚グリッド・銘板チェックマーク・大判レールがすでに視覚的な彩りを担っている
- **余白の確保**: kicker → h1 → tagline の縦方向スペーシングを `space-y-2` 程度に拡張（現在 `space-y-1.5`）

### やらないこと

| NG | 理由 |
|---|---|
| 背景グラデーション追加 | ソシャゲ感・SaaS感が出る |
| 大きな装飾アイコン追加 | 重量感が増す、既存棚との競合 |
| 虹色・多色テキスト | 品格が落ちる |
| アニメーションテキスト | 既存スタンプアニメと競合 |
| "非公式" ラベルを hero に追加 | 設定ページで対応済み、hero に入れると格が落ちる |

---

## 7. First View Information Priority

スクロール前にユーザーが受け取るべき情報の優先順位:

```
1. USJ FOOD COLLECTION        ← 何のアプリ？（海外ユーザーでも即理解）
2. ユニバフードコレクション   ← 正式名（日本語ユーザー用ブランド認識）
3. 食べた記録が、そのままコレクションになる。  ← このアプリで何ができる？
4. 棚グリッド（食べたフードの ✓ マーク）  ← 自分の進捗状況
5. コレクション数・残り品数・プログレスバー  ← 今どこまで来た？
```

この順序は現在のレイアウト（右カラムに棚グリッド、左カラムに統計）と完全に整合している。

---

## 8. Components to Touch

### `components/home-progress-client.tsx` — `HomeCollectionHero` 内タイトルブロックのみ

**変更箇所:** L44〜L55 付近のタイトルブロック

**Before:**

```tsx
<div className="order-1 space-y-1.5 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
  <div className="flex items-center justify-center gap-3 lg:justify-start">
    <span className="h-px w-5 bg-[#fdbb30]" aria-hidden />
    <h1
      className="home-unicole-logo select-none text-[1.85rem] font-black leading-none tracking-[0.04em] text-[#071b3a] sm:text-[2rem] lg:text-[2.15rem]"
    >
      {appBrand.shortName}
    </h1>
    <span className="h-px w-5 bg-[#fdbb30]" aria-hidden />
  </div>
  <p className="text-[13px] font-bold leading-6 text-slate-500">{t("footer.tagline")}</p>
</div>
```

**After:**

```tsx
<div className="order-1 space-y-2 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
  {/* kicker: ブランド識別子（全ロケール共通） */}
  <div className="flex items-center justify-center gap-2.5 lg:justify-start">
    <span className="h-px w-4 shrink-0 bg-[#fdbb30]" aria-hidden />
    <p className="select-none text-[10.5px] font-black tracking-[0.14em] text-[#8a5b16] sm:text-[11px] lg:text-[11.5px]">
      USJ FOOD COLLECTION
    </p>
    <span className="h-px w-4 shrink-0 bg-[#fdbb30]" aria-hidden />
  </div>
  {/* main title: 正式アプリ名（全ロケール共通） */}
  <h1 className="select-none text-[1.4rem] font-black leading-[1.2] tracking-[0.02em] text-[#071b3a] sm:text-[1.6rem] lg:text-[1.75rem]">
    {appBrand.name}
  </h1>
  {/* tagline: i18n済み（footer.tagline） */}
  <p className="text-[12px] font-bold leading-6 text-slate-500 sm:text-[13px]">{t("footer.tagline")}</p>
</div>
```

**変更サマリー:**

| 変更前 | 変更後 | 理由 |
|---|---|---|
| `{appBrand.shortName}` = "ユニコレ" | `{appBrand.name}` = "ユニバフードコレクション" | 正式名を使用 |
| gold line が h1 の両端 | gold line が kicker の両端 | ヒエラルキー明確化 |
| kicker なし | "USJ FOOD COLLECTION" を kicker 追加 | 海外ユーザー対応 |
| `text-[1.85rem]` h1 | `text-[1.4rem] sm:text-[1.6rem] lg:text-[1.75rem]` | 文字数増加に対応 |
| `space-y-1.5` | `space-y-2` | 3要素になるため縦方向余白を調整 |
| `home-unicole-logo` クラス残留 | クラス削除 or そのまま | スタイルに影響なければ削除可 |

---

## 9. Components Not to Touch

以下は変更禁止（理由を明記）:

| ファイル | 変更禁止理由 |
|---|---|
| `lib/constants.ts` | `appBrand.name` はすでに "ユニバフードコレクション" — 変更不要 |
| `lib/i18n/dictionaries.ts` | 新規キー追加不要（固定文字列 + 既存キーで完結） |
| `app/page.tsx` | Server Component、今回の変更と無関係 |
| `components/home-dashboard.tsx` | 棚・大判レール・期間限定コレクションを壊さない |
| `components/app-header.tsx` | bottom-nav・language-switcher は承認済み |
| `lib/store-utils.ts` | 店舗ID衝突修正 v1.1 保護 |
| `lib/food-utils.ts` | Phase C 保護 |
| `lib/i18n/format-price.ts` 等 | Phase C 保護 |
| `components/area-urgency-label.tsx` 等 | Phase C 保護 |
| generated JSON / DB / crawler | 変更禁止 |

### `HomeCollectionHero` 内で変更しない部分

- コレクション数・プログレスバー・残り品数（L57〜L85）: 変更なし
- 棚グリッド（L87〜L118）: 変更なし
- `collection.tagline`「食べると、棚が色づく。」（L88）: 変更なし
- `useFoodLogs`・`calculateCompletion`・`pickShelfFoods` ロジック: 変更なし

---

## 10. Risks

### R1: モバイルでのタイトル折り返し

- リスク: 375px（iPhone SE）で "ユニバフードコレクション" が2行になる可能性
- 根拠: 12文字 × ~21px（1.4rem）= 252px。375px − 32px padding = 343px → 余裕あり ✅
- 対応: `text-[1.4rem]` で収まるが、念のため Codex は390px・375px両方でスクリーンショット確認

### R2: kicker 幅が tiny 端末で gold line を圧迫

- リスク: "USJ FOOD COLLECTION" (20文字)が狭い端末で gold line を押しつぶす
- 対応: gold line を `w-4`（16px）まで短縮 + `shrink-0` で固定 → 文字列が広がっても line が消えない

### R3: desktop 左カラムでの h1 overflow

- リスク: `0.36fr` カラムが狭い場合に "ユニバフードコレクション" が溢れる
- 対応: `lg:text-[1.75rem]` = 336px < 357px カラム幅。溢れない ✅。万一のため `break-words` または `overflow-hidden` をフォールバックで付与可

### R4: EN ロケールで tagline が3行になりファーストビューが縦に伸びる

- リスク: "Your food log becomes a collection." が折り返しで3行になる（既存の挙動）
- 現状: `leading-6` で折り返しは許容済み。今回の変更で悪化しない
- 対応: 仕様通り。今回は変更なし

### R5: `home-unicole-logo` カスタムクラス削除の影響

- リスク: `home-unicole-logo` が外部CSS（Tailwind config や global.css）で参照されている可能性
- 対応: Codex は変更前に `grep -rn "home-unicole-logo"` で参照箇所を確認し、参照がなければ削除可

### R6: `HomeActiveFoodCollection` 内の固定日本語（Phase C+ 残存）

- リスク: `home-progress-client.tsx` L136〜L156 に `"すべて見る"` / `"登録済みコレクションへ"` 等の固定日本語が残っている
- これは今回の変更スコープ外
- 申し送り: Phase D（home-dashboard i18n 化）で対応予定

### R7: `getHomeFoodChip` の `getSaleUrgencyLabel` 残存

- リスク: L448 `const urgency = getSaleUrgencyLabel(food)` が日本語文字列を返す（Phase C で未対応）
- これは今回の変更スコープ外
- 申し送り: Phase C+（home-progress-client.tsx 日本語ラベル対応）で対応予定

---

## 11. Stop and Ask Conditions

以下の状況になったら作業を停止してレビュー担当に確認すること。

1. `appBrand.name` 以外のアプリ名文字列を新たに追加しようとした場合
2. `lib/constants.ts` の `appBrand` オブジェクトを変更しようとした場合
3. `lib/i18n/dictionaries.ts` に新規キーを追加しようとした場合（追加不要なはず）
4. `HomeCollectionHero` の棚グリッド（`order-2` ブロック）を変更しようとした場合
5. `HomeCollectionHero` のコレクション数・プログレスバー（`order-3` ブロック）を変更しようとした場合
6. `components/home-dashboard.tsx` に手を入れようとした場合
7. `components/app-header.tsx` に手を入れようとした場合
8. `lib/food-utils.ts` を変更しようとした場合
9. "USJ FOOD COLLECTION" を辞書に入れてロケール別に翻訳しようとした場合（翻訳不要）
10. kicker テキストを `t()` 経由にしようとした場合（固定英字文字列のため不要）

---

## 12. Verification Plan

### 12-1. lint / typecheck / build

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### 12-2. grep 確認

```bash
# appBrand.shortName の使用が HomeCollectionHero から消えていること
grep -n "appBrand.shortName" components/home-progress-client.tsx

# appBrand.name が HomeCollectionHero で使われていること
grep -n "appBrand.name" components/home-progress-client.tsx

# home-unicole-logo の参照がなければ削除済みであること
grep -rn "home-unicole-logo" .

# 辞書に新規キーが増えていないこと（home.hero系の追加がないこと）
grep -n '"home\.hero' lib/i18n/dictionaries.ts
```

期待結果:

- `appBrand.shortName` → 0件（または HomeCollectionHero 以外の場所のみ）
- `appBrand.name` → 1件以上（HomeCollectionHero 内）
- `home.hero` → 0件（新規キー追加なし）

### 12-3. スクリーンショット確認

| ファイル名 | 確認内容 |
|---|---|
| `home-hero-ja-390.png` | ja設定 390px: "USJ FOOD COLLECTION" kicker + "ユニバフードコレクション" h1 が1行で収まる |
| `home-hero-en-390.png` | en設定 390px: 同上。tagline が "Your food log becomes a collection." |
| `home-hero-ko-390.png` | ko設定 390px: 同上。tagline が韓国語 |
| `home-hero-zh-390.png` | zh-TW設定 390px: 同上。tagline が繁体字 |
| `home-hero-ja-1280.png` | ja設定 1280px desktop: 左カラムでタイトルが2行にならない |
| `home-hero-ja-375.png` | ja設定 375px (iPhone SE): h1 が1行に収まること |

### 12-4. 動作確認チェックリスト

- [ ] ja 設定でファーストビューに "USJ FOOD COLLECTION" が表示される
- [ ] ja 設定でファーストビューに "ユニバフードコレクション" が表示される（h1）
- [ ] en 設定でも "USJ FOOD COLLECTION" が変わらず表示される
- [ ] en/ko/zh-TW 設定でも "ユニバフードコレクション" が変わらず表示される
- [ ] tagline がロケール別に翻訳されている（existing動作維持）
- [ ] 棚グリッド（食べた ✓ マーク）が正常
- [ ] コレクション数・プログレスバーが正常
- [ ] 棚なし状態（初回）での `collection.firstBite` 表示が正常
- [ ] gold ラインが kicker 両端に表示される
- [ ] h1 が390px で1行に収まる
- [ ] bottom-nav が正常（Phase A 維持）
- [ ] language-switcher が正常（Phase A 維持）
- [ ] overflow: 0 / clipped: 0 / 横スクロール: 0

---

## 13. Recommended Codex /goal Direction

（Codex /goal は今回作成しない。方向性メモとして記載）

### 変更ファイル（1ファイルのみ）

- `components/home-progress-client.tsx` — `HomeCollectionHero` 内タイトルブロックのみ

### 変更内容の規模

- 削除: 約8行
- 追加: 約10行
- ロジック変更: なし
- 辞書変更: なし
- 型変更: なし

### /goal に含めるべき制約

1. `HomeCollectionHero` のタイトルブロック（L44-55付近）**のみ**変更すること
2. `lib/constants.ts`・`lib/i18n/dictionaries.ts` は変更しないこと
3. 変更前に `grep -rn "home-unicole-logo" .` で参照を確認すること
4. Step A（変更）→ Step B（lint/typecheck/build）→ Step C（grep確認）→ Step D（スクリーンショット6枚）の順で実施
5. `HomeCollectionHero` の `order-2`（棚グリッド）・`order-3`（統計）ブロックは一切変更しないこと
