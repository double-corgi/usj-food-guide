# UNICOLE iOS Store Readiness Checklist v1

## 1. 調査概要

今回は iOS TestFlight / App Store 提出前の確認と設計のみを行う。コード変更、依存追加、AdMob SDK 変更、広告 ID 変更、App Store / TestFlight 提出、Supabase / Vercel / generated JSON / crawler / translations / proxy 変更は行わない。

確認対象は、現在の Next.js / Capacitor / iOS / AdMob 設定、非公式アプリとしての提出リスク、TestFlight 前に必要な素材と確認項目である。

## 2. 現在できていること

- iOS Simulator で Capacitor アプリとして起動確認済み。
- iOS アプリ内でホーム、フード一覧、フード詳細、食べた記録、下部ナビの基本表示確認済み。
- アプリ内では PWA の「ホーム画面に追加」案内を出さない方針に整理済み。
- AdMob iOS テストバナーは表示確認済み。
- Debug 構成では Google 公式テスト App ID を使う。
- Release 構成では本番 AdMob App ID `ca-app-pub-4180695956777361~2101761177` を使える準備済み。
- 下部バナー広告ユニット ID は、Debug / Simulator では Google 公式テスト ID を使い、Release では環境変数で本番広告ユニット ID `ca-app-pub-4180695956777361/5657862807` に切り替えられる構成。
- 管理画面は Web 限定方針。
- Web / PWA 版は維持されている。
- Android は Java / Android SDK / Emulator が無い環境のため保留。

## 3. 現在の iOS 設定確認

| 項目 | 現在値 | 判定 | メモ |
| --- | --- | --- | --- |
| Capacitor appName | ユニコレ | OK | `capacitor.config.ts` で確認 |
| Capacitor appId | `com.doublecorgi.unicolle` | OK | USJを含まないIDへ変更済み |
| iOS display name | ユニコレ | OK | `CFBundleDisplayName` |
| Bundle Identifier | `com.doublecorgi.unicolle` | OK | USJを含まないIDへ変更済み |
| Version | 1.0 | OK | `MARKETING_VERSION` |
| Build number | 1 | OK | `CURRENT_PROJECT_VERSION`。提出ごとに増やす |
| Deployment target | iOS 15.0 | OK | 対応端末範囲として妥当 |
| App Icon | AppIconあり | 要確認 | 実機・Xcode Organizer で全サイズ警告が無いか確認 |
| Launch Screen | LaunchScreen.storyboardあり | 要確認 | 表示崩れ・白画面時間を実機で確認 |
| Supported orientations | iPhone portrait/landscape, iPad all | 要確認 | 縦向き中心アプリなら iPhone landscape を外すか検討 |
| AdMob App ID | xcconfig切替 | OK | Debug/Release分離済み |

## 4. まだ足りないもの

- Apple Developer Program の App ID / Bundle ID 登録。
- Xcode signing team / provisioning profile 設定。
- Xcode Archive 成功確認。
- Release ビルドでの実機起動確認。
- TestFlight アップロード確認。
- App Store Connect のアプリ情報作成。
- App Store 用スクリーンショット。
- App Store 用説明文、サブタイトル、キーワード。
- プライバシーポリシー URL。
- サポート URL。
- 非公式アプリであることの免責文言。
- アプリ内・ストア説明で公式誤認を避ける表現。
- App Privacy / Data Safety 相当の整理。
- ATT を出すかどうかの判断。
- AdMob 本番広告の有効化タイミング判断。

## 5. TestFlight 前チェックリスト

- [ ] Apple Developer Program にログインできる。
- [ ] Bundle ID を Apple Developer で登録する。
- [ ] Bundle ID が公式アプリと誤認されにくい名前になっているか確認する。
- [ ] Xcode の Signing & Capabilities で Team を設定する。
- [ ] iOS deployment target 15.0 で問題ないか確認する。
- [ ] `MARKETING_VERSION` と `CURRENT_PROJECT_VERSION` を提出前の値にする。
- [ ] App Icon に不足サイズが無いか Xcode で確認する。
- [ ] Launch Screen が実機で自然に見えるか確認する。
- [ ] Release ビルドで起動する。
- [ ] Release ビルドでホーム、探す、食べた、エリア、店舗、フード詳細が動く。
- [ ] Release ビルドで管理画面を通常導線に含めていないことを確認する。
- [ ] service role key などの秘密値がアプリバンドルに入っていないことを確認する。
- [ ] TestFlight 用 Archive を作成できる。
- [ ] App Store Connect へアップロードできる。
- [ ] TestFlight でインストールできる。
- [ ] TestFlight で画像表示、下部ナビ、食べた記録が動く。
- [ ] TestFlight で AdMob の表示状態を確認する。

## 6. App Store 審査前チェックリスト

