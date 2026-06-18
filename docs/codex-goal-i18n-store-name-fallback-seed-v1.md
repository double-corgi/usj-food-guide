# Goal: i18n fallback 店舗 seed 追加（B4）

## あなたの役割

あなたは実装担当です。設計に従って `data/translations/store-names.json` のみを編集してください。

**禁止:**
- `lib/store-utils.ts` 変更禁止
- `scripts/output/shops.generated.json` 変更禁止
- `scripts/check-translation-coverage.ts` 変更禁止
- `data/translations/food-names.json` 変更禁止
- コンポーネント・ページファイル変更禁止
- 商品名翻訳禁止
- 店舗名の独自意訳禁止（設計書の値を使用すること）

---

## 背景

B3「store-name-client.tsx による i18n 表示反映」実装済み。`getStoreNameTranslationId` は `[store.id, ...store.aliases]` を走査して `store-names.json` のキーに最初に一致した ID で翻訳を引く。

現状: `/stores` 63件中 35件翻訳 / 28件 fallback（日本語表示）。  
目的: 主要な fallback 店舗に seed エントリを追加し、翻訳カバレッジを向上させる。

---

## Step 1: 実際の fallback 店舗 ID を確認する

以下のスクリプトを実行して fallback 店舗の ID と aliases を確認すること（設計書と差分がないか検証するため）:

```bash
npx ts-node --project tsconfig-scripts.json -r tsconfig-paths/register scripts/list-stores-with-translation.ts 2>/dev/null | grep -A0 "FALLBACK"
```

出力で以下の店舗が FALLBACK セクションに存在することを確認する:

| 確認対象 | 期待する id または alias |
|---|---|
| ホッグズ・ヘッド・パブ | aliases に `shop-ホッグズ-ヘッド-パブ` |
| フィネガンズ・バー＆グリル | aliases に `shop-フィネガンズ・バー＆グリル` |
| アズーラ・ディ・カプリ | aliases に `shop-アズーラ・ディ・カプリ` |
| 三本の箒™ | aliases に `shop-三本の箒tm` |
| スヌーピー・バックロット・カフェ | aliases に `shop-スヌーピー・バックロット・カフェ` |
| ピンクカフェ | aliases に `shop-ピンクカフェ` |
| ハローキティのコーナーカフェ | aliases に `shop-137zayl` |
| ホッグズ・ヘッド（パブなし） | id = `shop-1tt48e8-restaurant-122iqw` |
| ロストワールド・レストラン | id = `shop-restaurant-7uhqb` |
| コーナーカフェ | id = `shop-gxslj9` |
| ハローキティのコーナーカフェ(UW) | id = `shop-1ea4r5z` |
| ハローキティのカップケーキ・ドリーム横FD(UW) | id = `shop-1bid242` |
| ミニオン・ハッピー・キッチン(ミニオンパーク手前) | id = `shop-jbc9aa` |
| ジャングル・ビート・シェイク | id = `shop-znyimu` |

もし上記の ID または alias が異なっていた場合は **実装を止めて報告すること**。設計書の ID を使わず、スクリプト出力の実際の値を報告する。

---

## Step 2: store-names.json にエントリを追加する

`data/translations/store-names.json` の末尾（最後の `}` の直前）に以下のエントリを追加する。

**既存エントリを変更しないこと。**

### 追加エントリ（14件）

#### Group A: aliases 経由で解決する店舗（alias をキーとして使用）

