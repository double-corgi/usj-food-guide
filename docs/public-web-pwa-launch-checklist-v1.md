# UNICOLE / ユニバフードコレクション Web/PWA 一般公開前チェックリスト v1

**作成日:** 2026-06-21
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**本番URL:** https://new-app-chi-rosy.vercel.app/
**前提:** USJ公式ではない、公開情報ベースの非公式ファン向けフード記録アプリ。販売中180品表示。App Store提出は先。本番広告コードはまだ入れない。

> 本書は調査・設計のみ。コード変更・git操作・実装は行っていない。調査は実コード/アセットの読み取りのみ。

---

## 0. 結論サマリー

| 問い | 回答 |
|---|---|
| 一般公開してよい状態か | **条件付きでほぼ可**。ただし下記「今すぐ直すべき」を解消してから |
| 公開前の致命的問題 | **あり=PWA/ホーム画面アイコンが空白（白）**。192/1024/apple-touch/faviconPNG がほぼ真っ白で、インストール/ブクマ時にアイコンが出ない |
| Google検索 | **当面 noindex 推奨**（*.vercel.app を index → 独自ドメイン移行で重複/移行コスト。ドメイン確定後に index 切替） |
| 広告 | 公開にも App Store 提出にも本番広告は不要。公開時は**プレースホルダーの可視文言を控える/隠す**ことを推奨 |
| 独自ドメイン | **index 有効化の前に**ドメイン確定＋ `NEXT_PUBLIC_SITE_URL` 設定が筋 |

---

## 1. Web/PWA 一般公開前チェックリスト

| 観点 | 状態 | 評価 |
|---|---|---|
| 1. 公開してよい状態か | 主要機能・法務ページ・非公式表記は整備済み。アイコン要修正 | ⚠️ 条件付き |
| 2. 致命的問題 | **PWA/ホーム画面/favicon アイコンが空白** | 🔴 要修正 |
| 3. PWA 設定 | manifest 充実（name/short/desc/start/scope/display/screenshots/shortcuts）。**icons の 192/1024 が空白**、theme_color 不一致 | ⚠️ |
| 4. OGP/title/description/favicon/manifest/icon | title/description/OG画像/twitter は適切。**favicon/PWA icon が空白**、manifest theme_color `#18212f`≠viewport `#071b3a` | ⚠️ |
| 5. 「USJ公式ではない」表示 | フッター brandDescription＋about/privacy/terms/disclaimer に明記。アプリ名に「USJ」を含めず誤認回避 | ✅ |
| 6. 法務/問い合わせ導線 | privacy/terms/disclaimer/commercial-disclosure/security/contact/request すべて存在。誤り報告フォーム（food-correction-report-form＋REQUEST_FORM_URL）あり | ✅ |
| 7. 広告プレースホルダー | クリック不可・外部通信なしで安全。ただし公開時に「広告スペース」可視は未完成感 | 🟡 判断 |
| 8. 検索インデックス | robots は現状 `allow: "/"`＝index 可。**ただし sitemap/robots の URL 既定が localhost**（env未設定時） | 🔴/⚠️ |
| 9. SNS 共有 | og-image.png(1200×630)＋summary_large_image 設定済。公開後に共有デバッガで実機検証推奨 | ✅（要検証） |
| 10. スマホ実機確認 | 下記チェック項目参照 | ⏳ |
| 11. 独自ドメイン前作業 | `NEXT_PUBLIC_SITE_URL` 設定・index 方針・リダイレクト整理 | ⏳ |
| 12. App Store 前の残課題 | 後述 | ⏳ |

---

## 2. 今すぐ直すべき項目（公開前・最小）

1. **🔴 PWA/ホーム画面/favicon アイコンの空白を解消（最重要）**
   実アセット解析の結果:
   - `app-icon-192.png` … near-white 0.97（ほぼ空白）※manifest の主要インストールアイコン
   - `app-icon-1024.png` … near-white 1.00（完全に空白）
   - `apple-touch-icon.png`(180) … near-white 0.97（空白）※iOS ホーム画面アイコン
   - `app-icon-512.png` … near-white 0.01（実アイコン＝正常、3aed588 で修正済）
   → インストール/ホーム追加/ブクマ時にアイコンが**白く欠ける**。`app-icon.svg`（実ベクター）または `app-icon-unicole-512.png`（実ラスタ）から **192/512/1024/180/favicon を再生成（リサイズ/ラスタライズのみ）** して差し替える。新規デザイン生成はしない。

2. **🔴/⚠️ `NEXT_PUBLIC_SITE_URL` の本番設定を確認**
   `app/robots.ts` と `app/sitemap.ts` は env 未設定時に **`http://localhost:3000`** を既定にする。未設定だと sitemap.xml が localhost URL を出力し SEO が壊れる（layout の OG metadataBase は別途 vercel URL をハードコード fallback しており不整合）。
   - 対応: Vercel に `NEXT_PUBLIC_SITE_URL` を本番URLで設定。あわせて robots/sitemap の既定 fallback も localhost → 本番URL に寄せる（安全網、小修正）。

3. **⚠️ 検索インデックス方針を決定（推奨: 当面 noindex）**
   *.vercel.app を index させると、独自ドメイン移行時に重複・リダイレクト整理コストが発生。**独自ドメイン確定までは noindex** 推奨（robots disallow もしくは metadata `robots: { index:false }`）。ドメイン公開時に index へ切替＋Search Console 登録。

