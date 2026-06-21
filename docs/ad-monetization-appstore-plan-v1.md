# UNICOLE 広告あり前提のApp Store化・Web/PWA収益化 設計 v1

**作成日:** 2026-06-21
**担当:** Claude（設計・レビュー担当 / 実装はしない）
**前提:** Next.js/PWA を Vercel 公開（現在 noindex）。iOS は Capacitor 雛形あり（`appId: com.usjfoodguide.app` / `appName: ユニコレ` / `ios/` 一式 / `@capacitor/* ^8.3.4`）。広告プレースホルダーは現在非表示。本番広告ID・AdMob/AdSense/Apple Developer 未登録。

> 本書は設計のみ。コード変更・git操作・実装・登録作業は行っていない。調査は実コード読み取りのみ。

---

## 1. 広告あり前提の全体方針

| 面 | 広告手段 | 理由 |
|---|---|---|
| **iOSアプリ（主軸）** | **AdMob（Google Mobile Ads SDK）** | アプリ内webviewに AdSense を出すのは AdSense ポリシー違反。アプリはネイティブ広告=AdMob 一択 |
| **Web/PWA（継続）** | **AdSense**（独自ドメイン取得後） | Web ブラウザ向け。AdMob は web 不可 |

中核原則:
- **AdMob と AdSense は併用するが「面」で分離**。同一 webview に両方を出さない。Capacitor の webview（=アプリ）では AdMob のネイティブバナーを使い、AdSense スクリプトは読み込まない。
- **誤タップ最優先回避**: 広告は下部ナビ・主要操作から距離を取り、専用の予約領域に置く（ナビ密着禁止）。
- **まず非パーソナライズ広告（NPA）＋IDFA不使用**で開始 → ATT プロンプト不要・プライバシー申告を最小化 → 審査をシンプルに。パーソナライズ/ATT は安定後に検討。
- **テスト広告で開発 → 本番広告は審査・公開直前/直後に正式IDで**。テスト広告を App Store 製品ビルドに出すのは AdMob ポリシー違反なので避ける（後述の注意）。
- **安っぽく見せない**: 1画面1枠・小型アダプティブバナー・余白と区切り・「広告」表記・落ち着いた枠。インタースティシャル/リワードは当面入れない。

### AdMob と AdSense の使い分け（明確化）
- AdMob = モバイルアプリ（iOS/Android ネイティブ）。Google Mobile Ads SDK。Capacitor では `@capacitor-community/admob` プラグイン経由でネイティブバナーを webview の外に重ねる。
- AdSense = Web サイト（ブラウザ）。`<script>` で配信。**アプリ webview 内では使わない**。
- 収益・審査・プライバシーの管理単位が別。AdMob app と AdSense site は別登録。

---

## 2. iOSアプリ版 AdMob 導入手順（設計）

> Capacitor は既に雛形あり＝**Capacitor で進めてよい**（react-native等への作り直し不要）。

1. **前提登録（コード前・手作業）**: Apple Developer Program（年 $99）、AdMob アカウント、AdMob 上で「アプリ」と「広告ユニット（バナー）」を作成。
2. **SDK 導入**: `@capacitor-community/admob`（Google Mobile Ads SDK を内包）を依存追加 → `cap sync ios`。iOS の `Info.plist` に **`GADApplicationIdentifier`**（AdMob アプリID）と、（必要なら）`SKAdNetworkItems`、ATT 文言 `NSUserTrackingUsageDescription` を設定。
3. **初期化と表示**: アプリ起動時に SDK 初期化 → **アンカー型アダプティブバナー**を画面下の**予約領域**に表示（ネイティブが webview 上に重ねる）。webview 側はバナー高さ分の `padding/safe-area` を予約してコンテンツが隠れないようにする。
4. **テスト広告**: 開発中は Google 提供の**テスト広告ユニットID**＋**テストデバイス登録**を使用（自分の本番ユニットに自己クリックを当てない）。
5. **非パーソナライズ**: リクエストに `npa=1` 相当（同意なし時 NPA）。IDFA を要求しない設定。
6. **本番ID切替**: 後述 Phase 5 の方針（テスト広告を製品ビルドに出さない）。

