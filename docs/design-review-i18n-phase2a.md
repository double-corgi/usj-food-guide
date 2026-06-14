# design-review-i18n-phase2a.md

## 対象

- Codex実装: `docs/codex-goal-i18n-phase2a.md`
- 実装commit: `644a34e`（backup: `3a324b0`）
- レビュー方法: `git diff 3a324b0 644a34e --stat` / 全差分read + 本番環境 (`https://new-app-chi-rosy.vercel.app`) への独立fetch

## 判定

**承認**

---

## 1. Phase2A範囲遵守

`git diff 3a324b0 644a34e --stat` で変更されたのは以下9ファイルのみ。

```
app/areas/[id]/page.tsx
app/stores/[id]/page.tsx
components/area-collection-summary.tsx
components/area-eaten-foods.tsx
components/area-food-status-lists.tsx
components/home-progress-client.tsx
components/i18n-text.tsx (新規)
components/store-food-list.tsx
lib/i18n/dictionaries.ts
```

- Phase2Bで予定している `/foods`, `/foods/[id]`, `/eaten`, ジャンル/カテゴリ系の翻訳には未着手。範囲外ファイルへの変更なし。スコープ遵守を確認。
- `area.*`（17キー）, `store.*`（3キー）, `collection.*`（2キー）が `lib/i18n/dictionaries.ts` に4言語分追加され、ja値は `codex-goal-i18n-phase2a.md` 記載の表と完全一致。
- `common.*` 11キーのうち接続されたのは `common.eaten`（`store-food-list.tsx` の `aria-label`）の1件のみ。Codexの報告「共通UIラベルを翻訳対象へ接続」は技術的には正しいが、実態は最小限の接続である点を記録しておく。これは `codex-goal-i18n-phase2a.md` の「完全一致箇所のみ接続」という指示に沿った結果であり、不備ではない。
- `components/bottom-nav.tsx` は作成されておらず、指示通り。
- 新規ファイル `components/i18n-text.tsx` はPhase1のi18nパターン（`useLocale`/`t()`）をサーバーコンポーネント内で使うための薄いラッパーであり、設計意図と一致。

## 2. URL構造

- `/en`, `/ko`, `/zh-TW` のルートは追加されていない（Phase2A設計通り、URLはja単一構造を維持）。
- 既存ページのURL（`/areas/[id]`, `/stores/[id]` など）に変更なし。
- `localStorage` キー `unicolle-locale` による言語切替方式はPhase1から継続。`lib/i18n/locales.ts`, `lib/i18n/use-locale.tsx` はdiffに含まれず変更なし。

## 3. 翻訳対象外の維持

- 商品名・店舗名・エリア名・カテゴリ名・ジャンル名・商品説明は翻訳対象になっていない。本番 `/areas/area-apf4z5` および `/stores/shop-1vff8rf` のfetchで、商品名（例: 「マリオ・バーガー ~ベーコン&チーズ~」）、店舗名（「キノピオ・カフェ」）、エリア名（「スーパー・ニンテンドー・ワールド」）は全てja原文のまま表示されることを確認。
- 変数埋め込み文字列（`このエリアであと{uneaten}品`、`食べた {n} / 販売中 {n}品（登録分）`、`コンプ率 {rate}%`、`{shops.length}か所`、`{displayFoods.length}品を掲載しています。`）はPhase2A対象外として正しく未翻訳のまま。`area-collection-summary.tsx` の差分でも該当箇所は変更されていない。
- generated JSON / crawler / DBに関わるファイルはdiffに含まれず、変更なし。

## 4. 翻訳品質

- **ja**: 本番fetchで以下を確認。
  - `/areas/area-apf4z5`: 「エリア一覧へ戻る」「まず食べたい3品」「このエリアで見つけるならここから。」「終了間近のフード」「このエリアで食べたフード」「このエリアの1品目を見つけよう。」「残りのフード」「残りをすべて見る」「販売場所」が表示され、`dictionaries.ts` のja値と一致。
  - `/stores/shop-1vff8rf`: 「店舗一覧へ戻る」「この店舗で買える商品」が表示され一致。「25品を掲載しています。」は変数埋め込みのため未翻訳のまま正しく表示。
  - フッターの「通知設定」は前回レビュー（Phase1.1）で確認済みの通り、Phase2Aでも変更なく正しい。
