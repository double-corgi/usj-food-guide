# design-review: bottom-nav-and-language-switcher-v1

- 対象commit: `66b73a7701cdead1c3b7042f772cfbe60e29f54d`
- 対象goal: `docs/codex-goal-bottom-nav-and-language-switcher-v1.md`
- レビュー日: 2026-06-16
- 担当: Claude (UXデザイナー / レビュー担当)

---

## 判定

**条件付き承認**

コード実装は仕様通り正しい。ただし本番 `/stores` が store-id-collision-fix v1.1 リグレッション状態を示している。ローカルの `lib/store-utils.ts` に修正コードは残存しており、Vercelデプロイタイミング問題（同プロジェクトで過去2回確認済み）と判断するが、本番でのデプロイ完了後に必ず再確認が必要。

---

## コードレビュー

### 変更対象ファイル

#### ✅ `components/app-header.tsx`

| 確認項目 | 仕様 | 実装 | 判定 |
|---|---|---|---|
| `usePathname` import | `next/navigation` から import | L5: 追加済み | ✅ |
| `isNavActive` 関数 | `/` は完全一致、他は prefix match | L24-27: 正しく実装 | ✅ |
| active クラス | `bg-mint text-park` | L86: 一致 | ✅ |
| inactive クラス | `text-slate-500 hover:bg-white/70 active:bg-mint` | L86: 一致 | ✅ |
| `aria-current="page"` | active 時のみ付与 | L84: `active ? "page" : undefined` | ✅ |
| nav 背景 | `bg-white/94` | L76: 一致（`/86`→`/94`変更済み） | ✅ |
| nav border | `border-slate-200/60` | L76: 一致（`border-white/80`→変更済み） | ✅ |
| desktop 言語 select | `JP — 日本語` 形式 | L64: `{localeShortLabels[loc]} — {localeLabels[loc]}` | ✅ |
| `safe-area-inset-bottom` | `bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]` | L76: 一致 | ✅ |

**軽微な指摘（非ブロッキング）:**  
L75: `<nav aria-label={t("nav.home")}>` — `aria-label` にナビゲーション先頭項目の翻訳 `"ホーム"` が入っている。aria-label はナビゲーション領域を説明するラベルであり、`"ホーム"` は誤解を招く可能性がある。`"メインナビゲーション"` 相当の固定文字列またはキーが望ましい。次フェーズで辞書に `nav.label` キーを追加して対応することを推奨。**今回のブロッキング要因にはしない。**

---

#### ✅ `components/mobile-language-badge.tsx`（新規）

| 確認項目 | 仕様 | 実装 | 判定 |
|---|---|---|---|
| 外側 div | `mb-2 flex justify-end md:hidden` | L18: 一致 | ✅ |
| 内側 div | `relative inline-flex` | L19: 一致 | ✅ |
| Globe2 icon | `absolute left-2 top-1/2 -translate-y-1/2` の内側 span | L37: 内側 div 配下 → 正しい位置 | ✅ |
| ▼ chevron | `absolute right-2 top-1/2 -translate-y-1/2` | L40: 一致 | ✅ |
| `md:hidden` | デスクトップで非表示 | L18: 外側 div に付与 | ✅ |
| `setLocale` 呼び出し | `useLocale` 経由 | L15, L23: 正しく使用 | ✅ |
| `aria-label="Language"` | select に付与 | L29: 一致 | ✅ |

以前レビューで指摘した「外側を `relative` にすると Globe2 がスクリーン左端に飛ぶ」問題: 内側 `relative inline-flex` に正しく修正されている。

---

#### ✅ `app/layout.tsx`

| 確認項目 | 仕様 | 実装 | 判定 |
|---|---|---|---|
| import 追加 | `MobileLanguageBadge` | L6: 追加済み | ✅ |
| 配置 | `<main>` 内、`{children}` より前 | L71: `<MobileLanguageBadge />` が `{children}` の直前 | ✅ |
| 構造の破壊なし | 既存レイアウト維持 | LocaleProvider / AppHeader / AppFooter 等そのまま | ✅ |

