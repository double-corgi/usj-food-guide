# UNICOLE 手動フード管理フロー 設計 v1

**作成日:** 2026-06-22
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**現状:** Next.js / PWA / Vercel（noindex）。override 層（`data/duplicate-overrides.json`, `data/food-visibility-overrides.json`）＋guard付き apply スクリプトが既存。`app/admin/*` ページは存在するが **認証ガードなし**（要注意）。

> 本書は設計のみ。コード変更・git・generated直接編集・crawler・DB・translations・広告 いずれも触っていない。調査は読み取りのみ。

---

## 1. 結論

- **既存の override + apply 機構を“正データ補正層”として正式化・拡張する**のが最短かつ安全。新規DBや管理画面より先に、**手動テンプレJSON（add / update / hide）＋ guard付き apply ＋ manual-images** を整える（＝構成案A）。
- **管理画面（構成案B）は Phase 2 以降**。ただし**現状 `/admin` が無認証**なのは公開前に塞ぐべき重大事項（後述、別 goal）。
- **本番 Vercel 上でファイル/画像を実行時に直接書き換えない**。正データの source of truth は **git 上の JSON＋manual-images（or 外部ストレージ）**。管理画面は「下書き→確認→git反映（commit/PR）→apply→デプロイ」を生む装置にする。
- **DBはまだ不要**。~294件・低頻度更新なら **JSON-in-git** で十分（無料で版管理・rollback・レビューが付く）。多人数・高頻度・同時編集が出てきたら Supabase/Neon へ移行。
- **App Store 前の最低ライン**は「正データが安定（誤画像/終売を出さない）」＋「/admin を認証で保護」＋「秘密鍵/広告IDを露出しない」。フル管理画面は必須ではない。

---

## 2. 推奨アーキテクチャ

```
[正データの source of truth] = git リポジトリ
  data/manual-foods.json            … 手動“追加”フード（action: add）
  data/manual-food-overrides.json   … 既存フードの“修正”（action: update）
  data/food-visibility-overrides.json … 表示状態（hide/pause/restore）※既存
  data/duplicate-overrides.json     … 重複統合 ※既存
  public/manual-images/<food.id>/main.jpg … 手動画像（Phase A）/ 将来は外部ストレージ
        │  apply scripts（guard付き・全件 before/after 差分検証）
        ▼
  scripts/output/foods.generated.json（生成物・直接編集禁止）
        │ Codex commit → Claude レビュー → Vercel デプロイ
        ▼
  本番（読み取り専用で配信）
```

- 自動取得（crawler）は**補助**。手動層が**勝つ（override）**。
- 反映は必ず apply 経由＝generated を直接手編集しない。
- 管理画面（Phase 2）は上記 JSON/画像を**git commit/PR か DB 経由**で更新するだけ。**本番 FS を実行時に書かない。**

---

## 3. Phase 分け

| Phase | 内容 | 管理画面 | 保存先 |
|---|---|---|---|
| **0（即・安全）** | `/admin` を認証で保護（現状 無認証）。read-only でも公開前に必須 | 既存 admin に認証ガード | env allowlist |
| **A（最小安全版）** | manual-foods / manual-food-overrides の正式化＋apply＋manual-images。管理画面なし（JSON 直編集 or localhost 簡易フォーム） | なし/localhost | JSON-in-git＋public/manual-images |
| **B（管理画面版）** | /admin に認証付き 追加/編集フォーム・下書き→プレビュー→承認・操作ログ・画像アップロード | 本番 /admin（認証必須） | JSON-in-git(commit/PR) or DB＋外部ストレージ |
| **C（拡張）** | DB移行（必要時）・ロール本格化・rollback UI | 同上 | Supabase/Neon |

---

## 4. 最小安全版（構成案A）の設計 ← まず作る

### 4-1. データファイル
- **`data/manual-foods.json`**（action: add）: 配列。各要素＝下記「手動追加テンプレ」。完全な food を1件定義。
- **`data/manual-food-overrides.json`**（action: update）: 配列。`targetFoodId` ＋ 変更したいフィールドのみ（部分上書き）。
- **`data/food-visibility-overrides.json`**（既存）: action hide/pause/restore（saleStatus/hidden/reviewStatus/displayQuality）。
- いずれも**許可フィールドのホワイトリスト**を apply 側で強制。

