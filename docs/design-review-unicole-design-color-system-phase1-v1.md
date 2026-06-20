# 設計レビュー証跡: UNICOLE デザインカラーシステム Phase 1

- **対象commit**: `1083701e9e03951707cfbcfc0117ff00948096e7`
- **commit message**: `feat: apply USJ blue color system phase 1`
- **対象設計書**: `docs/unicole-design-color-system-v1.md` / `docs/codex-goal-unicole-design-color-system-v1.md`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-20
- **判定**: ✅ **承認**

---

## 変更内容（実diff）

`git show --stat 1083701` → **7 files changed, 9 insertions(+), 7 deletions(-)**

| ファイル | 変更 |
|---|---|
| `tailwind.config.ts` | `cream: "#fffaf5"` / `sand: "#e7dccb"` を追加（他トークン無変更） |
| `app/globals.css` | body `color: #18212f` → `#071b3a` |
| `components/food-card.tsx` | 未食べCTA `bg-ink` → `bg-park` |
| `components/food-detail.tsx` | 未食べCTA `bg-ink` → `bg-park` |
| `components/app-footer.tsx` | 「食品を探す」CTA `bg-ink` → `bg-park` |
| `components/food-grid.tsx` | 「もっと見る」`bg-ink` → `bg-park` |
| `components/completion-meter.tsx` | 進捗バー `bg-berry` → `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]` |

いずれも className / トークン値の変更のみで、ロジック・props・JSX構造への変更なし。

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更ファイルが指定7ファイルのみか | ✅ | `git show --stat` で7ファイル、すべて対象一致。対象外ファイルへの変更なし |
| 2 | `tailwind.config.ts` に cream / sand が正しく追加されているか | ✅ | `cream: "#fffaf5"`・`sand: "#e7dccb"` を確認。設計書 3-2 と一致 |
| 3 | `app/globals.css` の body color が `#071b3a` か | ✅ | `color: #071b3a`（ink統一）を確認 |
| 4 | `text-ink` を不要に変更していないか | ✅ | diff に `text-ink` 変更なし。各コンポーネントで文字色として継続使用を確認 |
| 5 | food-card.tsx のCTAが `bg-park` か | ✅ | 三項の両分岐が `bg-park text-white`。未食べボタンが park 化 |
| 6 | food-detail.tsx のCTAが `bg-park` か | ✅ | 未食べボタン `bg-park text-white` を確認 |
| 7 | app-footer.tsx のCTAが `bg-park` か | ✅ | 「食品を探す」リンク `bg-park` を確認 |
| 8 | food-grid.tsx の「もっと見る」が `bg-park` か | ✅ | L342 loadMore ボタン `bg-park` を確認 |
| 9 | completion-meter.tsx の進捗バーが blue→gold グラデか | ✅ | `bg-[linear-gradient(90deg,#0057b8,#fdbb30)]`。設計書 3-4 の指定値と完全一致 |
| 10 | 限定/終売バッジ用途の `bg-berry` を壊していないか | ✅ | `berry` トークン保持。food-detail（限定/緊急バッジ）・food-card・recommendation-rail の `bg-berry` 用途は無変更 |
| 11 | Homeカルーセルを変更していないか | ✅ | diff に該当なし |
| 12 | ヘッダー・下部ナビを変更していないか | ✅ | diff に `app-header` / ナビ該当なし |
| 13 | `components/eaten-experience.tsx` を変更していないか | ✅ | diff に該当なし |
| 14 | data/translations / scripts/output / generated JSON / DB / crawler に触れていないか | ✅ | 変更は config / globals / components の7ファイルのみ |
| 15 | URL構造・food.id・store.id に影響がないか | ✅ | ルーティング・データ層・id 生成に変更なし（純粋な配色変更） |
| 16 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告で全成功。変更が className のみのため型・ビルドへの影響なしと整合 |
| 17 | Food/Store Coverage が期待値から変化していないか | ✅ | 翻訳データ非変更のため変動なし。期待値（Food total 294 / translated 77、Store display_total 99 等）と整合 |
| 18 | 濃紺CTAがUSJブルー寄りになり重さが軽減されているか | ✅ | 主要4CTAの `#071b3a`（黒寄り濃紺）→ `#0057b8`（USJブルー）化＋進捗バーの赤→青金グラデで、設計書 0章の意図（明るさ・ユニバ感）を達成 |

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 1083701` → 7 files changed
- `git show 1083701` → 全diff を直接確認
- `grep -nE "park:|cream:|sand:|berry:|sun:" tailwind.config.ts` → `park #0057b8` / `cream #fffaf5` / `sand #e7dccb` / `berry #c8102e` 保持を確認
- `grep -rn "bg-berry" components/` → バッジ用途（food-detail・food-card・recommendation-rail）が無変更で残存
- `grep -rln "text-ink" components/` → 文字色 `text-ink` の広範な継続使用を確認
- `git status --short` → クリーン

---

## 補足（非ブロッキング・Phase 2 への申し送り）

判定（承認）には影響しないが、後続フェーズの参考として記録する。

1. **food-card.tsx の三項が冗長**
   `eaten ? "bg-park text-white" : "bg-park text-white"` と両分岐が同一になった。動作・見た目は正しいが、将来 `bg-park text-white` の固定クラスへ簡素化可能（必須ではない）。

2. **スコープ外コンポーネントに濃紺CTAが残存**
   設計書 3-3 の「全プライマリCTAを `bg-park` に統一」という最終目標に対し、Phase 1 対象外の以下に `bg-ink` CTA が残っている。**Phase 1 のスコープ定義（対象7ファイル）には合致しており本commitの不備ではない**が、第一印象の完全統一には Phase 2 での対応を推奨:
   - `components/home-dashboard.tsx`（/foods への CTA）
   - `components/food-reviews.tsx` / `components/food-correction-report-form.tsx`
   - `components/local-data-backup-panel.tsx` / `components/admin-catalog-manager.tsx`
   - `components/pwa-register.tsx`
   - `components/food-grid.tsx` L365（リクエストフォーム外部リンク。Phase 1 対象の L342「もっと見る」とは別ボタンで、設計書 Phase 1 指定外）
   - `app/contact/contact-form.tsx` / `app/admin/prices/price-review-card.tsx`

   なお `store-visual.tsx` の `navy: "bg-ink/75"` はバッジ/装飾用途であり、文字・締め色限定ルールの範囲外として保留で問題ない。

---

## 結論

設計書 `docs/unicole-design-color-system-v1.md` Phase 1 の指定（濃紺CTA 4箇所の park 化・進捗バー赤→青金グラデ・cream/sand トークン追加・body color ink 統一）を、対象7ファイルに過不足なく、対象外領域への副作用なく実装。バッジ（berry）・text-ink・Homeカルーセル・ヘッダー・下部ナビ・翻訳データはすべて維持。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
