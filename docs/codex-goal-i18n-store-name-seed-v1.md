# Codex Goal: i18n 店舗名42件 seed（B2）

## 目的

`data/translations/store-names.json` に、全 42 店舗の翻訳 seed を追加する。

UI への表示反映はまだ行わない。`/stores` / `/stores/[id]` の表示はまだ変えない。
helper（`getShopNameI18n`）も変更しない。

**変更するのは `data/translations/store-names.json` のみ。**

---

## 作業開始前

```bash
git status
```

未コミット変更がある場合:
```bash
git add .
git commit -m "backup-before-i18n-store-name-seed"
git push
```

未コミット変更がない場合:
```bash
git commit --allow-empty -m "backup-before-i18n-store-name-seed"
git push
```

---

## 実装対象ファイル

| ファイル | 操作 |
|---|---|
| `data/translations/store-names.json` | **上書き（空 `{}` を以下の42件で置き換え）** |

---

## 実装内容

`data/translations/store-names.json` を以下の内容で上書きする。
**JSON を一字一句そのまま書き込むこと。キーの追加・削除・変更・並び替え禁止。**

```json
{
  "shop-ztyaw1": {
    "en": "Backlot Café",
    "ko": "백로트 카페",
    "zh-TW": "製片廠後場咖啡廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1ptfw3y": {
    "en": "SAIDO",
    "ko": "사이도",
    "zh-TW": "SAIDO",
    "_source": "official",
    "_status": "verified"
  },
  "shop-102yaa2": {
    "en": "Amity Ice Cream",
    "ko": "어미티 아이스크림",
    "zh-TW": "阿米提冰淇淋",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1tdzkex": {
    "en": "Amity Landing Restaurant",
    "ko": "어미티 랜딩 레스토랑",
    "zh-TW": "阿米提碼頭餐廳",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1d7mcxr": {
    "en": "Cupcake Dream Food Cart",
    "ko": "컵케이크 드림 푸드 카트",
    "zh-TW": "杯子蛋糕夢境小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1vff8rf": {
    "en": "Kinopio's Café",
    "ko": "키노피오 카페",
    "zh-TW": "奇諾比奧咖啡廳",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1jnbp5c": {
    "en": "Corner Café",
    "ko": "코너 카페",
    "zh-TW": "街角咖啡廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1v0tbtg": {
    "en": "The Dragon's Pearl",
    "ko": "더 드래곤스 펄",
    "zh-TW": "龍珠餐廳",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1og3n66": {
    "en": "The Dragon's Pearl Food Cart",
    "ko": "더 드래곤스 펄 푸드 카트",
    "zh-TW": "龍珠餐廳前小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1ixf7xp": {
    "en": "Jurassic Park Gate Food Cart",
    "ko": "쥬라기 공원 게이트 푸드 카트",
    "zh-TW": "侏羅紀公園入口小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1whvzq1": {
    "en": "Jurassic Park The Ride Splashdown Food Cart",
    "ko": "쥬라기 공원 더 라이드 스플래시다운 푸드 카트",
    "zh-TW": "侏羅紀公園遊樂設施終點小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-c8yjbq": {
    "en": "Studio Stars Restaurant",
    "ko": "스튜디오 스타즈 레스토랑",
    "zh-TW": "明星餐廳",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1qsyx94": {
    "en": "Space Fantasy The Ride Food Cart",
    "ko": "스페이스 판타지 더 라이드 푸드 카트",
    "zh-TW": "太空幻想遊樂設施前小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1wo41fl": {
    "en": "Central Park Entrance Popcorn Cart",
    "ko": "센트럴 파크 입구 팝콘 카트",
    "zh-TW": "中央公園入口爆米花車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1t5w62": {
    "en": "Discovery Restaurant",
    "ko": "디스커버리 레스토랑",
    "zh-TW": "探索餐廳",
    "_source": "official",
    "_status": "verified"
  },
  "shop-dvw6dt": {
    "en": "Delicious Me! The Cookie Kitchen",
    "ko": "딜리셔스 미! 더 쿠키 키친",
    "zh-TW": "美味的我！曲奇廚房",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1i0x5ad": {
    "en": "Delicious Me! The Cookie Kitchen",
    "ko": "딜리셔스 미! 더 쿠키 키친",
    "zh-TW": "美味的我！曲奇廚房",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1f4jraw": {
    "en": "Delicious Me! The Cookie Kitchen",
    "ko": "딜리셔스 미! 더 쿠키 키친",
    "zh-TW": "美味的我！曲奇廚房",
    "_source": "official",
    "_status": "verified"
  },
  "shop-uokkys": {
    "en": "Park Side Grille",
    "ko": "파크사이드 그릴",
    "zh-TW": "公園旁燒烤",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1hehv6j": {
    "en": "Park Side Grille Food Cart",
    "ko": "파크사이드 그릴 푸드 카트",
    "zh-TW": "公園旁燒烤前小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-bie1ke": {
    "en": "Battery Park North Food Cart",
    "ko": "배터리 파크 북쪽 푸드 카트",
    "zh-TW": "炮台公園北側小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-19qxymy": {
    "en": "Happiness Café",
    "ko": "해피니스 카페",
    "zh-TW": "幸福咖啡廳",
    "_source": "official",
    "_status": "verified"
  },
  "shop-8r3pag": {
    "en": "Hollywood Dream The Ride Food Cart",
    "ko": "할리우드 드림 더 라이드 푸드 카트",
    "zh-TW": "好萊塢美夢乘車遊前小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-zt1x7c": {
    "en": "Pizza Parlour",
    "ko": "피자 팔러",
    "zh-TW": "比薩店",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1vma23e": {
    "en": "Pit Stop Popcorn",
    "ko": "핏 스탑 팝콘",
    "zh-TW": "加油站爆米花",
    "_source": "official",
    "_status": "verified"
  },
  "shop-2z32lo": {
    "en": "Beverly Hills Gift Popcorn Cart",
    "ko": "비버리힐스 기프트 팝콘 카트",
    "zh-TW": "比佛利山禮品店前爆米花車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-152bmpp": {
    "en": "Beverly Hills Boulangerie",
    "ko": "비버리힐스 불랑제리",
    "zh-TW": "比佛利山莊法式麵包坊",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1r3y9l7": {
    "en": "Fossil Fuels",
    "ko": "포슬 퓨얼스",
    "zh-TW": "化石燃料",
    "_source": "official",
    "_status": "verified"
  },
  "shop-12taxpu": {
    "en": "Mario Café & Store",
    "ko": "마리오 카페 & 스토어",
    "zh-TW": "瑪利歐咖啡廳 & 商店",
    "_source": "official",
    "_status": "verified"
  },
  "shop-17yebwe": {
    "en": "Minion Happy Kitchen",
    "ko": "미니언 해피 키친",
    "zh-TW": "小小兵快樂廚房",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1yvdndz": {
    "en": "Mel's Drive-In",
    "ko": "멜스 드라이브 인",
    "zh-TW": "梅爾免下車餐廳",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1yu64jg": {
    "en": "Universal Monsters Live Rock & Roll Show Food Cart",
    "ko": "유니버설 몬스터 라이브 로큰롤 쇼 푸드 카트",
    "zh-TW": "環球怪獸搖滾秀前小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-93p373": {
    "en": "Universal Wonderland Entrance Popcorn Cart",
    "ko": "유니버설 원더랜드 입구 팝콘 카트",
    "zh-TW": "環球奇境入口爆米花車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-ui13qw": {
    "en": "Yoshi's Snack Island",
    "ko": "요시 스낵 아일랜드",
    "zh-TW": "耀西零食島",
    "_source": "official",
    "_status": "verified"
  },
  "shop-mhw30e": {
    "en": "Louie's N.Y. Pizza Parlor",
    "ko": "루이스 뉴욕 피자 팔러",
    "zh-TW": "路易紐約比薩店",
    "_source": "official",
    "_status": "verified"
  },
  "shop-3v2j9p": {
    "en": "Lost World Restaurant",
    "ko": "로스트 월드 레스토랑",
    "zh-TW": "失落世界餐廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-e5oqc": {
    "en": "Lost World Restaurant Food Cart",
    "ko": "로스트 월드 레스토랑 푸드 카트",
    "zh-TW": "失落世界餐廳入口小食車",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-7ba324": {
    "en": "Wharf Café",
    "ko": "워프 카페",
    "zh-TW": "碼頭咖啡廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1b3f2nw": {
    "en": "Premium Restaurant",
    "ko": "프리미엄 레스토랑",
    "zh-TW": "高級餐廳",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-nokw9": {
    "en": "Three Broomsticks",
    "ko": "세 개의 빗자루",
    "zh-TW": "三根掃帚",
    "_source": "official",
    "_status": "verified"
  },
  "shop-1tt48e8": {
    "en": "Seasonal Food (Venue TBD)",
    "ko": "시즌 푸드 (미확인 장소)",
    "zh-TW": "季節性美食（場所待確認）",
    "_source": "provisional",
    "_status": "needs_review"
  },
  "shop-1ielufv": {
    "en": "Jungle Beat Shakes",
    "ko": "정글 비트 쉐이크",
    "zh-TW": "叢林節奏奶昔",
    "_source": "provisional",
    "_status": "needs_review"
  }
}
```

