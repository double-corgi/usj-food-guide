# i18n-phase2d-b-design-v1.md

## 1. Objective

i18n Phase 2D-B では、`/areas`（エリア一覧ページ）の固定UI文言のみを多言語化する（ja/en/ko/zh-TW）。

対象ページ:
- `/areas`（`app/areas/page.tsx` + `components/area-overview.tsx`）

対象外（変更しない）:
- `/`
- `/foods`
- `/foods/[id]`
- `/eaten`
- `/areas/[id]`
- `/stores`
- `/stores/[id]`

jaを基準・フォールバックとする。既存のi18n基盤（`LocaleProvider`/`useLocale`/`t()`、3段フォールバック、`{{placeholder}}`補間）をそのまま使用し、新しい仕組みは作らない。

## 2. Translation Scope

### 2.1 対象ファイルの現状確認

`app/areas/page.tsx`（サーバーコンポーネント、`"use client"`なし）には以下の固定UI文言がある。

```tsx
<p className="text-xs font-black tracking-[0.16em] text-park/70">エリア別フード図鑑</p>
<h1 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">エリアから探す</h1>
<p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">残りフードをエリアごとに確認できます。</p>
```

`components/area-overview.tsx`（`"use client"`）には、各エリアカード内に以下の固定UI文言がある。

```tsx
<p className="mt-2 text-xs font-black text-white/80">残り {completion.uneaten}品 / コンプ率 {completion.rate}%</p>
```

このカードに表示される`area.name`（エリア名、例: 「ハリウッド・エリア」）は商品データ起因の表示であり翻訳対象外。

### 2.2 翻訳してよいもの（実在する固定UI文言）

- 「エリア別フード図鑑」（ページ上部のkicker）
- 「エリアから探す」（ページタイトル h1）
- 「残りフードをエリアごとに確認できます。」（ページサブタイトル）
- 「残り {{count}}品 / コンプ率 {{rate}}%」（各エリアカード内の進捗テキスト）

実在しない文言は追加しない（詳細は2.4参照）。

### 2.3 翻訳してはいけないもの

- エリア名（`area.name`）
- 商品名（本ページには商品名は表示されないが、念のため対象外として明記）
- 店舗名
- カテゴリ名・ジャンル名
- 商品説明
- 価格
- 日付
- generated JSON由来の商品データ
- 画像内テキスト（エリア画像内の文字、`area.image`）

### 2.4 ユーザー提示の候補キーと実装の対応関係

ユーザー提示の候補（「エリア一覧」「エリアから探す」「このエリアで探す」「残り◯品」「食べた◯品」「販売中◯品（登録分）」「エリア別コレクション」「表示するエリアがありません」）と、`app/areas/page.tsx`/`components/area-overview.tsx`の実際のコードを照合した結果は以下の通り。

| ユーザー候補 | 実装上の対応 |
|---|---|
| エリアから探す | `app/areas/page.tsx`のh1「エリアから探す」と一致。**翻訳対象に含める**（`areas.title`）。 |
| エリア一覧 | `/areas`ページ本文中には存在しない（home/footerのナビ表示「エリア一覧」は`nav.*`/`footer.*`の既存キーで別管理、Phase2D-Bでは変更しない）。本ページのkicker「エリア別フード図鑑」を`areas.kicker`として翻訳対象に含める（候補「エリア一覧」とは文言が異なるため新規追加はしない）。 |
| 残り◯品 | `area-overview.tsx`の「残り {completion.uneaten}品 / コンプ率 {completion.rate}%」と部分的に一致。**この1文全体を1キー（`areas.cardProgress`）として翻訳対象に含める**。「残り◯品」だけを切り出した別キーは追加しない（文として不自然になるため）。 |
| このエリアで探す | `/areas`に該当する文言なし。追加しない。 |
| 食べた◯品 | `/areas`に該当する文言なし（`/eaten`のエリア別進捗にある`eaten.areaProgress.*`とは別ページ）。追加しない。 |
| 販売中◯品（登録分） | `/areas`に該当する文言なし（ホームの統計表示）。追加しない。 |
| エリア別コレクション | `/areas`に該当する文言なし。追加しない。 |
| 表示するエリアがありません | `/areas`の表示エリア一覧は`areaImageDefinitions`という固定リストから生成され、空配列になる経路が現状存在しない（常に固定数のエリアが表示される）。空状態UIは実在しないため、新規追加しない。空状態キーを先行整備するかはStop and Askで確認する。 |

候補のうち「エリアから探す」「残り◯品 / コンプ率◯%」の2箇所のみが実装に存在する固定UI文言として翻訳対象となる。加えて、ページ上部のサブタイトル「残りフードをエリアごとに確認できます。」も固定UI文言として翻訳対象に含める（候補リストには明示されていないが、`/areas`の主要な説明文であり翻訳しないと不整合になるため）。

## 3. Candidate Keys

新規namespace `areas.*`（`/areas`一覧ページ専用、`area.*`は`/areas/[id]`詳細ページの既存namespaceのため重複を避ける）。

| key | ja（現状値） | 用途 |
|---|---|---|
| `areas.kicker` | エリア別フード図鑑 | ページ上部のkicker（`app/areas/page.tsx`） |
| `areas.title` | エリアから探す | ページタイトル h1（`app/areas/page.tsx`） |
| `areas.subtitle` | 残りフードをエリアごとに確認できます。 | ページサブタイトル（`app/areas/page.tsx`） |
| `areas.cardProgress` | 残り {{count}}品 / コンプ率 {{rate}}% | 各エリアカード内の進捗テキスト（`components/area-overview.tsx`）。`{{count}}`=`completion.uneaten`、`{{rate}}`=`completion.rate` |

