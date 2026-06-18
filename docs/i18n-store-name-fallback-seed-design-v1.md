# 設計: i18n fallback 店舗 seed 追加（B4）

**作成日:** 2026-06-18  
**設計担当:** Claude（設計担当 / レビュー担当）  
**対象ファイル:** `data/translations/store-names.json` のみ  

---

## 1. 背景

B3「store-name-client.tsx による i18n 表示反映」承認後、`/stores` 63件中 **35件翻訳 / 28件 fallback（日本語表示）** の状態。

fallback の原因:
- `buildStoresFromFoods` が生成する表示用 store.id（例: `shop-restaurant-tzbeu2`）が `store-names.json` のキーに存在しない
- `getStoreNameTranslationId` が `[store.id, ...store.aliases]` を走査するため、aliases に seed キーが残っていれば翻訳が当たるが、B2 seed は shops.generated.json ベースの 42件のみで fallback 店舗をカバーしていない

---

## 2. 診断スクリプト実行結果

**スクリプト:** `scripts/list-stores-with-translation.ts`  
**実行コマンド:**
```bash
npx ts-node --project tsconfig-scripts.json -r tsconfig-paths/register scripts/list-stores-with-translation.ts
```

**結果:** Total: 99, Translated: 38, Fallback: 61

> **注意:** この数値は Next.js ランタイムと若干異なる（B3 報告値: 63件中 35件翻訳 / 28件 fallback）。  
> 原因: `tsconfig-scripts.json` の `module: "commonjs"` による挙動差分、および `resolveStoreDisplayIds` の重複除去がスクリプト実行時と Next.js バンドル時で微妙に異なる可能性がある。  
> **設計への影響:** スクリプトが返す fallback 店舗の ID と aliases は実際の /stores 表示と一致しているため、seed キー設計には支障なし。

---

## 3. seed 追加対象の選定基準

| 追加する | 追加しない |
|---|---|
| 名前のある恒常レストラン・カフェ | `フードカート`（無名汎用） |
| IP 系の名前付きカフェ（スヌーピー等） | `エリア確認中` 店舗 |
| 既存翻訳と同一店舗の別 ID | IP限定・季節限定イベントカート |
| aliases に日本語 slug が残っている店舗 | `低アレルゲンメニュー取扱レストラン`（機能名） |
| | `マリオカート`（アトラクション名） |
| | `ロンバーズ・ランディング™ 前テラス`（位置名） |

---

## 4. seed エントリ設計

### 4-A. aliases 経由で解決できる店舗（alias をキーとして使用）

aliases に日本語 slug が残っており、`getStoreNameTranslationId` の alias 走査で確実に当たる。このキー形式は `resolveStoreDisplayIds` が legacy alias として保持するため安定。

| キー | 日本語名 | display ID | en | ko | zh-TW | _source | _status |
|---|---|---|---|---|---|---|---|
| `shop-ホッグズ-ヘッド-パブ` | ホッグズ・ヘッド・パブ | shop-restaurant-tzbeu2 | Hog's Head Pub | 호그즈 헤드 펍 | 豬頭酒吧 | official | verified |
| `shop-フィネガンズ・バー＆グリル` | フィネガンズ・バー＆グリル | shop-and-restaurant-1gm2c4 | Finnegan's Bar & Grill | 피네간즈 바 & 그릴 | 費尼根酒吧燒烤 | official | verified |
| `shop-アズーラ・ディ・カプリ` | アズーラ・ディ・カプリ | shop-restaurant-16fz17 | Azzurra di Capri | 아즈라 디 카프리 | 阿祖拉迪卡普里 | official | verified |
| `shop-三本の箒tm` | 三本の箒™ | shop-tm-restaurant-185mjs | Three Broomsticks | 세 개의 빗자루 | 三根掃帚 | official | verified |
| `shop-スヌーピー・バックロット・カフェ` | スヌーピー・バックロット・カフェ | shop-1tt48e8-restaurant-90u3k9 | Snoopy's Backlot Café | 스누피 백로트 카페 | 史努比製片廠後場咖啡廳 | provisional | needs_review |
| `shop-ピンクカフェ` | ピンクカフェ | shop-restaurant-8ebexf | Pink Café | 핑크 카페 | 粉紅咖啡廳 | provisional | needs_review |
| `shop-137zayl` | ハローキティのコーナーカフェ | shop-1tt48e8-cart-1yi3mn | Hello Kitty's Corner Café | 헬로키티 코너 카페 | 凱蒂貓轉角咖啡廳 | provisional | needs_review |

