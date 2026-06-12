# Project Understanding — ユニコレ

作成日: 2026-06-12
作成者: Claude（プロダクト責任者 / UX / UI / レビュー担当）
根拠: AGENTS.md / DESIGN.md / PRODUCT.md / USJ_FOOD_GUIDE_DESIGN.md / README.md / package.json / app/ / components/ / lib/ / types/ / docs/ / scripts/ / screenshots/ を全読・実コード確認済み。推測箇所には「推測」と明記。

---

## 1. このアプリは何をするものか

ユニバフードコレクション（ユニコレ）。USJフードを「写真で探し、食べた記録を残し、図鑑を埋める」非公式コレクションアプリ。

- キャッチコピー: 「食べた記録が、そのままコレクションになる。」（lib/constants.ts `appBrand`）
- ワンセンテンスルール: 「USJで食べたフードを記録し、未食を探して、図鑑を埋めるためのアプリ」（USJ_FOOD_GUIDE_DESIGN.md）
- 主役は 図鑑・検索・記録・販売情報。ランキング・ゲーム演出は補助（PRODUCT.md）
- ログイン不要。食べた記録・レビューは端末内localStorage保存（README / lib/use-food-logs.ts）

データ規模（scripts/output/foods.generated.json 実測）: 全294件、内訳 active 258 / ended 35 / upcoming 1。

## 2. 想定ユーザー

PRODUCT.mdより:

- USJ来園前に食べたいものを調べる人
- 現地でフードを選びたい人
- 限定フードを逃したくない人
- チュリトス・ポップコーン・ドリンクなどカテゴリで集めたい人
- 来園後に食べたものを記録したい人

ジャーニーは「来園前（探す・保存）→ 来園中（場所確認・即記録）→ 来園後（振り返り・次回計画）」の3フェーズ。

## 3. 主要ページ

| ルート | 役割 | 実装 |
|---|---|---|
| `/` | 図鑑の現在地（ホーム） | app/page.tsx → components/home-dashboard.tsx |
| `/foods` | フード検索・一覧 | components/food-grid.tsx |
| `/foods/[id]` | 商品詳細・食べた登録・修正報告 | components/food-detail.tsx |
| `/eaten` | 食べた記録アルバム | components/eaten-experience.tsx |
| `/areas`, `/areas/[id]` | エリア別図鑑 | area-overview / area-* 系 |
| `/stores`, `/stores/[id]` | 店舗別導線 | store-* 系 |
| `/genres` | ジャンル別導線 | — |
| `/settings` | バックアップ・復元・全削除 | settings-data-panel.tsx |
| `/request` | 新商品の情報提供（Googleフォーム） | — |
| `/admin` 配下 | 管理（カタログ・価格・画像・レビュー・候補審査） | admin-* 系 |
| 法務系 | /privacy /terms /contact /disclaimer /about /security /commercial-disclosure | — |

注意: `app/achievements/` `app/complete/` `app/want/` は空ディレクトリ。過去に存在した実績・コンプ画面・次回食べたい画面が撤去された痕跡（READMEには `/complete` 記載が残っており不整合）。

ナビは5タブ: ホーム / 探す / 食べた / エリア / 店舗（app-header.tsx。モバイルは下部フローティングナビ、PCは右上ヘッダー）。

## 4. 主要コンポーネント

- **home-dashboard.tsx**: ホームの骨格。Hero → 今集められるフード → エリア一覧 → 店舗導線 → 25thコレクション → 全商品導線 → 情報提供
- **home-progress-client.tsx**: `HomeCollectionHero`（コレクション数 0/183 の大数字・%・ゲージ・光のスイープ演出）、`HomeActiveFoodCollection`（販売中6品グリッド）、`HomeAnniversaryProgress`（25th横スクロールレール、`is25thFood()` 判定ヒューリスティック内蔵）
- **area-overview.tsx**: 公式エリア画像10枚をハードコードし、黒グラデ＋残り数＋細ゲージのポスター型カード
- **food-grid.tsx**: 検索・カテゴリチップ・詳細フィルター（エリア/店舗/形式/販売状態/価格有無/画像有無/ソート10種）＋カード一覧。フィルター状態は多い（9個のuseState）
- **food-card.tsx**: 高さ462px固定カード。写真252px・名前3行固定・価格・エリア・「食べた」ボタン。バッジ最大2
- **food-detail.tsx**: 代表画像1枚 → 名前・価格・状態 → 食べた/次回食べたい → 販売場所 → レビュー → 関連商品（スコアリング） → 確認情報（折りたたみ） → 修正報告
- **eaten-experience.tsx**: 食べた記録アルバム。最近 → アルバム（最近/今月/エリア別/ジャンル別/全て）→ エリア別・ジャンル別進捗 → 集計注釈
- **use-food-logs.ts**: localStorageのCRUDフック（toggleEaten / updateEatenDetails / recordAnotherBite）
- **food-utils.ts**(527行): canonical集計の心臓部。`calculateCompletion`（販売中コンプ率）、`calculateArchiveRecordRate`（図鑑コンプ率）、`dedupeFoodsByCanonical`、`getCanonicalFoodKey` 等