注意（審査リスクを隠さない）:
- **テスト広告を App Store 製品ビルドに出すのは AdMob ポリシー違反**。製品ビルドは**本番ユニットID**にし、自分の端末だけテストデバイス登録でテスト広告を見る運用にする。「審査後に本番ID切替」を“製品ビルドにテスト広告を載せて提出”の意味で実施しないこと。
- AdMob は**アプリが審査中/公開直後は配信が安定しない**（空バナーになりうる）。空のときに枠が崩れない設計にする。

---

## 3. Web/PWA版 AdSense 導入手順（設計）

> **独自ドメイン取得が事実上の前提**。AdSense は `*.vercel.app` のような無料サブドメインでは承認されにくい。また現在 noindex のため、AdSense 審査前にクロール可能化が必要。

1. **前提**: 独自ドメイン取得・接続（別 launch 計画参照）→ noindex 解除 → 十分なオリジナルコンテンツ・ナビ・プライバシー/お問い合わせ/About が揃っていること（UNICOLE は既に整備済）。
2. **AdSense 申請に必要なページ（既存確認）**: プライバシーポリシー（**Cookie・第三者広告ベンダー（Google）利用の明記が必要**）、お問い合わせ、About、十分な独自コンテンツ、明確なナビ。→ privacy ページに「広告/Cookie/Google の利用」記述を追加する必要（現状の privacy に広告条項があるか要確認）。
3. **CSP 更新（重要）**: 現在 `next.config.mjs` の `script-src 'self' 'unsafe-inline' 'unsafe-eval'`・`frame-src` 未定義。AdSense 配信には Google 広告ドメインの許可が必要（例: `script-src` に `https://pagead2.googlesyndication.com`、`frame-src`/`connect-src`/`img-src` に `googlesyndication.com` `doubleclick.net` `google.com` 等）。**Web のみ**に適用し、Capacitor 静的書き出し（アプリ）には AdSense を入れない。
4. **同意（CMP）**: EU/UK 等向けに同意管理（Google 認定 CMP）が必要になりうる。日本主対象でも将来を見据え設計に含める。
5. **配置**: Web も同じ配置ルール（下記5章）。AdMob とは別実装（web 専用コンポーネント/フラグで出し分け）。

---

## 4. App Store 審査で気をつけること

- **アプリの実体価値**: 広告主体に見えないこと。コア機能（フード検索・食べた記録）が主で広告は従。
- **ATT/プライバシー整合**: 実際のデータ収集と App Privacy 申告・ATT 実装を一致させる（不一致は典型的リジェクト）。NPA+IDFA不使用なら申告は最小・ATT不要。
- **広告の品質**: 誤タップ誘発・全画面の過度な割り込み・閉じられない広告は不可。バナーは操作を妨げない位置に。
- **非公式表記/知財**: 「USJ」「ユニバ」を含む内容で**収益化**するため、説明文・スクショ・アプリ内で**非公式**を明確化（公式誤認はリジェクト/削除要因）。後述リスク参照。
- **メタデータ**: 4.3「重複/スパム」回避、正確な説明、年齢レーティング、サポートURL、プライバシーポリシーURL。
- **bundle id 注意**: 現 `com.usjfoodguide.app` は内部IDだが「usjfoodguide」を含む。ユーザー可視ではないが、知財観点で将来 `com.unicole.app` 等への変更も検討余地（変更は早いほど低コスト）。

---

## 5. 広告配置ルール（誤タップ回避・安っぽく見せない）

