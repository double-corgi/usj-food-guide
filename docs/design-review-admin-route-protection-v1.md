# 設計レビュー証跡: /admin ルート保護（proxy.ts 最小ゲート）

- **対象commit**: `3a8986f8960a8ff2b377b7a952939fa487c3e67f`
- **commit message**: `fix: protect admin routes`
- **レビュー担当**: Claude（設計・レビュー / セキュリティ観点）
- **レビュー日**: 2026-06-22
- **判定**: ✅ **承認**（公開前の最小ゲートとして妥当。運用・将来対応は補足参照）

---

## 0. 結論サマリー

Next.js 16 の **proxy.ts（旧 middleware.ts のリネーム後の正式名）** で `/admin` `/admin/*` `/api/admin` `/api/admin/*` をサーバー側保護。**fail-closed（token 未設定なら404）**、Cookie は **HttpOnly/SameSite/Secure**、URL から token を除去するリダイレクト。実ビルド成果物で**ミドルウェアが有効登録されていること**も確認。最小ゲートとして妥当＝承認。
ただし「単一共有トークン＝ロールなし」「初回 ?adminToken がサーバーログに残りうる」等、**本格的な書き込み系 admin 機能の前に強化すべき点**を補足に記載。

---

## 変更内容（実diff）

`git show --stat 3a8986f` → **2 files changed**