## 5. データ構造

types/domain.ts:

- **Food**: 約60フィールド。商品情報（name/price/category/area/shop）に加え、管理メタデータが多い（confidenceScore, nameQualityScore, displayQuality, reviewStatus, hidden, duplicateGroupId, manualOverride, canonicalGroupId, priceSource, priceConfidenceScore…）。`rarity`・`zukanNumber` というコレクション向けフィールドも定義済み
- **FoodWithRelations** = Food + area + shop + images[] + locations[]
- **UserFoodLog**: foodId / status("eaten") / rating / memo / eatenAt / eatenCount / spentAmount / userPhotoUrl / repeatWant / recommended（localStorage保存）
- **FoodImage / ImageCandidate**: 画像の出所・信頼度・透かし判定など品質管理フィールドが厚い

集計定義（PRODUCT.md・food-utils.tsで一致確認済み）:

- 現在販売中コンプ率 = `isCompletableFood`（saleStatus active）の canonical数を母数
- 図鑑コンプ率 = 全canonical数を母数
- 総消費金額 = 食べた回数ベース

## 6. データの流れ

```
USJ公式サイト等
  │ scripts/crawlers/*（Tridion JSON, HTML, OG, PDF, 品質スコアリング）
  ▼
Supabase（本番） or scripts/output/*.generated.json（fallback）
  │ lib/repositories/foods.ts listFoods()
  │   …approved / canonical / hidden=false / quality閾値でフィルタ
  │   …sanitizePublicFood() で低信頼画像を除去
  ▼
Server Components（app/*/page.tsx, revalidate 3600）
  ▼
Client Components が localStorage（use-food-logs / use-next-want-foods）と結合
  ▼
コンプ率・図鑑表示（canonical単位で集計）
```

ユーザーデータは一方向にlocalStorageのみ。サーバーへ送信されない（設定でJSONバックアップ/復元）。

## 7. 現在の技術構成

- Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS 3.4
- Supabase（@supabase/ssr）。未設定時は generated JSON fallback
- PWA（manifest / sw.js / install prompt）+ Capacitor 8（iOS/Android化準備、iosディレクトリあり）
- カラートークン（tailwind.config.ts）: ink `#071b3a`(USJ Navy) / park `#0057b8`(USJ Blue) / berry `#c8102e` / sun `#fdbb30`(Universal Gold) / mint `#e8f2ff`
- アニメーション: globals.cssに achievement-unlock / soft-glow / home-stat-pop / home-progress-fill / home-light-sweep（reduced-motion対応）
- crawler / audit / release-readiness のスクリプト群が充実（30以上のnpm scripts）

設計ドキュメントの優先順位（AGENTS.md）: USJ_FOOD_GUIDE_DESIGN.md ＞ DESIGN.md。なお、プロジェクト指示にある「Nintendo DESIGN.md」という独立ファイルは存在せず、Nintendo観点はUSJ_FOOD_GUIDE_DESIGN.mdの「Nintendoから採用するもの/禁止」節に統合されている。

## 8. ホーム画面の責務

定義（PRODUCT.md / USJ_FOOD_GUIDE_DESIGN.md）: 「図鑑の現在地を確認する場所」。表示優先は ①現在販売中コンプ率 ②食べた数 ③残り数 ④25thコレクション ⑤エリア別進捗 ⑥全商品導線。「今日のおすすめ」「統計カード4連発」「管理画面風サマリー」は禁止。

実装（home-dashboard.tsx、スクリーンショット home-home-polish-after-390/1280.png で確認）:

1. Hero: ユニコレロゴ＋タグライン＋「コレクション数 0/183」大数字＋達成率%＋ゲージ＋光スイープ
2. 今集められるフード（販売中6品、限定/価格/画像有無のスコアで選出）
3. エリア一覧（公式画像10エリアのポスターカード）
4. 店舗から探す（テキスト行＋ボタン）
5. 25thアニバーサリーコレクション（横スクロールレール）
6. 全商品を見る / 情報提供（テキスト行＋ボタン）