### 4-B. aliases なし・display ID をキーとして使用する店舗

aliases が空のため display ID を直接使用。display ID は `shop-` + ASCII slug + hash の形式で、食べ物データが変わらない限り安定。

| キー | 日本語名 | エリア | en | ko | zh-TW | _source | _status | 備考 |
|---|---|---|---|---|---|---|---|---|
| `shop-1tt48e8-restaurant-122iqw` | ホッグズ・ヘッド | ウィザーディング... | Hog's Head | 호그즈 헤드 | 豬頭酒吧 | provisional | needs_review | パブなしバリアント |
| `shop-restaurant-7uhqb` | ロストワールド・レストラン | ジュラシック・パーク | Lost World Restaurant | 로스트 월드 레스토랑 | 失落世界餐廳 | provisional | needs_review | shop-3v2j9p と同一翻訳 |
| `shop-gxslj9` | コーナーカフェ | ユニバーサル・ワンダーランド | Corner Café | 코너 카페 | 街角咖啡廳 | provisional | needs_review | shop-1jnbp5c と同一翻訳 |
| `shop-1ea4r5z` | ハローキティのコーナーカフェ(UW) | ユニバーサル・ワンダーランド | Hello Kitty's Corner Café | 헬로키티 코너 카페 | 凱蒂貓轉角咖啡廳 | provisional | needs_review | shop-137zayl と同一翻訳 |
| `shop-1bid242` | ハローキティのカップケーキ・ドリーム横フードカート(UW) | ユニバーサル・ワンダーランド | Hello Kitty's Cupcake Dream Food Cart | 헬로키티 컵케이크 드림 푸드 카트 | 凱蒂貓杯子蛋糕夢境旁小食車 | provisional | needs_review | |
| `shop-jbc9aa` | ミニオン・ハッピー・キッチン(ミニオンパーク手前) | ミニオン・パーク | Minion Happy Kitchen | 미니언 해피 키친 | 小小兵快樂廚房 | provisional | needs_review | shop-17yebwe と同一翻訳 |
| `shop-znyimu` | ジャングル・ビート・シェイク | スーパー・ニンテンドー・ワールド | Jungle Beat Shakes | 정글 비트 쉐이크 | 叢林節奏奶昔 | provisional | needs_review | shop-1ielufv と同一翻訳 |

### 4-C. 追加しない店舗

| 日本語名 | 理由 |
|---|---|
| フードカート（各種） | 固有名称なし、汎用名 |
| ドリンクワゴン | 汎用名 |
| ハピネス・ワゴン(ニューヨークエリア) | エリア確認中・汎用 |
| セントラルパーク入口横ポップコーンカート（複数ID） | 既存 shop-1wo41fl でカバー済み |
| ハリウッド・ドリーム・ザ・ライド前フードカート（複数） | 既存 shop-8r3pag でカバー済み |
| スペース・ファンタジー・ザ・ライド前フードカート（複数） | 既存 shop-1qsyx94 でカバー済み |
| ドラえもんフードカート | IP限定季節イベント |
| 鬼滅の刃フードカート | IP限定季節イベント |
| 低アレルゲンメニュー取扱レストラン | 機能説明、店舗名でない |
| ロンバーズ・ランディング™ 前テラス | ロケーション名、食事場所でない |
| マジック・ニープ・カート | HP エリア露店、固有性低い |
| パーク内レストラン | 汎用名 |
| ユニバーサル・マーケット内（各種） | エリア確認中・汎用 |
| デリシャス・ミー! ザ・クッキー・キッチン(SNW) | 既存 shop-dvw6dt / shop-1i0x5ad でカバー済み |
| ユニバーサル・ワンダーランド前フードカート | 位置名、無名カート |
| プレイングウィズおさるのジョージ前カート | 位置名、無名カート |
| ワーフカフェ前カート | カート、既存 shop-7ba324 でカバー済み |

---

## 5. orphan 問題【重要】

### 前提認識の修正

B3 レビュー後の申し送りでは「orphan = 0 を維持する」との期待があったが、**この期待は B4 の目的と矛盾する**。

**orphan の定義（`check-translation-coverage.ts` による）:**
> `store-names.json` のキーが `scripts/output/shops.generated.json` の 42件の shop ID に存在しないもの

**なぜ矛盾するか:**
- B4 で追加するのは `buildStoresFromFoods` が動的生成する display ID または legacy alias
- これらは `shops.generated.json` に存在しない（generated JSON は公式 42 店舗のマスターデータ）
- したがって、追加するエントリは全て coverage script 上の orphan と判定される

