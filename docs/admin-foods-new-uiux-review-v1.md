# /admin/foods/new UI/UX 設計レビュー v1（ユニコレ 商品追加ページ）

**作成日:** 2026-06-23
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**対象:** `app/admin/foods/new/page.tsx` ＋ `components/admin/food-form.tsx`（実装済み）
**目的:** 家族（owner/editor）がスマホでも迷わず商品追加できるよう、**UI/UX のみ**改善する Codex /goal を設計。保存処理・送信契約・認証・Supabase は変更しない。

> 本書は設計レビューのみ。コード変更・git なし。実コードを通読済み。

---

## 1. 現状の問題点（実コード根拠）

1. **必須/任意が一目で分からない**: ラベルは全て同じ淡色（`text-xs text-slate-500`）で必須マーク（*・「必須」）が無い。HTML `required` は nameJa/price/customShopName のみで、エリア・店舗選択・カテゴリ・画像（公開に必要）は視覚表示なし。
2. **状態セレクトが3つ並び紛らわしい**: 「販売状態(active/paused/ended)」「公開状態(draft/published)」「表示状態(visible/hidden)」が縦に3連。非技術者には *draft と hidden の違い* が理解困難。追加時に最も誤解を生むポイント。
3. **入力順に任意項目が割り込む**: 「商品名 英語（任意）」が必須の「商品名日本語」と「価格」の間にある。販売期間・管理メモも本体グリッドに混在し、コア必須項目が埋もれる。
4. **管理メモが目立ちすぎ**: 4行 textarea が本体セクション内にあり視覚的に重い（「公開されません」表記はある＝#7はOKだが配置が前すぎ）。
5. **保存前に不安**: ネイティブ `required` が一部のみのため、エリア/店舗未選択や画像なしのまま「保存」を押すとサーバーエラーになり得る。公開条件（画像・情報出典が必要）が画面上に明示されていない。
6. **画像文言の矛盾感**: 「画像なしでも保存できます」と、Phase 3 の「公開には画像必須」が画面上で噛み合わず見える。
7. **店舗UIは良いが長い**: 「1.エリア→2.種別→3.検索→4.選択」の手順表示・選択済みカード・解除は分かりやすい（良点）。ただしスマホでは縦に長く、候補名の重複表示の可能性も僅かにある。
8. **ステップ感が弱い**: 1枚の大グリッド＋カテゴリ＋画像で、入力の段取りが見えづらい。

> 良い点（維持）: 店舗の手順ガイド、選択済み店舗カード、重複候補の事前警告、画像プレビュー、タップ領域（h-11/h-12）、保存メッセージ表示。

---

## 2. 優先度順の改善案（実装リスク低→高・すべてUI/UXのみ）

**P1（低リスク・高効果）**
- 必須/任意バッジ: 商品名日本語・価格・エリア・店舗・カテゴリ・画像＝「必須」、英語名・販売期間・管理メモ＝「任意」。エリアにも視覚的必須表示。
- 保存ボタン付近に**公開チェックリスト**（「公開には：商品名/価格/エリア/店舗/カテゴリ/画像/情報出典」）を常設し、未入力を分かりやすく。
- 画像文言の整合: 「画像なしでも下書き保存は可。**公開には画像が必要**」。
- 管理メモを muted＋ロックアイコンで「公開されません」を強調。

**P2（低〜中）**
- 入力順の最適化＋ステップ番号: ①基本情報(必須: 商品名→価格→エリア→店舗) → ②カテゴリ → ③画像 → ④公開設定 → ⑤保存。英語名・販売期間・管理メモは「詳細（任意）」へ集約（折りたたみ）。

**P3（中・送信契約は維持）**
- 3状態セレクトの整理: 追加時は「**今すぐ公開**」トグル（既定ON）＋「販売状態（販売中/休止/終了）」に簡素化。「表示状態(hidden)」は追加画面から外し編集時のみ（または詳細内）。**送信する name/value（publicState/hiddenState/saleStatus）は hidden input 等で従来通り維持**し保存ロジックを壊さない。文言を平易化（draft→「下書き(非公開)」/ published→「公開」等、value は不変）。

**P4（低・任意）**
- 店舗候補の表示名 dedupe、スマホで種別フィルタ/検索をコンパクト化。

---

## 3. やるべきこと

- 必須/任意の明示、公開チェックリスト、状態セレクトの平易化・整理、任意項目の「詳細」集約、入力順/ステップ化、文言整合、管理メモ非公開の強調。
- **送信される FormData の name と value（nameJa/nameEn/price/area/shopName/customShopName/saleStatus/publicState/hiddenState/categoryTags/saleStart/saleEnd/memo/imageFile/foodId/intent）を完全維持**。
- スマホ/PC 両対応（既存 Tailwind トークンで崩れなし）。

## 4. やらないこと

- `app/admin/foods/actions.ts` / server action / 保存・画像保存・visibility 保存ロジックの変更。
- 送信フィールドの name/value 契約の変更（キー名・許可値）。
- Supabase SQL / Storage 設定 / 認証 / proxy.ts / generated JSON / crawler / translations / 広告 の変更。
- 新規依存追加、service role key のクライアント露出、削除機能の追加。

