# design-review-i18n-phase2b.md

## 対象

- Codex実装: `docs/codex-goal-i18n-phase2b.md`
- 実装commit: `28ec7c1`（backup: `1fd9af7`）
- レビュー方法: `git diff 1fd9af7 28ec7c1 --stat` / 全差分read + 本番環境 (`https://new-app-chi-rosy.vercel.app`) への独立fetch

## 判定

**条件付き承認**

---

## 1. Phase2B範囲遵守

`git diff 1fd9af7 28ec7c1 --stat` で変更されたのは以下7ファイルのみ。

```
app/areas/[id]/page.tsx
components/area-collection-summary.tsx
components/home-dashboard.tsx
components/home-progress-client.tsx
components/i18n-text.tsx
lib/i18n/dictionaries.ts
lib/i18n/use-locale.tsx
```

- 対象ページは `/`（home-dashboard, home-progress-client）と `/areas/[id]`（page.tsx, area-collection-summary）のみで、Phase2Bの範囲と一致。
- `/foods`, `/foods/[id]`, `/eaten`, `/areas`（一覧）, `/stores`, `/stores/[id]`, `/settings` に該当するファイルへの変更はなく、Phase2C以降への踏み込みなし。
- 新規辞書キー: `area.remainingCount`, `area.eatenProgress`, `area.viewAllSalesLocations`, `home.collectibleFoods`, `home.collectibleFoodsDescription`, `home.limitedCollection`, `home.viewRegisteredCollection`, `home.activeCount`, `home.remainingCount`, `home.collectionCount`。すべて4言語（ja/en/ko/zh-TW）に追加済みで、`codex-goal-i18n-phase2b.md` の候補表と整合。
- 既存キーの再利用: `footer.tagline`（home-progress-client.tsx の `appBrand.tagline` → `t("footer.tagline")`）、`collection.firstBite`（既存利用継続）。両者ともja値が完全一致していることを `lib/constants.ts` / `dictionaries.ts` で確認済み。
- キー重複の新規発生なし（既存の `area.eatenFoodsViewAll`/`common.viewAll` 重複はPhase2A由来でPhase2Bでは増えていない）。

## 2. URL構造

- `git diff --stat` 対象に `app/` 配下のルーティング関連ファイル（`layout.tsx`, `[locale]` 等）は含まれない。`/en`, `/ko`, `/zh-TW` ルートは追加されていない。
- 本番 `/`, `/areas/area-apf4z5` のfetchで、内部リンクのURL構造（`/foods/...`, `/areas/...`, `/stores/...`）に変化はなし。
- `lib/i18n/locales.ts` はdiff対象外（変更なし）。`localStorage` キー `unicolle-locale` による言語切替方式を継続。

## 3. 翻訳対象外の維持

本番fetch（`/`, `/areas/area-apf4z5`）で以下を確認:

- 商品名（例: 「マリオ・バーガー ~ベーコン&チーズ~」「スチュアートのベーコンチーズ・バーガープレート」等）はja原文のまま。
- エリア名（「スーパー・ニンテンドー・ワールド」）、店舗名（「キノピオ・カフェ」）はja原文のまま。
- 「25周年」「スタジオ・スターズ 25周年スペシャルプレート」などイベント名・記念表記もja原文のまま、翻訳されていない。
- 価格表示（￥2,600 等）、件数・パーセンテージ等のgenerated JSON由来データはそのまま。
- `git diff` の変更行を確認した範囲でも、商品名・店舗名・エリア名・カテゴリ名・ジャンル名・商品説明・レビュー文を対象にした置換は見当たらない。

対象外維持は問題なし。

## 4. 翻訳品質

### 4.1 ja（本番確認済み）

