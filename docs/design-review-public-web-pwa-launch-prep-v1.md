# 設計レビュー証跡: Web/PWA 一般公開前 最小修正

- **対象commit**: `5d03524245dec62a171cb0dede5641222f3cb1ee`
- **commit message**: `fix: prepare Web PWA public launch`
- **対象設計書**: `docs/public-web-pwa-launch-checklist-v1.md` / `docs/codex-goal-public-web-pwa-launch-prep-v1.md`
- **レビュー担当**: Claude（設計・レビュー）
- **レビュー日**: 2026-06-21
- **判定**: ✅ **承認**

---

## 0. 結論サマリー

公開前チェックリストの「今すぐ直すべき」（空白アイコン・URL fallback・theme_color・noindex・広告非表示）が必須3点＋任意2点とも正しく実装された。URL 共有での Web/PWA ソフト公開に必要な最小修正は充足。承認。

---

## 変更内容（実diff）

`git show --stat 5d03524` → **10 files changed**

| ファイル | 変更 | 検証 |
|---|---|---|
| `public/icons/app-icon-192.png` | 1,223B(空白)→76,079B | 192×192・near-white **0.005** ✅ |
| `public/icons/app-icon-1024.png` | 6,061B(空白)→1,390,052B | 1024×1024・near-white **0.006** ✅ |
| `public/icons/apple-touch-icon.png` | 1,181B(空白)→67,653B | 180×180・near-white **0.006** ✅ |
| `public/manifest.webmanifest` | `theme_color #18212f→#071b3a`（他キー不変） | ✅ |
| `app/robots.ts` | fallback `localhost:3000→https://new-app-chi-rosy.vercel.app` | ✅ |
| `app/sitemap.ts` | 同上 | ✅ |
| `app/layout.tsx` | metadata に `robots: { index:false, follow:false }` 追加 | ✅ |
| `components/ad-slot.tsx` | `AdSlot` を `return null` に（プレースホルダー非表示） | ✅ |
| `docs/*-v1.md` ×2 | 設計/ goal ドキュメントをリポジトリへ追加 | 無害 |

（参考: `app-icon-512.png` は前commit 3aed588 で実体化済のため本commit対象外。manifest 参照の 192/512/1024 がこれで全て実アイコンに）

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | 変更が最小修正の範囲か | ✅ | アイコン3＋manifest＋robots＋sitemap＋layout robots＋ad-slot＋docs。範囲内 |
| 2 | PWAアイコン3種が実アイコンか | ✅ | near-white 0.005〜0.006（空白でない） |
| 3 | サイズが正しいか | ✅ | 192×192 / 1024×1024 / 180×180 |
| 4 | 画像生成・外部取得・新規デザインをしていないか | ✅ | 既存実アイコン由来のリサイズ/ラスタライズ（デザイン一致、外部URLなし） |
| 5 | manifest theme_color が #071b3a か | ✅ | 変更を確認 |
| 6 | manifest 他項目に不要変更がないか | ✅ | theme_color 1行のみ変更 |
| 7 | robots/sitemap の fallback が本番URLか | ✅ | 両ファイルとも vercel URL |
| 8 | localhost が robots/sitemap に出ないか | ✅ | fallback 置換済（env 設定時は当該ドメイン） |
| 9 | noindex/nofollow が適切に反映されているか | ✅ | layout metadata `robots:{index:false,follow:false}`。robots.txt は allow 維持（=クローラに meta noindex を読ませる正攻法） |
| 10 | noindex は独自ドメイン公開前の一時方針として妥当か | ✅ | *.vercel.app の index→移行コスト回避。ドメイン公開時に解除前提 |
| 11 | 広告プレースホルダーが非表示か | ✅ | `AdSlot` が null を返す。文言/`data-ad-slot` も出力されない |
| 12 | 本番広告/AdSense/SDK/外部script/iframe が無いか | ✅ | いずれも無し |
| 13 | 下部ナビ/広告レイアウトに意図しない破壊がないか | ✅ | ナビ構造不変。ad は null で安全に消滅（下記・余白の申し送りあり） |
| 14 | data/translations / generated JSON / DB / crawler に触れていないか | ✅ | 変更ファイルに該当なし |
| 15 | package.json を変更していないか | ✅ | 変更なし（依存追加なし） |
| 16 | lint / typecheck / build / coverage が成功しているか | ✅ | Codex報告。当方で coverage の非依存性も確認済 |
| 17 | Food/Store Coverage が期待値から変化していないか | ✅ | UI/アセットのみ。期待値と一致 |
| 18 | URL共有公開前の最小修正として十分か | ✅ | 実アイコン・noindex・広告非表示・正しい sitemap が揃い、ソフト公開可 |
| 19 | 独自ドメイン設定前に残る課題 | ℹ️ | 下記 |
| 20 | App Store 化前に残る課題 | ℹ️ | 下記 |