計4キー × 4言語 = 16エントリ。

新規追加するキーは上記4つのみ。既存キー（`area.*`、`eaten.areaProgress.*`、`nav.*`、`footer.*`等）の流用や変更は行わない。

### 3.1 `eaten.areaProgress.remaining`（"残り {{count}}"）との関係

`/eaten`の`eaten.areaProgress.remaining`は「残り {{count}}」という短い文字列で、`/areas`の`areas.cardProgress`「残り {{count}}品 / コンプ率 {{rate}}%」とは文構造・パラメータ数が異なる。Phase2C-A.1で確立した「ja値が似ていても用途が異なる場合は別キーにする」方針に従い、`areas.cardProgress`は新規の独立したキーとし、`eaten.areaProgress.remaining`の流用・改変は行わない。

## 4. Page Impact

- `app/areas/page.tsx`: サーバーコンポーネントのまま`useLocale`を使うか、`getDictionary`等のサーバー向けAPIが既存であればそれを使う（実装方針はCodex側の`/goal`で具体化するが、本設計では「サーバーコンポーネントのため既存のi18n基盤がサーバー側でどう使われているか」を実装前に必ず確認する点をリスクとして記載する。Phase2A〜2D-Aは`"use client"`コンポーネントのみだったため、本フェーズが初のサーバーコンポーネント対応になる可能性がある）。
- `components/area-overview.tsx`: 既存の`"use client"`コンポーネント。`useLocale`を追加し、`areas.cardProgress`を`t()`で表示する。`completion.uneaten`/`completion.rate`は数値のまま、`{{count}}`/`{{rate}}`として渡す。
- 他ページ（`/`、`/foods`、`/foods/[id]`、`/eaten`、`/areas/[id]`、`/stores`、`/stores/[id]`）への変更はない。

## 5. Risks

- `app/areas/page.tsx`がサーバーコンポーネントであるため、クライアント専用の`useLocale`フックがそのまま使えない可能性がある。サーバーコンポーネント側でロケールを取得する既存の仕組み（あれば）を`lib/i18n/use-locale.tsx`で確認し、なければ該当部分を`"use client"`の小コンポーネントに分離する等の対応が必要になる可能性がある（実装方針の決定はCodexの`/goal`作成時に行う）。
- `areas.cardProgress`はカード内の限られた幅に表示されるため、en/ko/zh-TWで文字数が増えると2行になり、画像下部のグラデーション領域内でのレイアウト崩れ（エリア名との重なり、バーとの間隔崩れ）が起きる可能性がある。
- `completion.uneaten`/`completion.rate`の数値が0や2桁になった場合の複数形・桁数変化により、en表記が不自然にならないか確認が必要（例: "0 left / 0% complete"等の文言設計）。
- `areaImageDefinitions`に基づく表示エリア数（10エリア）は固定であり、空状態が実際には発生しないため、「表示するエリアがありません」に対応するキーを先行整備しても実際には到達しない可能性がある。未使用キーを追加すると後のレビューで「使われていないキー」として指摘される可能性がある。

## 6. Stop and Ask

以下はオーナー確認が必要なため、Phase2D-Bでは対応しない（候補にあるが実装が存在しない/方針判断が必要なもの）。

- 「表示するエリアがありません」: `/areas`に空状態UIが存在しないため、空状態キーを先行整備すべきかどうか。
- 「このエリアで探す」「食べた◯品」「販売中◯品（登録分）」「エリア別コレクション」: `/areas`ページに新規UI要素として追加すべきかどうか（本フェーズの方針「実在する文言だけを翻訳する」からは範囲外）。
- `app/areas/page.tsx`がサーバーコンポーネントの場合のロケール取得方法（クライアント分離が必要になるか）。
- エリア名翻訳、店舗名翻訳、カテゴリ名翻訳、URL変更、自動翻訳、外部API、generated JSON変更、DB変更、crawler変更は全てStop and Ask対象（変更しない）。

## 7. Verification Plan

- 言語: ja / en / ko / zh-TW
- 幅: 390 / 430 / 768 / 1280 / 1920
- 確認ページ: `/areas`（メイン対象）に加え、回帰確認として`/`、`/areas/[id]`（任意の1エリア）、`/eaten`、`/foods`
- 確認項目:
  - `/areas`のkicker・タイトル・サブタイトルが4言語で正しく表示される
  - 各エリアカードの「残り◯品 / コンプ率◯%」相当のテキストが4言語で表示され、`{{count}}`/`{{rate}}`が正しく補間される
  - エリア名（`area.name`）が4言語とも翻訳されず元の日本語表示のまま
  - 390px/430pxでカード内テキストの折り返し・はみ出し・画像との重なりがない
  - 横スクロールが発生しない
  - `/areas/[id]`、`/eaten`、`/`、`/foods`の表示・リンク先URLに変化がない（Phase2D-B変更の影響範囲外であることの確認）
  - `localStorage`の`unicolle-locale`・`unicolle-locale-change`イベント、既存の食べた記録データに変更がない

Codex用`/goal`は本ドキュメントでは作成しない。
