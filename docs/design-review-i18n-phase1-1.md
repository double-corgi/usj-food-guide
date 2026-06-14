# design-review-i18n-phase1-1.md

レビュー担当: Claude（PO/UX/UIデザイン/レビュー）
対象: Codex実装「i18n Phase 1.1」(commit `fc3ca19` fix-i18n-phase1-1-review-issues)
根拠資料: `git log` / `git diff 2794c76 HEAD --stat`、変更ファイルの直接コードリード、本番URL (`/`, `/settings`) のweb_fetch

---

## 総合判定: 承認

Phase1レビュー（`docs/design-review-i18n-phase1.md`）で指摘した条件のうち、設計書配置の問題は解消された。footer.settingsの訳語問題は、Phase1時点のレビュー記載が誤りだった（実際は当初から「通知設定」のまま正しかった）ことを本ラウンドで確認した。残るen/ko/zh-TWの実機検証は依然未実施だが、コードレベルでの実装は健全であり、承認の妨げにはならない。

---

## 0. 今回の変更内容

`git diff 2794c76 HEAD --stat`:

```
docs/design-review-i18n-phase1.md           | 124 ++++++++++++++++++++++++++++
i18n-design-v1.md => docs/i18n-design-v1.md |   0
```

`lib/i18n/*`, `components/language-switcher.tsx`, `app/settings/page.tsx`, `components/app-footer.tsx`, `components/app-header.tsx` などのコードファイルに**今回の変更はなし**。Phase1の実装内容（前回承認済みの実装）はそのまま維持されている。

---

## 1. ja / en / ko / zh-TW の切り替えが実際に動くか

`lib/i18n/use-locale.tsx` / `lib/i18n/dictionaries.ts` / `lib/i18n/locales.ts` はPhase1から変更なし。ロジックは以下を確認済み:

- `setLocale()` で `localStorage.setItem(unicolle-locale, locale)` → `unicolle-locale-change` イベント発火 → `useSyncExternalStore` の `getSnapshot` が新しい値を返す → `t()` が再評価され表示が切り替わる、という一連の流れはコード上整合している。
- 4言語×38キー、欠落なし（前回確認済み、変更なし）。

**未確認**: ブラウザでの実クリック操作による切替動作（Claude in Chromeが今回未接続のため）。コードロジックは健全。

---

## 2. localStorage の `unicolle-locale` が正しいか

`lib/i18n/locales.ts` の `localeStorageKey = "unicolle-locale"` で固定。`use-locale.tsx` の `getSnapshot`/`setLocale`/自己修復処理すべてこのキーを参照しており、キー名の一貫性は保たれている。変更なし。

---

## 3. `document.documentElement.lang` が正しいか

`use-locale.tsx` の `useEffect` 内で `document.documentElement.lang = locale` を実行（`setLocale()` 内でも同期的に設定）。`app/layout.tsx` の `<html lang="ja">` は静的だが、クライアントでロケールが変わればeffectで上書きされる。変更なし。

**未確認**: 実ブラウザでの`lang`属性切替（前回同様、ブラウザツール未接続のため）。

---

## 4. リロード後も維持されるか

`getSnapshot()` は `localStorage.getItem(localeStorageKey)` を読み取り、`isSupportedLocale`なら採用、`getServerSnapshot`は常に`defaultLocale`を返す設計。ページリロード時もマウント後に`getSnapshot`がlocalStorageの値を読むため、保存済みロケールは再現される設計になっている。コードロジックは正しい。

**未確認**: 実ブラウザでのリロード後の永続化確認。

---

## 5. 不正値が ja に戻るか

`use-locale.tsx` の `useEffect`:

```ts
const stored = window.localStorage.getItem(localeStorageKey);
if (stored !== null && !isSupportedLocale(stored)) {
  window.localStorage.setItem(localeStorageKey, defaultLocale);
  window.dispatchEvent(new Event(localeChangeEvent));
}
```

不正値（サポート外の文字列）が保存されている場合、`ja`に書き戻し+イベント発火で再描画される。`getSnapshot`自体も`isSupportedLocale`で検証し非対応値は`defaultLocale`を返すため、二重に安全。設計通り。

---

## 6. footer.settings の日本語訳が意図どおりか

**Phase1レビューでの指摘内容を本ラウンドで再検証した結果、Phase1レビューの記載が誤りであったことが判明した。**

