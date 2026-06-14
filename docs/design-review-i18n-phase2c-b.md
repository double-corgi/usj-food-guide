# design-review-i18n-phase2c-b.md

## 0. 対象

- 実装: i18n Phase 2C-B（`/foods/[id]` 商品詳細ページの固定UI文言の多言語化）
- commit: `89fa1c1`（backup: `115e20c`）
- 参照仕様: `docs/codex-goal-i18n-phase2c-b.md`
- 注記: Codexの最終報告見出しは「i18n Phase 2B 完了報告」となっていたが、実装内容（`components/food-detail.tsx` + `lib/i18n/dictionaries.ts` の `foodDetail.*` 追加）は本来の Phase 2C-B のスコープと一致しているため、Phase 2C-B として本レビューを実施した。見出し誤記は実装内容そのものの正しさに影響しないが、報告ドキュメントの命名ミスとして記録する。

## 1. スコープ適合性

`git diff 115e20c 89fa1c1 --stat` で変更ファイルを確認した。

- `components/food-detail.tsx`（+76/-41）
- `lib/i18n/dictionaries.ts`（+128）
- `screenshots/i18n-phase2c-b-food-detail-{en,ko,zhtw}-{390,430}.png`（新規6枚）

`components/food-card.tsx`、`components/food-grid.tsx`、`app/foods/[id]/page.tsx`、`/eaten`、`/areas`、`/stores` 関連ファイルは変更なし。Phase 2C-A（`/foods`）の差し戻し改修や、Phase 2D相当の追加実装は確認されなかった。

判定: **範囲は `/foods/[id]` の固定UI文言のみに限定されている。問題なし。**

## 2. 翻訳対象外の維持

`components/food-detail.tsx` の diff を全行確認した。

- 商品名（例: 「ラプトル・ベーコン＆ビーフバーガーセット」）: 翻訳されず日本語のまま維持。
- 店舗名（例: 「ディスカバリー・レストラン」）、エリア名（例: 「ジュラシック・パーク」）: 維持。
- カテゴリ・形式の値（`categoryLabels`/`inferDiningLabel` の戻り値、例: 「セットメニュー」「店内飲食」）: ラベル（`カテゴリ` `形式`）のみ `t()` 化され、値は `lib/food-utils.ts` / `lib/constants.ts` 由来のまま未変更。
- 価格そのもの、日付フォーマット（`formatDateLong`/`formatDateShort` の出力）、25周年などのイベント名: 変更なし。
- generated JSON由来の商品データ: 変更なし。

ja本番ページ（`/foods/food-1efoz95`）を直接フェッチして確認したところ、商品名・店舗名・エリア名・カテゴリ値・日付（2026/4/24等）・「高信頼レポート」（`getPriceSourceLabel`の戻り値）はすべて日本語のまま表示されており、翻訳対象外の方針が守られている。

判定: **問題なし。**

## 3. URL構造・ロケール方式

- `https://new-app-chi-rosy.vercel.app/en/foods/food-1efoz95` をフェッチした結果、本文が空でページが存在しない（404相当）ことを確認した。`/en` `/ko` `/zh-TW` のロケールルートは追加されていない。
- `localStorage`方式（`unicolle-locale`）を継続使用しており、ルーティング変更は確認されなかった。

判定: **問題なし。**

## 4. 翻訳品質（ja / en / ko / zh-TW）

`lib/i18n/dictionaries.ts` の diff で追加された29個の `foodDetail.*` キーを4言語すべてで確認した。スクリーンショット（en/ko/zh-TW × 390px/430px、計6枚）も目視確認した。

