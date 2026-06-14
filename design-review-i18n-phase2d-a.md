# design-review-i18n-phase2d-a.md

## 0. 対象

- 実装: i18n Phase 2D-A（`/eaten` の固定UI文言の多言語化）
- commit: `053606c8`（backup: `6a98e6d`）
- 参照仕様: `docs/codex-goal-i18n-phase2d-a.md` / `docs/i18n-phase2d-a-design-v1.md`

## 1. Phase 2D-A の範囲確認

`git diff 6a98e6d 053606c8 --stat` で変更ファイルを確認した。

- `components/eaten-experience.tsx`（+92/-44相当）
- `components/eaten-area-progress.tsx`
- `components/eaten-genre-progress.tsx`
- `lib/i18n/dictionaries.ts`（+212行、`eaten.*`系キー追加）
- `docs/i18n-phase2d-a-design-v1.md` / `i18n-phase2d-a-design-v1.md`（設計ドキュメント保存）
- `docs/codex-goal-i18n-phase2d-a.md` / `codex-goal-i18n-phase2d-a.md`（指示書保存）
- `screenshots/i18n-phase2d-a-eaten-{en,ko,zhtw}-{390,430}.png`（新規6枚）

`/foods`・`/foods/[id]`・`/areas`・`/areas/[id]`・`/stores`・`/stores/[id]` 関連ファイル（`components/food-card.tsx`、`components/food-grid.tsx`、`app/foods/**`、`app/areas/**`、`app/stores/**`等）は一切変更されていない。Phase 2D-B以降（`/areas`/`/stores`等）に踏み込んだ形跡もない。

判定: **Phase 2D-Aのスコープ（`/eaten`の固定UI文言＋下部の`eaten-area-progress`/`eaten-genre-progress`）に収まっている。問題なし。**

## 2. 翻訳対象外の維持

`components/eaten-experience.tsx` / `eaten-area-progress.tsx` / `eaten-genre-progress.tsx` のdiffを全行確認した。

- 商品名（`food.name`）: 変更なし。`EatenAlbumCard`/`NextWantCard`/最近の記録カードでそのまま表示。
- 店舗名・エリア名（`getFoodAreaSummary`、`progress.area.name`等）: 変更なし。
- カテゴリ名・ジャンル名（`categoryLabels`の値、カテゴリフィルターのoption値、`progress.label`/`item.label`）: 変更なし。
- 商品説明: 対象箇所なし（元々`/eaten`に商品説明の表示はない）。
- ユーザー記録メモ（`log.memo`）: `{log.memo ? <p ...>{log.memo}</p> : null}` のまま、`t()`化されていない。
- 価格（`formatFoodPrice(food)`、`totalSpend`の数値部分、`¥${totalSpend.toLocaleString("ja-JP")}`）: 変更なし。
- 日付フォーマット: `formatDate`関数の`Intl.DateTimeFormat`オプション（`month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo"`）は変更なし。フォールバック文言「日付未記録」のみ`formatDate(value?: string, fallback = "日付未記録")`という第2引数化により`t("eaten.dateUnknown")`を渡せるようにした実装。日付が存在する場合の表示形式に変更はない。
- generated JSON由来データ: 変更なし。

ja本番ページ（`/eaten`）をフェッチし、エリア別進捗・ジャンル別進捗のセクションでエリア名（「ハリウッド・エリア」「スーパー・ニンテンドー・ワールド」等）、ジャンル名（「スイーツ」「ドリンク」「バーガー」等）が翻訳されず日本語のまま表示されることを確認した。

判定: **翻訳対象外は維持されている。問題なし。**

## 3. 既存データの非破壊

- `useFoodLogs`、`localStorage`の`UserFoodLog`構造・キー名（`eatenAt`/`eatenCount`/`memo`/`userPhotoUrl`/`status`/`spentAmount`等）には一切触れていない。diffに`lib/use-food-logs.ts`や型定義ファイルの変更は含まれていない。
- `formatDate`関数の変更はフォールバック値を引数化したのみで、ロジック（日付パース・フォーマット処理）自体は変更なし。
- `localStorage`の`unicolle-locale`キー・イベント（`unicolle-locale-change`）にも変更なし。

判定: **既存の記録データ・localStorage schemaへの影響はない。問題なし。**

## 4. 表示品質

スクリーンショット6枚（en/ko/zh-TW × 390px/430px）を確認した。