- ホーム: 「食べた記録が、そのままコレクションになる。」「最初の1品から。」「販売中 183品（登録分）」「食べると、棚が色づく。」「今集められるフード」「写真で選べる、販売中の登録フード。」「期間限定コレクション」「登録済みコレクションを見る」がすべて表示され、`dictionaries.ts` のja値と一致。
- area詳細: 「エリア一覧へ戻る」「このエリアであと」「30品」「食べた 0 / 販売中 30品（登録分）」「まず食べたい3品」「このエリアで見つけるならここから。」「このエリアで食べたフード」「このエリアの1品目を見つけよう。」「残りのフード」「残りをすべて見る」「販売場所」が表示。
- `area.viewAllSalesLocations`（「すべての販売場所を見る」）は今回のfetchでは `hidden.length === 0`（4か所すべて表示済み）のため、`<details>` 要素自体がレンダリングされておらず、本番上では未確認。コード上は `<I18nText k="area.viewAllSalesLocations" />（あと{hidden.length}か所）` として実装されており、ja値「すべての販売場所を見る」がそのまま使われる構成で問題なし。隠れている店舗があるエリアでの表示確認は別途推奨（ブロッカーではない）。

### 4.2 en/ko/zh-TW

- `dictionaries.ts` のdiffを読み、`area.*`/`home.*` の新規キーについて3言語分の訳文が追加されていることを確認。トーン・文体はPhase1/2Aの既存訳文と一貫している。
- 本番環境でのen/ko/zh-TW表示確認、および390px/430px幅でのレイアウト確認は、ブラウザツール（Claude in Chrome）への接続が今回も行えず未実施。これはPhase1〜2Aレビューから続く既知の検証ギャップであり、過去レビューでも承認のブロッカーとしていない。本レビューでも同様に扱うが、**Phase2Bで新たに導入した `area.eatenProgress`（en: "Eaten {{eaten}} / On sale {{total}} items (registered)"）や `home.activeCount`+`home.remainingCount` の連結表示（en: "On sale 183 items (registered)・32 left"）は文字数が長く、390px幅での折れ・はみ出しのリスクが他キーより高い**。次回検証可能になった時点で優先的に確認することを推奨する。

## 5. 既存デザイン破壊

- `git diff --stat` の対象は前述7ファイルのみ。`/foods`, `/foods/[id]`, `/eaten`, `/areas`（一覧）, `/stores`, `/stores/[id]`, `/settings` に該当するファイルは変更されておらず、破壊リスクはない。
- home-dashboard.tsx, home-progress-client.tsx の変更はテキストをハードコードから `t()`/`I18nText` 呼び出しに置き換えるものが中心で、構造・Tailwindクラスは概ね変更なし。
- 本番 `/` のfetchで、ホームの主要セクション（コレクションヒーロー、今集められるフード、期間限定コレクション、エリア一覧、店舗から探す、登録済みコレクションを見る）はすべて表示されており、レイアウト崩れは見られない。
- **`components/area-collection-summary.tsx` の変更は、Phase2A承認時点から存在する `area-detail-v1.1` の主要な視覚要素（「あと」見出し＋大きな数字「30品」を2行・`text-[2rem]`で表示する構成）を、1行のセンテンス「このエリアであと30品」を `text-[1.35rem]`（sm:`1.5rem`）で表示する構成に変更している。** これは翻訳文（特にenの "32 left in this area" のような長い文）を破綻なく表示するための変更と推測されるが、結果として area-detail-v1.1 で目立っていた「大きな数字で残数を示す」ゲーム感の強い視覚表現が、通常サイズの説明文に近い表現へ縮小されている。`codex-goal-i18n-phase2b.md` では「area-detail-v1.1のデザイン変更」を禁止事項としていたため、この変更は範囲を超えている可能性がある。

## 6. 技術面

