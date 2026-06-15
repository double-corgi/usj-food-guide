# store-id-collision-audit-v1

対象: 店舗ID衝突・店舗詳細データ不整合の調査設計（設計レビューのみ・実装なし）

前提ドキュメント: `docs/store-detail-empty-state-review-v1.md`（i18n Phase 2D-Dは原因ではないと結論済み。本ドキュメントはその続きで、発見された「店舗ID衝突」を `scripts/output/foods.generated.json`（生成データ本体）まで遡って検証する）

## 総合判定

「0品を掲載しています」が**0と表示される**ケースは、今回も再現できなかった（構造的に発生しない、という結論は変わらず）。

一方、`scripts/output/foods.generated.json`（294件中、公開対象188件）を直接検査した結果、**`food.shop.id` フィールドに「特定の1値が、本来無関係な複数店舗にわたって誤って共有されている」データ品質問題が3グループ・延べ20店舗名で確認できた**。最大のものは `shop-1tt48e8` で、14個の全く異なる店舗名（エリアも8種類にわたる）がこの同一IDを共有している。これにより `/stores` 一覧の该当カードは、すべて1つの店舗（アミティ・アイスクリーム）の詳細ページに着地する。

これは **データ生成（クローラー/抽出スクリプト）側で `shop.id` を「店舗単位ではなく、参照元ページURL単位」または「プレースホルダー文字列単位」で割り振ってしまっている**ことが直接原因であり、`lib/store-utils.ts` のロジック自体は「`candidate.id` が店舗ごとに一意である」という前提に立っているだけで、その前提を満たさないデータが投入されたために破綻している。i18n Phase 2D-Dとは無関係。

## 発生している問題

1. **`shop-1tt48e8` 衝突（最重大）**: 14店舗名がこのIDを共有。`/stores` 一覧の代表カードは正しい店舗名・代表商品を表示するが、リンク先 `/stores/shop-1tt48e8` を開くと常に「アミティ・アイスクリーム」（3品、アミティ・ビレッジ）が表示される。
2. **`shop-店舗未確認` 衝突**: 4店舗名（ボードウォーク・スナック、ジャングル・ビート・シェイク、ロンバーズ・ランディング™ 前テラス、ロストワールド・レストラン）がこのIDを共有。さらにIDそのものに日本語（`店舗未確認`）が含まれるため、URLが `/stores/shop-店舗未確認` となり `mcp__workspace__web_fetch` で403（"URL not in allowed provenance set"）となるなど、URL設計としても問題がある。
3. **`shop-dvw6dt` 軽微な表記揺れ**: 「デリシャス・ミー! ザ・クッキー・キッチン」と「デリシャス・ミー!ザ・クッキー・キッチン」（全角/半角スペースの差）が同じIDを共有。これは実質同一店舗の表記ゆれであり、上記2件とは性質が異なる（実害は小さい可能性が高い）。

## 再現できる具体例

- 本番 `/stores` で「ボードウォーク・スナック」「ワーフカフェ」「ディスカバリー・レストラン」「シネマ 4-D 前フードカート」「スヌーピー・バックロット・カフェ」「ハローキティのコーナーカフェ」「イーブル・イーツ」のカードをそれぞれ開く → いずれも `/stores/shop-1tt48e8` に遷移し、「アミティ・アイスクリーム / アミティ・ビレッジ / 3品を掲載しています。」が表示される。
- `scripts/output/foods.generated.json` 内、`food.shop.id === "shop-1tt48e8"` のレコードは公開対象188件中24件存在し、いずれも `food.shop.officialUrl` が `https://www.usj.co.jp/web/ja/jp/restaurants/the-wizarding-world-of-harry-potter-food`（ハリー・ポッター エリアのフード総合ページ）になっている。店舗ごとの個別公式URL（例: `amity-ice-cream`, `boardwalk-snacks`）は `food.locations[].shopId`／別フィールド側にのみ正しく存在するケースがある。
- `shop-店舗未確認` についても同様に、`food.shop.id` が文字列 `"shop-店舗未確認"` で、`food.shop.name` には正しい店舗名（例: `ロンバーズ・ランディング™ 前テラス`）と正しい個別 `officialUrl`（例: `.../conan/more-enjoy`）が入っている。つまり **`shop.id` だけが汚染されており、`shop.name` と `shop.officialUrl` は店舗ごとに正しい**。

## 影響範囲

- `/stores` 一覧（`app/stores/page.tsx` → `components/stores-overview.tsx`）: 表示自体（店舗名・代表商品・バッジ）は正しい。リンク先URLが衝突IDのため誤った遷移先になる。
- `/stores/[id]`（`app/stores/[id]/page.tsx`）・`generateStaticParams`: `shop-1tt48e8` / `shop-店舗未確認` に対して1つの静的ページしか生成されず、`findStoreById` の `.find()` が最初に一致した1店舗のみを返す。結果として最低17店舗名（14＋4から重複考慮で実質17ユニーク名、うち1つだけ正しく解決）について、利用者は「自分が選んだ店舗」とは異なる店舗詳細を見ることになる。
- `lib/store-utils.ts` の `buildStoresFromFoods`/`findStoreById`/`getStoreDisplayFoods`/`getStoreSummary` などのロジック自体は変更不要（前提が崩れているだけ）。
- i18n（`lib/i18n/dictionaries.ts`、`I18nText`）: 影響なし。
- `lib/repositories/foods.ts`（公開フィルタ `isVisibleFood`）: 影響なし。フィルタ後も `shop.id` 汚染はそのまま残る。

