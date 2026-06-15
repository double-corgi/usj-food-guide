# design-review-i18n-phase2d-b.md

## 0. 対象

- 実装: i18n Phase 2D-B（`/areas` 一覧の固定UI文言の多言語化）
- commit: `2a399de`（`implement-i18n-phase2d-b-areas`、backup: `894b4f0`）
- 参照仕様: `docs/codex-goal-i18n-phase2d-b.md` / `docs/i18n-phase2d-b-design-v1.md`

## 1. Phase 2D-B の範囲確認

`git diff 894b4f0 2a399de --stat` で変更ファイルを確認した。

- `app/areas/page.tsx`（-11行、ヘッダーJSXを`AreaOverview`に移動）
- `components/area-overview.tsx`（+/-、`useLocale`導入、ヘッダー文言と`areas.cardProgress`をt()化）
- `lib/i18n/dictionaries.ts`（+16、`areas.*`4キー×4言語）
- `screenshots/i18n-phase2d-b-areas-{ja,en,ko,zh-TW}-{390,430}.png`（新規8枚）

`/areas/[id]`、`/foods`、`/foods/[id]`、`/eaten`、`/stores`、`/stores/[id]`、`app/page.tsx`、`components/home-dashboard.tsx`等のファイル自体には変更はない。

判定（ファイル単位）: 直接変更されたファイルは`app/areas/page.tsx`と`components/area-overview.tsx`のみで、表面的にはスコープ内に収まっている。

### 1.1 重要な懸念: `AreaOverview`はホームページと共用コンポーネントである

`components/area-overview.tsx`の`AreaOverview`は、`app/areas/page.tsx`（`/areas`）だけでなく、`components/home-dashboard.tsx`（ホーム `/` の「エリア一覧」セクション）からも呼び出されている共用コンポーネントである。

```tsx
// components/home-dashboard.tsx
<section className="space-y-4">
  <div className="flex items-end justify-between gap-3">
    <div>
      <h2 className="text-lg font-black text-ink">エリア一覧</h2>
    </div>
    <Link href="/areas" className="shrink-0 text-xs font-black text-park">全エリア</Link>
  </div>
  <AreaOverview areas={areas} foods={foods} />
</section>
```

今回の実装では、`app/areas/page.tsx`にあった以下のヘッダーJSX（`areas.kicker`/`areas.title`(h1)/`areas.subtitle`）を、`AreaOverview`コンポーネント内部に**無条件で**移動した。

```tsx
// components/area-overview.tsx（実装後）
return (
  <div className="space-y-7">
    <div>
      <p ...>{t("areas.kicker")}</p>
      <h1 ...>{t("areas.title")}</h1>
      <p ...>{t("areas.subtitle")}</p>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {/* エリアカード */}
    </div>
  </div>
);
```

`AreaOverview`は`/areas`と`/`の両方から呼ばれるため、コード上はこのヘッダー（kicker「エリア別フード図鑑」+ h1「エリアから探す」+ サブタイトル「残りフードをエリアごとに確認できます。」）が、**ホームページの「エリア一覧」セクション内にも追加で表示される**構造になっている。

これは以下の問題を引き起こす可能性がある。

- ホームページの「エリア一覧」セクション（見出し`<h2>エリア一覧</h2>`）の直下に、`/areas`専用のはずの`<h1>エリアから探す</h1>`が出現し、**ホームページ内に2つ目の`<h1>`が生成される**（ホーム自体の`<h1>ユニコレ</h1>`と重複）。
- 「エリア一覧」という見出しの直下に「エリア別フード図鑑」「エリアから探す」「残りフードをエリアごとに確認できます。」という、文脈的に重複・冗長な文言が表示される。
- これは `docs/codex-goal-i18n-phase2d-b.md` の対象外（`/`への変更禁止）および設計書 5.1 で想定していた「`/areas`専用ヘッダーをクライアント側に移す」という意図を超えて、共用コンポーネント経由でホームページの表示にも影響する変更である。

