# codex-goal-store-id-collision-fix-v1

Codex実装用ゴールドキュメント。本ドキュメントの内容のみを実装範囲とすること。

## 0. 背景・参照ドキュメント

以下のレビュー・調査ドキュメントを必ず読んだうえで作業を開始すること。

- `docs/store-detail-empty-state-review-v1.md`
- `docs/store-id-collision-audit-v1.md`

調査結果の要約:

- `scripts/output/foods.generated.json` 内の `food.shop.id` が、本来店舗ごとに一意であるべきところ、複数の無関係な店舗で共有されている（最大のものは `shop-1tt48e8` が14店舗名で共有、`shop-店舗未確認` が4店舗名で共有）。
- `lib/store-utils.ts` の `buildStoresFromFoods()` は、店舗を `storeKey = 店舗名 + エリア名` で正しくグルーピングしているが、各グループに割り当てる `StoreWithFoods.id`（= `selectedId`）が `candidate.id`（生成データの `shop.id` 由来）をそのまま使っているため、複数の `storeKey` グループが同じ `id` を持つことがある。
- 結果として `/stores` 一覧の複数の異なる店舗カードが同じ `/stores/[id]` URLにリンクし、そのURLを開くと（`findStoreById` の `.find()` が最初に一致した1件しか返さないため）1つの店舗の内容しか表示されない。
- 「0品を掲載しています」（`displayFoods.length === 0`）は、現状のロジック・データでは再現しない（店舗オブジェクトは必ず1件以上のフードを起点に生成されるため）。本タスクではこのケースに対する**防御的UIのみ**を追加する。
- i18n Phase 2D-C/D（`/stores`・`/stores/[id]` の固定UI文言の多言語化）は本件と無関係。既存の `I18nText` / `store.*` / `stores.*` キーは変更しない。

## 1. 目的

`/stores` 一覧 → `/stores/[id]` 詳細の遷移において、**一覧で選んだ店舗と、詳細ページに表示される店舗が常に一致する**ようにする。これを、表示・集約ロジック（`lib/store-utils.ts` および `/stores` 系コンポーネント）の修正のみで実現する。

## 2. 対象ファイル

- `lib/store-utils.ts`（メイン: 表示用店舗キー/IDの生成ロジック追加）
- `app/stores/[id]/page.tsx`（0品時の防御的UI調整のみ。文言・i18nキーは変更しない）
- `app/stores/page.tsx`（必要な場合のみ、`buildStoresFromFoods` の戻り値を渡す処理の微調整。UI文言変更は不可）
- `components/stores-overview.tsx`（href生成が新しいIDを正しく使うようにする。文言・i18nキーは変更しない）

上記以外のファイルは変更しないこと。

## 3. 変更禁止（対象外ファイル・対象外作業）

以下は一切変更しないこと。

- `scripts/output/foods.generated.json` および `scripts/output/` 以下の全ファイル（直接編集禁止）
- `scripts/` 配下のクローラー・抽出スクリプト全般（大規模改修禁止。読むことは可）
- Supabase / DB スキーマ・データ
- 店舗IDの一括再生成（既存 `shop.id` を持つ店舗の `id` を一律に書き換えることは禁止。今回は「衝突しているIDのうち、2件目以降にのみ新IDを割り当てる」という最小限の対応に限定する）
- `lib/i18n/dictionaries.ts`、`components/i18n-text.tsx`、i18n関連の新規キー追加・既存キー変更（i18n Phase 2D-C/Dの成果物は無傷で維持）
- `/`（ホームv1.2）、`app/areas/**`（area-detail-v1.1含む）、`app/foods/**`、`app/eaten/**`、`app/settings/**`
- 商品データ・店舗データの削除
- 価格・商品名・店舗名・エリア名の翻訳・表記変更
- 上記以外の無関係な整形・リファクタ（import順序の一括変更、フォーマッタによる無関係な差分などは禁止）

## 4. 修正方針（必須）

### 4.1 表示用店舗キー（store display id）の生成

`lib/store-utils.ts` の `buildStoresFromFoods()` 内で、`storeMap`（キー: `storeKey = buildStoreIdentityKey(name, areaName)`、値: `StoreWithFoods`）を構築した**後**に、以下の衝突解消処理を追加する。