---

#### ✅ `lib/i18n/use-locale.tsx`（変更不要、確認のみ）

- L40: `document.documentElement.lang = locale` — `useEffect` 内で設定済み
- L46: `document.documentElement.lang = safeLocale` — `setLocale` 内でも設定済み
- 追加実装不要。Codex が変更していないことを確認した。✅

---

## 本番確認

### ✅ ホーム (`/`)

- HTTP 200、正常なHTML返却を確認

### ⚠️ `/stores` — store-id-collision-fix v1.1 リグレッション検出

本番 `/stores` から取得したhref一覧:

| 指標 | 今回 (post bottom-nav commit) | 承認時 (store-id-fix v1.1) | 差分 |
|---|---|---|---|
| 総件数 | 63件 | 63件 | — |
| ユニーク件数 | 54件 | 63件 | **-9件** |
| `shop-1tt48e8` 重複 | 8件 | 1件 | **❌ +7件** |
| `shop-56paaa` 重複 | 2件 | 1件 | **❌ +1件** |
| `shop-店舗未確認` 重複 | 2件 | 0件 | **❌ +2件** |
| 非ASCII hrefs | 7件 | 0件 | **❌ +7件** |

**検出された非ASCII hrefs:**
- `shop-ホッグズ-ヘッド-パブ`
- `shop-三本の箒tm`
- `shop-低アレルゲンメニュー取扱レストラン`
- `shop-アズーラ・ディ・カプリ`
- `shop-フィネガンズ・バー＆グリル`
- `shop-ピンクカフェ`
- `shop-店舗未確認`（×2）

**承認時に確認した15件のASCII固有ID（全消滅）:**
- `shop-1tt48e8-restaurant-122iqw`, `shop-restaurant-tzbeu2`, `shop-tm-restaurant-185mjs`
- `shop-restaurant-bvcqff`, `shop-tm-unknown-1fbywg`, `shop-1tt48e8-restaurant-15jvt6`
- その他9件

### 原因分析

ローカルの `lib/store-utils.ts` を確認した結果:
- `resolveStoreDisplayIds()`: L326-373 **存在する ✅**
- `isAsciiSafeStoreId()`: L403-405 **存在する ✅**
- `normalizeAsciiSlug()`: L407-416 **存在する ✅**

今回の変更対象3ファイル（`app-header.tsx`, `mobile-language-badge.tsx`, `layout.tsx`）は `lib/store-utils.ts` を**一切変更していない**。

**結論:** ローカルコードは正常。本番リグレッションは Vercel デプロイタイミング問題の可能性が高い（同プロジェクトでの発生パターン: v1 レビュー時・v1.1 初回確認時、計2回）。ただし、確証を得るには Vercel デプロイ完了後の再確認が必要。

---

## 条件付き承認の条件

以下を本番で確認した時点で **承認** に昇格:

1. `/stores` で `shop-1tt48e8` が **1件のみ**であること
2. `/stores` で `shop-店舗未確認` が **0件**であること
3. `/stores` で 非ASCII hrefs が **0件**であること
4. 承認時に存在した15件のASCII固有ID（例: `shop-restaurant-tzbeu2`, `shop-tm-restaurant-185mjs` 等）が**復活していること**

---

## 推奨アクション

1. **Vercel のデプロイ完了を待つ**（コミット `66b73a7` のビルドが完了しているかを Vercel ダッシュボードで確認）
2. 完了後に本番 `/stores` を再フェッチし、上記4条件を確認
3. 確認できた場合は `final-review-bottom-nav-and-language-switcher-v1.md` を作成して **承認** を記録
4. 確認できない場合（本番が依然としてリグレッション状態）は、Codex に対して git ブランチ状態の確認と `lib/store-utils.ts` が commit に含まれているかを検証させること

---

## 次フェーズについて

本承認確定後に Phase B（エリア名・カテゴリ名多言語化）の設計へ進む。

`aria-label` の軽微な修正（`nav.label` キー追加）は Phase B の辞書拡張タスクにまとめて含めることを推奨する。