本番`/`をフェッチした結果（Markdown抽出）では、「エリア一覧」セクション直下に「エリア別フード図鑑」等の文字列は現れず、直接エリアカード一覧が表示されているように見える。しかし、コード上`AreaOverview`はこのヘッダーを無条件にレンダリングしており、フェッチ結果のMarkdown変換処理が見出し構造を加工・省略している可能性も否定できないため、フェッチ結果のみでは「ホームページが無傷である」と断定できない。実際のDOM・スクリーンショットでの確認（ブラウザでの目視確認）が必要である。

## 2. 翻訳対象外の維持

- エリア名（`area.name`）: `area-overview.tsx`のdiffで`<h2 ...>{area.name}</h2>`は変更なし。本番`/areas`フェッチで「ハリウッド・エリア」「スーパー・ニンテンドー・ワールド」等が日本語のまま表示されることを確認した。
- 商品名・店舗名・カテゴリ名・ジャンル名: `/areas`ページにはこれらの表示自体がなく、対象範囲のコードにもこれらを扱う箇所はない。
- generated JSON由来データ: `listFoods()`・`calculateAreaProgress`等のデータ取得/計算ロジックは変更なし。

判定: **翻訳対象外は維持されている。問題なし。**

## 3. 表示品質

`screenshots/i18n-phase2d-b-areas-{en,ko,zh-TW}-{390,430}.png`（6枚）および`ja-{390,430}.png`（2枚）を確認した。

- ja: 「エリア別フード図鑑」「エリアから探す」「残りフードをエリアごとに確認できます。」、各カードに「残り ◯品 / コンプ率 ◯%」が表示。
- en: "Area Food Catalog" / "Find by Area" / "Check the foods left in each area." / "{{count}} left / {{rate}}% complete"。
- ko: "에리어별 푸드 도감" / "에리어에서 찾기" / "에리어별로 남은 푸드를 확인할 수 있습니다." / "{{count}}개 남음 / 컴플리트 {{rate}}%"。
- zh-TW: "區域別餐點圖鑑" / "依區域尋找" / "可以依區域確認剩下的餐點。" / "剩下 {{count}}品 / 完成率 {{rate}}%"。

390px/430pxいずれも、カード内のテキスト（エリア名・進捗テキスト）の折り返し・はみ出し・画像との重なりは見られない。エリア名が2行になる場合（`line-clamp-2`）も既存の挙動と同様。横スクロールの兆候もない。

`lib/i18n/dictionaries.ts`の`areas.*`を4言語分確認し、16エントリすべて存在し、ja値は設計書のリテラルと完全一致していることを確認した。

判定: **`/areas`単体としての表示品質に問題なし。**

## 4. 既存機能破壊

- area-detail-v1.1（`/areas/[id]`）: ファイル自体は無変更。本番`/areas/area-olb56e`をフェッチし、「エリア一覧へ戻る」「ハリウッド・エリア」「まず食べたい3品」等、既存表示が正常であることを確認した。
- `/foods` Phase 2C-A/B: ファイル無変更。本レビューでは再フェッチ未実施だが、`AreaOverview`・`dictionaries.ts`への変更は`/foods`の表示ロジックに影響しない。
- `/eaten` Phase 2D-A: ファイル無変更。`eaten-area-progress.tsx`等は今回のdiffに含まれない。
- ホームv1.2（`/`）: ファイル自体（`app/page.tsx`、`components/home-dashboard.tsx`）は無変更だが、1.1で述べた通り、共用コンポーネント`AreaOverview`の変更がホームの「エリア一覧」セクションの表示に影響する可能性がある。本番`/`のMarkdownフェッチでは「エリア一覧」セクションに異常は見えなかったが、見出し構造（`<h1>`の重複等）の問題はMarkdown変換では検出できないため、**未確認**。

