# iOS Age Rating Audit v1

更新日: 2026-07-11

対象アプリ: ユニコレ  
Bundle ID: `com.doublecorgi.unicolle`  
Version / Build: `1.0 / 1`

## 結論

年齢レーティング回答候補は、通常コンテンツは低リスクだが、商品データに酒類メニュー名が含まれるため「アルコール、たばこ、薬物の使用または言及」は **Infrequent / Mild** 候補とする。

また、アプリはGoogle AdMobバナー広告を表示するため、広告項目は「あり」。任意URLを入力して閲覧するブラウザ機能はないため、制限のないWebアクセスは「なし」候補。ただしCapacitor WebViewで自社Productionサイトを表示し、固定の外部リンクを開く導線があるため、App Store Connect入力時に人間が確認する。

想定レーティング:

- iOS 26以降のApple定義では、広告があるアプリはA12に含まれる可能性がある。
- OS 26以前のGlobal ratingでは、酒類への軽微/まれな言及があるため12+相当候補。
- App Store Connectの自動計算結果を最終とし、本資料では **12+ / A12相当候補** とする。

## 公式資料

- Apple Age ratings values and definitions: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
- Apple Set an app age rating: https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/

Apple公式定義では、広告は年齢レーティング上のCapabilitiesに含まれる。OS 26以降の定義では、Infrequent alcohol/tobacco/drug use or reference は12+相当、Unrestricted web access は16+相当、Frequent alcohol/tobacco/drug use or references は18+相当として扱われる。

## 実装・データ確認

| 項目 | 結果 | 根拠 |
| --- | --- | --- |
| 暴力表現 | なし | 商品図鑑、食べた記録、管理画面 |
| 性的内容/ヌード | なし | 該当機能/データなし |
| 恐怖表現 | なし | 該当コンテンツなし |
| ギャンブル/コンテスト | なし | StoreKit/IAP/抽選/賭け機能なし |
| 酒類言及 | あり | `フローズン・ジントニック ～シトラス～`, `25周年カクテル ～ポップコーンフレーバー？～` |
| 医療情報 | なし | 該当コンテンツなし |
| ユーザー生成コンテンツ | 公開投稿なし。端末内レビュー/メモのみ | `lib/use-food-reviews.ts` |
| メッセージ機能 | なし | DM/チャットなし |
| 制限のないWebアクセス | なし候補 | 任意URL入力ブラウザなし。固定リンクのみ |
| 広告 | あり | `@capacitor-community/admob`, `components/mobile-admob-banner.tsx` |
| 位置情報 | なし | Info.plist権限なし、コード検索 |
| アプリ内購入 | なし | StoreKit/IAPコードなし |
| ランダムアイテム/ルートボックス | なし | 該当機能なし |
| 保護者向け機能 | なし | 該当機能なし |

## 年齢レーティング回答候補

| App Store Connect質問項目 | 回答候補 | 頻度 | 根拠 | 該当商品または機能 | 人間確認が必要な点 |
| --- | --- | --- | --- | --- | --- |
| Cartoon or Fantasy Violence | None | なし | 暴力を主題にした機能/コンテンツなし | なし | なし |
| Realistic Violence | None | なし | 該当なし | なし | なし |
| Prolonged Graphic or Sadistic Realistic Violence | None | なし | 該当なし | なし | なし |
| Profanity or Crude Humor | None | なし | アプリ提供コンテンツに該当表現なし。ローカルレビューはNGワードフィルタあり | `lib/use-food-reviews.ts` | ユーザーの端末内メモは公開されない |
| Mature or Suggestive Themes | None | なし | 該当なし | なし | なし |
| Horror or Fear Themes | None | なし | 該当なし | なし | なし |
| Medical or Treatment Information | None | なし | 医療助言/治療情報なし | なし | なし |
| Alcohol, Tobacco, or Drug Use or References | Yes | Infrequent / Mild | 酒類商品名と説明が商品データに含まれる | `フローズン・ジントニック ～シトラス～`, `25周年カクテル ～ポップコーンフレーバー？～` | 酒類商品が増えた場合も頻度が「まれ/軽微」に収まるか確認 |
| Sexual Content or Nudity | None | なし | 該当なし | なし | なし |
| Graphic Sexual Content and Nudity | None | なし | 該当なし | なし | なし |
| Simulated Gambling | None | なし | 賭け、カジノ、確率型報酬なし | なし | なし |
| Gambling | None | なし | 金銭賭博なし | なし | なし |
| Contests | None | なし | コンテスト応募/景品機能なし | なし | なし |
| Loot Boxes / Random Items | None | なし | ランダム購入や有償抽選なし | なし | なし |
| User-Generated Content | No / None候補 | なし | 公開投稿・ユーザー間共有なし。レビュー/メモは端末内のみ | `lib/use-food-reviews.ts`, `lib/local-user-data.ts` | Appleの質問文が端末内メモまで含む場合は人間確認 |
| Messaging and Chat | No | なし | DM/チャットなし | なし | なし |
| Social Media | No | なし | SNS機能なし | なし | なし |
| Advertising | Yes | あり | AdMobバナー広告 | `components/mobile-admob-banner.tsx` | App Store ConnectのCapabilitiesでYesを選択 |
| Unrestricted Web Access | No候補 | なし | 任意URLを入力できるブラウザなし。固定のProduction URLと固定外部リンクのみ | `capacitor.config.json`, `/request` Googleフォームリンク | WebViewアプリである点をApple UI上の説明と照合 |
| Location | No | なし | 位置情報権限なし | Info.plist | SDKのCoarse Locationは広告/同意処理用で、年齢レーティングの位置情報機能ではない候補 |
| In-App Purchase | No | なし | StoreKit/IAPなし | コード検索 | なし |
| Parental Controls | No | なし | 保護者向け制限機能なし | なし | なし |
| Age Assurance | No | なし | 年齢確認機能なし | なし | 酒類情報を表示するが購入機能なし |

