# ユニバフードコレクション（ユニコレ）

食べた記録が、そのままコレクションになる。ユニバ（USJ）フードを集めて楽しむための非公式コレクションアプリです。

> このアプリはUSJ公式アプリではありません。公開情報をもとにした非公式ファン向けフード記録アプリです。最新情報は必ず公式サイトをご確認ください。

## 実装済み

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase本接続対応。未設定時は`script/output/*.generated.json`をfallback表示
- 食べた記録、レビュー、星評価は端末内localStorageへ保存
- スマホ優先の図鑑型カードUI、下部ナビ、skeleton、PWA install prompt
- 食べたものリスト、レビュー、optimistic update
- 全体・エリア別・ジャンル別・期間限定コンプリート率
- エリア別、店舗別、ジャンル別の導線
- 管理画面の集計、crawl_logs表示、candidate review表示
- PWA manifest、service worker、offline cache
- Supabase用SQLスキーマ、RLS、index、サンプルseed
- source別crawler、Tridion JSON追跡、HTML/OG/alt/JSON-LD/PDF parser、quality scoring
- CapacitorによるiOS / Android化準備
- 公開前必須ページ: `/privacy`, `/terms`, `/contact`, `/disclaimer`, `/about`, `/security`, `/commercial-disclosure`

ユーザーの記録はログイン不要でブラウザ内に保存します。

## セットアップ

```bash
npm install
npm run dev:auto
```

ブラウザで `http://localhost:3000` を開きます。

### 開発開始手順

普段の開発は次のコマンドだけで起動します。

```bash
npm run dev:auto
```

`dev:auto` は以下を自動で行います。

- port 3000を使用中の既存プロセスを停止
- Next.js dev serverを `http://localhost:3000` で起動
- `/`, `/foods`, `/eaten`, `/areas` が200 OKになるまで確認
- 起動後も定期監視し、落下時は自動再起動

Mac再起動後も、プロジェクトディレクトリで `npm run dev:auto` を実行すれば `localhost:3000` を復旧できます。

### 停止手順

起動中のターミナルで `Ctrl+C` を押します。

別ターミナルから止める場合:

```bash
pkill -f "scripts/dev-watch.ts"
pkill -f "next dev"
```

通常のNext.js起動だけを使いたい場合は、従来どおり `npm run dev -- -p 3000` も利用できます。

## 公開前ドキュメント

- モバイル公開準備: `docs/mobile-release.md`
- App Store入力案: `docs/app-store-listing-ja.md`
- Google Play入力案: `docs/google-play-listing-ja.md`
- 提出用素材一覧: `docs/store-assets.md`
- データ・プライバシー監査: `docs/data-privacy-audit.md`
- 収益化方針: `docs/monetization-policy.md`
- 独自ドメイン公開メモ: `docs/domain-setup.md`
- 監視・解析運用メモ: `docs/observability.md`
- App Store / Google Play審査対策: `docs/app-review-readiness.md`

Capacitor関連コマンド:

```bash
npm run cap:ios
npm run cap:android
npm run cap:sync
```

通常の開発起動は `npm run dev:auto` です。Capacitor検証でホスト済みURLを使う場合のみ `CAPACITOR_SERVER_URL` を設定します。

## 実機確認: Cloudflare Tunnel

iPhone SafariやAndroid Chromeでローカル開発中のNext.jsアプリを確認する場合は、`cloudflared` の一時トンネルを使います。追加料金が発生するGoogle Custom Search APIなどは使いません。

### cloudflaredの確認

```bash
cloudflared --version
```

未導入の場合:

```bash
brew install cloudflared
```

Homebrewを使わない場合は、Cloudflare公式ドキュメントからmacOS用の`cloudflared`をインストールしてください。

### Tunnel起動

ターミナルを2つ使います。

1つ目:

```bash
npm run dev:auto
```

2つ目:

```bash
cloudflared tunnel --url http://localhost:3000
```

起動後、ログに次のようなURLが表示されます。

```text
https://example-words.trycloudflare.com
```

この `https://...trycloudflare.com` が実機確認URLです。iPhoneやAndroidで同じURLを開くと、ローカルの `localhost:3000` が確認できます。

注意:

- URLはトンネル起動中だけ有効です。
- ターミナルを閉じるとURLは使えなくなります。
- Cloudflare Tunnelは開発・実機確認用です。本番公開用ではありません。
- 実機確認URLは第三者もアクセスできる一時公開URLです。認証情報や未公開情報を扱う状態では共有しないでください。

### iPhone SafariでPWA確認