判定: **`/areas/[id]`は問題なし。ホームv1.2については1.1の懸念が解消されない限り「問題なし」と断定できない。**

## 5. 技術面

- 既存i18n基盤の利用: `useLocale`/`t()`/`{{placeholder}}`補間という既存パターンに準拠しており、新しい仕組みは追加されていない。
- `useLocale`の使い方: `components/area-overview.tsx`は既存通り`"use client"`であり、`useLocale`の呼び出し自体は技術的に妥当。
- サーバー/クライアント境界: `app/areas/page.tsx`はサーバーコンポーネントのままデータ取得のみを担い、表示文言を`"use client"`の`AreaOverview`に委ねるという設計書5.1の方針には従っている。境界の置き方自体（`/eaten`パターンへの追随）は技術的に妥当。
- ただし、設計書5.1が想定していたのは「`/areas`専用のヘッダー文言をクライアント側に移す」ことであり、「`/areas`と`/`で共用されるコンポーネントに`/areas`専用ヘッダーを無条件で混ぜ込む」ことではない。共用コンポーネントへの影響範囲の検討が設計時点・実装時点のいずれでも明示的に行われていない点が、技術面での抜け漏れと言える。
- hydration: `t()`はSSR時・クライアント時ともに同一の辞書ルックアップ関数であり、`useSyncExternalStore`の`getServerSnapshot`は`defaultLocale`（ja）を返すため、`areas.*`キーの追加自体によるhydration不整合は想定されない。1.1の懸念は構造（重複`<h1>`・重複文言）の問題であり、hydrationエラーの問題ではない。

## 6. 総合判定

**条件付き承認**

`/areas`単体の翻訳内容・翻訳対象外維持・表示品質（4言語×390/430px）・`/areas/[id]`への非干渉は確認でき、問題は見つからなかった。

一方、今回`app/areas/page.tsx`から`components/area-overview.tsx`へ移動した`/areas`専用ヘッダー（kicker「エリア別フード図鑑」・h1「エリアから探す」・サブタイトル「残りフードをエリアごとに確認できます。」）が、`AreaOverview`内に**無条件**で実装されている。`AreaOverview`は`components/home-dashboard.tsx`の「エリア一覧」セクション（ホーム `/`）からも呼び出される共用コンポーネントであるため、コード構造上はホームページの「エリア一覧」セクションにもこのヘッダーが表示される状態になっている可能性がある。これは`codex-goal-i18n-phase2d-b.md`の対象外規定（`/`への変更禁止）に抵触するおそれがあり、また実際に表示される場合はホームページ内に`<h1>`が2つ存在する状態となり、UX・アクセシビリティ上望ましくない。

### 条件

1. `components/area-overview.tsx`にホームページ表示時（`components/home-dashboard.tsx`からの呼び出し時）に、`areas.kicker`/`areas.title`(h1)/`areas.subtitle`のヘッダーブロックが表示されないことを確認すること。表示されてしまう場合は、`AreaOverview`に`showHeader`等のpropを追加し、`/areas`ページ（または`/areas`専用の薄いクライアントラッパー）からのみ`true`を渡す形に修正し、`components/home-dashboard.tsx`側の呼び出しではヘッダーを表示しないようにすること。
2. 修正後、ホーム`/`のスクリーンショット（390px/430px、ja）を取得し、「エリア一覧」セクションに重複ヘッダーが表示されていないこと、`<h1>`が1つのみであることを目視確認すること。

本レビューのMarkdownベースの本番フェッチでは、ホーム`/`の「エリア一覧」セクションに該当ヘッダー文言は確認されなかったが、Markdown変換処理が見出し構造を加工・省略する可能性があり、コード上の構造（無条件レンダリング＋共用コンポーネント）と整合しないため、断定的な「問題なし」とはできない。条件1・2の確認・対応をもって本条件は解消とする。

Phase 2D-C の `/goal` は本レビューでは作成しない。
