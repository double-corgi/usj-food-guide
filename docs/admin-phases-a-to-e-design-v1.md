# UNICOLE 管理運用 改善設計 v1（Phase A〜E ＋ 「食べた」バグ）

**作成日:** 2026-06-23
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**制約遵守:** generated/crawler/translations/広告/proxy.ts/Supabase/Vercel 変更なし。本書は設計のみ。実コードを通読済み。

---

## 1. 現状の問題整理

| # | 課題 | 影響 |
|---|---|---|
| 1 | 手動商品の「食べた」が /eaten・食べた一覧に出ない | 手動商品の記録体験が壊れている（最重要） |
| 2 | admin ログインが毎回 Magic Link で面倒・戻りにくい | 家族がスマホで使いづらい |
| 3 | admin から削除ボタンが無い | 誤登録を片付けにくい |
| 4 | 修正導線が弱い（一覧/詳細/公開ページから編集しにくい） | 気軽に直せない |
| 5 | 家族がスマホだけで運用しきれない | 運用が定着しない |

---

## 2. 各根本原因の推測（実コード根拠）

### 2-1. 「食べた」バグ（最重要・トレース済）
記録の流れ:
- 「食べた」押下 → `food-card.tsx`/`food-detail.tsx` が `eatToggleFoodId = getCanonicalActionFoodId(foods, logs, food, "eaten")` を localStorage の `log.foodId` に保存。
- 新規押下時は `getCanonicalActionFoodId` → `getCanonicalFoodId(foods, food)` → `chooseCanonicalRepresentative(同一 canonicalKey グループ).id`。
- `getCanonicalFoodKey(food) = canonicalGroupId ?? duplicateGroupId ?? id`。
- 表示（カードが「食べた済み」になる）: `isEatenCanonical` → `getEatenCanonicalKeys`（`log.foodId` を canonicalKey へ写像して Set 照合）。
- /eaten 一覧: `buildEatenAlbumRecords` → `findLogFood(foods, canonicalFoods, log.foodId)`。
  - **`findLogFood` は `foods.find(f => f.id === log.foodId)` が無ければ `return undefined` → そのレコードを丸ごとスキップ**（`if (!food) continue;`）。

**核心の不変条件**: /eaten で記録が出るには、**`log.foodId` が `/eaten` の `listFoods()` 内のいずれかの `food.id` と完全一致**し、かつ canonical key 解決が破綻していないこと。

**手動商品で壊れる原因（候補・要ランタイム確定）**:
- (a) 手動商品の canonical 同一性（`canonicalGroupId`/`duplicateGroupId`）の有無で `getCanonicalFoodKey` が揺れ、**保存される `log.foodId` が手動商品自身の id にならない**（別グループ代表＝generated の id 等になる、または key が food.id でない）。
- (b) `getCanonicalFoodId` が `compareRepresentativeQuality` で **generated を代表に選ぶ**ケースがあり、手動 id でなく generated id を保存 → /eaten で別物として解決 or 不一致。
- (c) `findLogFood` が **完全一致しか見ない**ため、保存 id と /eaten の food id がわずかでもズレると**沈黙して脱落**（フォールバックなし）。
- 共通の弱点: **`findLogFood` の「一致しなければ捨てる」設計**が、手動商品 id の揺れを一覧から消している。

> カード側は `getEatenCanonicalKeys`（key 写像）で「食べた済み」を判定するため成立する一方、/eaten は `food.id` 完全一致を要求するため**両者の判定方式の差**が症状を生む（カードは済表示、一覧は空）。これが症状「押すと済になるが一覧に出ない」と整合。

### 2-2. ログイン/導線
- セッション維持・/admin 直アクセス時の自動判定・通常ページからの復帰導線・admin内ホームの行き先が未整備。

### 2-3. 削除
- 削除UIが無い。完全削除は危険（復元不可・generated 連携）。

### 2-4. 修正導線
- manual_foods 編集はあるが、一覧/詳細/公開カードからの導線が弱い。generated は直接編集不可。

---

## 3. 優先順位

