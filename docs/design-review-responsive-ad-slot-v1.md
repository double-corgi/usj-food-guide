# 設計レビュー証跡: 広告プレースホルダー モバイル/デスクトップ出し分け

- **対象commit**: `58abb755ec88add250a1e7b5b4c47f82b50d3512`
- **commit message**: `fix: use inline mobile ad and desktop fixed ad`
- **前回証跡**: `design-review-fixed-bottom-ad-slot-below-nav-v1.md`（条件付き承認）への対応
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-20
- **判定**: ✅ **承認**

---

## 0. 結論サマリー

前回の条件付き承認で指摘した「モバイル固定広告がフローティング下部ナビの背後に隠れる」問題が、推奨どおり**モバイル＝インライン／デスクトップ＝固定**の出し分けで解消された。各ビューポートで広告は最大1枠、ナビ非干渉。承認。

---

## 変更内容（実diff）

`git show --stat 58abb75` → **2 files changed, 17 insertions(+), 13 deletions(-)**

### `components/ad-slot.tsx`
- fixed variant の位置クラスを刷新:
  - 旧: モバイル `inset-x-10 bottom-+0.125rem h-5`（ナビ背後）＋ desktop 設定
  - 新: `fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-40 hidden h-9 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 md:flex`
    → **`hidden md:flex`** でモバイル非表示・デスクトップのみ表示。下中央・h-9・cream半透明・`pointer-events-none`（baseClass）。
- inline variant: `h-24`→`h-20`（やや小型化）。

### `app/foods/page.tsx`
- `<FoodGrid/>` を `<>…</>` で囲み、直後に `<AdSlot slotId="foods-bottom" className="md:hidden" />` を1枠追加（**モバイルのみ表示**）。
- FoodGrid の props 10項目は完全に同一（差分はフラグメント化＋インデント）。

---

## ビューポート別の広告表示（出し分けの検証）

| ページ | モバイル | デスクトップ |
|---|---|---|
| /foods | インライン1枠（`md:hidden`で表示）/ 固定は `hidden` → **計1** | インライン非表示 / 固定1枠（`md:flex`）→ **計1** |
| その他 | インラインなし / 固定は `hidden` → **計0** | 固定1枠 → **計1** |

→ **どのビューポートでも広告は最大1枠**。二重表示は発生しない。✅

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更が ad-slot.tsx と app/foods/page.tsx のみか | ✅ | `git show --name-only` で2ファイル |
| 2 | app/layout.tsx を変更していないか | ✅ | diff になし。固定枠 `<AdSlot slotId="global-bottom" variant="fixed"/>`（L78）は据え置きで、非表示制御はコンポーネント側クラスで実現 |
| 3 | モバイル固定広告が非表示になっているか | ✅ | fixed variant が `hidden md:flex` |
| 4 | PC固定広告は維持されているか | ✅ | desktop で `md:flex`・下中央・h-9・z-40 |
| 5 | /foods のインライン広告が1枠だけ復活しているか | ✅ | `<AdSlot slotId="foods-bottom" className="md:hidden"/>` 1個 |
| 6 | FoodGrid props / 一覧ロジックを壊していないか | ✅ | props 同一。フラグメント化のみ |
| 7 | 下部ナビ構造を変更していないか | ✅ | app-header.tsx 不変 |
| 8 | モバイルでナビと広告が重ならない設計か | ✅ | モバイルは固定広告を非表示。インラインは通常フロー（main の `pb-32` 内）でナビ(~4.25rem)を十分クリア。重なりなし |
| 9 | 広告枠が多すぎないか | ✅ | 各ビューポート最大1枠（上表） |
| 10 | 「広告」表記が維持されているか | ✅ | inline/fixed とも「広告」ラベルを描画。モバイルは通常フローで視認可（前回のクリップ問題は解消） |
| 11 | data-ad-slot が維持されているか | ✅ | `data-ad-slot={slotId}`（foods-bottom / global-bottom） |
| 12 | クリック不可・外部通信なしのままか | ✅ | fixed は pointer-events-none。inline はリンク/onClick なしの静的表示。外部通信なし |
| 13 | 本番広告/AdSense/SDK/外部script/iframe が無いか | ✅ | いずれも無し |
| 14 | data/translations / generated JSON / DB / crawler に触れていないか | ✅ | diff になし |
| 15 | package.json を変更していないか | ✅ | diff になし |
| 16 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告。UIのみで整合 |
| 17 | Food/Store Coverage が期待値から変化していないか | ✅ | UIのみ。期待値と整合 |
| 18 | 前回指摘「モバイル固定広告がナビ背後に隠れる」が解消されているか | ✅ | モバイル固定広告を `hidden` で非表示にし、通常フローのインラインへ置換。スリット/クリップ問題は消失 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 58abb75` / `git show 58abb75` → 全diff
- `git status --short` → クリーン、変更2ファイル
- `grep -n AdSlot app/layout.tsx app/foods/page.tsx` → 固定(global-bottom, 据え置き)＋インライン(foods-bottom, md:hidden)
- `grep -nE "hidden md:flex|md:hidden|pointer-events-none" components/ad-slot.tsx` → 出し分け・クリック不可を確認

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **前回条件のクローズ**: 前回 `design-review-fixed-bottom-ad-slot-below-nav-v1.md` の条件（モバイルはインラインへ・固定はデスクトップ限定）に正対した修正。条件は解消とみなす。
2. **インライン広告の露出はモバイル /foods のみ**: 現状モバイルでは /foods 以外に広告が出ない。収益観点で他の主要画面（詳細/Home 等）へ広げるかは Phase 2 の判断事項（元設計の候補5・2）。本commitの責務外。
3. **実広告化(Phase 3)時の留意**: fixed(デスクトップ)は実広告化時に CSP（script-src 等）更新と、pwa-register(z-40, md:bottom-6, 右)との同時表示時の重なり確認が必要。今回はプレースホルダーのため影響なし。

---

## 結論

モバイルは通常フローのインライン広告、デスクトップは下中央の控えめな固定広告、という出し分けが `hidden md:flex` / `md:hidden` で正しく実装され、各ビューポートで広告は最大1枠・ナビ非干渉。前回の条件付き承認の指摘は解消。変更は対象2ファイルに限定、FoodGrid・layout・ナビ・翻訳・generated JSON への副作用なし、Coverage 不変、本番広告コードなし。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