### 19. 独自ドメイン設定前に残る課題
- Vercel 環境変数 `NEXT_PUBLIC_SITE_URL` を本番ドメインに設定（コード fallback は安全網。実値はドメイン確定後に設定）。
- ドメイン紐付け → *.vercel.app から 301 リダイレクト整理。
- ドメイン公開時に **noindex を解除**（layout の `robots:{index:false}` を外す）→ Search Console 登録・sitemap 送信。
- OG/SNS 共有をドメインで実機検証。

### 20. App Store 化前に残る課題
- ストア用の**全サイズ実アイコン**＋スクリーンショット、プライバシー栄養ラベル、年齢レーティング、アカウント削除導線（該当時）。
- Capacitor（`capacitor.config.ts` / `CAPACITOR_STATIC_EXPORT`）本番ビルド確認。
- 「USJ/ユニバ」表現の**ストア表記レビュー**（説明文・スクショでも非公式を明記）。
- 広告を入れる場合のみ ATT/同意/SDK 審査要件（現状は不要）。

---

## 確認に用いた検証コマンド（証跡）

- `git show --stat 5d03524` / `git show 5d03524 -- <text files>` → 全テキスト差分
- Python(PIL) で 4 アイコンの寸法・near-white 率 → 実コンテンツ・正サイズを確認
- `git show --name-only | grep package/translations/generated` → 該当なし
- `grep AdSlot app/layout.tsx` → 呼び出しは残るが本体 null
- `git status` → クリーン

---

## 補足（非ブロッキング・申し送り）

判定（承認）には影響しない。

1. **広告非表示に伴う下部余白の残り**: ナビは広告のために上げた `+4.25rem` のまま、`main pb-52`・フッター `pb-44` も広告前提の大きめ値が残存。広告が null になった結果、モバイル下部に**やや広い空きスペース**ができ、ナビが必要以上に高く浮く。破壊ではない（機能影響なし）。広告非表示が長く続くなら、ナビ位置を `+0.75rem` 付近へ戻し pb を縮める微調整で画面を有効活用できる。Phase 3 で広告を戻すなら現状維持でもよい。
2. **AdSlot は null 返却で無害化**: import/呼び出しは残置。再開時はコンポーネント本体を復元すればよい。未使用 props/型の残りは許容。
3. **noindex の方式が適切**: robots.txt は `allow:"/"` のまま、各ページ meta に noindex/nofollow。クローラにページを取得させて noindex を認識させる正しい手順。解除忘れ防止のため、ドメイン公開タスクに「noindex 解除」を明記推奨。
4. **noindex は全ページ適用**（layout 由来）。一時方針として妥当。解除はドメイン公開時に layout の robots を外すだけ。
5. **非公式ポジションの公開リスク**: 免責・非公式表記は維持されており、noindex＋ソフト公開の段階ではリスクは低い。index 解除（公開拡大）前に、ストア同様の非公式明記の最終確認を推奨。
6. **設計docs のリポジトリ追加**: 本commitで docs 2点も追加。プロジェクト資料として無害。

---

## 結論

空白だった PWA/ホーム画面/favicon アイコン（192/1024/180）が実アイコン（near-white≈0.006）に差し替わり、manifest theme_color 統一、robots/sitemap の localhost fallback 解消、layout の noindex/nofollow、広告プレースホルダーの非表示（null 返却）がすべて設計どおり実装。変更は最小範囲に収まり、package.json・translations・generated JSON・DB/crawler への副作用なし、Coverage 不変。URL 共有での Web/PWA ソフト公開に必要な最小修正として十分。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
