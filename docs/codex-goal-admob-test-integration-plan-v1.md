# Codex /goal 案: AdMob テスト広告 導入（Phase 3・テストのみ）

> **⚠️ 実行前提（必読）**
> 本 goal は `docs/ad-monetization-appstore-plan-v1.md` の **Phase 3**。
> **Phase 1（Apple Developer / AdMob 登録・AdMob アプリ＆ユニット作成）と Phase 2（Capacitor/iOS ビルド確認）が完了し、進行側が承認するまで実行しない。**
> 本番広告IDは使わない。テスト広告のみ。webview に AdSense を入れない。

以下、Codex にそのまま貼れる本文（承認後に使用）。

```
/goal iOSアプリ（Capacitor）に AdMob の「テスト広告」バナーを、誤タップしない予約領域で安全に表示する最小実装を行う。本番広告IDは使わない。Web/PWA には何も入れない。

## 背景 / 制約
- Capacitor 雛形あり（appId com.usjfoodguide.app / appName ユニコレ / ios/ 一式 / @capacitor/* ^8.3.4、webDir out）。
- 広告はアプリ=AdMob のみ。webview に AdSense スクリプトは入れない。
- 初期は「非パーソナライズ広告(NPA)＋IDFA不使用」＝ATT 不要の設計。

## やること（テストのみ・最小）
1. `@capacitor-community/admob` を依存追加（package.json 変更可）。`npm install` 後 `cap sync ios`。
2. AdMob 初期化を1か所に集約（アプリ起動時）。設定値は **環境変数/ビルドフラグ**から読む形にし、既定は **Google 公式テスト広告ユニットID** とする（本番IDはコード/リポジトリに置かない）。
3. **アンカー型アダプティブバナー**を画面下の**専用予約コンテナ**に表示。
   - 下部ナビと密着させない（最低 0.5–0.75rem の隙間）。`safe-area-inset-bottom` を考慮。
   - webview 側はバナー高さ分の padding を予約し、本文・フッター・ナビが隠れない/重ならないようにする。
   - 空配信（テスト未取得時）でも枠が崩れない固定高。
4. **非パーソナライズ要求（NPA）**・**IDFA を要求しない**設定。ATT プロンプトは出さない。`NSUserTrackingUsageDescription` は追加しない（初期は ATT 不要方針）。
5. Web/PWA ビルド（非 Capacitor）では AdMob を一切ロードしない（プラットフォーム分岐）。
6. iOS の Info.plist に必要な **テスト用 GADApplicationIdentifier**（Google 公式テストアプリID）を設定。本番AdMobアプリIDは入れない。

## やってはいけないこと（厳守）
- 本番広告ユニットID / 本番 AdMob アプリID をコードやリポジトリに入れない（テストIDのみ）。
- 製品/提出ビルド用の本番ID切替は本 goal でやらない（Phase 5 で別途）。
- webview に AdSense / 外部広告 script / iframe を入れない。
- インタースティシャル・リワード・全画面広告を入れない（バナーのみ）。
- 下部ナビに密着、誤タップを誘発する配置にしない。
- ATT/IDFA を使う実装にしない（初期は NPA・IDFA不使用）。
- generated JSON / data/translations / DB / crawler を変更/実行しない。
- 商品データ（food.id/name/price/area/shop/画像URL）・URL構造を変更しない。
- 既存の下部ナビ構造・既存UIを大きく作り替えない（広告予約領域の追加に限定）。
- git add . 禁止。変更ファイルを限定する。

## 検証（実施し報告）
- npm run lint / typecheck / build / coverage 成功、Coverage 不変（Food total 294 ほか）。
- build:capacitor → cap sync ios → Xcode/シミュレータで起動し、
  - テスト広告バナーが下部予約領域に表示される（"Test Ad" ラベル）。
  - 下部ナビと重ならない・密着しない・ナビが押せる・誤タップしない。
  - safe-area との距離が確保され、空配信時も崩れない。
  - 本文・フッターがバナー/ナビに隠れない。
- Web/PWA（通常 `npm run build`）では AdMob 関連コードがロードされない（プラットフォーム分岐の確認）。
- git status --short が想定変更ファイルのみ。

## 完了条件
- テスト広告バナーが iOS で安全に表示（誤タップ回避・ナビ非密着・空配信耐性）。
- 本番ID不在・NPA/IDFA不使用・ATFなし・Web 非影響。
- lint/typecheck/build/coverage 成功・Coverage 不変。
- 変更ファイルを限定報告し、レビュー（Claude）へ。

## Stop条件（該当したら停止して報告）
- 本番広告IDが必要になる、または要求されたとき。
- ATT/IDFA が必要だと判明したとき（方針転換の判断が要る）。
- 下部ナビ/既存UIの大規模改変が必要なとき。
- generated JSON / translations / DB / crawler に触れる必要が出たとき。
- iOS ネイティブ依存（CocoaPods 等）でビルドが通らないとき。
```

---

## 進行側メモ（この goal を渡す前に）
1. **Phase 1–2 完了**が前提（Apple Developer / AdMob 登録・AdMob アプリ＆ユニット作成・Capacitor iOS ビルド確認）。
2. 本番IDは扱わない（Phase 5 で別 goal）。
3. **知財リスク**（`ad-monetization-appstore-plan-v1.md` 11章）を収益化前に確認すること。
4. Web の AdSense は独自ドメイン取得後に別 goal（CSP 更新・プライバシー記述・CMP を含む）。
5. 実装後、Claude が `design-review-admob-test-integration-v1.md` でレビュー証跡を作成する（本タスクではまだ作らない）。