- 全言語・両幅で見出し（"Eaten Log"/"먹은 기록"/"已吃記錄"）、タブ、統計行、最近食べたもの、アルバム一覧、フィルター、エリア別/ジャンル別進捗セクションが表示されており、横スクロールや表示崩れは見られない。
- アルバムモードタブ（"Recent"/"This month"/"By area"/"By genre"/"All"、ko「최근/이번 달/에리어별/장르별/전체」、zh-TW「最近/本月/依區域/依類型/全部」相当）も一覧で確認できる範囲では折り返し・はみ出しなし。
- 下部ナビゲーション（「ホーム/探す/食べた/エリア/店舗」相当）との重なりは確認されなかった。
- ja本番フェッチでは「記録アルバム」「食べた記録」「最近食べたもの」「アルバム」「食べた商品一覧」「エリアごとの記録」「ジャンルごとの記録」等、設計通りの文言が表示され、`eaten.albumCount`（「0 / 0品」）、`eaten.sectionCount`は0件状態のため非表示（アルバムセクション自体が空のため`section.records`が無く`eaten.noFilterResults`が表示）という想定通りの挙動だった。

768/1280/1920pxのスクリーンショットは提供されていないが、変更箇所はテキストの`t()`化のみでレイアウト構造（クラス・grid/flex）自体は変更されていないため、390/430pxで崩れがないことから広い幅でも同様に問題ないと判断する。

判定: **表示品質に問題なし。**

## 5. 既存機能の非破壊

- ホームv1.2: `git diff --stat`の通り、ホーム関連ファイル（`app/page.tsx`、ホーム用コンポーネント）は無変更。本番`/`をフェッチし、ヒーロー・「今集められるフード」「期間限定コレクション」「エリア一覧」等のv1.2構成が正常表示されることを確認した。
- area-detail-v1.1: `app/areas/[id]/**`関連は無変更。`/eaten`から`/areas/area-olb56e`等へのリンクURLも変更なし。
- `/foods` Phase 2C-A/2C-B: `components/food-card.tsx`/`components/food-grid.tsx`/`app/foods/**`/`components/food-detail.tsx`は無変更。`/eaten`下部のジャンル別進捗からのリンク（`/foods?category=...&mode=eaten`等）もURL形式は変更なし。

判定: **既存機能への影響なし。**

## 6. 軽微な指摘事項（参考）

`components/eaten-experience.tsx`の`NextWantCard`内、`food.isLimited`時のバッジ表記が以下のように変更されている。

```diff
- <p className="mt-1 text-[11px] font-bold text-slate-400">{food.isLimited ? "限定 / " : ""}{getSaleStatusLabel(food)}</p>
+ <p className="mt-1 text-[11px] font-bold text-slate-400">{food.isLimited ? `${t("common.limited")} / ` : ""}{getSaleStatusLabel(food)}</p>
```

`common.limited`のja値は「期間限定」であり、元のリテラル「限定」とは表記が異なる（en="Limited Time"等も同様に元の意図より長い表記になる）。この箇所は`codex-goal-i18n-phase2d-a.md`の2.1〜2.3で定義した候補キーに含まれておらず、既存キー`common.limited`を流用したことで**ja表示文言が「限定」→「期間限定」に変化**している。

機能的な問題ではなく、`/foods`一覧の他箇所（badge表記等）でも「期間限定」表記は使われているため表記の不統一というレベルの軽微な差分だが、「ja表示文言自体は変更しない」という本フェーズの方針には厳密には合致していない。次フェーズ以降で対応するか、現状の「期間限定」表記を正式採用とするかをオーナー判断で決めることを推奨する。

## 7. 総合判定

**条件付き承認**

Phase 2D-Aのスコープ・翻訳対象外維持・既存データ非破壊・表示品質・既存機能非破壊のいずれも問題は見つからなかった。唯一、6章で指摘した`NextWantCard`内の「限定」→「期間限定」という表記変更が、候補キーに含まれない既存キー（`common.limited`）の流用によって発生している。

### 条件

1. `NextWantCard`の`food.isLimited`バッジ表記について、以下のいずれかを選択し対応すること。
   - (a) 元の表記「限定」を維持するため、新規キー（例: `eaten.limitedBadge`、ja="限定"）を追加してそちらを使う。
   - (b) 「期間限定」表記への変更を正式に受け入れ、その旨を本フェーズの差分として記録する（コード変更は不要、オーナー承認のみで条件解消とする）。

(b)を選択する場合、コード変更は不要なため、オーナーが「期間限定表記でよい」と判断した時点でこの条件は解消とする。

Phase 2D-B（`/areas`/`/stores`等）の`/goal`は本レビューでは作成しない。
