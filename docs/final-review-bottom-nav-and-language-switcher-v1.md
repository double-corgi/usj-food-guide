# final-review: bottom-nav-and-language-switcher-v1

- 実装commit: `66b73a7701cdead1c3b7042f772cfbe60e29f54d`
- 証跡commit: `d44830424effa9771e179e4fb8ec88ba2b85b31e`（add bottom nav language switcher production evidence）
- HEAD: `d44830424effa9771e179e4fb8ec88ba2b85b31e`（main / origin 同期済み、working tree clean）
- 前回判定: 条件付き承認（2026-06-16）
- 最終レビュー日: 2026-06-16
- 担当: Claude（UXデザイナー / レビュー担当）

---

## 判定

**承認**

---

## 条件付き承認の条件解消確認

前回条件: 「Vercel本番 `/stores` で store-id-collision-fix v1.1 が反映されていること」

| 条件 | 期待値 | 実測値 | 判定 |
|---|---|---|---|
| duplicate href | 0件 | 0件 | ✅ |
| `shop-1tt48e8` 件数 | 1件のみ | 1件 | ✅ |
| `shop-店舗未確認` 件数 | 0件 | 0件 | ✅ |
| 非ASCII hrefs | 0件 | 0件 | ✅ |
| ASCII固有ID 復帰 | 復帰済み | 復帰済み | ✅ |
| 総店舗カード数 | 63件 | 63件 | ✅ |
| unique href数 | 63件 | 63件 | ✅ |

再デプロイの理由（初回fetch時はリグレッション状態）は Vercel デプロイタイミング問題であったことが確認された。ローカルの `lib/store-utils.ts` に修正コードが intact に残存していたため、再デプロイで解消した。**全4条件クリア。**

---

## bottom-nav-and-language-switcher-v1 本番確認

### 下部ナビゲーション（モバイル）

スクリーンショット照合結果:

| 確認項目 | 証拠 | 判定 |
|---|---|---|
| `/` でホームアクティブ | `prod-home-390.png`: ホーム項目が mint 背景で強調 | ✅ |
| `/stores` で店舗アクティブ | `prod-stores-390.png`: 店舗（右端）が明るい背景、他4項目はグレー | ✅ |
| `/settings` でアクティブなし | `prod-settings-390.png`: 全5項目がグレー均一（設計通り） | ✅ |
| EN切替後 Home アクティブ | `prod-home-en-390.png`: "Home" が mint 背景、他は "Search/Eaten/Areas/Stores" がグレー | ✅ |
| 暗沈みしていないか | `bg-white/94 backdrop-blur-2xl`、inactive = `text-slate-500`、active = `bg-mint text-park`（明るい） | ✅ |
| safe-area 壊れていないか | 全スクリーンショットで底部に適切な余白あり | ✅ |
| 5項目揃っているか | ホーム / 探す / 食べた / エリア / 店舗（JP）、Home / Search / Eaten / Areas / Stores（EN） | ✅ |

### 言語スイッチャー

| 確認項目 | 証拠 | 判定 |
|---|---|---|
| デスクトップ言語 select | `prod-home-1280.png`: 右上にコンパクトな select 表示、nav 項目と並列で自然な配置 | ✅ |
| モバイル言語バッジ | `prod-home-390.png`: 右上に `🌐 JP` バッジ表示 | ✅ |
| JP → EN 切替 | `prod-home-en-390.png`: ページ全体が英語化、バッジが `EN` に変化 | ✅ |
| `localStorage` 保持 | Codex確認: `unicolle-locale = en` | ✅ |
| `document.documentElement.lang` | Codex確認: `lang = en` | ✅ |
| `/settings` 既存言語UIが壊れていないか | `prod-settings-390.png`: 日本語 ✓ / English / 한국어 / 繁體中文 リスト正常表示 | ✅ |

---

## 既存機能破壊確認

| 確認項目 | 証拠 | 判定 |
|---|---|---|
| ホーム v1.2 | `prod-home-390.png`: タイトル・キャッチ・フードグリッド・「今集められるフード」正常 | ✅ |
| 店舗一覧 v1.1（ID衝突修正） | `prod-stores-390.png`: ホッグズ・ヘッド / ホッグズ・ヘッド・パブ / 三本の箒 / 三本の箒™ が別カードで正常分離 | ✅ |
| /foods / /eaten / /areas / /stores | ナビゲーションで到達可能、63件正常表示 | ✅ |
| `/settings` 既存言語切替 | 上述の通り、既存 UI に破壊なし | ✅ |

---

## 非ブロッキング指摘（次フェーズ持越し）

- `<nav aria-label={t("nav.home")}>` — `"ホーム"` というナビゲーション項目名がナビランドマーク全体の aria-label に使われている。スクリーンリーダーが「ホーム ナビゲーション」と読み上げる可能性がある。機能影響はなし。Phase B の辞書拡張時に `nav.label`（例: `"メインナビゲーション"` / `"Main navigation"`）キーを追加して対応すること。

---

## 総評

- 実装コードは仕様通り正しく実装されている
- 本番で全ルートのアクティブ状態が視覚的に正しく動作
- 言語切替が desktop / mobile 双方で正常動作、localStorage 永続化確認済み
- store-id-collision-fix v1.1 は再デプロイにより完全復帰
- 既存機能への破壊なし

**bottom-nav-and-language-switcher-v1 を承認する。**

---

## 次フェーズ

Phase B: エリア名・カテゴリ名多言語化（`docs/app-internationalization-data-design-v1.md` Phase B 参照）に進めること。