4. **🟡 広告プレースホルダーの可視文言を公開向けに調整**
   非クリックで安全だが、一般ユーザーに「広告スペース」と見えるのは未完成感。公開時は **文言を空に/枠を控えめに/または非表示**にし、本番広告導入(Phase 3)時に出すのが無難。

5. **（軽微・同時対応可）manifest `theme_color` を `#071b3a` に統一**（現状 `#18212f`、viewport は `#071b3a`）。

---

## 3. 公開後に直してよい項目

- OG/SNS 共有の実機プレビュー検証（X/Facebook/LINE のデバッガ）。
- Lighthouse / PWA インストール可能性の最終スコア調整（installability、aria、CLS など）。
- maskable アイコンのセーフゾーン最適化（角丸/余白の見え方）。
- favicon.ico（旧ブラウザ向け）追加の要否確認。
- 7月フードの watch 継続（価格・販売場所・画像が揃うまで追加しない＝現方針維持）。
- 広告枠の収益最適化（位置・サイズ）は実広告導入後に検討。

---

## 4. App Store 化の前に必要な項目（残課題）

- 各サイズの**実アプリアイコン一式**（空白アイコンは審査リジェクト要因）＋ストア用スクリーンショット。
- プライバシー栄養ラベル / 年齢レーティング / アカウント削除導線（該当機能があれば）。
- Capacitor 設定（`capacitor.config.ts`）の本番確認、静的エクスポート(`CAPACITOR_STATIC_EXPORT`)時の挙動確認。
- **商標・非公式ポジションのストア表記レビュー**（「USJ」「ユニバ」の使用がストア審査で公式誤認とされないか。アプリ名は「ユニバフードコレクション/ユニコレ」で非公式が明確だが、説明文・スクショでも非公式を明記）。
- 広告を入れる場合のみ: ATT（App Tracking Transparency）/ 同意管理 / 広告SDK の審査要件。
- 本番広告コード（AdSense 等）導入時の CSP（`script-src`/`frame-src`）更新と同意フロー（Web/App 共通の Phase 3）。

---

## 5. 広告についての判断

- **公開（Web/PWA）に本番広告は不要**。現状のプレースホルダーはクリック不可・外部通信なしで安全。
- **App Store 提出にも広告は不要**。広告がないことが審査の妨げにはならない。むしろ広告を入れると ATT/同意/SDK 審査の負担が増える。
- 推奨運用: 公開直後は広告プレースホルダーの可視文言を控える/隠す → 利用が安定し方針が固まってから Phase 3 で本番広告（CSP/同意込み）を別 goal・別レビューで導入。

---

## 6. 独自ドメインについての判断

- **index 有効化の前に独自ドメインを確定**するのが筋。順序:
  1. 当面 noindex で公開（機能・法務・アイコンを実機確認）。
  2. 独自ドメイン取得 → Vercel に紐付け → `NEXT_PUBLIC_SITE_URL` をそのドメインに設定。
  3. *.vercel.app → 独自ドメインの 301 リダイレクト整理。
  4. noindex 解除 → Search Console 登録 → sitemap 送信。
- これにより、一時URLの index → 移行に伴う重複/評価分散を回避できる。

---

## 7. スマホ実機での最低確認項目（公開前）

- iOS Safari / Android Chrome で「ホーム画面に追加」→ **アイコン・アプリ名（ユニコレ）が正しく出るか**（現状は要修正後に再確認）。
- 下部「ナビ＋広告」2段固定が本文・フッターを隠さないか、ナビが押せるか、誤タップしないか。
- safe-area（ノッチ/ホームインジケータ）との距離。
- /foods の一覧・検索・フィルタ・食べた記録（localStorage 永続）が動作。
- 商品詳細の「誤り報告/リクエスト」導線が開くか。
- フッターの非公式表記・各法務ページへのリンクが開くか。
- OG カードの見え方（共有して確認）。

---

## 8. 公開後の運用メモ

- **誤り報告の運用**: 価格・販売場所・画像・販売期間の誤り報告（correction/REQUEST_FORM）を定期確認し、必要なら手動データ修正（generated JSON 直接編集は原則避け、override/再生成方針に従う）。
- **7月フード watch 継続**: 価格・販売場所・画像が揃うまで追加しない現方針を維持。
- **定期再クロール/Coverage 監視**: 販売終了・新商品の反映タイミングを運用ルール化（crawler 実行は管理手順に沿って）。
- **重複監査**: `npm run audit:duplicates` を定期実行し、新規重複を override で整理。
- **SEO/SNS**: ドメイン公開後に Search Console・OG デバッガで確認。
- **アナリティクス/エラー監視**: 公開後のクラッシュ・404・Core Web Vitals を監視。
- **法務更新**: 免責・プライバシーは内容変更時に更新日を更新。

---

## 9. Codex へ投げる最小修正（次セクションの goal 参照）

`docs/codex-goal-public-web-pwa-launch-prep-v1.md` に最小修正 goal を用意。内容:
- 空白 PWA/favicon アイコンの再生成（既存アセットからのリサイズ/ラスタライズのみ）。
- manifest theme_color を `#071b3a` に統一。
- robots/sitemap の既定 URL fallback を本番URLへ（env 未設定時の事故防止）。
- （任意・要判断）noindex 化、広告プレースホルダー文言の抑制。

> generated JSON / data/translations / DB / crawler は触らない。大規模リファクタ禁止。