- **1画面1枠**を上限（当面）。インタースティシャル/リワード/自動再生動画は入れない。
- **下部固定バナーはナビと密着させない**: 既存の学びどおり「ナビを上段・広告を下段（または逆）」で**最低 0.5–0.75rem の隙間**を確保し、`safe-area-inset-bottom` を考慮。AdMob ネイティブバナーの場合は**専用予約コンテナ**を設け、その分 webview に padding を確保。
- **操作要素から距離**: ボタン・リンク・カードのタップ領域に隣接させない。広告の上下に余白。
- **見た目**: 小型アダプティブバナー・落ち着いた枠・「広告」表記・本文と明確に区切る。空配信時も枠が崩れない固定高。
- **Web/アプリで実装は分離するが配置ルールは共通**。
- **禁止**: ナビ密着、誤タップ誘発、コンテンツ偽装（広告をUIに見せかける）、クリック誘導文言。

---

## 6. プライバシー申告方針（App Store Connect / Web）

- **推奨初期構成: 非パーソナライズ広告（NPA）＋IDFA不使用**。
  - App Privacy（Nutrition Label）: AdMob SDK は最小限「診断/利用状況」程度の収集になりうる。**実装に合わせて正確に申告**（"Data Used to Track You" は NPA+IDFA不使用なら原則なし）。
  - これにより **ATT 不要**・申告は軽量。
- 将来パーソナライズ広告を入れる場合: IDFA 取得 → **ATT プロンプト必須**、App Privacy で "Identifiers/Device ID"・"Tracking" を申告、`NSUserTrackingUsageDescription` 文言を用意。
- **Web 側**: プライバシーポリシーに「第三者広告（Google AdSense）・Cookie・パーソナライズの有無・オプトアウト導線」を明記。必要地域は CMP。
- いずれも**申告を省略/虚偽にしない**（明確な禁止事項）。

---

## 7. ATT 方針

- **初期は ATT 不要の設計**（NPA＋IDFA不使用）。`NSUserTrackingUsageDescription` を入れず IDFA も要求しない。
- ATT が必要になる条件: IDFA へアクセスする／ユーザーをアプリ・サイト横断でトラッキングする場合（＝パーソナライズ広告）。
- 将来パーソナライズ広告を導入するなら: ATT プロンプトを適切なタイミングで表示し、許可時のみ IDFA 利用、拒否時は NPA にフォールバック。
- **IDFAを使わない広告**は可能（AdMob は NPA/IDFAなしで配信可）。初期はこれを採用。

---

## 8. Phase 分け

| Phase | 内容 | コード変更 |
|---|---|---|
| **1. 登録準備** | Apple Developer / AdMob 登録、AdMob アプリ＋ユニット作成、（Web は後で AdSense）。本番ID投入なし・テスト広告のみ設計 | なし（手作業） |
| **2. iOS化方針確定** | Capacitor 設定確認（appId/appName/署名）、`build:capacitor`→`cap sync ios`→Xcode ビルド確認、Info.plist 準備 | 設定中心 |
| **3. AdMobテスト広告導入** | `@capacitor-community/admob` 追加、テストID＋テストデバイスでバナー表示、予約領域・ナビ距離・空配信確認 | あり（テストのみ） |
| **4. 提出準備** | App Privacy 申告、ATT方針反映（初期は不要）、スクショ・説明文（非公式明記）、プライバシーポリシーURL | 設定/文言 |
| **5. 本番ID切替** | 製品ビルドを**本番ユニットID**に（テスト広告は出さない／自端末のみテストデバイス）。Web は独自ドメイン後に AdSense | あり（ID/フラグ） |

> 各 Phase は前 Phase 完了＋レビュー承認後に進める。本書時点では Phase 0（設計）。

---

## 9. Codex に投げる前の登録作業チェックリスト（手作業・人間タスク）