| ファイル | 変更 |
|---|---|
| `proxy.ts` | admin 保護ロジックを刷新（旧: localhost 許可＋admin_key＋/admin-locked rewrite → 新: ADMIN_ACCESS_TOKEN による Cookie/クエリ認証＋404 拒否）。matcher を /admin・/admin/*・/api/admin・/api/admin/* に拡張 |
| `.env.example` | `ADMIN_ACCESS_KEY=` → `ADMIN_ACCESS_TOKEN=`（実トークンなし） |

---

## ミドルウェア有効化の確認（最重要・セキュリティ）

`/admin` 保護は「proxy.ts が実際に実行される」ことが前提。Next.js 16.2.6 では **middleware.ts → proxy.ts** にリネームされており、`export function proxy` ＋ `export const config.matcher` が正式形。実ビルド成果物で検証:

- `.next/server/middleware.js`（コンパイル済）に admin ロジック・matcher・`ADMIN_ACCESS_TOKEN`・`admin_access_token`・`adminToken` が含まれることを確認。
- `.next/server/functions-config-manifest.json` に **`/_middleware`（runtime: nodejs）** が登録され、**4つの admin matcher**（/admin, /admin/:path*, /api/admin, /api/admin/:path*）が正規表現で展開済み。各 matcher は `.json`/`.rsc`/`_next/data`/`.segment.rsc` 変種も含む → **RSC/セグメント fetch による迂回も塞がれている**。
- ビルド時刻(06:22:50) > proxy.ts(06:21:31) → 現行 proxy.ts を反映したビルド。

> 補足: `middleware-manifest.json` は空だが、これは edge 用の旧マニフェスト。本 proxy は **nodejs ランタイム**で `functions-config-manifest.json` に登録されるため、空でも矛盾しない。→ **保護は有効に配線されている**と判断。

---

## セキュリティロジック評価

| 項目 | 評価 |
|---|---|
| fail-closed（ADMIN_ACCESS_TOKEN 未設定 → 404） | ✅ 安全側 |
| 404 で存在秘匿（403/ログイン画面でない） | ✅ |
| Cookie: httpOnly / sameSite=lax / secure(https) / path=/ / maxAge 8h | ✅ 妥当 |
| token を URL から除去（redirect で adminToken 削除） | ✅ ブラウザ履歴/referrer 対策 |
| matcher 網羅（page＋API＋RSC変種） | ✅ |
| 拒否応答に Cache-Control: no-store | ✅ |
| 実トークン・.env/.env.local 非commit | ✅ |

---

## レビュー観点ごとの判定

| # | 観点 | 結果 | 根拠 |
|---|------|------|------|
| 1 | /admin・/admin/*・/api/admin・/api/admin/* がサーバー側保護されているか | ✅ | matcher＋functions-config-manifest 登録を確認 |
| 2 | token 未設定時に安全側で拒否か | ✅ | `if(!configuredToken) return 404`（fail-closed） |
| 3 | 正しい token のみ通過か | ✅ | cookie/query が configuredToken 一致時のみ next() |
| 4 | adminToken が URL に残らないか | ✅ | redirect で `searchParams.delete("adminToken")` |
| 5 | Cookie が HttpOnly か | ✅ | `httpOnly:true`（＋sameSite/secure） |
| 6 | 通常ページに影響していないか | ✅ | `isAdminPath` 以外は即 next()。matcher も admin 限定 |
| 7 | 実トークン/.env/.env.local が commit されていないか | ✅ | diff は .env.example のキー名のみ |
| 8 | proxy.ts の変更が最小か | ✅ | admin 保護関数＋matcher＋ヘルパのみ |
| 9 | .env.example の追記が適切か | ✅ | `ADMIN_ACCESS_TOKEN=`（空・命名一貫） |
| 10 | package.json/generated/data/DB/crawler/AdMob/AdSense に触れていないか | ✅ | diff になし |
| 11 | 手動フード管理scaffold前の安全対策として妥当か | ✅ | 公開前の最小ゲートとして妥当（書き込み機能前の前提条件を満たす方向） |
| 12 | 本番反映前の注意点 | ⚠️ | 下記 |
| 13 | ADMIN_ACCESS_TOKEN をいつ設定すべきか | ⚠️ | 下記 |

### 12. 本番（Vercel）反映前の注意点
- **Vercel 環境変数 `ADMIN_ACCESS_TOKEN` を設定**（Production／必要なら Preview）。**`NEXT_PUBLIC_` を付けない**（クライアント露出禁止）。未設定なら /admin は 404＝安全側だが admin が使えない。
- **長くランダムな値**にする（レート制限が無いため、トークン強度で総当たりを実質不能にする）。
- **デプロイ後にライブ・スモークテスト**を推奨: ①Cookie なし `/admin` → 404 ②`/admin?adminToken=<token>` → 307＋Set-Cookie → `/admin` 表示 ③`/api/admin/...` も同様にゲート ④`/foods` 等は通過。ローカル成果物で配線は確認済だが、本番ランタイムでの最終確認が安全。
- token がログ等に露出した疑いがあれば**即ローテーション**（env 値を更新）。

### 13. 設定タイミング
- **admin を使い始める前（公開前）に設定**。未設定中は fail-closed（404）で**危険な開放期間は生じない**ため、慌てる必要はないが、admin 利用前には必須。git には置かず Vercel env のみ。

---

## 確認に用いた検証コマンド（証跡）
- `git show 3a8986f` → diff（proxy.ts / .env.example）
- `cat proxy.ts` → ロジック精査（fail-closed・cookie flags・redirect・matcher）
- `require('next/package.json').version` → **16.2.6**（proxy.ts が middleware の正式名）
- `.next/server/functions-config-manifest.json` → `/_middleware`(nodejs) ＋ 4 admin matcher 登録を確認（.rsc/_next/data 変種含む）
- `.next/server/middleware.js` → admin ロジック・token 文言の埋め込み確認
- `git status` クリーン

---

## 補足（非ブロッキング・将来対応）

判定（承認）には影響しないが、**書き込み系 admin（手動フード管理）を載せる前に**強化推奨。

1. **単一共有トークン＝ロールなし**: 設計書(`admin-manual-food-management-plan-v1.md`)の owner/editor/viewer は未実装（本commitは「最小ゲート」なので妥当）。追加・編集・公開を行う前に **email allowlist＋ロール＋操作ログ**を持つ本認証へ拡張すること。
2. **初回 `?adminToken=` がサーバーログに残りうる**: redirect でブラウザ履歴/referrer は除去されるが、**Vercel のアクセスログには初回リクエストURL（クエリ含む）が記録され得る**。将来は POST/ヘッダ受け取りに改善余地。当面は長いランダムトークン＋必要時ローテーションで緩和。
3. **比較が定数時間でない**（`===`）: ネットワーク揺らぎでタイミング攻撃は実質困難だが、機密トークンなので constant-time 比較が理想（低優先）。
4. **レート制限なし**: トークン強度に依存。長いランダム値必須。
5. **`/admin-locked` が孤児化**: 旧 rewrite 先。現在は未使用かつ matcher 外（`/admin-` は `/admin/` で始まらない）で非ゲート。無害だが将来整理可。
6. **Cookie は path=/ で全リクエスト送出**（/admin と /api/admin 双方に必要）。HttpOnly で緩和済。

---

## 結論

Next 16 の proxy.ts で /admin・/api/admin 系をサーバー側・fail-closed で保護。Cookie 衛生（HttpOnly/SameSite/Secure）・URLトークン除去・RSC変種を含む matcher・404秘匿が揃い、実ビルドでミドルウェア登録も確認。最小公開前ゲートとして妥当。変更は proxy.ts と .env.example のみで、実トークン/.env 非commit、他領域（generated/data/DB/crawler/AdMob/package.json）不変、git クリーン。本番では `ADMIN_ACCESS_TOKEN`（長くランダム・非public）の設定とライブ・スモークテストを実施のこと。書き込み系 admin の前に email allowlist＋ロール＋ログへ拡張を推奨。

**判定: 承認**

次の `/goal` は本証跡の確認後に別途作成する（本タスクでは作成しない）。