- 「一覧へ戻る」: ja=一覧へ戻る / en="Back to list" / ko="목록으로 돌아가기" / zh-TW="返回列表" — スクリーンショットでも正しく表示。
- 「前」「次」: en="Previous"/"Next"、ko="이전"/"다음"、zh-TW="上一個"/"下一個" — 表示確認。
- 「販売中」「販売終了」: `common.*` / `foods.*` の既存キーを再利用。badgeの `× {{common.ended}}` 合成（en="× Ended" 等）も崩れなし。
- 「価格」: `foodDetail.priceUnknownNote`（en="Price not confirmed. Please check official or in-park information.")、`foods.priceUnknown` を再利用した「価格状態」行（confirmation-info内）も確認。
- 「販売場所」: `area.salesLocations`（Phase2A既存キー）を再利用。en="Where can you buy it?" / ko="어디서 살 수 있나요?" / zh-TW="在哪裡買得到?" — 見出しとして自然に表示。
- 「エリア」「店舗」: confirmation-info内の項目見出しとしては独立キー追加なし（仕様2.3の通り、コードに存在しない単独ラベルは追加していない）。`foodDetail.shopCount`/`areaCount`等のサマリ文言（例: en "1 store only / 1 area"、ko "1개 매장만 / 1개 에리어"、zh-TW "僅1家店鋪 / 1個區域"）として実装されており、画面でも自然に表示されている。
- 「食べた」「食べた記録に追加」: `foodCard.markEaten`/`eatenDone` を再利用。en="Mark as eaten"、ko="먹은 것으로 기록"、zh-TW="標記為已吃" — ボタン文言として崩れなし。
- 「次回食べたい」: `foodDetail.wantNext`/`wantSaved`。en="Want next time"、ko="다음에 먹고 싶어요"、zh-TW="下次想吃" — ボタン内で改行・はみ出しなし。
- 「販売情報」「確認情報」: `foodDetail.howToBuy`="Where can you buy it?" 等（上記）、`foodDetail.confirmationInfo`="Sale & price info"相当（en/ko/zh-TWいずれも見出しとして妥当な長さ）。
- 「価格未確認」「エリア確認中」「店舗確認中」: `foods.priceUnknown` 再利用、`foodDetail.areaChecking`（en="Area checking"、ko="에리어 확인 중"、zh-TW="區域確認中"）。「店舗確認中」に対応する単独キーはコード上に対応箇所がなく、仕様2.3の通り無理な追加は行われていない（`shopCount`/`shopCountSingle`で表現）。

判定: **4言語とも訳語は自然で、既存キーの再利用・新規キーの設計も `codex-goal-i18n-phase2c-b.md` の2.1/2.2テーブルと一致している。問題なし。**

## 5. 表示崩れ（390 / 430 / 768 / 1280 / 1920px）

スクリーンショット6枚（en/ko/zh-TW × 390px/430px）を目視確認した。

- 全言語・両幅で横スクロールは発生していない。
- 「Mark as eaten」「먹은 것으로 기록」「標記為已吃」「Want next time」「다음에 먹고 싶어요」「下次想吃」いずれもボタン内で1〜2行に収まり、文字切れ・ボタン枠からのオーバーフローはない。
- バッジの `◇ {{foods.badgeLimited}}` / `× {{common.ended}}` 合成も確認できる範囲で崩れなし（zh-TWでも「◇ 限定」「× 販售結束」相当が想定通り収まる長さ）。
- confirmation-info の `<dl>`（カテゴリ／形式／期間／販売開始／販売終了／価格確認／価格状態／確認日 等）は390px幅でもラベルと値が折り返しなく収まっている。
- 韓国語・繁体字の見出し（「販売場所」相当見出し、商品名見出し）も2行以内で収まり、レイアウト崩れは見られない。

768/1280/1920pxのスクリーンショットは今回提供されていないが、変更箇所はテキストの`t()`化のみでレイアウト構造（flex/grid/クラス）自体は変更されておらず、390/430pxで崩れがないことから広い幅でも同様に問題ないと判断する。

判定: **問題なし。**

## 6. 既存機能の非破壊

`git diff --stat` の通り、本diffで変更されたファイルは `components/food-detail.tsx` と `lib/i18n/dictionaries.ts`（辞書への追記のみ、既存キーの変更・削除なし）のみであり、以下は無変更:

- `/foods`（Phase2C-A）: `components/food-card.tsx`/`food-grid.tsx`/`app/foods/page.tsx` 無変更。本番 `/foods` をフェッチし、Phase2C-A時点の `foods.*` 文言・カテゴリ/エリア/店舗の絞り込みUIが正常に表示されることを確認した。
- ホームv1.2、area-detail-v1.1: 関連ファイル無変更。
- `/eaten`、`/areas`、`/stores`、`/settings`: 関連ファイル無変更。

判定: **既存機能への影響なし。**

## 7. 総合判定

**承認**

すべての確認観点（スコープ適合性、翻訳対象外の維持、URL構造、翻訳品質、表示崩れ、既存機能非破壊）で問題は見つからなかった。Codexの最終報告見出しが「i18n Phase 2B 完了報告」になっている点は命名ミスであり、次回報告時の修正を推奨するが、本実装の承認判定には影響しない。

Phase 2D の `/goal` は本レビューでは作成しない。