## 原因候補

`food.shop.id` の値は、クローラー/データ生成スクリプト（`scripts/crawl-usj-foods.ts`、`scripts/crawlers/crawl-targeted-pages.ts`、`scripts/debug/augment-generated-from-official-pages.ts` など）が、**フード情報のソースとなった「ページ単位」または「プレースホルダー店舗名」からIDを導出している**ためと推測される。

- `shop-1tt48e8`: 24件すべての `officialUrl` が「ウィザーディング・ワールド・オブ・ハリー・ポッター フード」という**エリア横断の総合ページ**を指している。このページから複数店舗のフード情報を抽出した際、店舗ごとの個別IDではなく、ページURL（または何らかのフォールバック値）から生成された1つのIDが全件に割り振られたと考えられる。
- `shop-店舗未確認`: `food.shop.name` が `"店舗未確認"`（文字通り「店舗未確認」というプレースホルダー名）だったレコードに対し、IDが `normalizeShopName("店舗未確認")` 相当の値（`"店舗未確認"`）から生成され、その後 `food.shop.name` 自体は別の処理で正しい店舗名に補完されたが、**`shop.id` は補完時に再生成されなかった**、という2段階処理のズレが疑われる。

いずれも「推測」であり、確定にはクローラー/データ補完スクリプトのコードを読む追加調査が必要（本ドキュメントのスコープ外、`scripts/` 配下の該当処理を次の調査ステップで読むことを推奨）。

## i18n起因かどうか

**起因しない。** `food.shop.id` の値は `scripts/output/foods.generated.json`（データ生成パイプラインの出力）に存在する値であり、`app/stores/[id]/page.tsx` や `lib/i18n/dictionaries.ts`（Phase 2D-Dの変更対象）には一切含まれない。Phase 2D-Dのdiffは表示文字列の `I18nText` 化のみで、`buildStoresFromFoods`・`findStoreById`・`generateStaticParams` のいずれも変更していない（`store-detail-empty-state-review-v1.md` の結論を、生成データレベルまで遡って再確認できた）。

## データ起因かどうか

**起因する。** `scripts/output/foods.generated.json` 内の `food.shop.id` フィールドが、本来店舗ごとに一意であるべきところ、3グループ・延べ20店舗名で衝突している（実害が大きいのは `shop-1tt48e8`=14店舗名、`shop-店舗未確認`=4店舗名）。`food.shop.name` と `food.shop.officialUrl` は概ね店舗ごとに正しい値が入っているため、**ID生成だけが壊れている**。

## URL/ID設計起因かどうか

部分的に起因する。`StoreWithFoods.id` が `candidate.id`（= `food.shop.id` または `location.shopId`、いずれも生成データの値をそのまま使用）に依存しており、`lib/store-utils.ts` 側に「`id` が店舗ごとに一意である」ことを保証・検証する仕組みが無い。また `shop-店舗未確認` のように、IDに日本語（URLエンコードが必要な文字）が含まれるケースをそのまま `/stores/[id]` のパスセグメントとして使っており、これは衝突問題とは別に、URL設計としても望ましくない（一部ツール・クローラーで403になるなど）。

## 修正案A/B/C

いずれも設計レベルの提示のみ。実装はしない。

### 修正案A: データ側で `food.shop.id` を再生成（根本対応）

`scripts/output/foods.generated.json` の生成パイプラインで、`food.shop.id` を「店舗名＋エリア」（または既存の `buildStoreIdentityKey` と同等のロジック）から再生成し、衝突を解消する。

- 利点: 根本解決。`lib/store-utils.ts` 側の変更は不要。
- 欠点: 生成データの再生成が必要（クローラー再実行、または既存JSONへの一括変換スクリプトが必要）。`shop.id` を変更すると、既存のブックマーク・SNS共有済みURL（`/stores/shop-1tt48e8` 等）との互換性が壊れる。

### 修正案B: `lib/store-utils.ts` 側で表示用IDを再生成（dedupe側で吸収）

`buildStoresFromFoods()` の中で、`storeMap` 構築後に「同じ `id` を持つ複数の `storeKey` エントリ」を検出し、2件目以降には `storeKey` ベースの新しいID（例: `shop-${normalizeShopName(name)}-${normalizeAreaName(areaName)}`）を割り振る。元の `id`（衝突ID）は最初の1件にのみ残し、他は `aliases` には含めない。