### 4-2. apply（既存パターンを踏襲）
- `scripts/debug/apply-manual-foods.ts`（add）＋ `apply-manual-food-overrides.ts`（update）。
- 反映タイミングは2方式から選択（設計推奨は b）:
  - a) generated 構築（quality-foods）に統合し再生成 → ただし再生成は crawler を伴うため**当面不可**。
  - b) **既存 apply 同型の“オフライン後処理”**: 現行 `foods.generated.json` を読み、manual-foods を append / overrides を該当 id に適用し書き戻す。**全件 before/after 差分ガード**で「対象 id 以外は不変」を保証。← 採用。
- 反映順序: crawl由来 → manual add → manual update → visibility → duplicate（手動が後勝ち）。

### 4-3. 反映フロー
JSON/画像を編集（手 or localhost フォーム）→ `apply-*` 実行（Codex）→ generated 差分は対象のみ → **Claude レビュー（承認/条件付/不承認）** → commit → Vercel デプロイ。

---

## 5. 管理画面版（構成案B）の設計

- 場所: 既存 `/admin`（認証必須化）。サブ: `/admin/foods/new`, `/admin/foods/[id]/edit`, `/admin/foods/drafts`, `/admin/logs`。
- フロー: フォーム入力 → **下書き保存（status: draft）** → **プレビュー**（公開前の見え方）→ **承認（reviewedBy/At）** → **反映（git commit/PR 生成 or DB upsert）** → apply → デプロイ。
- **即公開しない**（draft → review → publish）。
- 画像: フォームからアップロード → **外部ストレージ**（Vercel Blob / R2 / Supabase Storage）→ URL を JSON/DB に記録。**本番 public/ へ実行時書き込みしない。**
- 反映方式（推奨）: 管理画面は **GitHub API で override JSON への commit/PR を作成**（人＝レビュー→マージ）か、DB に下書き→承認→公開フラグ。いずれも**本番 FS 非書き込み**。

---

## 6. 手動“追加”テンプレ（data/manual-foods.json の1要素）

```jsonc
{
  "action": "add",
  "foodNameJa": "クロミ・チュリトス ～カシスショコラ味～",
  "foodNameEn": "Kuromi Churritos - Cassis Chocolate",
  "priceYen": 700,
  "area": "ハリウッド・エリア",
  "shopName": "シネマ4-Dストア前フードカート",
  "categoryTags": ["churros", "cart", "sanrio", "seasonal"],
  "saleStatus": "active",            // active|paused|ended|unknown
  "periodStart": "2026-03-01",
  "periodEnd": null,
  "image": "main.jpg",               // public/manual-images/<生成id>/main.jpg
  "imageSourceUrl": "https://...（画像の出所）",
  "infoSourceUrl": "https://castel.jp/p/3101",
  "sourceType": "trusted-site",      // official|trusted-site|manual-confirmed
  "confidence": "medium",            // high|medium|low
  "notes": "クロミライブ2026連動。価格は信頼サイト。要公式確認。",
  "reviewedBy": "owner@example.com",
  "reviewedAt": "2026-06-22"
}
```
- **categoryTags** は指定の固定セットのみ許可（churros/popcorn/drink/burger/plate/dessert/snack/cart/seasonal/universal-market/nintendo/minion/jurassic/harry-potter/conan/sanrio）。1つを primary category にマップする規則を定義。
- **必須**: foodNameJa, priceYen(or 明示null＋confidence low), area, shopName, categoryTags, saleStatus, infoSourceUrl, sourceType, confidence, reviewedBy/At。
- **画像なしは active 表示にしない**（confidence/visibility で制御）。

## 7. 手動“修正”テンプレ（data/manual-food-overrides.json の1要素）

