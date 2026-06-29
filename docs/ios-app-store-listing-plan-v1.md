# UNICOLE iOS App Store Listing Plan v1

作成日: 2026-06-29

## 1. 目的

UNICOLE の iOS アプリを TestFlight / App Store Connect に進める前に、App Store Connect へ入力する文章、必要 URL、プライバシー申告候補、スクリーンショット構成、不足素材を整理する。

今回は設計書作成のみ。App Store Connect への登録、Archive のアップロード、TestFlight 提出、App Store 提出、コード変更、広告設定変更は行わない。

## 2. 現在のアプリ内容

### 基本情報

| 項目 | 現在値 |
| --- | --- |
| アプリ名 | ユニコレ |
| Bundle ID | `com.doublecorgi.unicolle` |
| 公開 Web URL | `https://unicolle.vercel.app` |
| 位置づけ | 非公式のフードコレクションアプリ |
| iOS AppIcon | 設定済み |
| LaunchScreen | クリーム背景 + 中央アイコンで設定済み |
| 広告 | iOS Capacitor アプリ内で AdMob バナーあり |
| 管理画面 | 一般利用者向け導線には出さない方針 |

### 利用者向け機能

- ホーム: 最近追加・更新したフード、コレクション状況、主要導線を表示。
- フード検索: 商品名、カテゴリ、販売状態、エリア、店舗などで検索・絞り込み。
- フード詳細: 商品画像、商品名、価格、エリア、店舗、販売状態、カテゴリ、食べた操作を表示。
- 食べた記録: 端末内に保存した食べた記録、評価、メモ、金額などを表示。
- エリア: エリア別にフードを確認。
- 店舗: 店舗別にフードを確認。
- 広告: iOS アプリでは AdMob バナーを表示。Web/PWA では AdMob を開始しない。

### ログイン有無

- 一般利用者はログイン不要。
- 食べた記録は端末内 localStorage に保存する。
- `/admin` は運営者向け管理画面であり、一般利用者向けアプリの説明・スクリーンショットには含めない。
- 管理画面は Supabase Auth / admin_users で制限されているが、App Store の一般機能としては扱わない。

### 保存する利用者情報

現在のコードから確認できる利用者側の保存情報:

- 食べた記録
- 食べた日時
- 食べた回数
- 評価
- 管理者ではなく利用者が入力するメモ
- 支払金額
- 最近検索したキーワード
- PWA 案内の非表示状態

これらは基本的に端末内 localStorage 保存であり、通常利用では運営者サーバーへ自動送信しない。

問い合わせ・発見報告を送信した場合は、送信内容が管理者確認用に保存される。任意の連絡先を入力した場合は Contact Info として扱う可能性がある。

## 3. App Store 入力文章案

### アプリ名

ユニコレ

### サブタイトル案

USJフードを探して記録

代替案:

- 食べたフードをコレクション
- パークフードの記録アプリ
- フード探しと食べた記録

### プロモーションテキスト案

パークで食べたフードを記録して、自分だけのコレクションに。画像、価格、エリア、店舗から探せる非公式フード記録アプリです。

### 説明文案

ユニコレは、ユニバーサル・スタジオ・ジャパン周辺のフードを探して、食べた記録を残せる非公式のフードコレクションアプリです。

画像を見ながら気になるフードを探し、食べたものを記録すると、自分だけのフードコレクションとして残せます。エリア別、店舗別、カテゴリ別に探せるので、来園前のチェックにも、当日の食べ歩きメモにも使えます。

主な機能:

- フードを画像付きで探せる
- 商品名、カテゴリ、エリア、店舗で検索
- 食べたフードを端末内に記録
- 評価、メモ、食べた日、金額を保存
- エリア別、店舗別にフードを確認
- 最近追加・更新されたフードをチェック
- 非表示・販売終了などの状態を分かりやすく表示

本アプリは、ユニバーサル・スタジオ・ジャパン、合同会社ユー・エス・ジェイ、NBCUniversal、その他権利者が提供・承認・運営する公式アプリではありません。掲載している商品名、画像、価格、販売場所、販売期間、販売状況は変更される場合があります。来園前および現地では、公式サイト、公式アプリ、現地表示をご確認ください。

### キーワード案

USJ,ユニバ,ユニコレ,フード,グルメ,食べ歩き,チュリトス,ポップコーン,テーマパーク,大阪

注意:

- キーワードは App Store Connect の文字数制限内で調整する。
- 公式誤認を避けるため「公式」「Official」は入れない。

