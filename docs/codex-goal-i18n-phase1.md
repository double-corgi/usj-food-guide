# Codex実装指示書 — i18n Phase 1（多言語基盤 + 共通UI）

対象: アプリ全体の多言語基盤（i18n基盤）＋下部ナビ・ヘッダー共通文言・設定ページの言語切り替えUI
種別: 基盤導入のみ。全ページの本文翻訳は行わない。

---

## 0. Git運用（最初に必ず実行）

```bash
git status
```

未コミットの変更がある場合:

```bash
git add .
git commit -m "backup-before-i18n-phase1"
git push
```

未コミットの変更がない場合:

```bash
git commit --allow-empty -m "backup-before-i18n-phase1"
git push
```

作業完了後（最後に必ず実行）:

```bash
git add .
git commit -m "implement-i18n-phase1"
git push
```

---

## 1. 目的

ユニコレに多言語対応の「壊れにくい土台」を入れる。今回は全ページを一気に翻訳するのではなく、以下のPhase 1達成基準のみを満たす。

- `ja` / `en` / `ko` / `zh-TW` を選べる
- 選択した言語が `localStorage` に保存される
- 下部ナビ（5項目）が翻訳される
- 設定ページの言語UIが翻訳される
- 共通ラベル（販売中/限定/販売終了/すべて見る/価格/登録済みコレクション等）が辞書化される
- 未翻訳キーは `ja` にフォールバックする
- 既存デザイン（特にホームv1.2・area-detail-v1.1）を壊さない

---

## 2. オーナー確定仕様（変更不可・前提条件）

### 2.1 対応言語

- `ja`（日本語、基準・フォールバック言語）
- `en`（English）
- `ko`（한국어）
- `zh-TW`（繁體中文）

### 2.2 URL設計

- Phase 1ではURLを変更しない。`/en`・`/ko`・`/zh-TW` のようなロケール付きルーティングは実装しない。
- 言語設定は `localStorage` に保存する。
- 将来URL対応する余地（辞書のキー構造がロケール別に分離されていること等）は残してよいが、ルーティングの実装は行わない。

### 2.3 翻訳対象（Phase 1のみ）

UI文言のうち、以下に限定する。

- 下部ナビ（ホーム/探す/食べた/エリア/店舗の5項目。現状は `components/app-header.tsx` 内の `navItems` がPC用ヘッダーナビとモバイル下部ナビの両方を生成している）
- ヘッダー/フッターの共通文言（フッターのブランド説明・主要CTA「フードを探す」「発見報告」など、フッターリンク一覧のうちPhase 1で対応するもの。フッターリンク全13件を全て翻訳する必要はなく、ナビと重複するもの・主要なものを優先してよい）
- 設定ページ（`app/settings/page.tsx`）の見出し・説明文・言語切り替えUI自体の文言
- 共通ボタン・共通ラベル: 「販売中」「限定」「販売終了」「食べた」「探す」「エリア」「店舗」「ホーム」「登録済みコレクション」「価格」「期間限定」「すべて見る」

### 2.4 Phase 1で翻訳しないもの

- 商品名（`food.name`）
- 店舗名（`shop.name`）
- エリア名（`area.name`）
- 商品説明・データ由来の商品カテゴリ名（`categoryLabels`等のうち、商品データに紐づく分類名は対象外。Phase 1の辞書には含めない）
- 価格データそのもの（表記形式は変更しない）
- 画像内テキスト

理由: 固有名詞・データ由来の表記が多く、雑に翻訳すると不自然になるため。Phase 1はUI文言の「枠組み」を作ることが目的で、データ起因の表示内容には触れない。

### 2.5 言語切り替えUI

- 設置場所: 設定ページ（`/settings`）のみ。
- 表示形式: 「言語 / Language」セクションを設け、「日本語 / English / 한국어 / 繁體中文」の4択（ラジオ・トグル・セレクト等、既存の `SettingsDataPanel` のUIトーンに合わせた形でよい）。
- 下部ナビに言語項目を追加しない。
- ホームのファーストビューに言語切り替えを置かない。
- ヘッダー（PC用上部ナビ）に新規の常時表示UIを追加しない（重くしない）。

### 2.6 外部API・自動翻訳