1. **Phase A**: 「食べた」バグ修正（体験の根幹・既存記録を壊さない最小修正）。
2. **Phase B**: ログイン維持・管理導線（家族の入りやすさ）。
3. **Phase C**: 非表示/削除（soft delete）ボタン。
4. **Phase D**: 編集導線強化。
5. **Phase E**: 家族向け運用UX仕上げ。

---

## 4. Phase 分け案（壊れにくい順）

A（最小・ロジック局所修正）→ B（認証/導線、UI中心）→ C（非表示の安全機構）→ D（編集導線）→ E（仕上げ）。各 Phase 完了＋レビュー承認後に次へ。

## 5/6. Phase ごとの「やること / やらないこと」

### Phase A — 「食べた」バグ修正
- やること:
  - `findLogFood`（/eaten）を**頑健化**: `food.id` 完全一致が無い場合、**canonical key 経由で解決**（`getCanonicalFoodKey` が `log.foodId` の写像と一致する food を探す）。それでも無ければ**安全にスキップしつつログ**（沈黙脱落を避ける）。
  - 「食べた」押下時に手動商品でも**自身の id を確実に保存**できるよう、canonical 解決を手動商品にも一貫適用（手動商品の `canonicalGroupId` 未設定でも key=id で安定すること、`getCanonicalFoodId` が手動商品を代表に選べること）を検証・補正。
  - 既存 generated の記録キー（既存 localStorage の log.foodId）を**変えない**（後方互換）。
- やらないこと: localStorage スキーマ変更、generated 側の id 変更、DB/Supabase 変更、UI 大改修。

### Phase B — ログイン維持・管理導線
- やること: Supabase セッションの維持（Cookie）／`/admin` 直アクセス時にログイン済みなら管理画面・未ログインなら /admin/login へ／**管理者ログイン中だけ表示する管理バー**（通常ページ上部に「管理画面へ戻る」「この商品を編集」）／admin内ホームボタンを管理トップへ。
- やらないこと: 認証方式を弱める（共有トークン本運用化）こと、proxy.ts 変更、Magic Link の完全撤去（初回は維持）。

### Phase C — 非表示/削除（soft delete）
- やること: admin から manual_foods を **hidden=true（非表示）** に、**再表示** も可能に。文言は「非表示にする/再表示する」。**soft delete（削除済みフラグ）** は復元可能設計（manual_foods のみ対象、generated は不可）。
- やらないこと: hard delete、generated 商品の削除、公開ページ表示ロジックの破壊。

### Phase D — 編集導線強化
- やること: admin 一覧/詳細に編集ボタン、**公開ページの商品カード/詳細に管理者だけ見える編集ボタン**（管理バー経由）、manual_foods は直接編集、generated は「manual override（手動上書き）」案（別レコードで上書き表示）を設計。
- やらないこと: generated JSON 直接編集、translations 変更。

### Phase E — 家族向け運用UX
- やること: スマホ導線整理（追加→確認→管理へ戻るの一筆書き）、必須/任意の明示、誤操作の戻し導線。
- やらないこと: 大規模リファクタ、広告/認証の変更。

---

## 7. DB 変更が必要か

- **Phase A: 不要**（クライアント側の eaten 解決ロジックの局所修正。localStorage スキーマ不変）。
- Phase B: 不要（Supabase セッション設定のみ。SQL 変更なし）。
- Phase C/D: soft delete・manual override 用に **将来カラム追加の可能性**（例 manual_foods に deleted_at / override 用テーブル）。本設計では「やるなら追加マイグレーション・人手適用」とし、Phase A/B では触らない。

---

## 8. 認証まわり改善設計（Phase B）