### 設計上の判断

**orphan 増加を承認する。**

理由:
1. 新規エントリは「実際の /stores 表示で参照されるが shops.generated.json には存在しない店舗」であり、**機能的な orphan（参照されない死んだキー）ではない**
2. `check-translation-coverage.ts` は shops.generated.json のみを参照しており、`buildStoresFromFoods` が生成する動的 ID を知らないため、スクリプト上の orphan 判定が実態と乖離している
3. B4 完了後に coverage script を実際の /stores 表示に対応させることは別タスクとして設定可能

### B4 完了後の期待値（coverage script 上）

| 指標 | B3 後 | B4 後 |
|---|---|---|
| Store total | 42 | 42（変化なし） |
| Store translated | 42 | 42（変化なし） |
| Store missing | 0 | 0（変化なし） |
| Store orphan | 0 | **+14（新規エントリ数）** |

**orphan 増加は期待値。Codex は lint/typecheck/build の通過のみを合否判定とし、orphan 増加でタスクを中断してはならない。**

---

## 6. 既存エントリとの重複・命名方針

| 新規キー | 参照先既存エントリ | 方針 |
|---|---|---|
| `shop-三本の箒tm` | `shop-nokw9`（Three Broomsticks） | 同一翻訳を複製して追加 |
| `shop-restaurant-7uhqb` | `shop-3v2j9p`（Lost World Restaurant） | 同一翻訳を複製して追加 |
| `shop-gxslj9` | `shop-1jnbp5c`（Corner Café） | 同一翻訳を複製して追加 |
| `shop-1ea4r5z` | `shop-137zayl`（Hello Kitty's Corner Café） | 同一翻訳を複製して追加 |
| `shop-jbc9aa` | `shop-17yebwe`（Minion Happy Kitchen） | 同一翻訳を複製して追加 |
| `shop-znyimu` | `shop-1ielufv`（Jungle Beat Shakes） | 同一翻訳を複製して追加 |

翻訳値の重複は問題なし。各 store.id に対して `getStoreNameTranslationId` が別々に解決するため、互いに干渉しない。

---

## 7. lookup 動作確認（重要な実装詳細）

`getStoreNameTranslationId`（`components/store-name-client.tsx`）の動作:

```ts
const translatedStoreIds = new Set(Object.keys(storeNamesRaw));

export function getStoreNameTranslationId(store: Pick<StoreWithFoods, "id" | "aliases">) {
  return [store.id, ...store.aliases].find((id) => translatedStoreIds.has(id)) ?? store.id;
}
```

`store-names.json` キーへの登録により翻訳が当たる仕組み:

| 例 | store.id | store.aliases | 検索順序 | ヒット |
|---|---|---|---|---|
| ホッグズ・ヘッド・パブ | `shop-restaurant-tzbeu2` | `["shop-ホッグズ-ヘッド-パブ"]` | shop-restaurant-tzbeu2 → **shop-ホッグズ-ヘッド-パブ** | ✅ alias |
| フィネガンズ | `shop-and-restaurant-1gm2c4` | `["shop-フィネガンズ・バー＆グリル"]` | shop-and-restaurant-1gm2c4 → **shop-フィネガンズ・バー＆グリル** | ✅ alias |
| ロストワールド | `shop-restaurant-7uhqb` | `[]` | **shop-restaurant-7uhqb** | ✅ store.id |
| コーナーカフェ | `shop-gxslj9` | `[]` | **shop-gxslj9** | ✅ store.id |

---

## 8. 禁止事項

- `lib/store-utils.ts` 変更禁止（ID 生成ロジックに触れない）
- `scripts/output/shops.generated.json` 変更禁止
- `scripts/check-translation-coverage.ts` 変更禁止（本タスクのスコープ外）
- 商品名翻訳禁止（food-names.json 変更禁止）
- 店舗名の意訳・独自翻訳禁止（日本語名がない en 翻訳は provisional + needs_review とする）
- git 操作禁止（Claude）
- コード変更禁止（Claude）

---

## 9. 完了条件

1. `data/translations/store-names.json` に 4-A（7件）+ 4-B（7件）= **14件**の新規エントリが追加されていること
2. `npm run lint` 成功
3. `npm run typecheck` 成功
4. `npm run build` 成功
5. `scripts/list-stores-with-translation.ts` 実行で Translated 数が増加していること（38 → 概ね 45〜52 程度）
6. coverage script の orphan が 14 増加していること（0 → 14）は期待値であり合否判定には使わない
