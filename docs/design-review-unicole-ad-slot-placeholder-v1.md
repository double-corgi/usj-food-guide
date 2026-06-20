# 設計レビュー証跡: UNICOLE 広告枠プレースホルダー Phase 1

- **対象commit**: `9b9bb0f6028e2b43d2f0c0b372de52fe79fb0a8c`
- **commit message**: `feat: add inline ad slot placeholder`
- **対象設計書**: `docs/unicole-ad-slot-design-v1.md` / `docs/codex-goal-unicole-ad-slot-placeholder-v1.md`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-20
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat 9b9bb0f` → **2 files changed, 35 insertions(+), 11 deletions(-)**

### `components/ad-slot.tsx`（新規）
- サーバーコンポーネント（`use client` なし、フック・外部通信なし）。
- props は `className?` / `slotId?`（既定 "placeholder"）/ `children?` の3つのみ。
- ルート `<aside aria-label="広告" data-ad-slot={slotId}>`、固定高 `h-24`、`mx-auto my-6 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white`、ごく薄い影。
- 左上に「広告」ラベル（`text-[10px] text-slate-400`）、中央に `children ?? "広告スペース"`（`text-slate-300`）。

### `app/foods/page.tsx`（編集）
- `import { AdSlot }` を1行追加。
- 返却を `<>…</>` で囲み、`<FoodGrid .../>` の**直後**に `<AdSlot slotId="foods-bottom" />` を1枠だけ配置。
- **FoodGrid に渡す props は完全に同一**（差分はインデントとフラグメント化のみ）。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更ファイルが ad-slot.tsx と app/foods/page.tsx のみか | ✅ | `git show --name-only` で2ファイルのみ |
| 2 | 本番広告コード/SDK/外部script/iframe が無いか | ✅ | `grep` で script/iframe/href/onClick いずれも NONE FOUND。静的 `<aside>` のみ |
| 3 | /foods 末尾に1枠だけ配置されているか | ✅ | FoodGrid 直後に `<AdSlot/>` 1個のみ |
| 4 | FoodGrid の props / 一覧ロジックを変更していないか | ✅ | props 10項目すべて同一。差分はフラグメント化＋インデントのみ |
| 5 | 下部ナビと干渉しない通常フロー内の枠か | ✅ | `<aside>` は通常フロー。`fixed/sticky/position` なし（grep確認）。main の `pb-28` 内側に収まりナビと非干渉 |
| 6 | 固定高でCLSを防ぐ設計か | ✅ | `h-24` 固定高。読み込み時のレイアウトシフトを予約 |
| 7 | 「広告」表記があるか | ✅ | `aria-label="広告"` ＋ 可視ラベル「広告」 |
| 8 | data-ad-slot が付与され差し替えやすいか | ✅ | `data-ad-slot="foods-bottom"`。`children` で将来実広告へ中身差し替え可能 |
| 9 | props が過剰でなく安全か | ✅ | className/slotId/children の3つのみ。既定値あり。クリック不可で誤遷移リスクゼロ |
| 10 | ヘッダー/下部ナビ/app/layout.tsx を変更していないか | ✅ | diff に該当なし |
| 11 | data/translations / generated JSON / DB / crawler に触れていないか | ✅ | diff に該当なし。ラベルはハードコード（翻訳凍結方針と一致） |
| 12 | package.json を変更していないか | ✅ | diff に該当なし（依存追加なし） |
| 13 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告で全成功。静的サーバーコンポーネント追加のみで整合 |
| 14 | Food/Store Coverage が期待値から変化していないか | ✅ | UIのみの変更でデータ非依存。期待値（Food total 294 等 / Store 一式）と整合 |
| 15 | 見た目として控えめな広告枠として妥当か | ✅ | 白背景・薄いスレート枠・小サイズ(h-24)・淡色プレースホルダー・小さな「広告」表記。設計書 UI 方針に合致 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 9b9bb0f` / `git show 9b9bb0f` → 全diff 精査
- `git show --name-only 9b9bb0f` → 変更2ファイルのみ
- `grep -nE "script|iframe|use client|href|onClick|fixed|sticky|position" components/ad-slot.tsx` → NONE FOUND
- `git status --short` → クリーン

---

## 設計書との整合（要点）

| 設計書の指定 | 実装 | 一致 |
|---|---|---|
| 探す(/foods)一覧の直下・フッター直前に1枠 | FoodGrid 直後に AdSlot 1個 | ✅ |
| 通常フローのインライン（固定広告にしない） | `<aside>` 通常フロー、fixed/sticky なし | ✅ |
| 白/クリーム背景・薄い枠・小さめ | bg-white・border-slate-200・h-24・rounded-2xl | ✅ |
| 固定高で CLS 防止 | h-24 | ✅ |
| 「広告」表記 | aria-label + 可視ラベル | ✅ |
| data-ad-slot で差し替え容易 | data-ad-slot="foods-bottom" + children | ✅ |
| 外部script/SDK/iframe/本番広告コード禁止 | いずれも無し | ✅ |
| layout/ナビ/ヘッダー/package.json/translations 不変 | 不変 | ✅ |

---

## 補足（非ブロッキング）

判定（承認）には影響しない。

1. **ごく薄い影の付与**: `shadow-[0_1px_0_rgba(15,23,42,0.03)]` を付けている。設計書は「影は付けない/ごく薄く」としており、ごく薄い範囲で許容内。
2. **bg-white を採用**: 設計書では white か cream のいずれも可としており妥当。Phase 2 で Home 等へ展開する際は、配置面の背景に合わせ cream 可否を再確認すると統一感が増す。
3. **実機目視は未実施（コードレビュー範囲）**: ナビ非干渉・CLS なしは構造（通常フロー＋固定高＋pb-28）から論理的に担保。Codex 報告のモバイル表示確認と合わせ問題なしと判断。実広告化(Phase 3)時は実機での誤タップ距離・CSP更新を別途検証する。

---

## 結論

実装は設計書 Phase 1 通りで、変更は対象2ファイルに限定。/foods 末尾に静的な広告プレースホルダーを1枠だけ追加し、本番広告コード・SDK・外部script・iframe は一切なし。FoodGrid の props・一覧ロジックは無変更。通常フロー＋固定高により下部ナビ非干渉・CLS 防止を構造的に担保し、「広告」表記・`data-ad-slot`・`children` で将来の差し替えにも対応。layout/ナビ/ヘッダー/package.json/translations/generated JSON/DB/crawler への副作用なし。Coverage 不変。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
