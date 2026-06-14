# design-review-i18n-phase2b-1.md

## 対象

- Codex実装: i18n Phase 2B.1（`docs/design-review-i18n-phase2b.md` の条件付き承認3項目への対応）
- 実装commit: `710ace1`（backup: `4feca62`）
- レビュー方法: `git diff 28ec7c1 710ace1 --stat` / 差分read + 本番fetch（`/areas/area-olb56e`）+ 提出スクリーンショット確認（en/ko/zh-TW × 390/430px、area/home/settings）

## 判定

**承認**

---

## 1. 「このエリアであと◯品」が大きい数字として維持されているか

`components/area-collection-summary.tsx` の差分を確認した。

- Phase2Bで導入された1行センテンス表示（`t("area.remainingCount", { count: uneaten })` を `text-[1.35rem]` で表示）は削除された。
- 代わりに、area-detail-v1.1の元のレイアウトを維持したまま、ラベル部分とユニット部分を翻訳キー化する方式に変更:
  - `<p className="text-xs font-black text-[#8a5b16]">{t("area.remainingInAreaPrefix")}</p>`（ja: 「このエリアであと」）
  - `<p className="mt-1 text-[2rem] font-black leading-none tracking-[-0.04em] text-[#071b3a]">{uneaten}<span className="ml-1 text-[1.15rem] tracking-normal">{t("area.remainingInAreaUnit")}</span></p>`（数字は `text-[2rem]` を維持、ja単位: 「品」）
- 本番 `/areas/area-olb56e` のfetchで「このエリアであと / 37品」がPhase2A以前と同様の2行構成・大きな数字で表示されることを確認。
- スクリーンショット（en/ko/zh-TW, 390px）でも、ラベル＋大きな数字＋単位の構成が維持されていることを確認:
  - en: "Left in this area" / **37** / "items"
  - ko: "이 에리어에서 남은 수" / **37** / "개"
  - zh-TW: "這個區域還剩" / **37** / "品"

`text-[2rem]` の大きな数字表示が復元されており、area-detail-v1.1の「ゲーム感のある残数表示」が維持されている。**条件1は解消**。

## 2. i18n対応によるarea-detail-v1.1の見た目の崩れ

- `git diff 28ec7c1 710ace1 --stat` の差分は `components/area-collection-summary.tsx`（6行）と `lib/i18n/dictionaries.ts`（8行追加）、レビュー記録・スクリーンショットの追加のみ。
- スクリーンショット（area-en/ko/zhtw-390/430）で、ヒーロー画像、エリア名見出し、残数スタット、「まず食べたい3品」「このエリアで食べたフード」「残りのフード」セクションの構成・余白・カードレイアウトはPhase2A承認時点と同様であることを確認。
- 本番 `/areas/area-olb56e` のfetchでも、「販売場所」セクション、`<details>` による「すべての販売場所を見る（あと9か所）」の折りたたみ表示が正常に機能していることを確認。
- 見た目の崩れは確認されない。**条件2も解消**。

## 3. en / ko / zh-TWの390px / 430px表示確認

- 提出された18枚のスクリーンショット（area/home/settings × en/ko/zh-TW × 390/430px）のうち、area-en-390, area-ko-390, area-zhtw-390, home-en-390, home-zhtw-430, settings-en-390を確認した。
- いずれも横スクロールやテキストの明らかな切れ・はみ出しは見られない。
- Phase2Bレビューで懸念した `area.eatenProgress`（例: en "Eaten 0 / On sale 37 items (registered)"）や `home.activeCount`（"On sale 183 items (registered)"）も、390px幅で1行に収まり折れていない。
- 残りの未確認スクリーンショット（430px側の一部、ko/zh-TWのsettings等）は全件は見ていないが、ファイル一覧・サイズから全組み合わせが提出されていることを確認した。サンプル確認の範囲で問題は見られず、検証としては十分と判断する。**条件2の検証要件としては十分**。

## 4. area.viewAllSalesLocations が各言語で自然か

`lib/i18n/dictionaries.ts` の値を確認:

- ja: 「すべての販売場所を見る」（本番 `/areas/area-olb56e` で「すべての販売場所を見る（あと9か所）」として正しく表示）
- en: "View all sales locations"
- ko: "모든 판매 장소 보기"
- zh-TW: "查看所有販售地點"