- [ ] Apple Developer Program 登録（年 $99）・チーム/署名証明書・プロビジョニング。
- [ ] App Store Connect にアプリレコード作成（bundle id 確定）。
- [ ] AdMob アカウント作成・支払い/税情報。
- [ ] AdMob 「アプリ」登録（iOS）＋**バナー広告ユニット**作成 → **AdMob アプリID / ユニットID** を控える（本番）。
- [ ] テスト用: Google 公式**テスト広告ユニットID**＋自端末を**テストデバイス**登録。
- [ ] プライバシーポリシー URL（広告/Cookie/第三者ベンダー記述を追記）。
- [ ] （Web/AdSense 用・後続）独自ドメイン取得・noindex 解除、AdSense アカウント・サイト登録、ads.txt。
- [ ] 知財方針の確認（USJ 商標・公式画像の使用可否、後述リスク）。

---

## 10. Codex 用 goal 案

`docs/codex-goal-admob-test-integration-plan-v1.md` に **Phase 3（AdMob テスト広告導入）の goal 案**を用意。ただし **Phase 1–2（登録・Capacitor 確認）完了＋進行側承認まで実行しない**。テスト広告のみ・本番ID禁止・NPA・ナビ非密着・誤タップ回避・プライバシー/ATT 整合を必須条件にしている。

---

## 11. 広告ありで公開する場合のリスク（隠さず明記）

1. **知財/商標リスク（最重要）**: 本アプリは非公式で「USJ/ユニバ」を参照し、**公式商品画像URL/手動画像**も使用している。**広告で収益化**すると「他社商標・著作物に乗じた商用利用」と見なされ、権利者からの申立て・App Store からの削除・AdMob/AdSense アカウント停止のリスクが高まる。対策: 非公式の明確化、可能な限り自前/許諾画像へ移行、商品画像の権利確認、収益化前に利用規約・引用範囲の精査（必要なら法務相談）。
2. **AdMob/AdSense ポリシー**: 無効クリック（誤タップ含む）・クリック誘導・コンテンツ規約違反でアカウント停止。誤タップ回避配置が必須。
3. **Apple 審査**: 広告SDK 同梱でプライバシー申告/ATT 整合が問われる。不一致・申告漏れはリジェクト。広告主体・低価値に見えると 4.2/4.3 リジェクト。
4. **テスト広告の製品混入**: 製品ビルドにテスト広告を出すと AdMob 違反。
5. **空配信時の UI 崩れ**: 審査中/公開直後の空バナーで枠が崩れない設計が必要。
6. **CSP/同意（Web）**: AdSense ドメイン許可・地域別同意（CMP）未対応は配信不可/法令リスク。

---

## 12. 確認事項への回答まとめ

- **AdMob/AdSense 使い分け**: アプリ=AdMob、Web=AdSense。webview に AdSense は不可。
- **AdMob 登録に必要**: Google/AdMob アカウント、アプリ＆ユニット登録、支払い情報、（公開後）App Store リンク、プライバシーポリシー。
- **iOS化構成**: Capacitor（既存）＋Apple Developer＋Xcode 署名。
- **Capacitorで進める**: YES（雛形あり）。
- **Google Mobile Ads SDK の入れ方**: `@capacitor-community/admob` プラグイン経由（Info.plist 設定込み）。
- **テスト広告ID**: 開発はテストID＋テストデバイスのみ。
- **本番ID投入時期**: 製品（提出）ビルドから本番ID。テスト広告は製品に出さない。
- **審査前に広告を入れるか**: SDK・配置は入れた状態で提出可。ただし本番ユニットID・申告整合が前提。
- **App Store プライバシー申告**: 実装に一致して申告。NPA+IDFA不使用なら最小・トラッキングなし。
- **ATT 必要条件**: IDFA/横断トラッキング時のみ。初期は不要設計。
- **IDFA を使わない広告**: 可能（NPA）。初期採用。
- **AdMob バナー安全配置/ナビ距離**: 予約領域＋ナビと隙間＋safe-area＋操作要素から離す。
- **Web は AdSense か**: YES（独自ドメイン後）。
- **AdSense 申請前に必要なページ**: プライバシー（広告/Cookie 記述）・お問い合わせ・About・十分なコンテンツ・クロール可能化（noindex 解除）。
- **広告公開リスク**: 11章参照（特に知財）。