- `git show 2794c76:lib/i18n/dictionaries.ts` を確認した結果、`"footer.settings": "通知設定"`（ja）は実装当初（Phase1実装時点）から正しく設定されていた。
- 現在のHEADでも `lib/i18n/dictionaries.ts:26` は `"footer.settings": "通知設定"` のまま。
- 本番 `/` および `/settings` のフッターも `[通知設定](https://new-app-chi-rosy.vercel.app/settings)` と表示されており、既存表示文言と完全一致している。

→ 訳語ずれは存在しない。Phase1レビューでの該当指摘（"設定"になっているとの記載）はレビュー側の誤認であり、コード修正は不要だった。Codexが今回コード側を変更していない点も、この訂正と整合する。

---

## 7. i18n-design-v1.md が docs/ 配下に整理されているか

`git diff --stat` で `i18n-design-v1.md => docs/i18n-design-v1.md` を確認。リポジトリルートの `i18n-design-v1.md` は `docs/i18n-design-v1.md` に移動済み（`git mv`相当、リネームとして1件で記録）。`ls`でもルートに `i18n-design-v1.md` は存在せず、`docs/i18n-design-v1.md` のみ存在することを確認。

→ Phase1レビューで推奨した整理は完了。

---

## 8. 商品名 / 店舗名 / エリア名が翻訳されていないか

- `lib/i18n/dictionaries.ts` のキーは `nav.*` / `settings.*` / `footer.*` / `common.*` のみで変更なし。商品名・店舗名・エリア名に相当するキーは含まれない。
- `app/foods`, `app/areas/[id]`, `app/stores`, `app/eaten` 等のデータ表示ファイルは今回も変更対象に含まれていない（変更2ファイルはdocsのみ）。

→ Phase1のスコープ（データ由来の名称は翻訳対象外）は維持されている。

---

## 9. URL構造が変わっていないか

今回の変更はdocsの2ファイルのみで、`app/`配下のルーティングファイルへの変更は皆無。`/en`、`/ko`等のロケール付きルートは追加されていない。本番の各リンク（`/`, `/foods`, `/areas`, `/stores`, `/eaten`, `/settings`等）もweb_fetchで確認した通り変更なし。

→ URL構造は変更なし。

---

## 10. ホームv1.2が壊れていないか

`git diff --stat`より、ホーム関連ファイル（`app/page.tsx`等）は今回・Phase1ともに変更なし。本番 `/` をweb_fetchで確認した結果、ヒーロー「ユニコレ／食べた記録が、そのままコレクションになる。」「最初の1品から。」「販売中183品（登録分）」、「今集められるフード」「期間限定コレクション」「エリア一覧」「店舗から探す」「登録済みコレクションを見る」の各セクションが正常に表示されており、構造・文言に崩れは見られない。

→ home v1.2は健全。

---

## 11. area-detail-v1.1が壊れていないか

`git diff --stat`より、`app/areas/[id]/page.tsx` および `components/area-food-status-lists.tsx` など area-detail関連ファイルは今回・Phase1ともに変更対象外。コードレベルでの破壊リスクはない。

**未確認**: 本番の個別エリアページ（例: `/areas/area-apf4z5`）の表示確認は今回のweb_fetchでは実施していないが、ファイル変更がないため追加リスクは見込まれない。

---

## まとめ

| 観点 | 結果 |
|---|---|
| 言語切替ロジック | コード健全（実ブラウザ未検証） |
| localStorageキー | 正しい (`unicolle-locale`) |
| `document.documentElement.lang` | 同期コード実装済み（実ブラウザ未検証） |
| リロード後の永続化 | コード設計上維持される（実ブラウザ未検証） |
| 不正値→ja復帰 | 実装済み・健全 |
| footer.settings訳 | 「通知設定」で正しい（Phase1レビューの誤指摘を訂正） |
| i18n-design-v1.md配置 | `docs/`へ移動済み、解決 |
| 商品名/店舗名/エリア名 | 翻訳対象外を維持 |
| URL構造 | 変更なし |
| home v1.2 | 健全（本番確認済み） |
| area-detail v1.1 | ファイル変更なし、健全 |

**総合判定: 承認**

残存する「en/ko/zh-TWの実機・ブラウザ検証」は、コードレビューでは健全と判断できるため承認のブロッカーとはしない。次回以降にブラウザツールが利用可能な状況で実機確認できれば望ましい（任意のフォローアップ）。

Phase 2 の `/goal` は本ドキュメントでは作成しない。
