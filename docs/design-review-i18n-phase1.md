# design-review-i18n-phase1.md

レビュー担当: Claude（PO/UX/UIデザイン/レビュー）
対象: Codex実装「i18n Phase 1」(commit `2794c76792f7bc6bb548ee8b418bb08a301d768e`)
根拠資料: `docs/codex-goal-i18n-phase1.md`、変更ファイル8件の直接コードリード、`git show --stat` / `git diff --stat`、本番URL (`/settings`) のweb_fetch

---

## 総合判定: 条件付き承認

コード品質・スコープ遵守は良好。ただし以下2点が未確認・要修正のため「条件付き承認」とする。

1. en/ko/zh-TWの実機表示・localStorage挙動が未検証（ブラウザツール未使用のため）
2. `footer.settings` の ja 訳が既存表示文言「通知設定」と一致していない（"設定"になっている）

---

## 1. i18n基盤

- `lib/i18n/locales.ts`: 4言語定義、`defaultLocale = "ja"`、storage key `unicolle-locale`、`isSupportedLocale` 型ガード。仕様どおり。
- `lib/i18n/use-locale.tsx`: `useSyncExternalStore` + `getServerSnapshot = () => defaultLocale` でSSR/CSRのhydration不一致を回避する設計は適切。
- 不正なlocalStorage値は `ja` に自己修復し、`unicolle-locale-change` カスタムイベントで同タブ内の再描画にも対応（`storage`イベントは同タブで発火しないため必要な工夫）。
- `t(key)` は `dictionaries[locale][key] ?? dictionaries[defaultLocale][key] ?? key` の3段フォールバック。未翻訳キーはja→キー名の順でフォールバックされ、要件を満たす。
- `TranslationKey = keyof (typeof dictionaries)["ja"]` による型安全性は確保されているが、en/ko/zh-TWのキー網羅性は型では保証されない（目視確認は3節参照）。

判定: 設計・実装ともに健全。

---

## 2. 対応言語 (ja/en/ko/zh-TW)

`dictionaries.ts` に4言語×38キー（nav 5 / settings 8 / footer 14 / common 11）を確認。キー数はja/en/ko/zh-TWで一致しており欠落キーはなし。`localeLabels` の表記（日本語/English/한국어/繁體中文）も適切。

判定: 問題なし。

---

## 3. URL構造

`git diff 1e85143 2794c76 --stat` で変更ファイルを確認した結果、ルーティング関連ファイル（`app/`配下のページファイルで`/en`等の新規ディレクトリ）は一切追加されていない。変更は `app/layout.tsx`、`app/settings/page.tsx` の既存ファイルのみ。URL構造は変更なし（案A: localStorageベース）の通り。

判定: 仕様どおり。

---

## 4. 翻訳範囲

- `lib/i18n/dictionaries.ts` のキーは `nav.*` / `settings.*` / `footer.*` / `common.*` の4カテゴリのみで、商品名・店舗名・エリア名・カテゴリ名などデータ由来の文言は含まれていない。
- 変更8ファイルに `app/foods`, `app/areas/[id]`, `app/stores`, `app/eaten` などのデータ表示ページは含まれず、商品名等が翻訳対象になっていないことをコードレベルで確認済み。
- `settings.languageDescription` の文面（各言語で「フード・店舗・エリア名は園内で見つけやすいよう日本語のまま表示されます」の趣旨）が4言語すべてに含まれており、Phase 1の方針をユーザーに明示する配慮がある点は良い。

判定: 仕様どおり、適切。

---

## 5. 言語切り替えUI

- `components/language-switcher.tsx` は `/settings` 内の1セクションとして実装され、ボトムナビ・ホームFV・ヘッダーへの追加は確認されなかった（`app-header.tsx`の変更は既存ナビ項目のラベルを`t()`化するのみで、新規UI要素の追加なし）。
- 配色は既存の暖色パレット（`#eadcc8`境界線、`#d9a230`/`#fff7df`/`#b37a12`のゴールド系選択色）を使用し、既存の「カードレスだが角丸でやわらかい」スタイルと一致。
- `aria-pressed` によるアクセシビリティ対応あり。`sm:grid-cols-2` で4言語ボタンが2x2に収まる。

判定: 仕様どおり、既存デザイン言語との整合性も良好。

---

## 6. 既存デザイン破壊の有無

`git diff 1e85143 2794c76 --stat` で変更された8ファイル:

```
app/layout.tsx
app/settings/page.tsx
components/app-footer.tsx
components/app-header.tsx
components/language-switcher.tsx  (新規)
lib/i18n/dictionaries.ts          (新規)
lib/i18n/locales.ts               (新規)
lib/i18n/use-locale.tsx           (新規)
```