- 外部翻訳APIの利用は禁止。
- 実行時の自動翻訳・機械翻訳は禁止。
- すべての翻訳は辞書ファイルに手書きで定義する（Phase 1で必要な最小限のキーのみ）。

### 2.7 実装範囲

- Phase 1はi18n基盤＋共通UI（下部ナビ・ヘッダー/フッター共通文言・設定ページの言語UI）のみ。
- `/foods`・`/eaten`・`/areas`・`/stores` 等の本文翻訳はPhase 1では行わない（Phase 2以降）。

---

## 3. 現状コードの前提（実装前に確認済みの構造）

- `components/app-header.tsx` は1ファイルで、PC用ヘッダーナビ（`<header>` 内 `<nav>`）とモバイル下部ナビ（画面下部固定の `<nav>`）の両方を、共通の `navItems`（ホーム/探す/食べた/エリア/店舗、各 `{ href, label, icon }`）から生成している。下部ナビ専用ファイルは存在しない。
- `components/app-footer.tsx` は `appBrand`（`lib/constants.ts`）・`unofficialNotice`・`footerLinks`（13件のリンク配列）を使って構成されている。
- `app/settings/page.tsx` は見出し「端末内データ管理」＋説明文＋ `components/settings-data-panel.tsx`（端末内データのエクスポート/インポート等）のみのシンプルな構成。言語切り替え用のセクションは存在しない。
- `app/layout.tsx` は `<html>` タグを含むルートレイアウトで、`metadata`・`viewport`・`AppHeader`/`AppFooter`/`PwaRegister`/`AnalyticsTracker` を読み込んでいる。`<html lang="ja">` のような明示的な `lang` 属性指定があるかどうかは実装時に確認し、あれば `lang` をクライアント言語に応じて動的化することを検討してよい（必須ではない）。
- `lib/constants.ts` に `appBrand`・`unofficialNotice`・`categoryLabels`・`shopTypeLabels`・`diningTypeLabels`・`statusLabels` 等、日本語固定文字列のRecordが多数存在する。Phase 1ではこれらのうち**共通UIラベルに該当するもの（例: 状態語の一部）のみ**を辞書に転記してよいが、`categoryLabels`等のデータ由来分類名はPhase 1の対象外（2.4節）。

---

## 4. 実装方針

以下は方向性の提示であり、実コードを確認した上で過剰設計にならない範囲で調整してよい。

### 4.1 i18n基盤

新規ディレクトリ `lib/i18n/` を作成し、以下を目安に構成する（ファイル名・分割は実装時に適宜調整可）。

- `lib/i18n/locales.ts`: 対応言語の定義（`ja` / `en` / `ko` / `zh-TW`）、デフォルト/フォールバック言語（`ja`）、表示名（「日本語」「English」「한국어」「繁體中文」）のマップ。
- `lib/i18n/dictionaries.ts`（または `lib/i18n/dictionaries/{ja,en,ko,zh-TW}.ts` のように言語別ファイルに分割してもよい）: Phase 1で必要な最小限のキーを持つ辞書。
- `lib/i18n/use-locale.ts`: 現在の言語の取得・設定を行うフック（`localStorage` 連携）。
- `components/language-switcher.tsx`: 設定ページに配置する言語切り替えUI。

### 4.2 localStorage

- 保存キー: `unicolle-locale`
- 値: `"ja" | "en" | "ko" | "zh-TW"` のいずれか
- 不正な値（未対応言語コード、壊れたデータ等）が保存されていた場合は `"ja"` にフォールバックする。
- 既存のlocalStorageキー（食べた記録・レビュー等、`lib/local-user-data.ts` / `lib/use-food-logs.ts` が使うもの）とは独立した新規キーとし、既存schemaには触れない。

### 4.3 Reactでの使い方

- `LocaleProvider`（Context）で現在の言語と切り替え関数を提供し、`app/layout.tsx` のクライアント境界（既存の `"use client"` コンポーネント、または新規の薄いProviderコンポーネント）でラップする。
- `useLocale()` フックで `{ locale, setLocale }` を取得できるようにする。
- `t(key)` のような翻訳関数（または `useTranslations()` 的なフック）を用意し、辞書から該当言語のキーを取得、なければ `ja` の値を返す（フォールバック）。
- 過剰設計禁止: 名前空間の深いネスト構造・プラグイン機構・i18nライブラリの新規導入（`next-intl`等）は不要。シンプルな `Record<Locale, Record<string, string>>` 程度の辞書とContext/フックで十分。