### 新機能欄案

初回リリース:

ユニコレを公開しました。フード検索、食べた記録、エリア・店舗別の確認、iOSアプリでの表示に対応しています。

### サポート向け説明案

不具合、掲載情報の修正依頼、削除依頼、プライバシーに関する問い合わせは、アプリ内または Web サイトのお問い合わせページから連絡できます。

### 審査担当者向けメモ案

本アプリは、テーマパークのフードを探して記録するための非公式アプリです。公式アプリではないことをアプリ内のプライバシーポリシー、利用規約、説明文に明記しています。

一般利用者はログイン不要で利用できます。食べた記録、評価、メモ、金額は端末内 localStorage に保存され、通常利用では運営者へ自動送信されません。

管理画面は運営者用で、一般利用者向け導線には表示していません。

広告は iOS アプリ内で AdMob バナーを使用します。Debug / Simulator ではテスト広告を使用し、Release で本番広告 ID に切り替える構成です。

## 4. 非公式アプリ表記案

### 短い表記

このアプリはユニバーサル・スタジオ・ジャパン公式アプリではありません。

### 説明文内の表記

本アプリは、ユニバーサル・スタジオ・ジャパン、合同会社ユー・エス・ジェイ、NBCUniversal、その他権利者が提供・承認・運営する公式アプリではありません。掲載情報は確認時点の内容であり、最新性・正確性を保証するものではありません。

### 商品情報に関する表記

価格、販売場所、販売期間、在庫、メニュー内容は変更される場合があります。来園前および現地では、公式サイト、公式アプリ、現地表示をご確認ください。

### 商標・画像に関する注意

USJ、ユニバーサル・スタジオ・ジャパン、各作品名、キャラクター名、商品名、画像等の権利は各権利者に帰属する。App Store 説明文、スクリーンショット、アプリ内表示では公式運営と誤認される表現を避ける。

## 5. 必要 URL 一覧

現在の Web サイトで代用可能な候補:

| 用途 | 候補 URL | 判定 |
| --- | --- | --- |
| Privacy Policy URL | `https://unicolle.vercel.app/privacy` | 要更新 |
| Support URL | `https://unicolle.vercel.app/contact` | 使用候補 |
| Marketing URL | `https://unicolle.vercel.app/about` | 使用候補 |
| Terms URL | `https://unicolle.vercel.app/terms` | 使用候補 |
| Disclaimer URL | `https://unicolle.vercel.app/disclaimer` | 使用候補 |
| Contact / Deletion Request | `https://unicolle.vercel.app/contact` | 使用候補 |
| Commercial Disclosure | `https://unicolle.vercel.app/commercial-disclosure` | 必要に応じて使用 |

Phase Store-4 確認結果:

- `https://unicolle.vercel.app` は HTTP 200。
- `https://unicolle.vercel.app/privacy` は HTTP 200。
- `https://unicolle.vercel.app/contact` は HTTP 200。
- `https://unicolle.vercel.app/terms` は HTTP 200。
- `https://unicolle.vercel.app/about` は HTTP 200。
- `https://unicolle.vercel.app/disclaimer` は HTTP 200。
- `/privacy` は Phase Store-4 で AdMob 搭載後の実態に合わせて更新済み。

コード内既定URLとの不一致:

- `app/layout.tsx` の `NEXT_PUBLIC_SITE_URL` fallback は `https://new-app-chi-rosy.vercel.app`。
- `app/sitemap.ts` の `NEXT_PUBLIC_SITE_URL` fallback は `https://new-app-chi-rosy.vercel.app`。
- `app/robots.ts` の `NEXT_PUBLIC_SITE_URL` fallback は `https://new-app-chi-rosy.vercel.app`。
- 今回はURL定数やVercel設定を変更しない。App Store提出前に、人間が `NEXT_PUBLIC_SITE_URL=https://unicolle.vercel.app` の本番設定と fallback 更新方針を最終決定する。

残る確認事項:

- 削除依頼・問い合わせ窓口は `/contact` で代用可能だが、App Store 審査前に実際に送信できるか確認する。

## 6. Privacy Policy に必要な項目

現在のプライバシーポリシーに追記・更新すべき項目:

- iOS アプリでは AdMob による広告配信を行うこと。
- AdMob により広告識別子、広告表示情報、端末情報、利用状況、診断情報等が Google により処理される可能性があること。
- パーソナライズ広告を使うか、非パーソナライズ広告を基本にするか。
- ATT ダイアログを出す運用にするかどうか。
- 食べた記録、評価、メモ、金額は端末内保存であること。
- 問い合わせ・発見報告を送信した場合のみ、送信内容と任意連絡先を管理者確認用に保存すること。
- 管理画面は運営者向けで、一般利用者向けアカウント登録機能ではないこと。
- データ削除依頼の方法。
- WebView / Web 通信でサーバーアクセスが発生すること。

参考:

- Apple Developer: App privacy details on the App Store  
  `https://developer.apple.com/app-store/app-privacy-details/`

Apple の説明では、アプリ本体だけでなく、組み込んだ第三者SDKや広告ネットワークが収集するデータも App Store Connect で申告する必要がある。

## 7. App Privacy 申告候補

最終判断は App Store Connect の質問画面と、AdMob / Google Mobile Ads SDK の最新のプライバシー情報を確認して行う。

### Data Used to Track You 候補

AdMob の設定次第で該当する可能性がある:

- Identifiers
  - Device ID
- Usage Data
  - Product Interaction
  - Advertising Data
- Diagnostics
  - Crash Data
  - Performance Data

メモ:

- 現在の実装は `npa: true` を指定しているが、Google Mobile Ads SDK がどのデータを収集・利用するかは提出前に最新情報を確認する。
- パーソナライズ広告や他社データとの結合が発生する場合は Tracking / ATT の検討が必要。

### Data Linked to You 候補

一般利用者向けにはログインが無く、食べた記録は端末内保存。ただし、問い合わせや発見報告で任意連絡先を送る場合:

- Contact Info
  - Email Address または Other User Contact Info
- User Content
  - Customer Support
  - Other User Content

管理者ログインは一般利用者向け機能ではないが、運営者用には Supabase Auth でメールアドレスを扱う。App Store の一般利用者向け申告に含めるかは、審査向け説明と実際の配布範囲を確認する。

### Data Not Linked to You 候補

AdMob / エラー監視 / アクセス解析を有効化している場合、以下が該当する可能性がある:

- Usage Data
- Diagnostics
- Advertising Data

### 収集しない想定

現在の利用者向けコードでは、以下の権限やデータ収集は確認していない:

- 正確な位置情報
- 連絡先
- カメラ
- マイク
- 写真ライブラリ
- ヘルスケア情報
- 決済情報
- Apple / Google / メールによる一般利用者ログイン

### localStorageのみの情報

以下は端末内保存で、通常利用では運営者へ自動送信しない:

- 食べた記録
- 評価
- メモ
- 食べた日
- 支払金額
- 最近検索したキーワード
- 最近見た商品

Apple の説明では、端末内だけで処理され外部送信されないデータは「collect」ではない扱いになる場合がある。ただし、WebView経由の通信や第三者SDKの処理は別途確認する。

## 8. スクリーンショット構成

### 方針

- 管理画面は含めない。
- Test mode 広告は提出画像に出さない。
- 本番広告もスクリーンショットでは主役にしない。
- 公式アプリと誤認される表現を避ける。
- 商品画像や商品名が過度に公式提供物のように見えないよう、アプリの記録・検索機能を主役にする。

### 6.9インチ用候補

1. ホーム  
   見出し案: 「食べたフードをコレクション」

2. フード検索  
   見出し案: 「画像・カテゴリ・店舗で探せる」

3. フード詳細  
   見出し案: 「価格や販売場所をチェック」

4. 食べた記録  
   見出し案: 「食べた記録を端末に保存」

5. エリアまたは店舗  
   見出し案: 「エリア・店舗ごとに確認」

### 6.5インチ用候補

6.9インチと同じ構成で、画面崩れがないものを撮影する。

### iPad

現時点では iPhone 中心のアプリ。iPad 対応を App Store Connect で有効にする場合は、iPad スクリーンショットと横幅表示の確認が必要。iPad を積極対応しない場合も、Universal 設定との整合を Xcode / App Store Connect で確認する。

### 撮影前チェック

- デモ用の食べた記録を入れるか決める。
- 広告が写らない位置・タイミングで撮影する。
- 管理者バーが出ないシークレット/未ログイン状態で撮影する。
- 画像の権利・公式誤認リスクが高い商品が大写しになりすぎないよう確認する。

## 9. カテゴリ・年齢区分候補

### カテゴリ候補

第一カテゴリ:

- フード/ドリンク

第二カテゴリ候補:

- 旅行
- ライフスタイル
- エンターテインメント