- **t()の使い方**: `t("area.remainingCount", { count: uneaten })` / `t("area.eatenProgress", { eaten, total })` / `t("home.activeCount", { count })` / `t("home.remainingCount", { count })` など、すべて固定文言＋変数差し込みの範囲内で、過剰な使用は見られない。
- **fallback**: `lib/i18n/use-locale.tsx` の `t()` は `dictionaries[locale][key] ?? dictionaries[defaultLocale][key] ?? key` を維持した上で、`params` が指定された場合のみ `{{key}}` プレースホルダーを `replaceAll` で置換する実装。`params` 未指定時は早期return（`if (!params) return value;`）するため、既存の `t("nav.home")` 等の呼び出しに影響なし。設計通り、最小限かつ安全な拡張。
- **未翻訳キーで壊れないか**: 新規キーは4言語すべてに追加済みのため、未翻訳キーによるフォールバック発生は想定されない。仮に欠落していてもja→key の3段フォールバックは健全。
- **hydration**: `components/i18n-text.tsx` への `params` 追加は型定義の拡張のみで、`"use client"` ラッパーとしての構造（`useLocale()` → `t(k, params)`）はPhase2Aから変更なし。`HomeActiveFoodCollection` / `HomeLimitedCollection` で新たに `useLocale()` を呼び出しているが、いずれも既存の `"use client"` コンポーネント内であり、新たなhydration不整合のリスクは見当たらない。
- **localStorage不正値→ja復帰 / document.documentElement.lang**: `lib/i18n/use-locale.tsx` の該当ロジック（`getSnapshot`, `useEffect`, `setLocale`）はdiffで変更されておらず、Phase1/2Aから継続。問題なし。

---

## 条件付き承認の理由（要対応・要確認事項）

1. **area-detail-v1.1のスタイル変更について**: 上記5章で述べた `area-collection-summary.tsx` の「あと30品」表示の縮小・1行化は、`codex-goal-i18n-phase2b.md` の禁止事項「area-detail-v1.1のデザイン変更」に抵触する可能性がある。機能的には正しく動作しており、ビルド・lint・typecheckも成功しているため、緊急の修正は必須としないが、Ownerとして以下のいずれかの方向性を次フェーズで明確にすることを推奨する。
   - (a) 翻訳文の長さに関わらず、ja表示時は元の「大きな数字」表現を維持する（locale別の表示分岐を追加）。
   - (b) 現在の縮小表示を新しい正式デザインとして受け入れる。
   - (c) Phase2Cで `area-detail` のスタット表示全体を多言語対応も踏まえて再設計する。
2. **390px/430px幅でのen/ko/zh-TW表示確認が未実施**: 特に `area.eatenProgress` と `home.activeCount`＋`home.remainingCount` の連結表示は文字数が長く、折れ・はみ出しのリスクが他キーより高い。次回ブラウザ確認が可能になった際に優先的に確認すること。
3. **`area.viewAllSalesLocations` の本番表示が未確認**（隠れた店舗が存在するエリアでの確認）。実装自体は妥当だが、表示確認は別途推奨。

これら3点はいずれもブロッカーとはしないが、(1)はOwnerの意図的な判断を要するため、次の修正用 `/goal` 作成前に方向性を確認することを推奨する。

---

## 総合評価

Phase2Bの実装は、対象ページ（`/`, `/areas/[id]`）・対象言語（ja/en/ko/zh-TW）・翻訳対象外（固有名詞・イベント名・generated JSON由来データ）の扱いについて、`codex-goal-i18n-phase2b.md` の指示と一致している。`t()` への `params` 拡張は設計通り最小限かつ既存呼び出しに影響のない安全な実装であり、技術面（fallback/hydration/localStorage/lang）にも問題はない。

一方で、`area-collection-summary.tsx` における「あと30品」表示の視覚的な縮小・1行化は、area-detail-v1.1のデザインに対する意図せざる変更の可能性があり、UNICOLLEが重視する「ゲーム感」「コレクション欲」の観点からもOwnerの判断を要する。この点を要確認事項として明示した上で、**条件付き承認**とする。Phase2C以降への移行を妨げる技術的な問題はない。