### 4.4 翻訳辞書（Phase 1で必要な最小限のキー）

以下を目安に、`ja`/`en`/`ko`/`zh-TW` の4言語分を用意する。キー名・粒度は実装時に調整してよいが、最低限以下の意味を持つキーを揃えること。

- `nav.home`（ホーム）
- `nav.search`（探す）
- `nav.eaten`（食べた）
- `nav.areas`（エリア）
- `nav.stores`（店舗）
- `settings.language`（言語 / Language の見出し）
- `settings.title`（設定ページの見出し、必要に応じて既存の「端末内データ管理」と併存させてよい）
- `common.saleActive`（販売中）
- `common.limited`（期間限定 / 限定）
- `common.ended`（販売終了）
- `common.viewAll`（すべて見る）
- `common.price`（価格 ラベル。価格データ自体の表記は変更しない）
- `common.registeredCollection`（登録済みコレクション）

`ja` の値は、既存の `lib/constants.ts` や各コンポーネントで使われている文言（例: 「ホーム」「探す」「食べた」「エリア」「店舗」「販売中」「期間限定」「販売終了」「すべて見る」「登録済みコレクション」）と完全に一致させること（新しい日本語表現を作らない）。

### 4.5 言語切り替え

- `app/settings/page.tsx` に「言語 / Language」セクションを新設し、`components/language-switcher.tsx` を配置する。
- 表示は「日本語 / English / 한국어 / 繁體中文」の4択。選択すると `useLocale()` 経由で `localStorage`（`unicolle-locale`）に保存し、即座にUI（少なくとも下部ナビ・ヘッダーナビ・設定ページ自身の文言）に反映される。
- 既存の `SettingsDataPanel` の見た目・配置は変更しない。新セクションは既存セクションの前または後に追加する形にし、ページ全体の構成（戻るリンク・見出し・説明文）を破壊しない。

### 4.6 下部ナビ・ヘッダーナビ

- `components/app-header.tsx` の `navItems` の `label` を、`t("nav.home")` 等の翻訳キー経由の表示に置き換える。
- PC用ヘッダーナビ・モバイル下部ナビの両方に同じ翻訳が反映されるようにする（共通の `navItems` から生成されているため、ラベル部分だけ翻訳関数を通す形になる想定）。
- レイアウト（5項目・アイコン・配置・サイズ）は変更しない。

---

## 5. 絶対に維持するもの

- ホームv1.2のデザイン（ロゴ・コレクション数・棚タイル・safe-area対応・配色・カードレス構成）
- area-detail-v1.1のデザイン（写真ヒーロー・「このエリアであと◯品」・販売場所リストのdedupe結果・銘板表示・販売終了0品セクションの非表示等）
- `/areas` 一覧・`/foods`・`/eaten`・`/stores` の既存レイアウト・URL構造
- 下部ナビ5項目の構成・アイコン・配置
- 既存のlocalStorage schema（食べた記録・レビュー等）

---

## 6. 禁止事項

- URL構造の変更
- `/en`・`/ko`・`/zh-TW` 等のロケール付きルート追加
- 商品名・店舗名・エリア名の翻訳
- 外部翻訳APIの利用
- 自動翻訳・機械翻訳の利用
- DB・generated JSON・crawlerの変更
- 既存localStorage schemaの破壊（`unicolle-locale` は新規独立キーとして追加すること）
- ホームv1.2・area-detail-v1.1のデザイン変更
- 全ページ一括の本文翻訳・大規模リファクタ
- スコープに無関係なコード整形

---

## 7. 実装対象ファイル候補

実装時に実コードを確認した上で、以下を目安に対象を絞ること。

### 新規作成（想定）

- `lib/i18n/locales.ts`
- `lib/i18n/dictionaries.ts`（または言語別ファイルに分割）
- `lib/i18n/use-locale.ts`（`LocaleProvider` を含めてもよい）
- `components/language-switcher.tsx`

### 変更対象（想定）