```jsonc
{
  "action": "update",                 // update|hide|pause|restore
  "targetFoodId": "food-10fodl7",
  "priceYen": 700,                    // 変更したいフィールドのみ
  "saleStatus": "active",
  "image": "main.jpg",
  "imageSourceUrl": "https://...",
  "infoSourceUrl": "https://...",
  "sourceType": "trusted-site",
  "confidence": "medium",
  "notes": "価格を¥750→¥700に補正（信頼サイト）。要公式確認。",
  "reviewedBy": "owner@example.com",
  "reviewedAt": "2026-06-22"
}
```
- 部分上書き。**許可フィールドのみ**（id/normalizedName 等の同一性キーは不可）。
- hide/pause/restore は visibility-override と整合（重複定義を避け、どちらか一方に集約：可視状態は food-visibility-overrides、値修正は manual-food-overrides）。

## 8. 画像管理ルール

- **Phase A**: `public/manual-images/<food.id>/main.jpg`（既存 food-uqw79q 方式に統一）。`/generated/manual-images/...` の旧2系統は将来この規約へ寄せる。
- **形式/サイズ**: jpg/png/webp、正方推奨、最大~1–2MB・最大辺~1280px。apply/管理画面で**形式・容量・寸法を検証**。
- **出所**: `imageSourceUrl` を必ず記録。**外部画像を自動取得・自動保存しない**（人手で確認・配置）。
- **差し替え（image override）**: food の他属性は正しく画像だけ誤りの場合、manual-food-overrides の `image` で**画像のみ**差し替え（generated の imageUrl 系を apply が更新）。確証画像URLが無ければ実施しない。
- **Phase B**: 外部ストレージ（後述）に保存し URL をデータに記録。public/ への実行時書き込みはしない。

## 9. セキュリティ要件（管理画面/API）

- **サーバー側認証必須**（クライアント判定に依存しない）。`middleware.ts` で `/admin` と書き込み系 `/api/admin/*` を保護。
- **admin email allowlist**（env、サーバー専用）＋ **ロール**（owner/editor/viewer）。
- **API route は無認証で叩けない**（全 admin API で session＋role チェック）。
- **CSRF 対策**（同一サイト/トークン）、**rate limit**（IP/ユーザー単位）。
- **画像アップロード**: 形式制限（jpg/png/webp）、容量制限、寸法検証、ファイル名サニタイズ、実体MIME検査。
- **入力バリデーション**＋**HTML/script混入対策**（テキストはエスケープ/サニタイズ、リッチHTML不可）。
- **秘密鍵・広告ID・allowlist をクライアントバンドルに出さない**（NEXT_PUBLIC_ を付けない）。
- **操作ログ/変更履歴**（誰が・いつ・何を draft/approve/publish）。
- **rollback**: JSON-in-git なら `git revert`／PR 取り消しで即時。DB なら版管理テーブル。
- **被害最小化**: 管理画面が突破されても **本番 generated を直接書けない設計**（書き込みは git/DB の下書きまで、公開は人のレビュー＋apply＋デプロイ）→ 本番データ即時破壊を防ぐ。
- **/admin URL を UI に露出しない**＋ noindex（ただし obscurity は認証の代替ではない）。

## 10. データ反映フロー

1. 入力（JSON テンプレ手編集 or 管理フォーム）→ 下書き。
2. 画像を manual-images/外部ストレージへ（検証付き）。
3. `apply-*`（guard）で **オフライン後処理** → generated 差分は対象 id のみ。
4. lint/typecheck/build/coverage/audit:duplicates 実行（Coverage 不変確認）。
5. **Claude レビュー → 承認/条件付/不承認**。
6. commit（Codex）→ Vercel デプロイ。
7. 操作ログ記録。

## 11. レビュー/承認フロー

- 反映前に必ず: 「対象 id 以外不変」「許可フィールドのみ」「根拠URL あり」「画像が一致」「価格/販売状況に確証 or confidence 明記」をレビュー。
- **承認 / 条件付き承認 / 不承認** 判定＋証跡 Markdown（既存運用踏襲）。
- 終売復活・画像なし表示・無確証価格 は不承認事由。

## 12. ロール設計

| ロール | 権限 |
|---|---|
| owner | 追加/修正/承認/公開/ログ閲覧/ロール管理 |
| editor | 追加/修正/下書き（公開は不可） |
| viewer | 閲覧のみ |
- 公開（apply→deploy）は owner（または owner 承認）に限定。

## 13. 保存先比較