- 利点: 生成データ（`foods.generated.json`）を変更せず、表示・ルーティング層だけで衝突を解消できる。`generateStaticParams` も `buildStoresFromFoods` の結果を使うため、自動的に正しい数の静的ページが生成されるようになる。
- 欠点: 再生成されたIDは `food.shop.id` と一致しないため、「データ上のshop.id」と「アプリ内store.id」が一致しなくなる（デバッグ時にやや分かりにくい）。既存の `/stores/shop-1tt48e8` URLは「アミティ・アイスクリーム」を指す状態のままになり、他の13店舗は新IDのURLになる（＝既存URL自体は壊れないが、新IDのURLが新規に生まれる）。

### 修正案C: 表示側で衝突を検知し、影響店舗を一覧から除外/警告表示する（応急処置）

`buildStoresFromFoods()` または `/stores` ページで、`id` が衝突している店舗（2番目以降）を一覧から一時的に除外する、または「店舗詳細は現在ご利用いただけません」のような注記を出す。

- 利点: 実装コストが最小。誤った店舗詳細への遷移という「事実と異なる情報を見せる」最悪のケースを即座に止められる。
- 欠点: 該当13〜16店舗が `/stores` から一時的に見えなくなる（コレクション要素として欠損する）。根本解決にはならず、暫定対応。

## 各修正案のリスク

| 案 | リスク |
|---|---|
| A（データ再生成） | 生成パイプライン全体の再実行が必要で範囲が大きい。既存URL（`/stores/shop-1tt48e8` 等）の意味が変わる/消える可能性があり、外部リンク・ブックマークとの互換性リスクが最も高い。`food.id`（フードID自体）や `canonicalGroupId` など他フィールドとの整合も再確認が必要。 |
| B（表示側ID再生成） | `buildStoresFromFoods` は `app/stores/[id]/page.tsx`・`app/stores/page.tsx`・home・`/areas` など複数ページから参照される共通関数（Phase 2D-Bで「共有コンポーネントへの不用意な変更」が問題視された前例あり）。変更がこれらすべてに影響する可能性があるため、影響範囲の精査が必須。新IDの命名規則が既存の `shop-*` 形式と衝突しないことの確認も必要。 |
| C（一覧から除外/警告） | 「一部の店舗が一覧から消える」こと自体がユーザーには「データが減った」ように見え、ユニコレの「コレクション欲」を損なう可能性がある。除外条件の実装ミスで正常な店舗まで誤って除外するリスク。 |

## Codex実装前に確認すべき質問

1. `scripts/` 配下のどのスクリプトが `food.shop.id` を生成しているか（`crawl-usj-foods.ts` / `crawlers/crawl-targeted-pages.ts` / `debug/augment-generated-from-official-pages.ts` など）。`shop-1tt48e8` のようなID文字列はどのロジック（URLハッシュ？店舗名ハッシュ？）から作られているか。
2. `shop-1tt48e8` の14店舗・`shop-店舗未確認` の4店舗は、それぞれ「公式サイト上は本当に別店舗」か（USJ公式情報で個別店舗として確認できるか）。すべて修正案Aの再生成対象として問題ないか。
3. `foods.generated.json` を再生成する場合、Supabase本番データ（`isVisibleFood` フィルタの元データ）との同期方法はどうなっているか（生成JSONとSupabaseのどちらが正なのか）。
4. 既存の `/stores/shop-1tt48e8` のような衝突URLが、すでに外部（SNS、ブックマーク等）で共有されている可能性はあるか。修正案Bを採用した場合、このURLは「アミティ・アイスクリームのURL」として維持し続けて問題ないか。
5. 衝突解消（A or B）と、`StoreFoodList`・`generateStaticParams` のキャッシュ/再ビルドへの影響（静的ページ数が13〜17件程度増える）はビルド時間・デプロイに問題ないか。

## 推奨する次の/goal方針（まだ作成しない）

- 「0品を掲載しています」自体は依然として再現せず、対応不要（`store-detail-empty-state-review-v1.md` の結論を維持）。
- 今回確定した「`food.shop.id` 衝突（`shop-1tt48e8` 14店舗、`shop-店舗未確認` 4店舗）」は、ユーザーが見る店舗詳細が事実と異なるという、ユニコレの「ユニバ感・コレクション欲」に直結する重大なデータ品質課題。
- 次の/goalは、**修正案B（表示側でのID再生成によるdedupe）を第一候補とした設計ドキュメント作成**を推奨する。理由: 修正案Aはデータパイプライン全体に影響し検証コストが高く、修正案Cは一覧からの店舗消失というユーザー体験上のデグレードを伴うため。ただし修正案Bを進める前に、上記「Codex実装前に確認すべき質問」の1〜4（特に「14店舗・4店舗が本当に別店舗か」の事実確認）をCodexまたは公式情報で確認するステップを、設計ドキュメント作成前に挟むことを推奨する。
- 本ドキュメントではCodex用 `/goal` は作成しない。次のステップは「修正案Bの詳細設計ドキュメント（store-id-collision-fix-design-v1.md 相当）」の作成を想定。