1. `storeMap` の全エントリを、現在の最終ソート順（`areaName.localeCompare` → `name.localeCompare`、日本語ロケール）と同じ基準で並べる。
2. `id`（= `selectedId`）の出現回数を数える。
3. 同じ `id` を複数の `storeKey` エントリが持つ場合:
   - **ソート順で最初に出現するエントリ**は、元の `id` をそのまま維持する（既存URL互換性のため）。
   - **2件目以降のエントリ**には、`storeKey` から導出した新しい一意なIDを割り当てる。新IDの形式は `shop-${normalizeShopName(name)}-${normalizeAreaName(areaName) || normalizeShopName(areaName)}` とする（`normalizeShopName` / `normalizeAreaName` は既存のプライベート関数をそのまま再利用すること。新たに正規化ロジックを作らない）。
   - 新ID生成後、既存の全店舗の `id`／`aliases`（衝突解消前のもの含む）と再度重複しないことを確認する。万一重複する場合は、`storeKey` のハッシュ的な追加サフィックス等で一意性を確保する（ただし複雑にしすぎないこと。実装上もっとも単純で確実な方法を選んでよい）。
4. `aliases` 配列について:
   - 元の `id` を維持するエントリ（4.1の2の「最初に出現するエントリ」）は、`aliases` も現状のロジックのまま維持してよい。
   - 新IDを割り当てたエントリについては、`aliases` に**衝突していた元の `id` を含めないこと**（元の `id` は別店舗を指すURLとして維持されるため、ここに含めると再度衝突が発生する）。新IDを割り当てたエントリの `aliases` は、そのエントリ自身が元々持っていた `candidate.id` 群のうち、他のどのエントリの `id`/`aliases` とも衝突しないもののみを残す（衝突する `candidate.id` は除外する）。

### 4.2 店舗名の正規化による誤統合の防止

`buildStoreIdentityKey(name, areaName)`（= `storeKey`）の生成ロジックは**変更しないこと**。`storeKey` は店舗名＋エリア名で一意化されており、これは正しく機能している（衝突しているのは `id` のみ）。4.1の処理は「`storeKey` が異なるのに `id` が同じ」エントリを分離するものであり、`storeKey` 自体の正規化を変更して別店舗を統合・分離するような変更は行わないこと。

### 4.3 `/stores` 一覧（`components/stores-overview.tsx`）

`buildStoresFromFoods()` の戻り値（4.1適用後）の `store.id` を使ってリンク（`/stores/${store.id}`）を生成している箇所はそのままで動作するはずだが、以下を確認すること。

- 同じ `href` を持つカードが2件以上存在しないこと（4.1の修正により解消される想定）。
- 表示テキスト（店舗名・代表商品・バッジ・`stores.*` i18nキー）は変更しないこと。

### 4.4 `/stores/[id]`（`app/stores/[id]/page.tsx`）

- `findStoreById(stores, id)` の呼び出し・`buildStoresFromFoods` の呼び出し方は変更不要（4.1の修正により `stores` 配列自体が正しいユニークな `id`/`aliases` を持つようになるため）。
- `generateStaticParams()` も変更不要（同上の理由で、自動的に正しい数の静的パスが生成される）。
- **0品店舗への防御的UI追加**: `displayFoods = getStoreDisplayFoods(store.foods, store)` の結果が `0` の場合、「{{count}}品を掲載しています。」の行（`<I18nText k="store.availableFoodsCount" params={{ count: displayFoods.length }} />` を含む `<p>` 要素）を表示しないこと。`StoreFoodList` 側の空状態表示（`store.availableFoodsEmpty`）のみで成立させる。
  - i18nキー（`store.availableFoodsCount`、`store.availableFoodsEmpty` など）は追加・変更しないこと。条件分岐（`displayFoods.length > 0` のときだけ該当 `<p>` をレンダーする）のみを追加する。
  - 現状のデータでは0品店舗は存在しない想定だが、将来の保険として実装する。

### 4.5 取扱フードの絞り込み

`getStoreDisplayFoods(store.foods, store)` のロジック（重複排除・スコアリング）は変更しないこと。4.1のID衝突解消により、各 `StoreWithFoods` の `foods` 配列はすでに `storeKey`（店舗名＋エリア）単位で正しく集約されているため、ID解決が正しくなれば取扱フードも自動的に正しい店舗のものになる。

## 5. 確認すること（実装中・実装後）

1. 同一 `shop.id`（衝突ID）に複数の `storeKey` エントリが対応しているケースを、4.1の処理後に再列挙し、解消されていることを確認する。
2. `/stores` 一覧で、同じ `href` を持つカードが存在しないことを確認する（63店舗カード全件チェック）。
3. `/stores/[id]` の各ページで、ページ内に表示される店舗名（`<h1>`）が、`/stores` 一覧でそのカードに表示されていた店舗名と一致することを確認する。
4. `/stores/[id]` で表示される「この店舗で買える商品」一覧が、その店舗に紐づくフードのみであることを確認する（衝突前は無関係な店舗のフードが表示されていたケースがある）。
5. 「0品を掲載しています」が表示されるページが存在する場合、それが（a）本当に0品の店舗なのか、（b）ID衝突によって別店舗のデータを参照してしまっているのかを切り分け、(b)であれば4.1の修正で解消されていることを確認する。
6. 既存の `/stores/shop-1tt48e8` のようなURLが404にならないこと（4.1により、衝突していた最初のエントリが元の `id` を維持するため、何らかの店舗の詳細ページとして解決され続けることを確認する）。
7. i18n Phase 2D-C（`/stores`一覧）・2D-D（`/stores/[id]`詳細）で追加された翻訳表示が、4.1〜4.4の変更後も正しく表示されることを確認する（`en`/`ko`/`zh-TW` を含む）。