## 9. 現在の強み

- **設計思想が明文化され一貫している**: 「図鑑・コレクション・写真主役・管理画面禁止」が4つのドキュメントで揃い、過去3回の監査（design-audit, real-user-audit v1〜v3）で実際に反映されてきた
- **データ基盤が本格的**: canonical重複統合、信頼度スコア、出典管理、手動オーバーライド保護。個人開発レベルを超えた品質管理
- **集計ロジックの正確さ**: 販売中コンプ率と図鑑コンプ率の母数分離、回数ベース消費金額など、定義がコードと一致
- **写真主役のカード規律**: 画像比率統一・名前領域固定・バッジ最大2・価格位置固定が守られている
- **エリアカードのポスター表現**: 公式エリア画像＋黒グラデは「テーマパークの地図」感が出ており、アプリ内で最も世界観に近い
- **公開準備の完成度**: 法務7ページ、release-readiness監査、PWA/Capacitor、プライバシー設計（端末内保存）
- **USJカラーへの統一**: v3監査で緑系を排除しUSJ Blue/Navy/Goldへ統一済み

## 10. 現在の弱み

- **ホームが「数字の現在地」であって「集めたくなる棚」ではない**: ファーストビューの主役が 0/183 と 0% のタイポグラフィ。未取得ユーザーには「空っぽの成績表」から始まる。写真（コレクションの中身）はスクロール後
- **コレクションの「モノ」感が無い**: zukanNumber・rarity がデータ型に存在するのに、一覧カードでは図鑑No.もレア度も見えない（詳細ページに `getZukanCode` があるのみ）。「集める対象」ではなく「商品リスト」に見える
- **取得時の報酬体験が無い**: 「食べた」ボタンはトグルで即終了。achievement-unlockアニメは定義されているが、ホーム/カードからの取得時に祝祭演出・図鑑が埋まる体験がない（achievements/completeページは撤去済み）
- **データ品質が見えてしまう**: 「価格未確認」「エリア確認中」「カテゴリ確認中」が一般画面に露出し、図鑑の世界観を壊す（v3監査でも残課題と明記）
- **`/foods` のフィルターが依然多い**: チップ＋折りたたみ化はされたが、ソート10種・販売状態8種・価格有無等、業務UI的選択肢が残る
- **README等の不整合**: `/complete` 記載が残るが実体は空。audit:canonicalは旧基準(200件)で失敗中（real-user-audit-v3記載）
- **構造の小傷**: layout.tsxの`<main>`内でhome-dashboardが再度`<main>`をレンダリングする入れ子（アクセシビリティ/セマンティクス上不正）。ホームだけ背景色`bg-[#f6f8fa]`を独自に持ちlayoutのpaddingと二重になる

## 11. 触ると危険な場所

- **lib/food-utils.ts**: canonical集計・コンプ率の心臓部。母数定義を変えると全画面の数字とユーザーの達成率が変わる
- **lib/local-user-data.ts / use-food-logs.ts**: ユーザーの食べた記録の保存スキーマ。キー名や形式を変えると既存ユーザーの記録が消える（マイグレーション必須）
- **lib/repositories/foods.ts の可視性フィルタ**: 閾値（nameQualityScore≥60, confidenceScore≥45等）をいじると公開商品が増減し、placeholder混入や商品消失が起きる
- **scripts/crawlers/ 一式と supabase/migrations**: データ取得・品質判定のパイプライン。UI改善の文脈で触る必要はない
- **home-progress-client.tsx の `is25thFood()`**: 正規表現ヒューリスティック。real-user-audit-v3で1件ずつ人手監査した結果と対応しており、安易な変更は25thコレクションの中身を壊す
- **AGENTS.mdの開発サーバー規則**: localhost:3000 を kill しない、等の運用ルールあり
- **PRODUCT.mdのデータ原則**: 「既存商品は削除しない」「画像をplaceholderに戻さない」「価格を推測しない」— 改善実装時もこの原則は不可侵

## 12. ドキュメントと実装の乖離（メモ）

- USJ_FOOD_GUIDE_DESIGN.mdは「次回食べたいの復活」を禁止しているが、food-detail.tsx / eaten-experience.tsx には「次回食べたい」ボタンとタブが実装されている（設計書違反 or 設計書の更新漏れ。判断は要オーナー確認）
- DESIGN.mdのBase色 `#fffaf5`（ウォーム）に対し、実装は `#f6f8fa` / `#f8fafc`（クールグレー）。高級感・ユニバ感の評価に影響（product-review.mdで詳述）