- **en/ko/zh-TW**: `lib/i18n/dictionaries.ts` のdiffを読み、`area.*`/`store.*`/`collection.*` の3言語分の訳文がPhase1の用語・トーンと一致していることをコード上で確認した。ただし本番環境での実際の表示・390px/430px幅でのレイアウト崩れ確認は、ブラウザツール（Claude in Chrome）への接続が今回も行えず未実施。これはPhase1/Phase1.1レビュー時から続く既知の検証ギャップであり、過去のレビューでも承認のブロッカーとはしていない。本レビューでも同様に扱う。

## 5. 既存デザインの非破壊

- `git diff --stat` の対象は前述9ファイルのみ。`home v1.2`、`area-detail-v1.1` のレイアウト・スタイルに関わるJSX構造やTailwindクラスへの変更は、テキストをハードコードから `t()`/`<I18nText>` 呼び出しに置き換えただけで、構造・クラスは変更されていない（各diffで確認済み）。
- `/foods`, `/foods/[id]`, `/eaten`, `/areas`, `/stores`, `/settings` はdiffに含まれず、変更リスクはない。
- `/areas/[id]` 本番fetchで、レイアウト崩れや欠落要素は見られなかった（静的HTML確認の範囲内）。

## 6. 技術面

- **t()の使用範囲**: 各コンポーネントで `useLocale()` から `t` を取得し、固定文言の箇所にのみ適用。過剰な置き換えはなく、変数埋め込み文字列は意図的に除外されている。適切かつ最小限。
- **fallback**: `t()` の3段フォールバック（locale → ja → raw key）の実装自体（`lib/i18n/use-locale.tsx` 等）はdiff対象外で、Phase1から変更なし。新規キーが4言語すべてに追加されているため、未翻訳キーによるフォールバック発生はそもそも想定されない。
- **hydration**: `components/i18n-text.tsx` は `"use client"` の小さなラッパーで、`getServerSnapshot` がja固定を返すPhase1のパターンを継承。サーバーレンダリング時はja、クライアントでlocaleに応じて再描画される構成であり、Phase1で確認済みのhydration安全性パターンを踏襲している。新規の不整合リスクは見当たらない。
- **localStorage不正値→ja復帰 / document.documentElement.lang同期**: いずれも `lib/i18n/use-locale.tsx` 等のPhase1実装に変更なし（diff対象外）。Phase2Aによる影響はない。

---

## 観察事項（承認はするが、Phase2B以降で検討してよい点）

1. `area.eatenFoodsViewAll`（「すべて見る」）と既存未使用キー `common.viewAll`（同じく「すべて見る」）が重複している。Phase2Bでの整理対象として記録。
2. `common.*` 11キーのうち10キーは依然未接続。Phase2A範囲では「完全一致箇所のみ接続」のルールに沿った結果であり問題はないが、Phase2B以降でこれらのキーをどう扱うか（使う場面を新設するか、削除するか）を検討するとよい。
3. en/ko/zh-TWの本番表示および390px/430px幅でのレイアウト確認は、ブラウザツール接続不可のため引き続き未実施。今後ブラウザツールが利用可能になった際にまとめて確認することを推奨。

---

## 総合評価

Phase2Aの実装は `codex-goal-i18n-phase2a.md` の指示範囲内に収まっており、スコープ外ファイルへの変更、URL構造の変更、翻訳対象外（固有名詞・変数埋め込み文言）への誤った翻訳適用は見られない。ja本番表示は `/areas/[id]` と `/stores/[id]` の両方で意図通り確認でき、既存デザイン（home v1.2 / area-detail-v1.1）への影響もdiff範囲から見て実質ゼロと判断できる。技術面（t()/fallback/hydration/localStorage/lang）もPhase1の安全な実装パターンを継続しており問題なし。

en/ko/zh-TWおよびレスポンシブ幅の本番確認は未実施だが、これは過去のPhase1/1.1レビューから続く既知のツール制約であり、コード上の訳文自体はPhase1の品質基準と一致している。

以上により、**承認**とする。Phase2B設計への移行を妨げる要素はない。