- **セッション維持**: Supabase Auth の Cookie セッション（SSR）を活かし、ログイン後はしばらく維持（Magic Link を毎回送らない）。
- **/admin/login 挙動**: 既ログインなら /admin（管理トップ）へ自動遷移。未ログインならログイン送信フォーム。
- **/admin トップ**: 管理メニュー（商品一覧/追加/ログ）＋現在の role/email 表示。
- **管理バー（管理者ログイン中のみ）**: 通常ページ上部に細いバー「管理モード｜管理画面へ｜この商品を編集（詳細時）」。viewer には編集を出さない。
- **admin内ホーム**: 通常ホームではなく管理トップへ（または「サイトを見る」と明示分離）。
- **Magic Link**: 完全撤去はしない（パスワードレスの安全性を維持）。**初回のみ Magic Link → 以後セッション維持**で実用上の手間を解消。セキュリティを下げすぎない。

## 9. 「食べた」バグ修正設計（Phase A・最小安全）

**目標**: generated でも manual でも「食べた」が /eaten 一覧に出る。既存記録を壊さない。

**設計**:
1. `/eaten` の `findLogFood` を頑健化:
   - 第1: `foods.find(f => f.id === log.foodId)`（現状）。
   - 第2（追加）: 無ければ **canonical key で解決** — `log.foodId` を `getCanonicalFoodMap(foods)` で key に写像し、その key を持つ food（`canonicalFoods` 優先）を返す。
   - これにより「保存 id が代表 id とズレた」ケースも救済。
2. 「食べた」保存 id の一貫性: 手動商品でも `getCanonicalActionFoodId` が**手動商品自身の id を返す**ことを保証（手動商品の canonicalKey=id が安定するよう確認）。
3. **後方互換**: 既存 generated の log.foodId はそのまま解決される（第1ステップ維持）。localStorage スキーマ・既存キーは不変。
4. 検証: 手動商品で「食べた」→ /eaten に画像・名称・価格・エリア・店舗付きで出る／generated の既存記録が従来どおり出る／完了率・アルバムが壊れない。

> 局所修正（`findLogFood` ＋ canonical 解決の手動対応）に限定し、DB・localStorage・generated を触らない。

## 10. 削除/非表示の安全設計（Phase C）

- **基本は soft（非表示／削除済みフラグ）**。hard delete は作らない（復元不可・連携破壊リスク）。
- UI: 家族には「**非表示にする**」（気軽に押せる）＋「再表示する」。必要なら「削除（=削除済みへ）」も soft で復元可能と明記。
- 対象: **manual_foods のみ**。generated は削除/非表示不可（または generated は hidden override で対応＝Phase D の manual override 範疇）。
- 権限: editor も非表示/再表示可、**完全削除相当（削除済みフラグの恒久化）は owner 限定**を推奨。
- admin 表示: 非表示/削除済みも admin 一覧には残す（状態バッジ）。公開ページからは hidden/削除済みで消える。
- 誤操作: すべて復元可能（再表示・復元ボタン）。

## 11. 修正ボタン/編集導線設計（Phase D）

- admin 一覧: 各行に「編集」。
- 商品詳細（公開 /foods/[id]）: **管理者ログイン時のみ**「編集」ボタン（管理バー経由）。
- 公開カード（/foods）: 管理者のみ薄い「編集」アイコン（誤タップ回避・viewer 非表示）。
- manual_foods: 既存 edit フォームへ。
- generated: 直接編集不可。**manual override 設計** = generated 商品に対する上書きレコード（価格/画像/カテゴリ等）を別管理し、表示時に generated＋override をマージ（generated JSON は不変）。Phase D で要否判断。

## 12. 家族が使う前提のUI改善（Phase E）

- 一筆書き導線: 追加→保存→「公開ページで確認」→「管理へ戻る」。
- 必須/任意の明示（別レビュー `admin-foods-new-uiux-review-v1.md` と整合）。
- スマホ最適化・誤操作の戻し（非表示/復元）・状態バッジの分かりやすさ。

---

## 13. 最初に Codex へ投げる /goal（Phase A・コピペ用）

> 下記をそのまま貼る。Phase A のみ。DB/Supabase/認証/UI 大改修・generated・localStorage スキーマは触らない。