---

## 5. Codex に貼れる /goal

```
/goal ユニコレ管理画面の商品追加ページ /admin/foods/new（components/admin/food-form.tsx）を、家族が迷わず入力できるよう UI/UX だけ改善する。保存処理・送信フィールドの name/value・認証・Supabase・画像保存ロジックは一切変更しない。

## 目的
owner/editor/家族がスマホ・PC で迷わず商品追加できるUIにする。見た目・順番・文言・必須表示・状態の分かりやすさを改善する。挙動（保存・公開・画像保存）は現状維持。

## 必ず守る制約（壊さない）
- app/admin/foods/actions.ts と server action（createAdminFood / visibilityAction）は変更しない。
- form が送信する FormData の name と取り得る value を完全に維持する: nameJa, nameEn, price, area, shopName, customShopName, saleStatus(active|paused|ended|unknown), publicState(draft|published), hiddenState(visible|hidden), categoryTags(複数), saleStart, saleEnd, memo, imageFile, foodId, intent。
- Supabase SQL / Storage 設定 / 認証(requireAdmin) / proxy.ts / generated JSON / crawler / data/translations / 広告 を変更しない。
- 新規依存を追加しない。service role key 等をクライアントに出さない。
- 削除機能を追加しない（hidden 運用のまま）。既存の重複警告・画像プレビュー・店舗検索ロジックを壊さない。
- git add . 禁止。変更は components/admin/food-form.tsx（必要なら lib/admin-food-ui.ts のラベル定数、app/admin/foods/new/page.tsx のヘッダ文言）に限定。

## やること（UI/UXのみ）
1. 必須/任意の明示: 商品名日本語・価格・エリア・店舗・カテゴリ・画像 に「必須」バッジ、英語名・販売期間・管理メモ に「任意」バッジ。エリアにも視覚的必須表示。
2. 入力順とステップ化: ①基本情報(必須: 商品名→価格→エリア→店舗) ②カテゴリ ③画像 ④公開設定 ⑤保存 の順に整理し、各セクションに番号/見出しを付ける。
3. 任意項目の集約: 商品名英語・販売期間 start/end・管理メモ を「詳細（任意）」セクション（折りたたみ可）へ移動。コア必須項目を上部に。
4. 状態の分かりやすさ:
   - 「今すぐ公開」トグル（既定ON）を用意し、その状態を hidden input name="publicState" の value="published"/"draft" に必ずマッピング（送信契約維持）。
   - 「販売状態」は select のまま、ラベルを平易化（販売中/休止中/販売終了/不明）。value は active/paused/ended/unknown を維持。
   - 「表示状態(hiddenState)」は追加画面では既定 visible とし、UI からは「詳細（任意）」内へ移動（または非表示で hidden input value="visible" を送る）。value 契約は維持。
5. 公開チェックリスト: 保存ボタン付近に「公開するには：商品名・価格・エリア・店舗・カテゴリ・画像・情報出典 が必要」を常設表示し、未入力をユーザーが把握しやすくする（クライアント表示のみ。送信検証ロジックは変更しない）。
6. 画像文言の整合: 「画像なしでも下書き保存は可能。ただし公開には画像が必要」と明記。
7. 管理メモ: ロックアイコン＋muted で「この内容は公開されません」を強調。
8. スマホ最適化: 状態セレクト/日付/店舗フィルタの縦長を圧縮、タップ領域維持（h-11/h-12）、PC は2カラム維持。既存 Tailwind トークン（ink/park/mint/cream/slate）で統一。

## 検証
- npm run lint / typecheck / build / coverage 成功、Coverage 不変。
- 送信される FormData の name/value が従来と同一（保存・公開・非表示・画像保存が従来どおり動作）。
- 既存の重複候補警告・画像プレビュー・店舗 1→4 手順選択・「その他」直接入力 が動作する。
- viewer は到達不可（requireAdmin("editor")）が維持。
- スマホ幅/PC幅でレイアウトが崩れない。必須/任意・公開チェックリストが表示される。
- /admin/foods/[id]/edit（同 FoodForm 共有）も壊れない（edit の visibility ボタン・既存値プレフィルが維持）。
- git status --short が想定変更ファイルのみ。

## Stop条件
- 送信フィールドの name/value 契約を変えないと実現できない要望が出たとき。
- actions.ts / Supabase / 認証 / 画像保存ロジックの変更が必要になったとき。
- 新規依存が必要なとき。
- edit ページや公開ページに副作用が出そうなとき。
```

---

## まとめ
コア改善は「**必須/任意の明示**」「**3状態セレクトの平易化（今すぐ公開トグル＋販売状態、表示状態は詳細へ）**」「**任意項目を詳細へ集約＋ステップ化**」「**公開チェックリスト**」。すべて **送信 name/value を維持した UI/UX 改善**で、保存・認証・Supabase・画像保存は無改変。実装はしない。
