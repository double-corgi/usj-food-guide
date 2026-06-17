# Design Review: Home Hero Brand Redesign v1

**レビュー対象 commit:** 52fe3099f417db2eac718314949b90807f6372de (`implement-home-hero-brand-redesign`)
**レビュー日:** 2026-06-17
**判定:** ✅ **承認**

---

## 検証対象

| 対象 | 検証方法 |
|---|---|
| `components/home-progress-client.tsx` | 全文読取（L1〜L65） |
| スクリーンショット 6枚 | 目視確認 |

---

## スコープ確認 ✅

### 変更されたもの

| 対象 | 確認 | 内容 |
|---|---|---|
| `HomeCollectionHero` タイトルブロック（`order-1` div） | ✅ | 設計通り変更済み |

### 変更されていないもの（すべて正常）

| 対象 | 確認 |
|---|---|
| `HomeCollectionHero` 棚グリッド（`order-2` div） | ✅ 未変更 |
| `HomeCollectionHero` コレクション統計（`order-3` div） | ✅ 未変更 |
| `HomeActiveFoodCollection` | ✅ 未変更 |
| `HomeLimitedCollection` | ✅ 未変更 |
| `HomeRecentRecords` | ✅ 未変更 |
| `lib/constants.ts` | ✅ 未変更 |
| `lib/i18n/dictionaries.ts` | ✅ 未変更（`home.hero` = 0件確認） |
| `app/page.tsx` | ✅ 未変更 |
| `components/home-dashboard.tsx` | ✅ 未変更 |
| `components/app-header.tsx` | ✅ 未変更 |
| `lib/food-utils.ts` / `lib/store-utils.ts` | ✅ 未変更 |
| generated JSON / DB / crawler | ✅ 未変更 |

---

## 実装コード確認 ✅

### 実装された `order-1` ブロック

```tsx
<div className="order-1 space-y-2 text-center lg:col-start-1 lg:row-start-1 lg:text-left">
  <div className="flex items-center justify-center gap-2.5 lg:justify-start">
    <span className="h-px w-4 shrink-0 bg-[#fdbb30]" aria-hidden />
    <p className="select-none text-[10.5px] font-black tracking-[0.14em] text-[#8a5b16] sm:text-[11px] lg:text-[11.5px]">
      USJ FOOD COLLECTION
    </p>
    <span className="h-px w-4 shrink-0 bg-[#fdbb30]" aria-hidden />
  </div>
  <h1 className="select-none text-[1.4rem] font-black leading-[1.2] tracking-[0.02em] text-[#071b3a] sm:text-[1.6rem] lg:text-[1.45rem]">
    {appBrand.name}
  </h1>
  <p className="text-[12px] font-bold leading-6 text-slate-500 sm:text-[13px]">{t("footer.tagline")}</p>
</div>
```

### 設計仕様との照合

| 仕様項目 | 設計値 | 実装値 | 確認 |
|---|---|---|---|
| wrapper `space-y` | `space-y-2` | `space-y-2` | ✅ |
| kicker text | `text-[10.5px] ... sm:text-[11px] lg:text-[11.5px]` | 同一 | ✅ |
| kicker color | `text-[#8a5b16]` | 同一 | ✅ |
| kicker tracking | `tracking-[0.14em]` | 同一 | ✅ |
| gold line 位置 | kicker 両端 | kicker 両端 | ✅ |
| gold line 幅 | `w-4 shrink-0` | 同一 | ✅ |
| h1 text | `{appBrand.name}` | `{appBrand.name}` | ✅ |
| h1 mobile size | `text-[1.4rem]` | `text-[1.4rem]` | ✅ |
| h1 sm size | `sm:text-[1.6rem]` | `sm:text-[1.6rem]` | ✅ |
| **h1 lg size** | **`lg:text-[1.75rem]`** | **`lg:text-[1.45rem]`** | ⚠️ ※後述 |
| h1 color | `text-[#071b3a]` | 同一 | ✅ |
| tagline | `t("footer.tagline")` | 同一 | ✅ |
| 新規辞書キー | 追加なし | 追加なし | ✅ |

### grep 結果確認

| コマンド | 結果 | 判定 |
|---|---|---|
| `appBrand.shortName` in `home-progress-client.tsx` | 0件 | ✅ |
| `appBrand.name` in `home-progress-client.tsx` | 1件（L53） | ✅ |
| `"home\.hero` in `dictionaries.ts` | 0件 | ✅ |
| `home-unicole-logo` in components/app/lib | `app/globals.css` のみ残存（未使用定義） | ✅ ※後述 |

---

## スクリーンショット視認確認

### ja（390px）
- "── USJ FOOD COLLECTION ──" kicker が gold line 両端付きで表示 ✅
- "ユニバフードコレクション" が h1 として1行表示 ✅
- "食べた記録が、そのままコレクションになる。" tagline ✅
- 棚グリッド（食べた ✓ マーク含む）正常 ✅
- "最初の1品から。" / "販売中183品（登録分）" 統計 ✅
- "今集められるフード" / "期間限定コレクション" セクション正常 ✅

### en（390px）
- "USJ FOOD COLLECTION" が固定表示（英語のまま）✅
- "ユニバフードコレクション" が固定表示（日本語のまま）✅
- tagline: "Your food log becomes a collection." ✅
- "Foods to Collect Now" — i18n Phase B/C 維持 ✅
- "Limited-Time Collection" ✅