- `app/layout.tsx`（`LocaleProvider` の組み込み。`<html lang>` の動的化は任意）
- `components/app-header.tsx`（`navItems` のラベルを翻訳キー経由に）
- `components/app-footer.tsx`（主要文言の翻訳。フッターリンク全件の翻訳は必須ではないが、ブランド説明・主要CTA等は対応）
- `app/settings/page.tsx`（言語切り替えセクションの追加）
- `lib/constants.ts`（Phase 1辞書に転記する共通ラベルがある場合、参照関係の整理。データ由来の分類名（`categoryLabels`等）は変更しない）

### 原則触らないファイル

- `lib/repositories/`
- `lib/food-utils.ts`
- `lib/use-food-logs.ts`
- `lib/local-user-data.ts`
- `lib/area-images.ts`
- `scripts/`
- `supabase/`
- 各ページの本文コンポーネント（`components/area-*.tsx`・`components/food-*.tsx`・`components/eaten-*.tsx`・`components/store-*.tsx`・`home-dashboard.tsx`・`home-progress-client.tsx` 等）— Phase 1では翻訳対象に含めない

---

## 8. 検証要件

### 必須コマンド

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### 確認ページ

- `/`
- `/foods`
- `/foods/[id]`
- `/eaten`
- `/areas`
- `/areas/[id]`
- `/stores`
- `/stores/[id]`
- `/settings`

### 確認幅

- 390px
- 430px
- 768px
- 1280px
- 1920px

### 確認項目

- 言語切り替えUIが `/settings` に表示される
- `ja` / `en` / `ko` / `zh-TW` を選べる
- 選択結果が `localStorage`（キー `unicolle-locale`）に保存される
- リロード後も選択した言語が維持される
- `localStorage` に不正な値が入っている場合、`ja` にフォールバックする
- 下部ナビ（ホーム/探す/食べた/エリア/店舗）が選択言語に応じて翻訳される
- 設定ページの言語セクション・見出し等が選択言語に応じて翻訳される
- Phase 1辞書に存在しないキーは `ja` の文言にフォールバックして表示される（空文字や `undefined` が出ない）
- ホームv1.2のレイアウト・配色・棚タイル・safe-area対応が壊れていない
- area-detail-v1.1のレイアウト（写真ヒーロー・販売場所リストのdedupe結果・銘板表示・販売終了0品セクションの非表示）が壊れていない
- 5幅すべてで overflow が発生していない
- 5幅すべてで clipping が発生していない
- 横スクロールが発生していない
- 商品名・店舗名・エリア名が翻訳されず `ja` のまま表示されている（Phase 1の対象外であることの確認）

---

## 9. Codex CLI確認対応

Codex CLIの確認画面が出た場合は必ず

```
2. Yes, and don't ask again
```

を選択し、最後まで自動で実行を継続すること。確認のための質問・作業の中断は行わないこと。

---

## 10. 最終報告形式

作業完了後、以下の項目を含む報告を行うこと。

1. **実装した内容**: i18n基盤（Provider/フック/辞書/言語切り替えUI）の構成と概要
2. **対応言語**: `ja` / `en` / `ko` / `zh-TW` がそれぞれ実装されていることの確認
3. **URLを変更していない確認**: 既存ルーティング・URL構造に変更がないことの確認結果
4. **localStorageキー**: `unicolle-locale` の保存キー名・値の形式・不正値時のフォールバック挙動
5. **翻訳対象にした範囲**: 下部ナビ・設定ページ・共通ラベル等、実際に翻訳したキーの一覧
6. **翻訳対象外にした範囲**: 商品名・店舗名・エリア名・データ由来の分類名等、Phase 1で翻訳していないことの確認
7. **言語切り替えUIの場所**: `/settings` 内の配置・見た目の説明
8. **変更ファイル**: 新規作成・変更したファイルの一覧
9. **lint / typecheck / build結果**: 各コマンドの結果
10. **390 / 430 / 768 / 1280 / 1920確認結果**: 各幅でのoverflow・clipping・横スクロールの有無
11. **ホームv1.2が壊れていない確認**: 確認結果
12. **area-detail-v1.1が壊れていない確認**: 確認結果
13. **localhost確認結果**: ローカル環境での言語切り替え・フォールバック・保持の動作確認結果
14. **Vercel確認結果**: デプロイ後の本番URLでの確認結果
15. **commit hash**: 今回の実装のコミットハッシュ
16. **push成功確認**: `git push` が成功したことの確認