```
/goal UNICOLE の「食べた」バグを修正する。手動追加商品(manual_foods由来)でも、generated商品でも「食べた」を押したら /eaten の食べた一覧に出るようにする。既存(generated)の食べた記録を壊さない。クライアント側の eaten 解決ロジックの局所修正のみで、DB/Supabase/認証/localStorageスキーマ/generated/translations/広告/proxy.ts は変更しない。

## 背景（根本原因）
- 食べた記録は localStorage に log.foodId として保存される（lib/use-food-logs.ts）。
- /eaten の一覧 components/eaten-experience.tsx の buildEatenAlbumRecords → findLogFood(foods, canonicalFoods, log.foodId) は `foods.find(f => f.id === log.foodId)` が無いとレコードを丸ごとスキップする。
- foods は listFoods()（generated＋manual_foods をマージ）。手動商品は /foods に出るが、保存された log.foodId と /eaten の food.id 解決がズレると一覧から沈黙脱落する。
- 一方カード側は isEatenCanonical（canonical key 写像）で判定するため「食べた済み」表示にはなる＝症状（済表示だが一覧に出ない）と一致。

## やること（局所・安全）
1. components/eaten-experience.tsx の findLogFood を頑健化:
   - まず従来どおり foods.find(f => f.id === log.foodId)。
   - 無ければ canonical key 経由で解決: getCanonicalFoodMap(foods) で log.foodId を canonical key に写像し、その key を持つ food（canonicalFoods 優先、無ければ foods）を返す。
   - それでも解決できない場合のみ undefined（従来どおりスキップ）。
2. 「食べた」保存 id の一貫性確認: components/food-card.tsx / food-detail.tsx の getCanonicalActionFoodId が、手動商品でも手動商品自身の id（canonicalKey=id）を安定して保存することを確認し、必要なら手動商品の canonical 解決を補正（手動商品が代表に選ばれる/自分の id が返る）。
3. 後方互換: 既存 generated の log.foodId はステップ1の第1段でそのまま解決されること。localStorage の保存形式・キーは変更しない。
4. 必要に応じて lib/food-utils.ts の解決ヘルパに「id 完全一致が無いとき canonical key で救済する」共通関数を追加（generated 既存挙動は不変に保つ）。

## やってはいけないこと（厳守）
- localStorage のスキーマ/キー（UserFoodLog の foodId 等）を変更しない。
- generated JSON / crawler / data/translations / 広告 / proxy.ts / Supabase SQL / Storage / 認証 を変更しない。
- listFoods()/manual_foods の取得ロジック・公開ページの表示条件を変えない。
- 既存 generated 商品の食べた記録の解決結果を変えない（後方互換必須）。
- 完了率/アルバム/エリア進捗など既存集計の generated 挙動を壊さない。
- 大規模リファクタ・新規依存追加をしない。git add . 禁止。変更は eaten-experience.tsx ＋必要なら food-utils.ts/food-card.tsx/food-detail.tsx の解決ロジックに限定。

## 検証
- 手動追加商品で「食べた」→ /eaten 一覧に画像・商品名・価格・エリア・店舗付きで表示される。
- generated 商品の既存「食べた」記録が従来どおり /eaten に出る（後方互換）。
- 完了率・食べたアルバム・エリア/ジャンル進捗が壊れない。
- npm run lint / typecheck / build / coverage 成功、Coverage 不変。
- 公開ページ /foods・商品詳細・カードの表示が従来どおり。
- git status --short が想定変更ファイルのみ。

## Stop条件
- localStorage スキーマや DB 変更が必要だと判明したとき。
- generated 既存記録の後方互換を保てないとき。
- listFoods/公開表示条件の変更が必要なとき。
- 認証/Supabase/proxy に触れる必要が出たとき。
```

---

## まとめ
最重要は **Phase A の「食べた」バグ**。原因は /eaten 側 `findLogFood` の「id 完全一致しないと沈黙脱落」設計と、手動商品 id の canonical 解決ズレ。**id 完全一致＋canonical key 救済**の局所修正で、generated 後方互換を保ったまま手動商品も一覧に出せる。以降 B（ログイン維持・管理バー）→ C（soft delete 非表示）→ D（編集導線・manual override）→ E（家族UX）の順で、壊れにくく分割。まず上記 Phase A の /goal のみ Codex へ。実装はしない。