## 6. 検証要件

以下をすべて実行し、結果を最終報告に含めること。

- `npm run lint`
- `npm run typecheck`
- `npm run build`

### ページ確認

- `/stores`
- `/stores/[id]`（衝突が解消された旧 `shop-1tt48e8` 系・`shop-店舗未確認` 系を含む、複数の店舗で確認すること）
- `/`
- `/foods`
- `/eaten`
- `/areas`
- `/areas/[id]`
- `/settings`

### 確認幅

- 390 / 430 / 768 / 1280 / 1920

### 確認項目

- `/stores` 一覧で異なる店舗が同じURLに飛ばない
- `/stores` 一覧の店舗名と `/stores/[id]` の店舗名が一致する
- `/stores/[id]` の取扱フードが正しい
- 0品店舗の表示が不自然でない（該当する場合のみ）
- 既存URL互換性が破綻していない（`/stores/shop-1tt48e8` 等が404にならない）
- 商品名・店舗名・エリア名は翻訳されていない
- `scripts/output/foods.generated.json` / DB / `scripts/` クローラーを変更していない
- i18n表示（en/ko/zh-TW）が壊れていない
- ホームv1.2が壊れていない
- area-detail-v1.1が壊れていない
- overflow 0 / clipped 0 / 横スクロールなし

## 7. Codexに実装させる範囲（再掲・限定）

- `lib/store-utils.ts`: 表示用店舗ID（store display id）の衝突解消ロジック追加（4.1, 4.2）
- `components/stores-overview.tsx`: href生成が新IDを正しく参照することの確認・必要最小限の調整
- `app/stores/[id]/page.tsx`: 0品時の防御的UI追加（4.4）
- `app/stores/page.tsx`: 上記に伴う必要最小限の調整（必要な場合のみ）

これ以外のファイルへの変更は行わないこと。

## 8. Git運用

作業開始前:

```
git status
```

未コミット変更がある場合:

```
git add .
git commit -m "backup-before-store-id-collision-fix"
git push
```

未コミット変更がない場合:

```
git commit --allow-empty -m "backup-before-store-id-collision-fix"
git push
```

作業完了後:

```
git add .
git commit -m "fix-store-id-collision"
git push
```

## 9. Codex CLI確認対応

確認画面が出た場合は必ず「Yes, and don't ask again」を選択すること。作業中にユーザーへの確認質問を行わないこと。途中で停止しないこと。

## 10. 完了条件

- `/stores` 一覧の全カードのリンク先がすべて異なるURLになっている。
- 各 `/stores/[id]` で、一覧のカードに表示されていた店舗名・エリア・代表商品の店舗と、詳細ページの店舗名・取扱フードが一致する。
- 既存の `shop-1tt48e8` / `shop-店舗未確認` を含む既存URLが404にならない。
- `scripts/output/foods.generated.json`・DB・クローラーに変更がない。
- i18n Phase 2D-C/D・ホームv1.2・area-detail-v1.1に差分がない。
- `npm run lint` / `npm run typecheck` / `npm run build` が成功する。

## 11. 最終報告形式

以下の項目を含めて報告すること。

- 実装した内容
- 採用した店舗表示キー（store display id）の作り方
- 既存 `shop.id` との関係（どのエントリが元のIDを維持し、どのエントリが新IDになったか）
- 旧URL互換性（`/stores/shop-1tt48e8` 等が何を指すようになったか）
- 修正した重複URL例（Before/After）
- 0品店舗の扱い（該当があったか、なかったか、防御的UIの実装内容）
- 変更ファイル一覧
- generated JSON / DB / crawler を変更していないことの確認
- lint / typecheck / build 結果
- `/stores` 確認結果
- `/stores/[id]` 確認結果（複数店舗）
- 390 / 430 / 768 / 1280 / 1920 確認結果
- ホームv1.2が壊れていない確認
- area-detail-v1.1が壊れていない確認
- Vercel確認結果（本番URLでの確認）
- commit hash
- push成功確認