```json
  "shop-ホッグズ-ヘッド-パブ": {
    "en": "Hog's Head Pub",
    "ko": "호그즈 헤드 펍",
    "zh-TW": "豬頭酒吧",
    "_source": "official",
    "_status": "verified"
  },
  "shop-フィネガンズ・バー＆グリル": {
    "en": "Finnegan's Bar & Grill",
    "ko": "피네간즈 바 & 그릴",
    "zh-TW": "費尼根酒吧燒烤",
    "_source": "official",
    "_status": "verified"
  },
  "shop-アズーラ・ディ・カプリ": {
    "en": "Azzurra di Capri",
    "ko": "아즈라 디 카프리",
    "zh-TW": "阿祖拉迪卡普里",
    "_source": "official",
    "_status": "verified"
  },
  "shop-三本の箒tm": {
    "en": "Three Broomsticks",
    "ko": "세 개의 빗자루",
    "zh-TW": "三根掃帚",
    "_source": "official",
    "_status": "verified"
  },
  "shop-スヌーピー・バックロット・カフェ": {
    "en": "Snoopy's Backlot Café",
    "ko": "스누피 백로트 카페",
    "zh-TW": "史努比製片廠後場咖啡廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-ピンクカフェ": {
    "en": "Pink Café",
    "ko": "핑크 카페",
    "zh-TW": "粉紅咖啡廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-137zayl": {
    "en": "Hello Kitty's Corner Café",
    "ko": "헬로키티 코너 카페",
    "zh-TW": "凱蒂貓轉角咖啡廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
```

#### Group B: aliases なし・display ID をキーとして使用する店舗

```json
  "shop-1tt48e8-restaurant-122iqw": {
    "en": "Hog's Head",
    "ko": "호그즈 헤드",
    "zh-TW": "豬頭酒吧",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-restaurant-7uhqb": {
    "en": "Lost World Restaurant",
    "ko": "로스트 월드 레스토랑",
    "zh-TW": "失落世界餐廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-gxslj9": {
    "en": "Corner Café",
    "ko": "코너 카페",
    "zh-TW": "街角咖啡廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1ea4r5z": {
    "en": "Hello Kitty's Corner Café",
    "ko": "헬로키티 코너 카페",
    "zh-TW": "凱蒂貓轉角咖啡廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1bid242": {
    "en": "Hello Kitty's Cupcake Dream Food Cart",
    "ko": "헬로키티 컵케이크 드림 푸드 카트",
    "zh-TW": "凱蒂貓杯子蛋糕夢境旁小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-jbc9aa": {
    "en": "Minion Happy Kitchen",
    "ko": "미니언 해피 키친",
    "zh-TW": "小小兵快樂廚房",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-znyimu": {
    "en": "Jungle Beat Shakes",
    "ko": "정글 비트 쉐이크",
    "zh-TW": "叢林節奏奶昔",
    "_source": "provisional",
    "_status": "needs_review"
  }
```

---

## Step 3: JSON 構文を検証する

```bash
node -e "require('./data/translations/store-names.json'); console.log('JSON valid')"
```

エラーが出た場合は JSON を修正すること（カンマ・括弧の欠如が多い）。

---

## Step 4: lint / typecheck / build を実行する

```bash
npm run lint && npm run typecheck && npm run build
```

全て成功することを確認すること。

---

## Step 5: 翻訳カバレッジを確認する

```bash
npx ts-node --project tsconfig-scripts.json -r tsconfig-paths/register scripts/list-stores-with-translation.ts 2>/dev/null | tail -5
```

Translated 数が 38 より増加していること（概ね 45〜52 程度）を確認する。

---

## Step 6: coverage script を実行する（orphan 増加は期待値）

```bash
npx ts-node -r tsconfig-paths/register scripts/check-translation-coverage.ts 2>/dev/null
```

**orphan が増加（0 → 約 14）することは期待値であり、タスク失敗ではない。**

理由: coverage script は `shops.generated.json` の 42件のみを参照しており、`buildStoresFromFoods` が動的生成する display ID や legacy alias を認識しない。新規エントリは実際の /stores 表示で参照されるが、coverage script 上は orphan と判定される。この乖離は B5 以降のタスクで coverage script を拡張することで解消する（本タスクのスコープ外）。

---

## Step 7: git add のみ実行する（commit はしない）

```bash
git add data/translations/store-names.json
```

commit はしないこと。

---

## 完了報告に含めること

1. `data/translations/store-names.json` の変更行数（before / after のエントリ数）
2. `scripts/list-stores-with-translation.ts` の実行結果（Total / Translated / Fallback の数値）
3. `scripts/check-translation-coverage.ts` の実行結果（orphan 数の増加を含む）
4. lint / typecheck / build の結果
5. Step 1 の ID 確認結果（設計書と一致 or 差分があった場合はその内容）