home v1.2、area-detail-v1.1、`/foods`、`/foods/[id]`、`/eaten`、`/areas`、`/areas/[id]`、`/stores`、`/stores/[id]` のページ・コンポーネントファイルは一切変更されていない。レイアウト構造（grid/flex/spacing/className）は `app-header.tsx` / `app-footer.tsx` / `app/settings/page.tsx` のいずれも、テキストソースを `label` → `t(labelKey)` に置き換えただけで、JSX構造自体は変更なし。

判定: コードレベルでは既存デザインへの破壊リスクは低い。ただし全ページの実機スクリーンショット比較は実施していない（7節参照）。

---

## 7. 表示確認（各言語）

- **ja**: 本番 `/settings` をweb_fetchで確認。ヘッダー/フッターナビが「ホーム/探す/食べた/エリア/店舗」、設定ページが「設定」キッカー、「端末内データ管理」見出し、新規「言語 / Language」セクション（「現在の表示言語」見出し、4言語ボタン：日本語/English/한국어/繁體中文）、続けて「データ管理」セクション（バックアップ出力/バックアップ復元/全データ削除）を表示。レイアウト崩れなし。
- **en/ko/zh-TW**: **未検証**。`web_fetch`はSSRの`ja`固定HTMLしか取得できず、localStorageに依存するクライアント側の言語切替を再現できないため。実機/ブラウザでの切替後表示、`document.documentElement.lang`の切替、リロード後の永続化、不正値→ja復帰の動作はいずれも未確認。

判定: jaは確認済みで問題なし。**en/ko/zh-TWの動作確認はレビュー時点で未実施であり、条件付き承認の条件のひとつとする。**

---

## 8. リスク

- **翻訳キー欠落**: 4言語とも38キーで一致、欠落なし。
- **型安全性**: `TranslationKey`はjaキー由来でフォールバックも安全。問題なし。
- **hydration**: `useSyncExternalStore`+`getServerSnapshot=ja`によりSSR/CSR不一致は回避。ただしen/ko/zh-TW選択時はSSR直後に一瞬ja表示→localeに切り替わる「ちらつき」が発生する設計（i18n-design-v1.mdのリスク節で許容されたPhase1の既知トレードオフ）。
- **`<html lang>` の静的/動的差**: `app/layout.tsx`の`<html lang="ja">`は静的で、`use-locale.tsx`のuseEffectでクライアント側のみ動的に上書き。SSR直後（JS実行前）はen/ko/zh-TWユーザーにも`lang="ja"`が一瞬適用される。軽微だが、SEO/アクセシビリティ上は許容範囲。
- **footer.settingsの訳語ずれ（新規発見）**: `dictionaries.ts`のja `footer.settings` は `"設定"` だが、`components/app-footer.tsx`の元の`footerLinks`定義における当該リンク（`/settings`）の表示文言は `"通知設定"` だった（本番fetchでも現状「通知設定」と表示されている）。`codex-goal-i18n-phase1.md`の要件「jaの値は既存文言と完全一致させる」に対し、この1項目だけ文言が変わっている。実際の挙動への影響は軽微（リンク先・機能は変わらない）が、再デプロイ後にja表示の文言が「通知設定」→「設定」に変わる可能性があり、これは翻訳作業によって生じた意図しないja文言変更にあたる。
- **PWA/iOS/Android実機**: 未検証（Phase1の範囲では必須ではない）。

---

## 9. 設計書の配置について

- `i18n-design-v1.md` はリポジトリルートにのみ存在し、`docs/`配下には存在しない（`git ls-files`で確認）。
- 一方、`codex-goal-i18n-phase1.md` は `docs/codex-goal-i18n-phase1.md` に正しく保存されている。
- 過去の設計書（`home-design-v1.md`、`area-detail-design-v1.md`など）は `docs/` 配下にも同名ファイルが存在しており、最終的に `docs/` に集約される運用になっている。
- `i18n-design-v1.md` も同じ運用に揃えるため、`docs/i18n-design-v1.md` への移動（またはコピー）を推奨する。これは承認のブロッカーではないが、トレーサビリティのため次の作業で対応することを推奨する。

---

## まとめ・次のアクション（提案、未指示のため実行しない）

条件付き承認の条件:

1. en/ko/zh-TWの実機表示・localStorage挙動の検証（ブラウザツールまたはCodexによる追加証跡）
2. `footer.settings` の ja 訳を元の文言「通知設定」に合わせる（または意図的な変更であれば設計判断として明記）
3. `i18n-design-v1.md` を `docs/` に移動（推奨、ブロッカーではない）

修正用 `/goal` は本ドキュメントでは作成しない。