1. Macで `npm run dev:auto` を起動します。
2. 別ターミナルで `cloudflared tunnel --url http://localhost:3000` を起動します。
3. 表示された `https://...trycloudflare.com` をiPhoneのSafariで開きます。
4. `/`, `/foods`, `/foods/[id]`, `/areas`, `/eaten` を確認します。
5. Safari下部の共有ボタンを押します。
6. 「ホーム画面に追加」を選びます。
7. ホーム画面から起動し、standalone表示、下部ナビ、safe-area、画像表示、Google/Appleログイン後の食べた記録Supabase同期を確認します。
8. 機内モードまたは通信が弱い状態で、PWAのoffline cacheが破綻しないか確認します。

確認観点:

- ホーム画面追加アイコンが表示される
- 起動時にSafariのURLバーが出ない
- bottom navigationがiPhoneのホームインジケータに被らない
- 画像200件、placeholder 0件の状態が崩れない
- 食べたボタン、詳細ページ、エリアページがタップしやすい

### Android ChromeでPWA確認

1. Macで `npm run dev:auto` を起動します。
2. 別ターミナルで `cloudflared tunnel --url http://localhost:3000` を起動します。
3. 表示された `https://...trycloudflare.com` をAndroid Chromeで開きます。
4. Chromeのメニューから「アプリをインストール」または「ホーム画面に追加」を選びます。
5. ホーム画面から起動し、standalone表示、下部ナビ、画像表示、食べた記録を確認します。
6. `/foods`, `/foods/[id]`, `/areas`, `/complete`, `/eaten` を確認します。

確認観点:

- インストール導線が表示される
- Androidの戻る操作で画面遷移が破綻しない
- bottom navigationがシステムナビに被らない
- 画像200件、placeholder 0件の状態が崩れない
- offline時に最低限の画面表示が維持される

### App Store / Google Play化に進む前の注意

Cloudflare Tunnelは実機確認用です。本番では以下が必要です。

- 独自ドメイン
- 本番サーバーまたはVercelなどの本番ホスティング
- HTTPS常時運用
- Supabase本番環境とRLS確認
- Capacitorまたはネイティブ実装でのiOS/Androidラップ
- App Store / Google Play用のアイコン、スプラッシュ、プライバシーポリシー
- iOS/Android実機でのPWA/Capacitor差分確認

Capacitor導入時の注意:

- `NEXT_PUBLIC_*` 以外の秘密情報をアプリに含めない
- `output: "export"` が必要か、サーバー機能を残すかを事前に決める
- App内WebViewではCookie、localStorage、外部リンク、戻る操作の挙動がSafari/Chromeと異なる
- 画像URL、Supabase URL、公式サイトへの外部リンクはHTTPS前提にする
- Push通知、位置情報、写真アップロードは権限説明文が必要
- App Store / Google Play申請前に、Cloudflare Tunnelではなく本番URLで検証する
- Tunnel URLをアプリに埋め込まない

## 環境変数

`.env.local.example`をコピーして`.env.local`を作成します。

```bash
cp .env.local.example .env.local
```

環境変数なしでも`npm run crawl`で生成されるJSONを使って閲覧できます。本番運用ではSupabase設定が必須です。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_REQUEST_FORM_URL=https://forms.gle/cpLfsGziu9avEeZUA
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_ACCESS_TOKEN=
CRON_SECRET=
CRAWL_DELAY_MS=700
CRAWL_MAX_RESTAURANT_PAGES=80
CRAWL_MAX_SPECIAL_PAGES=60
CRAWL_MAX_NEWS_PAGES=50
CRAWL_MAX_PDFS=12
```

placeholder商品の画像は、`/admin/images` から手動登録できます。商品ごとにGoogle画像検索リンクを開き、商品本体が写っているURLだけを入力してください。保存時にhttp/https URLと画像として開けることを確認し、保存後は`/foods`へ即反映されます。

## Supabase

Supabase SQL Editorで以下の順に実行します。

```sql
-- 1. テーブル、制約、RLS
-- supabase/schema.sql