---

## 翻訳根拠メモ（実装者参考用）

| 分類 | 件数 | 基準 |
|---|---|---|
| `official / verified` | 19件 | officialUrl スラッグが店舗固有名（例: `kinopios-cafe` → "Kinopio's Café"）|
| `provisional / needs_review` | 23件 | URL が汎用（`food-cart` / `seasonal-food` / `kids-menu`）、またはイベント URL、または `店舗未確認` |

**特記事項:**
- `shop-ztyaw1`（`・バックロット・カフェ`）: 先頭の `・` は crawler データの不備。URL が `kids-menu`（汎用）のため `needs_review`
- `shop-dvw6dt` と `shop-1i0x5ad` と `shop-1f4jraw`: 同名「デリシャス・ミー!ザ・クッキー・キッチン」が3件。shop-1i0x5ad / shop-1f4jraw は公式 URL 付き、shop-dvw6dt は food-cart URL
- `shop-1b3f2nw`（`高級レストラン`）: URL が `universal-cool-japan-2026/conan/restaurant` のイベント URL。仮訳 "Premium Restaurant" として provisional
- `shop-1tt48e8`（`店舗未確認`、foodCount: 40）: 季節フード用の catch-all エントリ
- `shop-1ielufv`（`店舗未確認`、foodCount: 0）: URL スラッグ `jungle-beat-shakes` から店舗名を推定