### データ
| 方式 | 長所 | 短所 | 推奨 |
|---|---|---|---|
| **JSON-in-git（現行延長）** | 版管理/rollback/レビューが無料、構成単純、本番FS非書込 | 同時編集弱い、件数増で重い | **Phase A/B はこれ** |
| Supabase | RLS/認証/Storage 一体、SQL | 運用増、RLS設計必須 | 多人数/高頻度になれば |
| Neon(Postgres) | スケール、SQL | 認証/ストレージ別途 | 大規模時 |
| GitHub commit連携 | レビュー(PR)に乗る | API/トークン管理 | 管理画面の反映手段として有力 |

### 画像
| 方式 | 長所 | 短所 | 推奨 |
|---|---|---|---|
| **public/manual-images（git）** | 単純・版管理 | リポジト肥大 | **Phase A** |
| Vercel Blob | Vercel統合が容易 | コスト/ベンダー固定 | Phase B 既定候補 |
| Cloudflare R2 | egress 安い | 設定手間 | コスト重視なら |
| Supabase Storage | DB と一体・権限 | Supabase 採用前提 | Supabase 採用時 |

## 14. 確認事項への回答（要約）

1. **最初に作る最小構成**: manual-foods/manual-food-overrides JSON ＋ guard付き apply ＋ manual-images（構成案A）。管理画面より先。
2. **本番Vercelで直接書換が危険な理由**: サーバーレスFSは実行時 読み取り専用/揮発で**永続しない**＋**git管理外＝監査/レビュー/rollback 不能**＋突破時に本番即破壊。→ source of truth は git/DB、公開は apply＋デプロイ経由に。
3. **local/admin vs 本番/admin**: localhost フォームは認証/攻撃面が小さく Phase A 向き。本番 /admin は認証・CSRF・rate limit・ロール・ログが必須（Phase B）。
4. **手動テンプレJSON**: §6/§7。許可フィールド・必須項目・根拠URL・confidence を強制。
5. **manual-images**: §8。`public/manual-images/<id>/main.jpg`＋検証＋出所記録。
6. **image override**: manual-food-overrides の `image` で画像のみ差し替え（確証URL前提）。
7. **visibility override 拡張**: 既存 food-visibility-overrides に pause/restore を明示し、saleStatus も扱えるよう許可フィールドを拡張（hide はこの層に集約）。
8. **新規ID生成**: 衝突回避のため **manual 名前空間**。決定的: `food-manual-<stableHash(area:shop:nameJa)>` か可読 slug `food-manual-kuromi-cassis`。apply 時に**既存ID衝突チェック**＋冪等。
9. **既存修正の差分検証**: apply は対象 id の**許可フィールドのみ**変更し、**全件 before/after 差分**で他不変を保証（既存 apply 同型）。
10. **管理画面の認証**: middleware＋サーバーセッション＋email allowlist＋ロール。既存 `app/auth/callback` を活かし得るが、**現状 /admin は無認証＝公開前に要対処**。
11. **画像アップロード先**: Phase A=git public、Phase B=Vercel Blob（既定）/R2（コスト）/Supabase Storage（Supabase採用時）。
12. **DB要否**: 当面 **不要**（JSON-in-git で十分）。多人数/高頻度で DB 検討。
13. **App Store前の最低ライン**: 正データ安定（誤画像/終売を出さない）＋ /admin 認証保護 ＋ 秘密/広告ID 非露出。フル管理画面は不要。
14. **AdMob/AdSense 非衝突**: 広告IDは env/サーバー専用、クライアント/データJSONに入れない。データ層と広告層を分離。本設計は広告コードに一切触れない。

## 15. Codex に投げる最初の goal
`docs/codex-goal-admin-manual-food-management-scaffold-v1.md` に、**構成案A の“足場（schema＋apply＋空テンプレ）”だけ**を作る最小 goal を用意。管理画面・実データ追加・DB・外部ストレージ・広告は含めない。

---

## まだやらないこと
- 管理画面（フォーム/アップロード/認証UI）の実装。
- DB 導入、外部ストレージ導入。
- 実フード（クロミ等）の実データ追加（schema 整備後に根拠付きで別 goal）。
- generated 直接編集、crawler、translations、広告、App Store 作業。
- /admin 認証ガードの実装（重要だが**別 goal**として分離。本 scaffold とは別に優先対応推奨）。