- [ ] アプリ名「ユニコレ」が公式 USJ アプリと誤認されないか確認する。
- [ ] App Store 説明文に「非公式」「個人/第三者によるフード記録アプリ」であることを明記する。
- [ ] USJ、ユニバーサル・スタジオ・ジャパン、キャラクター名などの商標表現を過度に使っていないか確認する。
- [ ] スクリーンショットに公式ロゴ・公式アプリ風の表示が強く出ていないか確認する。
- [ ] 商品名・画像の利用根拠を整理する。
- [ ] 広告収益化する場合の商品画像・公式由来情報の扱いを再確認する。
- [ ] プライバシーポリシー URL を用意する。
- [ ] サポート URL を用意する。
- [ ] App Privacy で収集データを正しく申告する。
- [ ] localStorage の食べた記録、検索履歴、最近見た商品などの扱いを説明する。
- [ ] Supabase Auth / 管理者ログインを一般ユーザー向け機能として誤記しない。
- [ ] 管理画面は一般アプリ機能ではないことを運用で切り分ける。
- [ ] 広告が下部ナビや主要操作に重ならないことを実機で確認する。
- [ ] 本番広告を自分でクリックしない運用を徹底する。

## 7. AdMob 本番化前チェックリスト

- [ ] Debug / Simulator は必ずテスト広告のままにする。
- [ ] Release だけ本番 AdMob App ID を使う。
- [ ] Release だけ本番広告ユニット ID を使う。
- [ ] 本番広告ユニット ID が Debug で使われていないことを確認する。
- [ ] App Store 提出前に AdMob 側で iOS アプリ登録が完了している。
- [ ] App Store URL が確定後、AdMob アプリ情報と紐付ける。
- [ ] ATT が必要か判断する。
- [ ] パーソナライズ広告を使う場合は ATT / 同意導線 / プライバシー説明を追加検討する。
- [ ] 当面は `npa: true` の非パーソナライズ方針で進めるか確認する。
- [ ] テスト中に本番広告を自分で表示・クリックしない。
- [ ] 家族テスト時にも広告クリック禁止を共有する。
- [ ] 管理画面に広告が出ないことを確認する。

## 8. 非公式アプリとしての注意点

UNICOLE は公式 USJ アプリではない。App Store のアプリ名、説明文、スクリーンショット、サポート文言では、公式アプリ・公式ガイド・公式販売情報と誤認されないようにする必要がある。

推奨する表現:

- 「USJ フードを記録して楽しむ非公式アプリ」
- 「公式アプリではありません」
- 「商品情報・価格・販売状況は変更される場合があります」
- 「最新情報は公式サイト・現地表示をご確認ください」

避ける表現:

- 「USJ公式」
- 「公式フードガイド」
- 「公式価格保証」
- 「全商品完全対応」

商品画像や商品名を広告収益化アプリ内で扱うため、画像の出典、利用範囲、差し替え運用は慎重に管理する。確証のない画像や誤画像は表示しない方針を維持する。

## 9. 管理画面の扱い

- `/admin` はアプリ内の一般導線には入れない方針が安全。
- 管理画面は Web 限定運用が望ましい。
- service role key はサーバー側だけで使い、iOS アプリバンドルへ入れない。
- 管理者 UI は一般ユーザーに表示しない。
- App Store 審査時に管理者専用機能の説明を求められる可能性があるため、必要ならレビューノートに「管理機能は運営者用で、一般ユーザー導線には出ない」と記載する。

## 10. アプリ内主要導線チェック

- [ ] ホーム: 最近追加・更新したフード、主要セクション、下部ナビが自然に見える。
- [ ] 探す: 検索・カテゴリ・商品カードがスマホで使いやすい。
- [ ] フード詳細: 画像、商品名、価格、エリア、店舗、食べたボタンが分かりやすい。
- [ ] 食べた: 食べた記録、集計、アルバム表示が壊れていない。
- [ ] エリア: エリア別に探しやすい。
- [ ] 店舗: 店舗別に探しやすい。
- [ ] 広告: 下部ナビや食べたボタンに被らない。
- [ ] オフライン/通信不安定時: 致命的な白画面にならないか確認する。

## 11. 次に Codex へ投げるべき実装 goal

```text
/goal UNICOLE Phase Store-1: iOS TestFlight提出前のXcode設定確認とArchive準備を行ってください。

目的:
iOSアプリをTestFlightへ上げる前に、Xcode側のBundle ID、Signing、Version/Build、App Icon、Launch Screen、Release構成、AdMob Release設定を確認し、Archiveできる状態に近づける。

やること:
1. ios/App/App.xcodeproj のBundle Identifier、Display Name、Version、Build、Deployment Targetを確認
2. App IconとLaunch Screenの不足・警告を確認
3. Debugはテスト広告、Releaseは本番AdMob設定に切り替わることを確認
4. service role keyなど秘密値がiOSバンドルに入っていないことを確認
5. Xcode Archive前の手順を整理
6. 必要最小限の設定修正があれば実装

やらないこと:
- App Store提出
- TestFlight提出
- Android作業
- Supabase/Vercel/generated/crawler/translations/proxy変更
- 本番広告クリック

検証:
- npm run lint
- npm run typecheck
- npm run build
- iOS Release build/Archive可否確認

commit message:
prepare ios testflight archive settings
```

## 12. 後回しでよい項目

- Android Emulator / Android Studio 環境整備。
- Android AdMob 実装。
- Web AdSense 本番化。
- App Store 用の多言語メタデータ。
- ロールバック UI や監査ログ強化。
- App Store 審査後の本番広告最適化。