---

## 禁止事項

- `data/translations/food-names.json` を変更しない
- `scripts/output/shops.generated.json` を変更しない
- `scripts/output/foods.generated.json` を変更しない
- DB / crawler を変更しない
- UI に反映しない（`/stores` `/stores/[id]` `/foods` `/areas` `/eaten` の表示を変更しない）
- `lib/i18n/name-translations.ts` を変更しない
- `lib/i18n/dictionaries.ts` を変更しない
- `lib/food-utils.ts` を変更しない
- `lib/store-utils.ts` を変更しない
- `lib/constants.ts` を変更しない
- `types/domain.ts` を変更しない
- URL 構造を変更しない
- localStorage schema を変更しない
- `food.id` / `shop.id` を変更しない
- 翻訳名を URL や ID に使わない
- JSON の上記以外のキーを追加しない
- 大規模リファクタ禁止
- 無関係な整形禁止

---

## 検証

### ビルド確認

```bash
npm run lint
npm run typecheck
npm run build
```

すべて成功すること。

### カバレッジ確認

```bash
npx ts-node scripts/check-translation-coverage.ts
```

期待される出力（必ず確認すること）:

```
=== Food Translation Coverage ===
total:        294
translated:   0
missing:      294
verified:     0
needs_review: 0
orphan:       0

=== Store Translation Coverage ===
total:        42
translated:   42
missing:      0
verified:     19
needs_review: 23
orphan:       0
```

- `store total = 42` ✅
- `store translated = 42` ✅（全件 en/ko/zh-TW が入っているため）
- `store missing = 0` ✅
- `store orphan = 0` ✅（翻訳 JSON のキーがすべて shops.generated.json に存在するため）
- `food` 側は変更していないため `translated 0 / missing 294` のまま ✅

`verified` と `needs_review` の合計は `42` になること（上記 19 + 23）。

### JSON 整合性確認

```bash
# store-names.json の全キーが shops.generated.json に存在すること（orphan = 0）
# shops.generated.json の全 id が store-names.json に存在すること（missing = 0）
# 上記は check-translation-coverage.ts の出力で確認済みとする
```

### 表示確認（変更がないことを確認）

| ページ | 確認項目 |
|---|---|
| `/` | 表示が変わっていない |
| `/stores` | 店舗名はまだ日本語のまま |
| `/foods` | 商品名・店舗名はまだ日本語のまま |
| `/settings` | 表示崩れなし |

### 既存機能保護確認

| 確認項目 | 確認方法 |
|---|---|
| i18n Phase B（エリア名・カテゴリ名）が壊れていない | `/foods`・`/areas` 確認 |
| i18n Phase C（価格・販売ラベル）が壊れていない | `/foods` 確認 |
| Home Phase D（ホーム固定ラベル）が壊れていない | `/` 確認 |
| Home Phase C+（ホーム価格・販売ラベル）が壊れていない | `/` 確認 |
| 店舗ID衝突修正 v1.1（`lib/store-utils.ts`）が壊れていない | `lib/store-utils.ts` 未変更確認 |
| `data/translations/food-names.json` が `{}` のまま | ファイル内容確認 |
| overflow 0 / clipped 0 / 横スクロールなし | 各ページ目視確認 |

---

## 作業完了後

```bash
git add .
git commit -m "add-i18n-store-name-seed"
git push
```

---

## Codex CLI 確認画面が出た場合

必ず **「Yes, and don't ask again」** を選択すること。

確認質問禁止。途中停止禁止。

---

## 完了報告に含めること

1. `data/translations/store-names.json` の更新完了確認
2. `npm run lint` / `typecheck` / `build` の結果
3. `npx ts-node scripts/check-translation-coverage.ts` の実際の出力（全行）
4. `verified` 件数 / `needs_review` 件数の確認
5. 各確認ページの表示変化なし確認
6. commit hash