-- 2. MVPサンプルデータ
-- supabase/seed.sql
```

主な設計:

- `foods.source_url` と `foods.last_checked_at` は必須
- `food_images`で複数画像、`source_type`、ON/OFFを管理
- 公式画像はローカル保存せずURL参照
- `foods.manual_override`で手動修正を後続の自動取得から保護
- `foods.review_status`、`confidence_score`、`hidden`、`duplicate_group_id`で公開可否と品質管理
- 同一商品重複防止のため`foods(shop_id, normalized_name)`をユニーク化
- 消えたメニューは削除せず`inactive`または`unknown`へ移行する想定

## 主要ルート

- `/` ホーム
- `/foods` 全フード一覧
- `/foods/[id]` メニュー詳細
- `/eaten` 食べたものリスト
- `/complete` コンプリート画面
- `/areas` エリア別ページ
- `/shops` 店舗別ページ
- `/genres` ジャンル別ページ
- `/admin` 管理画面MVP
- `/admin/prices` 価格確認センター

## 公開前監査

提出前に以下を実行します。

```bash
npm run lint
npm run typecheck
npm run build
npm run audit:privacy
npm run audit:release
```

`npm run audit:release` は法務ページ、問い合わせ、Sentry/Analyticsの任意設定、Error Boundary、独自ドメイン準備、App Store / Google Play審査メモ、管理画面保護、PWA/Capacitor準備、food/image/placeholder維持をまとめて確認します。結果は `scripts/output/release-readiness.generated.json` に保存されます。
- `/privacy` プライバシーポリシー
- `/terms` 利用規約
- `/contact` お問い合わせ
- `/disclaimer` 免責事項
- `/about` アプリについて
- `/security` セキュリティ方針
- `/commercial-disclosure` 商業的表示・収益化方針

## ファイル構成

```text
app/
  foods/[id]/page.tsx
  areas/page.tsx
  shops/page.tsx
  genres/page.tsx
  eaten/page.tsx
  complete/page.tsx
  admin/page.tsx
components/
  food-card.tsx
  food-grid.tsx
  food-detail.tsx
  completion-page.tsx
lib/
  repositories/
    foods.ts
    shops.ts
    areas.ts
    generated-data.ts
  food-utils.ts
  use-food-logs.ts
  supabase.ts
scripts/
  crawlers/
  utils/
  output/
supabase/
  schema.sql
  seed.sql
types/
  domain.ts
public/
  manifest.webmanifest
  placeholders/*.svg
```

## crawler

```bash
npm run crawl
npm run crawl:restaurants
npm run crawl:allergy
npm run crawl:events
npm run crawl:news
npm run crawl:pdfs
npm run crawl:quality
```

構成:

- `scripts/crawlers/crawl-restaurants.ts`
- `scripts/crawlers/crawl-allergy.ts`
- `scripts/crawlers/crawl-news.ts`
- `scripts/crawlers/crawl-events.ts`
- `scripts/crawlers/crawl-menu-pdfs.ts`
- `scripts/utils/http.ts`
- `scripts/utils/tcm-parser.ts`
- `scripts/repositories/supabase-upsert.ts`

実装内容:

- 公式WebページからTridion JSON URLを導出
- internal link recursive crawl
- HTML / JSON-LD / OpenGraph / image alt / srcset / PDF parsing
- retry、timeout、rate limit、failure isolation
- source別crawler
- 重複除去、status判定、stale inactive化
- confidence scoring、approved / pending / rejected分類
- Supabase未設定時の`foods.generated.json` / `shops.generated.json` / `areas.generated.json`出力
- placeholder商品は`/admin/images`で画像URLを手動登録
- `/admin/images`で既存候補画像を確認し、承認した画像だけ通常画面へ反映
- `source_url`、`last_checked_at`、`crawl_logs`保存
- `manual_override`は自動上書きを抑制

注意:

- robots.txtと利用規約に配慮し、定期実行は1日1回以下にしてください。
- 公式画像は保存せずURL参照のみです。
- 通常画面には`approved`かつ`hidden=false`のみ表示します。
- TridionやPDF由来の候補にはノイズが残るため、管理画面で`pending` / `rejected` / duplicateを確認します。

## デプロイ

Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

ユーザーデータ:

- ログイン不要で利用
- 食べた記録、レビュー、星評価は端末内localStorageへ保存
- 別端末へ移す場合は設定画面のバックアップJSON出力・復元を使用

GitHub Actions:

- `.github/workflows/crawl.yml`を追加済み
- 上記3つのSecretsを設定
- cronは1日1回

## PWA

- `public/manifest.webmanifest`
- `public/sw.js`
- install prompt
- standalone display
- app shell offline cache

## iPhoneアプリ化方針

Expo React Nativeへ移す前提で、以下を分離しています。

- `lib/repositories/*`
- `lib/use-food-logs.ts`
- `types/domain.ts`
- Supabase schema共通
- 画像優先順位ロジック共通

## 次フェーズ

1. 管理画面のCRUD、duplicate merge、manual lock UI
2. crawler候補の人手レビューworkflow
3. Expo React Native実装
4. push通知、ランキング、共有