推奨:

- 第一カテゴリ: フード/ドリンク
- 第二カテゴリ: 旅行

理由:

- 主機能はフード検索・食べた記録。
- テーマパーク来園時の利用が想定されるため、旅行との相性がよい。

### 年齢区分候補

候補: 4+

確認ポイント:

- ユーザー間コミュニケーション機能はない。
- 一般利用者の投稿が即時公開される機能はない。
- 食品・テーマパーク情報が中心。
- 広告ありとして申告する。
- 外部リンク、問い合わせ、発見報告、広告SDKの有無を App Store Connect の年齢区分質問で確認する。

### 子ども向け設定

「子ども向け」設定は使わない方針。

理由:

- AdMob 広告を搭載している。
- テーマパーク来園者全般向けであり、13歳未満専用に設計していない。
- 子ども向けカテゴリは広告・データ収集・外部リンク要件が厳しくなる。

## 10. 不足項目

| 項目 | 状態 | 次の対応 |
| --- | --- | --- |
| Apple Developer Program | 未完了/確認待ち | 登録完了後に進める |
| App Store Connect アプリ作成 | 未実施 | Bundle ID `com.doublecorgi.unicolle` で作成 |
| Privacy Policy 更新 | Phase Store-4で対応 | AdMob / SDK / 削除依頼を反映。提出前に本番表示を再確認 |
| Support URL | 候補あり | `/contact` を本番で確認 |
| Marketing URL | 候補あり | `/about` を本番で確認 |
| スクリーンショット | 未作成 | 6.9 / 6.5 インチで撮影 |
| App Store 説明文 | 本docに案あり | 人間レビュー後に入力 |
| 非公式表記 | 本docに案あり | 説明文とアプリ内ページへ反映確認 |
| App Privacy | 候補あり | AdMob最新情報を確認して確定 |
| ATT | 要判断 | パーソナライズ広告の有無で判断 |
| 本番広告運用 | 要確認 | Release / TestFlight で表示確認、自分でクリックしない |
| 審査メモ | 本docに案あり | 管理画面が一般導線にないことを明記 |

## 11. 人間が次にやること

1. Apple Developer Program 登録を完了する。
2. App Store Connect に `com.doublecorgi.unicolle` のアプリを作成する。
3. Privacy Policy を AdMob 搭載後の内容に更新する。
4. `/contact`, `/privacy`, `/terms`, `/about` が本番で問題なく見られることを確認する。
5. App Store Connect の App Privacy 質問を、Google Mobile Ads SDK の最新情報と照合して入力する。
6. 6.9インチ / 6.5インチのスクリーンショットを撮影する。
7. Test mode 広告や管理画面がスクリーンショットに写っていないことを確認する。
8. アプリ説明文に非公式表記を入れる。
9. 年齢区分質問で広告・外部リンク・問い合わせ機能を正しく回答する。
10. TestFlight 用 Archive / Upload の前に Release ビルド設定を再確認する。

## 12. 次に Codex へ投げる goal

```text
/goal UNICOLE Phase Store-4: App Store提出前にPrivacy PolicyとSupport/Marketing URLをAdMob搭載後の内容へ更新してください。

目的:
iOS App Store提出前に、現在のプライバシーポリシーがAdMob搭載後の実態と一致するように更新し、App Store Connectに入力するURLとして使える状態にする。

やること:
1. app/privacy/page.tsx をAdMob搭載後の内容へ更新
2. /contact /terms /about /disclaimer の提出用URL候補を確認
3. 非公式アプリ表記を必要に応じて整理
4. App Privacy申告候補と矛盾しない文言にする

やらないこと:
- App Store Connect操作
- TestFlight提出
- AdMob設定変更
- Supabase/Vercel/generated/crawler/translations/proxy変更
- 商品データ変更

検証:
- npm run lint
- npm run typecheck
- npm run build

commit message:
update privacy policy for ios admob release
```

## 13. 参照

- Apple Developer: App privacy details on the App Store  
  `https://developer.apple.com/app-store/app-privacy-details/`
- Apple Developer: Screenshot specifications  
  `https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications`
- 既存ページ:
  - `app/privacy/page.tsx`
  - `app/contact/page.tsx`
  - `app/terms/page.tsx`
  - `app/about/page.tsx`
  - `app/disclaimer/page.tsx`
- 既存docs:
  - `docs/ios-store-readiness-v1.md`
  - `docs/app-store-listing-ja.md`