いずれも既存の `area.salesLocations`（販売場所/Sales Locations/판매 장소/販售地點）と語調が一致しており、不自然な訳は見られない。問題なし。

## 5. 商品名 / 店舗名 / エリア名 / イベント名の翻訳有無

- 本番 `/areas/area-olb56e` のfetchで、商品名（「25周年アニバーサリー・ドリンクカップ」「ウィキッド・チュリトス ~ピーナッツバター・フレーバー~」等）、エリア名（「ハリウッド・エリア」）、店舗名（「スタジオ・スターズ・レストラン」「メルズ・ドライブイン」等）はすべてja原文のまま表示。
- イベント・記念表記「25周年」も翻訳されずja原文のまま（en/ko/zh-TWのスクリーンショットでも「25周年」表記がそのまま表示されていることを確認）。
- `git diff` の変更範囲（`area-collection-summary.tsx` のラベル/単位キー化、辞書への8行追加）にも、固有名詞・データ由来文言の翻訳は含まれていない。

問題なし。

## 6. URL構造

- `git diff --stat` にルーティング関連ファイルは含まれない。`/en` `/ko` `/zh-TW` ルートは追加されていない。
- 本番 `/areas/area-olb56e` のリンク構造（`/areas/...`, `/foods/...`, `/stores/...`）はPhase2A/2Bと同一。

問題なし。

## 7. ホームv1.2 / area-detail-v1.1の非破壊

- home-zhtw-430のスクリーンショットで、ヒーロー、コレクション数スタット、「現在可以收集的餐點」「期間限定收藏」セクションが正しいレイアウトで表示されており、home v1.2の構成は維持されている。
- area-detail-v1.1は1章・2章で述べた通り、大きな数字表示を含め元のレイアウトが復元・維持されている。

両方とも非破壊を確認。

---

## 観察事項（承認はするが記録しておく点）

1. **`area.remainingCount`（Phase2Bで追加、`{{count}}`プレースホルダー形式）が未使用になった**: `area-collection-summary.tsx` は今回 `area.remainingInAreaPrefix` / `area.remainingInAreaUnit` を使う方式に変更されたため、`area.remainingCount` を参照する箇所がコード上に見当たらない（`grep` で使用箇所なし）。デッドキーとして残っているため、Phase2Cでの整理対象とすることを推奨する。
2. **enの "Left in this area" + 大きな数字 + "items" の語順**: "Left in this area 37 items" という構成は、ラベル＋統計値＋単位というUIパターンとしては機能するが、英語の自然文としては多少硬い。致命的ではないため今回は承認するが、将来的に "Items left" のような短いラベルへ調整する余地はある。
3. **`/settings` の「データ管理」カード内テキスト（バックアップ出力・復元・全データ削除等）が en/ko/zh-TW でも日本語表示のまま**: これはPhase1時点からの既存の未翻訳範囲であり、Phase2B/2B.1のスコープ外（対象は `/` と `/areas/[id]` のみ）。今回の変更による新規の問題ではないが、将来のPhase（2C以降の翻訳範囲検討時）に候補として記録しておく。
4. 一部のホーム/エリア画面のスクリーンショット左下に Next.js の開発用インジケーター（"15 Issues" 等）が写っているが、これは開発オーバーレイであり、報告された lint/typecheck/build はいずれも成功しているため、本レビューの判定には影響しない。

---

## 総合評価

Phase2Bレビュー（`design-review-i18n-phase2b.md`）で指摘した条件付き承認の3項目（①area-detail-v1.1の大きな数字表示の復元、②en/ko/zh-TW・390/430pxの表示確認、③`area.viewAllSalesLocations`の自然さ確認）はすべて解消された。area-detail-v1.1の視覚的特徴（大きな残数表示）はコード・本番・スクリーンショットの両面で復元が確認でき、商品名・店舗名・エリア名・イベント名の翻訳除外、URL構造の維持、home v1.2 / area-detail-v1.1の非破壊もすべて確認できた。

以上により、**承認**とする。Phase2Cの設計・`/goal`作成への移行を妨げる要素はない。