## アルコール項目の根拠

該当データ:

- `data/imports/unicolle-summer-2026-import-ready.json`
  - `フローズン・ジントニック ～シトラス～`
  - 説明に `ジャパニーズクラフトジン 翠使用`
  - `25周年カクテル ～ポップコーンフレーバー？～`
- `docs/unicolle-summer-2026-auto-verification-result.md`
  - 酒類系商品の登録結果

回答:

- Alcohol, Tobacco, or Drug Use or References: **Infrequent / Mild**

理由:

- 酒類は商品名/説明として表示される。
- 飲酒を促進する機能、購入機能、飲酒体験の演出はない。
- 商品図鑑の一部としての参照であり、頻度は限定的。

## 広告項目の根拠

回答:

- Advertising: **Yes**

理由:

- iOS native環境でAdMobバナー広告を表示する。
- UMP同意処理と非パーソナライズ指定 `npa: true` はあるが、広告が存在する事実は変わらない。

## Webアクセス項目の根拠

回答候補:

- Unrestricted Web Access: **No**

理由:

- アプリはCapacitor WebViewで `https://unicolle.vercel.app` を表示する。
- 任意URL入力欄、検索エンジン、一般ブラウザ機能はない。
- 外部リンクはプライバシー/問い合わせ/Googleフォーム/情報源など固定の導線。

人間確認:

- App Store Connectの質問文が「WebViewで任意の外部Webを開けるか」を問う場合はNo。
- 「外部リンクを含むか」を広く問う場合は、固定外部リンクありとして備考に記録。

## 想定される最終レーティング

候補:

- iOS 26以降: **A12相当候補**
- 旧OS表示: **12+候補**

主因:

- AdMob広告あり
- 酒類メニューへの軽微/まれな言及あり

上がり得る条件:

- AppleがCapacitor WebViewをUnrestricted Web Accessと判定した場合
- 酒類言及をFrequent/Intenseと判断した場合
- 今後、公開投稿/チャット/任意Webブラウザ機能を追加した場合

## 入力前チェック

1. App Store ConnectのAge Rating画面を開く。
2. Violence系はすべてNone。
3. Sexuality/Nudity系はすべてNone。
4. Medical/TreatmentはNone。
5. Alcohol/Tobacco/Drug Use or ReferencesはInfrequent/Mild。
6. Gambling/Simulated Gambling/Contests/Loot BoxesはNone。
7. User-generated contentはNo候補。
8. Messaging/Chat/Social MediaはNo。
9. AdvertisingはYes。
10. Unrestricted Web AccessはNo候補。
11. In-App PurchaseはNo。
12. App Store Connectが表示する最終レーティングを確認し、本資料の想定と差分があれば記録する。

## 人間が確認すべき点

1. Appleの現在の質問票で「Advertising」が独立質問として表示されるか。
2. WebViewアプリで固定外部リンクがある場合のUnrestricted Web Access判定。
3. 酒類商品名の表示がInfrequent/Mildで妥当か。
4. 端末内のみのレビュー/メモがUser-generated contentに該当しない扱いでよいか。