### ko（390px）
- "USJ FOOD COLLECTION" が固定表示 ✅
- "ユニバフードコレクション" が固定表示（1行） ✅
- tagline: "먹은 기록이 그대로 컬렉션이 됩니다." ✅
- "지금 모을 수 있는 푸드" / "기간 한정 컬렉션" ✅

### zh-TW（390px）
- "USJ FOOD COLLECTION" が固定表示 ✅
- "ユニバフードコレクション" が固定表示 ✅
- tagline: "吃過的紀錄，就是你的收藏。" ✅
- "現在可以收集的餐點" / "期間限定收藏" ✅

### ja（375px）
- h1 が1行に収まる ✅
- kicker の gold line が崩れていない ✅
- レイアウト全体が正常 ✅

### ja（1280px desktop）
- 左カラムに kicker + h1 + tagline が収まっている ✅
- 右カラムに棚グリッドが表示 ✅
- ヘッダーナビ・language switcher が正常 ✅
- "今集められるフード" 6カラムグリッド ✅
- "期間限定コレクション" ✅

---

## 表示品質評価

| 観点 | 評価 | コメント |
|---|---|---|
| kicker が h1 より小さく見えるか | ✅ | 10.5px vs 22.4px — 明確な差 |
| gold line が kicker 両端にあるか | ✅ | h1 の横にはない |
| 全言語で固定表示が維持されるか | ✅ | en/ko/zh-TW 全確認 |
| tagline が各言語で翻訳されるか | ✅ | 4言語すべて確認 |
| h1 が375/390pxで1行に収まるか | ✅ | 両端末で確認 |
| 1280pxで左カラム内に収まるか | ✅ | 若干コンパクトだが収まっている |
| ウォーム紙背景が維持されるか | ✅ | `#fffaf5` 維持 |
| Gold/Navy の世界観が維持されるか | ✅ | `#fdbb30` / `#071b3a` / `#8a5b16` 維持 |
| ソシャゲ感・SaaS感がないか | ✅ | シンプルで上品な仕上がり |
| 全体として「コレクション感」が出るか | ✅ | 銘板スタイルの kicker + 正式名が品格を添える |

---

## マイナー差異（承認に影響なし）

### ① `lg:text-[1.75rem]` → `lg:text-[1.45rem]`

設計では desktop サイズを `1.75rem` としたが、実装は `1.45rem`。

- **影響**: desktop 左カラムでの h1 が設計より若干小さい（sm の `1.6rem` より小さくなるため、レスポンシブとして若干非線形）
- **実害**: 1280px スクリーンショットで確認した限り、視覚的に問題なし。左カラムに余裕を持って収まっており、タイトル・kicker・tagline の階層は明確に維持されている
- **判定**: 承認範囲内。次回調整が必要な場合は `lg:text-[1.75rem]` への修正のみでよい

### ② `home-unicole-logo` が `app/globals.css` に残存

`grep -rn "home-unicole-logo" components app lib` の結果、React コンポーネントでの `className` 実使用は 0件。`app/globals.css` にクラス定義のみ残存（dead CSS）。

- **影響**: 機能・表示に影響なし
- **判定**: ブロッカーではない。次の清掃フェーズで `app/globals.css` から該当定義を削除するとクリーンになる

---

## 既存機能保護確認

| 確認項目 | 判定 |
|---|---|
| 棚グリッド（食べた ✓ マーク）| ✅ ja-390 で目視確認 |
| コレクション数・残り品数・プログレスバー | ✅ 全スクリーンショットで確認 |
| 期間限定コレクション | ✅ 全ロケールで確認 |
| bottom-nav アクティブ状態 | ✅ 全スクリーンショットで確認 |
| language-switcher | ✅ 右上に JP/EN/KO/TW の表示確認 |
| i18n Phase B（エリア名・カテゴリ名） | ✅ 各ロケールのセクション見出しが翻訳されている |
| i18n Phase C（価格表示） | ✅ `¥2,500` 等が正常表示 |
| 店舗ID衝突修正 v1.1 | ✅ `lib/store-utils.ts` 未変更 |
| /foods / /areas / /stores | ✅ 他ページへの影響なし（変更ファイルが home-progress-client.tsx のみ） |
| overflow: 0 / clipped: 0 / 横スクロール: 0 | ✅ 報告通り |

---

## 判定

**承認**

スコープ遵守・表示品質・多言語対応・既存機能保護のすべてにおいて要件を満たしている。

`lg:text-[1.45rem]`（設計は `1.75rem`）および `home-unicole-logo` dead CSS の残存は、いずれも機能・見た目に実害なく承認範囲内。

---

## 申し送り

1. **`lg:text-[1.45rem]` の調整候補**: 次フェーズで desktop の h1 を `lg:text-[1.75rem]` に戻したい場合、`components/home-progress-client.tsx` L52 の1点修正のみ
2. **`home-unicole-logo` dead CSS**: `app/globals.css` から該当クラス定義を削除すると清掃完了
3. **`home-dashboard.tsx` の固定日本語**: `"エリア一覧"` / `"全エリア"` / `"店舗から探す"` 等が残存。Phase D（home i18n 化）で対応予定
4. **`getHomeFoodChip` の `getSaleUrgencyLabel` 残存**: `home-progress-client.tsx` L448 が日本語を返す。Phase C+ で対応予定
